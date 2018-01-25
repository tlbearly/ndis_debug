// Add way points and measure

var toolbar;
var drawGraphicsCount = [], lenGraphicsCount = []; // store names of graphics layers used to display way points and measure lines
var drawGraphicsCounter = 0, lenGraphicsCounter = 0;
var drawGraphicsLayer,lenGraphicsLayer;
var labelPoint;
var wayPtMaxScale = 4622324;
var wayPointHelp=null;
wayPtClick=false;

function wayPointInit(){
	// Way Point Help Window
	require(["dojo/_base/window","javascript/HelpWin"],function(win,HelpWin){
		wayPointHelp = new HelpWin({
			label: "Way Point Help",
			content: ''
		});
		win.body().appendChild(wayPointHelp.domNode);
		wayPointHelp.startup();
		showWPMapClick();
	});
}

function showWPMapClick(){
	document.getElementById('wpMapClick').style.display='block';
	document.getElementById('wpKML').style.display='none';
	document.getElementById('wpMapClickBtn').className='buttonBarSelected';
	document.getElementById('wpKMLBtn').className='buttonBar';
	wayPointHelp.setContent('Add a Way Point by clicking on the map.<br/><br/>Way points must have a label and can also '+
		'have an optional description. Way points will only show up when you are zoomed in. If needed, the map will automatically zoom in to let you see '+
		'the new way point you are adding. You may adjust the map view by pinching or swiping.<br/><br/>'+
		'<strong>Identifying the Way Point:</strong> Once a way point is added, you may click on it to see the description, '+
		'to edit the label or description, or to delete it.<br/><br/>'+
		'<strong>Bookmarking a Way Point: </strong>In Bookmark (on the main menu) you can save your way '+
		'points in your browser\'s cache.<br/><br/>');		
}
function showWPkml(){
	document.getElementById('wpMapClick').style.display='none';
	document.getElementById('wpKML').style.display='block';
	document.getElementById('wpMapClickBtn').className='buttonBar';
	document.getElementById('wpKMLBtn').className='buttonBarSelected';
	wayPointHelp.setContent('Add Way Points and other graphics from a map you created in MyGoogleMaps, Google Earth, or '+
		'similar program.<br/><br/><strong>Obtaining a KML/KMZ URL:</strong> Export this map to a KML or KMZ (compressed KML) file '+
		'and download it to your computer. Then upload it to '+
		'a publicly shared drive such as:<br/><ul><li>Dropbox</li><li>OneDrive by Microsoft</li><li>Google Drive</li><li>Box</li>'+
		'<li>Apple iCloud Drive</li><li>Amazon Cloud Drive</li></ul><a href="https://www.cnet.com/how-to/onedrive-dropbox-google-drive-and-box-which-cloud-storage-service-is-right-for-you/" '+
		'target="_blank">Link to article that discusses each of these.</a> '+
		'Create a shared link to the KML or KMZ file and copy the URL to this app\'s textbox labeled <strong>\''+
		'URL to KML or KMZ file\'.</strong><br/><br>Enter a label for this KML/KMZ file. Press the Add button and it will add the data to the '+app+
		' map and also add it to the <strong>\'My KML Files List\'</strong>. See example below:<br/><br/>'+
		'<table style="table-layout:fixed;width:100%;"><tbody>'+
		'	<tr>'+
		'		<th style="width:40px;overflow:visible;"></th>'+
		'		<th style="width:calc(100% - 80px);-moz-calc(100% - 80px);text-align:center;-webkit-calc(100% - 80px);">My KML Files List</th>'+
		'		<th style="width:40px"></th>'+
		'	</tr>'+
		'	<tr>'+
		'		<td><input type="checkbox" checked class="checkBoxButton"></td>'+
		'		<td style="overflow-x:scroll">Favorite Places<br/><span style="white-space:nowrap;font-size:small">https://dl.dropboxusercontent.com/u/2142726/esrijs-samples/Wyoming.kml</span></td>'+
		'		<td><img src="assets/images/w_close_red.png" style="cursor: pointer; position: relative; float: right; right: 10px; height: 30px;"/></td>'+
		'	</tr></tbody></table>'+
		'<br/><br/><input type="checkbox" checked class="checkBoxButton"> will show or hide this KML data in the map.<br/><br/>'+
		'<img src="assets/images/w_close_red.png" style="vertical-align:middle;height:30px"/> will remove the KML data from the list and from the map.<br/><br/>'+
		'<strong>My KML Files List</strong> will be stored in your browser '+
		'local storage (like a cookie) so when you visit this site again it will be displayed again. However, if you clear your browser history and clear cookies it will '+
		'be deleted.</br><br/><strong>Bookmarking KML Data: </strong>When you create a Bookmark, the URL of any currently visible KML data will be saved '+
		'with the bookmark. So as long as you have not removed the KML/KMZ file from the publicly shared drive, it will be available to display in this app.<br/><br/>'+
		'<strong>Identifying KML Data: </strong>When you click on a way point or graphic from the KML file, it will show any pictures or descriptions that you have added.');
}
function loadKml(url,label){
	// if user enters a URL to a KML or KMZ file add it to the KML List and call showKml to load it into the map.
	// Error checking
	if (document.getElementById("kmlFile").value == "") {
		alert ("URL must not be blank.","");
		return;
	}
	if (document.getElementById("kmlLabel").value == "") {
		alert ("Label must not be blank.","");
		return;
	}
	var noSpLabel = label.replace(/ +/g,"");
	if (document.getElementById(noSpLabel)) {
		alert ("That Label has already been used.","");
			return;
	}
	document.getElementById("kmlFile").value = "";
	document.getElementById("kmlLabel").value = "";
		
	// Add a row to the KML list
	var kmlList = document.getElementById("kmlList");
	var row = kmlList.insertRow(1);
	var col1 = row.insertCell(0); 
	var col2 = row.insertCell(1);
	var col3 = row.insertCell(2);
	
	safeURL=encodeURI(url);
	col1.innerHTML = '<input id=\''+noSpLabel+'\' type="checkbox" class="checkBoxButton" checked onclick="kmlListClickHandler(\''+safeURL+'\',this.parentNode.parentNode.rowIndex,this.checked)">';
	col2.innerHTML = label+'<br/><span style="white-space:nowrap;font-size:small">'+safeURL+'</span>';
	col2.style.overflowX = "scroll";
	// Remove this KML from the map and delete it from the list
	col3.innerHTML ='<img src="assets/images/w_close_red.png" style="cursor: pointer; position: relative; float: right; right: 10px; height: 30px;" '+
		'onclick="if(document.getElementById(\''+noSpLabel+'\').checked)hideKml(this.parentNode.parentNode.rowIndex);deleteRow(this.parentNode.parentNode);"/>';
	
	showKml(url,1);
}
function deleteRow(row){
	// Remove a row from the My KML Files List
	// row: the row node
	// Called by: X button in a row in My KML Files List Table, or showKml error routine
    document.getElementById("kmlList").deleteRow(row.rowIndex);
	closeMenu();
}
function kmlListClickHandler(url,index,checked){
	// Click Handler for checkbox in My KML Files Table
	// url: url of the KML file
	// index: the index of the table row
	// checked: whether this row's checkbox was checked
	
	closeMenu();
	// Display KML on map
	if (checked) showKml(url,index);
	// Remove KML from map
	else {
		for (var i=3; i<arguments.length; i++)
			map.removeLayer(map.getLayer(arguments[i]));
		removeLayerNamesFromTable(index);
	}
}
function hideKml(index){
	// Removes the given KML from the map
	// index: is not used but makes it easier to parse in removeLayerNamesFromTable
	if (arguments){
		for (var i=1; i<arguments.length; i++)
			map.removeLayer(map.getLayer(arguments[i]));
	}
}
function removeLayerNamesFromTable(index) {
		// if row exists remove graphics & layer names from checkbox and X button
		// remove layer names from checkbox
		var id = document.getElementById("kmlList").rows[index].cells[0].childNodes[0].attributes["id"].nodeValue;
		var checked = document.getElementById(id).checked; // is this checkbox checked? Replacing the innerHTML sets this to false.
		var pos1 = document.getElementById("kmlList").rows[index].cells[0].innerHTML.indexOf("this.checked")+12;
		var pos2 = document.getElementById("kmlList").rows[index].cells[0].innerHTML.lastIndexOf(")");
		var str = document.getElementById("kmlList").rows[index].cells[0].innerHTML.substring(0,pos1) +
			document.getElementById("kmlList").rows[index].cells[0].innerHTML.substring(pos2);
		document.getElementById("kmlList").rows[index].cells[0].innerHTML = str;
		if (checked) document.getElementById(id).checked = true; // reset the checkbox to checked if it was at the start
		else document.getElementById(id).checked = false;
		
		// remove layer names from X button
		pos1 = document.getElementById("kmlList").rows[index].cells[2].innerHTML.indexOf("hideKml(")+8;
		pos2 = document.getElementById("kmlList").rows[index].cells[2].innerHTML.indexOf(");deleteRow");
		str = document.getElementById("kmlList").rows[index].cells[2].innerHTML.substring(0,pos1) + index +
			document.getElementById("kmlList").rows[index].cells[2].innerHTML.substring(pos2);
		document.getElementById("kmlList").rows[index].cells[2].innerHTML = str;
		pos1=null;
		pos2=null;
		str=null;
}
function addLayerNamesToTable(layer,index){
	// Add layer name to click event for checkbox and X button in KML Files List so that we can remove it from the map.
	// Make sure it has not already been added. Seems to call this multiple times for the same layer
	if (document.getElementById("kmlList").rows[index].cells[0].innerHTML.indexOf(layer) == -1){
		var id = document.getElementById("kmlList").rows[index].cells[0].childNodes[0].attributes["id"].nodeValue;
		var checked = document.getElementById(id).checked; // is this checkbox checked? Replacing the innerHTML sets this to false.
		// Add layer name to click event for checkbox in KML Files List so that we can remove it from the map when unchecked.
		var str = document.getElementById("kmlList").rows[index].cells[0].innerHTML;
		var pos=str.lastIndexOf(")");
		var newClickEvent = str.substr(0,pos) + ",'" +layer + "'"+str.substr(pos);
		document.getElementById("kmlList").rows[index].cells[0].innerHTML = newClickEvent;
		if (checked) document.getElementById(id).checked = true; // reset the checkbox to checked if it was at the start
		else document.getElementById(id).checked = false;
		
		// Add layer name to click event for X icon in KML Files List so that we can remove it from the map and the list.
		str = document.getElementById("kmlList").rows[index].cells[2].innerHTML;
		pos=str.indexOf(");deleteRow");
		newClickEvent = str.substr(0,pos) + ",'" +layer +"'";
		newClickEvent += str.substr(pos);
		document.getElementById("kmlList").rows[index].cells[2].innerHTML = newClickEvent;
	}
}
function showKml(theUrl,theIndex){
	// Shows the given KML on the map. The layer names that were added to the map from this KML file are added to the click handlers for
	// the checkbox and X button for this row of the My KML Files List table.
	showLoading();
	var url = theUrl;
	var index = theIndex;
	require(["esri/layers/KMLLayer","esri/geometry/webMercatorUtils","esri/graphicsUtils","dojo/_base/array","esri/symbols/SimpleLineSymbol",
		"esri/symbols/SimpleMarkerSymbol","dojo/_base/Color","esri/geometry/Extent"], function (KMLLayer,webMercatorUtils,graphicsUtils,array,
		SimpleLineSymbol,SimpleMarkerSymbol,Color,Extent) {
	// Load onto the Map
		esri.config.defaults.io.proxyUrl = "/proxy/DotNet/proxy.ashx";
		esriConfig.defaults.io.alwaysUseProxy = false;
		// test file: http://www.wpc.ncep.noaa.gov/kml/qpf/QPF24hr_Day1_main.kml
		// test file: https://dl.dropboxusercontent.com/u/2142726/esrijs-samples/Wyoming.kml
		var kmlExtent=null;
		var kmlLayer = new KMLLayer(url);
		map.addLayer(kmlLayer);
		
		/*var layers = kmlLayer.getLayers();
		array.forEach(layers, function(layer){
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
			console.log (evt.layer.id);
			// Add layer name to click event for checkbox and X button in KML Files List so that we can remove it from the map.
			addLayerNamesToTable(evt.layer.id,index);
			// hide keyboard
			document.getElementById("kmlFile").blur();
			document.body.focus();
			closeMenu();
			//slideLeft(document.getElementById('wayPtsPane'));
			//var kmlLoaded = map.on("layer-add-result",function(evt2){
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
						
						/*array.forEach(layer.graphics,function(g){
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
			if (kmlLayer.folders)
				console.log("Has Folders="+kmlLayer.folders.length);
			if (layers[0].graphics)
				console.log("Has Graphics="+layers[0].graphics.length);
			dojo.forEach(layers, function(lyr) {  
				if ( lyr.graphics && lyr.graphics.length > 0 ) {
					// Add layer name to click event for checkbox and X button in KML Files List so that we can remove it from the map.
					// Make sure it has not already been added. Seems to call this multiple times for the same layer
					//addLayerNamesToTable(lyr.graphics[0]._layer.id,index);
					if (lyr.graphics[0].geometry.spatialReference.wkid == 4326)
						lyrExtent = webMercatorUtils.geographicToWebMercator(graphicsUtils.graphicsExtent(lyr.graphics) ); 
					else if (lyr.graphics[0].geometry.spatialReference.wkid == 102100)
						lyrExtent = graphicsUtils.graphicsExtent(lyr.graphics);
					//***************** to do *******************
					else alert("need to convert spatial reference");
					if (lyrExtent === null) lyrExtent= new Extent(lyr.graphics.x,lyr.graphics.y,lyr.graphics.x,lyr.graphics.y,lyr.graphics.spatialReference);
					if (lyrExtent) (kmlExtent) ? kmlExtent.union(lyrExtent): kmlExtent = lyrExtent;
				}  
			});
			if (kmlExtent) map.setExtent(kmlExtent);
			hideLoading();
		});
		kmlLayer.on("error", function(e){
			deleteRow(document.getElementById("kmlList").rows[index]);
			// hide keyboard
			document.getElementById("kmlFile").blur();
			document.body.focus();
			
			alert(e.error.message,"Warning");
			hideLoading();
		});
	});			
}
		
function safeInput(txtBox) {
	var ch=["~","|",";","#","^","%","\\","&"];
	var msg="",count=0;
	for (var i=0; i<ch.length; i++) {
		if (txtBox.value.indexOf(ch[i])>-1){
			switch (ch[i]) {
				case "&":
					txtBox.value=txtBox.value.replace(/&/g,"and");
					break;
				case "~":
					txtBox.value=txtBox.value.replace(/~/g,"");
					break;
				case "|":
					txtBox.value=txtBox.value.replace(/\|/g,"");
					break;
				case ";":
					txtBox.value=txtBox.value.replace(/;/g,"");
					break;
				case "#":
					txtBox.value=txtBox.value.replace(/#/g,"");
					break;
				case "^":
					txtBox.value=txtBox.value.replace(/\^/g,"");
					break;
				case "%":
					txtBox.value=txtBox.value.replace(/%/g,"");
					break;
				case "\\":
					txtBox.value=txtBox.value.replace(/\\/g,"");
					break;
			}
			msg += ch[i]+" ";
			count++;
		}
	}
	if (count>1)
		alert(msg+"are not allowed. They were removed.","Note");
	else if (count==1)
		alert(msg+"is not allowed. It was removed.","Note");
	if (count== 0) return true;
	else return false;
}
function resizeTextBox(txtBox) {
	// Make the Way Point popup have an expanding text box
	// Called by: resize, orientation change, and identify.js/placeIdGroupCombo (runs same code)
	if (!txtBox) return;
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
		drawGraphicsLayer.setMinScale(wayPtMaxScale+1);
		drawGraphicsLayer.setMaxScale(0);
		map.addLayer(drawGraphicsLayer);
		drawGraphicsLayer.refresh();
		drawGraphicsLayer.content = "<div class='esriPopupItemTitle'>Way Point found at map click:</div>"+
			"<form id='popupForm'>"+
			"<input id='wayPtTitle' type='text' style='width:150px;margin-left:5px;' value='"+label+"'></input>"+
			"<textarea id='wayPtDesc' onkeyup='javascript:resizeTextBox(this)' style='height:80px; width: calc(100% - 25px)!important;width: -moz-calc(100% - 25x)!important;width: -webkit-calc(100% - 25px)!important; margin:5px; overflow:hidden; resize:none;' "+
			" placeHolder=\"Description\">"+desc+"</textarea>"+
			"<p align='center'><button class='mblButton' type='button' onclick=\"var gr=map.getLayer('"+drawGraphicsLayer.id+"');"+
			"var result1=safeInput(document.getElementById('wayPtTitle'));"+
			"var result2=safeInput(document.getElementById('wayPtDesc'));"+
			"if(!result1 || !result2) return false;"+
			"gr.content = gr.content.replace(gr.title,document.getElementById('wayPtTitle').value);"+
			"gr.content = gr.content.replace(gr.desc+'</textarea>',document.getElementById('wayPtDesc').value+'</textarea>');"+
			"gr.title=document.getElementById('wayPtTitle').value;"+
			"gr.desc=document.getElementById('wayPtDesc').value;"+
			"gr.graphics[2].symbol.text = document.getElementById('wayPtTitle').value;"+
			"gr.refresh();"+
			"map.infoWindow.hide();"+
			"map.infoWindow.popupInfoView.container.style.display='none';"+
			"map.infoWindow.popupNavigationBar.container.style.display='none';"+
			"document.getElementById('wayPtDesc').blur();"+
			"document.body.focus();"+
			"\">Save</button>&nbsp;&nbsp;"+
			"<button type='button' class='mblButton' onclick='map.infoWindow.setTitle(\"\");map.infoWindow.setContent(\"\");"+
			"map.infoWindow.hide();"+
			"map.infoWindow.popupInfoView.container.style.display=\"none\";"+
			"map.infoWindow.popupNavigationBar.container.style.display=\"none\";' data-dojo-type='dojox/mobile/Button'>Close</button>&nbsp;&nbsp;"+
			"<button type='button' onclick='map.infoWindow.setTitle(\"\");"+
			"map.infoWindow.hide();"+
			"map.infoWindow.popupInfoView.container.style.display=\"none\";"+
			"map.infoWindow.popupNavigationBar.container.style.display=\"none\";"+
			"map.graphics.clear();"+
			"map.removeLayer(map.getLayer(\""+drawGraphicsLayer.id+"\"));"+
			"drawGraphicsCount.splice(drawGraphicsCount.indexOf(\""+drawGraphicsLayer.id+"\"),1);"+			
			"map.infoWindow.setContent(\"\");' class='mblButton'>Delete</button></p><br/><br/></form>";
		drawGraphicsLayer.title = label;
		drawGraphicsLayer.desc = desc;
		drawGraphicsLayer.on ("click", function(event){
			if (drawing) return;
			wayPtClick=true;
			//drawing=true;
			clickPoint = getScreenClick(event);
			map.infoWindow.setTitle(this.title);
			map.infoWindow._contentPane.innerHTML=this.content;
			getIdentifyFooter();
			showIdentify(); // requires global variable, clickPoint
			// Listen for orientation change or resize then resize description text box
			var supportsOrientationChange = "onorientationchange" in window, orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";
			window.addEventListener(orientationEvent, function () {
				//showLoading();
				// wait 1/2 a second for screen to draw
				setTimeout(resizeTextBox(document.getElementById("wayPtDesc")), 500);
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
				map.setScale(wayPtMaxScale); // zoom in so can see way point.
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
			symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,10]), 2);
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
		var result1 = safeInput(dom.byId("wayPtInputTitle"));
		var result2 = safeInput(dom.byId("wayPtInputDesc"));
		if (!result1 || !result2) return;
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