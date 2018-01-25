<%@ Import Namespace="System.Data" %>
<%@ Import Namespace="System.Data.OleDb" %>
<%@ Import Namespace="System.Xml" %>
<%@ Import Namespace="System.Text" %>
<%@ Page Debug="False" %>
<script language="vb" runat="server">

' http://www.altova.com/Access-Database-OLEDB-32bit-64bit.html
' Installed AccessDatabaseEngine_x64.exe from http://www.microsoft.com/download/en/details.aspx?displaylang=en&id=13255
' to read from mdb files on a 64 bit machine.

'*************************************************************************************************************
' This file is used by Identify Widget to lookup values in a database and display one to one or a bullet list of
' one to many values in the identify popup.  Set up the connection in SettingsWidget.xml.
'
' To debug type:
'		http://ndis-staging.nrel.colostate.edu/hb1298/SearchDB.aspx?key=Bald%20Eagle%20Active%20Nest%20Site
'       http://ndismaps.nrel.colostate.edu/hb1298/SearchDB.aspx?key=Bald%20Eagle%20Active%20Nest%20Site
' For debugging set Page Debug="True" above.
'
' Return value is xml to IdentifyWidget.mxml. It reads from two databases, the first to get species name,
' the second to get a url for the species. The xml returned looks like:
'<?xml version="1.0" encoding="utf-16"?>
'<NewDataSet>
'  <Data>
'    <SpeciesCode>BEANS</SpeciesCode>
'  </Data>
'</NewDataSet>
'*************************************************************************************************************

Sub Page_Load(Sender As Object, E as EventArgs)
  Dim objConnection As OleDbConnection
  Dim objCommand As OleDbDataAdapter
  Dim strConnect As String
  Dim strCommand As String
  Dim DataSet1 As New DataSet

  strConnect =  "Provider=Microsoft.ACE.OLEDB.12.0;"
'*************************************************
'        Update database url here
'*************************************************
  strConnect += "Data Source=C:\inetpub\wwwroot\database\hb1298\hb1298_ndis.mdb;"
  strConnect += "Persist Security Info=False"
  
  Response.Write ("<?xml version=""1.0"" encoding=""UTF-16""?>"&vbcrlf)

  If (Request("key") = "" AND Request("key") IS Nothing) Then
	Response.Write ("Missing parameter key.")
	Response.End
  End If  

  Dim mykey As String
  mykey = Request("key").ToString()

'*************************************************
'        Update SQL for species name here
'*************************************************
    strCommand =  "SELECT Data.Species, Data.Activity, Data.SpeciesCode"
    strCommand +=     " FROM Data"
    strCommand +=     " WHERE (Trim(Data.SpeciesCode)='" & Trim(mykey) & "')"
    strCommand +=     " ORDER BY Data.Species,Data.Activity;"

' debug
' Response.Write (strCommand)

    objConnection = New OleDbConnection(strConnect)
    objCommand = New OleDbDataAdapter(strCommand, objConnection)
'**************************************************
'         Update name of database file here
'**************************************************
    objCommand.Fill(DataSet1, "Data")

	Dim myxml As String
	myxml = DataSet1.GetXml()
	Dim str As String = myxml.Replace("SpeciesCode","ActivityCode")
	Response.Write(str)
	'Response.Write (myxml)
End Sub
</script>