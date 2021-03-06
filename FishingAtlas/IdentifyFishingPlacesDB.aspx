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
' one to many values in the identify popup.  Set up the connection in SettingWidget.xml.
'
' To debug type:
'   https://ndis-flex-2.nrel.colostate.edu/debug/FishingAtlas/IdentifyFishingPlacesDB.aspx?key=52580
' For debugging set Page Debug="True" above.
'
' Return value is xml to IdentifyWidget.mxml. It reads from two databases, the first to get species name,
' the second to get a url for the species. The xml returned looks like:
'<?xml version="1.0" encoding="utf-16"?>
'<NewDataSet>
'  <tblMasterSpecies>
'    <WATERCODE>52580</WATERCODE>
'    <AtlasFishGroup>Bass (Black)</AtlasFishGroup>
'    <AtlasFish>
'      <linkname>Bass: Largemouth</linkname>
'      <linkurl>http://en.wikipedia.org/wiki/Largemouth_Bass</linkurl>
'    </AtlasFish>
'  </tblMasterSpecies>
'  <tblMasterSpecies>
'    <WATERCODE>52580</WATERCODE>
'    <AtlasFishGroup>Bass (Temperate)</AtlasFishGroup>
'    <AtlasFish>
'      <linkname>Wiper</linkname>
'      <linkurl>http://en.wikipedia.org/wiki/Hybrid_striped_bass</linkurl>
'    </AtlasFish>
'  </tblMasterSpecies>
'</NewDataSet>
'*************************************************************************************************************

Sub Page_Load(Sender As Object, E as EventArgs)
  Dim objConnection As OleDbConnection
  Dim objCommand As OleDbDataAdapter
  Dim strConnect As String
  Dim strCommand As String
  Dim DataSet1 As New DataSet
  Dim DataSet2 As New DataSet

  strConnect =  "Provider=Microsoft.ACE.OLEDB.12.0;"
'*************************************************
'        Update database url here
'*************************************************
  strConnect += "Data Source=C:\Projects\fishingatlas\Data\Working\AtlasFishSpecies.mdb;"
  strConnect += "Persist Security Info=False"
  
	If (Request("key") = "" OR Request("key") IS Nothing) Then
	  Response.Write ("Missing parameter key.")
	  Exit Sub
  End If

  Dim i As Integer
  Dim pattern As String = "[^0-9a-zA-Z ]"
  Dim replacement As String = ""
  Dim rgx As New Regex(pattern)
  If (rgx.Match(Request("key"),pattern).Success) Then
    Response.Write("Invalid key")
    Exit Sub
  End If
  Dim mykey As String = Trim(rgx.Replace(Request("key").ToString(), replacement).ToString())

'*************************************************
'        Update SQL for species name here
'*************************************************
    Dim comm As new OleDbCommand
		objCommand = new OleDbDataAdapter(comm)
		strCommand =  "SELECT tblMasterSpecies.WATERCODE, tblMasterSpecies.AtlasFishGroup, tblMasterSpecies.AtlasFish"
    strCommand += " FROM tblMasterSpecies"
    strCommand += " WHERE (((tblMasterSpecies.WATERCODE)=@mykey))"
    strCommand += " ORDER BY tblMasterSpecies.AtlasFishGroup, tblMasterSpecies.AtlasFish;"
    comm.CommandText = strCommand
    comm.Parameters.AddWithValue("@mykey",mykey)
    objConnection = New OleDbConnection(strConnect)
    comm.Connection = objConnection

    'strCommand =  "SELECT tblMasterSpecies.WATERCODE, tblMasterSpecies.AtlasFishGroup, tblMasterSpecies.AtlasFish"
    'strCommand +=     " FROM tblMasterSpecies"
    'strCommand +=     " WHERE (((tblMasterSpecies.WATERCODE)='" & mykey & "'))"
    'strCommand +=     " ORDER BY tblMasterSpecies.AtlasFishGroup, tblMasterSpecies.AtlasFish;"
    'objConnection = New OleDbConnection(strConnect)
		'objCommand = New OleDbDataAdapter(strCommand, objConnection)
		
'**************************************************
'         Update name of database file here
'**************************************************
    objCommand.Fill(DataSet1, "tblMasterSpecies")

  Dim myxml As String
  myxml = DataSet1.GetXml() 

'***************************************************************
' Now write xml for the fish names that were read from the
' database and lookup & write the url link to fish species info
'***************************************************************
  
	' Create XML
	Dim output As StringBuilder = New StringBuilder()
	Dim flag As Boolean = false
	Dim species As String = ""
	Using reader As XmlReader = XmlReader.Create(New StringReader(myxml))
		Dim ws As XmlWriterSettings = New XmlWriterSettings()
		ws.Indent = True
		Using writer As XmlWriter = XmlWriter.Create(output, ws)

			' Parse the file and display each of the nodes.
			While reader.Read()
				Select Case reader.NodeType
				
					' Write beginning tag
					Case XmlNodeType.Element
						writer.WriteStartElement(reader.Name)
						If (reader.Name = "AtlasFish")
							flag = true
						End If

					' Write tag value
					Case XmlNodeType.Text
						' If AtlasFish write:
						'	<linkname>fish species</linkname>
						If (flag)
							writer.WriteStartElement("linkname")
							writer.WriteString(reader.Value)
							species=reader.Value
							writer.WriteFullEndElement()
						Else
							writer.WriteString(reader.Value)
						End If

					' Write ending tag
					Case XmlNodeType.EndElement
						' If AtlasFish write:
						'	<linkurl>http://...</linkurl>
						' </AtlasFish>
						If (flag)
							writer.WriteStartElement("linkurl")
							
							'*************************************************
							'        Update SQL for url here
							'*************************************************
							comm = new OleDbCommand
							objCommand = new OleDbDataAdapter(comm)
							strCommand =  "SELECT LUT_AtlasFishList.AtlasFish, LUT_AtlasFishList.FishURL"
							strCommand +=     " FROM LUT_AtlasFishList"
							strCommand +=     " WHERE (((LUT_AtlasFishList.AtlasFish)=@species))"
							strCommand +=     " ORDER BY LUT_AtlasFishList.AtlasFish;"
							comm.CommandText = strCommand
							comm.Parameters.AddWithValue("@species",species)
							objConnection = New OleDbConnection(strConnect)
							comm.Connection = objConnection
							
							'strCommand =  "SELECT LUT_AtlasFishList.AtlasFish, LUT_AtlasFishList.FishURL"
							'strCommand +=     " FROM LUT_AtlasFishList"
							'strCommand +=     " WHERE (((LUT_AtlasFishList.AtlasFish)='" & species & "'))"
							'strCommand +=     " ORDER BY LUT_AtlasFishList.AtlasFish;"
							'objConnection = New OleDbConnection(strConnect)
							'objCommand = New OleDbDataAdapter(strCommand, objConnection)
							
							'**************************************************
							'    Update name of database file containing url
							'**************************************************
							objCommand.Fill(DataSet2, "LUT_AtlasFishList")
							writer.WriteString(DataSet2.Tables(0).Rows(0)("FishURL"))
							writer.WriteFullEndElement()
							flag = false
							DataSet2.Clear()
						End If
						writer.WriteFullEndElement()
				End Select
			End While
		End Using
	End Using
	Response.Write (output.ToString())

End Sub
</script>