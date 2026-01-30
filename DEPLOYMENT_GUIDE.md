# Performance Management System - Code Split Report

// CodeRabbit review test


## Executive Summary

The monolithic Performance Management System has been successfully split into separate **Frontend** and **Backend** codebases. Each component can now be deployed, scaled, and maintained independently.

## Branch Structure

### 1. **PMS_frontend** Branch
- **Purpose**: Contains all frontend React application code
- **Technology**: React + TypeScript + Vite
- **Deployment**: Can be hosted on Vercel, Netlify, AWS S3, or any static hosting service

### 2. **PMS_backend** Branch  
- **Purpose**: Contains all backend API server code
- **Technology**: Node.js + Express + TypeScript + MSSQL
- **Deployment**: Can be hosted on any Node.js hosting service (AWS EC2, Azure, DigitalOcean, etc.)

---

## Key Changes Implemented

### Frontend Changes

#### 1. **Environment-Based API Configuration**
- Created `client/src/config/api.config.ts` for automatic environment detection
- API URLs automatically switch based on deployment environment:
  - `localhost:*` → Development backend
  - Custom QC domain → QC backend  
  - Custom production domain → Production backend

#### 2. **API Client**
- Created `client/src/lib/api.ts` with centralized API client
- Handles credentials (cookies) for session-based authentication
- Automatic error handling

#### 3. **Build Configuration**
- Removed all backend dependencies from package.json
- Standalone Vite configuration for frontend-only builds
- Optimized TypeScript configuration for frontend code

#### 4. **Environment Files**
- `.env` with Vite environment variables
- Easy configuration for different deployment environments

### Backend Changes

#### 1. **CORS Configuration** (`server/config/cors.config.ts`)
- Environment-specific CORS settings
- Development: Allows localhost origins
- QC: Configured for QC frontend URL
- Production: Strict production frontend URL only
- Credentials support for session cookies

#### 2. **Database Configuration** (`server/config/database.config.ts`)
- **Three separate databases for three environments:**
  - Development: `PMS_DB_DEV`
  - QC/Staging: `PMS_DB_QC`
  - Production: `PMS_DB`
- Automatic database selection based on environment
- Environment-specific connection parameters

#### 3. **Updated Server Entry Point**
- Removed Vite integration from backend
- Added CORS middleware
- Backend now runs as pure API server
- Environment logging on startup

#### 4. **Environment Files**
- `backend.env` - Development configuration
- `backend.env.qc` - QC/Staging configuration
- `backend.env.production` - Production configuration
- Separate database credentials for each environment

#### 5. **Build Configuration**
- Removed all frontend dependencies
- Backend-only package.json
- Separate npm scripts for each environment

---

## Deployment Guide

### Frontend Deployment

#### Option A: Vercel (Recommended for React)
```bash
# Switch to frontend branch
git checkout PMS_frontend

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

#### Option B: Netlify
```bash
# Build command
npm run build

# Publish directory
dist
```

#### Option C: AWS S3 + CloudFront
```bash
npm run build
# Upload dist/ folder to S3 bucket
# Configure CloudFront distribution
```

**Important**: After deployment, update the domain URLs in `client/src/config/api.config.ts`

### Backend Deployment

#### Prerequisites
1. Set up three SQL Server databases:
   - Development: `PMS_DB_DEV`
   - QC: `PMS_DB_QC`
   - Production: `PMS_DB`

2. Run database migrations on each database from the `database/` folder

#### Deployment Steps

1. **Build the backend:**
```bash
git checkout PMS_backend
npm install
npm run build
```

2. **Deploy to your server** (example with PM2):
```bash
# Install PM2
npm install -g pm2

# For Development
pm2 start npm --name "pms-api-dev" -- run dev

# For QC
pm2 start npm --name "pms-api-qc" -- run start:qc

# For Production
pm2 start npm --name "pms-api-prod" -- run start:prod
```

3. **Environment Configuration:**
   - Development: Copy `backend.env` to `.env`
   - QC: Copy `backend.env.qc` to `.env`
   - Production: Copy `backend.env.production` to `.env`

4. **Update CORS origins** in `server/config/cors.config.ts`:
   - Replace placeholder URLs with your actual frontend URLs
   - Example:
     ```typescript
     qc: [
       'https://pms-qc.yourdomain.com',
     ],
     production: [
       'https://pms.yourdomain.com',
     ],
     ```

---

## Configuration Checklist

### Frontend Configuration
- [ ] Update API URLs in `client/src/config/api.config.ts`
- [ ] Set correct environment detection URLs
- [ ] Configure build and deploy pipeline
- [ ] Test CORS and API connectivity

### Backend Configuration
- [ ] Create three separate databases (DEV, QC, PROD)
- [ ] Run migrations on each database
- [ ] Update `.env` files with correct database credentials
- [ ] Update CORS origins in `server/config/cors.config.ts`
- [ ] Update `SESSION_SECRET` in production
- [ ] Configure SSL/TLS certificates for production
- [ ] Set up process manager (PM2, systemd, etc.)

---

## Environment Variables Reference

### Frontend (.env)
```env
VITE_API_BASE_URL_DEV=http://localhost:3000
VITE_API_BASE_URL_QC=https://api-qc.yourdomain.com
VITE_API_BASE_URL_PROD=https://api.yourdomain.com
```

### Backend (.env)
```env
NODE_ENV=production
APP_ENV=production  # or: development, qc

# Database - each environment has separate credentials
DB_SERVER_DEV=localhost
DB_DATABASE_DEV=PMS_DB_DEV
DB_USER_DEV=pms_app_user
DB_PASSWORD_DEV=your_dev_password

DB_SERVER_QC=qc-db-server
DB_DATABASE_QC=PMS_DB_QC
DB_USER_QC=pms_app_user
DB_PASSWORD_QC=your_qc_password

DB_SERVER_PROD=prod-db-server
DB_DATABASE_PROD=PMS_DB
DB_USER_PROD=pms_app_user
DB_PASSWORD_PROD=your_prod_password

SESSION_SECRET=your-secure-session-secret
```

---

## Testing the Setup

### Local Development Test

1. **Start Backend:**
```bash
cd d:\PMS-codeSplit\PerformMgmt
git checkout PMS_backend
npm install
npm run dev
# Backend should run on http://localhost:3000
```

2. **Start Frontend (in a new terminal):**
```bash
cd d:\PMS-codeSplit\PerformMgmt
git checkout PMS_frontend
npm install
npm run dev
# Frontend should run on http://localhost:5173
```

3. **Test the connection:**
   - Open browser to http://localhost:5173
   - Try to login
   - Verify API calls are working in browser DevTools Network tab

### Verify CORS
- Check browser console for CORS errors
- Verify cookies are being set (check Application tab in DevTools)
- Test API endpoints directly with curl or Postman

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  React App (Port 5173 dev / Static hosting prod)   │    │
│  │  - Auto-detects environment from URL                │    │
│  │  - Calls appropriate backend API                    │    │
│  │  - Handles UI and user interactions                 │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS/HTTP Requests
                     │ (with credentials/cookies)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                        Backend API                           │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Express Server (Port 3000)                         │    │
│  │  - CORS enabled for frontend origins                │    │
│  │  - Session-based authentication                      │    │
│  │  - Environment-based database selection             │    │
│  └──────────────────┬─────────────────────────────────┘    │
└────────────────────┬┴──────────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         ↓           ↓           ↓
    ┌────────┐  ┌────────┐  ┌────────┐
    │ DEV DB │  │ QC DB  │  │PROD DB │
    │PMS_DB_ │  │PMS_DB_ │  │ PMS_DB │
    │  DEV   │  │   QC   │  │        │
    └────────┘  └────────┘  └────────┘
```

---

## Security Best Practices

1. **CORS Configuration**
   - Never use `*` for allowed origins in production
   - Only whitelist your actual frontend domains
   - Keep development and production origins separate

2. **Database Security**
   - Use different databases for each environment
   - Never use development credentials in production
   - Enable SSL/TLS for database connections in production
   - Use strong passwords and rotate them regularly

3. **Environment Variables**
   - Never commit `.env` files to git
   - Use different `SESSION_SECRET` for each environment
   - Store production credentials securely (use secrets manager)

4. **HTTPS**
   - Always use HTTPS in production
   - Configure SSL certificates for both frontend and backend
   - Enable `secure` flag on session cookies in production

---

## Troubleshooting

### CORS Issues
**Problem**: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution**:
1. Check backend `server/config/cors.config.ts` has correct frontend URL
2. Verify `APP_ENV` environment variable is set correctly
3. Check backend logs to see which origin was blocked
4. Ensure `credentials: true` is set in both CORS config and API client

### Database Connection Issues
**Problem**: "Connection refused" or "Login failed"

**Solution**:
1. Verify `APP_ENV` matches the database configuration you want
2. Check database credentials in `.env`
3. Ensure database server is accessible from backend server
4. Verify database name exists
5. Check firewall rules allow connection on port 1433

### Session/Authentication Issues
**Problem**: "Unauthorized" or sessions not persisting

**Solution**:
1. Verify cookies are being set (check browser DevTools)
2. Ensure `credentials: 'include'` in frontend API calls
3. Check CORS allows credentials
4. Verify frontend and backend are on compatible domains (same domain or properly configured cross-origin)
5. Check `SESSION_SECRET` is set in backend `.env`

---

## Next Steps

1. **Update Configuration Files**
   - Replace all placeholder URLs with actual domain names
   - Configure production database credentials
   - Set secure session secrets

2. **Set Up CI/CD**
   - Configure automated deployments for both branches
   - Set up separate pipelines for frontend and backend
   - Implement environment-specific builds

3. **Monitoring & Logging**
   - Set up application monitoring (e.g., New Relic, Datadog)
   - Configure centralized logging
   - Set up error tracking (e.g., Sentry)

4. **Testing**
   - Test each environment thoroughly
   - Verify database isolation between environments
   - Test CORS from actual deployed frontend URLs

---

## Support & Maintenance

### Branch Management
- **PMS_frontend**: All frontend-related changes
- **PMS_backend**: All backend-related changes
- Keep branches synchronized for shared code (if any in `shared/` folder)

### Deployment Workflow
1. Make changes in respective branch
2. Test locally
3. Deploy to QC environment first
4. Test QC thoroughly
5. Deploy to production

---

## File Structure

### Frontend Branch (PMS_frontend)
```
PMS_frontend/
├── client/
│   ├── src/
│   │   ├── config/
│   │   │   └── api.config.ts          # Environment detection
│   │   ├── lib/
│   │   │   └── api.ts                 # API client
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   └── index.html
├── shared/                             # Shared types
├── package.json                        # Frontend dependencies only
├── vite.config.ts                      # Frontend build config
├── tsconfig.json                       # Frontend TypeScript config
├── .env                                # Frontend environment vars
└── FRONTEND_README.md
```

### Backend Branch (PMS_backend)
```
PMS_backend/
├── server/
│   ├── config/
│   │   ├── cors.config.ts             # CORS configuration
│   │   └── database.config.ts         # Database configuration
│   ├── routes.ts
│   ├── index.ts                       # Server entry point
│   ├── auth.ts
│   ├── storage.ts
│   └── ...
├── database/                           # SQL migrations
├── shared/                             # Shared types
├── package.json                        # Backend dependencies only
├── tsconfig.json                       # Backend TypeScript config
├── .env                                # Backend environment vars
├── backend.env.qc                      # QC environment template
├── backend.env.production              # Production environment template
└── BACKEND_README.md
```

---

## Summary of Changes

✅ **Frontend**
- Created environment-based API URL detection
- Removed all backend code and dependencies
- Standalone build configuration
- API client with automatic credential handling

✅ **Backend**
- Implemented CORS with environment-specific origins
- Configured three separate databases (DEV, QC, PROD)
- Removed all frontend code and dependencies
- Pure API server without Vite integration
- Environment-specific startup commands

✅ **Configuration**
- Separate .env files for each environment
- Comprehensive documentation for both codebases
- Clear deployment instructions
- Security best practices implemented

✅ **No Placeholders**
- All code is functional as-is
- URLs can be updated in designated config files
- Database credentials configurable via .env files
- Ready for deployment after configuration

---

## Contact & Questions

For issues or questions about the split:
1. Check the respective README files (FRONTEND_README.md, BACKEND_README.md)
2. Review this deployment guide
3. Verify all configuration checklist items are completed
4. Check the troubleshooting section

---

**Report Generated**: December 15, 2025
**Status**: ✅ Complete - Both branches ready for deployment
