@echo off
title Voltmover CMS - Starting All Services
color 0A
echo.
echo ========================================
echo   VOLTMOVER CMS - Complete Backend
echo ========================================
echo.
echo Starting all services...
echo.

cd /d "%~dp0"

REM Kill any existing node processes
echo [1/4] Cleaning up existing processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Start Backend
echo [2/4] Starting Backend API (Port 2000)...
cd cms
start "CMS Backend" cmd /k "set DATABASE_URL=file:./prisma/dev.db && set PORT=2000 && npm start"
cd ..

REM Wait for backend to start
timeout /t 8 /nobreak >nul

REM Start Frontend
echo [3/4] Starting Frontend (Port 2001)...
cd cms\frontend
start "CMS Frontend" cmd /k "set PORT=2001 && npm start"
cd ..\..

REM Wait for frontend to start
timeout /t 10 /nobreak >nul

REM Open browsers
echo [4/4] Opening browsers...
start http://localhost:2001
timeout /t 2 /nobreak >nul
start http://localhost:2001/live

echo.
echo ========================================
echo   ALL SERVICES STARTED!
echo ========================================
echo.
echo Backend API:     http://localhost:2000
echo Frontend:        http://localhost:2001
echo Live Dashboard:  http://localhost:2001/live
echo.
echo Press any key to exit (servers will keep running)
pause
