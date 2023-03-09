function setMapLink() {
	// Generate a url to the current map.
	// Called when user clicks on Map Link
	//
	// Google Analytics count how many times Buy License is clicked on
	if (typeof ga === "function"){
		//ga('send', 'event', "map_link", "click", "Map Link", "1");
		if (typeof gtag === "function")gtag('event','click',{'widget_name': 'Map Link','app_name': app});
	}
	
	var len;
	var urlStr = window.location.href;
	// Array of all url name/value pairs
	var urlArr = urlStr.split("&");
	// Build the string in url. Put the machine name and index.html
	var url = urlArr[0];
	// If index.html is missing add the default app.
	if (url.indexOf("index.html") == -1) url += "index.html?app=huntingatlas";
	if (url.indexOf("app") == -1) url += "?app=huntingatlas";
	
	// Add any other name/value pairs besides extent, point, poly, text, rect, line, hb1298, and layer.
	for (var i=1; i<urlArr.length; i++) {
		if ((urlArr[i].indexOf("extent") == -1) &&
			(urlArr[i].indexOf("prj") == -1) &&
			(urlArr[i].indexOf("point") == -1) &&
			(urlArr[i].indexOf("poly") == -1) &&
			(urlArr[i].indexOf("text") == -1) &&
			(urlArr[i].indexOf("rect") == -1) &&
			(urlArr[i].indexOf("line") == -1) &&
			(urlArr[i].indexOf("hb1298") == -1) &&
			(urlArr[i].indexOf("layer") == -1))
			url += "&"+urlArr[i];
	}
	len = url.length;
	url += "&prj="+wkid; // projection
	
	// Extent
	url += mlGetExtent();
	document.getElementById("mapLinkTxt").value = url;
	document.getElementById("extMLckb").checked = true;
	document.getElementById("extMLckb").disabled=false;
	document.getElementById("extMapLinkLen").value = url.length - len;
	len = url.length;
	
	// Points
	var pointStr = mlGetPoints();
	if (!pointStr) pointStr=""; // returns null if no points.
	if (typeof getHB1298Points === "function") pointStr += getHB1298Points();
	if (pointStr && pointStr != "") {
		url += pointStr;
		document.getElementById("ptMLckb").checked=true;
		document.getElementById("ptMLckb").disabled=false;
		document.getElementById("ptMLtxt").style.color="#000";
		document.getElementById("ptMapLinkLen").value = url.length - len;
		len = url.length;
	}
	else {
		document.getElementById("ptMLckb").disabled=true;
		document.getElementById("ptMLtxt").style.color="#ccc";
	}
	
	// Polygons
	var polyStr = mlGetPolys();
	if (polyStr) {
		url += polyStr;
		document.getElementById("polyMLckb").checked=true;
		document.getElementById("polyMLckb").disabled=false;
		document.getElementById("polyMLtxt").style.color="#000";
		document.getElementById("polyMapLinkLen").value = url.length - len;
		len = url.length;
	}
	else {
		document.getElementById("polyMLckb").disabled=true;
		document.getElementById("polyMLtxt").style.color="#ccc";
	}
	
	// Labels
	if (drawTextGraphicsCount.length > 0) {
		url += mlGetText();
		document.getElementById("txtMLckb").checked=true;
		document.getElementById("txtMLckb").disabled=false;
		document.getElementById("txtMLtxt").style.color="#000";
		document.getElementById("txtMapLinkLen").value = url.length - len;
		len = url.length;
	}
	else {
		document.getElementById("txtMLckb").disabled=true;
		document.getElementById("txtMLtxt").style.color="#ccc";
	}
	
	// Lines
	var lineStr = mlGetLines();
	if (lineStr) {
		url += lineStr;
		document.getElementById("lineMLckb").checked=true;
		document.getElementById("lineMLckb").disabled=false;
		document.getElementById("lineMLtxt").style.color="#000";
		document.getElementById("lineMapLinkLen").value = url.length - len;
		len = url.length;
	}
	else {
		document.getElementById("lineMLckb").disabled=true;
		document.getElementById("lineMLtxt").style.color="#ccc";
	}
	
	// Layers
	url+=mlGetLayers();
	document.getElementById("layMLckb").checked = true;
	document.getElementById("layMLckb").disabled=false;
	document.getElementById("layMLtxt").style.color="black";
	document.getElementById("layMapLinkLen").value = url.length - len;
	len = url.length;
	
	// Rectangles
	var rectStr = mlGetRect();
	if (rectStr) {
		url += rectStr;
		document.getElementById("rectMLckb").checked=true;
		document.getElementById("rectMLckb").disabled=false;
		document.getElementById("rectMLtxt").style.color="#000";
		document.getElementById("rectMapLinkLen").value = url.length - len;
		len = url.length;
	}
	else {
		document.getElementById("rectMLckb").disabled=true;
		document.getElementById("rectMLtxt").style.color="#ccc";
	}
	
	url=url.replace(/ /g,"%20");
	document.getElementById("mapLinkLen").value = url.length;
	document.getElementById("mapLinkTxt").value = url;
	if (url.length > 2048) document.getElementById("mapLinkWarning").style.display = "block";
	else document.getElementById("mapLinkWarning").style.display = "none";
	document.getElementById("mapLinkTxt").focus();
	mapLinkDialog.show();
}

function mlGetExtent() {
	return "&extent="+parseInt(map.extent.xmin)+","+parseInt(map.extent.ymin)+","+parseInt(map.extent.xmax)+","+parseInt(map.extent.ymax);
}

function mlGetText() {
	// &text=x|y|text|font|font size|color|bold as t or f|italic as t or f|underline as t or f
	var url = null;
	var singleQuote = /'/g;
	var doubleQuote = /"/g;
	for (var i=0; i<drawTextGraphicsCount.length; i++) {
		var layer = map.getLayer(drawTextGraphicsCount[i]).graphics[0];
		if (i>0) url += ",";
		else url = "&text=";
		var str = layer.symbol.text.replace(singleQuote,"\\%27").replace(doubleQuote,"\\%22").replace(/,/g,";");
		url += parseInt(layer.geometry.x) + "|"	+ parseInt(layer.geometry.y) + "|" + str + "|"	+ "0|" + parseInt(layer.symbol.font.size) + "|0|t|f|f";
	}
	return url;
}

function mlGetPoints() {
	// New format: &point=size|color|x|y|label
	//		where size=s,m,l
	//		color=r,g,b,y
	//		x,y are in default map projection
	// Old format: 
	//		&point=circle|size|color|alpha(transparency)|outline color|outline width|x|y
	//   	|text|font|font size|color|bold as t or f|italic as t or f|underline as t or f|placement|offset, next point...
	// 		&point=circle|10|4173788|1|0|1|-11713310|4743885|480;779; 4;333;990|1|12|4173788|t|f|f|above|5
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
		// Old format
		//url += "circle|" +layer.symbol.size+ "|" +rgb[0]+";"+rgb[1]+";"+rgb[2]+ "|0.6|h" + layer.symbol.outline.color.toHex().substr(1)+"|1|"
		//	+ parseInt(layer.geometry.x) + "|"
		//	+ parseInt(layer.geometry.y);
		// If Label
		if (map.getLayer(drawGraphicsCount[i]).graphics[1]) {
			layer = map.getLayer(drawGraphicsCount[i]).graphics[1].symbol.text;
			url +=  "|" +layer.replace(singleQuote,"\\%27").replace(doubleQuote,"\\%22").replace(/,/g,";");
			//+ "|"+ "0|" + parseInt(layer.symbol.font.size) + "|0|t|f|f";
		}
		//else url+="|Way%20Point";
	}
	return url;
}

function mlGetLines() {
	// &line= style | color | alpha | lineWidth | number of paths | [number of points | x | y | x | y |... repeat for each path] 
	// |x|y|label|font|font-size|color|bold|italic|underline|placement|offset, repeat for each line
	// &line=solid|4173788|1|5|1|3|-11900351|4800983|-11886749|4805344|-11883462|4812449|-11891907|4806716|Length: 10.5 mi|1|12|4173788|t|f|f|above|5
	var url = null;
	var singleQuote = /'/g;
	var doubleQuote = /"/g;
	for (var i=0; i<drawGraphicsCount.length; i++) {
		var layer = map.getLayer(drawGraphicsCount[i]).graphics[0];
		if (layer.geometry.type != "polyline") continue;
		if (!url) url = "&line=";
		if (url != "&line=") url += ",";
		var rgb = layer.symbol.color.toRgb();
		url += "solid|" +rgb[0]+";"+rgb[1]+";"+rgb[2]+ "|1|2|"+layer.geometry.paths.length;
		for (j=0; j<layer.geometry.paths.length; j++){ // number of paths
			url += "|"+layer.geometry.paths[j].length; // number of points
			for (k=0; k<layer.geometry.paths[j].length; k++){ // add x|y
				url +="|"+ parseInt(layer.geometry.paths[j][k][0]) + "|" + parseInt(layer.geometry.paths[j][k][1]);
			}
		}
		// If Label
		if (map.getLayer(drawGraphicsCount[i]).graphics[1]) {
			layer = map.getLayer(drawGraphicsCount[i]).graphics[1];
			url +=  "|" +parseInt(layer.geometry.x)+ "|" +parseInt(layer.geometry.y)+ "|" +layer.symbol.text.replace(singleQuote,"\\%27").replace(doubleQuote,"\\%22").replace(/,/g,";") + "|"	+ "0|" + parseInt(layer.symbol.font.size) + "|0|t|f|f";
		}
		rgb = null;
	}
	return url;
}

function mlGetPolys() {
	// &poly=  fillStyle | fillColor | fillAlpha | lineStyle | lineColor | lineWidth | 
	// number of rings | number of points | x | y | x | y |... repeat for each ring , repeat for each polygon
	// fillAlpha is now in fillColor, lineStyle = solid, lineWidth = 2
	var url = null;
	var singleQuote = /'/g;
	var doubleQuote = /"/g;
	for (var i=0; i<drawGraphicsCount.length; i++) {
		var layer = map.getLayer(drawGraphicsCount[i]).graphics[0];
		if (layer.geometry.type != "polygon") continue;
		// make sure it is not a rectangle
		var ext = layer.geometry.getExtent();
		var extArr = [ext.xmin,ext.xmax,ext.ymin,ext.ymax];
		var rectFlag = true;
		for (j=0; j<layer.geometry.rings[0].length; j++){
			if (extArr.indexOf(layer.geometry.rings[0][j][0]) == -1) { rectFlag = false; break; }
			else if (extArr.indexOf(layer.geometry.rings[0][j][1]) == -1) { rectFlag = false; break; }
		}
		if (rectFlag) continue;
		if (!url) url = "&poly=";
		if (url != "&poly=") url += ",";
		var rgba = layer.symbol.color.toRgba();
		var outlineRgb = layer.symbol.outline.color.toRgb();
		url += layer.symbol.style+"|" +rgba[0]+";"+rgba[1]+";"+rgba[2]+";"+rgba[3]+ "|-1|solid|" +outlineRgb[0]+";"+outlineRgb[1]+";"+outlineRgb[2]+ "|"+layer.symbol.outline.width+"|"+layer.geometry.rings.length;
		for (j=0; j<layer.geometry.rings.length; j++){ // number of rings
			url += "|"+layer.geometry.rings[j].length; // number of points
			for (k=0; k<layer.geometry.rings[j].length; k++){ // add x|y
				url +="|"+ parseInt(layer.geometry.rings[j][k][0]) + "|" + parseInt(layer.geometry.rings[j][k][1]);
			}
		}
		// If Label
		if (map.getLayer(drawGraphicsCount[i]).graphics[1]) {
			layer = map.getLayer(drawGraphicsCount[i]).graphics[1];
			url +=  "|" +parseInt(layer.geometry.x)+ "|" +parseInt(layer.geometry.y)+ "|" +layer.symbol.text.replace(singleQuote,"\\%27").replace(doubleQuote,"\\%22").replace(/,/g,";") + "|" + "0|" + parseInt(layer.symbol.font.size) + "|0|t|f|f";
		}
		rgba = null;
		outlineRgb = null;
	}
	return url;
}

function mlGetRect() {
	// &rect= fillStyle | fillColor | fillAlpha | lineStyle | lineColor | lineWidth | 
	// 			xMin | yMin | xMax | yMax | label stuff...
	var url = null;
	var singleQuote = /'/g;
	var doubleQuote = /"/g;
	for (var i=0; i<drawGraphicsCount.length; i++) {
		var layer = map.getLayer(drawGraphicsCount[i]).graphics[0];
		if (layer.geometry.type != "polygon") continue;
		// make sure it is a rectangle
		var ext = layer.geometry.getExtent();
		var extArr = [ext.xmin,ext.xmax,ext.ymin,ext.ymax];
		var rectFlag = true;
		for (j=0; j<layer.geometry.rings[0].length; j++){
			if (extArr.indexOf(layer.geometry.rings[0][j][0]) == -1) { rectFlag = false; break; }
			else if (extArr.indexOf(layer.geometry.rings[0][j][1]) == -1) { rectFlag = false; break; }
		}
		if (!rectFlag) continue;
		if (!url) url = "&rect=";
		if (url != "&rect=") url += ",";
		var rgba = layer.symbol.color.toRgba();
		var outlineRgb = layer.symbol.outline.color.toRgb();
		url += layer.symbol.style+"|" +rgba[0]+";"+rgba[1]+";"+rgba[2]+";"+rgba[3]+ "|-1|solid|" +outlineRgb[0]+";"+outlineRgb[1]+";"+outlineRgb[2]+ "|"+layer.symbol.outline.width;
		for (j=0; j<layer.geometry.rings.length; j++){ // number of rings
			for (k=0; k<layer.geometry.rings[j].length; k++){ // add x|y
				url +="|"+ parseInt(layer.geometry.rings[j][k][0]) + "|"+ parseInt(layer.geometry.rings[j][k][1]);
			}
		}
		// If Label
		if (map.getLayer(drawGraphicsCount[i]).graphics[1]) {
			layer = map.getLayer(drawGraphicsCount[i]).graphics[1];
			url +=  "|" +parseInt(layer.geometry.x)+ "|" +parseInt(layer.geometry.y)+ "|" +layer.symbol.text.replace(singleQuote,"\\%27").replace(doubleQuote,"\\%22").replace(/,/g,";") + "|" + "0|" + parseInt(layer.symbol.font.size) + "|0|t|f|f";
		}
		rgba = null;
		outlineRgb = null;
	}
	return url;
}

function mlGetLayers() {
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
}

function mlCheckbox(ckb,value) {
	var str = document.getElementById("mapLinkTxt").value;
	var url = "";
	// Checked add the parameters
	if (ckb.checked) {
		if (value == "extent") url = str + mlGetExtent();
		else if (value == "layer") url = str + mlGetLayers();
		else if (value == "text") url = str + mlGetText();
		else if (value == "point") {
			var pts = mlGetPoints();
			if (!pts) pts="";
			url = str + pts;
			if (typeof getHB1298Points === "function") url += getHB1298Points();
		}
		else if (value == "line") url = str + mlGetLines();
		else if (value == "poly") url = str + mlGetPolys();
		else if (value == "rect") url = str + mlGetRect();
	}
	// Unchecked remove the parameters
	else {
		var arr = str.split("&");
		for (var i=0; i<arr.length; i++) {
			if (arr[i].indexOf(value) == -1) {
				if (url != "") url += "&";
				url += arr[i];
			}
		}
	}
	if (url.length > 2048) document.getElementById("mapLinkWarning").style.display = "block";
	else document.getElementById("mapLinkWarning").style.display = "none";
	document.getElementById("mapLinkTxt").value = url;
	document.getElementById("mapLinkLen").value = url.length;
	document.getElementById("mapLinkTxt").focus();
}

function showMapExtent(){
// For "Display Extent" button beside the Print button
// Displays current extent in the projection set in Settings
	require(["esri/geometry/Point", "esri/geometry/webMercatorUtils"], function(Point,webMercatorUtils){
		function projectExtent(outSR, label) {
			// Display current extent for in UTM projection as set in Settings
			require(["esri/tasks/ProjectParameters","esri/geometry/Extent","esri/SpatialReference"], function(ProjectParameters,Extent,SpatialReference) {
				var params = new ProjectParameters();
				params.geometries = [new Extent(map.extent.xmin, map.extent.ymin, map.extent.xmax, map.extent.ymax, new SpatialReference({wkid:wkid}))];
				params.outSR = new SpatialReference(Number(outSR));
				geometryService.project(params, function (feature) {
					alert(feature[0].xmin.toFixed(0)+", "+feature[0].ymin.toFixed(0)+", "+feature[0].xmax.toFixed(0)+", "+feature[0].ymax.toFixed(0)+" <br/>in "+label+"<p>Note: Coordinate format can be changed in Settings.</p>","Current Map Extent");
					params = null;
				}, function (err) {
					alert("Problem projecting points. Can't display extent. Error message: "+err.message,"Warning");
					params = null;
				});
			});
		}
		var minPt, maxPt;
		switch(settings.XYProjection) {
			case "dd":
				minPt = webMercatorUtils.webMercatorToGeographic(new Point(map.extent.xmin, map.extent.ymin, wkid));
				maxPt = webMercatorUtils.webMercatorToGeographic(new Point(map.extent.xmax, map.extent.ymax, wkid));
				alert(minPt.x.toFixed(5)+", "+minPt.y.toFixed(5)+", "+maxPt.x.toFixed(5)+", "+maxPt.y.toFixed(5)+" <br/>in decimal degrees<p>Note: Coordinate format can be changed in Settings.</p>","Current Map Extent");
				break;
			case "dms":
				minPt = mappoint_to_dms(new Point(map.extent.xmin, map.extent.ymin, wkid),false); // found in utilFunc.js. false means do add a zero in front of min
				maxPt = mappoint_to_dms(new Point(map.extent.xmax, map.extent.ymax, wkid),false);
				alert(minPt[0]+", "+minPt[1]+", "+maxPt[0]+", "+maxPt[1]+" <br/>in degrees, minutes, seconds<p>Note: Coordinate format can be changed in Settings.</p>","Current Map Extent");
				break;
			case "dm":
				minPt = mappoint_to_dm(new Point(map.extent.xmin, map.extent.ymin, wkid),false); // found in utilFunc.js. false means do add a zero in front of min
				maxPt = mappoint_to_dm(new Point(map.extent.xmax, map.extent.ymax, wkid),false);
				alert(minPt[0]+", "+minPt[1]+", "+maxPt[0]+", "+maxPt[1]+" <br/>in degrees, decimal minutes<p>Note: Coordinate format can be changed in Settings.</p>","Current Map Extent");
				break;
			case "32612":
				projectExtent(32612,"WGS84 UTM Zone 12N");
				break;
			case "32613":
				projectExtent(32613,"WGS84 UTM Zone 13N");
				break;
			case "26912":
				projectExtent(26912,"NAD83 UTM Zone 12N");
				break;
			case "26913":
				projectExtent(26913,"NAD83 UTM Zone 13N");
				break;
			case "26712":
				projectExtent(26712,"NAD27 UTM Zone 12N");
				break;
			case "26713":
				projectExtent(26713,"NAD27 UTM Zone 13N");
				break;
		}
	});
}