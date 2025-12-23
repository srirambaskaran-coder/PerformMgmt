# Backend Environment Configuration - QC

# Application Environment
NODE_ENV=production
APP_ENV=qc

# Server Configuration
PORT=3000

# Session Secret (kept for backward compatibility)
SESSION_SECRET=your-qc-session-secret-change-this

# JWT Configuration
JWT_SECRET=your-qc-jwt-secret-change-this-to-a-long-random-string
JWT_REFRESH_SECRET=your-qc-jwt-refresh-secret-change-this-to-a-long-random-string
JWT_ACCESS_EXPIRY_SECONDS=900
JWT_REFRESH_EXPIRY_SECONDS=604800

# ===== QC/STAGING DATABASE =====
DB_SERVER_QC=your-qc-db-server
DB_PORT_QC=1433
DB_DATABASE_QC=PMS_DB_QC
DB_USER_QC=pms_app_user
DB_PASSWORD_QC=your-qc-password
DB_ENCRYPT_QC=true
DB_TRUST_SERVER_CERTIFICATE_QC=true

# Email Configuration
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=

# Google Cloud Storage
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_CLOUD_BUCKET_NAME=
