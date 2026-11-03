@echo off
setlocal enabledelayedexpansion
title INSTAL SIM SARPRAS KE SISTEM WINDOWS (APLIKASI DESKTOP OFFLINE)
color 0A
cd /d "%~dp0"

echo ======================================================================
echo       PEMASANGAN APLIKASI DESKTOP OFFLINE SIM SARPRAS SMP
echo         (JENDELA MANDIRI TANPA BROWSER/URL LOCALHOST)
echo ======================================================================
echo.

set "TARGET_DIR=%LOCALAPPDATA%\Programs\SIM-Sarpras-SMP"
echo [*] Folder Instalasi: %TARGET_DIR%

if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"
if not exist "%TARGET_DIR%\dist" mkdir "%TARGET_DIR%\dist"
if not exist "%TARGET_DIR%\scripts" mkdir "%TARGET_DIR%\scripts"
if not exist "%TARGET_DIR%\data" mkdir "%TARGET_DIR%\data"
if not exist "%TARGET_DIR%\data\backups" mkdir "%TARGET_DIR%\data\backups"

echo [*] Menyalin berkas aplikasi offline...
xcopy /E /I /Y "dist\*" "%TARGET_DIR%\dist\" >nul 2>&1
copy /Y "server-lokal.cjs" "%TARGET_DIR%\" >nul 2>&1
copy /Y "launch-app.vbs" "%TARGET_DIR%\" >nul 2>&1
copy /Y "scripts\central-db.cjs" "%TARGET_DIR%\scripts\" >nul 2>&1
copy /Y "scripts\init-default-db.cjs" "%TARGET_DIR%\scripts\" >nul 2>&1
copy /Y "public\icon.svg" "%TARGET_DIR%\" >nul 2>&1

if not exist "%TARGET_DIR%\data\database.json" (
    copy /Y "data\database.json" "%TARGET_DIR%\data\" >nul 2>&1
)

set "VBS_LAUNCHER=%TARGET_DIR%\launch-app.vbs"

echo [*] Membuat Pintasan Desktop Mandiri (Desktop Shortcut)...
powershell -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%USERPROFILE%\Desktop\SIM Sarpras SMP.lnk');$s.TargetPath='wscript.exe';$s.Arguments='\"%VBS_LAUNCHER%\"';$s.WorkingDirectory='%TARGET_DIR%';$s.Description='Aplikasi Desktop Mandiri SIM Sarpras SMP';$s.Save()"

echo [*] Mendaftarkan ke Start Menu Windows...
set "START_MENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs\SIM Sarpras SMP"
if not exist "%START_MENU%" mkdir "%START_MENU%"
powershell -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%START_MENU%\SIM Sarpras SMP.lnk');$s.TargetPath='wscript.exe';$s.Arguments='\"%VBS_LAUNCHER%\"';$s.WorkingDirectory='%TARGET_DIR%';$s.Description='Aplikasi Desktop Mandiri SIM Sarpras SMP';$s.Save()"

echo [*] Mendaftarkan ke Windows Settings (Add/Remove Programs)...
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\SIMSarprasSMP" /v "DisplayName" /d "SIM Sarpras SMP" /f >nul 2>&1
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\SIMSarprasSMP" /v "DisplayVersion" /d "1.0.0" /f >nul 2>&1
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\SIMSarprasSMP" /v "Publisher" /d "SMP Negeri 3 Kras" /f >nul 2>&1
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\SIMSarprasSMP" /v "InstallLocation" /d "%TARGET_DIR%" /f >nul 2>&1

echo.
echo ======================================================================
echo  [SUKSES] SIM Sarpras SMP Berhasil Dipasang Sebagai Aplikasi Desktop!
echo ======================================================================
echo - Aplikasi akan terbuka dalam jendela tersendiri (Bukan Tab Browser).
echo - Bebas dari address bar browser dan tidak memanggil URL localhost.
echo - Ikon pintasan telah dibuat di Desktop dan Start Menu Windows.
echo ======================================================================
echo.
wscript.exe "%VBS_LAUNCHER%"
pause
