When you upgrade the ESRI jsapi version you will need to make a local copy of the css files for mobile.
This is due the error: Uncaught DOMException: Failed to read the 'cssRules' property from 'CSSStyleSheet': Cannot access rules.

When update esri version download css files also, copy and paste code into Notepad. Put in directory matching the version. -->
These files can be downloaded from:
https://js.arcgis.com/3.27compact/dojox/mobile/themes/iphone/iphone.css
https://js.arcgis.com/3.27/esri/css/esri.css
https://js.arcgis.com/3.27compact/dojox/image/resources/image.css
https://js.arcgis.com/3.27/dijit/themes/soria/soria.css

In esri.css, search and replace url(" with url("https://js.arcgis.com/3.27/esri/dijit/
In soria.css, search and replace url(" with url("https://js.arcgis.com/3.27/dijit/themes/soria/
In image.css, search and replace url(" with url("https://js.arcgis.com/3.27compact/dojox/image/resources/
Because of an error on mobile, When update ESRI version, download css files also. Put in directory matching the version.
This is due the error: Uncaught DOMException: Failed to read the 'cssRules' property from 'CSSStyleSheet': Cannot access rules.

If you do not, there will be missing images and icons.