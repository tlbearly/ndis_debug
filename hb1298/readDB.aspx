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

  strConnect =  "Provider=Microsoft.ACE.OLEDB.12.0;"
'*************************************************
'        Update database url here
'*************************************************
  strConnect += "Data Source=c:\inetpub\wwwroot\database\HB1298\hb1298_ndis.mdb;"
  strConnect += "Persist Security Info=False"

  Response.Write ("<?xml version=""1.0"" encoding=""UTF-16""?>"&vbcrlf)

  Dim i As Integer

  If (Request("rso") = "" AND Request("rso") IS Nothing) Then
	Response.Write ("Missing parameter rso.")
	Response.End
  End If  
  If Request("swh") = "" AND Request("swh") IS Nothing Then
	Response.Write ("Missing parameter swh.")
	Response.End
  End If
  If Request("cdow") = "" AND Request("cdow") IS Nothing Then
	Response.Write ("Missing parameter cdow.")
	Response.End
  End If


  Response.Write ("<hb1298>")  
  Dim arrRSO() As String = Request("rso").split(",")
 
  For i=0 to uBound(arrRSO)
    strCommand =  "SELECT Data.Species,"
    strCommand +=	" Data.Activity, Data.Description, Data.TotalFactor,"
    strCommand +=	" Data.CriticalHabitat, Data.BMPDoc FROM Data"
    strCommand +=	" WHERE (((Data.SpeciesCode)=""" &arrRSO(i)& """))"
    strCommand +=	" ORDER BY Data.Species,Data.Activity;"

    objConnection = New OleDbConnection(strConnect)
    objCommand = New OleDbDataAdapter(strCommand, objConnection)
    objCommand.Fill(DataSet1, "Data")
  Next
  Dim myxml As String
  myxml = DataSet1.GetXml()
  Response.Write ("<rso>")  
  Response.Write (myxml)
  Response.Write ("</rso>")


  Dim arrSWH() As String = Request("swh").split(",")
  For i=0 to uBound(arrSWH)
    strCommand =  "SELECT Data.Species,"
    strCommand +=	" Data.Activity, Data.Description, Data.TotalFactor,"
    strCommand +=	" Data.CriticalHabitat, Data.BMPDoc FROM Data"
    strCommand +=	" WHERE (((Data.SpeciesCode)=""" &arrSWH(i)& """))"
    strCommand +=	" ORDER BY Data.Species,Data.Activity;"

    objConnection = New OleDbConnection(strConnect)
    objCommand = New OleDbDataAdapter(strCommand, objConnection)
    objCommand.Fill(DataSet2, "Data")
  Next
  myxml = DataSet2.GetXml()
  Response.Write ("<swh>")  
  Response.Write (myxml)
  Response.Write ("</swh>")


  Dim arrCDOW() As String = Request("cdow").split(",")

  For i=0 to uBound(arrCDOW)
    strCommand =  "SELECT Data.Species,"
    strCommand +=	" Data.Activity, Data.Description, Data.TotalFactor,"
    strCommand +=	" Data.CriticalHabitat, Data.BMPDoc FROM Data"
    strCommand +=	" WHERE (((Data.SpeciesCode)=""" &arrCDOW(i)& """))"
    strCommand +=	" ORDER BY Data.Species,Data.Activity;"


    objConnection = New OleDbConnection(strConnect)
    objCommand = New OleDbDataAdapter(strCommand, objConnection)
    objCommand.Fill(DataSet3, "Data")
  Next
  myxml = DataSet3.GetXml()
  Response.Write ("<cdow>")  
  Response.Write (myxml)
  Response.Write ("</cdow>")

  Response.Write ("</hb1298>")  
End Sub
</script>
