@echo off
echo Starting Laravel WebSocket Server...
echo.

REM Use full path to PHP (XAMPP default location)
set PHP_PATH=C:\xampp\php\php.exe

REM Check if PHP exists at the specified path
if not exist "%PHP_PATH%" (
    echo PHP not found at: %PHP_PATH%
    echo.
    echo Please update the PHP_PATH in this batch file to point to your PHP executable.
    echo Common PHP locations:
    echo   C:\xampp\php\php.exe
    echo   C:\php\php.exe
    echo.
    pause
    exit /b 1
)

REM Change to the backend directory
cd /d "%~dp0"

REM Start the WebSocket server
echo Running: "%PHP_PATH%" artisan websockets:serve --host=127.0.0.1 --port=6001
echo.
"%PHP_PATH%" artisan websockets:serve --host=127.0.0.1 --port=6001

if %errorlevel% neq 0 (
    echo.
    echo Failed to start WebSocket server.
    echo Possible issues:
    echo 1. Composer dependencies not installed (run composer install)
    echo 2. .env file not configured properly
    echo 3. Database not migrated (run php artisan migrate)
    pause
)