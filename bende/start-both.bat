@echo off
echo 🚀 Starting CRM Servers...

echo ✅ Starting Backend Server...
start "Backend" cmd /k "node server.js"

echo ✅ Starting Frontend Server...  
start "Frontend" cmd /k "cd client && npm start"

echo 🌐 Servers starting...
echo 📊 Backend: http://localhost:5000
echo 🖥️ Frontend: http://localhost:3000
echo ⏰ Wait 30 seconds for full startup

timeout 5
start http://localhost:3000

echo ✅ CRM System Starting!

