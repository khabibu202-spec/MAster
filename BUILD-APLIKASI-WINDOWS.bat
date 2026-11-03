@echo off
setlocal enabledelayedexpansion
title SIM SARPRAS SMP - APLIKASI DESKTOP OFFLINE (.EXE)
color 0B
cd /d "%~dp0"

:: ------------------------------------------------------------------------
:: Deteksi Node.js di lokasi instalasi standar Windows jika belum ada di PATH
:: ------------------------------------------------------------------------
where node >nul 2>&1
if %errorLevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=C:\Program Files\nodejs;%PATH%"
    ) else if exist "C:\Program Files (x86)\nodejs\node.exe" (
        set "PATH=C:\Program Files (x86)\nodejs;%PATH%"
    ) else if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
        set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
    )
)

:MENU
cls
echo ======================================================================
echo    ⚡ BUILDER APLIKASI WINDOWS (.EXE) - SIM SARPRAS SMP (ANTI GAGAL) ⚡
echo       MODE STANDALONE OFFLINE (TANPA BROWSER BIASA / TANPA LOCALHOST)
echo ======================================================================
echo.
echo  Pilih opsi yang Anda inginkan:
echo.
echo  [1] BUAT 1 FILE INSTALLER RESMI (.EXE) -> Setup-SIM-Sarpras-SMP.exe
echo      - Menghasilkan 1 file installer resmi (Setup Wizard)
echo      - Otomatis membuat Ikon Desktop dan Start Menu
echo      - Membuka jendela aplikasi desktop murni (tanpa address bar/tab)
echo      - Anti Gagal: Tidak butuh compiler/node ulang jika berkas sudah ada
echo.
echo  [2] BUAT 1 FILE EXE PORTABEL (.EXE) -> SIM-Sarpras-SMP.exe
echo      - 1 file .exe mandiri langsung jalan tanpa instalasi
echo      - Praktis bisa disimpan di Flashdisk / folder mana saja
echo      - Mode offline mandiri dengan server internal otomatis
echo.
echo  [3] INSTAL LANGSUNG KE KOMPUTER INI (TANPA COMPILE .EXE)
echo      - Paling cepat: Langsung memasang ke sistem Windows
echo      - Langsung membuat icon Desktop & Start Menu
echo.
echo  [4] BUKA APLIKASI DESKTOP OFFLINE SEKARANG (JENDELA MANDIRI)
echo      - Langsung membuka aplikasi desktop mandiri tanpa address bar
echo.
echo  [5] RE-BUILD ULANG DARI SUMBER (npm install + vite build)
echo.
echo  [0] Keluar
echo.
echo ======================================================================
set /p "CHOICE=Masukkan nomor pilihan Anda (1/2/3/4/5/0) lalu tekan ENTER: "

if "%CHOICE%"=="1" goto BUILD_INSTALLER
if "%CHOICE%"=="2" goto BUILD_PORTABLE
if "%CHOICE%"=="3" goto DIRECT_INSTALL
if "%CHOICE%"=="4" goto RUN_DESKTOP
if "%CHOICE%"=="5" goto FULL_REBUILD
if "%CHOICE%"=="0" goto KELUAR
goto MENU

:: ========================================================================
:BUILD_INSTALLER
cls
echo ======================================================================
echo  [1/2] MEMERIKSA BERKAS PAYLOAD INSTALLER...
echo ======================================================================
set "PAYLOAD_ZIP=%~dp0release\installer_payload.zip"
set "CS_FILE=%~dp0release\SetupProgram.cs"
set "OUTPUT_EXE=%~dp0release\Setup-SIM-Sarpras-SMP.exe"

:: Jika payload belum ada, buat terlebih dahulu
if not exist "%PAYLOAD_ZIP%" (
    echo [*] Menyiapkan payload aplikasi pertama kali...
    call :DO_GENERATE_PAYLOAD
) else if not exist "%CS_FILE%" (
    echo [*] Menyiapkan kode sumber C# installer...
    call :DO_GENERATE_PAYLOAD
) else (
    echo [+] Payload dan kode installer sudah siap: %PAYLOAD_ZIP%
)

echo.
echo ======================================================================
echo  [2/2] MENGOMPILASI MENJADI 1 FILE "Setup-SIM-Sarpras-SMP.exe"...
echo ======================================================================

set "COMPILED=0"
set "CSC_EXE="

:: Cari kompiler C# bawaan Windows (selalu ada di setiap Windows 10/11)
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
    echo  🎉 [BERHASIL] File Installer Telah Selesai Dibuat!
    echo ======================================================================
    echo  Lokasi File: %OUTPUT_EXE%
    echo ======================================================================
    echo.
    set /p "RUN_INSTALLER=Jalankan installer sekarang? (Y/T): "
    if /i "!RUN_INSTALLER!"=="Y" start "" "%OUTPUT_EXE%"
    explorer.exe /select,"%OUTPUT_EXE%"
) else (
    echo [!] File release\Setup-SIM-Sarpras-SMP.exe belum terbentuk.
    echo     Anda tetap bisa memasang langsung dengan memilih opsi [3].
)
echo.
pause
goto MENU

:: ========================================================================
:BUILD_PORTABLE
cls
echo ======================================================================
echo  [1/2] MEMERIKSA BERKAS APLIKASI PORTABEL...
echo ======================================================================
set "BUNDLE_ZIP=%~dp0release\app_bundle.zip"
set "CS_PROG=%~dp0release\Program.cs"
set "PORTABLE_EXE=%~dp0release\SIM-Sarpras-SMP.exe"

if not exist "%BUNDLE_ZIP%" (
    echo [*] Menyiapkan bundle aplikasi...
    call :DO_GENERATE_PAYLOAD
) else if not exist "%CS_PROG%" (
    echo [*] Menyiapkan kode sumber C# portable...
    call :DO_GENERATE_PAYLOAD
) else (
    echo [+] Bundle aplikasi sudah siap: %BUNDLE_ZIP%
)

echo.
echo ======================================================================
echo  [2/2] MENGOMPILASI MENJADI 1 FILE "SIM-Sarpras-SMP.exe"...
echo ======================================================================

set "COMPILED_P=0"
set "CSC_EXE="

if exist "%SystemRoot%\Microsoft.NET\Framework64\v4.0.30319\csc.exe" (
    set "CSC_EXE=%SystemRoot%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
) else if exist "%SystemRoot%\Microsoft.NET\Framework\v4.0.30319\csc.exe" (
    set "CSC_EXE=%SystemRoot%\Microsoft.NET\Framework\v4.0.30319\csc.exe"
)

if defined CSC_EXE (
    echo [*] Mengompilasi dengan native Windows compiler: %CSC_EXE%
    "%CSC_EXE%" /nologo /target:winexe /platform:anycpu /optimize+ /out:"%PORTABLE_EXE%" /resource:"%BUNDLE_ZIP%",Payload.zip /r:System.dll /r:System.Core.dll /r:Microsoft.CSharp.dll /r:System.Windows.Forms.dll /r:System.Drawing.dll /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll "%CS_PROG%"
    if exist "%PORTABLE_EXE%" set "COMPILED_P=1"
)

if "!COMPILED_P!"=="0" (
    echo [*] Mencoba kompilasi melalui PowerShell...
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& { & '%~dp0release\compile_single_exe.ps1' }"
    if exist "%PORTABLE_EXE%" set "COMPILED_P=1"
)

echo.
if exist "%PORTABLE_EXE%" (
    echo ======================================================================
    echo  🎉 [BERHASIL] Aplikasi Tunggal Portable Telah Selesai Dibuat!
    echo ======================================================================
    echo  Lokasi File: %PORTABLE_EXE%
    echo ======================================================================
    echo.
    set /p "RUN_PORTABLE=Buka aplikasi sekarang? (Y/T): "
    if /i "!RUN_PORTABLE!"=="Y" start "" "%PORTABLE_EXE%"
    explorer.exe /select,"%PORTABLE_EXE%"
) else (
    echo [!] File release\SIM-Sarpras-SMP.exe belum terbentuk.
)
echo.
pause
goto MENU

:: ========================================================================
:DIRECT_INSTALL
cls
echo ======================================================================
echo  MEMASANG SIM SARPRAS SMP LANGSUNG KE SISTEM WINDOWS
echo ======================================================================
call "PASANG_KE_SYSTEM_WINDOWS.cmd"
pause
goto MENU

:: ========================================================================
:RUN_DESKTOP
cls
echo ======================================================================
echo  MEMBUKA APLIKASI DESKTOP OFFLINE SIM SARPRAS SMP...
echo  (Jendela Mandiri Tanpa Tab Browser, Tanpa Localhost)
echo ======================================================================
wscript.exe "%~dp0launch-app.vbs"
echo [+] Aplikasi desktop telah diluncurkan.
timeout /t 3 >nul
goto MENU

:: ========================================================================
:FULL_REBUILD
cls
echo ======================================================================
echo  MEMASANG DEPENDENSI & MEMBANGUN ULANG DARI SUMBER (FULL REBUILD)
echo ======================================================================
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo [X] Node.js belum terpasang di komputer ini.
    echo     Silakan pasang Node.js dari https://nodejs.org terlebih dahulu jika ingin rebuild.
    pause
    goto MENU
)

echo [*] Memasang dependensi (npm install)...
call npm install --no-audit --no-fund

echo [*] Mengompilasi aplikasi web (npm run build)...
call npm run build

call :DO_GENERATE_PAYLOAD
echo [+] Rebuild selesai sempurna!
pause
goto MENU

:: ------------------------------------------------------------------------
:: SUBROUTINE: Buat Payload ZIP
:: ------------------------------------------------------------------------
:DO_GENERATE_PAYLOAD
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Node.js tidak terdeteksi di terminal.
    echo     Menggunakan berkas payload arsip yang sudah disertakan...
    exit /b 0
)
node "scripts\build-windows-system-installer.cjs"
node "scripts\build-single-exe.cjs"
exit /b 0

:KELUAR
exit /b 0
