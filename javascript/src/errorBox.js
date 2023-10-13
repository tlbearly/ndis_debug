// Detect Browser
navigator.sayswho= (function(){
    var ua= navigator.userAgent, tem,
    M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if(/Trident/i.test(M[1])){
        tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
        return 'IE '+(tem[1] || '');
    }
    if(M[1]=== 'Chrome'){
        // Check for Opera
		tem= ua.match(/\bOPR\/(\d+)/);
        if(tem!= null) return 'Opera '+tem[1];
		// Check for Edge
		tem=ua.match(/Edge\/(\d+)/i);
		if(tem != null) return "Edge "+tem[1];
    }
    M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
    if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
    if (M[0] == "MSIE" && !document.all) return "IE 11";
	return M.join(' ');
})();
function checkMailTo(){
	// Added 2-20-19
	// When the Report button is clicked it uses href mailto:... to try to load the default mail application.
	// If it fails it does nothing. Trap for this and give instructions on how to set it up.
	var t;
	window.blur(function(){
		// The browser responded, so stop the timer
		clearTimeout(t);
	});
	t = setTimeout(function(){
		// The browser did not repond after 1/2 a second so display notice
		alert("You have not setup a default mail client for this browser. To report an error, send an email to ndisadmin@nrel.colostate.edu.","Notice");
	},500);
}
function oldversion(){
	var ua = navigator.userAgent, tem;
    var M = ua.match(/(Opera|Chrome|Safari|Firefox|MSIE|Trident(?=\/))\/?\s*(\d+)/i) || [];
    // IE
	if(/Trident/i.test(M[1])){
        tem= /\brv[ :]+(\d+)/g.exec(ua) || [];
        if (tem!=null && tem[1] && parseFloat(tem[1]) < 11) return true;
		else return false;
    }
	// Opera
    if(M[1]=== 'Chrome'){
        tem= ua.match(/\bOPR\/(\d+)/);
        if(tem!= null && parseFloat(tem[1]) < 30) return true;
		else return false;
    }
	M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
	if (M[0] == "Opera" && parseFloat(M[1]) < 30) return true;
	if (M[0] == "Chrome" && parseFloat(M[1]) < 43) return true;
	if (M[0] == "Safari" && parseFloat(M[1]) < 8) return true;
	if (M[0] == "Firefox" && parseFloat(M[1]) < 38) return true;
	if (M[0] == "MSIE" && !document.all) return false; // IE 11
	if (M[0] == "MSIE" && parseFloat(M[1]) < 11) return true;
	if (M[0] == "Trident" && parseFloat(M[1]) < 11) return true;
	return false;
}

// Error Popup
function alert(){
	// alert(msg, title, error object)
	var msg, title="Error Message", theStack="", email="ndisadmin@nrel.colostate.edu"; 
	for (var i=0; i<arguments.length; i++) {
		if (i==0) msg=arguments[i];
		else if (i==1) title=arguments[i];
		else if (i==2) theStack=arguments[i].stack; 
	}
    // get line number and function if available
	if(theStack && ~theStack.indexOf(' at ')) theStack = theStack.split(" at ")[1];
	if(theStack && ~theStack.indexOf(' Anonymous function ')) theStack = theStack.split(" Anonymous function ")[1];
	if (theStack) msg += "\n"+theStack.split("\n")[0].split('<')[0];

	console.log(msg);
	// do not show the same error message twice
	if (document.getElementById("errMsg").innerHTML.indexOf(msg) > -1) return;
	if (oldversion())
		document.getElementById("errMsg").innerHTML += msg+"<br/><br/>WARNING: Your browser appears to be old. Some functionality may not be available to you. Consider upgrading to the latest version.  Your browser was detected as: "+navigator.sayswho+"<br/><br/>";
	else
		document.getElementById("errMsg").innerHTML += msg+"<br/><br/>";
	if ((msg.toLowerCase().indexOf("error") > -1) || (title.toLowerCase().indexOf("error") > -1)){
		var ref = document.referrer ? encodeURIComponent(document.referrer.substring(7)) : "none";
		var loc = document.location.href ? encodeURIComponent(document.location.href.substring(7)) : "unknown";
		loc = loc.replace(/%2520/g,"%20"); // A space that has been encoded twice
		ref = ref.replace(/%2520/g,"%20");
		msg = msg.replace(/'/g, ""); // single quotes causing email to ndisadmin to be cut off
		if (title=="Code Error" || title=="URL Graphics Error" || title=="URL Extent Error") email="tamara.bearly@colostate.edu";
		msg += "%0D%0A%0D%0AApp: "+app+"%0D%0AReferrer URL: "+ref+"%0D%0ACurrent URL: "+loc+"%0D%0ABrowser: "+navigator.sayswho+"%0D%0AOp Sys: "+navigator.platform+"%0D%0ABrowser Info: "+navigator.userAgent+"%0D%0A";
		document.getElementById("errMsg").innerHTML +="<a href='mailto:"+email+"?subject="+app+": "+title+"&body="+msg+"' onClick='checkMailTo()'/>Email this error to ndisadmin</a><br/><br/>";
		
	}
	if (title == "Code Error") title="Error Message";
	document.getElementById("errorDialogTitle").innerHTML= title;//errorDialog.set("title", title);
	show("errorDialog");//errorDialog.show();
}