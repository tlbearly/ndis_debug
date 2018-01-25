var toolbar;
var labelPoint;
var drawText=false;
function drawInit() {
  require (["dojo/dom",
	"dijit/registry",
	"dojo/_base/lang",
	"dojo/_base/Color",
	"esri/toolbars/draw",
	"esri/graphic",
	  "dojo/json",
	  "esri/config",
	  "esri/map",
	  "esri/graphic",
	  "esri/geometry/Geometry",
	  "esri/geometry/Extent",
	  "esri/SpatialReference",
	  "esri/tasks/GeometryService",
	  "esri/tasks/LengthsParameters",
	  "esri/tasks/AreasAndLengthsParameters",
	  "esri/layers/FeatureLayer",
	  "esri/renderers/SimpleRenderer",
	  "esri/symbols/SimpleLineSymbol",
	  "esri/symbols/SimpleFillSymbol",
	  "esri/symbols/SimpleMarkerSymbol",
	  "esri/layers/GraphicsLayer",
	  "dijit/form/Select",
	  "esri/geometry/Point",
	  "esri/geometry/webMercatorUtils"
	  ], 
  function (dom,registry,lang,Color,Draw,graphic,json, esriConfig, Map, Graphic, Geometry, Extent, SpatialReference, GeometryService, 
    LengthsParameters, AreasAndLengthsParameters, FeatureLayer, SimpleRenderer, SimpleLineSymbol, SimpleFillSymbol,SimpleMarkerSymbol,
	GraphicsLayer, Select, Point,webMercatorUtils){
	  //identify proxy page to use if the toJson payload to the geometry service is greater than 2000 characters.
      //If this null or not available the project and lengths operation will not work.  Otherwise it will do a http post to the proxy.
      //esriConfig.defaults.io.proxyUrl = "/proxy/DotNet/proxy.ashx"; // moved to index.html
      //esriConfig.defaults.io.alwaysUseProxy = false;

	  // listen for Draw Widget close. Reset mouse to identify.
	  dom.byId("drawDiv").addEventListener('click',function(event){
			if (!registry.byId("drawDiv").open) drawExit();
	  });
	  // Populate the point style drop down on draw widget
      var point = new Select({
		name: "pointStyle",
		id: "pointStyle",
		labelAttr: "label",
		style: "width:140px",
		options: [
			{ label: "<img width='30px' height='30px' align='middle' style='vertical-align:middle;display:inline-block;' src='assets/images/ptsmblue.png'/>small blue", value: "smblue" },
			{ label: "<img width='30px' height='30px' align='middle' style='vertical-align:middle;display:inline-block;' src='assets/images/ptsmgreen.png'/>small green", value: "smgreen" },
			{ label: "<img width='30px' height='30px' align='middle' style='vertical-align:middle;display:inline-block;' src='assets/images/ptsmgray.png'/>small gray", value: "smgray" },
			{ label: "<img width='30px' height='30px' align='middle' style='vertical-align:middle;display:inline-block;' src='assets/images/ptsmred.png'/>small red", value: "smred" },
			{ type: "separator" },
			{ label: "<img width='30px' height='30px' align='middle' style='vertical-align:middle;display:inline-block;' src='assets/images/ptmedblue.png'/>medium blue", value: "medblue" },
			{ label: "<img width='30px' height='30px' align='middle' style='vertical-align:middle;display:inline-block;' src='assets/images/ptmedgreen.png'/>medium green", value: "medgreen" },
			{ label: "<img width='30px' height='30px' align='middle' style='vertical-align:middle;display:inline-block;' src='assets/images/ptmedgray.png'/>medium gray", value: "medgray" },
			{ label: "<img width='30px' height='30px' align='middle' style='vertical-align:middle;display:inline-block;' src='assets/images/ptmedred.png'/>medium red", value: "medred" },
			{ type: "separator" },
			{ label: "<img width='30px' height='30px' align='middle' style='vertical-align:middle;display:inline-block;' src='assets/images/ptlgblue.png'/>large blue", value: "lgblue" },
			{ label: "<img width='30px' height='30px' align='middle' style='vertical-align:middle;display:inline-block;' src='assets/images/ptlggreen.png'/>large green", value: "lggreen" },
			{ label: "<img width='30px' height='30px' align='middle' style='vertical-align:middle;display:inline-block;' src='assets/images/ptlggray.png'/>large gray", value: "lggray" },
			{ label: "<img width='30px' height='30px' align='middle' style='vertical-align:middle;display:inline-block;' src='assets/images/ptlgred.png'/>large red", value: "lgred" }
		]
	  }, "pointStyleDiv");
	  point.startup();
	  point.set( 'value', 'medblue' );
	  
	  var pointUnits = new Select({
		name: "pointUnits",
		id: "pointUnits",
		labelAttr: "label",
		options: [
			{ label: "Decimal degrees", value:"dd" },
			{ label: "Degrees, minutes, seconds", value:"dms" },
			{ label: "Degrees, decimal minutes", value:"dm" },
			{ label: "WGS84 UTM Zone 12N", value:"32612" },
			{ label: "WGS84 UTM Zone 13N", value:"32613" },
			{ label: "NAD83 UTM Zone 12N", value:"26912" },
			{ label: "NAD83 UTM Zone 13N", value:"26913"},
			{ label: "NAD27 UTM Zone 12N", value:"26712" },
			{ label: "NAD27 UTM Zone 13N", value:"26713" }
		]
	  }, "pointXYUnits");
	  pointUnits.startup();
	  // Set selected projection option
	  pointUnits.set("value", settings.XYProjection);
	  pointUnits.on("change", updateExamples);

	  // Populate the line style drop down on draw widget
      var line = new Select({
		name: "lineStyle",
		id: "lineStyle",
		labelAttr: "label",
		style: "width:95px",
		options: [
			{ label: "<img width='30px' height='30px' align='middle' style='vertical-align:middle;display:inline-block;' src='assets/images/blueline.png'/> blue ", value: "blue" },
			{ label: "<img width='30px' height='30px' align='middle' style='vertical-align:middle;display:inline-block;' src='assets/images/greenline.png'/> green ", value: "green" },
			{ label: "<img width='30px' height='30px' align='middle' style='vertical-align:middle;display:inline-block;' src='assets/images/grayline.png'/> gray ", value: "gray" },
			{ label: "<img width='30px' height='30px' align='middle' style='vertical-align:middle;display:inline-block;' src='assets/images/redline.png'/> red ", value: "red" }
		]
	  }, "lineStyleDiv");
	  line.startup();
	  
	   var lineDistance = new Select({
		name: "lineDistCB",
		id: "lineDistCB",
		labelAttr: "label",
		options: [
			{ label: "Miles", value: GeometryService.UNIT_STATUTE_MILE },
			{ label: "Feet", value: GeometryService.UNIT_FOOT },
			{ label: "Kilometers", value: GeometryService.UNIT_KILOMETER },
			{ label: "Meters", value: GeometryService.UNIT_METER }
		]
	  }, lineLengthDiv);
	  lineDistance.startup();
	  
	  // Populate the polygon fill style drop down on draw widget
      var s = new Select({
		name: "fillStyle",
		id: "fillStyle",
		labelAttr: "label",
		options: [
			{ label: "<img width='30px' height='30px' align='middle' style='vertical-align:middle;display:inline-block;' src='assets/images/solidblue.png'/> solid blue", value: "solid blue" },
			{ label: "<img width='30px' height='30px' align='middle' style='vertical-align:middle;display:inline-block;' src='assets/images/solidgreen.png'/> solid green", value: "solid green" },
			{ label: "<img width='30px' height='30px' align='middle' style='vertical-align:middle;display:inline-block;' src='assets/images/solidgray.png'/> solid gray", value: "solid gray" },
			{ label: "<img width='30px' height='30px' align='middle' style='vertical-align:middle;display:inline-block;' src='assets/images/solidred.png'/> solid red", value: "solid red" },
			{ type: "separator" },
			{ label: "<img width='30px' height='30px' align='middle' style='vertical-align:middle;display:inline-block;' src='assets/images/diagonalblue.png'/> diagonal blue", value: "diagonal blue" },
			{ label: "<img width='30px' height='30px' align='middle' style='vertical-align:middle;display:inline-block;' src='assets/images/diagonalgreen.png'/> diagonal green", value: "diagonal green" },
			{ label: "<img width='30px' height='30px' align='middle' style='vertical-align:middle;display:inline-block;' src='assets/images/diagonalgray.png'/> diagonal gray", value: "diagonal gray" },
			{ label: "<img width='30px' height='30px' align='middle' style='vertical-align:middle;display:inline-block;' src='assets/images/diagonalred.png'/> diagonal red", value: "diagonal red" }
			]
	  }, "fillStyleDiv");
	  s.startup();
	  
	  var area = new Select({
		name: "areaCB",
		id: "areaCB",
		labelAttr: "label",
		options: [
			{ label: "Acres", value: GeometryService.UNIT_ACRES },
			{ label: "Square miles", value: GeometryService.UNIT_SQUARE_MILES },
			{ label: "Square feet", value: GeometryService.UNIT_SQUARE_FEET },
			{ label: "Hectares", value: GeometryService.UNIT_HECTARES },
			{ label: "Square kiometers", value: GeometryService.UNIT_SQUARE_KILOMETERS },
			{ label: "Square meters", value: GeometryService.UNIT_SQUARE_METERS }
		]
	  }, areaDiv);
	  area.startup();
	  
	  var distance = new Select({
		name: "distCB",
		id: "distCB",
		labelAttr: "label",
		options: [
			{ label: "Miles", value: GeometryService.UNIT_STATUTE_MILE },
			{ label: "Feet", value: GeometryService.UNIT_FOOT },
			{ label: "Kilometers", value: GeometryService.UNIT_KILOMETER },
			{ label: "Meters", value: GeometryService.UNIT_METER }
		]
	  }, lengthDiv);
	  distance.startup();
  
	  // Populate the point style drop down on draw widget
      var textSty = new Select({
		name: "textStyle",
		id: "textStyle",
		labelAttr: "label",
		options: [
			{ label: "Tiny", value: ".55em" },
			{ label: "Small", value: ".8em" },
			{ label: "Medium", value: "1em" },
			{ label: "Large", value: "1.2em" },
			{ label: "Larger", value: "1.5em" },
			{ label: "Giant", value: "2.55em" }
		]
	  }, "textStyleDiv");
	  textSty.startup();
	  textSty.set( 'value', '1em' );
	  
	  // Enter way point by drop down list
	  var ptMethod = new Select({
		name: "ptMethodCB",
		id: "ptMethodCB",
		labelAttr: "label",
		options: [
			{ label: "Map click", value: "map" },
			{ label: "XY value", value: "xy" },
			{ label: "Multiple XYs", value: "multi" },
			{ label: "Current location", value: "loc" }
		],
		onChange: function(){
			switch(this.attr("value"))
			{
				case "map":
					document.getElementById('xyDiv').style.display='none';
					document.getElementById('multixyDiv').style.display='none';
					document.getElementById('locationDiv').style.display='none';
					break;
				case "xy":
					document.getElementById('xyDiv').style.display='block';
					document.getElementById('multixyDiv').style.display='none';
					document.getElementById('locationDiv').style.display='none';
					break;
				case "multi":
					document.getElementById('xyDiv').style.display='none';
					document.getElementById('multixyDiv').style.display='block';
					document.getElementById('locationDiv').style.display='none';
					break;
				case "loc":
					document.getElementById('xyDiv').style.display='none';
					document.getElementById('multixyDiv').style.display='none';
					document.getElementById('locationDiv').style.display='block';
					break;
			}
		}
	  }, "ptMethod");
	  ptMethod.startup();
	  
	toolbar = new Draw(map, {showTooltips:true});
    toolbar.on("draw-end", lang.hitch(map, getAreaAndLength));
  
    geometryService.on("areas-and-lengths-complete", outputAreaAndLength);
	geometryService.on("lengths-complete", outputLength);

	function updateExamples(evtObj) {
		registry.byId("settings_xy_proj").set("value",registry.byId("pointUnits").value); // update default projection in Settings Widget
		registry.byId("help_xy_proj").set("value",registry.byId("pointUnits").value); // update default projection in Find a Place Help Dialog
		if (registry.byId("pointUnits").value == "dd"){
			document.getElementById("xyInstruct").innerHTML = "Lat N: 40.24567 Long W: 103.24501";
			document.getElementById("multixyInstruct").innerHTML = "40.24,103,39.3456,104.4";
			document.getElementById("ddDiv").style.display = "block";
			document.getElementById("dmsDiv").style.display = "none";
			document.getElementById("dmDiv").style.display = "none";
			document.getElementById("utmDiv").style.display = "none";
		}
		else if (registry.byId("pointUnits").value == "dms"){
			document.getElementById("xyInstruct").innerHTML = "Lat N: 41 32 4.267 Long W: 103 20 24.5";
			document.getElementById("multixyInstruct").innerHTML = "41:0:4.267,103:0:3,40:0:0,104:30:2";
			document.getElementById("ddDiv").style.display = "none";
			document.getElementById("dmsDiv").style.display = "block";
			document.getElementById("dmDiv").style.display = "none";
			document.getElementById("utmDiv").style.display = "none";
		}
		else if (registry.byId("pointUnits").value == "dm"){
			document.getElementById("xyInstruct").innerHTML = "Lat N: 41 0.345 Long W: 103 20.5";
			document.getElementById("multixyInstruct").innerHTML = "41:0.34,103:0,40:10,104:2.35";
			document.getElementById("ddDiv").style.display = "none";
			document.getElementById("dmsDiv").style.display = "none";
			document.getElementById("dmDiv").style.display = "block";
			document.getElementById("utmDiv").style.display = "none";
		}
		else {
			document.getElementById("xyInstruct").innerHTML = "Easting: 320000 Northing: 4300000";
			document.getElementById("multixyInstruct").innerHTML = "320000,4300000,400300,4320000";
			document.getElementById("ddDiv").style.display = "none";
			document.getElementById("dmsDiv").style.display = "none";
			document.getElementById("dmDiv").style.display = "none";
			document.getElementById("utmDiv").style.display = "block";
		}
	}
	
    function getAreaAndLength(evtObj) {
      var map = this, geometry = evtObj.geometry;
	  var symbol;
	   
	  switch (geometry.type)
	  {
		case "point":
		{
			var label;
			var point = new Point(geometry.x, geometry.y, map.spatialReference);
			labelPoint = new Graphic(point);
			// adding text
			if (drawText) { 
				// Store graphic layer name so we can remove it later
				drawTextGraphicsLayer = new GraphicsLayer();
				drawTextGraphicsLayer.id = "drawtextgraphics"+drawTextGraphicsCounter;
				drawTextGraphicsCount.push(drawTextGraphicsLayer.id);
				drawTextGraphicsCounter++;
				document.getElementById("clearText").style.visibility = "visible";
				
				var fontsize = registry.byId("textStyle").value;
				label = document.getElementById("drawlabel").value;
				addLabel(labelPoint, label, drawTextGraphicsLayer, fontsize);
				//map.addLayer(drawGraphicsLayer);
			}
			// adding a point
			else {
				// Store graphic layer name so we can remove it later
				drawGraphicsLayer = new GraphicsLayer();
				drawGraphicsLayer.id = "drawgraphics"+drawGraphicsCounter;
				drawGraphicsCount.push(drawGraphicsLayer.id);
				drawGraphicsCounter++;
				document.getElementById("clearGraphics").style.visibility = "visible";
				addPointSymbol(geometry);
				
				if (!registry.byId("labelXY").checked)
					map.addLayer(drawGraphicsLayer);

				document.getElementById("measurements").style.visibility = "visible";
				document.getElementById("measurements").style.display = "block";
				dom.byId("area").innerHTML = "";
				// Label with custom text
				if (registry.byId("radioLabelCustom").checked && document.getElementById("customXYlabel").value != "") {
					label = document.getElementById("customXYlabel").value;
					if (registry.byId("labelXY").checked) addLabel(labelPoint, label, drawGraphicsLayer, "11pt");
					if (registry.byId("pointUnits").value == "dd") {
						var mp = webMercatorUtils.webMercatorToGeographic(point);
						label = mp.y.toFixed(5)+" N, "+mp.x.toFixed(5)*-1+" W"; 
						dom.byId("length").innerHTML = "Lat, Long: "+label;
					}
					// degress, decimal minutes
					else if (registry.byId("pointUnits").value == "dm"){
						xy = mappoint_to_dm(point,false); // found in utilFunc.js. false means do add a zero in front of min
						label = xy[0]+" N, "+xy[1]+" W"; 
						dom.byId("length").innerHTML = "Lat, Long: "+label;
					}
					// deg, min, sec
					else if (registry.byId("pointUnits").value == "dms") {
						xy = mappoint_to_dms(point,false); // found in utilFunc.js. false means do add a zero in front of min
						label = xy[0]+" N, "+xy[1]+" W"; 
						dom.byId("length").innerHTML = "Lat, Long: "+label;
					}
					// utm
					else {
						// convert point to selected projection
						require(["esri/tasks/ProjectParameters"], function(ProjectParameters) {
							var params = new ProjectParameters();
							params.geometries = [labelPoint.geometry];
							params.outSR = new SpatialReference(Number(registry.byId("pointUnits").value));
							geometryService.project(params, function (feature) {
								label = feature[0].x.toFixed(0) +", " +feature[0].y.toFixed(0);
								dom.byId("length").innerHTML = "UTM: "+label;
								params = null;
							}, function (err) {
								alert("Problem projecting point. "+err.message,"Warning");
								params = null;
							});
						});
					}
				}
				// Label with XY Coordinate
				else {
					// decimal degrees
					if (registry.byId("pointUnits").value == "dd") {
						var mp = webMercatorUtils.webMercatorToGeographic(point);
						label = mp.y.toFixed(5)+" N, "+mp.x.toFixed(5)*-1+" W"; 
						if (registry.byId("labelXY").checked) addLabel(labelPoint, label, drawGraphicsLayer, "11pt");
						dom.byId("length").innerHTML = "Lat, Long: "+label;
					}
					// degress, decimal minutes
					else if (registry.byId("pointUnits").value == "dm"){
						xy = mappoint_to_dm(point,false); // found in utilFunc.js. false means do add a zero in front of min
						label = xy[0]+" N, "+xy[1]+" W"; 
						if (registry.byId("labelXY").checked) addLabel(labelPoint, label, drawGraphicsLayer, "11pt");
						dom.byId("length").innerHTML = "Lat, Long: "+label;
					}
					// deg, min, sec
					else if (registry.byId("pointUnits").value == "dms") {
						xy = mappoint_to_dms(point,false); // found in utilFunc.js. false means do add a zero in front of min
						label = xy[0]+" N, "+xy[1]+" W"; 
						if (registry.byId("labelXY").checked) addLabel(labelPoint, label, drawGraphicsLayer, "11pt");
						dom.byId("length").innerHTML = "Lat, Long: "+label;
					}
					// utm
					else {
						// converts point to selected projection
						require(["esri/tasks/ProjectParameters"], function(ProjectParameters) {
							var params = new ProjectParameters();
							params.geometries = [labelPoint.geometry];
							params.outSR = new SpatialReference(Number(registry.byId("pointUnits").value));
							geometryService.project(params, function (feature) {
								label = feature[0].x.toFixed(0) +", " +feature[0].y.toFixed(0);
								if (registry.byId("labelXY").checked) addLabel(labelPoint, label, drawGraphicsLayer, "11pt"); // in utilFunc.js
								dom.byId("length").innerHTML = "UTM: "+label;
								params = null;
							}, function (err) {
								alert("Problem projecting point. Can't label point."+err.message,"Warning");
								params = null;
							});
						});
					}
				}
			}
			break;
		}
		case "polyline":
		{
			// Store graphic layer name so we can remove it later
			drawGraphicsLayer = new GraphicsLayer();
			drawGraphicsLayer.id = "drawgraphics"+drawGraphicsCounter;
			drawGraphicsCount.push(drawGraphicsLayer.id);
			drawGraphicsCounter++;
			document.getElementById("clearGraphics").style.visibility = "visible";
			if (registry.byId("lineStyle").value.indexOf("blue")>-1)
				symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,200]), 2);
			else if (registry.byId("lineStyle").value.indexOf("green")>-1)
				symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,150,5]), 2);
			else if (registry.byId("lineStyle").value.indexOf("gray")>-1)
				symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([100,100,100]), 2);
			else if (registry.byId("lineStyle").value.indexOf("red")>-1)
				symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,10]), 2);
			drawGraphicsLayer.add(new Graphic(geometry, symbol));
			if (!registry.byId("labelLine").checked)
				map.addLayer(drawGraphicsLayer);
			else{
				labelPoint = new Graphic(new Point((geometry.getExtent().xmax - geometry.getExtent().xmin)/2 + geometry.getExtent().xmin, (geometry.getExtent().ymax - geometry.getExtent().ymin)/2 + geometry.getExtent().ymin, map.spatialReference)); 
			}
			//setup the parameters for the lengths operation
			var lengthParams = new LengthsParameters();
			lengthParams.lengthUnit = registry.byId("lineDistCB").value;
			lengthParams.calculationType = "geodesic";
			geometryService.simplify([geometry], function(simplifiedGeometries) {
				lengthParams.polylines = simplifiedGeometries;
				geometryService.lengths(lengthParams);
			});
			break;
		}
		case "polygon":
		{
			// Store graphic layer name so we can remove it later
			drawGraphicsLayer = new GraphicsLayer();
			drawGraphicsLayer.id = "drawgraphics"+drawGraphicsCounter;
			drawGraphicsCount.push(drawGraphicsLayer.id);
			drawGraphicsCounter++;
			document.getElementById("clearGraphics").style.visibility = "visible";

			if (registry.byId("fillStyle").value.indexOf("solid blue")>-1)
				symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,200]), 2),new Color([0,0,255,0.2]));
			else if (registry.byId("fillStyle").value.indexOf("solid green")>-1)
				symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,150,5]), 2),new Color([0,255,0,0.1]));
			else if (registry.byId("fillStyle").value.indexOf("solid gray")>-1)
				symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([100,100,100]), 2),new Color([100,100,1000,0.1]));
			else if (registry.byId("fillStyle").value.indexOf("solid red")>-1)
				symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,10]), 2),new Color([255,0,0,0.1]));
			else if (registry.byId("fillStyle").value.indexOf("diagonal blue")>-1)
				symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_BACKWARD_DIAGONAL, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,200]), 2),new Color([0,0,255,1.0]));
			else if (registry.byId("fillStyle").value.indexOf("diagonal green")>-1)
				symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_BACKWARD_DIAGONAL, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,150,5]), 2),new Color([0,255,0,1.0]));
			else if (registry.byId("fillStyle").value.indexOf("diagonal gray")>-1)
				symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_BACKWARD_DIAGONAL, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([100,100,100]), 2),new Color([100,100,100,1.0]));
			else if (registry.byId("fillStyle").value.indexOf("diagonal red")>-1)
				symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_BACKWARD_DIAGONAL, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,10]), 2),new Color([255,0,0,1.0]));
			drawGraphicsLayer.add(new Graphic(geometry, symbol));
			if (!registry.byId("labelPoly").checked)
				map.addLayer(drawGraphicsLayer);
			else
				labelPoint = new Graphic(new Point((geometry.getExtent().xmax - geometry.getExtent().xmin)/2 + geometry.getExtent().xmin, geometry.getExtent().ymin, map.spatialReference)); 

			//setup the parameters for the areas and lengths operation
			var areasAndLengthParams = new AreasAndLengthsParameters();
			areasAndLengthParams.lengthUnit = registry.byId("distCB").value; // GeometryService.UNIT_FOOT;
			areasAndLengthParams.areaUnit = registry.byId("areaCB").value; //GeometryService.UNIT_ACRES;
			areasAndLengthParams.calculationType = "geodesic";
			geometryService.simplify([geometry], function(simplifiedGeometries) {
				areasAndLengthParams.polygons = simplifiedGeometries;
				geometryService.areasAndLengths(areasAndLengthParams);
			});
			break;
		}
	  }
      drawExit();
    }

	 function outputLength(evtObj) {
      var result = evtObj.result;
      //console.log(json.stringify(result));
	  document.getElementById("measurements").style.visibility = "visible";
	  document.getElementById("measurements").style.display = "block";
	  dom.byId("area").innerHTML = "";

	   for (var i=0; i<registry.byId("lineDistCB").options.length; i++) {
		if (registry.byId("lineDistCB").options[i].selected) {
			var label = result.lengths[0].toFixed(1) +" "+ registry.byId("lineDistCB").options[i].label;
			dom.byId("length").innerHTML = label;
			// addLabel is in javascript/utilFunc.js
			if (registry.byId("labelLine").checked){
				// Label with custom text
				if (registry.byId("radioLabelLineCustom").checked && document.getElementById("customLineLabel").value != "") 
					label = document.getElementById("customLineLabel").value;
				addLabel(labelPoint, label, drawGraphicsLayer, "11pt");
			}
			break;
		}
	  }
    }
	
    function outputAreaAndLength(evtObj) {
      var result = evtObj.result;
      //console.log(json.stringify(result));
	  document.getElementById("measurements").style.visibility = "visible";
	  document.getElementById("measurements").style.display = "block";
	  var label1,label2;
	  for (var i=0; i<registry.byId("areaCB").options.length; i++) {
		if (registry.byId("areaCB").options[i].selected) {
			label1 = result.areas[0].toFixed(1) +" "+ registry.byId("areaCB").options[i].label;
			dom.byId("area").innerHTML = label1;
			break;
		}
	  }
	  for (i=0; i<registry.byId("distCB").options.length; i++) {
		if (registry.byId("distCB").options[i].selected) {
			label2 = result.lengths[0].toFixed(1) +" "+ registry.byId("distCB").options[i].label;
			dom.byId("length").innerHTML = label2;
			break;
		}
	  }
	  // addLabel is in javascript/utilFunc.js
	  if (registry.byId("labelPoly").checked) {
		if (registry.byId("radioLabelPolyCustom").checked && document.getElementById("customPolyLabel").value != "") {
			label = document.getElementById("customPolyLabel").value;
			addLabel(labelPoint, label, drawGraphicsLayer, "11pt");
		}
		else
			addLabel(labelPoint, label1+" "+label2, drawGraphicsLayer, "11pt");
	  }
    }
 });
}

function addPointSymbol(geometry) {
	require (["dijit/registry","esri/symbols/SimpleLineSymbol",
	"esri/symbols/SimpleMarkerSymbol","esri/graphic","dojo/_base/Color"], 
   function (registry,SimpleLineSymbol,SimpleMarkerSymbol,Graphic,Color){
		// Get the point style from draw point style drop down. Add the point to the map at geometry.
		var symbol;
		// SimpleMarkerSymbol(style, size, SimpleLineSimbol(style, color, width), color);
		if (registry.byId("pointStyle").value.indexOf("smblue")>-1)
			symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,7,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,200]), 1),new Color([0,0,255,0.6]));
		else if (registry.byId("pointStyle").value.indexOf("medblue")>-1)
			symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,14,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,200]), 1),new Color([0,0,255,0.6]));
		else if (registry.byId("pointStyle").value.indexOf("lgblue")>-1)
			symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,21,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,200]), 1),new Color([0,0,255,0.6]));
		else if (registry.byId("pointStyle").value.indexOf("smgreen")>-1)
			symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,7,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,150,5]), 1),new Color([0,255,0,0.6]));
		else if (registry.byId("pointStyle").value.indexOf("medgreen")>-1)
			symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,14,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,150,5]), 1),new Color([0,255,0,0.6]));
		else if (registry.byId("pointStyle").value.indexOf("lggreen")>-1)
			symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,21,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,150,5]), 1),new Color([0,255,0,0.6]));
		else if (registry.byId("pointStyle").value.indexOf("smgray")>-1)
			symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,7,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([100,100,100]), 1),new Color([100,100,100,0.6]));
		else if (registry.byId("pointStyle").value.indexOf("medgray")>-1)
			symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,14,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([100,100,100]), 1),new Color([100,100,100,0.6]));
		else if (registry.byId("pointStyle").value.indexOf("lggray")>-1)
			symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,21,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([100,100,100]), 1),new Color([100,100,100,0.6]));
		else if (registry.byId("pointStyle").value.indexOf("smred")>-1)
			symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,7,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,10]), 1),new Color([255,0,0,0.6]));
		else if (registry.byId("pointStyle").value.indexOf("medred")>-1)
			symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,14,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,10]), 1),new Color([255,0,0,0.6]));
		else if (registry.byId("pointStyle").value.indexOf("lgred")>-1)
			symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,21,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,10]), 1),new Color([255,0,0,0.6]));
		drawGraphicsLayer.add(new Graphic(geometry, symbol));
	});
}

function removeDrawItem(){
	if (drawGraphicsCount.length == 0) return;
	drawGraphicsCounter--;
	var layer = drawGraphicsCount.pop();
	map.removeLayer(map.getLayer(layer));
	// hide the clear button
	if (drawGraphicsCount.length == 0)
		document.getElementById("clearGraphics").style.visibility = "hidden";
}

function removeDrawTextItem(){
	if (drawTextGraphicsCount.length == 0) return;
	drawTextGraphicsCounter--;
	var layer = drawTextGraphicsCount.pop();
	map.removeLayer(map.getLayer(layer));
	// hide the clear button
	if (drawTextGraphicsCount.length == 0)
		document.getElementById("clearText").style.visibility = "hidden";
}
	  
function drawExit(){
	drawing=false;
	drawText=false;
	toolbar.deactivate();
	map.enableMapNavigation();
	// set all buttons to non-selected
	document.getElementById("mappoint").className = "graphBtn";
	document.getElementById("polyline").className = "graphBtn";
	document.getElementById("freehandpolyline").className = "graphBtn";
	document.getElementById("extent").className = "graphBtn";
	document.getElementById("polygon").className = "graphBtn";
	document.getElementById("label").className = "graphBtn";
	document.getElementById("pointOptions").style.display = "none";
	document.getElementById("lineOptions").style.display = "none";
	document.getElementById("fillOptions").style.display = "none";
	document.getElementById("drawlabel").value = "";
	document.getElementById("pointsXY").value = "";
	document.getElementById("pointXdd").value = "";
	document.getElementById("pointYdd").value = "";
	document.getElementById("pointXddm").value = "";
	document.getElementById("pointYddm").value = "";
	document.getElementById("pointXmindm").value = "";
	document.getElementById("pointYmindm").value = "";
	document.getElementById("pointXdeg").value = "";
	document.getElementById("pointYdeg").value = "";
	document.getElementById("pointXmin").value = "";
	document.getElementById("pointYmin").value = "";
	document.getElementById("pointXsec").value = "";
	document.getElementById("pointYsec").value = "";
	document.getElementById("pointX").value = "";
	document.getElementById("pointY").value = "";
}

function activateDrawTool(event){
	// Check if button was already depressed. If so reset to Identify
	if (event.currentTarget.className == "graphBtnSelected") {
		drawExit();
		return;
	}
	drawing = true; // flag to turn off identify in identify.js, doIdentify()
	map.disableMapNavigation();
	// depress the current button
	event.currentTarget.className = "graphBtnSelected";
	// unpress the other buttons
	if (event.currentTarget.id != "mappoint") document.getElementById("mappoint").className = "graphBtn";
	if (event.currentTarget.id != "polyline") document.getElementById("polyline").className = "graphBtn";
	if (event.currentTarget.id != "freehandpolyline") document.getElementById("freehandpolyline").className = "graphBtn";
	if (event.currentTarget.id != "extent") document.getElementById("extent").className = "graphBtn";
	if (event.currentTarget.id != "polygon") document.getElementById("polygon").className = "graphBtn";
	if (event.currentTarget.id != "label") document.getElementById("label").className = "graphBtn";
		
	// hide the point, lines, and fill options until one of the draw buttons is clicked on
	document.getElementById("pointOptions").style.visibility = "visible";
	document.getElementById("lineOptions").style.visibility = "visible";
	document.getElementById("fillOptions").style.visibility = "visible";
	document.getElementById("measurements").style.visibility = "hidden";
	document.getElementById("measurements").style.display = "none";
	
	// activate the current draw tool and show options
	require (["esri/toolbars/draw","dojo/i18n!esri/nls/jsapi"], function (Draw,bundle) {
		if (event.currentTarget.id == "mappoint") {
			document.getElementById("pointOptions").style.display = "block";
			document.getElementById("lineOptions").style.display = "none";
			document.getElementById("fillOptions").style.display = "none";
			bundle.toolbars.draw.addPoint = "Click to add a way point"; // change tooltip
			toolbar.activate(Draw.POINT);
		}
		else if (event.currentTarget.id == "polyline") {
			document.getElementById("pointOptions").style.display = "none";
			document.getElementById("lineOptions").style.display = "block";
			document.getElementById("fillOptions").style.display = "none";
			toolbar.activate(Draw.POLYLINE);
		}
		else if (event.currentTarget.id == "freehandpolyline") {
			document.getElementById("pointOptions").style.display = "none";
			document.getElementById("lineOptions").style.display = "block";
			document.getElementById("fillOptions").style.display = "none";
			toolbar.activate(Draw.FREEHAND_POLYLINE);
		}
		else if (event.currentTarget.id == "extent") {
			document.getElementById("pointOptions").style.display = "none";
			document.getElementById("lineOptions").style.display = "none";
			document.getElementById("fillOptions").style.display = "block";
			bundle.toolbars.draw.addShape="Press down to start and let go to finish"; // change tooltip
			toolbar.activate(Draw.RECTANGLE);
		}
		else if (event.currentTarget.id == "polygon") {
			document.getElementById("pointOptions").style.display = "none";
			document.getElementById("lineOptions").style.display = "none";
			document.getElementById("fillOptions").style.display = "block";
			toolbar.activate(Draw.POLYGON);
		}
		else if (event.currentTarget.id == "label") {
			document.getElementById("pointOptions").style.display = "none";
			document.getElementById("lineOptions").style.display = "none";
			document.getElementById("fillOptions").style.display = "none";
			bundle.toolbars.draw.addPoint = "Click to add a label"; // change tooltip
			drawText = true;
			toolbar.activate(Draw.POINT);
		}
	});
}

function drawPoint(){
  require (["dojo/dom", "dijit/registry", "esri/SpatialReference", "esri/geometry/Point"], 
  function (dom,registry,SpatialReference,Point){

	var inSR, label, myPoint, params, x, y;
	// decimal degrees
	if (registry.byId("pointUnits").value == "dd") {
		x = Number(document.getElementById("pointXdd").value);
		y = Number(document.getElementById("pointYdd").value);
		if (x > 0) x = x*-1;
		if (!(((x >= -110 && x <= -100) || (x >= 100 && x <= 110)) && (y >= 35 && y <= 42))) {
			alert("This point is not in Colorado. Latitude of 35 - 42. Longitude of 100 - 110.","Warning");
			return;
		}
		label = y+" N, "+x*-1+" W";
		inSR = new SpatialReference(4326);
		myPoint = new Point(x,y,inSR);
	}
	// deg, min, sec
	else if (registry.byId("pointUnits").value == "dms") {
		y = Number(document.getElementById("pointYdeg").value) + Number(document.getElementById("pointYmin").value)/60 + Number(document.getElementById("pointYsec").value)/3600;
		x = Number(document.getElementById("pointXdeg").value) + Number(document.getElementById("pointXmin").value)/60 + Number(document.getElementById("pointXsec").value)/3600;
		if (x > 0) x = x*-1;
		if (!(((x >= -110 && x <= -100) || (x >= 100 && x <= 110)) && (y >= 35 && y <= 42))) {
			alert("This point is not in Colorado. Latitude of 35 - 42. Longitude of 100 - 110.","Warning");
			return;
		}
		var deg = Number(document.getElementById("pointXdeg").value);
		if (deg < 0) deg*=-1;
		label = document.getElementById("pointYdeg").value+"° "+ Number(document.getElementById("pointYmin").value) +"' "+ Number(document.getElementById("pointYsec").value)+ "\" N, "+
			deg+"° "+ Number(document.getElementById("pointXmin").value) +"' "+ Number(document.getElementById("pointXsec").value) +"\" W";
		inSR = new SpatialReference(4326);
		myPoint = new Point(x,y,inSR);
	}
	// degrees, decimal minutes
	else if (registry.byId("pointUnits").value == "dm") {
		y = Number(document.getElementById("pointYddm").value) + Number(document.getElementById("pointYmindm").value)/60;
		x = Number(document.getElementById("pointXddm").value) + Number(document.getElementById("pointXmindm").value)/60;
		if (x > 0) x = x*-1;
		if (!(((x >= -110 && x <= -100) || (x >= 100 && x <= 110)) && (y >= 35 && y <= 42))) {
			alert("This point is not in Colorado. Latitude of 35 - 42. Longitude of 100 - 110.","Warning");
			return;
		}
		var deg = Number(document.getElementById("pointXddm").value);
		if (deg < 0) deg*=-1;
		label = document.getElementById("pointYddm").value+"° "+ Number(document.getElementById("pointYmindm").value) +"' N, "+
			deg+"° "+ Number(document.getElementById("pointXmindm").value) +"' W";
		inSR = new SpatialReference(4326);
		myPoint = new Point(x,y,inSR);
	}
	// Convert from UTM Nad 83, Nad 27, or WGS 84 to map projection
	else
	{
		x = Number(document.getElementById("pointX").value);
		y = Number(document.getElementById("pointY").value);
		if (!((x >= 133000 && x <= 1300000) && (y >= 4095000 && y <= 4580000))) {
			alert("This point is not in Colorado. Easting of 133000 - 1300000. Northing of 4095000 - 4580000.","Warning");
			return;
		}
		inSR = new SpatialReference(Number(registry.byId("pointUnits").value));
		label = (x +", "+ y);
		myPoint = new Point(x, y, inSR);
	}
	var label2;
	if (registry.byId("radioLabelCustom").checked && document.getElementById("customXYlabel").value != ""){
		label2 = document.getElementById("customXYlabel").value;
	}
	else label2 = label;
	projectPointAndLabel(label2,myPoint);
	// display point in measurements box
	document.getElementById("measurements").style.visibility = "visible";
	document.getElementById("measurements").style.display = "block";
	dom.byId("area").innerHTML = "";
	dom.byId("length").innerHTML = label;
	drawExit();
	inSR = null;
	myPoint = null;
	params = null;
  });
}
	
function projectPointAndLabel(label,myPoint) {
  require (["dojo/dom","dijit/registry","esri/layers/GraphicsLayer", "esri/SpatialReference",
   "esri/tasks/GeometryService","esri/tasks/ProjectParameters","esri/graphic"], 
   function (dom,registry,GraphicsLayer,SpatialReference,GeometryService,ProjectParameters,Graphic){
	params = new ProjectParameters();
	params.geometries = [myPoint];
	params.outSR = new SpatialReference(map.spatialReference);
	
	// convert point to map projection
	geometryService.project(params, function (feature) {
		// Store graphic layer name so we can remove it later
		drawGraphicsLayer = new GraphicsLayer();
		drawGraphicsLayer.id = "drawgraphics"+drawGraphicsCounter;
		drawGraphicsCount.push(drawGraphicsLayer.id);
		drawGraphicsCounter++;
		document.getElementById("clearGraphics").style.visibility = "visible";
	
		addPointSymbol(feature[0]); // add point to drawGraphicsLayer
		if (!registry.byId("labelXY").checked)
			map.addLayer(drawGraphicsLayer);
		else {
			var labelPoint = new Graphic(feature[0]);
			addLabel(labelPoint, label, drawGraphicsLayer, "11pt"); // in utilFunc.js
			labelPoint = null;
		}
		drawGraphicsLayer = null;
		params = null;
	}, function (err) {
		alert("Problem projecting point. "+err.message,"Warning");
		params = null;
	});
  });
}

function drawMultiPoint() {
  require (["dojo/dom", "dijit/registry", "esri/SpatialReference", "esri/geometry/Point"], 
  function (dom,registry,SpatialReference,Point){

	var points = document.getElementById("pointsXY").value.split(",");
	var inSR, label, myPoint, params, x, y, measurement="";
	for (var i=0; i<points.length; i+=2) {
		// decimal degrees
		if (registry.byId("pointUnits").value == "dd") {
			y = Number(points[i]);
			x = Number(points[i+1]);
			if (x > 0) x = x*-1;
			if (!(((x >= -110 && x <= -100) || (x >= 100 && x <= 110)) && (y >= 35 && y <= 42))) {
				alert("This point is not in Colorado. Latitude of 35 - 42. Longitude of 100 - 110.","Warning");
				return;
			}
			label = y+" N, "+x*-1+" W";
			inSR = new SpatialReference(4326);
			myPoint = new Point(x,y,inSR);
		}
		// degrees, decimal min or deg, min, sec
		else if ((registry.byId("pointUnits").value == "dm") || (registry.byId("pointUnits").value == "dms")) {
			var arr = dms_or_dm_to_dd(points[i]+","+points[i+1]);
			if (arr == null) return;
			y = Number(arr[0]);
			x = Number(arr[1]);
			label = arr[2];
			inSR = new SpatialReference(4326);
			myPoint = new Point(x,y,inSR);
		}
		// utm
		else {
			x = Number(points[i]);
			y = Number(points[i+1]);
			if (!((x >= 133000 && x <= 1300000) && (y >= 4095000 && y <= 4580000))) {
				alert("This point is not in Colorado. Easting of 133000 - 1300000. Northing of 4095000 - 4580000.","Warning");
				return;
			}
			inSR = new SpatialReference(Number(registry.byId("pointUnits").value));
			label = (x +", "+ y);
			myPoint = new Point(x, y, inSR);
		}
		
		measurement += label+"<br/>";
		projectPointAndLabel(label,myPoint);
	}
	// display point in measurements box
	document.getElementById("measurements").style.visibility = "visible";
	document.getElementById("measurements").style.display = "block";
	dom.byId("area").innerHTML = "";
	dom.byId("length").innerHTML = measurement;
	drawExit();
	inSR = null;
	myPoint = null;
	params = null;
  });
}

//-----------------------
// Mark current location
//-----------------------
function drawCurrentLocation(){
	if (navigator.geolocation) {
		drawExit();
		function zoomToLocation(location) {
			require(["dojo/dom","dijit/registry","esri/geometry/Point","esri/SpatialReference","esri/tasks/GeometryService","esri/geometry/webMercatorUtils"],
			function(dom,registry,Point,SpatialReference,GeometryService,webMercatorUtils){	
				var point = webMercatorUtils.geographicToWebMercator(new Point(location.coords.longitude, location.coords.latitude));
				var label;
				var coord;
				// Label with custom text
				if (registry.byId("radioLabelCustom").checked && document.getElementById("customXYlabel").value != "") {
					label = document.getElementById("customXYlabel").value;
					if (registry.byId("pointUnits").value == "dd") {
						coord = location.coords.latitude.toFixed(5)+" N, "+location.coords.longitude.toFixed(5)*-1+" W (plus or minus "+location.coords.accuracy+" meters)"; 
						dom.byId("length").innerHTML = "Lat, Long: "+coord;
						projectPointAndLabel(label,point);
					}
					// degress, decimal minutes
					else if (registry.byId("pointUnits").value == "dm"){
						xy = mappoint_to_dm(point,false); // found in utilFunc.js. false means do add a zero in front of min
						coord = xy[0]+" N, "+xy[1]+" W (plus or minus "+location.coords.accuracy+" meters)"; 
						dom.byId("length").innerHTML = "Lat, Long: "+coord;
						projectPointAndLabel(label,point);
					}
					// deg, min, sec
					else if (registry.byId("pointUnits").value == "dms") {
						xy = mappoint_to_dms(point,false); // found in utilFunc.js. false means do add a zero in front of min
						coord = xy[0]+" N, "+xy[1]+" W (plus or minus "+location.coords.accuracy+" meters)"; 
						dom.byId("length").innerHTML = "Lat, Long: "+coord;
						projectPointAndLabel(label,point);
					}
					// utm
					else {
						// converts point to selected projection
						require(["esri/tasks/ProjectParameters"], function(ProjectParameters) {
							var params = new ProjectParameters();
							params.geometries = [point];
							params.outSR = new SpatialReference(Number(registry.byId("pointUnits").value));
							geometryService.project(params, function (feature) {
								coord = feature[0].x.toFixed(0) +", " +feature[0].y.toFixed(0)+ " (plus or minus "+location.coords.accuracy+" meters)";
								dom.byId("length").innerHTML = "UTM: "+coord;
								projectPointAndLabel(label,point);
							}, function (err) {
								alert("Problem projecting point. "+err.message,"Warning");
							});
						});
					}
				}
				// Label with XY Coordinate
				else {
					// decimal degrees
					if (registry.byId("pointUnits").value == "dd") {
						label = location.coords.latitude.toFixed(5)+" N, "+location.coords.longitude.toFixed(5)*-1+" W";  
						dom.byId("length").innerHTML = "Lat, Long: "+label+" (plus or minus "+location.coords.accuracy+" meters)";
						projectPointAndLabel(label,point);
					}
					// degress, decimal minutes
					else if (registry.byId("pointUnits").value == "dm"){
						xy = mappoint_to_dm(point,false); // found in utilFunc.js. false means do add a zero in front of min
						label = xy[0]+" N, "+xy[1]+" W"; 
						dom.byId("length").innerHTML = "Lat, Long: "+label+" (plus or minus "+location.coords.accuracy+" meters)";
						projectPointAndLabel(label,point);
					}
					// deg, min, sec
					else if (registry.byId("pointUnits").value == "dms") {
						xy = mappoint_to_dms(point,false); // found in utilFunc.js. false means do add a zero in front of min
						label = xy[0]+" N, "+xy[1]+" W"; 
						dom.byId("length").innerHTML = "Lat, Long: "+label+" (plus or minus "+location.coords.accuracy+" meters)";
						projectPointAndLabel(label,point);
					}
					// utm
					else {
						require(["esri/tasks/ProjectParameters"], function(ProjectParameters) {
							var params = new ProjectParameters();
							params.geometries = [point];
							params.outSR = new SpatialReference(Number(registry.byId("pointUnits").value));
							// converts point to selected projection
							geometryService.project(params, function (feature) {
								label = feature[0].x.toFixed(0) +", " +feature[0].y.toFixed(0);
								dom.byId("length").innerHTML = "UTM: "+label+" (plus or minus "+location.coords.accuracy+" meters)";
								projectPointAndLabel(label,point);
								params = null;
							}, function (err) {
								alert("Problem projecting point. "+err.message,"Warning");
								params = null;
							});
						})
					}
				}
				// display point in measurements box
				document.getElementById("measurements").style.visibility = "visible";
				document.getElementById("measurements").style.display = "block";
				dom.byId("area").innerHTML = "";
			});
		}
		function locationError(error) {
			switch (error.code) {
				case error.PERMISSION_DENIED:
				  alert("Location not provided. Permission denied.","Warning");
				  break;

				case error.POSITION_UNAVAILABLE:
				  alert("Current location not available.","Note");
				  break;

				case error.TIMEOUT:
				  alert("Timeout while getting current location. Please try again.","Note");
				  break;

				default:
				 alert("Warning: problem while getting current location. "+error.message,"Warning");
				 break;
			}
		}
		//if you want to track as the user moves setup navigator.geolocation.watchPostion
		var options = {enableHighAccuracy:true};
		navigator.geolocation.getCurrentPosition(zoomToLocation, locationError,options);
		//navigator.geolocation.getCurrentPosition(zoomToLocation, locationError);
	} else {
        alert("Your browser doesn't support Geolocation. Visit http://caniuse.com to see browser support for the Geolocation API.","Warning");
    }
}


function addPoints(points,sr) {
	// New short url parameters for way pts:
	//   &point = size|color|x|y|label, ...
	//		where size=s for small, m for medium, or l for large
	//		color=b for blue, g for green, r for red, or y for gray
	// Old way:
	//   &point = circle|size|color|alpha(transparency)|outline color|outline width|x|y|
	//		text|font|font size|color|bold as t or f|italic as t or f|underline as t or f|placement|offset, next point...
	//		For example: circle|10|4173788|1|0|1|-11713310|4743885|480;779; 4;333;990|1|12|4173788|t|f|f|above|5
	// Called by readConfig when &points name/value was read on the url
	// Called by bookmark.js when need to add points
	require (["esri/graphic","esri/layers/GraphicsLayer","esri/geometry/Point",
		"esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol",
		"dojo/_base/Color","esri/geometry/Geometry", "esri/SpatialReference"], function (
		Graphic, GraphicsLayer, Point, SimpleMarkerSymbol, SimpleLineSymbol, Color, Geometry, SpatialReference) {
		var pointArr = points.split(",");
		var semiColon = /;/g;
		var min = /\\'/g;
		var sec = /\\"/g;
		for (i=0; i<pointArr.length; i++){
			var pointItems = pointArr[i].split("|");
			drawGraphicsLayer = new GraphicsLayer();
			drawGraphicsLayer.id = "drawgraphics"+drawGraphicsCounter;
			drawGraphicsCount.push(drawGraphicsLayer.id);
			drawGraphicsCounter++;
			document.getElementById("clearGraphics").style.visibility = "visible";
			var symbol, point, label=null, size, ptColor, outlineColor;

			// New format: points = size|color|x|y|label|desc
			if (pointItems.length >= 4 && pointItems.length < 7) {
				// size of way point small, medium, large
				if (pointItems[0] == "s") size = 7;
				else if (pointItems[0] == "l") size = 21;
				else size = 14;
				// blue way point
				if (pointItems[1] == "b") {
					ptColor = new Color([0,0,255,0.6]);
					outlineColor = new Color([0,0,200]);
				}
				// green way point
				else if (pointItems[1] == "g") {
					ptColor = new Color([0,255,0,0.6]);
					outlineColor = new Color([0,150,5]);
				}
				// gray way point
				else if (pointItems[1] == "y") {
					ptColor = new Color([100,100,100,0.6]);
					outlineColor = new Color([100,100,100]);
				}
				// red way point
				else {
					ptColor = new Color([255,0,0,0.6]);
					outlineColor = new Color([255,0,10]);
				}
				symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,size,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, outlineColor, 1),ptColor); 
				if (pointItems.length >4) label = pointItems[4].replace(semiColon,",").replace(min,"'").replace(sec,"\"");
				//else label = "Way Point";
				point = new Point(parseFloat(pointItems[2]), parseFloat(pointItems[3]), new SpatialReference({wkid:wkid}));
			}
			// old format: points = circle|size|color|alpha(transparency)|outline color|outline width|x|y|
			//   text|font|font size|color|bold as t or f|italic as t or f|underline as t or f|placement|offset
			else if (pointItems.length > 6) {
				if (pointItems[4].indexOf("h") > -1) {
					var rgba = pointItems[2].split(";");
					rgba.push(parseFloat(pointItems[3]));
					ptColor = new Color(rgba);
					outlineColor = new Color("#"+pointItems[4].substr(1));
					rgba = null;
				}
				else { // from flex system
					ptColor =  new Color("#"+parseInt(pointItems[2]).toString(16));
					outlineColor = new Color("#"+parseInt(pointItems[4]).toString(16));
				}
				// SimpleMarkerSymbol(style, size, SimpleLineSymbol(outline style, outline color, outline width), point color)
				symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,pointItems[1],new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,outlineColor,1),ptColor);
				point = new Point(parseFloat(pointItems[6]), parseFloat(pointItems[7]), sr);
				if (pointItems.length>8) {
					//var fontsize = pointItems[10]; // use default font-size
					label = pointItems[8].replace(semiColon,",").replace(min,"'").replace(sec,"\"");
				}
			}
			else {
				alert("Could not add all of the Way Points. This can happen if a long map URL was emailed.","Note");
				return;
			}
			drawGraphicsLayer.add(new Graphic(point, symbol));
			
			// If we add description add this:
			//desc = desc.replace(/~/g," "); // to email the way point spaces were replaced with tildas, so put them back.
			// Add label
			
			if (label) {
				label = label.replace(/~/g," "); // to email the way point spaces were replaced with tildas, so put them back.
				var labelPoint = new Graphic(point);
				addLabel(labelPoint, label, drawGraphicsLayer, "11pt");
				labelPoint = null;
			}
			else {
				map.addLayer(drawGraphicsLayer);
				drawGraphicsLayer.refresh();
			}
		}
		label=null;
		point=null;
		symbol=null;
		ptColor=null;
		outlineColor=null;
		pointArr = null;
		pointItems = null;
	});
}

function addLines(lines, sr) {
	// &line= style | color | alpha | lineWidth | number of paths | [number of points | x | y | x | y |... repeat for each path] 
	// |x|y|label|font|font-size|color|bold|italic|underline|placement|offset, repeat for each line
	// &line=solid|4173788|1|5|1|3|-11900351|4800983|-11886749|4805344|-11883462|4812449|-11891907|4806716|Length: 10.5 mi|1|12|4173788|t|f|f|above|5
	require (["esri/graphic","esri/layers/GraphicsLayer","esri/geometry/Polyline","esri/geometry/Point",
		"esri/symbols/SimpleLineSymbol", "dojo/_base/Color","esri/geometry/Geometry"], function (
		Graphic, GraphicsLayer, Polyline, Point, SimpleLineSymbol, Color, Geometry) {	
		var lineArr = lines.split(",");
		var semiColon = /;/g;
		var min = /\\'/g;
		var sec = /\\"/g;
		for (i=0; i<lineArr.length; i++){
			var lineItems = lineArr[i].split("|");
			drawGraphicsLayer = new GraphicsLayer();
			drawGraphicsLayer.id = "drawgraphics"+drawGraphicsCounter;
			drawGraphicsCount.push(drawGraphicsLayer.id);
			drawGraphicsCounter++;
			document.getElementById("clearGraphics").style.visibility = "visible";
			var lineColor;					
			if (lineItems[1].indexOf(";") > -1) {
				var rgb = lineItems[1].split(";");
				rgb[0] = parseInt(rgb[0]);
				rgb[1] = parseInt(rgb[1]);
				rgb[2] = parseInt(rgb[2]);
				lineColor = new Color(rgb);
				rgb = null;
			}
			else { // from flex system
				lineColor =  new Color("#"+parseInt(lineItems[1]).toString(16));
			}
			//                                  style, color, default size of 2
			var symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,lineColor,2);
			var points;
			var paths = [];
			// Add each path
			var pos = 5;
			var line = new Polyline(sr);
			for (j=0; j<lineItems[4]; j++) { // get each path
				var numPoints = lineItems[pos++];
				for (k=0; k<numPoints; k++) { // get each point
					points = [];
					points.push(parseFloat(lineItems[pos++]));
					points.push(parseFloat(lineItems[pos++]));
					paths.push(points);
					points = null
				}
				line.addPath(paths);
				paths = null;
			}
			drawGraphicsLayer.add(new Graphic(line, symbol));
			
			// Add label
			if (lineItems.length>pos) {
				var point = new Point(parseFloat(lineItems[pos++]),parseFloat(lineItems[pos++]),sr);
				var labelPoint = new Graphic(point);
				var label = lineItems[pos++].replace(semiColon,",").replace(min,"'").replace(sec,"\"");
				//var fontsize = lineItems[pos+1]; // use default font-size
				addLabel(labelPoint, label, drawGraphicsLayer, "11pt");
				point = null;
				labelPoint = null;
			}
			else {
				map.addLayer(drawGraphicsLayer);
				drawGraphicsLayer.refresh();
			}
		}
		lineArr = null;
		lineItems = null;
		line = null;
	});
}

function addPolys(polys,sr){
	// &poly=  fillStyle | fillColor | fillAlpha | lineStyle | lineColor | lineWidth | 
	// number of rings | number of points | x | y | x | y |... repeat for each ring , repeat for each polygon
	// fillAlpha is now in fillColor (was used in flex), lineStyle = solid, lineWidth = 2
	require (["esri/graphic","esri/layers/GraphicsLayer","esri/geometry/Polygon","esri/geometry/Point",
		"esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "dojo/_base/Color","esri/geometry/Geometry"], function (
		Graphic, GraphicsLayer, Polygon, Point, SimpleLineSymbol, SimpleFillSymbol, Color, Geometry) {	
		var polyArr = polys.split(",");
		var semiColon = /;/g;
		var min = /\\'/g;
		var sec = /\\"/g;
		for (i=0; i<polyArr.length; i++){
			var polyItems = polyArr[i].split("|");
			drawGraphicsLayer = new GraphicsLayer();
			drawGraphicsLayer.id = "drawgraphics"+drawGraphicsCounter;
			drawGraphicsCount.push(drawGraphicsLayer.id);
			drawGraphicsCounter++;
			document.getElementById("clearGraphics").style.visibility = "visible";
			var fillColor;					
			if (polyItems[1].indexOf(";") > -1) {
				var rgba = polyItems[1].split(";");
				rgba[0] = parseInt(rgba[0]);
				rgba[1] = parseInt(rgba[1]);
				rgba[2] = parseInt(rgba[2]);
				rgba[3] = parseFloat(rgba[3]);
				fillColor = new Color(rgba);
				rgba = null;
			}
			else { // from flex system
				fillColor =  new Color("#"+parseInt(polyItems[1]).toString(16));
				fillColor.a = parseFloat(polyItems[2]);
			}
			var outlineColor;
			if (polyItems[4].indexOf(";") > -1) {
				var rgb = polyItems[4].split(";");
				rgb[0] = parseInt(rgb[0]);
				rgb[1] = parseInt(rgb[1]);
				rgb[2] = parseInt(rgb[2]);
				outlineColor = new Color(rgb);
				rgb = null;
			}
			else { // from flex system
				outlineColor =  new Color("#"+parseInt(polyItems[4]).toString(16));
			}
			//                                  style, color, default size of 2
			var outlineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,outlineColor,2);
			//                                  style, outline, color
			var symbol = new SimpleFillSymbol(polyItems[0],outlineSymbol,fillColor);
			var points;
			var rings = [];
			// Add each ring
			var pos = 7;
			var poly = new Polygon(sr);
			for (j=0; j<polyItems[6]; j++) { // get each ring
				var numPoints = polyItems[pos++];
				for (k=0; k<numPoints; k++) { // get each point
					points = [];
					points.push(parseFloat(polyItems[pos++]));
					points.push(parseFloat(polyItems[pos++]));
					rings.push(points);
					points = null;
				}
				poly.addRing(rings);
				rings = null;
				rings = [];
			}
			drawGraphicsLayer.add(new Graphic(poly, symbol));
			
			// Add label
			if (polyItems.length>pos) {
				var point = new Point(parseFloat(polyItems[pos++]),parseFloat(polyItems[pos++]),sr);
				var labelPoint = new Graphic(point);
				var label = polyItems[pos++].replace(semiColon,",").replace(min,"'").replace(sec,"\"");
				//var fontsize = polyItems[pos+1]; // use default font-size
				addLabel(labelPoint, label, drawGraphicsLayer, "11pt");
				point = null;
				labelPoint = null;
			}
			else {
				map.addLayer(drawGraphicsLayer);
				drawGraphicsLayer.refresh();
			}
		}
		polyArr = null;
		polyItems = null;
		poly = null;
	});
}

function addRects(rects,sr){
	// &poly=  fillStyle | fillColor | fillAlpha | lineStyle | lineColor | lineWidth | 
	// number of rings | number of points | x | y | x | y |... repeat for each ring , repeat for each polygon
	// fillAlpha is now in fillColor (was used in flex), lineStyle = solid, lineWidth = 2
	require (["esri/graphic","esri/geometry/Extent","esri/layers/GraphicsLayer","esri/geometry/Polygon","esri/geometry/Point",
		"esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "dojo/_base/Color","esri/geometry/Geometry"], function (
		Graphic, Extent, GraphicsLayer, Polygon, Point, SimpleLineSymbol, SimpleFillSymbol, Color, Geometry) {	
		var polyArr = rects.split(",");
		var semiColon = /;/g;
		var min = /\\'/g;
		var sec = /\\"/g;
		for (i=0; i<polyArr.length; i++){
			var polyItems = polyArr[i].split("|");
			drawGraphicsLayer = new GraphicsLayer();
			drawGraphicsLayer.id = "drawgraphics"+drawGraphicsCounter;
			drawGraphicsCount.push(drawGraphicsLayer.id);
			drawGraphicsCounter++;
			document.getElementById("clearGraphics").style.visibility = "visible";
			var fillColor;
			var flex=false;
			if (polyItems[1].indexOf(";") > -1) {
				var rgba = polyItems[1].split(";");
				rgba[0] = parseInt(rgba[0]);
				rgba[1] = parseInt(rgba[1]);
				rgba[2] = parseInt(rgba[2]);
				rgba[3] = parseFloat(rgba[3]);
				fillColor = new Color(rgba);
				rgba = null;
			}
			else { // from flex system
				flex = true;
				fillColor =  new Color("#"+parseInt(polyItems[1]).toString(16));
				fillColor.a = parseFloat(polyItems[2]);
			}
			var outlineColor;
			if (polyItems[4].indexOf(";") > -1) {
				var rgb = polyItems[4].split(";");
				rgb[0] = parseInt(rgb[0]);
				rgb[1] = parseInt(rgb[1]);
				rgb[2] = parseInt(rgb[2]);
				outlineColor = new Color(rgb);
				rgb = null;
			}
			else { // from flex system
				outlineColor =  new Color("#"+parseInt(polyItems[4]).toString(16));
			}
			//                                  style, color, default size of 2
			var outlineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,outlineColor,2);
			//                                  style, outline, color
			var symbol = new SimpleFillSymbol(polyItems[0],outlineSymbol,fillColor);
			var points;
			var rings = [];
			// Add rectangle
			var pos = 6;
			// Check if only has 2 corner points
			if (flex){
				var ext = new Extent(polyItems[6],polyItems[7],polyItems[8],polyItems[9],map.spatialReference);
				drawGraphicsLayer.add(new Graphic(ext, symbol));
				ext=null;
				pos=10;
			}
			// Has all 5 points
			else{
				var poly = new Polygon(sr);
				for (j=0; j<5; j++) { 
					points = [];
					points.push(parseFloat(polyItems[pos++]));
					points.push(parseFloat(polyItems[pos++]));
					rings.push(points);
					points = null;
				}
			
				poly.addRing(rings);
				rings = null;
				drawGraphicsLayer.add(new Graphic(poly, symbol));
			}
			
			// Add label
			if (polyItems.length>pos) {
				var point = new Point(parseFloat(polyItems[pos++]),parseFloat(polyItems[pos++]),sr);
				var labelPoint = new Graphic(point);
				var label = polyItems[pos++].replace(semiColon,",").replace(min,"'").replace(sec,"\"");
				//var fontsize = polyItems[pos+1]; // use default font-size
				addLabel(labelPoint, label, drawGraphicsLayer, "11pt");
				point = null;
				labelPoint = null;
			}
			else{
				map.addLayer(drawGraphicsLayer);
				drawGraphicsLayer.refresh();
			}
		}
		polyArr = null;
		polyItems = null;
		poly = null;
	});
}

function addLabels(labels,sr){
	// &text=x|y|text|font|font size|color|bold as t or f|italic as t or f|underline as t or f
	// font, color, bold, italic, and underline are not used in this version. They default to Helvetica, black, bold
	require (["esri/graphic","esri/layers/GraphicsLayer","esri/geometry/Point"], function (Graphic, GraphicsLayer, Point) {
	
		var textArr = labels.split(",");
		for (i=0; i<textArr.length; i++){
			var textItems = textArr[i].split("|");
			drawTextGraphicsLayer = new GraphicsLayer();
			drawTextGraphicsLayer.id = "drawtextgraphics"+drawTextGraphicsCounter;
			drawTextGraphicsCount.push(drawTextGraphicsLayer.id);
			drawTextGraphicsCounter++;
			document.getElementById("clearText").style.visibility = "visible";
			
			var fontsize = textItems[4];
			var label = decodeURIComponent(textItems[2]);
			var point = new Point(parseFloat(textItems[0]), parseFloat(textItems[1]), sr);
			var labelPoint = new Graphic(point);
			addLabel(labelPoint, label, drawTextGraphicsLayer, fontsize);
			map.addLayer(drawTextGraphicsLayer);
			//console.log("added label: "+label+" fontsize="+fontsize+" x="+textItems[0]+" y="+textItems[1]);
		}
		textArr = null;
		textItems = null;
		point = null;
		labelPoint = null;
	});
}