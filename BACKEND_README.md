# PMS Backend

Performance Management System - Backend API

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
   - Copy `backend.env` to `.env`
   - Update database credentials for your environments
   - Update CORS allowed origins in `server/config/cors.config.ts`

3. Database Setup:
   - Ensure SQL Server is running
   - Create databases: PMS_DB_DEV, PMS_DB_QC, PMS_DB (production)
   - Run migrations from the `database` folder

4. Run development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

6. Start production server:
```bash
# For Development environment
npm start

# For QC environment
npm run start:qc

# For Production environment
npm run start:prod
```

## Environment Configuration

The backend automatically selects database and CORS settings based on:
- `NODE_ENV`: development, production
- `APP_ENV`: development, qc, production

### Database Configuration

Each environment has its own database:
- Development: PMS_DB_DEV
- QC/Staging: PMS_DB_QC
- Production: PMS_DB

Configure in `.env` file using environment-specific variables:
- Development: DB_SERVER_DEV, DB_DATABASE_DEV, etc.
- QC: DB_SERVER_QC, DB_DATABASE_QC, etc.
- Production: DB_SERVER_PROD, DB_DATABASE_PROD, etc.

### CORS Configuration

Update allowed origins in `server/config/cors.config.ts`:
- Development: localhost URLs
- QC: Your QC frontend URL
- Production: Your production frontend URL

## API Endpoints

All API endpoints are prefixed with `/api`:
- POST `/api/auth/login`
- GET `/api/users`
- etc.

## Deployment

1. Build the application:
```bash
npm run build
```

2. Copy these files to your server:
   - `dist/` folder
   - `package.json`
   - `.env` (with production values)
   - `database/` folder
   - `shared/` folder

3. On the server:
```bash
npm install --production
npm run start:prod
```

## Security Notes

- Always use HTTPS in production
- Update SESSION_SECRET in production
- Use strong database passwords
- Enable SSL for database connections in production
- Review and update CORS origins for your domains
