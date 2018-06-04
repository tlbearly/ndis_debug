<%@ Import Namespace="System.Data" %>
<%@ Import Namespace="System.Data.OleDb" %>
<%@ Import Namespace="System.Xml" %>
<%@ Import Namespace="System.Text.RegularExpressions" %>
<%@ Page Debug="false" %>
<script language="vb" runat="server">
' http://www.altova.com/Access-Database-OLEDB-32bit-64bit.html
' Installed AccessDatabaseEngine_x64.exe from http://www.microsoft.com/download/en/details.aspx?displaylang=en&id=13255
' to read from mdb files on a 64 bit machine.
'
' To Debug: https://ndis-flex-2.nrel.colostate.edu/debug/hb1298/readDB.aspx?rso=MXOCH,BERS&swh=BSOV,BSPA,BBMC&cdow=GEANS2
'

Sub Page_Load(Sender As Object, E as EventArgs)
  Dim objConnection As OleDbConnection
  Dim objCommand As OleDbDataAdapter
  Dim comm As new OleDbCommand
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

  If (Request("rso") = "" OR Request("rso") IS Nothing) Then
	  Response.Write ("Missing parameter rso.")
	  Exit Sub
  End If  
  If Request("swh") = "" OR Request("swh") IS Nothing Then
	  Response.Write ("Missing parameter swh.")
	  Exit Sub
  End If
  If Request("cdow") = "" OR Request("cdow") IS Nothing Then
	  Response.Write ("Missing parameter cdow.")
	  Exit Sub
  End If

  Dim i As Integer

  Dim pattern As String = "[^0-9a-zA-Z,]"
  Dim replacement As String = ""
  Dim rgx As New Regex(pattern)
  If (rgx.Match(Request("rso"),pattern).Success) Then
    Response.Write("Invalid rso input")
    Exit Sub
  End If
  If (rgx.Match(Request("swh"),pattern).Success) Then
    Response.Write("Invalid swh input")
    Exit Sub
  End If
  If (rgx.Match(Request("cdow"),pattern).Success) Then
    Response.Write("Invalid cdow input")
    Exit Sub
  End If

  Response.Write ("<hb1298>")  
  Dim arrRSO() As string = rgx.Replace(Request("rso").ToString(), replacement).split(",")
 
  For i=0 to uBound(arrRSO)
    comm = new OleDbCommand
		objCommand = new OleDbDataAdapter(comm)
    strCommand =  "SELECT Data.Species,"
    strCommand +=	" Data.Activity, Data.Description, Data.TotalFactor,"
    strCommand +=	" Data.CriticalHabitat, Data.BMPDoc FROM Data"
    strCommand +=	" WHERE (((Data.SpeciesCode)=@arrRSO))"
    strCommand +=	" ORDER BY Data.Species,Data.Activity;"
    comm.CommandText = strCommand
    comm.Parameters.AddWithValue("@arrRSO",arrRSO(i))
    objConnection = New OleDbConnection(strConnect)
    comm.Connection = objConnection

    'strCommand =  "SELECT Data.Species,"
    'strCommand +=	" Data.Activity, Data.Description, Data.TotalFactor,"
    'strCommand +=	" Data.CriticalHabitat, Data.BMPDoc FROM Data"
    'strCommand +=	" WHERE (((Data.SpeciesCode)=""" &arrRSO(i)& """))"
    'strCommand +=	" ORDER BY Data.Species,Data.Activity;"
    'objConnection = New OleDbConnection(strConnect)
    'objCommand = New OleDbDataAdapter(strCommand, objConnection)
    objCommand.Fill(DataSet1, "Data")
  Next
  Dim myxml As String
  myxml = DataSet1.GetXml()
  Response.Write ("<rso>")  
  Response.Write (myxml)
  Response.Write ("</rso>")


  Dim arrSWH() As String = Request("swh").split(",")
  For i=0 to uBound(arrSWH)
    comm = new OleDbCommand
		objCommand = new OleDbDataAdapter(comm)
    strCommand =  "SELECT Data.Species,"
    strCommand +=	" Data.Activity, Data.Description, Data.TotalFactor,"
    strCommand +=	" Data.CriticalHabitat, Data.BMPDoc FROM Data"
    strCommand +=	" WHERE (((Data.SpeciesCode)=@arrSWH))"
    strCommand +=	" ORDER BY Data.Species,Data.Activity;"
    comm.CommandText = strCommand
    comm.Parameters.AddWithValue("@arrSWH",arrSWH(i))
    objConnection = New OleDbConnection(strConnect)
    comm.Connection = objConnection

    'strCommand =  "SELECT Data.Species,"
    'strCommand +=	" Data.Activity, Data.Description, Data.TotalFactor,"
    'strCommand +=	" Data.CriticalHabitat, Data.BMPDoc FROM Data"
    'strCommand +=	" WHERE (((Data.SpeciesCode)=""" &arrSWH(i)& """))"
    'strCommand +=	" ORDER BY Data.Species,Data.Activity;"
    'objConnection = New OleDbConnection(strConnect)
    'objCommand = New OleDbDataAdapter(strCommand, objConnection)
    objCommand.Fill(DataSet2, "Data")
  Next
  myxml = DataSet2.GetXml()
  Response.Write ("<swh>")  
  Response.Write (myxml)
  Response.Write ("</swh>")


  Dim arrCDOW() As String = Request("cdow").split(",")

  For i=0 to uBound(arrCDOW)
    comm = new OleDbCommand
		objCommand = new OleDbDataAdapter(comm)
    strCommand =  "SELECT Data.Species,"
    strCommand +=	" Data.Activity, Data.Description, Data.TotalFactor,"
    strCommand +=	" Data.CriticalHabitat, Data.BMPDoc FROM Data"
    strCommand +=	" WHERE (((Data.SpeciesCode)=@arrCDOW))"
    strCommand +=	" ORDER BY Data.Species,Data.Activity;"
    comm.CommandText = strCommand
    comm.Parameters.AddWithValue("@arrCDOW",arrCDOW(i))
    objConnection = New OleDbConnection(strConnect)
    comm.Connection = objConnection
    
    'strCommand =  "SELECT Data.Species,"
    'strCommand +=	" Data.Activity, Data.Description, Data.TotalFactor,"
    'strCommand +=	" Data.CriticalHabitat, Data.BMPDoc FROM Data"
    'strCommand +=	" WHERE (((Data.SpeciesCode)=""" &arrCDOW(i)& """))"
    'strCommand +=	" ORDER BY Data.Species,Data.Activity;"
    'objConnection = New OleDbConnection(strConnect)
    'objCommand = New OleDbDataAdapter(strCommand, objConnection)
    objCommand.Fill(DataSet3, "Data")
  Next
  myxml = DataSet3.GetXml()
  Response.Write ("<cdow>")  
  Response.Write (myxml)
  Response.Write ("</cdow>")

  Response.Write ("</hb1298>")  
End Sub
</script>
