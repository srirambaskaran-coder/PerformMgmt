# Production Server Startup Script for Windows Server
# Run this script to start the application

$ErrorActionPreference = "Stop"

# Set the working directory to the project root
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

# Load environment variables from .env file if it exists
$envFile = Join-Path $ProjectRoot ".env"
if (Test-Path $envFile) {
    Write-Host "Loading environment variables from .env file..." -ForegroundColor Cyan
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            # Remove surrounding quotes if present
            $value = $value -replace '^["'']|["'']$', ''
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
            Write-Host "  Set $name" -ForegroundColor Gray
        }
    }
}

# Set production environment
$env:NODE_ENV = "production"

# Default port for production
if (-not $env:PORT) {
    $env:PORT = "5000"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Starting Performance Management App  " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Environment: $env:NODE_ENV" -ForegroundColor Yellow
Write-Host "Port: $env:PORT" -ForegroundColor Yellow
Write-Host ""

# Check if the dist folder exists
$distPath = Join-Path $ProjectRoot "dist"
if (-not (Test-Path $distPath)) {
    Write-Host "ERROR: Build directory not found!" -ForegroundColor Red
    Write-Host "Please run 'npm run build' first." -ForegroundColor Red
    exit 1
}

# Start the server
Write-Host "Starting Node.js server..." -ForegroundColor Cyan
node dist/index.js
