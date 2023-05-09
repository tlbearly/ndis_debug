var prtDisclaimer="";
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
	require(["esri/SpatialReference","esri/layers/GraphicsLayer","esri/graphic",
	"esri/layers/ArcGISTiledMapServiceLayer","esri/layers/ArcGISDynamicMapServiceLayer","esri/geometry/Point",
	"esri/layers/VectorTileLayer",
	"esri/layers/OpenStreetMapLayer",
	"dojo/dom","dojo/on","dojo/_base/array"
	],
	function(SpatialReference,GraphicsLayer,Graphic,ArcGISTiledMapServiceLayer,ArcGISDynamicMapServiceLayer,Point,VectorTileLayer,OpenStreetMapLayer,dom,on,array){
		// FUNCTIONS
		function createFeatureLayer(id){
			// 4-15-22 Handle loading Wildfire Incidents and Perimeter
			if(dom.byId("printDiv").style.display === "none") return;
			
			require(["esri/layers/FeatureLayer"], function(FeatureLayer){
				tries[id]++;
				var layer = new FeatureLayer(map.getLayer(id).url, {
					"opacity": Number(map.getLayer(id).opacity),
					"id":  id,
					"visible": map.getLayer(id).visible
				});
				prev_layer_events.push(on(layer,"error", handleFeatureLayerError));
				prev_layer_events.push(on(layer,"load", handleFeatureLayerLoad));
			});
		}
		function handleFeatureLayerLoad(event){
			// 4-15-22
			if(tries[event.target.id] > 5)
				alert("While printing, the "+event.target.id+" service loaded sucessfully.","Note");
			event.layer.refresh();
			previewMap.addLayer(event.layer);
		}
		function handleFeatureLayerError(event){
			// 4-15-22
			// Try every 2 seconds for up to 5 times 
			if (tries[event.target.id] < 5){
				setTimeout(function(){createFeatureLayer(event.target.id);},500);
			} 
			// On the 5th try, give a warning
			else if (tries[event.target.id] == 5){
				if (event.target.id.indexOf("Motor Vehicle") > -1 || event.target.id.indexOf("Wildfire") > -1 || event.target.id.indexOf("BLM") > -1)
					alert("While printing, the external map service that provides "+event.target.id+" is experiencing problems.  This issue is out of CPW control. We will continue trying to load it. We apologize for any inconvenience.","External (Non-CPW) Map Service Error");
				else
					alert("While printing, the "+event.target.id+" service is busy or not responding. We will continue trying to load it.","Data Error");
				setTimeout(function(){createFeatureLayer(event.target.id);},500);
			}
			// Greater than 5 tries. Keep trying every 30 seconds
			else {
//DEBUG
//console.log("Retrying to load: "+event.target.id);
//if(event.target.id.indexOf("Hunter Reference")>-1)
//layer.setAttribute("url","https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/HuntingAtlas/HuntingAtlas_Base_Map/MapServer");
//if(event.target.id.indexOf("Game Species")>-1)
//layer.setAttribute("url","https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/HuntingAtlas/HuntingAtlas_BigGame_Map/MapServer");
//if(event.target.id.indexOf("Motor Vehicle")>-1)
//layer.setAttribute("url","https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_MVUM_02/MapServer");
//console.log("url="+layer.getAttribute("url"));
				setTimeout(function(){createFeatureLayer(event.target.id);},1000);
			}
		}

		function createLayer(map_layer){
			// Create  ArcGISDynamicMapService layers and add to preview map
			// copy the visibleLayers array by value not address

			// stop loading layers if print dialog is not showing
			if(dom.byId("printDiv").style.display === "none") return;
//console.log("trying to load: "+map_layer.id);
			tries[map_layer.id]++;
			var visLayers = [];
			for (var j=0; j<map_layer.visibleLayers.length; j++)
				visLayers.push(parseInt(map_layer.visibleLayers[j]));
			var prev_layer = new ArcGISDynamicMapServiceLayer(map_layer.url, {
				"opacity": parseFloat(map_layer.opacity),
				"id":map_layer.id,
				"visible": map_layer.visible
			});
			prev_layer.setVisibleLayers(visLayers);
			visLayers = null;
			prev_layer_events.push(on(prev_layer,"error",handleLayerError));
			prev_layer_events.push(on(prev_layer,"load",handleLayerLoad));
			printDialog.on("hide",handleClosePrintDialog);
		}
		function handleClosePrintDialog(event){
			// remove on load and on error listeners
//console.log("removing listeners="+prev_layer_events.length);
			array.forEach(prev_layer_events, function(handle){
				 handle.remove();
				 });
			prev_layer_events = [];
		}
		function handleLayerError(event){
//console.log("failed to load: "+event.target.id+" tries="+tries[event.target.id]);
			if (tries[event.target.id] < 5){
				setTimeout(function(){createLayer(map.getLayer(event.target.id));},500);
			}
			else if (tries[event.target.id] === 5){
				if (event.target.id.indexOf("Motor Vehicle") > -1 || event.target.id.indexOf("Wildfire") > -1 || event.target.id.indexOf("BLM") > -1)
					alert("While printing, the external map service that provides "+event.target.id+" is experiencing problems.  This issue is out of CPW control. We will continue trying to load it. We apologize for any inconvenience.","External (Non-CPW) Map Service Error");
				else
					alert("While printing, the "+event.target.id+" service is busy or not responding. We will continue trying to load it.","Data Error");
				setTimeout(function(){createLayer(map.getLayer(event.target.id));},500);
			}
			else{
//DEBUG
//if(event.target.id === "Hunter Reference")
//map.getLayer("Hunter Reference").url = "https://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/HuntingAtlas/HuntingAtlas_Base_Map/MapServer";
//console.log("trying again with: "+map.getLayer(event.target.id).url);
				setTimeout(function(){createLayer(map.getLayer(event.target.id));},1000);
			}
		}

		function handleLayerLoad(event){
			// wait for layerInfos to load
//console.log("loaded: "+event.target.id+"!!!!!!!!!!");
			if(tries[event.target.id] > 5)
				alert("While printing, the "+event.target.id+" service loaded sucessfully.","Note");
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
		}
		// END FUNCTIONS

		// VARIABLES
		var sr = new SpatialReference({
			"wkid": wkid
		});
		var prev_layer, prev_layer_events=[], countLayers=0, processedLayers=0,previewLayers=[],correctOrder=[];
		var tries=[];
		var map_layer,osmLayer;

		document.getElementById("printMapLink").innerHTML = "";
		document.getElementById("printLegendLink").innerHTML = "";
		// previewMap is created in readConfig.js
		document.getElementById("printTitle").value = "My Custom Map";
		document.getElementById("printSubTitle").value = dom.byId("title").innerHTML;
		previewMap.removeAllLayers();
		
		//4-18-22 move above because createLayer & createFeatureLayer check if it is open and return if is not open.
		printDialog.show();

		
		// add basemaps
		for (i=0;i<map.layerIds.length; i++){
			map_layer = map.getLayer(map.layerIds[i]);
			if (map.layerIds[i] == "layer_osm"){
				osmLayer = new OpenStreetMapLayer();
				osmLayer.id = "layer_osm";
				previewMap.addLayer(osmLayer);
				osmLayer = null;
			}
			// vector open street maps
			else if (map_layer.attributionDataUrl && map_layer.attributionDataUrl.indexOf("OpenStreet")>-1){
				osmLayer = new OpenStreetMapLayer();
				osmLayer.id = "layer_osm";
				previewMap.addLayer(osmLayer);
				osmLayer = null;
			}
			else if (map.layerIds[i].indexOf("layer")>-1){
				if (map.getLayer(map.layerIds[i]).visibleAtMapScale == true){
					if (map.getLayer(map.layerIds[i]).url.indexOf ("MapServer")>-1)
						basemap = new ArcGISTiledMapServiceLayer(map.getLayer(map.layerIds[i]).url,{"id":"basemap","visible": true});
					else {
						basemap = new VectorTileLayer(map.getLayer(map.layerIds[i]).url,{"id":"basemap","visible": true});
						basemap.setStyle(map.getLayer(map.layerIds[i]).url);
					}
					if (map_layer._basemapGalleryLayerType == "reference")
						basemap.id="reference";
					else if (i>0)basemap.id="basemap"+i;
					basemap.spatialReference = map.spatialReference;
					basemap._basemapGalleryLayerType = map_layer._basemapGalleryLayerType;
					basemap.refresh();
					previewMap.addLayer(basemap);
					basemap = null;
				}
			}
		}

		// set layers
		// Count number of visible non-basemap layers, so we can add them in the correct order. tlb 8-14-17
		for (i=0; i<map.layerIds.length; i++) {
			map_layer = map.getLayer(map.layerIds[i]);		
			if (map_layer.id.indexOf("layer") == 0)	continue;
			else if (map_layer.attributionDataUrl && map_layer.attributionDataUrl.indexOf("OpenStreet")>-1) continue;																											
			if (map_layer.layerInfos && map_layer.visible){
				countLayers++;
				correctOrder.push(map_layer.id);
			}
		}
		for (i=0; i<map.layerIds.length; i++){
			map_layer = map.getLayer(map.layerIds[i]);

			if (map_layer.layerInfos && map_layer.visible){
				tries[map_layer.id]=0;
				createLayer(map_layer); // 4-18-22

				/*
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
					// add hidden group ids
					for (j=0; j<layer.visibleLayers.length; j++) {
						k=layer.visibleLayers[j];
						do {
							// Add hidden group sublayers for all levels
							if (hideGroupSublayers.indexOf(layerInfos[k].name) > -1 && layerInfos[k].subLayerIds) {
								for (var m=0; m<layerInfos[k].subLayerIds.length; m++){
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
				});*/
			}
		}
		var graphics_layer;
		var graphics;
		var a,g;
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
					g = graphics[a].clone(); // 4-12-22
					graphics_layer.add(g); // 4-12-22
				}
				previewMap.addLayer(graphics_layer);
				graphics_layer = null;
				graphics=null;
			}
			else if (map.graphicsLayerIds[i].indexOf("Wildfire")>-1){
				// 4-12-22 add wildfire layers. It is a feature layer but is added to graphics layers
				tries[map.graphicsLayerIds[i]]=0;
				createFeatureLayer(map.graphicsLayerIds[i]);
			}
		}
		// add hb1298 points
		if (typeof hb1298GraphicsLayer != "undefined") {
			graphics_layer = new GraphicsLayer();
			graphics_layer.visible=true;
			graphics_layer.spatialReference = previewMap.spatialReference;
			graphics = map.getLayer(map.graphicsLayerIds[i]).graphics;
			for (a=0; a<hb1298GraphicsLayer.graphics.length; a++){
				g = graphics[a].clone(); // 4-12-22
				graphics_layer.add(g); // 4-12-22
			}
			previewMap.addLayer(graphics_layer);
			graphics_layer = null;
			graphics=null;
		}
		
		previewMap.spatialReference = sr;
		var pt = new Point(map.extent.xmax+((map.extent.xmin-map.extent.xmax)/2),map.extent.ymin+((map.extent.ymax-map.extent.ymin)/2),sr);
		previewMap.centerAndZoom(pt,map.getLevel()).then(function(){
			changePrintSize();
			// 4-18-22 move above because createLayer test if it is open.  printDialog.show();
		});
		pt=null;
		sr=null;
	});
}

function changePrintSize(){
	require(["dojo/dom","dijit/registry"],function(dom,registry){
		if (!previewMap || !previewMap.extent) {
			alert("Please wait for page to load.");
			return;
		}
		document.getElementById("printMapLink").innerHTML = "";
		//document.getElementById("printLegendLink").innerHTML = "";													
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
			if (selectedValue_size == "Letter ANSI A "){
				previewMap.width=490;
				previewMap.height=348;
				registry.byId("printPreviewMap").resize({w:490,h:348});
			}
			// 17 x 11
			// 17-.8 x 11-1.25
			// 16.2 x 8.75 inch image (without borders)
			// 1555 x 936 pixels in screen resolution
			// 544 x 328 35% of that
			else if (selectedValue_size == "Tabloid ANSI B ") {
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
			if (selectedValue_size == "Letter ANSI A "){
				previewMap.width=370;
				previewMap.height=468;
				registry.byId("printPreviewMap").resize({ w:370,h:468});
			}
			// 11 x 17
			// 11-.8 x 17-1.25
			// 10.2 x 15.75 inch image (without borders)
			// 979 x 1512 pixels in screen resolution
			// 343 x 529 35% of that
			else if (selectedValue_size == "Tabloid ANSI B ") {
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
		//document.getElementById("printLegendLink").innerHTML = "";
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

		// FUNCTIONS
		function printResult(result){
			console.log("printing to "+result.url);
			// 3-21-22 add try catch
			try{
				window.open(result.url,"_blank");
			}catch(e){
				alert("Can't open printout in new window. Use link provided.");
			}
			
			for (i=0; i<pointWithText; i++) removeDrawItem(); // remove extra text layer added for points with text because of bug in PrintTask
			if (done){
				registry.byId("print_button").set("label", "Print");
				document.getElementById("printLoading").style.display="none";
				//printDialog.hide();
			}
			document.getElementById("printMapLink").innerHTML = "Opened map in a new tab.";
			done = true;
		}
		function printError(err){
			registry.byId("print_button").set("label", "Print");
			document.getElementById("printLoading").style.display="none";
			alert("Error printing with basemap, "+mapBasemap+". Error Code: "+err,"Code Error",err);
			document.getElementById("printMapLink").innerHTML = "";
			document.getElementById("printLegendLink").innerHTML = "";
			for (var i=0; i<pointWithText; i++) removeDrawItem(); // remove extra text layer added for points with text because of bug in PrintTask
			printDialog.hide();
		}
		function printResult2(result){
			console.log("printing legend to "+result.url);
			// 3-21-22 add try catch
			try{
				window.open(result.url,"_blank");
			}catch(e){
				console.log("Can't open printout in new window. Use link provided.");
			}
			if (done){
				registry.byId("print_button").set("label", "Print");
				document.getElementById("printLoading").style.display="none";
				//printDialog.hide();
			}
			document.getElementById("printLegendLink").innerHTML = "Opened legend in a new tab.";
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

	// END FUNCTIONS
	
	    var i;
		var pointWithText;
		try{
			var printLegendFlag = document.getElementById("printLegend"); // Does the DOM exist?
			//var done=false;
			//var printLegendFlag = dom.byId("printLegendCB").style.display=="inline-block" ? true : false; // Is the legend checkbox displayed?
			//if (!printLegendFlag) done=true; // turn off wait icon after printing map; don't wait for legend to print
			registry.byId("print_button").set("label", "Creating...");
			document.getElementById("printLoading").style.display="inline-block";
			document.getElementById("printMapLink").innerHTML = "";
			document.getElementById("printLegendLink").innerHTML = "";
			pointWithText = 0; // we need to add a layer to the map because of a bug in PrintTask, set this flag so we can remove it.
			// get legend layers
			var layer = previewMap.getLayersVisibleAtScale();
			var legendArr = [];
			var legend;
			var done=true;
			if (printLegendFlag && document.getElementById("printLegend").checked) done=false; // has legend
			for (i=1; i<layer.length; i++) {
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
					if (layer[i].visibleLayers) {
						legend = new LegendLayer();
						legend.layerId = layer[i].id;
						legend.subLayerIds = layer[i].visibleLayers;
						legendArr.push(legend);
						legend = null;
					}
				}
			}
						
			var printTask = new PrintTask(printServiceUrl);
			var params = new PrintParameters();
			var template = new PrintTemplate();
			var orient = dom.byId("orient");
			var format = dom.byId("format");
			index = orient.selectedIndex;
			var selectedValue_orient = orient.options[index].value; // Portrait, Landscape
			var size = dom.byId("size");
			index = size.selectedIndex;
			var selectedValue_size = size.options[index].value; // Letter ANSI A, Tabloid ANSI B
			template.exportOptions = { dpi: 96 };
			template.layout = selectedValue_size+selectedValue_orient; //"Letter ANSI A Portrait";
			template.format = "PDF";
			template.preserveScale = false;
			template.showAttribution = false;
			//template.georef_info = true;
			if (printLegendFlag && document.getElementById("printLegend").checked) { 
				template.layoutOptions = {
					titleText: document.getElementById("printTitle").value,
					authorText: prtDisclaimer,
					legendLayers: legendArr, // empty array means no legend
					customTextElements:  [
						{"Subtitle": document.getElementById("printSubTitle").value}
					]
				};
			}
			else {
				template.layoutOptions = {
					titleText: document.getElementById("printTitle").value,
					authorText: prtDisclaimer,
					legendLayers: [], // empty array means no legend
					customTextElements:  [
						{"Subtitle": document.getElementById("printSubTitle").value}
					]
				};
			}
			params.map = previewMap;
			params.template = template;
			
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
			
			
			//************************
			//       Legend
			//************************
			if (printLegendFlag && document.getElementById("printLegend").checked) {
				var printTask2 = new PrintTask(printServiceUrl);
				var params2 = new PrintParameters();
				var template2 = new PrintTemplate();
				template2.exportOptions = { dpi: 96 };
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