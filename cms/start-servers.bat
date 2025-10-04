@echo off
echo Starting CMS servers...

echo Starting CMS API on port 2000...
start "CMS API" cmd /c "cd /d %~dp0 && npm start"

echo Waiting 3 seconds...
ping 127.0.0.1 -n 4 > nul

echo Starting React Frontend on port 2001...
start "React Frontend" cmd /c "cd /d %~dp0frontend && set PORT=2001 && npm start"

echo.
echo Servers are starting...
echo CMS API will be available at: http://localhost:2000
echo React Frontend will be available at: http://localhost:2001
echo.
pause

