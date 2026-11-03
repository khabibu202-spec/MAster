@echo off
title BUILD 1 APLIKASI TUNGGAL (SIM-SARPRAS-SMP.EXE)
color 0B
cd /d "%~dp0"

echo ======================================================================
echo    MEMBUAT 1 APLIKASI TUNGGAL: SIM-Sarpras-SMP.exe (PORT 3030)
echo ======================================================================
echo.

set "OUTPUT_EXE=%~dp0release\SIM-Sarpras-SMP.exe"
set "CS_FILE=%~dp0release\Program.cs"
set "BUNDLE_ZIP=%~dp0release\app_bundle.zip"
set "COMPILED=0"

set "CSC_EXE="
if exist "%SystemRoot%\Microsoft.NET\Framework64\v4.0.30319\csc.exe" (
    set "CSC_EXE=%SystemRoot%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
) else if exist "%SystemRoot%\Microsoft.NET\Framework\v4.0.30319\csc.exe" (
    set "CSC_EXE=%SystemRoot%\Microsoft.NET\Framework\v4.0.30319\csc.exe"
)

if defined CSC_EXE (
    echo [*] Mengompilasi dengan native Windows compiler: %CSC_EXE%
    "%CSC_EXE%" /nologo /target:winexe /platform:anycpu /optimize+ /out:"%OUTPUT_EXE%" /resource:"%BUNDLE_ZIP%",Payload.zip /r:System.dll /r:System.Core.dll /r:Microsoft.CSharp.dll /r:System.Windows.Forms.dll /r:System.Drawing.dll /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll "%CS_FILE%"
    if exist "%OUTPUT_EXE%" set "COMPILED=1"
)

if "!COMPILED!"=="0" (
    echo [*] Mencoba kompilasi melalui PowerShell...
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& { & '%~dp0release\compile_single_exe.ps1' }"
    if exist "%OUTPUT_EXE%" set "COMPILED=1"
)

echo.
if exist "%OUTPUT_EXE%" (
    echo ======================================================================
    echo  [SUKSES] SIM-Sarpras-SMP.exe Telah Selesai Dibuat!
    echo ======================================================================
    echo  Lokasi File: %OUTPUT_EXE%
    echo ======================================================================
    echo.
    set /p "RUN_NOW=Buka aplikasi sekarang? (Y/T): "
    if /i "!RUN_NOW!"=="Y" start "" "%OUTPUT_EXE%"
) else (
    echo [X] Kompilasi belum berhasil.
)
echo.
pause
