<%@ Import Namespace="System.Web" %>
<%@ Import Namespace="System.IO" %>
<html>
<head>
<script language="vb" runat="server">
' Reads from a log file like: "C:\NDIS_Share\Logs\u_ex191021.log" and parses out
' User Agents when there is no referer. Or Referer if it is not ndismaps or gisweb/fastmaps.
' Writes to "C:\NDIS_Share\Logs\u_ex191021Parsed.log" and displays to screen.
' Run in a browser: http://ndis-flex-2.nrel.colostate.edu/debug/parselogs.aspx?in=C:\NDIS_Share\Logs\u_ex191021.log
' Where in = name of log file to parse.
Dim userAgents As String
Dim count As Integer = 0
Dim count2 As Integer = 0
Dim errors As String = ""
Dim outFile As String
Dim inFile As String = "C:/NDIS_Share/Logs/u_ex191021.log"

Sub Page_Load()
  If (NOT File.Exists(inFile)) Then
    userAgents = "ERROR: Input file does not exist."
    return
  End IF
  Dim userAgentsArr As List(Of String) = New List(Of String)
  Using MyReader As New Microsoft.VisualBasic.
                      FileIO.TextFieldParser(
                        inFile)
    Dim inLen = Len(inFile)-4
    outFile = inFile.Substring(0,inLen)
    outFile = outFile + "Parsed.log"                    
    MyReader.TextFieldType = FileIO.FieldType.Delimited
    MyReader.SetDelimiters(" ")
    Dim currentRow As String()
    userAgents = ""
    Dim status As String
    While Not MyReader.EndOfData
        Try
          currentRow = MyReader.ReadFields()
          If (currentRow.Length >= 11) Then
            If (currentRow(0).Substring(0,1) <> "#") Then
              ' Get return status code 200=successful 500=failed
              If (currentRow(11) = 200) Then
                status = ", SUCCESS"
              Else If (currentRow(11) = 500) Then
                status = ", FAILED"
              Else If (currentRow(11) = 403) Then
                status = ", 403 FORBIDDEN"
              Else If (currentRow(11) = 404) Then
                status = ", 404 BAD URI or MISSING RESOURCE"
              Else If (currentRow(11) = 301) Then
                status = ", 301 URI PERMENANTLY MOVED"
              Else If (currentRow(11) = 302) Then
                status = ", 302 URI TEMPORARILY MOVED or REDIRECTED"
              Else If (currentRow(11) = 304) Then
                status = ", 304 NOT MODIFIED SO USE BROWSER CACHE"
              Else
                status = " ,"+currentRow(11)+" STATUS"
              End If  
              'If there is no referer, I will pull from user-agent.
              'Else If there is a referer I will display that as long as it is not ndismaps.  
              If (currentRow(10) = "-") Then
                Dim pos As Integer
                pos = currentRow(9).indexOf("/")
                If (pos = -1) Then
                  pos = Len(currentRow(9))
                End If
                userAgentsArr.Add("USER-AGENT: "+currentRow(9).Substring(0,pos)+status)
                count = count + 1
              ElseIf  ((currentRow(10).indexOf("https://ndismaps") = -1) AND
               (currentRow(10).indexOf("http://ndismaps") = -1) AND
               (currentRow(10).indexOf("http://gisweb/fastmaps") = -1)) Then  
                  userAgentsArr.Add("REFERER: "+currentRow(10)+status)
                  count = count + 1
              End If
            End If
          End If
        Catch ex As Microsoft.VisualBasic.
                    FileIO.MalformedLineException
                    errors = errors+"ERROR: " & ex.Message &
          "is not valid and will be skipped."
        Catch
          errors = errors + "ERROR: unknown error reading line."
        End Try
    End While
    userAgentsArr.Sort()
    Dim file As System.IO.StreamWriter
    file = My.Computer.FileSystem.OpenTextFileWriter(outFile, True)

    Dim unique As List(Of String) = New List(Of String)
    If (userAgentsArr.Count() = 0)
      file.Close()  
      return
    End If
    Dim prev As String
    prev = userAgentsArr(0)
    Dim innerCount As Integer = 0
    For Each line in userAgentsArr
      If (line = prev) Then
        innerCount = innerCount + 1
      Else
        innerCount = innerCount + 1
        file.WriteLine("Count: "+innerCount.ToString()+", "+line)
        unique.Add("Count: "+innerCount.ToString()+", "+line)
        prev = line
        innerCount = 0
      End IF
    Next
    file.Close()
    userAgents = String.Join("<br/>", unique)
  End Using
End Sub

'$date, $time, $s-ip, $cs-method, $cs-uri-stem, $cs-uri-query, $s-port, $cs-username, $c-ip, $csUser-Agent, $csReferer, $sc-status, $sc-substatus, $sc-wind32-status, $time-taken) = split(" ")

</script>
</head>
<body>
Reading <%=inFile%>...<br/>
<p>Writing parsed file to: <%=outFile%>...</p>
<p>Total Count: <%=count%></p>
<p><%=userAgents%></p>
</body>
</html>