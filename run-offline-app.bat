@echo off
REM Budget Planner - Offline Mode Launcher (Windows)
REM Double-click this file to run the app

setlocal enabledelayedexpansion

set "PROJECT_DIR=%~dp0"
set "FRONTEND_DIR=%PROJECT_DIR%frontend"
set "DIST_DIR=%FRONTEND_DIR%\dist"
set "PORT=4173"

echo.
echo 🎯 Budget Planner - Offline Mode
echo =================================
echo.

REM Check if node_modules exists
if not exist "%FRONTEND_DIR%\node_modules" (
    echo 📦 Installing dependencies...
    cd /d "%FRONTEND_DIR%"
    call npm install
    cd /d "%PROJECT_DIR%"
)

REM Build if dist doesn't exist
if not exist "%DIST_DIR%" (
    echo 🔨 Building app...
    cd /d "%FRONTEND_DIR%"
    call npm run build >nul 2>&1
    cd /d "%PROJECT_DIR%"
    echo ✅ Build complete
)

echo.
echo 🚀 Starting offline app...
echo 📍 Opening http://localhost:%PORT%
echo.
echo ✨ Your app is running!
echo 📝 All data is stored locally in your browser
echo.
echo ⚠️  Keep this window open. Close it to stop the server.
echo.

REM Wait a moment and open browser
timeout /t 2 /nobreak >nul
start http://localhost:%PORT%

REM Start server
cd /d "%DIST_DIR%"
call npx serve -p %PORT% --single

pause
