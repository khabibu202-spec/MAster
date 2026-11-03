Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = currentDir

' 1. Deteksi path Node.js di komputer (jika terpasang)
nodeExe = ""
If fso.FileExists("C:\Program Files\nodejs\node.exe") Then
    nodeExe = "C:\Program Files\nodejs\node.exe"
ElseIf fso.FileExists("C:\Program Files (x86)\nodejs\node.exe") Then
    nodeExe = "C:\Program Files (x86)\nodejs\node.exe"
ElseIf fso.FileExists(WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%\Programs\nodejs\node.exe")) Then
    nodeExe = WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%\Programs\nodejs\node.exe")
Else
    ' Coba uji perintah node di PATH
    On Error Resume Next
    Dim testExec
    Set testExec = WshShell.Exec("node -v")
    If Err.Number = 0 Then
        nodeExe = "node"
    End If
    On Error GoTo 0
End If

' 2. Jalankan engine server data secara senyap di latar belakang jika Node terpasang
Dim isServerRunning
isServerRunning = False
If nodeExe <> "" And fso.FileExists(currentDir & "\server-lokal.cjs") Then
    WshShell.Run """" & nodeExe & """ """ & currentDir & "\server-lokal.cjs""", 0, False
    WScript.Sleep 500
    isServerRunning = True
End If

' 3. Deteksi Microsoft Edge atau Google Chrome untuk Mode Aplikasi Mandiri
' Mode --app: Membuka jendela aplikasi desktop murni, TANPA address bar, TANPA tab browser, TANPA tulisan localhost!
edgePath = ""
If fso.FileExists("C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe") Then
    edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
ElseIf fso.FileExists("C:\Program Files\Microsoft\Edge\Application\msedge.exe") Then
    edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
ElseIf fso.FileExists(WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe")) Then
    edgePath = WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe")
End If

chromePath = ""
If fso.FileExists("C:\Program Files\Google\Chrome\Application\chrome.exe") Then
    chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
ElseIf fso.FileExists("C:\Program Files (x86)\Google\Chrome\Application\chrome.exe") Then
    chromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
ElseIf fso.FileExists(WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe")) Then
    chromePath = WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe")
End If

' 4. Tentukan target URL (Jika server aktif gunakan internal loopback 127.0.0.1, jika tidak buka file lokal langsung)
appTarget = ""
runFileMode = False
If isServerRunning Then
    appTarget = "http://127.0.0.1:3030"
Else
    ' Mode Offline Murni via file:// langsung tanpa perlu server/node sama sekali
    Dim normPath
    normPath = Replace(currentDir, "\", "/")
    appTarget = "file:///" & normPath & "/dist/index.html"
    runFileMode = True
End If

' 5. Buka jendela aplikasi desktop
userDataDir = WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%\SIM_Sarpras_Data")

If edgePath <> "" Then
    If runFileMode Then
        WshShell.Run """" & edgePath & """ --app=""" & appTarget & """ --allow-file-access-from-files --user-data-dir=""" & userDataDir & """ --window-size=1366,820", 1, False
    Else
        WshShell.Run """" & edgePath & """ --app=""" & appTarget & """ --window-size=1366,820", 1, False
    End If
ElseIf chromePath <> "" Then
    If runFileMode Then
        WshShell.Run """" & chromePath & """ --app=""" & appTarget & """ --allow-file-access-from-files --user-data-dir=""" & userDataDir & """ --window-size=1366,820", 1, False
    Else
        WshShell.Run """" & chromePath & """ --app=""" & appTarget & """ --window-size=1366,820", 1, False
    End If
Else
    ' Fallback jika tidak ditemukan Chromium
    WshShell.Run appTarget, 1, False
End If
