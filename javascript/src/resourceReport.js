/* report.js
 * Does the hunter resource report or a custom report on a freehand polygon selected area or buffered circle.
 * Modified: 1/10/23 Tammy Bearly
 * 10/17/23 Tammy Bearly - Add ability to download a CSV file
 */
function reportInit(){
	require(["dojo/dom","dijit/registry","dojo/sniff","dijit/form/Select", "esri/toolbars/draw","dojo/i18n!esri/nls/jsapi","esri/layers/GraphicsLayer","esri/geometry/Circle",
	"esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol","dojo/_base/Color", "esri/graphic",
	"dijit/Dialog","esri/map","dijit/form/Button","esri/graphicsUtils","esri/layers/ArcGISDynamicMapServiceLayer","esri/layers/FeatureLayer","esri/layers/ArcGISTiledMapServiceLayer","esri/layers/VectorTileLayer",
	"esri/tasks/PrintTask", "esri/tasks/PrintTemplate", "esri/tasks/PrintParameters","esri/urlUtils","esri/geometry/webMercatorUtils",
	 "esri/tasks/query","esri/tasks/QueryTask","dojo/promise/all","dojo/on","dojo/_base/array"],
	function(dom,registry,has,Select,Draw,bundle,GraphicsLayer,Circle,SimpleMarkerSymbol,SimpleLineSymbol,SimpleFillSymbol,Color,Graphic,Dialog,Map,Button,
	graphicsUtils,ArcGISDynamicMapServiceLayer,FeatureLayer,ArcGISTiledMapServiceLayer,VectorTileLayer,PrintTask,PrintTemplate,PrintParameters,urlUtils,webMercatorUtils,Query,QueryTask,all,on,array){
		var displayedOnce = false;
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
				extent: initExtent,
				lods: customLods
			});
			
			reportPreviewGraphicsLayer = new GraphicsLayer();
			reportPreviewGraphicsLayer.id = "reportPreviewGraphicsLayer1";
			
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
			if (selectby === "point"){
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
						bufferDistTitle = " within " +this.get("value")+ " miles of map click";
						drawBuffer();
						distanceTitle = " ("+this.get("value")+" "+bufferUnitsLabel+" buffer radius)";
					},
					options: optList
				}, "reportDistCbo");
				document.getElementById("reportDistLabel").innerHTML=" "+bufferUnitsLabel+" buffer radius";
				bufferDistTitle = " within " +registry.byId("distCombo").get("value")+ " miles of map click";
				distanceTitle = " ("+registry.byId("distCombo").get("value")+" "+bufferUnitsLabel+" buffer radius)";
				optList=null;
			}	
			
			reportToolbar = new Draw(map, {showTooltips:true});
			reportToolbar.on("draw-end", reportDrawEnd);
			// Register click event handlers for buttons
			document.getElementById(selectBtn).addEventListener('click',function(event) {activateReportTool();});
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
		
		function drawPoly(poly){
			if (!centerPt) return;
			reportGraphicsLayer.clear();
			reportPreviewGraphicsLayer.clear(); // for changing buffer radius, erase old buffer
			var lineSymb = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0]), 2);
			var polySymb = new SimpleFillSymbol(
			  SimpleFillSymbol.STYLE_SOLID,
			  lineSymb,
			  new Color([255, 255, 0, 0.1])
			);
			var polySymb2 = new SimpleFillSymbol(
			  SimpleFillSymbol.STYLE_NULL,
			  lineSymb
			);
			var graphic = new Graphic(poly, polySymb);
			var graphic2 = new Graphic(poly, polySymb2);
			reportGraphicsLayer.add(graphic);
			reportPreviewGraphicsLayer.add(graphic2);
			graphic=null;
			lineSymb=null;
			polySymb=null;
			polySymb2=null;
			graphic2=null;
		}
		function drawBuffer(){
			if (!centerPt) return;
			reportGraphicsLayer.clear();
			reportPreviewGraphicsLayer.clear(); // for changing buffer radius, erase old buffer
			theArea = new Circle({
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
			var graphic = new Graphic(theArea, circleSymb);
			var graphic2 = new Graphic(theArea, circleSymb2);
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
			drawing=false;
			reportToolbar.deactivate();
			if (selectby === "polygon"){
				document.getElementById("reportPolyBtn").className = "graphBtn";
				centerPt = event.geometry.getExtent().getCenter();
				theArea = event.geometry;
				drawPoly(event.geometry);
			}
			else if (selectby === "point"){
				document.getElementById("reportPtBtn").className = "graphBtn";
				centerPt = event.geometry;
				drawBuffer();
			}
			registry.byId("reportPrintBtn").set('disabled',false); // enable Open Report button
			registry.byId("reportCancelBtn").set('disabled',false);
			// enable download CSV file buttons
			enableDownloadBtns();
		}
		function reportCancel(){
			document.getElementById(selectBtn).className = "graphBtn";
			drawing=false;
			reportToolbar.deactivate();
			reportGraphicsLayer.clear();
			reportPreviewGraphicsLayer.clear();
			// Enable Print/Save Report buttons
			registry.byId("openReportBtn1").set('disabled',false);
			registry.byId("saveReportBtn1").set('disabled',false);
			registry.byId("openReportBtn2").set('disabled',false);
			registry.byId("saveReportBtn2").set('disabled',false);
			registry.byId("reportPrintBtn").set('disabled',true);
			registry.byId("reportCancelBtn").set('disabled',true);
			// disable download CSV file buttons
			disableDownloadBtns();
		}
		
		function activateReportTool(){
			// Draw point or polygon button was clicked.
			registry.byId("reportPrintBtn").set('disabled',true);
			registry.byId("reportCancelBtn").set('disabled',true);
			// disable download CSV file buttons
			disableDownloadBtns();
			// Check if button was already depressed. If so reset to Identify
			if (document.getElementById(selectBtn).className === "graphBtnSelected") {
				reportCancel();
				return;
			}
			reportGraphicsLayer.clear();
			reportPreviewGraphicsLayer.clear();
			drawing = true; // flag to turn off identify in identify.js, doIdentify()
			if (selectby === "polygon") {
				document.getElementById("reportPolyBtn").className = "graphBtnSelected";
				reportToolbar.activate(Draw.FREEHAND_POLYGON);
			} else if (selectby === "point"){
				bundle.toolbars.draw.addPoint = "Click on location"; // change tooltip
				document.getElementById("reportPtBtn").className = "graphBtnSelected";
				reportToolbar.activate(Draw.POINT);
			}
		}

		var  prev_layer_events=[],correctOrder,previewLayers,tries,numberOfBasemaps;
		function handleCloseReportDialog(){
			// remove on load and on error listeners
			//console.log("removing listeners="+prev_layer_events.length);
			array.forEach(prev_layer_events, function(handle){
				 handle.remove();
				 });
			prev_layer_events = [];
		}
		function handleLayerLoad(event){
			var layer = event.layer;
			previewLayers.push(layer);
			//console.log("layer loaded for "+event.layer.id);
			if (layer.url && layer.url.toLowerCase().indexOf("mapserver")>-1){
				var m;
				if ((layer.setVisibleLayers!= undefined) && layer.visibleLayers && layer.layerInfos){
					var visLayers = layer.visibleLayers;
					var layerInfos = layer.layerInfos;
					// add hidden group ids
					for (j=0; j<layer.visibleLayers.length; j++) {
						// 1-25-24 get index k in layerInfos where layerInfos.id == the next visible layer id
						for(var p=0; p<layerInfos.length; p++){
							if (layer.visibleLayers[j] == layerInfos[p].id){
								k = p;
								break;
							}
						}
						do {
							// Add hidden group sublayers for all levels
							if (hideGroupSublayers.indexOf(layerInfos[k].name) > -1 && layerInfos[k].subLayerIds) {
								for (m=0; m<layerInfos[k].subLayerIds.length; m++){
									if (visLayers.indexOf(layerInfos[k].subLayerIds[m]) == -1)
										visLayers.push(layerInfos[k].subLayerIds[m]);
									// handle GMUs they are not always an offset of 1
									if (layerInfos[layerInfos[k].subLayerIds[m]+1].name == "Big Game GMU"){
										var offset=1;
										if (gmu == "Bighorn GMU") offset = 2;
										else if (gmu == "Goat GMU") offset = 3;
										if (visLayers.indexOf(layerInfos[k].subLayerIds[m]+offset) == -1)
											visLayers.push(layerInfos[k].subLayerIds[m]+offset);
									}
									else if (visLayers.indexOf(layerInfos[k].subLayerIds[m]+1) == -1)
										visLayers.push(layerInfos[k].subLayerIds[m]+1);
								}
							}
							k = layerInfos[k].parentLayerId;
						}
						while (k != -1);
					}
					
					// Set visible layers for each layerInfo
					var num = new Array(0,1,2,3,4,5,6,7,8,9);
					for (m=0; m<layerInfos.length; m++)
					{	
						// If layer is found in the visLayers make it visible.
						if (visLayers.indexOf(layerInfos[m].id) != -1)
							layerInfos[m].visible = true;
						
						// Else if this is not the top layer and it has no sub-layers set default visibility
						else if (layerInfos[m].parentLayerId != -1 && !layerInfos[m].subLayerIds)
						{
							// if this is a gmu layer make sure it is the one that was turned on in visLayers
							if (layerInfos[m].name.substr(layerInfos[m].name.length-3,3).indexOf("GMU") > -1){
								if (layerInfos[m].name == gmu) {
									if (visLayers.indexOf(m) == -1) {
										layerInfos[m].visible = true;
									}
									if ((num.indexOf(parseInt(layerInfos[layerInfos[m].parentLayerId].name.substr(0,1))) > -1) &&
										(visLayers.indexOf(layerInfos[m].parentLayerId) == -1)){
										layerInfos[layerInfos[m].parentLayerId].visible = true;
									}
								}
								else 
									layerInfos[m].visible = false;
							}
							// use the default value for sub menu item layers that are under a menu item that is unchecked
							else if ((layerInfos[m].defaultVisibility == true) && (visLayers.indexOf(layerInfos[m].parentLayerId) === -1)){
								// If by default it is visible see if the name of the parent is a number (varies with extent) and make it visible also
								if (num.indexOf(parseInt(layerInfos[layerInfos[m].parentLayerId].name.substr(0,1))) > -1) {
									layerInfos[layerInfos[m].parentLayerId].visible = true;
								}
							}
						}
						// Else this is a top level toc menu item and not found in the visible list, make it not visible.
						else {
							layerInfos[m].visible = false;
						}
						
						// Remove parent layers from visLayers
						var pos = visLayers.indexOf(layerInfos[m].id);
						if (pos > -1 && layerInfos[m].subLayerIds)
							visLayers.splice(pos,1); // remove 1 item at index pos
					}								
					layer.setVisibleLayers(visLayers.sort(function(a,b){return a-b;}), false);
				}
			}

			// add layer to report map
			layer.spatialReference=map.spatialReference;
			layer.refresh();
			reportMap.addLayer(layer);

			// reorderLayer(layer,index) 0 is basemap, highest number is on top
			// Reorder layers
			var index=numberOfBasemaps;
			for (i=0; i<correctOrder.length; i++){
				for (j=0; j<previewLayers.length; j++){
					if (correctOrder[i] == previewLayers[j].id){			
						reportMap.reorderLayer(previewLayers[j],index);
						index++;
					}
				}
			}
			// All layers have loaded, enable print buttons
			if (correctOrder.length == previewLayers.length){
				registry.byId("openReportBtn1").set('disabled',false);
				registry.byId("saveReportBtn1").set('disabled',false);
				registry.byId("openReportBtn2").set('disabled',false);
				registry.byId("saveReportBtn2").set('disabled',false);
			}
		}
		function handleLayerError(event){
			//console.log("failed to load: "+event.target.id+" tries="+tries[event.target.id]);
			// try to reload every 1 seconds, after 5 seconds give warning
			if (tries[event.target.id] < 10){
				setTimeout(function(){createLayer(map.getLayer(event.target.id));},500);
			}
			else if (tries[event.target.id] === 10){
				if (event.target.id.indexOf("Motor Vehicle") > -1 || event.target.id.indexOf("Wildfire") > -1 || event.target.id.indexOf("BLM") > -1)
					alert("While creating the report map, the external map service that provides "+event.target.id+" is experiencing problems.  This issue is out of CPW control. We will continue trying to load it. We apologize for any inconvenience.","External (Non-CPW) Map Service Error");
				// 1-22-24 added quotes to layer
				else if (event.target.id.indexOf("layer")>-1)
					alert("While creating the report map, the basemap service is busy or not responding. We will continue trying to load it.","Data Error");
				else
					alert("While creating the report map, the "+event.target.id+" service is busy or not responding. We will continue trying to load it.","Data Error");
				setTimeout(function(){createLayer(map.getLayer(event.target.id));},500);
				// enable print buttons after 5 seconds of trying to load
				registry.byId("openReportBtn1").set('disabled',false);
				registry.byId("saveReportBtn1").set('disabled',false);
				registry.byId("openReportBtn2").set('disabled',false);
				registry.byId("saveReportBtn2").set('disabled',false);
			}
			// keep trying every 1 seconds
			else{
//DEBUG
//if(event.target.id === "Hunter Reference")
//map.getLayer("Hunter Reference").url = "https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/HuntingAtlas/HuntingAtlas_Base_Map/MapServer";
//console.log("trying again with: "+map.getLayer(event.target.id).url);
				setTimeout(function(){createLayer(map.getLayer(event.target.id));},1000);
			}
		}
		function createLayer(layer){
			if (!registry.byId("reportPreviewDialog").open)return;
			var prev_layer;
			tries[layer.id]++;
			// Add graphics layers, they do not fire loaded event!??
			if (layer.url === null && layer.graphics){
				prev_layer = new GraphicsLayer({
					id: layer.id,
					"visible": layer.visible
				});
				prev_layer.id = layer.id;
				var graphics = layer.graphics;
				for (a=0; a<graphics.length; a++){
					g = graphics[a].clone(); // 4-12-22
					prev_layer.add(g); // 4-12-22
				}
				reportMap.addLayer(prev_layer);
				previewLayers.push(prev_layer);
				//console.log("added map layer "+prev_layer.id);
				graphics=null;
				// All layers have loaded, enable print buttons
				if (correctOrder.length == previewLayers.length){
					registry.byId("openReportBtn1").set('disabled',false);
					registry.byId("saveReportBtn1").set('disabled',false);
					registry.byId("openReportBtn2").set('disabled',false);
					registry.byId("saveReportBtn2").set('disabled',false);
				}
				return;
			}
			// add MapServer layers
			else if(layer.url.toLowerCase().indexOf("mapserver")>-1){
				prev_layer = new ArcGISDynamicMapServiceLayer(layer.url, {
					"opacity": parseFloat(layer.opacity),
					"id":layer.id,
					"visible": layer.visible
				});
				//console.log("created "+prev_layer.id);
				// turn on and off the current visible layers
				if (layer.visibleLayers){
					var visLayers = [];
					for (var j=0; j<layer.visibleLayers.length; j++)
						visLayers.push(parseInt(layer.visibleLayers[j]));
					prev_layer.setVisibleLayers(visLayers);
					visLayers = null;
				}
			}
			// add FeatureServer layers
			else if (layer.url.toLowerCase().indexOf("featureserver")>-1){
				prev_layer = new FeatureLayer(layer.url, {
					"opacity": parseFloat(layer.opacity),
					"id":layer.id,
					"visible": layer.visible
				});
				//console.log("created "+prev_layer.id);
			}
			else {
				alert("Unknown map layer type for "+layer.url+" in "+app+"/config.xml","Data Error");
			}
		
			if (prev_layer) {
				prev_layer_events.push(on(prev_layer,"error",handleLayerError));
				prev_layer_events.push(on(prev_layer,"load",handleLayerLoad));
			}
		}
		function reportPreview(){
			// Google Analytics count how many times Resource Report is clicked on
			if (typeof ga === "function")ga('send', 'event', "resource_report", "click", "Resource Report", "1");
			if (typeof gtag === "function")gtag('event','widget_click',{'widget_name': 'Resource Report'});
			
			document.getElementById("reportMsg1").innerHTML = msg;
			document.getElementById("reportMsg2").innerHTML = msg;
			// Enable Print/Save Report buttons
			registry.byId("openReportBtn1").set('disabled',true);
			registry.byId("saveReportBtn1").set('disabled',true);
			registry.byId("openReportBtn2").set('disabled',true);
			registry.byId("saveReportBtn2").set('disabled',true);
			// Zoom to the selected area boundary & add visible layers to report map
			reportMap.setExtent(graphicsUtils.graphicsExtent(reportPreviewGraphicsLayer.graphics),true).then(function(){
				registry.byId("reportPreviewDialog").set("title", "Resource Report Preview "+distanceTitle);
				registry.byId("reportPreviewDialog").show().then(function(){
					// center the map only the first time
					if(!displayedOnce){
						displayedOnce = true;
						var extChangeEvent = reportMap.on("extent-change",function(){
							reportMap.centerAt(centerPt);
							extChangeEvent.remove();	
						});	
					}
					// update map layers to what is showing on main map
					var mapLayers = [];
					correctOrder=[];
					previewLayers=[];
					tries=[];
					numberOfBasemaps=0;
					reportMap.removeAllLayers();
					// add basemaps
					for (i=0;i<map.layerIds.length; i++){
						map_layer = map.getLayer(map.layerIds[i]);
						if (map.layerIds[i] == "layer_osm"){
							osmLayer = new OpenStreetMapLayer();
							osmLayer.id = "layer_osm";
							reportMap.addLayer(osmLayer);
							osmLayer = null;
							numberOfBasemaps++;
						}
						// vector open street maps
						else if (map_layer.attributionDataUrl && map_layer.attributionDataUrl.indexOf("OpenStreet")>-1){
							osmLayer = new OpenStreetMapLayer();
							osmLayer.id = "layer_osm";
							reportMap.addLayer(osmLayer);
							osmLayer = null;
							numberOfBasemaps++;
						}
						else if (map.layerIds[i].indexOf("layer")>-1){
							if (map.getLayer(map.layerIds[i]).visibleAtMapScale == true){
								if (map.getLayer(map.layerIds[i]).url.indexOf ("MapServer")>-1)
									basemap = new ArcGISTiledMapServiceLayer(map.getLayer(map.layerIds[i]).url,{"id":"basemap","visible": true});
								else {
									basemap = new VectorTileLayer(map.getLayer(map.layerIds[i]).url,{"id":"basemap","visible": true});
									basemap.setStyle(map.getLayer(map.layerIds[i]).url);
								}
								if (map_layer._basemapGalleryLayerType == "reference")
									basemap.id="reference";
								else if (i>0)basemap.id="basemap"+i;
								basemap.spatialReference = map.spatialReference;
								basemap._basemapGalleryLayerType = map_layer._basemapGalleryLayerType;
								basemap.refresh();
								reportMap.addLayer(basemap);
								basemap = null;
								numberOfBasemaps++;
							}
						}
					}
					// count visible non-basemap layers
					var layers = map.getLayersVisibleAtScale();
					for (var i=0;i<layers.length;i++){
						if (layers[i].visible && layers[i].id.indexOf("layer") == -1){
							mapLayers.push(layers[i]);
							correctOrder.push(layers[i].id);
						}
					}
					for (i=0;i<mapLayers.length;i++){
						if (mapLayers[i].visible) {
							tries[mapLayers[i].id]=0;
							//DEBUB make if fail to load
							//if (mapLayers[i].id === "Hunter Reference")mapLayers[i].url = mapLayers[i].url+"1";
							createLayer(mapLayers[i]);
						}
					}
					if (mapLayers.length == 0){
						// enable print buttons, only basemap
						registry.byId("openReportBtn1").set('disabled',false);
						registry.byId("saveReportBtn1").set('disabled',false);
						registry.byId("openReportBtn2").set('disabled',false);
						registry.byId("saveReportBtn2").set('disabled',false);
					}
				}, function(){
					alert("Show map failed.","Warning");
				});
			},function(){
				alert("Set map extent failed.","Warning");
			});	
		}
		
		function hidePreview(){
			handleCloseReportDialog(); //remove listeners
			registry.byId("reportPreviewDialog").hide();
		}
		
		function replaceSpecialChar(label, char){
			// Download button label
			// replace special characters in label with the character char
			return label.replace(/([ :\-,\'\".;?\/()!@#$%^&*+=])/g,char);
		}
		function disableDownloadBtns(){
			for (var i=0;i<download_buttons.length;i++){
				var btn = registry.byId(replaceSpecialChar(download_buttons[i].label+"Btn","_"));
				btn.set('disabled',true);
			}
		}
		function enableDownloadBtns(i){
			for (var i=0;i<download_buttons.length;i++){
				var btn = registry.byId(replaceSpecialChar(download_buttons[i].label+"Btn","_"));
				btn.set('disabled', false);
			}
		}
		function addDownloadButtons(){
			// creates temp CSV files for each <download_buttons><button> in the ResourceReportWidget.xml file
			// Create each button and disable it
			// reportDrawEnd calls createDownloadCSVFiles(0) which calls queryCSVCompleteHandler which attaches the file to the button
			// then it call createDownloadCSVFiles(next button id)
			if (!download_buttons) return;
			
			require(["dijit/form/Button"],function(Button){
				var downloadDiv = document.getElementById("downloadButtons");
				downloadDiv.style.display = "block";
				for (var q=0; q<download_buttons.length; q++){
					var label = replaceSpecialChar(download_buttons[q].label,"_");//.replace(/([ :\-,\'\".;?\/()!@#$%^&*+=])/g,'_');
					var btnId = label+"Btn";
					var btn = new Button({
						label: download_buttons[q].label,
						id: btnId,
						onClick: function(event){
							var label = event.target.parentNode.innerText.replace("\n",""); // replace newline, not sure why this is here
							createDownloadCSVFiles(label)}
					}).placeAt(downloadDiv);
					
					btn.set('disabled',true);
					 // disable them until reportDrawEnd creates the download files and then enables
				}
			});
		}
		var downloadIndex; // index that allows each download_buttons/button to be processed. The index is passed in when createDownloadCSVFiles is called.
		function createDownloadCSVFiles(label){
			// Generate the query task which will download a csv file
			// myIndex: index of download_buttons button
			// calls queryCSVCompleteHandler to create the file download it.
			// find the index in download_buttons by the label
			downloadIndex = -1;
			if (label.indexOf("...")>-1) label = label.replace("...","");
			
			for (var l=0; l<download_buttons.length; l++){
				var btnLabel = replaceSpecialChar(download_buttons[l].label,"_");
				if (document.getElementById(btnLabel+"Btn").innerText.indexOf("...")>-1) {
					document.getElementById(btnLabel+"Btn").innerText.replace("...","");
					if (download_buttons[l].label === label){
						downloadIndex = l;
						break;
					}
				}
				else if (download_buttons[l].label === label){
					downloadIndex = l;
					break;
				}
			}
			if (downloadIndex == -1) {
				alert("Download button "+label+ " not found!");
				return;
			}
			var label = replaceSpecialChar(download_buttons[downloadIndex].label,"_");//.replace(/([ :\-,\'\".;?\/()!@#$%^&*+=])/g,'_');
			document.getElementById(label+"Btn").innerText += "...";
			var queries = [];
			var ids=[];
			var j;
			var query = [];
			var queryTask = [];
			var visibleOnly = download_buttons[downloadIndex].visOnly;
			var url = download_buttons[downloadIndex].url;
			if (url[url.length-1] != "/") url += "/";

			// Generate array of numbers from a range and list of ids
			var items =  download_buttons[downloadIndex].ids.split(",");
			for(var i=0;i<items.length;i++){
				if (items[i].indexOf("-")>-1){
					let firstLast = items[i].split("-"); // "3-5" -> [3],[5]
					for(j=parseInt(firstLast[0]);j<parseInt(firstLast[1])+1;j++){
						ids.push(j);// push all the numbers 3,4,5
					}
				}
				else ids.push(items[i]);
			}

			// get layer Id name if visibleOnly check
			var layerName = "";
			var mapUrl = "";
			if (visibleOnly){
				for (j=0; j<map.layerIds.length; j++){
					mapUrl = map.getLayer(map.layerIds[j]).url;
					// Add a / to the end, if it is missing, so we can compare
					if (map.getLayer(map.layerIds[j]).url[map.getLayer(map.layerIds[j]).url.length-1] != "/")
						mapUrl = mapUrl + "/";
					
					if (url.toLowerCase() === mapUrl.toLowerCase()){
						layerName = map.layerIds[j]
						break;
					}
				}
			}
			if (visibleOnly && layerName === ""){
				var theMapLayers = "";
				for(j=0; j<map.layerIds.length; j++){
					theMapLayers += map.getLayer(map.layerIds[j]).url + "\n";
				}
				alert("Cannot find url: "+url+" In visible maps layers: "+theMapLayers,"ResourceReportWidget.xml File Warning");
				document.getElementById(label+"Btn").innerText = document.getElementById(label+"Btn").innerText.replace("...","");
				return;
			}
			for (var q=0; q<ids.length; q++){
				if (download_buttons[downloadIndex].url[download_buttons[downloadIndex].url.length-1] != "/")
					url = download_buttons[downloadIndex].url+"/"+ids[q];
				else
					url = download_buttons[downloadIndex].url+ids[q];
				// check if visible only is set to true and layer is visible
				if (visibleOnly == true){
					var layerIsVisible = false;
					if (map.getLayer(layerName).visibleLayers.includes(parseInt(ids[q]))){
						 layerIsVisible = true;
					}
					// don't include data if not visible
					if (!layerIsVisible) continue;
				}
				queryTask[q] = new QueryTask(url);
				query[q] = new Query();
				query[q].geometry = theArea;
				query[q].returnGeometry = true;
				query[q].spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
				query[q].outFields = ["*"];
				queries.push(queryTask[q].execute(query[q]));	
			}
			if (queries.length > 0) {
				promises = all(queries);
				promises.then(queryCSVCompleteHandler);
				promises.otherwise(queryCSVFaultHandler);
			} else {
				// no visable data found. See if there is another download button
				alert("Download file for "+label+" was not created since the data is not currently visible.", "Notice");
				document.getElementById(label+"Btn").innerText = document.getElementById(label+"Btn").innerText.replace("...","");
			}
		};
		function queryCSVCompleteHandler(results){
			// Loop through each result create a csv file and attatch the button.
			// <a href="2022,elk,april\n2022,bear,may..." download="all_mammals.csv"><button/></a>
			// downloadIndex is set in createDownloadCSVFiles and is a global variable. When finished
			// increment downloadIndex and call createDownloadCSVFiles again.
			var j;
			var downloadTable = [];
			var noData = true;
			// create a comma delimited file in downloadTable (an array of objects) 
			for (var r=0; r<results.length;r++){
				if (results[r].features.length != 0) noData = false;
				for (var p = 0; p < results[r].features.length; p++) {
					var feature = results[r].features[p];
					var attr = feature.attributes;
					//if point is in the selected area
					if((feature.geometry.type == "point" && theArea.contains(feature.geometry)) ||
						feature.geometry.type != "point"){
						var obj={};
						for (j=0; j<download_buttons[downloadIndex].displayfields.length; j++){
							// handle UTTM xy
							if (download_buttons[downloadIndex].fields[j].toLowerCase() === "wgs84x"){
								obj[download_buttons[downloadIndex].fields[j]] = feature.geometry.x;
							} else if (download_buttons[downloadIndex].fields[j].toLowerCase() === "wgs84y"){
								obj[download_buttons[downloadIndex].fields[j]] = feature.geometry.y;
							}
							// handle other data
							else {
								obj[download_buttons[downloadIndex].fields[j]] = attr[download_buttons[downloadIndex].fields[j]];
							}
						}
						downloadTable.push(obj);
						obj=null;
					}
				}
			}

			var label = replaceSpecialChar(download_buttons[downloadIndex].label,"_");
			//  No data found, warn user, and leave download button disabled
			if (noData){
				alert("No data found for "+download_buttons[downloadIndex].label, "Notice");
			}
			else {
				// sort the table
				if (download_buttons[downloadIndex].sortorder === "descending")
					downloadTable.sort(descendingSortMultipleArryOfObj(download_buttons[downloadIndex].sortfields));
				else
					downloadTable.sort(sortMultipleArryOfObj(download_buttons[downloadIndex].sortfields));

				// create file
				var fileContent = "";
				// Add header
				for (j=0; j<download_buttons[downloadIndex].displayfields.length;j++){
					if (j == download_buttons[downloadIndex].displayfields.length-1){
						fileContent += download_buttons[downloadIndex].displayfields[j]+"\n";
					}else {
						fileContent += download_buttons[downloadIndex].displayfields[j]+",";
					}
				}
				for (var i=0; i<downloadTable.length;i++){
					for (var j=0; j<download_buttons[downloadIndex].fields.length;j++){
						if (j == download_buttons[downloadIndex].fields.length-1){
							fileContent += downloadTable[i][download_buttons[downloadIndex].fields[j]]+"\n";
						}else {
							fileContent += downloadTable[i][download_buttons[downloadIndex].fields[j]]+",";
						}
					}
				}
				
				// download the table and attach it to download when the button is clicked
				//var fileContent = "Elk,May,2023\nDeer,June,2023";
				var blob = new Blob([fileContent ], { type: 'text/plain' });
				saveAs(blob, label+".csv");
			}
			var downloadBtn = document.getElementById(label+"Btn");
			downloadBtn.innerText = downloadBtn.innerText.replace("...","");
		}
		function queryCSVFaultHandler(error){
			// can't download CSV file
			alert("Error creating file to download. Message: "+error.message+" in ResourceReportWidget.xml at resourceReport.js, queryCSVFaultHandler");
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
				if (selectby === "point") doc.text(marginLeft, y, 'X/Y at map click:');
				else if (selectby === "polygon") doc.text(marginLeft, y, 'X/Y at polygon center:');
				var dd = webMercatorUtils.webMercatorToGeographic(centerPt);
				doc.text(colMarginLeft, y, dd.y.toFixed(5)+" N, "+-1*dd.x.toFixed(5)+" W");
				y += lineHt;
				
				// Add reports
				var query=[], queryTask=[], promises;
				var queries = [];
				var q=0, poiIndex, contactIndex, gameIndex, layersIndex;
				if (hunterResourceReport.pointsOfInterest) {
					queryTask[q] = new QueryTask(hunterResourceReport.pointsOfInterest.url);
					query[q] = new Query();
					// use fast bounding box query. Will only go to the server if bounding box is outside of the visible map.
					// then filter later.
					query[q].geometry = theArea;
					query[q].returnGeometry = true;
					query[q].spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
					query[q].outFields = ["*"]; 
					queries.push(queryTask[q].execute(query[q]));
					poiIndex = q;
					q++;
				}
				if (hunterResourceReport.contactBoundaries){
				
					query[q] = new Query();
					queryTask[q] = new QueryTask(hunterResourceReport.contactBoundaries.url);
					//query[q].geometry = theArea;
					query[q].returnGeometry = true;
					query[q].spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
					query[q].outFields = ["*"]; 
					query[q].geometry = centerPt;
					queries.push(queryTask[q].execute(query[q]));
					contactIndex = q;
					q++;
				}
				if (hunterResourceReport.gameBoundaries) {
					query[q] = new Query();
					queryTask[q] = new QueryTask(hunterResourceReport.gameBoundaries.url);
					//query[q].geometry = theArea;
					query[q].returnGeometry = true;
					query[q].spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
					query[q].outFields = ["*"]; 
					query[q].geometry = centerPt;
					queries.push(queryTask[q].execute(query[q]));
					gameIndex = q;
					q++;
				}
				for (var i=0; i<reports.length; i++) {
					layersIndex = q;
					queryTask[q] = new QueryTask(reports[i].url);
					query[q] = new Query();
					// use fast bounding box query. Will only go to the server if bounding box is outside of the visible map.
					// then filter later. Have to set returnGeometry to true!!!
					if (reports[i].type ==="list"){
						query[q].geometry = centerPt;
					}
					else {
						query[q].geometry = theArea;
					}
					query[q].returnGeometry = true;
					query[q].spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
					query[q].outFields = ["*"];
					queries.push(queryTask[q].execute(query[q]));
					q++;
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
					if (hunterResourceReport.gameBoundaries) {
						// Location & Contact Info
						y += lineHt;
						doc.setFontSize(16);
						doc.setFont(myFont,"bold");
						if (selectby === "polygon") doc.text(marginLeft, y, "Location & Contact Information (at polygon center):");
						else doc.text(marginLeft, y, "Location & Contact Information (at map click):");
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
					if (hunterResourceReport.contactBoundaries){
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
						if (results[contactIndex].features[0].attributes.USFS_FOName){
							y += lineHt*2;
							doc.setFont(myFont,"bold");
							doc.text(marginLeft, y, "USFS");
							doc.setLineWidth(0.5);
							doc.line(marginLeft,y+1,marginLeft+34, y+1);
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
					if (hunterResourceReport.pointsOfInterest){
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
							if(theArea.contains(feature.geometry)){
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
							doc.text(marginLeft, y, "Campsites"+bufferDistTitle+":");
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
							doc.text(marginLeft, y, "Information resources"+bufferDistTitle+":");
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
						if (hunterResourceReport.gameBoundaries || hunterResourceReport.contactBoundaries || hunterResourceReport.pointsOfInterest){ 
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
					// for point query add to title
					if (reports[0].type === "list"){
						if (selectby === "polygon") doc.text(marginLeft, y, reports[0].title.replace("_distance_",bufferDist)+" (at polygon center)");
						else if (selectby === "point") doc.text(marginLeft, y, reports[0].title.replace("_distance_",bufferDist)+" (at map click)");
					}
					else
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
						if (hunterResourceReport.gameBoundaries) r++;
						if (hunterResourceReport.contactBoundaries) r++;
						if (hunterResourceReport.pointsOfInterest) r++;
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
						var r=0; // index for results array
						// if there were hunting reports increment index
						if (hunterResourceReport.gameBoundaries) r++;
						if (hunterResourceReport.contactBoundaries) r++;
						if (hunterResourceReport.pointsOfInterest) r++;
						for(var i=0; i<reports.length; i++){		
							// main title	
							if (reports[i].title && reports[i].title != ""){
								footer();
								y = marginTop+14;
								doc.addPage();
								doc.setFontSize(16);
								doc.setFont(myFont,"bold");
								// for point query add to title
								if (reports[i].type === "list"){
									if (selectby === "polygon") doc.text(marginLeft, y, reports[i].title.replace("_distance_",bufferDist)+" (at polygon center)");
									else if (selectby === "point") doc.text(marginLeft, y, reports[i].title.replace("_distance_",bufferDist)+" (at map click)");
								}
								else
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
							for (var p = 0; p < results[r].features.length; p++) {
								feature = results[r].features[p];
								attr = feature.attributes;
								//if point is in the selected area
								if((feature.geometry.type == "point" && theArea.contains(feature.geometry)) ||
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
								if (reports[i].sortorder === "descending")
									table.sort(descendingSortMultipleArryOfObj(reports[i].sortfields));
								else
									table.sort(sortMultipleArryOfObj(reports[i].sortfields));
								
								// NEW 1-17-23 table or list
								if (reports[i].type === "list") list(reports[i].subtitle,table,header);
								else grid(reports[i].subtitle,table,header);
							}
							r++;
							colWidths=null;
							header=null;
						}
						footer();
						// Add map
						addMap();
					}
				}
				
				function queryFaultHandler(error) {
					alert("Error message: "+error.message+" in ResourceReportWidget.xml at resourceReport.js, queryFaultHandler");
					document.getElementById("reportMsg1").innerHTML = "";
					document.getElementById("reportMsg2").innerHTML = "";
				}
				
				function list(title, arr, header){
					// title
					if (title !== ""){
						doc.setFont(myFont,"bold");
						doc.setFontSize(fontsize);
						doc.myText(marginLeft, y, title, {underline: true});
						// header - grey outlined box with text
						y += lineHt;
					}
					doc.setFont(myFont,"normal");
					for(var i=0;i<header.length;i++){
						if(header[i].displayname){
							doc.text(marginLeft,y,header[i].displayname+":");
							doc.text(colMarginLeft,y,arr[0][header[i].field].toString());
							y += lineHt;
						}
					}
					y += lineHt;
				}
				function grid(title, arr, header) {
					// draw a table, check for new page
					// arr is and array of data
					// header is and array of the header fields
					function printHeader(){
						// title
						if (title !== ""){
							doc.setFont(myFont,"bold");
							doc.setFontSize(fontsize);
							doc.myText(marginLeft, y, title, {underline: true});
							// header - grey outlined box with text
							y += 5;
						}
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
						if (window.location.hostname.indexOf("ndis-2020-dev") > -1){
							img.src = "assets/images/testmap.jpg";
							alert("The image in the pdf is a placeholder. <a href='"+result.url+"' target='pdf_image'>Here is a link to the true image.</a>","Note for Test Site");
						}
						// *** TODO ***  remove this when Bob installs SSL at CPW
						else if (window.location.hostname.toLowerCase().indexOf("gisweb") > -1){
							img.src = result.url.replace("https","http");
						}
						else if (printServiceUrl.indexOf(window.location.hostname) === -1)
							alert("The fastmap url machine name or alias must match the printserviceurl in the ResourceReport.xml file.","Data Error");
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
			var bufferDistTitle="";
			var bufferList;
			var bufferUnitsLabel;
			var hunterResourceReport = {
				pointsOfInterest: null,
				contactBoundaries: null,
				gameBoundaries: null
			};
			var reports = [];
			var download_buttons = [];
			var numDatabaseCalls = 0;
			var processedDatabaseCalls;
			var basemapUrl;
			var reportToolbar;
			var centerPt=null;
			var theArea=null;
			var reportTitle;
			var mapTitle;
			var mapSubTitle;
			var disclaimer;
			var selectby;
			var selectBtn;
			var distanceTitle="";
			var marginLeft = 18; // .25 inches
			var marginTop = 18;
			var dpi = 300;
			var pageWidth = 792 - (2*marginLeft); // 11 inches * 72 - margins
			var pageHeight = 612 - (marginTop); // height of page (8.5*72) - bottom margin
			var mapWidthPxs;
			var mapHeightPxs;
			//var mapWidthPts;
			//var mapHeightPts;
			var doc = new jsPDF("landscape","pt","letter");
			//var printServiceUrl;
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
						if(xmlDoc.getElementsByTagName("reports")[0]) alert("Warning: The reports tag has been renamed 'custom_reports'. Please fix this in "+configFile,"Data Error");
						var reportsTag = xmlDoc.getElementsByTagName("custom_reports")[0] && xmlDoc.getElementsByTagName("custom_reports")[0].getElementsByTagName("report") ? xmlDoc.getElementsByTagName("custom_reports")[0].getElementsByTagName("report") : null; 
						if(xmlDoc.getElementsByTagName("reportserviceurl")[0])alert("reportserviceurl tag is no longer used in ResourceReportWidget.xml");
						if(xmlDoc.getElementsByTagName("printserviceurl")[0])alert("printserviceurl tag is no longer used in ResourceReportWidget.xml");
						basemapUrl = xmlDoc.getElementsByTagName("basemapurl")[0] ? xmlDoc.getElementsByTagName("basemapurl")[0].firstChild.nodeValue : showWarning("basemapurl tag");
						reportTitle = xmlDoc.getElementsByTagName("reporttitle")[0] ? xmlDoc.getElementsByTagName("reporttitle")[0].firstChild.nodeValue : showWarning("reporttitle tag");
						selectby = xmlDoc.getElementsByTagName("selectby")[0] ? xmlDoc.getElementsByTagName("selectby")[0].firstChild.nodeValue : "point";
						var download_buttonsTag = xmlDoc.getElementsByTagName("download_buttons")[0]  && xmlDoc.getElementsByTagName("download_buttons")[0].getElementsByTagName("button") ? xmlDoc.getElementsByTagName("download_buttons")[0].getElementsByTagName("button") : null; ;

						if (selectby === "polygon"){
							selectBtn = "reportPolyBtn";
							document.getElementById("polyReport").style.display = "block";
							document.getElementById("pointReport").style.display = "none";
							bufferDist = ""; // for title, _distance__ in the title gets replaced with the point buffer distance
						} else if (selectby === "point"){
							selectBtn = "reportPtBtn";
							var buffer = xmlDoc.getElementsByTagName("buffer")[0] ? xmlDoc.getElementsByTagName("buffer")[0] : showWarning("buffer tag");
							bufferDist = buffer.getAttribute("default") ? buffer.getAttribute("default") : (25, showWarning("default attribute of the buffer tag"));
							bufferList = buffer.getAttribute("list") ? buffer.getAttribute("list").split(",") : (["5","10","25","50","100"], showWarning("list attribute of the buffer tag"));
							bufferUnitsLabel = buffer.getAttribute("unitslabel") ? buffer.getAttribute("unitslabel") : ("mile", showWarning("unitslabel attribute of the buffer tag"));
							document.getElementById("pointReport").style.display = "block";
							document.getElementById("polyReport").style.display = "none";
						} else {
							alert("Error in ResourceReportWidget.xml file. selectby tag must be point or polygon. If tag is missing 'point' will be assumed.");
						}
						
						// Hunter Resource Report
						if (xmlDoc.getElementsByTagName("pointsofinterest")[0])
						{
							hunterResourceReport.pointsOfInterest = {
								url: xmlDoc.getElementsByTagName("pointsofinterest")[0].getAttribute("url"),
								name: xmlDoc.getElementsByTagName("pointsofinterest")[0].getAttribute("name")
							};
						}
						if (xmlDoc.getElementsByTagName("contactinfo")[0])
						{
							hunterResourceReport.contactBoundaries = {
								url: xmlDoc.getElementsByTagName("contactinfo")[0].getAttribute("url"),
								name: xmlDoc.getElementsByTagName("contactinfo")[0].getAttribute("name")
							};
						}
						if (xmlDoc.getElementsByTagName("gameunits")[0])
						{
							hunterResourceReport.gameBoundaries = {
								url: xmlDoc.getElementsByTagName("gameunits")[0].getAttribute("url"),
								name: xmlDoc.getElementsByTagName("gameunits")[0].getAttribute("name")
							};
						}
						
						var obj;
						// Custom Reports
						if (reportsTag){
							for (i=0; i<reportsTag.length; i++)
							{
								obj = {
									url: reportsTag[i].getAttribute("url")?reportsTag[i].getAttribute("url"):showWarning("report tag, url attribute"),
									id: reportsTag[i].getAttribute("id")?reportsTag[i].getAttribute("id"):showWarning("report tag, id attribute"),
									type: reportsTag[i].getAttribute("type")?reportsTag[i].getAttribute("type"):showWarning("report tag, type attribute"),
									title: reportsTag[i].getAttribute("title")?reportsTag[i].getAttribute("title"):"",
									subtitle: reportsTag[i].getAttribute("subtitle")?reportsTag[i].getAttribute("subtitle"):"",
									displayfields: reportsTag[i].getAttribute("displayfields")?reportsTag[i].getAttribute("displayfields").split(","):showWarning("report tag, displayfields attribute"),
									fields: reportsTag[i].getAttribute("fields")?reportsTag[i].getAttribute("fields").split(","):showWarning("report tag, fields attribute"),
									where_field: reportsTag[i].getAttribute("where_field")?reportsTag[i].getAttribute("where_field"):"",
									where_inequality: reportsTag[i].getAttribute("where_inequality")?reportsTag[i].getAttribute("where_inequality"):"",
									where_value: reportsTag[i].getAttribute("where_value")?reportsTag[i].getAttribute("where_value"):"",
									where_type: reportsTag[i].getAttribute("where_type")?reportsTag[i].getAttribute("where_type"):"",
									sortfields: reportsTag[i].getAttribute("sortfields")?reportsTag[i].getAttribute("sortfields").split(","):reportsTag[i].getAttribute("fields").split(","),
									sortorder: reportsTag[i].getAttribute("sortorder")?reportsTag[i].getAttribute("sortorder"):"ascending",
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

						if (download_buttonsTag){
							for (i=0; i<download_buttonsTag.length; i++)
							{
								obj = {
									visOnly: download_buttonsTag[i].getAttribute("onlyIfVisible")?download_buttonsTag[i].getAttribute("onlyIfVisible") === "true".toLowerCase():false,
									url: download_buttonsTag[i].getAttribute("url")?download_buttonsTag[i].getAttribute("url"):showWarning("button tag, url attribute"),
									ids: download_buttonsTag[i].getAttribute("ids")?download_buttonsTag[i].getAttribute("ids"):showWarning("button tag, ids attribute"),
									label: download_buttonsTag[i].getAttribute("label")?download_buttonsTag[i].getAttribute("label"):showWarning("button tag, label attribute"),
									displayfields: download_buttonsTag[i].getAttribute("displayfields")?download_buttonsTag[i].getAttribute("displayfields").split(","):showWarning("report tag, displayfields attribute"),
									fields: download_buttonsTag[i].getAttribute("fields")?download_buttonsTag[i].getAttribute("fields").split(","):showWarning("report tag, fields attribute"),
									where_field: download_buttonsTag[i].getAttribute("where_field")?download_buttonsTag[i].getAttribute("where_field"):"",
									where_inequality: download_buttonsTag[i].getAttribute("where_inequality")?download_buttonsTag[i].getAttribute("where_inequality"):"",
									where_value: download_buttonsTag[i].getAttribute("where_value")?download_buttonsTag[i].getAttribute("where_value"):"",
									where_type: download_buttonsTag[i].getAttribute("where_type")?download_buttonsTag[i].getAttribute("where_type"):"",
									sortfields: download_buttonsTag[i].getAttribute("sortfields")?download_buttonsTag[i].getAttribute("sortfields").split(","):download_buttonsTag[i].getAttribute("fields").split(","),
									sortorder: download_buttonsTag[i].getAttribute("sortorder")?download_buttonsTag[i].getAttribute("sortorder"):"ascending",
									keyField: download_buttonsTag[i].getAttribute("key")?download_buttonsTag[i].getAttribute("key"):null,
									database: download_buttonsTag[i].getAttribute("database")?download_buttonsTag[i].getAttribute("database"):null,
									filename: download_buttonsTag[i].getAttribute("filename")?download_buttonsTag[i].getAttribute("filename"):null,
									one2one_fields: download_buttonsTag[i].getAttribute("one2one_fields")?download_buttonsTag[i].getAttribute("one2one_fields").split(","):null,
									one2one_display: download_buttonsTag[i].getAttribute("one2one_display")? download_buttonsTag[i].getAttribute("one2one_display").split(","):download_buttonsTag[i].getAttribute("one2one_fields")?download_buttonsTag[i].getAttribute("one2one_fields").split(","):null,
									one2many_fields: download_buttonsTag[i].getAttribute("one2many_fields")?download_buttonsTag[i].getAttribute("one2many_fields").split(","):null,
									one2many_display: download_buttonsTag[i].getAttribute("one2many_display")?download_buttonsTag[i].getAttribute("one2many_display").split(","):download_buttonsTag[i].getAttribute("one2many_fields")?download_buttonsTag[i].getAttribute("one2many_fields").split(","):null
								};
								download_buttons.push(obj);
								// lookup data in database if necessary
								if (obj.database && obj.database != "")
								{
									numDatabaseCalls++;
								}
								obj = null;
							}

							addDownloadButtons();
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