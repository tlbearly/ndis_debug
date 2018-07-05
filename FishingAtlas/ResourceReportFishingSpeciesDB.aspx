<%@ Import Namespace="System.Data" %>
<%@ Import Namespace="System.Data.OleDb" %>
<%@ Import Namespace="System.Xml" %>
<%@ Import Namespace="System.Text.RegularExpressions" %>
<%@ Page Debug="false" %>
<script language="vb" runat="server">
' http://www.altova.com/Access-Database-OLEDB-32bit-64bit.html
' Installed AccessDatabaseEngine_x64.exe from http://www.microsoft.com/download/en/details.aspx?displaylang=en&id=13255
' to read from mdb files on a 64 bit machine.

'*************************************************************************************************************
' This file is used by Resource Report Widget during to lookup values in a database for display in the report.   
' Set up the reference to this file in ResourceReportWidget.xml database tag for the specific layer.
'
' To debug type: 
' https://ndis-flex-2.nrel.colostate.edu/debug/fishingatlas/ResourceReportFishingSpeciesDB.aspx?key=54673,55853,56918,70817 into the browser
'*************************************************************************************************************

Sub Page_Load(Sender As Object, E as EventArgs)
  Dim objConnection As OleDbConnection
  Dim objCommand As OleDbDataAdapter
  Dim strConnect As String
  Dim strCommand As String
  Dim i As Integer
  Dim myxml As String

  strConnect =  "Provider=Microsoft.ACE.OLEDB.12.0;"
'*************************************************
'        Update database url here
'*************************************************
  strConnect += "Data Source=C:\Projects\fishingatlas\Data\Working\AtlasFishSpecies.mdb;"
  strConnect += "Persist Security Info=False"

  Response.Write ("<?xml version=""1.0"" encoding=""UTF-16""?>"&vbcrlf)
  If (Request("key") = "" OR Request("key") IS Nothing) Then
	  Response.Write ("Missing parameter key.")
	  Exit Sub
  End If

  Dim pattern As String = "[^0-9a-zA-Z, ]"
  Dim replacement As String = ""
  Dim rgx As New Regex(pattern)
  If (rgx.Match(Request("key"),pattern).Success) Then
    Response.Write("Invalid key")
    Exit Sub
  End If

  Dim mykey() As string = rgx.Replace(Request("key").ToString(), replacement).split(",")
  myxml = ""

  Response.Write ("<myxml>")

  For i=0 to uBound(myKey)
    Dim DataSet1 As New DataSet
  
'*************************************************
'        Update SQL here
'
' The SELECT statement fields should contain
' what is specified in key, one2one_fields, and one2many_fields
' in ResourceReportWidget.xml.
'
' The WHERE statement field should be equal to what is 
' specified in key in ResourceReportWidget.xml.
' This is the link field between the mapservice
' and the database.
'*************************************************
    Dim comm As new OleDbCommand
		objCommand = new OleDbDataAdapter(comm)
    strCommand =  "SELECT tblMasterSpecies_GrpBy_WaterID_Species.WATERCODE, tblMasterSpecies_GrpBy_WaterID_Species.AtlasFishGroup, tblMasterSpecies_GrpBy_WaterID_Species.AtlasFish"
    strCommand += " FROM tblMasterSpecies_GrpBy_WaterID_Species"
    strCommand += " WHERE ((((tblMasterSpecies_GrpBy_WaterID_Species.WATERCODE))=@mykey))"
    strCommand += " ORDER BY tblMasterSpecies_GrpBy_WaterID_Species.WATERCODE, tblMasterSpecies_GrpBy_WaterID_Species.AtlasFishGroup, tblMasterSpecies_GrpBy_WaterID_Species.AtlasFish;"
    comm.CommandText = strCommand
    Dim str = Trim(mykey(i))
    comm.Parameters.AddWithValue("@mykey",str)
    objConnection = New OleDbConnection(strConnect)
    comm.Connection = objConnection

    'strCommand =  "SELECT tblMasterSpecies_GrpBy_WaterID_Species.WATERCODE, tblMasterSpecies_GrpBy_WaterID_Species.AtlasFishGroup, tblMasterSpecies_GrpBy_WaterID_Species.AtlasFish"
    'strCommand +=     " FROM tblMasterSpecies_GrpBy_WaterID_Species"
    'strCommand +=     " WHERE ((((tblMasterSpecies_GrpBy_WaterID_Species.WATERCODE))='" & mykey(i) & "'))"
    'strCommand +=     " ORDER BY tblMasterSpecies_GrpBy_WaterID_Species.WATERCODE, tblMasterSpecies_GrpBy_WaterID_Species.AtlasFishGroup, tblMasterSpecies_GrpBy_WaterID_Species.AtlasFish;"
    'objConnection = New OleDbConnection(strConnect)
    'objCommand = New OleDbDataAdapter(strCommand, objConnection)

'**************************************************
'         Update name of database file here
'**************************************************
    objCommand.Fill(DataSet1, "tblMasterSpecies_GrpBy_WaterID_Species")

    myxml = DataSet1.GetXml() 
    DataSet1 = Nothing
    Response.Write (myxml)
    
  Next
  Response.Write ("</myxml>")
End Sub
</script>