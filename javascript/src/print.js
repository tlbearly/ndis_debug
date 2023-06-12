var prtDisclaimer="";
var startTim;
var inchesWidth, inchesHeight, dpi=96; // tlb 7-20-19
function printInit() {
	// Read the PrintPdfWidget.xml file
	var xmlhttp = createXMLhttpRequest();
	var xmlFile = app+"/PrintPdfWidget.xml?v="+ndisVer;
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState===4 && xmlhttp.status === 200) {
			var xmlDoc=createXMLdoc(xmlhttp);
			if (xmlDoc.getElementsByTagName("disclaimer")[0]){
				prtDisclaimer=xmlDoc.getElementsByTagName("disclaimer")[0].firstChild.nodeValue;
			}
			else
				alert("Missing tag, disclaimer, in "+app+"/PrintPdfWidget.xml file.","Data Error");
			if (xmlDoc.getElementsByTagName("helpvideo")[0])
				document.getElementById("printVideo").innerHTML="<a target='help' href="+xmlDoc.getElementsByTagName("helpvideo")[0].firstChild.nodeValue+">Click here to view help video.</a><br/><br/>";
		}
		else if (xmlhttp.status === 404) {
			alert("Error: Missing PrintPdfWidget.aspx file in "+app+ " directory.","Data Error");
			hideLoading();
		}
		else if (xmlhttp.readyState===4 && xmlhttp.status===500) {
			alert("Missing PrintPdfWidget.aspx file. app="+app,"Data Error");
			hideLoading();
		}
	};
	xmlhttp.open("GET",xmlFile,true);
	xmlhttp.send();
}

/*
function changePrintSize(){
	require(["dojo/dom","dijit/registry"],function(dom,registry){
		if (!previewMap || !previewMap.extent) {
			alert("Please wait for page to load.");
			return;
		}
		document.getElementById("printMapLink").innerHTML = "";
		document.getElementById("printLegendLink").innerHTML = "";
		var container = document.getElementById("printPreviewMap");
		var orient = dom.byId("orient");
		index = orient.selectedIndex;
		var selectedValue_orient = orient.options[index].value;
		var size = dom.byId("size");
		index = size.selectedIndex;
		var selectedValue_size = size.options[index].value;
		var pt = previewMap.extent.getCenter();
		var level = previewMap.getLevel();
		
		if (selectedValue_orient == "Landscape") {
			// borders: .8 on sides, 1.25 on top and bottom
			// 11 X 8.5
			// 10.2 x 7.25 inch image (without borders)
			// 979 x 696 pixels in screen resolution (inches * 96)
			// 490 x 348 50% of that
			if (selectedValue_size == "Letter "){
				previewMap.width=490;
				previewMap.height=348;
				inchesWidth=10.2;
				inchesHeight=7.25;
				registry.byId("printPreviewMap").resize({w:490,h:348});
			}
			// 17 x 11
			// 17-.8 x 11-1.25
			// 16.2 x 8.75 inch image (without borders)
			// 1555 x 936 pixels in screen resolution
			// 544 x 328 35% of that
			else if (selectedValue_size == "Tabloid ") {
				previewMap.width=544;
				previewMap.height=328;
				inchesWidth=16.2;
				inchesHeight=8.75;
				registry.byId("printPreviewMap").resize({w:544,h:328});
			}
			// 14-.8 x 8.5-1.25
			// 13.2 x 7.25 inch image (without borders)
			// 1267 x 696 pixels in screen resolution
			// 506 x 278 40% of that
			else if (selectedValue_size == "8.5 x 14 ") {
				previewMap.width=506;
				previewMap.height=278;
				inchesWidth=13.2;
				inchesHeight=7.25;
				registry.byId("printPreviewMap").resize({w:506,h:278});
			}
		}
		// Portrait
		else {
			// 8.5 x 11
			// 7.7 x 9.75 inch image (without borders)
			// 739 x 936 pixels in screen resolution (inches * 96)
			// 370 x 468 50% of that
			if (selectedValue_size == "Letter "){
				previewMap.width=370;
				previewMap.height=468;
				inchesWidth=7.7;
				inchesHeight=9.75;
				registry.byId("printPreviewMap").resize({ w:370,h:468});
			}
			// 11 x 17
			// 11-.8 x 17-1.25
			// 10.2 x 15.75 inch image (without borders)
			// 979 x 1512 pixels in screen resolution
			// 343 x 529 35% of that
			else if (selectedValue_size == "Tabloid ") {
				previewMap.width=343;
				previewMap.height=529;
				inchesWidth=10.2;
				inchesHeight=15.75;
				registry.byId("printPreviewMap").resize({w:343,h:529});
			}
			// 8.5 x 14
			// 7.7 x 12.75 inch image (without borders)
			// 739 x 1224 pixels in screen resolution (inches * 96)
			// 296 x 490 40% of that
			else if (selectedValue_size == "8.5 x 14 ") {
				previewMap.width=296;
				previewMap.height=490;
				inchesWidth=7.7;
				inchesHeight=12.75;
				registry.byId("printPreviewMap").resize({ w:296,h:490});
			}
		}
		// first time it is -1, but it is set to main map, just not available yet.
		if (level>-1) previewMap.centerAndZoom(pt,level);
		pt = null;
	});
}*/

function grayOutLegend(format){
	require(["dojo/dom",],function(dom){
		document.getElementById("printMapLink").innerHTML = "";
		document.getElementById("printLegendLink").innerHTML = "";
		if (format.value != "geopdf" && format.value != "pdf" && dom.byId("printLegend")){
			dom.byId("printLegendCB").style.display = "none";
		}
		else{
			dom.byId("printLegendCB").style.display = "inline-block";
		}
		/*if (format.value != "geotiff")
			document.getElementById("printInst").innerHTML = "Disable pop-up blocker. Printout will open in a new tab.";
		else
			document.getElementById("printInst").innerHTML = "";*/
	});
}

function printMap(){
  require([
        "esri/rest/print", "esri/rest/support/PrintTemplate", "esri/rest/support/PrintParameters",
        "esri/Graphic", "esri/geometry/Point",
        "esri/rest/support/LegendLayer", "esri/layers/GraphicsLayer", "dojo/dom", "dijit/registry"
      ], function(
      print, PrintTemplate, PrintParameters,
       Graphic, Point,
      LegendLayer, GraphicsLayer, dom, registry) {
		  // FUNCTIONS
		  function printResult(result){
			// 1-22-19 tlb  Add Google Analytics stats for georef printing 
			var i;
			var format = dom.byId("format");
			var millis = Date.now() - startTim;
			var s = view.scale;
			var mapscale;
			if (s < 9028) mapscale = "10k";
			else if (s < 36112) mapscale = "24k";
			else if (s < 72224) mapscale = "50k";
			else if (s < 144448) mapscale = "100k";
			else if (s < 288896) mapscale = "250k";
			else if (s < 577791) mapscale = "500k";
			else if (s < 1155582) mapscale = "1M";
			else if (s < 2311163) mapscale = "2M";
			else if (s < 4622325) mapscale = "4M";
			else if (s < 9244649) mapscale = "9M";
			var maptype = format.options[format.selectedIndex].value;
			var category = dom.byId("size").options[dom.byId("size").selectedIndex].innerHTML+" "+maptype+" ";//+" "+theDate;
			if (printLegendFlag && document.getElementById("printLegend").checked) category += "legend ";//+mapscale;
			var pagesize = dom.byId("size").options[dom.byId("size").selectedIndex].innerHTML;
			var value = Math.floor(millis/1000); // seconds to generate. Must be integer for Google Analytics
			// Add map services used
			var mapservices = "";
			for (i=0; i<map.layers.items.length; i++){
				switch ( map.layers.items[i]){
					case "Motor Vehicle Use Map":
						mapservices += "M";
						break;
					case "Hunter Reference":
						mapservices += "R";
						break;
					case "Game Species":
						mapservices += "G";
						break;
					case "Fishing Info":
						mapservices += "F";
						break;
					case "Reference":
						mapservices += "R";
						break;
				}
			}
			category += mapservices;
			console.log("Time to create map = " + value + " seconds for "+category+" "+mapscale);
			if (typeof gtag === "function"){
				gtag('event','print',{
					'seconds':value,
					'page_size':pagesize,
					'map_services':mapservices,
					'map_scale':mapscale,
					'map_type':maptype,
					'basemap':mapBasemap
				});
			}	
			if (typeof ga === "function"){
				var label="Print "; // function
				switch(maptype){
					case "pdf":
						label += "PDF";
						break;
					case "geopdf":
						label += "geoPDF";
						break;
					case "jpg":
						label += "JPG";
						break;
					case "geotiff":
						label += "geoTIFF";
						break;
					case "gif":
						label += "GIF";
						break;
				}
				var custom = {
				'metric1':value,
				'dimension2':pagesize,
				'dimension3':mapservices,
				'dimension4':mapscale,
				'dimension5':maptype
			};
			var action = dom.byId("size").options[dom.byId("size").selectedIndex].innerHTML;
			ga('send', 'event', category, action, label, value, custom);
		}

			console.log("printing to "+result.url);
			if (result.url.indexOf('tif') > -1 || result.url.indexOf('svgz') > -1){
				//document.getElementById("printInst").innerHTML = "Click on the link below to download the image file.";
				document.getElementById("printMapLink").innerHTML = "<a href='"+result.url+"' title='exported map file' target='_blank'> map."+template.format.toLowerCase()+"</a>";
			}
			else {
				//document.getElementById("printInst").innerHTML = "Disable pop-up blocker. Printout will open in a new tab.";
				// 3-21-22 add try catch
				try{
					window.open(result.url,"_blank");
				}catch(e){
					console.log("Can't open printout in new window. Use link provided.");
				}
				document.getElementById("printMapLink").innerHTML = "<a href='"+result.url+"' title='exported map file' target='_blank'><span class='esri-icon-launch-link-external'></span> map."+template.format.toLowerCase()+"</a>";
			}
			for (i=0; i<pointWithText; i++) removeDrawItem(); // remove extra text layer added for points with text because of bug in PrintTask
			// Hide loading icon and change Printing... label back to Print.
			if (done){
				registry.byId("print_button").set("label", "Print");
				document.getElementById("printLoading").style.display="none";
			}
			done=true;
		}
		function printError(err){
			registry.byId("print_button").set("label", "Print");
			document.getElementById("printLoading").style.display="none";
			alert("Error printing with basemap, "+mapBasemap+". Error Code: "+err,"Code Error",err);
			document.getElementById("printMapLink").innerHTML = "";
			document.getElementById("printLegendLink").innerHTML = "";
			for (var i=0; i<pointWithText; i++) removeDrawItem(); // remove extra text layer added for points with text because of bug in PrintTask
		}
		function printResult2(result){
			console.log("printing legend to "+result.url);
			// 3-21-22 add try catch
			try{
				window.open(result.url,"_blank");
			}catch(e){
				console.log("Can't open printout in new window. Use link provided.");
			}
			if (done){
				registry.byId("print_button").set("label", "Print");
				document.getElementById("printLoading").style.display="none";
			}
			document.getElementById("printLegendLink").innerHTML = "<a href='"+result.url+"' target='_blank'><span class='esri-icon-launch-link-external'></span> legend."+template.format.toLowerCase()+"</a>";
			done = true;
		}
		function printError2(err){
			registry.byId("print_button").set("label", "Print");
			document.getElementById("printLoading").style.display="none";
			document.getElementById("printLegendLink").innerHTML = "";
			document.getElementById("printMapLink").innerHTML = "";
			if (err.details)
				alert("Error printing the legend: "+err+err.details,"Code Error");
			else
				alert("Error printing the legend","Code Error");
		}
		// END FUNCTIONS
		
			var i;
			var pointWithText = 0; // we need to add a layer to the map because of a bug in PrintTask, set this flag so we can remove it.
			//try{
			var done=false;
			var printLegendFlag = dom.byId("printLegendCB").style.display=="inline-block" ? true : false; // Is the legend checkbox displayed?
			if (!printLegendFlag) done=true; // turn off wait icon after printing map; don't wait for legend to print
			registry.byId("print_button").set("label", "Creating...");
			document.getElementById("printLoading").style.display="inline-block";
			document.getElementById("printMapLink").innerHTML = "";
			document.getElementById("printLegendLink").innerHTML = "";
			
			// get legend layers
			var layer = map.layers.items;//previewMap.getLayersVisibleAtScale();
			var legendArr = [];
			var legend;
			var countLayers=0;
			var j,k,m,n;
			for (i=0; i<layer.length; i++) {
				if (layer[i].visible &&
					(layer[i].id != "topo") &&
					(layer[i].id != "streets") &&
					(layer[i].id != "hybrid"))
				{
					if (layer[i].id.indexOf("drawgraphics") > 0) {
						// Point with text - the PrintTask obj has an error and does not include the text so we will add it to the map as a separate layer then remove it later.
						if (layer[i].graphics.length > 1 && layer[i].graphics[0].geometry.type == "point" && !layer[i].graphics[0].symbol.text) {
							pointWithText++;
							var point = new Point(layer[i].graphics[0].geometry.x, layer[i].graphics[0].geometry.y, map.spatialReference);
							var labelPoint = new Graphic(point);
							var drawGraphicsLayer = new GraphicsLayer();
							drawGraphicsLayer.id = "drawgraphics"+drawGraphicsCounter;
							drawGraphicsCount.push(drawGraphicsLayer.id);
							drawGraphicsCounter++;
							addLabel(labelPoint, layer[i].graphics[1].symbol.text, drawGraphicsLayer, "11pt"); // in utilFunc.js
						}
						continue;
					}
					if (layer[i].sublayers || layer[i].layers) {
						legend = new LegendLayer({
							title: layer[i].title,
							layerId: layer[i].title,
							subLayerIds: []
						});
						var firstLevel = layer[i];
						var secondLevel,thirdLevel,fourthLevel,fifthLevel;
						if (firstLevel.sublayers)
							secondLevel = firstLevel.sublayers.items;
						else
							secondLevel = firstLevel.layers.items;
						for(j=0; j<secondLevel.length;j++) {
							
							// traverse to the bottom of the visible sublayers. Add this id
							if(secondLevel[j].visible){
								if (secondLevel[j].sublayers || secondLevel[j].layers){
									if (secondLevel[j].sublayers)
										thirdLevel = secondLevel[j].sublayers.items;
									else if (secondLevel[j].layers)
										thirdLevel = secondLevel[j].layers.items;
									for(k=0; k<thirdLevel.length;k++){
										
										if(thirdLevel[k].visible){
											if (thirdLevel[k].sublayers || thirdLevel[k].layers){
												if (thirdLevel[k].sublayers)
													fourthLevel = thirdLevel[k].sublayers.items;
												else if (thirdLevel[k].layers)
													fourthLevel = thirdLevel[k].layers.items;
												for(m=0; m<fourthLevel.length;m++){
													
													if(fourthLevel[m].visible){
														if (fourthLevel[m].sublayers || fourthLevel[m].layers){
															if (fourthLevel[m].sublayers) fifthLevel = fourthLevel[m].sublayers.items;
															else fifthLevel = fourthLevel[m].layers.items;
															for(n=0; n<fifthLevel.length;n++){
																if(fifthLevel[n].visible){
																	if (fifthLevel[n].sublayers || fifthLevel[n].layers)alert("add one more group layer traversal in print.js to handle nested groups.");
																	else if (fifthLevel[n].layerId){
																		legend.title = fifthLevel[n].title;
																		legend.layerId = fifthLevel[n].layerId;
																		legend.subLayerIds.push(fifthLevel[n].layerId);
																	}
																	else legend.subLayerIds.push(fifthLevel[n].id);
																}
															}
														}else if(fourthLevel[m].layerId) legend.subLayerIds.push(fourthLevel[m].layerId);
														else legend.subLayerIds.push(fourthLevel[m].id);
													}
												}
											}else if (thirdLevel[k].layerId) legend.subLayerIds.push(thirdLevel[k].layerId);
											else legend.subLayerIds.push(thirdLevel[k].id);
												
										}
									}
								}else if (secondLevel[j].layerId) legend.subLayerIds.push(secondLevel[j].layerId);
								else legend.subLayerIds.push(secondLevel[j].id);
							}
						}

						legendArr.push(legend);
						legend = null;
						countLayers++;
					}
					/*else if (layer[i].type === "group"){
						legend = new LegendLayer({
							title: layer[i].title,
							layerId: layer[i].id,
							subLayerIds: []
							
						});
						var group = layer[i].layers.items;
						for(var l=0;l<group.length;l++){
							if (group[l].visible){
								if(group[l].type === "group"){
									var group2 = group[l].layers.items;
									for(var m=0;m<group2.length;m++){
										if (group2[m].visible){
											if (group2[m].type === "group"){
												var group3 = group2[m].layers.items;

												
												if (group2[m].sublayers){
													for(j=0; j<group2[m].sublayers.items.length;j++) {
														if(group2[m].sublayers.items[j].visible)
															legend.subLayerIds.push(group2[m].sublayers.items[j].id);
													}
												}
											} else legend.subLayerIds.push([group2[m].layerId]);
										}
									}
								}else{
									legend = new LegendLayer({
										title: group[l].title,
										layerId: group[l].id,
										subLayerIds: []
									});
									if (group[i].sublayers){
										for(j=0; j<group[l].sublayers.items.length;j++) {
											if(group[l].sublayers.items[j].visible)
												legend.subLayerIds.push(group[l].sublayers.items[j].id.toString());
										}
									}
									legendArr.push(legend);
									legend = null;
									countLayers++;									

								}

							}
						}
					}*/
					else{
						legend = new LegendLayer({
							title: layer[i].title,
							layerId: layer[i].id,
							subLayerIds: []
						});
						if (layer[i].layerId)
						legend.layerId=layer[i].layerId;
						legendArr.push(legend);
						legend = null;
						countLayers++;
					}
				}
			}
						
			var params = new PrintParameters();
			var template = new PrintTemplate();
			var orient = dom.byId("orient");
			var format = dom.byId("format");
			index = orient.selectedIndex;
			var selectedValue_orient = orient.options[index].value; // Portrait, Landscape
			var size = dom.byId("size");
			index = size.selectedIndex;
			var selectedValue_size = size.options[index].value; // Letter , Tabloid 
			template.exportOptions = { dpi: dpi }; //, width: parseInt(inchesWidth*dpi), height: parseInt(inchesHeight*dpi) };
			// Geo referenced pdf, jpg, gif, or geo referenced tiff
			if (format.options[format.selectedIndex].value != "pdf"){
				template.layout = app+" "+selectedValue_size+selectedValue_orient; // huntingatlas Letter Portrait
				//printTask = new PrintTask(printGeoServiceUrl);
				template.preserveScale = true; // true for legend to work. This is removed for the map in the python code in geo GP print service.
				var legendTemplate;
				done=true; // no legend
				template.format = format.options[format.selectedIndex].value;
				if (template.format != "geopdf"){
					legendTemplate="none";
					template.exportOptions = { dpi: dpi, width: parseInt(inchesWidth*dpi), height: parseInt(inchesHeight*dpi) };
				}
				else if (template.format=="geopdf" && !document.getElementById("printLegend").checked) {
					legendTemplate="none";
					template.format="pdf";
					// Cannot print only basemap with geopdf does not have georef info Warning Message
					if (countLayers == 0){
						alert("Printing of basemaps alone does not work. Please add map layers. From the menu, select 'Map Layers & Legend.'","Warning");
						registry.byId("print_button").set("label", "Print");
						document.getElementById("printLoading").style.display="none";
						document.getElementById("printMapLink").innerHTML = "";
						document.getElementById("printLegendLink").innerHTML = "";
						return;
					}
				}
				else {
					legendTemplate = "Legend Letter "+selectedValue_orient;
					template.format = "pdf";
				}
				params.extraParameters = {
					Georef_Info : "True",
					Legend_Template: legendTemplate
				};
			}
			// Regular pdf
			else {
				if (printLegendFlag && !document.getElementById("printLegend").checked) done=true; //no legend so turn off wait icon.
				//printTask = new PrintTask(printServiceUrl);
				template.preserveScale = true;
				template.format = format.options[format.selectedIndex].value.toUpperCase();
				if (selectedValue_size.indexOf("Letter")>-1)
					template.layout = selectedValue_size+"ANSI A "+selectedValue_orient; // Letter ANSI A Portrait
				else
					template.layout = selectedValue_size+"ANSI B "+selectedValue_orient; // Tabloid ANSI B Portrait
			}
			template.showAttribution = false;
			
			// Legend and Map in one PDF
			var titleTxt = document.getElementById("printTitle").value;
			if (format.options[format.selectedIndex].value=="geopdf") titleTxt += " (Geo PDF)";
			if (printLegendFlag && document.getElementById("printLegend").checked) { 
				template.layoutOptions = {
					titleText: titleTxt,
					authorText: prtDisclaimer,
					legendLayers: legendArr, // empty array means no legend
					customTextElements:  [
						{"Subtitle": document.getElementById("printSubTitle").value},
						{"Legend": legendArr}
					]
				};
			}
			// Map Only
			else {
				template.layoutOptions = {
					titleText: titleTxt,
					authorText: prtDisclaimer,
					legendLayers: [], // empty array means no legend
					customTextElements:  [
						{"Subtitle": document.getElementById("printSubTitle").value}
					]
				};
			}
			titleTxt=null;
			params.view = view;
			params.template = template;
				
			//Do not allow printing outside of Colorado
			/*if (!fullExtent.contains(map.extent)){
				alert ("Printing is only allowed for Colorado.","Warning");
				registry.byId("print_button").set("label", "Print");
				document.getElementById("printLoading").style.display="none";
				document.getElementById("printMapLink").innerHTML = "";
				document.getElementById("printLegendLink").innerHTML = "";
				return;
			}*/

			print.execute(printServiceUrl,params).then(printResult).catch(printError);
			// see how long it takes to generate the preview jpg. Display in Google Analytics and console
			startTim = Date.now();
			
			
			//************************
			//       Legend - open legend in separate pdf document for plain pdf format selection
			//************************
			if (format.options[format.selectedIndex].value=="pdf" && printLegendFlag && document.getElementById("printLegend").checked) {
				//var printTask2 = new PrintTask(printServiceUrl);
				var params2 = new PrintParameters();
				var template2 = new PrintTemplate();
				template2.exportOptions = { dpi: dpi };
				template2.layout = "Legend Letter "+selectedValue_orient;
				template2.format = "PDF";
				template2.layoutOptions = {
					titleText: document.getElementById("printTitle").value,
					authorText: prtDisclaimer,
					legendLayers: legendArr, // empty array means no legend
					customTextElements:  [
						{"Subtitle": document.getElementById("printSubTitle").value},
						{"Legend": legendArr}
					]
				};
				params2.view = view;
				params2.template = template2;
				print.execute(printServiceUrl,params2).then(printResult2).catch(printError2);
			}
		/*}
		catch(e){
			for (i=0; i<pointWithText; i++) removeDrawItem(); // remove extra text layer added for points with text because of bug in PrintTask
			alert("Error while printing: "+e.message,"Code Error",e);
			registry.byId("print_button").set("label", "Print");
			document.getElementById("printLoading").style.display="none";
		}*/
	});
}