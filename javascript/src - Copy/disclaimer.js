function loadDisclaimer(title) {
	// If the app does not have a disclaimer remove the SplashWidget.xml file.
	try {
		// Read the SplashWidget.xml file to get layers to add
		var xmlhttp = createXMLhttpRequest();
		var configFile = app + "/SplashWidget.xml?v="+ndisVer;
		xmlhttp.onreadystatechange = function() {			
			if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
				var xmlDoc = createXMLdoc(xmlhttp);
				if (!xmlDoc) return; // no SplashWidget.xml file = do not show disclaimer
				if (xmlDoc.getElementsByTagName("disable")[0] && xmlDoc.getElementsByTagName("disable")[0].childNodes[0].nodeValue=="yes") return;
				var myDialog = document.getElementById("disclaimer");
				myDialog.children[0].innerHTML=title;
				var theContent = myDialog.children[1].children[0];
				var cont=null;
				
				if (xmlDoc.getElementsByTagName("content")[0]) {
					if (xmlDoc.getElementsByTagName("content")[0].textContent)
						cont = xmlDoc.getElementsByTagName("content")[0].textContent;
					else if (xmlDoc.getElementsByTagName("content")[0].childNodes[0] && xmlDoc.getElementsByTagName("content")[0].childNodes[0].nodeValue)
						cont = xmlDoc.getElementsByTagName("content")[0].childNodes[0].nodeValue;
				}	
				if (cont) {
					// add cookie notice
					cont += "<br/>This site uses cookies. By using this site you agree to our cookie policy which is that cookies are only used to save user preferences. No personal information is collected or stored.<br/>";
					theContent.innerHTML = cont;
					show("disclaimer");
				}
				else alert("Error: Missing content tag in "+app+"/SplashWidget.xml file.","Data Error");
			}
			else if (xmlhttp.status == 404 ) {
				alert("Error: Missing "+app+"/SplashWidget.xml file.","Data Error");
			}
			else if (xmlhttp.readyState===4 && xmlhttp.status===500) {
				alert("Error reading "+app+"/SplashWidget.xml file.","Data Error");
			}
		};
		xmlhttp.open("GET",configFile,true);
		xmlhttp.send(null);
	}
	catch(e) {
		alert("Error in javascript/disclaimer.js reading "+app+"/SplashWidget.xml file. Error message: "+e.message+".","Code Error",e);
	}
}