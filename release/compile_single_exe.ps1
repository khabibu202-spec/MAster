
$outputExe = "$PSScriptRoot\SIM-Sarpras-SMP.exe"
$csFile = "$PSScriptRoot\Program.cs"
$zipFile = "$PSScriptRoot\app_bundle.zip"

Write-Host "[*] Mengompilasi SIM-Sarpras-SMP.exe..." -ForegroundColor Cyan

$cscPaths = @(
    "$env:SystemRoot\Microsoft.NET\Framework64\v4.0.30319\csc.exe",
    "$env:SystemRoot\Microsoft.NET\Framework\v4.0.30319\csc.exe"
)
$csc = $cscPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($csc) {
    $refs = "/r:System.dll,/r:System.Core.dll,/r:Microsoft.CSharp.dll,/r:System.Windows.Forms.dll,/r:System.Drawing.dll,/r:System.IO.Compression.dll,/r:System.IO.Compression.FileSystem.dll"
    & $csc /target:winexe /out:"$outputExe" /resource:"$zipFile,Payload.zip" $refs.Split(",") "$csFile"
}

if (Test-Path $outputExe) {
    Write-Host "[SUKSES] SIM-Sarpras-SMP.exe BERHASIL DIBUAT DENGAN SEMPURNA!" -ForegroundColor Green
}
