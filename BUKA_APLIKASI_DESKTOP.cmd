@echo off
title SIM SARPRAS SMP - APLIKASI DESKTOP OFFLINE
cd /d "%~dp0"
echo ======================================================================
echo    MEMBUKA APLIKASI DESKTOP OFFLINE SIM SARPRAS SMP
echo    (Jendela Mandiri Tanpa Address Bar, Tanpa Tab Browser, Tanpa Localhost)
echo ======================================================================
wscript.exe "%~dp0launch-app.vbs"
