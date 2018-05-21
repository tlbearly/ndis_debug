<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" >
<head>
	<style type="text/css"> 
	@import "assets/css/help.css";
	</style>
	<title>Troubleshooting Help</title>
	<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" >
	<style>
		.menuitem{
			font-weight: bold;
		}
	</style>
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
<table class="header"> <!---->
<tr class="banner" colspan="2">
<td class="logo"> <!---->
<center><img border="0" src="assets/images/cpwseal.png"></center>
</td>
<td class="banner"> <!---->
<p class="heading">Troubleshooting <br>
<font size='5'><%=subtitle%></font>
</td></tr>
</table>

<table><tr>
<td>
<h4><a href="<%=app%>/help.html">Help</a> &#149;
	<a href="<%=app%>/definitions.html">Map Information</a></h4>

</td></tr>
<tr><td>
<a name=top"/>
<h2> Info Covered in This Document:</h2>
<ul>
	<li><a href="#pref">Losing your saved bookmarks / preferences or need to allow cookies</a></li>
	<li><a href="#js">Need to enable JavaScript</a></li>
	<li><a href="#pop">Need to enable pop-ups for printing and reports</a></li>
	<li><a href="#printChrome">Print troubleshooting: Having trouble saving the PDF with Chrome?</a></li>
	<li><a href="#location">Enable current location tracking (Mobile only)</a></li>
</ul>
<br/><br/>
<p>
<hr/>
<a name="pref"/>
<H1>Losing Your Saved Bookmarks or Preferences / Allow Cookies</H1>
<p>User preferences are deleted when you clear your cookies in browser history.</b> The NDIS website uses browser local storage, similar to cookies, to 
 store your: bookmarks, your preference to not show the disclaimer again, to show or not show the legend on start-up, and your coordinate format preference.  
 Therefore if you clear cookies in your browser history, all of your preferences for our site 
 will be deleted.  To set this behavior choose your browser below:</p>
<ul class="toc"><li><a href="#CHROME1" title="">Chrome</a>
</li><li><a href="#FIREFOX1" title="">Firefox</a>
</li><li><a href="#IE1" title="">Internet Explorer</a>
</li><li><a href="#SAFARI1" title="">Safari</a>
<ul><li><a href="#51" title="">Safari 5.1 and later</a></li><li><a href="#50" title="">Safari 5.0.x and earlier</a></li></ul></li>
<li><a href="#OPERA1" title="">Opera</a>
</ul>

<p><a id="CHROME1" title=""><!--deprecated: use id="blah" on element directly--></a></p><h2>Chrome</h2>
<ol>
<li>From the Chrome menu in the top right corner of the browser,
select <span class="menuitem">Settings</span>.</li>
<li>At the bottom of the page, click <span class="menuitem">Show advanced settings...</span>.</li>
<li>Under <span class="menuitem">Privacy</span>, select <span class="menuitem">Content settings...</span>.
<ul>
<li>Under Cookies, click <span class="menuitem">Manage exceptions...</span></li>
<li>Enter the <span class="menuitem">Hostname pattern</span> for our site: <code><script type="text/javascript">document.write(document.location.host)</script></code></li>
<li>Click Allow for the <span class="menuitem">Behavior</span> and then <span class="menuitem">Done</span></li>
</ul>
</li>
<li>From the Chrome menu in the top right corner of the browser,
select <span class="menuitem">History</span>. Uncheck <span class="menuitem">Cookies and other site and plug-in data</span></ol>
<p><a href="#top" title="">Back to top</a></p>

<p><a id="FIREFOX1" title=""><!--deprecated: use id="blah" on element directly--></a></p><h2>Firefox</h2>
<ol><li>From the <span class="menuitem">Tools</span> menu, select <span class="menuitem">Options</span>. 
<p>If the menu bar is hidden, press <code>Alt</code> to make it
visible.</p></li>
<li>At the top or left of the window that appears, click <span class="menuitem">Privacy</span>.
<ul>
<li>To manage cookie settings, from the drop-down menu under
"History", select <span class="menuitem">Use custom settings for history</span>. Enable or
disable the settings by checking or unchecking the boxes next to each
setting:
<ul>
<li>To allow cookies for our site, select <span class="menuitem">Exceptions</span>. In the 
<span class="menuitem">Address of website</span> type our domain name: <code>
<script type="text/javascript">document.write(document.location.host)</script></code>. Click <span class="menuitem">Allow</span>.</li>
<li><span class="menuitem">Keep until</span> should be set to: <span class="menuitem">they expire</span>.</li>
<li>If you have <span class="menuitem">Clear history when Firefox closes</span> checked, click on Settings and uncheck cookies.</li>
</ul>
<br/></li>
<li>To view or remove individual cookies, click <span class="menuitem">Show Cookies</span>.</li>
</ul></li>
<li>From the <span class="menuitem">Tools</span> menu, select <span class="menuitem">History</span>. Uncheck <span class="menuitem">Cookies</span></li>
</ol>
<p><a href="#top" title="">Back to top</a></p>

<p><a id="IE1" title=""><!--deprecated: use id="blah" on element directly--></a></p><h2>Internet Explorer</h2>
<ol>
<li>From the <span class="menuitem">Tools</span> menu, or the <span class="menuitem">Tools</span> drop-down at
the upper right, select <span class="menuitem">Internet Options</span>.
<p>If the menu bar is hidden, press <code>Alt</code> to make it
visible.</p>
<ul>
<li>To allow cookies for our site, select the <span class="menuitem">Privacy</span> tab and
click <span class="menuitem">Sites</span>. In the <span class="menuitem">Address of website</span> type
our domain name: <code><script type="text/javascript">document.write(document.location.host)</script></code> Then click <span class="menuitem">Allow</span></li>
<li>Then on the <span class="menuitem">Advanced</span> tab and under <span class="menuitem">Security</span> make sure <span class="menuitem">Enable DOM Storage</span> checkbox is checked.</li>
<li>From the Tools menu select <span class="menuitem">Delete Browsing History</span>. Make sure 
<span class="menuitem">Preserve Favorites website data</span> is checked.</li>
</ul>
</li></ol>
<p>This content is adapted from Microsoft Help and Support article 278835.</p>
<div><p> <a href="http://support.microsoft.com/default.aspx" title="">Search
Microsoft Support</a>.</p>
</div><p><a href="#top" title="">Back to top</a></p>

<p><a id="SAFARI1" title=""><!--deprecated: use id="blah" on element directly--></a></p><h2>Safari</h2>

<p><strong>Note:</strong> To determine the version of Safari you're
using, from the <span class="menuitem">Safari</span> menu, select <span class="menuitem">About Safari</span>.</p>

<p><a id="51" title=""><!--deprecated: use id="blah" on element directly--></a></p><h3>Safari 5.1 and later</h3>

<ol>
<li>In Safari, from the <span class="menuitem">Safari</span> menu, select
<span class="menuitem">Preferences...</span>.
</li><li>In the Safari preferences window, click <span class="menuitem">Privacy</span>
<ul>
<li>Next to <span class="menuitem">Block cookies</span>, select <span class="menuitem">Always</span>.
</li></ul>
</li></ol>
<p><a href="#top" title="">Back to top</a></p>

<p><a id="50" title=""><!--deprecated: use id="blah" on element directly--></a></p><h3>Safari 5.0.x and earlier</h3>
<ol>
<li>In Safari, from the <span class="menuitem">Safari</span> menu, select
<span class="menuitem">Preferences...</span>.</li>
<li>In the Safari preferences window, click <span class="menuitem">Security</span>.</li>
<li>Next to <span class="menuitem">Accept Cookies:</span>, select <span class="menuitem">Always</span> or <span class="menuitem">Only from sites you navigate to</span>.</li>
</ol>
<p><a href="#top" title="">Back to top</a></p>

<a id="OPERA1"></a><h2>Opera</h2>
<ol>
	<li>Select <span class="menuitem">Settings</span> from Opera icon menu.</li>
	<li>Select <span class="menuitem">Privacy & Security</span></li>
	<li>Under <span class="menuitem">Cookies</span> check <span class="menuitem">Allow local data to be set (recommended)</span></li>
	<li>Or add our domain: <code><script type="text/javascript">document.write(document.location.host)</script></code> under <span class="menuitem">Manage exceptions</span> and click <span class="menuitem">Allow</span></li>
	<li>Click <span class="menuitem">History</span> from main menu</li>
	<li>Click <span class="menuitem">Clear browsing data</span> and uncheck <span class="menuitem">Delete cookies and other site data</span></li>
</ol>
<p style="font-size:x-small">Modified from Indiana University article: <a href="https://kb.iu.edu/d/ajfi">https://kb.iu.edu/d/ajfi</a></p>

<hr/>
<a name="js"/>
<H1>Need to enable JavaScript</H1>
<p>
This website will not run if JavaScript is not enabled. Below are instructions for enabling JavaScript on each of the major browsers.
</p>
<ul>
<li><a href="#IE" title="">Internet Explorer</a></li>
<li><a href="#FIREFOXN" title="">Firefox</a></li>
<li><a href="#CHROME" title="">Chrome</a></li>
<li><a href="#SAFARI" title="">Safari</a></li>
<li><a href="#OPERA">Opera</a></li>
</ul>

<p><a id="IE" title=""><!--deprecated: use id="blah" on element directly--></a></p><h2>Internet Explorer</h2>
<p>To enable JavaScript in Internet Explorer:</p>
<ol>
<li>From the <span class="menuitem">Tools</span> menu, select <span class="menuitem">Internet Options</span>. 
</li><li>In Internet Options, click the <span class="menuitem">Security</span> tab.
</li><li>Click the globe labeled <span class="menuitem">Internet</span>, and then click <span class="menuitem">Custom level</span>.
</li><li>Scroll down to the "Scripting" section. Under <span class="menuitem">Active
Scripting</span>, click <span class="menuitem">Enable</span>.
</li><li>Press <span class="menuitem">OK</span> and restart Internet Explorer.
</li></ol>
<p><a href="#top" title="">Back to top</a></p>

<p><a id="FIREFOXN" title=""><!--deprecated: use id="blah" on element directly--></a></p><h2>Firefox</h2>
<p>To enable JavaScript in Firefox:</p>
<ol>
<li>From the <span class="menuitem">Tools</span> menu, select <span class="menuitem">Options</span>.
</li><li>Select <span class="menuitem">Content</span>.
</li><li>Check <span class="menuitem">Enable JavaScript</span>.
</li><li>Click <span class="menuitem">OK</span> and restart Firefox.
</li></ol>
<p><a href="#top" title="">Back to top</a></p>

<p><a id="CHROME" title=""><!--deprecated: use id="blah" on element directly--></a></p><h2>Chrome</h2>
<p>To enable JavaScript in Chrome:</p>
<ol>
<li>In the address bar, enter <code>chrome://settings/content</code>.
</li><li>Find <span class="menuitem">JavaScript</span> on the page and select either <span class="menuitem">Allow
all sites to run JavaScript</span> or <span class="menuitem">Do not allow any site to run
JavaScript</span> and add our domain name to the exceptions list: <code><script type="text/javascript">document.write(document.location.host)</script></code>.
</li><li>Click <span class="menuitem">Done</span> and restart Chrome.
</li></ol>
<p><a href="#top" title="">Back to top</a></p>

<p><a id="SAFARI" title=""><!--deprecated: use id="blah" on element directly--></a></p><h2>Safari</h2>
<p>To enable JavaScript in Safari:</p>
<ol>
  <li>From the <span class="menuitem">Safari</span> menu, select <span class="menuitem">Preferences</span>.
  </li><li>Click <span class="menuitem">Security</span>.
  </li><li>Check the <span class="menuitem">Enable JavaScript</span> box.
  </li><li>Restart your browser.
</li></ol>
<p><a href="#top" title="">Back to top</a></p>

<p><a id="OPERA" title=""><!--deprecated: use id="blah" on element directly--></a><h2>Opera</h2>
<p>To enable JavaScript in Opera:</p>
<ol>
	<li>Click the Opera icon to open the tools menu. Select <span class="menuitem">Settings</span></li>
	<li>Click on <span class="menuitem">Websites</span>. Then under <span class="menuitem">JavaScript</span> select <span class="menuitem">Allow all sites to run JavaScript (recommended)</span></li>
	<li>Or under <span class="menuitem">Manage Exceptions</span> add our domain name: <code><script type="text/javascript">document.write(document.location.host)</script></code> and click <span class="menuitem">Allow</span></li>
</ol>
<p style="font-size:x-small">Modified from Indiana University article: <a href="https://kb.iu.edu/d/bcyv">https://kb.iu.edu/d/bcyv</a></p>
<br/><br/>

<hr/>
<a id="pop"></a>
<h1>Need to Enable Pop-ups for Printing and Reports</h1>
<p>The print and resource report tools create a pdf file that is opened in a new window. Pop-ups must be enabled for this to work. Click on your browser
below for instructions on how to enable pop-ups for our site.</p>
<ul class="toc"><li><a href="#CHROME2" title="">Chrome</a></li>
<li><a href="#FIREFOX2" title="">Firefox</a></li>
<li><a href="#IE2" title="">Internet Explorer</a></li>
<li><a href="#SAFARI2" title="">Safari</a></li>
<li><a href="#OPERA2" title="">Opera</a></li>
</ul>

<p><a id="CHROME2" title=""><!--deprecated: use id="blah" on element directly--></a></p><h2>Chrome</h2>
<p>To enable pop-ups in Chrome:</p>
<ol>
<li>In the address bar, enter <code>chrome://settings/content</code>.
</li><li>Find <span class="menuitem">Pop-ups</span> on the page and select either <span class="menuitem">Allow
all sites to show Pop-ups</span> or <span class="menuitem">Do not allow any site to show
pop-ups</span> and then add our domain: <code><script type="text/javascript">document.write(document.location.host)</script></code> to the <span class="menuitem">Manage exceptions</span> list.
</li><li>Click <span class="menuitem">Done</span> and restart Chrome.
</li></ol>
<p><a href="#top" title="">Back to top</a></p>

<p><a id="IE2" title=""><!--deprecated: use id="blah" on element directly--></a></p><h2>Internet Explorer</h2>
<p>To enable pop-ups in Internet Explorer:</p>
<ol>
<li>From the <span class="menuitem">Tools</span> menu, select <span class="menuitem">Internet Options</span>. 
</li><li>In Internet Options, click the <span class="menuitem">Privacy</span> tab.
</li><li>Check the box under Pop-up Blocker labled <span class="menuitem">Turn on pop-up blocker</span>, and then click <span class="menuitem">Settings</span>.
</li><li>Add our website address <code><script type="text/javascript">document.write(document.location.host)</script></code> in the <span class="menuitem">Address of website to allow</span> text box. 
</li><li>Press <span class="menuitem">Add</span> and restart Internet Explorer.
</li></ol>
<p><a href="#top" title="">Back to top</a></p>

<p><a id="FIREFOX2" title=""><!--deprecated: use id="blah" on element directly--></a></p><h2>Firefox</h2>
<p>To enable pop-ups in Firefox:</p>
<ol>
<li>From the <span class="menuitem">Tools</span> menu or <u>=</u> icon, select <span class="menuitem">Options</span>.
</li><li>From the tabs along the top or left of the window, select <span class="menuitem">Content</span>.
</li><li>Either uncheck <span class="menuitem">Block pop-up windows</span>, or
check <span class="menuitem">Block pop-up windows</span> and then add our site: <code><script type="text/javascript">document.write(document.location.host)</script></code> under <span class="menuitem">Exceptions, Address of website</span> and click <span class="menuitem">Allow</span>. 
</li><li>Restart Firefox.</li></ol>

<p><a id="SAFARI2" title=""><!--deprecated: use id="blah" on element directly--></a></p><h2>Safari</h2>
<p>To enable pop-ups in Safari:</p>
<ol>
  <li>From the <span class="menuitem">Safari</span> menu, select <span class="menuitem">Preferences</span>.
  </li><li>Click <span class="menuitem">Security</span>.
  </li><li>Uncheck the <span class="menuitem">Block pop-up windows</span> box.
  </li><li>Restart your browser.
</li></ol>
<p><a href="#top" title="">Back to top</a></p>

<p><a id="OPERA2" title=""><!--deprecated: use id="blah" on element directly--></a><h2>Opera</h2>
<p>To enable pop-ups in Opera:</p>

<ol>
	<li>Click the Opera icon to open the tools menu. Select <span class="menuitem">Settings</span></li>
	<li>Click on <span class="menuitem">Websites</span>. Then under <span class="menuitem">Pop-ups</span> select <span class="menuitem">Allow all sites to show pop-ups</span></li>
	<li>Or select <span class="menuitem">Do not allow any site to show pop-ups</span> and then under <span class="menuitem">Manage exceptions</span> add our domain name: <code><script type="text/javascript">document.write(document.location.host)</script></code> and click <span class="menuitem">Done</span></li>
</ol>
<br/><br/>
<hr/>
<a id="printChrome"></a><h2>Print Troubleshooting: Having Trouble Saving the PDF with Chrome?</h2>
<p>If you are using Chrome for your browser it has a built in pdf reader which fails to save the file the first time you try to download. The second time it works.
But if you have Adobe Reader or Foxit Reader installed it will work. You can make this the default pdf reader by doing the following:</p>
<ol>
	<li>In the address bar, type <i>about:plugins</i></li>
	<li>The Plug-ins Tab will open</li>
	<li>Click disable Chrome PDF Viewer.</li>
	<li>Click Enable Adobe Reader or Foxit Reader.</li>
	<li>Check Always allowed</li>
</ol>
<p><a href="#top" title="">Back to top</a></p>
<br/><br/>
<a name="location"/>
<hr/>
<h1>Location Services</h1>
The mobile browser has a button below the zoomin/zoomout buttons to toggle location tracking. When tracking is turned on, it will zoom to your current location.
If current location is not working try the following:
<h3>Step 1: Turn on location services</h3>
Make sure GPS/Location Service is turned on in your phone's settings.<br/>
<h3>Step 2: Try going outside</h3>
<h3>Step3: Reset location settings</h3>
The first time you turn on Current Location you will be asked if you want to give the map access to your location. You can reset this choice by:<br/><br/> For Chrome browsers:<br/>
<ol>
		<li>Touch the menu icon in the top-right corner of the screen.</li>
		<li>Touch <strong>Settings>Content Settings>Website Settings</strong> or <strong>Settings>Site settings>Location</strong>.</li>
		<li>Find
				<script>
						document.write(document.location.host)
				</script>.</li>
		<li>Allow location access.</li>
		<li>Reload the Atlas in Chrome and allow location access on the message that shows up.</li>
</ol>
For Safari browsers:<br/>
<ol>
		<li>Goto your home screen.</li>
		<li>Touch <strong>Settings>Privacy>Location Services</strong></li>
		<li>Slide Location Services on.</li>
		<li>Reload Atlas in Safari and allow location access on the message that shows up.</li>
</ol>
<p><a href="#top" title="">Back to top</a></p>
</td></tr>
</table>
</body>
</html>