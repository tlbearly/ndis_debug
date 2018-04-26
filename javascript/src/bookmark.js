var html = "";
function setBookmarks() {
	try {
		require(["dojo/dom","dijit/registry"], function(dom,registry){
			registry.byId("bmTabs").watch("selectedChildWidget", function (name, oval, nval) {
				if (nval.id == "bmAddPane")
					document.getElementById("bookmarkName").focus();
			});
			var bmNames = getCookie("bm_" + app.toLowerCase());
			if (bmNames != "") {
				var names = bmNames.split("*");
				for (var i = 0; i < names.length; i++) {
					var value = getCookie("bm" + app.toLowerCase() + "_" + names[i]);
					value = value.replace(/\$/g, ";");
					updateBookmarkContent(value);
				}
			} else {
				updateBookmarkContent("Colorado|-12350000,4250000,-11150000,5250000");
				setCookie("bm" + app.toLowerCase() + "_Colorado", "Colorado|-12350000,4250000,-11150000,5250000");
				setCookie("bm_" + app.toLowerCase(), "Colorado");
			}
			dom.byId("bookmarkDiv").style.visibility = "visible";
		});
	} catch (e) {
		alert("Error in javascript/bookmark.js setBookmarks() " + e.message, "Code Error", e);
	}
}
function updateBookmarkContent(value) {
	try {
		var pos = value.indexOf("|");
		var name = value.substring(0, pos);
		var cfg = value.substring(pos + 1);
		html += '<a style="text-decoration:none;" href="javascript:loadBookmark(';
		html += "'" + cfg + "')";
		html += '"><img class="glowBtn" src="assets/images/i_bookmark.png"/> ';
		html += name + '</a><img src="assets/images/w_close_red.png" style="position:relative;float:right;right:10px;" onClick="removeBookmark(';
		html += "'" + name + "')";
		html += '"/><br/><br/>';
		document.getElementById("bookmarkTab").innerHTML = html;
	} catch (e) {
		alert("Error in javascript/bookmark.js updateBookmarkContent() " + e.message, "Code Error", e);
	}
}
function addBookmark() {
	try {
		require(["dojo/dom","dijit/registry"], function(dom,registry){
			var bmNames = getCookie("bm_" + app.toLowerCase());
			var name = dom.byId("bookmarkName").value;
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
			var str = mlGetText();
			if (str)
				cfg += str;
			str = mlGetPoints();
			if (str)
				cfg += str;
			if (typeof getHB1298Points === "function") {
				if (!str) str = "";
				str = getHB1298Points();
				if (str && str != "") cfg += str;
			}
			str = mlGetPolys();
			if (str)
				cfg += str;
			str = mlGetRect();
			if (str)
				cfg += str;
			str = mlGetLines();
			if (str)
				cfg += str;
			str = mlGetLayers();
			if (str)
				cfg += str;
			cfg = cfg.replace(/;/g, "$");
			str = name + "|" + cfg;
			updateBookmarkContent(str);
			if (bmNames.length > 0)
				bmNames += "*";
			bmNames += name;
			setCookie("bm_" + app.toLowerCase(), bmNames);
			setCookie("bm" + app.toLowerCase() + "_" + name, str);
			dom.byId("bookmarkName").value = "";
			registry.byId("bmTabs").selectChild(registry.byId("bmListPane"));
		});
	} catch (e) {
		alert("Error in javascript/bookmark.js addBookmark() " + e.message, "Code Error", e);
	}
}
function loadBookmark(cfg) {
	try {
		var i;
		if (typeof hb1298GraphicsLayer != "undefined") hb1298GraphicsLayer.clear();
		if (typeof drawGraphicsLayer != "undefined") {
			for (i = 0; i < drawGraphicsCounter; i++)
				map.removeLayer(map.getLayer(drawGraphicsCount[i]));
			drawGraphicsCounter = 0;
			drawGraphicsCount = [];
		}
		if (drawTextGraphicsLayer) {
			for (i = 0; i < drawTextGraphicsCounter; i++)
				map.removeLayer(map.getLayer(drawTextGraphicsCount[i]));
			drawTextGraphicsCounter = 0;
			drawTextGraphicsCount = [];
		}
		require(["esri/geometry/Extent", "esri/SpatialReference","dojo/dom","dijit/registry"], function (Extent, SpatialReference,dom,registry) {
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
			var sr = new SpatialReference(map.spatialReference);
			for (var m = 1; m < value.length; m++) {
				if (value[m].indexOf("layer=") > -1) {
					// clean from XSS attacks
					regexp=/([^a-zA-Z0-9 =\-\|,\._()])/g;
					value[m] = value[m].replace(regexp,"");
					var pos = value[m].indexOf("|");
					var basemap = value[m].substring(6, pos);
					var title;
					for (var g = 0; g < basemapGallery.basemaps.length; g++) {
						if (basemap == basemapGallery.basemaps[g].id) {
							title = basemapGallery.basemaps[g].title;
							break;
						}
					}
					var basemapDom = dom.byId("basemapGallery").firstChild.children;
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
					var n,i;
					var num = new Array(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
					var layerArr;
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
									layer[j].setVisibleLayers([]); // tlb 1-5-18  remove   .setVisibleLayers[-1]);
									layer[j].refresh(); // tlb 1-5-18
								} else {
									var visLayers = layerArr[2].split("-");
									for (var k = 0; k < visLayers.length; k++)
										visLayers[k] = visLayers[k] | 0;
									var layerInfos = [];
									layerInfos = layer[j].layerInfos;
									var v;
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
										var pos1 = visLayers.indexOf(layerInfos[k].id);
										if (pos1 > -1 && layerInfos[k].subLayerIds)
											visLayers.splice(pos1, 1);
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
					// clean from XSS attacks
					regexp=/([^a-zA-Z0-9 °\-\'\"\|;,\.!_\*()])/g;
					value[m] = value[m].replace(regexp,"");
					addPoints(value[m].substring(6), sr);
				}
				else if (typeof addHB1298Points === "function" && value[m].indexOf("hb1298=") > -1){
					// clean from XSS attacks
					regexp=/([^a-zA-Z0-9 °\-\'\"\|;,\.!_\*()])/g;
					value[m] = value[m].replace(regexp,"");
					addHB1298Points(value[m].substring(7));
				}
				else if (value[m].indexOf("line=") > -1){
					// clean from XSS attacks
					regexp=/([^a-zA-Z0-9 °\-\'\"\|;,\.!_\*()])/g;
					value[m] = value[m].replace(regexp,"");
					addLines(value[m].substring(5), sr);
				}
				else if (value[m].indexOf("poly=") > -1){
					// clean from XSS attacks
					regexp=/([^a-zA-Z0-9 \-\'\|;,\.!_\*()])/g;
					value[m] = value[m].replace(regexp,"");
					addPolys(value[m].substring(5), sr);
				}
				else if (value[m].indexOf("rect=") > -1){
					// clean from XSS attacks
					regexp=/([^a-zA-Z0-9 \-\'\|;,\.!_\*()])/g;
					value[m] = value[m].replace(regexp,"");
					addRects(value[m].substring(5), sr);
				}
				else if (value[m].indexOf("text=") > -1){
					// clean from XSS attacks
					regexp=/([^a-zA-Z0-9 \-\'\|;,\.!_\*()])/g;
					value[m] = value[m].replace(regexp,"");
					addLabels(value[m].substring(5), sr);
				}
			}
			var toc = registry.byId("tocDiv");
			toc.refresh();
		});
	} catch (e) {
		alert("Error in javascript/bookmark.js loadBookmark() " + e.message, "Code Error", e);
	}
}
function removeBookmark(name) {
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
		html = "";
		setBookmarks();
	} catch (e) {
		alert("Error in javascript/bookmark.js removeBookmark() " + e.message, "Code Error", e);
	}
}
