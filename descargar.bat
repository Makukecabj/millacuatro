@echo off
cd /d "D:\Descargas\MillaCuatro"
echo ========================================
echo   Descargando fotos de Instagram...
echo ========================================
echo.
python "%~dp0download_photos.py"
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul
