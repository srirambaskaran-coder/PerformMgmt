# Install as Windows Service using NSSM (Non-Sucking Service Manager)
# Download NSSM from https://nssm.cc/download

param(
    [string]$ServiceName = "PerformMgmtApp",
    [string]$NssmPath = "C:\nssm\nssm.exe"
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot

# Check if NSSM exists
if (-not (Test-Path $NssmPath)) {
    Write-Host "NSSM not found at $NssmPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "To install NSSM:" -ForegroundColor Yellow
    Write-Host "1. Download from https://nssm.cc/download" -ForegroundColor Gray
    Write-Host "2. Extract to C:\nssm\" -ForegroundColor Gray
    Write-Host "3. Run this script again" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Alternatively, use winget:" -ForegroundColor Yellow
    Write-Host "  winget install NSSM.NSSM" -ForegroundColor Gray
    exit 1
}

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "This script must be run as Administrator!" -ForegroundColor Red
    exit 1
}

Write-Host "Installing $ServiceName as a Windows Service..." -ForegroundColor Cyan

# Stop and remove existing service if it exists
$existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "Stopping existing service..." -ForegroundColor Yellow
    & $NssmPath stop $ServiceName
    & $NssmPath remove $ServiceName confirm
}

# Install the service
$nodePath = (Get-Command node).Source
$scriptPath = Join-Path $ProjectRoot "dist\index.js"

& $NssmPath install $ServiceName $nodePath $scriptPath
& $NssmPath set $ServiceName AppDirectory $ProjectRoot
& $NssmPath set $ServiceName AppEnvironmentExtra "NODE_ENV=production" "PORT=5000"
& $NssmPath set $ServiceName DisplayName "Performance Management Application"
& $NssmPath set $ServiceName Description "Performance Management System - Node.js Application"
& $NssmPath set $ServiceName Start SERVICE_AUTO_START
& $NssmPath set $ServiceName AppStdout (Join-Path $ProjectRoot "logs\service-stdout.log")
& $NssmPath set $ServiceName AppStderr (Join-Path $ProjectRoot "logs\service-stderr.log")
& $NssmPath set $ServiceName AppRotateFiles 1
& $NssmPath set $ServiceName AppRotateBytes 10485760

# Create logs directory
$logsDir = Join-Path $ProjectRoot "logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
}

Write-Host ""
Write-Host "Service installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "To manage the service:" -ForegroundColor Yellow
Write-Host "  Start:   Start-Service $ServiceName" -ForegroundColor Gray
Write-Host "  Stop:    Stop-Service $ServiceName" -ForegroundColor Gray
Write-Host "  Status:  Get-Service $ServiceName" -ForegroundColor Gray
Write-Host ""

# Start the service
Write-Host "Starting the service..." -ForegroundColor Cyan
Start-Service $ServiceName
Get-Service $ServiceName
