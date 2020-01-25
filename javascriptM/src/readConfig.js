var cfgExtent;
var geoLocate;
var geoLocateZoomIn=true;
function createMap() {
	require(["dojo/dom", "dijit/registry", "dojo/_base/lang", "esri/map", "esri/dijit/PopupMobile", "esri/symbols/SimpleLineSymbol",
	"esri/symbols/SimpleMarkerSymbol", "esri/tasks/GeometryService", "esri/Color", "dojo/dom-construct", "esri/SpatialReference", 
	"esri/geometry/Extent", "esri/layers/ArcGISDynamicMapServiceLayer"], function (dom, registry, lang, Map, PopupMobile,
	SimpleLineSymbol, SimpleMarkerSymbol, GeometryService, Color, domConstruct, SpatialReference, Extent, ArcGISDynamicMapServiceLayer) {
		var xmlDoc;
		function addGraphicsAndLabels() {
			try {
				if (queryObj.point && queryObj.point != "") {
					require(["javascript/graphicFuncs"],function(graphicFuncs){
						graphicFuncs.addPoints(queryObj.point);
					});
					if (queryObj.hb1298 && queryObj.hb1298 != "") {
						addHB1298Points(queryObj.hb1298);
					}
				}
			} catch (e) {
				alert("Error loading way points from the URL. In javascript/addPoints() " +
					e.message + "\npoints=" + queryObj.point, "URL Graphics Error", e);
			}
		}

		// tlb 2/19/19 Test if layers exist before adding them
		function testLayers(){
			// handle errors in layer loading
			require(["dojo/promise/all","dojo/Deferred","dojo/json"],function(all,Deferred,JSON){
				function cancelRequest(request){
					if (request.status==0)
						request.abort();
				}
				function testService(layer) {
						var deferred = new Deferred();
						var request = new XMLHttpRequest();
						try {
							request.open("get", layer.url + "?f=json");
							var timer = setTimeout(cancelRequest.bind(null, request),3000); // timeout after 3 seconds
						}
						catch (error) {
								console.error(error);
								deferred.resolve({ layer: layer, resolution: false });
								return deferred.promise;
						}
						request.onloadend = function () {
								if (this.status !== 200) {
										//console.log("Could not load " + layer.id);
										deferred.resolve({ layer: layer, resolution: false });
								} else {
										var response = JSON.parse(this.response);
										if (response.error) {
												//console.log("Could not load " + layer.id);
												deferred.resolve({ layer: layer, resolution: false });
										} else {
												deferred.resolve({ layer: layer, resolution: true });
										}
								}
						};
						request.send();
						return deferred.promise;
				}
			
				var promises = [];
				var layersToAdd = [];
				var layers = xmlDoc.getElementsByTagName("operationallayers")[0].getElementsByTagName("layer");
				var mvum1Index=-1,mvum2Index;
				for (var i=0; i<layers.length; i++){
					layersToAdd[i] = {
						"id": layers[i].getAttribute("label"),
						"url": layers[i].getAttribute("url")
					};
					// Save the index to MVUM
					if (layersToAdd[i].id.indexOf("Motor Vehicle")>-1) mvum1Index = i;
				}
				// if no MVUM don't add additional services to try
				if (mvum1Index > -1){
					// Test 2 additional MVUM to use if one is down
					mvum2Index = layersToAdd.length;
					//layersToAdd[layersToAdd.length] = {
					//	"id": "Motor Vehicle Use Map",
					//	"url": "https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_MVUM_02/MapServer"
					//};
					layersToAdd[layersToAdd.length] = {
						"id": "Motor Vehicle Use Map",
						"url": "https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/mvum/MapServer"
					};
				}
				layersToAdd.forEach(function (layer) {
					promises.push(testService(layer));
				});
				
				// Process Map Service Responses - Up or Down
				var allPromises = new all(promises);
				allPromises.then(function (response) {
					var errflag = false; // did any layer have problems? addMapLayers will replace xmlDoc layers with these in response
					var mvumflag = false;
					var rmLayers = [];
					for (var i=0; i<response.length; i++) {
						if (response[i].layer.id.indexOf("Motor Vehicle")>-1) mvumflag = true;
						else mvumflag = false;
						if (response[i].resolution) {
							// layer did not have errors
							if (mvumflag == true){
								// The given MVUM worked
								if (mvum1Index == i) {
									response.pop(); // pop 2nd MVUM
									//response.pop(); // pop 3rd MVUM
								}
								// The second MVUM worked replace this URL and remove the last 2 MVUM maps
								else if (mvum2Index == i) {
									console.log("Layer loaded: "+response[i].layer.id+" "+response[i].layer.url);
									response[mvum1Index].layer.url = response[i].layer.url;
									response[mvum1Index].resolution = true;
									response.pop(); // pop 2nd MVUM
									//response.pop(); // pop 3rd MVUM
									errflag = true;
									ourMVUM = true;// set flag because will need to move this layer to the bottom of TOC later.
								}
								// The third MVUM worked replace this URL and remove the last 2 MVUM maps
								//else {
								//	console.log("Layer loaded: "+response[i].layer.id+" "+response[i].layer.url);
								//	response[mvum1Index].layer.url = response[i].layer.url;
								//	response[mvum1Index].resolution = true;
								//	response.pop();
								//	response.pop();
								//	errflag = true;
								//	ourMVUM = true;// set flag because will need to move this layer to the bottom later.
								//}
							}
						}
						// layer is down
						else {
							console.log("Layer failed to load: "+response[i].layer.id+" "+response[i].layer.url);
							// Not MVUM since that is handled above
							if (response[i].layer.id.indexOf("Motor Vehicle")==-1){
								alert(response[i].layer.id+" service is not reponding.","Data Error");
								rmLayers.push(response[i].layer.id); // index of layers to remove
							}
						}
					}
					// Remove map services that were down, from the response array
					if (rmLayers.length > 0){
						errflag = true;
						for (j=0;j<rmLayers.length;j++){
							for (i=0;i<response.length;i++){
								if (rmLayers[j] == response[i].layer.id){	
									response.splice(i,1);
									break;
								}
							}
						}
					}
					// Pass services to use. If there were services that were down errflag = true.
					addMapLayers(response,errflag,ourMVUM);
				});
			});
		}


		function addMapLayers(response,errflag,ourMVUM) {
			// tlb 2/19/19 Called from testLayers which will see if the mapservice is up.
			// Passes 3 new parameters:
			//   response: an object containing id and url of map services that were up
			//   errflag: a boolean. If true any map services were down. Update xmlDoc
			//   ourMVM: a boolean. If true USFS MVUM service is down use ours, but will need to switch the order. Put on bottom.
			function layerLoadHandler(event) {
				// For layers loaded from URL set layer visibility
				try {
					var j, layerInfos;
					var num = new Array(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
					if (layerObj[event.layer.id]) {
						layerInfos = [];
						layerInfos = event.layer.layerInfos;
						// See what gmu is turned on
						if (event.layer.id == "Hunter Reference") {
							for (j = 0; j < layerObj[event.layer.id].visLayers.length; j++) {
								if (layerInfos[layerObj[event.layer.id].visLayers[j]].name.substr(layerInfos[layerObj[event.layer.id].visLayers[j]].name.length - 3, 3).indexOf("GMU") > -1) {
									gmu = layerInfos[layerObj[event.layer.id].visLayers[j]].name;
									break;
								}
							}
						}
						// if gmu was not visible but a game species was selected then set gmu
						else if (event.layer.id == "Game Species") {
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
						// 2-19-19 use default visibility for old MVUM
						if (!ourMVUM){
							for (j = 0; j < layerInfos.length; j++) {
								if (layerObj[event.layer.id].visLayers.indexOf(layerInfos[j].id) != -1)
									layerInfos[j].defaultVisibility = true;
								else if (layerInfos[j].parentLayerId != -1 && !layerInfos[j].subLayerIds) {
									if (layerInfos[j].name.substr(layerInfos[j].name.length - 3, 3).indexOf("GMU") > -1) {}
									else if ((layerInfos[j].defaultVisibility == true) && (layerObj[event.layer.id].visLayers.indexOf(layerInfos[j].parentLayerId) === -1)) {
										layerObj[event.layer.id].visLayers.push(j);
										if (num.indexOf(parseInt(layerInfos[layerInfos[j].parentLayerId].name.substr(0, 1))) > -1) {
											layerObj[event.layer.id].visLayers.push(layerInfos[j].parentLayerId);
											layerInfos[layerInfos[j].parentLayerId].defaultVisibility = true;
										}
									}
								} else
									layerInfos[j].defaultVisibility = false;
							}
							event.layer.setVisibleLayers(layerObj[event.layer.id].visLayers.sort(function (a, b) {
									return a - b;
								}));
							event.layer.refresh();
						} // end if !ourMVUM
					}
					collapsedFlg = true;
					if (event.layer.visible)
						collapsedFlg = false;
					legendLayers.push({
						layer : event.layer,
						title : event.layer.id,
						autoToggle : true,
						slider : true,
						slider_ticks : 3,
						slider_labels : ["transparent", "50%", "opaque"],
						hideGroupSublayers : hideGroupSublayers,
						radioLayers : radioLayers,
						noLegend : false,
						openSubLayers : [],
						collapsed : collapsedFlg
					});
					mapLayers.push(event.layer);
					if (mapLayers.length == xmlDoc.getElementsByTagName("operationallayers")[0].getElementsByTagName("layer").length) {
						var tmp = [layer.length];
						var m = 0;
						for (j = layer.length - 1; j > -1; j--) {
							for (k = 0; k < layer.length; k++) {
								if (legendLayers[k].title === layer[j].getAttribute("label")) {
									tmp[m++] = legendLayers[k];
									break;
								}
							}
						}
						legendLayers = tmp;
						for (var k = 0; k < mapLayers.length; k++) {
							if ((mapLayers[k].id == "Hunter Reference") && (layerObj["Hunter Reference"])) {
								layerInfos = null;
								layerInfos = mapLayers[k].layerInfos;
								for (j = 0; j < layerInfos.length; j++) {
									if (layerInfos[j].name.substr(layerInfos[j].name.length - 3, 3).indexOf("GMU") > -1) {
										if (layerInfos[j].name == gmu) {
											if (layerObj["Hunter Reference"].visLayers.indexOf(j) == -1)
												layerObj["Hunter Reference"].visLayers.push(j);
											layerInfos[j].defaultVisibility = true;
											if ((num.indexOf(parseInt(layerInfos[layerInfos[j].parentLayerId].name.substr(0, 1))) > -1) && (layerObj["Hunter Reference"].visLayers.indexOf(layerInfos[j].parentLayerId) == -1)) {
												layerObj["Hunter Reference"].visLayers.push(layerInfos[j].parentLayerId);
												layerInfos[layerInfos[j].parentLayerId].defaultVisibility = true;
											}
										} else
											layerInfos[j].defaultVisibility = false;
									}
								}
								mapLayers[k].setVisibleLayers(layerObj["Hunter Reference"].visLayers.sort(function (a, b) {
										return a - b;
									}));
							}
						}
						map.addLayers(mapLayers);
						tocFlag = true;
						initTOC();
					}
				} catch (e) {
					alert("Error in readConfig.js/layerLoadHandler " + e.message, "Code Error", e);
				}
			}
			try {	
				var myLayer, i,j;
				// If loading layers from URL load layerObj
				if (queryObj.layer && queryObj.layer != "") {
					// &layer= basemap | id | opacity | visible layers , id | opacity | visible layers , repeat...
					// &layer= streets|layer2|.8|3-5-12,layer3|.65|2-6-10-12
					var layersArr = queryObj.layer.substring(queryObj.layer.indexOf("|") + 1).split(",");
					layerObj = {};
					for (i = 0; i < layersArr.length; i++) {
						var layerArr = layersArr[i].split("|");
						if (layerArr[0] == "") continue;// tlb 1-5-18 if no layers are visible 
						layerArr[0] = layerArr[0].replace(/~/g," "); // email link to current map replaced spaces with tildas so put them back.
						if (layerArr.length == 3)
							layerArr.push(true);
						if (layerArr[2] == -1)
							layerObj[layerArr[0]] = {
								"opacity" : layerArr[1],
								"visLayers" : [], // tlb 1-5-18 changed from [-1] which was throwing an error.
								"visible" : true
							};
						else
							layerObj[layerArr[0]] = {
								"opacity" : layerArr[1],
								"visLayers" : layerArr[2].split("-"),
								"visible" : layerArr[3] == "1" ? true : false
							};
						// Change visLayers from string to integer
						for (j = 0; j < layerObj[layerArr[0]].visLayers.length; j++)
							layerObj[layerArr[0]].visLayers[j] = layerObj[layerArr[0]].visLayers[j] | 0;
					}
				}
				// tlb 2/19/19 Replace MVUM layers or remove layers if the the service was down
				if (errflag){
					var rmLayers = [];
					for (i=0;i<xmlDoc.getElementsByTagName("operationallayers")[0].getElementsByTagName("layer").length; i++){
						var found = false;
						// get index of matching layer in response array
						for(j=0; j<response.length;j++) {
							if (response[j].layer.id == xmlDoc.getElementsByTagName("operationallayers")[0].getElementsByTagName("layer")[i].getAttribute("label")){
								found = true;
								xmlDoc.getElementsByTagName("operationallayers")[0].getElementsByTagName("layer")[i].setAttribute("url", response[j].layer.url);
								break;
							}
						}
						// If the service was not up, remove it from xmlDoc
						if (!found)rmLayers.push(i);
					}
					for (i=rmLayers.length-1;i>=0;i--){
						var element = xmlDoc.getElementsByTagName("operationallayers")[0].getElementsByTagName("layer")[rmLayers[i]];
						element.parentNode.removeChild(element);
					}
					// If USFS MVUM is down, use ours but move it to the top. Will reverse the legend so it will be on the top.
					if (ourMVUM){
						var topElem = xmlDoc.getElementsByTagName("operationallayers")[0].getElementsByTagName("layer")[0];
						var mvumElem = xmlDoc.getElementsByTagName("operationallayers")[0].getElementsByTagName("layer")[xmlDoc.getElementsByTagName("operationallayers")[0].getElementsByTagName("layer").length-1];
						mvumElem.parentNode.insertBefore(mvumElem, topElem); // null will insert it at the top. It also removes the old location.
						xmlDoc.getElementsByTagName("operationallayers")[0].getElementsByTagName("layer")[0].setAttribute("open",false);
						xmlDoc.getElementsByTagName("operationallayers")[0].getElementsByTagName("layer")[0].setAttribute("alpha",0.85);
					}
				}
				var collapsedFlg;
				var layer = xmlDoc.getElementsByTagName("operationallayers")[0].getElementsByTagName("layer");
				var oslArr;
			
				for (i = 0; i < layer.length; i++) {
					loadedFromCfg = true;
					var id = layer[i].getAttribute("label");
					if (queryObj.layer && queryObj.layer != "") {
						if (layerObj[id])
							myLayer = new ArcGISDynamicMapServiceLayer(layer[i].getAttribute("url"), {
									"opacity" : layerObj[id].opacity,
									"id" : id,
									"visible" : layerObj[id].visible,
									"visibleLayers" : layerObj[id].visLayers
								});
						else
							myLayer = new ArcGISDynamicMapServiceLayer(layer[i].getAttribute("url"), {
									"opacity" : Number(layer[i].getAttribute("alpha")),
									"id" : id,
									"visible" : false
								});
						loadedFromCfg = false; // not loaded from config.xml file.
					
						oslArr = layer[i].getAttribute("opensublayer");
						// Handle IE bug. In Internet Explorer, due to resource caching, the onLoad event is fired as soon as the
						// layer is constructed. Consequently you should check whether the layer's loaded property is true before
						// registering a listener for the "load" event.
						// call layerLoadHandler and pass 2 parameters
						if (myLayer.loaded) {
							layerLoadHandler({
								"layer" : myLayer
							});
						} else {
							myLayer.on("load", layerLoadHandler);
						}
					}
					// Set layer properties from config.xml file
					else {
						if (layer[i].getAttribute("visible") == "false")
							myLayer = new ArcGISDynamicMapServiceLayer(layer[i].getAttribute("url"), {
									"opacity" : Number(layer[i].getAttribute("alpha")),
									"id" : id,
									"visible" : false
								});
									
						else
							myLayer = new ArcGISDynamicMapServiceLayer(layer[i].getAttribute("url"), {
									"opacity" : Number(layer[i].getAttribute("alpha")),
									"id" : id,
									"visible" : true
								});
					}
					if (loadedFromCfg) {
						collapsedFlg = false;
						if (layer[i].getAttribute("open") == "false")
							collapsedFlg = true;
						var openSubLayers = [];
						oslArr = layer[i].getAttribute("opensublayer");
						if (oslArr)
							openSubLayers = oslArr.split(",");
						legendLayers.push({
							layer : myLayer,
							title : layer[i].getAttribute("label"),
							autoToggle : true,
							slider : true,
							slider_ticks : 3,
							slider_labels : ["transparent", "50%", "opaque"],
							hideGroupSublayers : hideGroupSublayers,
							radioLayers : radioLayers,
							noLegend : false,
							openSubLayers : openSubLayers,
							collapsed : collapsedFlg
						});
						mapLayers.push(myLayer);
						openSubLayers = null;
						oslArr = null;
					}
				}
				
				if (loadedFromCfg) {
					map.addLayers(mapLayers);
					legendLayers.reverse();
					// load the toc to update visible layers for bookmark and email
					tocFlag = true;
					initTOC();
				}
				addGraphicsAndLabels();
				if (level)
					map.setLevel(level);
				
				// Add Widgets to menu based on order or config.xml.
				// If Draw Label Mesure found add: Way Point and Measure.
				// If Settings found add: Location and Links
				require(["dojox/mobile/ListItem"],lang.hitch(this,function(ListItem){
					for (var w = 0; w < xmlDoc.getElementsByTagName("widget").length; w++) {
						var label = xmlDoc.getElementsByTagName("widget")[w].getAttribute("label");
						var icon = xmlDoc.getElementsByTagName("widget")[w].getAttribute("icon");
						if (label == "Feature Search") {
							if (icon == null) icon = "assets/images/i_search.png";
							var fsIcon = icon;
							var se = new ListItem({
								id: "searchLI",
								icon: fsIcon,
								label: "<a class='mblAccordionTitleAnchor' href=\"javascript:openSearch();\">Feature Search</a><span id='searchRemoveBtn' style='visibility:hidden' class='measureClear'>Clear</span>"
							});
							se.placeAt(dom.byId("toolsMenu")); // use when all are added from config.xml
							//se.startup();
						}
						else if (label == "Draw, Label, & Measure") {
							// Add Way Points
							if (icon == null) icon = "assets/images/ptmedblue.png";
							var wpIcon = icon;
							var wp = new ListItem({
								id: "wayPtLI",
								icon: wpIcon,
								label: "<a class='mblAccordionTitleAnchor' href=\"javascript:openWayPts();\">Way Point</a>"
							});
							wp.placeAt(dom.byId("toolsMenu")); // use when all are added from config.xml
							//wp.startup();
							
							// Add Measure
							var me = new ListItem({
								icon: "assets/images/i_measure.png",
								label: '<span id="lengthBtn" class="mblAccordionTitleAnchor">Measure</span><span id="removeLengthBtn" style="visibility:hidden" class="measureClear">Clear</span>'
							});
							me.placeAt(dom.byId("toolsMenu")); // use when all are added from config.xml
							//me.startup();
							drawInit(); // tlb 2/19/19 move below widgets
						}
						else if (label == "Bookmark") {										
							if (icon == null) icon = "assets/images/i_bookmark.png";
							var bmIcon = icon;
							var bm = new ListItem({
								icon: bmIcon,
								label: "<a class='mblAccordionTitleAnchor' href=\"javascript:openBookmark();\">Bookmark</a>"
							});
							bm.placeAt(dom.byId("toolsMenu")); // use when all are added from config.xml
							//bm.startup();
							// load bookmark.js now so it is ready when the user clicks it
							require(["javascript/Bookmark"],function() {
							});
						}
						else if (label == "HB1298 Report") {
							if (icon == null) icon = "assets/images/i_bookmark3.png";
							var hbIcon = icon;
							var hb = new ListItem({
								id: "showHB1298",
								icon: hbIcon,
								label: "<a class='mblAccordionTitleAnchor' href=\"javascript:openHB1298();\">HB1298 Report</a>"
							});
							hb.placeAt(dom.byId("toolsMenu")); // use when all are added from config.xml
							//hb.startup();
						}
						else if (label == "Settings") {
							// Location
							// NOW using LocateButton below zoom buttons
							//var sl = new ListItem({
							//	id: "showLocation",
							//	icon: "assets/images/bluedot.png",
							//	rightText: "Off",
							//	label: "<a class='mblAccordionTitleAnchor' href=\"javascript:openLocation();\">Location</a>"
							//});
							//sl.placeAt(dom.byId("toolsMenu")); // use when all are added from config.xml
						
							// Links
							var li = new ListItem({
								icon: "assets/images/i_link.png",
								label: "<a class='mblAccordionTitleAnchor' href=\"javascript:openLinks();\">Links</a>"
							});
							li.placeAt(dom.byId("toolsMenu")); // use when all are added from config.xml
							//li.startup();
						}
					}
				}));
				
				/*require(["dojox/mobile/SimpleDialog"],function(Dialog){
					linkPopup = new Dialog({
						class: "discContainer",
						style: "height:calc(100vh - 15px);height:-webkit-calc(100vh - 15px);height:-moz-calc(100vh - 15px);",
						closeButton: true
					});
					linkPopup.src = function(src){
						document.getElementById("linkIframe").src = src;
						this.show();
					};
					document.body.appendChild(linkPopup.domNode);
					var content = domConstruct.create("div", {
						class: "mblSimpleDialogText discContent",
						style: "top: 0; position:absolute;",
						innerHTML: '<iframe id="linkIframe" style="margin:9px 0 0 0;'+
							'width:-webkit-calc(100% - 10px);'+
							'width:-moz-calc(100% - 10px);'+
							'width:calc(100% - 10px);'+
							'height:-webkit-calc(100% - 35px);'+
							'height:calc(100% - 35px);'+
							'height:-moz-calc(100% -35px);'+
							'border:0;"></iframe>'+
							'<br/><br/>'
						}, linkPopup.domNode);
					var linkStr = '<p class="link" style="cursor:pointer;" onclick="linkPopup.src(\'../'+app+'/help.html\')"><img src="assets/images/i_help.png"/>Help</p>'; 
					*/
					linkStr = '<p class="link"><a href="../' + app + '/help.html" target="help"><img src="assets/images/i_help.png"/>Help</a></p>';
					linkStr += '<p class="link"><a href="../' + app + '/definitions.html" target="help"><img src="assets/images/i_layers.png"/>Map Descriptions</a></p>';
					var link = xmlDoc.getElementsByTagName("links")[0].getElementsByTagName("link");
					var licenseURL="";
					for (i = 0; i < link.length; i++) {
						// load desktop site with url parameters
						if (link[i].getAttribute("label") == "Go Mobile")
							linkStr += '<p class="link"><a href="' + window.location.href.replace("indexM", "index") + '" target="_top"><img src="' + link[i].getAttribute("icon") + '"/>Load Desktop Site</a></p>';	
						else if (link[i].getAttribute("label") == "Buy License!"){
							licenseURL = link[i].getAttribute("url").replace("%3F", "?").replace("%26", "&");
							linkStr += '<p class="link"><a id="licenseLink"><img src="' + link[i].getAttribute("icon") + '"/>' + link[i].getAttribute("label") + '</a></p>';
						}
						else
							linkStr += '<p class="link"><a href="' + link[i].getAttribute("url").replace("%3F","?").replace("%26","&") + '" target="_new"><img src="' + link[i].getAttribute("icon") + '"/>' + link[i].getAttribute("label") + '</a></p>';
					}
					linkStr += '<span id="emaillink"></span>';							
					dom.byId("links").innerHTML = linkStr;
					// Add Google Analytics tracking
					if (document.getElementById("licenseLink") && typeof ga === "function"){
						document.getElementById("licenseLink").addEventListener("click",function(){
							// open CPW buy license page and count how many times it is clicked on
							// Google Analytics count how many times Buy License is clicked on
							ga('send', 'event', "buy_license", "click", "Buy License", "1");
							window.open(licenseURL, "_new");
						});
					}
				//});
			} catch (e) {
				alert("Error in readConfig.js/addMapLayers " + e.message, "Code Error", e);
			}
		}
		function zoomIn() {
			useConfigExtent();
		}
		function zoomToLocation(location) {
			require(["esri/layers/GraphicsLayer", "esri/geometry/Point", "esri/geometry/Extent", "esri/geometry/webMercatorUtils", "esri/SpatialReference"], function (GraphicsLayer, Point, Extent, webMercatorUtils, SpatialReference) {
				try {
					var pt = webMercatorUtils.geographicToWebMercator(new Point(location.coords.longitude, location.coords.latitude));
					var factor = 500;
					var extent = new Extent(pt.x - factor, pt.y - factor, pt.x + factor, pt.y + factor, new SpatialReference({
								wkid : wkid
							}));
					initExtent = extent.expand(2);
					initMap();
				} catch (e) {
					alert("Could not zoom to current location.", "Warning");
					useConfigExtent();
				}
			});
		}
		function showLocation(location) {
			require(["esri/layers/GraphicsLayer", "esri/geometry/Point", "esri/geometry/webMercatorUtils", "esri/geometry/Extent", "esri/SpatialReference"], function (GraphicsLayer, Point, webMercatorUtils, Extent, SpatialReference) {
				try {
					pt = webMercatorUtils.geographicToWebMercator(new Point(location.coords.longitude, location.coords.latitude));
					var factor = 500;
					var extent = new Extent(pt.x - factor, pt.y - factor, pt.x + factor, pt.y + factor, new SpatialReference({
								wkid : wkid
							}));
					initExtent = extent.expand(2);
					initMap();
					navigator.geolocation.clearWatch(watchId);
				} catch (e) {
					alert("Could not zoom to current location.", "Warning");
					useConfigExtent();
				}
			});
		}
		function locationError(error) {
			if (navigator.geolocation) {
				navigator.geolocation.clearWatch(watchId);
			}
			useConfigExtent();
		}
		function useConfigExtent() {
			require(["esri/geometry/Extent"], function (Extent) {
				try {
					initExtent = new Extent({
							"xmin" : parseFloat(cfgExtent[0]),
							"ymin" : parseFloat(cfgExtent[1]),
							"xmax" : parseFloat(cfgExtent[2]),
							"ymax" : parseFloat(cfgExtent[3]),
							"spatialReference" : {
								"wkid" : wkid
							}
						});
					initMap();
				} catch (e) {
					alert("Could not read initial extent in " + app + "/config.xml.", "Warning");
				}
			});
		}
		function initMap() {
			try {
				mapBasemap = "streets";
				if (loadedFlag)
					return;
				loadedFlag = true;
				// set custom lods 4/19/17
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

				map = new Map(mapDiv, {
					autoResize : true,
					extent : initExtent,
					showAttribution : false,
					logo : false,
					basemap: "streets",
					sliderStyle : "small",
					infoWindow : infoWindowPopup,
					minScale : 9244649,
					lods: customLods
				});

				// added 6-12-18 to be able to download a geopdf
				previewMap = new Map("printPreviewMap", {
					extent: initExtent,
					autoResize: true,
					showAttribution: false,
					logo: false,
					basemap: "streets",
					sliderStyle: "small",
					minScale: 9244649,
					navigationMode:"classic",
					//disableMapNavigation: true,
					isPan: false,
					isClickRecenter: true,
					//isDoubleClickZoom: false,
					//isRubberBandZoom: false,
					showInfoWindowOnClick: false,
					lods: customLods
				});		
				// previewMap extent cannot be changed by the user 
				//previewMap.on("extent-change", showPreviewMapScale);
				
				// Start up location button
				document.getElementById("LocateButton").addEventListener("click",init_geo);
				
				// load basemap from URL if present
				if (queryObj.layer && queryObj.layer.substring(0, queryObj.layer.indexOf("|")).split(",")[0] != "streets"){	
					// read basemap from URL if &layer= is found.
					if (queryObj.layer && queryObj.layer != "") {
						 var basemapArr = queryObj.layer.substring(0, queryObj.layer.indexOf("|")).split(",");
						if (basemapArr[0] == 0)
							mapBasemap = "streets";
						else if (basemapArr[0] == 1)
							mapBasemap = "hybrid";
						else if (basemapArr[0] == 2)
							mapBasemap = "topo";
						else
							mapBasemap = basemapArr[0];
						basemapArr = null ;
					}
					basemapFlag=true;
					initBasemaps(); // load the requested basemap
				}
				map.on('layers-add-result', function (layer) {
					var errFlag = false;
					try {
						for (var i = 0; i < layer.layers.length; i++) {
							if (layer.layers[i].error) {
								errFlag = true;
								alert("Problem loading layer: " + layer.layers[i].layer.url + ". " + layer.layers[i].error.message + ". At javascript/readConfig.js");
							}
							// Turn off MVUM extra layers
							else if (layer.layers[i].layer.url.indexOf("MVUM") > -1){
								for (j = 0; j < layer.layers[i].layer.layerInfos.length; j++) {
									if (layer.layers[i].layer.layerInfos[j].name == "Visitor Map Symbology") {
										layer.layers[i].layer.layerInfos[j].defaultVisibility = false;
									}
									else if (layer.layers[i].layer.layerInfos[j].name =="Status") {
										layer.layers[i].layer.layerInfos[j].defaultVisibility = false;
									}
								}
							}
						}
						if (!errFlag) {}

					} catch (e) {
						alert("Error loading Map Layers: " + e.message + " in javascript/readConfig.js");
					}
				});
				map.on('load', function () {
					try {
						readSettingsWidget();
						map.on("click", doIdentify);
						if (navigator.userAgent.indexOf('Android') != -1) {
							dojo.connect(dom.byId("mapDiv_layers"), "click", function (evt) {
								var targ;
								if (evt.target)
									targ = evt.target;
								else if (evt.srcElement)
									targ = evt.srcElement;
								if (targ.nodeType == 3)
									targ = targ.parentNode;
								if (targ.id.indexOf("map") != -1) {
									map.onClick(evt);
								}
							});
						}
						testLayers(); // will call addMapLayers if they exist 2/19/19
						//addMapLayers(); 2/19/19
						//drawInit(); // tlb 2/18/19 move below widgets
						// Goto current location if no user specified place was found on the URL. 6-28-17
						if (!queryObj.extent && !queryObj.place && !queryObj.keyword && !queryObj.map && navigator.geolocation) {
							init_geo(); // uses code in geo.js
							//alert("Location tracking is ON","",null,false,true,2000);
						}
						if (labelPt && queryObj.label && queryObj.label != "") {
							require(["esri/geometry/Point", "esri/graphicsUtils", "esri/geometry/Extent", "esri/layers/GraphicsLayer", "esri/graphic", "esri/symbols/PictureMarkerSymbol"], function (Point, graphicsUtils, Extent, GraphicsLayer, Graphic, PictureMarkerSymbol) {
								var searchGraphicsLayer = new GraphicsLayer();
								searchGraphicsLayer.id = "searchgraphics" + searchGraphicsCounter;
								searchGraphicsCount.push(searchGraphicsLayer.id);
								searchGraphicsCounter++;
								addLabel(new Graphic(labelPt), queryObj.label, searchGraphicsLayer, "11pt");
								var symbol = new PictureMarkerSymbol("assets/images/yellowdot.png", 30, 30);
								searchGraphicsLayer.add(new Graphic(labelPt, symbol));
								document.getElementById("findClear").style.opacity = 1.0;
								document.getElementById("findClear").style.filter = "alpha(opacity=100)";
							});
						}
					} catch (e) {
						alert("Could not load map. " + e.message, "Warning", e);
					}
				});
			
				// 6-14-17 moved place and keyword url parameters here
				// Zoom to a keyword and value on startup
				if (queryObj.keyword && queryObj.keyword != "") {
					if (!queryObj.value || queryObj.value == "") {
						alert("When &keyword is used on the URL, there must be a &value also.", "URL Keyword/Value Error");
						useConfigExtent();
					} else {
						require(["esri/request", "esri/tasks/QueryTask", "esri/tasks/query"], function (esriRequest, QueryTask, Query) {
							var urlFile = app + "/url.xml?v=" + ndisVer;
							var xmlurl = createXMLhttpRequest();
							xmlurl.onreadystatechange = function () {
								if (xmlurl.readyState == 4 && xmlurl.status === 200) {
									var urlDoc = createXMLdoc(xmlurl);
									var layer = urlDoc.getElementsByTagName("layer");
									for (var i = 0; i < layer.length; i++) {
										if (!layer[i].getElementsByTagName("keyword")[0] || !layer[i].getElementsByTagName("keyword")[0].firstChild) {
											alert("Missing tag keyword or blank, in " + app + "/url.xml file.", "Data Error");
											useConfigExtent();
										}
										if (queryObj.keyword == layer[i].getElementsByTagName("keyword")[0].firstChild.nodeValue)
											break;
									}
									if (i == layer.length) {
										alert("Keyword [" + queryObj.keyword + "] is not defined in " + app + "/url.xml file.", "Data Error");
										useConfigExtent();
									} else {
										if (!layer[i].getElementsByTagName("url")[0] || !layer[i].getElementsByTagName("url")[0].firstChild) {
											alert("Missing tag url or blank, in " + app + "/url.xml file for keyword: " + queryObj.keyword + ".", "Data Error");
											useConfigExtent();
										} else if (!layer[i].getElementsByTagName("expression")[0] || !layer[i].getElementsByTagName("expression")[0].firstChild) {
											alert("Missing tag expression, in " + app + "/url.xml file for keyword: " + queryObj.keyword, "Data Error");
											useConfigExtent();
										} else {
											var expr = layer[i].getElementsByTagName("expression")[0].firstChild.nodeValue.replace("[value]", queryObj.value);
											var queryTask = new QueryTask(layer[i].getElementsByTagName("url")[0].firstChild.nodeValue);
											var query = new Query();
											query.where = expr;
											query.returnGeometry = true;
											queryTask.execute(query, function (response) {
												if (response.features.length == 0) {
													// 6-14-17 If it is not found in the url.xml database file try GNIS.
													gotoLocation(queryObj.value,true);// in findPlace.js
													//alert("Cannot zoom to value: " + queryObj.value + ". The feature was not found in " + layer[i].getElementsByTagName("url")[0].firstChild.nodeValue + " for field: " + layer[i].getElementsByTagName("field")[0].firstChild.nodeValue + ". To fix this error, edit keyword = " + queryObj.keyword + " in " + app + "/url.xml file.", "URL Keyword/Value Error");
													//useConfigExtent();
												} else {
													require(["esri/geometry/Point", "esri/graphicsUtils", "esri/geometry/Extent",
													"esri/layers/GraphicsLayer","esri/graphic","esri/symbols/PictureMarkerSymbol"],
													function (Point, graphicsUtils, Extent,GraphicsLayer,Graphic,PictureMarkerSymbol) {
														var searchGraphicsLayer;
														if (response.geometryType == "esriGeometryPoint") {
															level = 8; // 4-19-17 Updated lods. Used to be 14
															if (layer[i].getElementsByTagName("mapscale")[0] && layer[i].getElementsByTagName("mapscale")[0].firstChild)
																level = parseInt(layer[i].getElementsByTagName("mapscale")[0].firstChild.nodeValue);
															if (level > 11) {
																alert("Illegal mapscale value, " + level + ", in " + app + "/url.xml file for keyword: " + queryObj.keyword + ". Must be less than 20. It is now a map level instead of map scale.", "Data Error");
																level = 8;
															}
															var d = 2000;
															initExtent = new Extent(response.features[0].geometry.x - d, response.features[0].geometry.y - d, response.features[0].geometry.x + d, response.features[0].geometry.y + d, response.spatialReference);
															labelPt = new Point(response.features[0].geometry.x, response.features[0].geometry.y, response.spatialReference);
															if (queryObj.label && queryObj.label != "") {
																// add label to find a place graphics layer
																searchGraphicsLayer = new GraphicsLayer();
																searchGraphicsLayer.id = "searchgraphics" + searchGraphicsCounter;
																searchGraphicsCount.push(searchGraphicsLayer.id);
																searchGraphicsCounter++;
																addLabel(new Graphic(labelPt), queryObj.label, searchGraphicsLayer, "11pt");
																// add point
																var symbol = new PictureMarkerSymbol("assets/images/yellowdot.png", 30, 30);
																searchGraphicsLayer.add(new Graphic(labelPt, symbol));
																document.getElementById("findClear").style.opacity=1.0;
																document.getElementById("findClear").style.filter="alpha(opacity=100)"; /* for IE8 and below */
															}
														} else {
															var union=false;
															if (layer[i].getElementsByTagName("union")[0] && layer[i].getElementsByTagName("union")[0].firstChild &&
																	layer[i].getElementsByTagName("union")[0].firstChild.nodeValue.toLowerCase() === "true"){
																union=true;
															}
															// zoom to extent of first feature
															if (!union){
																labelPt = response.features[0].geometry.getCentroid();
																initExtent = response.features[0].geometry.getExtent();
															}
															// zoom to extent of all features 1-14-19
															else{
																var newExtent = new Extent(response.features[0].geometry.getExtent());
																for (var j = 0; j < response.features.length; j++) { 
																	var thisExtent = response.features[j].geometry.getExtent();
																	// making a union of extent or previous feature and current feature. 
																	newExtent = newExtent.union(thisExtent);
																} 
																initExtent=newExtent;
																labelPt = newExtent.getCenter();
															}	
															if (queryObj.label && queryObj.label != "") {
																// add label to find a place graphics layer
																searchGraphicsLayer = new GraphicsLayer();
																searchGraphicsLayer.id = "searchgraphics" + searchGraphicsCounter;
																searchGraphicsCount.push(searchGraphicsLayer.id);
																searchGraphicsCounter++;
																addLabel(new Graphic(labelPt), queryObj.label, searchGraphicsLayer, "11pt");
																document.getElementById("findClear").style.opacity=1.0;
																document.getElementById("findClear").style.filter="alpha(opacity=100)"; /* for IE8 and below */
															}
														}
														map.setExtent(initExtent,true); // 6-14-17
														//initMap();
													});
												}
											}, function (error) {
												if (error.responseText)
													alert("Error: QueryTask failed for keyword=" + queryObj.keyword + " value=" + queryObj.value + " " + error.message + error.responseText, "URL Keyword/Value Error", error);
												else
													alert("Error: QueryTask failed for keyword=" + queryObj.keyword + " value=" + queryObj.value + " " + error.message, "URL Keyword/Value Error", error);
												useConfigExtent();
											});
										}
									}
								} else if (xmlurl.status === 404) {
									alert("Missing url.xml file in " + app + " directory.", "Data Error");
									useConfigExtent();
								} else if (xmlurl.readyState === 4 && xmlurl.status === 500) {
									alert("Error: had trouble reading " + app + "/url.xml file in readConfig.js.", "Data Error");
									useConfigExtent();
								}
							};
							xmlurl.open("GET", urlFile, true);
							xmlurl.send(null);
						});
					}
				}
				// Zoom to a place on startup
				else if (queryObj.place && queryObj.place != "") {
					var place = queryObj.place.replace("%20"," ");
					if (queryObj.prj && queryObj.prj!="") settings = {XYProjection: queryObj.prj};
					gotoLocation(place,true); // pass true to tell it that it was called from the url. In findPlace.js
				}
				else if (queryObj.map && queryObj.map != "") {
					if (!queryObj.value || queryObj.value == "" || !queryObj.field || queryObj.field == "") {
						alert("When &map is used on the URL, there must also be an &field and &value.", "URL Map/Value Error");
						useConfigExtent();
					} else {
						require(["esri/request", "esri/tasks/QueryTask", "esri/tasks/query"], function (esriRequest, QueryTask, Query) {
							var queryTask = new QueryTask(queryObj.map);
							var query = new Query();
							if (Number(queryObj.value))
								query.where = queryObj.field + "=" + queryObj.value;
							else
								query.where = "UPPER(" + queryObj.field + ") LIKE UPPER('" + queryObj.value + "')";
							query.returnGeometry = true;
							queryTask.execute(query, function (response) {
								require(["esri/geometry/Point", "esri/graphicsUtils", "esri/geometry/Extent"], function (Point, graphicsUtils, Extent) {
									if (response.features.length == 0) {
										alert("Cannot zoom to " + queryObj.value + ". The feature was not found in " + queryObj.map + " for field " + queryObj.field, "URL Map/Value Error");
										useConfigExtent();
									} else {
										if (response.geometryType == "esriGeometryPoint") {
											var d = 65000;
											initExtent = new Extent(response.features[0].geometry.x - d, response.features[0].geometry.y - d, response.features[0].geometry.x + d, response.features[0].geometry.y + d, response.spatialReference);
										} else
											initExtent = response.features[0].geometry.getExtent();
										map.setExtent(initExtent,true);
										//initMap();
									}
								});
							}, function (error) {
								if (error.responseText)
									alert("Error: QueryTask failed for map=" + queryObj.map + " " + error.message + error.responseText, "URL Map/Value Error", error);
								else
									alert("Error: QueryTask failed for map=" + queryObj.map + " " + error.message, "URL Map/Value Error", error);
								useConfigExtent();
							});
						});
					}
				}
			} catch (e) {
				alert("Could not load map. " + e.message, "Warning", e);
			}
		}
		
		var loadedFlag = false;
		var level = null;
		var labelPt = null;
		var slsHighlightSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([38, 38, 38, 0.7]), 2);
		var sms = new SimpleMarkerSymbol();
		sms.setPath("M21.5,21.5h-18v-18h18V21.5z M12.5,3V0 M12.5,25v-3 M25,12.5h-3M3,12.5H0");
		sms.setSize(45);
		sms.setOutline(slsHighlightSymbol);
		infoWindowPopup = new PopupMobile({
				markerSymbol : sms
			}, domConstruct.create("div"));
		var xhttp = createXMLhttpRequest();
		var configFile = app + "/config.xml?v=" + ndisVer;
		xhttp.onreadystatechange = function () {
			if (xhttp.readyState == 4 && xhttp.status == 200) {
				xmlDoc = createXMLdoc(xhttp);
				try {
					var geoService;
					try {
						geoService = xmlDoc.getElementsByTagName("geometryservice")[0].getAttribute("url");
					} catch (e) {
						alert('Missing tag: geometryservice in config.xml.\n\nTag should look like: &lt;geometryservice url="https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/Utilities/Geometry/GeometryServer"/&gt;\n\nWill use that url for now.', 'Error in ' + app + '/config.xml');
						geoService = "https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/Utilities/Geometry/GeometryServer";
					}
					geometryService = new GeometryService(geoService);
					geometryService2 = new GeometryService(geoService);
					try {
						printGeoServiceUrl = xmlDoc.getElementsByTagName("printservicegeo")[0].firstChild.nodeValue;
					} catch (e) {
						alert('Missing tag: printservicegeo in ' + app + '/config.xml.\n\nTag should look like: &lt;printservicegeo&gt;https://ndismaps.nrel.colostate.edu/arcgis/rest/services/PrintTemplate/georefPrinting/GPServer/georefPrinting&lt;/printservice&gt;\n\nWill use that url for now.', 'Data Error');
						printGeoServiceUrl = "https://ndismaps.nrel.colostate.edu/arcgis/rest/services/PrintTemplate/georefPrinting/GPServer/georefPrinting";
					}
					var title = app;
					try {
						if (xmlDoc.getElementsByTagName("mobile_title")[0])
							title = xmlDoc.getElementsByTagName("mobile_title")[0].firstChild.nodeValue;
						else
							title = xmlDoc.getElementsByTagName("title")[0].firstChild.nodeValue.replace("Colorado", "CO");
					} catch (e) {
						alert("Error in " + app + "/config.xml file. Missing tag: title.", "Data Error");
					}
					if (getCookie("noDisclaimer") != 1)
						loadDisclaimer(title);
					var logo;
						try {
						logo = xmlDoc.getElementsByTagName("logo")[0].firstChild.nodeValue;
					} catch (e) {
						alert("Error in " + app + "/config.xml file. Missing tag: logo.", "Data Error");
					}
					var logourl;
					try {
						logourl = xmlDoc.getElementsByTagName("logourl")[0].firstChild.nodeValue;
					} catch (e) {
						alert("Error in " + app + "/config.xml file. Missing tag: logourl.", "Data Error");
					}
					registry.byId("webmapTitle").set("label", "<a href='" + logourl + "'><img width='40px' src='../" + logo + "' style='top: -3px;" + "position: relative;vertical-align: middle;'/></a> " + title);
					document.title = title;
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
					try {
						myFindService = xmlDoc.getElementsByTagName("findplaceservice")[0].getAttribute("url");
					} catch (e) {
						alert('Missing tag: findplaceservice in ' + app + '/config.xml.\n\nTag should look like: &lt;findplaceservice url="https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/GNIS_Loc/GeocodeServer"/&gt;\n\nWill use that url for now.', 'Data Error');
						myFindService = "https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/GNIS_Loc/GeocodeServer";
					}
					try {
						findPlaceInit();
					} catch (e) {
						alert("Error in javascript/readConfig.js " + e.message, "Code Error", e);
					}
					try {
						// read the PrintPdfWidget.xml file
						printInit();
					} catch (e) {
						alert("Error in javascript/readConfig.js " + e.message, "Code Error", e);
					}
					wkid = parseInt(xmlDoc.getElementsByTagName("map")[0].getAttribute("wkid").trim());
					cfgExtent = xmlDoc.getElementsByTagName("map")[0].getAttribute("initialextent").split(" ");
					// 1/29/19 save Colorado extent. This is used in print to see if they are trying to print outside of Colorado.
					// initExtent is not always the full extent. For example if they had an extent on the URL it does not use this one.
					fullExtent = new Extent({
						"xmin": parseFloat(cfgExtent[0]),
						"ymin": parseFloat(cfgExtent[1]),
						"xmax": parseFloat(cfgExtent[2]),
						"ymax": parseFloat(cfgExtent[3]),
						"spatialReference": {
							"wkid": wkid
						}
					});
					if (queryObj.extent && queryObj.extent != "") {
						require(["esri/geometry/Extent", "esri/tasks/ProjectParameters", "esri/SpatialReference"], function (Extent, ProjectParameters, SpatialReference) {
							try {
								var extArr = [];
								if (Object.prototype.toString.call(queryObj.extent) === '[object Array]')
									extArr = queryObj.extent[0].split(",");
								else
									extArr = queryObj.extent.split(",");
								var prj;
								if (queryObj.prj && queryObj.prj != "")
									prj = queryObj.prj;
								else {
									if (extArr[0] < 0 && extArr[0] > -200) {
										prj = 4326;
									} else
										prj = 26913;
								}
								var ext = new Extent({
										"xmin" : parseFloat(extArr[0]),
										"ymin" : parseFloat(extArr[1]),
										"xmax" : parseFloat(extArr[2]),
										"ymax" : parseFloat(extArr[3]),
										"spatialReference" : {
											"wkid" : parseInt(prj)
										}
									});
								var params = new ProjectParameters();
								params.geometries = [ext];
								params.outSR = new SpatialReference(wkid);
								geometryService.project(params, function (newExt) {
									initExtent = newExt[0];
									initMap();
								}, function (error) {
									alert("There was a problem converting the extent read from the URL to Web Mercator projection. extent=" + extArr[0], ", " + extArr[1] + ", " + extArr[2] + ", " + extArr[3] + "  prj=" + prj + "  " + error.message, "URL Extent Error", error);
									useConfigExtent();
								});
							} catch (e) {
								alert("Could not zoom to given extent.", "Warning");
								useConfigExtent();
							}
						});
					} else {
						zoomIn();
					}
				} catch (e) {
					alert("Missing tag attributes initalextent or wkid for the map tag in " + app + "/config.xml file. Error message: " + e.message, "Data Error");
				}
			} else if (xhttp.status === 404) {
				alert("Error: Missing " + app + "/config.xml file.", "Data Error");
				hideLoading();
			} else if (xhttp.readyState === 4 && xhttp.status === 500) {
				alert("Make sure your application name is correct on the URL. app=" + app, "Warning");
				hideLoading();
			}
		};
		xhttp.open("GET", configFile, true);
		xhttp.send();
	});
}

// Widget Click Handlers
							
// Initialize Bookmark
var bmCreated = false;
var bmHelp=null;
function openBookmark(){
	if (!bmCreated){
		// Create Bookmark Pane
		showLoading();
		require(["dojox/mobile/ContentPane","dojo/dom","dojo/dom-construct","javascript/Bookmark", "javascript/HelpWin", "dojox/mobile/SimpleDialog","dojox/mobile/Heading","dojox/mobile/ToolBarButton"],
		function(ContentPane,dom,domConstruct,Bookmark,HelpWin,Dialog,Heading,ToolBarButton){
			var bmPane = new ContentPane({
				id: "bookmarkPane",
				'class': "scrollPane",
				content: "<h1 data-dojo-type='dojox/mobile/Heading' data-dojo-props='fixed:\"top\", label:\"Bookmark\"' style=\"background-color: whitesmoke;color:rgb(191, 197, 203);background-image: none;\">"+
				"<span data-dojo-type=\"dojox/mobile/ToolBarButton\" data-dojo-props='icon:\"assets/images/leftarrow.png\"' onclick=\"slideLeft(document.getElementById('bookmarkPane'));\"></span>"+
				"<span data-dojo-type=\"dojox/mobile/ToolBarButton\"  alt='help button' style='float:right;' data-dojo-props='icon:\"assets/images/helpBtn.png\"' onclick=\"bmHelp.show()\"></span>"+
				"</h1><p id='bmLoading' align='center' style='margin-top: 50px;'><img src='assets/images/loading.gif'/></p>"
			}).placeAt(document.body).startup();
			bmCreated = true; // already created
			slideRight(document.getElementById("bookmarkPane"));
			/*var bmContainer = domConstruct.create("div", {id: "bmContainer", "class": "scrollContainer"}, "bookmarkPane", "last");*/
			var bm = new ContentPane({
				id: "bm",
				"class": "scrollContent",
				style: "padding-bottom:0px;"
			}).placeAt("bookmarkPane").startup();//placeAt("bmContainer").startup();
			
			var bookmarkWidget = new Bookmark ({
				video: "",
				preload: true
			});
			bookmarkWidget.placeAt("bm"); // calls startup
			document.getElementById("bmLoading").style.display="none";
			hideLoading();
			
			bmHelp = new HelpWin({
				label: "Bookmark Help",
				content: bookmarkWidget.defaultHelp
			});
			document.body.appendChild(bmHelp.domNode);
			bmHelp.startup();
		});
	}
	else
		slideRight(document.getElementById("bookmarkPane"));
}

var basemapHelp=null;					
function initBasemaps() {
	require(["esri/dijit/BasemapGallery", "esri/dijit/Basemap", "esri/dijit/BasemapLayer", "esri/dijit/Gallery", "javascript/HelpWin"], function (BasemapGallery, Basemap, BasemapLayer, Gallery, HelpWin) {
		document.getElementById("basemapLoading").style.display = "block";
	
		// Add basemaps by hand to use raster tile layers. vector tile layers require ArcGIS 10.5.1. These are used when
		// showArcGISBasemaps is set to true.
		var layer,basemaps = [];
		// Streets
		/*layer=new BasemapLayer({
			styleUrl:"https://www.arcgis.com/sharing/rest/content/items/b266e6d17fc345b498345613930fbd76/resources/styles/root.json",
			type: "VectorTileLayer",
			opacity:1
		});*/
		layer=new BasemapLayer({url:"https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"});
		var basemap = new Basemap({
			layers:[layer],
			title:"Streets",
			id:"streets",
			thumbnailUrl:"https://www.arcgis.com/sharing/rest/content/items/f81bc478e12c4f1691d0d7ab6361f5a6/info/thumbnail/street_thumb_b2wm.jpg"
		});
		basemaps.push(basemap);

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
		layer=new BasemapLayer({url:"https://services.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer"});
		basemap = new Basemap({
			layers:[layer],
			title:"USGS Scanned Topo",
			id:"topo",
			thumbnailUrl:"assets/images/USA_topo.png"//"https://www.arcgis.com/sharing/rest/content/items/931d892ac7a843d7ba29d085e0433465/info/thumbnail/usa_topo.jpg"
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
		// old thumbnail, same as aerial  "https://www.arcgis.com/sharing/rest/content/items/2ea9c9cf54cb494187b03a5057d1a830/info/thumbnail/Jhbrid_thumb_b2.jpg"
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
		basemap = new Basemap({
			layers:[layer],
			title:"ESRI Digital Topo",
			id:"topo2",
			thumbnailUrl:"https://www.arcgis.com/sharing/rest/content/items/30e5fe3149c34df1ba922e6f5bbf808f/info/thumbnail/ago_downloaded.jpg"
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
			id: "basemapGallery",
			showArcGISBasemaps: false
		});

		// tlb 7-17-19 move stuff in basemapGallery.on to here because it is no longer called when showArcGISBasemaps is false
		var items = [];
		basemapGallery.basemaps.forEach(function (basemap) {
			items.push({
				thumbnailUrl: basemap.thumbnailUrl,
				id: basemap.id,
				layers: basemap.layers,
				title: basemap.title
			});
		});
		// set currently selected basemap
			var params = {};
			params.items = items;
			params.thumbnailStyle = "small";
			var gallery = new Gallery(params, "galleryDiv");
			var selected_id;
			for (i = 0; i < items.length; i++) {
				if (items[i].id == mapBasemap) {
					selected_id = i;
					break;
				}
			}
			gallery.select(params.items[selected_id]);
			if (mapBasemap != "streets") basemapGallery.select(items[selected_id].id); // set map basemap from URL
			gallery.on("select", function (item) {
				basemapGallery.select(item.item.id);
				document.getElementById("basemapPane").style.display = "none";
				closeMenu();
				mapBasemap = item.item.id;// save the selected basemap in a global
			});
			gallery.startup();
			gallery._slideDiv.style.width = 'auto';

			document.getElementById("basemapLoading").style.display = "none";
			//gallery.esriMobileGallery.thumbnailcontainer.small.style.height = '110px';
			// create help popup
			basemapHelp = new HelpWin({
				label: "Basemaps Help",
				content: 'Click on an image to set the basemap or background map. The selected basemap is highlighted in orange.'+
					'<br/><br/>'
			});
			document.body.appendChild(basemapHelp.domNode);
			basemapHelp.startup();
		});
		// end tlb 7-17-19

		/*var basemapGallery = new BasemapGallery({
				id: "basemapGallery",
				showArcGISBasemaps : true,
				map : map
			});
		basemapGallery.on("load", function () {
			var items = [];
			// Add National Geographic Topo back in. ESRI removed it 6-30-19
			var layer = new BasemapLayer({
				url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer"
			});
			var basemap = new Basemap({
				layers:[layer],
				title:"USGS National Map",
				id:"natgeo",
				thumbnailUrl:"assets/images/natgeoThumb.jpg"
			});
			basemapGallery.add(basemap);

			basemapGallery.basemaps.forEach(function (basemap) {
				if (basemap.title == "Imagery Hybrid") {
					basemap.id = "hybrid";
					basemap.title = "Aerial";
				} else if (basemap.title == "Imagery" || basemap.title == "Oceans")
					return;
				else if (basemap.title == "Streets")
					basemap.id = "streets";
				else if (basemap.title == "USA Topo Maps") {
					basemap.id = "topo";
				} else if (basemap.title == "Topographic") {
					basemap.id = "topo2";
				} else if (basemap.title == "Terrain with Labels")
					basemap.id = "terrain";
				else if (basemap.title == "Light Gray Canvas")
					basemap.id = "gray";
				else if (basemap.title == "OpenStreetMap")
					basemap.id = "openstreet";
				else if (basemap.title == "National Geographic")
					basemap.id = "natgeo";
				items.push({
					id : basemap.id,
					thumbnailUrl : basemap.thumbnailUrl,
					layers : basemap.layers,
					title : basemap.title
				});
			});
			// move streets to the first item
			var street = null;
			var i;
			for (i = 0; i < items.length; i++) {
				if (items[i].title == "Streets") {
					street = items[i];
					items.moveTo(street, 0);
					break;
				}
			}
			// move topo to the 3rd item
			var topo = null;
			for (i = 0; i < items.length; i++) {
				if (items[i].title == "USA Topo Maps") {
					topo = items[i];
					items.moveTo(topo, 2);
					break;
				}
			}
			// set currently selected basemap
			var params = {};
			params.items = items;
			params.thumbnailStyle = "small";
			var gallery = new Gallery(params, "galleryDiv");
			var selected_id;
			for (i = 0; i < items.length; i++) {
				if (items[i].id == mapBasemap) {
					selected_id = i;
					break;
				}
			}
			gallery.select(params.items[selected_id]);
			if (mapBasemap != "streets") basemapGallery.select(items[selected_id].id); // set map basemap from URL
			gallery.on("select", function (item) {
				basemapGallery.select(item.item.id);
				document.getElementById("basemapPane").style.display = "none";
				closeMenu();
				mapBasemap = item.item.id;// save the selected basemap in a global
			});
			gallery.startup();
			gallery._slideDiv.style.width = 'auto';

			document.getElementById("basemapLoading").style.display = "none";
			//gallery.esriMobileGallery.thumbnailcontainer.small.style.height = '110px';
			// create help popup
			basemapHelp = new HelpWin({
				label: "Basemaps Help",
				content: 'Click on an image to set the basemap or background map. The selected basemap is highlighted in orange.'+
					'<br/><br/>'
			});
			document.body.appendChild(basemapHelp.domNode);
			basemapHelp.startup();
		});
	});*/
}

var tocHelp=null;
function initTOC() {
	require(["agsjs/dijit/TOC","javascript/HelpWin"], function (TOC,HelpWin) {
		try {
			document.getElementById("tocLoading").style.display = "block";
			var toc = new TOC({
					map : map,
					layerInfos : legendLayers
				}, 'tocDiv');
			toc.startup();
			toc.on("load", function () {
				document.getElementById("tocLoading").style.display = "none";
			});
			// create help popup
			tocHelp = new HelpWin({
				label: "Layers &amp; Legend  Help",
				content: 'Set what maps are visible. '+
					'Place a check mark in the box beside the maps you would like to make visible. '+
					'Note that if the group\'s checkbox is unchecked then no layers in this group '+
					'will be visible. If the map name is greyed out, then it is not visible at this '+
					'map scale.  To see a greyed out map, zoom in or out on the main map. To adjust '+
					'the transparency of the grouped map layers, use the slider bar. Grouped layers '+
					'will collapse, hiding their content, when unchecked.'+
					'<br/><br/>'
			});
			document.body.appendChild(tocHelp.domNode);
			tocHelp.startup();
		} catch (e) {
			alert("Problem loading TOC: " + e.message + " in javascript/readConfig.js or toc/src/agsjs/dijit/TOC.js", "Code Error");
		}
	});
}
