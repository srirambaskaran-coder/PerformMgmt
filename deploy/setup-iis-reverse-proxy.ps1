# Setup IIS as a Reverse Proxy for the Node.js Application
# This allows you to serve the app on port 80/443 with IIS features

param(
    [string]$SiteName = "PerformMgmt",
    [string]$HostName = "",  # Leave empty for all hostnames, or set like "performmgmt.yourcompany.com"
    [int]$BackendPort = 5000,
    [int]$IISPort = 80
)

$ErrorActionPreference = "Stop"

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "This script must be run as Administrator!" -ForegroundColor Red
    exit 1
}

Write-Host "Setting up IIS Reverse Proxy for $SiteName..." -ForegroundColor Cyan
Write-Host ""

# Check if IIS is installed
$iisFeature = Get-WindowsFeature -Name Web-Server -ErrorAction SilentlyContinue
if (-not $iisFeature -or -not $iisFeature.Installed) {
    Write-Host "IIS is not installed. Installing..." -ForegroundColor Yellow
    Install-WindowsFeature -Name Web-Server -IncludeManagementTools
}

# Check if URL Rewrite module is installed
$urlRewritePath = "$env:SystemRoot\System32\inetsrv\rewrite.dll"
if (-not (Test-Path $urlRewritePath)) {
    Write-Host ""
    Write-Host "URL Rewrite module is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install it manually:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor Gray
    Write-Host "2. Or use Web Platform Installer" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Check if ARR (Application Request Routing) is installed
$arrPath = "$env:SystemRoot\System32\inetsrv\requestRouter.dll"
if (-not (Test-Path $arrPath)) {
    Write-Host ""
    Write-Host "Application Request Routing (ARR) is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install it manually:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://www.iis.net/downloads/microsoft/application-request-routing" -ForegroundColor Gray
    Write-Host "2. Or use Web Platform Installer" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Import-Module WebAdministration

# Enable proxy in ARR
Write-Host "Enabling ARR proxy..." -ForegroundColor Gray
Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.webServer/proxy" -name "enabled" -value "True"

# Create site directory
$siteRoot = "C:\inetpub\$SiteName"
if (-not (Test-Path $siteRoot)) {
    New-Item -ItemType Directory -Path $siteRoot | Out-Null
}

# Create web.config for reverse proxy
$webConfig = @"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="ReverseProxyToNode" stopProcessing="true">
                    <match url="(.*)" />
                    <action type="Rewrite" url="http://localhost:$BackendPort/{R:1}" />
                </rule>
            </rules>
        </rewrite>
        <httpProtocol>
            <customHeaders>
                <add name="X-Forwarded-Proto" value="https" />
            </customHeaders>
        </httpProtocol>
    </system.webServer>
</configuration>
"@

$webConfig | Out-File -FilePath (Join-Path $siteRoot "web.config") -Encoding UTF8

# Remove existing site if it exists
$existingSite = Get-Website -Name $SiteName -ErrorAction SilentlyContinue
if ($existingSite) {
    Write-Host "Removing existing site..." -ForegroundColor Yellow
    Remove-Website -Name $SiteName
}

# Create the IIS site
Write-Host "Creating IIS site..." -ForegroundColor Gray
if ($HostName) {
    New-Website -Name $SiteName -Port $IISPort -PhysicalPath $siteRoot -HostHeader $HostName
} else {
    New-Website -Name $SiteName -Port $IISPort -PhysicalPath $siteRoot
}

Write-Host ""
Write-Host "IIS Reverse Proxy setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  IIS Site Name: $SiteName" -ForegroundColor Gray
Write-Host "  IIS Port: $IISPort" -ForegroundColor Gray
Write-Host "  Backend: http://localhost:$BackendPort" -ForegroundColor Gray
Write-Host "  Site Root: $siteRoot" -ForegroundColor Gray
Write-Host ""
Write-Host "Make sure your Node.js application is running on port $BackendPort" -ForegroundColor Cyan
