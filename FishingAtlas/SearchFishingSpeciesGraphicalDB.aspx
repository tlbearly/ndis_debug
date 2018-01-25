<%@ Import Namespace="System.Data" %>
<%@ Import Namespace="System.Data.OleDb" %>
<%@ Import Namespace="System.Xml" %>
<%@ Page Debug="False" %>
<script language="vb" runat="server">
' http://www.altova.com/Access-Database-OLEDB-32bit-64bit.html
' Installed AccessDatabaseEngine_x64.exe from http://www.microsoft.com/download/en/details.aspx?displaylang=en&id=13255
' to read from mdb files on a 64 bit machine.

'*************************************************************************************************************
' This file is used by Search Widget during a graphical search to add values to the display table.   
' Set up the reference to this file in SearchWidget.xml graphical_database tag for the specific layer.
'
' To debug type: http://ndis-flex.nrel.colostate.edu/fishing/SearchFishingSpeciesGraphicalDB.aspx?key=54673,55853,56918,70817 into the browser
'*************************************************************************************************************


Sub Page_Load(Sender As Object, E as EventArgs)
  Dim objConnection As OleDbConnection
  Dim objCommand As OleDbDataAdapter
  Dim strConnect As String
  Dim strCommand As String

  strConnect =  "Provider=Microsoft.ACE.OLEDB.12.0;"
'*************************************************
'        Update database url here
'*************************************************
  strConnect += "Data Source=C:\Projects\fishingatlas\Data\Working\AtlasFishSpecies.mdb;"
  strConnect += "Persist Security Info=False"

  Response.Write ("<?xml version=""1.0"" encoding=""UTF-16""?>"&vbcrlf)

  Dim i As Integer

  If (Request("key") = "" AND Request("key") IS Nothing) Then
	Response.Write ("Missing parameter key.")
	Response.End
  End If  

  Dim myKey() As String = Request("key").split(",")
  Dim myxml As String
  myxml = ""
  Response.Write ("<graphical>")

  For i=0 to uBound(myKey)
   Dim DataSet1 As New DataSet

'*************************************************
'        Update SQL here
'
' The SELECT statement fields should contain
' what is specified in graphical_db_field and
' database_field tag in SearchWidget.xml.
'
' The WHERE statement field should be equal to what is 
' specified in database_field tag in SearchWidget.xml.
' This is the link field between the mapservice
' and the database.
'*************************************************
    strCommand =  "SELECT tblMasterSpecies_GrpBy_WaterID_Species.WATERCODE, tblMasterSpecies_GrpBy_WaterID_Species.AtlasFish"
    strCommand +=     " FROM tblMasterSpecies_GrpBy_WaterID_Species"
    strCommand +=     " WHERE ((((tblMasterSpecies_GrpBy_WaterID_Species.WATERCODE))='" & mykey(i) & "'));"

' debug
' Response.Write (strCommand)

    objConnection = New OleDbConnection(strConnect)
    objCommand = New OleDbDataAdapter(strCommand, objConnection)

'**************************************************
'         Update name of database file here
'**************************************************
    objCommand.Fill(DataSet1, "tblMasterSpecies_GrpBy_WaterID_Species")

    myxml = DataSet1.GetXml() 
    DataSet1 = Nothing
    Response.Write (myxml)
    
  Next
  Response.Write ("</graphical>")
End Sub
</script>