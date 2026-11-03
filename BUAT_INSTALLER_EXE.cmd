@echo off
setlocal enabledelayedexpansion
title BUILD INSTALLER SYSTEM WINDOWS (Setup-SIM-Sarpras-SMP.exe)
color 0B
cd /d "%~dp0"

echo ======================================================================
echo    MEMBUAT INSTALLER SYSTEM WINDOWS: Setup-SIM-Sarpras-SMP.exe
echo                   SIM SARPRAS SMP NEGERI 3 KRAS
echo ======================================================================
echo.

set "OUTPUT_EXE=%~dp0release\Setup-SIM-Sarpras-SMP.exe"
set "CS_FILE=%~dp0release\SetupProgram.cs"
set "PAYLOAD_ZIP=%~dp0release\installer_payload.zip"
set "COMPILED=0"

set "CSC_EXE="
if exist "%SystemRoot%\Microsoft.NET\Framework64\v4.0.30319\csc.exe" (
    set "CSC_EXE=%SystemRoot%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
) else if exist "%SystemRoot%\Microsoft.NET\Framework\v4.0.30319\csc.exe" (
    set "CSC_EXE=%SystemRoot%\Microsoft.NET\Framework\v4.0.30319\csc.exe"
)

if defined CSC_EXE (
    echo [*] Mengompilasi dengan Windows native compiler: %CSC_EXE%
    "%CSC_EXE%" /nologo /target:winexe /platform:anycpu /optimize+ /out:"%OUTPUT_EXE%" /resource:"%PAYLOAD_ZIP%",Payload.zip /r:System.dll /r:System.Core.dll /r:Microsoft.CSharp.dll /r:System.Windows.Forms.dll /r:System.Drawing.dll /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll "%CS_FILE%"
    if exist "%OUTPUT_EXE%" set "COMPILED=1"
)

if "!COMPILED!"=="0" (
    echo [*] Mencoba kompilasi melalui PowerShell...
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& { & '%~dp0release\compile_setup_installer.ps1' }"
    if exist "%OUTPUT_EXE%" set "COMPILED=1"
)

echo.
if exist "%OUTPUT_EXE%" (
    echo ======================================================================
    echo  [SUKSES] File Installer Windows Berhasil Dibuat!
    echo ======================================================================
    echo  Lokasi File: %OUTPUT_EXE%
    echo ======================================================================
    echo.
    set /p "RUN_NOW=Jalankan installer sekarang? (Y/T): "
    if /i "!RUN_NOW!"=="Y" start "" "%OUTPUT_EXE%"
) else (
    echo [X] Kompilasi .exe belum berhasil. Anda dapat menjalankan:
    echo     PASANG_KE_SYSTEM_WINDOWS.cmd
)
echo.
pause
