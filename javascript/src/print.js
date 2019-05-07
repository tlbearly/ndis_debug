var prtDisclaimer="";
var startTim;
function printInit() {
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
function printShow(){
	require(["esri/map","esri/SpatialReference","esri/layers/GraphicsLayer","esri/graphic",
	"esri/layers/ArcGISTiledMapServiceLayer","esri/layers/ArcGISDynamicMapServiceLayer","esri/geometry/Point",
	"esri/layers/OpenStreetMapLayer",
	"esri/symbols/SimpleLineSymbol",
	"esri/symbols/SimpleMarkerSymbol",
	"dojo/_base/Color",
	"dojo/dom"
	],
	function(Map,SpatialReference,GraphicsLayer,Graphic,ArcGISTiledMapServiceLayer,ArcGISDynamicMapServiceLayer,Point,OpenStreetMapLayer,
	SimpleLineSymbol,
	SimpleMarkerSymbol,
	Color,
	dom
	){
		document.getElementById("printMapLink").innerHTML = "";
		document.getElementById("printLegendLink").innerHTML = "";
		// previewMap is created in readConfig.js
		document.getElementById("printTitle").value = "My Custom Map";
		document.getElementById("printSubTitle").value = dom.byId("title").innerHTML;
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
		var basemap;
		var basemapRefId=-1;
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
					var m;
					// Skip basemaps
					if (layer.url.indexOf("World_Street_Map") > -1) return;
					if (layer.id.indexOf("layer") == 0) return;
					
					processedLayers++;
					var visLayers = layer.visibleLayers;
					var layerInfos = layer.layerInfos;
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
		
		var graphics_layer;
		var graphics;
		var arr;
		var a;
		// add draw graphics layers
		for (i=0; i<map.graphicsLayerIds.length; i++){
			if ((map.graphicsLayerIds[i].indexOf("drawgraphics")>-1) ||
				(map.graphicsLayerIds[i].indexOf("drawtextgraphics")>-1)){
				graphics_layer = new GraphicsLayer();
				graphics_layer.id = map.graphicsLayerIds[i];
				graphics_layer.visible=true;
				graphics_layer.spatialReference = previewMap.spatialReference;
				graphics = map.getLayer(map.graphicsLayerIds[i]).graphics;
				
				for (a=0; a<graphics.length; a++){
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
		if (typeof hb1298GraphicsLayer != "undefined") {
			graphics_layer = new GraphicsLayer();
			graphics_layer.visible=true;
			graphics_layer.spatialReference = previewMap.spatialReference;
			
			for (a=0; a<hb1298GraphicsLayer.graphics.length; a++){
				arr = new Graphic(graphics[a].geometry,graphics[a].symbol,graphics[a].attributes,graphics[a].infoTemplate);
				graphics_layer.add(arr);
				arr=null;
			}
			previewMap.addLayer(graphics_layer);
			graphics_layer = null;
			graphics=null;
		}
		
		previewMap.spatialReference = sr;

//		var pt = new Point(map.extent.xmax+((map.extent.xmin-map.extent.xmax)/2),map.extent.ymin+((map.extent.ymax-map.extent.ymin)/2),sr);
//debug display center point
//var symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,21,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,10]), 1),new Color([255,0,0,0.6]));
//var testlayer=new GraphicsLayer();
//testlayer.add(new Graphic(pt,symbol));
//previewMap.addLayer(testlayer);
		
		var pt = new Point(map.extent.xmax+((map.extent.xmin-map.extent.xmax)/2),map.extent.ymin+((map.extent.ymax-map.extent.ymin)/2),sr);
		//var pt = map.extent.getCenter();
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
		document.getElementById("printLegendLink").innerHTML = "";
		var container = document.getElementById("printPreviewMap");
		var orient = dom.byId("orient");
		index = orient.selectedIndex;
		var selectedValue_orient = orient.options[index].value;
		var size = dom.byId("size");
		index = size.selectedIndex;
		var selectedValue_size = size.options[index].value;
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
		// first time it is -1, but it is set to main map, just not available yet.
		if (level>-1) previewMap.centerAndZoom(pt,level);
		pt = null;
	});
}

function grayOutLegend(format){
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
}

function printMap(){
  require([
        "esri/tasks/PrintTask", "esri/tasks/PrintTemplate", "esri/tasks/PrintParameters",
        "esri/urlUtils", "esri/config", "esri/graphic", "esri/geometry/Point",
        "esri/tasks/LegendLayer", "esri/layers/GraphicsLayer", "dojo/dom", "dijit/registry"
      ], function(
      PrintTask, PrintTemplate, PrintParameters,
      urlUtils, esriConfig, Graphic, Point,
      LegendLayer, GraphicsLayer, dom, registry) {
			var i;
			var pointWithText = 0; // we need to add a layer to the map because of a bug in PrintTask, set this flag so we can remove it.
			try{
			var done=false;
			var printLegendFlag = dom.byId("printLegendCB").style.display=="inline-block" ? true : false; // Is the legend checkbox displayed?
			if (!printLegendFlag) done=true; // turn off wait icon after printing map; don't wait for legend to print
			registry.byId("print_button").set("label", "Creating...");
			document.getElementById("printLoading").style.display="inline-block";
			var mvum=false;
			document.getElementById("printMapLink").innerHTML = "";
			document.getElementById("printLegendLink").innerHTML = "";
			//pointWithText = 0; // we need to add a layer to the map because of a bug in PrintTask, set this flag so we can remove it.
			// get legend layers
			var layer = previewMap.getLayersVisibleAtScale();
			var legendArr = [];
			var legend;
			var countLayers=0;
			for (i=1; i<layer.length; i++) {
				if (ourMVUM && (layer[i].id == "Motor Vehicle Use Map")){
					// Do not add the legend. Will use MVUM print template
					if (layer[i].visible) mvum = true;
				}
				//if (layer[i].visible && (layer[i].id != "Motor Vehicle Use Map") &&
				else if (layer[i].visible &&
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
					//if (layer[i].visibleLayers && (layer[i].url.indexOf("mvum") == -1) {
					// allow MVUM to generate it's own legend
					if (layer[i].visibleLayers) {
						legend = new LegendLayer();
						legend.layerId = layer[i].id;
						legend.subLayerIds = layer[i].visibleLayers;
						legendArr.push(legend);
						legend = null;
						countLayers++;
					}
				}
				//if (ourMVUM && layer[i].visible && (layer[i].id == "Motor Vehicle Use Map")) mvum = true;
			}
						
			var printTask;
			var params = new PrintParameters();
			var template = new PrintTemplate();
			var orient = dom.byId("orient");
			var format = dom.byId("format");
			index = orient.selectedIndex;
			var selectedValue_orient = orient.options[index].value; // Portrait, Landscape
			var size = dom.byId("size");
			index = size.selectedIndex;
			var selectedValue_size = size.options[index].value; // Letter , Tabloid 
			template.exportOptions = { dpi: 300 };
			// Geo referenced pdf, jpg, gif, or geo referenced tiff
			if (format.options[format.selectedIndex].value != "pdf"){
				template.layout = app+" "+selectedValue_size+selectedValue_orient; // huntingatlas Letter Portrait
				printTask = new PrintTask(printGeoServiceUrl);
				template.preserveScale = false; // true for legend to work. This is removed for the map in the python code in geo GP print service.
				var legendTemplate;
				done=true; // no legend
				template.format = format.options[format.selectedIndex].value;
				if (template.format != "geopdf"){
					legendTemplate="none";
					template.exportOptions = { dpi: 300 };// does not do anything????
				}
				else if (template.format=="geopdf" && !document.getElementById("printLegend").checked) {
					legendTemplate="none";
					template.format="pdf";
					// Cannot print only basemap with geopdf does not have georef info Warning Message
					if (countLayers == 0){
						alert("Printing of basemaps alone does not work. Please add map layers. From the menu, select 'Map Layers &amp; Legend.'","Warning");
						registry.byId("print_button").set("label", "Print");
						document.getElementById("printLoading").style.display="none";
						document.getElementById("printMapLink").innerHTML = "";
						document.getElementById("printLegendLink").innerHTML = "";
						return;
					}
				}
				else if (ourMVUM && mvum) {
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
			}
			template.showAttribution = false;
			
			// Legend and Map in one PDF
			var titleTxt = document.getElementById("printTitle").value;
			if (format.options[format.selectedIndex].value=="geopdf") titleTxt += " (Geo PDF)";
			if (printLegendFlag && document.getElementById("printLegend").checked) { 
				template.layoutOptions = {
					titleText: titleTxt,
					authorText: prtDisclaimer,
					legendLayers: legendArr, // empty array means no legend
					customTextElements:  [
						{"Subtitle": document.getElementById("printSubTitle").value},
						{"Legend": legendArr}
					]
				};
			}
			// Map Only
			else {
				template.layoutOptions = {
					titleText: titleTxt,
					authorText: prtDisclaimer,
					legendLayers: [], // empty array means no legend
					customTextElements:  [
						{"Subtitle": document.getElementById("printSubTitle").value}
					]
				};
			}
			titleTxt=null;
			params.map = previewMap;
			params.template = template;
				
			function printResult(result){
				// 1-22-19 tlb  Add Google Analytics stats for georef printing 
				var i;
				var format = dom.byId("format");
				var millis = Date.now() - startTim;
				var s = previewMap.getScale();
				var mapscale;
				if (s < 9028) mapscale = "10k";
				else if (s < 36112) mapscale = "24k";
				else if (s < 72224) mapscale = "50k";
				else if (s < 144448) mapscale = "100k";
				else if (s < 288896) mapscale = "250k";
				else if (s < 577791) mapscale = "500k";
				else if (s < 1155582) mapscale = "1M";
				else if (s < 2311163) mapscale = "2M";
				else if (s < 4622325) mapscale = "4M";
				else if (s < 9244649) mapscale = "9M";
				var maptype = format.options[format.selectedIndex].value;
				var category = dom.byId("size").options[dom.byId("size").selectedIndex].innerHTML+" "+maptype+" ";//+" "+theDate;
				if (printLegendFlag && document.getElementById("printLegend").checked) category += "legend ";//+mapscale;
				var pagesize = dom.byId("size").options[dom.byId("size").selectedIndex].innerHTML;
				var action = dom.byId("size").options[dom.byId("size").selectedIndex].innerHTML;
				var value = Math.floor(millis/1000); // seconds to generate. Must be integer for Google Analytics
				// Add map services used
				var label=""; // Map Services
				for (i=0; i<previewMap.layerIds.length; i++){
					switch ( previewMap.layerIds[i]){
						case "Motor Vehicle Use Map":
							label += "M";
							break;
						case "Hunter Reference":
							label += "R";
							break;
						case "Game Species":
							label += "G";
							break;
						case "Fishing Info":
							label += "F";
							break;
						case "Reference":
							label += "R";
							break;
					}
				}
				category += label;
				var mapservices = label;
				var custom;
				// Calculate size of file for Google Analytics stats
				/*if (window.XMLHttpRequest) {
					var xhr = new XMLHttpRequest();
					xhr.open("HEAD", result.url, true); // Notice "HEAD" instead of "GET", to get only the header
					xhr.onreadystatechange = function() {
							if (this.readyState == this.DONE) {
									var mb = Math.round(parseInt(xhr.getResponseHeader("Content-Length"))/1048576);
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
										'dimension2':pagesize,
										'dimension3':mapservices,
										'dimension4':mapscale
									};
									ga('send', 'event', category, action, label, value, custom);
							}
					};
					xhr.send();
				}
				else{*/
					custom = {
						'metric1':value,
						'dimension2':pagesize,
						'dimension3':mapservices,
						'dimension4':mapscale,
						'dimension5':maptype
					};
					console.log("Time to create map = " + value + " seconds for "+category+" "+mapscale);
					ga('send', 'event', category, action, label, value, custom);
				//}

				console.log("printing to "+result.url);
				if (result.url.indexOf('tif') > -1 || result.url.indexOf('svgz') > -1){
					document.getElementById("printInst").innerHTML = "Click on the link below to download the image file.";
					document.getElementById("printMapLink").innerHTML = "<a href='"+result.url+"' target='_blank'>"+template.format.toUpperCase()+" File</a>";
				}
				else {
					document.getElementById("printInst").innerHTML = "Disable pop-up blocker. Printout will open in a new tab.";
					window.open(result.url,"_blank");
					document.getElementById("printMapLink").innerHTML = "Opened map in a new tab.<br/>Link to <a href='"+result.url+"' target='_blank'>"+template.format.toUpperCase()+" File</a>";
				}
				for (i=0; i<pointWithText; i++) removeDrawItem(); // remove extra text layer added for points with text because of bug in PrintTask
				// Hide loading icon and change Printing... label back to Print.
				if (done){
					registry.byId("print_button").set("label", "Print");
					document.getElementById("printLoading").style.display="none";
				}
				done=true;
				//printDialog.hide();
			}
			function printError(err){
				registry.byId("print_button").set("label", "Print");
				document.getElementById("printLoading").style.display="none";
				alert("Error printing: "+err,"Code Error",err);
				document.getElementById("printMapLink").innerHTML = "";
				document.getElementById("printLegendLink").innerHTML = "";
				for (var i=0; i<pointWithText; i++) removeDrawItem(); // remove extra text layer added for points with text because of bug in PrintTask
				printDialog.hide();
			}
			//Do not allow printing outside of Colorado
			if (!fullExtent.contains(previewMap.extent)){
				alert ("Printing is only allowed for Colorado.","Warning");
				registry.byId("print_button").set("label", "Print");
				document.getElementById("printLoading").style.display="none";
				document.getElementById("printMapLink").innerHTML = "";
				document.getElementById("printLegendLink").innerHTML = "";
				return;
			}

			printTask.execute(params, printResult, printError);
			// see how long it takes to generate the preview jpg. Display in Google Analytics and console
			startTim = Date.now();
			
			
			//************************
			//       Legend - open legend in separate pdf document for plain pdf format selection
			//************************
			if (format.options[format.selectedIndex].value=="pdf" && printLegendFlag && document.getElementById("printLegend").checked) {
				var printTask2 = new PrintTask(printServiceUrl);
				var params2 = new PrintParameters();
				var template2 = new PrintTemplate();
				template2.exportOptions = { dpi: 300 };
				if (ourMVUM && mvum)
					template2.layout = "Legend Letter "+selectedValue_orient+ " MVUM";
				else
					template2.layout = "Legend Letter "+selectedValue_orient;
				template2.format = "PDF";
				template2.layoutOptions = {
					titleText: document.getElementById("printTitle").value,
					authorText: prtDisclaimer,
					legendLayers: legendArr, // empty array means no legend
					customTextElements:  [
						{"Subtitle": document.getElementById("printSubTitle").value},
						{"Legend": legendArr}
					]
				};
				params2.map = previewMap;
				params2.template = template2;
				
				function printResult2(result){
					console.log("printing legend to "+result.url);
					window.open(result.url,"_blank");
					if (done){
						registry.byId("print_button").set("label", "Print");
						document.getElementById("printLoading").style.display="none";
						//printDialog.hide();
					}
					document.getElementById("printLegendLink").innerHTML = "Opened legend in a new tab.Link to <a href='"+result.url+"' target='_blank'>"+template.format.toUpperCase()+" File</a>";
					done = true;
				}
				function printError2(err){
					registry.byId("print_button").set("label", "Print");
					document.getElementById("printLoading").style.display="none";
					document.getElementById("printLegendLink").innerHTML = "";
					document.getElementById("printMapLink").innerHTML = "";
					if (err.details)
						alert("Error printing the legend: "+err+err.details,"Code Error",err);
					else
						alert("Error printing the legend: "+err,"Code Error",err);
					printDialog.hide();
				}
				printTask2.execute(params2, printResult2, printError2);
			}
		}
		catch(e){
			for (i=0; i<pointWithText; i++) removeDrawItem(); // remove extra text layer added for points with text because of bug in PrintTask
			alert("Error while printing: "+e.message,"Code Error",e);
			registry.byId("print_button").set("label", "Print");
			document.getElementById("printLoading").style.display="none";
		}
	});
}