<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" >
<head>
	<style type="text/css"> 
	@import "assets/css/help.css";
	</style>
	<title>Advanced Help</title>
	<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" >
</head>
<body>

<table class="header"> <!---->
<tr class="banner" colspan="2">
<td class="logo"> <!---->
<center><img border="0" src="/assets/images/cpwseal.png"></center>
</td>
<td class="banner"> <!---->
<p class="heading">Advanced Help <br>
<font size='5'><%=Request.Querystring("subtitle")%></font>
</td></tr>
</table>

<table><tr>
<td>
<h4><a href="<%=Request.Querystring("app")%>/help.html">Help</a> &#149;
	<a href="<%=Request.Querystring("app")%>/definitions.html">Map Information</a></h4>

	        <H3>Map Navigation Hot Keys</H3>
	        <ul>
	        	<li>Zoom In: double click, mouse wheel, or shift drag for rubberband zoom in.</li>
	        	<li>Zoom Out: mouse wheel</li>
	        	<li>Pan: click drag</li>
	        	<li>Identify: click</li>
	        </ul> 
	    	<H3>Statup Options</H3>
	    	<ul>
	    		<li>
	    		<H5>Extent: </H5>To start at a certain extent add this to the url:
		    	<%=Request.Querystring("app")%>/index.aspx?extent=xmin,ymin,xmax,ymax<br>
		    	where xmin,ymin,xmax,ymax are numbers in NAD83 zone 13 projection or longitude, latitude WGS 84 decimal degrees.<br>
	  			To specify the extent in another projection add &prj=projection #.<br>
	    		Examples: 
	    			<ul>
	    				<li><%=Request.Querystring("app")%>/index.aspx?extent=395612,4519265,513379,4462957 &nbsp;&nbsp;&nbsp;&nbsp;(zooms to an extent using the default projection of NAD83 zone 13)</li>
	    				<li><%=Request.Querystring("app")%>/index.aspx?extent=714030,4200330,810030,4305000&prj=26912 &nbsp;&nbsp;&nbsp;&nbsp;(zooms to an extent using the specified projection)</li>
		    			<li><%=Request.Querystring("app")%>/index.aspx?extent=-103.56,39.21,-103.95,40.1 &nbsp;&nbsp;&nbsp;&nbsp;(zooms to an extent using lat long projection)</li>	    	
		    		</ul>
	    		</li>
	    		<li><h5>Label and Zoom to a Place Name or Point: </h5>To zoom into a location add this to the url:
		    	<%=Request.Querystring("app")%>/index.aspx?place=location name or point<br>
		    	Use %20 in place of space if calling it from another website.<br>
	    		<u>Place Examples:</u>
	    			<ul>
	    				<li><%=Request.Querystring("app")%>/index.aspx?place=Fort Collins&nbsp;&nbsp;&nbsp;&nbsp;(zooms to the specified location)</li>
	    				<li><%=Request.Querystring("app")%>/index.aspx?place=Larimer County &nbsp;&nbsp;&nbsp;&nbsp;(zooms to the specified county)</li>
		    			<li><%=Request.Querystring("app")%>/index.aspx?place=gmu 2 &nbsp;&nbsp;&nbsp;&nbsp;(zooms to Game Management Unit 2)</li>
		    			<li><%=Request.Querystring("app")%>/index.aspx?place=Wellington SWA&nbsp;&nbsp;&nbsp;&nbsp;(zooms to specified State Wildlife Area)</li>
						<li><%=Request.Querystring("app")%>/index.aspx?place=Adams STL&nbsp;&nbsp;&nbsp;&nbsp;(zooms to specified State Trust Land)</li>
						<li><%=Request.Querystring("app")%>/index.aspx?place=Rifle Falls SFU&nbsp;&nbsp;&nbsp;&nbsp;(zooms to specified State Fishing Unit)</li>
					</ul>
				<u>Point Examples:</u>
					<ul>
	    				<li><%=Request.Querystring("app")%>/index.aspx?place=37.4015,-103.25 &nbsp;&nbsp;&nbsp;&nbsp;(zooms to a latitude, longitude in decimal degrees)</li>
						<li><%=Request.Querystring("app")%>/index.aspx?place=37:30:15,-103:25:41 &nbsp;&nbsp;&nbsp;&nbsp;(zooms to a latitude, longitude in degrees, minutes, seconds)</li>
						<li><%=Request.Querystring("app")%>/index.aspx?place=37:54.256,-103:44.21 &nbsp;&nbsp;&nbsp;&nbsp;(zooms to a latitude, longitude in degrees, decimal minutes)</li>
	    				<li><%=Request.Querystring("app")%>/index.aspx?place=300000,4200000 &nbsp;&nbsp;&nbsp;&nbsp;(zooms to a point in default projection UTM NAD83 zone13)</li>
						<li><%=Request.Querystring("app")%>/index.aspx?place=1142407,4518281&prj=26912 &nbsp;&nbsp;&nbsp;&nbsp;(zooms to a point in the specified projection)</li>
						<ul>
						Some example projections (prj=####) are listed below:
						<ul>
							4326 &nbsp;= WGS 1984 lat long<br>
							26712 = UTM NAD 1927 Zone 12N<br>
							26713 = UTM NAD 1927 Zone 13N<br>
							26912 = UTM NAD 1983 Zone 12N<br>
							26913 = UTM NAD 1983 Zone 13N<br>
							32612 = UTM WGS 1984 Zone 12N<br>
							32613 = UTM WGS 1984 Zone 13N<br>
						</ul></ul>
		    		</ul>
					<P>NOTE: the label and highlight can be removed by clicking on the "Clear" button in the Search for a Colorado Place search box.
					Uses .../ArcGIS/rest/services/GNIS_Loc/GeocodeServer map service. This map service is set in the config.xml file.</p>
			<p>
			<!--li><H5>Label and Zoom to a Point:</H5>
			To label a point add &label=my label.<br>
			For example:  <%=Request.Querystring("app")%>/index.aspx?place=-103.25,36.4015&label=my label<br>
			If you are calling this page from another website replace spaces with %20.</li-->

			
			<li><H5>Custom MapService</H5>
	  		To zoom to a place in a custom map service, add this to the end of the url:<br>
	    		<%=Request.Querystring("app")%>/index.aspx?map=[your custom map service]&field=[your field name]&value=[your value]<br/><br/>
				
				For example zoom to a zip code area using Esri's USA Zip Codes mapservice:<br/>
				&nbsp;&nbsp;<%=Request.Querystring("app")%>/index.aspx?map=http://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/<br/>
				&nbsp;&nbsp;USA_ZIP_Codes_2014/FeatureServer/0&field=Zip&value=80524<br/>
				
				<br/>For example zoom to Larimer County:<br>&nbsp;&nbsp;<%=Request.Querystring("app")%>/index.aspx?map=http://ndismaps.nrel.colostate.edu/ArcGIS/rest/services/<br/>
				&nbsp;&nbsp;HuntingAtlas/CHA_FindAPlaceTool_Data/MapServer/1&field=COUNTYNAME&value=larimer<br/><br/>
				Note: this map service must be a free Esri map service. Others may or may not work. For a list of Esri map services see: http://www.arcgis.com/home/gallery.html 
			</li>
			
			<li><h5>Custom Place Examples: (Internal CPW use)</h5>
			<ul>
				<li><%=Request.Querystring("app")%>/index.aspx?keyword=county&value=larimer</li>
				<li><%=Request.Querystring("app")%>/index.aspx?keyword=gmu&value=8</li>
				<li><%=Request.Querystring("app")%>/index.aspx?keyword=public&value=Milk Creek STL</li>
				<li><%=Request.Querystring("app")%>/index.aspx?keyword=poi&value=Dinosaur Welcome Center&label=Dinosaur Welcome Center</li>
				<li>hb1298/index.aspx?keyword=wellid&value=00108914&label=00108914</li>
			</ul>NOTE: These may be labeled, simply include &label=mylabel. If the keyword is a point and it has a label, it will be marked by a dot. The label and dot can be erased in the 'Search for a Colorado Place' widget.<p>
			The keywords are setup in a file in the application directory named url.xml.
			It has the format:<br>
			<ul>&lt;keyword&gt;  The key word to identify which mapservice and field to use.<br>
				&lt;url&gt; the url of the mapservice to use to get the boundary to zoom to.<br>
				&lt;expression&gt; The where query.<br>
				&lt;mapscale&gt; The map level to zoom to if a point. <br/>
				<ul>
				0 = 1:9M &nbsp;&nbsp;(actually 9244648.868618)<br/>
				1 = 1:4M &nbsp;&nbsp;(actually 4622324.434309)<br/>
				2 = 1:2M &nbsp;&nbsp;(actually 2311162.217155)<br/>
				3 = 1:1M &nbsp;&nbsp;(actually 1155581.108577)<br/>
				4 = 1:500k (actually 577790.554289)<br/>
				5 = 1:250k (actually 288895.277144)<br/>
				6 = 1:100k (actually 144447.638572)<br/>
				7 = 1: 50k (actually 72223.819286)<br/>
				8 = 1: 24k (actually 36111.909643) default<br/>
				9 = 1: 18k (actually 18055.954822)<br/>
				10 = 1:10k (actually 9027.977411)<br/>
				11 = 1:4k (actually 4513.988705)<br/>
				12 = 1:2k (actually 2256.994353)<br/>
				13 = 1:1k (actually 1128.497176)</ul><br/>
				&lt;label&gt; A label for the location.
			</ul>
			</li>
	    	</ul>
</td></tr>
</table>
</body>
</html>
