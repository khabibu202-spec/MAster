@echo off
title UNINSTALL SIM SARPRAS SMP
echo =====================================================================
echo           PENGHAPUSAN SIM SARPRAS SMP DARI SISTEM WINDOWS
echo =====================================================================
echo.
echo Sedang menghentikan layanan latar belakang...
taskkill /F /IM node.exe >nul 2>&1
schtasks /delete /tn "SIM_Sarpras_Server_Daemon" /f >nul 2>&1

echo Menghapus entri Windows Registry...
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\SIMSarprasSMP" /f >nul 2>&1

echo Menghapus pintasan Desktop dan Start Menu...
del /F /Q "%USERPROFILE%\Desktop\SIM Sarpras SMP.lnk" >nul 2>&1
rmdir /S /Q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\SIM Sarpras SMP" >nul 2>&1

echo Menutup port firewall...
netsh advfirewall firewall delete rule name="SIM_Sarpras_Port_3030" >nul 2>&1

echo.
echo [SUKSES] SIM Sarpras SMP telah berhasil dihapus dari sistem Windows.
echo Folder data di %~dp0 masih disimpan untuk keamanan basis data Anda.
pause
