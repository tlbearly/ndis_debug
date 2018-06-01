<%@ Import Namespace="System.Data" %>
<%@ Import Namespace="System.Data.OleDb" %>
<%@ Import Namespace="System.Xml" %>
<%@ Import Namespace="System.Text.RegularExpressions" %>
<%@ Page Debug="False" %>
<script language="vb" runat="server">
' http://www.altova.com/Access-Database-OLEDB-32bit-64bit.html
' Installed AccessDatabaseEngine_x64.exe from http://www.microsoft.com/download/en/details.aspx?displaylang=en&id=13255
' to read from mdb files on a 64 bit machine.

'*************************************************************************************************************
' This file is used by Search Widget to lookup the entered text value in a database and return a list of matches.
' Then the matches are used to create a where statement to query the mapservice and display the fields.
' Set up the reference to this file in SearchWidget.xml database tag for the specific layer.
'
' To debug type: 
' https://ndis-flex-2.nrel.colostate.edu/debug/fishingatlas/SearchFishingSpeciesTextDB.aspx?key=Walleye
' https://ndis-flex-2.nrel.colostate.edu/debug/fishingatlas/SearchFishingSpeciesTextDB.aspx?key=Trout: Cutthroat (Native)
' into the browser
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
  strConnect += "Data Source=C:\Projects\fishingatlas\Data\Working\AtlasFishSpecies.mdb;"
  strConnect += "Persist Security Info=False"

  Response.Write ("<?xml version=""1.0"" encoding=""UTF-16""?>"&vbcrlf)

  Dim i As Integer
  Dim pattern As String = "[^a-zA-Z :()]"
  Dim replacement As String = ""
  Dim rgx As New Regex(pattern)
  ' Disallow common SQL functions
  Dim pattern2 As String = "(union|select|drop|delete)"
  Dim disallowRgx As New Regex(pattern2)
  If (rgx.Match(Request("key"),pattern).Success OR disallowRgx.Match(Request("key"),pattern2).Success) Then
    Response.Write("Invalid key")
    Exit Sub
  End If
  Dim mykey As String = rgx.Replace(Request("key").ToString(), replacement).ToString()

  If (mykey = "" OR mykey IS Nothing) Then
	  Response.Write ("Missing parameter key.")
	  Exit Sub
  End If

'*************************************************
'        Update SQL here
'
' The SELECT statement fields should contain
' what is specified in database_field tag in SearchWidget.xml
' and what field was displayed in the drop down
' list in the Search Widget Text.
'
' The WHERE statement field should be the field that was 
' used in the Search Widget Text drop down list.
'*************************************************
  Dim comm As new OleDbCommand
	objCommand = new OleDbDataAdapter(comm)
  strCommand =  "SELECT tblMasterSpecies_GrpBy_WaterID_Species.WATERCODE, (Ucase(tblMasterSpecies_GrpBy_WaterID_Species.AtlasFish))"
  strCommand += " FROM tblMasterSpecies_GrpBy_WaterID_Species"
  strCommand += " WHERE ((((Ucase(tblMasterSpecies_GrpBy_WaterID_Species.AtlasFish)))=@mykey));"
  comm.CommandText = strCommand
  comm.Parameters.AddWithValue("@mykey",mykey.ToUpper())
  objConnection = New OleDbConnection(strConnect)
  comm.Connection = objConnection

  'strCommand =  "SELECT tblMasterSpecies_GrpBy_WaterID_Species.WATERCODE, (Ucase(tblMasterSpecies_GrpBy_WaterID_Species.AtlasFish))"
  'strCommand +=     " FROM tblMasterSpecies_GrpBy_WaterID_Species"
  'strCommand +=     " WHERE ((((Ucase(tblMasterSpecies_GrpBy_WaterID_Species.AtlasFish)))='" & mykey.ToUpper() & "'));"
  'objConnection = New OleDbConnection(strConnect)
  'objCommand = New OleDbDataAdapter(strCommand, objConnection)
'**************************************************
'         Update name of database file here
'**************************************************
  objCommand.Fill(DataSet1, "tblMasterSpecies_GrpBy_WaterID_Species")

  Dim myxml As String
  myxml = DataSet1.GetXml() 
  Response.Write (myxml)

End Sub
</script>