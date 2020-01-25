function reportInit(){
	require(["dojo/dom","dijit/registry","dojo/sniff","dijit/form/Select", "esri/toolbars/draw","dojo/i18n!esri/nls/jsapi","esri/layers/GraphicsLayer","esri/geometry/Circle",
	"esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol","dojo/_base/Color", "esri/graphic",
	"dijit/Dialog","esri/map","dijit/form/Button","esri/graphicsUtils","esri/layers/ArcGISDynamicMapServiceLayer",
	"esri/tasks/PrintTask", "esri/tasks/PrintTemplate", "esri/tasks/PrintParameters","esri/urlUtils","esri/geometry/webMercatorUtils",
	 "esri/tasks/query","esri/tasks/QueryTask","dojo/promise/all"],
	function(dom,registry,has,Select,Draw,bundle,GraphicsLayer,Circle,SimpleMarkerSymbol,SimpleLineSymbol,SimpleFillSymbol,Color,Graphic,Dialog,Map,Button,
	graphicsUtils,ArcGISDynamicMapServiceLayer,PrintTask,PrintTemplate,PrintParameters,urlUtils,webMercatorUtils,Query,QueryTask,all){
		function pixels2pts(px) {
			return Math.round((px/dpi) * 72);
		}
		function pts2pixels(pts) {
			return Math.round((pts/72) * dpi);
		}
		function inches2pts(inches) {
			return Math.round(inches * 72);
		}

		function setMapValues(){
			marginTop = marginLeft;
			pageWidth = 792 - (2*marginLeft); // 11 inches * 72 - margins
			pageHeight = 612 - (marginTop); // height of page (8.5*72) - bottom margin
			mapWidthPxs = 3060;
			mapHeightPxs = 2175;
			mapWidthPts = pixels2pts(mapWidthPxs);
			mapHeightPts = pixels2pts(mapHeightPxs);
			var preview = new Dialog({
				id: "reportPreviewDialog",
				style: {width: (528*mapWidthPxs/mapHeightPxs)+14+"px", height:"666px", overflow:"none"},
				title: "Resource Report Preview",
				content: "<div data-dojo-type='dijit/layout/ContentPane'>"+
					"<button id='openReportBtn1' data-dojo-type='dijit/form/Button' role='presentation' type='button'>Open Report</button>"+
					"<button id='saveReportBtn1' data-dojo-type='dijit/form/Button' role='presentation' type='button'>Save Report</button>"+
					"<button id='cancelBtn1' data-dojo-type='dijit/form/Button' role='presentation' type='button'>Cancel</button>"+
					"<span id='reportMsg1'></span></div>"+
					"<div id='reportPreview' style='width:100%;height:100%;'></div>"+
					"<div><button id='openReportBtn2' data-dojo-type='dijit/form/Button' role='presentation' type='button'>Open Report</button>"+
					"<button id='saveReportBtn2' data-dojo-type='dijit/form/Button' role='presentation' type='button'>Save Report</button>"+
					"<button id='cancelBtn2' data-dojo-type='dijit/form/Button' role='presentation' type='button'>Cancel</button>"+
					"<span id='reportMsg2'></span></div>"
			});
			// set lods 4-21-17
						var customLods = [
				{
					"level": 6,
					"resolution": 2445.98490512499,
					"scale": 9244648.868618
				}, {
					"level": 7,
					"resolution": 1222.992452562495,
					"scale": 4622324.434309
				}, {
					"level": 8,
					"resolution": 611.4962262813797,
					"scale": 2311162.217155
				}, {
					"level": 9,
					"resolution": 305.74811314055756,
					"scale": 1155581.108577
				}, {
					"level": 10,
					"resolution": 152.87405657041106,
					"scale": 577790.554289
				}, {
					"level": 11,
					"resolution": 76.43702828507324,
					"scale": 288895.277144
				}, {
					"level": 12,
					"resolution": 38.21851414253662,
					"scale": 144447.638572
				}, {
					"level": 13,
					"resolution": 19.10925707126831,
					"scale": 72223.819286
				}, {
					"level": 14,
					"resolution": 9.554628535634155,
					"scale": 36111.909643
				},
				{
					"level": 15,
					"resolution": 4.77731426794937,
					"scale": 18055.954822
				},
				{
					"level": 16,
					"resolution": 2.388657133974685,
					"scale": 9027.977411
				},
				{
					"level": 17,
					"resolution": 1.1943285668550503,
					"scale": 4513.988705
				},
				{
					"level": 18,
					"resolution": 0.5971642835598172,
					"scale": 2256.994353
				}, {
					"level": 19,
					"resolution": 0.29858214164761665,
					"scale": 1128.497176
				}
			];
			reportMap = new Map("reportPreview",{
				showAttribution: false,
				style: {width:mapWidthPxs+"px", height:mapHeightPxs+"px", overflow:"auto"},
				autoResize: true,
				logo: false,
				isRubberBandZoom: true,
				isScrollWheelZoom: true,
				isShiftDoubleClick: true,
				displayGraphicsOnPan:! has("ie"),
				sliderStyle: "large",
				basemap: basemapUrl,
				minScale: 9244649,
				lods: customLods
			});
			
			reportPreviewGraphicsLayer = new GraphicsLayer();
			reportPreviewGraphicsLayer.id = "reportPreviewGraphicsLayer1";
			
			reportMap.on("load",function(){
				try {
					var myLayer = new ArcGISDynamicMapServiceLayer(mapService, {
						"opacity": 1,
						"id": "reportserviceurl",
						"visible": true
					});
					reportMap.addLayers([myLayer]); // calling addLayers will generate layers-add-result event to check for errors
					reportMap.addLayer(reportPreviewGraphicsLayer);
				}
				catch(e){
					alert("Error loading layers from "+app+"/ResourceReportWidget.xml. "+e.message, "Data Error");
				}
			});
			reportMap.on('layers-add-result',function(layer){
				var errFlag = false;
				try{
					for (var i=0; i<layer.layers.length; i++){
						if (layer.layers[i].error) {
							errFlag = true;
							alert("Problem loading layer: "+layer.layers[i].layer.url+ ". "+layer.layers[i].error.message+" in javascript/resourceReport.js. Check "+app+"/ResourceReportWidget.xml","Data Error");
						}
					}
				}
				catch(e){
					alert("Resource Report Error in reportMap.on(layers-add-result): "+e.message,"Code Error",e);
				}
			});
			// Fill report area buffer radius dropdown box
			var optList = [];
			for (var i=0; i<bufferList.length; i++){
				optList.push({label: bufferList[i], value: parseInt(bufferList[i])});
			}
			new Select(
			{
				id: "distCombo",
				value: bufferDist,
				sortByLabel: false,
				labelAttr: "label",
				style: {width: "50px"},
				onChange: function(){
					bufferDist = this.get("value");
					drawBuffer();
				},
				options: optList
			}, "reportDistCbo");
			document.getElementById("reportDistLabel").innerHTML=" "+bufferUnitsLabel+" buffer radius";
			optList=null;
			
			reportToolbar = new Draw(map, {showTooltips:true});
			reportToolbar.on("draw-end", reportDrawEnd);
			// Register click event handlers for buttons
			document.getElementById("reportLocBtn").addEventListener('click',function(event) {activateReportTool();});
			registry.byId("reportPrintBtn").on("click",reportPreview);
			registry.byId("reportPrintBtn").set('disabled',true);
			registry.byId("reportCancelBtn").on("click",reportCancel);
			registry.byId("reportCancelBtn").set("disabled",true);
			registry.byId("openReportBtn1").on("click",createPDF_EventHandler("open"));
			registry.byId("saveReportBtn1").on('click',createPDF_EventHandler("save"));
			registry.byId("openReportBtn2").on('click',createPDF_EventHandler("open"));
			registry.byId("saveReportBtn2").on('click',createPDF_EventHandler("save"));
			registry.byId("cancelBtn1").on('click',hidePreview);
			registry.byId("cancelBtn2").on('click',hidePreview);
			// listen for report widget close
			dom.byId("reportDiv").addEventListener('click',function(event){
				if (!registry.byId("reportDiv").open) reportCancel();
			});
		}
		function showWarning(tag) {
			// Show warning for required fields.
			alert("WARNING: In "+app+"/ResourceReportWidget.xml file, required value missing for the "+tag+".","Data Error");
		}
		
		function drawBuffer(){
			if (!centerPt) return;
			reportGraphicsLayer.clear();
			reportPreviewGraphicsLayer.clear(); // for changing buffer radius, erase old buffer
			circle = new Circle({
				center: centerPt,
				geodesic: true,
				radius: registry.byId("distCombo").get("value"),
				radiusUnit: "esriMiles"
			});
			var lineSymb = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0]), 2);
			var circleSymb = new SimpleFillSymbol(
			  SimpleFillSymbol.STYLE_SOLID,
			  lineSymb,
			  new Color([255, 255, 0, 0.1])
			);
			var circleSymb2 = new SimpleFillSymbol(
			  SimpleFillSymbol.STYLE_NULL,
			  lineSymb
			);
			var graphic = new Graphic(circle, circleSymb);
			var graphic2 = new Graphic(circle, circleSymb2);
			reportGraphicsLayer.add(graphic);
			reportPreviewGraphicsLayer.add(graphic2);
			// SimpleMarkerSymbol(style,size,outline,color)
			var plusSymb = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CROSS,20,lineSymb,new Color([0,0,0,1]));
			var plus = new Graphic(centerPt,plusSymb);
			reportGraphicsLayer.add(plus);
			graphic=null;
			lineSymb=null;
			circleSymb=null;
			plusSymb=null;
			plus=null;
			graphic2=null;
		}
		
		function reportDrawEnd(event){
			document.getElementById("reportLocBtn").className = "graphBtn";
			drawing=false;
			reportToolbar.deactivate();
			centerPt = event.geometry;
			drawBuffer();
			registry.byId("reportPrintBtn").set('disabled',false); // enable Open Report button
			registry.byId("reportCancelBtn").set('disabled',false);
		}
		function reportCancel(){
			document.getElementById("reportLocBtn").className = "graphBtn";
			drawing=false;
			reportToolbar.deactivate();
			reportGraphicsLayer.clear();
			reportPreviewGraphicsLayer.clear();
			// Enable Print/Save Report buttons
			registry.byId("openReportBtn1").set('disabled',false);
			registry.byId("saveReportBtn1").set('disabled',false);
			registry.byId("openReportBtn2").set('disabled',false);
			registry.byId("saveReportBtn2").set('disabled',false);
		}
		
		function activateReportTool(){
			// Draw point button was clicked.
			registry.byId("reportPrintBtn").set('disabled',true);
			registry.byId("reportCancelBtn").set('disabled',true);
			// Check if button was already depressed. If so reset to Identify
			if (document.getElementById("reportLocBtn").className == "graphBtnSelected") {
				reportCancel();
				return;
			}
			reportGraphicsLayer.clear();
			reportPreviewGraphicsLayer.clear();
			document.getElementById("reportLocBtn").className = "graphBtnSelected";
			drawing = true; // flag to turn off identify in identify.js, doIdentify()
			bundle.toolbars.draw.addPoint = "Click on location"; // change tooltip
			reportToolbar.activate(Draw.POINT);
		}
		function reportPreview(){
			// Google Analytics count how many times Resource Report is clicked on
			if (typeof ga === "function")ga('send', 'event', "resource_report", "click", "Resource Report", "1");
			
			document.getElementById("reportMsg1").innerHTML = msg;
			document.getElementById("reportMsg2").innerHTML = msg;
			// Enable Print/Save Report buttons
			registry.byId("openReportBtn1").set('disabled',false);
			registry.byId("saveReportBtn1").set('disabled',false);
			registry.byId("openReportBtn2").set('disabled',false);
			registry.byId("saveReportBtn2").set('disabled',false);
			// Zoom to the buffer
			var deferreds = reportMap.setExtent(graphicsUtils.graphicsExtent(reportPreviewGraphicsLayer.graphics),true);
			reportMap.centerAt(centerPt);
			registry.byId("reportPreviewDialog").set("title", "Resource Report Preview ("+registry.byId("distCombo").get("value")+" "+bufferUnitsLabel+" buffer radius)");
			registry.byId("reportPreviewDialog").show();
		}
		
		function hidePreview(){
			registry.byId("reportPreviewDialog").hide();
		}
		
		function createPDF_EventHandler(action){
			return function createPDF(evt){
				if (!centerPt) return;
				// disable Print/Save Report Buttons until report is finished.
				registry.byId("openReportBtn1").set('disabled',true);
				registry.byId("saveReportBtn1").set('disabled',true);
				registry.byId("openReportBtn2").set('disabled',true);
				registry.byId("saveReportBtn2").set('disabled',true);
				document.getElementById("reportMsg1").innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img src='assets/images/loading.gif' width='20px' height='20px'/> Generating tables for report...";
				document.getElementById("reportMsg2").innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img src='assets/images/loading.gif' width='20px' height='20px'/> Generating tables for report...";
				theAction = action;
				pageHeight = 612 - (marginTop); // reset
				doc = null;
				doc = new jsPDF("landscape","pt","letter");
				doc.onerror = function(){
					document.getElementById("reportMsg1").innerHTML = msg;
					document.getElementById("reportMsg2").innerHTML = msg;
					alert("Error generating PDF for resource report.","Code Error");
					// Enable Print/Save Report buttons
					registry.byId("openReportBtn1").set('disabled',false);
					registry.byId("saveReportBtn1").set('disabled',false);
					registry.byId("openReportBtn2").set('disabled',false);
					registry.byId("saveReportBtn2").set('disabled',false);
				};
				
				var y = marginTop+20;
				var pageNo = 1;
				var lineHt = 14;
				var fontsize = 12;
				var colMarginLeft = 300;
				var myFont = "arial";
				doc.setProperties({
					title: reportTitle,	
					author: 'Colorado Parks and Wildlife',
					keywords: 'hunting, fishing, atlas, ndis'
				});
 
				// Title
				doc.setFontSize(22);
				doc.setFont(myFont,"bold");
				doc.text(marginLeft, y, reportTitle);
				y += 22;
				// Date
				doc.setFont(myFont,"normal");
				doc.setFontSize(fontsize);
				var mo={Jan:"January",Feb:"February",Mar:"March",Apr:"April",May:"May",Jun:"June",Jul:"July",Aug:"August",Sep:"September",Oct:"October",Nov:"November",Dec:"December"};
				today = new Date();
				today = today.toDateString();
				if (today.substr[8] == "0")
					today = mo[today.substr(4,3)]+" "+today.substr(9,1) + "," + today.substr(today.length-5,today.length);
				else
					today = mo[today.substr(4,3)]+" "+today.substr(8,2) + "," + today.substr(today.length-5,today.length);
				doc.text(marginLeft, y, today);
				y += lineHt;
				// XY
				doc.text(marginLeft, y, 'X/Y at map click:');
				var dd = webMercatorUtils.webMercatorToGeographic(centerPt);
				doc.text(colMarginLeft, y, dd.y.toFixed(5)+" N, "+-1*dd.x.toFixed(5)+" W");
				y += lineHt;
				
				// Add reports
				var query=[], queryTask=[], promises;
				var queries = [];
				var q=0, poiIndex, contactIndex, gameIndex, layersIndex;
				if (queryLayers.pointsOfInterest) {
					queryTask[q] = new QueryTask(queryLayers.pointsOfInterest.url);
					query[q] = new Query();
					// use fast bounding box query. Will only go to the server if bounding box is outside of the visible map.
					// then filter later.
					query[q].geometry = circle.getExtent();
					query[q].returnGeometry = true;
					query[q].spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
					query[q].outFields = ["*"]; 
					queries.push(queryTask[q].execute(query[q]));
					poiIndex = q;
					q++;
				}
				if (queryLayers.contactBoundaries){
				
					query[q] = new Query();
					queryTask[q] = new QueryTask(queryLayers.contactBoundaries.url);
					query[q].geometry = circle.getExtent();
					query[q].returnGeometry = true;
					query[q].spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
					query[q].outFields = ["*"]; 
					query[q].geometry = centerPt;
					queries.push(queryTask[q].execute(query[q]));
					contactIndex = q;
					q++;
				}
				if (queryLayers.gameBoundaries) {
					query[q] = new Query();
					queryTask[q] = new QueryTask(queryLayers.gameBoundaries.url);
					query[q].geometry = circle.getExtent();
					query[q].returnGeometry = true;
					query[q].spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
					query[q].outFields = ["*"]; 
					query[q].geometry = centerPt;
					queries.push(queryTask[q].execute(query[q]));
					gameIndex = q;
					q++;
				}
				for (var i=0; i<queryLayers.layers.length; i++) {
					layersIndex = q;
					//if (queryLayers.layers[i].type.toLowerCase() == "poly") {
						queryTask[q] = new QueryTask(queryLayers.layers[i].url);
						query[q] = new Query();
						// use fast bounding box query. Will only go to the server if bounding box is outside of the visible map.
						// then filter later. Have to set returnGeometry to true!!!
						query[q].geometry = circle.getExtent();
						query[q].returnGeometry = true;
						query[q].spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
						query[q].outFields = ["*"];
						queries.push(queryTask[q].execute(query[q]));
						q++;
					/*}
					else {
						queryTask[q] = new QueryTask(queryLayers.layers[i].url);
						query[q] = new Query();
						query[q].geometry = centerPt;
						query[q].returnGeometry = true;
						query[q].spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
						query[q].outFields = ["*"];
						queries.push(queryTask[q].execute(query[q]));
						q++;
					}*/
				}
				// Register the event handlers
				if (queries.length > 0) {
					promises = all(queries);
					promises.then(queryCompleteHandler);
					promises.otherwise(queryFaultHandler);
				}
				
				function queryCompleteHandler(results){
					// Write the report text		
					var inBuffer,CGblm,CGcpw,CGparks,CGusfs;
					if (queryLayers.gameBoundaries) {
						// Location & Contact Info
						y += lineHt;
						doc.setFontSize(16);
						doc.setFont(myFont,"bold");
						doc.text(marginLeft, y, "Location & Contact Information:");
						// County
						y += lineHt;
						doc.setFont(myFont,"normal");
						doc.setFontSize(fontsize);
						doc.text(marginLeft, y, "County:");
						doc.text(colMarginLeft, y, results[gameIndex].features[0].attributes.COUNTY);
						// GMU
						y += lineHt;
						doc.text(marginLeft, y, "Game Mgt. Unit (GMU):");
						doc.text(colMarginLeft, y, results[gameIndex].features[0].attributes.GMUID.toString());
					}
					if (queryLayers.contactBoundaries){
						// Sheriff
						y += lineHt;
						doc.text(marginLeft, y, "Sheriff Phone:");
						doc.text(colMarginLeft, y, results[contactIndex].features[0].attributes.Sheriff_FOPhone);
						
						// CPW
						y += lineHt*2;
						doc.setFont(myFont,"bold");
						doc.text(marginLeft, y, "CPW");
						doc.setLineWidth(0.5);
						doc.line(marginLeft,y+1,marginLeft+27, y+1);
						y += lineHt;
						doc.setFont(myFont,"normal");
						doc.setFontSize(fontsize);
						doc.text(marginLeft, y, "CPW Area:");
						doc.text(colMarginLeft, y, results[contactIndex].features[0].attributes.CDOW_Area);
						y += lineHt;
						doc.text(marginLeft, y, "CPW District:");
						doc.text(colMarginLeft, y, results[contactIndex].features[0].attributes.CDOW_District);
						y += lineHt;
						doc.text(marginLeft, y, "CPW Field Office:");
						doc.text(colMarginLeft, y, results[contactIndex].features[0].attributes.CDOW_FOName);
						y += lineHt;
						doc.text(marginLeft, y, "CPW Field Office Address:");
						doc.text(colMarginLeft, y, results[contactIndex].features[0].attributes.CDOW_FOAddress);
						y += lineHt;
						doc.text(marginLeft, y, "CPW Field Office City, Zip:");
						doc.text(colMarginLeft, y, results[contactIndex].features[0].attributes.CDOW_FOCity+", CO "+results[contactIndex].features[0].attributes.CDOW_FOZipcode);
						y += lineHt;
						doc.text(marginLeft, y, "CPW Field Office Phone:");
						doc.text(colMarginLeft, y, results[contactIndex].features[0].attributes.CDOW_FOPhone);
						
						// BLM
						y += lineHt*2;
						doc.setFont(myFont,"bold");
						doc.text(marginLeft, y, "BLM");
						doc.setLineWidth(0.5);
						doc.line(marginLeft,y+1,marginLeft+27, y+1);
						y += lineHt;
						doc.setFont(myFont,"normal");
						doc.setFontSize(fontsize);
						doc.text(marginLeft, y, "BLM District:");
						doc.text(colMarginLeft, y, results[contactIndex].features[0].attributes.BLM_District);
						y += lineHt;
						doc.text(marginLeft, y, "BLM Field Office:");
						doc.text(colMarginLeft, y, results[contactIndex].features[0].attributes.BLM_FOName);
						y += lineHt;
						doc.text(marginLeft, y, "BLM Field Office Address:");
						doc.text(colMarginLeft, y, results[contactIndex].features[0].attributes.BLM_FOAddress);
						y += lineHt;
						doc.text(marginLeft, y, "BLM Field Office City, Zip:");
						doc.text(colMarginLeft, y, results[contactIndex].features[0].attributes.BLM_FOCity+", CO "+results[contactIndex].features[0].attributes.BLM_FOZipcode);
						y += lineHt;
						doc.text(marginLeft, y, "BLM Field Office Phone:");
						doc.text(colMarginLeft, y, results[contactIndex].features[0].attributes.BLM_FOPhone);

						// USFS
						y += lineHt*2;
						doc.setFont(myFont,"bold");
						doc.text(marginLeft, y, "USFS");
						doc.setLineWidth(0.5);
						doc.line(marginLeft,y+1,marginLeft+34, y+1);
						if (results[contactIndex].features[0].attributes.USFS_FOName){
							y += lineHt;
							doc.setFont(myFont,"normal");
							doc.setFontSize(fontsize);
							doc.text(marginLeft, y, "Forest:");
							doc.text(colMarginLeft, y, results[contactIndex].features[0].attributes.NF_NG_NAME);//USFS_District);
							y += lineHt;
							doc.text(marginLeft, y, "Forest Field Office:");
							// wrap text
							var txt = doc.setFontSize(fontsize).splitTextToSize(results[contactIndex].features[0].attributes.USFS_FOName,390,{fontName:"arial",fontStyle:"normal"});
							doc.text(colMarginLeft, y, txt);
							// if wrapped text add and extra line
							if (txt.length>1)y += lineHt;
							y += lineHt;
							doc.text(marginLeft, y, "Forest Field Office Address:");
							doc.text(colMarginLeft, y, results[contactIndex].features[0].attributes.USFS_FOAddress);
							y += lineHt;
							doc.text(marginLeft, y, "Forest Field Office City, Zip:");
							doc.text(colMarginLeft, y, results[contactIndex].features[0].attributes.USFS_FOCity+", CO "+results[contactIndex].features[0].attributes.USFS_FOZipcode);
							y += lineHt;
							doc.text(marginLeft, y, "Forest Field Office Phone:");
							doc.text(colMarginLeft, y, results[contactIndex].features[0].attributes.USFS_FOPhone);
						}
					}
					if (queryLayers.pointsOfInterest){
						CGblm = [];
						CGcpw = [];
						CGparks = [];
						CGusfs = [];
						ResMed = [];
						ResSheriff = [];
						ResLicAg = [];
						ResStPatrol = [];
						ResBLMOff = [];
						ResForOff = [];
						ResCPWOff = [];
						ResChamber = [];
						ResWelcome = [];
						for (var p = 0; p < results[poiIndex].features.length; p++) {
							feature = results[poiIndex].features[p];
							attr = results[poiIndex].features[p].attributes;
							if(circle.contains(feature.geometry)){
								// Campgrounds							
								if (attr.Type.toLowerCase() == "campground"){ 
									if (attr.Manager == "BLM") {
										CGblm.push ({
											property: attr.CGPropertyName ? attr.CGPropertyName : attr.CGPropertyName2,
											name: attr.Name,
											website: attr.URL1
										});
									}
									else if (attr.Manager == "CPW" || attr.Manager == "CDOW") {
										CGcpw.push ({
											property: attr.CGPropertyName ? attr.CGPropertyName : attr.CGPropertyName2,
											name: attr.Name,
											website: attr.URL1
										});
									}
									else if (attr.Manager == "State Parks") {
										CGparks.push ({
											property: attr.CGPropertyName ? attr.CGPropertyName : attr.CGPropertyName2,
											name: attr.Name,
											website: attr.URL1
										});
									}
									else if (attr.Manager == "USFS") {
										CGusfs.push ({
											property: attr.CGPropertyName ? attr.CGPropertyName : attr.CGPropertyName2,
											name: attr.Name,
											website: attr.URL1
										});
									}
								}
								// Resources
								else {
									if (attr.Type.toLowerCase() == "license agent") {
										ResLicAg.push ({
											name: attr.Name,
											address: attr.Address,
											city: attr.City,
											phone: attr.Phone
										});
									}
									else if (attr.Type.toLowerCase() == "medical") {
										ResMed.push ({
											name: attr.Name,
											address: attr.Address,
											city: attr.City,
											phone: attr.Phone
										});
									}
									else if (attr.Type.toLowerCase() == "sheriff") {
										ResSheriff.push ({
											name: attr.Name,
											address: attr.Address,
											city: attr.City,
											phone: attr.Phone
										});
									}
									else if (attr.Type.toLowerCase() == "state patrol") {
										ResStPatrol.push ({
											name: attr.Name,
											address: attr.Address,
											city: attr.City,
											phone: attr.Phone
										});
									}
									else if (attr.Type.toLowerCase() == "blm field office") {
										ResBLMOff.push ({
											name: attr.Name,
											address: attr.Address,
											city: attr.City,
											phone: attr.Phone
										});
									}
									else if (attr.Type.toLowerCase() == "forest service office") {
										ResForOff.push ({
											name: attr.Name,
											address: attr.Address,
											city: attr.City,
											phone: attr.Phone
										});
									}
									else if ((attr.Type.toLowerCase() == "cdow office") || (attr.Type.toLowerCase() == "cpw office")) {
										ResCPWOff.push ({
											name: attr.Name,
											address: attr.Address,
											city: attr.City,
											phone: attr.Phone
										});
									}
									else if (attr.Type.toLowerCase() == "chamber of commerce") {
										ResChamber.push ({
											name: attr.Name,
											address: attr.Address,
											city: attr.City,
											phone: attr.Phone
										});
									}
									else if (attr.Type.toLowerCase() == "welcome center") {
										ResWelcome.push ({
											name: attr.Name,
											address: attr.Address,
											city: attr.City,
											phone: attr.Phone
										});
									}
								}
							}
						}
						var header;
						// campground report
						if (CGblm.length > 0 || CGcpw.length > 0 || CGparks.length > 0 || CGusfs.length > 0){
							// Sort
							CGblm.sort(sortMultipleArryOfObj("property", "name"));
							CGcpw.sort(sortMultipleArryOfObj("property", "name"));
							CGparks.sort(sortMultipleArryOfObj("property", "name"));
							CGusfs.sort(sortMultipleArryOfObj("property", "name"));
							footer();
							y = marginTop + 14;
							doc.addPage();
							doc.setFontSize(16);
							doc.setFont(myFont,"bold");
							doc.text(marginLeft, y, "Campsites within " + bufferDist + " miles of map click:");
							doc.setFontSize(fontsize);
							y+=lineHt*2;
							// Campsites
							header=[];
							header.push({
								displayname: "Property",
								field: "property",
								width: 200
							});
							header.push({
								displayname: "Name",
								field: "name",
								width: 200
							});
							header.push({
								displayname: "Website",
								field: "website",
								width: pageWidth-400
							});
							// create tables: grid(title, underline width in points, data, header, y)
							grid("BLM",CGblm,header);
							grid("CPW",CGcpw,header);
							grid("State Parks",CGparks,header);
							grid("USFS",CGusfs,header);
						}
						
						// Resources Report
						if (ResChamber.length > 0 || ResBLMOff.length > 0 || ResCPWOff.length > 0 || ResForOff.length > 0 ||
						  ResLicAg.length > 0 || ResMed.length > 0 || ResSheriff.length > 0 || ResStPatrol.length > 0 ||
						  ResWelcome.length > 0) {
							ResMed.sort(sortMultipleArryOfObj("city", "name"));
							ResSheriff.sort(sortMultipleArryOfObj("city", "name"));
							ResLicAg.sort(sortMultipleArryOfObj("city", "name"));
							ResStPatrol.sort(sortMultipleArryOfObj("city", "name"));
							ResBLMOff.sort(sortMultipleArryOfObj("city", "name"));
							ResForOff.sort(sortMultipleArryOfObj("city", "name"));
							ResCPWOff.sort(sortMultipleArryOfObj("city", "name"));
							ResChamber.sort(sortMultipleArryOfObj("city", "name"));
							ResWelcome.sort(sortMultipleArryOfObj("city", "name"));
							footer();
							y = marginTop+14;
							doc.addPage();
							doc.setFontSize(16);
							doc.setFont(myFont,"bold");
							doc.text(marginLeft, y, "Information resources within " + bufferDist + " miles of map click:");
							y += lineHt*2;
							header=null;
							header=[];
							header.push({
								displayname: "Name",
								field: "name",
								width: (pageWidth-220)/2
							});
							header.push({
								displayname: "Address",
								field: "address",
								width: (pageWidth-220)/2
							});
							header.push({
								displayname: "City",
								field: "city",
								width: 120
							});
							header.push({
								displayname: "Phone",
								field: "phone",
								width: 100
							});
							grid("Chamber of Commerce",ResChamber,header);
							grid("BLM Office",ResBLMOff,header);
							grid("CPW Office",ResCPWOff,header);
							grid("Forest Service Office",ResForOff,header);
							grid("License Agent",ResLicAg,header);
							grid("Medical",ResMed,header);
							grid("Sheriff",ResSheriff,header);
							grid("State Patrol",ResStPatrol,header);
							grid("Welcome Center",ResWelcome,header);
						}
					}

					if(reports.length>0){
						// if printed some reports add a page break
						if (queryLayers.gameBoundaries || queryLayers.contactBoundaries || queryLayers.pointsOfInterest){ 
							footer();
							y = marginTop+14;
							doc.addPage();
						}
						else y+=lineHt;
						customReports(results);
					}
					else {
						footer();
						// Add map
						addMap();
						
					}
				}
				function customReports(results){
					// print first title
					doc.setFontSize(16);
					doc.setFont(myFont,"bold");
					doc.text(marginLeft, y, reports[0].title.replace("_distance_",bufferDist));
					doc.setFontSize(fontsize);
					doc.setFont(myFont,"normal");
					reports[0].title="";
					y+=lineHt*2;
					// handle database calls
					if (numDatabaseCalls > 0){
						// Clear old database call info
						// global variables: index and XMLHttpRequestObjects
						index = 0; // index for http requests
						while (XMLHttpRequestObjects.length > 0) {
							XMLHttpRequestObjects.pop();
						}
						tableQuery(results);
					}
					else // no database calls
						addReports(results);
					
					function tableQuery(results){
						// if there are database calls use http request to call each and add to results array
						var r=0; // index for results array
						if (queryLayers.gameBoundaries) r++;
						if (queryLayers.contactBoundaries) r++;
						if (queryLayers.pointsOfInterest) r++;
						processedDatabaseCalls = 0;
						for (var i=0; i<reports.length; i++) {
							if (reports[i].database && reports[i].database != ""){
								// handle all database calls, then call addReports
								// createMultiXMLhttpRequest is found in javascript/xmlUtils.js.
								// It will increment index.
								createMultiXMLhttpRequest();
								var keyField = reports[i].keyField;
								var key = "";
								// Build a string of keys: 1,2,3...
								for (var j=0; j<results[r].features.length; j++) {
									if (results[r].features[j].attributes[keyField] && results[r].features[0].attributes[keyField] != "")
										if (j==0) key = results[r].features[j].attributes[keyField];
										else key += ","+results[r].features[j].attributes[keyField];
								}
								// if no data check if we are done
								if (key == "") {
									processedDatabaseCalls ++;
									if (numDatabaseCalls == processedDatabaseCalls){
										addReports(results);
										return;
									}
									r++;
									continue;
								}
								var url = reports[i].database+"?v="+ndisVer+"&key="+key;
								 
								XMLHttpRequestObjects[index].open("POST",url,true); // configure object (method, url, async)
								// register a function to run when the state changes, if the request
								// has finished and the stats code is 200 (OK) write result
								XMLHttpRequestObjects[index].onreadystatechange = function(arrIndex){ return function() { 
									if (XMLHttpRequestObjects[arrIndex].readyState == 4) {
										if (XMLHttpRequestObjects[arrIndex].status == 200) {
											var xmlDoc = createXMLdoc(XMLHttpRequestObjects[arrIndex]);
											// Find the index for results and reports arrays by matching url and keys
											var resultsIndex=-1;
											for (var j=0; j<reports.length; j++){
												// If same number of keys and key field found and same keys
												var found=false;
												if (results[j].features.length == xmlDoc.getElementsByTagName("NewDataSet").length) {
													if (xmlDoc.getElementsByTagName(reports[j].keyField).length>0){
														// Get the keys from this xmlHttpRequest
														var keys=[];
														for (var h=0; h<results[j].features.length; h++) {
																if (!xmlDoc.getElementsByTagName("NewDataSet")[h].getElementsByTagName(reports[j].keyField)[0])
																	keys.push("undefined");// no data for this key
																else
																	keys.push(xmlDoc.getElementsByTagName("NewDataSet")[h].getElementsByTagName(reports[j].keyField)[0].childNodes[0].nodeValue);
														}
														found = true;
														// See if keys match
														for (h=0; h<results[j].features.length; h++) {
															if (keys[h] == "undefined") continue;
															if (keys[h] != results[j].features[h].attributes[reports[j].keyField]) {
																found=false;
																break;
															}
														}
													}
												}
												if (found) {
													resultsIndex = j;
													break;
												}
											}
											if (resultsIndex == -1) {
												alert("Cannot find index for the XMLHttpRequest in javascript/resourceReport.js tableQuery(). ", "Code Error");
												return;
											}
											processedDatabaseCalls ++;								
											
											if (xmlDoc.childNodes[0].innerHTML && xmlDoc.childNodes[0].innerHTML.indexOf("error") > -1){
												alert("Resource report error in database lookup. URL="+url+". "+xmlDoc.childNodes[0].innerHTML, "Data Error"); 
												if (processedDatabaseCalls == numDatabaseCalls)
													addReports(results);
												return;
											}
											// for IE
											if (xmlDoc.childNodes[0].textContent && xmlDoc.childNodes[0].textContent.indexOf("error") > -1){
												alert("Resource report error in database lookup. URL="+url+". "+xmlDoc.childNodes[0].textContent, "Data Error"); 
												if (processedDatabaseCalls == numDatabaseCalls)
													addReports(results);
												return;
											}
											var m;
											for (j=0; j<xmlDoc.getElementsByTagName("NewDataSet").length; j++) {
												// newDataSet contains all the keys for one location
												var newDataSet = xmlDoc.getElementsByTagName("NewDataSet")[j];
												// check for empty <NewDataSet />
												if (newDataSet.getElementsByTagName(reports[resultsIndex].keyField).length == 0) continue;
												// if keys don't match we have a problem
												if (newDataSet.getElementsByTagName(reports[resultsIndex].keyField)[0].childNodes[0].nodeValue != results[resultsIndex].features[j].attributes[reports[resultsIndex].keyField]) {
													alert("Resource report error in database lookup. Key fields do not match. "+newDataSet.getElementsByTagName(reports[resultsIndex].keyField)[0].childNodes[0].nodeValue+" != "+results[resultsIndex].features[j].attributes[reports[resultsIndex].keyField],"Data Error");
												}
												// add one2one fields and values to results array
												if (reports[resultsIndex].one2one_fields && reports[resultsIndex].one2one_fields != "") {
													for (m=0; m<reports[resultsIndex].one2one_fields.length; m++){
														if (newDataSet.getElementsByTagName(reports[resultsIndex].one2one_fields[m])[0] &&
															newDataSet.getElementsByTagName(reports[resultsIndex].one2one_fields[m])[0].childNodes[0] &&
															(newDataSet.getElementsByTagName(reports[resultsIndex].one2one_fields[m])[0].childNodes[0].nodeValue != "")) {
															results[resultsIndex].features[j].attributes[reports[resultsIndex].one2one_fields[m]] = newDataSet.getElementsByTagName(reports[resultsIndex].one2one_fields[m])[0].childNodes[0].nodeValue.toString();
														}
													}
												}
												// add bulleted list of one2many values to results array
												if (reports[resultsIndex].one2many_fields && reports[resultsIndex].one2many_fields != ""){
													for (m=0; m<reports[resultsIndex].one2many_fields.length; m++){
														var manyArr=[];
														// loop through each key
														for (var n=0; n<newDataSet.getElementsByTagName(reports[resultsIndex].filename).length; n++){
															var thiskey = newDataSet.getElementsByTagName(reports[resultsIndex].filename)[n];
															// make sure it is not blank or null
															if (thiskey.getElementsByTagName(reports[resultsIndex].one2many_fields[m])[0] &&
																thiskey.getElementsByTagName(reports[resultsIndex].one2many_fields[m])[0].childNodes[0] &&
																(thiskey.getElementsByTagName(reports[resultsIndex].one2many_fields[m])[0].childNodes[0].nodeValue != "")){
																manyArr.push(thiskey.getElementsByTagName(reports[resultsIndex].one2many_fields[m])[0].childNodes[0].nodeValue.toString());
															}
														}
														manyArr.sort(); // sort the bulleted list
														// add * for the bullet and line returns
														for (var g=0; g<manyArr.length; g++){
															// if this is the first bullet point do not do a carriage return
															if (g == 0) 
																results[resultsIndex].features[j].attributes[reports[resultsIndex].one2many_fields[m]] = "* "+manyArr[g];
															else  
																results[resultsIndex].features[j].attributes[reports[resultsIndex].one2many_fields[m]]+= "\n* "+manyArr[g];
														}
														manyArr = null;
													}
												}											
											}
											if (numDatabaseCalls == processedDatabaseCalls)
												addReports(results);
										}
									
										// if failed
										else {
											if (XMLHttpRequestObjects[arrIndex].status == 404){
												alert ("Resource Report database lookup failed. Too many resources found. Try a smaller area. Status 404: file not found or not able to process.","Warning");
												if (processedDatabaseCalls == numDatabaseCalls)
													addReports(results);
												hideLoading();
											}
											else{
												alert ("Resource Report database lookup failed for URL="+XMLHttpRequestObjects[arrIndex].responseURL+". (Note IE does not report the URL please use Chrome or Firefox.) Make sure it exists and does not have errors. Must be on the same machine. Edit "+app+"/ResourceReportWidget.xml.","Data Error");
												if (processedDatabaseCalls == numDatabaseCalls)
													addReports(results);
												hideLoading();
											}
										}
									}
								};}(index);
								XMLHttpRequestObjects[index].send();
							}
							r++; // increment results array
						}
						
					}
					function addReports(results){
						var i=0; // index for results array
						// if there were hunting reports increment index
						if (queryLayers.gameBoundaries) i++;
						if (queryLayers.contactBoundaries) i++;
						if (queryLayers.pointsOfInterest) i++;
						for(var r=0; r<reports.length; r++){		
							// main title	
							if (reports[i].title && reports[i].title != ""){
								footer();
								y = marginTop+14;
								doc.addPage();
								doc.setFontSize(16);
								doc.setFont(myFont,"bold");
								doc.text(marginLeft, y, reports[i].title.replace("_distance_",bufferDist));
								doc.setFontSize(fontsize);
								doc.setFont(myFont,"normal");
								y+=lineHt*2;
							}
							
							//create table for report
							var table=[];
							var colWidths=[];
							// Set column widths to at least the width of the header title
							for (var j=0; j<reports[i].displayfields.length; j++){
								colWidths[j] = reports[i].displayfields[j];
							}
							for (var p = 0; p < results[i].features.length; p++) {
								feature = results[i].features[p];
								attr = feature.attributes;
								//if point is in the circle
								if((feature.geometry.type == "point" && circle.contains(feature.geometry)) ||
									feature.geometry.type != "point"){
									var obj={};
									// Find the maximum width for each column
									for (j=0; j<reports[i].displayfields.length; j++){
										if ((!colWidths[j] && attr[reports[i].fields[j]]) || (attr[reports[i].fields[j]] &&
											(colWidths[j].length < attr[reports[i].fields[j]].toString().length))){
											// If this is a bulleted list with carriage returns check length of each bullet
											if (attr[reports[i].fields[j]].toString().indexOf("\n")>-1){
												var bullets=attr[reports[i].fields[j]].toString().split("\n");
												for (var b=0; b<bullets.length; b++)
													if (!colWidths[j] || (colWidths[j].length < bullets[b].length)) colWidths[j] = bullets[b];
											}
											else
												colWidths[j]=attr[reports[i].fields[j]].toString();
										}
									}
									// not a database lookup
									if (reports[i].where_field && reports[i].where_field != ""){ 
										var whereValue, value;
										if (reports[i].where_type.toLowerCase() == "number"){
											whereValue = parseFloat(reports[i].where_value);
											value = parseFloat(attr[reports[i].where_field]);
										}
										else {
											whereValue = reports[i].where_value.toLowerCase();
											value = attr[reports[i].where_field].toLowerCase();
										}
										switch (reports[i].where_inequality){
											case "equal":
												if (value == whereValue){
													for (j=0; j<reports[i].displayfields.length; j++){
														obj[reports[i].fields[j]] = attr[reports[i].fields[j]];
													}
													table.push(obj);
													obj=null;
												}
												break;
											case "not_equal":
												if (value != whereValue){
													for (j=0; j<reports[i].displayfields.length; j++){
														obj[reports[i].fields[j]] = attr[reports[i].fields[j]];
													}
													table.push(obj);
													obj=null;
												}
												break;
											case "less_than":
												if (value < whereValue){
													for (j=0; j<reports[i].displayfields.length; j++){
														obj[reports[i].fields[j]] = attr[reports[i].fields[j]];
													}
													table.push(obj);
													obj=null;
												}
												break;
											case "greater_than":
												if (value > whereValue){
													for (j=0; j<reports[i].displayfields.length; j++){
														obj[reports[i].fields[j]] = attr[reports[i].fields[j]];
													}
													table.push(obj);
													obj=null;
												}
												break;
											default:
												alert("Error in "+app+"/ResourceReportWidget.xml file in report tag, id="+reports[i].id+" where_inequality must be: equal, not_equal, less_than, or greater_than.","Data Error");
										}
										
									}
									// did a database lookup
									else {
										for (j=0; j<reports[i].displayfields.length; j++){
											obj[reports[i].fields[j]] = attr[reports[i].fields[j]];
										}
										table.push(obj);
										obj=null;
									}
								}
								
							}
							
							// Adjust column widths. colWidths[j] holds the longest text from all rows.
							var totalWidth=0; // width of all columns
							var maxColWidth=200; // in points
							for (j=0; j<colWidths.length; j++){
								// convert text length to distance in points
								colWidths[j] = 10+Math.round(doc.getStringUnitWidth(colWidths[j])*fontsize/doc.internal.scaleFactor);
								if (colWidths[j] > maxColWidth) colWidths[j]=maxColWidth;
								totalWidth += colWidths[j];
							}
							var newTotal = 0; // total width of all columns after adjustments
							// Columns narrower than page width. Divide the extra among the columns.
							if (pageWidth > totalWidth) {
								var inc = Math.round((pageWidth-totalWidth)/colWidths.length); // increment amount
								for (j=0; j<colWidths.length; j++){
									colWidths[j] += inc;
									newTotal += colWidths[j];
								}
								// Adjust any rounding errors by adding to first column
								if (newTotal != pageWidth) colWidths[0] += pageWidth - newTotal;
							}
							// Columns wider than page. Subtract a weighted average from each column
							else if (pageWidth < totalWidth) {
								var dec = pageWidth-totalWidth; // decrement amount
								for (j=0; j<colWidths.length; j++){
									colWidths[j] += Math.round(colWidths[j]/totalWidth * dec);
									newTotal += colWidths[j];
								}
								// Adjust any rounding errors by adding to first column
								if (newTotal != pageWidth) colWidths[0] += pageWidth - newTotal;
							}
							
							// create header for report
							var header=[];
							for (j=0; j<reports[i].displayfields.length; j++){
								header.push({
									displayname: reports[i].displayfields[j],
									field: reports[i].fields[j],
									width: colWidths[j]
								});
							}
							if (table.length > 0){
								table.sort(sortMultipleArryOfObj(reports[i].sortfields));
								grid(reports[i].subtitle,table,header);
							}
							i++;
							colWidths=null;
							header=null;
						}
						footer();
						// Add map
						addMap();
					}
				}
				
				function queryFaultHandler(error) {
					console.log("in queryFaultHandler");
				}
				
				function grid(title, arr, header) {
					// draw a table, check for new page
					// arr is and array of data
					// header is and array of the header fields
					function printHeader(){
						// title
						doc.setFont(myFont,"bold");
						doc.setFontSize(fontsize);
						doc.myText(marginLeft, y, title, {underline: true});
						// header - grey outlined box with text
						y += 5;
						doc.setFillColor(204,204,204); // CCCCCC
						doc.setDrawColor(0);
						doc.rect(marginLeft,y,pageWidth,rowHt,'FD'); // Fill and outline rectangle
						var x = marginLeft+4;
						doc.setFont(myFont,"normal");
						y += lineHt;
						// add vertical lines between header column names
						for (var i=0; i<header.length; i++) {
							if(header[i].displayname)
								doc.text(x,y,header[i].displayname);
							x += header[i].width;
							if (i<header.length-1)
								doc.line(x-4,y-lineHt,x-4,y+6);
						}
						y+=rowHt;
					}
					try{
						var i,j;
						if (arr.length == 0) return;
						var rowHt = 20;
						
						var row=[]; // contains column items for each row. Init an array to hold each row. Later add column array.
						var lines = [];	
						var rowWidth = [];
						rowWidth[0] = marginLeft;
	
						// count lines needed for each row, and starting x of each column
						for (i=0; i<arr.length; i++) {
							row[i] = []; // init each row to contain an array for the columns.
							lines[i] = 1;
							for (j=0; j<header.length; j++){
								if (arr[i][header[j].field]){
									// wrap text
									if (arr[i][header[j].field] != "") {
										row[i][j]= doc.setFontSize(fontsize)
											.splitTextToSize(arr[i][header[j].field].toString(),header[j].width-8,{fontName:"arial",fontStyle:"normal"});
									}
									else row[i][j] = "";
									// count longest number of lines needed in each column for this row
									if (row[i][j].length > lines[i])
										lines[i] = row[i][j].length;
								}
								else row[i][j] = "";
								if (i==0 && j+1<header.length)
									rowWidth[j+1] = rowWidth[j] + header[j].width;
							}
						}
						// test for page break
						// if current y + title + header row + first table row > pageHeight
						if (y+5+rowHt+(lineHt*lines[0])+rowHt > pageHeight-lineHt){
							footer();
							y = marginTop+14;
							doc.addPage();
						}
						printHeader();
						// table
						// draw each row
						for (i=0; i<arr.length; i++) {
							// draw each column
							for (j=0; j<header.length; j++){
								// draw first vertical line
								if (j==0) doc.line(rowWidth[j],y-lineHt,rowWidth[j],y+(lineHt*(lines[i]-1))+rowHt-lineHt);
								// add cell text
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
								y = marginTop+14;
								doc.addPage();
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
						// Enable Print/Save Report buttons
						registry.byId("openReportBtn1").set('disabled',false);
						registry.byId("saveReportBtn1").set('disabled',false);
						registry.byId("openReportBtn2").set('disabled',false);
						registry.byId("saveReportBtn2").set('disabled',false);
					}
				}
						
				function footer() {
					doc.setFontSize(10);
					doc.setFont(myFont,"normal");
					doc.text(368,pageHeight-lineHt,"page "+pageNo);
					pageNo++;
					doc.setFontSize(fontsize); // return to normal font size
				}
				function mapFooter(){
					doc.setFontSize(5);
					doc.setFont(myFont,"normal");
					doc.text(pageWidth+marginLeft-30,pageHeight-7,"page "+pageNo);
					doc.setFontSize(fontsize); // return to normal font size
				}
				
				function addMap() {
					function printResult(result){
						function savePDF(){
							// download pdf
							// doc.save("filename") does not work with Foxit Reader (for Mac)
							var data = doc.output();
							var buffer = new ArrayBuffer(data.length);
							var array = new Uint8Array(buffer);
							for (var i = 0; i < data.length; i++) {
								array[i] = data.charCodeAt(i);
							}
							var blob = new Blob(
								[array],
								{type: 'application/pdf', encoding: 'raw'}
							);
							saveAs(blob, "AtlasReport.pdf");
							blob = null;
							buffer=null;
							array=null;
							data=null;
							// Enable Print/Save Report buttons
							registry.byId("openReportBtn1").set('disabled',false);
							registry.byId("saveReportBtn1").set('disabled',false);
							registry.byId("openReportBtn2").set('disabled',false);
							registry.byId("saveReportBtn2").set('disabled',false);
						}
						function openPDF(){
							// Does not work in IE Cannot open base64 even in an iframe.
							var string = doc.output('datauristring');
							var iframe = "<iframe width='100%' height='100%' referrerPolicy='origin' src='" + string + "'></iframe>";
							var win = window.open();
							if (!win) {
								alert("Failed to open PDF. Make sure popups are allowed.","Warning");
								// Enable Print/Save Report buttons
								registry.byId("openReportBtn1").set('disabled',false);
								registry.byId("saveReportBtn1").set('disabled',false);
								registry.byId("openReportBtn2").set('disabled',false);
								registry.byId("saveReportBtn2").set('disabled',false);
								document.getElementById("reportMsg1").innerHTML = "";
								document.getElementById("reportMsg2").innerHTML = "";	
								return;
							}
							win.document.open();
							win.document.write(iframe);
							win.document.title = "Atlas Report";
							win.document.close();
							
							// Enable Print/Save Report buttons
							registry.byId("openReportBtn1").set('disabled',false);
							registry.byId("saveReportBtn1").set('disabled',false);
							registry.byId("openReportBtn2").set('disabled',false);
							registry.byId("saveReportBtn2").set('disabled',false);
							document.getElementById("reportMsg1").innerHTML = "";
							document.getElementById("reportMsg2").innerHTML = "";							
						}
						
						var img = new Image();
						img.onerror = function(){
							document.getElementById("reportMsg1").innerHTML = msg;
							document.getElementById("reportMsg2").innerHTML = msg;
							alert("Resource report cannot load image: "+img.src,"Code Error");
							img=null;
							// Enable Print/Save Report buttons
							registry.byId("openReportBtn1").set('disabled',false);
							registry.byId("saveReportBtn1").set('disabled',false);
							registry.byId("openReportBtn2").set('disabled',false);
							registry.byId("saveReportBtn2").set('disabled',false);
						};
						img.onload = function()	{
							// Add map image and surrounding text
							try{
								doc.addImage(img, 'JPEG', 0, 0, 792, 612);// in points width=11 inches * 72, height=8.5*72     mapWidthPts, mapHeightPts
								img=null;
								mapFooter();

								// Save PDF - download
								if (theAction == "save") {
									savePDF();
									document.getElementById("reportMsg1").innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Downloaded PDF";
									document.getElementById("reportMsg2").innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Downloaded PDF";

								}
								// Display PDF
								else {
									if (navigator.sayswho.indexOf("IE")>-1 | navigator.sayswho.indexOf("Edge")>-1) {
										savePDF();
										document.getElementById("reportMsg1").innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Download or Open PDF in pop-up. Make sure pop-ups are enabled.";
										document.getElementById("reportMsg2").innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Download or Open PDF in pop-up. Make sure pop-ups are enabled.";
									}
									else {
										openPDF();
										document.getElementById("reportMsg1").innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Opening PDF in pop-up. Make sure pop-ups are enabled.";
										document.getElementById("reportMsg2").innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Opening PDF in pop-up. Make sure pop-ups are enabled.";
									}
								}
							}
							catch(e){
								document.getElementById("reportMsg1").innerHTML = msg;
								document.getElementById("reportMsg2").innerHTML = msg;
								alert("Resource report generation Error in javascript/resourceReport.js printResult() img.onload. "+e.message,"Code Error",e);
							}
						};
						
						// For debugging
						img.src = result.url; //fails on ndis-flex-2 because it is not local gets security error
						if (window.location.hostname.indexOf("ndis-flex-2") > -1){
							img.src = "assets/images/testmap.jpg";
							alert("The image in the pdf is a placeholder. <a href='"+result.url+"' target='pdf_image'>Here is a link to the true image.</a>","Note for Test Site");
						}
					}
					function printError(err){
						document.getElementById("reportMsg1").innerHTML = msg;
						document.getElementById("reportMsg2").innerHTML = msg;
						if (err.details)
							alert("Error creating resource report map: "+err+" Details: "+err.details,"Code Error",err);
						else
							alert("Error printing resource report: "+err,"Code Error",err);
					}
					try{
						// Add Map
						document.getElementById("reportMsg1").innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img src='assets/images/loading.gif' width='20px' height='20px'/> Generating map image for report";
						document.getElementById("reportMsg2").innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img src='assets/images/loading.gif' width='20px' height='20px'/> Generating map image for report";
						doc.addPage();	
						var printTask = new PrintTask(printServiceUrl);
						var params = new PrintParameters();
						var template = new PrintTemplate();
						//template.exportOptions = { dpi: dpi, width: 3150, height: 2400 };
						template.exportOptions = { dpi: dpi, outputSize: [3150, 2400] };
						template.layout = "Letter ANSI A Landscape"; //"MAP_ONLY";
						template.format = "JPG";
						template.preserveScale = true;
						template.showAttribution = false;
						template.layoutOptions = {
							legendLayers: [], // empty array means no legend
							titleText: mapTitle,
							authorText: disclaimer,
							customTextElements:  [
								{Subtitle: mapSubTitle}
							]
						};	
						
						params.map = reportMap;
						params.template = template;				
						printTask.execute(params, printResult, printError);
					}
					catch(e){
						alert("Error creating map for resource report. "+e.message,"Code Error",e);
					}
				}
			};
		}

		try{
			var bufferDist;
			var bufferList;
			var bufferUnitsLabel;
			var queryLayers = {
				pointsOfInterest: null,
				contactBoundaries: null,
				gameBoundaries: null,
				layers: []
			};
			var reports = [];
			var numDatabaseCalls = 0;
			var processedDatabaseCalls;
			var queriesPending = 0;
			var mapService;
			var basemapUrl;
			var reportToolbar;
			var centerPt=null;
			var reportTitle;
			var mapTitle;
			var mapSubTitle;
			var disclaimer;
			var circle;
			var marginLeft = 18; // .25 inches
			var marginTop = 18;
			var lineHt = 14;
			var dpi = 300;
			var pageWidth = 792 - (2*marginLeft); // 11 inches * 72 - margins
			var pageHeight = 612 - (marginTop); // height of page (8.5*72) - bottom margin
			var mapWidthPxs;
			var mapHeightPxs;
			//var mapWidthPts;
			//var mapHeightPts;
			var doc = new jsPDF("landscape","pt","letter");
			var printServiceUrl;
			var	reportMap;
			var msg = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Adjust map boundaries. Click Open/Save Report when ready.";
			var reportPreviewGraphicsLayer;
			var reportGraphicsLayer = new GraphicsLayer();
			reportGraphicsLayer.id = "reportGraphicsLayer1";
			map.addLayer(reportGraphicsLayer);
		
		// ***********************************
		// Read ResourceReportWidget.xml file
		// ***********************************
		var xmlhttp = createXMLhttpRequest();
		var configFile = app + "/ResourceReportWidget.xml?v="+ndisVer;
		xmlhttp.onerror = function(){
			alert("Error loading "+app + "/ResourceReportWidget.xml","Data Error");
		};
		xmlhttp.onreadystatechange = function(){ 
			if (xmlhttp.readyState == 4) {
				if (xmlhttp.status == 200) {
					//require(["dojo/dom","dijit/registry"], function(dom,registry){
						var xmlDoc=createXMLdoc(xmlhttp);
						if (!xmlDoc) alert("Missing "+app+"/ResourceReportWidget.xml file.", "Data Error");
						var buffer = xmlDoc.getElementsByTagName("buffer")[0] ? xmlDoc.getElementsByTagName("buffer")[0] : showWarning("buffer tag");
						bufferDist = buffer.getAttribute("default") ? buffer.getAttribute("default") : (25, showWarning("default attribute of the buffer tag"));
						bufferList = buffer.getAttribute("list") ? buffer.getAttribute("list").split(",") : (["5","10","25","50","100"], showWarning("list attribute of the buffer tag"));
						bufferUnitsLabel = buffer.getAttribute("unitslabel") ? buffer.getAttribute("unitslabel") : ("mile", showWarning("unitslabel attribute of the buffer tag"));
						var layersTag = xmlDoc.getElementsByTagName("querylayers")[0].getElementsByTagName("layers") ? xmlDoc.getElementsByTagName("querylayers")[0].getElementsByTagName("layers") : null;
						var reportsTag = xmlDoc.getElementsByTagName("reports")[0] && xmlDoc.getElementsByTagName("reports")[0].getElementsByTagName("report") ? xmlDoc.getElementsByTagName("reports")[0].getElementsByTagName("report") : null; 
						mapService = xmlDoc.getElementsByTagName("reportserviceurl")[0] ? xmlDoc.getElementsByTagName("reportserviceurl")[0].firstChild.nodeValue : showWarning("reportserviceurl tag");
						printServiceUrl = xmlDoc.getElementsByTagName("printserviceurl")[0] ? xmlDoc.getElementsByTagName("printserviceurl")[0].firstChild.nodeValue : showWarning("printserviceurl tag");
						basemapUrl = xmlDoc.getElementsByTagName("basemapurl")[0] ? xmlDoc.getElementsByTagName("basemapurl")[0].firstChild.nodeValue : showWarning("basemapurl tag");
						reportTitle = xmlDoc.getElementsByTagName("reporttitle")[0] ? xmlDoc.getElementsByTagName("reporttitle")[0].firstChild.nodeValue : showWarning("reporttitle tag");
						
						// Hunter Resource Report
						if (xmlDoc.getElementsByTagName("pointsofinterest")[0] && xmlDoc.getElementsByTagName("contactinfo"[0]) && xmlDoc.getElementsByTagName("gameunits")[0])
						{
							queryLayers.pointsOfInterest = {
								url: xmlDoc.getElementsByTagName("pointsofinterest")[0].getAttribute("url"),
								name: xmlDoc.getElementsByTagName("pointsofinterest")[0].getAttribute("name")
							};
							
							queryLayers.contactBoundaries = {
								url: xmlDoc.getElementsByTagName("contactinfo")[0].getAttribute("url"),
								name: xmlDoc.getElementsByTagName("contactinfo")[0].getAttribute("name")
							};
							queryLayers.gameBoundaries = {
								url: xmlDoc.getElementsByTagName("gameunits")[0].getAttribute("url"),
								name: xmlDoc.getElementsByTagName("gameunits")[0].getAttribute("name")
							};
						}
						
						// Custom Reports
						if (layersTag)
						{
							// tlb read generic mapservice layers
							for (var i=0; i<layersTag.length; i++)
							{
								if (!layersTag[i].getAttribute("type"))
									alert("Missing type parameter in layer tag in "+app+"/ResourceReportWidget.xml file", "Data Error");
								if (!layersTag[i].getAttribute("name"))
									alert("Missing name parameter in layer tag in "+app+"/ResourceReportWidget.xml file", "Data Error");
								if (!layersTag[i].getAttribute("url"))
									alert("Missing url parameter in layer tag in "+app+"/ResourceReportWidget.xml file", "Data Error");
								queryLayers.layers.push({
									type: layersTag[i].getAttribute("type"),
									name: layersTag[i].getAttribute("name"),
									url:  layersTag[i].getAttribute("url")
								});
							}
							
							// tlb read custom reports
							if (reportsTag){
								for (i=0; i<reportsTag.length; i++)
								{
									var obj = {
										id: reportsTag[i].getAttribute("id")?reportsTag[i].getAttribute("id"):showWarning("reports tag, id attribute"),
										type: reportsTag[i].getAttribute("type")?reportsTag[i].getAttribute("type"):showWarning("reports tag, type attribute"),
										title: reportsTag[i].getAttribute("title")?reportsTag[i].getAttribute("title"):"",
										subtitle: reportsTag[i].getAttribute("subtitle")?reportsTag[i].getAttribute("subtitle"):showWarning("reports tag, subtitle attribute"),
										displayfields: reportsTag[i].getAttribute("displayfields")?reportsTag[i].getAttribute("displayfields").split(","):showWarning("reports tag, displayfields attribute"),
										fields: reportsTag[i].getAttribute("fields")?reportsTag[i].getAttribute("fields").split(","):showWarning("reports tag, fields attribute"),
										where_field: reportsTag[i].getAttribute("where_field")?reportsTag[i].getAttribute("where_field"):"",
										where_inequality: reportsTag[i].getAttribute("where_inequality")?reportsTag[i].getAttribute("where_inequality"):"",
										where_value: reportsTag[i].getAttribute("where_value")?reportsTag[i].getAttribute("where_value"):"",
										where_type: reportsTag[i].getAttribute("where_type")?reportsTag[i].getAttribute("where_type"):"",
										sortfields: reportsTag[i].getAttribute("sortfields")?reportsTag[i].getAttribute("sortfields").split(","):reportsTag[i].getAttribute("fields").split(","),
										keyField: reportsTag[i].getAttribute("key")?reportsTag[i].getAttribute("key"):null,
										database: reportsTag[i].getAttribute("database")?reportsTag[i].getAttribute("database"):null,
										filename: reportsTag[i].getAttribute("filename")?reportsTag[i].getAttribute("filename"):null,
										one2one_fields: reportsTag[i].getAttribute("one2one_fields")?reportsTag[i].getAttribute("one2one_fields").split(","):null,
										one2one_display: reportsTag[i].getAttribute("one2one_display")? reportsTag[i].getAttribute("one2one_display").split(","):reportsTag[i].getAttribute("one2one_fields")?reportsTag[i].getAttribute("one2one_fields").split(","):null,
										one2many_fields: reportsTag[i].getAttribute("one2many_fields")?reportsTag[i].getAttribute("one2many_fields").split(","):null,
										one2many_display: reportsTag[i].getAttribute("one2many_display")?reportsTag[i].getAttribute("one2many_display").split(","):reportsTag[i].getAttribute("one2many_fields")?reportsTag[i].getAttribute("one2many_fields").split(","):null
									};
									reports.push(obj);
									// lookup data in database if necessary
									if (obj.database && obj.database != "")
									{
										numDatabaseCalls++;
									}
									obj = null;
								}
							}
						}
						
						mapTitle = xmlDoc.getElementsByTagName("title")[0] ? xmlDoc.getElementsByTagName("title")[0].firstChild.nodeValue: showWarning("title tag");
						mapSubTitle = xmlDoc.getElementsByTagName("subtitle")[0] ? xmlDoc.getElementsByTagName("subtitle")[0].firstChild.nodeValue : showWarning("subtitle tag");
						disclaimer = xmlDoc.getElementsByTagName("disclaimer")[0] ? xmlDoc.getElementsByTagName("disclaimer")[0].firstChild.nodeValue : showWarning("disclaimer tag");
						setMapValues();
					//});
				}
				else if (xmlhttp.status === 404) {
					alert("File: "+app+"/ResourceReportWidget.xml not found.","Data Error");
				}
			}
		};
		xmlhttp.open("GET",configFile,true);
		xmlhttp.send(null);
		

		//***************************
		//       PDF Functions
		//***************************
		// Add a function to jsPDF to align text
		var today;
		var theAction;
		(function(API){
			API.myText = function(x,y,txt,options,width){
				options = options ||{};
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
				txtWidth = this.getStringUnitWidth(txt)*fontSize/this.internal.scaleFactor;
				
				if( options.align == "center" ){
					// Calculate text's x coordinate
					x = x +( pageWidth - txtWidth ) / 2;
					this.text(txt,x,y);
				}
				else if( options.align == "right" ){
					// Calculate text's x coordinate
					x = x +( pageWidth - (txtWidth +3) );
					this.text(txt,x,y);
				}
				else if(options.underline == true){
					this.text(txt,x,y);
					this.line(x,y+1,x+(txtWidth*1.15),y+1); // increase underline a little
				}
			};
		})(jsPDF.API);
		
	  }
	  
	  catch(e){
		alert(e.message+" in javascript/resourceReport.js reportInit.","Code Error", e);
	  }
	});
}