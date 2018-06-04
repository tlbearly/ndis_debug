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
' This file is used by Identify Widget to lookup values in a database and display one to one or a bullet list of
' one to many values in the identify popup.  Set up the connection in SettingWidget.xml.
'
' To debug type: https://ndis-flex-2.nrel.colostate.edu/debug/fishingatlas/IdentifyFishingRegsDB.aspx?key=416 into the browser
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
  strConnect += "Data Source=C:\Projects\fishingatlas\Data\FishingRegs\FishingRegs_2016.mdb;"
  strConnect += "Persist Security Info=False"

  Response.Write ("<?xml version=""1.0"" encoding=""UTF-16""?>"&vbcrlf)

  If (Request("key") = "" OR Request("key") IS Nothing) Then
	  Response.Write ("Missing parameter key.")
	  Exit Sub
  End If
  
  Dim i As Integer
  Dim pattern As String = "[^0-9]"
  Dim replacement As String = ""
  Dim rgx As New Regex(pattern)
  If (rgx.Match(Request("key"),pattern).Success) Then
    Response.Write("Invalid key")
    Exit Sub
  End If
  Dim mykey As String = rgx.Replace(Request("key").ToString(), replacement).ToString()

'*************************************************
'        Update SQL here
'*************************************************
    Dim comm As new OleDbCommand
		objCommand = new OleDbDataAdapter(comm)
	  strCommand =  "SELECT LOCATION_NO_OVERLAP.LOC_ID, LOCATION_NO_OVERLAP.Water, LOCATION_NO_OVERLAP.Specific_Area, REGS_CW.REG_ORDER, REGS_CW.REG_DESC"
    strCommand +=	" FROM (LOCATION_NO_OVERLAP INNER JOIN PIVOT_NO_OVERLAP ON LOCATION_NO_OVERLAP.LOC_ID = PIVOT_NO_OVERLAP.LOC_ID) INNER JOIN REGS_CW ON PIVOT_NO_OVERLAP.REG_CODE = REGS_CW.REG_CODE"
    strCommand +=	" WHERE (((LOCATION_NO_OVERLAP.LOC_ID)=@mykey))"
    strCommand +=	" ORDER BY LOCATION_NO_OVERLAP.LOC_ID, REGS_CW.REG_ORDER;"
    comm.CommandText = strCommand
    comm.Parameters.AddWithValue("@mykey",mykey)
    objConnection = New OleDbConnection(strConnect)
    comm.Connection = objConnection  

    'strCommand =  "SELECT LOCATION_NO_OVERLAP.LOC_ID, LOCATION_NO_OVERLAP.Water, LOCATION_NO_OVERLAP.Specific_Area, REGS_CW.REG_ORDER, REGS_CW.REG_DESC"
    'strCommand +=	" FROM (LOCATION_NO_OVERLAP INNER JOIN PIVOT_NO_OVERLAP ON LOCATION_NO_OVERLAP.LOC_ID = PIVOT_NO_OVERLAP.LOC_ID) INNER JOIN REGS_CW ON PIVOT_NO_OVERLAP.REG_CODE = REGS_CW.REG_CODE"
    'strCommand +=	" WHERE (((LOCATION_NO_OVERLAP.LOC_ID)=" & mykey & "))"
    'strCommand +=	" ORDER BY LOCATION_NO_OVERLAP.LOC_ID, REGS_CW.REG_ORDER;"
    'objConnection = New OleDbConnection(strConnect)
    'objCommand = New OleDbDataAdapter(strCommand, objConnection)

'**************************************************
'         Update name of database file here
'**************************************************
    objCommand.Fill(DataSet1, "LOCATION_NO_OVERLAP")

  Dim myxml As String
  myxml = DataSet1.GetXml() 
  Response.Write (myxml)

End Sub
</script>