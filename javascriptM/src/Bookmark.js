define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dijit/_AttachMixin",
	"dojo/text!javascript/templates/Bookmark.html",
	"dojo/_base/lang",
	"dojo/dom",
	"dojo/on",
	"dojo/dom-construct",
	"dijit/registry",
	"dijit/form/Button",
	"dojox/mobile",
	"dojox/mobile/compat",
	"dojox/mobile/parser",
	"dojox/mobile/TabBar",
	"dojox/mobile/TabBarButton",
	"dojox/mobile/View",
	"dojox/mobile/ScrollableView"
], function(
	declare,
	_WidgetBase,
	_TemplatedMixin,
	_WidgetsInTemplateMixin,
	_AttachMixin,
	template,
	lang,
	dom,
	on,
	domConstruct,
	registry,
	Button,
	mobile,
	compat,
	parser,
	TabBar,
	TabBarButton,
	View,
	ScrollableView
	) {
	// Use this if you have widgets in the template like a tab container that will be initialize in here.
	//	"dijit/_WidgetsInTemplateMixin",
	//   "dijit/_AttachMixin",
	
	widgetsInTemplate=true; // enhances preformance. Comment this out if you need to define widgets in your templates.
	var Bookmark = declare([_WidgetBase,_TemplatedMixin, _WidgetsInTemplateMixin, _AttachMixin], {
	//var Bookmark = declare([_WidgetBase,_TemplatedMixin], {
		templateString: template,
		defaultHelp: "This tool allows you to save the current map view including: way points, selected map layers, and base map layer in your <b>browser's bookmarks</b> or save "+
				"it to an icon on your home screen. The advantage to this is that you can clear your browser history, including cookies and your bookmarks will not be lost."+
				" The disadvantage is that browsers have a limit on the length of a URL address, so it may not be able to save all of your Way Points. Also, if you started "+
				"this web app from an icon on your home screen it will run in fullscreen mode and the Settings icon will be hidden. To use this feature, please start this web page in your browser.<br/><br/>When you press the "+
				"'Create Bookmark' button the page will reload with a new URL address. Then to save it:<br/><br>On Chrome press the settings button "+
				"<img src='assets/images/androidBookmark.png'/>, then press the star button or select 'Add to Home Screen'.<br/><br/>On iPhone press the settings button "+
				"<img src='assets/images/iosBookmark.png' style='height:26px'/>, then select 'Add Bookmark' or 'Add to Home Screen'."+
				"<br/><br/><strong>Email a Bookmark</strong>: If you would like to email the current map use 'Email Link' located in Links in the main menu. Good for a limited number "+
				"of Way Points.<br/><br/>",
		
		constructor: function(params){
			lang.mixin(this, params);
			params = params || {};
		},
		
		startup: function(){
			this._setBookmarks();
		 },
		
		_loadKml: function(){
			// if user enters a URL to a kml or kmz file load it into the map and convert to our graphics and add bookmark
			require(["esri/layers/KMLLayer","esri/geometry/webMercatorUtils","esri/graphicsUtils","esri/symbols/SimpleLineSymbol",
				"esri/symbols/SimpleMarkerSymbol","dojo/_base/Color"], function (KMLLayer,webMercatorUtils,graphicsUtils,SimpleLineSymbol,SimpleMarkerSymbol,Color) {
				showLoading();
				esri.config.defaults.io.proxyUrl = "/proxy/DotNet/proxy.ashx";
				esriConfig.defaults.io.alwaysUseProxy = false;
				// test file: http://www.wpc.ncep.noaa.gov/kml/qpf/QPF24hr_Day1_main.kml
				// test file: https://dl.dropboxusercontent.com/u/2142726/esrijs-samples/Wyoming.kml
				var url = document.getElementById("kmlFile").value;
				regexp=/([^a-zA-Z0-9 \/:&\?$\-\'=,;+\.!_\*()])/g;
        url=url.replace(regexp,""); // clean it
				var kmlExtent=null;
				var kmlLayer = new KMLLayer(url);
				map.addLayer(kmlLayer);
				closeMenu();
				slideLeft(document.getElementById('bookmarkPane'));
				
				/*var layers = kmlLayer.getLayers();
				layers.forEach(function(layer){
					if (layer.declaredClass === "esri.layers.FeatureLayer") {
					}
					else if (layer.declaredClass === "esri.layers.MapImageLayer") {
					}
				});*/
				
				/*var attr = kmlLayer.getAttributionData().then(function(value){
					alert("in get attributes");
				},function(err){alert(err.message,"Error");});*/
				var kmlCreated=kmlLayer.on("load", function(evt){	
					kmlCreated.remove();
					
					//var kmlLoaded = map.on("layer-add-result",function(evt){
						console.log (evt.layer.id);
						
						// Add graphics to drawGraphicsCount array
						/*var layer=evt.layer;
						if (layer.id.indexOf("graphicsLayer") == 0){
							var lyrExtent=graphicsUtils.graphicsExtent(layer.graphics);
							//if (layer.geometryType == "esriGeometryPoint") {
								//var name="",desc="";
// get extent for the point
var point = layer.geometry.point;
var toleranceInPixel=50;
								//calculate map coords represented per pixel
var pixelWidth = map.extent.getWidth() / map.width;

//calculate map coords for tolerance in pixel
var toleraceInMapCoords = toleranceInPixel * pixelWidth;

//calculate & return computed extent
lyrExtent = new esri.geometry.Extent( point.x – toleraceInMapCoords,
point.y – toleraceInMapCoords,
point.x + toleraceInMapCoords,
point.y + toleraceInMapCoords,
map.spatialReference ); }
								
								/*layer.graphics.forEach(function(g){
									var symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,7,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,200]), 1),new Color([0,0,255,0.6]));
									addPoint(g.geometry,g.attributes.name,g.attributes.description,symbol);
									alert("loaded point "+g.attributes.name);
								});*/
							//}
							/*if (lyrExtent) (kmlExtent) ? kmlExtent.union(lyrExtent): kmlExtent = lyrExtent;
					
							// Zoom to extent of all layers 
							if (kmlExtent) map.setExtent(kmlExtent);
							hideLoading();
						}*/
					//});
					
					
						
					
					// Zoom to extent of all layers 
					var kmlExtent=null, layers = kmlLayer.getLayers();  
					var lyrExtent=null;
					if (layers[0].folders)
						console.log("Folders="+layers[0].folders.length);
					if (layers[0].graphics)
						console.log("Graphics="+layers[0].graphics.length);
					dojo.forEach(layers, function(lyr) {  
						if ( lyr.graphics && lyr.graphics.length > 0 ) {
							if (lyr.graphics[0].geometry.spatialReference.wkid == 4326)
								lyrExtent = webMercatorUtils.geographicToWebMercator(graphicsUtils.graphicsExtent(lyr.graphics) ); 
							else if (lyr.graphics[0].geometry.spatialReference.wkid == 102100)
								lyrExtent = graphicsUtils.graphicsExtent(lyr.graphics);
							//***************** to do *******************
							else alert("need to convert spatial reference");
							if (lyrExtent) (kmlExtent) ? kmlExtent.union(lyrExtent): kmlExtent = lyrExtent;
						}  
					});
					if (kmlExtent) map.setExtent(kmlExtent);
					hideLoading();
				});
				kmlLayer.on("error", function(e){
					hideLoading();
					alert(e.error.message,"Warning");
				});
				
			});			
		},
		
		_hideAll: function(){
			// hide all bookmark panels and reset all buttons to none selected.
			document.getElementById("addBookmark").style.display="none";
			document.getElementById("addBrowserBookmark").style.display="none";
			//document.getElementById("uploadKml").style.display="none";
			document.getElementById("bmBtn").className="buttonBar";
			document.getElementById("brBtn").className="buttonBar";
			//document.getElementById("kmlBtn").className="buttonBar";
		},
		
		_showAddBookmark: function(){
			this._hideAll();
			document.getElementById("addBookmark").style.display="block";
			document.getElementById("bmBtn").className="buttonBarSelected";
			bmHelp.setContent('This tool allows you to save the current map view including: way points, selected map layers, and base map layer in your <b>browser\'s local storage</b>. '+
					'If you delete your browser history be sure to uncheck <b>\"cookies & other site data\"</b> to keep your bookmarks. The disadvantage to this is that you can never '+
					'clear your cookies without losing all of your bookmarks. Also, Safari on mobile recently removed the option to uncheck cookies, therefore clearing history will delete all '+
					'of your saved bookmarks. There is a limit of 5mb that can be stored per website domain. '+
					'<br/><br/><strong>Add a Bookmark: </strong>Enter a label for your boomark and press the Add button.'+
					'<br/><br/><strong>Load a Bookmark: </strong>Click on the label or <img style="vertical-align:middle; height:30px;" src="assets/images/i_bookmark.png"/> button to load a bookmark.'+
					'<br/><br/><strong>Remove a Bookmark: </strong>Clicking on the <img style="vertical-align:middle" src="assets/images/w_close_red.png"/> button will delete a bookmark.'+
					'<br/><br/><strong>Email a Bookmark</strong>: If you would like to email the current map use "Email Link" '+
					'located in Links in the main menu.  Good for a limited number of Way Points.'+
					'<br/><br/>');
		},
		
		_showBrowserBookmark: function(){
			this._hideAll();
			document.getElementById("addBrowserBookmark").style.display="block";
			document.getElementById("brBtn").className="buttonBarSelected";
			bmHelp.setContent(this.defaultHelp);
		},
		
		/*_showKml: function(){
			this._hideAll();
			document.getElementById("uploadKml").style.display="block";
			document.getElementById("kmlBtn").className="buttonBarSelected";
			bmHelp.setContent("This tool allows you to add graphics from a KML or KMZ file on a publicly shared URL. The layers will be added to the map and can be tapped on "+
				" to display more information. Note: These graphics are not saved when you bookmark the current map.");
		},*/
		
		_setBookmarks: function() {
			// read local storage and add bookmark links to widget
			try {
				var bmNames = getCookie("bm_" + app.toLowerCase());
				if (bmNames != "") {
					var names = bmNames.split("*");
					for (var i = 0; i < names.length; i++) {
						var value = getCookie("bm" + app.toLowerCase() + "_" + names[i]);
						value = value.replace(/\$/g, ";");
						this._updateBookmarkContent(value);
					}
				} else {
					this._updateBookmarkContent("Colorado|-12350000,4250000,-11150000,5250000");
					setCookie("bm" + app.toLowerCase() + "_Colorado", "Colorado|-12350000,4250000,-11150000,5250000");
					setCookie("bm_" + app.toLowerCase(), "Colorado");
				}
			} catch (e) {
				alert("Error in javascript/bookmark.js _setBookmarks() " + e.message, "Code Error", e);
			}
		},
		_updateBookmarkContent: function(value) {
			// add a new bookmark link to the widget
			try {
				var pos = value.indexOf("|");
				var name = value.substring(0, pos);
				var cfg = value.substring(pos + 1);
				cfg = cfg.replace(/%0D/g, "\n").replace(/%3F/g,"?").replace(/%22/g,'"').replace(/%27/g,"'").replace(/%26/g,"&"); // Replace encoded characters carriage return, ?, ", ', and &
				var bmLink = domConstruct.create("span", {
					style: {
						textDecoration:"none",
						cursor:"pointer"
					},
					id:"link"+name,
					innerHTML: "<img style='vertical-align:middle;' src='assets/images/i_bookmark.png'/> "+name
				});
				on(bmLink,"click", lang.hitch(this, function(e){
					this._loadBookmark(cfg);
				}));
				var bmCloseBtn = domConstruct.create("img", {
					src:'assets/images/w_close_red.png',
					style: {
						cursor:"pointer",
						position:"relative",
						float:"right",
						right:"10px",
						height:"30px"
					},
					id: name,
					onclick:lang.hitch(this,function(e){
						this._removeBookmark(e.currentTarget.id);
					})
				});
				var bmBR1 = domConstruct.create("br", {id: "br1"+name});
				var bmBR2 = domConstruct.create("br", {id: "br2"+name});
				domConstruct.place(bmLink, this.bookmarkTab, "before");
				domConstruct.place(bmCloseBtn, this.bookmarkTab, "before");
				domConstruct.place(bmBR1, this.bookmarkTab, "before");
				domConstruct.place(bmBR2, this.bookmarkTab, "before");
			} catch (e) {
				alert("Error in javascript/bookmark.js _updateBookmarkContent() " + e.message, "Code Error", e);
			}
		},
		_loadBrowserBookmark: function(e){
			require(["javascript/graphicFuncs"],function(graphicFuncs){
				// Google Analytics count how many times Add Bookmark is clicked on
				if (typeof ga === "function")ga('send', 'event', "bookmark", "click", "Bookmark", "1");
				var url = graphicFuncs.getMapLink();
				showLoading();
				window.location.assign(url);
			});
		},
		_addBookmark: function(e) {
			// add bookmark to local storage, then call _updateBookmarkContent to add it to the widget
			// called from templates/Bookmark.html
			try {
				// Google Analytics count how many times Add Bookmark is clicked on
				if (typeof ga === "function")ga('send', 'event', "bookmark", "click", "Bookmark", "1");
				var str;
				var bmNames = getCookie("bm_" + app.toLowerCase());
				var name = this.bookmarkName.value;
				// clean from XSS attacks
				regexp=/([^a-zA-Z0-9 \-\.!_()])/g;
				name = name.replace(regexp,"");
				if (name == "") {
					alert("Must give the bookmark a name.", "Note");
					return;
				}
				if (name.indexOf("|") > -1 || name.indexOf("$") > -1) {
					alert("Bookmark name cannot contain the '|' or the '$' character.", "Note");
					return;
				}
				var cfg = map.extent.xmin + "," + map.extent.ymin + "," + map.extent.xmax + "," + map.extent.ymax;
				//var str = mlGetText();
				//if (str)
				//	cfg += str;
			    var my = this;
				require(["javascript/graphicFuncs"], function(graphicFuncs){
					str = graphicFuncs.mlGetPoints();
					if (str)
						cfg += str;
					if (typeof getHB1298Points === "function") {
						if (!str) str = "";
						str = getHB1298Points();
						if (str && str != "") cfg += str;
					}
					/*str = graphicFuncs.mlGetPolys();
					if (str)
						cfg += str;
					str = graphicFuncs.mlGetRect();
					if (str)
						cfg += str;
					str = graphicFuncs.mlGetLines();
					if (str)
						cfg += str;
					*/
					str = graphicFuncs.mlGetLayers();
					if (str)
						cfg += str;
					cfg = cfg.replace(/;/g, "$");
					str = name + "|" + cfg;
					my._updateBookmarkContent(str);
					if (bmNames.length > 0)
						bmNames += "*";
					bmNames += name;
					setCookie("bm_" + app.toLowerCase(), bmNames);
					setCookie("bm" + app.toLowerCase() + "_" + name, str);
				});
				this.bookmarkName.value = "";
				// hide mobile keyboard
				this.bookmarkName.blur();
				document.body.focus();
				//this.bmTabs.selectChild(this.bmListPane);
			} catch (err) {
				alert("Error in javascript/bookmark.js _addBookmark() " + err.message, "Code Error",err);
			}
		},
		_loadBasemapsToc: function(cfg, bm) {
			//require(["agsjs/dijit/TOC"], function (TOC) {
				//if (!basemapFlag){
					initBasemaps();
					var timer = setInterval(function(){
						// wait for basemaps to load
						if (document.getElementById("basemapLoading").style.display == "none") {
							clearInterval(timer);
							basemapFlag=true;
							// load toc if necessary
							/*if (!tocFlag){
								var toc = new TOC({
										map : map,
										layerInfos : legendLayers
									}, 'tocDiv');
								toc.startup();
								var tocHandle= toc.on("load", function(){
									tocFlag = true;
									// remove the on load handler
									tocHandle.remove();
									bm._loadBookmark(cfg);
								});
							}
							else*/
							bm._loadBookmark(cfg);
						}
					},50);
				//}
				// load toc
				/*else if (!tocFlag){
					var toc = new TOC({
							map : map,
							layerInfos : legendLayers
						}, 'tocDiv');
					toc.startup();
					var tocHandle = toc.on("load", function () {
						tocFlag = true;
						// remove the on load handler
						tocHandle.remove();
						bm._loadBookmark(cfg);
					});
				}*/
			//});
		},
		_loadBookmark: function(cfg) {
			try {
				showLoading();
				if (cfg.indexOf("layer=") && !basemapFlag) {
					this._loadBasemapsToc(cfg, this);
					return;
				}
				document.getElementById("menuView").style.display="none";
				document.getElementById('swipeleft').style.display='none';
				slideLeft(document.getElementById('bookmarkPane'));
				var i;
				if (typeof hb1298GraphicsLayer != "undefined") hb1298GraphicsLayer.clear();
				if (typeof drawGraphicsLayer != "undefined") {
					for (i = 0; i < drawGraphicsCounter; i++)
						map.removeLayer(map.getLayer(drawGraphicsCount[i]));
					drawGraphicsCounter = 0;
					drawGraphicsCount = [];
				}
				/*if (drawTextGraphicsLayer) {
					for (i = 0; i < drawTextGraphicsCounter; i++)
						map.removeLayer(map.getLayer(drawTextGraphicsCount[i]));
					drawTextGraphicsCounter = 0;
					drawTextGraphicsCount = [];
				}*/
				require(["esri/geometry/Extent", "esri/SpatialReference","dojo/dom","dijit/registry","javascript/graphicFuncs"], function (Extent, SpatialReference,dom,registry,graphicFuncs) {
					cfg = cfg.replace(/\$/g, ";");
					var value = cfg.split("&");
					// clean from XSS attacks
					var regexp=/([^0-9 \-,\.])/g;
					value[0] = value[0].replace(regexp,"");
					var extArr = value[0].split(",");
					var ext;
					ext = new Extent({
							"xmin" : parseFloat(extArr[0]),
							"ymin" : parseFloat(extArr[1]),
							"xmax" : parseFloat(extArr[2]),
							"ymax" : parseFloat(extArr[3]),
							"spatialReference" : {
								"wkid" : wkid
							}
						});
					map.setExtent(ext);
					extArr = null;
					if (value.length == 1)
						return;
					
					var pos;
					var sr = new SpatialReference(map.spatialReference);
					for (var m = 1; m < value.length; m++) {
						if (value[m].indexOf("layer=") > -1) {
							value[m]=value[m].substring(6); // strip off layer=
							// clean from XSS attacks
							regexp=/([^a-zA-Z0-9 =\-\|,\._()])/g;
							value[m] = value[m].replace(regexp,"");
							var basemapGallery = registry.byId("basemapGallery");
							pos = value[m].indexOf("|");
							var basemap = value[m].substring(0, pos);
							var title;
							
							for (var g = 0; g < basemapGallery.basemaps.length; g++) {
								if (basemap == basemapGallery.basemaps[g].id) {
									title = basemapGallery.basemaps[g].title;
									break;
								}
							}
							var basemapDom = dom.byId("galleryDiv").firstChild.children;
							for (var p = 0; p < basemapDom.length; p++) {
								if (basemapDom[p].children[1].childNodes[0].nodeValue == title) {
									basemapDom[p].attributes.class.nodeValue = "thumbnailcontainer small selected";
									basemapDom[p].children[0].attributes.class.nodeValue = "thumbnail small selected";
									basemapDom[p].children[1].attributes.class.nodeValue = "title small selected";
									basemapDom[p].children[2].attributes.class.nodeValue = "title small selected";
								} else {
									basemapDom[p].attributes.class.nodeValue = "thumbnailcontainer small";
									basemapDom[p].children[0].attributes.class.nodeValue = "thumbnail small";
									basemapDom[p].children[1].attributes.class.nodeValue = "title small";
									basemapDom[p].children[2].attributes.class.nodeValue = "title small";
								}
							}
							basemapGallery.select(basemap);
							mapBasemap = basemap;
							var layersArr = value[m].substring(pos + 1).split(",");
							var layer = map.getLayersVisibleAtScale();
							gmu = "Big Game GMU";
							var n,v;
							var num = new Array(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
							var layerArr,i;
							for (var j = 0; j < layer.length; j++) {
								var found = false;
								for (i = 0; i < layersArr.length; i++) {
									layerArr = layersArr[i].split("|");
									if (layer[j].id.indexOf("graphics") > -1) {
										found = true;
										continue;
									}
									if (layer[j].id == layerArr[0]) {
										found = true;
										continue;
									}
								}
								if (!found)
									layer[j].hide();
							}
							for (i = 0; i < layersArr.length; i++) {
								layerArr = layersArr[i].split("|");
								for (j = 0; j < layer.length; j++) {
									if (layer[j].id == layerArr[0]) {
										layer[j].setOpacity(parseFloat(layerArr[1]));
										if (layerArr[3]) {
											if (layerArr[3] == "1")
												layer[j].show();
											else
												layer[j].hide();
										} else
											layer[j].show();
										if (layerArr[2] == "-1") {
											layer[j].setVisibleLayers([-1]);
										} else {
											var visLayers = layerArr[2].split("-");
											for (var k = 0; k < visLayers.length; k++)
												visLayers[k] = visLayers[k] | 0;
											var layerInfos = [];
											layerInfos = layer[j].layerInfos;
											if (layer[j].id == "Hunter Reference") {
												for (v = 0; v < visLayers.length; v++) {
													if (layerInfos[visLayers[v]].name.substr(layerInfos[visLayers[v]].name.length - 3, 3).indexOf("GMU") > -1) {
														gmu = layerInfos[visLayers[v]].name;
														break;
													}
												}
											} else if (layer[j].id == "Game Species") {
												for (v = 0; v < visLayers.length; v++) {
													if (layerInfos[visLayers[v]].name === "Bighorn Sheep") {
														gmu = "Bighorn GMU";
														break;
													} else if (layerInfos[visLayers[v]].name === "Mountain Goat") {
														gmu = "Goat GMU";
														break;
													}
												}
											}
											for (k = 0; k < layerInfos.length; k++) {
												if (visLayers.indexOf(layerInfos[k].id) != -1)
													layerInfos[k].visible = true;
												else if (layerInfos[k].parentLayerId != -1 && !layerInfos[k].subLayerIds) {
													if (layerInfos[k].name.substr(layerInfos[k].name.length - 3, 3).indexOf("GMU") > -1) {
														if (layerInfos[k].name == gmu) {
															if (visLayers.indexOf(m) == -1) {
																layerInfos[k].visible = true;
															}
															if ((num.indexOf(parseInt(layerInfos[layerInfos[k].parentLayerId].name.substr(0, 1))) > -1) && (visLayers.indexOf(layerInfos[k].parentLayerId) == -1)) {
																layerInfos[layerInfos[k].parentLayerId].visible = true;
															}
														} else
															layerInfos[k].visible = false;
													} else if ((layerInfos[k].defaultVisibility == true) && (visLayers.indexOf(layerInfos[k].parentLayerId) === -1)) {
														if (num.indexOf(parseInt(layerInfos[layerInfos[k].parentLayerId].name.substr(0, 1))) > -1) {
															layerInfos[layerInfos[k].parentLayerId].visible = true;
														}
													}
												} else {
													layerInfos[k].visible = false;
												}
												pos = visLayers.indexOf(layerInfos[k].id);
												if (pos > -1 && layerInfos[k].subLayerIds)
													visLayers.splice(pos, 1);
											}
											layer[j].setVisibleLayers(visLayers.sort(function (a, b) {
													return a - b;
												}), false);
											layer[j].refresh();
											visLayers = null;
										}
									}
								}
							}
						} else if (value[m].indexOf("point=") > -1){
							require(["javascript/graphicFuncs"],function(graphicFuncs){
								value[m]=value[m].substring(6); // strip off point=
								// clean from XSS attacks
								regexp=/([^a-zA-Z0-9 °\-\'\"\|;,\.!_\*()])/g;
								value[m] = value[m].replace(regexp,"");
								graphicFuncs.addPoints(value[m], sr);
							});
						}
						else if (typeof addHB1298Points === "function" && value[m].indexOf("hb1298=") > -1){
							value[m]=value[m].substring(7); // strip off hb1298=
							// clean from XSS attacks
							regexp=/([^a-zA-Z0-9 °\-\'\"\|;,\.!_\*()])/g;
							value[m] = value[m].replace(regexp,"");
							addHB1298Points(value[m]);
						}
						// if add these need to clean from xss attacks. See indexM.html for regexp
						//else if (value[m].indexOf("line=") > -1)
						//	addLines(value[m].substring(5), sr);
						//else if (value[m].indexOf("poly=") > -1)
						//	addPolys(value[m].substring(5), sr);
						//else if (value[m].indexOf("rect=") > -1)
						//	addRects(value[m].substring(5), sr);
						//else if (value[m].indexOf("text=") > -1)
						//	addLabels(value[m].substring(5), sr);
					}
					var toc = registry.byId("tocDiv");
					toc.refresh();
				});
				hideLoading();
			} catch (e) {
				alert("Error in javascript/bookmark.js _loadBookmark() " + e.message, "Code Error", e);
			}
		},
		_removeBookmark: function(name) {
			try {
				var newBM = "";
				var value = getCookie("bm_" + app.toLowerCase());
				var bmArr = value.split("*");
				for (var i = 0; i < bmArr.length; i++) {
					var thisName = bmArr[i];
					if (name != thisName) {
						if (newBM != "" && thisName != "")
							newBM += "*";
						newBM += bmArr[i];
					}
				}
				setCookie("bm_" + app.toLowerCase(), newBM);
				deleteCookie("bm" + app.toLowerCase() + "_" + name);
				domConstruct.destroy("link"+name);
				domConstruct.destroy(name);
				domConstruct.destroy("br1"+name);
				domConstruct.destroy("br2"+name);
			} catch (e) {
				alert("Error in javascript/bookmark.js _removeBookmark() " + e.message, "Code Error", e);
			}
		}
	});
	return Bookmark;
});