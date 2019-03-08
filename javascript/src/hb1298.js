var zoomScale2 = 144448;
var hb1298GraphicsLayer = null;
var identifyPoint2;
var latlong, pointXY;
var hb1298LayerIds;
var hb1298FileNm;
var bmpdir;
var wellidExp, wellidUrl;
var toolbar2;

function addHB1298Points(points) {
    // Add HB1298 user added points for Bookmark Widget & or startup
    // points = x|y|label, ...	
    require(["esri/symbols/PictureMarkerSymbol", "esri/graphic", "esri/geometry/Point", "esri/layers/GraphicsLayer"], function(PictureMarkerSymbol, Graphic, Point, GraphicsLayer) {
        try {
            // if called from URL with &hb1298=x|y|label the graphics layer may not have been created.
            if (!hb1298GraphicsLayer) {
                hb1298GraphicsLayer = new GraphicsLayer();
                map.addLayer(hb1298GraphicsLayer);
            } else {
                hb1298GraphicsLayer.clear();
            }
            pointsArr = points.split(",");
            var symbol = new PictureMarkerSymbol("assets/images/yellowdot.png", 30, 30);
            for (var i = 0; i < pointsArr.length; i++) {
                var ptInfo = pointsArr[i].split("|");
                var pt = new Point(Number(ptInfo[0]), Number(ptInfo[1]), map.spatialReference);
                hb1298GraphicsLayer.add(new Graphic(pt, symbol));
                // add label
                if (ptInfo[2] && ptInfo[2] != "") {
                    addLabel(new Graphic(pt), ptInfo[2], hb1298GraphicsLayer, "11pt");
                    pt = null;
                }
            }
            symbol = null;
        } catch (e) {
            alert("Error adding HB1298 points. " + e.message + ". At line ", "Code Error", e);
        }
    });
}

function getHB1298Points() {
    // return &hb1298=x|y|label, ... for each hb1298 user added point.
    if (!hb1298GraphicsLayer || hb1298GraphicsLayer.graphics.length == 0) return "";
    var str = "&hb1298=";
    for (var i = 0; i < hb1298GraphicsLayer.graphics.length; i = i + 8) {
        if (i != 0) str += ",";
        str += hb1298GraphicsLayer.graphics[i].geometry.x + "|";
        str += hb1298GraphicsLayer.graphics[i].geometry.y + "|";
        str += hb1298GraphicsLayer.graphics[i + 1].symbol.text;
    }
    return str;
}

function setupIdentify(theWellLabel) {
    //setup generic identify parameters
    require(["dijit/registry", "esri/tasks/IdentifyParameters", "esri/tasks/IdentifyTask", "dojo/promise/all", "esri/SpatialReference", "esri/geometry/Extent"],
        function(registry, IdentifyParameters, IdentifyTask, all, SpatialReference, Extent) {
            var identifyParams = new IdentifyParameters();
            identifyParams.tolerance = 1;
            identifyParams.returnGeometry = false;
            identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
            identifyParams.geometry = identifyPoint2;
            identifyParams.width = map.width;
            identifyParams.height = map.height;
            identifyParams.spatialReference = map.spatialReference;
            identifyParams.mapExtent = new Extent(identifyPoint2.x - 10, identifyPoint2.y - 10, identifyPoint2.x + 10, identifyPoint2.y + 10, new SpatialReference({ wkid: wkid })); //map.extent; was getting more than one section for township/range
            function hb1298IdentifyFailed(e) {
                alert("Error in identifyTask for HB1298 report. At javascript/hb1298.js/identifysetup. " + e.message + " ", "Code Error", e);
                registry.byId("XYReportBtn").set("label", "Generate Report");
                registry.byId("XYReportBtn").set('disabled', false);
                hideLoading();
            }

            function hb1298IdentifySuccess(e) {}

            var deferreds;
            require(["dojo/promise/all"], function(all) {
                deferreds = hb1298LayerIds.map(function(layer) {
                    if (layer) {
                        identifyParams.layerIds = [layer.ids];
                        var task = new IdentifyTask(layer.url);
                        return task.execute(identifyParams, hb1298IdentifySuccess, hb1298IdentifyFailed);
                    }
                });

                // Process data at map click. data[layer label][field name]
                // data for fields named ActivityCode are arrays
                var data = [];
                data["RSO Occurrences"] = {};
                data["SWH Occurrences"] = {};
                data["HPH Data"] = {};
                data["RSO Occurrences"]["ActivityCode"] = [];
                data["SWH Occurrences"]["ActivityCode"] = [];
                data["HPH Data"]["ActivityCode"] = [];
                all(deferreds).then(function(results) {
                    if (results[0].length == 0 &&
                        results[1].length == 0 &&
                        results[2].length == 0 &&
                        results[3].length == 0 &&
                        results[4].length == 0) {
                        alert("No HB1298 data found at this point.", "Warning");
                        registry.byId("XYReportBtn").set("label", "Generate Report");
                        registry.byId("XYReportBtn").set('disabled', false);
                        hideLoading();
                        return;
                    }
                    // Read all of the data into array object data.
                    results.map(function(result) {
                        // Test for no data
                        if (result.length == 0) return;

                        // Find the layer in the hb1298LayerIds object
                        var found = false;
                        for (var i = 0; i < hb1298LayerIds.length; i++) {
                            if (hb1298LayerIds[i].label == result[0].layerName) {
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            alert("WARNING: Read " + result[0].layerName + " in MapService not found in HB1298Widget.xml file. Check layer name and ID.", "Data Error");
                        } else {
                            // Loop through all of the fields and get the species codes found for each
                            data[result[0].layerName] = {};
                            for (var j = 0; j < hb1298LayerIds[i].fields.length; j++) {
                                // If SWH, RSO, or CPW data store an array.
                                if (hb1298LayerIds[i].fields[j] == "ActivityCode") {
                                    data[result[0].layerName][hb1298LayerIds[i].fields[j]] = [];
                                    for (var k = 0; k < result.length; k++) {
                                        if (result[k].feature.attributes[hb1298LayerIds[i].fields[j]] === undefined) {
                                            alert("Missing field " + hb1298LayerIds[i].fields[j] + " in mapservice layer " + result[k].layerName + ".  Read from HB1298Widget.xml file.", "Data Error");
                                            data[result[k].layerName][hb1298LayerIds[i].fields[j]][k] = "";
                                        } else
                                            data[result[k].layerName][hb1298LayerIds[i].fields[j]][k] = result[k].feature.attributes[hb1298LayerIds[i].fields[j]];
                                    }
                                } else {
                                    if (result[0].feature.attributes[hb1298LayerIds[i].fields[j]] === undefined) {
                                        alert("Missing field " + hb1298LayerIds[i].fields[j] + " in mapservice layer " + result[0].layerName + ". Read from HB1298Widget.xml file.", "Data Error");
                                        data[result[0].layerName][hb1298LayerIds[i].fields[j]] = "";
                                    } else
                                        data[result[0].layerName][hb1298LayerIds[i].fields[j]] = result[0].feature.attributes[hb1298LayerIds[i].fields[j]];
                                }
                            }
                        }
                    });

                    // ****************
                    //  Display report
                    // ****************				
                    var xmlhttp = createXMLhttpRequest();
                    xmlhttp.open("POST", hb1298FileNm + "?v=" + ndisVer + "&rso=" + data["RSO Occurrences"]["ActivityCode"].join() +
                        "&swh=" + data["SWH Occurrences"]["ActivityCode"].join() +
                        "&cdow=" + data["HPH Data"]["ActivityCode"].join() + "&v=" + Date.now(), true);

                    xmlhttp.onreadystatechange = function() {
                        function savePDF() {
                            // download pdf
                            // doc.save("filename") does not work with Foxit Reader (for Mac)
                            var data = doc.output();
                            var buffer = new ArrayBuffer(data.length);
                            var array = new Uint8Array(buffer);
                            for (var i = 0; i < data.length; i++) {
                                array[i] = data.charCodeAt(i);
                            }
                            var blob = new Blob(
                                [array], { type: 'application/pdf', encoding: 'raw' }
                            );
                            saveAs(blob, "AtlasReport.pdf");
                            blob = null;
                            buffer = null;
                            array = null;
                            data = null;
                            hideLoading();
                        }

                        function savePDF() {
                            // download pdf. Added 11-20-17 for IE and Edge which cannot open doc with an iframe. It is blank.
                            // doc.save("filename") does not work with Foxit Reader (for Mac)
                            var data = doc.output();
                            var buffer = new ArrayBuffer(data.length);
                            var array = new Uint8Array(buffer);
                            for (var i = 0; i < data.length; i++) {
                                array[i] = data.charCodeAt(i);
                            }
                            var blob = new Blob(
                                [array], { type: 'application/pdf', encoding: 'raw' }
                            );
                            saveAs(blob, "HB1298Report.pdf");
                            blob = null;
                            buffer = null;
                            array = null;
                            data = null;
                            hideLoading();
                        }

                        function openPDF() {
                            var string = doc.output('datauristring');
                            var iframe = "<iframe width='100%' height='100%' src='" + string + "'></iframe>"
                            var win = window.open();
                            if (!win) {
                                alert("Failed to open PDF. Make sure popups are allowed.", "Warning");
                                hideLoading();
                                return;
                            }
                            win.document.open();
                            win.document.write(iframe);
                            win.document.title = "HB1298 Report";
                            win.document.close();
                            hideLoading();
                        }

                        function pageHeader() {
                            // Title
                            if (pageNo != 1)
                                doc.addPage();
                            y = marginTop + 14;
                            doc.setFont("arial", "bold");
                            doc.text(marginLeft, y, "HB1298");
                            doc.text(400, y, "CPW Species Impact Summary");
                            doc.setFont("arial", "normal");
                        }

                        function footer() {
                            doc.setFontSize(10);
                            doc.setFont("arial", "normal");
                            doc.text((pageWidth / 2 + marginLeft) - 8, pageHeight + marginTop, "Page " + pageNo);
                            pageNo++;
                            doc.setFontSize(fontsize); // return to normal font size
                        }

                        function grid(title, arr, header, headerHt) {
                            if (arr.length == 0) return;

                            function header2(title) {
                                // title
                                doc.setFont("arial", "normal");
                                doc.setFontSize(fontsize);

                                // header - grey outlined box with text
                                y += 5;
                                doc.setFillColor(204, 204, 204); // CCCCCC
                                doc.setDrawColor(0);
                                doc.rect(marginLeft, y, pageWidth, lineHt, 'FD'); // Fill and outline rectangle
                                y += 15;
                                doc.myText(marginLeft, y, title, { align: "center" });
                                y += 20;
                                //doc.setFillColor(204,204,204); // CCCCCC
                                //doc.setDrawColor(0);
                                //doc.rect(marginLeft,y,pageWidth,headerHt,'FD'); // Fill and outline rectangle

                                doc.setFont("arial", "normal");
                            }
                            var indent = 110;
                            var x = marginLeft + 4;
                            for (var i = 0; i < arr.length; i++) {
                                // top horizontal line
                                //doc.line(marginLeft,startY,pageWidth+marginLeft,startY);
                                for (j = 0; j < header.length; j++) {
                                    // Fix weird character for dash
                                    for (var k = 0; k < arr[i][header[j].field].length; k++) {
                                        if (arr[i][header[j].field].charCodeAt(k) == 8209) {
                                            arr[i][header[j].field] = arr[i][header[j].field].substr(0, k) + '-' + arr[i][header[j].field].substr(k + 1);
                                        }
                                    }
                                }
                                var desc = doc.setFontSize(11).splitTextToSize("Description: " + arr[i]["Desc"], pageWidth - 8, { fontName: "arial", fontStyle: "normal" });
                                var bmp = doc.setFontSize(11).splitTextToSize(arr[i]["BMPDoc"], pageWidth - 38, { fontName: "arial", fontStyle: "normal" });
                                var bmpFont = 11;
                                if (bmp.length > 1) {
                                    bmp = doc.setFontSize(9).splitTextToSize(arr[i]["BMPDoc"], pageWidth - 38, { fontName: "arial", fontStyle: "normal" });
                                    bmpFont = 9;
                                }
                                if (y + 6 + (lineHt * 3) + (13 * (desc.length - 1)) > pageHeight - lineHt) {
                                    footer();
                                    pageHeader();
                                    if (i == 0)
                                        header2(title);
                                    else
                                        header2(title + " - Continued");
                                } else if (i == 0) header2(title);
                                var startY = y - lineHt;
                                // total factor
                                doc.setFontSize(24);
                                if (arr[i]["TotalFactor"] == "NA" || arr[i]["TotalFactor"] == "10")
                                    doc.text(arr[i]["TotalFactor"], marginLeft + 2, y + 6);
                                else
                                    doc.text(arr[i]["TotalFactor"], marginLeft + 10, y + 6);
                                doc.setFontSize(7);
                                doc.text("total factor", x, y + 14);
                                doc.text("   (4-10)", x, y + 23);
                                // Species
                                doc.setFontSize(11);
                                doc.setFont("arial", "bold");
                                doc.text(arr[i]["Species"], indent, y);
                                // Activity
                                doc.setFont("arial", "normal");
                                y += lineHt;
                                doc.text(arr[i]["Activity"], indent, y);
                                // BMP link
                                y += lineHt + 6;
                                doc.text("BMP: ", x, y);
                                doc.setFontSize(bmpFont);
                                doc.text(bmp, x + 30, y);
                                doc.setFontSize(fontsize);
                                // description
                                y += lineHt;
                                doc.text(desc, x, y);
                                // side and bottom line
                                doc.setDrawColor(0);
                                y = y + (13 * (desc.length - 1) + lineHt);
                                doc.line(marginLeft, y, pageWidth + marginLeft, y); // bottom
                                doc.line(marginLeft, startY, marginLeft, y); //left
                                doc.line(pageWidth + marginLeft, startY, pageWidth + marginLeft, y); // right
                                y += lineHt;
                            }
                        }

                        // old format of table with columns.
                        /*function grid2(title, arr, header, headerHt) {
						// draw a table, with columns. Check for new page
						// arr is an array of data
						// header is an array of the header fields
						try{
							function printHeader(){
								// title
								doc.setFont("arial","normal");
								doc.setFontSize(fontsize);
								
								// header - grey outlined box with text
								y+=5;
								doc.setFillColor(204,204,204); // CCCCCC
								doc.setDrawColor(0);
								doc.rect(marginLeft,y,pageWidth,rowHt,'FD'); // Fill and outline rectangle
								y += 15;
								doc.myText(marginLeft, y, title, {align: "center"});
								y += 5;
								doc.setFillColor(204,204,204); // CCCCCC
								doc.setDrawColor(0);
								doc.rect(marginLeft,y,pageWidth,headerHt,'FD'); // Fill and outline rectangle
								var x = marginLeft+4;
								doc.setFont("arial","normal");
								y += lineHt;
								// add vertical lines between header column names
								for (var i=0; i<header.length; i++) {
									if (header[i].displayname == "Total Factor (4-10)"){
										doc.myText(x+marginLeft-4,y,"Total",{align: "center"},header[i].width);
										doc.myText(x+marginLeft-4,y+lineHt,"Factor",{align: "center"},header[i].width);
										doc.myText(x+marginLeft-4,y+(lineHt*2),"(4-10)",{align: "center"},header[i].width);
									}
									else if(header[i].displayname)
										doc.myText(x+marginLeft-4,y,header[i].displayname,{align: "center"},header[i].width);
										//doc.myText(x,y,header[i].displayname,{align: "center"},header[i].width);
									x += header[i].width;
									if (i<header.length-1)
										doc.line(x-4,y-lineHt,x-4,y+headerHt+6);
								}
								y+=headerHt;
							}
							if (arr.length == 0) return;
							var rowHt = 20;
							
							var row=[]; // contains column items for each row. Init an array to hold each row. Later add column array.
							var lines = [];	
							var rowWidth = [];
							rowWidth[0] = marginLeft;
		
							// count lines needed for each row, and starting x of each column
							for (var i=0; i<arr.length; i++) {
								row[i] = []; // init each row to contain an array for the columns.
								lines[i] = 1;
								for (var j=0; j<header.length; j++){
									if (arr[i][header[j].field]){
										// wrap text
										if (arr[i][header[j].field] != "") {
											// Fix weird character for dash
											for (var x=0; x<arr[i][header[j].field].length; x++) {
												if (arr[i][header[j].field].charCodeAt(x) == 8209){
													arr[i][header[j].field] = arr[i][header[j].field].substr(0, x) + '-' + arr[i][header[j].field].substr(x + 1);
												}
												// test for other potentially bad characters. Some characters are ok > 255. So need to research this. Look at jspdf.debug.js line 6390.
												//if (!(arr[i][header[j].field].charCodeAt(x) > 0 && arr[i][header[j].field].charCodeAt(x) < 255)){
												//	console.log("BAD CHAR--> "+arr[i][header[j].field][x]+"   code="+arr[i][header[j].field].charCodeAt(x));
												//}
											}
											row[i][j]= doc.setFontSize(fontsize)
												.splitTextToSize(arr[i][header[j].field].toString(),header[j].width-8,{fontName:"arial",fontStyle:"normal"});	
										}
										else row[i][j] = "NA";
										// count longest number of lines needed in each column for this row
										if (row[i][j].length > lines[i])
											lines[i] = row[i][j].length;
									}
									else row[i][j] = "NA";
									if (i==0 && j+1<header.length)
										rowWidth[j+1] = rowWidth[j] + header[j].width;
								}
							}
							// test for page break
							// if current y + title + header row + first table row > pageHeight
							if (y+5+rowHt+(lineHt*lines[0])+rowHt > pageHeight-lineHt){
								footer();
								pageHeader();
							}
							printHeader();
							// table
							// draw each row
							var pattern = /,/g; // globally replace all commas
							for (i=0; i<arr.length; i++) {
								// draw each column
								for (j=0; j<header.length; j++){
									// draw first vertical line
									if (j==0) doc.line(rowWidth[j],y-lineHt,rowWidth[j],y+(lineHt*(lines[i]-1))+rowHt-lineHt);
									// add cell text
									if (j==3)
										doc.myText(rowWidth[j]+marginLeft,y,row[i][j][0],{align: "center"},header[j].width);
									else 
										doc.text(rowWidth[j]+4,y,row[i][j]);		
									// draw vertical line at end of cell
									doc.line(rowWidth[j]+header[j].width,y-lineHt,rowWidth[j]+header[j].width,y+(lineHt*(lines[i]-1))+rowHt-lineHt);
								}
								
								// draw horizontal line at cell bottom
								doc.line(marginLeft,y+(lineHt*(lines[i]-1))+rowHt-lineHt,pageWidth+marginLeft,y+(lineHt*(lines[i]-1))+rowHt-lineHt);
								//x = marginLeft+4;
								y += (lineHt*lines[i])+rowHt-lineHt;
								// test for page break in the middle of the table
								if ((i < arr.length-1) && (y+(lineHt*lines[i+1])+rowHt-lineHt >= pageHeight-lineHt)){
									footer();
									pageHeader();
									
									// add table header
									if (title.indexOf("Continued") == -1)
										title += " - Continued";
									printHeader();
								}
							}
							y += lineHt;
							row = null;
							rowWidth = null;
							lines = null;
						}
						catch(e){
							alert("Resource report error while creating table for "+title+". "+e.message,"Code Error",e);
							// Enable Print/Save Report button
							registry.byId("XYReportBtn").set("label", "Generate Report");
							registry.byId("XYReportBtn").set('disabled',false);
							hideLoading();
						}
					}*/
                        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                            var xmlData = createXMLparser(xmlhttp.responseText.substr(xmlhttp.response.indexOf("?>") + 2));
                            var rsoArr = xmlData.getElementsByTagName("rso")[0].getElementsByTagName("Data");
                            var swhArr = xmlData.getElementsByTagName("swh")[0].getElementsByTagName("Data");
                            var cdowArr = xmlData.getElementsByTagName("cdow")[0].getElementsByTagName("Data");
                            // Create PDF Report
                            (function(API) {

                                // Add hyperlink Does not work!!!!!!
                                /*API.addLink = function (text, x, y) {
                                	var defaultFontSize = 18;
                                	var maxLineHeight = 1.25;
                                	var font_id ="F9";
                                	var style_font_size = 1;
                                	out('q');
                                	this.internal.write(
                                		'q' // canning the scope
                                		, 'BT' // Begin Text
                                		// and this moves the text start to desired position.
                                		, this.internal.getCoordinateString(x)
                                		, this.internal.getVerticalCoordinateString(y)
                                		, 'Td'
                                	);

                                	this.internal.write(
                                		0
                                		, (-1 * defaultFontSize * maxLineHeight).toFixed(2) // shifting down a line in native `points' means reducing y coordinate
                                		, 'Td'
                                		// , (defaultFontSize * maxLineHeight).toFixed(2) // line height comes as float = proportion to normal.
                                		// , 'TL' // line height marker. Not sure we need it with "Td", but... 
                                	);

                                	//Line NO(233)calls pdfEscape:
                                	this.internal.write(
                                		'/' + 'F9' // font key
                                		, (defaultFontSize * style_font_size).toFixed(2) // font size comes as float = proportion to normal.
                                		, 'Tf' // font def marker
                                		, '('+this.internal.pdfEscape(text)+') Tj'
                                	);

                                	this.internal.write(
                                		'ET' // End Text
                                		, 'Q' // restore scope
                                	);
                                	out('Q');
                                	return this;
                                };*/


                                API.myText = function(x, y, txt, options, width) {
                                    options = options || {};
                                    /* Use the options align property to specify desired text alignment
                                     * Param x will be ignored if desired text alignment is 'center'.
                                     * Usage of options can easily extend the function to apply different text 
                                     * styles and sizes 
                                     */
                                    // Get current font size
                                    var fontSize = this.internal.getFontSize();
                                    // Get page width
                                    var pageWidth;
                                    if (!width) pageWidth = this.internal.pageSize.width;
                                    else pageWidth = width;

                                    // Get the actual text's width
                                    /* You multiply the unit width of your string by your font size and divide
                                     * by the internal scale factor. The division is necessary
                                     * for the case where you use units other than 'pt' in the constructor
                                     * of jsPDF.
                                     */
                                    txtWidth = this.getStringUnitWidth(txt) * fontSize / this.internal.scaleFactor;

                                    if (options.align == "center") {
                                        // Calculate text's x coordinate
                                        x = x + ((pageWidth - txtWidth) / 2) - marginLeft;
                                        this.text(txt, x, y);
                                    } else if (options.align == "right") {
                                        // Calculate text's x coordinate
                                        x = x + (pageWidth - (txtWidth + 3));
                                        this.text(txt, x, y);
                                    } else if (options.underline == true) {
                                        this.text(txt, x, y);
                                        this.line(x, y + 1, x + txtWidth, y + 1);
                                    }
                                }
                            })(jsPDF.API);

                            var marginLeft = 54; // .75 inches
                            var marginTop = 54;
                            var lineHt = 18;
                            var y = marginTop + 11;
                            var pageNo = 1;
                            var fontsize = 11;
                            var pageWidth = 612 - (2 * marginLeft); // 11 inches * 72 - left and right margins
                            var pageHeight = 792 - (2 * marginTop); // height of page (8.5*72) - top and bottom margins
                            var doc = new jsPDF("portrait", "pt", "letter");
                            doc.onerror = function() {
                                alert("Error creating PDF file", "Code Error");
                                registry.byId("XYReportBtn").set("label", "Generate Report");
                                registry.byId("XYReportBtn").set('disabled', false);
                                hideLoading();
                            }
                            doc.setProperties({
                                title: "HB1298 Report",
                                author: 'Colorado Parks and Wildlife',
                                keywords: 'hb1298, rso, swh, cpw'
                            });


                            doc.setFont("san-serif", "normal"); // helvetica not working
                            doc.setFontSize(fontsize);
                            // Title
                            pageHeader();
                            y += 20;
                            // Date
                            //var mo={Jan:"January",Feb:"February",Mar:"March",Apr:"April",May:"May",Jun:"June",Jul:"July",Aug:"August",Sep:"September",Oct:"October",Nov:"November",Dec:"December"};
                            today = new Date();
                            today = today.toDateString();
                            if (today.substr[8] == "0")
                                today = today.substr(0, 8) + today.substr(9, 1) + "," + today.substr(today.length - 5, today.length);
                            else
                                today = today.substr(0, 8) + today.substr(8, 2) + "," + today.substr(today.length - 5, today.length);
                            doc.text(marginLeft, y, today);
                            y += lineHt * 2;
                            var col_1 = marginLeft + 100;
                            // Well Number
                            doc.text(marginLeft, y, 'Well Number:');
                            doc.text(col_1, y, theWellLabel);
                            y += lineHt;
                            // XY
                            doc.text(marginLeft, y, 'XY Location:');
                            doc.text(col_1, y, pointXY + " UTM NAD83 zone 13");
                            y += lineHt;
                            doc.text(col_1, y, latlong);
                            y += lineHt;
                            // Township Range Section
                            doc.text(marginLeft, y, 'Township:');
                            if (!data["Section boundary"])
                                doc.text(col_1, y, "Unknown");
                            else
                                doc.text(col_1, y, data["Section boundary"]["TWP"] + data["Section boundary"]["TDIR"]);
                            y += lineHt;
                            doc.text(marginLeft, y, 'Range:');
                            if (!data["Section boundary"])
                                doc.text(col_1, y, "Unknown");
                            else
                                doc.text(col_1, y, data["Section boundary"]["RNG"] + data["Section boundary"]["RDIR"]);
                            y += lineHt;
                            doc.text(marginLeft, y, 'Section:');
                            if (!data["Section boundary"])
                                doc.text(col_1, y, "Unknown");
                            else
                                doc.text(col_1, y, data["Section boundary"]["SECTION"]);
                            y += lineHt * 2;
                            doc.setFont("arial", "bold");
                            doc.myText(marginLeft, y, "Official House Bill 1298 Species Data:", { underline: true });
                            doc.setFont("arial", "normal");
                            y += lineHt;
                            doc.text(marginLeft, y, "Number of COGCC Restricted Surface Occupancy (RSO) features:");
                            doc.text(marginLeft + 360, y, data["RSO Occurrences"]["ActivityCode"].length.toString());
                            y += lineHt;
                            doc.text(marginLeft, y, "Number of COGCC Sensitive Wildife Habitat (SWH) features:");
                            doc.text(marginLeft + 360, y, data["SWH Occurrences"]["ActivityCode"].length.toString());
                            y += lineHt * 2;
                            doc.setFont("arial", "bold");
                            doc.myText(marginLeft, y, "Supporting (non-HB1298) Species Data:", { underline: true });
                            y += lineHt;
                            doc.setFont("arial", "normal");
                            doc.text(marginLeft, y, "Number of Important CPW features:");
                            doc.text(marginLeft + 360, y, data["HPH Data"]["ActivityCode"].length.toString());
                            y += lineHt * 2;

                            var header = null;
                            header = [];
                            header.push({
                                displayname: "Species",
                                field: "Species",
                                width: 70
                            });
                            header.push({
                                displayname: "Activity",
                                field: "Activity",
                                width: 80
                            });
                            var width = pageWidth - 70 - 80 - 50 - 100;
                            header.push({
                                displayname: "Description",
                                field: "Desc",
                                width: width
                            });
                            header.push({
                                displayname: "Total Factor (4-10)",
                                field: "TotalFactor",
                                width: 50
                            });
                            header.push({
                                displayname: "BMP",
                                field: "BMPDoc",
                                width: 100
                            });
                            var bmpStr;
                            var speciesStr;
                            var actStr;
                            var descStr;
                            var totalStr;
                            var layerNmStr;
                            var rso = [];
                            for (var i = 0; i < rsoArr.length; i++) {
                                bmpStr = "";
                                speciesStr = "";
                                actStr = "";
                                descStr = "";
                                totalStr = "";
                                if (!rsoArr[i]) alert("Missing activity code, " + data["RSO Occurrences"]["ActivityCode"][i] + ", in hb1298_ndis.mdb.", "Data Error");
                                else {
                                    if (rsoArr[i].getElementsByTagName("BMPDoc")[0]) bmpStr = bmpdir + rsoArr[i].getElementsByTagName("BMPDoc")[0].firstChild.nodeValue;
                                    if (rsoArr[i].getElementsByTagName("Species")[0]) speciesStr = rsoArr[i].getElementsByTagName("Species")[0].firstChild.nodeValue.trim();
                                    if (rsoArr[i].getElementsByTagName("Activity")[0]) actStr = rsoArr[i].getElementsByTagName("Activity")[0].firstChild.nodeValue.trim();
                                    if (rsoArr[i].getElementsByTagName("Description")[0]) descStr = rsoArr[i].getElementsByTagName("Description")[0].firstChild.nodeValue;
                                    if (rsoArr[i].getElementsByTagName("TotalFactor")[0]) totalStr = rsoArr[i].getElementsByTagName("TotalFactor")[0].firstChild.nodeValue;
                                    if (totalStr < 0) totalStr = "NA";
                                }
                                rso.push({
                                    Species: speciesStr,
                                    Activity: actStr,
                                    Desc: descStr,
                                    TotalFactor: totalStr,
                                    BMPDoc: bmpStr.replace(" ", "%20"),
                                    LayerName: speciesStr + " " + actStr
                                });
                            }
                            rso.sort(sortMultipleArryOfObj("Species", "Activity"));
                            var swh = [];
                            for (i = 0; i < swhArr.length; i++) {
                                bmpStr = "";
                                speciesStr = "";
                                actStr = "";
                                descStr = "";
                                totalStr = "";
                                if (!swhArr[i]) alert("Missing activity code, " + data["SWH Occurrences"]["ActivityCode"][i] + ", in hb1298_ndis.mdb.", "Data Error");
                                else {
                                    if (swhArr[i].getElementsByTagName("BMPDoc")[0]) bmpStr = bmpdir + swhArr[i].getElementsByTagName("BMPDoc")[0].firstChild.nodeValue;
                                    if (swhArr[i].getElementsByTagName("Species")[0]) speciesStr = swhArr[i].getElementsByTagName("Species")[0].firstChild.nodeValue.trim();
                                    if (swhArr[i].getElementsByTagName("Activity")[0]) actStr = swhArr[i].getElementsByTagName("Activity")[0].firstChild.nodeValue.trim();
                                    if (swhArr[i].getElementsByTagName("Description")[0]) descStr = swhArr[i].getElementsByTagName("Description")[0].firstChild.nodeValue;
                                    if (swhArr[i].getElementsByTagName("TotalFactor")[0]) totalStr = swhArr[i].getElementsByTagName("TotalFactor")[0].firstChild.nodeValue;
                                    if (totalStr < 0) totalStr = "NA";
                                }
                                swh.push({
                                    Species: speciesStr,
                                    Activity: actStr,
                                    Desc: descStr,
                                    TotalFactor: totalStr,
                                    BMPDoc: bmpStr.replace(" ", "%20"),
                                    LayerName: speciesStr + " " + actStr
                                });
                            }
                            swh.sort(sortMultipleArryOfObj("Species", "Activity"));
                            var cdow = [];
                            for (i = 0; i < cdowArr.length; i++) {
                                bmpStr = "";
                                speciesStr = "";
                                actStr = "";
                                descStr = "";
                                totalStr = "";
                                if (!cdowArr[i])
                                    alert("Missing activity code, " + data["HPH Data"]["ActivityCode"][i] + ", in hb1298_ndis.mdb.", "Data Error");
                                else {
                                    if (cdowArr[i].getElementsByTagName("BMPDoc")[0]) bmpStr = bmpdir + cdowArr[i].getElementsByTagName("BMPDoc")[0].firstChild.nodeValue;
                                    if (cdowArr[i].getElementsByTagName("Species")[0]) speciesStr = cdowArr[i].getElementsByTagName("Species")[0].firstChild.nodeValue.trim();
                                    if (cdowArr[i].getElementsByTagName("Activity")[0]) actStr = cdowArr[i].getElementsByTagName("Activity")[0].firstChild.nodeValue.trim();
                                    if (cdowArr[i].getElementsByTagName("Description")[0]) descStr = cdowArr[i].getElementsByTagName("Description")[0].firstChild.nodeValue;
                                    if (cdowArr[i].getElementsByTagName("TotalFactor")[0]) totalStr = cdowArr[i].getElementsByTagName("TotalFactor")[0].firstChild.nodeValue;
                                    if (totalStr < 0) totalStr = "NA";
                                }
                                cdow.push({
                                    Species: speciesStr,
                                    Activity: actStr,
                                    Desc: descStr,
                                    TotalFactor: totalStr,
                                    BMPDoc: bmpStr.replace(" ", "%20")
                                });
                            }
                            cdow.sort(sortMultipleArryOfObj("Species", "Activity"));
                            // create tables: grid(title, underline width in points, data, header, y)
                            grid("COGCC - Habitat Types with Restricted Surface Occupancy", rso, header, 70);
                            grid("COGCC - Sensitive Wildife Habitat", swh, header, 70);
                            grid("CPW Important Wildlife Habitat (non-HB1298)", cdow, header, 70);

                            // List CPW contact info
                            y += lineHt;
                            for (i = 0; i < hb1298LayerIds.length; i++) {
                                if (hb1298LayerIds[i].label == "Biologists") { break; }
                            }
                            if (i == hb1298LayerIds.length || !hb1298LayerIds[i].display) alert("Missing display tag in HB1298Widgets.xml file for label Biologists.", "Data Error");
                            else {
                                for (var j = 0; j < hb1298LayerIds[i].display.length; j++) {
                                    // test for page break
                                    if (y > pageHeight - lineHt) {
                                        footer();
                                        pageHeader();
                                        y += 20;
                                    }
                                    if (hb1298LayerIds[i].fields[j] != "Energy Liaison Phone") {
                                        doc.text(marginLeft, y, hb1298LayerIds[i].display[j] + ":");
                                        doc.text(marginLeft + 140, y, data["Biologists"][hb1298LayerIds[i].fields[j]]);
                                    }
                                    if (hb1298LayerIds[i].fields[j] == "Energy Liaison Phone") {
                                        doc.text(marginLeft + 290, y, data["Biologists"][hb1298LayerIds[i].fields[j]]);
                                    }
                                    if (hb1298LayerIds[i].fields[j] != "Energy Liaison") {
                                        y += lineHt;
                                    }
                                }
                            }
                            y += lineHt;
                            doc.setFontSize(9);
                            doc.setFont("arial", "normal");
                            doc.text(marginLeft, y, "This report was generated using COGCC and Colorado Parks and Wildlife species data, and NDIS mapping technology.");
                            y += lineHt;
                            footer();
                            if (navigator.sayswho.indexOf("IE") > -1 | navigator.sayswho.indexOf("Edge") > -1)
                                savePDF();
                            else
                                openPDF();

                            registry.byId("XYReportBtn").set("label", "Generate Report");
                            registry.byId("XYReportBtn").set('disabled', false);
                            registry.byId("XYReportBtn2").set("label", "Generate Report");
                            registry.byId("XYReportBtn2").set('disabled', false);
                            document.getElementById("wellLabel").value = "";
                            document.getElementById("wellID").value = "";
                            document.getElementById("wellLabel2").value = "";

                            //----------------------
                            // turn on species data
                            //----------------------
                            var rsoIndex = -1;
                            var swhIndex = -1;
                            // Find RSO layer index
                            require(["esri/layers/ArcGISDynamicMapServiceLayer"], function(ArcGISDynamicMapServiceLayer) {
                                for (var i = 0; i < map.layerIds.length; i++) {
                                    if (map.getLayer(map.layerIds[i]).declaredClass == "esri.layers.ArcGISDynamicMapServiceLayer") {
                                        if (map.getLayer(map.layerIds[i]).url.indexOf("RSO") > 0) {
                                            rsoIndex = i;
                                            break;
                                        }
                                    }
                                }
                                if (rsoIndex == -1) {
                                    alert("Cannot find layer in config.xml with name containing RSO.", "Data Error");
                                    return;
                                }

                                // Find SWH layer index
                                for (i = 0; i < map.layerIds.length; i++) {
                                    if (map.getLayer(map.layerIds[i]).declaredClass == "esri.layers.ArcGISDynamicMapServiceLayer") {
                                        if (map.getLayer(map.layerIds[i]).url.indexOf("SWH") > 0) {
                                            swhIndex = i;
                                            break;
                                        }
                                    }
                                }
                                if (swhIndex == -1) {
                                    alert("Cannot find layer in config.xml with name containing SWH.", "Data Error");
                                    return;
                                }

                                // Loop through RSO layers and if any match turn the layer on, if not turn the layer off
                                var visLayers = [];
                                var found;
                                for (i = 0; i < rso.length; i++) {
                                    found = false;
                                    for (var j = 0; j < map.getLayer(map.layerIds[rsoIndex]).layerInfos.length; j++) {
                                        if (map.getLayer(map.layerIds[rsoIndex]).layerInfos[j].name.toUpperCase().trim() == rso[i].LayerName.toUpperCase()) {
                                            visLayers.push(map.getLayer(map.layerIds[rsoIndex]).layerInfos[j].id);
                                            found = true;
                                            break;
                                        }
                                    }
                                    if (!found) alert("Warning: unable to highlight a layer. Missing '" + rso[i].LayerName + "' in Restricted Surface Occupancy map service. Should be the same name as what is used in hb1298_ndis.mdb. ", "Data Error");
                                }

                                var vis;
                                var layer = map.getLayer(map.layerIds[rsoIndex]);
                                // turn off layers that were not found in the report
                                for (i = 0; i < layer.layerInfos.length; i++) {
                                    if (visLayers.indexOf(layer.layerInfos[i].id) != -1) layer.layerInfos[i].visible = true;
                                    else layer.layerInfos[i].visible = false;
                                }
                                layer.setVisibleLayers(visLayers);
                                layer.refresh();

                                // Loop through SWH layers and if any match turn the layer on, if not turn the layer off
                                visLayers = null;
                                visLayers = [];
                                for (i = 0; i < swh.length; i++) {
                                    found = false;
                                    for (j = 0; j < map.getLayer(map.layerIds[swhIndex]).layerInfos.length; j++) {
                                        if (map.getLayer(map.layerIds[swhIndex]).layerInfos[j].name.toUpperCase().trim() == swh[i].LayerName.toUpperCase()) {
                                            visLayers.push(map.getLayer(map.layerIds[swhIndex]).layerInfos[j].id);
                                            found = true;
                                            break;
                                        }
                                    }
                                    if (!found) alert("Warning: unable to highlight a layer. Missing '" + swh[i].LayerName + "' in Sensitive Wildlife Habitat map service. Should be the same name as what is used in hb1298_ndis.mdb. ", "Data Error");
                                }
                                layer = map.getLayer(map.layerIds[swhIndex]);
                                for (i = 0; i < layer.layerInfos.length; i++) {
                                    if (visLayers.indexOf(layer.layerInfos[i].id) != -1) layer.layerInfos[i].visible = true;
                                    else layer.layerInfos[i].visible = false;
                                }
                                layer.setVisibleLayers(visLayers);
                                layer.refresh();
                            });
                            hideLoading();
                        } else if (xmlhttp.status === 404) {
                            alert("Error: Missing readDB.aspx file in " + app + " directory.", "Data Error");
                            hideLoading();
                        } else if (xmlhttp.readyState === 4 && xmlhttp.status === 500) {
                            alert("Missing readDB.aspx file. app=" + app, "Data Error");
                            hideLoading();
                        }
                    }
                    xmlhttp.send(null);
                });
            });
        });
}

function convertProjection2(proj, pointX, pointY, label) {
    // Tammy Bearly 1/20/16
    // Convert map projection to a new projection
    // where proj (the new projection) could be:
    // 4326 = lat long
    // 26912 = UTM Nad83 Zone 12
    // 26913 = UTM Nad83 Zone 13
    require(["esri/tasks/ProjectParameters", "esri/SpatialReference", "esri/geometry/Point", "esri/graphic"],
        function(ProjectParameters, SpatialReference, Point, Graphic) {
            var inSR;
            var outSR;
            inSR = new SpatialReference(wkid);
            // See http://resources.esri.com/help/9.3/arcgisserver/apis/rest/pcs.html for more projections
            outSR = new SpatialReference(proj);
            var params = new ProjectParameters();
            params.geometries = [new Point(pointX, pointY, inSR)];
            params.outSR = outSR;
            geometryService.project(params, function(feature) {
                if (latlong == "") {
                    latlong = "Latitude: " + feature[0].y.toFixed(6) + ", Longitude: " + feature[0].x.toFixed(6);
                    convertProjection2(26913, identifyPoint2.x, identifyPoint2.y, label); // Convert the map point to NAD83 Zone 13
                } else {
                    pointXY = feature[0].x.toFixed(2) + ", " + feature[0].y.toFixed(2);
                    setupIdentify(label);
                }
            });
        });
}


function showLocation(infoData, zoomin) {
    require(["dijit/registry", "esri/symbols/PictureMarkerSymbol", "esri/graphic"], function(registry, PictureMarkerSymbol, Graphic) {
        try {
            identifyPoint2 = infoData.point;
            latlong = "";
            pointXY = "";
            var symbol = new PictureMarkerSymbol("assets/images/yellowdot.png", 30, 30);
            hb1298GraphicsLayer.add(new Graphic(infoData.point, symbol));
            if (zoomin && (map.getScale() > zoomScale2)) {
                map.setScale(zoomScale2);
            }
            map.centerAt(infoData.point);
            // Display label under point  
            addLabel(new Graphic(infoData.point), infoData.label, hb1298GraphicsLayer, "11pt");
            // Convert map point to lat long
            convertProjection2(4326, infoData.point.x, infoData.point.y, infoData.label); // fill latlong string
        } catch (e) {
            alert("Error message: " + e.message + " in javascript/hb1298.js/showLocation. ", "Error", e);
            registry.byId("XYReportBtn").set("label", "Generate Report");
            registry.byId("XYReportBtn").set('disabled', false);
            registry.byId("XYReportBtn2").set("label", "Generate Report");
            registry.byId("XYReportBtn2").set('disabled', false);
            hideLoading();
        }
    });
}

function convertProjection(proj, pointX, pointY) {
    // Tammy Bearly 11/2/11
    // Convert point to map projection
    // where proj is the user entered projection.  It could be:
    // 4326 = lat long
    // 26712 = NAD27 UTM Zone 12N
    // 26713 = NAD27 UTM Zone 13N
    // 26912 = Nad83 UTM Zone 12N
    // 26913 = Nad83 UTM Zone 13N
    // 32612 = WGS 1984 UTM Zone 12N
    // 32613 = WGS 1984 UTM Zone 13N
    require(["dijit/registry", "esri/tasks/ProjectParameters", "esri/SpatialReference", "esri/geometry/Point", "esri/graphic"],
        function(registry, ProjectParameters, SpatialReference, Point, Graphic) {
            try {
                var displayWellID = document.getElementById("wellLabel").value;
                var inSR;
                var outSR;
                var point;
                var coordGraphic;
                inSR = new SpatialReference(Number(proj));
                point = new Point(pointX, pointY, inSR);
                // See http://resources.esri.com/help/9.3/arcgisserver/apis/rest/pcs.html for more projections
                coordGraphic = new Graphic(point);
                outSR = new SpatialReference(wkid);
                // on success geometryService calls projectCompleteHandler
                geometryService.project([coordGraphic.geometry], outSR); // converts point to our projection
                var params = new ProjectParameters();
                params.geometries = [new Point(pointX, pointY, inSR)];
                params.outSR = outSR;
                geometryService.project(params, function(feature) {
                    var pointObj = {
                        label: displayWellID,
                        point: feature[0]
                    };
                    showLocation(pointObj, true); // zoomin to point
                    params = null;
                }, function(err) {
                    alert("Problem projecting point. In javascript/hb1298.js/convertProjection. Error message: " + err.message, "Warning", err);
                    registry.byId("XYReportBtn").set("label", "Generate Report");
                    registry.byId("XYReportBtn").set('disabled', false);
                    hideLoading();
                    params = null;
                });
            } catch (e) {
                alert("Error message: " + e.message + " At javascript/hb1298.js/convertProjection.", "Error");
                registry.byId("XYReportBtn").set("label", "Generate Report");
                registry.byId("XYReportBtn").set('disabled', false);
                hideLoading();
            }
        });
}

function setPointXY() {
    require(["dijit/registry"], function(registry) {
        try {
            showLoading();
            registry.byId("XYReportBtn").set("label", "Generating...");
            registry.byId("XYReportBtn").set('disabled', true);

            var pattern = /,/g; // globally replace all commas
            var s = registry.byId("hb1298_xy_proj");
            var pointX, pointY;
            switch (s.get("value")) {
                case "dd": // Decimal Degrees
                    {
                        pointX = Number(document.getElementById("xDD").value);
                        pointY = Number(document.getElementById("yDD").value);
                        document.getElementById("xDD").value = "";
                        document.getElementById("yDD").value = "";
                        if (pointX > 0) pointX = pointX * -1;
                        if ((pointX >= -110 && pointX <= -100) && (pointY >= 35 && pointY <= 42)) {
                            convertProjection(4326, pointX, pointY);
                        } else {
                            alert("This latitude, longitude is not in the state of Colorado.  Please enter it again.", "Warning");
                            registry.byId("XYReportBtn").set("label", "Generate Report");
                            registry.byId("XYReportBtn").set('disabled', false);
                            hideLoading();
                        }
                        break;
                    }
                case "dms": // Degrees, Minutes, Seconds convert to Decimal Degrees
                    {
                        pointX = Number(document.getElementById("xDeg").value) + (Number(document.getElementById("xMin").value) + (Number(document.getElementById("xSec").value) / 60)) / 60;
                        pointY = Number(document.getElementById("yDeg").value) + (Number(document.getElementById("yMin").value) + (Number(document.getElementById("ySec").value) / 60)) / 60;
                        document.getElementById("xDeg").value = "";
                        document.getElementById("xMin").value = "";
                        document.getElementById("xSec").value = "";
                        document.getElementById("yDeg").value = "";
                        document.getElementById("yMin").value = "";
                        document.getElementById("ySec").value = "";
                        if (pointX > 0) pointX = pointX * -1;
                        if ((pointX >= -110 && pointX <= -100) && (pointY >= 35 && pointY <= 42)) {
                            convertProjection(4326, pointX, pointY);
                        } else {
                            alert("This latitude, longitude is not in the state of Colorado.  Please enter it again.", "Warning");
                            registry.byId("XYReportBtn").set("label", "Generate Report");
                            registry.byId("XYReportBtn").set('disabled', false);
                            hideLoading();
                        }
                        break;
                    }
                case "dm": // Degrees, Decimal Minutes convert to Decimal Degrees
                    {
                        pointX = Number(document.getElementById("xDeg2").value) + (Number(document.getElementById("xMin2").value) / 60);
                        pointY = Number(document.getElementById("yDeg2").value) + (Number(document.getElementById("yMin2").value) / 60);
                        document.getElementById("xDeg2").value = "";
                        document.getElementById("xMin2").value = "";
                        document.getElementById("yDeg2").value = "";
                        document.getElementById("yMin2").value = "";
                        if (pointX > 0) pointX = pointX * -1;
                        if ((pointX >= -110 && pointX <= -100) && (pointY >= 35 && pointY <= 42)) {
                            convertProjection(4326, pointX, pointY);
                        } else {
                            alert("This latitude, longitude is not in the state of Colorado.  Please enter it again.", "Warning");
                            registry.byId("XYReportBtn").set("label", "Generate Report");
                            registry.byId("XYReportBtn").set('disabled', false);
                            hideLoading();
                        }
                        break;
                    }
                case "26712": // UTM Zone 12 NAD27
                    {
                        pointX = Number(document.getElementById("xUTM1227").value.replace(pattern, ""));
                        pointY = Number(document.getElementById("yUTM1227").value.replace(pattern, ""));
                        document.getElementById("xUTM1227").value = "";
                        document.getElementById("yUTM1227").value = "";
                        if ((pointX >= 660000 && pointX <= 1300000) && (pointY >= 4095000 && pointY <= 4580000)) {
                            convertProjection(26712, pointX, pointY);
                        } else {
                            alert("This UTM is not in the state of Colorado.  Please enter it again.", "Warning");
                            registry.byId("XYReportBtn").set("label", "Generate Report");
                            registry.byId("XYReportBtn").set('disabled', false);
                            hideLoading();
                        }
                        break;
                    }

                case "26713": // UTM Zone 13 NAD27
                    {
                        pointX = Number(document.getElementById("xUTM1327").value.replace(pattern, ""));
                        pointY = Number(document.getElementById("yUTM1327").value.replace(pattern, ""));
                        document.getElementById("xUTM1327").value = "";
                        document.getElementById("yUTM1327").value = "";
                        if ((pointX >= 139700 && pointX <= 765000) && (pointY >= 4097000 && pointY <= 4544000)) {
                            convertProjection(26713, pointX, pointY);
                        } else {
                            alert("This UTM is not in the state of Colorado.  Please enter it again.", "Warning");
                            registry.byId("XYReportBtn").set("label", "Generate Report");
                            registry.byId("XYReportBtn").set('disabled', false);
                            hideLoading();
                        }
                        break;
                    }
                case "26912": // NAD83 UTM Zone 12
                    {
                        pointX = Number(document.getElementById("xUTM1283").value.replace(pattern, ""));
                        pointY = Number(document.getElementById("yUTM1283").value.replace(pattern, ""));
                        document.getElementById("xUTM1283").value = "";
                        document.getElementById("yUTM1283").value = "";
                        if ((pointX >= 660000 && pointX <= 1300000) && (pointY >= 4095000 && pointY <= 4580000)) {
                            convertProjection(26912, pointX, pointY);
                        } else {
                            alert("This UTM is not in the state of Colorado.  Please enter it again.", "Warning");
                            registry.byId("XYReportBtn").set("label", "Generate Report");
                            registry.byId("XYReportBtn").set('disabled', false);
                            hideLoading();
                        }
                        break;
                    }

                case "26913": // NAD83 UTM Zone 13
                    {
                        pointX = Number(document.getElementById("xUTM1383").value.replace(pattern, ""));
                        pointY = Number(document.getElementById("yUTM1383").value.replace(pattern, ""));
                        document.getElementById("xUTM1383").value = "";
                        document.getElementById("yUTM1383").value = "";
                        if ((pointX >= 139700 && pointX <= 765000) && (pointY >= 4097000 && pointY <= 4544000)) {
                            convertProjection(26913, pointX, pointY);
                        } else {
                            alert("This UTM is not in the state of Colorado.  Please enter it again.", "Warning");
                            registry.byId("XYReportBtn").set("label", "Generate Report");
                            registry.byId("XYReportBtn").set('disabled', false);
                            hideLoading();
                        }
                        break;
                    }
                case "32612": // WGS84 UTM Zone 12
                    {
                        pointX = Number(document.getElementById("xUTM1284").value.replace(pattern, ""));
                        pointY = Number(document.getElementById("yUTM1284").value.replace(pattern, ""));
                        document.getElementById("xUTM1284").value = "";
                        document.getElementById("yUTM1284").value = "";
                        if ((pointX >= 660000 && pointX <= 1300000) && (pointY >= 4095000 && pointY <= 4580000)) {
                            convertProjection(32612, pointX, pointY);
                        } else {
                            alert("This UTM is not in the state of Colorado.  Please enter it again.", "Warning");
                            registry.byId("XYReportBtn").set("label", "Generate Report");
                            registry.byId("XYReportBtn").set('disabled', false);
                            hideLoading();
                        }
                        break;
                    }

                case "32613": // WGS84 UTM Zone 13
                    {
                        pointX = Number(document.getElementById("xUTM1384").value.replace(pattern, ""));
                        pointY = Number(document.getElementById("yUTM1384").value.replace(pattern, ""));
                        document.getElementById("xUTM1384").value = "";
                        document.getElementById("yUTM1384").value = "";
                        if ((pointX >= 139700 && pointX <= 765000) && (pointY >= 4097000 && pointY <= 4544000)) {
                            convertProjection(32613, pointX, pointY);
                        } else {
                            alert("This UTM is not in the state of Colorado.  Please enter it again.", "Warning");
                            registry.byId("XYReportBtn").set("label", "Generate Report");
                            registry.byId("XYReportBtn").set('disabled', false);
                            hideLoading();
                        }
                        break;
                    }
            }
        } catch (e) {
            alert(e.message + " At javascript/hb1298.js/setPointXY. ", "Error", e);
            registry.byId("XYReportBtn").set("label", "Generate Report");
            registry.byId("XYReportBtn").set('disabled', false);
            hideLoading();
        }
    });
}

function wellIDReport() {
    // Test well id: 05706474
    // User entered a well ID.  Look up point value based on well ID and generate report
    require(["dijit/registry", "esri/tasks/QueryTask", "esri/tasks/query"], function(registry, QueryTask, Query) {
        showLoading();
        registry.byId("XYReportBtn2").set("label", "Generating...");
        registry.byId("XYReportBtn2").set('disabled', true);
        var displayWellID = document.getElementById("wellID").value;
        var url = wellidUrl || null;
        var expr = wellidExp || null;
        if (url == null || expr == null) {
            alert("Missing tag, <wellid><url> or <wellid><expression> in HB1298Widget.xml file.", "Data Error");
            return;
        }

        var queryTask = new QueryTask(url);
        var query = new Query();
        expr = expr.replace("[value]", displayWellID);
        query.where = expr;
        query.returnGeometry = true;
        query.outSpatialReference = map.spatialReference;
        queryTask.execute(query, function(featureSet) {
            // on result 
            try {
                require(["esri/geometry/Point"], function(Point) {
                    var point = new Point(featureSet.features[0].geometry.x, featureSet.features[0].geometry.y, map.spatialReference);
                    var pointObj = {
                        label: displayWellID,
                        point: point
                    };
                    showLocation(pointObj, true);
                    point = null;
                });
            } catch (error) {
                alert("Your search for the well ID, " + displayWellID + ", was not successful.  Please try again. ", "Warning Message");
                registry.byId("XYReportBtn2").set("label", "Generate Report");
                registry.byId("XYReportBtn2").set('disabled', false);
                hideLoading();
            }
            //on fault
        }, function() {
            alert("Error in queryTask in javascript/hb1298.js/wellIDReport.", "Code Error");
            registry.byId("XYReportBtn2").set("label", "Generate Report");
            registry.byId("XYReportBtn2").set('disabled', false);
            hideLoading();
        });
        queryTask = null;
        query = null;
    });
}

function removeHB1298() {
    hb1298GraphicsLayer.clear();
    hideLoading();
}

function deselectPointTool() {
    drawing = false;
    document.getElementById("btnLocation").className = "graphBtn";
    toolbar2.deactivate();
}

function selectPointTool() {
    // Check if button was already depressed. If so reset to Identify
    if (document.getElementById("btnLocation").className == "graphBtnSelected") {
        deselectPointTool();
        return;
    }
    drawing = true; // flag to turn off identify in identify.js, doIdentify()
    // depress the current button
    document.getElementById("btnLocation").className = "graphBtnSelected";
    require(["esri/toolbars/draw", "dojo/i18n!esri/nls/jsapi"], function(Draw, bundle) {
        bundle.toolbars.draw.addPoint = "Click a location for the report"; // change tooltip
        toolbar2.activate(Draw.POINT);
    });
}

function mapReport(evtObj) {
    require(["esri/geometry/Point"], function(Point) {
        showLoading();
        var pointObj = {
            label: document.getElementById("wellLabel2").value,
            point: new Point(evtObj.geometry.x, evtObj.geometry.y, map.spatialReference)
        };
        showLocation(pointObj, true);
        deselectPointTool();
    });
}

function HB1298init() {
    require(["dijit/registry", "dojo/dom", "dojo/dom-style", "dojo/dom-construct",
            "dijit/layout/TabContainer", "dijit/layout/ContentPane", "esri/layers/GraphicsLayer",
            "esri/symbols/PictureMarkerSymbol", "esri/toolbars/draw", "dojo/_base/lang"
        ],
        function(registry, dom, domStyle, domConstruct, TabContainer, ContentPane, GraphicsLayer, PictureMarkerSymbol, Draw, lang) {
            try {
                if (!hb1298GraphicsLayer) {
                    //var graphicPointSym = new PictureMarkerSymbol("assets/images/yellowdot.png", 30, 30);
                    hb1298GraphicsLayer = new GraphicsLayer();
                    //hb1298GraphicsLayer.symbol = graphicPointSym;
                    map.addLayer(hb1298GraphicsLayer);
                }
                var layers;
                toolbar2 = new Draw(map, { showTooltips: true });
                toolbar2.on("draw-end", lang.hitch(map, mapReport));
                // Read HB1298Widget.xml file
                var xmlhttp = createXMLhttpRequest();
                var configFile = app + "/HB1298Widget.xml?v=" + ndisVer;
                xmlhttp.onreadystatechange = function() {
                    if (xmlhttp.readyState == 4 && xmlhttp.status === 200) {
                        var xmlDoc = createXMLdoc(xmlhttp);
                        try {
                            zoomScale2 = xmlDoc.getElementsByTagName("zoomscale")[0].firstChild.nodeValue;
                        } catch (e) {
                            alert("Missing zoomscale tag in HB1298Widget.xml file.", "Data Error");
                        }
                        try {
                            layers = xmlDoc.getElementsByTagName("layer");
                        } catch (e) {
                            alert("Missing layer tags in HB1298Widget.xml file.", "Data Error");
                        }
                        try {
                            hb1298FileNm = xmlDoc.getElementsByTagName("filename")[0].firstChild.nodeValue;
                        } catch (e) {
                            alert("Missing filename tag in HB1298Widget.xml file.", "Data Error");
                        }
                        try {
                            bmpdir = xmlDoc.getElementsByTagName("bmpdir")[0].firstChild.nodeValue;
                        } catch (e) {
                            alert("Missing bmpdir tag in HB1298Widget.xml file.", "Data Error");
                        }
                        try {
                            wellidUrl = xmlDoc.getElementsByTagName("wellid")[0].getElementsByTagName("url")[0].firstChild.nodeValue
                        } catch (e) {
                            alert("Missing wellid url tags in HB1298Widget.xml file.", "Data Error");
                        }
                        try {
                            wellidExp = xmlDoc.getElementsByTagName("wellid")[0].getElementsByTagName("expression")[0].firstChild.nodeValue
                        } catch (e) {
                            alert("Missing wellid expression tags in HB1298Widget.xml file.", "Data Error");
                        }

                        // Read layers from HB1298Widget.xml
                        try {
                            hb1298LayerIds = [];
                            for (var i = 0; i < layers.length; i++) {
                                hb1298LayerIds[i] = {
                                    url: layers[i].getElementsByTagName("url")[0].childNodes[0].nodeValue,
                                    ids: layers[i].getElementsByTagName("id")[0].childNodes[0].nodeValue,
                                    fields: layers[i].getElementsByTagName("fields")[0].childNodes[0].nodeValue.split(","),
                                    display: layers[i].getElementsByTagName("displaynames")[0].childNodes[0].nodeValue.split(","),
                                    label: layers[i].getAttribute("label")
                                }
                            }
                        } catch (e) {
                            alert("Missing layer tag attribute label or tags: url, ids, fields, or display inside each layer tag in HB1298Widget.xml file.", "Data Error");
                        }
                        var tc = new TabContainer({
                            style: "height: 350px; width:100%;",
                            useMenu: false,
                            useSlider: false
                        }, "hb1298_tc");

                        //*******************
                        //* XY Location Tab *
                        //*******************
                        var cp1 = new ContentPane({
                            title: 'XY Location',
                            content: '<div>Generate Habitat Impact Report based on location.</div><br/>' +
                                '<label>Well label: </label><input id="wellLabel" /><br/><br/>' +
                                '<label>Select coordinate format:</label><br/>' +
                                '<select id="hb1298_xy_proj" name="hb1298_xy_proj" data-dojo-type="dijit/form/Select">' +
                                '<option value="dd">Lat/Long Decimal Degrees</option>' +
                                '<option value="dms">Lat/Long Degrees, Min, Sec</option>' +
                                '<option value="dm">Lat/Long Degrees, Decimal Min</option>' +
                                '<option value="32612">WGS84 UTM Zone 12N</option>' +
                                '<option value="32613">WGS84 UTM Zone 13N</option>' +
                                '<option value="26912">NAD83 UTM Zone 12N</option>' +
                                '<option value="26913">NAD83 UTM Zone 13N</option>' +
                                '<option value="26712">NAD27 UTM Zone 12N</option>' +
                                '<option value="26713">NAD27 UTM Zone 13N</option>' +
                                '</select><br/><br/>' +
                                '<!-- Lat/Long Decimal Degrees -->' +
                                '<div id="hb_ddDiv">' +
                                '<table><tbody>' +
                                '<tr><td colspan="2">Example: Lat. N:  39.834&#176;</td></tr>' +
                                '<tr><td colspan="2">Example: Long. W: 103.984&#176;</td></tr>' +
                                '<tr><td>Lat N: </td><td><input id="yDD" type="text"/> &#176;</td></tr>' +
                                '<tr><td>Long W:</td><td><input id="xDD" type="text" onkeydown="if (event.keyCode == 13) setPointXY();"/> &#176;</td></tr>' +
                                '</tbody></table>' +
                                '</div>' +
                                '<!-- Lat/Long Degrees, Min, Sec -->' +
                                '<div id="hb_dmsDiv" style="display:none">' +
                                '<table><tbody>' +
                                '<tr><td colspan="4">Example: Lat. N:  39&#176; 50&#39; 4.111&#34;</td></tr>' +
                                '<tr><td colspan="4">Example: Long. W: 103&#176; 48&#39; 1.25&#34;</td></tr>' +
                                '<tr  style="font-size: x-small; text-align:center;"><td></td><td>degrees</td><td>minutes</td><td>seconds</td><td></td></tr>' +
                                '<tr><td>Lat N: </td><td><input id="yDeg" size="3" type="text"/> &#176; </td><td><input id="yMin" size="3" type="text"/> &#39; </td><td><input id="ySec" size="5" type="text"/> &#34;</td></tr>' +
                                '<tr><td>Long W:</td><td><input id="xDeg" size="3" type="text"/> &#176; </td><td><input id="xMin" size="3" type="text"/> &#39; </td><td><input id="xSec" size="5" type="text" onkeydown="if (event.keyCode == 13) setPointXY();"/> &#34;</td></tr>' +
                                '</tbody></table>' +
                                '</div>' +
                                '<!-- Lat/Long Degrees, Decimal Min -->' +
                                '<div id="hb_dmDiv" style="display:none">' +
                                '<table><tbody>' +
                                '<tr><td colspan="3">Example: Lat. N:  39&#176; 5.2&#39;</td></tr>' +
                                '<tr><td colspan="3">Example: Long. W: 103&#176; 28&#39;</td></tr>' +
                                '<tr style="font-size: x-small; text-align:center;"><td></td><td>degrees</td><td>minutes</td><td></td></tr>' +
                                '<tr><td>Lat N: </td><td><input id="yDeg2" size="3" type="text"/>&#176; </td><td><input id="yMin2" size="5" type="text"/> &#39;</td></tr>' +
                                '<tr><td>Long W:</td><td><input id="xDeg2" size="3" type="text"/>&#176; </td><td><input id="xMin2" size="5" type="text" onkeydown="if (event.keyCode == 13) setPointXY();"/> &#39;</td></tr>' +
                                '</tbody></table>' +
                                '</div>' +
                                '<!-- WGS84 UTM Zone 12N -->' +
                                '<div id="hb_32612Div" style="display:none">' +
                                '<table><tbody>' +
                                '<tr><td colspan="2">Range: 660,000 &lt;= X &lt;= 1,300,000</td></tr>' +
                                '<tr><td colspan="2">Range: 4,095,000 &lt;= Y &lt;= 4,580,000</td></tr>' +
                                '<tr><td>Easting: </td><td><input id="xUTM1284" type="text"/></td></tr>' +
                                '<tr><td>Northing:</td><td><input id="yUTM1284" type="text" onkeydown="if (event.keyCode == 13) setPointXY();"/></td></tr>' +
                                '</tbody></table>' +
                                '</div>' +
                                '<!-- WGS84 UTM Zone 13N -->' +
                                '<div id="hb_32613Div" style="display:none">' +
                                '<table><tbody>' +
                                '<tr><td colspan="2">Range: 139,700 &lt;= X &lt;= 765,000</td></tr>' +
                                '<tr><td colspan="2">Range: 4,097,000 &lt;= Y &lt;= 4,544,000</td></tr>' +
                                '<tr><td>Easting: </td><td><input id="xUTM1384" type="text"/></td></tr>' +
                                '<tr><td>Northing:</td><td><input id="yUTM1384" type="text" onkeydown="if (event.keyCode == 13) setPointXY();"/></td></tr>' +
                                '</tbody></table>' +
                                '</div>' +
                                '<!-- UTM NAD83 Zone 12 -->' +
                                '<div id="hb_26912Div" style="display:none">' +
                                '<table><tbody>' +
                                '<tr><td colspan="2">Range: 660,000 &lt;= X &lt;= 1,300,000</td></tr>' +
                                '<tr><td colspan="2">Range: 4,095,000 &lt;= Y &lt;= 4,580,000</td></tr>' +
                                '<tr><td>Easting: </td><td><input id="xUTM1283" type="text"/></td></tr>' +
                                '<tr><td>Northing:</td><td><input id="yUTM1283" type="text" onkeydown="if (event.keyCode == 13) setPointXY();"/></td></tr>' +
                                '</tbody></table>' +
                                '</div>' +
                                '<!-- UTM NAD83 Zone 13 -->' +
                                '<div id="hb_26913Div" style="display:none">' +
                                '<table><tbody>' +
                                '<tr><td colspan="2">Range: 139,700 &lt;= X &lt;= 765,000</td></tr>' +
                                '<tr><td colspan="2">Range: 4,097,000 &lt;= Y &lt;= 4,544,000</td></tr>' +
                                '<tr><td>Easting: </td><td><input id="xUTM1383" type="text"/></td></tr>' +
                                '<tr><td>Northing:</td><td><input id="yUTM1383" type="text" onkeydown="if (event.keyCode == 13) setPointXY();"/></td></tr>' +
                                '</tbody></table>' +
                                '</div>' +
                                '<!-- UTM NAD27 Zone 12 -->' +
                                '<div id="hb_26712Div" style="display:none">' +
                                '<table><tbody>' +
                                '<tr><td colspan="2">Range: 660,000 &lt;= X &lt;= 1,300,000</td></tr>' +
                                '<tr><td colspan="2">Range: 4,095,000 &lt;= Y &lt;= 4,580,000</td></tr>' +
                                '<tr><td>Easting: </td><td><input id="xUTM1227" type="text"/></td></tr>' +
                                '<tr><td>Northing:</td><td><input id="yUTM1227" type="text" onkeydown="if (event.keyCode == 13) setPointXY();"/></td></tr>' +
                                '</tbody></table>' +
                                '</div>' +
                                '<!-- UTM NAD27 Zone 13 -->' +
                                '<div id="hb_26713Div" style="display:none">' +
                                '<table><tbody>' +
                                '<tr><td colspan="2">Range: 139,700 &lt;= X &lt;= 765,000</td></tr>' +
                                '<tr><td colspan="2">Range: 4,097,000 &lt;= Y &lt;= 4,544,000</td></tr>' +
                                '<tr><td>Easting: </td><td><input id="xUTM1327" type="text"/></td></tr>' +
                                '<tr><td>Northing:</td><td><input id="yUTM1327" type="text" onkeydown="if (event.keyCode == 13) setPointXY();"/></td></tr>' +
                                '</tbody></table>' +
                                '</div>' +
                                '<p align="center">' +
                                '<button id="XYReportBtn" data-dojo-type="dijit/form/Button" role="presentation" type="button" onclick="setPointXY()">Generate Report</button>' +
                                '<button data-dojo-type="dijit/form/Button" role="presentation" type="button" title="Remove well labels from the map." onClick="removeHB1298">Clear</button>' +
                                '</p>'
                        });
                        tc.addChild(cp1);
                        // Change XY input boxes based on coordinate format selection
                        var s = registry.byId("hb1298_xy_proj");
                        s.on("change", function() {
                            var v = s.get("value");
                            document.getElementById("hb_ddDiv").style.display = "none";
                            document.getElementById("hb_dmsDiv").style.display = "none";
                            document.getElementById("hb_dmDiv").style.display = "none";
                            document.getElementById("hb_32612Div").style.display = "none";
                            document.getElementById("hb_32613Div").style.display = "none";
                            document.getElementById("hb_26912Div").style.display = "none";
                            document.getElementById("hb_26913Div").style.display = "none";
                            document.getElementById("hb_26712Div").style.display = "none";
                            document.getElementById("hb_26713Div").style.display = "none";
                            if (v == "dd") document.getElementById("hb_ddDiv").style.display = "block";
                            else if (v == "dms") document.getElementById("hb_dmsDiv").style.display = "block";
                            else if (v == "dm") document.getElementById("hb_dmDiv").style.display = "block";
                            else if (v == "32612") document.getElementById("hb_32612Div").style.display = "block";
                            else if (v == "32613") document.getElementById("hb_32613Div").style.display = "block";
                            else if (v == "26912") document.getElementById("hb_26912Div").style.display = "block";
                            else if (v == "26913") document.getElementById("hb_26913Div").style.display = "block";
                            else if (v == "26712") document.getElementById("hb_26712Div").style.display = "block";
                            else if (v == "26713") document.getElementById("hb_26713Div").style.display = "block";
                        });

                        //***************
                        //* Well ID Tab *
                        //***************
                        var cp2 = new ContentPane({
                            title: 'Well ID',
                            content: '<div>Generate Habitat Impact Report based on well ID.</div><br/>' +
                                '<label>Well ID: </label><input id="wellID" onkeydown="if (event.keyCode == 13) wellIDReport();"/>' +
                                '<p align="center">' +
                                '<button id="XYReportBtn2" data-dojo-type="dijit/form/Button" role="presentation" type="button" onclick="wellIDReport">Generate Report</button>' +
                                '<button data-dojo-type="dijit/form/Button" role="presentation" type="button" title="Remove well labels from the map." onclick="removeHB1298">Clear</button>' +
                                '</p>'
                        });
                        tc.addChild(cp2);

                        //*********************
                        //* Select On Map Tab *
                        //*********************
                        var cp3 = new ContentPane({
                            title: 'Select on Map',
                            content: '<div>Generate Habitat Impact Report based on map click.</div><br/>' +
                                '<label>Well Label: </label><input id="wellLabel2"/>' +
                                '<p align="center">' +
                                '<img id="btnLocation" onclick="javascript:selectPointTool();" style="vertical-align:middle" title="Set map tool to input map location" useHandCursor="true" class="graphBtn" src="assets/images/i_draw_point.png"/>&nbsp;&nbsp;' +
                                '<button data-dojo-type="dijit/form/Button" role="presentation" type="button" title="Remove well labels from the map." onclick="removeHB1298">Clear</button>' +
                                '</p>'
                        });
                        tc.addChild(cp3);
                        tc.startup();
                        tc.resize(); // force refresh so first tab is not blank when widget is minimized on startup
                        tc.watch("selectedChildWidget", function(name, oval, nval) {
                            if (nval.title == "XY Location") {
                                setTimeout(function() {
                                    document.getElementById("wellLabel").focus();
                                }, 10);
                                deselectPointTool();
                            } else if (nval.title == "Well ID") {
                                setTimeout(function() {
                                    document.getElementById("wellID").focus();
                                }, 10);
                                deselectPointTool();
                            } else if (nval.title == "Select on Map") {
                                setTimeout(function() {
                                    document.getElementById("wellLabel2").focus();
                                }, 10);
                                selectPointTool();
                            }
                        });
                        cp1 = null;
                        cp2 = null;
                        cp3 = null;

                        registry.byId("hb1298Pane").set("open", true);
                        dom.byId("hb1298Pane").addEventListener('click', function(event) {
                            if (!registry.byId("hb1298Pane").open) {
                                deselectPointTool();
                            }
                        });
                    } // if missing file
                    else if (xmlhttp.status === 404) {
                        alert("Error: Missing HB1298Widget.xml file in " + app + " directory.", "Data Error");
                        hideLoading();
                    } else if (xmlhttp.readyState === 4 && xmlhttp.status === 500) {
                        alert("Error reading " + app + "/HB1298Widget.xml file.", "Data Error");
                        hideLoading();
                    }
                };
                xmlhttp.open("GET", configFile, true);
                xmlhttp.send(null);
            } catch (e) {
                alert(e.message + " At javascript/hb1298.js/HB1298init. ", "Error Message", e);
            }
        });
}
HB1298init();
// load hb1298 points from command line
require(["dojo/io-query"], function(ioquery) {
    var cmdLineObj = ioquery.queryToObject(document.location.search.substr((document.location.search[0] === "?" ? 1 : 0)));
    if (cmdLineObj.hb1298 && cmdLineObj.hb1298 != "") {
        addHB1298Points(cmdLineObj.hb1298);
    }
});