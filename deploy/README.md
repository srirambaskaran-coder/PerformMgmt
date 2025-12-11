# Deployment Guide for Windows Server

This guide explains how to deploy the Performance Management application on a Windows Server.

## Prerequisites

1. **Node.js** (v18 or later) - [Download](https://nodejs.org/)
2. **SQL Server** with connection details configured in `.env`
3. **Git** (optional, for pulling updates)

## Quick Start (Manual)

### 1. Build the Application

```powershell
cd D:\PMS-Myver\PerformMgmt
npm install
npm run build
```

### 2. Configure Environment

Create or update the `.env` file with your production settings:

```env
NODE_ENV=production
PORT=5000

# Database Configuration
DB_HOST=your-sql-server
DB_PORT=1433
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=your-database

# Session Secret (generate a random string)
SESSION_SECRET=your-random-secret-key

# Email Configuration (optional)
SMTP_HOST=smtp.yourserver.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
```

### 3. Start the Server

```powershell
.\deploy\start-server.ps1
```

The application will be available at `http://localhost:5000`

## Production Deployment Options

### Option 1: Run as Windows Service (Recommended)

This keeps the app running even after you log out.

1. **Install NSSM** (Non-Sucking Service Manager):

   - Download from https://nssm.cc/download
   - Extract to `C:\nssm\`

2. **Install the service**:

   ```powershell
   # Run as Administrator
   .\deploy\install-service.ps1
   ```

3. **Manage the service**:
   ```powershell
   Start-Service PerformMgmtApp
   Stop-Service PerformMgmtApp
   Get-Service PerformMgmtApp
   ```

### Option 2: Use IIS as Reverse Proxy

This allows you to:

- Serve on port 80/443
- Use SSL certificates
- Leverage IIS features (logging, compression, etc.)

1. **Install required IIS modules**:

   - URL Rewrite: https://www.iis.net/downloads/microsoft/url-rewrite
   - Application Request Routing: https://www.iis.net/downloads/microsoft/application-request-routing

2. **Run the setup script**:

   ```powershell
   # Run as Administrator
   .\deploy\setup-iis-reverse-proxy.ps1 -SiteName "PerformMgmt" -BackendPort 5000
   ```

3. **For HTTPS**, add an SSL binding in IIS Manager and update the site.

### Option 3: Use PM2 (Process Manager)

1. **Install PM2**:

   ```powershell
   npm install -g pm2
   npm install -g pm2-windows-startup
   ```

2. **Start the application**:

   ```powershell
   cd D:\PMS-Myver\PerformMgmt
   pm2 start dist/index.js --name "PerformMgmt"
   ```

3. **Configure auto-start**:
   ```powershell
   pm2 save
   pm2-startup install
   ```

## Firewall Configuration

Allow the application port through Windows Firewall:

```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Performance Management App" -Direction Inbound -Port 5000 -Protocol TCP -Action Allow
```

## Updating the Application

```powershell
cd D:\PMS-Myver\PerformMgmt

# Pull latest changes (if using Git)
git pull

# Install dependencies
npm install

# Rebuild
npm run build

# Restart the service
Restart-Service PerformMgmtApp

# Or if using PM2
pm2 restart PerformMgmt
```

## Troubleshooting

### Check if the port is in use

```powershell
netstat -ano | findstr :5000
```

### View service logs

Logs are stored in:

- `D:\PMS-Myver\PerformMgmt\logs\service-stdout.log`
- `D:\PMS-Myver\PerformMgmt\logs\service-stderr.log`

### Test the application

```powershell
# Test if the server is responding
Invoke-WebRequest -Uri http://localhost:5000/api/auth/user -UseBasicParsing
```

### Database connection issues

- Verify SQL Server is running
- Check firewall allows SQL Server port (1433)
- Verify credentials in `.env` file
- Test connection: `sqlcmd -S your-server -U your-user -P your-password -d your-database -Q "SELECT 1"`

## Architecture

```
                    ┌─────────────┐
                    │   Browser   │
                    └──────┬──────┘
                           │
                           ▼
    ┌──────────────────────────────────────────┐
    │             IIS (Optional)               │
    │         (Port 80/443 - HTTPS)            │
    │              Reverse Proxy               │
    └──────────────────────┬───────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────┐
    │            Node.js Server                │
    │              (Port 5000)                 │
    │  ┌─────────────────────────────────────┐ │
    │  │     Express.js API (/api/*)         │ │
    │  ├─────────────────────────────────────┤ │
    │  │     Static Files (React SPA)        │ │
    │  └─────────────────────────────────────┘ │
    └──────────────────────┬───────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────┐
    │            SQL Server                    │
    │           (Port 1433)                    │
    └──────────────────────────────────────────┘
```
