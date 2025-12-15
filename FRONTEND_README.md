# PMS Frontend

Performance Management System - Frontend Application

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
   - Copy `frontend.env` to `.env`
   - Update API URLs for your environments

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Environment Configuration

The application automatically detects the environment based on the URL:
- `localhost:*` → Development
- Update URLs in `client/src/config/api.config.ts` for your QC and Production domains

## Deployment

After building, deploy the `dist` folder to your hosting service (Vercel, Netlify, AWS S3, etc.)

## API Integration

The frontend communicates with the backend API. Make sure:
1. Backend is running and accessible
2. CORS is properly configured on the backend
3. Environment URLs are correctly set
