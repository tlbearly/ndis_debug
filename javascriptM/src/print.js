var prtDisclaimer="";
var sizeCombo;
function printInit() {
	require(["dojo/store/Memory","dijit/form/ComboBox", "dijit/form/Select"],function(Memory,ComboBox,Select){
	// Create dojox combo boxes
	var sizeStore = new Memory({
		idProperty: "name",
		data: [{name:"8.5 x 11"},
					{name: "11 x 17"}]
		});

		/*<option value="Letter ">8.5 x 11</option-->
                        <!--option value="Legal ">8.5 x 14</option--> 
                        <!--option value="Tabloid ">11 x 17</option-->     
                        <!--option value="ANSI C ">17 x 22</option-->
                        <!--option value="ANSI D ">22 x 34</option-->*/
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
			value: orientStore.data[0].name,
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
			if (xmlDoc.getElementsByTagName("helpvideo")[0])
				document.getElementById("printVideo").innerHTML="<a target='help' href="+xmlDoc.getElementsByTagName("helpvideo")[0].firstChild.nodeValue+">Click here to view help video.</a><br/><br/>";
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
function scrollBarMove() {
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
}

function printScrollDown(){
	document.getElementById("printScroll").scrollTop=document.getElementById('printDiv').clientHeight;
}
function printScrollUp(){
	document.getElementById("printScroll").scrollTop=0;
}
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
		drawing=true;
		document.getElementById("print_button").style.display="block";
		document.getElementById("printMapLink").innerHTML = "";
		document.getElementById("print_link").style.display="none";
		//document.getElementById("pdf_name").classList.remove("error");
		document.getElementById("previewContainer").addEventListener("scroll",scrollBarMove);
		document.getElementById("sizeLabel").style.display="inline";
		document.getElementById("size").style.display="inline-table";
		document.getElementById("mapscale").style.display="inline";
		document.getElementById("orientLabel").style.display="inline";
		document.getElementById("orient").style.display="inline-table";
		document.getElementById("pdf_name_label").style.display="block";
		document.getElementById("pdf_name").style.display="block";
		document.getElementById("previewContainer").style.display="block";
		document.getElementById("previewTitle").style.display="block";
		document.getElementById("scrollUpBtn").style.display="block";
		document.getElementById("scrollDownBtn").style.display="block";
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

//		var pt = new Point(map.extent.xmax+((map.extent.xmin-map.extent.xmax)/2),map.extent.ymin+((map.extent.ymax-map.extent.ymin)/2),sr);
//debug display center point
//var symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,21,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,10]), 1),new Color([255,0,0,0.6]));
//var testlayer=new GraphicsLayer();
//testlayer.add(new Graphic(pt,symbol));
//previewMap.addLayer(testlayer);
		
		var pt = new Point(map.extent.xmax+((map.extent.xmin-map.extent.xmax)/2),map.extent.ymin+((map.extent.ymax-map.extent.ymin)/2),sr);
		previewMap.centerAndZoom(pt,map.getLevel()).then(function(){
			changePrintSize();
			printDialog.show();
		});
		pt=null;
		sr=null;
	});
}

function changePrintSize(){
	require(["esri/geometry/Point","esri/geometry/Extent","esri/SpatialReference","dojo/dom","dijit/registry"],function(Point,Extent,SpatialReference,dom,registry){
		if (!previewMap || !previewMap.extent) {
			alert("Please wait for page to load.");
			return;
		}
		document.getElementById("printMapLink").innerHTML = "";
		//document.getElementById("printLegendLink").innerHTML = "";
		var container = document.getElementById("printPreviewMap");
		var orient = dom.byId("orient");
		var selectedValue_orient = orientCombo.attr("displayedValue");
		var size = dom.byId("size");
		var selectedValue_size = sizeCombo.attr("displayedValue")+" ";
		if (selectedValue_size == "8.5 x 11 ") selectedValue_size = "Letter ";
		else	if (selectedValue_size == "11 x 17 ") selectedValue_size = "Tabloid ";
		var pt = previewMap.extent.getCenter();
		var level = previewMap.getLevel();
		
		if (selectedValue_orient == "Landscape") {
			// borders: .8 on sides, 1.25 on top and bottom
			// 11 X 8.5
			// 10.2 x 7.25 inch image (without borders)
			// 979 x 696 pixels in screen resolution (inches * 96)
			// 490 x 348 50% of that
			if (selectedValue_size == "Letter "){
				previewMap.width=490;
				previewMap.height=348;
				registry.byId("printPreviewMap").resize({w:490,h:348});
			}
			// 17 x 11
			// 17-.8 x 11-1.25
			// 16.2 x 8.75 inch image (without borders)
			// 1555 x 936 pixels in screen resolution
			// 544 x 328 35% of that
			else if (selectedValue_size == "Tabloid ") {
				previewMap.width=544;
				previewMap.height=328;
				registry.byId("printPreviewMap").resize({w:544,h:328});
			}
			// 14-.8 x 8.5-1.25
			// 13.2 x 7.25 inch image (without borders)
			// 1267 x 696 pixels in screen resolution
			// 506 x 278 40% of that
			else if (selectedValue_size == "8.5 x 14 ") {
				previewMap.width=506;
				previewMap.height=278;
				registry.byId("printPreviewMap").resize({w:506,h:278});
			}
		}
		// Portrait
		else {
			// 8.5 x 11
			// 7.7 x 9.75 inch image (without borders)
			// 739 x 936 pixels in screen resolution (inches * 96)
			// 370 x 468 50% of that
			if (selectedValue_size == "Letter "){
				previewMap.width=370;
				previewMap.height=468;
				registry.byId("printPreviewMap").resize({ w:370,h:468});
			}
			// 11 x 17
			// 11-.8 x 17-1.25
			// 10.2 x 15.75 inch image (without borders)
			// 979 x 1512 pixels in screen resolution
			// 343 x 529 35% of that
			else if (selectedValue_size == "Tabloid ") {
				previewMap.width=343;
				previewMap.height=529;
				registry.byId("printPreviewMap").resize({w:343,h:529});
			}
			// 8.5 x 14
			// 7.7 x 12.75 inch image (without borders)
			// 739 x 1224 pixels in screen resolution (inches * 96)
			// 296 x 490 40% of that
			else if (selectedValue_size == "8.5 x 14 ") {
				previewMap.width=296;
				previewMap.height=490;
				registry.byId("printPreviewMap").resize({ w:296,h:490});
			}
		}
		// fix size of display map
		var root = document.getElementById("printPreviewMap_root");
		root.style.width = previewMap.width+"px";
		root.style.height = previewMap.height+"px";
		container.style.width = previewMap.width+"px";
		container.style.height = previewMap.height+"px";
		
		if (document.getElementById("previewContainer").offsetWidth > previewMap.width || document.getElementById("previewContainer").offsetWidth == 0)
			document.getElementById("previewContainer").style.width = previewMap.width+10+"px";
		else if (parseInt(document.getElementById("printPreviewMap").style.width) > parseInt(document.getElementById("previewContainer").style.width))
			document.getElementById("previewContainer").style.width = previewMap.width+10+"px";
		else
			document.getElementById("previewContainer").style.width = document.body.clientWidth * 0.80+"px";
		if (parseInt(document.body.clientWidth * 0.80) < parseInt(document.getElementById("previewContainer").style.width))
			document.getElementById("previewContainer").style.width = document.body.clientWidth * 0.80 + "px";
			//document.getElementById("print_scroll").style.width = previewMap.width+"px";
		// Adjust size of scroll bar for mobile preview map
		var parentWidth = document.body.clientWidth;
		if (parentWidth > parseInt(document.getElementById("previewContainer").style.maxWidth))
			parentWidth = parseInt(document.getElementById("previewContainer").style.maxWidth);
		else
			parentWidth = parseInt(parentWidth * 0.80); // 80% of view width
		if (parentWidth > previewMap.width) parentWidth = previewMap.width;
		document.getElementById('scroll1').style.width =  parseInt((parentWidth / (previewMap.width+10)) * parentWidth) -20 +"px";
		document.getElementById('scroll2').style.width =  parseInt((parentWidth / (previewMap.width+10)) * parentWidth) -20 +"px";
		document.getElementById('scroll1').style.left="5px";
		document.getElementById('scroll2').style.left="5px";
		// Hide custom scroll bars if not needed
		if ((parseInt(document.getElementById('printPreviewMap').style.width) > parseInt(document.getElementById('previewContainer').style.width)) ||
			(parseInt(document.getElementById('printPreviewMap').style.width) > parseInt(document.getElementById('previewContainer').style.maxWidth)))
		{
			document.getElementById('scroll1').style.display="block";
			document.getElementById('scroll2').style.display="block";
		}
		else {
			document.getElementById('scroll1').style.display="none";
			document.getElementById('scroll2').style.display="none";
		}
//console.log("parent width: "+parentWidth+"   scroll width: "+document.getElementById('scroll1').style.width);
//console.log("map width:    "+parseInt(previewMap.width+10));
		// first time it is -1, but it is set to main map, just not available yet.
		if (level>-1) previewMap.centerAndZoom(pt,level);
		pt = null;
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
        "esri/urlUtils", "esri/config", "esri/graphic", "esri/geometry/Point",
        "esri/tasks/LegendLayer", "esri/layers/GraphicsLayer", "dojo/dom", "dijit/registry"
      ], function(
      PrintTask, PrintTemplate, PrintParameters,
      urlUtils, esriConfig, Graphic, Point,
      LegendLayer, GraphicsLayer, dom, registry) {
			var pointWithText;
			try{
				if (document.getElementById("pdf_name").value == ""){
					document.getElementById("pdf_name").classList.add("error");
					document.getElementById("pdf_name").placeholder = "Please enter a file name."
					return;
				}
				else {
					document.getElementById("print_button").style.display="none";
					document.getElementById("printLoading").style.display="inline-block";
					document.getElementById("printInst").style.display="inline-block";
					//var filename = document.getElementById("pdf_name").value;
					//if (filename.indexOf(".pdf") != filename.length-4) filename += ".pdf";
					//document.getElementById("pdf_name").value = filename;
					document.getElementById("sizeLabel").style.display="none";
					document.getElementById("size").style.display="none";
					document.getElementById("mapscale").style.display="none";
					document.getElementById("orientLabel").style.display="none";
					document.getElementById("orient").style.display="none";
					document.getElementById("pdf_name_label").style.display="none";
					document.getElementById("pdf_name").style.display="none";
					document.getElementById("previewContainer").style.display="none";
					document.getElementById("previewTitle").style.display="none";
					document.getElementById("scrollUpBtn").style.display="none";
					document.getElementById("scrollDownBtn").style.display="none";
				}
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
				if (layer[i].visible && (layer[i].id != "Motor Vehicle Use Map") &&
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
					if (layer[i].visibleLayers && layer[i].url.indexOf("mvum") == -1) {
						legend = new LegendLayer();
						legend.layerId = layer[i].id;
						legend.subLayerIds = layer[i].visibleLayers;
						legendArr.push(legend);
						legend = null;
					}
				}
				if (layer[i].visible && (layer[i].id == "Motor Vehicle Use Map")) mvum = true;
			}
						
			var printTask;
			var params = new PrintParameters();
			var template = new PrintTemplate();
			var orient = dom.byId("orient");
			//var format = dom.byId("format");
			var selectedValue_orient = orientCombo.attr("displayedValue"); // Portrait, Landscape
			var size = dom.byId("size");
			var selectedValue_size = sizeCombo.attr("displayedValue"); // Letter , Tabloid 
			if (selectedValue_size == "8.5 x 11") selectedValue_size = "Letter";
			if (selectedValue_size == "11 x 17") selectedValue_size = "Tabloid";
			template.exportOptions = { dpi: 300 };
			
			// default to geopdf
			template.layout = app+" "+selectedValue_size+" "+selectedValue_orient; // huntingatlas Letter Portrait
			printTask = new PrintTask(printGeoServiceUrl);
			template.preserveScale = true; // for legend to work. This is removed for the map in the python code in geo GP print service.
			var legendTemplate;
			done=true; // no legend
			legendTemplate="none";
			template.format="pdf";
			var outputName = document.getElementById("pdf_name").value;
			if (outputName.substr(outputName.length-4) == ".pdf")
				outputName = outputName.substr(0,outputName.length-4);
			alert(outputName);
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
			var titleTxt="";
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
				for (var i=0; i<pointWithText; i++) removeDrawItem(); // remove extra text layer added for points with text because of bug in PrintTask
				// Hide loading icon and change Printing... label back to Print.
				if (done){
					document.getElementById("print_link").href=result.url;
					// download does nothing inside the Android app!!!! Do not use it.
					//document.getElementById("print_link").download=document.getElementById("pdf_name").value;
					document.getElementById("printLoading").style.display="none";
					document.getElementById("printInst").style.display="none";
					document.getElementById("print_link").style.display="block";
					document.getElementById("print_link").addEventListener("click",hidePrintDialog);
				}
				done=true;
				//printDialog.hide();
				
			}
			function printError(err){
				document.getElementById("printLoading").style.display="none";
				document.getElementById("printInst").style.display="none";
				alert("Error printing: "+err,"Code Error",err);
				document.getElementById("printMapLink").innerHTML = "";
				//document.getElementById("printLegendLink").innerHTML = "";
				for (var i=0; i<pointWithText; i++) removeDrawItem(); // remove extra text layer added for points with text because of bug in PrintTask
				printDialog.hide();
			}
			printTask.execute(params, printResult, printError);
		}
		catch(e){
			for (var j=0; j<pointWithText; j++) removeDrawItem(); // remove extra text layer added for points with text because of bug in PrintTask
			alert("Error while printing: "+e.message,"Code Error",e);
			document.getElementById("printLoading").style.display="none";
			document.getElementById("printInst").style.display="none";
		}
	});
}