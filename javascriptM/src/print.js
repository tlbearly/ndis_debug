var prtDisclaimer="";
var sizeCombo,orientCombo;
var outputName="";
var startTim;
/****************************************** */
/*  Quickly add or remove large print sizes */
var useLargeSizes = true; // if true gives page sizes 17x22 and 22x34 also.

function printInit() {
	require(["dojo/store/Memory","dijit/form/ComboBox", "dijit/form/Select"],function(Memory,ComboBox,Select){
		// Create dojox combo boxes
		var sizeStore;
		if (useLargeSizes){
			sizeStore = new Memory({
				idProperty: "name",
				data: [{name:"8.5 x 11"},
							{name: "11 x 17"},
							{name: "17 x 22"},
							{name: "22 x 34"}]
			});
		}
		else{
			sizeStore = new Memory({
				idProperty: "name",
				data: [{name:"8.5 x 11"},
							{name: "11 x 17"}]
			});
		}
		sizeCombo = new Select({
			id: "size",
			name: "size",
			store: sizeStore,
			value: sizeStore.data[0].name,
			sortByLabel: false,
			labelAttr: "name",
			maxHeight: -1, // prevent drop-down from causing entire page to grow in size
			style: {margin: "auto"},
			onChange: function(){
				changePrintSize();
			}
		}, "size");
		sizeCombo.startup();
	
		var orientStore = new Memory({
			idProperty: "name",
			data: [{name:"Landscape"},
						{name: "Portrait"}]
			});
		orientCombo = new Select({
			id: "orient",
			name: "orient",
			store: orientStore,
			value: orientStore.data[1].name,
			sortByLabel: false,
			labelAttr: "name",
			maxHeight: -1, // prevent drop-down from causing entire page to grow in size
			style: {margin: "auto"},
			onChange: function(){
				changePrintSize();
			}
		}, "orient");
		orientCombo.startup();
	});

	
	// Read the PrintPdfWidget.xml file
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
		}
		else if (xmlhttp.status === 404) {
			alert("Error: Missing PrintPdfWidget.aspx file in "+app+ " directory.","Data Error");
			hideLoading();
		}
		else if (xmlhttp.readyState===4 && xmlhttp.status===500) {
			alert("Missing PrintPdfWidget.aspx file. app="+app,"Data Error");
			hideLoading();
		}
	};
	xmlhttp.open("GET",xmlFile,true);
	xmlhttp.send();
}

// Make scrollbar move on mobile map preview if it wider then the screen width
/*function scrollBarMove() {
	// Calculate width of print preview window
	var parentWidth = document.getElementById("previewContainer").offsetWidth;
	//var parentWidth = document.body.clientWidth; // subtract padding
	//if (parentWidth > parseInt(document.getElementById("previewContainer").style.maxWidth))
	//	parentWidth = parseInt(document.getElementById("previewContainer").style.maxWidth);
	//parentWidth = parentWidth * 0.80;
	var move = (document.getElementById('previewContainer').scrollLeft / parseInt(previewMap.width+10)) * parentWidth+document.getElementById('previewContainer').scrollLeft+5+"px";
	document.getElementById('scroll1').style.left=move;
	document.getElementById('scroll2').style.left=move;
	//console.log("move bar:"+move);
}*/

/*function printScrollDown(){
	document.getElementById("printScroll").scrollTop=document.getElementById('previewTitle').offsetTop;
}
function printScrollUp(){
	document.getElementById("printScroll").scrollTop=0;
}*/
function printShow(){
	require(["esri/map","esri/SpatialReference","esri/layers/GraphicsLayer","esri/graphic",
	"esri/layers/ArcGISTiledMapServiceLayer","esri/layers/ArcGISDynamicMapServiceLayer","esri/geometry/Point",
	"esri/layers/OpenStreetMapLayer",
	"esri/symbols/SimpleLineSymbol",
	"esri/symbols/SimpleMarkerSymbol",
	"dojo/_base/Color",
	"dojo/dom",
	"dijit/registry"
	],
	function(Map,SpatialReference,GraphicsLayer,Graphic,ArcGISTiledMapServiceLayer,ArcGISDynamicMapServiceLayer,
		Point,OpenStreetMapLayer,	SimpleLineSymbol,	SimpleMarkerSymbol,	Color,	dom, registry){
		try {
			document.getElementById("showPreviewMap").checked = false; // always start with preview map hidden
			drawing=true;
			document.getElementById("print_button").style.display="block";
			document.getElementById("printMapLink").innerHTML = "";
			document.getElementById("print_link").style.display="none";
			document.getElementById("printMB").style.display="none";
			//document.getElementById("pdf_name").classList.remove("error");
			//document.getElementById("previewContainer").addEventListener("scroll",scrollBarMove);
			document.getElementById("print_instr").style.display="block";
			document.getElementById("sizeLabel").style.display="inline";
			document.getElementById("size").style.display="inline-table";
			document.getElementById("mapscale").style.display="inline";
			document.getElementById("mapscaleList").style.display="inline-table";
			document.getElementById("orientLabel").style.display="inline";
			document.getElementById("orient").style.display="inline-table";
			document.getElementById("pdf_name_label").style.display="block";
			document.getElementById("pdf_name").style.display="block";
			
			document.getElementById("pdf_name").onclick=function(){
				 // scroll to bottom so that the file name input box is not hidden by the keyboard
				document.getElementById("printScroll").scrollTop=2000;
			};
			document.getElementById("pdf_name").onkeyup=function(e){
				// listen for the enter key or button press on mobile keyboard and hide keyboard
				if (e.keyCode == 13) {
					document.getElementById("pdf_name").blur();
				}
			};
			//document.getElementById("previewContainer").style.display="block";
			document.getElementById("printPreview").style.display="block";
			document.getElementById("previewCkBx").style.display="block";
			//document.getElementById("scrollUpBtn").style.display="block";
			//document.getElementById("scrollDownBtn").style.display="block";
			//document.getElementById("printLegendLink").innerHTML = "";
			// previewMap is created in readConfig.js
			//document.getElementById("printTitle").value = "My Custom Map";
			//document.getElementById("printSubTitle").value = "CPW Atlas";
			previewMap.removeAllLayers();
			var sr = new SpatialReference({
				"wkid": wkid
			});
			
			// add basemap
			if (previewMap.getLayer("basemap"))
				previewMap.removeLayer(previewMap.getLayer("basemap"));
			if (previewMap.getLayer("reference"))
				previewMap.removeLayer(previewMap.getLayer("reference"));
			var basemapId=0;
			var basemapRefId=-1;
			var basemap;
			for (i=0;i<map.layerIds.length; i++){
				if (map.getLayer(map.layerIds[i])._basemapGalleryLayerType && map.getLayer(map.layerIds[i])._basemapGalleryLayerType == "basemap")
					basemapId = i;
				else if (map.getLayer(map.layerIds[i])._basemapGalleryLayerType && map.getLayer(map.layerIds[i])._basemapGalleryLayerType == "reference")
					basemapRefId = i;
			}
			if (map.layerIds[basemapId] == "layer_osm"){
				var osmLayer = new OpenStreetMapLayer();
				previewMap.addLayer(osmLayer);
				osmLayer = null;
			}
			else{
				basemap = new ArcGISTiledMapServiceLayer(map.getLayer(map.layerIds[basemapId]).url,{"id":"basemap","visible": true});
				basemap.spatialReference = map.spatialReference;
				basemap.refresh();
				previewMap.addLayer(basemap);
				basemap = null;
			}
			// add basemap reference layer if there is one
			if (basemapRefId != -1) {
				basemap = new ArcGISTiledMapServiceLayer(map.getLayer(map.layerIds[basemapRefId]).url,{"id":"reference","visible":true});
				basemap.spatialReference = map.spatialReference;
				basemap.refresh();
				previewMap.addLayer(basemap);
				basemap=null;
			}
			
			// set layers
			var prev_layer, map_layer, countLayers=0, processedLayers=0,previewLayers=[],correctOrder=[];
			// Count number of visible non-basemap layers, so we can add them in the correct order. tlb 8-14-17
			for (i=0; i<map.layerIds.length; i++) {
				map_layer = map.getLayer(map.layerIds[i]);		
				if (map_layer.id.indexOf("layer") == 0) continue;
				if (map_layer.url.indexOf("World_Street_Map") > -1) continue;
				if (map_layer.layerInfos && map_layer.visible){ 
					countLayers++;
					correctOrder.push(map_layer.id);
				}
			}
			// Cannot print only basemap Warning
			if (countLayers == 0){
				alert("Printing of basemaps alone does not work. Please add map layers. From the menu, select 'Layers &amp; Legend.'","Warning");
				drawing=false;
				return;
			}
			for (i=0; i<map.layerIds.length; i++){
				map_layer = map.getLayer(map.layerIds[i]);
				if (map_layer.layerInfos && map_layer.visible){
					// copy the visibleLayers array by value not address
					var visLayers = [];
					for (var j=0; j<map_layer.visibleLayers.length; j++)
						visLayers.push(parseInt(map_layer.visibleLayers[j]));
					prev_layer = new ArcGISDynamicMapServiceLayer(map_layer.url, {
						"opacity": parseFloat(map_layer.opacity),
						"id":map_layer.id,
						"visible": map_layer.visible
					});
					prev_layer.setVisibleLayers(visLayers);
					visLayers = null;
					prev_layer.on("load", function(event) {
						// wait for layerInfos to load
						var layer = event.layer;
						// Skip basemaps
						if (layer.url.indexOf("World_Street_Map") > -1) return;
						if (layer.id.indexOf("layer") == 0) return;
						
						processedLayers++;
						var visLayers = layer.visibleLayers;
						var layerInfos = layer.layerInfos;
						var m;
						// add hidden group ids
						for (j=0; j<layer.visibleLayers.length; j++) {
							k=layer.visibleLayers[j];
							do {
								// Add hidden group sublayers for all levels
								if (hideGroupSublayers.indexOf(layerInfos[k].name) > -1 && layerInfos[k].subLayerIds) {
									for (m=0; m<layerInfos[k].subLayerIds.length; m++){
										if (visLayers.indexOf(layerInfos[k].subLayerIds[m]) == -1)
											visLayers.push(layerInfos[k].subLayerIds[m]);
										// handle GMUs they are not always an offset of 1
										if (layerInfos[layerInfos[k].subLayerIds[m]+1].name == "Big Game GMU"){
											var offset=1;
											if (gmu == "Bighorn GMU") offset = 2;
											else if (gmu == "Goat GMU") offset = 3;
											if (visLayers.indexOf(layerInfos[k].subLayerIds[m]+offset) == -1)
												visLayers.push(layerInfos[k].subLayerIds[m]+offset);
										}
										else if (visLayers.indexOf(layerInfos[k].subLayerIds[m]+1) == -1)
											visLayers.push(layerInfos[k].subLayerIds[m]+1);
									}
								}
								k = layerInfos[k].parentLayerId;
							}
							while (k != -1);
						}
						
						// Set visible layers for each layerInfo
						var num = new Array(0,1,2,3,4,5,6,7,8,9);
						for (m=0; m<layerInfos.length; m++)
						{	
							// If layer is found in the visLayers make it visible.
							if (visLayers.indexOf(layerInfos[m].id) != -1)
								layerInfos[m].visible = true;
							
							// Else if this is not the top layer and it has no sub-layers set default visibility
							else if (layerInfos[m].parentLayerId != -1 && !layerInfos[m].subLayerIds)
							{
								// if this is a gmu layer make sure it is the one that was turned on in visLayers
								if (layerInfos[m].name.substr(layerInfos[m].name.length-3,3).indexOf("GMU") > -1){
									if (layerInfos[m].name == gmu) {
										if (visLayers.indexOf(m) == -1) {
											layerInfos[m].visible = true;
										}
										if ((num.indexOf(parseInt(layerInfos[layerInfos[m].parentLayerId].name.substr(0,1))) > -1) &&
											(visLayers.indexOf(layerInfos[m].parentLayerId) == -1)){
											layerInfos[layerInfos[m].parentLayerId].visible = true;
										}
									}
									else 
										layerInfos[m].visible = false;
								}
								// use the default value for sub menu item layers that are under a menu item that is unchecked
								else if ((layerInfos[m].defaultVisibility == true) && (visLayers.indexOf(layerInfos[m].parentLayerId) === -1)){
									// If by default it is visible see if the name of the parent is a number (varies with extent) and make it visible also
									if (num.indexOf(parseInt(layerInfos[layerInfos[m].parentLayerId].name.substr(0,1))) > -1) {
										//visLayers.push(layerInfos[m].parentLayerId);
										layerInfos[layerInfos[m].parentLayerId].visible = true;
									}
								}
							}
							// Else this is a top level toc menu item and not found in the visible list, make it not visible.
							else {
								layerInfos[m].visible = false;
							}
							
							// Remove parent layers from visLayers
							var pos = visLayers.indexOf(layerInfos[m].id);
							if (pos > -1 && layerInfos[m].subLayerIds)
								visLayers.splice(pos,1); // remove 1 item at index pos
						}								
						layer.setVisibleLayers(visLayers.sort(function(a,b){return a-b;}), false);
						layer.refresh();
						layer.spatialReference=sr;
						
						// Add layers in the correct order. tlb 8-14-17
						previewLayers.push(layer);
						if (processedLayers==countLayers) {
							for (i=0; i<correctOrder.length; i++){
								for (j=0; j<previewLayers.length; j++){
									if (correctOrder[i] == previewLayers[j].id){
										previewMap.addLayer(previewLayers[j]);				
									}
								}
							}
							previewLayers=null;
							correctOrder=null;
						}
					});
				}
			}
		
			// add draw graphics layers
			var graphics_layer, arr;
			for (i=0; i<map.graphicsLayerIds.length; i++){
				if ((map.graphicsLayerIds[i].indexOf("drawgraphics")>-1) ||
					(map.graphicsLayerIds[i].indexOf("drawtextgraphics")>-1)){
					graphics_layer = new GraphicsLayer();
					graphics_layer.id = map.graphicsLayerIds[i];
					graphics_layer.visible=true;
					graphics_layer.spatialReference = previewMap.spatialReference;
					var graphics = map.getLayer(map.graphicsLayerIds[i]).graphics;
					for (var a=0; a<graphics.length; a++){
						arr = new Graphic(graphics[a].geometry,graphics[a].symbol,graphics[a].attributes,graphics[a].infoTemplate);
						graphics_layer.add(arr);
						arr=null;
					}
					previewMap.addLayer(graphics_layer);
					graphics_layer = null;
					graphics=null;
				}
			}
			// add hb1298 points
			/*if (typeof hb1298GraphicsLayer != "undefined") {
				graphics_layer = new GraphicsLayer();
				graphics_layer.visible=true;
				graphics_layer.spatialReference = previewMap.spatialReference;
				for (var a=0; a<hb1298GraphicsLayer.graphics.length; a++){
					arr = new Graphic(graphics[a].geometry,graphics[a].symbol,graphics[a].attributes,graphics[a].infoTemplate);
					graphics_layer.add(arr);
					arr=null;
				}
				previewMap.addLayer(graphics_layer);
				graphics_layer = null;
				graphics=null;
			}*/
			
			previewMap.spatialReference = sr;
			
			var level = map.getLevel();
			// Map scale changed on main map, update previewMap and map scale drop down, then show print dialog
			if (level != previewMap.getLevel()){
				previewMap.extent = map.extent;
				document.getElementById("printPreview").style.display = "none"; // hide map preview. It will get turned on in changePrintSize() 
				// Changing the mapscale list will call changePrintSize() and previwMap.setScale()
				dijit.byId("mapscaleList").set("displayedValue",Math.round(level)); // Update drop down map scale to match map extent
			}
			else {
				previewMap.extent = map.extent;
				changePrintSize();
			}
			printDialog.show();
			sr=null;
		}catch(e) {
			alert("Problem loading print menu. Error message: "+e.message,"Notice",e);
		}
	});
}

function changePrintSize(scaleChange){
	require(["esri/geometry/Point","esri/geometry/Extent","esri/SpatialReference","dojo/dom","dijit/registry"],function(Point,Extent,SpatialReference,dom,registry){
		if (!previewMap || !previewMap.extent) {
			alert("Please wait for page to load.");
			return;
		}
		document.getElementById("printMapLink").innerHTML = "";
		//document.getElementById("printLegendLink").innerHTML = "";
		//var container = document.getElementById("printPreviewMap");
		var orient = dom.byId("orient");
		var selectedValue_orient = orientCombo.attr("displayedValue");
		var size = dom.byId("size");
		var selectedValue_size = sizeCombo.attr("displayedValue");

		// User just reset the map scale. Reset page size if necessary for this map scale.
		if (scaleChange){
			//var list = document.getElementById("mapscaleList");
			//var scale = list.options[list.selectedIndex].value;
			var scale = dijit.byId("mapscaleList").get("value");
			// preview map extent is set 1st time and on orientation or map area change.
			var pgWidth = (3.28084 * (map.extent.xmax - map.extent.xmin) * 12) / scale;
			var pgHeight = (3.28084 * (map.extent.ymax - map.extent.ymin) * 12) / scale;
			//alert("For this map scale, set the Map area to at least: "+parseInt(pgWidth) +" x "+ parseInt(pgHeight),"NOTE");
			var largest;
			if (selectedValue_orient == "Landscape"){
				largest = pgWidth;
				//var w = parseFloat(selectedValue_size.substr(selectedValue_size.indexOf("x ")+1));
			}
			else {
				//var h = parseFloat(selectedValue_size.substr(0,selectedValue_size.indexOf("x ")-1));
				largest = pgHeight;
			}
			// Set page size to display scale
			if (!useLargeSizes){
				if (largest <= 11){
					if (selectedValue_size != "8.5 x 11"){
						selectedValue_size = "8.5 x 11";
						sizeCombo.set("value","8.5 x 11");
						return;
					}
				}
				else {
					if (selectedValue_size != "11 x 17"){
						selectedValue_size = "11 x 17";
						sizeCombo.set("value","11 x 17");
						return;
					}
				}
			}
			else {
				// if using large sizes
				if (largest <= 11){
					if (selectedValue_size != "8.5 x 11"){
						selectedValue_size = "8.5 x 11";
						sizeCombo.set("value","8.5 x 11");
						return;
					}
				}
				else if (largest <= 17){
					if (selectedValue_size != "11 x 17"){
						selectedValue_size = "11 x 17";
						sizeCombo.set("value","11 x 17");
						return;
					}
				}
				else if (largest <= 22){
					if (selectedValue_size != "17 x 22"){
						selectedValue_size = "17 x 22";
						sizeCombo.set("value","17 x 22");
						return;
					}
				}
				else {
					if (selectedValue_size != "22 x 34"){
						selectedValue_size = "22 x 34";
						sizeCombo.set("value","22 x 34");
						return;
					}
				}
			}
		}

		if (selectedValue_size == "8.5 x 11") selectedValue_size = "Letter ";
		else	if (selectedValue_size == "11 x 17") selectedValue_size = "Tabloid ";
		else if (selectedValue_size == "17 x 22") selectedValue_size = "ANSIC ";
		else if (selectedValue_size == "22 x 34") selectedValue_size = "ANSID ";
		//var pt = map.extent.getCenter();
		//var level = previewMap.getLevel();
		
		if (selectedValue_orient == "Landscape") {
			// borders: .8 on sides, 1.25 on top and bottom
			// 11 X 8.5
			// 10.2 x 7.25 inch image (without borders)
			// 979 x 696 pixels in screen resolution (inches * 96)
			// 490 x 348 50% of that
			if (selectedValue_size == "Letter "){
				previewMap.width=979;
				previewMap.height=696;
				registry.byId("printPreviewMap").resize({w:previewMap.width,h:previewMap.height});
			}
			// 17 x 11
			// 17-.8 x 11-1.25
			// 16.2 x 8.75 inch image (without borders)
			// 1555 x 936 pixels in screen resolution
			// 544 x 328 35% of that
			else if (selectedValue_size == "Tabloid ") {
				previewMap.width=1555;
				previewMap.height=936;
				registry.byId("printPreviewMap").resize({w:previewMap.width,h:previewMap.height});
			}
			// 22-.8 x 17-1.25
			// 21.2 x 15.25 inch image (without borders)
			// 2035.2 x 1464 pixels in screen resolution (inches * 96)
			// 407 x 293 20% of that
			else if (selectedValue_size == "ANSIC ") {
				previewMap.width=2035;
				previewMap.height=1464;
				registry.byId("printPreviewMap").resize({w:previewMap.width,h:previewMap.height});
			}
			// 34-.8 x 22-1.25
			// 33.2 x 20.25 inch image (without borders)
			// 3187.2 x 1944 pixels in screen resolution (inches * 96)
			// 407 x 293 20% of that
			else if (selectedValue_size == "ANSID ") {
				previewMap.width=3187;
				previewMap.height=1944;
				registry.byId("printPreviewMap").resize({w:previewMap.width,h:previewMap.height});
			}
			// 14-.8 x 8.5-1.25
			// 13.2 x 7.25 inch image (without borders)
			// 1267 x 696 pixels in screen resolution (inches * 96)
			// 506 x 278 40% of that
			//else if (selectedValue_size == "8.5 x 14 ") {
			//	previewMap.width=506;
			//	previewMap.height=278;
			//	registry.byId("printPreviewMap").resize({w:506,h:278});
			//}
		}
		// Portrait
		else {
			// 8.5 x 11
			// 7.7 x 9.75 inch image (without borders)
			// 739 x 936 pixels in screen resolution (inches * 96)
			// 370 x 468 50% of that
			if (selectedValue_size == "Letter "){
				previewMap.width=739;
				previewMap.height=936;
				registry.byId("printPreviewMap").resize({w:previewMap.width,h:previewMap.height});
			}
			// 11 x 17
			// 11-.8 x 17-1.25
			// 10.2 x 15.75 inch image (without borders)
			// 979 x 1512 pixels in screen resolution
			// 343 x 529 35% of that
			else if (selectedValue_size == "Tabloid ") {
				previewMap.width=979;
				previewMap.height=1512;
				registry.byId("printPreviewMap").resize({w:previewMap.width,h:previewMap.height});
			}
			// 17-.8 x 22-1.25
			// 16.2 x 20.25 inch image (without borders)
			// 1555.2 x 1944 pixels in screen resolution (inches * 96)
			// % of that
			else if (selectedValue_size == "ANSIC ") {
				previewMap.width=1555;
				previewMap.height=1944;
				registry.byId("printPreviewMap").resize({w:previewMap.width,h:previewMap.height});
			}
				// 22-.8 x 34-1.25
			// 21.2 x 32.25 inch image (without borders)
			// 2035.2 x 3096 pixels in screen resolution (inches * 96)
			// of that
			else if (selectedValue_size == "ANSID ") {
				previewMap.width=2035;
				previewMap.height=3096;
				registry.byId("printPreviewMap").resize({w:previewMap.width,h:previewMap.height});
			}
			// 8.5 x 14
			// 7.7 x 12.75 inch image (without borders)
			// 739 x 1224 pixels in screen resolution (inches * 96)
			// 296 x 490 40% of that
			//else if (selectedValue_size == "8.5 x 14 ") {
			//	previewMap.width=296;
			//	previewMap.height=490;
			//	registry.byId("printPreviewMap").resize({ w:296,h:490});
			//}
		}


		// fix size of display map
		document.getElementById("printPreviewMap").style.width = previewMap.width+"px";
		document.getElementById("printPreviewMap").style.height = previewMap.height+"px";
		var root = document.getElementById("printPreviewMap_root");
		root.style.width = previewMap.width+"px";
		root.style.height = previewMap.height+"px";
		root.style.overflow = "auto";

		// Update preview map if checked
		showPrintPreview();
	});
}

/*function grayOutLegend(format){
	require(["dojo/dom",],function(dom){
		document.getElementById("printMapLink").innerHTML = "";
		document.getElementById("printLegendLink").innerHTML = "";
		if (format.value != "geopdf" && format.value != "pdf" && dom.byId("printLegend")){
			dom.byId("printLegendCB").style.display = "none";
		}
		else{
			dom.byId("printLegendCB").style.display = "inline-block";
		}
		if (format.value != "geotiff")
			document.getElementById("printInst").innerHTML = "Disable pop-up blocker. Printout will open in a new tab.";
		else
			document.getElementById("printInst").innerHTML = "";
	});
}*/

function printMap(){
  require([
			"esri/tasks/PrintTask", "esri/tasks/PrintTemplate", "esri/tasks/PrintParameters",
			"esri/graphic", "esri/geometry/Point",
			"esri/tasks/LegendLayer", "esri/layers/GraphicsLayer", "dojo/dom"
		], function(
		PrintTask, PrintTemplate, PrintParameters,
		Graphic, Point,
		LegendLayer, GraphicsLayer, dom) {
		var pointWithText;
		try{
			if (document.getElementById("pdf_name").value == ""){
				document.getElementById("pdf_name").classList.add("error");
				document.getElementById("pdf_name").placeholder = "Please enter a file name.";
				return;
			}
			else {
				// Read the output pdf file name from user input. Remove .pdf if it is there.
				outputName = document.getElementById("pdf_name").value;
				outputName = outputName.replace(/([^a-zA-Z0-9\-_\. ])/g,""); 
				if (outputName.substr(outputName.length-4) == ".pdf")
					outputName = outputName.substr(0,outputName.length-4);
				if (outputName == ""){
					alert("Please enter a valid file name.","");
					return;
				}
				if (!fullExtent.contains(previewMap.extent)){
					alert ("Printing is only allowed for Colorado.","Warning");
					document.getElementById("previewLoading").style.display="none";
					return;
				}
				document.getElementById("previewCkBx").style.display="none";
				document.getElementById("print_instr").style.display="none";
				document.getElementById("printPreview").style.display="none";
				document.getElementById("print_button").style.display="none";
				document.getElementById("printInst").style.display="inline-block";
				//var filename = document.getElementById("pdf_name").value;
				//if (filename.indexOf(".pdf") != filename.length-4) filename += ".pdf";
				//document.getElementById("pdf_name").value = filename;
				document.getElementById("sizeLabel").style.display="none";
				document.getElementById("size").style.display="none";
				document.getElementById("mapscale").style.display="none";
				document.getElementById("mapscaleList").style.display="none";
				document.getElementById("orientLabel").style.display="none";
				document.getElementById("orient").style.display="none";
				document.getElementById("pdf_name_label").style.display="none";
				document.getElementById("pdf_name").style.display="none";
				//document.getElementById("previewContainer").style.display="none";
				//document.getElementById("previewTitle").style.display="none";
				//document.getElementById("scrollUpBtn").style.display="none";
				//document.getElementById("scrollDownBtn").style.display="none";
			}
			document.getElementById("printScroll").scrollTop = 0;
			document.getElementById("perDone").innerHTML = "0%";
			document.getElementById("printBar").style.width = 0+"px"; // reset progress bar
			var tim = 0;
			var min; // number of estimated minutes to process
			var selectedValue_size = sizeCombo.attr("displayedValue"); // Letter , Tabloid 
			if (selectedValue_size == "8.5 x 11") min = 60;
			else if (selectedValue_size == "11 x 17") min = 120;
			else if (selectedValue_size == "17 x 22") min = 180;
			else if (selectedValue_size == "22 x 34") min = 240;
			document.getElementById("aproxMin").innerHTML = "Approximate time needed to create this PDF is "+min/60 +" minutes or less.";
			var timer = setInterval(function() {
				// time 3 minutes then start over if needed.
				tim += 2;
				var percent = Math.round(tim/min * 100);
				document.getElementById("perDone").innerHTML = percent + "%";
				document.getElementById("printBar").style.width = percent + "%";
				if (percent > 100){
					document.getElementById("printBar").style.width = 0;
					tim = 0;
					document.getElementById("perDone").innerHTML = "0%";
				}
			}, 2000);
			var done=true;
			//var printLegendFlag = dom.byId("printLegendCB").style.display=="inline-block" ? true : false; // Is the legend checkbox displayed?
			//if (!printLegendFlag) done=true; // turn off wait icon after printing map; don't wait for legend to print
			var mvum=false;
			document.getElementById("printMapLink").innerHTML = "";
			//document.getElementById("printLegendLink").innerHTML = "";
			pointWithText = 0; // we need to add a layer to the map because of a bug in PrintTask, set this flag so we can remove it.
			// get legend layers
			var layer = previewMap.getLayersVisibleAtScale();
			var legendArr = [];
			var legend;
			for (var i=1; i<layer.length; i++) {
				//if (layer[i].visible && (layer[i].id != "Motor Vehicle Use Map") &&
				if (layer[i].visible &&
					(layer[i].id != "topo") &&
					(layer[i].id != "streets") &&
					(layer[i].id != "hybrid"))
				{
					if (layer[i].id.indexOf("drawgraphics") > 0) {
						// Point with text - the PrintTask obj has an error and does not include the text so we will add it to the map as a separate layer then remove it later.
						if (layer[i].graphics.length > 1 && layer[i].graphics[0].geometry.type == "point" && !layer[i].graphics[0].symbol.text) {
							pointWithText++;
							var point = new Point(layer[i].graphics[0].geometry.x, layer[i].graphics[0].geometry.y, map.spatialReference);
							var labelPoint = new Graphic(point);
							var drawGraphicsLayer = new GraphicsLayer();
							drawGraphicsLayer.id = "drawgraphics"+drawGraphicsCounter;
							drawGraphicsCount.push(drawGraphicsLayer.id);
							drawGraphicsCounter++;
							addLabel(labelPoint, layer[i].graphics[1].symbol.text, drawGraphicsLayer, "11pt"); // in utilFunc.js
						}
						continue;	
					}
					//if (layer[i].visibleLayers && layer[i].url.indexOf("mvum") == -1) {
					if (ourMVUM && layer[i].visibleLayers && (layer[i].url.indexOf("mvum")) > -1) {
						// Do not add the legend. Will add an image in toc.js
					}
					// allow MVUM to generate it's own legend
					else if (layer[i].visibleLayers) {
						legend = new LegendLayer();
						legend.layerId = layer[i].id;
						legend.subLayerIds = layer[i].visibleLayers;
						legendArr.push(legend);
						legend = null;
					}
				}
				if (ourMVUM && layer[i].visible && (layer[i].id == "Motor Vehicle Use Map")) mvum = true;
			}
						
			var printTask;
			var params = new PrintParameters();
			var template = new PrintTemplate();
			var orient = dom.byId("orient");
			//var format = dom.byId("format");
			var selectedValue_orient = orientCombo.attr("displayedValue"); // Portrait, Landscape
			if (selectedValue_size == "8.5 x 11") selectedValue_size = "Letter";
			else if (selectedValue_size == "11 x 17") selectedValue_size = "Tabloid";
			else if (selectedValue_size == "17 x 22") selectedValue_size = "ANSIC";
			else if (selectedValue_size == "22 x 34") selectedValue_size = "ANSID";
			template.exportOptions = { dpi: 300 };
			
			// default to geopdf
			template.layout = app+" "+selectedValue_size+" "+selectedValue_orient; // huntingatlas Letter Portrait
			printTask = new PrintTask(printGeoServiceUrl);
			template.preserveScale = true; // for legend to work. This is removed for the map in the python code in geo GP (geoprocessing) print service.
			var legendTemplate;
			done=true; // no legend
			legendTemplate="none";
			template.format="pdf";
			params.extraParameters = {
				Georef_Info : "True",
				Legend_Template: legendTemplate,
				Output_Name: outputName
			};
			
			// Geo referenced pdf, jpg, gif, or geo referenced tiff
			/*if (format.options[format.selectedIndex].value != "pdf"){
				template.layout = app+" "+selectedValue_size+selectedValue_orient; // huntingatlas Letter Portrait
				printTask = new PrintTask(printGeoServiceUrl);
				template.preserveScale = true; // for legend to work. This is removed for the map in the python code in geo GP print service.
				var legendTemplate;
				done=true; // no legend
				template.format = format.options[format.selectedIndex].value;
				if (template.format != "geopdf"){
					legendTemplate="none";
				}
				else if (template.format=="geopdf" && !document.getElementById("printLegend").checked) {
					legendTemplate="none";
					template.format="pdf";
				}
				else if (mvum) {
					legendTemplate = "Legend Letter "+selectedValue_orient+ " MVUM";
					template.format = "pdf";
				}
				else {
					legendTemplate = "Legend Letter "+selectedValue_orient;
					template.format = "pdf";
				}
				params.extraParameters = {
					Georef_Info : "True",
					Legend_Template: legendTemplate
				};
			}
			// Regular pdf
			else {
				if (printLegendFlag && !document.getElementById("printLegend").checked) done=true; //no legend so turn off wait icon.
				printTask = new PrintTask(printServiceUrl);
				template.preserveScale = false;
				template.format = format.options[format.selectedIndex].value.toUpperCase();
				if (selectedValue_size.indexOf("Letter")>-1)
					template.layout = selectedValue_size+"ANSI A "+selectedValue_orient; // Letter ANSI A Portrait
				else
					template.layout = selectedValue_size+"ANSI B "+selectedValue_orient; // Tabloid ANSI B Portrait
			}*/
			template.showAttribution = false;
			var titleTxt=outputName;
			// Legend and Map in one PDF
			//var titleTxt = document.getElementById("printTitle").value;
			//if (format.options[format.selectedIndex].value=="geopdf") titleTxt += " (Geo PDF)";
			/*if (printLegendFlag && document.getElementById("printLegend").checked) { 
				template.layoutOptions = {
					//titleText: titleTxt,
					authorText: prtDisclaimer,
					legendLayers: legendArr, // empty array means no legend
					customTextElements:  [
						{"Subtitle": document.getElementById("printSubTitle").value},
						{"Legend": legendArr}
					]
				};
			}
			// Map Only
			else {*/
				template.layoutOptions = {
					titleText: titleTxt,
					authorText: prtDisclaimer,
					legendLayers: [], // empty array means no legend
					customTextElements:  [
						{"Subtitle": ""} //document.getElementById("printSubTitle").value}
					]
				};
			//}
			//titleTxt=null;
			params.map = previewMap;
			params.template = template;
				
			function printResult(result){
				// Add Google Analytics stats for georef printing
				var millis = Date.now() - startTim;
				//var date = new Date();
				//var theDate = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
				//var label = dijit.byId("mapscaleList").attr('displayedValue'); // mapscale
				var maptype = "geopdf";
				var category = sizeCombo.attr('displayedValue')+" "+maptype+" ";
				var mapscale = dijit.byId("mapscaleList").attr('displayedValue');
				var action = sizeCombo.attr('displayedValue'); // page size
				var value = Math.floor(millis/1000); // seconds to generate. Must be integer for Google Analytics
				// Add map services used
				var label="Print geoPDF"; // function
				var mapservices = "";
				for (var i=0; i<previewMap.layerIds.length; i++){
					switch ( previewMap.layerIds[i]){
						case "Motor Vehicle Use Map":
							mapservices += "M";
							break;
						case "Hunter Reference":
							mapservices += "R";
							break;
						case "Game Species":
							mapservices += "G";
							break;
						case "Fishing Info":
							mapservices += "F";
							break;
						case "Reference":
							mapservices += "R";
							break;
					}
				}
				category += mapservices;
				var custom;
				var mb = -1;
				// Calculate size of file for Google Analytics stats
				if (window.XMLHttpRequest) {
					var xhr = new XMLHttpRequest();
					xhr.open("HEAD", result.url, true); // Notice "HEAD" instead of "GET", to get only the header
					xhr.onreadystatechange = function() {
						if (this.readyState == this.DONE) {
							// add file size
							//mb = Math.round(parseInt(xhr.getResponseHeader("Content-Length"))/1048576);
							mb = parseInt(xhr.getResponseHeader("Content-Length"))/1048576;
							if (!isNaN(mb))
								mb = parseFloat(mb.toFixed(2));
							console.log("Time to create map = " + value + " seconds for "+category+" "+mapscale+" "+mb+"MB");
							// In Google Analytics, Admin, Properties, Custom Definitions, Custom Dimensions(text) & Custom Metrics(integer)
							// Set up: 
							//		dimension2=Page Size, Hit, Active
							//		dimension3=Map Services, Hit, Active
							//		dimension4=Map Scale, Hit, Active
							//		metric1=Seconds, Hit, Active
							//		metric2=MB, Hit, Active
							custom = {
								'metric1':value,
								'metric2': mb,
								'dimension2':sizeCombo.attr('displayedValue'),
								'dimension3':mapservices,
								'dimension4':mapscale,
								'dimension5':maptype
							};
							if (typeof ga === "function")ga('send', 'event', category, action, label, value, custom);
							document.getElementById("printMB").innerHTML = "File size is "+mb+"MB.";
							document.getElementById("printMB").style.display="block";
						}
					};
					xhr.send();
				}
				else{
					console.log("Time to create map = " + value + " seconds for "+category+" "+mapscale);
					custom = {
						'metric1':value,
						'dimension2':sizeCombo.attr('displayedValue'),
						'dimension3':mapservices,
						'dimension4':mapscale,
						'dimension5':maptype
					};
					if (typeof ga === "function")ga('send', 'event', category, action, label, value, custom);
				}
				
				console.log("printing to "+result.url);
				/*if (result.url.indexOf('tif') > -1 || result.url.indexOf('svgz') > -1){
					document.getElementById("printInst").innerHTML = "Click on the link below to download the image file.";
					document.getElementById("printMapLink").innerHTML = "<a href='"+result.url+"' target='_blank'>"+template.format.toUpperCase()+" File</a>";
				}
				else {
					//document.getElementById("printInst").innerHTML = "Disable pop-up blocker. Printout will open in a new tab.";
					window.open(result.url,"_blank");
					document.getElementById("printMapLink").innerHTML = "Done. If download does not start automatically use the link below.<br/>Link to <a href='"+result.url+"' target='_blank'>"+template.format.toUpperCase()+" File</a>";
				}*/
				for (i=0; i<pointWithText; i++) removeDrawItem(); // remove extra text layer added for points with text because of bug in PrintTask
				// Hide loading icon and change Printing... label back to Print.
				if (done){
					document.getElementById("print_link").href=result.url+"?v="+Date.now();
					// download does nothing inside the Android app!!!! Do not use it.
					//document.getElementById("print_link").download=document.getElementById("pdf_name").value;
					document.getElementById("printInst").style.display="none";
					document.getElementById("print_link").style.display="block";
					document.getElementById("print_link").addEventListener("click",hidePrintDialog);
					clearInterval(timer);
				}
				done=true;
				//printDialog.hide();
				
			}
			function printError(err){
				document.getElementById("printInst").style.display="none";
				alert("Error printing: "+err,"Code Error",err);
				document.getElementById("printMapLink").innerHTML = "";
				//document.getElementById("printLegendLink").innerHTML = "";
				for (var i=0; i<pointWithText; i++) removeDrawItem(); // remove extra text layer added for points with text because of bug in PrintTask
				printDialog.hide();
				clearInterval(timer);
			}
			printTask.execute(params, printResult, printError);
			// Add timer for Google Analytics georef printing
			startTim = Date.now();
		}
		catch(e){
			for (var j=0; j<pointWithText; j++) removeDrawItem(); // remove extra text layer added for points with text because of bug in PrintTask
			alert("Error while printing: "+e.message,"Code Error",e);
			//document.getElementById("printLoading").style.display="none";
			document.getElementById("printInst").style.display="none";
		}
	});
}

function showPrintPreview(){
	try{
		if (document.getElementById("showPreviewMap").checked){
			document.getElementById("print_img").src="";
			document.getElementById("printPreview").style.display = "block";
			document.getElementById("previewLoading").style.display="block";
			//document.getElementById("printScroll").scrollTop=0;
		}
		else {
			document.getElementById("printPreview").style.display = "none";
			return;
		}
	}
	catch (e){
		alert("Error while printing: "+e.message,"Code Error",e);
	}
	require([
		"esri/tasks/PrintTask", "esri/tasks/PrintTemplate", "esri/tasks/PrintParameters"
	], function(
	PrintTask, PrintTemplate, PrintParameters) {
		var printTask;
		var params = new PrintParameters();
		var template = new PrintTemplate();
		var titleTxt=outputName;
		var selectedValue_orient = orientCombo.attr("displayedValue");
		var selectedValue_size = sizeCombo.attr("displayedValue");
		if (selectedValue_size == "8.5 x 11") selectedValue_size = "Letter ";
		else if (selectedValue_size == "11 x 17") selectedValue_size = "Tabloid ";
		else if (selectedValue_size == "17 x 22") selectedValue_size = "ANSIC ";
		else if (selectedValue_size == "22 x 34") selectedValue_size = "ANSID ";
		template.layout = app+" "+selectedValue_size+selectedValue_orient; // huntingatlas Letter Portrait
		printTask = new PrintTask(printGeoServiceUrl);
		template.preserveScale = true; // for legend to work. This is removed for the map in the python code in geo GP print service.
		template.format = "prev";
		template.exportOptions = { dpi: 300 };
		template.showAttribution = false;
		template.layoutOptions = {
			titleText: titleTxt,
			authorText: prtDisclaimer,
			legendLayers: [], // empty array means no legend
			customTextElements:  [
				{"Subtitle": ""} //document.getElementById("printSubTitle").value}
			]
		};
		params.map = previewMap;
		params.template = template;
		function previewResult(result){
			// Add Google Analytics stats for georef printing preview jpg
			var millis = Date.now() - startTim;
			var maptype = "prev";
			var category = sizeCombo.attr('displayedValue')+" "+maptype+" ";
			var action = sizeCombo.attr('displayedValue'); // page size
			var mapscale = dijit.byId("mapscaleList").attr('displayedValue'); // mapscale
			var value = Math.floor(millis/1000); // seconds to generate.
			// Add map services used
			var label="Print Preview"; // function
			var mapservices = "";
			for (var i=0; i<previewMap.layerIds.length; i++){
				switch ( previewMap.layerIds[i]){
					case "Motor Vehicle Use Map":
							mapservices += "M";
							break;
						case "Hunter Reference":
							mapservices += "R";
							break;
						case "Game Species":
							mapservices += "G";
							break;
						case "Fishing Info":
							mapservices += "F";
							break;
						case "Reference":
							mapservices += "R";
							break;
				}
			}
			category += mapservices;
			var custom;
			/*var mb = -1;
			// Calculate size of file for Google Analytics stats
			if (window.XMLHttpRequest) {
				var xhr = new XMLHttpRequest();
				xhr.open("HEAD", result.url, true); // Notice "HEAD" instead of "GET", to get only the header
				xhr.onreadystatechange = function() {
					if (this.readyState == this.DONE) {
						// add file size
						mb = parseInt(xhr.getResponseHeader("Content-Length"))/1048576;
						if (!isNaN)
							mb = mb.toFixed(2);
						console.log("Time to create map = " + value + " seconds for "+category+" "+mapscale+" "+(xhr.getResponseHeader("Content-Length")/1048576).toFixed(2)+"MB");
						// In Google Analytics, Admin, Properties, Custom Definitions, Custom Dimensions(text) & Custom Metrics(integer)
						// Set up: 
						//		dimension2=Page Size, Hit, Active
						//		dimension3=Map Services, Hit, Active
						//		dimension4=Map Scale, Hit, Active
						//		metric1=Seconds, Hit, Active
						//		metric2=MB, Hit, Active
						custom = {
							'metric1':value,
							'metric2': mb,
							'dimension2':sizeCombo.attr('displayedValue'),
							'dimension3':mapservices,
							'dimension4':mapscale,
							'dimension5':maptype
						};
						if (typeof ga === "function")ga('send', 'event', category, action, label, value, custom);
					}
				};
				xhr.send();
			}
			else{*/
				console.log("Time to create preview map = " + value + " seconds for "+category+" "+mapscale);
				custom = {
					'metric1':value,
					'dimension2':sizeCombo.attr('displayedValue'),
					'dimension3':mapservices,
					'dimension4':mapscale,
					'dimension5':maptype
				};
				if (typeof ga === "function")ga('send', 'event', category, action, label, value, custom);
			//}
			//console.log("Time to create preview map = " + value + " seconds for "+category);
			console.log("printing to "+result.url);
			document.getElementById("print_img").src=result.url;
			document.getElementById("previewLoading").style.display="none";
		}
		function previewError(err){
			document.getElementById("previewLoading").style.display="none";
			alert("Error loading preview: "+err,"Code Error",err);
		}
		if (!fullExtent.contains(previewMap.extent)){
			alert ("Printing is only allowed for Colorado.","Warning");
			document.getElementById("previewLoading").style.display="none";
			return;
		}
		printTask.execute(params, previewResult, previewError);
		// see how long it takes to generate the preview jpg. Display in Google Analytics and console
		startTim = Date.now();
	});		
}