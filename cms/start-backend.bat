@echo off
title CMS Backend Server
echo Starting Voltmover CMS Backend...
echo.
cd /d "%~dp0"
set DATABASE_URL=file:./prisma/dev.db
set PORT=2000
npm start
pause
