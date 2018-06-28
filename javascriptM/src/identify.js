	  //***********
	  // Identify
	  //
	  // Map click calls doIdentify
	  //	if Way Point sets groupContent cache to map.infoWindow._contentPane.innerHTML (the content from the way point infoTemplate)
	  // 	calls showIdentify and displayContent
	  // displayContent
	  //	checks if we have cached content and updates map.infoWindow.setContent
	  //	else it creates identifyTasks for each layer in the selected identify group and calls handleQueryResults
	  // handleQueryResults updates groupContent and map.infowWindow.setContent and calls displayInfoWindow
	  // displayInfoWindow checks for no data and call showIdentify
	  // Identify > More Info button calls placeIdGroupCombo
	  //***********
	  var identifyParams = null;
	  var tasks;
	  var clickPoint;
	  var features = []; // number of features found
	  var numDatabaseCalls = 0;
	  var processedDatabaseCalls = 0;
	  var folder = [];
	  var identifyGroup;
	  var theEvt;
	  var theResults;
	  var identifyGroups = [];
	  var identifyLayers = {};
	  var groupContent = {}; // Cache the infoWindow content for each group for a map click
	  var identifyLayerIds = []; // handles the identify tasks for each group. [GroupName][{url, layerIds, geometryType}]
	  var elevation_url = null;
	  var show_elevation = false;
	  var polySymbol, pointSymbol, lineSymbol;
	  var addToTop = 30;
	  var lastTitle = "";
	  var lastIDGroup = "";

	  require(["esri/tasks/IdentifyParameters", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/symbols/PictureMarkerSymbol",
	      "dojo/_base/Color"
	  ], function(IdentifyParameters, SimpleLineSymbol, SimpleFillSymbol, PictureMarkerSymbol, Color) {
	      //setup generic identify parameters
	      identifyParams = new IdentifyParameters();
	      identifyParams.tolerance = 5;
	      identifyParams.returnGeometry = true;
	      identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;

	      // Set up symbols for highlight on mouse over
	      polySymbol = new SimpleFillSymbol(
	          SimpleFillSymbol.STYLE_SOLID,
	          new SimpleLineSymbol(
	              SimpleLineSymbol.STYLE_SOLID,
	              new Color([255, 0, 0]), 1
	          ),
	          new Color([125, 125, 125, 0.35])
	      );
	      pointSymbol = new PictureMarkerSymbol("assets/images/i_flag.png", 40, 40);
	      lineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 10]), 1);
	  });

	  function readSettingsWidget() {
	      // clear settings on infoWindow hide
	      map.infoWindow.on("hide", function(event) {
			  map.infoWindow.setTitle("");
	      });

	      // Read the SettingsWidget.xml file
	      document.title = app;
	      var settingsFile = app + "/SettingsWidget.xml?v=" + ndisVer;
	      var xmlhttp = createXMLhttpRequest();
	      xmlhttp.onreadystatechange = function() {
	          if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
	              try {
	                  //var xmlDoc=xmlhttp.responseXML;	
	                  var xmlDoc = createXMLdoc(xmlhttp);
	                  //---------------
	                  // Read Globals
	                  //---------------
	                  // Load user saved XY projection. Mobile always uses lat/long decimal degrees
	                  settings = {};
	                  //var myPrj = getCookie("prj");
	                  //if (myPrj !== "")
	                  //	settings = {"XYProjection": myPrj};
	                  //else
	                  //	settings = {"XYProjection": xmlDoc.getElementsByTagName("xy_projection")[0].childNodes[0].nodeValue};
	                  //registry.byId("settings_xy_proj").set("value", settings.XYProjection); // Settings Widget
	                  //registry.byId("help_xy_proj").set("value", settings.XYProjection); // Find a Place Help				

	                  /*use_map_link = xmlDoc.getElementsByTagName("use_map_link")[0] && xmlDoc.getElementsByTagName("use_map_link")[0].childNodes[0].nodeValue == "true" ? 1 : 0;
	                  if (use_map_link) {
	                  	document.getElementById("mapLinkBtn").style.display = "block";
	                  }
	                  use_get_extent = xmlDoc.getElementsByTagName("use_get_extent") && xmlDoc.getElementsByTagName("use_get_extent")[0].childNodes[0].nodeValue == "true" ? 1 : 0;
	                  if (use_get_extent) document.getElementById("showExtentBtn").style.display = "block";
	                  */
	                  var use_gmus = xmlDoc.getElementsByTagName("use_gmus")[0] && xmlDoc.getElementsByTagName("use_gmus")[0].childNodes[0].nodeValue == "true" ? 1 : 0;
	                  if (use_gmus) {
	                      settings.useGMUs = true;
	                      if (!xmlDoc.getElementsByTagName("gmu_url")[0])
	                          alert("Missing tag: gmu_url in " + app + "/SettingsWidget.xml", "Data Error");
	                      else
	                          settings.elkUrl = xmlDoc.getElementsByTagName("gmu_url")[0].childNodes[0].nodeValue;
	                      if (!xmlDoc.getElementsByTagName("gmu_field")[0])
	                          alert("Missing tag: gmu_field in " + app + "/SettingsWidget.xml", "Data Error");
	                      else
	                          settings.elkField = xmlDoc.getElementsByTagName("gmu_field")[0].childNodes[0].nodeValue;
	                      if (!xmlDoc.getElementsByTagName("sheep_gmu_url")[0])
	                          alert("Missing tag: sheep_gmu_url in " + app + "/SettingsWidget.xml", "Data Error");
	                      else
	                          settings.sheepUrl = xmlDoc.getElementsByTagName("sheep_gmu_url")[0].childNodes[0].nodeValue;
	                      if (!xmlDoc.getElementsByTagName("sheep_gmu_field")[0])
	                          alert("Missing tag: sheep_gmu_field in " + app + "/SettingsWidget.xml", "Data Error");
	                      else
	                          settings.sheepField = xmlDoc.getElementsByTagName("sheep_gmu_field")[0].childNodes[0].nodeValue;
	                      if (!xmlDoc.getElementsByTagName("goat_gmu_url")[0])
	                          alert("Missing tag: goat_gmu_url in " + app + "/SettingsWidget.xml", "Data Error");
	                      else
	                          settings.goatUrl = xmlDoc.getElementsByTagName("goat_gmu_url")[0].childNodes[0].nodeValue;
	                      if (!xmlDoc.getElementsByTagName("goat_gmu_field")[0])
	                          alert("Missing tag: goat_gmu_field in " + app + "/SettingsWidget.xml", "Data Error");
	                      else
	                          settings.goatField = xmlDoc.getElementsByTagName("goat_gmu_field")[0].childNodes[0].nodeValue;
	                      /*if (gmu == "Big Game GMU")
	                      	showGMUCombo(settings.elkUrl,settings.elkField);
	                      else if (gmu == "Bighorn GMU")
	                      	showGMUCombo(settings.sheepUrl,settings.sheepField);
	                      else if (gmu == "Goat GMU")
	                      	showGMUCombo(settings.goatUrl,settings.goatField);
	                      */
	                  } else {
	                      settings.useGMUs = false;
	                  }
	                  // no action list on popup mobile when included in map instantiation. Add it.
	                  require(["dojo/query", "dojo/dom-construct", "dojo/on", "dojo/dom", "dojo/domReady!"], function(query, domConstruct, on, dom) {
	                      // callback for more button >
	                      query("div.titleButton.arrow.hidden", map.infoWindow.domNode).on("click", placeIdGroupCombo);
	                      var actionlist = domConstruct.create("span", {
	                          "class": "actionList"
	                      }, map.infoWindow.domNode);
	                      // Set zoom to callback by hand since we are 
	                      domConstruct.create("a", {
	                          "id": "zoomTo",
	                          "class": "action",
	                          "innerHTML": "Zoom To",
	                          "href": "javascript:void(0);"
	                      }, query(".actionList", map.infoWindow.domNode)[0]);
	                      // Register a function to be called when the user clicks on the above link
	                      on(query(".actionList #zoomTo")[0], "click", zoomToPt);
	                      var driving_directions = xmlDoc.getElementsByTagName("driving_directions")[0] && xmlDoc.getElementsByTagName("driving_directions")[0].childNodes[0].nodeValue == "true" ? 1 : 0;
	                      if (driving_directions) {
	                          // Add a link into the InfoWindow Actions panel
	                          domConstruct.create("a", {
	                              "style": "padding-left:20px",
	                              "class": "action",
	                              "id": "dirLink",
	                              "innerHTML": "Directions",
	                              "href": "javascript:void(0);"
	                          }, query(".actionList", map.infoWindow.domNode)[0]);
	                          // Register a function to be called when the user clicks on the above link
	                          on(dom.byId("dirLink"), "click", getDirections);
	                      }
	                      // for google api elevation
	                      /*if (xmlDoc.getElementsByTagName("elevation")[0] && xmlDoc.getElementsByTagName("elevation")[0].firstChild.nodeValue)
	                      	show_elevation = xmlDoc.getElementsByTagName("elevation")[0].firstChild.nodeValue=="true" ? 1 : 0;
	                      if (show_elevation) {
	                      	addToTop=45;
	                      	domConstruct.create("a", {
	                      			"id": "elevLink",
	                      			"class": "action",
	                      			"innerHTML": "Elevation",
	                      			"style": "padding-left:20px",
	                      			"href": "javascript:void(0)"
	                      		}, query(".actionList", map.infoWindow.domNode)[0] );
	                      		// Register a function to be called when the user clicks on
	                      		// the above link
	                      		on(dom.byId("elevLink"), "click", getElevation);						
	                      }*/

	                      if (xmlDoc.getElementsByTagName("elevation")[0] && xmlDoc.getElementsByTagName("elevation")[0].firstChild.nodeValue)
	                          show_elevation = xmlDoc.getElementsByTagName("elevation")[0].firstChild.nodeValue == "true" ? 1 : 0;
	                      if (show_elevation && xmlDoc.getElementsByTagName("elevation_url")[0]) {
	                          if (xmlDoc.getElementsByTagName("elevation_url")[0].firstChild.nodeValue)
	                              elevation_url = xmlDoc.getElementsByTagName("elevation_url")[0].firstChild.nodeValue;
	                          else alert("Missing elevation_url tag in SettingsWidget.xml.", "Data Error");
	                      }

	                      domConstruct.create("div", {
	                          "class": "action",
	                          "id": "identifyPoint",
	                          "innerHTML": "Loading lat, long..."
	                      }, query(".actionList", map.infoWindow.domNode)[0]);

	                      // for google api elevation
	                      // add space to show elevation
	                      /*if (show_elevation) {
	                      	domConstruct.create("div", {
	                      		"class": "action",
	                      		"id": "elevation",
	                      		"innerHTML": ""
	                      	}, query(".actionList", map.infoWindow.domNode)[0] );
	                      }*/

	                      // add function to clear infotemplate content for way points
	                      query("div.titleButton.close", map.infoWindow.domNode).on("click", clearContent);
	                      on(query("div.esriMobileNavigationItem.left")[0], "click", clearContent);
	                  });



	                  // Read the Identify Groups from the folder tags
	                  folder = xmlDoc.getElementsByTagName("folder");
	                  for (var f = 0; f < folder.length; f++) {
	                      // Set default identifyGroup to first in the list
	                      if (f == 0) identifyGroup = folder[f].getAttribute("label");
	                      identifyGroups.push(folder[f].getAttribute("label"));
	                      // Initialize array for layer urls, layerIds, and geometry for identify task
	                      identifyLayerIds[identifyGroups[f]] = [];

	                      // Read the layer tags for each group
	                      var layer = folder[f].getElementsByTagName("layer");
	                      identifyLayers[identifyGroups[f]] = {};
	                      // Description
	                      if (folder[f].getElementsByTagName("desc")[0])
	                          identifyLayers[identifyGroups[f]].desc = folder[f].getElementsByTagName("desc")[0].firstChild.nodeValue;
	                      // Layers
	                      var label = "missing label";
	                      for (var i = 0; i < layer.length; i++) {
	                          if (!layer[i].getAttribute("label"))
	                              alert("Error in " + app + "/SettingsWidget.xml. Missing label in folder: " + identifyGroups[f] + ".", "Data Error");
	                          else
	                              label = layer[i].getAttribute("label");

	                          // Make sure vis_url and vis_id are set if id_vis_only is true
	                          if (folder[f].getAttribute("id_vis_only") && folder[f].getAttribute("id_vis_only").toLowerCase() == "true") {
	                              if (!layer[i].getElementsByTagName("vis_url")[0] || !layer[i].getElementsByTagName("vis_id")[0])
	                                  alert("Error in " + app + "/SettingsWidget.xml. When vis_id_only is set in a folder, every layer in the folder must have a vis_id and vis_url tag for the layer that is in the map to check if it is visible or not. Missing vis_url and vis_id tags in folder: " + identifyGroups[f] + ".", "Data Error");
	                          }
	                          identifyLayers[identifyGroups[f]][label] = {};

	                          // Create list of ids for this layer
	                          var found = false;
	                          if (!layer[i].getElementsByTagName("url")[0] || !layer[i].getElementsByTagName("id")[0])
	                              alert("Error in " + app + "/SettingsWidget.xml. Missing url or id in folder: " + identifyGroups[f] + " for layer: " + label + ".", "Data Error");
	                          else {
	                              for (var j = 0; j < identifyLayerIds[identifyGroups[f]].length; j++) {
	                                  // Identify only visible layers. Each layer in this folder in SettingsWidget.xml must have a vis_id and vis_url tags
	                                  if ((folder[f].getAttribute("id_vis_only") && folder[f].getAttribute("id_vis_only").toLowerCase() == "true") &&
	                                      identifyLayerIds[identifyGroups[f]][j].url == layer[i].getElementsByTagName("url")[0].childNodes[0].nodeValue &&
	                                      identifyLayerIds[identifyGroups[f]][j].vis_url == layer[i].getElementsByTagName("vis_url")[0].childNodes[0].nodeValue &&
	                                      identifyLayerIds[identifyGroups[f]][j].geometry == layer[i].getElementsByTagName("geometry")[0].childNodes[0].nodeValue.toLowerCase()) {
	                                      identifyLayerIds[identifyGroups[f]][j].ids.push(layer[i].getElementsByTagName("id")[0].childNodes[0].nodeValue);
	                                      identifyLayerIds[identifyGroups[f]][j].vis_ids.push(layer[i].getElementsByTagName("vis_id")[0].childNodes[0].nodeValue);
	                                      found = true;
	                                  } else if (identifyLayerIds[identifyGroups[f]][j].url == layer[i].getElementsByTagName("url")[0].childNodes[0].nodeValue &&
	                                      identifyLayerIds[identifyGroups[f]][j].geometry == layer[i].getElementsByTagName("geometry")[0].childNodes[0].nodeValue.toLowerCase()) {
	                                      identifyLayerIds[identifyGroups[f]][j].ids.push(layer[i].getElementsByTagName("id")[0].childNodes[0].nodeValue);
	                                      found = true;
	                                  }
	                              }
	                          }
	                          if (!found) {
	                              // url was not found in list, add it
	                              if (!layer[i].getElementsByTagName("url")[0] || !layer[i].getElementsByTagName("id")[0])
	                                  alert("Error in " + app + "/SettingsWidget.xml. Missing url or id in folder: " + identifyGroups[f] + " for layer: " + label + ".", "Data Error");
	                              else {
	                                  // Add id_vis_only for layer identify option LAYER_OPTION_ALL or LAYER_OPTION_VISIBLE at the folder level 1-9-18
	                                  var vis_url = null,
	                                      vis_ids = [];
	                                  if (folder[f].getAttribute("id_vis_only") && folder[f].getAttribute("id_vis_only").toLowerCase() == "true") {
	                                      vis_url = layer[i].getElementsByTagName("vis_url")[0].childNodes[0].nodeValue;
	                                      vis_ids.push(layer[i].getElementsByTagName("vis_id")[0].childNodes[0].nodeValue);
	                                  }
	                                  identifyLayerIds[identifyGroups[f]].push({
	                                      url: layer[i].getElementsByTagName("url")[0].childNodes[0].nodeValue,
	                                      ids: new Array(layer[i].getElementsByTagName("id")[0].childNodes[0].nodeValue),
	                                      geometry: layer[i].getElementsByTagName("geometry")[0].childNodes[0].nodeValue.toLowerCase(),
	                                      id_vis_only: folder[f].getAttribute("id_vis_only") && folder[f].getAttribute("id_vis_only").toLowerCase() == "true" ? true : false,
	                                      vis_url: vis_url,
	                                      vis_ids: vis_ids
	                                  });
	                              }
	                          }

	                          // Add a layer that has a database call
	                          if (layer[i].getElementsByTagName("database")[0]) {
	                              if (!layer[i].getElementsByTagName("url")[0])
	                                  alert("Error in " + app + "/SettingsWidget.xml. Missing url in folder: " + identifyGroups[f] + " for layer: " + label + ".", "Data Error");
	                              else
	                                  identifyLayers[identifyGroups[f]][label].url = layer[i].getElementsByTagName("url")[0].childNodes[0].nodeValue;
	                              if (!layer[i].getElementsByTagName("id")[0])
	                                  alert("Error in " + app + "/SettingsWidget.xml. Missing id in folder: " + identifyGroups[f] + " for layer: " + label + ".", "Data Error");
	                              else
	                                  identifyLayers[identifyGroups[f]][label].id = layer[i].getElementsByTagName("id")[0].childNodes[0].nodeValue;
	                              if (!layer[i].getElementsByTagName("geometry")[0])
	                                  alert("Error in " + app + "/SettingsWidget.xml. Missing geometry in folder: " + identifyGroups[f] + " for layer: " + label + ".", "Data Error");
	                              else
	                                  identifyLayers[identifyGroups[f]][label].geometry = layer[i].getElementsByTagName("geometry")[0].childNodes[0].nodeValue;
	                              if (!layer[i].getElementsByTagName("fields")[0])
	                                  alert("Error in " + app + "/SettingsWidget.xml. Missing fields in folder: " + identifyGroups[f] + " for layer: " + label + ".", "Data Error");
	                              else
	                                  identifyLayers[identifyGroups[f]][label].fields = layer[i].getElementsByTagName("fields")[0].childNodes[0].nodeValue.split(",");
	                              if (!layer[i].getElementsByTagName("displaynames")[0])
	                                  alert("Error in " + app + "/SettingsWidget.xml. Missing displaynames in folder: " + identifyGroups[f] + " for layer: " + label + ".", "Data Error");
	                              else
	                                  identifyLayers[identifyGroups[f]][label].displaynames = layer[i].getElementsByTagName("displaynames")[0].childNodes[0].nodeValue.split(",");
	                              if (layer[i].getElementsByTagName("position")[0])
	                                  identifyLayers[identifyGroups[f]][label].position = layer[i].getElementsByTagName("position")[0].childNodes[0].nodeValue;
	                              else
	                                  identifyLayers[identifyGroups[f]][label].position = 0;
	                              if (!layer[i].getElementsByTagName("database")[0])
	                                  alert("Error in " + app + "/SettingsWidget.xml. Missing database in folder: " + identifyGroups[f] + " for layer: " + label + ".", "Data Error");
	                              else
	                                  identifyLayers[identifyGroups[f]][label].database = layer[i].getElementsByTagName("database")[0].childNodes[0].nodeValue;

	                              if (!layer[i].getElementsByTagName("filename")[0])
	                                  alert("Error in " + app + "/SettingsWidget.xml. Missing filename in folder: " + identifyGroups[f] + " for layer: " + label + ".", "Data Error");
	                              else
	                                  identifyLayers[identifyGroups[f]][label].filename = layer[i].getElementsByTagName("filename")[0].childNodes[0].nodeValue;
	                              if (layer[i].getElementsByTagName("one2one_fields")[0] && layer[i].getElementsByTagName("one2one_fields")[0].childNodes.length > 0)
	                                  identifyLayers[identifyGroups[f]][label].one2one_fields = layer[i].getElementsByTagName("one2one_fields")[0].childNodes[0].nodeValue.split(",");
	                              if (layer[i].getElementsByTagName("one2one_display")[0] && layer[i].getElementsByTagName("one2one_display")[0].childNodes.length > 0)
	                                  identifyLayers[identifyGroups[f]][label].one2one_display = layer[i].getElementsByTagName("one2one_display")[0].childNodes[0].nodeValue.split(",");
	                              if (layer[i].getElementsByTagName("one2many_fields")[0] && layer[i].getElementsByTagName("one2many_fields")[0].childNodes.length > 0)
	                                  identifyLayers[identifyGroups[f]][label].one2many_fields = layer[i].getElementsByTagName("one2many_fields")[0].childNodes[0].nodeValue.split(",");
	                          }
	                          // Add layer without database call
	                          else {
	                              if (!layer[i].getElementsByTagName("url")[0])
	                                  alert("Error in " + app + "/SettingsWidget.xml. Missing url in folder: " + identifyGroups[f] + " for layer: " + label + ".", "Data Error");
	                              else
	                                  identifyLayers[identifyGroups[f]][label].url = layer[i].getElementsByTagName("url")[0].childNodes[0].nodeValue;
	                              if (!layer[i].getElementsByTagName("id")[0])
	                                  alert("Error in " + app + "/SettingsWidget.xml. Missing id in folder: " + identifyGroups[f] + " for layer: " + label + ".", "Data Error");
	                              else
	                                  identifyLayers[identifyGroups[f]][label].id = layer[i].getElementsByTagName("id")[0].childNodes[0].nodeValue;
	                              if (!layer[i].getElementsByTagName("geometry")[0])
	                                  alert("Error in " + app + "/SettingsWidget.xml. Missing geometry in folder: " + identifyGroups[f] + " for layer: " + label + ".", "Data Error");
	                              else
	                                  identifyLayers[identifyGroups[f]][label].geometry = layer[i].getElementsByTagName("geometry")[0].childNodes[0].nodeValue;
	                              if (!layer[i].getElementsByTagName("fields")[0])
	                                  alert("Error in " + app + "/SettingsWidget.xml. Missing fields in folder: " + identifyGroups[f] + " for layer: " + label + ".", "Data Error");
	                              else
	                                  identifyLayers[identifyGroups[f]][label].fields = layer[i].getElementsByTagName("fields")[0].childNodes[0].nodeValue.split(",");
	                              if (!layer[i].getElementsByTagName("displaynames")[0])
	                                  alert("Error in " + app + "/SettingsWidget.xml. Missing displaynames in folder: " + identifyGroups[f] + " for layer: " + label + ".", "Data Error");
	                              else
	                                  identifyLayers[identifyGroups[f]][label].displaynames = layer[i].getElementsByTagName("displaynames")[0].childNodes[0].nodeValue.split(",");
	                              // Add ability to identify sheep and goat GMUs. 4-18-18 change label to Big Game GMU Boundaries for use with AssetReport_Data mapservice
	                              if (label == "Big Game GMU Boundaries") {
	                                  identifyLayers[identifyGroups[f]]["Bighorn GMU"] = {};
	                                  identifyLayers[identifyGroups[f]]["Bighorn GMU"].url = settings.sheepUrl.slice(0, settings.sheepUrl.length - 2);
	                                  identifyLayers[identifyGroups[f]]["Bighorn GMU"].id = settings.sheepUrl.slice(settings.sheepUrl.length - 1);
	                                  identifyLayers[identifyGroups[f]]["Bighorn GMU"].geometry = "polygon";
	                                  identifyLayers[identifyGroups[f]]["Bighorn GMU"].fields = [settings.sheepField];
	                                  identifyLayers[identifyGroups[f]]["Bighorn GMU"].displaynames = ["GMU Number"];
	                                  identifyLayers[identifyGroups[f]]["Goat GMU"] = {};
	                                  identifyLayers[identifyGroups[f]]["Goat GMU"].url = settings.goatUrl.slice(0, settings.goatUrl.length - 2);
	                                  identifyLayers[identifyGroups[f]]["Goat GMU"].id = settings.goatUrl.slice(settings.goatUrl.length - 1);
	                                  identifyLayers[identifyGroups[f]]["Goat GMU"].geometry = "polygon";
	                                  identifyLayers[identifyGroups[f]]["Goat GMU"].fields = [settings.goatField];
	                                  identifyLayers[identifyGroups[f]]["Goat GMU"].displaynames = ["GMU Number"];
	                              }
	                          }
	                      }
	                  }
	                  setIdGroupCombo(); // fill the Identify Group drop down list
	                  document.getElementById("loading").style.display = "none";
	              } catch (e) {
	                  alert("Error reading " + app + "/SettingsWidget.xml in javascriptM/identify.js readSettingsWidget(): " + e.message, "Data Error", e);
	                  hideLoading("");
	              }
	          }
	          // if missing file
	          else if (xmlhttp.status === 404) {
	              alert("Error: Missing " + app + "/settingsWidget.xml file.", "Data Error");
	              hideLoading();
	          } else if (xmlhttp.readyState === 4 && xmlhttp.status === 500) {
	              alert("Error reading " + app + "/settingsWidget.xml.", "Code Error");
	              hideLoading();
	          }
	      };
	      xmlhttp.open("GET", settingsFile, true);
	      xmlhttp.send();
	  }

	  function clearContent() {
	      //alert("clearing content");
	      map.infoWindow.setContent("");
	      if (map.getLayer("mapDiv_graphics"))
	          map.removeLayer(map.getLayer("mapDiv_graphics")); // way point highlight
	  }

	  function doIdentify(evt) {
	      if (evt.Event) evt = evt.Event; // call from map.emit below.
	      if (measuring) return;
	      // Still shows the infoWindow for the newly added way point, but does not overwrite it with identify info			
	      if (drawing) {
	          drawing = false;
	          return;
	      }
	      if (dragging) return; // If using Way Point widget return;

	      var map = this; //window.map;

	      require(["dojo/dom-construct", "dojo/query", "dojo/dom", "dojo/on", "dojo/domReady!"], function(domConstruct, query, dom, on) {
	          clickPoint = getScreenClick(evt); //evt.mapPoint;
			  // if the info window is already showing clear the title, so that it will load the new point.
			  if (map.infoWindow.isShowing && !map.infoWindow.wayPt && lastTitle == map.infoWindow._title.innerHTML){
					map.infoWindow.hide();
					if (navigator.userAgent.indexOf('Android') != -1) evt.stopImmediatePropagation();
					map.emit("click", { bubbles: true, cancelable: true, Event: evt });
					return;
			  }
	          // For Android, don't show the infoWindow twice. If this is a way point it is only called once.
	          else if ((navigator.userAgent.indexOf('Android') != -1) && (map.infoWindow._title.innerHTML == "" ||
	                  map.infoWindow._title.innerHTML == "No Information")) evt.stopImmediatePropagation();

			  // reset Way Point flag 4-9-18 fixes bug of info window not showing when click on two way points with same name or same way point in a row.
			  // set wayPt to true in wayPoints.js when a way point graphic is clicked on.
			  map.infoWindow.wayPt = false;
			  
	          // Called for each map click 
	          numDatabaseCalls = 0;
	          processedDatabaseCalls = 0;
	          features = [];
	          theEvt = evt; // Save the click point so we can call this again from changeIdentifyGroup
	          showLoading();
	          // reset array of infoTemplate content for each group to null
	          if (groupContent["Way Point"]) delete groupContent["Way Point"]; // remove way point since we don't know if there is a way point here
	          for (var i = 0; i < identifyGroups.length; i++) {
	              groupContent[identifyGroups[i]] = null;
	          }

	          // way point
	          //if (map.infoWindow._contentPane.innerHTML.indexOf("Way Point") > -1){
	          if (map.infoWindow._title.innerHTML != "" && map.infoWindow._title.innerHTML != "No Information") {
	              if (identifyGroup != "Way Point") lastIDGroup = identifyGroup;
	              identifyGroup = "Way Point";
	              groupContent["Way Point"] = map.infoWindow._contentPane.innerHTML;
	              // Add way point to drop down list if it's not found
	              if (idGroupCombo.getOptions("Way Point") == null) {
	                  idGroupCombo.addOption({ value: "Way Point", label: "Way Point" });
	                  idGroupCombo.startup();
	              }
	              idGroupCombo.set("displayedValue", "Way Point");
	              // Listen for orientation change or resize then resize description text box
	              var supportsOrientationChange = "onorientationchange" in window,
	                  orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";
	              window.addEventListener(orientationEvent, function() {
					if (document.getElementById("wayPtDesc")){  
					  showLoading();
	                  // wait 1/2 a second for screen to draw
					  setTimeout(resizeTextBox(document.getElementById("wayPtDesc")), 500);
					}
	              }, false);
				  lastTitle = map.infoWindow._title.innerHTML;
	          }
	          // did not click on a way point
	          else {
	              map.infoWindow.hide();
	              map.infoWindow.setTitle("Loading...");
	              map.infoWindow.setContent("<p align='center'>Loading...</p>");
	              if (identifyGroup == "Way Point") identifyGroup = lastIDGroup;
	              // remove way point from drop down list if it exists
	              if (idGroupCombo.getOptions("Way Point")) {
	                  idGroupCombo.removeOption("Way Point");
				  }
	          }
	          dom.byId("identifyPoint").innerHTML = "Loading lat, long...";
	          if (elevation_url) {
	              if (query(".actionList #elevation", map.infoWindow.domNode)[0]) {
	                  domConstruct.empty(query(".actionList #elevation", map.infoWindow.domNode)[0]);
	                  domConstruct.place(
	                      domConstruct.toDom("Elevation: loading..."),
	                      query(".actionList #elevation", map.infoWindow.domNode)[0]);
	              } else {
	                  domConstruct.create("span", {
	                      "class": "action",
	                      "id": "elevation",
	                      "innerHTML": "Elevation: loading..."
	                  }, query(".actionList", map.infoWindow.domNode)[0]);
	              }
	          }
	          // for google api elevation
	          /*if (show_elevation) {
	          	domConstruct.empty(query(".actionList #elevation", map.infoWindow.domNode)[0]);
	          }*/
	          showIdentify();
	          displayContent();
	      });
	  }

	  function displayContent() {
	      // Check if have cached infoTemplate content, then show it. Else do identify task then cache results in groupContent.
	      require(["esri/tasks/IdentifyTask", "dojo/_base/array", "dojo/DeferredList", "dojo/_base/Deferred"], function(IdentifyTask, array, DeferredList, Deferred) {
	          if (groupContent[identifyGroup]) {
	              map.infoWindow.setContent(groupContent[identifyGroup]);
	              // Adjust the height of the Way Point description text box to fit the text.
	              if (identifyGroup == "Way Point" && document.getElementById("wayPtDesc"))
	                  resizeTextBox(document.getElementById('wayPtDesc'));
	              getIdentifyFooter();
	              hideLoading("");
	              return;
	          }
	          var task;

	          identifyParams.geometry = clickPoint; //evt.mapPoint;
	          identifyParams.mapExtent = map.extent;
	          identifyParams.width = map.width;
	          identifyParams.height = map.height;

	          var skip = -1; // if id_vis_only and the top layer is hidden this will be true

	          var deferreds = [];
	          for (var i = 0; i < identifyLayerIds[identifyGroup].length; i++) {
	              var item = identifyLayerIds[identifyGroup][i];
	              if (item) {
	                  identifyParams.layerIds = item.ids.slice(); // make a copy of this array since we change it for bighorn or goat gmu
	                  if (item.geometry != "polygon") {
	                      // Used to be 15,10,5
	                      if (map.getScale() <= 36112)
	                          identifyParams.tolerance = 25;
	                      else if (map.getScale() <= 288895)
	                          identifyParams.tolerance = 20;
	                      else
	                          identifyParams.tolerance = 10;
	                  } else
	                      identifyParams.tolerance = 1;

	                  // Show only visible items for identifyGroup when id_vis_only="true" in config.xml
	                  // NOTE: IdentifyParameters option LAYER_OPTION_VISIBLE is supposed to do this but is not working 1-9-18
	                  if (item.id_vis_only) {
	                      //identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE; // this is not working so get visible layers manually and set identifyParams.layerIds
	                      // Get list of visible layers
	                      task = new IdentifyTask(item.vis_url);
	                      var layers = map.getLayersVisibleAtScale(map.getScale());
	                      var url = item.vis_url;
	                      if (item.vis_url[item.vis_url.length - 1] == "/") url = item.vis_url.substr(0, item.vis_url.length - 1);

	                      var vis_layers = [];
	                      identifyParams.layerIds = item.vis_ids.slice(); // get list of ids used in the map
	                      // Loop through each top layer in the TOC that is visible at this scale
	                      array.forEach(layers, function(layer) {
	                          if (layer.url == url) {
	                              if (layer.visible == true) {
	                                  skip = false;
	                                  for (var i = 0; i < identifyParams.layerIds.length; i++) {
	                                      var id = identifyParams.layerIds[i];
	                                      // Make sure it and all it's parents are visible
	                                      while (layer.layerInfos[id].visible == true) {
	                                          if (layer.layerInfos[id].parentLayerId == -1) {
	                                              vis_layers.push(identifyParams.layerIds[i]);
	                                              break;
	                                          } else {
	                                              id = layer.layerInfos[id].parentLayerId;
	                                          }
	                                      }
	                                  }
	                                  identifyParams.layerIds = vis_layers;
	                              } else if (skip == -1) {
	                                  skip = true;
	                              }
	                          }
	                      }); // for each layer
	                  } else {
	                      skip = false;
	                      task = new IdentifyTask(item.url);
	                  }

	                  // remove Big Game GMU if this identifying Bighorn or Goat GMU
	                  if (settings.elkUrl && item.url == settings.elkUrl.slice(0, settings.elkUrl.lastIndexOf("/") + 1) && gmu != "Big Game GMU") {
	                      // Find the index to the layerId for Big Game GMU and remove it from the layer ids.
	                      var index = identifyParams.layerIds.indexOf(settings.elkUrl.slice(settings.elkUrl.lastIndexOf("/") + 1));
	                      if (index > -1) identifyParams.layerIds.splice(index, 1);
	                  }
	                  if (identifyParams.layerIds.length == 0) skip = true;
	                  if (!skip)
	                      deferreds.push(task.execute(identifyParams, identifySuccess, handleQueryError));
	              }
	          }
	          // Add goat and sheep gmus
	          if (identifyGroup == "GMU and Land Management") {
	              if (gmu == "Bighorn GMU") {
	                  identifyParams.tolerance = 1;
	                  identifyParams.layerIds = [settings.sheepUrl.slice(settings.sheepUrl.lastIndexOf("/") + 1)];
	                  task = new IdentifyTask(settings.sheepUrl.slice(0, settings.sheepUrl.lastIndexOf("/") + 1));
	                  deferreds.push(task.execute(identifyParams, identifySuccess, handleQueryError));
	              } else if (gmu == "Goat GMU") {
	                  identifyParams.tolerance = 1;
	                  identifyParams.layerIds = [settings.goatUrl.slice(settings.goatUrl.lastIndexOf("/") + 1)];
	                  task = new IdentifyTask(settings.goatUrl.slice(0, settings.goatUrl.lastIndexOf("/") + 1));
	                  deferreds.push(task.execute(identifyParams, identifySuccess, handleQueryError));
	              }
	          }
	          if (deferreds && deferreds.length > 0) {
	              var dlist = new DeferredList(deferreds);
	              dlist.then(handleQueryResults);
	          } else {
	              // display empty info popup
	              numDatabaseCalls = 0;
	              processedDatabaseCalls = 0;
	              features = [];
	              // Set header
	              title = "No " + identifyGroup;
	              map.infoWindow.setTitle(title);
	              displayInfoWindow();
	          }
	      });
	  }

	  function identifySuccess(e) {}

	  function handleQueryError(e) {
	      if (e.details)
	          alert("Error in identify.js/doIdentify.  " + e.details + " " + e.message + " Check SettingsWidget.xml urls.", "Data Error");
	      else
	          alert("Error in identify.js/doIdentify.  " + e.message + " Check SettingsWidget.xml urls.", "Data Error");
	      hideLoading("");
	  }

	  function handleQueryResults(results) {
	      // results contains an array for the selected identifyGroup
	      // in which results[i][1] contains an array of objects:
	      // 	displayFieldName
	      //	feature: attributes, geometry, infoTemplate, symbol
	      //	geometryType
	      //	layerId
	      //	layerName
	      //	value

	      require(["dojo/_base/array"], function(array) {
	          try {
				function findGroupInResults(results) {
					for (i = 0; i < results.length; i++) {
						if (results[i][1] && results[i][1].length > 0) {
							for (j = 0; j < results[i][1].length; j++) {
								if (identifyLayers[identifyGroup][results[i][1][j].layerName]) {
									notfound = false;
									return;
								}
							}
						}
					}
				}
	              if (!results) {
	                  alert("Error in identify.js/handleQueryResults. IdentifyTask returned null.", "Data Error");
	                  return;
	              }
	              theResults = results; // save the results for change identify group call
	              var title, title_subject;
	              // Count database calls
	              array.forEach(results, function(result) {
	                  if (result[1] && result[1].length > 0) {
	                      array.forEach(result[1], function(r) {
	                          if (typeof identifyLayers[identifyGroup][r.layerName] != 'undefined')
	                              if (typeof identifyLayers[identifyGroup][r.layerName].database != 'undefined') numDatabaseCalls++;
	                      });
	                  }
	              });

	              // Clear old database call info
	              index = 0;
	              while (XMLHttpRequestObjects.length > 0) {
	                  XMLHttpRequestObjects.pop();
	              }

	              // Set title
	              //title = identifyGroup;
	              var notfound = true;
	              var i, j;

	              findGroupInResults(results);
	              if (notfound) title = "No " + identifyGroup;
	              else if (results[i][1][j].displayFieldName == "WATERCODE") {
	                  title = "";
	                  // Use lake name from All Lakes layer if it was included in SettingsWidget.xml
	                  for (var k = 0; k < results[i][1].length; k++) {
	                      if (results[i][1][k].layerName.toUpperCase() == "ALL LAKES") {
	                          title = results[i][1][k].value;
	                          break;
	                      }
	                  }
	                  if (title == "") title = results[i][1][j].layerName;
	              } else if (results[i][1][j].displayFieldName == "LOC_ID") title = results[i][1][j].layerName;
	              else if (results[i][1][j].displayFieldName == "GMUID") title = "GMU " + results[i][1][j].feature.attributes[results[i][1][j].displayFieldName];
	              else if (results[i][1][j].layerName.indexOf("Land Management") != -1 && results[i][1][j].feature.attributes[results[i][1][j].displayFieldName] == "")
	                  title = results[i][1][j].feature.attributes["MANAGER"];
	              else if (results[i][1][j].layerName.indexOf("Mule Deer") > -1) title = "Mule Deer Ranges";
				  else if (results[i][1][j].layerName.indexOf("Elk") > -1) title = "Elk Ranges";
	              else title = results[i][1][j].feature.attributes[results[i][1][j].displayFieldName];

	              map.infoWindow.setTitle(title);
				  lastTitle = title;

	              // Set info Content Header
	              /*var dropdown="<span id='idGroupDiv' class='showingDropDown'></span>";
	              require(["dojo/dom-construct","dojo/query"],
	              function(domConstruct,query){
	              	if (query(".esriMobileNavigationItem .center", map.infoWindow.domNode).length>0)
	              		domConstruct.place(dropdown,query(".esriMobileNavigationItem .center", map.infoWindow.domNode)[0]);
	              });*/

	              /************************************* test *********************/
	              /*var str="<span class='showingDropDown'><select data-dojo-type=\"dijit/form/Select\""+
	              	"data-dojo-props='id:\"id_group\"' style='line-height:22px;font-size:17px;border-radius:5px;' onChange='changeIdentifyGroup(this)'>";
	              for (var i=0; i<identifyGroups.length; i++) {
	              	str += "<option";
	              	if (identifyGroup == identifyGroups[i]) str += " selected";
	              	str += ">" + identifyGroups[i] + "</option>";
	              }
	              str += "</select></span>";*/



	              // Write the content for the identify 
	              var tmpStr;
	              var str = getIdentifyHeader(identifyGroup);
	              array.forEach(results, function(result) {
	                  if (result[1].length > 0) {
	                      array.forEach(result[1], function(r) {
	                          var feature = r.feature;
	                          feature.attributes.layerName = r.layerName;

	                          if (typeof identifyLayers[identifyGroup][r.layerName] != 'undefined') {
	                              // Layer with database call
	                              if (typeof identifyLayers[identifyGroup][r.layerName].database != 'undefined') {
	                                  try {
	                                      createMultiXMLhttpRequest();
	                                      var url = app + "/" + identifyLayers[identifyGroup][r.layerName].database + "?v=" + ndisVer + "&key=" + r.feature.attributes[identifyLayers[identifyGroup][r.layerName].fields[0]];
	                                      XMLHttpRequestObjects[index].open("GET", url, true); // configure object (method, url, async)
	                                      // register a function to run when the state changes, if the request
	                                      // has finished and the stats code is 200 (OK) write result
	                                      XMLHttpRequestObjects[index].onreadystatechange = function(arrIndex) {
	                                          return function() {
	                                              if (XMLHttpRequestObjects[arrIndex].readyState == 4) {
	                                                  if (XMLHttpRequestObjects[arrIndex].status == 200) {
	                                                      tmpStr = r.layerName + "</strong><div style='padding-left: 10px;'>";

	                                                      var xmlDoc = createXMLdoc(XMLHttpRequestObjects[arrIndex]);
	                                                      for (i = 0; i < identifyLayers[identifyGroup][r.layerName].displaynames.length; i++) {
	                                                          if ((i > 0 && r.feature.attributes[identifyLayers[identifyGroup][r.layerName].fields[i]] &&
	                                                                  r.feature.attributes[identifyLayers[identifyGroup][r.layerName].fields[i]] !== " " &&
	                                                                  r.feature.attributes[identifyLayers[identifyGroup][r.layerName].fields[i]] !== "Null" &&
	                                                                  r.feature.attributes[identifyLayers[identifyGroup][r.layerName].fields[i]] !== "")) {
	                                                              if (r.feature.attributes[identifyLayers[identifyGroup][r.layerName].fields[i]].substring(0, 4) == "http")
	                                                                  tmpStr += "<a href='" + r.feature.attributes[identifyLayers[identifyGroup][r.layerName].fields[i]] + "' target='_blank'>" + identifyLayers[identifyGroup][r.layerName].displaynames[i] + "</a>";
	                                                              else {
	                                                                  if ((r.feature.attributes[identifyLayers[identifyGroup][r.layerName].fields[i]].substring(0, 7) == "<a href") && (r.feature.attributes[identifyLayers[identifyGroup][r.layerName].fields[i]].indexOf("target") == -1))
	                                                                      tmpStr += identifyLayers[identifyGroup][r.layerName].displaynames[i] + ": " + r.feature.attributes[identifyLayers[identifyGroup][r.layerName].fields[i]].replace(">", " target='_blank'>");
	                                                                  else
	                                                                      tmpStr += identifyLayers[identifyGroup][r.layerName].displaynames[i] + ": " + r.feature.attributes[identifyLayers[identifyGroup][r.layerName].fields[i]];
	                                                              }
	                                                              tmpStr += "<br/>";
	                                                          }
	                                                          // add the database info at position specified
	                                                          if (identifyLayers[identifyGroup][r.layerName].position == i) {
	                                                              // one2one_display: one2one_fields values
	                                                              if (typeof identifyLayers[identifyGroup][r.layerName].one2one_fields != "undefined") {
	                                                                  for (j = 0; j < identifyLayers[identifyGroup][r.layerName].one2one_fields.length; j++) {
	                                                                      if (xmlDoc.getElementsByTagName(identifyLayers[identifyGroup][r.layerName].one2one_fields[j]).length > 0) {
	                                                                          var one2one_field = xmlDoc.getElementsByTagName(identifyLayers[identifyGroup][r.layerName].one2one_fields[j])[0];
	                                                                          if ((one2one_field.getElementsByTagName("linkname").length > 0) && (one2one_field.getElementsByTagName("linkurl").length > 0)) {
	                                                                              tmpStr += identifyLayers[identifyGroup][r.layerName].one2one_display[j] + ": ";
	                                                                              tmpStr += "<a href='" + one2one_field.getElementsByTagName("linkurl")[0].firstChild.nodeValue + "'>" + one2one_field.getElementsByTagName("linkname")[0].firstChild.nodeValue + "</a>";
	                                                                              tmpStr += "<br/>";
	                                                                          } else if (one2one_field.childNodes.length > 0) {
	                                                                              tmpStr += identifyLayers[identifyGroup][r.layerName].one2one_display[j] + ": ";
	                                                                              tmpStr += one2one_field.childNodes[0].nodeValue;
	                                                                              tmpStr += "<br/>";
	                                                                          }
	                                                                      }
	                                                                  }
	                                                              }
	                                                              // one2many bulleted list
	                                                              if (typeof identifyLayers[identifyGroup][r.layerName].one2many_fields != "undefined") {
	                                                                  for (j = 0; j < identifyLayers[identifyGroup][r.layerName].one2many_fields.length; j++) {
	                                                                      var one2many = xmlDoc.getElementsByTagName(identifyLayers[identifyGroup][r.layerName].one2many_fields[j]);
	                                                                      tmpStr += identifyLayers[identifyGroup][r.layerName].displaynames[0] + ":<ul style='margin-top: 0px; margin-bottom: 0px;'>";
	                                                                      for (var h = 0; h < one2many.length; h++) {
	                                                                          //if (typeof one2many[h].children[0] != "undefined" && one2many[h].children[0].nodeName == "linkname" && one2many[h].children[1].nodeName == "linkurl") {
	                                                                          if ((one2many[h].getElementsByTagName("linkname").length > 0) && (one2many[h].getElementsByTagName("linkurl").length > 0)) {
	                                                                              tmpStr += "<li><a href='" + one2many[h].getElementsByTagName("linkurl")[0].firstChild.nodeValue + "' target='_blank'>" + one2many[h].getElementsByTagName("linkname")[0].firstChild.nodeValue + "</a></li>";
	                                                                          }
	                                                                          // No html links, linkname and linkurl tags not used in returned XML
	                                                                          else {
	                                                                              tmpStr += "<li>" + one2many[h].childNodes[0].nodeValue + "</li>";
	                                                                          }
	                                                                      }
	                                                                      tmpStr += "</ul style='margin-bottom: 0px; margin-top: 0px;'>";
	                                                                  }
	                                                              }
	                                                          }
	                                                      }
	                                                      tmpStr += "</div><br/>";
	                                                      processedDatabaseCalls++;
	                                                      // don't add it twice, but add it to the features geometry array
	                                                      if (str.indexOf(tmpStr) == -1) {
	                                                          // highlight polygon/point on mouse over, hide highlight on mouse out
	                                                          //str += "<div onMouseOver='javascript:highlightFeature(\""+features.length+"\")' onMouseOut='javascript:removeHighlight()'><strong>"+tmpStr;
	                                                          str += "<div><strong>" + tmpStr;
	                                                          groupContent[identifyGroup] = str; // cache content
	                                                          map.infoWindow.setContent(str);
	                                                          //														showIdentify();
	                                                      }
	                                                      features.push(r.feature);
	                                                  }
	                                                  // if failed
	                                                  else {
	                                                      if (XMLHttpRequestObjects[arrIndex].status == 404) {
	                                                          alert("Identify failed. File not found: " + url, "Data Error");
	                                                          processedDatabaseCalls = numDatabaseCalls;
	                                                          displayInfoWindow();
	                                                      } else {
	                                                          alert("Identify failed for call to " + url + ". Make sure it exists and does not have errors. Must be in the same directory as index.html or a lower directory. XMLHttpRequestObjects[" + arrIndex + "].status was " + XMLHttpRequestObjects[arrIndex].status, "Data Error");
	                                                          processedDatabaseCalls = numDatabaseCalls;
	                                                          displayInfoWindow();
	                                                      }
	                                                  }
	                                                  // Check if all have finished
	                                                  var isAllComplete = true;
	                                                  for (var i = 0; i < numDatabaseCalls; i++) {
	                                                      if ((!XMLHttpRequestObjects[i]) || (XMLHttpRequestObjects[i].readyState !== 4)) {
	                                                          isAllComplete = false;
	                                                          break;
	                                                      }
	                                                  }
	                                                  if (isAllComplete) {
	                                                      displayInfoWindow();
	                                                  }
	                                              }
	                                          };
	                                      }(index);
	                                      XMLHttpRequestObjects[index].send();
	                                  } catch (error) {
	                                      alert("Identify on " + r.layerName + " failed with error: " + error.message + " in javascript/identify.js handleQueryResults().", "Data Error");
	                                      console.log(error.message);
	                                      hideLoading("");
	                                  }
	                              }
	                              // Layer without database call
	                              else {
	                                  tmpStr = r.layerName + "</strong><div style='padding-left: 10px;'>";
	                                  var first = true;
	                                  for (i = 0; i < identifyLayers[identifyGroup][r.layerName].displaynames.length; i++) {
	                                      if ((r.feature.attributes[identifyLayers[identifyGroup][r.layerName].fields[i]] &&
	                                              r.feature.attributes[identifyLayers[identifyGroup][r.layerName].fields[i]] !== " " &&
	                                              r.feature.attributes[identifyLayers[identifyGroup][r.layerName].fields[i]] !== "Null" &&
	                                              r.feature.attributes[identifyLayers[identifyGroup][r.layerName].fields[i]] !== "")) {
	                                          // the first line does not need a carriage return
	                                          if (first) first = false;
	                                          else tmpStr += "<br/>";
	                                          if (r.feature.attributes[identifyLayers[identifyGroup][r.layerName].fields[i]].substring(0, 4) == "http")
	                                              tmpStr += "<a href='" + r.feature.attributes[identifyLayers[identifyGroup][r.layerName].fields[i]] + "' target='_blank'>" + identifyLayers[identifyGroup][r.layerName].displaynames[i] + "</a>";
	                                          else
	                                              tmpStr += identifyLayers[identifyGroup][r.layerName].displaynames[i] + ": " + r.feature.attributes[identifyLayers[identifyGroup][r.layerName].fields[i]];
	                                      }
	                                  }
	                                  tmpStr += "</div></div><br/>";
	                                  // don't add it twice, but add it to the features geometry array
	                                  if (str.indexOf(tmpStr) == -1) {
	                                      // highlight polygon/point on mouse over, hide highlight on mouse out
	                                      //str += "<div onMouseOver='javascript:highlightFeature(\""+features.length+"\")' onMouseOut='javascript:removeHighlight()'><strong>"+tmpStr;
	                                      str += "<div><strong>" + tmpStr;
	                                      groupContent[identifyGroup] = str; // cache content
	                                      map.infoWindow.setContent(str);
	                                      //										showIdentify();
	                                  }
	                                  features.push(r.feature);
	                              }
	                          }
	                      });
	                  }
	              });
	              displayInfoWindow();
	          } catch (e) {
	              alert(e.message + " in javascript/identify.js handleQueryResults().", "Code Error", e);
	          }
	      });
	  }

	  function highlightFeature(id) {
	      require(["esri/graphic", "esri/layers/GraphicsLayer"],
	          function(Graphic, GraphicsLayer) {
	              var highlightSymbol;
	              if (features[id].geometry.type === "polygon") {
	                  highlightSymbol = polySymbol;
	              } else if (features[id].geometry.type === "point") {
	                  highlightSymbol = pointSymbol;
	              } else if (features[id].geometry.type === "line") {
	                  highlightSymbol = lineSymbol;
	              }
	              var identifyGraphicsLayer = newGraphicsLayer();
	              identifyGraphicsLayer.id = "identifygraphics";
	              for (var i = 0; i < features.length; i++) {
	                  if (features[i].attributes.layerName == features[id].attributes.layerName)
	                      identifyGraphicsLayer.add(new Graphic(features[id].geometry, highlightSymbol));
	              }
	              map.addLayer(identifyGraphicsLayer);
	              identifyGraphicsLayer = null;
	              highlightSymbol = null;
	          });
	  }

	  function removeHighlight() {
	      // remove old highlight
	      if (map.getLayer("identifygraphics"))
	          map.removeLayer(map.getLayer("identifygraphics"));
	  }

	  function showIdentify() {
	      map.infoWindow.show(clickPoint);
	      // remove way point highlight. It was highlighting even when you click on something else.
	      if (map.getLayer("mapDiv_graphics")) {
	          map.getLayer("mapDiv_graphics").clear();
	      }

	      // if the arrow is on the bottom, move the box up.
	      require(["dojo/query"], function(dojoquery) {
	          if (dojoquery(".top") && dojoquery(".top")[0].outerHTML.indexOf("hidden") > -1) {
	              var top = parseInt(dojoquery(".esriPopupMobile")[0].style.top) - addToTop;
	              dojoquery(".esriPopupMobile")[0].style.top = top + "px";
	          }
	      });
	  }

	  function getIdentifyHeader(name) {
	      if (identifyLayers[name].desc)
	          return "<div class='esriPopupItemTitle'>" + name + " found at map click:</div><br/><p style='font-style:italic;top:-15px;position:relative;'>" + identifyLayers[name].desc + "</p>";
	      else
	          return "<div class='esriPopupItemTitle'>" + name + " found at map click:</div>";
	  }

	  /*function getElevation() {
	  	// Show elevation data
	  	// using google.maps.ElevationService see google-developers.appspot.com/maps/documentation/javascript/examples/elevation-simple 
	  	// returns elevation in meters 
	  	require(["esri/urlUtils","esri/geometry/webMercatorUtils"], function(urlUtils,webMercatorUtils) {
	  		var geoPt = webMercatorUtils.webMercatorToGeographic(clickPoint);
	  		var location=[];
	  		location.push({
	  			"lat": parseFloat(geoPt.y),
	  			"lng":parseFloat(geoPt.x)
	  		});
	  		var pos = {
	  			"locations": location
	  		};
	  		var elev = new google.maps.ElevationService();
	  		elev.getElevationForLocations(pos, function(results, status){
	  			if (status == google.maps.ElevationStatus.OK && results[0]){
	  				require(["dojo/dom-attr","dojo/dom-construct", "dojo/query", "dojo/dom", "dojo/on", "dojo/domReady!"],
	  				  function(domAttr,domConstruct, query, dom, on){
	  					if (query(".actionList #elevation", map.infoWindow.domNode)[0]) {
	  						domConstruct.empty(query(".actionList #elevation", map.infoWindow.domNode)[0]);
	  						domConstruct.place(
	  						  domConstruct.toDom("Elevation: "+ Math.round(results[0].elevation*3.28084) + " ft, "+Math.round(results[0].elevation) + " m"),
	  						  query(".actionList #elevation", map.infoWindow.domNode)[0] );
	  					}
	  					else {
	  						domConstruct.create("span", {
	  						  "class": "action",
	  						  "id": "elevation",
	  						  "innerHTML":  "Elevation: "+ Math.round(results[0].elevation*3.28084) + " ft, "+Math.round(results[0].elevation) + " m"
	  						}, query(".actionList", map.infoWindow.domNode)[0] );
	  					}
	  				});
	  			}
	  			else {
	  				require(["dojo/dom-attr","dojo/dom-construct", "dojo/query", "dojo/dom", "dojo/on", "dojo/domReady!"],
	  				  function(domAttr,domConstruct, query, dom, on){
	  					if (query(".actionList #elevation", map.infoWindow.domNode)[0]) {
	  						domConstruct.empty(query(".actionList #elevation", map.infoWindow.domNode)[0]);
	  						domConstruct.place(
	  						  domConstruct.toDom("Elevation: data not available "+status.toLowerCase()),
	  						  query(".actionList #elevation", map.infoWindow.domNode)[0] );
	  					}
	  					else {
	  						domConstruct.create("span", {
	  						  "class": "action",
	  						  "id": "elevation",
	  						  "innerHTML":  "Elevation: data not available "+status.toLowerCase()
	  						}, query(".actionList", map.infoWindow.domNode)[0] );
	  					}
	  				});
	  				hideLoading("");
	  			}
	  		});
	  	});
	  }*/

	  function getIdentifyFooter() {
	      // Set XY click info, and elevation
	      require(["esri/geometry/webMercatorUtils", "esri/SpatialReference", "esri/tasks/ProjectParameters", "esri/tasks/GeometryService", "dojo/dom"],
	          function(webMercatorUtils, SpatialReference, ProjectParameters, GeometryService, dom) {
	              try {
	                  var geoPt;
	                  /*if (registry.byId("settings_xy_proj").value === "dd"){*/
	                  geoPt = webMercatorUtils.webMercatorToGeographic(clickPoint);
	                  dom.byId("identifyPoint").innerHTML = "Lat Long: " + geoPt.y.toFixed(5) + " N, " + geoPt.x.toFixed(5) + " W";
					 
					  /*}
	                  else if (registry.byId("settings_xy_proj").value === "dms"){
	                  	geoPt = mappoint_to_dms(clickPoint,true);
	                  	dom.byId("identifyPoint").innerHTML = "Map clicked at (X/Y): " + geoPt[0] + " N, " + geoPt[1]+" W</br>&nbsp;&nbsp;&nbsp;&nbsp;Lat/Long Degrees, Min, Sec";
	                  }
	                  else if (registry.byId("settings_xy_proj").value === "dm"){
	                  	geoPt = mappoint_to_dm(clickPoint,true);
	                  	dom.byId("identifyPoint").innerHTML = "Map clicked at (X/Y): " + geoPt[0] + " N, " + geoPt[1]+" W</br>&nbsp;&nbsp;&nbsp;&nbsp;Lat/Long Degrees, Decimal Min";
	                  }
	                  else { // utm
	                  	outSR = new SpatialReference(Number(registry.byId("settings_xy_proj").value));
	                  	// converts point to selected projection
	                  	var params = new ProjectParameters();
	                  	params.geometries = [clickPoint];
	                  	params.outSR = outSR;
	                  	geometryService.project(params, function (feature) {
	                  		var units;
	                  		if (outSR.wkid == 32612) units = "WGS84 UTM Zone 12N";
	                  		else if (outSR.wkid == 32613) units = "WGS84 UTM Zone 13N";
	                  		else if (outSR.wkid == 26912) units = "NAD83 UTM Zone 12N";
	                  		else if (outSR.wkid == 26913) units = "NAD83 UTM Zone 13N";
	                  		else if (outSR.wkid == 26712) units = "NAD27 UTM Zone 12N";
	                  		else if (outSR.wkid == 26713) units = "NAD27 UTM Zone 13N";
	                  		else units = "unknown units";
	                  		dom.byId("identifyPoint".innerHTML = "Map clicked at (X/Y): " + feature[0].x.toFixed(0) + ", " + feature[0].y.toFixed(0)+"</br>&nbsp;&nbsp;&nbsp;&nbsp;"+units;
	                  	}, function (err) {
	                  		if (err.details)
	                  			alert("Problem projecting point. "+err.message+" "+err.details[0],"Warning");
	                  		else
	                  			alert("Problem projecting point. "+err.message,"Warning");
	                  		hideLoading("");
	                  	});
	                  }*/

	                  // use our raster map service
	                  if (elevation_url) {
	                      require(["esri/request"], function(esriRequest) {
	                          var ext = '{"xmin":' + map.extent.xmin + ',"ymin":' + map.extent.ymin + ',"xmax":' + map.extent.xmax + ',"ymax":' + map.extent.ymax + ',"spatialReference":{"wkid":102100,"latestWkid":102100}}';
	                          var layersRequest = esriRequest({
	                              url: elevation_url + "/identify",
	                              content: {
	                                  f: "json",
	                                  geometry: JSON.stringify(clickPoint),
	                                  geometryType: "esriGeometryPoint",
	                                  tolerance: "5",
	                                  mapExtent: ext,
	                                  sr: "102100",
	                                  imageDisplay: map.width + "," + map.height + ",96",
	                                  returnGeometry: false
	                              },
	                              handleAs: "json",
	                              callbackParamName: "callback"
	                          });
	                          layersRequest.then(
	                              function(response) {
	                                  require(["dojo/dom-attr", "dojo/dom-construct", "dojo/query", "dojo/dom", "dojo/on", "dojo/domReady!"],
	                                      function(domAttr, domConstruct, query, dom, on) {
											// If user clicks outsite colorado there is no data. Was throwing an error. tlb 6-28-18
											if (response.results.length == 0 || isNaN(response.results[0].attributes["Pixel Value"])) {
												if (query(".actionList #elevation", map.infoWindow.domNode)[0]) {
													domConstruct.empty(query(".actionList #elevation", map.infoWindow.domNode)[0]);
													domConstruct.place(
														domConstruct.toDom("Elevation: data not available"),
														query(".actionList #elevation", map.infoWindow.domNode)[0]);
												} else {
													domConstruct.create("span", {
														"class": "action",
														"id": "elevation",
														"innerHTML": "Elevation: data not available"
													}, query(".actionList", map.infoWindow.domNode)[0]);
												}
												return;
											}  
											
											if (query(".actionList #elevation", map.infoWindow.domNode)[0]) {
												  domConstruct.empty(query(".actionList #elevation", map.infoWindow.domNode)[0]);
												  
	                                              domConstruct.place(
	                                                  // if pixel value is in meters
	                                                  //domConstruct.toDom("Elevation: "+ Math.round(response.results[0].attributes["Pixel Value"]*3.28084) + " ft "+Math.round(response.results[0].attributes["Pixel Value"]) + " m"),
	                                                  // if pixel value is in feet
	                                                  domConstruct.toDom("Elevation: " + Math.round(response.results[0].attributes["Pixel Value"]) + " ft " + Math.round(response.results[0].attributes["Pixel Value"] * 0.3048) + " m"),
	                                                  query(".actionList #elevation", map.infoWindow.domNode)[0]);
	                                          } else {
	                                              domConstruct.create("span", {
	                                                  "class": "action",
	                                                  "id": "elevation",
	                                                  // if pixel value is in meters
	                                                  //"innerHTML":  "Elevation: "+ Math.round(response.results[0].attributes["Pixel Value"]*3.28084) + " ft "+Math.round(response.results[0].attributes["Pixel Value"]) + " m"
	                                                  // if pixel value is in feet
	                                                  "innerHTML": "Elevation: " + Math.round(response.results[0].attributes["Pixel Value"]) + " ft " + Math.round(response.results[0].attributes["Pixel Value"] * 0.3048) + " m"
	                                              }, query(".actionList", map.infoWindow.domNode)[0]);
	                                          }
	                                      });
	                              },
	                              function(error) {
	                                  require(["dojo/dom-attr", "dojo/dom-construct", "dojo/query", "dojo/dom", "dojo/on", "dojo/domReady!"],
	                                      function(domAttr, domConstruct, query, dom, on) {
	                                          if (query(".actionList #elevation", map.infoWindow.domNode)[0]) {
	                                              domConstruct.empty(query(".actionList #elevation", map.infoWindow.domNode)[0]);
	                                              domConstruct.place(
	                                                  domConstruct.toDom("Elevation: data not available"),
	                                                  query(".actionList #elevation", map.infoWindow.domNode)[0]);
	                                          } else {
	                                              domConstruct.create("span", {
	                                                  "class": "action",
	                                                  "id": "elevation",
	                                                  "innerHTML": "Elevation: data not available"
	                                              }, query(".actionList", map.infoWindow.domNode)[0]);
	                                          }
	                                      });
	                                  hideLoading("");
	                              }

	                          );
	                      });
	                  }
	                  // Esri's elevation data, requires a password and fee
	                  /*
	                  if (elevation_url) {
	                  	require(["esri/request","esri/urlUtils"], function(esriRequest,urlUtils) { 
	                  		//since imagery service identify has unique parameters, we use esriRequest instead of an IdentifyTask
	                  		urlUtils.addProxyRule({
	                  			urlPrefix: "elevation.arcgis.com",  
	                  			proxyUrl: "/proxy/DotNet/proxy.ashx"
	                  		});					
	                  		var layersRequest = esriRequest({
	                  			url : elevation_url,
	                  			content : {
	                  				f : "json",
	                  				geometry : JSON.stringify(clickPoint),
	                  				geometryType: "esriGeometryPoint",
	                  				sr: "3857",
	                  				returnGeometry: false
	                  			},
	                  			handleAs : "json",
	                  			callbackParamName : "callback"
	                  		});
	                  		layersRequest.then(
	                  			 function (response) {
	                  			  require(["dojo/dom-attr","dojo/dom-construct", "dojo/query", "dojo/dom", "dojo/on", "dojo/domReady!"],
	                  			  function(domAttr,domConstruct, query, dom, on){
	                  				if (query(".actionList #elevation", map.infoWindow.domNode)[0]) {
	                  					domConstruct.empty(query(".actionList #elevation", map.infoWindow.domNode)[0]);
	                  					domConstruct.place(
	                  					  domConstruct.toDom("Elevation: "+ Math.round(response.value*3.28084) + " ft "+Math.round(response.value) + " m"),
	                  					  query(".actionList #elevation", map.infoWindow.domNode)[0] );
	                  				}
	                  				else {
	                  					domConstruct.create("span", {
	                  					  "class": "action",
	                  					  "id": "elevation",
	                  					  "innerHTML":  "Elevation: "+ Math.round(response.value*3.28084) + " ft "+Math.round(response.value) + " m"
	                  					}, query(".actionList", map.infoWindow.domNode)[0] );
	                  				}
	                  			  });
	                  			}, function (error) {
	                  				require(["dojo/dom-attr","dojo/dom-construct", "dojo/query", "dojo/dom", "dojo/on", "dojo/domReady!"],
	                  				  function(domAttr,domConstruct, query, dom, on){
	                  					if (query(".actionList #elevation", map.infoWindow.domNode)[0]) {
	                  						domConstruct.empty(query(".actionList #elevation", map.infoWindow.domNode)[0]);
	                  						domConstruct.place(
	                  						  domConstruct.toDom("Elevation: data not available"),
	                  						  query(".actionList #elevation", map.infoWindow.domNode)[0] );
	                  					}
	                  					else {
	                  						domConstruct.create("span", {
	                  						  "class": "action",
	                  						  "id": "elevation",
	                  						  "innerHTML":  "Elevation: data not available"
	                  						}, query(".actionList", map.infoWindow.domNode)[0] );
	                  					}
	                  				});
	                  				hideLoading("");
	                  			}
	                  			
	                  		);
	                  	});
	                  }*/
	              } catch (e) {
	                  alert(e.message + " in javascript/identify.js getIdentifyFooter().", "Code Error", e);
	              }
	          });
	  }

	  function changeIdentifyGroup(sel) {
	      identifyGroup = sel.get("displayedValue"); //sel.options[sel.selectedIndex].value;
	      map.infoWindow.setContent("<p align='center'>Loading...</p>");
	      //showLoading();
	      //showIdentify(); // remove because called in handleQueryResults
	      features = [];
	      numDatabaseCalls = 0;
	      processedDatabaseCalls = 0;
	      displayContent();
	      //handleQueryResults(theResults)
	  }

	  var idGroupCombo;

	  function setIdGroupCombo() {
	      // create dojo drop down list of identify groups, and attach it to the info header for details
	      require(["dojo/store/Memory", "dijit/form/Select"], function(Memory, Select) {
	          var idGroupStore = [];
	          //var idGroupStore = new Memory({
	          //	data: [],
	          //	idProperty: "name"
	          //});
	          for (var i = 0; i < identifyGroups.length; i++) {
	              idGroupStore.push({ value: identifyGroups[i], label: identifyGroups[i] });
	              //idGroupStore.add({name:identifyGroups[i]});
	          }
	          idGroupCombo = new Select({
	              id: "idGroup",
	              name: "feature",
	              //store: idGroupStore,
	              value: identifyGroup,
	              sortByLabel: false,
	              labelAttr: "name",
	              maxHeight: -1, // prevent drop-down from causing entire page to grow in size
	              style: {
	                  height: "36px!important",
	                  lineHeight: "22px",
	                  fontSize: "17px",
	                  color: "black",
	                  position: "absolute",
	                  top: "0px",
	                  left: "40px",
	                  display: "block"
	              },
	              onChange: function() {
	                  changeIdentifyGroup(this);
	              }
	          }, "idGroup");
	          idGroupCombo.set("options", idGroupStore);
	          idGroupCombo.startup();
	      });
	  }

	  function placeIdGroupCombo() {
	      // The drop down list of Identify Groups has already been created, just assign the widget to the input tag again since it is now empty.
	      require(["dojo/dom-construct", "dojo/query", "dojo/dom-class", "dijit/registry"],
	          function(domConstruct, query, domClass, registry) {
	              map.infoWindow.setContent(groupContent[identifyGroup]);
	              // Display Way Point, drop down with way point, display arrows if more than one way point at this location can scroll throught using buttons: < >
	              if (identifyGroup == "Way Point" && document.getElementById("wayPtDesc")) {
	                  // Adjust the height of the Way Point description text box to fit the text.
	                  resizeTextBox(document.getElementById('wayPtDesc'));
	                  //query("div.esriMobileNavigationItem.center", map.domNode)[0].style.display="none";
	                  query("div.esriMobileNavigationBar", map.domNode)[0].style.overflow = "visible"; // let the 1 of 3 <> overflow to next line.
	                  query("div.esriMobileNavigationItem.center", map.domNode)[0].style.display = "none"; // display "1 of 3"
	                  domConstruct.place(idGroupCombo.domNode, query("div.esriMobileNavigationItem.center", map.domNode)[0], "before");
	                  registry.byId("idGroup").attr("displayedValue", "Way Point");

	                  // InfoTemplate did not recognize a click on Android very consistently!!!
	                  query("div.esriMobileNavigationItem.right1", map.domNode)[0].className = "esriMobileNavigationItem right1 hidden";
	                  query("div.esriMobileNavigationItem.right2", map.domNode)[0].className = "esriMobileNavigationItem right2 hidden";
	                  //query("div.esriMobileNavigationItem.right1", map.domNode)[0].style.display="block"; // display ">"
	                  //query("div.esriMobileNavigationItem.right2", map.domNode)[0].style.display="block"; // display "<"
	                  // resize description text box if this is a way point and not a point from a kml file
	                  if (document.getElementById("wayPtDesc")) {
	                      document.getElementById("wayPtDesc").style.height = 'auto';
	                      document.getElementById("wayPtDesc").style.height = document.getElementById("wayPtDesc").scrollHeight + 'px';
	                  }
	              } else if (query("div.esriMobileNavigationItem.center", map.domNode).length > 0) {
	                  // display drop down, hide "1 of 1 < >" buttons
	                  query("div.esriMobileNavigationItem.center", map.domNode)[0].style.display = "none";
	                  query("div.esriMobileNavigationItem.right1", map.domNode)[0].className = "esriMobileNavigationItem right1 hidden";
	                  query("div.esriMobileNavigationItem.right2", map.domNode)[0].className = "esriMobileNavigationItem right2 hidden";
	                  domConstruct.place(idGroupCombo.domNode, query("div.esriMobileNavigationItem.center", map.domNode)[0], "before");
	                  registry.byId("idGroup").attr("displayedValue", identifyGroup);
	              }
	          });
	  }

	  function displayInfoWindow() {
	      if (numDatabaseCalls == processedDatabaseCalls) {
	          numDatabaseCalls = 0;
	          processedDatabaseCalls = 0;
	          getIdentifyFooter(); // Add Map Clicked at (X/Y) to footer

	          // No info found, just display XY coordinates
	          if (features.length == 0) {
	              var visible = "";
	              if (identifyLayerIds[identifyGroup][0].id_vis_only) visible = "visible "; // 1-10-18 add word visible if identifying visible only
	              //var str="<span id='idGroupDiv' class='showingDropDown'></span><br/>";
	              /*var str="<span class='showingDropDown'><select data-dojo-type=\"dijit/form/Select\""+
	              "data-dojo-props='id:\"id_group\"' style='line-height:22px;font-size:17px;border-radius:5px;' onChange='changeIdentifyGroup(this)'>";
	              for (var i=0; i<identifyGroups.length; i++) {
	              	str += "<option";
	              	if (identifyGroup == identifyGroups[i]) str += " selected";
	              	str += ">" + identifyGroups[i] + "</option>";
	              }
	              str += "</select></span><br/>";*/
	              var str;
	              if (identifyLayers[identifyGroup].desc) {
	                  str = "<div><p style='font-style:italic;top:-15px;position:relative;'>" + identifyLayers[identifyGroup].desc + "</p>No " + visible + identifyGroup + " at this point.<br/><br/></div>";
	                  groupContent[identifyGroup] = str; // cache content
	              } else {
	                  str = "<br/><div>No " + visible + identifyGroup + " at this point.<br/><br/></div>";
	                  groupContent[identifyGroup] = str; // cache content
	              }
	              map.infoWindow.setContent(str);
	          }

	          showIdentify();
	          hideLoading("");
	      }
	  }

	  function getDirections(evt) {
	      // Example of changeing link text			dom.byId("dirLink").innerHTML =  "Calculating...";
	      require(["esri/geometry/webMercatorUtils"], function(webMercatorUtils) {
	          var geoPt = webMercatorUtils.webMercatorToGeographic(clickPoint);
	          var url = "http://google.com/maps?output=classic&q=" + geoPt.y + "," + geoPt.x;
	          window.open(url, "_blank");
	      });
	  }

	  function zoomToPt() {
	      var level = 5; // 4-19-17 Updated lod levels. Chaged this line and the next from 11 to 5.
	      if (map.getLevel() > 5) level = map.getLevel();
	      map.centerAndZoom(clickPoint, level);
	  }
	  //// End Identify Widget ////