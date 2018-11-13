// Current Geo Location & Compass functions
// As of April 2016 Chrome M50 no longer allows unsecure origins. Must start with https:// Need to also modify esri to serve maps with https.

var wpid=false, z, prev_lat, prev_long;
//var min_speed=0, max_speed=0, min_altitude=0, max_altitude=0;
var  locGraphicsLayer=null, lastPoint=null;
var locSymbol, min_accuracy=4000;

// This function just adds a leading "0" to time/date components which are <10 (because there is no cross-browser way I know of to do this using the date object)
/*function format_time_component(time_component)
{
	if(time_component<10)
		time_component="0"+time_component;
	else if(time_component.length<2)
		time_component=time_component+"0";
	return time_component;
}*/

// This is the function which is called each time the Geo location position is updated
function geo_success(position)
{	
	//info_string="";
	//var mph=2.23693629;
	//var factor=3.2808399;
	//var d=new Date(); // Date object, used below for output message
	//var h=d.getHours();
	//var m=d.getMinutes();
	//var duration;
		
	//var current_datetime=format_time_component(h)+":"+format_time_component(m);
	// Check that the accuracy of our Geo location is sufficient for our needs
	if(position.coords.accuracy<=min_accuracy)
	{
		//alert("accuracy="+position.coords.accuracy);
		// We don't want to action anything if our position hasn't changed - we need this because on IPhone Safari at least, we get repeated readings of the same location with 
		// different accuracy which seems to count as a different reading - maybe it's just a very slightly different reading or maybe altitude, accuracy etc has changed
		if(prev_lat.toFixed(5)!=position.coords.latitude.toFixed(5) || prev_long!=position.coords.longitude.toFixed(5))
		{
			/*if((position.coords.speed*factor)>max_speed)
				max_speed=parseInt(position.coords.speed*mph);
			else if((position.coords.speed*factor)<min_speed)
				min_speed=parseInt(position.coords.speed*mph);
				
			if((position.coords.altitude*factor)>max_altitude)
				max_altitude=parseInt(position.coords.altitude*factor);
			else if((position.coords.altitude*factor)<min_altitude)
				min_altitude=parseInt(position.coords.altitude*factor);*/
			
			
			prev_lat=position.coords.latitude;
			prev_long=position.coords.longitude;

			// initialize start time & calculate duration
			/*if (startTime == null) startTime={h:h,m:m};
			var dh, dm;
			dm = m - startTime.m;
			dh = h - startTime.h;
			if (dm < 0){
				dh--;
				dm = 60 + dm;
			}
			if (dh < 0)
				dh = 24 +dh;
			duration=format_time_component(dh)+":"+format_time_component(dm);
		
			// Calculate Average Speed mph
			if (position.coords.speed > 0.1){
				speedCnt++;
				speed+=position.coords.speed*mph;
				avgSpeed = speed/speedCnt;
			}*/
			/*document.getElementById("posLat").innerHTML = position.coords.latitude.toFixed(5);
			document.getElementById("posLong").innerHTML = position.coords.longitude.toFixed(5);
			document.getElementById("posAcc").innerHTML = Math.round(position.coords.accuracy*1.0936133, 1);
			document.getElementById("alt").innerHTML = parseInt(position.coords.altitude*factor);
			document.getElementById("altAcc").innerHTML = Math.round(position.coords.altitudeAccuracy*factor,1);
			//document.getElementById("dur").innerHTML = duration;
			//document.getElementById("speed").innerHTML = avgSpeed.toFixed(1);
			//document.getElementById("locTable").style.display='block';
			op.innerHTML='';*/
			
			displayLocation(position);
		}
	}
	else{
		wpid=false;
		if (document.getElementById("menuView").style.left == "0px") {
			// show error when user has tried to turn it on, not on startup
			alert("Accuracy not sufficient (+/-"+Math.round(position.coords.accuracy, 1).numberFormat(0)+"m) for current location.","");
			// Set locate button to start tracking image
			document.getElementById("LocateButton").className="";
		}
		//if (info_string) op.innerHTML=info_string+"<br/><br/>";
	}
}

/*function outputDistance(evtObj){
	distance += evtObj.result.lengths[0];
	document.getElementById("dis").innerHTML = distance.toFixed(1);
}*/

//mark current location on map
function displayLocation(position) {
	require(["esri/layers/GraphicsLayer", "esri/geometry/Point","esri/symbols/PictureMarkerSymbol",
	"esri/graphic","esri/geometry/webMercatorUtils"], 
	function(GraphicsLayer,Point,PictureMarkerSymbol,Graphic,webMercatorUtils){
		try{
			if (!locGraphicsLayer) {
				locGraphicsLayer = new GraphicsLayer();
				map.addLayer(locGraphicsLayer);
				locSymbol = new PictureMarkerSymbol("assets/images/bluedot.png", 20, 20);
			}
			//clear existing graphics
			locGraphicsLayer.clear();
			var pt = webMercatorUtils.geographicToWebMercator(new Point(position.coords.longitude, position.coords.latitude));
			if (!lastPoint) map.centerAndZoom(pt, 7); // zoom in on start 4-19-17 Updated lods used to be 13.
			locGraphicsLayer.add(new Graphic(pt, locSymbol));
			lastPoint = pt;
		}
		catch(e){
			// Set locate button to start tracking image
			document.getElementById("LocateButton").className="";
			alert(e.message,"Error",e);
		}
	});
}

// This function is called each time navigator.geolocation.watchPosition() generates an error (i.e. cannot get a Geo location reading)
function geo_error(error)
{
//alert(error.message,"debug",error);
	switch(error.code)
	{
		case error.PERMISSION_DENIED:			
			if (wpid > 0) {
					alert("You have blocked this site from accessing your location. <button data-dojo-type='dojox/mobile/Button' class='mblButton' onclick=\"slideRight(document.getElementById('locationHelp'));closeAlert();document.getElementById('errorMsg').innerHTML=''\">Help</button>","");
			}
			navigator.geolocation.clearWatch(wpid);
			wpid=false;
			// Set locate button to stop tracking image
			document.getElementById("LocateButton").className="";
			break;
		case error.POSITION_UNAVAILABLE:
			if (wpid > 0) alert("Could not determine your location. <button data-dojo-type='dojox/mobile/Button' class='mblButton' onclick=\"slideRight(document.getElementById('locationHelp'));closeAlert();document.getElementById('errorMsg').innerHTML=''\">Help</button>","");
			// Set locate button to stop tracking image
			document.getElementById("LocateButton").className="";
			navigator.geolocation.clearWatch(wpid);
			wpid=false;
			break;
		case error.TIMEOUT:
			if (wpid > 0) alert("Could not determine your location. <button data-dojo-type='dojox/mobile/Button' class='mblButton' onclick=\"slideRight(document.getElementById('locationHelp'));closeAlert();document.getElementById('errorMsg').innerHTML=''\">Help</button>","");
			// Set locate button to start tracking image
			document.getElementById("LocateButton").className="";
			navigator.geolocation.clearWatch(wpid);
			wpid=false;
			break;
	}
}

function get_pos()
{
	// Set up a watchPosition to constantly monitor the geo location provided by the browser - NOTE: !! forces a boolean response
	// We  use watchPosition rather than getPosition since it more easily allows (on IPhone at least) the browser/device to refine the geo location rather than simply taking the first available position
	// Full spec for navigator.geolocation can be foud here: http://dev.w3.org/geo/api/spec-source.html#geolocation_interface	
	// First, check that the Browser is capable
	if(!!navigator.geolocation) {
		wpid=navigator.geolocation.watchPosition(geo_success, geo_error, {enableHighAccuracy:true, maximumAge:30000, timeout:27000});
	}
	else{
		alert("Your Browser doesn't support the Geo Location API.<br/><input type='checkbox' class='checkBoxButton' onClick='setCookie(\"noGeo\",\"1\");closeAlert();' />"+
			" Do not show this again.","");
		// Set locate button to start tracking image
		document.getElementById("LocateButton").className="";
	}
}


// Initialiser
function init_geo()
{
	// Handle Current Location Tracking on/off Switch
		// turn on
		if (document.getElementById("LocateButton").className.indexOf("tracking") == -1){
			// Reset values
			prev_lat=0;
			prev_long=0;
			lastPoint=null;
			// Set locate button to now tracking image
			document.getElementById("LocateButton").className="tracking";
			if (wpid) // If we already have a wpid which is the ID returned by navigator.geolocation.watchPosition()
			{
				navigator.geolocation.clearWatch(wpid);
				wpid=false;
			}
			else // Else...We should only ever get here when location button has been toggled on
			{
				//alert("Location tracking is ON","",null,false,true,2000);
				get_pos();
			}
		}
		// turn off
		else {
			// Set locate button to start tracking image
			document.getElementById("LocateButton").className="";
			navigator.geolocation.clearWatch(wpid);
			wpid=false;
			//alert("Location tracking is OFF","",null,false,true,2000);
			if (locGraphicsLayer)
				locGraphicsLayer.clear();
		}
}