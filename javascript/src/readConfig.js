// Read config.xml file and also URL paramaters
// globals
var locator;
var addressGraphicsCount = []; // store names of graphics layers used to display address.
var addressGraphicsCounter = 0;
var layerObj; // holds layer id, visiblelayers, visible when read from url &layer=...
function unloadHandler(evt) {
	// prevent memory leaks on exit
	// remove all event handler functions
	//myUnload.remove();
}
//*****************
//  Overview Map
//*****************
function addOverviewMap() {
	require(["esri/dijit/OverviewMap"], function(OverviewMap) {
		var overviewMap = new OverviewMap({
			id: "ovMap",
			map: map,
			attachTo: "top-left",
			visible: false
		});
		overviewMap.startup();
	});
}
// *********************
//   Address Functions
// *********************							
function lookupAddress() {
	require(["dojo/dom"], function(dom){
		// Google Analytics count how many times Address is clicked on
		if (typeof ga === "function"){
			//ga('send', 'event', "address", "click", "Address", "1");
			if (typeof gtag === "function")gtag('event','click',{'widget_name': 'Address','app_name': app});
		}

		var addr = dom.byId("streetTxt").value;
		// protect against xss attacks
		var regexp=/([^a-zA-Z0-9 \-\',\.()])/g; 
		if (regexp.test(addr)) {
			addr=addr.replace(regexp,""); // clean it
			dom.byId("streetTxt").value=addr;
			alert("Illegal characters were removed from the address.","Warning");
			return;
		}

		var city = dom.byId("cityTxt").value;
		// protect against xss attacks
		regexp=/([^a-zA-Z0-9 \-\'()])/g; 
		if (regexp.test(city)) {
			city=city.replace(regexp,""); // clean it
			dom.byId("cityTxt").value = city;
			alert("Illegal characters were removed from the city.","Warning");
			return;
		}

		var zip = dom.byId("zipTxt").value;
		// protect against xss attacks
		regexp=/([^0-9 \-])/g; 
		if (regexp.test(zip)) {
			zip=zip.replace(regexp,""); // clean it
			dom.byId("zipTxt").value = zip;
			alert("Illegal characters were removed from the zip code.","Warning");
			return;
		}
		
		if (addr!=="" && city!=="") {
			require(["esri/geometry/Extent"],function(Extent){
				showLoading();
				dom.byId("addressLoading").style.display = "block";
				var address = {
					"Address": addr,
					"City": city,
					"Region": "CO",
					"Postal": zip
				};
				locator.outSpatialReference = map.spatialReference;
				var ext = new Extent({
					"xmin": -12350000,
					"ymin": 4250000,
					"xmax": -11150000,
					"ymax": 5250000,
					"spatialReference": {
						"wkid": wkid
					}
				});
				var options = {
					address: address,
					searchExtent: ext
				};
				locator.addressToLocations(options,onAddressResults,onAddressFault);
			});
		}else{
			hideLoading();
			dom.byId("addressLoading").style.display = "none";
			alert("Street and City are required fields.","Warning");
		}
	});
}
function onAddressResults(evt) {
	try{
		require(["dojo/dom","esri/symbols/SimpleMarkerSymbol", "esri/symbols/PictureMarkerSymbol", "esri/graphic", "esri/symbols/Font", "esri/symbols/TextSymbol", "dojo/_base/Color"], function (dom, SimpleMarkerSymbol, PictureMarkerSymbol, Graphic, Font, TextSymbol, Color) {
			hideLoading();
			dom.byId("addressLoading").style.display = "none";
			var candidate;
			var symbol = new PictureMarkerSymbol("assets/images/i_address.png", 30, 30);
			var geom;
			evt.every(function (candidate) {
				if (candidate.score > 40) {
					var addressGraphicsLayer;
					require(["esri/layers/GraphicsLayer", "dojo/_base/Color"], function (GraphicsLayer, Color) {
						geom = candidate.location;
						addressGraphicsLayer = new GraphicsLayer();
						addressGraphicsLayer.id = "addressgraphics" + addressGraphicsCounter;
						addressGraphicsCount.push(addressGraphicsLayer.id);
						addressGraphicsCounter++;
						addressGraphicsLayer.add(new Graphic(geom, symbol));
						var displayText = candidate.address;
						var font = new Font("10pt", Font.STYLE_NORMAL, Font.VARIANT_NORMAL, Font.WEIGHT_BOLD, "Helvetica");
						var yellow = new Color([255, 255, 153, 255]);
						var textSymbol = new TextSymbol(displayText, font, new Color("#000000"));
						textSymbol.setOffset(0, -23);
						var highlight1 = new esri.symbol.TextSymbol(displayText, font, yellow);
						highlight1.setOffset(1, -25);
						var highlight2 = new esri.symbol.TextSymbol(displayText, font, yellow);
						highlight2.setOffset(0, -24);
						var highlight3 = new esri.symbol.TextSymbol(displayText, font, yellow);
						highlight3.setOffset(0, -22);
						var highlight4 = new esri.symbol.TextSymbol(displayText, font, yellow);
						highlight4.setOffset(-1, -21);
						var highlight5 = new esri.symbol.TextSymbol(displayText, font, yellow);
						highlight5.setOffset(2, -23);
						var highlight6 = new esri.symbol.TextSymbol(displayText, font, yellow);
						highlight6.setOffset(-2, -23);
						addressGraphicsLayer.add(new esri.Graphic(geom, highlight1));
						addressGraphicsLayer.add(new esri.Graphic(geom, highlight2));
						addressGraphicsLayer.add(new esri.Graphic(geom, highlight3));
						addressGraphicsLayer.add(new esri.Graphic(geom, highlight4));
						addressGraphicsLayer.add(new esri.Graphic(geom, highlight5));
						addressGraphicsLayer.add(new esri.Graphic(geom, highlight6));
						addressGraphicsLayer.add(new Graphic(geom, textSymbol));
						map.addLayer(addressGraphicsLayer);
						return false; //break out of loop after one candidate with score greater than 40 is found.
					});
				}
			});
			if (geom !== undefined) {
				map.centerAndZoom(geom, 6); // 4-21-17 Updated lods, used to be 12.
				return true;
			} else {
				alert("Address was not found.", "Note");
				return false;
			}
		});
	} catch (e) {
		alert("Error looking up address: " + e.message, "Code Error", e);
		return false;
	}
}
function onAddressFault(err) {
	require(["dojo/dom"], function (dom) {
		hideLoading();
		dom.byId("addressLoading").style.display = "none";
		alert("Error occurred searching for address. Address service may be down. Service name is: " + locator.url + ". " + err.message, "Code Error", err);
	});
}
function clearAddress() {
	if (addressGraphicsCount.length == 0)
		return;
	map.getLayer(addressGraphicsCount.pop()).clear();
}
//**********************
// Read config.xml file
//**********************
function readConfig() {
	require(["dojo/dom", "dojo/io-query", "esri/layers/ArcGISDynamicMapServiceLayer", "esri/layers/FeatureLayer", "esri/tasks/GeometryService", "esri/SpatialReference", "esri/tasks/ProjectParameters", "esri/map", "esri/geometry/Extent", "esri/dijit/Popup", "esri/symbols/SimpleFillSymbol", "esri/tasks/locator", "dijit/form/CheckBox", "agsjs/dijit/TOC", "esri/symbols/SimpleLineSymbol", "esri/layers/ArcGISTiledMapServiceLayer", "esri/dijit/BasemapGallery", "esri/dijit/Basemap", "esri/dijit/BasemapLayer", "esri/arcgis/utils", "esri/dijit/Gallery", "dojo/sniff"], function (dom, ioquery, ArcGISDynamicMapServiceLayer, FeatureLayer, GeometryService, SpatialReference, ProjectParameters, Map, Extent, Popup, SimpleFillSymbol, Locator, CheckBox, TOC, SimpleLineSymbol, ArcGISTiledMapServiceLayer, BasemapGallery, Basemap, BasemapLayer, arcgisUtils, Gallery, has) {
		var xmlDoc; // config.xml document json
		var ext;
		var tries={}; // number of times we have tried to load each map layer
		var loadedFromCfg; // true when the layer has loaded and set the visiblelayers when setting layers from URL
		//----------------------------------------------------------------
		// Add Points, Lines, Polygons, Rectangles, Labels
		//----------------------------------------------------------------
		function addGraphicsAndLabels() {
			try {
				var sr;
				var regexp;
				if (!queryObj.prj || queryObj.prj == "")
					sr = new SpatialReference(102100);
				else
					sr = new SpatialReference(parseInt(queryObj.prj));

				//----------------------------
				//        Add points
				//----------------------------
				// points = circle|size|color|alpha(transparency)|outline color|outline width|x|y|
				//   text|font|font size|color|bold as t or f|italic as t or f|underline as t or f|placement|offset, next point...
				// For example: circle|10|4173788|1|0|1|-11713310|4743885|480;779; 4;333;990|1|12|4173788|t|f|f|above|5
				if (queryObj.point && queryObj.point != "") {
					addPoints(queryObj.point, sr);
				}
				
				//----------------------------
				//        Add lines
				//----------------------------
				// &line= style | color | alpha | lineWidth | number of paths | [number of points | x | y | x | y |... repeat for each path] 
				// |x|y|label|font|font-size|color|bold|italic|underline|placement|offset, repeat for each line
				// &line=solid|4173788|1|5|1|3|-11900351|4800983|-11886749|4805344|-11883462|4812449|-11891907|4806716|10.5 mi|1|12|4173788|t|f|f|above|5
				if (queryObj.line && queryObj.line != "") {
					addLines(queryObj.line, sr);
				}
				//----------------------------
				//        Add polygons
				//----------------------------
				// &poly=  fillStyle | fillColor | fillAlpha | lineStyle | lineColor | lineWidth | 
				// number of rings | number of points | x | y | x | y |... repeat for each ring , repeat for each polygon
				// fillAlpha is now in fillColor (was used in flex), lineStyle = solid, lineWidth = 2
				if (queryObj.poly && queryObj.poly != "") {
					addPolys(queryObj.poly, sr);
				}
				//----------------------------
				//        Add rectangles
				//----------------------------
				// &rect=  fillStyle | fillColor | fillAlpha | lineStyle | lineColor | lineWidth | 
				// number of rings | number of points | x | y | x | y |... repeat for each ring , repeat for each polygon
				// fillAlpha is now in fillColor (was used in flex), lineStyle = solid, lineWidth = 2
				if (queryObj.rect && queryObj.rect != "") {
					addRects(queryObj.rect, sr);
				}
				//----------------------------
				//        Add labels
				//----------------------------
				// &text=x|y|text|font|font size|color|bold as t or f|italic as t or f|underline as t or f
				// font, color, bold, italic, and underline are not used in this version. They default to Helvetica, black, bold
				if (queryObj.text && queryObj.text != "") {
					addLabels(queryObj.text, sr);
				}
				sr = null;
			} catch (e) {
				alert("Error loading graphics from the URL. In javascript/readConfig.js. Error message: " + e.message, "URL Graphics Error", e);
			}
		}

		//******************
		//  ADD MAP LAYERS
		//
		//  addMapLayers calls creatLayer for each layer in the operationallayers tag in the config.xml file.
		//  createLayer calls layerLoadedHandler or layerLoadFailedHandler
		//  layerLoadFailedHandler waits then calls createLayer again, reports error after 5 tries and increases time between calls to 30 seconds.
		//  layerLoadedHandler adds layer to legendLayers and the map.
		//  map.on("layer-add-result") listens for layer to load to map. Updates the toc with new layers. Waits for all to have tried to load,
		//  reorders legendLayers and map layers
		//******************
		function addMapLayers(){
			// 3-21-22 use layer.on("load") and layer.on("error") to make sure layers have loaded

			// Create Layer 3-21-22
			// Get layers from url of config.xml
			function createLayer(layer){
				var id = layer.getAttribute("label");
				var myLayer;
				tries[id]++;
				// Set layer properties on startup if specified on url
				if (queryObj.layer && queryObj.layer != "") {
					if (layer.getAttribute("url").toLowerCase().indexOf("mapserver") > -1) {
						if (layerObj[id]){
							myLayer = new ArcGISDynamicMapServiceLayer(layer.getAttribute("url"), {
									"opacity": layerObj[id].opacity,
									"id": id,
									"visible": layerObj[id].visible,
									"visibleLayers": layerObj[id].visLayers
								});
						// not found on url, not visible
						}else {
							myLayer = new ArcGISDynamicMapServiceLayer(layer.getAttribute("url"), {
									"opacity": Number(layer.getAttribute("alpha")),
									"id": id,
									"visible": false
								});
						}
					}
					// FeatureServer tlb 10/19/20
					else if (layer.getAttribute("url").toLowerCase().indexOf("featureserver") > -1){
						if (layerObj[id]) 
							myLayer = new FeatureLayer(layer.getAttribute("url"), {
									"opacity": Number(layer.getAttribute("alpha")),
									"id": id,
									"visible" : layerObj[id].visible,
									"visibleLayers" : layerObj[id].visLayers
								});
						else
							myLayer = new FeatureLayer(layer.getAttribute("url"), {
									"opacity": Number(layer.getAttribute("alpha")),
									"id": id,
									"visible": false
								});
					}
					else {
						alert("Unknown operational layer type. It must be of type MapServer or FeatureServer. Or edit readConfig.js line 600 to add new type.");
						return;
					}
				// Set layer properties from config.xml file
				} else {
					// MapServer
					if (layer.getAttribute("url").toLowerCase().indexOf("mapserver") > -1){
						if (layer.getAttribute("visible") == "false")
							myLayer = new ArcGISDynamicMapServiceLayer(layer.getAttribute("url"), {
									"opacity": Number(layer.getAttribute("alpha")),
									"id": id,
									"visible": false
								});
						else
							myLayer = new ArcGISDynamicMapServiceLayer(layer.getAttribute("url"), {
									"opacity": Number(layer.getAttribute("alpha")),
									"id": id,
									"visible": true
								});
					} 
					// FeatureServer tlb 9/28/20
					else if (layer.getAttribute("url").toLowerCase().indexOf("featureserver") > -1){
						if (layer.getAttribute("visible") == "false")
							myLayer = new FeatureLayer(layer.getAttribute("url"), {
									"opacity": Number(layer.getAttribute("alpha")),
									"id": id,
									"visible": false
								});
						else
							myLayer = new FeatureLayer(layer.getAttribute("url"), {
									"opacity": Number(layer.getAttribute("alpha")),
									"id": id,
									"visible": true,
								});
					}
					else {
						alert("Unknown operational layer type. It must be of type MapServer or FeatureServer. Or edit readConfig.js line 600 to add new type.");
						return;
					}
				}
				// 3-21-22 check if loaded
				myLayer.on("load", layerLoadedHandler);
				myLayer.on("error", layerLoadFailedHandler);
			}

			// If layer loaded add to legend and map 3-21-22
			function layerLoadedHandler(event){
				try{
					var collapsedFlg;
					var openSubLayers = [];
					var layer;
					// search for layer in xmlDoc
					for (var i=0;i<xmlDoc.getElementsByTagName("operationallayers")[0].getElementsByTagName("layer").length;i++){
						if (event.layer.id === xmlDoc.getElementsByTagName("operationallayers")[0].getElementsByTagName("layer")[i].getAttribute("label")) {
							layer = xmlDoc.getElementsByTagName("operationallayers")[0].getElementsByTagName("layer")[i];
						}
					}
					// layer from config.xml
					if (loadedFromCfg) {
						collapsedFlg = false;
						
						if (layer.getAttribute("open") == "false")
							collapsedFlg = true;
						var oslArr = layer.getAttribute("opensublayer");
						if (oslArr)
							openSubLayers = oslArr.split(",");
						oslArr = null;
					}
					// layer from &map or &layer on url
					else {
						collapsedFlg = true;
						if (event.layer.visible)
							collapsedFlg = false;
						var num = new Array(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
						var j;
						var layerInfos = [];
						// Set gmu = elk, bighorn, or goat based on what was on url	
						if (layerObj[event.layer.id]) {
							layerInfos = event.layer.layerInfos;
							// See what gmu is turned on		   
							if (event.layer.id == "Hunter Reference") {
								for (j = 0; j < layerObj[event.layer.id].visLayers.length; j++) {
									if (layerInfos[layerObj[event.layer.id].visLayers[j]].name.substr(layerInfos[layerObj[event.layer.id].visLayers[j]].name.length - 3, 3).indexOf("GMU") > -1) {
										gmu = layerInfos[layerObj[event.layer.id].visLayers[j]].name;
										break;
									}
								}
							// if gmu was not visible but a game species was selected then set gmu
							} else if (event.layer.id == "Game Species") {
								for (j = 0; j < layerObj[event.layer.id].visLayers.length; j++) {
									if (layerInfos[layerObj[event.layer.id].visLayers[j]].name === "Bighorn Sheep") {
										gmu = "Bighorn GMU";
										break;
									} else if (layerInfos[layerObj[event.layer.id].visLayers[j]].name === "Mountain Goat") {
										gmu = "Goat GMU";
										break;
									}
								}
							}
							// Set default visibility
							for (j = 0; j < layerInfos.length; j++) {
								// If layer is found in the visLayers make it visible.
								if (layerObj[event.layer.id].visLayers.indexOf(layerInfos[j].id) != -1)
									layerInfos[j].defaultVisibility = true;
								// Else if this is not the top layer and it has no sub-layers set default visibility
								else if (layerInfos[j].parentLayerId != -1 && !layerInfos[j].subLayerIds) {
									// if this is a gmu layer make sure it is the one that was turned on in visLayers
									if (layerInfos[j].name.substr(layerInfos[j].name.length - 3, 3).indexOf("GMU") > -1) {
										// handle this later below when all layers have loaded. Need to wait for Game Species to load. If GMU layer is not set was not working.
									}
									// use the default value for sub menu item layers that are under a menu item that is unchecked
									else if ((layerInfos[j].defaultVisibility == true) && (layerObj[event.layer.id].visLayers.indexOf(layerInfos[j].parentLayerId) === -1)) {
										layerObj[event.layer.id].visLayers.push(j);
										// If by default it is visible see if the name of the parent is a number (varies with extent) and make it visible also
										if (num.indexOf(parseInt(layerInfos[layerInfos[j].parentLayerId].name.substr(0, 1))) > -1) {
											layerObj[event.layer.id].visLayers.push(layerInfos[j].parentLayerId);
											layerInfos[layerInfos[j].parentLayerId].defaultVisibility = true;
										}
									}
								// Else this is a top level toc menu item and not found in the visible list, make it not visible.
								} else
									layerInfos[j].defaultVisibility = false;
							}
							event.layer.setVisibleLayers(layerObj[event.layer.id].visLayers.sort(function (a, b) {
								return a - b;
							}));
							event.layer.refresh();
						}	
					}

					legendLayers.push({
						layer: event.layer,
						title: event.layer.id,
						autoToggle: true, // If true, closes the group when unchecked and opens the group when checked. If false does nothing.
						slider: true, // whether to display a transparency slider
						slider_ticks: 3,
						slider_labels: ["transparent", "50%", "opaque"],
						hideGroupSublayers: hideGroupSublayers,
						radioLayers: radioLayers,
						noLegend: true,
						openSubLayers: openSubLayers,
						collapsed: collapsedFlg // whether this root layer should be collapsed initially, default false. 
					});
//console.log("add layer to map "+event.layer.id);
					map.addLayer(event.layer);							
					
					openSubLayers = null;
				} catch (e) {
					alert("Error in readConfig.js/layerLoadedHandler " + e.message, "Code Error", e);
				}
			}

			function layerLoadFailedHandler(event){
				// Layer failed to load 3-21-22
				// Wait 2 seconds, retry up to 5 times, then report the error and continue trying every 30 seconds
				// 3-10-22 NOTE: MVUM is sometimes missing some of the sublayers. Contacted victoria.smith-campbell@usda.gov
				// at USFS and they restarted one of their map services and it fixed the problem.
//console.log(event.target.id+" failed to load!!!!!!!");
//console.log("tries="+tries[event.target.id]);
				var layer;
				for(var i=0;i<xmlDoc.getElementsByTagName("operationallayers")[0].getElementsByTagName("layer").length;i++){
					if (xmlDoc.getElementsByTagName("operationallayers")[0].getElementsByTagName("layer")[i].getAttribute("label") === event.target.id){
						layer = xmlDoc.getElementsByTagName("operationallayers")[0].getElementsByTagName("layer")[i];
						break;
					}
				}
				// Try every 2 seconds for up to 5 times 
				if (tries[event.target.id] < 5){
					setTimeout(function(){createLayer(layer);},2000);
				} 
				// Greater than 5 tries, give warning
				else if (tries[event.target.id] == 5){
					if (event.target.id.indexOf("Motor Vehicle") > -1 || event.target.id.indexOf("Wildfire") > -1 || event.target.id.indexOf("BLM") > -1)
						alert("The external map service that provides "+event.target.id+" is experiencing problems.  This issue is out of CPW control. We will continue to try to load it. We apologize for any inconvenience.","External (Non-CPW) Map Service Error");
					else
						alert(event.target.id+" service is busy or not responding. We will continue to try to load it.","Data Error");
					setTimeout(function(){createLayer(layer);},30000);
				}
				// Greater than 5 tries. Keep trying every 30 seconds
				else {
//DEBUG
//console.log("Retrying to load: "+event.target.id);
//if(event.target.id.indexOf("Hunter Reference")>-1)
//layer.setAttribute("url","https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/HuntingAtlas/HuntingAtlas_Base_Map/MapServer");
//if(event.target.id.indexOf("Game Species")>-1)
//layer.setAttribute("url","https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/HuntingAtlas/HuntingAtlas_BigGame_Map/MapServer");
//if(event.target.id.indexOf("Motor Vehicle")>-1)
//layer.setAttribute("url","https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_MVUM_02/MapServer");
//console.log("url="+layer.getAttribute("url"));
					setTimeout(function(){createLayer(layer);},30000);
				}
			}
			
			//-----------
			// Variables
			//-----------
			loadedFromCfg = true; // the layer is loaded from config.xml. If false loaded from url &layers.

			// Store layers from URL into layerObj
			// 		&layer= basemap | id | opacity | visible layers , id | opacity | visible layers , repeat...
			// 		&layer= streets|layer2|.8|3-5-12,layer3|.65|2-6-10-12
			// 		get array of layers without the basemap stuff;
			if (queryObj.layer && queryObj.layer != "") {
				loadedFromCfg = false; // the layer is loaded from config.xml. If false loaded from url &layers.
				var layersArr = queryObj.layer.substring(queryObj.layer.indexOf("|") + 1).split(",");
				layerObj = {};
				//if (layersArr.length == 1) layersArr.pop(); // remove empty element if no layers are visible
				for (i = 0; i < layersArr.length; i++) {
					// build an array of objects indexed by layer id
					var layerArr = layersArr[i].split("|");
					if (layerArr[0] == "") continue;// tlb 1-5-18 if no layers are visible 
					layerArr[0] = layerArr[0].replace(/~/g, " ");
					if (layerArr.length == 3)
						layerArr.push(true);
					if (layerArr[2] == -1)
						layerObj[layerArr[0]] = {
							"opacity": layerArr[1],
							"visLayers": [], // tlb 1-5-18 used to be [-1],
							"visible": true
						};
					else
						layerObj[layerArr[0]] = {
							"opacity": layerArr[1],
							"visLayers": layerArr[2].split("-"),
							"visible": layerArr[3] == "1" ? true : false
						};
					// Convert visLayers from strings to int using bitwise conversion
					for (j = 0; j < layerObj[layerArr[0]].visLayers.length; j++)
						layerObj[layerArr[0]].visLayers[j] = layerObj[layerArr[0]].visLayers[j] | 0;
				}
			}

			// Get hide GroupSublayers & radioLayers from config.xml
			try {
				if (xmlDoc.getElementsByTagName("hideGroupSublayers")[0] && xmlDoc.getElementsByTagName("hideGroupSublayers")[0].firstChild)
					hideGroupSublayers = xmlDoc.getElementsByTagName("hideGroupSublayers")[0].firstChild.nodeValue.split(",");
			} catch (e) {
				alert("Warning: Missing hideGroupSublayers tag in " + app + "/config.xml file. " + e.message, "Data Error");
			}
			try {
				if (xmlDoc.getElementsByTagName("radiolayers")[0] && xmlDoc.getElementsByTagName("radiolayers")[0].firstChild)
					radioLayers = xmlDoc.getElementsByTagName("radiolayers")[0].firstChild.nodeValue.split(",");
			} catch (e) {
				alert("Warning: Missing radiolayers tag in " + app + "/config.xml file. " + e.message, "Data Error");
			}
			
			// ---------------------------------------------------
			//  Load each Layer from config.xml operationallayers
			// ---------------------------------------------------
			var layer = xmlDoc.getElementsByTagName("operationallayers")[0].getElementsByTagName("layer");
// DEBUG: make if fail
//layer[0].setAttribute("url","https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/HuntingAtlas/HuntingAtlas_Base_Map2/MapServer");
//layer[1].setAttribute("url","https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/HuntingAtlas/HuntingAtlas_BigGame_Map2/MapServer");
//layer[2].setAttribute("url","https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_MVUM_03/MapServer");
			for (i = 0; i < layer.length; i++) {
				tries[layer[i].getAttribute("label")] = 0;				
				createLayer(layer[i]);			
			}
		}

		//*************
		// Add Widgets	
		//*************
		function addWidgets() {
			require(["dojo/dom", "dijit/registry"], function (dom, registry) {
				var str;
				var widgetStr = "";
				for (var w = 0; w < xmlDoc.getElementsByTagName("widget").length; w++) {
					var preload = xmlDoc.getElementsByTagName("widget")[w].getAttribute("preload") == "open" ? true : false;
					var label = xmlDoc.getElementsByTagName("widget")[w].getAttribute("label");
					var widgetHeight = xmlDoc.getElementsByTagName("widget")[w].getAttribute("height");
					var video = xmlDoc.getElementsByTagName("widget")[w].getAttribute("video");
					var icon = xmlDoc.getElementsByTagName("widget")[w].getAttribute("icon");
					if (label == null)
						continue;
					widgetStr += label;
					if (label == "Map Layers & Legend") {
						if (video == null)
							alert("Warning: Missing help video in " + app + "/config.xml file for widget Map Layers & Legend.", "Data Error");
							dom.byId("tocHelp").href = video;
						if (icon)
							document.getElementById("tocIcon").src = icon;
						if (preload)
							registry.byId("tocPane").toggle();
						dom.byId("tocPane").style.display = "block";
						dom.byId("tocPane").style.visibility = "visible";
						if (widgetHeight && widgetHeight != "")
							document.getElementById("tocContent").style.height = widgetHeight + "px";
					} else if (label == "HB1298 Report") {
						if (video == null)
							alert("Warning: Missing help video in " + app + "/config.xml file for widget Map Layers & Legend.", "Data Error");
							dom.byId("hb1298Help").href = video;
						if (icon)
							document.getElementById("hb1298Icon").src = icon;
						document.getElementById("hb1298Pane").style.display = "block";
						if (preload) {
							openedHB1298 = true;
							loadjscssfile("javascript/hb1298.js", "js");
						}
					} else if (label.indexOf("Report") > 0) {
						if (video == null)
							alert("Warning: Missing help video in " + app + "/config.xml file for widget " + label + ".", "Data Error");
							dom.byId("reportHelp").href = video;
						if (icon)
							document.getElementById("reportIcon").src = icon;
						dom.byId("reportTitle").innerHTML = label;
						if (preload)
							registry.byId("reportDiv").toggle();
						dom.byId("reportDiv").style.display = "block";
						dom.byId("reportDiv").style.visibility = "visible";
						reportInit();
					} else if (label == "Feature Search") {
						if (video == null)
							alert("Warning: Missing help video in " + app + "/config.xml file for widget Feature Search.", "Data Error");
							dom.byId("searchHelp").href = video;
						if (icon)
							document.getElementById("searchIcon").src = icon;
						if (preload) {
							registry.byId("searchDiv").toggle();
							openedFeatureSearch = true;
							searchInit();
						}
						dom.byId("searchDiv").style.display = "block";
						dom.byId("searchDiv").style.visibility = "visible";
					} else if (label == "Address") {
						try {
							locator = new Locator(xmlDoc.getElementsByTagName("addressservice")[0].getAttribute("url"));
						} catch (e) {
							alert('Missing tag: addressservice in ' + app + '/config.xml.\n\nTag should look like: &lt;addressservice url="https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates"/&gt;\n\nWill use that url for now.', 'Data Error');
							locator = new Locator("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates");
						}
						if (video == null)
							alert("Warning: Missing help video in " + app + "/config.xml file for widget Address.", "Data Error");
						if (icon)
							document.getElementById("addressIcon").src = icon;
						dom.byId("addressHelp").href = video;
						if (preload)
							registry.byId("addressPane").toggle();
						dom.byId("addressPane").style.display = "block";
						dom.byId("addressPane").style.visibility = "visible";
					} else if (label == "Draw, Label, & Measure") {
						if (video == null)
							alert("Warning: Missing help video in " + app + "/config.xml file for widget Draw, Label, & Measure.", "Data Error");
						dom.byId("drawHelp").href = video;
						if (icon)
							document.getElementById("drawIcon").src = icon;
						if (preload)
							registry.byId("drawDiv").toggle();
						//drawInit(); // in javascript/draw.js called in identify.js/readSettingsWidget because it needs XYProjection from this file.
						dom.byId("drawDiv").style.display = "block";
						dom.byId("drawDiv").style.visibility = "visible";
					} else if (label == "Bookmark") {
						if (video == null)
							alert("Warning: Missing help video in " + app + "/config.xml file for widget Bookmark.", "Data Error");
						dom.byId("bookmarkHelp").href = video;
						if (icon)
							document.getElementById("bookmarkIcon").src = icon;
						setBookmarks(); // in javascript/bookmarks.js
						if (preload)
							registry.byId("bookmarkDiv").toggle();
						dom.byId("bookmarkDiv").style.display = "block";
						dom.byId("bookmarkDiv").style.visibility = "visible";
					} else if (label == "Settings") {
						if (video == null)
							alert("Warning: Missing help video in " + app + "/config.xml file for widget Settings.", "Data Error");
							dom.byId("settingsHelp").href = video;
						if (icon)
							document.getElementById("settingsIcon").src = icon;
						if (preload)
							registry.byId("settingsDiv").toggle();
						dom.byId("settingsDiv").style.display = "block";
						dom.byId("settingsDiv").style.visibility = "visible";
					} else if (label == "Find a Place") {}
					else if (label == "Print") {
						if (icon)
							document.getElementById("printIcon").src = icon;
					} else if (label == "Identify") {}
					else if (label == "GetExtent") {
						if (icon)
							document.getElementById("extentIcon").src = icon;
					} else if (label == "MapLink") {
						if (icon)
							document.getElementById("linkIcon").src = icon;
					} else {
						alert("Error in " + app + "/config.xml widget. Label: " + label + " was not found.  \n\nAvailable options include:\n\tMap Layers & Legend\n\t" + "<something> Resource Report \n\tFeature Search\n\tAddress\n\tDraw, Label, & Measure\n\tBookmark\n\tFind a Place\n\tPrint\n\t" + "Settings\n\tIdentify\n Edit javascript/readConfig.js to change this.", "Data Error");
					}
				}
				// read the PrintPdfWidget.xml file
				printInit();
				// Hide widgets
				if (widgetStr.indexOf("Map Layers & Legend") == -1)
					dom.byId("tocPane").style.display = "none";
				else if (dom.byId("reportDiv") && widgetStr.indexOf("Report") == -1)
					dom.byId("reportDiv").style.display = "none";
				else if (widgetStr.indexOf("Feature Search") == -1)
					dom.byId("searchDiv").style.display = "none";
				else if (widgetStr.indexOf("Address") == -1)
					dom.byId("addressPane").style.display = "none";
				else if (widgetStr.indexOf("Draw, Label, & Measure") == -1)
					dom.byId("drawDiv").style.display = "none";
				else if (widgetStr.indexOf("Bookmark") == -1)
					dom.byId("bookmarkDiv").style.display = "none";
				else if (widgetStr.indexOf("Settings") == -1)
					dom.byId("settingsDiv").style.display = "none";
				
				// Add Links
				var linkStr = '<span class="link"><a href="' + app + '/help.html" target="help"><img src="assets/images/i_help.png"/>Help</a></span>';
				var link = xmlDoc.getElementsByTagName("links")[0].getElementsByTagName("link");
				var licenseURL="";
				for (var i = 0; i < link.length; i++) {
					// load mobile app with url parameters
					if (link[i].getAttribute("label") == "Go Mobile"){
						linkStr += '<span class="link"><a href="' + window.location.href.replace("index", "indexM") + '" target="_top"><img src="' + link[i].getAttribute("icon") + '"/>' + link[i].getAttribute("label") + '</a></span>';
					}
					else if (link[i].getAttribute("label") == "Buy License!"){
						licenseURL = link[i].getAttribute("url").replace("%3F", "?").replace("%26", "&");
						linkStr += '<span class="link"><a id="licenseLink"><img src="' + link[i].getAttribute("icon") + '"/>' + link[i].getAttribute("label") + '</a></span>';
					}
					else
						linkStr += '<span class="link"><a href="' + link[i].getAttribute("url").replace("%3F", "?").replace("%26", "&") + '" target="_new"><img src="' + link[i].getAttribute("icon") + '"/>' + link[i].getAttribute("label") + '</a></span>';
				}
				dom.byId("links").innerHTML = linkStr;
				// Add Google Analytics tracking
				if (document.getElementById("licenseLink") && typeof ga === "function"){
					document.getElementById("licenseLink").addEventListener("click",function(){
						// open CPW buy license page and count how many times it is clicked on
						// Google Analytics count how many times Buy License is clicked on
						//ga('send', 'event', 'buy_license', 'click', 'Buy License', '1');
						if (typeof gtag === "function")gtag('event','click',{'widget_name': 'Buy License','app_name': app});
						window.open(licenseURL, "_new");
					});
				}

				addMapLayers(); //3-21-22
			});
		}

		//********************
		//     Add Map
		//********************
		function addMap() {
			require(["esri/layers/OpenStreetMapLayer","dojo/dom", "dijit/registry", "dojo/sniff", "dojo/on"], function (OpenStreetMapLayer,dom, registry, has, on) {
				try {
					// labels for slider scale bar
				//var labels = [9244,4622,2311,1155,577,288,144,72,36,18,9,4,2,1];
					//var labels = [4622,1155,288,72,18,4,1];
					//var labels = [9244,2311,577,144,36,9,2];
					// set sliderStyle: "large" for long slider
					// Set initial basemap. Available basemaps:  streets, satellite, hybrid, topo, gray, ocean, osm, and national_geographic		
					// showAttribution=true shows the name of the basemap next to the logo.
					// displayGraphicsOnPan=false for IE may speed up pans
					//			basemap: "streets",
					// 	sliderLabels: labels,
					mapBasemap = "streets";
					if (queryObj.layer && queryObj.layer != "") {
						var basemapArr = queryObj.layer.substring(0, queryObj.layer.indexOf("|")).split(",");
							// old version used 0,1,2|... and first one was selected basemap.
							if (basemapArr[0] == 0)
								mapBasemap = "streets";
							else if (basemapArr[0] == 1)
								mapBasemap = "hybrid";
							else if (basemapArr[0] == 2)
								mapBasemap = "topo";
							else
								mapBasemap = basemapArr[0];
							basemapArr = null;
					}
					//map.setExtent(initExtent);
					map.infoWindow.resize(330, 350);
					// print preview map
					// 4-19-17 added custom lods from 9M to 1K. Used to have 19 levels, now it has 12.
					customLods = [{
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
						}, {
							"level": 15,
							"resolution": 4.77731426794937,
							"scale": 18055.954822
						}
					];
					previewMap = new Map("printPreviewMap", {
							extent: initExtent,
							autoResize: true,
							showAttribution: false,
							logo: false,
							basemap: "streets",
							isRubberBandZoom: true,
							isScrollWheelZoom: true,
							isShiftDoubleClick: true,
							displayGraphicsOnPan: !has("ie"),
							sliderStyle: "large",
							minScale: 9244649,
							lods: customLods
						});
					customLods = null;
						
					// Add basemaps by hand to use raster tile layers. vector tile layers require ArcGIS 10.5.1. These are used when
					// showArcGISBasemaps is set to true.
					var basemaps = [];
					var layer;
					var basemap;
					// Streets
					layer=new BasemapLayer({url:"https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"});
					basemap = new Basemap({
						layers:[layer],
						title:"Streets",
						id:"streets",
						thumbnailUrl:"https://www.arcgis.com/sharing/rest/content/items/f81bc478e12c4f1691d0d7ab6361f5a6/info/thumbnail/street_thumb_b2wm.jpg"
					});
					basemaps.push(basemap);
					
					// Streets Relief Vector 10-30-20
					// The hill shade is not vector. The vector tiles are the annotation in World_Basemap_v2 in the root.json.
					// The hill shade layer flashes on then the streets slowly paints. 
					// DO NOT USE!!
					/*layers=[];
					layer=new BasemapLayer({url:"https://server.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer"});
					layers.push(layer);
					layer = new BasemapLayer({
						styleUrl: "https://www.arcgis.com/sharing/rest/content/items/b266e6d17fc345b498345613930fbd76/resources/styles/root.json",
						type: "VectorTileLayer",
						opacity:1
					});
					layers.push(layer);
					basemap = new Basemap({
						layers:layers,
						title:"Streets Vector",
						id:"streets-vector",
						thumbnailUrl:"https://www.arcgis.com/sharing/rest/content/items/f81bc478e12c4f1691d0d7ab6361f5a6/info/thumbnail/street_thumb_b2wm.jpg"
					});
					basemaps.push(basemap);
					*/

					// Aerial Photo add vector tile layer as a basemap layer
					layers=[];
					var vtlayer = new BasemapLayer({
						url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
					});
					layers.push(vtlayer);
					vtlayer = new BasemapLayer({
						styleUrl: "https://www.arcgis.com/sharing/rest/content/items/30d6b8271e1849cd9c3042060001f425/resources/styles/root.json",
						type: "VectorTileLayer",
						opacity:1
					});
					layers.push(vtlayer);
					basemap = new Basemap({
						layers:layers,
						title:"Aerial Photo",
						id: "hybrid",
						thumbnailUrl:"https://www.arcgis.com/sharing/rest/content/items/2ea9c9cf54cb494187b03a5057d1a830/info/thumbnail/Jhbrid_thumb_b2.jpg"
					});
					basemaps.push(basemap);
					

					// USGS Scanned Topo
					// thumbnail moved no longer esists: //"https://www.arcgis.com/sharing/rest/content/items/931d892ac7a843d7ba29d085e0433465/info/thumbnail/usa_topo.jpg"
					layer=new BasemapLayer({url:"https://services.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer"});
					basemap = new Basemap({
						layers:[layer],
						title:"USGS Scanned Topo",
						id:"topo",
						thumbnailUrl:"assets/images/USA_topo.png"
					});
					basemaps.push(basemap);
					

					// Add USGS Digital Topo back in. ESRI removed it 6-30-19
					layer = new BasemapLayer({
						//url: "https://services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer"  // no topo
						url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer"
					});
					basemap = new Basemap({
						layers:[layer],
						title:"USGS Digital Topo",
						id:"natgeo",
						thumbnailUrl:"https://usfs.maps.arcgis.com/sharing/rest/content/items/6d9fa6d159ae4a1f80b9e296ed300767/info/thumbnail/thumbnail.jpeg"
					});
					basemaps.push(basemap);

					// Aerial with Topos
					// old thumbnail, same as aerial "https://www.arcgis.com/sharing/rest/content/items/2ea9c9cf54cb494187b03a5057d1a830/info/thumbnail/Jhbrid_thumb_b2.jpg"
					layers = [];
					layer=new BasemapLayer({url:"https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer",
					displayLevels: [6,7,8,9,10,11,12,13,14,15,16],});
					layers.push(layer);
					layer=new BasemapLayer({
						url:"https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
						displayLevels: [17,18,19]});
					layers.push(layer);
					basemap = new Basemap({
						layers:layers,
						title:"Aerial Photo with USGS Contours",
						id: "imagery_topo",
						thumbnailUrl:"assets/images/aerial_topo.png"
					});
					basemaps.push(basemap);
				
					// ESRI Digital Topo
					layer=new BasemapLayer({url:"https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer"});
					// old thumb thumbnailUrl:"https://www.arcgis.com/sharing/rest/content/items/30e5fe3149c34df1ba922e6f5bbf808f/info/thumbnail/ago_downloaded.jpg"
					basemap = new Basemap({
						layers:[layer],
						title:"ESRI Digital Topo",
						id:"topo2",
						thumbnailUrl:"https://www.arcgis.com/sharing/rest/content/items/588f0e0acc514c11bc7c898fed9fc651/info/thumbnail/topo_thumb_b2wm.jpg"
					});
					basemaps.push(basemap);

					// Open Street Map
					/*layer = new BasemapLayer({type: "OpenStreetMap"});
					basemap = new Basemap({
						layers:[layer],
						title:"Open Street Map",
						id:"osm",
						thumbnailUrl:"https://usfs.maps.arcgis.com/sharing/rest/content/items/5d2bfa736f8448b3a1708e1f6be23eed/info/thumbnail/temposm.jpg"
					});
					basemaps.push(basemap);*/

					// Old Raster Aerial
					/*var layers = [];
					layer=new BasemapLayer({url:"https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"});
					layers.push(layer);
					//url:"https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer",
					layer=new BasemapLayer({
						url:"https://services.arcgisonline.com/arcgis/rest/services/Reference/World_Reference_Overlay/MapServer",
						isReference: true});
					layers.push(layer);
					basemap = new Basemap({
						layers:layers,
						title:"Aerial",
						id: "hybrid2",
						thumbnailUrl:"https://www.arcgis.com/sharing/rest/content/items/2ea9c9cf54cb494187b03a5057d1a830/info/thumbnail/Jhbrid_thumb_b2.jpg"
					});
					basemaps.push(basemap);*/

					// Delorme World Basemap
					/*layers=[];
					layer=new BasemapLayer({
						url:"https://services.arcgisonline.com/ArcGIS/rest/services/Specialty/DeLorme_World_Base_Map/MapServer",
						displayLevels: [6,7,8,9,10,11,12]
					});
					layers.push(layer);
					layer=new BasemapLayer({
						url:"https://services.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer",
						displayLevels: [13,14,15]
					});
					layers.push(layer);
					basemap = new Basemap({
						layers:layers,
						title:"DeLorme World Basemap",
						id:"delorme",
						thumbnailUrl:"assets/images/delormeThumb.jpg"
					});
					basemaps.push(basemap);
					
					// FS topo
					layers = [];
					layer = new BasemapLayer({
            id: "World_Street_Map_8421",  
            opacity: 1,  
            displayLevels: [6,7,8,9,10,11,12],  
            visibility: true,  
            url: "http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"   
					});
					layers.push(layer);
					layer=new BasemapLayer({
						displayLevels: [13,14,15,16,17],
						url:"https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_FSTopo_01/MapServer"
					});
					layers.push(layer);
					layer = new BasemapLayer({
            id: "World_Street_Map_8421",  
            opacity: 1,  
            displayLevels: [18,19],  
            visibility: true,  
            url: "http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"   
					});
					layers.push(layer);
					basemap = new Basemap({
						layers:layers,
						title:"FS Topo 24K",
						id: "fstopo",
						thumbnailUrl:"https://usfs.maps.arcgis.com/sharing/rest/content/items/32fd95d9dc5f48509c6d463ffbf4e466/info/thumbnail/thumbnail1547234602026.png"
					});
					basemaps.push(basemap);*/
				
					basemapGallery = new BasemapGallery({
						map: map,
						basemaps:basemaps,
						showArcGISBasemaps: false
					});
						
					var opening = true;
					// Adjust scrollbar for basemaps. If you leave it full, identify will not function in the space below it.
					on(registry.byId("basemapTitlePane"), "toggle", function () {
						if (opening) {
							opening = false;
							document.getElementById("basemapDiv").style.overflow = "auto";
							document.getElementById("basemapDiv").style.height = "90%";
						} else {
							opening = true;
							document.getElementById("basemapDiv").style.overflow = "hidden";
							document.getElementById("basemapDiv").style.height = "30px";
						}
					});

					// tlb 7-17-19 move stuff in basemapGallery.on to here because it is no longer called when showArcGISBasemaps is false
					if (!basemapGallery.showArcGISBasemaps){
					var items = [];
					basemapGallery.basemaps.forEach(function (basemap) {
						items.push({
							thumbnailUrl: basemap.thumbnailUrl,
							id: basemap.id,
							layers: basemap.layers,
							title: basemap.title
						});
					});
					var params = {};
					// Move Streets to first item.
					var street = null;
					var i;
					for (i = 0; i < items.length; i++) {
						if (items[i].title == "Streets") {
							street = items[i];
							items.moveTo(street, 0);
							break;
						}
					}
					//  Move USA Topo Maps to third item.
					var topo = null;
					for (i = 0; i < items.length; i++) {
						if (items[i].title == "USA Topo Maps") {
							topo = items[i];
							items.moveTo(topo, 2);
							break;
						}
					}
					var selected_id; // to highlight selected thumbnail in basemapGallery Gallery
					for (i = 0; i < items.length; i++) {
						if (items[i].id == mapBasemap)
							selected_id = i;
					}
					params.items = items;
					params.thumbnailStyle = "small";
					var gallery = new Gallery(params, "basemapGallery");
					gallery.on("select", function (item) {
						// unselect all, then apply highlight class to selected one, because when bookmark sets the selected basemap it is not unselected here.
						var basemapDom = dom.byId("basemapGallery").firstChild.children;
						for (var p = 0; p < basemapDom.length; p++) {
							if (basemapDom[p].children[1].childNodes[0].nodeValue == item.item.title) {
								basemapDom[p].attributes.class.value = "thumbnailcontainer small selected";
								basemapDom[p].children[0].attributes.class.value = "thumbnail small selected";
								basemapDom[p].children[1].attributes.class.value = "title small selected";
								basemapDom[p].children[2].attributes.class.value = "title small selected";
							} else {
								basemapDom[p].attributes.class.value = "thumbnailcontainer small";
								basemapDom[p].children[0].attributes.class.value = "thumbnail small";
								basemapDom[p].children[1].attributes.class.value = "title small";
								basemapDom[p].children[2].attributes.class.value = "title small";
							}
						}
						basemapGallery.select(item.item.id);
						mapBasemap = item.item.id;// save the selected basemap in a global
						registry.byId("basemapTitlePane").toggle(); // close the panel
					});
					gallery.select(params.items[selected_id]); // highlight currently selected basemap, this opens the basemap pane.
					registry.byId("basemapTitlePane").toggle(); // close the pane
					gallery._slideDiv.style.width = 'auto';
					// height of each basemap image and title is controled in layout.css .esriMobileGallery .thumbnailcontainer.small
					gallery.startup();
					dom.byId("basemapTitlePane").style.visibility = "visible";
					dom.byId("basemapTitlePane").style.display = "block";
					gallery.on("error", function (msg) {
						alert("Basemap gallery error creating gallery in readConfig.js/addMap/basemapGallery.on('load'):  " + JSON.stringify(msg, null, 4), "Code Error");
					});
				}
					// end tlb 7-17-19
				

					// load is call when the ArcGIS basemaps load using showArcGISBasemaps: true
					basemapGallery.on("load", function () {
						var items = [];

						basemapGallery.basemaps.forEach(function (basemap) {
							var useThese = ["Imagery Hybrid", "Streets","USA Topo Maps", "National Geographic Style Map",
							"USGS Scanned Topo","My USGS Digital Topo","Aerial Photo with USGS Contours","ESRI Digital Topo"];
							if (!useThese.includes(basemap.title)) return;
							// Rename ids and display titles. Ids are used for map link
							if (basemap.title == "Imagery Hybrid") {
								basemap.id = "hybrid";
								basemap.title = "Aerial";
							} 
							// Remove Imagery with/out Labels and Oceans
							else if (basemap.title == "Imagery" || basemap.title == "Oceans")
								return;
							else if (basemap.title == "Streets")
								basemap.id = "streets";
							else if (basemap.title == "USA Topo Maps")
								basemap.id = "topo";
							else if (basemap.title == "ESRI Digital Topo")
								basemap.id = "topo2";
							else if (basemap.title == "OpenStreetMap")
								basemap.id = "openstreet";
							else if (basemap.title == "National Geographic Style Map")
								basemap.id = "natgeo";
							items.push({
								thumbnailUrl: basemap.thumbnailUrl,
								id: basemap.id,
								layers: basemap.layers,
								title: basemap.title
							});
						});
						var params = {};
						// Move Streets to first item.
						var street = null;
						var i;
						for (i = 0; i < items.length; i++) {
							if (items[i].title == "Streets") {
								street = items[i];
								items.moveTo(street, 0);
								break;
							}
						}
						//  Move USA Topo Maps to third item.
						var topo = null;
						for (i = 0; i < items.length; i++) {
							if (items[i].title == "USA Topo Maps") {
								topo = items[i];
								items.moveTo(topo, 2);
								break;
							}
						}
						var selected_id; // to highlight selected thumbnail in basemapGallery Gallery
						for (i = 0; i < items.length; i++) {
							if (items[i].id == mapBasemap)
								selected_id = i;
						}
						// Add a scroll bar if necessary
						document.getElementById("basemapGallery").style.height = "350px";
						document.getElementById("basemapGallery").style.overflow = "auto";

						params.items = items;
						params.thumbnailStyle = "small";
						var gallery = new Gallery(params, "basemapGallery");
						gallery.on("select", function (item) {
							// unselect all, then apply highlight class to selected one, because when bookmark sets the selected basemap it is not unselected here.
							var basemapDom = dom.byId("basemapGallery").firstChild.children;
							for (var p = 0; p < basemapDom.length; p++) {
								if (basemapDom[p].children[1].childNodes[0].nodeValue == item.item.title) {
									basemapDom[p].attributes.class.value = "thumbnailcontainer small selected";
									basemapDom[p].children[0].attributes.class.value = "thumbnail small selected";
									basemapDom[p].children[1].attributes.class.value = "title small selected";
									basemapDom[p].children[2].attributes.class.value = "title small selected";
								} else {
									basemapDom[p].attributes.class.value = "thumbnailcontainer small";
									basemapDom[p].children[0].attributes.class.value = "thumbnail small";
									basemapDom[p].children[1].attributes.class.value = "title small";
									basemapDom[p].children[2].attributes.class.value = "title small";
								}
							}
							basemapGallery.select(item.item.id);
							mapBasemap = item.item.id;// save the selected basemap in a global
							registry.byId("basemapTitlePane").toggle(); // close the panel
						});
						gallery.select(params.items[selected_id]); // highlight currently selected basemap, this opens the basemap pane.
						registry.byId("basemapTitlePane").toggle(); // close the pane
						gallery._slideDiv.style.width = 'auto';
						// height of each basemap image and title is controled in layout.css .esriMobileGallery .thumbnailcontainer.small
						gallery.startup();
						dom.byId("basemapTitlePane").style.visibility = "visible";
						dom.byId("basemapTitlePane").style.display = "block";
						gallery.on("error", function (msg) {
							alert("Basemap gallery error creating gallery in readConfig.js/addMap/basemapGallery.on('load'):  " + JSON.stringify(msg, null, 4), "Code Error");
						});
					});
					basemapGallery.on("error", function (msg) {
						alert("Basemap gallery error creating basemapGallery in readConfig.js/addMap/basemapGallery.on('load'):  " + JSON.stringify(msg, null, 4), "Code Error");
					});
					addWidgets();
				} catch (e) {
					alert("Error in readConfig.js/addMap " + e.message, "Code Error", e);
				}
			});
		}

		try {
			var xycoords_format = getCookie("xycoords");
			if (xycoords_format == "")
				document.getElementById('xycoords_combo').value = "dms";
			else
				document.getElementById('xycoords_combo').value = xycoords_format;
			
			// preserve new lines in way point descriptions (For future changes, if we decide to add them like the Mobile version.)
			var location = document.location.search.replace(/\%0D/g,"newline");
			queryObj = ioquery.queryToObject(location.substr((location[0] === "?" ? 1 : 0)));
			//queryObj = ioquery.queryToObject(document.location.search.substr((document.location.search[0] === "?" ? 1 : 0)));
			
			// Sanitize user input. Protect against XSS attacks.
			// test for XSS attack. Pattern contains allowed characters. [^ ] means match any character that is not
			// in the is set. \ escapes characters used by regex like .-'"|\
			var regexp;
			// For labels allow ' " for degrees minutes seconds
			// Points
			if (queryObj.point){
				queryObj.point = queryObj.point.replace(/~/g, " "); // for email from mobile app
				regexp=/([^a-zA-Z0-9 °\-\'\"\|;,\.!_\*()\\])/g; // allow \ for the test (\' \") but remove it for the clean
				if (regexp.test(queryObj.point)) alert("Illegal characters were removed from way point labels.","Warning");
				regexp=/([^a-zA-Z0-9 °\-\'\"\|;,\.!_\*()])/g;
				queryObj.point=queryObj.point.replace(regexp,""); // clean it
				queryObj.point = queryObj.point.replace(/newline/g,"\n"); // preserve new line characters in point description used on mobile
			}

			// Lines
			if (queryObj.line){
				regexp=/([^a-zA-Z0-9 \-\'\|;,\.!_\*()\\])/g; // allow \ for the test (\' \") but remove it for the clean
				if (regexp.test(queryObj.line)) alert("Illegal characters were removed from the line labels.","Warning");
				regexp=/([^a-zA-Z0-9 \-\'\|;,\.!_\*()])/g;
				queryObj.line=queryObj.line.replace(regexp,""); // clean it
			}

			// Polygons
			if (queryObj.poly){
				regexp=/([^a-zA-Z0-9 \-\'\|;,\.!_\*()\\])/g; // allow \ for the test (\' \") but remove it for the clean
				if (regexp.test(queryObj.poly)) alert("Illegal characters were removed from the shape (polygon) labels.","Warning");
				regexp=/([^a-zA-Z0-9 \-\'\|;,\.!_\*()])/g;
				queryObj.poly=queryObj.poly.replace(regexp,""); // clean it
			}

			// Rectangles
			if (queryObj.rect){
				regexp=/([^a-zA-Z0-9 \-\'\|;,\.!_\*()\\])/g; // allow \ for the test (\' \") but remove it for the clean
				if (regexp.test(queryObj.rect)) alert("Illegal characters were removed from the rectangle labels.","Warning");
				regexp=/([^a-zA-Z0-9 \-\'\|;,\.!_\*()])/g;
				queryObj.rect=queryObj.rect.replace(regexp,""); // clean it
			}
			
			// Text
			if (queryObj.text){
				regexp=/([^a-zA-Z0-9 \-\'\|;,\.!_\*()\\])/g; // allow \ for the test (\' \") but remove it for the clean
				if (regexp.test(queryObj.text)) alert("Illegal characters were removed from the point labels.","Warning");
				regexp=/([^a-zA-Z0-9 \-\'\|;,\.!_\*()])/g;
				queryObj.text=queryObj.text.replace(regexp,""); // clean it
			}

			// Layer
			if (queryObj.layer){
				queryObj.layer = queryObj.layer.replace(/~/g, " "); // for email from mobile app
				regexp=/([^a-zA-Z0-9 \-\|,\._()])/g; // allow \ for the test (\' \") but remove it for the clean
				if (regexp.test(queryObj.layer)) alert("Illegal characters were found on the URL. Layers may not load properly.","Warning");
				//regexp=/([^a-zA-Z0-9 \-,\._()])/g; // Used if testing for \\ above
				queryObj.layer=queryObj.layer.replace(regexp,""); // clean it
			}

			// keyword
			if (queryObj.keyword){
				regexp=/([^a-zA-Z0-9 \-\._()])/g; // allow \ for the test (\' \") but remove it for the clean
				if (regexp.test(queryObj.keyword)) alert("Illegal characters were found on the URL. Location may not load properly.","Warning");
				//regexp=/([^a-zA-Z0-9 \-\._()])/g; // Used if testing for \\ above
				queryObj.keyword=queryObj.keyword.replace(regexp,""); // clean it
			}

			// value
			if (queryObj.value){
				// 8-18-20 added # and / as safe characters in the value
				//regexp=/([^a-zA-Z0-9 \-\',\.!_\*()\\])/g; // allow \ for the test \" but remove it for the clean
				regexp=/([^a-zA-Z0-9 \-\',\.!_\*()\\#/&])/g; // allow \ for the test \" but remove it for the clean
				if (regexp.test(queryObj.value)) alert("Illegal characters were found on the URL. Location may not load properly.","Warning");
				regexp=/([^a-zA-Z0-9 \-\',\.!_\*()#/&])/g;
				queryObj.value=queryObj.value.replace(regexp,""); // clean it
				// 8-18-20 single quote is used in the SQL expression, replace it with '' and it will be used as '.
				var quote = /'/g;
				queryObj.value = queryObj.value.replace(quote,"''");
			}

			// label
			if (queryObj.label){
				regexp=/([^a-zA-Z0-9 \-\',\.!_\*()#&/\\])/g; // allow \ for the test (\' \") but remove it for the clean
				if (regexp.test(queryObj.label)) alert("Illegal characters were found on the URL. Point labels may not load properly.","Warning");
				regexp=/([^a-zA-Z0-9 \-\',\.!_\*()#&/])/g;
				queryObj.label=queryObj.label.replace(regexp,""); // clean it
			}

			// map
			if (queryObj.map){
				regexp=/([^a-zA-Z0-9 \-,\._():\/])/g; // allow \ for the test (\' \") but remove it for the clean
				if (regexp.test(queryObj.map)) alert("Illegal characters were found on the URL. Map may not load properly.","Warning");
				//regexp=/([^a-zA-Z0-9 \-\=,\._():\/])/g; // Used if testing for \\ above
				queryObj.map=queryObj.map.replace(regexp,""); // clean it
			}

			// field
			if (queryObj.field){
				regexp=/([^a-zA-Z0-9 \-_])/g; // allow \ for the test (\' \") but remove it for the clean
				if (regexp.test(queryObj.field)) alert("Illegal characters were found on the URL. Map may not load properly.","Warning");
				//regexp=/([^a-zA-Z0-9 \-\=,\._():\/])/g; // Used if testing for \\ above
				queryObj.field=queryObj.field.replace(regexp,""); // clean it
			}

			// projection Only allow integers.
			if (queryObj.prj && isNaN(queryObj.prj)) {
				queryObj.prj = 102100;
				alert("Problem reading map projection from the URL, defaulting to WGS84.","Warning");
			}

			// Extent
			if (queryObj.extent){
				regexp=/([^0-9 \-,\.])/g; // allow \ for the test (\' \") but remove it for the clean
				if (regexp.test(queryObj.extent)) alert("Illegal characters were found on the URL. Map extent may not load properly.","Warning");
				queryObj.extent=queryObj.extent.replace(regexp,""); // clean it
			}

			// Place
			if (queryObj.place){
				regexp=/([^a-zA-Z0-9 \-\',\.!_*():#&/\\])/g; // allow \ for the test (\' \") but remove it for the clean, : used in degree, min, sec point
				if (regexp.test(queryObj.place)) alert("Illegal characters were found on the URL. Location may not load properly.","Warning");
				regexp=/([^a-zA-Z0-9 \-\',\.!_*():#&/])/g;
				queryObj.place=queryObj.place.replace(regexp,""); // clean it
			}

			document.getElementById("mapDescFile").href = app + "/definitions.html";
			var xmlhttp = createXMLhttpRequest();
			var configFile = app + "/config.xml?v=" + ndisVer;
			var calledFlag = false; // 3-21-22 call readSettingsWidget and addGraphicsAndLabels only once
			xmlhttp.onreadystatechange = function () {
				if (xmlhttp.readyState == 4 && xmlhttp.status === 200) {
					xmlDoc = createXMLdoc(xmlhttp);
					// Set Geometry Service
					var geoService;
					try{
						geoService = xmlDoc.getElementsByTagName("geometryservice")[0].getAttribute("url");
					} catch (e) {
						alert('Missing tag: geometryservice in ' + app + '/config.xml.\n\nTag should look like: &lt;geometryservice url="https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/Utilities/Geometry/GeometryServer"/&gt;\n\nWill use that url for now.', 'Data Error');
						geoService = "https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/Utilities/Geometry/GeometryServer";
					}
					geometryService = new GeometryService(geoService);
					// Set Print Service for PrintTask				  
					try {
						printServiceUrl = xmlDoc.getElementsByTagName("printservice")[0].firstChild.nodeValue;
					} catch (e) {
						alert('Missing tag: printservice in ' + app + '/config.xml.\n\nTag should look like: &lt;printservice&gt;https://ndismaps.nrel.colostate.edu/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task&lt;/printservice&gt;\n\nWill use that url for now.', 'Data Error');
						printServiceUrl = "https://ndismaps.nrel.colostate.edu/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task";
					}
					try {
						printGeoServiceUrl = xmlDoc.getElementsByTagName("printservicegeo")[0].firstChild.nodeValue;
					} catch (e) {
						alert('Missing tag: printservicegeo in ' + app + '/config.xml.\n\nTag should look like: &lt;printservicegeo&gt;https://ndismaps.nrel.colostate.edu/arcgis/rest/services/PrintTemplate/georefPrinting/GPServer/georefPrinting&lt;/printservice&gt;\n\nWill use that url for now.', 'Data Error');
						printGeoServiceUrl = "https://ndismaps.nrel.colostate.edu/arcgis/rest/services/PrintTemplate/georefPrinting/GPServer/georefPrinting";
					}
					var title;
					try {
						title = xmlDoc.getElementsByTagName("title")[0].firstChild.nodeValue;
					} catch (e) {
						alert("Warning: Missing title tag in " + app + "/config.xml file. " + e.message, "Data Error");
					}
					try {
						dom.byId("title").innerHTML = title;
						document.title = title;
						dom.byId("subtitle").innerHTML = xmlDoc.getElementsByTagName("subtitle")[0].firstChild.nodeValue;
						dom.byId("logo").src = xmlDoc.getElementsByTagName("logo")[0].firstChild.nodeValue;
						dom.byId("logourl").href = xmlDoc.getElementsByTagName("logourl")[0].firstChild.nodeValue;
					} catch (e) {
						alert("Warning: Missing title, subtitle, logo, or logurl tag in " + app + "/config.xml file. " + e.message, "Data Error");
					}
					if (xmlDoc.getElementsByTagName("noDisclaimer") && xmlDoc.getElementsByTagName("noDisclaimer")[0] && xmlDoc.getElementsByTagName("noDisclaimer")[0].firstChild.nodeValue == "true") {}
					else if (getCookie("noDisclaimer") != 1)
						loadDisclaimer(title);
					// Set up Find a Place												   
					try {
						myFindService = xmlDoc.getElementsByTagName("findplaceservice")[0].getAttribute("url");
					} catch (e) {
						alert('Missing tag: findplaceservice in ' + app + '/config.xml.\n\nTag should look like: &lt;findplaceservice url="https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/GNIS_Loc/GeocodeServer"/&gt;\n\nWill use that url for now.', 'Data Error');
						myFindService = "https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/GNIS_Loc/GeocodeServer";
					}
					try {
						findPlaceInit();
					} catch (e) {
						alert("Error in javascript/FindPlace.js " + e.message, "Code Error", e);
					}
					// Set initial/full map extent
					try {
						ext = xmlDoc.getElementsByTagName("map")[0].getAttribute("initialextent").split(" ");
						wkid = parseInt(xmlDoc.getElementsByTagName("map")[0].getAttribute("wkid").trim());
						// save Colorado extent. This is used in print to see if they are trying to print outside of Colorado.
						// initExtent is not always the full extent. For example if they had an extent on the URL it does not use this one.
						fullExtent = new Extent({
							"xmin": parseFloat(ext[0]),
							"ymin": parseFloat(ext[1]),
							"xmax": parseFloat(ext[2]),
							"ymax": parseFloat(ext[3]),
							"spatialReference": {
								"wkid": wkid
							}
						});
					} catch (e) {
						alert("Warning: Missing tag attributes initalextent or wkid for the map tag in " + app + "/config.xml file. " + e.message, "Data Error");
					}
					

					
					
					// set lods
					// 4-19-17 added custom lods from 9M to 1K. Used to have 19 levels, now it has 12.
					var customLods = [{
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
						}, {
							"level": 15,
							"resolution": 4.77731426794937,
							"scale": 18055.954822
						}, {
							"level": 16,
							"resolution": 2.388657133974685,
							"scale": 9027.977411
						}, {
							"level": 17,
							"resolution": 1.1943285668550503,
							"scale": 4513.988705
						}, {
							"level": 18,
							"resolution": 0.5971642835598172,
							"scale": 2256.994353
						}, {
							"level": 19,
							"resolution": 0.29858214164761665,
							"scale": 1128.497176
						}
					];
					try {
						require(["dojo/_base/Color", "dojo/dom-construct"], function (Color, domConstruct) {
							// standard info window
							var popup = new Popup({
									fillSymbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25]))
								}, domConstruct.create("div"));
							map = new Map("mapDiv", {
									autoResize: true,
									showAttribution: false,
									logo: false,
									infoWindow: popup,
									isRubberBandZoom: true,
									isScrollWheelZoom: true,
									isShiftDoubleClick: true,
									displayGraphicsOnPan: !has("ie"),
									sliderStyle: "large",
									basemap: "streets",
									minScale: 9244649,
									lods: customLods
								});
						});
					} catch (e) {
						alert("Error creating map in readConfig.js. " + e.message, "Code Error", e);
					}






					// 3-21-22
					// load legend/layer list. Fires after one layer is added to the map using the map.addLayer method.
					var toc;
					var legendChkBox;
					map.on('layer-add-result', function (event) {
						var errFlag = false;
						var i,j;
//console.log("map.on layer add result: "+event.layer.id);
						try {	
							if (event.error) {
								errFlag = true;
								alert("Problem adding layer to map: " + event.layer.url + ". Reason: " + event.error.message + ". At javascript/readConfig.js", "Code Error");
							}
							// Turn off MVUM extra layers
							else if (event.layer.url && event.layer.url.indexOf("MVUM") > -1){
								for (j = 0; j < event.layer.layerInfos.length; j++) {
									if (event.layer.layerInfos[j].name == "Visitor Map Symbology") {
										event.layer.layerInfos[j].defaultVisibility = false;
									}
									else if (event.layer.layerInfos[j].name =="Status") {
										event.layer.layerInfos[j].defaultVisibility = false;
									}
								}
							}
						} catch (e) {
							alert("Error loading layer, "+event.layer.id+", to map. Reason: " + e.message + " in javascript/readConfig.js layer-add-result", "Code Error", e);
						}

						// if event.layer is in legendLayer and toc exists remove TOC and add again
						var layerInTOC = false;
						for(i=0; i<legendLayers.length;i++){
							if(event.layer.id === legendLayers[i].title){
								layerInTOC = true;
								break;
							}
						}
						if (layerInTOC){
							// check if all layers have tried to load
							var allTriedToLoad = true;
							for (i=0;i<xmlDoc.getElementsByTagName("operationallayers")[0].getElementsByTagName("layer").length;i++){
								if (tries[xmlDoc.getElementsByTagName("operationallayers")[0].getElementsByTagName("layer")[i].getAttribute("label")] == 0)
									allTriedToLoad = false;
							}
							// Reorder TOC and map layers. map.reorderLayer(layer, index) index=0 is bottom most
							if (allTriedToLoad){
								// reorder layers according to config.xml operationallayers
								var copyLegendLayers = [];
								var copyMapLayers = [];
								// copy legend
								for (i=0;i<legendLayers.length;i++){
									copyLegendLayers[i] = Object.assign({}, legendLayers[i]);
								}
								// copy map layers
								var numBasemaps=0; // count number of basemaps
								for (i=0;i<map.layerIds.length;i++){
									copyMapLayers[i] = Object.assign({}, map.getLayer(map.layerIds[i]));
									if (map.getLayer(map.layerIds[i]).id.indexOf("layer") > -1) numBasemaps++;
								}
								var k=0;
								var n=0;
								for (i=0; i<xmlDoc.getElementsByTagName("operationallayers")[0].getElementsByTagName("layer").length;i++){
									// put legend in reverse order
									for (j=0; j<legendLayers.length;j++){
										if (copyLegendLayers[j].title === xmlDoc.getElementsByTagName("operationallayers")[0].getElementsByTagName("layer")[i].getAttribute("label")){
											legendLayers[k++] = Object.assign({}, copyLegendLayers[j]);
											break;
										}
									}
									// put map layers in order
									for (var m=0;m<copyMapLayers.length;m++){
										if (copyMapLayers[m].id === xmlDoc.getElementsByTagName("operationallayers")[0].getElementsByTagName("layer")[i].getAttribute("label")){
											// map.reorderLayer(layer, index) The basemap is 0.
											map.reorderLayer(Object.assign({}, copyMapLayers[m]), i+numBasemaps);
											break;
										}
									}
								}
								legendLayers.reverse();
							}
							
							try {
								// If TOC already created just refresh it and update legend if showing
								if(toc){
									// display legend
									if(legendChkBox.checked){
										for (var t = 0; t < toc.layerInfos.length; t++) {
											toc.layerInfos[t].noLegend = false;
										}
									}
									toc.refresh();
									toc._adjustToState();
									return;
								}
								
								// Load TOC
								toc = new TOC({
										map: map,
										layerInfos: legendLayers
									}, 'tocDiv');
								toc.startup();
								
								// load Show Legend checkbox click event after toc has loaded
								legendChkBox = new CheckBox({
										name: "showLegendChkBox",
										onChange: function () {
											// called from Map Layers & Legend Show Legend checkbox click event
											require(["dijit/registry"], function (registry) {
												try {
													var tocWait = document.getElementById("tocLoading");
													tocWait.style.display = "block";
													tocWait.style.visibility = "visible";
													var noLegend = true;
													var toc2 = registry.byId("tocDiv");
													if (legendChkBox.checked) {
														noLegend = false;
														setCookie("legend", "1");
													} else
														setCookie("legend", "0");
													for (var t = 0; t < toc2._rootLayerTOCs.length; t++) {
														toc2._rootLayerTOCs[t].config.noLegend = noLegend;
													}
													toc2.refresh();
													toc2._adjustToState();
													// Wait 1 second then remove wait
													setTimeout(function () {
														tocWait.style.display = "none";
														tocWait.style.visibility = "hidden";
													}, 1000);
												} catch (e) {
													alert("Error in readConfig.js. Loading click event for Show Legend checkbox. " + e.message, "Code Error", e);
													hideLoading();
												}
											});
										}
									}, "showLegendChkBox");
								legendChkBox.startup();
								if (getCookie("legend") == 1) {
									legendChkBox.set("checked", true);
								}
							} catch (e) {
								alert("Error loading TOC Map Layers & Legend: " + e.message + " in javascript/readConfig.js or toc/src/agsjs/dijit/TOC.js", "Code Error", e);
							}
						
							if (!calledFlag) {
								calledFlag = true;
								try{
									readSettingsWidget(); // initialize Identify, found in identify.js
								} catch(e){
									alert("Error reading SettingsWidget.xml. Reason: " + e.message + " in javascript/readConfig.js", "SettingsWidget Error", e);
								}
								try {
									addGraphicsAndLabels();
								} catch (e) {
									alert("Error loading graphics and labels from the URL: " + e.message + " in javascript/readConfig.js", "URL Graphics Error", e);
								}
							}
						}
					});




					
					
					// Load listener function for when the first or base layer has been successfully added
					map.on("load", function () {
						// Show map coordinates 
						map.on("mouse-move", showCoordinates);
						map.on("mouse-drag", showCoordinates);
						// Show hide loading image
						map.on("update-start", showLoading);
						map.on("update-end", hideLoading);
						// Add Scalebar
						require(["esri/dijit/Scalebar"], function (Scalebar) {
							var scalebar = new Scalebar({
									map: map,
									// "dual" displays both miles and kilmometers
									// "english" is the default, which displays miles
									// use "metric" for kilometers
									scalebarUnit: "dual"
								});
						});
						map.on('click', doIdentify);
						// Show current Map Scale in footer
						map.on("extent-change", showMapScale);
						// display current map scale
						document.getElementById("mapscaleList").selectedIndex = map.getLevel();
						addMap();
						addOverviewMap();
						hideLoading();
					});
					
					//var myUnload = map.on("unload", unloadHandler); // prevent memory leaks on exit, must put a varname in front of map.on call , then in unloadHandler use varname.remove();

					// Zoom to extent on startup if specified on url
					if (queryObj.extent && queryObj.extent != "") {
						var extArr = [];
						if (Object.prototype.toString.call(queryObj.extent) === '[object Array]')
							extArr = queryObj.extent[0].split(",");
						else
							extArr = queryObj.extent.split(",");
						var prj;
						if (queryObj.prj && queryObj.prj != ""){
							prj = queryObj.prj;
						}
						else {
							// check for lat long
							if (extArr[0] < 0 && extArr[0] > -200) {
								prj = 4326;
							} else
								prj = 26913;
						}
						ext = new Extent({
								"xmin": parseFloat(extArr[0]),
								"ymin": parseFloat(extArr[1]),
								"xmax": parseFloat(extArr[2]),
								"ymax": parseFloat(extArr[3]),
								"spatialReference": {
									"wkid": parseInt(prj)
								}
							});
						var params = new ProjectParameters();
						params.geometries = [ext];
						params.outSR = new SpatialReference(wkid);
						geometryService.project(params, function (newExt) {
							initExtent = newExt[0];
							map.setExtent(initExtent);
						}, function (error) {
							alert("There was a problem converting the extent read from the URL to Web Mercator projection. extent=" + extArr[0], ", " + extArr[1] + ", " + extArr[2] + ", " + extArr[3] + "  prj=" + prj + "  " + error.message, "URL Extent Error", error);
						});
					// Use initextent read from config.xml file
					} else {
						initExtent = new Extent({
								"xmin": parseFloat(ext[0]),
								"ymin": parseFloat(ext[1]),
								"xmax": parseFloat(ext[2]),
								"ymax": parseFloat(ext[3]),
								"spatialReference": {
									"wkid": wkid
								}
							});
						map.setExtent(initExtent);
					}
					
					// Zoom to a place on startup
					if (queryObj.place && queryObj.place != "") {
						var place = queryObj.place.replace("%20", " ");
						if (queryObj.prj && queryObj.prj != "")
							settings = {
								XYProjection: queryObj.prj
							};
						gotoLocation(place, true);
					}
					
					// Zoom to a keyword and value on startup
					if (queryObj.keyword && queryObj.keyword != "") {
						if (!queryObj.value || queryObj.value == "")
							alert("When &keyword is used on the URL, there must be a &value also.", "URL Keyword/Value Error");
						else {
							require(["esri/request", "esri/tasks/QueryTask", "esri/tasks/query"], function (esriRequest, QueryTask, Query) {
								var urlFile = app + "/url.xml?v=" + ndisVer;
								var xmlurl = createXMLhttpRequest();
								xmlurl.onreadystatechange = function () {
									if (xmlurl.readyState == 4 && xmlurl.status === 200) {
										var xmlDoc = createXMLdoc(xmlurl);
										var layer = xmlDoc.getElementsByTagName("layer");
										for (var i = 0; i < layer.length; i++) {
											if (!layer[i].getElementsByTagName("keyword")[0] || !layer[i].getElementsByTagName("keyword")[0].firstChild)
												alert("Missing tag keyword or blank, in " + app + "/url.xml file.", "Data Error");
											if (queryObj.keyword == layer[i].getElementsByTagName("keyword")[0].firstChild.nodeValue)
												break;
										}
										if (i == layer.length)
											alert("Keyword [" + queryObj.keyword + "] is not defined in " + app + "/url.xml file.", "Data Error");
										else {
											if (!layer[i].getElementsByTagName("url")[0] || !layer[i].getElementsByTagName("url")[0].firstChild)
												alert("Missing tag url or blank, in " + app + "/url.xml file for keyword: " + queryObj.keyword + ".", "Data Error");
											if (!layer[i].getElementsByTagName("expression")[0] || !layer[i].getElementsByTagName("expression")[0].firstChild)
												alert("Missing tag expression, in " + app + "/url.xml file for keyword: " + queryObj.keyword, "Data Error");
											else {
												var expr = layer[i].getElementsByTagName("expression")[0].firstChild.nodeValue.replace("[value]", queryObj.value);
												var queryTask = new QueryTask(layer[i].getElementsByTagName("url")[0].firstChild.nodeValue);
												var query = new Query();
												query.where = expr;
												query.returnGeometry = true;
												queryTask.execute(query, function (response) {
													if (response.features.length == 0) {
														gotoLocation(queryObj.value, true);
													} else {
														// Zoom to point or polygon
														require(["esri/geometry/Point", "esri/graphicsUtils", "esri/layers/GraphicsLayer", "esri/graphic", "esri/symbols/PictureMarkerSymbol"], function (Point, graphicsUtils, GraphicsLayer, Graphic, PictureMarkerSymbol) {
															var pt;
															var searchGraphicsLayer;
															if (response.geometryType == "esriGeometryPoint") {
																var level = 8; // 4-21-17 Updated lods, used to be 14
																if (layer[i].getElementsByTagName("mapscale")[0] && layer[i].getElementsByTagName("mapscale")[0].firstChild)
																	level = parseInt(layer[i].getElementsByTagName("mapscale")[0].firstChild.nodeValue);
																// 4-21-17 Updated lods, used to be 19
																if (level > 11) {
																	level = 8; // 4-21-17 Updated lods, used to be 14
																}
																pt = new Point(response.features[0].geometry.x, response.features[0].geometry.y, response.spatialReference);
																map.centerAndZoom(pt, level);
																if (queryObj.label && queryObj.label != "") {
																	// add label to find a place graphics layer
																	searchGraphicsLayer = new GraphicsLayer();
																	searchGraphicsLayer.id = "searchgraphics" + searchGraphicsCounter;
																	searchGraphicsCount.push(searchGraphicsLayer.id);
																	searchGraphicsCounter++;
																	addLabel(new Graphic(pt), queryObj.label, searchGraphicsLayer, "11pt");
																	// add point
																	var symbol = new PictureMarkerSymbol("assets/images/yellowdot.png", 30, 30);
																	searchGraphicsLayer.add(new Graphic(pt, symbol));
																	document.getElementById("findClear").style.opacity = 1.0;
																	document.getElementById("findClear").style.filter = "alpha(opacity=100)";
																}
															} else if (response.geometryType == "esriGeometryPolygon") {
																var union=false;
																if (layer[i].getElementsByTagName("union")[0] && layer[i].getElementsByTagName("union")[0].firstChild &&
																	layer[i].getElementsByTagName("union")[0].firstChild.nodeValue.toLowerCase() === "true"){
																		union=true;
																}
																// zoom to extent of first feature
																if (!union){
																	pt = response.features[0].geometry.getCentroid();
																	map.setExtent(response.features[0].geometry.getExtent(), true);
																}

																// zoom to extent of all features 1-14-19
																else{
																	var newExtent = new Extent(response.features[0].geometry.getExtent());
																	for (var j = 0; j < response.features.length; j++) { 
																		var thisExtent = response.features[j].geometry.getExtent();
																		// making a union of extent or previous feature and current feature. 
																		newExtent = newExtent.union(thisExtent);
																	} 
																	map.setExtent(newExtent);
																	pt = newExtent.getCenter();
																}	

																if (queryObj.label && queryObj.label != "") {
																	// add label to find a place graphics layer
																	searchGraphicsLayer = new GraphicsLayer();
																	searchGraphicsLayer.id = "searchgraphics" + searchGraphicsCounter;
																	searchGraphicsCount.push(searchGraphicsLayer.id);
																	searchGraphicsCounter++;
																	addLabel(new Graphic(pt), queryObj.label, searchGraphicsLayer, "11pt");
																	document.getElementById("findClear").style.opacity = 1.0;
																	document.getElementById("findClear").style.filter = "alpha(opacity=100)";
																}
															} else
																map.setExtent(response.features[0].geometry.getExtent(), true);
														});
													}
												}, function (error) {
													if (error.responseText) {
														alert("Error: QueryTask failed for keyword=" + queryObj.keyword + " value=" + queryObj.value + " " + error.message + error.responseText, "URL Keyword/Value Error", error);
														document.execCommand('Stop');
													} else {
														alert("Error: QueryTask failed for keyword=" + queryObj.keyword + " value=" + queryObj.value + " " + error.message, "URL Keyword/Value Error", error);
														document.execCommand('Stop');
													}
												});
											}
										}
									} else if (xmlurl.status === 404)
										alert("Missing url.xml file in " + app + " directory.", "Data Error");
									else if (xmlurl.readyState === 4 && xmlurl.status === 500)
										alert("Error: had trouble reading " + app + "/url.xml file in readConfig.js.", "Data Error");
								};
								xmlurl.open("GET", urlFile, true);
								xmlurl.send(null);
							});
						}
					}
					if (queryObj.map && queryObj.map != "") {
						if (!queryObj.value || queryObj.value == "" || !queryObj.field || queryObj.field == "")
							alert("When &map is used on the URL, there must also be an &field and &value.", "URL Map/Value Error");
						else {
							require(["esri/request", "esri/tasks/QueryTask", "esri/tasks/query"], function (esriRequest, QueryTask, Query) {
								var queryTask = new QueryTask(queryObj.map);
								var query = new Query();
								if (Number(queryObj.value))
									query.where = queryObj.field + "=" + queryObj.value;
								else
									query.where = "UPPER(" + queryObj.field + ") LIKE UPPER('" + queryObj.value + "')";
								query.returnGeometry = true;
								queryTask.execute(query, function (response) {
									// Zoom to point or polygon
									require(["esri/geometry/Point", "esri/graphicsUtils"], function (Point, graphicsUtils) {
										if (response.features.length == 0)
											alert("Cannot zoom to " + queryObj.value + ". The feature was not found in " + queryObj.map + " for field " + queryObj.field, "URL Map/Value Error");
										else {
											if (response.geometryType == "esriGeometryPoint")
												map.centerAndZoom(new Point(response.features[0].geometry.x, response.features[0].geometry.y, response.spatialReference), 8);
											else
												map.setExtent(response.features[0].geometry.getExtent(), true);
										}
									});
								}, function (error) {
									if (error.responseText)
										alert("Error: QueryTask failed for map=" + queryObj.map + " " + error.message + error.responseText, "URL Map/Value Error", error);
									else
										alert("Error: QueryTask failed for map=" + queryObj.map + " " + error.message, "URL Map/Value Error", error);
								});
							});
						}
					}
				} 
				// if missing file
				else if (xmlhttp.status === 404) {
					alert("Error: Missing config.xml file in " + app + " directory.", "Data Error");
					hideLoading();
				} else if (xmlhttp.readyState === 4 && xmlhttp.status === 500) {
					alert("Make sure your application name is correct on the URL. app=" + app, "Warning");
					hideLoading();
				}
			};
			xmlhttp.open("GET", configFile, true);
			xmlhttp.send(null);
		} catch (e) {
			alert("Error in javascript/readConfig.js. " + e.message, "Code Error", e);
		}
	});
}