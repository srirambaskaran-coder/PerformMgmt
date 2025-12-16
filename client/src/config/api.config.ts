// Environment detection and API configuration
export type Environment = "development" | "qc" | "production";

// Helper function to get environment type based on current URL or env variable
export function getEnvType(): Environment {
  // First check if VITE_APP_ENV is set (build-time configuration)
  const envVar = import.meta.env.VITE_APP_ENV as Environment | undefined;
  if (envVar && ["development", "qc", "production"].includes(envVar)) {
    return envVar;
  }

  // Otherwise, detect from URL
  const origin = window.location.origin;
  const hostname = window.location.hostname;

  // Development: localhost or 127.0.0.1
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "development";
  }

  // QC: check for qc/staging in hostname or specific domains
  if (
    hostname.includes("qc") ||
    hostname.includes("staging") ||
    hostname.includes("test")
  ) {
    return "qc";
  }

  // Production: everything else
  return "production";
}

// API Configuration for different environments
// These can be overridden using VITE_API_BASE_URL environment variable
interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

// Get base URL from environment variable or use defaults
function getBaseUrl(env: Environment): string {
  // Check for environment variable first (highest priority)
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (envBaseUrl) {
    return envBaseUrl;
  }

  // Default URLs for each environment
  const defaultUrls: Record<Environment, string> = {
    development: "http://localhost:3000",
    qc: import.meta.env.VITE_QC_API_URL || "http://your-qc-backend-url.com",
    production:
      import.meta.env.VITE_PROD_API_URL || "https://your-prod-backend-url.com",
  };

  return defaultUrls[env];
}

const apiConfigs: Record<Environment, ApiConfig> = {
  development: {
    baseUrl: getBaseUrl("development"),
    timeout: 30000,
  },
  qc: {
    baseUrl: getBaseUrl("qc"),
    timeout: 30000,
  },
  production: {
    baseUrl: getBaseUrl("production"),
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
export const CURRENT_ENV = getEnvType();

// API endpoints helper
export function getApiUrl(endpoint: string): string {
  const baseUrl = API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}

// Debug logging (only in development)
if (import.meta.env.DEV) {
  console.log(
    `[API Config] Environment: ${CURRENT_ENV}, Base URL: ${API_BASE_URL}`
  );
}
