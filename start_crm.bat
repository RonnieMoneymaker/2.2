@echo off
title VoltMover CRM Launcher
color 0A

echo.
echo  ██╗   ██╗ ██████╗ ██╗  ████████╗███╗   ███╗ ██████╗ ██╗   ██╗███████╗██████╗ 
echo  ██║   ██║██╔═══██╗██║  ╚══██╔══╝████╗ ████║██╔═══██╗██║   ██║██╔════╝██╔══██╗
echo  ██║   ██║██║   ██║██║     ██║   ██╔████╔██║██║   ██║██║   ██║█████╗  ██████╔╝
echo  ╚██╗ ██╔╝██║   ██║██║     ██║   ██║╚██╔╝██║██║   ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗
echo   ╚████╔╝ ╚██████╔╝███████╗██║   ██║ ╚═╝ ██║╚██████╔╝ ╚████╔╝ ███████╗██║  ██║
echo    ╚═══╝   ╚═════╝ ╚══════╝╚═╝   ╚═╝     ╚═╝ ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═╝
echo.
echo                                    CRM v2.1.0
echo                          Moderne klantenbeheer applicatie
echo.
echo ================================================================================
echo.

:menu
echo Kies een optie:
echo.
echo [1] Start Backend (FastAPI)
echo [2] Start Frontend (React)
echo [3] Start Beide (Aanbevolen)
echo [4] Docker Setup
echo [5] Installeer Dependencies
echo [6] Toon Status
echo [0] Afsluiten
echo.
set /p choice="Voer je keuze in (0-6): "

if "%choice%"=="1" goto backend
if "%choice%"=="2" goto frontend
if "%choice%"=="3" goto both
if "%choice%"=="4" goto docker
if "%choice%"=="5" goto install
if "%choice%"=="6" goto status
if "%choice%"=="0" goto exit
goto menu

:backend
echo.
echo 🚀 Starting Backend...
echo ================================================================================
start "VoltMover CRM Backend" cmd /k "python start_backend.py"
echo ✅ Backend gestart in nieuw venster
pause
goto menu

:frontend
echo.
echo 🎨 Starting Frontend...
echo ================================================================================
start "VoltMover CRM Frontend" cmd /k "start_frontend.bat"
echo ✅ Frontend gestart in nieuw venster
pause
goto menu

:both
echo.
echo 🚀 Starting Backend en Frontend...
echo ================================================================================
start "VoltMover CRM Backend" cmd /k "python start_backend.py"
timeout /t 3 /nobreak >nul
start "VoltMover CRM Frontend" cmd /k "start_frontend.bat"
echo.
echo ✅ Beide services gestart!
echo 📍 Backend:  http://localhost:8000
echo 📍 Frontend: http://localhost:2000
echo 📖 API Docs: http://localhost:8000/docs
echo.
echo 🔑 Default login: admin / admin123
echo.
pause
goto menu

:docker
echo.
echo 🐳 Docker Setup...
echo ================================================================================
echo Controleren of Docker beschikbaar is...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is niet geïnstalleerd of niet beschikbaar
    echo    Download Docker Desktop van: https://www.docker.com/products/docker-desktop
    pause
    goto menu
)
echo ✅ Docker beschikbaar
echo.
echo Starting services met Docker Compose...
docker-compose up -d
if %errorlevel% equ 0 (
    echo ✅ Services gestart met Docker!
    echo 📍 Frontend: http://localhost:2000
    echo 📍 Backend:  http://localhost:8000
) else (
    echo ❌ Fout bij starten van Docker services
)
pause
goto menu

:install
echo.
echo 📦 Installing Dependencies...
echo ================================================================================
echo Installing Python dependencies...
pip install -r requirements.txt
echo.
echo Installing Node.js dependencies...
npm install
echo.
echo ✅ Dependencies geïnstalleerd!
pause
goto menu

:status
echo.
echo 📊 System Status...
echo ================================================================================
echo Python versie:
python --version 2>nul || echo ❌ Python niet gevonden
echo.
echo Node.js versie:
node --version 2>nul || echo ❌ Node.js niet gevonden
echo.
echo npm versie:
npm --version 2>nul || echo ❌ npm niet gevonden
echo.
echo Docker versie:
docker --version 2>nul || echo ❌ Docker niet gevonden
echo.
echo Poorten status:
netstat -an | findstr ":2000" >nul && echo ✅ Port 2000 (Frontend) in gebruik || echo ⚪ Port 2000 beschikbaar
netstat -an | findstr ":8000" >nul && echo ✅ Port 8000 (Backend) in gebruik || echo ⚪ Port 8000 beschikbaar
echo.
pause
goto menu

:exit
echo.
echo 👋 Bedankt voor het gebruiken van VoltMover CRM!
echo.
timeout /t 2 /nobreak >nul
exit
