var errBoxTimer=null;
navigator.sayswho = (function () {
	var ua = navigator.userAgent,
	tem,
	M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
	if (/Trident/i.test(M[1])) {
		tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
		return 'IE ' + (tem[1] || '');
	}
	if (M[1] === 'Chrome') {
		// Check for Opera
		tem= ua.match(/\bOPR\/(\d+)/);
        if(tem!= null) return 'Opera '+tem[1];
		// Check for Edge
		tem=ua.match(/Edge\/(\d+)/i);
		if(tem != null) return "Edge "+tem[1];
	}
	M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
	if ((tem = ua.match(/version\/(\d+)/i)) != null)
		M.splice(1, 1, tem[1]);
	if (M[0] == "MSIE" && !document.all)
		return "IE 11";
	return M.join(' ');
})();
function alert() {
	// Arguments: message, title, error object, show X button?, fade?, mili-seconds before fade
	var msg,
	title = "DEBUG",
	theStack = "",
	email = "tamara.bearly@colostate.edu",
	showX = true,
	fade = false,
	sec = 10000;
	// Cancel fade error box because we received a new error message. errBoxTimer is set when fading the error box ater so many seconds
	if (errBoxTimer) {
		document.getElementById("errorMsg").innerHTML = ""; // Clear old message "Location tracking is ON"
		clearTimeout(errBoxTimer);
	}
	for (var i = 0; i < arguments.length; i++) {
		if (i == 0)
			msg = arguments[i];
		else if (i == 1)
			title = arguments[i];
		else if (i == 2 && arguments[i])
			theStack = arguments[i].stack;
		else if (i == 3)
			showX = arguments[i];
		else if (i == 4)
			fade = arguments[i];
		else if (i == 5)
			sec = arguments[i];
	}
	require(["dojo/dom", "dijit/registry"], function (dom, registry) {
		if (showX)
			dom.byId("errorXbtn").style.display = "block";
		else
			dom.byId("errorXbtn").style.display = "none";
		if (theStack && ~theStack.indexOf(' at '))
			theStack = theStack.split(" at ")[1];
		if (theStack && ~theStack.indexOf(' Anonymous function '))
			theStack = theStack.split(" Anonymous function ")[1];
		if (theStack)
			theStack = "\n" + theStack.split("\n")[0].split('<')[0];
		console.log(title + "  " + msg + "  " + theStack);
		if (theStack != "")
			msg += " Trace=" + theStack;
		if (title != "")
			msg = title + ": " + msg;
		if (dom.byId("errorMsg").innerHTML == msg)
			return;
		if (dom.byId("errorMsg").innerHTML != "")
			msg = "<br/>" + msg;
		dom.byId("errorMsg").innerHTML += msg;
		if (title.toLowerCase().indexOf("error") > -1) {
			var ref = document.referrer ? encodeURIComponent(document.referrer.substr(7)) : "none";
			var loc = document.location.href ? encodeURIComponent(document.location.href.substr(7)) : "unknown";
			loc = loc.replace(/%2520/g, "%20");
			ref = ref.replace(/%2520/g, "%20");
			msg = msg.replace(/'/g, "");
			if (title == "Data Error")
				email = "ndisadmin@nrel.colostate.edu";
			msg += "%0D%0A%0D%0AApp: " + app + "%0D%0AReferrer URL: " + ref + "%0D%0ACurrent URL: " + loc + "%0D%0ABrowser: " + navigator.sayswho + "%0D%0AOp Sys: " + navigator.platform + "%0D%0ABrowser Info: " + navigator.userAgent + "%0D%0A";
			dom.byId("errorMsg").innerHTML += " <a href='mailto:" + email + "?subject=Mobile " + app + ": " + title + "&body=" + msg + "'/><button class='mblButton' data-dojo-type='dojox/mobile/Button'>Report</button></a><br/>";
		}
		registry.byId("errorMsgBox").show();
		if (fade) {
			errBoxTimer = setTimeout(function () {
				require(["dijit/registry", "dojo/dom"], function (registry, dom) {
					registry.byId("errorMsgBox").hide();
					dom.byId("errorMsg").innerHTML = "";
					errBoxTimer=null;
				});
			}, sec);
		}
	});
}
function closeAlert() {
	require(["dojo/dom", "dijit/registry"], function (dom, registry) {
		dom.byId('errorMsg').innerHTML = '';
		registry.byId("errorMsgBox").hide();
	});
}
