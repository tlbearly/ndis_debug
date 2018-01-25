function createXMLhttpRequest(){var xmlhttp;if(window.XMLHttpRequest){xmlhttp=new XMLHttpRequest();}
else{try{xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");}
catch(e){alert("ActiveX is turned off. Please Enable or upgrade your browser. System Message :"+e.message,"Warning");}}
return xmlhttp;}
function createXMLdoc(xmlhttp){var txt;if(xmlhttp.responseXML)
return xmlhttp.responseXML;else if(window.DOMParser)
{txt=xmlhttp.responseText;parser=new DOMParser();return parser.parseFromString(txt,"text/xml");}
else if(window.ActiveXObject)
{try{txt=xmlhttp.responseText;var xmlDoc=new ActiveXObject("Microsoft.XMLDOM");xmlDoc.async=false;xmlDoc.loadXML(txt);return xmlDoc;}
catch(e){alert("ActiveX is turned off. Please Enable or upgrade your browser. System Message :"+e.message,"Warning");}}
else
alert("Cannot parse XML. Your browser may be too old.","Warning");}
function createXMLparser(txt){if(window.DOMParser)
{parser=new DOMParser();xmlDoc=parser.parseFromString(txt,"text/xml");}
else if(window.ActiveXObject)
{try{xmlDoc=new ActiveXObject("Microsoft.XMLDOM");xmlDoc.async=false;xmlDoc.loadXML(txt);}
catch(e){alert("ActiveX is turned off. Please Enable or upgrade your browser. System Message :"+e.message,"Warning");}}
else
alert("Cannot lookup identify information. Your browser may be too old.","Warning");return xmlDoc;}
function createMultiXMLhttpRequest()
{if(window.XMLHttpRequest)
{XMLHttpRequestObjects.push(new XMLHttpRequest());}
else if(window.ActiveXObject)
{try{XMLHttpRequestObjects.push(new ActiveXObject("Microsoft.XMLHTTP"));}
catch(e){alert("ActiveX is turned off. Please Enable or upgrade your browser. System Message :"+e.message);}}
index=XMLHttpRequestObjects.length-1;}