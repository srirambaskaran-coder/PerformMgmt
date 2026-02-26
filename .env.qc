# QC Environment Configuration
# Use this file when building for QC server deployment
# Build command: npm run build -- --mode qc

# Environment
VITE_APP_ENV=qc

# Base path for QC deployment (must match server location)
VITE_BASE_PATH=/PMSUI/

# API Configuration - QC Server
VITE_API_BASE_URL=https://smeqc.hfactor.app:8443/PMS_API/api
VITE_QC_API_URL=https://smeqc.hfactor.app:8443/PMS_API/api

# App Configuration
VITE_APP_NAME=Performance Management System
VITE_APP_VERSION=1.0.0
