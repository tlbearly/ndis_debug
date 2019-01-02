// Add way points and measure

var toolbar;
var drawGraphicsCount = [], lenGraphicsCount = []; // store names of graphics layers used to display way points and measure lines
var drawGraphicsCounter = 0, lenGraphicsCounter = 0;
var drawGraphicsLayer,lenGraphicsLayer;
var labelPoint;
var wayPtMaxScale = 4622324.434309; // check if current scale > than this then zoom in to this
//var wayPtMaxZoomTo = 2311162; // if zoomed out too far to see way point, zoom in to this scale
var wayPointHelp=null;

function wayPointInit(){
	// Way Point Help Window
	require(["dojo/_base/window","javascript/HelpWin"],function(win,HelpWin){
		// Add to help later: ' Bookmark also allows uploading and downloading kml or kmz files with the '+
		//		'current way points and map extent. These can be created in google maps.'+
		wayPointHelp = new HelpWin({
			label: "Way Point Help",
			content: 'Allows clicking on the map to add way points with a label and description. Way points '+
				'will only show up when you are zoomed in. If needed, the map will automatically zoom in to let you see '+
				'the new way point you are adding. Once a way point is added, you may click on it to see the description, '+
				'to edit the label or description, or to delete it. In Bookmark (on the main menu) you can save your way '+
				'points in your browser\'s bookmarks or cache.'+
				'<br/><br/>'
		});
		win.body().appendChild(wayPointHelp.domNode);
		wayPointHelp.startup();
	});
}
function safeInput(txtBox) {
	txtBox.value=txtBox.value.replace(/\"/g,"``");// encode "
	txtBox.value=txtBox.value.replace(/\'/g,"`");// encode '
	txtBox.value=txtBox.value.replace(/;/g,"");
	txtBox.value=txtBox.value.replace(/&/g,"and");
	txtBox.value=txtBox.value.replace(/\n/g,"newline"); // preserve new line characters
	regexp=/([^a-zA-Z0-9 \-,°`\.!_\*()])/g; // only allow these characters (^ means not so the test removes all other characters)
	if (regexp.test(txtBox.value)) alert("Illegal characters were removed.","Note");
	txtBox.value=txtBox.value.replace(regexp,""); // clean it
	txtBox.value=txtBox.value.replace(/newline/g,"\n"); // preserve new line charactersS
	return txtBox.value;
}
function resizeTextBox(txtBox) {
	// Make the Way Point popup have an expanding text box
	// Called by: resize, orientation change, and identify.js/placeIdGroupCombo (runs same code)
	if (!txtBox) {
		hideLoading();
		return;
	}
	txtBox.style.height = 'auto';
	txtBox.style.height = txtBox.scrollHeight+'px';
	hideLoading();
}

function addPoint(geometry,label,desc,symbol){
	// Called by readConfig when a point needs to be added from the command line or
	// when the user adds a point from the Way Point menu.
	require(["dojo/dom","esri/layers/GraphicsLayer","esri/graphic","esri/symbols/SimpleMarkerSymbol","dojo/_base/Color","esri/symbols/Font",
		"esri/symbols/TextSymbol","dojox/mobile/ExpandingTextArea","esri/InfoTemplate"],
	function(dom,GraphicsLayer,Graphic,SimpleMarkerSymbol,Color,Font,TextSymbol,ExpandingTextArea,InfoTemplate){
		// Store graphic layer name so we can remove it later
		label = label.replace(/~/g," "); // to email the way point spaces were replaced with tildas, so put them back.
		desc = desc.replace(/~/g," "); // to email the way point spaces were replaced with tildas, so put them back.
		label = label.replace(/\"/g,'``'); // encode " for degree min sec point
		desc = desc.replace(/\"/g,'``'); // encode " for degree min sec point
		label = label.replace(/\'/g,"`"); // encode ' for degree min sec point
		desc = desc.replace(/\'/g,"`"); // encode ' for degree min sec point

		drawGraphicsLayer = new GraphicsLayer();
		drawGraphicsLayer.id = "drawgraphics"+drawGraphicsCounter;
		// The point symbol
		var g = new Graphic(geometry, symbol);
		drawGraphicsLayer.add(g);
		
		//*****************
		// buffer the point with semi-transparent circle to register click 
		//*****************
		var symbol2 = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,40,null,new Color([0,0,255,0.05]));
		g = new Graphic(geometry, symbol2);
		drawGraphicsLayer.add(g);
		//g.infoTemplate=infoTemp;
		//**********
		// add label
		//**********
		var font = new Font(
				"9pt",
				Font.STYLE_NORMAL, 
				Font.VARIANT_NORMAL,
				Font.WEIGHT_BOLDER,
				"Helvetica"
			);
		// add this if want to trim the label to 10 characters: label.substring(0,10)
		var label2 = new TextSymbol(label,font,new Color("black"));
		label2.setOffset(0,-23);
		g = new Graphic(geometry, label2);
		g.setAttributes({name:label,description:desc});
		//g.infoTemplate=infoTemp;
		drawGraphicsLayer.add(g);	
		drawGraphicsLayer.setMinScale(wayPtMaxScale);
		drawGraphicsLayer.setMaxScale(0);
		map.addLayer(drawGraphicsLayer);
		drawGraphicsLayer.title = label;
		drawGraphicsLayer.desc = desc;
		drawGraphicsLayer.refresh();
		drawGraphicsLayer.content = "<div id='wayptContent'><div class='esriPopupItemTitle'>Way Point found at map click:</div>"+
			"<form id='popupForm'>"+
			"<input id='wayPtTitle' type='text' maxlength='50' style='width:250px;max-width:96%;margin-left:5px;' value='"+label+"'></input>"+
			"<textarea id='wayPtDesc' maxlength='200' onkeyup='javascript:resizeTextBox(this)' style='height:80px; width: calc(100% - 25px)!important;width: -moz-calc(100% - 25x)!important;width: -webkit-calc(100% - 25px)!important; margin:5px; overflow:hidden; resize:none;' "+
			" placeHolder=\"Description\">"+desc+"</textarea>"+
			"<p align='center'><button class='mblButton' type='button' onclick=\"var gr=map.getLayer('"+drawGraphicsLayer.id+"');"+
			"var title=safeInput(document.getElementById('wayPtTitle'));"+
			"var desc=safeInput(document.getElementById('wayPtDesc'));"+
			"gr.content = gr.content.replace(gr.title,title);"+
			"gr.content = gr.content.replace(gr.desc+'</textarea>',desc+'</textarea>');"+
			"gr.title=title;"+
			"gr.desc=desc;"+
			"gr.graphics[2].symbol.text = title;"+
			"gr.refresh();"+
			"map.infoWindow.popupInfoView.container.style.display='none';"+
			"map.infoWindow.popupNavigationBar.container.style.display='none';"+
			"document.getElementById('wayPtDesc').blur();"+
			"document.body.focus();"+
			"\">Save</button>&nbsp;&nbsp;"+
			"<button type='button' class='mblButton' onclick='map.infoWindow.setTitle(\"\");map.infoWindow.setContent(\"\");"+
			"map.infoWindow.popupInfoView.container.style.display=\"none\";"+
			"map.infoWindow.popupNavigationBar.container.style.display=\"none\";' data-dojo-type='dojox/mobile/Button'>Close</button>&nbsp;&nbsp;"+
			"<button type='button' onclick='map.infoWindow.setTitle(\"\");"+
			"map.infoWindow.popupInfoView.container.style.display=\"none\";"+
			"map.infoWindow.popupNavigationBar.container.style.display=\"none\";"+
			"map.graphics.clear();"+
			"map.removeLayer(map.getLayer(\""+drawGraphicsLayer.id+"\"));"+
			"drawGraphicsCount.splice(drawGraphicsCount.indexOf(\""+drawGraphicsLayer.id+"\"),1);"+	
			"drawGraphicsCounter--;"+		
			"map.infoWindow.setContent(\"\");' class='mblButton'>Delete</button></p><br/><br/></form></div>"+
			"<script>"+
			"  document.getElementById('wayptContent').addEventListener('load', function() {"+
			"  document.getElementsByClassName('esriPopupItemTitle')[0].scrollIntoView();"+
			"  console.log('loaded');"+
			"});</script>";
			//"var gl=map.getLayer('"+drawGraphicsLayer.id+"');"+
			//"console.log('update title to '+gl.title);"+
			//"document.getElementById('wayPtTitle').value=gl.title;"+
			//"document.getElementById('wayPtDesc').innerHTML=gl.desc;"+
			//"document.getElementById('wayPtTitle').value='hi there';"+
			//"console.log('test');"+
			// Notes for window.onload function above
			// scrollIntoView needed when the user looks at a long description, then the next infowindow was blank until the user scrolled to the top.
			// Update title and desc. The title was not being updated.

		drawGraphicsLayer.on ("click", function(event){
			if (drawing) return;
			//drawing=true;
			clickPoint = getScreenClick(event);
			map.infoWindow.setTitle(this.title);
			map.infoWindow.wayPt = true; // 4-9-18 set flag for doIdentify to tell if need to hide old infoWindow
			map.infoWindow.setContent(this.content);
			getIdentifyFooter();
			showIdentify(); // requires global variable, clickPoint
			// Listen for orientation change or resize then resize description text box
			var supportsOrientationChange = "onorientationchange" in window, orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";
			window.addEventListener(orientationEvent, function () {
				// Check if showing waypt popup
				if (document.getElementById("wayPtDesc")){
					showLoading();
					// wait 1/2 a second for screen to draw
					setTimeout(resizeTextBox(document.getElementById("wayPtDesc")), 500);
				}
			}, false);
			var gr = this;
			// Update the way point title & description
			/*document.getElementById("popupForm").addEventListener("submit", function(event) {
				event.stopImmediatePropagation(); // don't call this twice
				event.preventDefault(); // don't load a new page
				gr.content = gr.content.replace("'"+gr.title+"'></input>","'"+document.getElementById("wayPtTitle").value+"'></input>");
				gr.content = gr.content.replace(">"+gr.desc+"</textarea>",">"+document.getElementById("wayPtDesc").value+"</textarea>");
				gr.title=document.getElementById("wayPtTitle").value;
				gr.desc=document.getElementById("wayPtDesc").value;
				gr.graphics[2].symbol.text = document.getElementById("wayPtTitle").value; //.value.substring(0,10);
				gr.refresh();
				// Close the little popup window
				map.infoWindow.popupInfoView.container.style.display="none";
				map.infoWindow.popupNavigationBar.container.style.display="none";
				// hide mobile keyboard
				document.getElementById("wayPtDesc").blur();
				document.body.focus();
				return false;
			});*/
		});
		
		drawGraphicsCount.push(drawGraphicsLayer.id);
		drawGraphicsCounter++;
		/*var infoTemp=new InfoTemplate(label, "<div class='esriPopupItemTitle'>Way Point found at map click:</div>"+
			"<form id='popupForm'>"+
			"<input id='wayPtTitle' type='text' style='width:150px;margin-left:5px;' value='"+label+"'></input>"+
			"<textarea id='wayPtDesc' onkeyup='javascript:resizeTextBox(this)' style='height:80px; width: calc(100% - 25px)!important;width: -moz-calc(100% - 25x)!important;width: -webkit-calc(100% - 25px)!important; margin:5px; overflow:hidden; resize:none;' "+
			" placeHolder=\"Description\">"+desc+"</textarea>"+
			"<p align='center'><button class='mblButton' type='button' data-dojo-type='dojox/mobile/Button' onclick=\""+
			"	var result1=safeInput(document.getElementById('wayPtTitle'));"+
			"	var result2=safeInput(document.getElementById('wayPtDesc'));"+
			"	if(!result1 || !result2) return;"+
			"	map.getLayer('"+drawGraphicsLayer.id+"').graphics[1].infoTemplate.content=map.getLayer('"+drawGraphicsLayer.id+"').graphics[1].infoTemplate.content.replace(map.getLayer('"+drawGraphicsLayer.id+"').title,document.getElementById('wayPtTitle').value);"+
			"	map.getLayer('"+drawGraphicsLayer.id+"').graphics[1].infoTemplate.content=map.getLayer('"+drawGraphicsLayer.id+"').graphics[1].infoTemplate.content.replace('>'+map.getLayer('"+drawGraphicsLayer.id+"').desc+'</textarea>','>'+document.getElementById('wayPtDesc').value+'</textarea>');"+
			"	map.getLayer('"+drawGraphicsLayer.id+"').graphics[2].infoTemplate.content=map.getLayer('"+drawGraphicsLayer.id+"').graphics[2].infoTemplate.content.replace(map.getLayer('"+drawGraphicsLayer.id+"').title,document.getElementById('wayPtTitle').value);"+
			"	map.getLayer('"+drawGraphicsLayer.id+"').graphics[2].infoTemplate.content=map.getLayer('"+drawGraphicsLayer.id+"').graphics[2].infoTemplate.content.replace('>'+map.getLayer('"+drawGraphicsLayer.id+"').desc+'</textarea>','>'+document.getElementById('wayPtDesc').value+'</textarea>');"+
			"	map.getLayer('"+drawGraphicsLayer.id+"').graphics[1].infoTemplate.title=document.getElementById('wayPtTitle').value;"+
			"	map.getLayer('"+drawGraphicsLayer.id+"').graphics[2].infoTemplate.title=document.getElementById('wayPtTitle').value;"+
			"	map.getLayer('"+drawGraphicsLayer.id+"').title=document.getElementById('wayPtTitle').value;"+
			"	map.getLayer('"+drawGraphicsLayer.id+"').desc=document.getElementById('wayPtDesc').value;"+
			"	map.getLayer('"+drawGraphicsLayer.id+"').graphics[2].symbol.text = document.getElementById('wayPtTitle').value;"+
			"	map.getLayer('"+drawGraphicsLayer.id+"').refresh();"+
			"	map.infoWindow.hide();"+
			"	map.infoWindow.popupInfoView.container.style.display='none';"+
			"	map.infoWindow.popupNavigationBar.container.style.display='none';"+
			"	document.getElementById('wayPtDesc').blur();"+
			"	document.body.focus();"+
			"	\"/>Save</button>&nbsp;&nbsp;"+
			"<button type='button' class='mblButton' onclick='map.infoWindow.hide();map.infoWindow.setTitle(\"\");map.infoWindow.setContent(\"\");"+
			"map.infoWindow.popupInfoView.container.style.display=\"none\";"+
			"map.infoWindow.popupNavigationBar.container.style.display=\"none\";' data-dojo-type='dojox/mobile/Button'>Close</button>&nbsp;&nbsp;"+
			"<button type='button' onclick='map.infoWindow.hide();map.infoWindow.setTitle(\"\");"+
			"map.infoWindow.popupInfoView.container.style.display=\"none\";"+
			"map.infoWindow.popupNavigationBar.container.style.display=\"none\";"+
			"map.graphics.clear();"+
			"map.removeLayer(map.getLayer(\""+drawGraphicsLayer.id+"\"));"+
			"drawGraphicsCount.splice(drawGraphicsCount.indexOf(\""+drawGraphicsLayer.id+"\"),1);"+			
			"map.infoWindow.setContent(\"\");' class='mblButton'>Delete</button></p><br/><br/></form>"
		);*/
		drawGraphicsLayer.on("mouse-over",function(){map.setMapCursor("pointer");});
		drawGraphicsLayer.on("mouse-out",function(){map.setMapCursor("default");});
		drawGraphicsLayer=null;
		label2 = null;
		symbol2 = null;
	});
}

function drawInit() {
  require (["dojo/dom",
    "dijit/registry",
	"dojo/_base/lang",
	"dojo/_base/Color",
	"dojo/on",
	"esri/toolbars/draw",
	"esri/graphic",
	"dojo/json",
	"esri/config",
	"esri/map",
	"esri/geometry/Geometry",
	"esri/geometry/Extent",
	"esri/SpatialReference",
	"esri/tasks/GeometryService",
	"esri/tasks/LengthsParameters",
	"esri/tasks/AreasAndLengthsParameters",
	"esri/layers/FeatureLayer",
	"esri/layers/LabelLayer",
	"esri/symbols/SimpleLineSymbol",
	"esri/symbols/SimpleFillSymbol",
	"esri/symbols/SimpleMarkerSymbol",
	"esri/layers/GraphicsLayer",
	"dijit/form/Select",	  
	"esri/geometry/Point",
	"esri/geometry/Polyline",
	"esri/geometry/webMercatorUtils",
	"esri/symbols/Font",
	"esri/symbols/TextSymbol",
	"esri/InfoTemplate"
	  ], 
  function (dom,registry,lang,Color,on,Draw,Graphic,json, esriConfig, Map, Geometry, Extent, SpatialReference, GeometryService, 
    LengthsParameters, AreasAndLengthsParameters, FeatureLayer, LabelLayer, SimpleLineSymbol, SimpleFillSymbol,SimpleMarkerSymbol,
	GraphicsLayer, Select, Point, Polyline, webMercatorUtils, Font, TextSymbol, InfoTemplate){
	  // listen for Draw Widget close. Reset mouse to identify.
	 // dom.byId("drawDiv").addEventListener('click',function(event){
	//		if (!registry.byId("drawDiv").open) drawExit();
	//  });
	var drawPtHandler1;
	function drawExit(){			
		//drawing=false; turn it off in doIdentify
		toolbar.deactivate();
		map.enableClickRecenter();
		map.enableDoubleClickZoom();
		map.showZoomSlider();
	}

	function activateDrawTool(){
		drawing = true; // flag to turn off identify in identify.js, doIdentify()
		dragging = false;
		//map.disableClickRecenter();
		closeMenu();
		document.getElementById('wayPtsPane').style.display='none';
		//document.getElementById('measurePane').style.display='none';
		map.infoWindow.hide();
		// Register click for Android
		var pointAdded=false;
		if (detectmob()) {
		//if (navigator.userAgent.indexOf('Android') != -1 ) {
		  drawPtHandler1=on(dom.byId("mapDiv_layers"), "click", function(evt) {
			// Measure
			if (measuring){
				// Remove the point symbol since draw toolbar will now draw a line
				if (pointAdded){
					lenGraphicsLayer.clear();
				}
				// Draw first point
				if (!pointAdded) {
					var geometry = getScreenClick(evt);
					var symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,5,null,new Color([255,0,0,1]));
					symbol.setOffset(0,-8);
					lenGraphicsLayer.add(new Graphic(geometry, symbol));
					pointAdded=true;
				}
				return;
			}
			// Way Point
			else {
				drawIt(evt);
			}
		  });
		}	
	}
	
	// Display length
	function outputLength(evtObj) {
		var result = evtObj.result;
		console.log(json.stringify(result));
		var label = result.lengths[0].toFixed(1) +" miles";
		//dom.byId("length").innerHTML = label;
		// addLabel is in javascript/utilFunc.js
		addLabel(labelPoint, label, lenGraphicsLayer, "11pt");
  }
	
  function drawIt(evtObj) {
		if (dragging) {dragging=false;return;}
		if (evtObj.stopImmediatePropagation) evtObj.stopImmediatePropagation(); // don't show the infoWindow when adding a way pt.
		closeAlert();
		if(drawPtHandler1)drawPtHandler1.remove();	
		var map = window.map;//this;
		
		var geometry;
		geometry = getScreenClick(evtObj);

		/*if (evtObj.screenX && evtObj.screenY){
			require(["esri/geometry/screenUtils","esri/geometry/ScreenPoint"], function(screenUtils,ScreenPoint){
				var scrGeom;
				if (navigator.userAgent.indexOf('Android') != -1 )
					scrGeom = new ScreenPoint(evtObj.screenX,evtObj.screenY-132);
				else if (navigator.userAgent.match(/iPhone/i)
							|| navigator.userAgent.match(/iPod/i))
					scrGeom = new ScreenPoint(evtObj.screenX,evtObj.screenY-45);
				else
					scrGeom = new ScreenPoint(evtObj.screenX,evtObj.screenY-132);
				geometry = new screenUtils.toMapPoint(map.extent,document.getElementById("mapDiv").clientWidth,document.getElementById("mapDiv").clientHeight,scrGeom);
				scrGeom=null;
			});
		}
		else if (evtObj.geometry) geometry = evtObj.geometry;// not used????
		else {alert("Problem reading click. Please try again.","");return;}
		*/
		
		//================
		// Add Way Point
		//================
		if (geometry.type == "point"){
			addPoint(geometry,document.getElementById("wayPtInputTitle").value,document.getElementById("wayPtInputDesc").value, addPointSymbol());
			if (map.getScale() > wayPtMaxScale){
				alert("Zooming in to show way points...","",null,false);
				map.setScale(wayPtMaxScale); // zoom in so can see way point. One level below wayPtMaxScale.
				map.centerAt(geometry);
			}
		}
		
		//================
		// Measure Line
		//================
		else if (geometry.type == "polyline"){
			lastPoint=false;
			pointAdded=false;
			measuring=false;
			document.getElementById("removeLengthBtn").style.visibility = "visible";
			//lenGraphicsLayer = new GraphicsLayer();
			//lenGraphicsLayer.id = "lengraphics"+lenGraphicsCounter;
			//lenGraphicsCount.push(lenGraphicsLayer.id);
			//lenGraphicsCounter++;
			// 5-17-18 added var. It was globally changing all symbol variables.
			var symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,10]), 2);
			lenGraphicsLayer.add(new Graphic(geometry, symbol));
			//labelPoint = new Graphic(new Point((geometry.getExtent().xmax - geometry.getExtent().xmin)/2 + geometry.getExtent().xmin, (geometry.getExtent().ymax - geometry.getExtent().ymin)/2 + geometry.getExtent().ymin, map.spatialReference)); 
			labelPoint = new Graphic(new Point(geometry.paths[0][1], map.spatialReference)); 
			
			//setup the parameters for the lengths operation
			var lengthParams = new LengthsParameters();
			lengthParams.lengthUnit = GeometryService.UNIT_STATUTE_MILE;
			lengthParams.calculationType = "geodesic";
			geometryService.simplify([geometry], function(simplifiedGeometries) {
				lengthParams.polylines = simplifiedGeometries;
				geometryService.lengths(lengthParams);
			});
		}
		
		geometryService.on("lengths-complete", outputLength);
		drawExit();
		geometry=null;
		drawing=false;
	}
		
	// Populate the point style drop down on draw widget
  var point = new Select({
		name: "pointStyle",
		id: "pointStyle",
		labelAttr: "label",
		//style: "width:140px",
		options: [
			{ label: "<span class='sprite sprite-ptsmblue'>", value: "smblue" },
			{ label: "<span class='sprite sprite-ptsmgreen'></span>", value: "smgreen" },
			{ label: "<span class='sprite sprite-ptsmgray'></span>", value: "smgray" },
			{ label: "<span class='sprite sprite-ptsmred'></span>", value: "smred" },
			{ type: "separator" },
			{ label: "<span class='sprite sprite-ptmedblue'></span>", value: "medblue" },
			{ label: "<span class='sprite sprite-ptmedgreen'></span>", value: "medgreen" },
			{ label: "<span class='sprite sprite-ptmedgray'></span>", value: "medgray" },
			{ label: "<span class='sprite sprite-ptmedred'></span>", value: "medred" },
			{ type: "separator" },
			{ label: "<span class='sprite sprite-ptlgblue'></span>", value: "lgblue" },
			{ label: "<span class='sprite sprite-ptlggreen'></span>", value: "lggreen" },
			{ label: "<span class='sprite sprite-ptlggray'></span>", value: "lggray" },
			{ label: "<span class='sprite sprite-ptlgred'></span>", value: "lgred" }
		]
	  }, "pointStyleDiv");
	  point.startup();
	  point.set( 'value', 'medblue' );
	
/*	registry.byId("clearGraphics").on("click", function(){
		removeDrawItem();
	});*/
	
	function addPointSymbol() {	
		var symbol;
		// Get the point style from draw point style drop down. 		
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
		return symbol;
	}
  
	function removeDistanceItem(){
		//event.stopImmediatePropagation(); // don't call this twice
		//event.preventDefault(); // don't load a new page
		if (lenGraphicsCount.length == 0) return;
		lenGraphicsCounter--;
		var layer = lenGraphicsCount.pop();
		map.removeLayer(map.getLayer(layer));
		// hide the clear button
		if (lenGraphicsCount.length == 0)
			document.getElementById("removeLengthBtn").style.visibility = "hidden";
		//else
		//	document.getElementById("removeLengthBtn").innerHTML = lenGraphicsCount.length;
		closeMenu();
	}
	
	toolbar = new Draw(map); //, {showTooltips:true});
    toolbar.on("draw-end", lang.hitch(map, drawIt));
	
	// Attatch event handler for carriage return on description input or Add Way Point button
	document.getElementById("wayPtForm").addEventListener("submit", function(event){ 
		event.stopImmediatePropagation(); // don't call this twice
		event.preventDefault(); // don't load a new page
		//var result1 = safeInput(dom.byId("wayPtInputTitle"));
		//var result2 = safeInput(dom.byId("wayPtInputDesc"));
		//if (!result1 || !result2) return;
		safeInput(dom.byId("wayPtInputTitle"));
		safeInput(dom.byId("wayPtInputDesc"));
		map.disableClickRecenter();
		activateDrawTool();
		toolbar.activate(Draw.POINT);		
		map.hideZoomSlider();
		if (map.getScale() > wayPtMaxScale){
			alert("Zooming in to show way points...","",null,false);
			map.setScale(wayPtMaxScale); // zoom in so can see way point. 
		}
		alert("Tap to add a way point","",null,false); // No title, null error obj, no X button
		// hide mobile keyboard
		document.getElementById("wayPtInputDesc").blur();
		document.body.focus();
		return false;
	});
	
	// Measure event handlers
	document.getElementById("lengthBtn").addEventListener("click", function(event){
		toolbar.activate(Draw.POLYLINE);
		measuring = true;
		// Remove last measure line
		if (lenGraphicsCount.length > 0) {
			lenGraphicsCounter--;
			var layer = lenGraphicsCount.pop();
			map.removeLayer(map.getLayer(layer));
		}
		// Store graphic layer name so we can remove it later
		lenGraphicsLayer = new GraphicsLayer();
		lenGraphicsLayer.id = "lengraphics"+lenGraphicsCounter;
		lenGraphicsCount.push(lenGraphicsLayer.id);
		lenGraphicsCounter++;
		//document.getElementById("removeLengthBtn").innerHTML = lenGraphicsCount.length;
		map.addLayer(lenGraphicsLayer); // so that user can see as they are adding points to the line to measure.
		map.disableDoubleClickZoom();
		activateDrawTool();
		map.hideZoomSlider();
		alert("Tap to enter 2 or more points. <button data-dojo-type='dojox/mobile/Button' class='mblButton' onclick='toolbar.finishDrawing()'>Done</button>","",null,false); // No title, null error obj, no X button
	});
	document.getElementById("removeLengthBtn").addEventListener("click", removeDistanceItem);
  });
}

// found in graphicFuncs.js
/*function mlGetPoints() {
	// New format for point:
	//   &point=size|color|x|y|label
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
		url += size+"|"+ptColor+"|"+parseInt(layer.geometry.x) + "|"
			+ parseInt(layer.geometry.y);
		// old point format. Too long!!
		//url += "circle|" +layer.symbol.size+ "|" +rgb[0]+";"+rgb[1]+";"+rgb[2]+ "|0.6|h" + layer.symbol.outline.color.toHex().substr(1)+"|1|"
		//	+ parseInt(layer.geometry.x) + "|"
		//	+ parseInt(layer.geometry.y);
		// If Label
		var id=1;
		if (detectmob) id = 2; // if mobile graphics[1] has grey halo, so id of 2 will have text
		if (map.getLayer(drawGraphicsCount[i]).graphics[id]) {
			if (id==2) layer = map.getLayer(drawGraphicsCount[i]).title;
			else layer = map.getLayer(drawGraphicsCount[i]).graphics[id].symbol.text;
			url +=  "|" +layer.replace(singleQuote,"\\%27").replace(doubleQuote,"\\%22").replace(/,/g,";").replace(/&/g,"and");
			//+ "|"+ "0|" + parseInt(layer.symbol.font.size) + "|0|t|f|f";
		}
		else url+="|Way%20Point";
	}
	return url;
}*/