@echo off
title CMS Frontend
echo Starting Voltmover CMS Frontend...
echo.
cd /d "%~dp0"
set PORT=2001
npm start
pause
