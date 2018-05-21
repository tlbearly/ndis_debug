<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">

<head>
    <link rel="stylesheet" type="text/css" href="assets/css/help.css" />
    <title>What's New</title>
    <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
    <link rel="stylesheet" type="text/css" href="assests/css/styles.css">

</head>

<body>
    <script language="vb" runat="server">
        Dim app As String
        Dim subtitle As String
        Sub Page_Load(Sender As Object, E as EventArgs)
            app = Server.HTMLEncode(Request.Querystring("app"))
            If((app.ToLower() <> "huntingatlas") AND (app.ToLower() <> "fishingatlas") AND (app.ToLower() <> "propertyfinder") AND (app.ToLower() <> "stockingrestrictions")) Then
                app = "huntingatlas"
            End If
            
            subtitle = Server.HTMLEncode(Request.Querystring("subtitle"))
            If((subtitle.ToLower() <> "Colorado Hunting Atlas") AND (subtitle.ToLower() <> "Colorado Fishing Atlas") AND (subtitle.ToLower() <> "Colorado Property Finder") AND (subtitle.ToLower() <> "Colorado Stocking Restrictions")) Then
                subtitle = "Colorado Hunting Atlas"
            End If
        End Sub
    </script>
    <table class="header">
        <!---->
        <tr class="banner" colspan="2">
            <td class="logo">
                <!---->
                <center><img border="0" src="assets/images/cpwseal.png"></center>
            </td>
            <td class="banner">
                <!---->
                <p class="heading">WHAT'S NEW <br>
                    <font size='5'>
                        <%=subtitle%>
                    </font>
            </td>
        </tr>
    </table>

    <table>
        <tr>
            <td>
                <h4><a href="<%=app%>/help.html">Help</a> &#149;
                    <a href="<%=app%>/definitions.html">Map Information</a></h4>

                <h2>Version 3.18 Released May 2018</h2>
                <ul>
                    <li><strong>What's New in the <%=subtitle%>:</strong><br/>
                        <ul>
                            <li>Loads as a secure site with https://</li>
                            <li>Fixed problem with location services not working with Chrome on mobile devices.</li>
                            <li>Fixed problem with SFU not found when accessed on the URL.</li>
                            <li>Moved Location Tracking (on mobile devices) to a toggle button below the zoomin / zoomout buttons. It was hard to find before, since it was in the menu.</li>
                        </ul>
                    </li>
                </ul>

                <h2>Version 3.11 Released April 2017</h2>
                <ul>
                    <li><strong>What's New in the <%=subtitle%>:</strong><br/>
                        <ul>
                            <li>Printing now saves to a geo pdf so that you can view your current location in the pdf without needing cell service.</li>
                            <li>Improved the "Search for a Colordo Place" suggestions drop down list. Now it gives suggestions as you type.</li>
                            <li>Fixed problem with PDFs not loading with new browser versions.</li>
                        </ul>
                    </li>
                </ul>

                <h2>Version 3.1 Released July 2016</h2>
                <ul>
                    <li><strong>What's New in the <%=subtitle%>:</strong><br/>
                        <ul>
                            <li><strong>Mobile ready Colorado Fishing Atlas</strong></li>
                            <li>Allows more way points to be stored in a bookmark.</li>
                            <li>New easier to understand clear button in "Search for a Colorado Place" search box.</li>
                            <li>In the Hunting Atlas, "Goto a GMU" and "Feature Search" will now search for bighorn sheep and mountain goat GMUs when their activity areas are visible in Map Layers &amp; Legend.</li>
                            <li>In the Hunting Atlas, fixed a problem printing the legend. Was displaying a legend of activity layers for all species. (e.g. In Map Layers &amp; Legend when you checked Game Species, it was not refreshing to the visible layers
                                of the default game species that was selected, hence in the printed legend, all of the activity layers would show up for all the species.)</li>
                            <li>Updated to dojo 1.10, jspdf, esri jsAPI 3.16 versions</li>
                            <li>CPW employees can now open a sublayer in Map Layers &amp; Legend on startup from the config.xml file using opensublayer attribute of the layer tag.</li>
                            <li>CPW employees can now add labels on startup. For example: huntingatlas/index.aspx?keyword=public&amp;value=Milk Creek STL&amp;label=Milk Creek State Trust Land</li>
                            <li>HB1298 user highlighted wells can be bookmarked and added on startup through the URL generated by maplink button. And fixed bug with keyword=wellid on the URL.</li>
                        </ul>
                    </li>
                </ul>

                <h2>Version 3.0 Released May 2015</h2>
                <ul>
                    <li><strong>What's New in the <%=subtitle%>:</strong><br/>
                        <ul>
                            <li>Rewritten so that it is faster and will work on Macs.</li>
                            <li>New basemaps: National Geographic, new topographic, light &amp; dark gray canvas, Open Street Map, Terrain with Labels, and USGS National Map. As ESRI adds more basemaps they will automatically appear in our atlas.
                            </li>
                            <li>Fixed a bug in Bookmarks. Deleting a bookmark in one atlas (say the Fishing Atlas) was deleting it from all atlases. Now bookmarks are independent of each atlas.</li>
                            <li>Way points at current location and ability to add multiple way points</li>
                            <li>Degrees, decimal minutes coordinate display format for reports and mouse coordinates. For reports, this is changed in Settings. To change the format for the mouse coordinate, click on the X,Y value at the bottom-right of the
                                map.
                            </li>
                            <li>The ability to zoom to a lat long point in various formats. Enter the point in the <strong>Search for a Colorado Place</strong> search box using one of the following formats:
                                <ul>
                                    <li>degree, minute, second format example: 40:25:12,104:44:51</li>
                                    <li>degrees, decimal minutes format example: 40:25.322,104:44.91</li>
                                    <li>decimal degrees format example: 40.252,104.731</li>
                                </ul>
                            </li>
                            <li>The ability to zoom to a lat long point on startup by adding the following to the URL:
                                <ul>
                                    <li>degree, minute, second format example: &amp;place=40:25:12,104:44:51</li>
                                    <li>degrees, decimal minutes format example: &amp;place=40:25.322,104:44.91</li>
                                    <li>decimal degrees format example: &amp;place=40.412,104.791</li>
                                </ul>
                            </li>
                            <li>Simplified options for adding graphics and labels to the map. Also, custom labels are now available for your way points, lines, or shapes.</li>
                            <li>You can now use the Goto GMU drop down to select bighorn sheep or mountain goat game units when you are displaying these game species data.</li>
                            <li>Ability to resize the left panel or even hide it temporarily.</li>
                            <li>Simplified Map Layers &amp; Legend for setting layer transparency and showing the legend.</li>
                        </ul>
                    </li>
            </td>
        </tr>
    </table>
</body>

</html>