<%@ Import Namespace="System.Data" %>
<%@ Import Namespace="System.Data.OleDb" %>
<%@ Import Namespace="System.Xml" %>
<%@ Page Debug="False" %>
<script language="vb" runat="server">
' http://www.altova.com/Access-Database-OLEDB-32bit-64bit.html
' Installed AccessDatabaseEngine_x64.exe from http://www.microsoft.com/download/en/details.aspx?displaylang=en&id=13255
' to read from mdb files on a 64 bit machine.

'*************************************************************************************************************
' This file is used by Search Widget to get a list of values to the fill the text search drop down list.
'
' To debug type: https://ndis-flex-2.nrel.colostate.edu/debug/fishingatlas/SearchGetDropDownListDB.aspx into the browser
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

  Response.Write ("<?xml version=""1.0"" encoding=""UTF-8""?>"&vbcrlf)


'*************************************************
'        Update SQL here
'*************************************************
  strCommand = "SELECT LUT_AtlasFishList.AtlasFish"
  strCommand += " FROM LUT_AtlasFishList"
  strCommand += " ORDER BY LUT_AtlasFishList.AtlasFish;"

' debug
' Response.Write (strCommand)

  objConnection = New OleDbConnection(strConnect)
  objCommand = New OleDbDataAdapter(strCommand, objConnection)
'**************************************************
'         Update name of database file here
'**************************************************
  objCommand.Fill(DataSet1, "LUT_AtlasFishList")

  Dim myxml As String
  myxml = DataSet1.GetXml() 
  Response.Write (myxml)

End Sub
</script>