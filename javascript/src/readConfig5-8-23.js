// Read config.xml file and also URL paramaters
// globals
var locator;
var addressGraphicsCount = []; // store names of graphics layers used to display address.
var addressGraphicsCounter = 0;
var layerObj; // holds layer id, visiblelayers, visible when read from url &layer=...


// *********************
//   Address Functions
// *********************							
function lookupAddress() {
	require(["dojo/dom"], function(dom){
		// Google Analytics count how many times Address is clicked on
		if (typeof ga === "function")ga('send', 'event', "address", "click", "Address", "1");	
		if (typeof gtag === "function")gtag('event','widget_click',{'widget_name': 'Address'});

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
	// "agsjs/dijit/TOC", "esri/tasks/locator", "esri/rest/support/ProjectParameters", "esri/widget/Popup",
	require(["dojo/dom", "dojo/io-query", "esri/core/promiseUtils", "esri/core/reactiveUtils", "esri/layers/MapImageLayer", "esri/layers/FeatureLayer", "esri/rest/geometryService",
	 "esri/geometry/SpatialReference", "esri/Graphic", "esri/Map", "esri/views/MapView","esri/widgets/Print","esri/geometry/Extent",
	 "esri/widgets/Home", "esri/widgets/Expand", "esri/widgets/LayerList", "esri/widgets/Legend", "esri/widgets/Locate", "esri/widgets/Search", "esri/widgets/ScaleBar", "esri/widgets/Slider", "esri/rest/support/ProjectParameters",
	 "esri/symbols/SimpleFillSymbol", "dijit/form/CheckBox", "dijit/layout/ContentPane", "dijit/TitlePane", "dijit/layout/TabContainer", "esri/symbols/SimpleLineSymbol", "dojo/sniff"], 
	 function (dom, ioquery, promiseUtils, reactiveUtils, MapImageLayer, FeatureLayer, GeometryService, SpatialReference,
		Graphic, Map, MapView, Print, Extent, Home, Expand, LayerList, Legend, Locate, Search, ScaleBar, Slider, ProjectParameters, SimpleFillSymbol, CheckBox,
		ContentPane, TitlePane, TabContainer, SimpleLineSymbol, has) {
		var xmlDoc; // config.xml document json
		var ext;
		var tries={}; // number of times we have tried to load each map layer
		var loadedFromCfg; // true when the layer has loaded and set the visiblelayers when setting layers from URL

		// adjust title for mobile
        if (screen.width < 768){
			var title = document.getElementById("title").innerHTML;
			if (title.indexOf("Colorado") > -1){
			  title = "CO " + title.substring(title.indexOf(" ")+1);
			  document.getElementById("title").innerHTML = title;
			}
		  }

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
					points(queryObj.point, sr);
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
							myLayer = new MapImageLayer({
								"url": layer.getAttribute("url"),
								"opacity": layerObj[id].opacity,
								"title": id,
								"visible": layerObj[id].visible,
								//"visibleLayers": layerObj[id].visLayers
								"sublayers": layerObj[id].visLayers
							});
						// not found on url, not visible
						}else {
							myLayer = new MapImageLayer({
								"url": layer.getAttribute("url"),
								"opacity": Number(layer.getAttribute("alpha")),
								"title": id,
								"visible": false
							});
						}
					}
					// FeatureServer tlb 10/19/20
					else if (layer.getAttribute("url").toLowerCase().indexOf("featureserver") > -1){
						if (layerObj[id]) 
							myLayer = new FeatureLayer({
								"url": layer.getAttribute("url"),
								"opacity": Number(layer.getAttribute("alpha")),
								"title": id,
								"visible" : layerObj[id].visible
								//TODO this does not exist in v4.24********** "visibleLayers" : layerObj[id].visLayers
							});
						else
							myLayer = new FeatureLayer({
								"url": layer.getAttribute("url"),
								"opacity": Number(layer.getAttribute("alpha")),
								"title": id,
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
							myLayer = new MapImageLayer({
								"url": layer.getAttribute("url"),
								"opacity": Number(layer.getAttribute("alpha")),
								"title": id,
								"visible": false
							});
						else
							myLayer = new MapImageLayer({
								"url":layer.getAttribute("url"),
								"opacity": Number(layer.getAttribute("alpha")),
								"title": id,
								"visible": true
							});
					} 
					// FeatureServer tlb 9/28/20
					else if (layer.getAttribute("url").toLowerCase().indexOf("featureserver") > -1){
						if (layer.getAttribute("visible") == "false")
							myLayer = new FeatureLayer({
								"url": layer.getAttribute("url"),
								"opacity": Number(layer.getAttribute("alpha")),
								"title": id,
								"visible": false
							});
						else
							myLayer = new FeatureLayer({
								"url":layer.getAttribute("url"),
								"opacity": Number(layer.getAttribute("alpha")),
								"title": id,
								"visible": true,
							});
					}
					else {
						alert("Unknown operational layer type. It must be of type MapServer or FeatureServer. Or edit readConfig.js line 600 to add new type.");
						return;
					}
				}
				// 3-21-22 check if loaded
				map.add(myLayer);

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
			addWidgets();
		}

		// *********************************
		// Creates actions in the LayerList.
		// *********************************
        function defineActions(event) {
            // The event object contains an item property.
            // is is a ListItem referencing the associated layer
            // and other properties. You can control the visibility of the
            // item, its title, and actions using this object.

            const item = event.item;
            // show legend  
            /*if (item.layer.type != "group") {
                // don't show legend twice
                item.panel = {
                content: "legend",
                open: false
                };
            }*/

          if (item.title === "Game Species") {
            // An array of objects defining actions to place in the LayerList.
            // By making this array two-dimensional, you can separate similar
            // actions into separate groups with a breaking line.

            item.actionsSections = [
            /*  [
                {
                  title: "Go to full extent",
                  className: "esri-icon-zoom-out-fixed",
                  id: "full-extent"
                },*/
               {
                  title: "Layer information",
                  className: "esri-icon-description",
                  id: "information"
                }
              /*], 
              [
                {
                  title: "Increase opacity",
                  className: "esri-icon-up",
                  id: "increase-opacity"
                },
                {
                  title: "Decrease opacity",
                  className: "esri-icon-down",
                  id: "decrease-opacity"
                }
              ]*/
            ];   
          }

         //console.log(item.title+" vis: "+item.visible+" vis at scale: "+ item.visibleAtCurrentScale);
          // Adds a slider for updating a top level group or individual layer's opacity
          if((item.children.length == 0 && item.parent) || item.parent === null ){
            const slider = new Slider({
              min: 0,
              max: 1,
              precision: 2,
              values: [ item.layer.opacity ],
              visibleElements: {
                labels: true,
                rangeLabels: true
              }    
            });

            item.panel = {
              content: slider,
              className: "esri-icon-sliders-horizontal",
              title: "Change layer opacity"
            };

            slider.on("thumb-drag", (event) => {
              const { value } = event;
              item.layer.opacity = value;
            });
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
						var tocPane = new TitlePane({
							title: "<img id='tocIcon' role='presentation' alt='map layers icon' src='assets/images/i_layers.png'/> Map Layers & Legend",
							open: preload,
							content: document.getElementById("tocContent")
							 //"<div id='tocContent' style='position:relative'><img id='tocHelpBtn' role='button' alt='map layers help' class='help_icon help_icon_dialog' src='assets/images/i_help.png'></div>"
						},"tocPane");
						tocPane.startup();
						document.getElementById("tocHelpBtn").addEventListener("click",function(){show("tocHelpDialog");});
					
						// Layer List
						var layerList = new LayerList({
							view: view,
							listItemCreatedFunction: defineActions,
							container: document.getElementById('layersContent') //tocPane.containerNode.id
						});

						// Basemaps
						document.getElementById("basemapContent").appendChild(new My_BasemapGallery());
		
						// Legend
						let legendWidget = new Legend({
							view: view,
							container: document.getElementById("legendContent")
						});
					
						layerList.when(() => {
							// hide toc items
							var tocItems = document.getElementsByClassName("esri-layer-list__item--has-children");
							for (var i=0; i<tocItems.length;i++){
								var item=tocItems[i].children[0].children[1].children[1].innerHTML;
								// TODO read from config.xml hideGroupSubLayers
								//if (['Emergency','Field Office','Chamber of Commerce or Welcome Center','License Agent','Campgrounds and SWA Facilities','GMU boundary (Hunting Units)'].includes(item) ){
								if (hideGroupSublayers.includes(item)){
									// hide expand icon
									tocItems[i].children[0].children[0].style.visibility = "hidden";
									// hide the ul of zoom levels
									tocItems[i].children[1].style.display = "none";
								}
								// hide MVUS status layer
								else if(item === "Status"){
									for (var j=0;j<map.layers.length;j++){
										if (map.layers.items[j].title === "Motor Vehicle Use Map"){
											for (var m=0;m<map.layers.items[j].sublayers.length;m++){
												if (map.layers.items[j].sublayers.items[m].title === "Status"){
													map.layers.items[j].sublayers.items[m].visible = false;
													break;
												}
											}
											break;
										}
									}
									tocItems[i].children[0].children[1].children[0].children[0].className="esri-icon-non-visible";
								}
							}
						});
			
						// Event listener that fires each time an action is triggered
						layerList.on("trigger-action", (event) => {
							// The layer visible in the view at the time of the trigger.
							const layer = event.item.layer;
				
							// Capture the action id.
							const id = event.action.id;
				
							if (id === "full-extent") {
								// if the full-extent action is triggered then navigate
								// to the full extent of the visible layer
								view.goTo(visibleLayer.fullExtent)
								.catch((error) => {
								if (error.name != "AbortError"){
									console.error(error);
								}
								});
							} else if (id === "information") {
								// if the information action is triggered, then
								// open the item details page of the service layer
								//window.open(layer.url);
								if (event.item.title === "Game Species")
                					window.open("/HuntingAtlas/definitions.html");
							} else if (id === "increase-opacity") {
								// if the increase-opacity action is triggered, then
								// increase the opacity of the GroupLayer by 0.25
				
								if (layer.opacity < 2) {
								layer.opacity += 0.25;
								}
							} else if (id === "decrease-opacity") {
								// if the decrease-opacity action is triggered, then
								// decrease the opacity of the GroupLayer by 0.25
								if (layer.opacity > 0) {
								layer.opacity -= 0.25;
								}
							}
						});
						if (video == null)
							alert("Warning: Missing help video in " + app + "/config.xml file for widget Map Layers & Legend.", "Data Error");
						dom.byId("tocHelp").href = video;
						if (icon)
							document.getElementById("tocIcon").src = icon;
						dom.byId("tocPane").style.display = "block";
						dom.byId("tocPane").style.visibility = "visible";
						//if (widgetHeight && widgetHeight != "") //cuts off the toc!!!!!
						//	document.getElementById("tocContent").style.maxHeight = widgetHeight + "px";
					}
					
					/*else if (label == "HB1298 Report") {
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
					}*/ 
					else if (label.indexOf("Resource Report") > 0) {
						var reportPane = new TitlePane({
							title: "<img id='reportIcon' role='presentation' alt='resrouce report icon' src='assets/images/i_table.png'/> "+label,
							open: preload,
							content: document.getElementById("reportContent")
						});
						reportPane.startup();
						document.getElementById("reportDiv").appendChild(reportPane.domNode);
						document.getElementById("reportHelpBtn").addEventListener("click",function(){show("reportHelpDialog");});
						if (video == null)
							alert("Warning: Missing help video in " + app + "/config.xml file for widget " + label + ".", "Data Error");
							dom.byId("reportHelp").href = video;
						if (icon)
							document.getElementById("reportIcon").src = icon;
						//dom.byId("reportTitle").innerHTML = label;
						
						dom.byId("reportDiv").style.display = "block";
						dom.byId("reportDiv").style.visibility = "visible";
						// TODO ***************reportInit();
					} else if (label == "Feature Search") {
						var searchPane = new TitlePane({
							title: "<img id='searchIcon' role='presentation' alt='feature search icon' src='assets/images/i_search.png'/> "+label,
							open: preload,
							content: document.getElementById("searchContent")
						});
						searchPane.startup();
						document.getElementById("searchDiv").appendChild(searchPane.domNode);
						document.getElementById("searchHelpBtn").addEventListener("click",function(){show("featureSearchHelpDialog");});
						if (video == null)
							alert("Warning: Missing help video in " + app + "/config.xml file for widget Feature Search.", "Data Error");
							dom.byId("searchHelp").href = video;
						if (icon)
							document.getElementById("searchIcon").src = icon;
						if (preload) {
							openedFeatureSearch = true;
							// TODO *********** searchInit();
						}
						dom.byId("searchDiv").style.display = "block";
						dom.byId("searchDiv").style.visibility = "visible";
					}else if (label == "Address") {
						continue;
						/*try {
							// TODO ******locator = new Locator(xmlDoc.getElementsByTagName("addressservice")[0].getAttribute("url"));
						} catch (e) {
							alert('Missing tag: addressservice in ' + app + '/config.xml.\n\nTag should look like: &lt;addressservice url="https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates"/&gt;\n\nWill use that url for now.', 'Data Error');
							// TODO ******locator = new Locator("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates");
						}
						if (video == null)
							alert("Warning: Missing help video in " + app + "/config.xml file for widget Address.", "Data Error");
						if (icon)
							document.getElementById("addressIcon").src = icon;
						dom.byId("addressHelp").href = video;
						
						dom.byId("addressDiv").style.display = "block";
						dom.byId("addressDiv").style.visibility = "visible";
						*/
					}
					 else if (label == "Draw, Label, & Measure") {
						var drawPane = new TitlePane({
							title: "<img id='drawIcon' role='presentation' alt='feature search icon' src='assets/images/i_measure.png'/> "+label,
							open: preload,
							content: document.getElementById("drawContent")
						});
						drawPane.startup();
						document.getElementById("drawDiv").appendChild(drawPane.domNode);
						document.getElementById("drawHelpBtn").addEventListener("click",function(){show("drawHelpDialog");});
						if (video == null)
							alert("Warning: Missing help video in " + app + "/config.xml file for widget Draw, Label, & Measure.", "Data Error");
						dom.byId("drawHelp").href = video;
						if (icon)
							document.getElementById("drawIcon").src = icon;
						
						//drawInit(); // in javascript/draw.js called in identify.js/readSettingsWidget because it needs XYProjection from this file.
						dom.byId("drawDiv").style.display = "block";
						dom.byId("drawDiv").style.visibility = "visible";
					} else if (label == "Bookmark") {
						var bookmarkPane = new TitlePane({
							title: "<img id='bookmarkIcon' role='presentation' alt='bookmark icon' src='assets/images/i_bookmark.png'/> "+label,
							open: preload,
							content: document.getElementById("bookmarkContent")
						});
						bookmarkPane.startup();
						document.getElementById("bookmarkDiv").appendChild(bookmarkPane.domNode);
						document.getElementById("bookmarkHelpBtn").addEventListener("click",function(){show("bookmarkHelpDialog");});
						if (video == null)
							alert("Warning: Missing help video in " + app + "/config.xml file for widget Bookmark.", "Data Error");
						dom.byId("bookmarkHelp").href = video;
						if (icon)
							document.getElementById("bookmarkIcon").src = icon;
						// TODO ***********setBookmarks(); // in javascript/bookmarks.js
						
						dom.byId("bookmarkDiv").style.display = "block";
						dom.byId("bookmarkDiv").style.visibility = "visible";
					} else if (label == "Settings") {
						var showTools = true;//" checked";
						if (screen.width < 768) showTools=false;//"";
						var settingsPane = new TitlePane({
							title: "<img id='settingsIcon' alt='settings icon' src='assets/images/i_resources.png'/> "+label,
							open: false,
							content: document.getElementById("settingsContent")
							//content: new ContentPane({
							//	content:"<input id='toolsMenuChkBox' class='largeCheckbox' onclick='javascript:showHideTools()' type='checkbox'"+showTools+"/><label for='toolsMenuChkBox'>Show tools menu?</label>"
							//})
						});
						settingsPane.startup();
						document.getElementById("settingsDiv").appendChild(settingsPane.domNode);
						document.getElementById("settingsHelpBtn").addEventListener("click",function(){show("settingsHelpDialog");});
						document.getElementById("toolsMenuChkBox").checked = showTools;
						if (video == null)
							alert("Warning: Missing help video in " + app + "/config.xml file for widget Settings.", "Data Error");
							dom.byId("settingsHelp").href = video;
						if (icon)
							document.getElementById("settingsIcon").src = icon;
						
						dom.byId("settingsDiv").style.display = "block";
						dom.byId("settingsDiv").style.visibility = "visible";
					}
					else if (label == "Print") {
						//if (icon)
						//	document.getElementById("printIcon").src = icon;
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
				//TODO ********* printInit();
				// Hide widgets
				if (widgetStr.indexOf("Map Layers & Legend") == -1)
					dom.byId("tocPane").style.display = "none";
				else if (widgetStr.indexOf("Resource Report") == -1)
					dom.byId("reportDiv").style.display = "none";
				else if (widgetStr.indexOf("Feature Search") == -1)
					dom.byId("searchDiv").style.display = "none";
				else if (widgetStr.indexOf("Address") == -1)
					dom.byId("addressDiv").style.display = "none";
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
						continue;
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
						window.open(licenseURL, "_new");
						if(typeof ga === "function")ga("send","event","buy_license","click","Buy License","1");
						if (typeof gtag === "function")gtag('event','widget_click',{'widget_name': 'Buy License'});

					});
				}
			});
		}

		//***********************
		// Add Print
		//***********************
		function addPrint(){
			// Get the disclaimer and create the print widget by calling createPrintWidget.

			// Read the PrintPdfWidget.xml file to get the disclaimer
			var prtDisclaimer="disclaimer";
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
					createPrintWidget(prtDisclaimer);
				}
				else if (xmlhttp.status === 404) {
					alert("Cannot add print widget. Missing PrintPdfWidget.aspx file in "+app+ " directory.","Data Error");
				}
				else if (xmlhttp.readyState===4 && xmlhttp.status===500) {
					alert("Cannot add print widget. Missing PrintPdfWidget.aspx file in "+app+ " directory.","Data Error");
				}
			};
			xmlhttp.open("GET",xmlFile,true);
			xmlhttp.send();
		}
		function createPrintWidget(prtDisclaimer){
			const print = new Print({
				view: view,
				// specify your own print service
				printServiceUrl: printServiceUrl,
				allowedFormats: ["pdf","jpg"],
				allowedLayouts: ["Letter ANSI A landscape", "Letter ANSI A portrait", "Tabloid ANSI B landscape", "Tabloid ANSI B portrait"],
				templateOptions: {
					author: prtDisclaimer,
					legendEnabled: true,
					dpi: 300
				},
				templateCustomTextElements: {
					"Subtitle": "subtitle"
				}
			});
			const printExpand = new Expand({
				view,
				content: print,
				expandTooltip: "Print",
				expandIconClass: "esri-icon-printer"
			});
			view.ui.add(printExpand, "top-right");
		}

		//**********************
		//   Add Find a Place
		//**********************
		function addFindPlace(){
			// Find a Place Widget ESRI default
			//require(["esri/geometry/Point","esri/geometry/Polygon"],function(Point,Polygon){
				/*
				// Create a symbol for drawing the point
				const textSymbol = {
				type: "text", // autocasts as new TextSymbol()
				color: "#7A003C",
				text: "\ue61d", // esri-icon-map-pin // "", // esri-icon-map-pin
				font: {
					// autocasts as new Font()
					size: 36,
					family: "CalciteWebCoreIcons"
				}
				};
				*/
				/*let highlightSymbol = {
					type: "simple-line",  // autocasts as new SimpleLineSymbol()
					style: "solid",
					color: "red",
					width: "3px"
				};*/

				//define layers for boundaries
				var countyFL = new FeatureLayer({
					url:"https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/HuntingAtlas/HuntingAtlas_FindAPlaceTool_Data/MapServer/1",
					popupTemplate: {
						// autocasts as new PopupTemplate()
						title: "{COUNTYNAME} County",
						overwriteActions: true
					}
				});
				var propertyFL = new FeatureLayer({
					url:"https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/HuntingAtlas/HuntingAtlas_AssetReport_Data/MapServer/3",
					popupTemplate: {
						// autocasts as new PopupTemplate()
						title: "{PropName}",
						overwriteActions: true
					  }
				});
				var gmuFL = new FeatureLayer({
					url:"https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/HuntingAtlas/HuntingAtlas_FindAPlaceTool_Data/MapServer/4",
					popupTemplate: {
						// autocasts as new PopupTemplate()
						title: "GMU {GMUID}",
						overwriteActions: true
					  }
				});
				var forestFL = new FeatureLayer({
					url: "https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/HuntingAtlas/HuntingAtlas_AssetReport_Data/MapServer/5",
					popupTemplate: {
						// autocasts as new PopupTemplate()
						title: "{MapName}",
						overwriteActions: true
					  }
				});
				var wildernessFL = new FeatureLayer({
					url: "https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/HuntingAtlas/HuntingAtlas_AssetReport_Data/MapServer/4",
					popupTemplate: {
						// autocasts as new PopupTemplate()
						title: "{NAME}",
						overwriteActions: true
					  }
				});
				const searchWidget = new Search({
					view: view,
					includeDefaultSources:false, // include ESRI geocode service "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer"
					searchAllEnabled:false, // if true has drop down list of sources includeing ESRI's
					popupEnabled:true,
					locationEnabled:true, // Adds option to go to current location
					maxResults: 6,
					maxSuggestions: 50,
					suggestionsEnabled: true,
					minSuggestCharacters: 2,
					sources: [
							{
								url: myFindService, //https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/GNIS_Loc/GeocodeServer 
								singleLineFieldName: "SingleLine",
								outFields: ["*"],
								name: "Colorado Places",
								placeholder: "Search Colorado Places",
								zoomScale: 72224,
								resultSymbol: {
									type: "picture-marker",  // autocasts as new PictureMarkerSymbol()
									url: "/assets/images/i_flag.png",
									size: 24,
									width: 24,
									height: 24,
									xoffset: 0,
									yoffset: -12
								},
								// maybe parse results here for multiple found, weld and boulder county, fish species.
								// if polygon change resultSymbol
								  /*getSuggestions: (params) => {
									return testData.then((data) => {
									  var results = [];
									  var toSearch = params.suggestTerm;
									  data = data["allIBLocations"]["data"];
								
									  for(var i=0; i<data.length; i++) {
										if(data[i]["name"].indexOf(toSearch)!=-1) {
										  results.push(data[i]);
										}
									  }
									  return results.map((feature) => {
										return {
										  key: "name",
										  text: feature.name,
										  sourceIndex: params.sourceIndex
										};
									  });
									});
								  },
								  getResults: (params) => {
									return testData.then((data) => {
									  var results = [];
									  var toSearch = params.suggestResult.text;
									  data = data["allIBLocations"]["data"];
									  for(var i=0; i<data.length; i++) {
										if(data[i]["name"].indexOf(toSearch)!=-1) {
										  results.push(data[i]);
										}}
									  
									  const searchResults = results.map((feature) => {
										console.log(feature)
										const graphic = new Graphic({
										  geometry: new Point({
											latitude: feature.geoCode.latitude,
											longitude: feature.geoCode.longitude
										  }),
										  attributes: feature.address
										});
										const buffer = geometryEngine.geodesicBuffer(
										  graphic.geometry,
										  100,
										  "meters"
										);
										const searchResult = {
										  extent: buffer.extent,
										  feature: graphic,
										  name: feature["name"]
										};
										return searchResult;
									  });
									  return searchResults;
									});
								}*/
							},
							{
								layer: countyFL,
								searchFields: ["COUNTYNAME"],
								displayField: "COUNTYNAME",
								exactMatch: false,
								outFields: ["COUNTYNAME"],
								name: "Counties",
								placeholder: "Search Counties"
							},
							{
								layer: propertyFL,
								searchFields: ["PropName"],
								displayField: "PropName",
								exactMatch: false,
								maxSuggestions: 1000,
								outFields: ["PropName"],
								name: "CPW Properties (STL, SWA, SFU, or WWA)",
								placeholder: "Search CPW Properties"
							},
							{
								layer: gmuFL,
								searchFields: ["GMUID"],
								displayField: "GMUID",
								exactMatch: false,
								maxResults: 6,
								maxSuggestions: 100,
								minSuggestCharacters: 1,
								outFields: ["GMUID"],
								name: "GMUs",
								placeholder: "Search GMUs"
							},
							{
								layer: forestFL,
								searchFields: ["MapName"],
								displayField: "MapName",
								exactMatch: false,
								outFields: ["MapName"],
								name: "Forest or Grassland",
								placeholder: "Search Forests/Grasslands"
							},
							{
								layer: wildernessFL,
								searchFields: ["NAME"],
								displayField: "NAME",
								exactMatch: false,
								outFields: ["NAME"],
								name: "Wilderness",
								placeholder: "Search Wildernesses"
							}
						]
						/*resultGraphic: new Polygon({
							symbol: highlightSymbol
						})*/
				  });
				  searchWidget.on("search-complete", function(event){
					//alert(event.results);
				  });
				  searchWidget.on("select-result", function(event){
					//alert("clicked");
				  });
				  // Adds the search widget below other elements in
				  // the top left corner of the view
				  view.ui.add(searchWidget, {
					position: "top-right",
					index: 2
				  });
				//});	
		}
		//********************
		//  Add OverviewMap
		//********************
		var extentGraphic, dragging=false, overviewMap,extentDebouncer;
		function addOverviewMap(){
			// Create another Map, to be used in the overview "view"
			const ovMap = new Map({
				basemap: "streets-vector"
			});

			const overviewDiv = document.getElementById("overviewDiv");
			
			overviewMap = new MapView({
				container: "overviewDiv",
				map: ovMap,
				extent: fullExtent,
				constraints: {
					rotationEnabled: false
				}
		 	});
			
			overviewMap.when(() => {
				setupOverviewMap();
			});
			const ovExpand = new Expand({
				view: view,
				content: overviewDiv,
				id: "overviewBtn",
				expandTooltip: "Overview Map",
				expandIconClass: "esri-icon-overview-arrow-bottom-right",
				collapseIconClass: "esri-collapse__icon esri-expand__icon--expanded esri-icon-collapse",
				label: "Show Overview"
				});
			view.ui.add(ovExpand, "top-left");
			overviewMap.on("click",function(){alert('ov');});

			// set up initial extent on overview map
			extentDebouncer = promiseUtils.debounce(() => {
				if (view.stationary) {
					overviewMap.goTo({
					center: view.center,
					//extent: view.extent.expand(2)
					scale:view.scale * 2 *
						Math.max(
						view.width / overviewMap.width,
						view.height / overviewMap.height
						)
					});
				}
			});
		}

        function setupOverviewMap() {
          // Overview map extent graphic
          extentGraphic = new Graphic({
            geometry: null,
            symbol: {
              type: "simple-fill",
              color: [0, 0, 0, 0.5],
              outline: null
            }
          });
          overviewMap.graphics.add(extentGraphic);
          
         // Disable all zoom gestures on the overview map
          overviewMap.popup.dockEnabled = true;
          // Removes the zoom action on the popup
          overviewMap.popup.actions = [];
          // stops propagation of default behavior when an event fires
          //function stopEvtPropagation(event) {
          //  event.stopPropagation();
          //}
          // exlude the zoom widget from the default UI
          // Remove the default widgets
          overviewMap.ui.components = [];
          // disable mouse wheel scroll zooming on the view
          overviewMap.on("mouse-wheel", function(event){
            if(overviewDiv.style.visibility == "hidden")return;
            event.stopPropagation();
          });
          // disable zooming via double-click on the view
          overviewMap.on("double-click", function(event){
            if(overviewDiv.style.visibility == "hidden")return;
            event.stopPropagation();
          });
          // disable zooming out via double-click + Control on the view
          overviewMap.on("double-click", ["Control"], function(event){
            if(overviewDiv.style.visibility == "hidden")return;
            event.stopPropagation();
          });

          // pan the overview graphic to move main map
          // disables pinch-zoom and panning on the view
          var start, update, diffX, diffY;
          let tempGraphic;
          let draggingGraphic;
          overviewMap.on("drag",(event) => {
            if(overviewDiv.style.visibility == "hidden")return;
            if (event.action === "start") {
                // if this is the starting of the drag, do a hitTest
                overviewMap.hitTest(event).then(resp => {
                    if (resp.results[0].graphic && resp.results[0].graphic.geometry && resp.results[0].graphic.geometry.type === 'extent'){
                      event.stopPropagation();
                      dragging=true;
                      console.log("start dragging"); 
                      // if the hitTest returns an extent graphic, set dragginGraphic
                      draggingGraphic = resp.results[0].graphic;
                      start =  overviewMap.toMap({x: event.x, y: event.y});
                    }
                });
            }
            if (event.action === "update") {
                // on drag update events, only continue if a draggingGraphic is set
                if (draggingGraphic){
                    event.stopPropagation();
                    console.log("update dragging");
                    // if there is a tempGraphic, remove it
                    if (tempGraphic) {
                        overviewMap.graphics.remove(tempGraphic);
                    } else {
                        // if there is no tempGraphic, this is the first update event, so remove original graphic
                        overviewMap.graphics.remove(draggingGraphic);
                    }
                    // create new temp graphic and add it
                    tempGraphic = draggingGraphic.clone();
                    // Calculate new extent
                    update = overviewMap.toMap({x: event.x, y: event.y});
                    diffX = update.x - start.x;
                    diffY = update.y - start.y;
                    start = update;
                    const extent = extentGraphic.geometry;
                    extent.xmin += diffX;
                    extent.xmax += diffX; 
                    extent.ymin += diffY;
                    extent.ymax += diffY; 
                    tempGraphic.geometry = extent;
                    overviewMap.graphics.add(tempGraphic);
                }
            }
            else if (event.action === "end") {
                // on drag end, continue only if there is a draggingGraphic
                if (draggingGraphic){
                  event.stopPropagation();
                  console.log("end dragging");
                  // rm temp
                  if (tempGraphic) overviewMap.graphics.remove(tempGraphic);
                  // fix double image bug
                  if (draggingGraphic) overviewMap.graphics.remove(draggingGraphic);
                  // create new graphic based on original dragging graphic
                  extentGraphic = draggingGraphic.clone();
                  if (tempGraphic)
                    extentGraphic.geometry = tempGraphic.geometry.clone();
                  else
                    extentGraphic.geometry = draggingGraphic.geometry.clone();
                  
                  // add replacement graphic
                  overviewMap.graphics.add(extentGraphic);
                  
                  // reset vars
                  draggingGraphic = null;
                  tempGraphic = null;
                  
                  // Adjust main map
                  view.center = extentGraphic.geometry.extent.center;
                  dragging=false;
                }
            }
          });

          // disable the view's zoom box to prevent the Shift + drag
          // and Shift + Control + drag zoom gestures.
          overviewMap.on("drag", ["Shift"], function(event){
            console.log("shift-drag");
            if(overviewDiv.style.visibility == "hidden")return;
            event.stopPropagation();
          });
          overviewMap.on("drag", ["Shift", "Control"], function(event){
            if(overviewDiv.style.visibility == "hidden")return;
            event.stopPropagation();
          });

          // prevents zooming with the + and - keys
          overviewMap.on("key-down", (event) => {
            if(overviewDiv.style.visibility == "hidden")return;
            const prohibitedKeys = ["+", "-", "Shift", "_", "=", "ArrowUp", "ArrowDown", "ArrowRight", "ArrowLeft"];
            const keyPressed = event.key;
            if (prohibitedKeys.indexOf(keyPressed) !== -1) {
              event.stopPropagation();
            }
          });
          
          reactiveUtils.watch(
            () => view.extent,
            (extent) => {
              // Sync the overview map location
              // whenever the view is stationary
              if(dragging) return;
              extentDebouncer().then(() => {
                extentGraphic.geometry = extent;
              });
              overviewMap.scale = view.scale * 2 * Math.max(
                  view.width / overviewMap.width,
                  view.height / overviewMap.height
                );
              overviewMap.center = view.center;
            },
            {
              initial: true
            }
          );

		  overviewDiv.style.border="1px solid gray";
        }

		

		//********************
		//     Add Map
		//********************
		function addMap() {
			require(["dojo/dom", "dijit/registry", "dojo/sniff", "dojo/on"], function (dom, registry, has, on) {
				try {
					// labels for slider scale bar
					//var labels = [9244,4622,2311,1155,577,288,144,72,36,18,9,4,2,1];
					//var labels = [4622,1155,288,72,18,4,1];
					//var labels = [9244,2311,577,144,36,9,2];
					// set sliderStyle: "large" for long slider
					// Set initial basemap. Available basemaps:  streets-vector, hybrid, topo-vector, streets-relief-vector		
					// showAttribution=true shows the name of the basemap next to the logo.
					// displayGraphicsOnPan=false for IE may speed up pans
					//			basemap: "streets",
					// 	sliderLabels: labels,
					mapBasemap = "streets-vector";
					if (queryObj.layer && queryObj.layer != "") {
						var basemapArr = queryObj.layer.substring(0, queryObj.layer.indexOf("|")).split(",");
							// old version used 0,1,2|... and first one was selected basemap.
							if (basemapArr[0] == 0)
								mapBasemap = "streets-vector";
							else if (basemapArr[0] == 1)
								mapBasemap = "hybrid";
							else if (basemapArr[0] == 2)
								mapBasemap = "topo-vector";
							else
								mapBasemap = basemapArr[0];
							basemapArr = null;
					}
					//10-11-22					map.infoWindow.resize(330, 350);
					// print preview map
					// 4-19-17 added custom lods from 9M to 1K. Used to have 19 levels, now it has 12.
					/*customLods = [{
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
					customLods = null;*/
					
					// set lods
					// 4-19-17 added custom lods from 9M to 1K. Used to have 19 levels, now it has 12.
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
					
					//require(["dojo/_base/Color", "dojo/dom-construct"], function (Color, domConstruct) {
					// standard info window
					// 10-11/22							var popup = new Popup({
					//									fillSymbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25]))
					//								}, domConstruct.create("div"));
					map = new Map({
						basemap: mapBasemap,
						lods: customLods
						});
					view = new MapView({
						container: "mapDiv",
						extent: fullExtent,
						map: map,
						constraints: {
							maxScale: 9244649,
							minScale: 1128
						}
					});
					
				} catch (e) {
					alert("Error creating map in readConfig.js addMap. " + e.message, "Code Error", e);
				}






				// 3-21-22
				// load legend/layer list. Fires after one layer is added to the map using the map.addLayer method.
/*					var toc;
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

*/


				
				
				// Load listener function for when the first or base layer has been successfully added
				view.when(() => {
					// layer create error
					view.on("layerview-create-error", function(event) {
						const err = new Error({name:"Warning",message:"Layer failed to load: "+event.layer.id});
						console.error("test LayerView failed to create for layer with the id: ", event.layer.id);
					});
					// Update mouse coordinates
					view.on('pointer-move', (event)=>{
						showCoordinates(event);  
					});
					
					// Identify
					view.on('click', (event)=>{
						//todo	****************			doIdentify();
						console.log("Identify");
					});
					
					// Watch for map scale change
					// Providing `initial: true` in ReactiveWatchOptions
					// checks immediately after initialization
					// Equivalent to watchUtils.init()
					reactiveUtils.watch(
						() => view.zoom,
						() => {
							showMapScale(parseInt(view.scale));
						},
						{
						initial: true
					});
					  
					// Show hide loading image
					view.on("update-start", showLoading);
					view.on("update-end", hideLoading);
					// display current map scale
					showMapScale(view.scale);
					addMapLayers();

					// Add Legend
					let legend = new Legend({
						view: view
					});

					const legendExpand = new Expand({
						view,
						content: legend,
						expandTooltip: "Legend",
						expandIconClass: "esri-icon-legend"
					});
					view.ui.add(legendExpand, "top-right");

					// Add Scalebar
					let scalebar = new ScaleBar({
						view: view,
						// "dual" displays both miles and kilmometers
						// "non-metric"|"metric"|"dual"
						unit: "dual"
					});
					
					view.ui.add(scalebar, {
						position: "bottom-left"
					});

					// Home
					const homeBtn = new Home({
						view: view,
						expandTooltip: "Full Extent",
					});
					// Add the home button to the top left corner of the view
					view.ui.add(homeBtn, "top-left");

					// Add You Location
					const locateBtn = new Locate({
						view: view
					});
			
					// Add the locate widget to the top left corner of the view
						view.ui.add(locateBtn, {
						position: "top-left"
					});
				});
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
			queryObj = ioquery.queryToObject(location.substring((location[0] === "?" ? 1 : 0)));
			
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
					// Set Geometry ServicenURL
					try{
						geometryService = xmlDoc.getElementsByTagName("geometryservice")[0].getAttribute("url");
					} catch (e) {
						alert('Missing tag: geometryservice in ' + app + '/config.xml.\n\nTag should look like: &lt;geometryservice url="https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/Utilities/Geometry/GeometryServer"/&gt;\n\nWill use that url for now.', 'Data Error');
						geometryService = "https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/Utilities/Geometry/GeometryServer";
					}
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
					/*try {
						findPlaceInit();
					} catch (e) {
						alert("Error in javascript/FindPlace.js " + e.message, "Code Error", e);
					}*/
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
						
						addMap();
						addOverviewMap();
						addFindPlace();
						addPrint();
						//createMyBasemapGallery();
						hideLoading();
					
					
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
							GeometryService.project(geometryService,params, function (newExt) {
								initExtent = newExt[0];
								view.extent = initExtent;
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
							view.extent = initExtent;
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