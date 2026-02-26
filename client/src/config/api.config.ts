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
  const hostname = window.location.hostname;

  // Development: localhost, 127.0.0.1, or smedev (dev server)
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.includes("smedev")
  ) {
    return "development";
  }

  // QC: smeqc is the QC server
  if (hostname.includes("smeqc")) {
    return "qc";
  }

  // QC: check for qc/staging in hostname or specific domains
  if (
    hostname.includes("qc") ||
    hostname.includes("staging") ||
    hostname.includes("test")
  ) {
    return "qc";
  }

  // Production: everything else (sme.hfactor.app, etc.)
  return "production";
}

// API Configuration for different environments
// These can be overridden using VITE_API_BASE_URL environment variable
interface ApiConfig {
  baseUrl: string;
  timeout: number;
  ssoLogoutUrl: string;
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
    development: "https://dev.hfactor.app:8443/PerformanceMgt",
    // development: "http://localhost:3000",
    qc: import.meta.env.VITE_QC_API_URL || "https://smeqc.hfactor.app:8443/PMS_API",
    production:
      import.meta.env.VITE_PROD_API_URL || "https://sme.hfactor.app/PerformanceMgt",
  };

  return defaultUrls[env];
}

// SSO/HRsuite logout redirect URLs for each environment
const ssoLogoutUrls: Record<Environment, string> = {
  development: "https://smedev.hfactor.app:8443/hrsuidevsme/#/login/default",
  qc: "https://smeqc.hfactor.app:8443/hrsuiteqcsme/#/login/default",
  production: "https://sme.hfactor.app/#/login/default",
};

const apiConfigs: Record<Environment, ApiConfig> = {
  development: {
    baseUrl: getBaseUrl("development"),
    timeout: 30000,
    ssoLogoutUrl: ssoLogoutUrls.development,
  },
  qc: {
    baseUrl: getBaseUrl("qc"),
    timeout: 30000,
    ssoLogoutUrl: ssoLogoutUrls.qc,
  },
  production: {
    baseUrl: getBaseUrl("production"),
    timeout: 30000,
    ssoLogoutUrl: ssoLogoutUrls.production,
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
export const SSO_LOGOUT_URL = getApiConfig().ssoLogoutUrl;
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
    `[API Config] Environment: ${CURRENT_ENV}, Base URL: ${API_BASE_URL}`,
  );
}
