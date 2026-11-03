
$outputExe = "$PSScriptRoot\Setup-SIM-Sarpras-SMP.exe"
$csFile = "$PSScriptRoot\SetupProgram.cs"
$zipFile = "$PSScriptRoot\installer_payload.zip"

Write-Host "[*] Mengompilasi Setup-SIM-Sarpras-SMP.exe..." -ForegroundColor Cyan

$cscPaths = @(
    "$env:SystemRoot\Microsoft.NET\Framework64\v4.0.30319\csc.exe",
    "$env:SystemRoot\Microsoft.NET\Framework\v4.0.30319\csc.exe"
)
$csc = $cscPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($csc) {
    $cscArgs = @(
        "/nologo",
        "/target:winexe",
        "/platform:anycpu",
        "/optimize+",
        "/out:$outputExe",
        "/resource:$zipFile,Payload.zip",
        "/r:System.dll",
        "/r:System.Core.dll",
        "/r:Microsoft.CSharp.dll",
        "/r:System.Windows.Forms.dll",
        "/r:System.Drawing.dll",
        "/r:System.IO.Compression.dll",
        "/r:System.IO.Compression.FileSystem.dll",
        $csFile
    )
    & $csc $cscArgs
}

if (Test-Path $outputExe) {
    Write-Host "[SUKSES] Setup-SIM-Sarpras-SMP.exe berhasil dibuat!" -ForegroundColor Green
} else {
    Write-Host "[X] Kompilasi csc.exe belum berhasil." -ForegroundColor Red
}
