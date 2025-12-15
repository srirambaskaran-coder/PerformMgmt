// CORS Configuration for different environments
import type { CorsOptions } from 'cors';

export type Environment = 'development' | 'qc' | 'production';

export function getEnvironment(): Environment {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const appEnv = process.env.APP_ENV;
  
  if (appEnv === 'production' || nodeEnv === 'production') {
    return 'production';
  } else if (appEnv === 'qc' || appEnv === 'staging') {
    return 'qc';
  }
  
  return 'development';
}

// CORS allowed origins for each environment
const allowedOrigins: Record<Environment, string[]> = {
  development: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173',
  ],
  qc: [
    'http://your-qc-frontend-url.com',
    'https://your-qc-frontend-url.com',
  ],
  production: [
    'https://your-prod-frontend-url.com',
  ],
};

export function getCorsOptions(): CorsOptions {
  const env = getEnvironment();
  const origins = allowedOrigins[env];

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      if (origins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS: Blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Allow cookies and authentication headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400, // 24 hours
  };
}

// Export allowed origins for session configuration
export function getAllowedOrigins(): string[] {
  const env = getEnvironment();
  return allowedOrigins[env];
}
