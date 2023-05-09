		//**************************
		// XML Functions
		//**************************
		function createXMLhttpRequest() {
			var xmlhttp;
			// Create an XMLHttpRequest object and return it
			if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
				xmlhttp=new XMLHttpRequest();
			}
			else {// code for IE6, IE5
				try {
					xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
				}
				catch (e){
					alert("ActiveX is turned off. Please Enable or upgrade your browser. System Message :"+e.message,"Warning");
				}
			}
			return xmlhttp;
		}
		
		function createXMLdoc(xmlhttp) {
			// Pass in xml in text string txt and create a DOMParser. IE 9 does not support responseXML.
			// Return the DOMParser
			// Call it as follows: xmlDoc = createXMLdoc(xmlhttp);
			var txt;
			if (xmlhttp.responseXML)
				return xmlhttp.responseXML;
			else if (window.DOMParser) // IE9+, Chrome 1+, Firefox 1+, Opera 8+, Safari 3.2+
			{
				txt = xmlhttp.responseText;
				parser=new DOMParser();
				return parser.parseFromString(txt,"text/xml");
			}
			else if(window.ActiveXObject) // Internet Explorer < 9
			{
				try {
					txt = xmlhttp.responseText;
					var xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
					xmlDoc.async=false;
					xmlDoc.loadXML(txt);
					return xmlDoc;
				}
				catch (e) {
					alert("ActiveX is turned off. Please Enable or upgrade your browser. System Message :"+e.message,"Warning");
				}
			}
			else
				alert ("Cannot parse XML. Your browser may be too old.","Warning");
		}
		function createXMLparser(txt) {
			// Pass in xml in text string txt and create a DOMParser. IE 9 does not support responseXML.
			// Return the DOMParser
			// Call it as follows: xmlDoc = createXMLparser(xmlhttp.responseText);
			// Used by search.js because it parses the text before calling this.
			if (window.DOMParser) // IE9+, Chrome 1+, Firefox 1+, Opera 8+, Safari 3.2+
			{
				parser=new DOMParser();
				xmlDoc=parser.parseFromString(txt,"text/xml");
			}
			else if(window.ActiveXObject) // Internet Explorer < 9
			{
				try {
					xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
					xmlDoc.async=false;
					xmlDoc.loadXML(txt);
				}
				catch (e) {
					alert("ActiveX is turned off. Please Enable or upgrade your browser. System Message :"+e.message,"Warning");
				}
			}
			else
				alert ("Cannot lookup identify information. Your browser may be too old.","Warning");
			return xmlDoc;
		}
		
				//CREATING MULTIPLE XMLHTTPREQUEST OBJECTS FOR EACH CALL
		//THIS WILL HELP YOU NOT JAM YOUR SERVER WITH MULTIPLE REQUESTS AT ONCE. 
		//Globals:
		//	var index=0;
		//	var XMLHttpRequestObjects= new Array();
		function createMultiXMLhttpRequest()
		{
			if(window.XMLHttpRequest)
			{
				XMLHttpRequestObjects.push(new XMLHttpRequest());
			}
			else if(window.ActiveXObject)
			{
				try {
					XMLHttpRequestObjects.push(new ActiveXObject("Microsoft.XMLHTTP"));
				}
				catch (e){
					alert("ActiveX is turned off. Please Enable or upgrade your browser. System Message :"+e.message);
				}
			}
			index = XMLHttpRequestObjects.length -1;
		}