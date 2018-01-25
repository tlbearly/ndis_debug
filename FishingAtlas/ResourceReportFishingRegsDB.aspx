<%@ Import Namespace="System.Data" %>
<%@ Import Namespace="System.Data.OleDb" %>
<%@ Import Namespace="System.Xml" %>
<%@ Page Debug="False" %>
<script language="vb" runat="server">
' http://www.altova.com/Access-Database-OLEDB-32bit-64bit.html
' Installed AccessDatabaseEngine_x64.exe from http://www.microsoft.com/download/en/details.aspx?displaylang=en&id=13255
' to read from mdb files on a 64 bit machine.

'*************************************************************************************************************
' This file is used by Resource Report Widget to lookup values in a database and display one to one or a comma
' delimited list of one to many values in the resource report.  Set up the connection in ResourceReportWidget.xml
' database tag.
'
' To debug type: http://ndis-flex.nrel.colostate.edu/debug/test/ResourceReportFishingRegsDB.aspx?key=416,419 into the browser
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
  strConnect += "Data Source=C:\Projects\fishingatlas\Data\FishingRegs\FishingRegs_2016.mdb;"
  strConnect += "Persist Security Info=False"

  Response.Write ("<?xml version=""1.0"" encoding=""UTF-16""?>"&vbcrlf)

  If (Request("key") = "" AND Request("key") IS Nothing) Then
	Response.Write ("Missing parameter key.")
	Response.End
  End If  

  Dim mykey() = Request("key").split(",")
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
    strCommand =  "SELECT LOCATION_NO_OVERLAP.LOC_ID, LOCATION_NO_OVERLAP.WATER, LOCATION_NO_OVERLAP.SPECIFIC_AREA, REGS_CW.REG_ORDER, REGS_CW.REG_DESC"
    strCommand +=	" FROM (LOCATION_NO_OVERLAP INNER JOIN PIVOT_NO_OVERLAP ON LOCATION_NO_OVERLAP.LOC_ID = PIVOT_NO_OVERLAP.LOC_ID) INNER JOIN REGS_CW ON PIVOT_NO_OVERLAP.REG_CODE = REGS_CW.REG_CODE"
    strCommand +=	" WHERE (((LOCATION_NO_OVERLAP.LOC_ID)=" & mykey(i) & "))"
    strCommand +=	" ORDER BY LOCATION_NO_OVERLAP.LOC_ID, REGS_CW.REG_ORDER;"

' debug
' Response.Write (strCommand)

    objConnection = New OleDbConnection(strConnect)
    objCommand = New OleDbDataAdapter(strCommand, objConnection)

'**************************************************
'         Update name of database file here
'**************************************************
    objCommand.Fill(DataSet1, "LOCATION_NO_OVERLAP")

    myxml = DataSet1.GetXml() 
    DataSet1 = Nothing
    Response.Write (myxml)
  Next
  Response.Write ("</myxml>")

End Sub
</script>