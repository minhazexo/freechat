# PowerShell script to start Laravel WebSocket Server
Write-Host "Starting Laravel WebSocket Server..." -ForegroundColor Cyan
Write-Host ""

# Try common PHP paths
$phpPaths = @(
    "C:\xampp\php\php.exe",
    "C:\php\php.exe",
    (Get-Command php -ErrorAction SilentlyContinue).Source
)

$phpExe = $null
foreach ($path in $phpPaths) {
    if ($path -and (Test-Path $path)) {
        $phpExe = $path
        break
    }
}

if (-not $phpExe) {
    Write-Host "ERROR: PHP not found." -ForegroundColor Red
    Write-Host "Please install PHP or update the script with your PHP path." -ForegroundColor Yellow
    Write-Host "Common PHP locations:" -ForegroundColor Yellow
    Write-Host "  - C:\xampp\php\php.exe" -ForegroundColor Yellow
    Write-Host "  - C:\php\php.exe" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can also add PHP to PATH:" -ForegroundColor Yellow
    Write-Host "  [Environment]::SetEnvironmentVariable('Path', `"`$env:Path;C:\xampp\php`", 'User')" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "Using PHP at: $phpExe" -ForegroundColor Green

# Change to the backend directory
Set-Location -Path $PSScriptRoot

# Check if artisan file exists
if (-not (Test-Path "artisan")) {
    Write-Host "ERROR: artisan file not found in current directory." -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "Found artisan file. Starting WebSocket server..." -ForegroundColor Green
Write-Host "Command: `"$phpExe`" artisan websockets:serve --host=127.0.0.1 --port=6001" -ForegroundColor Cyan
Write-Host ""

# Start the WebSocket server
try {
    & "$phpExe" artisan websockets:serve --host=127.0.0.1 --port=6001
}
catch {
    Write-Host "ERROR: Failed to start WebSocket server." -ForegroundColor Red
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "1. Composer dependencies not installed (run 'composer install')" -ForegroundColor Yellow
    Write-Host "2. .env file not configured properly" -ForegroundColor Yellow
    Write-Host "3. Database not migrated (run 'php artisan migrate')" -ForegroundColor Yellow
    Write-Host "4. Laravel WebSockets package not published (run 'php artisan vendor:publish --provider=`"BeyondCode\LaravelWebSockets\WebSocketsServiceProvider`"')" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Error details: $_" -ForegroundColor Red
    pause
}