function loadDisclaimer(title){try{var xmlhttp=createXMLhttpRequest();var configFile=app+"/SplashWidget.xml?v="+ndisVer;xmlhttp.onreadystatechange=function(){if(xmlhttp.readyState==4&&xmlhttp.status==200){require(["dojo/dom","dijit/registry"],function(dom,registry){var xmlDoc=createXMLdoc(xmlhttp);if(!xmlDoc)return;if(xmlDoc.getElementsByTagName("disable")[0]&&xmlDoc.getElementsByTagName("disable")[0].childNodes[0].nodeValue=="yes")return;var myDialog=registry.byId("disclaimerDialog");var theContent=dom.byId("disclaimerContent");var cont=null;if(xmlDoc.getElementsByTagName("content")[0]){if(xmlDoc.getElementsByTagName("content")[0].textContent)
cont=xmlDoc.getElementsByTagName("content")[0].textContent;else if(xmlDoc.getElementsByTagName("content")[0].childNodes[0]&&xmlDoc.getElementsByTagName("content")[0].childNodes[0].nodeValue)
cont=xmlDoc.getElementsByTagName("content")[0].childNodes[0].nodeValue;}
if(cont){theContent.innerHTML=cont;drawing=true;myDialog.show();}
else alert("Missing content tag in "+app+"/SplashWidget.xml file.","Data Error");});}
else if(xmlhttp.status==404){alert("Missing "+app+"/SplashWidget.xml file.","Data Error");}
else if(xmlhttp.readyState===4&&xmlhttp.status===500){alert("Error reading "+app+"/SplashWidget.xml file.","Data Error");}}
xmlhttp.open("GET",configFile,true);xmlhttp.send(null);}
catch(e){alert("Error in javascript/disclaimer.js reading "+app+"/SplashWidget.xml file. Error message: "+e.message+".","Code Error",e);}}