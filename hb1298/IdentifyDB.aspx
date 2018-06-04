<%@ Import Namespace="System.Data" %>
<%@ Import Namespace="System.Data.OleDb" %>
<%@ Import Namespace="System.Xml" %>
<%@ Import Namespace="System.IO" %>
<%@ Import Namespace="System.Text" %>
<%@ Import Namespace="System.Text.RegularExpressions" %>
<%@ Page Debug="false" %>
<script language="vb" runat="server">

' http://www.altova.com/Access-Database-OLEDB-32bit-64bit.html
' Installed AccessDatabaseEngine_x64.exe from http://www.microsoft.com/download/en/details.aspx?displaylang=en&id=13255
' to read from mdb files on a 64 bit machine.

'*************************************************************************************************************
' This file is used by Identify Widget to lookup values in a database and display one to one or a bullet list of
' one to many values in the identify popup.  Set up the connection in SettingsWidget.xml.
'
' To debug type:
'		https://ndis-flex-2.nrel.colostate.edu/debug/hb1298/IdentifyDB.aspx?key=BEANS
'   https://ndismaps.nrel.colostate.edu/hb1298/IdentifyDB.aspx?key=BEANS
' For debugging set Page Debug="True" above.
'
' Return value is xml to IdentifyWidget.mxml. It reads from two databases, the first to get species name,
' the second to get a url for the species. The xml returned looks like:
'<?xml version="1.0" encoding="utf-16"?>
'<NewDataSet>
'  <Data>
'    <ActivityCode>Bald Eagle Active Nest Site</ActivityCode>
'  </Data>
'</NewDataSet>
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
  strConnect += "Data Source=C:\inetpub\wwwroot\database\hb1298\hb1298_ndis.mdb;"
  strConnect += "Persist Security Info=False"
	If (Request("key") = "" OR Request("key") IS Nothing) Then
	  Response.Write ("Missing parameter key.")
	  Exit Sub
  End If

  Dim pattern As String = "[^A-Za-z0-9 ]"
  Dim replacement As String = ""
  Dim rgx As New Regex(pattern)
  If (rgx.Match(Request("key"),pattern).Success) Then
    Response.Write("Invalid key")
    Exit Sub
  End If

  Dim mykey As String = Trim(rgx.Replace(Request("key").ToString(), replacement))

'*************************************************
'        Update SQL for species name here
'*************************************************
    Dim comm As new OleDbCommand
		objCommand = new OleDbDataAdapter(comm)
		strCommand =  "SELECT Data.Species, Data.Activity"
    strCommand += " FROM Data"
    strCommand += " WHERE (((Data.SpeciesCode)=@mykey))"
    strCommand += " ORDER BY Data.Species, Data.Activity;"
		comm.CommandText = strCommand
    comm.Parameters.AddWithValue("@mykey",mykey)
    objConnection = New OleDbConnection(strConnect)
    comm.Connection = objConnection
		
		'strCommand =  "SELECT Data.Species, Data.Activity"
    'strCommand +=     " FROM Data"
    'strCommand +=     " WHERE (((Data.SpeciesCode)='" & mykey & "'))"
    'strCommand +=     " ORDER BY Data.Species, Data.Activity;"
    'objConnection = New OleDbConnection(strConnect)
    'objCommand = New OleDbDataAdapter(strCommand, objConnection)

'**************************************************
'         Update name of database file here
'**************************************************
    objCommand.Fill(DataSet1, "Data")

	Dim myxml As String
	myxml = DataSet1.GetXml() 
 
'***************************************************************
' Now write xml combining the species name with the activity
' that were read from the database.
'***************************************************************
	' Create XML
	Dim output As StringBuilder = New StringBuilder()
	Dim spFlag As Boolean = false
	Dim actFlag As Boolean = false
	Using reader As XmlReader = XmlReader.Create(New StringReader(myxml))
		Dim ws As XmlWriterSettings = New XmlWriterSettings()
		ws.Indent = True
		Using writer As XmlWriter = XmlWriter.Create(output, ws)
			' Parse the file and display each of the nodes.
			While reader.Read()
				Select Case reader.NodeType
					' Write beginning tag
					Case XmlNodeType.Element				
						If (reader.Name = "Species")
							spFlag = true
							writer.WriteStartElement("ActivityCode")
						ElseIf (reader.Name = "Activity")
							actFlag = true
						Else
							writer.WriteStartElement(reader.Name)
						End If

					' Write tag value
					Case XmlNodeType.Text
						' If Species write:
						'	<ActivityCode>species
						If (spFlag)						
							writer.WriteString(reader.Value)
						' Else if Activity write:  activity</ActivityCode>
						ElseIf (actFlag)
							writer.WriteString(" "&reader.Value)
							writer.WriteFullEndElement()
						Else
							writer.WriteString(reader.Value)
						End If
					Case XmlNodeType.EndElement
						If (spFlag)
							spFlag=false
						ElseIf (actFlag)
							actFlag=false
						Else
							writer.WriteFullEndElement()
						End If
				End Select
			End While
		End Using
	End Using
	Response.Write (output.ToString())

End Sub
</script>