// Goto GMU drop down input box
var reloadGMUCombo = false; // flag to turn off loading if changing list of gmu from elk to bighorn sheep to mountain goat.
var gmu_field;
var gmu_url;
var gmu_combo;
function showGMUCombo(url,field) {
// Called from identify.js/readSettingsWidget
	try {
		gmu_combo = gmu;
		gmu_field = field;
		gmu_url = url;
		if (!gmu_url || !gmu_field) {
			alert("Missing gmu_url or gmu_field tag in SettingsWidget.xml.  This must be set when use_gmus is true.","Data Error");
			return;
		}
		// populate the gmu dropdown list
		require (["esri/tasks/query", "esri/tasks/QueryTask"], 
		function (Query, QueryTask) {
			try{
				var queryTask = new QueryTask(gmu_url);
				var query = new Query();
				query.returnGeometry = false;
				query.outFields = [gmu_field];
				if (gmu_combo == "Goat GMU" || gmu_combo == "Bighorn GMU"){
					query.where = "'" +gmu_field+ "' <> ''";
					query.outFields.push("HUNTING");
				}
				else
					query.where = gmu_field +" <> -1";
				queryTask.execute(query,showResults,onLoadFault);
				queryTask = null;
			}
			catch (e) {
				alert("Error occured while trying to show the GMU drop down: "+e.message+" in javascript/gmu.js showGMUCombo().","Code Error",e);
			}
		});
	}
	catch (e) {
		alert("Error occured while trying to show the GMU drop down: "+e.message+" in javascript/gmu.js showGMUCombo().","Code Error",e);
	}
}

function onLoadFault(err){
	hideLoading();
	alert(err.message+" Error querying url, "+gmu_url+", for field, "+gmu_field+", in javascript/gmu.js ShowGMUCombo()","Data Error");
}

function showResults(results) {
	try {
		require (["dijit/form/ComboBox","dojo/store/Memory","esri/tasks/query", "esri/tasks/QueryTask"], 
		function (ComboBox, Memory, Query, QueryTask) {
			var gmuArr = [];
			var gmuData = [];
			var result = [];
			var i;
			for (i=0; i<results.features.length; i++) {
				if (gmu_combo == "Goat GMU" || gmu_combo == "Bighorn GMU"){
					if (results.features[i].attributes["HUNTING"] != "YES") continue;
				}
				gmuArr.push(results.features[i].attributes[gmu_field]); 
			}
			if (gmu == "Big Game GMU")
				gmuArr.sort(function(a,b){return a-b;}); // Numeric Sort
			else {
				var letter = "G";
				if (gmu == "Bighorn GMU") letter = "S";
				// Remove the S or G in front of each item. Do a numeric sort and than add it back in.
				gmuArr.forEach(function(item) {
					if (item != "OUT" && item.substring(1))
						result.push(item.substring(1));
				});
				result.sort(function(a,b){return a-b;}); // Numeric Sort
				gmuArr = [];
				result.forEach(function(item) {
					gmuArr.push(letter + item);
				});
			}
			for (i=0; i<gmuArr.length; i++) {
				gmuData.push({gmuid:gmuArr[i]}); 
			}

			var gmuDiv = document.getElementById("gmuDiv");
				
			var gmuSelect = new ComboBox({
				id: "gmuList",
				placeHolder: "Unit",
				store: new Memory({
					data: gmuData
				}),
				autoComplete: true,
				maxHeight: 300,
				searchAttr: "gmuid",
				style: "width: 60px;",
				onClick: function() {
					if (gmu != gmu_combo) {
						showLoading();
						reloadGMUCombo = true;
						if (gmu == "Bighorn GMU")
							showGMUCombo(settings.sheepUrl,settings.sheepField);
						else if (gmu == "Big Game GMU")
							showGMUCombo(settings.elkUrl,settings.elkField);
						else if (gmu == "Goat GMU")
							showGMUCombo(settings.goatUrl,settings.goatField);
						if (gmuSelect) gmuSelect.destroy();
						var gmuCombo = document.createElement("span");
						gmuCombo.id = "gmuCombo";
						gmuDiv.appendChild(gmuCombo);
					}
				},
				onChange: function(value){
					if (value != "") {
						showLoading();
						this.reset();
						var queryTask = new QueryTask(gmu_url);
						query = new Query();
						query.returnGeometry = true;
						query.outFields = [gmu_field];
						if (gmu_combo == "Goat GMU" || gmu_combo == "Bighorn GMU"){
							query.where = gmu_field +" = '"+value+"'";
							query.outFields.push("HUNTING");
						}
						else
							query.where = gmu_field +" = "+value;
						// Google Analytics count how many times GMU Combo is clicked on
						if (typeof ga === "function")ga('send', 'event', "go_to_gmu", "click", "Go to GMU", "1");
						if (typeof gtag === "function")gtag('event','widget_click',{'widget_name': 'Go to GMU'});
						queryTask.execute(query,onResult,onFault);
						queryTask = null;
					}
				},
				required: false
			}, "gmuCombo");
			gmuSelect.startup();
			gmuDiv.style.display = "block";
			if (reloadGMUCombo) {
				hideLoading();
				gmuSelect.loadAndOpenDropDown();
				reloadGMUCombo = false;
			}
			gmuArr = null;
			gmuData = null;
			result = null;
		});
	}
	catch (e) {
		alert(e.message+" in javascript/gmu.js showResults().","Code Error",e);
	}
}

function onResult(featureSet){
	if (featureSet.features.length == 0) {
		alert("No GMU area found by that name.","Warning");
		hideLoading();
		return;
	}
	if (gmu_combo == "Goat GMU" || gmu_combo == "Bighorn GMU"){
		if (featureSet.features[0].attributes["HUNTING"] != "YES") {
			alert("Hunting is not allowed at this location. Please select from drop down menu.");
			hideLoading();
			return;
		}
	}
	map.setExtent(new esri.graphicsExtent(featureSet.features),true); // find the extent of the gmu, make it fit
	hideLoading();
}

function onFault(err){
	hideLoading();
	alert("No GMU area found by that name.","Warning");
}