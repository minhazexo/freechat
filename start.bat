@echo off
REM FreeChat Startup Script
REM Run this file to start all required servers

echo ========================================
echo FreeChat Startup
echo ========================================
echo.

REM Check if Node.js is available
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if PHP is available  
where php >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PHP not found. Please install PHP first.
    pause
    exit /b 1
)

echo [1/3] Starting Backend API Server...
start "Backend API" cmd /k "cd /d %~dp0backend && php artisan serve --host=127.0.0.1 --port=8000"

timeout /t 3 /nobreak >nul

echo [2/3] Starting WebSocket Server...
start "WebSocket" cmd /k "cd /d %~dp0backend && php artisan websockets:serve --host=127.0.0.1 --port=6001"

timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend...
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo All servers starting...
echo.
echo URLs:
echo - Frontend: http://localhost:5173
echo - Backend API: http://localhost:8000
echo - WebSocket: ws://localhost:6001
echo.
echo Keep these windows open while using the app!
echo ========================================
echo.
pause