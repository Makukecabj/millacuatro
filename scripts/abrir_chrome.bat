@echo off
title Abriendo Chrome para Instagram...
echo ========================================
echo   Abriendo Chrome con debugging...
echo ========================================
echo.
echo Si Chrome ya esta abierto, cerralo primero.
echo.

set CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe
if not exist "%CHROME%" set CHROME=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe

set USERDATA=%LOCALAPPDATA%\Google\Chrome\User Data

start "" "%CHROME%" --remote-debugging-port=9222 --user-data-dir="%USERDATA%" --profile-directory=Default
echo Chrome abierto! Ahora podes loguearte a Instagram.
echo Cuando estes listo, ejecuta descargar.bat
echo.
pause
