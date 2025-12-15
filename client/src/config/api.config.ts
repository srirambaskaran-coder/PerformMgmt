// Environment detection and API configuration
export type Environment = 'development' | 'qc' | 'production';

// Helper function to get environment type based on current URL
export function getEnvType(): Environment {
  const origin = window.location.origin;

  if (
    origin === "http://localhost:5173" ||
    origin === "http://localhost:3000" ||
    origin === "http://localhost:4173"
  ) {
    return 'development';
  } else if (origin === "http://your-qc-domain.com") {
    return 'qc';
  } else if (origin === "https://your-prod-domain.com") {
    return 'production';
  }

  return 'development'; // default to development
}

// API Configuration for different environments
interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

const apiConfigs: Record<Environment, ApiConfig> = {
  development: {
    baseUrl: 'http://localhost:3000',
    timeout: 30000,
  },
  qc: {
    baseUrl: 'http://your-qc-backend-url.com',
    timeout: 30000,
  },
  production: {
    baseUrl: 'https://your-prod-backend-url.com',
    timeout: 30000,
  },
};

// Get current environment configuration
export function getApiConfig(): ApiConfig {
  const env = getEnvType();
  return apiConfigs[env];
}

// Export API base URL
export const API_BASE_URL = getApiConfig().baseUrl;
export const API_TIMEOUT = getApiConfig().timeout;

// API endpoints helper
export function getApiUrl(endpoint: string): string {
  const baseUrl = API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}
