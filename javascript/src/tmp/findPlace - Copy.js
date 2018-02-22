var findCombo;
var findStore;
var emptyStore;
var lodLevel = 3; // 4-19-17 Updated lods. Used to be 9.
var findObj = null;
function findPlaceInit() {
	require(["dojo/store/Memory", "dijit/form/ComboBox", "esri/SpatialReference", "esri/geometry/Point", "esri/graphic",
	"esri/tasks/query", "esri/tasks/QueryTask", "dojo/dom","dijit/registry", "dojo/domReady!"], 
	function (Memory, ComboBox, SpatialReference, Point, Graphic, Query, QueryTask, dom, registry) {
		emptyStore = new Memory({
				data : []
			});
		findCombo = new ComboBox({
				id : "findCombo",
				placeholder : "Search for a Colorado Place...",
				hasDownArrow : false,
				required : false,
				maxHeight : 295,
				autoComplete : false,
				searchAttr : "address",
				onKeyUp : function (value) {
					if ([33, 34, 37, 38, 38, 40].indexOf(value.keyCode) > -1)
						return;
					if (dom.byId("findCombo").value.length > 2)
						updateStore();
					if (dom.byId("findCombo").value.length <= 2)
						registry.byId("findCombo").set("store", emptyStore);
				},
				onClick : function (value) {
					registry.byId("findCombo").set("value", "");
					registry.byId("findCombo").set("store", emptyStore);
					registry.byId("findCombo").closeDropDown(true);
				},
				onChange : gotoLocation,
				style : {
					width : "350px",
					borderRadius : "5px 0 0 5px",
					borderStyle : "inset",
					padding : "5px 45px 5px 25px"
				}
			}, "findCombo");
		findCombo.startup();
		var findBtn = document.createElement("img");
		findBtn.setAttribute("src", "assets/images/i_find.png");
		findBtn.setAttribute("onClick", "gotoLocation()");
		findBtn.setAttribute("style", "width:20px;height:20px;position:absolute;top:6px;right:395px");
		document.getElementById("findBtnSpan").appendChild(findBtn);
		/* X button is calling onchange event for findCombo!!! So not working.
		var xBtn = document.getElementById("findX");
		xBtn.onclick = function(){
			registry.byId("findCombo").set("value", "");
			registry.byId("findCombo").set("store", emptyStore);
			registry.byId("findCombo").closeDropDown(true);
		};*/
		function updateStore() {
			var url = myFindService + "/findAddressCandidates?f=json&outFields=county,Priority&PlaceName=" + findCombo.get('value');
			// in arcgis 10.4 added searchExtent (rectangle instead of point and distance) and maxSuggestions.
			// 5-1-17 Get list of suggestions as user types 
			//var url = myFindService + "/suggest?f=json&location=39,-105.55&distance=379014&text="+ findCombo.get('value');
			var XMLHttpRequest = createXMLhttpRequest();
			XMLHttpRequest.open("GET", url, true);
			XMLHttpRequest.onreadystatechange = function () {
				if (XMLHttpRequest.readyState == 4) {
					if (XMLHttpRequest.status == 200) {
						try {
							var dataArr = JSON.parse(XMLHttpRequest.response).candidates;
							dataArr.sort(sortArrayOfObj("address"));
							var value = findCombo.get('value');
							dataArr.forEach(function (item, index, obj) {
								item["label"] = item.address;
								// Searching for Counties, remove items that are not county names
								if (value.toUpperCase() == "COUNTY") {
									if (item.attributes.county + " County" != item.address)
										obj.splice(index,1);
								}
								// Searching for National Forests, remove names that are not national forests 
								else if (value.toUpperCase() == "NATIONAL FOREST") {
									if (item.address.toUpperCase().slice(-15, item.address.length) != "NATIONAL FOREST")
										obj.splice(index,1);
								}
								else if (item.attributes.county != "" && item.attributes.county + " County" != item.address)
									item.address = item.address + " (" + item.attributes.county + " County)";
							});
							findStore = new Memory({
								data : dataArr
							});
							findCombo.set("store", findStore);
						} catch (e) {
							console.log(e.message);
						}
					}
				}
			}
			XMLHttpRequest.send();
		}
	});
}
function handleCoordinate(label) {
	require(["esri/SpatialReference", "esri/geometry/Point", "esri/graphic", "dojo/domReady!"], function (SpatialReference, Point, Graphic) {
		var point;
		var inSR,
		outSR,
		coordGraphic,
		pointX,
		pointY;
		if (label.indexOf(":") > 0) {
			var pos,
			pos2;
			pointX = label.substring(0, label.indexOf(","));
			pointY = label.substring(label.indexOf(",") + 1, label.length);
			pos = pointX.indexOf(":");
			var degX = pointX.substring(0, pos);
			var secX = 0;
			var minX;
			pos2 = pointX.substring(pos + 1).indexOf(":")
				if (pos2 > -1) {
					minX = pointX.substr(pos + 1, pos2);
					secX = pointX.substring(pos + pos2 + 2);
				} else
					minX = pointX.substring(pos + 1);
				pointX = Number(degX) + Number(minX) / 60 + Number(secX) / 3600;
			if (pointX >= 100 && pointX <= 110)
				pointX = pointX * -1;
			pos = pointY.indexOf(":");
			var degY = pointY.substring(0, pos);
			var secY = 0;
			var minY;
			pos2 = pointY.substring(pos + 1).indexOf(":")
				if (pos2 > -1) {
					minY = pointY.substr(pos + 1, pos2);
					secY = pointY.substring(pos + pos2 + 2);
				} else
					minY = pointY.substring(pos + 1);
				pointY = Number(degY) + Number(minY) / 60 + Number(secY) / 3600;
			if (pointY >= 100 && pointY <= 110)
				pointY = pointY * -1;
			label = degX + '° ' + minX + '\' ';
			if (secX > 0)
				label += secX + '"';
			label += ", " + degY + '° ' + minY + '\' ';
			if (secY > 0)
				label += secY + '"';
		} else {
			pointX = Number(label.substring(0, label.indexOf(",")));
			pointY = Number(label.substring(label.indexOf(",") + 1, label.length));
		}
		if (((pointY >= -110 && pointY <= -100) || (pointY >= 100 && pointY <= 110)) && (pointX >= 35 && pointX <= 42)) {
			var pos = label.indexOf(",");
			label = label.substr(0, pos) + " N" + label.substr(pos) + " W";
			if (pointY > 0)
				pointY = pointY * -1;
			inSR = new SpatialReference(4326);
			point = new Point(pointY, pointX, inSR);
			coordGraphic = new Graphic(point);
			outSR = new SpatialReference(wkid);
			geometryService.project([coordGraphic.geometry], outSR, function (feature) {
				_displayXYPoint(feature[0], label);
				_clearAndZoom(feature[0], lodLevel);
			}, function (err) {
				alert("Error projecting point. " + err.message, "Warning");
			});
			return;
		} else if (((pointX >= -110 && pointX <= -100) || (pointX >= 100 && pointX <= 110)) && (pointY >= 35 && pointY <= 42)) {
			var pos = label.indexOf(",");
			label = label.substr(0, pos) + " W" + label.substr(pos) + " N";
			if (pointX > 0)
				pointX = pointX * -1;
			inSR = new SpatialReference(4326);
			point = new Point(pointX, pointY, inSR);
			coordGraphic = new Graphic(point);
			outSR = new SpatialReference(wkid);
			geometryService.project([coordGraphic.geometry], outSR, function (feature) {
				_displayXYPoint(feature[0], label);
				_clearAndZoom(feature[0], lodLevel);
			}, function (err) {
				alert("Error projecting point. " + err.message, "Warning");
			});
			return;
		} else if ((pointX >= 133000 && pointX <= 1300000) && (pointY >= 4095000 && pointY <= 4580000)) {
			if (!settings)
				inSR = new SpatialReference(26913);
			else
				inSR = new SpatialReference(Number(settings.XYProjection));
			point = new Point(pointX, pointY, inSR);
			coordGraphic = new Graphic(point);
			outSR = new SpatialReference(wkid);
			geometryService.project([coordGraphic.geometry], outSR, function (feature) {
				_displayXYPoint(feature[0], label);
				_clearAndZoom(feature[0], lodLevel);
			}, function (err) {
				alert("Error projecting point. " + err.message, "Warning");
			});
			return;
		} else {
			alert("<p>Warning:  This point is not in Colorado, or it is not in one of the supported projections of:</p><ul>" + "<li>Lat, Long decimal degrees (e.g. 39.2, 103.5032 or 39.2, -103.5032)</li>" + "<li>Long, Lat decimal degrees (e.g. -104.345, 39.012 or 104.345, 39.012)</li>" + "<li>Lat, Long degrees, decimal minutes (e.g. 39:3.5,104:30.223)</li>" + "<li>Lat, Long degrees, minutes, seconds (e.g. 39:3:30,104:30:1.44)</li>" + "<li>Long, Lat degrees, decimal minutes (e.g. 104:30.45,39:3.5)</li>" + "<li>Lat, Long degrees, decimal minutes (e.g. 39:3.5,104:30.45)</li>" + "<li>NAD83 UTM (e.g. 1020042,  4333793)</li>" + "<li>NAD27 UTM, or WGS84 UTM.</li></ul>Use a comma to separate the coordinates.", "Warning");
			hideLoading();
			return;
		}
	});
}
function loadFindBoundaries(label, x, y, priority){
	// read url.xml to get boundaries for polygons to highlight, create findObj.
	try {
		var xmlhttp = createXMLhttpRequest();
		var configFile = app + "/url.xml?v="+ndisVer;
		findObj = {
			"county" : {
				url : "//ndismaps.nrel.colostate.edu/ArcGIS/rest/services/HuntingAtlas/CHA_FindAPlaceTool_Data/MapServer/1",
				field : "COUNTYNAME"
			},
			"public" : {
				url : "//ndismaps.nrel.colostate.edu/ArcGIS/rest/services/HuntingAtlas/CHA_HunterBase_Map/MapServer/96",
				field : "PropName"
			},
			"gmu" : {
				url : "//ndismaps.nrel.colostate.edu/ArcGIS/rest/services/HuntingAtlas/CHA_FindAPlaceTool_Data/MapServer/4",
				field : "GMUID"
			},
			"forest" : {
				url : "//ndismaps.nrel.colostate.edu/ArcGIS/rest/services/HuntingAtlas/CHA_HunterBase_Map/MapServer/99",
				field : "MapName"
			},
			"grassland" : {
				url : "//ndismaps.nrel.colostate.edu/ArcGIS/rest/services/HuntingAtlas/CHA_HunterBase_Map/MapServer/99",
				field : "MapName"
			},
			"wilderness" : {
				url : "//ndismaps.nrel.colostate.edu/ArcGIS/rest/services/HuntingAtlas/CHA_HunterBase_Map/MapServer/97",
				field : "NAME"
			}
		};
		var layer = [];
		var keyword = "";
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == 4 && xmlhttp.status === 200) {
				var keywordArr = ["county", "public", "gmu", "forest", "grassland", "wilderness"];
				var foundArr = [];
				var xmlDoc = createXMLdoc(xmlhttp);
				if (xmlDoc == null)
					alert("Error: Missing url.xml file in " + app + " directory. Will use default Rest Services on ndismaps.", "Data Error");
				else {
					try {
						layer = xmlDoc.getElementsByTagName("layer");
					} catch (e) {
						alert("Error in url.xml. Missing layer tag. " + e.message, "Data Error");
					}
					for (var i = 0; i < layer.length; i++) {
						try {
							keyword = layer[i].getElementsByTagName("keyword")[0].firstChild.nodeValue;
						} catch (e) {
							alert("Error in url.xml. Missing keyword tag. " + e.message, "Data Error");
						}
						if (!!~keywordArr.indexOf(keyword)) {
							foundArr.push(keyword);
							try {
								findObj[keyword].url = layer[i].getElementsByTagName("url")[0].firstChild.nodeValue;
							} catch (e) {
								alert("Error in url.xml. Missing url tag for layer " + keyword + ". Will use " + findObj[keyword].url + ". " + e.message, "Data Error");
							}
							try {
								findObj[keyword].field = layer[i].getElementsByTagName("field")[0].firstChild.nodeValue;
							} catch (e) {
								alert("Error in url.xml. Missing field tag for layer " + keyword + ". Will use " + findObj[keyword].field + ". " + e.message, "Data Error");
							}
						}
					}
					for (i = 0; i < keywordArr.length; i++) {
						if (!~foundArr.indexOf(keywordArr[i]))
							alert("Error in url.xml. Missing tags:\n<layer>\n\t<keyword>" + keywordArr[i] + "</keyword>\n\t<url>" + findObj[keywordArr[i]].url + "</url>\n\t<field>" + findObj[keywordArr[i]].field + "</field>\n</layer>\n\n" + "Will try to use the default settings on //ndismaps.nrel.colostate.edu.", "Data Error");
					}
					zoomToFindLocation(label, x, y, priority);
				}
			}
			else if (xmlhttp.status===404)
				alert("Missing url.xml file in "+app+" directory.","Data Error");
			else if (xmlhttp.readyState===4 && xmlhttp.status===500)
				alert("Error: had trouble reading "+app+"/url.xml file in findPlace.js.", "Data Error");			
		}
		xmlhttp.open("GET", configFile, true);
		xmlhttp.send(null);
	}
	catch(e){
		alert("Problem in findPlace.js/loadFindBoundaries, error message: "+e.message,"Code Error",e);
	}
}
function zoomToFindLocation(label, x, y, priority) {
	var point;
	require(["esri/geometry/Point"], function (Point) {
		point = new Point(x, y, map.spatialReference);
		// handle single quote since query uses single quotes around search text
		var quote = /'/g;
		label = label.replace(quote,"''");
		// Is it a boundary? county, gmu, stl, sfu, swa, wwa, national forest, grassland, or wilderness
		if ((label.toUpperCase().slice(-6, label.length) == "COUNTY") || (label.toUpperCase().slice(0, 4) == "GMU ") || (label.toUpperCase().slice(-4, label.length) == " STL") || (label.toUpperCase().indexOf(" STL ") > -1) || (label.toUpperCase().slice(-4, label.length) == " SWA") || (label.toUpperCase().indexOf(" SWA ") > -1) || (label.toUpperCase().slice(-4, label.length) == " SFU") || (label.toUpperCase().indexOf(" SFU ") > -1) || (label.toUpperCase().slice(-4, label.length) == " WWA") || (label.toUpperCase().indexOf(" WWA ") > -1) || (label.toUpperCase().slice(-15, label.length) == "NATIONAL FOREST") || (label.toUpperCase().indexOf("NATIONAL GRASSLAND") > -1) || (label.toUpperCase().indexOf("WILDERNESS") > -1)) {
			var queryTask;
			var query;
			require(["esri/tasks/query", "esri/tasks/QueryTask", "dojo/_base/lang"], function (Query, QueryTask, lang) {
				if (label.toUpperCase().slice(-6, label.length) == "COUNTY") {
					queryTask = new QueryTask(findObj["county"].url);
					query = new Query();
					query.where = "UPPER(" + findObj["county"].field + ") LIKE UPPER('" + label.substring(0, label.length - 7) + "')";
					query.text = label;
					query.returnGeometry = true;
					query.outFields = [findObj["county"].field];
				} else if ((label.toUpperCase().slice(-4, label.length) == " STL") || (label.toUpperCase().indexOf(" STL ") > -1) || (label.toUpperCase().slice(-4, label.length) == " SWA") || (label.toUpperCase().indexOf(" SWA ") > -1) || (label.toUpperCase().slice(-4, label.length) == " SFU") || (label.toUpperCase().indexOf(" SFU ") > -1) || (label.toUpperCase().slice(-4, label.length) == " WWA") || (label.toUpperCase().indexOf(" WWA ") > -1)) {
					queryTask = new QueryTask(findObj["public"].url);
					query = new Query();
					query.where = "UPPER(" + findObj["public"].field + ") LIKE UPPER('" + label + "')";
					query.text = label;
					query.returnGeometry = true;
					query.outFields = [findObj["public"].field];
				} else if (label.toUpperCase().slice(0, 4) == "GMU ") {
					queryTask = new QueryTask(findObj["gmu"].url);
					query = new Query();
					query.where = findObj["gmu"].field + " = " + label.substring(4, label.length);
					query.text = label;
					query.returnGeometry = true;
					query.outFields = [findObj["gmu"].field];
				} else if (label.toUpperCase().slice(-15, label.length) == "NATIONAL FOREST") {
					queryTask = new QueryTask(findObj["forest"].url);
					query = new Query();
					query.where = "UPPER(" + findObj["forest"].field + ") LIKE UPPER('" + label + "')";
					query.text = label;
					query.returnGeometry = true;
					query.outFields = [findObj["forest"].field];
				} else if (label.toUpperCase().indexOf("NATIONAL GRASSLAND") > -1) {
					queryTask = new QueryTask(findObj["grassland"].url);
					query = new Query();
					query.where = "UPPER(" + findObj["grassland"].field + ") LIKE UPPER('" + label + "%')";
					query.text = label;
					query.returnGeometry = true;
					query.outFields = [findObj["grassland"].field];
				} else if (label.toUpperCase().indexOf("WILDERNESS") > -1) {
					queryTask = new QueryTask(findObj["wilderness"].url);
					query = new Query();
					if (label.toUpperCase().indexOf("LAPOUDRE") > -1)
						label = label.replace("LaPoudre", "La Poudre");
					query.where = "UPPER(" + findObj["wilderness"].field + ") LIKE UPPER('" + label + "%')";
					query.text = label;
					query.returnGeometry = true;
					query.outFields = [findObj["wilderness"].field];
				}
			});
			queryTask.execute(query, function (results) {
				_clearAndZoom(null,-1); // clear box but do not zoom in
				_highlightPolygonResults(results, label, point);
			}, function (error) {
				if (error.details && error.details.length == 2)
					alert("Error querying in FindPlace.js " + error.message + " " + error.details[0] + " " + error.details[1] + ". Check url.xml and findplaceservice tag in config.xml.", "Data Error");
				else
					alert(error.message + " Check the URLs in url.xml and findplaceservice tag in config.xml.", "Data Error");
			});
			query = null;
			queryTask = null;
		} else {
			if (priority > 0) {				
				var lod = 5; // 4-21-17 Updated lods, used to be 11.
				if (priority == "18056") lod = 9;
				else if (priority == "4514") lod = 11;
				else {
					for (var i = 0; i < mapscaleList.length; i++) {
						if (mapscaleList[i].value == priority) {
							lod = i; // 4-21-17 Updated lods, used to be "i + 5".
							break;
						}
					}
				}
				_clearAndZoom(point, lod);
			} else {
				_clearAndZoom(point, lodLevel);
			}
			_displayXYPoint(point, label);
		}
	});
}
function _clearAndZoom(point, lod) {
	try {
		require(["dijit/registry","dijit/focus"],function(registry,focusUtil){
			if (point) map.centerAndZoom(point, lod);
			if (!registry.byId("findCombo"))
				return;
			registry.byId("findCombo").set("store", emptyStore);
			registry.byId("findCombo").set("value", "");
			focusUtil.curNode && focusUtil.curNode.blur();
		});
	} catch (e) {
		alert(e.message, "findPlace.js _clearAndZoom", "Code Error", e);
	}
}
function _highlightPolygonResults(results, label, point) {
	require(["dojo/_base/Color", "esri/symbols/SimpleLineSymbol", "esri/layers/GraphicsLayer", "esri/graphic", "esri/graphicsUtils"], function (Color, SimpleLineSymbol, GraphicsLayer, Graphic, graphicsUtils) {
		if (results.features.length == 0) {
			map.centerAndZoom(point, lodLevel);
			_displayXYPoint(point, label);
			return;
		}
		var highlightSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 3);
		var searchGraphicsLayer = new GraphicsLayer();
		searchGraphicsLayer.id = "searchgraphics" + searchGraphicsCounter;
		searchGraphicsCount.push(searchGraphicsLayer.id);
		searchGraphicsCounter++;
		for (var i = 0; i < results.features.length; i++) {
			searchGraphicsLayer.add(new Graphic(results.features[i].geometry, highlightSymbol));
		}
		map.setExtent(graphicsUtils.graphicsExtent(results.features), true);
		label=label.replace(/''/g, "'");
		addLabel(new Graphic(point), label, searchGraphicsLayer, "11pt");
		map.addLayer(searchGraphicsLayer);
		document.getElementById("findClear").style.opacity = 1;
		document.getElementById("findClear").style.filter = "alpha(opacity=100)";
		// Clear the boundary after a couple seconds
		var t = window.setTimeout(function (){
			removeSearchItem();
			window.clearTimeout(t);
		}, 4000);
	});
}
function _displayXYPoint(point, label) {
	require(["esri/symbols/PictureMarkerSymbol", "esri/graphic", "esri/layers/GraphicsLayer"], function (PictureMarkerSymbol, Graphic, GraphicsLayer) {
		var symbol = new PictureMarkerSymbol("assets/images/i_flag.png", 40, 40);
		var searchGraphicsLayer = new GraphicsLayer();
		searchGraphicsLayer.id = "searchgraphics" + searchGraphicsCounter;
		searchGraphicsCount.push(searchGraphicsLayer.id);
		searchGraphicsCounter++;
		searchGraphicsLayer.add(new Graphic(point, symbol));
		label=label.replace(/''/g, "'");
		addLabel(new Graphic(point), label, searchGraphicsLayer, "11pt");
		document.getElementById("findClear").style.opacity = 1;
		document.getElementById("findClear").style.filter = "alpha(opacity=100)";
	});
}
function gotoLocation(value) {
	var calledFromURL = false;
	if (arguments[1])
		calledFromURL = true;
	if (value == "")
		return;
	if (!calledFromURL && findCombo.value == "") return;
	var digits = "0123456789-";
	if (digits.indexOf(value.substring(0, 1)) > -1 && value.indexOf(",") > -1) {
		handleCoordinate(value);
		return;
	}
	if (!calledFromURL && findCombo && findCombo.item && findCombo.item.label) {
		if (findObj==null && ((findCombo.item.label.toUpperCase().slice(-6, findCombo.item.label.length) == "COUNTY") || (findCombo.item.label.toUpperCase().slice(0, 4) == "GMU ") || (findCombo.item.label.toUpperCase().slice(-4, findCombo.item.label.length) == " STL") || (findCombo.item.label.toUpperCase().indexOf(" STL ") > -1) || (findCombo.item.label.toUpperCase().slice(-4, findCombo.item.label.length) == " SWA") || (findCombo.item.label.toUpperCase().indexOf(" SWA ") > -1) || (findCombo.item.label.toUpperCase().slice(-4, findCombo.item.label.length) == " SFU") || (findCombo.item.label.toUpperCase().indexOf(" SFU ") > -1) || (findCombo.item.label.toUpperCase().slice(-4, findCombo.item.label.length) == " WWA") || (findCombo.item.label.toUpperCase().indexOf(" WWA ") > -1) || (findCombo.item.label.toUpperCase().slice(-15, findCombo.item.label.length) == "NATIONAL FOREST") || (findCombo.item.label.toUpperCase().indexOf("NATIONAL GRASSLAND") > -1) || (findCombo.item.label.toUpperCase().indexOf("WILDERNESS") > -1)))
			loadFindBoundaries(findCombo.item.label, findCombo.item.location.x, findCombo.item.location.y, findCombo.item.attributes.Priority); // load findObj
		else
			zoomToFindLocation(findCombo.item.label, findCombo.item.location.x, findCombo.item.location.y, findCombo.item.attributes.Priority);
	} else {
		var found = false;
		if (!calledFromURL) {
			for (var i = 0; i < findCombo.store.data.length; i++) {
				var label = findCombo.store.data[i].label;
				if (!label) label = findCombo.store.data[i].address;
				if ((value.toUpperCase() == label.toUpperCase()) || (value.toUpperCase() == findCombo.store.data[i].address.toUpperCase())) {
					found = true;
					if (findObj==null && ((label.toUpperCase().slice(-6, label.length) == "COUNTY") || (label.toUpperCase().slice(0, 4) == "GMU ") || (label.toUpperCase().slice(-4, label.length) == " STL") || (label.toUpperCase().indexOf(" STL ") > -1) || (label.toUpperCase().slice(-4, label.length) == " SWA") || (label.toUpperCase().indexOf(" SWA ") > -1) || (label.toUpperCase().slice(-4, label.length) == " SFU") || (label.toUpperCase().indexOf(" SFU ") > -1) || (label.toUpperCase().slice(-4, label.length) == " WWA") || (label.toUpperCase().indexOf(" WWA ") > -1) || (label.toUpperCase().slice(-15, label.length) == "NATIONAL FOREST") || (label.toUpperCase().indexOf("NATIONAL GRASSLAND") > -1) || (label.toUpperCase().indexOf("WILDERNESS") > -1)))
						loadFindBoundaries(label, findCombo.store.data[i].location.x, findCombo.store.data[i].location.y, findCombo.store.data[i].attributes.Priority); // load findObj
					else
						zoomToFindLocation(label, findCombo.store.data[i].location.x, findCombo.store.data[i].location.y, findCombo.store.data[i].attributes.Priority);
					break;
				}
			}
		}
		if (!found) {
			if (value.indexOf("County)") > -1)
				value = value.substr(0, value.indexOf(" ("));
			var url;
			if (!calledFromURL)
				url = myFindService + "/findAddressCandidates?f=json&outFields=county,Priority&PlaceName=" + findCombo.get('value');
			else
				url = myFindService + "/findAddressCandidates?f=json&outFields=county,Priority&PlaceName=" + value;
			var XMLHttpRequest = createXMLhttpRequest();
			XMLHttpRequest.onreadystatechange = function () {
				if (XMLHttpRequest.readyState == 4 && XMLHttpRequest.status == 200) {
					try {
						var dataArr = JSON.parse(XMLHttpRequest.response).candidates;
						if (!calledFromURL && dataArr.length > 1) {
							dataArr.sort(sortArrayOfObj("address"));
							dataArr.forEach(function (item, index, obj) {
								item["label"] = item.address;
								// Searching for Counties, remove items that are not county names
								if (value.toUpperCase() == "COUNTY") {
									if (item.attributes.county + " County" != item.address)
										obj.splice(index,1);
								}
								// Searching for National Forests, remove names that are not national forests 
								else if (value.toUpperCase() == "NATIONAL FOREST") {
									if (item.address.toUpperCase().slice(-15, item.address.length) != "NATIONAL FOREST")
										obj.splice(index,1);
								}
								else if (item.attributes.county != "")
									item.address = item.address + " (" + item.attributes.county + " County)";
							});
							require(["dojo/store/Memory"], function (Memory) {
								findStore = new Memory({
									data : dataArr
								});							
								findCombo.set("store", findStore);
								findCombo.loadAndOpenDropDown();
							});
						} else if (dataArr.length > 0) {
							if (findObj==null && ((dataArr[0].address.toUpperCase().slice(-6, dataArr[0].address.length) == "COUNTY") || (dataArr[0].address.toUpperCase().slice(0, 4) == "GMU ") || (dataArr[0].address.toUpperCase().slice(-4, dataArr[0].address.length) == " STL") || (dataArr[0].address.toUpperCase().indexOf(" STL ") > -1) || (dataArr[0].address.toUpperCase().slice(-4, dataArr[0].address.length) == " SWA") || (dataArr[0].address.toUpperCase().indexOf(" SWA ") > -1) || (dataArr[0].address.toUpperCase().slice(-4, dataArr[0].address.length) == " SFU") || (dataArr[0].address.toUpperCase().indexOf(" SFU ") > -1) || (dataArr[0].address.toUpperCase().slice(-4, dataArr[0].address.length) == " WWA") || (dataArr[0].address.toUpperCase().indexOf(" WWA ") > -1) || (dataArr[0].address.toUpperCase().slice(-15, dataArr[0].address.length) == "NATIONAL FOREST") || (dataArr[0].address.toUpperCase().indexOf("NATIONAL GRASSLAND") > -1) || (dataArr[0].address.toUpperCase().indexOf("WILDERNESS") > -1)))
								loadFindBoundaries(dataArr[0].address, dataArr[0].location.x, dataArr[0].location.y, dataArr[0].attributes.Priority); // load findObj
							else
								zoomToFindLocation(dataArr[0].address, dataArr[0].location.x, dataArr[0].location.y, dataArr[0].attributes.Priority);
						} else
							alert(value + " was not found. Please try your search again.", "Note");
					} catch (e) {
						console.log(e.message);
					}
				}
				else if (XMLHttpRequest.status == 404){
					alert("Missing map service "+url,"Data Error");
				}
				else if (XMLHttpRequest.readyState == 4 && XMLHttpRequest.status == 500){
					alert("Had trouble reading "+url+" in findPlace.js/gotoLocation.","Data Error");
				}
			}
			XMLHttpRequest.open("GET", url, true);
			XMLHttpRequest.send();
		}
	}
}