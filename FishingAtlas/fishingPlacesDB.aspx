<%@ Import Namespace="System.Data" %>
<%@ Import Namespace="System.Data.OleDb" %>
<%@ Import Namespace="System.Xml" %>
<%@ Page Debug="False" %>
<script language="vb" runat="server">
' http://www.altova.com/Access-Database-OLEDB-32bit-64bit.html
' Installed AccessDatabaseEngine_x64.exe from http://www.microsoft.com/download/en/details.aspx?displaylang=en&id=13255
' to read from mdb files on a 64 bit machine.

'*************************************************************************************************************
' To debug type: http://ndis-flex-2.nrel.colostate.edu/fishingatlas/fishingPlacesDB.aspx?key=52580 into the browser
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
  strConnect += "Data Source=C:\Projects\FishingPlaces\AtlasFishSpecies.mdb;"
  strConnect += "Persist Security Info=False"

  Response.Write ("<?xml version=""1.0"" encoding=""UTF-8""?>"&vbcrlf)

  Dim i As Integer

  If (Request("key") = "" AND Request("key") IS Nothing) Then
	Response.Write ("Missing parameter key.")
	Response.End
  End If  

  Dim mykey As String
  mykey = Request("key").ToString()

'*************************************************
'        Update SQL here
'*************************************************
    strCommand =  "SELECT tblMasterSpecies_GrpBy_WaterID_Species.WATERCODE, tblMasterSpecies_GrpBy_WaterID_Species.FA_NAME2, tblMasterSpecies_GrpBy_WaterID_Species.AtlasFishGroup, tblMasterSpecies_GrpBy_WaterID_Species.AtlasFish"
    strCommand +=     " FROM tblMasterSpecies_GrpBy_WaterID_Species"
    strCommand +=     " WHERE (((tblMasterSpecies_GrpBy_WaterID_Species.WATERCODE)='" & mykey & "'))"
    strCommand +=     " ORDER BY tblMasterSpecies_GrpBy_WaterID_Species.AtlasFishGroup, tblMasterSpecies_GrpBy_WaterID_Species.AtlasFish;"

' debug
' Response.Write (strCommand)

    objConnection = New OleDbConnection(strConnect)
    objCommand = New OleDbDataAdapter(strCommand, objConnection)
'**************************************************
'         Update name of database file here
'**************************************************
    objCommand.Fill(DataSet1, "tblMasterSpecies_GrpBy_WaterID_Species")

  Dim myxml As String
  myxml = DataSet1.GetXml() 
  Response.Write (myxml)

End Sub
</script>