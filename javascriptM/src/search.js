//var searchtoolbar;
var searchHelp=null;
function searchInit() {
  try {
	var usingCounty;
	var fishSpeciesGraphicalName = "Fish species in known fishing spots";
	document.getElementById("searchLoadingImg").style.display="block";
	// Feature Search Help Window
	require(["dojo/_base/window","javascript/HelpWin"],function(win,HelpWin){
		searchHelp = new HelpWin({
			label: "Feature Search Help",
			content: 'Search for a named location by feature type. Allows searching for <b>township, range, and section</b>. The Fishing Atlas '+
				'will highlight water bodies where certain <b>fish species</b> can be found. Select feature type and enter search text.  As you '+
				'type, matches will be suggested. To remove the highlighted features from the map, press the Clear button on the main menu. '+
				'<br/><br/>'
		});
		win.body().appendChild(searchHelp.domNode);
		searchHelp.startup();
	});
	// lookup feature types available and fill drop down list.
	var configFile = app + "/SearchWidget.xml?v="+ndisVer;
	var xmlhttp = createXMLhttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4 && xmlhttp.status === 200) {
			var xmlDoc=createXMLdoc(xmlhttp);
			try {
				// Populate the Feature Type drop down list with the layer names from SearchWidget.xml
				require(["dojo/dom","dijit/registry","dojo/_base/lang","dojo/mouse","dojo/_base/Color","dojo/store/Memory","dijit/form/ComboBox", "dijit/form/Select", "esri/toolbars/draw",
					"esri/request", "esri/tasks/query", "esri/tasks/QueryTask", "esri/graphic", "esri/layers/GraphicsLayer",
					"esri/urlUtils","esri/geometry/Point","esri/symbols/PictureMarkerSymbol","esri/symbols/SimpleLineSymbol",
					"esri/symbols/SimpleFillSymbol","dojo/_base/declare","dgrid/OnDemandGrid","dgrid/extensions/DijitRegistry","dojo/domReady!"
					], function(dom,registry,lang,mouse,Color,Memory, ComboBox, Select, Draw, esriRequest, Query, QueryTask, Graphic, GraphicsLayer,
					urlUtils, Point, PictureMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, declare, OnDemandGrid,DijitRegistry){
				  try {
					/*for graphical search
					function searchDrawEnd(event){
						// Called when user click/drags on the map to select features
						document.getElementById("searchMsg").innerHTML="Loading...";
						//document.getElementById("searchMsg").style.display="block";
						//document.getElementById("searchLoadingImg").style.display="block";
						drawing=false;
						searchtoolbar.deactivate();
						// deselect all buttons
						document.getElementById("searchpoint").className = "graphBtn";
						document.getElementById("searchpolyline").className = "graphBtn";
						document.getElementById("searchrectangle").className = "graphBtn";
						document.getElementById("searchpolygon").className = "graphBtn";
						var geom = event.geometry;
						queryFeaturesGraphical(geom);
					}
					searchtoolbar = new Draw(map, {showTooltips:true});
					searchtoolbar.on("draw-end", searchDrawEnd);//lang.hitch(map, searchDrawEnd));
					*/
					var graphicAC; // hold the points and extents that match search
					var tabHeight = "300px";
					var tabWithGridHeight = "510px";
					var displayNames;
					var queryLayer;
					var queryFields;
					var queryTitleField;
					var queryLinkField;
					var queryLinkText;
					var widgetIcon = "assets/images/i_pin.png";
					var graphicsLayer=new GraphicsLayer();
					var graphicsHLLayer=new GraphicsLayer();
					var graphicPointSym = new PictureMarkerSymbol(widgetIcon, 40, 40);	
					graphicPointSym.setOffset(15,17); // move icon up
					graphicsLayer.symbol = graphicPointSym;
					map.addLayer(graphicsLayer);
					var graphicPointHLSym = new PictureMarkerSymbol(widgetIcon, 50, 50);
					graphicsHLLayer.symbol = graphicPointHLSym;
					var graphicLineSym = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0,0.8]), 2);
					var graphicPolySym = new SimpleFillSymbol(SimpleLineSymbol.STYLE_SOLID, graphicLineSym, new Color([255,0,0,0.1]));
					var graphicLineHLSym = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,255,0,0.8]), 2);
					var graphicPolyHLSym = new SimpleFillSymbol(SimpleLineSymbol.STYLE_SOLID, graphicLineSym, new Color([255,255,0,0.5]));
					map.addLayer(graphicsHLLayer);
					var recAC;
					var layers = xmlDoc.getElementsByTagName("layer");
					var searchObj = [];
					var data = [];
					var fsGrid;
					var featureStore = new Memory({
						data: []
					});
					var graphicFeatureStore = new Memory({
						data: []
					});
					
					// Read selected tab on startup
					/*var tabToSelect;
					if (xmlDoc.getElementsByTagName("selectedtab")[0].childNodes[0].nodeValue == "0") tabToSelect = "text_Pane";
					else tabToSelect = "graphic_Pane";*/
					// Read zoom scale for points
					var zoomScale = 72224;
					if (xmlDoc.getElementsByTagName("zoomscale")[0] && xmlDoc.getElementsByTagName("zoomscale")[0].childNodes[0].nodeValue)
						zoomScale = xmlDoc.getElementsByTagName("zoomscale")[0].childNodes[0].nodeValue;
					// Read SearchWidget.xml file into searchObj
					for(var i=0; i<layers.length; i++){
						var n = "unknown";
						if (layers[i].getElementsByTagName("name")[0] && layers[i].getElementsByTagName("name")[0].childNodes[0].nodeValue)
							n = layers[i].getElementsByTagName("name")[0].childNodes[0].nodeValue;
						else {
							showWarning("name");
						}
						searchObj[n] = {
							name: n,
							url: layers[i].getElementsByTagName("url")[0].childNodes[0] ?
								layers[i].getElementsByTagName("url")[0].childNodes[0].nodeValue : showWarning("url"),
							expression: layers[i].getElementsByTagName("expression")[0].childNodes[0] ?
								layers[i].getElementsByTagName("expression")[0].childNodes[0].nodeValue : showWarning("expression"),
							//graphicalexpression: layers[i].getElementsByTagName("graphicalexpression")[0].childNodes[0] ?
							//	layers[i].getElementsByTagName("graphicalexpression")[0].childNodes[0].nodeValue : null,
							// for autocomplete
							searchfield: layers[i].getElementsByTagName("searchfield")[0].childNodes[0] ?
								layers[i].getElementsByTagName("searchfield")[0].childNodes[0].nodeValue : showWarning("searchfield"),
							textsearchlabel: layers[i].getElementsByTagName("textsearchlabel")[0].childNodes[0] ?
								layers[i].getElementsByTagName("textsearchlabel")[0].childNodes[0].nodeValue: showWarning("textsearchlabel"),
							//graphicalsearchlabel: layers[i].getElementsByTagName("graphicalsearchlabel")[0].childNodes[0] ?
							//	layers[i].getElementsByTagName("graphicalsearchlabel")[0].childNodes[0].nodeValue : showWarning("graphicalsearchlabel"),
							fields: layers[i].getElementsByTagName("fields")[0].childNodes[0] ?
								layers[i].getElementsByTagName("fields")[0].childNodes[0].nodeValue : showWarning("fields"),
							displayfields: layers[i].getElementsByTagName("displayfields")[0].childNodes[0] ?
								layers[i].getElementsByTagName("displayfields")[0].childNodes[0].nodeValue : showWarning("displayfields"),
							sortfield: layers[i].getElementsByTagName("sortfield")[0] && layers[i].getElementsByTagName("sortfield")[0].childNodes[0] ?
								layers[i].getElementsByTagName("sortfield")[0].childNodes[0].nodeValue : "none",
							numericsort: layers[i].getElementsByTagName("numericsort")[0] && layers[i].getElementsByTagName("numericsort")[0].childNodes[0] ?
								layers[i].getElementsByTagName("numericsort")[0].childNodes[0].nodeValue : "false",
							titlefield: layers[i].getElementsByTagName("titlefield")[0] && layers[i].getElementsByTagName("titlefield")[0].childNodes[0] ?
								layers[i].getElementsByTagName("titlefield")[0].childNodes[0].nodeValue : showWarning("titlefield"),
							linkfield: layers[i].getElementsByTagName("linkfield")[0] && layers[i].getElementsByTagName("linkfield")[0].childNodes[0] ? 
								layers[i].getElementsByTagName("linkfield")[0].childNodes[0].nodeValue : "",
							linktext: layers[i].getElementsByTagName("linktext")[0] && layers[i].getElementsByTagName("linktext")[0].childNodes[0] ? 
								layers[i].getElementsByTagName("linktext")[0].childNodes[0].nodeValue : "unknown link",
							 // Populate Search For: values from a comma delimited string
							searchvalues: layers[i].getElementsByTagName("searchvalues")[0] && layers[i].getElementsByTagName("searchvalues")[0].childNodes[0] ? 
								layers[i].getElementsByTagName("searchvalues")[0].childNodes[0].nodeValue : "",
							// Popuplate Search For: values by looking it up in a database
							lookupsearchvalues: layers[i].getElementsByTagName("lookupsearchvalues")[0] && layers[i].getElementsByTagName("lookupsearchvalues")[0].childNodes[0] ? 
								layers[i].getElementsByTagName("lookupsearchvalues")[0].childNodes[0].nodeValue : "",
							// the database table to lookup valuse for drop down list
							lookupfilename: layers[i].getElementsByTagName("lookupsearchvalues")[0] && layers[i].getElementsByTagName("lookupsearchvalues")[0].childNodes[0] ?
								layers[i].getElementsByTagName("lookupfilename")[0].childNodes[0] ? 
								layers[i].getElementsByTagName("lookupfilename")[0].childNodes[0].nodeValue : showWarning("lookupfilename") : null,
							// the field in the above database table to use
							lookupfield: layers[i].getElementsByTagName("lookupsearchvalues")[0] && layers[i].getElementsByTagName("lookupsearchvalues")[0].childNodes[0] ?
								layers[i].getElementsByTagName("lookupfield")[0].childNodes[0] ? 
								layers[i].getElementsByTagName("lookupfield")[0].childNodes[0].nodeValue : showWarning("lookupfield") : null,
							// add optional database parameters
							// take user selected Search For value and call this aspx file to lookup in a database
							database: layers[i].getElementsByTagName("database")[0] && layers[i].getElementsByTagName("database")[0].childNodes[0] ?
								layers[i].getElementsByTagName("database")[0].childNodes[0].nodeValue : null,
							// the name of the table in the database
							filename: layers[i].getElementsByTagName("database")[0] && layers[i].getElementsByTagName("database")[0].childNodes[0] ?
								layers[i].getElementsByTagName("filename")[0].childNodes[0] ? 
								layers[i].getElementsByTagName("filename")[0].childNodes[0].nodeValue : showWarning("filename") : null,
							// the field that links the database to the mapservice
							database_field: layers[i].getElementsByTagName("database")[0] && layers[i].getElementsByTagName("database")[0].childNodes[0] ?
								layers[i].getElementsByTagName("database_field")[0].childNodes[0] ? 
								layers[i].getElementsByTagName("database_field")[0].childNodes[0].nodeValue : showWarning("database_field") : null,
							// string or number for above field
							database_field_type: layers[i].getElementsByTagName("database")[0] && layers[i].getElementsByTagName("database")[0].childNodes[0] ?
								layers[i].getElementsByTagName("database_field_type")[0].childNodes[0] ? 
								layers[i].getElementsByTagName("database_field_type")[0].childNodes[0].nodeValue : showWarning("database_field_type") : null,
							// url to .net file (aspx) to lookup in a database
							graphical_database: layers[i].getElementsByTagName("database")[0] && layers[i].getElementsByTagName("database")[0].childNodes[0] ?
								layers[i].getElementsByTagName("graphical_database")[0].childNodes[0] ? 
								layers[i].getElementsByTagName("graphical_database")[0].childNodes[0].nodeValue : null : null,
							// name of the table in the graphical database file
							graphical_filename: layers[i].getElementsByTagName("graphical_database")[0] && layers[i].getElementsByTagName("graphical_database")[0].childNodes[0] ?
								layers[i].getElementsByTagName("graphical_filename")[0].childNodes[0] ? 
								layers[i].getElementsByTagName("graphical_filename")[0].childNodes[0].nodeValue : showWarning("graphical_filename") : null,
							// field to display from the database on graphical search
							graphical_db_fields: layers[i].getElementsByTagName("graphical_database")[0] && layers[i].getElementsByTagName("graphical_database")[0].childNodes[0] ?
								layers[i].getElementsByTagName("graphical_db_fields")[0].childNodes[0] ? 
								layers[i].getElementsByTagName("graphical_db_fields")[0].childNodes[0].nodeValue : showWarning("graphical_db_fields") : null,
							// the header for the above field in the table
							graphical_db_displayfields: layers[i].getElementsByTagName("graphical_database")[0] && layers[i].getElementsByTagName("graphical_database")[0].childNodes[0] ?
								layers[i].getElementsByTagName("graphical_db_displayfields")[0].childNodes[0] ? 
								layers[i].getElementsByTagName("graphical_db_displayfields")[0].childNodes[0].nodeValue : showWarning("graphical_db_displayfields") : null,
							// comma delimited yes or no for it the graphical field should be sorted in alphabetical order
							graphical_db_sort: layers[i].getElementsByTagName("graphical_database")[0] && layers[i].getElementsByTagName("graphical_database")[0].childNodes[0] ?
								layers[i].getElementsByTagName("graphical_db_sort")[0].childNodes[0] ? 
								layers[i].getElementsByTagName("graphical_db_sort")[0].childNodes[0].nodeValue : showWarning("graphical_db_sort") : null
						};
						function showWarning(tag) {
						// Show warning for required fields.
							var layerName = layers[i].getElementsByTagName("name")[0] && layers[i].getElementsByTagName("name")[0].childNodes[0] ?
								layers[i].getElementsByTagName("name")[0].childNodes[0].nodeValue : "undefined";
							alert("WARNING: In SearchWidget.xml file required value missing for tag: "+tag+", in layer: "+layerName+".","Data Error");
						}

						// add options to select element
						featureStore.data.push({name:searchObj[n].name, id:i});
						/*if (searchObj[n].name.toLowerCase() == "fish species")
							graphicFeatureStore.data.push({name:fishSpeciesGraphicalName, id:i});
						else
							graphicFeatureStore.data.push({name:searchObj[n].name, id:i});*/
					}
					
					// Create the html code
					var searchTextStore = new Memory({
						data: [{name:"Loading..."}]
						});
					var featureTypeCombo = new Select({
						id: "featureType",
						name: "feature",
						store: featureStore,
						value: featureStore.data[0].name,
						sortByLabel: false,
						labelAttr: "name",
						maxHeight: -1, // prevent drop-down from causing entire page to grow in size
						style: {width: "250px"},
						onChange: function(){
							updateSearchTextStore(this.attr("displayedValue"));
							registry.byId("searchText").reset();
						}
					}, "featureType");
					featureTypeCombo.startup();
					
					/*var featureTypeGraphicCombo = new Select({
						id: "featureTypeGraphic",
						name: "feature",
						store: graphicFeatureStore,
						value: graphicFeatureStore.data[0].name,
						sortByLabel: false,
						labelAttr: "name",
						maxHeight: -1, // prevent drop-down from causing entire page to grow in size
						style: {width: "250px"},
						onChange: function(){
							updateSearchGraphicStore(this.attr("displayedValue"));
						}
					}, "featureTypeGraphic");
					featureTypeGraphicCombo.startup();
					document.getElementById("graphicfeatures").innerHTML = graphicFeatureStore.data[0].name;*/
					
					var searchTextCombo = new ComboBox({
						id: "searchText",
						store: searchTextStore,
						autoComplete: false, // do not select the first matching item from the drop down. Let user do it.
						searchAttr: searchObj[featureStore.data[0].name].searchfield, // Name of the attribute to match text field input against when filtering the list; defaults to "name".
						style: {width: "250px"},
						hasDownArrow: true,
						maxHeight:195,
						onClick: function() {
							// Check if need to update gmu list. If changed from elk, bighorn sheep, or mountain goat.
							if (featureTypeCombo.attr("displayedValue") == "GMUs" && settings.useGMUs) {
								if ((gmu=="Big Game GMU" && searchObj.GMUs.titlefield != settings.elkField) ||
									(gmu=="Bighorn GMU" && searchObj.GMUs.titlefield != settings.sheepField) ||
									(gmu=="Goat GMU" && searchObj.GMUs.titlefield != settings.goatField)) {
									this.loadAndOpenDropDown();
									updateSearchTextStore("GMUs");
								}
							}
						},
						//onChange: function(){setSelection()},
						onKeyUp: function(value){
							// user pressed ESC, pgup, pgdn, or arrow keys
							if ([27,33,34,37,38,39,40].indexOf(value.keyCode) > -1) return;
							// user pressed enter key
	//						else if ([13].indexOf(value.keyCode) > -1) {setSelection(this.attr('displayedValue')); return;}
							updateSearchTextStore(registry.byId("featureType").attr("displayedValue"));
						}
					},"searchText").startup();
					
					// Fill Section drop down in Township Range
					var sectionStore = new Memory({
						idProperty: "id",
						data: []
					});
					for(i=0; i<37;i++){
						if (i==0)sectionStore.data.push({id:"",name:""});
						else if (i<10)sectionStore.data.push({id: "00"+i,name: "00"+i});
						else sectionStore.data.push({id: "0"+i,name: "0"+i});
					}
					var sectionCombo = new Select({
						id: "searchSec",
						labelAttr: "name",
						style: {width:"50px", position:"absolute", left:"77px"},
						maxHeight: 158,
						store: sectionStore
					}, "searchSec");
					sectionCombo.startup();

					function updateSearchTextStore(id){
						// Fill in the Search For input with all possible suggestions in drop down list.
						// If value is a string search for like '%'. 
						// If number search for <> -1 (all values).
						// id = the selected value of Feature Type drop down list.
						try {
							//clearSelection();
							// clear place holder text, set by fillSearchValues and fillLookupSearchValues, where they should not type info combo box
							registry.byId("searchText").set("placeHolder","");
							if (id === "Township Range") {
								// Show Township Range input boxes
								document.getElementById("searchInput1").style.display = "none";
								document.getElementById("searchInput2").style.display = "block";
								document.getElementById("searchTwn").value = "";
								document.getElementById("searchRng").value = "";
								registry.byId("searchSec").attr("value","");
								// enable Search button
								//registry.byId("searchBtn").set("disabled", false);
								return;
							}
							
							if (id == "GMUs" && settings.useGMUs) {
								if (gmu == "Big Game GMU") {
									searchObj[id].fields = settings.elkField + ",COUNTY";
									searchObj[id].displayfields = "GMU,County";
									searchObj[id].titlefield = settings.elkField;
									searchObj[id].searchfield = settings.elkField;
									searchObj[id].expression = settings.elkField + " = [value]";
									searchObj[id].url = settings.elkUrl;
								}
								else if (gmu=="Bighorn GMU"){
									searchObj[id].fields = settings.sheepField;
									searchObj[id].displayfields = "Bighorn Sheep GMU";
									searchObj[id].titlefield = settings.sheepField;
									searchObj[id].searchfield = settings.sheepField;
									searchObj[id].expression = settings.sheepField + " = UPPER('[value]')";
									searchObj[id].url = settings.sheepUrl;
								}
								else {
									searchObj[id].fields = settings.goatField;
									searchObj[id].displayfields = "Mountain Goat GMU";
									searchObj[id].titlefield = settings.goatField;
									searchObj[id].searchfield = settings.goatField;
									searchObj[id].expression = settings.goatField + " = UPPER('[value]')";
									searchObj[id].url = settings.goatUrl;
								}
							}
							// hide Township Range
							document.getElementById("searchInput1").style.display = "block";
							document.getElementById("searchInput2").style.display = "none";
							// Set the title for 2nd drop down
							document.getElementById("searchLabel").innerHTML = searchObj[id].textsearchlabel+" ";
							// If suggestion list was provided in SearchWidget.xml searchvalues tag use it.
							if (searchObj[id].searchvalues != "") {
								// disable Search button if has a database lookup for search for drop down
								//registry.byId("searchBtn").set("disabled", true);
								fillSearchValues(id);
								return;
							}
							else if (searchObj[id].lookupsearchvalues != "") {
								// disable Search button if has a database lookup for search for drop down
								//registry.byId("searchBtn").set("disabled", true);
								fillLookupSearchValues(id);
								return;
							}
							
							// Look up values
							var attr = id; // Does not pass id to function so make a local variable. Used to get searchObj[attr].searchAttr 
							document.getElementById("searchLoadingImg").style.display="block";
							// enable Search button
							//registry.byId("searchBtn").set("disabled", false);
							esri.config.defaults.io.proxyUrl = "/proxy/DotNet/proxy.ashx";
							var expr;
							// esriRequest only returns up to 1000 records. So update the store as the user types.
							var userText = registry.byId("searchText").attr("displayedValue");
							if (searchObj[id].expression.indexOf("= UPPER('[value]')",0) > 0)
							{
								expr = searchObj[id].expression.replace("= UPPER('[value]')", "LIKE UPPER('"+userText+"%')");
							}
							else if (searchObj[id].expression.indexOf("LIKE UPPER('%[value]%')",0) > 0)
							{
								expr = searchObj[id].expression.replace("LIKE UPPER('%[value]%')", "LIKE UPPER('"+userText+"%')");
							}
							// number
							else
							{
								expr = searchObj[id].expression.replace("= [value]", "<> -1");
							}
							
							// for mobile: add county name to drop down if available
							var outfield = searchObj[id].searchfield;
							usingCounty=false;
							if (searchObj[id].fields.indexOf("COUNTYNAME")>-1) {
								outfield = searchObj[id].searchfield+",COUNTYNAME";
								usingCounty=true;
							}
							if (attr=="GMUs" && (searchObj[attr].displayfields == "Mountain Goat GMU" || searchObj[attr].displayfields == "Bighorn Sheep GMU")){
									outfield += ",HUNTING";
							}
							esriRequest({
								url : searchObj[id].url+"/query",
								content : {
									where: expr,
									returnGeometry: false,
									outFields: outfield,
									f:"json",
									returnDistinctValues: true,
									orderByFields: searchObj[id].searchfield
								},
								handleAs: 'json'
							}).then(function(response) {
								try {
									var dataArr = [];
									var obj;
									//var valueArr = []; // for mobile
									for (var i=0; i<response.features.length; i++) {
										// Bighorn Sheep or Mount Goat GMU
										if (attr=="GMUs" && (searchObj[attr].displayfields == "Mountain Goat GMU" || searchObj[attr].displayfields == "Bighorn Sheep GMU")){
											if (response.features[i].attributes.HUNTING != "YES") continue;
										}
										obj = {};
										// For mobile add the county name
										if (response.features[i].attributes.COUNTYNAME) obj[searchObj[attr].searchfield] = response.features[i].attributes[searchObj[attr].searchfield]+" ("+
											response.features[i].attributes.COUNTYNAME+")";
										else
											obj[searchObj[attr].searchfield] = response.features[i].attributes[searchObj[attr].searchfield]; // load object key as variable
										obj.value=response.features[i].attributes[searchObj[attr].searchfield];
										dataArr.push(obj);
									}
									// Sort Mt Goat and Bighorn Sheep GMUs
									if (attr == "GMUs" && (searchObj[attr].displayfields == "Mountain Goat GMU" || searchObj[attr].displayfields == "Bighorn Sheep GMU")){
										var result = [];
										var letter = "S";
										if (searchObj[attr].displayfields == "Mountain Goat GMU") letter = "G";
										dataArr.forEach(function(item) {
											if (item[searchObj[attr].searchfield] != "OUT")
												result.push(item[searchObj[attr].searchfield].substring(1));
										});
										result.sort(function(a,b){return a-b;}); // Numeric Sort
										var gmuArr = [];
										dataArr=null;
										dataArr=[];
										result.forEach(function(item) {
											obj = {};
											obj[searchObj[attr].searchfield] = letter + item;
											dataArr.push(obj);
											obj=null;
										});
										result=null;
										gmuArr=null;
										obj=null;
									}
									else
										dataArr.sort(sortArrayOfObj(searchObj[attr].searchfield)); // sort with county names
									// update Search For suggestion list
									var searchTextStore= new Memory({data:dataArr});
									var searchTextCombo = registry.byId("searchText");
									searchTextCombo.set("store", searchTextStore);
									searchTextCombo.set("searchAttr", searchObj[attr].searchfield);
									dataArr = null;
									document.getElementById("searchLoadingImg").style.display="none";
								}
								catch(e){
									alert("Feature Search query error: "+e.message+" in search.js/updateSearchTextStore query response. field="+searchObj[attr].searchfield,"Code Error",e);
									document.getElementById("searchLoadingImg").style.display="none";
								}	
							},function (err){
								document.getElementById("searchLoadingImg").style.display="none";
								alert("Feature Search query error in javascript/search.js updateSearchTextStore(). Query="+
									searchObj[attr].url+"/query?where="+expr+"&outfields="+searchObj[attr].searchfield	+" "+err.message,"Data Error",err);
							});
						}
						catch(e){
							document.getElementById("searchLoadingImg").style.display="none";				
							alert("Feature Search error: "+e.message+" in search.js/updateSearchTextStore.","Code Error",e);
						}
					}
					
					function fillSearchValues(attr){
						// if searchvalue=comma delimited list of suggestions in SearchWidget.xml file use this list for drop down store
						document.getElementById("searchLoadingImg").style.display="block";
						var items = searchObj[attr].searchvalues.split(",");
						var dataArr = [];
						items.forEach(function(item) {
							var obj = {};
							obj[searchObj[attr].searchfield]=item.trim();
							dataArr.push(obj);
						});
						var searchTextStore= new Memory({data: dataArr});
						var searchTextCombo = registry.byId("searchText");
						searchTextCombo.set("store", searchTextStore); // store.data[0]={searchfield: someValue}
						searchTextCombo.reset();
						searchTextCombo.set("searchAttr", searchObj[attr].searchfield);
						searchTextCombo.set("placeHolder","Select a "+searchObj[id].name);
						obj = null;
						dataArr = null;
						attr = null;
						items = null;
						document.getElementById("searchLoadingImg").style.display="none";
					}
					
					function fillLookupSearchValues(id){
						// Fill Search For drop down with aspx database call
						document.getElementById("searchLoadingImg").style.display="block";
						var xmlhttp = createXMLhttpRequest();
						xmlhttp.onreadystatechange = function() {
							if (xmlhttp.readyState == 4 && xmlhttp.status === 200) {
								// xmlhttp.responseXML is null so call createXMLparser instead of createXMLdoc
								var xmlData=createXMLparser(xmlhttp.responseText.substr(xmlhttp.response.indexOf("?>")+2));
								var elements = xmlData.getElementsByTagName(searchObj[id].lookupfield);
								var dataArr = [];
								for (var i=0; i<elements.length; i++){
									var obj = {};
									obj[searchObj[id].searchfield] = elements[i].childNodes[0].nodeValue; // load object key as variable
									dataArr.push(obj);
								}
								// update Search For suggestion list
								var searchTextStore= new Memory({data: dataArr});
								var searchTextCombo = registry.byId("searchText");
								searchTextCombo.set("store", searchTextStore);
								//searchTextCombo.reset();
								searchTextCombo.set("searchAttr", searchObj[id].searchfield);
								searchTextCombo.set("placeHolder","Select a "+searchObj[id].name);
								dataArr = null;
								document.getElementById("searchLoadingImg").style.display="none";
							}
							else if (xmlhttp.status === 404) {
								alert("File: "+app+"/"+searchObj[id].lookupsearchvalues+" not found.","Data Error");
								document.getElementById("searchLoadingImg").style.display="none";
							}
							else if (xmlhttp.readyState===4 && xmlhttp.status===500) {
								alert("File: "+app+"/"+searchObj[id].lookupsearchvalues+" not found.","Data Error");
								document.getElementById("searchLoadingImg").style.display="none";
							}
						};
						xmlhttp.open("GET",app+"/"+searchObj[id].lookupsearchvalues+"?v="+ndisVer,true);
						xmlhttp.send(null);
					}
					
					function setSelection(event) {
						// user made a selection in the "search for:" drop down. Display a table of multiple matches or zoom to a single match.
						try {
							// Prevent form submission from loading a new page
							if (event){
								event.stopImmediatePropagation(); // don't call this twice
								event.preventDefault(); // don't load a new page
							}
							// hide mobile keyboard
							if (registry.byId("featureType").attr("displayedValue") == "Township Range"){
								document.getElementById("searchTwn").blur();
								document.getElementById("searchRng").blur();
							}
							else
								document.getElementById("searchText").blur();
							document.body.focus();
							window.scrollTo(0, 0); // scroll page to top. dropdown list can scroll page.
							
							var userTypedTxt;
							var queryTask, query;
							// Strip off county name (mobile)
							if (usingCounty && registry.byId("searchText").get("value").lastIndexOf(" (")>-1)
								userTypedTxt = registry.byId("searchText").get("value").substr(0,registry.byId("searchText").get("value").lastIndexOf(" ("));
							else
								userTypedTxt = registry.byId("searchText").get("value");
							// protect against xss attacks
							var regexp=/([^a-zA-Z0-9 :#\-\',\.!_\*()])/g; 
							if (regexp.test(userTypedTxt)) alert("Illegal characters were removed from the search text.","Warning");
							userTypedTxt=userTypedTxt.replace(regexp,""); // clean it

							var attr = registry.byId("featureType").attr("displayedValue");
							if (userTypedTxt == "" && attr != "Township Range") return;
							clearSelection();
							var expr;
							document.getElementById("searchLoadingImg").style.display="block";
							
							// --------------------------------------------------
							// Do we need to do a database lookup with this info?
							// --------------------------------------------------
							if (searchObj[attr].database) {
								document.getElementById("searchLoadingImg").style.display="block";
								//document.getElementById("searchMsg").innerHTML="Loading...";
								//document.getElementById("searchMsg").style.display = "block";
								var xmlhttp = createXMLhttpRequest();
								xmlhttp.open("POST",searchObj[attr].database+"?v="+ndisVer+"&key="+userTypedTxt,true);
								xmlhttp.send(null);
								
								xmlhttp.onreadystatechange = function() {
									if (xmlhttp.readyState===4 && xmlhttp.status === 200) {
										var xmlData=createXMLparser(xmlhttp.responseText.substr(xmlhttp.response.indexOf("?>")+2));
										var elements = xmlData.getElementsByTagName(searchObj[attr].filename);
										if (elements.length == 0) {
											alert("No features found with that name. Please try again.","Warning");
											document.getElementById("searchLoadingImg").style.display="none";
											//document.getElementById("searchMsg").style.display = "none";
											return;
										}
										// build where expression: field IN ('value1', 'value2')
										expr=searchObj[attr].database_field+" IN (";
										for (var i=0; i<elements.length; i++) {
											 if (i>0) expr += ",";
											// String
											if (searchObj[attr].database_field_type.toUpperCase() == "STRING") {
												expr += "'"+elements[i].getElementsByTagName(searchObj[attr].database_field)[0].childNodes[0].nodeValue+"'";
											}
											// Number
											else
											{
												expr += elements[i].getElementsByTagName(searchObj[attr].database_field)[0].childNodes[0].nodeValue;
											}
										}
										expr += ")";
										// do the query
										queryLayer = searchObj[attr].url;
										queryFields = searchObj[attr].fields;
										displayNames = searchObj[attr].displayfields.split(",");
										queryTitleField = searchObj[attr].titlefield;
										queryLinkField = searchObj[attr].linkfield.split(",");
										queryLinkText = searchObj[attr].linktext.split(",");
										queryTask = new QueryTask(searchObj[attr].url);
										query = new Query();
										query.where = expr;
										query.outFields = searchObj[attr].fields.split(",");
										query.returnGeometry = true;
										query.outSpatialReference = map.spatialReference;
										queryTask.requestOptions = {usePost:true}; // force POST instead of GET was failing on Trout: Cutbow
										queryTask.execute(query, function(results) {  
											recAC = createRecordData(results,registry.byId("featureType").attr("displayedValue"));
										}, function (error){ 
											alert("Error in javascript/search.js/setSelect/queryTask.execute "+error.message,"Code Error",error);
											document.getElementById("searchLoadingImg").style.display="none";
											//document.getElementById("searchMsg").style.display = "none";
										});
										
									}
								};
								xmlhttp.onerror = function() {
									alert('There was an error looking up the data from '+searchObj[attr].database+'?key='+userTypedTxt,"Code Error");
									document.getElementById("searchLoadingImg").style.display="none";
									//document.getElementById("searchMsg").style.display = "none";
								};
							}
							// --------------------------------------------------------
							// No database lookup,just display table and zoom to point
							// --------------------------------------------------------
							else{
								var queryExpr = searchObj[attr].expression;
								// Handle Township Range Section
								if (attr == "Township Range")
								{
									//document.getElementById("searchMsg").innerHTML="Loading...";
									//document.getElementById("searchMsg").style.display = "block";
									document.getElementById("searchLoadingImg").style.display="block";
									expr = queryExpr.replace("[value1]", parseInt(document.getElementById("searchTwn").value));
									if (registry.byId("nsSw").get("value") == "on")
										expr = expr.replace("[value2]", "N");
									else
										expr = expr.replace("[value2]", "S");
									expr = expr.replace("[value3]", parseInt(document.getElementById("searchRng").value));
									if (registry.byId("ewSw").get("value")=="on")
										expr = expr.replace("[value4]", "W");
									else
										expr = expr.replace("[value4]", "E");
									if (registry.byId("searchSec").get("value"))
										expr = expr.replace("[value5]", parseInt(registry.byId("searchSec").get("value")));
									else // Search for just Township & range.  Take off SECTION = [value5]
									{
										var pos = expr.indexOf("AND SECTION");
										expr = expr.substring(0,pos);	
									}
									if (expr.indexOf("NaN") > -1) {
										alert("You must enter a value for Township and Range.","");
										document.getElementById("searchLoadingImg").style.display="none";
										return;
									}

									userTypedTxt = document.getElementById("searchTwn").value;
									if (registry.byId("nsSw").get("value") == "on") userTypedTxt +="N";
									else userTypedTxt +="S";
									userTypedTxt += document.getElementById("searchRng").value;
									if (registry.byId("ewSw").get("value")=="on") userTypedTxt +="W";
									else userTypedTxt +="E";
									if (registry.byId("searchSec").get("value")) userTypedTxt += " Sec "+registry.byId("searchSec").get("value");
									// Clear input boxes
									document.getElementById("searchTwn").value = "";
									document.getElementById("searchRng").value = "";
									registry.byId("searchSec").attr("value","");
								}
								
								else
								{
									// Check if they entered a letter when it needs a number
									if (isNaN(Number(userTypedTxt)) && queryExpr.indexOf("= [value]") != -1)
									{	
										registry.byId("searchText").set("value","");
										updatedList = false;
										var msg = "Your search for "+userTypedTxt+" failed.  Only numbers are allowed.  Please try again.";
										alert(msg,"Warning");
										userTypedTxt = "";
										document.getElementById("searchLoadingImg").style.display="none";
										//document.getElementById("searchMsg").style.display = "none";
										return;
									}
						
									// search string is *, return all possibilities
									/*else if (userTypedTxt == "*") 
									{
										document.getElementById("searchLoadingImg").style.display="block";
										//document.getElementById("searchMsg").innerHTML="Loading all features, please wait...";
										//document.getElementById("searchMsg").style.display = "block";
										if (queryExpr.indexOf("= UPPER('[value]')",0) > 0)
										{
											expr = queryExpr.replace("= UPPER('[value]')", "<> ''");
										}
										else if (queryExpr.indexOf("LIKE UPPER('%[value]%')",0) > 0)
										{
											expr = queryExpr.replace("LIKE UPPER('%[value]%')", "<> ''");
										}
										else
										{
											expr = queryExpr.replace("= [value]", "<> -1");
										}
										registry.byId("searchText").set("value","");
									}*/
								
									// User entered a string or number for search text
									else
									{
										document.getElementById("searchLoadingImg").style.display="block";
										//document.getElementById("searchMsg").innerHTML="Loading...";
										//document.getElementById("searchMsg").style.display = "block";
										// Check for single quote
										var quote = /'/g;
										userTypedTxt = userTypedTxt.replace(quote,"''");
										// for mobile use exact match
										if (queryExpr.indexOf("LIKE UPPER('%[value]%')") > 0)
											queryExpr = queryExpr.replace("LIKE UPPER('%[value]%')","= UPPER('[value]')");
										if (usingCounty && registry.byId("searchText").get("value").lastIndexOf(" (")>-1)
											expr = queryExpr.replace("[value]", userTypedTxt)+" AND COUNTYNAME = '"+
												registry.byId("searchText").get("value").substring(registry.byId("searchText").get("value").lastIndexOf(" (")+2, registry.byId("searchText").get("value").length-1) +"'";
										else
											expr = queryExpr.replace("[value]", userTypedTxt);
										registry.byId("searchText").set("value","");
									}
								}
								
								queryLayer = searchObj[attr].url;
								queryFields = searchObj[attr].fields;
								var strDisplayNames = searchObj[attr].displayfields;
								if (strDisplayNames != null)
									displayNames = searchObj[attr].displayfields.split(",");
								queryTitleField = searchObj[attr].titlefield;
								queryLinkField = searchObj[attr].linkfield.split(",");
								queryLinkText = searchObj[attr].linktext.split(",");
								
								if (queryLayer)
								{
									queryTask = new QueryTask(queryLayer);
									query = new Query();
									query.where = expr;
									var outflds = queryFields.split(",");
									if (attr=="GMUs" && (searchObj[attr].displayfields == "Mountain Goat GMU" || searchObj[attr].displayfields == "Bighorn Sheep GMU")){
										outflds.push("HUNTING");
									}
									query.outFields = outflds;
									query.returnGeometry = true;
									query.outSpatialReference = map.spatialReference;
									queryTask.execute(query, function(featureSet){
										if (featureSet.features.length == 0) {
											alert("No features found with that name. Please try again.","Warning");
											document.getElementById("searchLoadingImg").style.display="none";
											//document.getElementById("searchMsg").style.display = "none";
											return;
										}
										createRecordData(featureSet,registry.byId("featureType").attr("displayedValue"));
										
									}, function (error){ 
										alert("Error in javascript/search.js/setSelect/queryTask.execute, url="+queryLayer+". Where "+expr+". Error message: "+error.message,"Code Error",error);
										document.getElementById("searchLoadingImg").style.display="none";
										//document.getElementById("searchMsg").style.display = "none";
									});
								}
							}
						}
						catch(e){
							alert(e.message+" in javascript/search.js/setSelection","Code Error",e);
							document.getElementById("searchLoadingImg").style.display="none";
							//document.getElementById("searchMsg").style.display = "none";
						}
					}

					function makeLink(data){
						// open a hyperlink in a table cell
						//return "<a target=\"_blank\" href=\"" +data+ "\">" +data + "</a>"; 
						return data;
					}
					
					//create record data
					function createRecordData(featureSet,attr){
						if (attr == fishSpeciesGraphicalName) attr = "Fish species";
						//document.getElementById("searchFound").innerHTML=featureSet.features.length;
						var displayFields = queryFields.split(",");
						var ave_char_width = 6;
						var width = {};
						for (var j=0; j<displayFields.length; j++)
							width[displayFields[j]] = 0;
						recAC = [];
						graphicAC = null;
						graphicAC = [];
						if (!queryTitleField)
								queryTitleField = featureSet.displayFieldName;
						var itemList = [];
						var index = 0;
						
						featureSet.features.forEach(function(gra)                    
						{
							try{
								var obj = gra.attributes;
								// only display Mountain Goat and Bighorn Sheep GMUs where hunting is allowed
								if (attr != "GMUs" || gmu=="Big Game GMU" || obj.HUNTING == "YES"){
									var value;
									var title;
									var point = getGeomCenter(gra);
									var cols = [];
									var graInfoData = 
									{
										icon: widgetIcon,
										point: point,
										geometry: gra.geometry
									};  
									var infoData = 
									{
										icon: widgetIcon,   
										point: point,
										geometry: gra.geometry
									};

									// Add data for each row
									/*var row = new Object();
									row.id = index++;
									for (j=0;j<displayFields.length;j++){
										if (obj[displayFields[j]]) {
											// if is a number format with 2 decimal places and thousands separators. Found in utilFuncs.js
											if (displayFields[j] == "Acres") row[displayFields[j]] = obj[displayFields[j]].numberFormat(2);
											else row[displayFields[j]] = obj[displayFields[j]];
											// if not a link and data is wider
											if (queryLinkField.indexOf(displayFields[j])==-1 &&(obj[displayFields[j]].toString().length+3) > width[displayFields[j]])
												width[displayFields[j]] = obj[displayFields[j]].toString().length+3;
											// Set max width, unless it is a url with no spaces then leave it's length because it cannot wrap.
											if (width[displayFields[j]] > 35 && obj[displayFields[j]].toString().indexOf(" ") > -1) width[displayFields[j]] = 35;
										}
									}
									itemList.push(row);
									row = null;		
				
									var i = 0;*/
									for (j=0; j<displayNames.length; j++)
									{
										try{    		        	    		       
											value = obj[displayFields[j]].toString();
										} catch (error){
											value = "";
										}
										// Save the title field to be displayed on mouse over.
										// This is set in <titlefield> tag in the xml file.
										if (displayFields[j].toUpperCase() == queryTitleField.toUpperCase())
										{
											graInfoData.title = value;
											infoData.title = value;
										}
									}/*
									

										// Link, if displayNames = key it will need to lookup the value in a database and add the column later
										if (queryLinkField.indexOf(displayFields[j])>-1)
										{
											var linkIndex = queryLinkField.indexOf(displayFields[j]);
											if ((value != "") && (value != " ") && (displayNames[j] != "key"))
											{
												graInfoData.link = new Array();
												graInfoData.link.push(value);
												graInfoData.linktext = new Array();
												graInfoData.linktext.push(queryLinkText[linkIndex]);
												// if there is a link text, use it in place of the url
												if (queryLinkText[linkIndex].length > 0)
													infoData[displayNames[j].replace(/ /g,"_")] = "<a target=\"_blank\" href=\"" +value+ "\">" +queryLinkText[linkIndex] + "</a>";
												else
													infoData[displayNames[j].replace(/ /g,"_")] = value;
												i++;
											}
											
											// Value is blank, if displayNames = key it will need to lookup the values in a database and add the column later
											else
											{
												if (displayNames[j] != "key") i++;
												infoData[displayNames[j].replace(/ /g,"_")] = "";
												//infoData["LINK_"+displayNames[j].replace(/ /g,"_")] = null;								
											}
										}
										
										// Not a link
										else
										{
											// if displayNames = key it will need to lookup the values in a database and add the column later
											if (displayNames[j] != "key") i++;
											// Add a new property = the value of displayFields[j], and data value to the object infoData
											// If it is a number set decimal places to 2 and add thousands separators
											if (displayNames != null){
												if (displayNames[j]=="Acres") infoData[displayNames[j]] = Number(value).numberFormat(2);
												else infoData[displayNames[j].replace(/ /g,"_")] = value;
											}
											else {
												if (displayFields[j]=="Acres") infoData[displayFields[j]] = Number(value).numberFormat(2);
												else infoData[displayFields[j]] = value;
											}
										}
									}*/
								   
									recAC.push(infoData);
									gra.attributes = graInfoData;
									
									switch (gra.geometry.type)
									{
										case "point":
										{
											gra.symbol = graphicPointSym;
											break;
										}
										case "polyline":
										{
											gra.symbol = graphicLineSym;
											break;
										}
										
										case "polygon":
										{
											gra.symbol = graphicPointSym; //graphicPolySym;
											break;
										}
									}
									graphicsLayer.add(gra);
									document.getElementById("searchRemoveBtn").style.visibility="visible";

									// for mobile always add label
									//addLabel(Graphic(gra.attributes.point), gra.attributes.title, graphicsLayer, "11pt")
									graphicAC.push(gra);  // store array of points    
								}
								else {
									featureSet.features=null;
									//document.getElementById("searchFound").innerHTML = Number(document.getElementById("searchFound").innerHTML)-1;
								}
							}
							catch(e){
								alert("Error in createRecordData search.js "+e.message,"Code Error",e);
								document.getElementById("searchLoadingImg").style.display="none";
							}
						});
						// if a mountain goat or bighorn sheep GMU was selected where no hunting is allowed return.
						//if (document.getElementById("searchFound").innerHTML  == "0") {
						if(!featureSet.features){
							alert("No features found. Please try again.","Warning");
							// hide table
							//document.getElementById("searchMsg").style.display = "none";
							//document.getElementById("searchTools").style.display = "none";
							//document.getElementById("searchGrid").style.display = "none";
							//document.getElementById("searchContent").style.height = tabHeight;
							document.getElementById("searchLoadingImg").style.display="none";
							return;
						}
						graphicsLayer.id="searchLayer0";
	/*					graphicsLayer.on("mouse-over", mouseOverGraphic);
						graphicsHLLayer.on("mouse-out", function(){ graphicsHLLayer.clear(); });

						// Grid header
						var header={};
						for (i=0; i<displayNames.length; i++){
							var obj = {label:displayNames[i],resizable:true};
							header[displayNames[i].replace(/ /g,"_")]=obj;
							if ((header[displayNames[i].replace(/ /g,"_")].label.length+10) > width[displayFields[i]])
								width[displayFields[i]]=header[displayNames[i].replace(/ /g,"_")].label.length+10;
							width[displayFields[i]]=width[displayFields[i]]*ave_char_width+"px"
							// if it is a link add formatter function
							if (queryLinkField.indexOf(displayFields[i]) > -1) header[displayNames[i].replace(/ /g,"_")].formatter = makeLink;
						}
						// Hide columns
						header.geometry={label:"geometry",width:"0px"};
						header.icon ={label:"icon",width:"0px"};
						header.point={label:"point",width:"0px"};
						header.title={label:"title",width:"0px"};

						//create a new grid:
						var gridDiv = dom.byId("searchGrid");
						// remove old grid from html dom
						if (gridDiv.childNodes.length>0)gridDiv.removeChild(gridDiv.childNodes[0]);
						fsGrid = new (declare([OnDemandGrid, DijitRegistry]))({
							columns: header,
							selectionMode: "single", // for Selection; only select a single row at a time
							cellNavigation: false // for Keyboard; allow only row-level keyboard navigation
						});
						
						// Sort table based on field name specified in sortfield in SearchWidget.xml
						var sortFields = searchObj[attr].sortfield.split(",");
						for (var i=0;i<sortFields.length;i++) sortFields[i]=sortFields[i].replace(/ /g,"_");
						var numericSort = {};
						var numericArr = searchObj[attr].numericsort.split(",");
						for (var i=0;i<sortFields.length;i++){
							numericSort[sortFields[i]] = numericArr[i];
						}
						function multiColumnSort(arr, sf, numericSort) {
						  var s = '';
						  var ns = numericSort; // Do not use var!! Make it global for this function, so forEach has access to it.
						  sf.forEach(function(f, idx) {
							// preform numeric sort for this column
							if (ns[f] == "true"){
								s += 'if(parseInt(arguments[0].' + f + ')-parseInt(arguments[1].' + f + ')>0)return 1;';
								s += 'else if(parseInt(arguments[0].' + f + ')-parseInt(arguments[1].' + f + ')==0)';
								s += (idx < sf.length - 1) ? '{' : 'return 0';
							}
							else{
								s += 'if(arguments[0].' + f + '>arguments[1].' + f + ')return 1;';
								s += 'else if(arguments[0].' + f + '==arguments[1].' + f + ')';
								s += (idx < sf.length - 1) ? '{' : 'return 0';
							}
						  });
						  s += Array(sf.length).join('}') + ';return -1';
						  return arr.sort(new Function(s));
						};
						multiColumnSort(recAC,sortFields,numericSort);
						//fsGrid.renderArray(recAC);
						// Set column widths
						for (i=0;i<displayFields.length;i++){
							fsGrid.styleColumn(displayNames[i].replace(/ /g,"_"), "width:"+width[displayFields[i]]);
						}
						fsGrid.styleColumn("Acres", "text-align: right;");
						fsGrid.styleColumn("geometry", "display: none;");
						fsGrid.styleColumn("point", "display: none;");
						fsGrid.styleColumn("icon", "display: none;");
						fsGrid.styleColumn("title", "display: none;");
						
						fsGrid.on(".dgrid-row:click",function(event){
							require(["esri/geometry/Extent"], function(Extent){
								var row = fsGrid.row(event);
								var column = fsGrid.column(event);
								// zoom to point
								var polyExt = row.data.geometry.getExtent();
								if (polyExt != null)
								{
									var ext = new Extent({
										"xmin": polyExt.xmin,
										"ymin": polyExt.ymin,
										"xmax": polyExt.xmax,
										"ymax": polyExt.ymax,
										"spatialReference": {
											"wkid": wkid
										}
									});
									map.setExtent(ext,true);
								}
								else
								{
									map.setScale(zoomScale);
									map.centerAt(row.data.point);
								}
							});
						});
						fsGrid.on(".dgrid-row:mouseout",function(event){graphicsHLLayer.clear();});
						fsGrid.on(".dgrid-row:mouseover",function(event){
							var row = fsGrid.row(event);
							graphicsHLLayer.clear();
							var gra = new Graphic(row.data.geometry);
							switch (gra.geometry.type)
							{
								case "point":
								{
									gra.symbol = graphicPointHLSym;
									break;
								}
								case "polyline":
								{
									gra.symbol = graphicLineHLSym;
									break;
								}
								
								case "polygon":
								{
									gra.symbol = graphicPolyHLSym;
									break;
								}
							}
							graphicsHLLayer.add(gra);
							// Add label  
							addLabel(Graphic(row.data.point), row.data.title, graphicsHLLayer, "11pt")
							gra = null;
						});
						
						//document.getElementById("searchContent").style.height = tabWithGridHeight;
						width = null;
	*/					
						document.getElementById("searchLoadingImg").style.display="none";
	//					document.getElementById("searchOpenBtn").style.display="none";
	//					document.getElementById("searchCloseBtn").style.display="inline-block";
	//					document.getElementById("searchTools").style.display="block";
	//					document.getElementById("searchGrid").style.display="block";
						//document.getElementById("searchMsg").style.display = "none";
						// Zoom to point if only one was found
						if (recAC && recAC.length == 1)
						{
							var polyExt = recAC[0].geometry.getExtent();
							if (polyExt != null)
							{
								require(["esri/geometry/Extent"], function(Extent){
									var ext = new Extent({
										"xmin":polyExt.xmin,
										"ymin":polyExt.ymin,
										"xmax":polyExt.xmax,
										"ymax":polyExt.ymax,
										"spatialReference": {
											"wkid": wkid
										}
									});
									map.setExtent(ext,true);
								});
							}
							else
							{
								map.setScale(zoomScale);
								map.centerAt(recAC[0].point);
							}
						}
						else if (displayNames[0] == "Township") {
							map.setScale(zoomScale);
							map.centerAt(recAC[0].point);
						}
						// zoom to extent of all features
						else {
							require(["esri/graphicsUtils"],function(graphicsUtils){
								map.setExtent(graphicsUtils.graphicsExtent(featureSet.features),true);
							});
						}
						// If this is the graphical search tab & if we need to lookup info in a database call a routine to do that
	/*	grahical search				if (registry.byId("FeatureSearchTabs").selectedChildWidget == registry.byId("graphic_Pane") && searchObj[attr].graphical_db_fields && searchObj[attr].graphical_db_fields != "")
						{
							queryGraphicalDatabase(recAC,fsGrid,gridDiv,header);
						}
						else {
							fsGrid.renderArray(recAC);
							//append the new grid to the div
							gridDiv.appendChild(fsGrid.domNode);
							fsGrid.startup();
						}*/
						closeMenu();
						document.getElementById("searchPane").style.display="none";
					}
					
	/*				function mouseOverGraphic(event){
						graphicsHLLayer.clear();
						var gra = new Graphic(event.graphic.geometry);
						switch (gra.geometry.type)
						{
							case "point":
							{
								gra.symbol = graphicPointHLSym;
								break;
							}
							case "polyline":
							{
								gra.symbol = graphicLineHLSym;
								break;
							}
							
							case "polygon":
							{
								gra.symbol = graphicPolyHLSym;
								break;
							}
						}
						graphicsHLLayer.add(gra);
						// Add label  
						addLabel(Graphic(event.graphic.attributes.point), event.graphic.attributes.title, graphicsHLLayer, "11pt");
						gra = null;
					}*/

					//get geom center
					function getGeomCenter(gra){
						var pt;
						switch (gra.geometry.type)
						{
						   case "point":
						   {
								pt = new Point(gra.geometry.x, gra.geometry.y, map.spatialReference);
								break;
						   }
						   
						   case "polyline":
						   {				   
								var pl = gra.geometry;// as Polyline;
								var pathCount = pl.paths.length;
								var pathIndex = parseInt((pathCount / 2) - 1);
								var midPath = [];
								midPath = pl.paths[pathIndex];
								var ptCount = midPath.length;
								var ptIndex = parseInt((ptCount / 2) - 1);
								pt = pl.getPoint(pathIndex, ptIndex);
								break;
						   }
						   
						   case "polygon":
						   {
								pt = gra.geometry.getCentroid();
								break;
						   }
						}
						return pt;
					}
					
					//-----------------------------------
					//     Graphic Search Functions
					//-----------------------------------
	/*				function updateSearchGraphicStore(){
						// When a user changes the feature type selection, update the displayed instructions with the new feature 
						// type name, clear old selection graphics, and hide table. 
						document.getElementById("graphicfeatures").innerHTML = registry.byId("featureTypeGraphic").attr("displayedValue");
						clearSelection();
					}
					
					function queryFeaturesGraphical(geom){
						var queryGeom = geom;
						require(["esri/tasks/query", "esri/tasks/QueryTask"],function(Query,QueryTask){
							var attr = registry.byId("featureTypeGraphic").attr("displayedValue");
							if (attr == fishSpeciesGraphicalName) attr = "Fish species";
							if (attr == "GMUs" && settings.useGMUs) {
								if (gmu == "Big Game GMU") {
									searchObj[attr].fields = gmu_field + ",COUNTY";
									searchObj[attr].displayfields = "GMU,County";
									searchObj[attr].titlefield = gmu_field;
									searchObj[attr].searchfield = gmu_field;
									searchObj[attr].expression = gmu_field + " =[value]";
									searchObj[attr].url = gmu_url;
								}
								else if (gmu=="Bighorn GMU"){
									searchObj[attr].fields = settings.sheepField;
									searchObj[attr].displayfields = "Bighorn Sheep GMU";
									searchObj[attr].titlefield = settings.sheepField;
									searchObj[attr].searchfield = settings.sheepField;
									searchObj[attr].expression = settings.sheepField + " = UPPER('[value]')";
									searchObj[attr].url = settings.sheepUrl;
								}
								else {
									searchObj[attr].fields = settings.goatField;
									searchObj[attr].displayfields = "Mountain Goat GMU";
									searchObj[attr].titlefield = settings.goatField;
									searchObj[attr].searchfield = settings.goatField;
									searchObj[attr].expression = settings.goatField + " = UPPER('[value]')";
									searchObj[attr].url = settings.goatUrl;
								}
							}
							var querySpatialRel = "esriSpatialRelIntersects";
							
							queryFields = searchObj[attr].fields;
							var strDisplayNames = searchObj[attr].displayfields;
							if (strDisplayNames != null)
								displayNames = searchObj[attr].displayfields.split(",");  // headers for display table
							// If we need to lookup info in a database append the lookup field
							if (searchObj[attr].graphical_db_fields && searchObj[attr].graphical_db_fields != "")
							{
								queryFields += "," + searchObj[attr].database_field;  // the field that links the mapservice to the database
								displayNames.push("key");
							}
							
							queryTitleField = searchObj[attr].titlefield;
							queryLinkField = searchObj[attr].linkfield.split(",");
							queryLinkText = searchObj[attr].linktext.split(",");
							queryExpr = searchObj[attr].graphical_expr;
							if (searchObj[attr].url)
							{
								queryTask = new QueryTask(searchObj[attr].url);
								var query = new Query();
								
								if (queryExpr && queryExpr != "")
									query.where = queryExpr;
								query.geometry = queryGeom;
								/ Add HUNTING field for Mountain Goat and Bighorn Sheep GMU
								var outflds = queryFields.split(",");
								if (attr=="GMUs" && (searchObj[attr].displayfields == "Mountain Goat GMU" || searchObj[attr].displayfields == "Bighorn Sheep GMU")){
										outflds.push("HUNTING");
								}
								query.outFields = outflds;
								query.returnGeometry = true;
								query.spatialRelationship = querySpatialRel;
								query.outSpatialReference = map.spatialReference;
								queryTask.execute(query, function(featureSet) { 
									try
									{
										if (featureSet.features.length == 0) {
											alert("No features found in that location. Please try again.","Warning");
											document.getElementById("searchLoadingImg").style.display="none";
											//document.getElementById("searchMsg").style.display = "none";
											return;
										}
										createRecordData(featureSet,registry.byId("featureTypeGraphic").attr("displayedValue"));
									}
									catch (error)
									{
										alert("Feature Search error in javascript/search.js/queryFeaturesGraphical queryTask execute. Error message: "+error.message,"Code Error",error);
										document.getElementById("searchLoadingImg").style.display="none";
										//document.getElementById("searchMsg").style.display = "none";
									}	
								}, function (error) {
									alert("While using Graphical Feature Search there was a possible error in SearchWidget.xml file. Querying: "+searchObj[attr].url+" "+error.message, "Data Error",error);    
									//document.getElementById("searchMsg").style.display = "none";
									document.getElementById("searchLoadingImg").style.display="none";
								});
							} 
						});
					}
				
					function queryGraphicalDatabase(recAC,fsGrid,gridDiv,gridHeader){
						try{
							// Call the database to lookup values to add to the table
							key = "";
							for (var i=0; i<recAC.length; i++)
							{
								if (i>0) key += ",";
								key	+= recAC[i]["key"]; // The key field was added in queryFeaturesGraphical.  We will remove it here.
							}
							var attr = registry.byId("featureTypeGraphic").attr("displayedValue");
							if (attr == fishSpeciesGraphicalName) attr = "Fish species";
							var xmlhttp = createXMLhttpRequest();
							var url = searchObj[attr].graphical_database+"?v="+ndisVer+"&key="+key;
							xmlhttp.open("POST",url,true);

							xmlhttp.onerror = function() {
								alert('In Graphical Feature Search, there was an error looking up the data from '+searchObj[attr].graphical_database,"Code Error");
								document.getElementById("searchLoadingImg").style.display="none";
								//document.getElementById("searchMsg").style.display = "none";
							};
							xmlhttp.onreadystatechange = function() {
								if (xmlhttp.readyState===4) {
									if (xmlhttp.status === 200) {
										try {
											var xmlData=createXMLparser(xmlhttp.responseText.substr(xmlhttp.response.indexOf("?>")+2));
											var xml = xmlData.getElementsByTagName("NewDataSet");
											if (xml.length == 0) {
												alert("No features found with that name. Please try again.","Warning");
												document.getElementById("searchLoadingImg").style.display="none";
												//document.getElementById("searchMsg").style.display = "none";
												return;
											}
											
											var field = searchObj[attr].graphical_db_fields.split(",");
											var header = searchObj[attr].graphical_db_displayfields.split(",");
											var width = new Array();
											var sort = searchObj[attr].graphical_db_sort.split(",");
											var j;
											
											// Loop through each field to add to the table
											for (var f=0; f<field.length; f++)
											{
												width[f] = 0;
												// Loop through each key record.
												for (j=0; j<xml.length; j++)
												{
													recAC[j][header[f]] = "";
													// Loop through the values for this key
													var rec = xml[j].getElementsByTagName(searchObj[attr].graphical_filename);
													for (var i=0; i<rec.length; i++)
													{
														if (i>0) recAC[j][header[f]] += ",";
														recAC[j][header[f]] += rec[i].getElementsByTagName(field[f])[0].childNodes[0].nodeValue;
														//if (i==rec.length-1) recAC[j][header[f]] = recAC[j][header[f]]+"<br/>";
														//else recAC[j][header[f]] = recAC[j][header[f]]+"<br/>,";
														// get max width
														if (recAC[j][header[f]].length > width[f])
															width[f] = recAC[j][header[f]].length+3;
														if (header[f].length+10 > width[f]) width[f] = header[f].length+10;
														if (width[f] > 35) width[f] = 35;
													}
												}
											}// end add columns to table
											var ave_char_width = 6;
											for (i=0; i<recAC.length; i++)
											{
												delete(recAC[i]["key"]);
												// Sort comma delimited data in each new column
												for (f=0; f<field.length; f++)
												{
													if (sort[f].toUpperCase() == "YES")
													{
														var arr = new Array();
														arr = recAC[i][header[f]].split(",");
														arr.sort();
														recAC[i][header[f]] = arr.toString();
														arr = null;
													}
												}
											}
											// add new header titles for each new column
											for (f=0; f<header.length; f++)
												gridHeader[header[f]] = {label:header[f],resizable:true};
											// remove key from header
											delete(gridHeader["key"]);
											fsGrid.set("columns",gridHeader);
											// Set width for new columns
											for (f=0; f<header.length; f++)
												fsGrid.styleColumn(header[f], "width:"+width[f]*ave_char_width+"px");
											// update the grid store
											fsGrid.renderArray(recAC);
											//append the new grid to the div
											gridDiv.appendChild(fsGrid.domNode);
											fsGrid.startup();
											width=null;
											gridHeader=null;
											header=null;
										}
										catch(error){
											alert("Graphical Feature Search error: "+error.message + " in javascript/search.js/queryGraphicalDatabase.","Code Error",error);
											document.getElementById("searchLoadingImg").style.display="none";
											//document.getElementById("searchMsg").style.display = "none";
										}
									}
									else if (xmlhttp.status === 404) {
										alert("Error: Missing "+searchObj[attr].graphical_database+" file in "+app+ " directory.","Data Error");
									}
									else {
										alert('Graphical Feature Search Error: There was an error looking up the data from '+searchObj[attr].graphical_database+' Error message: '+xmlhttp.statusText,'Data Error');
										document.getElementById("searchLoadingImg").style.display="none";
										//document.getElementById("searchMsg").style.display = "none";
									}
								}
							};
							xmlhttp.send(null);
						}
						catch(error){
							alert("Graphical Feature Search Error: "+error.message + " in javascript/search.js/queryGraphicalDatabase.","Code Error",error);
							document.getElementById("searchLoadingImg").style.display="none";
							//document.getElementById("searchMsg").style.display = "none";
						}
					}
					
				
				
					function httpGraphicalFault(event)
					{
						var sInfo = "Error: ";
						var attr = registry.byId("featureTypeGraphic").attr("displayedValue");
						sInfo += searchObj[attr].graphical_database;
						sInfo += " file is missing from the application directory or there is a problem executing it.";
						alert(sInfo+" in javascript/search.js httpGraphicalFault", "Code Error");
						document.getElementById("searchLoadingImg").style.display="none";
					}
					
					function activateSearchTool(event){
						// A graphic search button was clicked
						// Check if button was already depressed. If so reset to Identify
						if (event.currentTarget.className == "graphBtnSelected") {
							searchGraphicExit();
							return;
						}
						drawing = true; // flag to turn off identify in identify.js, doIdentify()
						clearSelection();
						// depress the current button
						event.currentTarget.className = "graphBtnSelected";
						// unpress the other buttons
						if (event.currentTarget.id != "searchpoint") document.getElementById("searchpoint").className = "graphBtn";
						if (event.currentTarget.id != "searchpolyline") document.getElementById("searchpolyline").className = "graphBtn";
						if (event.currentTarget.id != "searchrectangle") document.getElementById("searchrectangle").className = "graphBtn";
						if (event.currentTarget.id != "searchpolygon") document.getElementById("searchpolygon").className = "graphBtn";
						
						require(["esri/toolbars/draw","dojo/i18n!esri/nls/jsapi"],function(Draw,bundle){
							if (event.currentTarget.id == "searchpoint") {
								bundle.toolbars.draw.addPoint = "Click to select features at a point"; // change tooltip
								searchtoolbar.activate(Draw.POINT);
							}
							if (event.currentTarget.id == "searchpolyline") 
								searchtoolbar.activate(Draw.POLYLINE);
							if (event.currentTarget.id == "searchrectangle") {
								bundle.toolbars.draw.addShape="Press down to start and let go to finish"; // change tooltip
								searchtoolbar.activate(Draw.RECTANGLE);
							}
							if (event.currentTarget.id == "searchpolygon") searchtoolbar.activate(Draw.POLYGON);
						});
					}
					function searchGraphicExit(){
						drawing=false;
						searchtoolbar.deactivate();
						// deselect all buttons
						document.getElementById("searchpoint").className = "graphBtn";
						document.getElementById("searchpolyline").className = "graphBtn";
						document.getElementById("searchrectangle").className = "graphBtn";
						document.getElementById("searchpolygon").className = "graphBtn";
					}
	*/				
					function clearSelection(){
						graphicsLayer.clear();
						graphicsHLLayer.clear();
						document.getElementById("searchRemoveBtn").style.visibility="hidden";
						// hide table
						//document.getElementById("searchTools").style.display = "none";
						//document.getElementById("searchGrid").style.display = "none";
						//document.getElementById("searchContent").style.height = tabHeight;
					}
					
					function clearAndClose(){
						// Clear graphics layers and close left menu
						clearSelection();
						closeMenu();
					}
					
					// Set initial tab specified in SearchWidget.xml
					/*var tab = tabToSelect && registry.byId(tabToSelect);
					if(tab) registry.byId("FeatureSearchTabs").selectChild(tab);*/

					// Setup button actions
					//registry.byId("searchBtn").on("click",setSelection); // dojox mobile button causes scrolling to freeze
					document.getElementById("searchBtn").addEventListener("click", setSelection);
					//registry.byId("searchRemoveBtn").on("click",clearSelection);
					document.getElementById("searchRemoveBtn").addEventListener("click", clearAndClose);
					/* Graphical Search Buttons
					document.getElementById("clearSearchGraphics").addEventListener('click',function() {clearSelection()});
					document.getElementById("searchpoint").addEventListener('click',function(event) {activateSearchTool(event)});
					document.getElementById("searchpolyline").addEventListener('click',function(event) {activateSearchTool(event)});
					document.getElementById("searchrectangle").addEventListener('click',function(event) {activateSearchTool(event)});
					document.getElementById("searchpolygon").addEventListener('click',function(event) {activateSearchTool(event)});*/
					
					
					// fill searchTextCombo suggestion list
					updateSearchTextStore(featureStore.data[0].name); // fill Search Text box with suggestions For ComboBox

					// Set the title for 2nd drop down
					document.getElementById("searchLabel").innerHTML = searchObj[featureStore.data[0].name].textsearchlabel+" ";
				  }
				  catch(e) {
					alert("Error in javascript/search.js searchInit. "+e.message,"Code Error",e);
					document.getElementById("searchLoadingImg").style.display="none";
				  }
				});
			}
			catch(e) {
				alert("Error in javascript/search.js searchInit. "+e.message,"Code Error",e);
				document.getElementById("searchLoadingImg").style.display="none";
			}
		}
		else if (xmlhttp.status === 404) {
			alert("Error: Missing config.xml file in "+app+ " directory.","Data Error");
			hideLoading();
		}
		else if (xmlhttp.readyState===4 && xmlhttp.status===500) {
			alert("Make sure your application name is correct on the URL. app="+app,"Warning");
			hideLoading();
		}
	};
	xmlhttp.open("GET",configFile,true);
	xmlhttp.send(null);
  }
  catch(e){
	alert(e.message+" in javascript/search.js trying to read "+app+"/SearchWidget.xml file.","Code Error",e);
	document.getElementById("searchLoadingImg").style.display="none";
  }
}