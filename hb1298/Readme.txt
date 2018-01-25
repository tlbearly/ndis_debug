				HB1298 Reports
				   12-9-11
				Tammy Bearly


There are two ways start the HB1298 Habitat Assessment Tool at a well location. 

1)  To zoom to an X,Y point and label it:
	Zooms to a longitude, latitude in decimal degrees.
	http://.../hb1298/index.aspx?place=104,40&label=the%20well
	Where %20 is a space.  This is necessary if you are calling it from another web page.
	If you are typing it in the browser a space will work fine.

	If the point is not in decimal degrees or UTM Nad 83 Zone 13, you must specify
	the projection by adding prj=######.

	For example:
	http://.../hb1298/index.aspx?place=1142407,4518281&prj=26912&label=your label
	     (zooms to a point in UTM Nad 83 Zone 12 projection)

	The following projections are available:
	4326  - longitude, latitude in decimal degrees
	26712 - UTM Nad27 Zone 12
	26713 - UTM Nad27 Zone 13
	26912 - UTM Nad83 Zone 12
	26913 - UTM Nad83 Zone 13
	32612 - UTM WGS84 Zone 12
	32613 - UTM WGS84 Zone 13



2)  To zoom to a well id and label it:

	http://.../hb1298/index.aspx?keyword=wellid&value=00108914&label=00108914

	The keyword, mapservice, and field name are set up in url.xml.
	The label can be anything you want. The value is used to look up the x,y point
	from the mapservice and field.


The HB1298 Report link or dialog box on the left panel contains three ways to acess the HB1298 Report
at a location.  The first is at an XY Location.  Click on the first tab if it is not active.  This
allows you to enter a label that will be displayed on the map at the well site, select a point format,
and enter your point.  The Clear button will remove the point from the map.  The Generate Report button
will zoom into your point, turn on RSO and SWH activity areas that are found at the location, and then
open a new window with the pdf report.

The second way is by Well ID.  Click on the Well ID tab.  Enter the Well ID.  This is the link_fld
field in the geodatabase.  The Clear button will remove the point from the map.  The Generate Report button
will zoom into your point, turn on RSO and SWH activity areas that are found at the location, and then 
open a new window with the pdf report.

The third way is to select the location by clicking on the map.  Click on the Select on Map tab.  The
Selected Tool, displayed on the bar above the map, will change from Move Map to Input Location.  Enter
a Well Label.  Click on the location on the map.  You label will be added to the map, RSO and SWH activity
areas that are found at the location will be turned on.  Note, the map will not change zoom level.  It
is assumed you are happy with the map scale.  It will open a new window with the pdf report.  Press Clear
to remove the label from the map.  The Selected Tool will be reset to Move Map.  If you would like to enter
another location select the point button and then click the new location on the map.  Another window will
open with this report.