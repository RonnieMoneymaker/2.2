@echo off
echo Starting CMS API on port 2000...
start "CMS API" cmd /c "cd /d \"%~dp0\" && npm start"

echo Waiting 5 seconds...
timeout /t 5 /nobreak > nul

echo Starting React Frontend on port 2001...
start "React Frontend" cmd /c "cd /d \"%~dp0frontend\" && set PORT=2001 && set BROWSER=none && npm start"

echo Both servers starting...
echo CMS API: http://localhost:2000
echo React Frontend: http://localhost:2001

