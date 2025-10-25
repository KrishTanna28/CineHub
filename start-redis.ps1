# PowerShell script to start Redis for CineHub
# Run this script to start Redis in WSL

Write-Host "Starting Redis for CineHub..." -ForegroundColor Green

# Check if WSL is installed
$wslInstalled = Get-Command wsl -ErrorAction SilentlyContinue

if (-not $wslInstalled) {
    Write-Host "WSL is not installed!" -ForegroundColor Red
    Write-Host "Please install WSL first: wsl --install" -ForegroundColor Yellow
    Write-Host "Or use Docker/Memurai (see REDIS_SETUP.md)" -ForegroundColor Yellow
    exit 1
}

# Start Redis in WSL
Write-Host "Starting Redis server in WSL..." -ForegroundColor Cyan
wsl sudo service redis-server start

# Wait a moment
Start-Sleep -Seconds 2

# Test Redis connection
Write-Host "Testing Redis connection..." -ForegroundColor Cyan
$pingResult = wsl redis-cli ping

if ($pingResult -eq "PONG") {
    Write-Host "✓ Redis is running successfully!" -ForegroundColor Green
    Write-Host "✓ Redis is available at: redis://localhost:6379" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now start your backend server:" -ForegroundColor Yellow
    Write-Host "  cd my-app-backend" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor White
} else {
    Write-Host "✗ Redis failed to start" -ForegroundColor Red
    Write-Host "Please check REDIS_SETUP.md for troubleshooting" -ForegroundColor Yellow
}
