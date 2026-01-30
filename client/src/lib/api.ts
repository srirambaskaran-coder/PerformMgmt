import { API_BASE_URL, API_TIMEOUT, getApiUrl } from "@/config/api.config";
import {
  getAccessToken,
  isTokenExpired,
  refreshAccessToken,
  clearAuthData,
} from "@/hooks/useAuth";

// Helper to get auth headers with JWT token
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  // Check if token needs refresh
  if (isTokenExpired()) {
    await refreshAccessToken();
  }

  const accessToken = getAccessToken();
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  return headers;
}

// Handle 401 responses
function handle401() {
  console.log("[API] Received 401, clearing auth data");
  clearAuthData();
  window.location.href = `${import.meta.env.BASE_URL || "/"}#/`;
}

// Configure fetch with JWT authentication
export const apiClient = {
  async get(endpoint: string, options: RequestInit = {}) {
    const url = getApiUrl(endpoint);
    const authHeaders = await getAuthHeaders();
    const response = await fetch(url, {
      ...options,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      handle401();
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  async post(endpoint: string, data?: any, options: RequestInit = {}) {
    const url = getApiUrl(endpoint);
    const authHeaders = await getAuthHeaders();
    const response = await fetch(url, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (response.status === 401) {
      handle401();
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  async put(endpoint: string, data?: any, options: RequestInit = {}) {
    const url = getApiUrl(endpoint);
    const authHeaders = await getAuthHeaders();
    const response = await fetch(url, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (response.status === 401) {
      handle401();
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  async delete(endpoint: string, options: RequestInit = {}) {
    const url = getApiUrl(endpoint);
    const authHeaders = await getAuthHeaders();
    const response = await fetch(url, {
      ...options,
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      handle401();
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },
};

export { API_BASE_URL, getApiUrl };
