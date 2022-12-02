
	//**********************
	// Number Format 
	//**********************
	Number.prototype.numberFormat = function(decimals, dec_point, thousands_sep) {
		// format a number with decimals and thousand separators
		// var fooStr = foo.numberFormat(2); // 5,000.00
		dec_point = typeof dec_point !== 'undefined' ? dec_point : '.';
		thousands_sep = typeof thousands_sep !== 'undefined' ? thousands_sep : ',';

		var parts = this.toFixed(decimals).toString().split(dec_point);
		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousands_sep);

		return parts.join(dec_point);
	};
	
	//************
	// Map Scale
	//************
	function showMapScale(scale) {
		const list = document.getElementById("mapscaleList");
		var done = false;
		for (var i=0; i<list.length-2;i++){
			if (list[i+1].value < scale) {
				list.selectedIndex = i;
				done = true;
				break;
			} 
		}
		if(!done) list.selectedIndex = list.length-1;
		//if (level == 10) document.getElementById("mapscaleList").selectedIndex = 9;
		//else if (level == 11) document.getElementById("mapscaleList").selectedIndex = 10;
		//else if (level == 12) document.getElementById("mapscaleList").selectedIndex = 10;
		//else if (level == 13) document.getElementById("mapscaleList").selectedIndex = 11;
		//else document.getElementById("mapscaleList").selectedIndex = level;
	}
	function setMapScale(list) {
		view.scale = list[list.selectedIndex].value;
	}


	//**************
	// Coordinates 
	//**************
	function showCoordinates(evt) {
		require(["dojo/dom","esri/geometry/support/webMercatorUtils"],function(dom,webMercatorUtils){
			//get mapPoint from event
			var mp,xy;
			const pt = view.toMap({x: evt.x, y: evt.y});
			//The map is in web mercator - modify the map point to display the results in geographic
			if (dom.byId("xycoords_combo")[dom.byId("xycoords_combo").selectedIndex].value == "geo"){
				mp = webMercatorUtils.webMercatorToGeographic(pt);
				dom.byId("xycoords").children[0].innerHTML = mp.y.toFixed(5) + " N, " + mp.x.toFixed(5) + " W";// &nbsp;&nbsp;&nbsp;Decimal Degrees";
			}
			else if (dom.byId("xycoords_combo")[dom.byId("xycoords_combo").selectedIndex].value == "dms"){
				xy = mappoint_to_dms(pt,true);
				dom.byId("xycoords").children[0].innerHTML = xy[0] + " N, " + xy[1] + " W"; //&nbsp;&nbsp;&nbsp;Degrees, Minutes, Seconds";
				xy = null;
			}
			else if (dom.byId("xycoords_combo")[dom.byId("xycoords_combo").selectedIndex].value == "dm"){
				xy = mappoint_to_dm(pt,true);
				dom.byId("xycoords").children[0].innerHTML = xy[0] + " N, " + xy[1] + " W";// &nbsp;&nbsp;&nbsp;Degrees, Decimal Minutes";
				xy = null;
			}
			else{
				dom.byId("xycoords").children[0].innerHTML = pt.x.toFixed(0) + ", " + pt.y.toFixed(0); // + " Web Mercator";
			}
		 });
	}

	function mappoint_to_dms(point, leadingZero) {
		// Convert a map point to degrees, minutes, seconds. 
		// Return an array of latitude = arr[0] = 40° 30' 2.12345", longitude = arr[1]= 103° 25' 33.1122"
		// if leadingZero is true add 0 to left of min and sec
		var ddPoint;
		require(["esri/geometry/support/webMercatorUtils"],function(webMercatorUtils){
			ddPoint = webMercatorUtils.webMercatorToGeographic(point); // convert to lat long decimal degrees
		});
		return dd_to_dms(ddPoint, leadingZero);
	}
	
	function dd_to_dms(ddPoint, leadingZero) {
		// Convert a decimal degree point to degrees, minutes, seconds. 
		// Return an array of latitude = arr[0] = 40° 30' 2.12345", longitude = arr[1]= 103° 25' 33.1122"
		// if leadingZero is true add 0 to left of min and sec
		var lonAbs = Math.abs(Math.round(ddPoint.x * 1000000.0));
		var latAbs = Math.abs(Math.round(ddPoint.y * 1000000.0));
		var degY = Math.floor(latAbs / 1000000) + '° ';
		var minY = Math.floor(  ((latAbs/1000000) - Math.floor(latAbs/1000000)) * 60)  + '\' ';
		var secY = Math.floor( Math.floor(((((latAbs/1000000) - Math.floor(latAbs/1000000)) * 60) - Math.floor(((latAbs/1000000) - Math.floor(latAbs/1000000)) * 60)) * 100000) *60/100000 ) + '"'; // latitude
		if (leadingZero && minY.length == 3) minY = "0" + minY; // add leading zero so it does not shake
		if (leadingZero && secY.length == 2) secY = "0" + secY; // add leading zero so it does not shake
		var y = degY + minY + secY;
		var	degX = Math.floor(lonAbs / 1000000) + '° ';
		var minX = Math.floor(  ((lonAbs/1000000) - Math.floor(lonAbs/1000000)) * 60)  + '\' ';
		var secX = Math.floor( Math.floor(((((lonAbs/1000000) - Math.floor(lonAbs/1000000)) * 60) - Math.floor(((lonAbs/1000000) - Math.floor(lonAbs/1000000)) * 60)) * 100000) *60/100000 ) + '"'; // longitude
		if (leadingZero && minX.length == 3) minX = "0" + minX; // add leading zero so it does not shake
		if (leadingZero && secX.length == 2) secX = "0" + secX; // add leading zero so it does not shake
		var x = degX + minX + secX;
		return [y,x];
	}

	function mappoint_to_dm(point, leadingZero) {
		// Convert a map point to degrees, decimal minutes.
		// Return an array of latitude = arr[0] = 40° 30.12345', longitude = arr[1]= 103° 25.24567'
		// if leadingZero is true add 0 to left of min and sec
		var ddPoint;
		require(["esri/geometry/support/webMercatorUtils"],function(webMercatorUtils){
			ddPoint = webMercatorUtils.webMercatorToGeographic(point);
		});
		let pointArr = [];
		pointArr = dd_to_dm(ddPoint, leadingZero);
		return pointArr;
	}
	
	function dd_to_dm(ddPoint, leadingZero) {
		// Convert a decimal degree point to degrees, decimal minutes.
		// Return an array of latitude = arr[0] = 40° 30.12345', longitude = arr[1]= 103° 25.24567'
		// if leadingZero is true add 0 to left of min and sec
		var lonAbs = Math.abs(Math.round(ddPoint.x * 1000000.0));
		var latAbs = Math.abs(Math.round(ddPoint.y * 1000000.0));
		var degY = Math.floor(latAbs / 1000000) + '° ';
		//var minY = Math.floor(  ((latAbs/1000000) - Math.floor(latAbs/1000000)) * 60)  + '\' '; // truncate minutes
		var minY = (((latAbs/1000000) - Math.floor(latAbs/1000000)) * 60).toFixed(5)  + '\' '; // decimal minutes
		if (leadingZero && minY.indexOf(".") == 1) minY = "0" + minY; // add leading zero so it does not shake
		var y = degY + minY;
		var	degX = Math.floor(lonAbs / 1000000) + '° ';
		//var minX = Math.floor(  ((lonAbs/1000000) - Math.floor(lonAbs/1000000)) * 60)  + '\' '; // truncate minutes
		var minX = (((lonAbs/1000000) - Math.floor(lonAbs/1000000)) * 60).toFixed(5)  + '\' '; // decimal minutes
		if (leadingZero && minX.indexOf(".") == 1) minX = "0" + minX; // add leading zero so it does not shake
		var x = degX + minX;
		return [y,x];
	}

	function dms_or_dm_to_dd(str) {
		// takes a degree, minute, second point as "40:30:20.44,104:20:5"
		// or a degree, decimal minute as "40:30.1,104:20.01"
		// and returns and array. 
		// array[0] is lat in decimal degrees
		// array[1] is long in decimal degrees
		// array[2] is label in deg, min, sec as: 40° 30' 20.44" N, 104° 20' 5" W 
		// or in degrees, decimal minutes as: 40° 30.1' N, 104° 20.01' W
		var pos,pos2,pointX,pointY;
		pointY = str.substring(0,str.indexOf(","));
		pointX = str.substring(str.indexOf(",")+1,str.length);
		pos = pointX.indexOf(":");
		if (pos == -1) {
			alert("Missing ':'. Must be in the formate 40:0:0,103:0:0 or 40:0,103:0","Warning");
			return null;
		}
		var degX = Number(pointX.substring(0,pos));
		// switch from long, lat to lat, long
		if (!((degX >= -110 && degX <= -100) || (degX >= 100 && degX <= 110))) {
			var tmp;
			tmp = pointY;
			pointY = pointX;
			pointX = tmp;
			pos = pointX.indexOf(":");
			degX = Number(pointX.substring(0,pos));
		}
		var secX = 0;
		var minX;

		// if Seconds. Check if dms or degrees decimal minutes
		pos2 = pointX.substring(pos+1).indexOf(":");
		if (pos2 > -1) {
			minX = Number(pointX.substr(pos+1, pos2));
			secX = Number(pointX.substring(pos+pos2+2));
		}
		else minX = Number(pointX.substring(pos+1));
		// if degX is the longitude value and it is negative subtract the numbers 11/6/20
		if (degX < 0)
			pointX = Number(degX) - Number(minX)/60 - Number(secX)/3600;
		else
			pointX = Number(degX) + Number(minX)/60 + Number(secX)/3600;
		if (pointX >= 100 && pointX <= 110) pointX = pointX*-1;
		
		pos = pointY.indexOf(":");
		if (pos == -1) {
			alert("Missing ':'. Must be in the formate 40:0:0,103:0:0 or 40:0,103:0","Warning");
			return null;
		}
		var degY = Number(pointY.substring(0,pos));
		var secY = 0;
		var minY;

		// if Seconds. Check if dms or degrees decimal minutes
		pos2 = pointY.substring(pos+1).indexOf(":");
		if (pos2 > -1) {
			minY = Number(pointY.substr(pos+1, pos2));
			secY = Number(pointY.substring(pos+pos2+2));
		}
		else minY = Number(pointY.substring(pos+1));
		// if degY is the longitude value and it is negative subtract the numbers 11/6/20
		if (degY < 0)
			pointY = Number(degY) - Number(minY)/60 - Number(secY)/3600;
		else
			pointY = Number(degY) + Number(minY)/60 + Number(secY)/3600;
		label = degY+'° ' +minY+ '\' ';
		if (secY > 0) label += secY + '" N, ';
		else label += " N, ";
		if (pointY >= 100 && pointY <= 110) pointY = pointY*-1;
		label += degX+'° ' +minX+ '\' ';
		if (secX > 0) label += secX + '" W';
		else label += " W";
		
		if (!((pointX >= -110 && pointX <= -100) && (pointY >= 35 && pointY <= 42))) {
			alert("This point is not in Colorado. Latitude of 35 - 42. Longitude of 100 - 110.","Warning");
			return null;
		}
		return [pointY,pointX,label];
	}
	
	
	//**************************
	// Show/Hide loading image
	//**************************
	function showLoading() {
		esri.show(loading);
		map.disableMapNavigation();
		map.hideZoomSlider();
	}
	function hideLoading() {
		esri.hide(loading);
		map.enableMapNavigation();
		map.showZoomSlider();        
	}
	// end show loading image functions


	//*************************************************************
	// Show/Hide Menu button toggle to show or hide the left pane
	//*************************************************************
	/*function toggleLeftPane() {
		require(["dojo/dom","dijit/registry"], function(dom,registry){
			var menu = dom.byId('leftPane');
			var menuBtn = dom.byId("menuBtn");
			var mapWin = dom.byId('mapDiv');
			var resizeTimer, ovResizeTimer;;
			// Show Menu
			if (menu.style.display == 'none')
			{
				dom.byId("ovMap").style.zIndex = -1;
				registry.byId("ovMap").show();
				menu.style.display = 'block';
				dom.byId("menuBtn_label").innerHTML="<";
				menuBtn.title = "Close Menu";
				registry.byId('mainWindow').resize();
				//clear any existing resize timer
				resizeTimer;
				clearTimeout(resizeTimer);
				//create new resize timer with delay of 500 milliseconds
				resizeTimer = setTimeout(function () {
					registry.byId("ovMap").resize();
					clearTimeout(ovResizeTimer);
					ovResizeTimer = setTimeout(function(){
						registry.byId("ovMap").hide();
						dom.byId("ovMap").style.zIndex = 99;
					}, 500);
				}, 500);
			}
			// Hide Menu
			else
			{
				dom.byId("ovMap").style.zIndex = -1;
				registry.byId("ovMap").show();
				menu.style.display = 'none';		
				dom.byId("menuBtn_label").innerHTML=">";
				menuBtn.title = "Open Menu";
				registry.byId('mainWindow').resize();
				//clear any existing resize timer
				clearTimeout(resizeTimer);
				//create new resize timer with delay of 500 milliseconds
				resizeTimer = setTimeout(function () {
					registry.byId("ovMap").resize();
					var ovResizeTimer;
					clearTimeout(ovResizeTimer);
					ovResizeTimer = setTimeout(function(){
						registry.byId("ovMap").hide();
						dom.byId("ovMap").style.zIndex = 99;
					}, 500);
				}, 500);
			}
		});
	  }*/
	  
	// Find a Place clear graphics
	function removeSearchItem(){
		// called from index.html
		if (searchGraphicsCount.length == 0) return;
		//map.getLayer(searchGraphicsCount.pop()).clear();
		//Fade graphic out
		var gl = searchGraphicsCount.pop();
		map.getLayer(gl).setOpacity(0.3);
		var t = window.setTimeout(function(){
			map.getLayer(gl).clear();
			window.clearTimeout(t);
			gl=null;
		},2000);
		if (searchGraphicsCount.length == 0) {
			document.getElementById("findClear").style.opacity = 0.2;
			document.getElementById("findClear").style.filter = "alpha(opacity=20)";
		}		
	}

	function showSearchHelp(){
		document.getElementById('search_help').style.display='block';
	}
	function hideSearchHelp(){
		document.getElementById('search_help').style.display='none';
		//document.getElementById('search_help_button').style.backgroundColor='#666';
	}
	  
	function loadPage(url) {
		window.location.assign(url);
	}
	  
	  // Cookies and localStorage. localStorage works in HTML5 and does not have the limit of 4k of data per domain. It can hold 5MB.
	  function getCookie(cname) {
		// returns null if not found. Make it return "" like it used to.
		if (typeof(Storage) == "undefined") 
			getCookie2(cname);
		else {
			try {
				var result = localStorage.getItem(cname);
				if (!result) return "";
				else return result;
			}
			catch(e){
				alert("Warning: Your browser doesn't accept cookies. Failed to read user preferences and bookmarks. See Help/Troubleshooting/Losing Your Saved Preferences for help on how to set your browser to accept cookies.","Warning");
				return "";
			}
		}
	  }
	  
	  function setCookie(cname, cvalue) {
		if (typeof(Storage) == "undefined") 
			setCookie2(cname);
		else {
		  try{
			localStorage.setItem(cname,cvalue);
		  }
		  catch(e){
			alert("Warning: Saving user preferences and bookmarks requires non-private browser mode. Please set this mode and try again. Also, this may be caused by your browser not accepting cookies. See Help/Troubleshooting/Losing Your Saved Preferences for help on how to set your browser to accept cookies.","Warning");
		  }
		}
	  }
	  
	  function deleteCookie(cname) {
		if (typeof(Storage) == "undefined") 
			deleteCookie2(cname);
		else {
			localStorage.removeItem(cname);
		}
	  }
	  
	  // Use the old html cookie
	  function getCookie2(cname)
	  {
		try{
			var name = cname + "=";
			var ca = document.cookie.split(';');
			for(var i=0; i<ca.length; i++)
			{
			  var c = ca[i].trim();
			  if (c.indexOf(name)==0) return c.substring(name.length,c.length);
			}
			return "";
		}
		catch(e){
			alert("Warning: Your browser doesn't accept cookies. Failed to read user preferences and bookmarks. See Help/Troubleshooting/Losing Your Saved Preferences for help on how to set your browser to accept cookies.","Warning");
			return "";
		}
	  }
	  
	  function deleteCookie2( name ) {
		document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax;';
	  }
	  
	  function setCookie2(cname, cvalue) {
		try{
			// Delete if already exists
			if (getCookie2(cname) != "") deleteCookie2(cname);
			// Add or replace cookie
			var exdate=new Date();
			// Set expire date to 20 years from now
			exdate.setDate(exdate.getDate() + 20*365);
			cvalue = cvalue+"; expires="+exdate.toUTCString();
			document.cookie = cname + "=" + cvalue;
		}
		catch(e){
			alert("Warning: Saving user preferences and bookmarks requires non-private browser mode. Please set this mode and try again. Also, this may be caused by your browser not accepting cookies. See Help/Troubleshooting/Losing Your Saved Preferences for help on how to set your browser to accept cookies.","Warning");
		}
	  }
	  
	  // Drawing
	  function addLabel(point, label, graphicsLayer, fontsize) {
		  // Adds a label to the map at the given point, fontsize = "11pt"
		  // graphicsName is the name for this graphics layer. For example: searchgraphics or drawgraphics
		  // graphicsCounter is the searchGraphicsCounter or drawGraphicsCounter so it can erase the last added layer
		  // graphicsArr is an array of graphics names
		  require(["esri/graphic", "esri/symbols/Font", "esri/symbols/TextSymbol",
				"dojo/_base/Color"], function (
				Graphic, Font, TextSymbol, Color) {
			label = label.replace("/n"," "); // replace carriage returns with space for flex bookmarks
			var yellow = new Color([255,255,153,1.0]);
			var font = new Font(
				fontsize,
				Font.STYLE_NORMAL, 
				Font.VARIANT_NORMAL,
				Font.WEIGHT_BOLDER,
				"Helvetica"
			);
			
			var text = new TextSymbol(label,font,new Color("black"));
			text.setOffset(0,-23);
			var highlight1 = new TextSymbol(label,font,yellow);
			highlight1.setOffset(1,-25);
			var highlight2 = new TextSymbol(label,font,yellow);
			highlight2.setOffset(0,-24);
			var highlight3 = new TextSymbol(label,font,yellow);
			highlight3.setOffset(0,-22);
			var highlight4 = new TextSymbol(label,font,yellow);
			highlight4.setOffset(-1,-21);
			var highlight5 = new TextSymbol(label,font,yellow);
			highlight5.setOffset(2,-23);
			var highlight6 = new TextSymbol(label,font,yellow);
			highlight6.setOffset(-2,-23);
			
			graphicsLayer.add(new Graphic(point.geometry, highlight1));
			graphicsLayer.add(new Graphic(point.geometry, highlight2));
			graphicsLayer.add(new Graphic(point.geometry, highlight3));
			graphicsLayer.add(new Graphic(point.geometry, highlight4));
			graphicsLayer.add(new Graphic(point.geometry, highlight5));
			graphicsLayer.add(new Graphic(point.geometry, highlight6));
			graphicsLayer.add(new Graphic(point.geometry, text));
			map.addLayer(graphicsLayer);
			graphicsLayer.refresh();
		});
	}
	
	//************************
	//     Array Functions
	//************************
	function sortArrayOfObj(item) {
	// Sort an array of objects by field
	// Example: 
	// arr = [{city: 'Fort Collins', county: 'Larimer'},
	//        {city: 'Boulder', county: 'Boulder'}]
	// To sort by city use: arr.sort(sortArrOfOj('city'));
		return function (a,b) {
			// if GMU### sort numerically
			if (a[item] && a[item].substr(0,4) == "GMU ")
				return parseInt(a[item].substring(4)) - parseInt(b[item].substring(4));
			return (a[item] < b[item]) ? -1 : (a[item] > b[item]) ? 1: 0;
		};
	}
	function sortMultipleArryOfObj() {
	// Sort an array of objects by multiple fields
	// Example:
	// // arr = [{city: 'Fort Collins', county: 'Larimer'},
	//        {city: 'Boulder', county: 'Boulder'}]
	// arr.sort(sortMultipleArryOfObj("county","city",...));
		/*
		 * save the arguments object as it will be overwritten
		 * note that arguments object is an array-like object
		 * consisting of the names of the properties to sort by
		 */
		var props = arguments;
		if (arguments[0].constructor === Array) props = arguments[0];
		return function (obj1, obj2) {
			var i = 0, result = 0, numberOfProperties = props.length;
			/* try getting a different result from 0 (equal)
			 * as long as we have extra properties to compare
			 */
			while(result === 0 && i < numberOfProperties) {
				result = sortArrayOfObj(props[i])(obj1, obj2);
				i++;
			}
			return result;
		};
	}
	Array.prototype.moveUp = function(value, by) {
		// Rearrange items in an array. Move up so many positions (by).
		// For example:
		//   var street = items[1];
		//   items.moveUp(street,1); // move up by 1
		var index = this.indexOf(value),     
			newPos = index - (by || 1);
		
		if(index === -1) 
			throw new Error("Element not found in array");
		
		if(newPos < 0) 
			newPos = 0;
			
		this.splice(index,1);
		this.splice(newPos,0,value);
	};	
	Array.prototype.moveTo = function(value, newPos) {
		// Rearrange items in an array. Move to new position.
		// For example:
		//   var street = items[1];
		//   items.moveTo(street,0); // move to position 0
		var index = this.indexOf(value);    
		
		if(index === -1) 
			throw new Error("Element not found in array");
		
		if(newPos < 0) 
			newPos = 0;
			
		this.splice(index,1);
		this.splice(newPos,0,value);
	};

	// detect mobile
	function detectmob() { 
	//  || navigator.userAgent.match(/iPad/i)
	 if( navigator.userAgent.match(/Android/i) ||
	 	navigator.userAgent.match(/webOS/i) ||
	 	navigator.userAgent.match(/iPhone/i) ||
	 	navigator.userAgent.match(/iPod/i) ||
	 	navigator.userAgent.match(/BlackBerry/i) ||
	 	navigator.userAgent.match(/Windows Phone/i)
	 ){
		return true;
	  }
	 else {
		return false;
	  }
	}