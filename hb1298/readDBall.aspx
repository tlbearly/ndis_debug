<%@ Import Namespace="System.Data" %>
<%@ Import Namespace="System.Data.OleDb" %>
<%@ Import Namespace="System.Xml" %>
<%@ Page Debug="False" %>
<script language="vb" runat="server">
' http://www.altova.com/Access-Database-OLEDB-32bit-64bit.html
' Installed AccessDatabaseEngine_x64.exe from http://www.microsoft.com/download/en/details.aspx?displaylang=en&id=13255
' to read from mdb files on a 64 bit machine.

Sub Page_Load(Sender As Object, E as EventArgs)
  Dim objConnection As OleDbConnection
  Dim objCommand As OleDbDataAdapter
  Dim strConnect As String
  Dim strCommand As String
  Dim DataSet1 As New DataSet
Dim DataSet2 As New DataSet
Dim DataSet3 As New DataSet
'************************************************************************************************
'* used by hb1298/definitions.html to read the definitions for RSO and SWH activity definitions.
'************************************************************************************************

  strConnect =  "Provider=Microsoft.ACE.OLEDB.12.0;"
'*************************************************
'        Update database url here
'*************************************************
  strConnect += "Data Source=c:\inetpub\wwwroot\database\HB1298\hb1298_ndis.mdb;"
  strConnect += "Persist Security Info=False"

  Response.Write ("<?xml version=""1.0"" encoding=""UTF-16""?>"&vbcrlf)
  Response.Write ("<hb1298>")  

  strCommand =  "SELECT Data.Species,"
  strCommand +=	" Data.Activity, Data.Description, Data.TotalFactor,"
  strCommand +=	" Data.CriticalHabitat, Data.BMPDoc FROM Data"
  strCommand +=	" ORDER BY Data.Species,Data.Activity;"

  objConnection = New OleDbConnection(strConnect)
  objCommand = New OleDbDataAdapter(strCommand, objConnection)
  objCommand.Fill(DataSet1, "Data")

  Dim myxml As String
  myxml = DataSet1.GetXml()
  Response.Write ("<rso>")  
  Response.Write (myxml)
  Response.Write ("</rso>")


  strCommand =  "SELECT Data.Species,"
  strCommand +=	" Data.Activity, Data.Description, Data.TotalFactor,"
  strCommand +=	" Data.CriticalHabitat, Data.BMPDoc FROM Data"
  strCommand +=	" ORDER BY Data.Species,Data.Activity;"

  objConnection = New OleDbConnection(strConnect)
  objCommand = New OleDbDataAdapter(strCommand, objConnection)
  objCommand.Fill(DataSet2, "Data")

  myxml = DataSet2.GetXml()
  Response.Write ("<swh>")  
  Response.Write (myxml)
  Response.Write ("</swh>")

  strCommand =  "SELECT Data.Species,"
  strCommand +=	" Data.Activity, Data.Description, Data.TotalFactor,"
  strCommand +=	" Data.CriticalHabitat, Data.BMPDoc FROM Data"
  strCommand +=	" ORDER BY Data.Species,Data.Activity;"

  objConnection = New OleDbConnection(strConnect)
  objCommand = New OleDbDataAdapter(strCommand, objConnection)
  objCommand.Fill(DataSet3, "Data")
  myxml = DataSet3.GetXml()
  Response.Write ("<cdow>")  
  Response.Write (myxml)
  Response.Write ("</cdow>")

  Response.Write ("</hb1298>")  
End Sub
</script>