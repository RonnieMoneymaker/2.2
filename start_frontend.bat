@echo off
echo 🔧 VoltMover CRM Frontend Setup
echo ========================================

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16 or higher.
    pause
    exit /b 1
)

echo ✅ Node.js detected

:: Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm.
    pause
    exit /b 1
)

echo ✅ npm detected

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
) else (
    echo ℹ️  Dependencies already installed
)

:: Start the development server
echo 🚀 Starting VoltMover CRM Frontend...
echo 📍 Frontend will be available at: http://localhost:2000
echo 🛑 Press Ctrl+C to stop the server
echo.

npm start
