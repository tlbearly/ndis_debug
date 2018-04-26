define([
	"dojo/_base/declare",
	"dojo/_base/lang"
], function(declare,lang){
	// mlGetPoints, getMapLink, email link utility functions
	// Called by indexM.html, Bookmark.js, wayPoints.js
	return {
		mlGetPoints: function() {
			// Returns a portion of the URI with the &point=all found points.
			// New format for point:
			//   &point=size|color|x|y|label|description, next point...
			//		where size=s for small, m for medium, or l for large
			//		color=b for blue, g for green, r for red, or y for gray
			// Old format:
			//   &point=circle|size|color|alpha(transparency)|outline color|outline width|x|y
			//		|text|font|font size|color|bold as t or f|italic as t or f|underline as t or f|placement|offset, next point...
			//		&point=circle|10|4173788|1|0|1|-11713310|4743885|480;779; 4;333;990|1|12|4173788|t|f|f|above|5
			var url = null;
			var singleQuote = /'/g;
			var doubleQuote = /"/g;
			for (var i=0; i<drawGraphicsCount.length; i++) {
				var layer = map.getLayer(drawGraphicsCount[i]).graphics[0];
				if (layer.geometry.type != "point") continue;
				if (!url) url = "&point=";
				if (url != "&point=") url += ",";
				var rgb = layer.symbol.color.toRgb();
				var size = "m";
				if (layer.symbol.size == 7) size = "s";
				else if (layer.symbol.size == 21) size = "l";
				var ptColor = "y";
				if (rgb[0] == 255) ptColor = "r";
				else if (rgb[1] == 255) ptColor = "g";
				else if (rgb[2] == 255) ptColor = "b";
				url += size+"|"+ptColor+"|"+parseInt(layer.geometry.x) + "|" + parseInt(layer.geometry.y);
				// old point format. Too long!!
				//url += "circle|" +layer.symbol.size+ "|" +rgb[0]+";"+rgb[1]+";"+rgb[2]+ "|0.6|h" + layer.symbol.outline.color.toHex().substr(1)+"|1|"
				//	+ parseInt(layer.geometry.x) + "|"
				//	+ parseInt(layer.geometry.y);
				// If Label
				var id=1;
				if (detectmob) id = 2; // if mobile graphics[1] has grey halo, so id of 2 will have text
				// Add way point title
				if (map.getLayer(drawGraphicsCount[i]).graphics[id]) {
					if (id==2) layer = map.getLayer(drawGraphicsCount[i]).title;
					else layer = map.getLayer(drawGraphicsCount[i]).graphics[id].symbol.text;
					layer = layer.replace(/``/g,"\%22").replace(/`/g,"\%27"); // Singe and doubleQuotes are not allowed in the title for the way point popup because it uses javascript to create it.
					url +=  "|" +layer.replace(singleQuote,"\%27").replace(doubleQuote,"\%22").replace(/,/g,";").replace(/\n/g,"\%0D").replace(/\?/g,"\%3F");
					//+ "|"+ "0|" + parseInt(layer.symbol.font.size) + "|0|t|f|f";
				}
				else url+="|Way%20Point";
				// Add way point description
				if (map.getLayer(drawGraphicsCount[i]).desc){
					var desc = map.getLayer(drawGraphicsCount[i]).desc;
					if (desc[desc.length-1] == ".") desc += " "; //add space to end of description because email chokes on ".,new way point..."
					desc =desc.replace(/``/g,"\%22").replace(/`/g,"\%27"); // Singe and doubleQuotes are not allowed in the title for the way point popup because it uses javascript to create it.
					url += "|" + desc.replace(singleQuote,"\%27").replace(doubleQuote,"\%22").replace(/,/g,";").replace(/\n/g,"\%0D").replace(/\?/g,"\%3F");
				}
			}
			return url;
		},

		/*mlGetLayers: function() {
			// load the toc and basemap if necessary then get layers
			if (!tocFlag || !basemapFlag){
			var gf = this;
			require(["agsjs/dijit/TOC"], function (TOC) {
				if (!basemapFlag){
					initBasemaps();
					var timer = setInterval(function(){
						// wait for basemaps to load
						if (document.getElementById("basemapLoading").style.display == "none") {
							clearInterval(timer);
							basemapFlag=true;
							// load toc if necessary
							if (!tocFlag){
								var toc = new TOC({
										map : map,
										layerInfos : legendLayers
									}, 'tocDiv');
								toc.startup();
								var tocHandle= toc.on("load", function(){
									tocFlag = true;
									// remove the on load handler
									tocHandle.remove();
									return gf.mlGetLayers2();
								});
							}
							else return gf.mlGetLayers2();
						}
					},50);	
				}
				// load toc
				else if (!tocFlag){
					var toc = new TOC({
							map : map,
							layerInfos : legendLayers
						}, 'tocDiv');
					toc.startup();
					var tocHandle = toc.on("load", function () {
						tocFlag = true;
						// remove the on load handler
						tocHandle.remove();
						return gf.mlGetLayers2();
					});
				}
			});
			}
			else return this.mlGetLayers2();
		},*/
		
		mlGetLayers: function() {
			// Returns a portion of the URI with &layers=all visible layers
			// &layer= basemap| id | opacity | visible layers, repeat...
			// &layer= streets|layer2|.8|3-5-12,layer3|.65|2-6-10-12
			var str = "&layer=" +mapBasemap+ "|";
			var layer = map.getLayersVisibleAtScale();
			for (var i=0; i<layer.length; i++) {
				if (layer[i].declaredClass == "esri.layers.ArcGISDynamicMapServiceLayer") {
				//if ((layer[i].declaredClass != "esri.layers.GraphicsLayer") &&
				//	(layer[i].declaredClass != "esri.layers.ArcGISTiledMapServiceLayer")) {
					if (!layer[i].visible) continue;
					if (str.substring(str.length-1,str.length) != "|") {
						str += ","; // divider between layers
					}
					var op = layer[i].opacity.toString();
					str += layer[i].id + "|" + op.substring(0,4) + "|";
					//  Add parent layers to all visible items
					for (var k=0; k<layer[i].layerInfos.length; k++) {
						if (layer[i].visibleLayers.indexOf(k) != -1) {
							var id = k;
							while (layer[i].layerInfos[id].parentLayerId != -1) {
								// If not already in visibleLayers array add it
								if (layer[i].visibleLayers.indexOf(layer[i].layerInfos[id].parentLayerId) == -1)
									layer[i].visibleLayers.push(layer[i].layerInfos[id].parentLayerId);
								id = layer[i].layerInfos[id].parentLayerId;
							}
							// sort visible layers
							layer[i].visibleLayers = layer[i].visibleLayers.sort(function(a,b){return a-b;});
						}
					}

					// Add "-" between each visible layer id
					for (var j=0; j<layer[i].visibleLayers.length; j++) {
						if (j != 0) str += "-";
						str += layer[i].visibleLayers[j];
					}
					// Add layer visible = 1 or 0
					//if (layer[i].visible) str += "|1";
					//else str += "|0";
				}
			}
			return str;
		},

		addPoints: function(points, sr) {
			// sr is spatial reference
			// points is a string of the following:
			// New format for point:
			//   size|color|x|y|label|description, next point...
			//		where size=s for small, m for medium, or l for large
			//		color=b for blue, g for green, r for red, or y for gray
			// Old format:
			//   circle|size|color|alpha(transparency)|outline color|outline width|x|y
			//		|text|font|font size|color|bold as t or f|italic as t or f|underline as t or f|placement|offset, next point...
			//		&point=circle|10|4173788|1|0|1|-11713310|4743885|480;779; 4;333;990|1|12|4173788|t|f|f|above|5
			require(["esri/graphic", "esri/layers/GraphicsLayer", "esri/geometry/Point", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "dojo/_base/Color", "esri/geometry/Geometry", "esri/SpatialReference"], function (Graphic, GraphicsLayer, Point, SimpleMarkerSymbol, SimpleLineSymbol, Color, Geometry, SpatialReference) {
				var pointArr = points.split(",");
				var semiColon = /;/g;
				var min = /\\'/g;
				var sec = /\\"/g;
				var symbol,
				point,
				label,
				desc,
				size,
				ptColor,
				outlineColor,
				pointItems;
				for (i = 0; i < pointArr.length; i++) {
					pointItems = pointArr[i].split("|");
					if (pointItems.length >= 4 && pointItems.length < 7) {
						if (pointItems[0] == "s")
							size = 7;
						else if (pointItems[0] == "l")
							size = 21;
						else
							size = 14;
						if (pointItems[1] == "b") {
							ptColor = new Color([0, 0, 255, 0.6]);
							outlineColor = new Color([0, 0, 200]);
						} else if (pointItems[1] == "g") {
							ptColor = new Color([0, 255, 0, 0.6]);
							outlineColor = new Color([0, 150, 5]);
						} else if (pointItems[1] == "y") {
							ptColor = new Color([100, 100, 100, 0.6]);
							outlineColor = new Color([100, 100, 100]);
						} else {
							ptColor = new Color([255, 0, 0, 0.6]);
							outlineColor = new Color([255, 0, 10]);
						}
						symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, size, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, outlineColor, 1), ptColor);
						if (pointItems.length > 4)
							label = pointItems[4].replace(semiColon, ",").replace(sec, "``").replace(min, "`");  //replace(min, "'").replace(sec, "\"");
						else
							label = "Way Point";
						if (pointItems.length > 5)
							desc = pointItems[5].replace(semiColon, ",").replace(sec, "``").replace(min, "`"); //replace(min, "'").replace(sec, "\"");
						else
							desc = "";
						point = new Point(parseFloat(pointItems[2]), parseFloat(pointItems[3]), new SpatialReference({
									wkid : wkid
								}));
					} else if (pointItems.length > 6) {
						if (pointItems[4].indexOf("h") > -1) {
							var rgba = pointItems[2].split(";");
							rgba.push(parseFloat(pointItems[3]));
							ptColor = new Color(rgba);
							outlineColor = new Color("#" + pointItems[4].substr(1));
							rgba = null;
						} else {
							ptColor = new Color("#" + parseInt(pointItems[2]).toString(16));
							outlineColor = new Color("#" + parseInt(pointItems[4]).toString(16));
						}
						symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, pointItems[1], new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, outlineColor, 1), ptColor);
						point = new Point(parseFloat(pointItems[6]), parseFloat(pointItems[7]), new SpatialReference({
									wkid : wkid
								}));
						if (pointItems.length > 8)
							label = pointItems[8].replace(semiColon, ",").replace(min, "'").replace(sec, "\"");
						else
							label = "Way Point";
						if (pointItems.length > 9)
							desc = pointItems[9].replace(semiColon, ",").replace(min, "'").replace(sec, "\"");
						else
							desc = "";
					}
					else {
						alert("Could not add all of the Way Points. This can happen if a long map URL was emailed.","Note",null,true,true);
						return;
					}
					// Call addPoint in wayPoints.js to graphics layer and setup way point popup
					addPoint(point, label, desc, symbol);
				}
				label = null;
				point = null;
				symbol = null;
				ptColor = null;
				outlineColor = null;
				pointArr = null;
				pointItems = null;
			});
		},
							
		getMapLink: function(){
			// return url to current map
			var url;
			if (window.location.href.indexOf("&") != -1)
				url= window.location.href.substring(0,window.location.href.indexOf("&"));
			else
				url = window.location.href;
			url=url.substring(0,url.indexOf("index"));
			url+=app+"/index.aspx?";
			// Add Extent
			url += "prj="+wkid+"&extent="+parseInt(map.extent.xmin)+","+parseInt(map.extent.ymin)+","+parseInt(map.extent.xmax)+","+parseInt(map.extent.ymax);
			// Add Layers
			var layers = this.mlGetLayers();
			if (layers) url += layers;
			// Add Way Points
			var waypts = this.mlGetPoints();
			if (waypts) url += waypts;
			// Add HB1298 Points
			if (typeof getHB1298Points === "function") {
				var hb1298pts = getHB1298Points();
				if (hb1298pts && hb1298pts != "") url += hb1298pts;
			}
			return url;
		}
	};
});