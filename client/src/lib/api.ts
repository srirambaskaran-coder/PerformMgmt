import { API_BASE_URL, API_TIMEOUT, getApiUrl } from '@/config/api.config';
import { getAccessToken } from '@/hooks/useAuth';

// Helper to get Authorization header with JWT token
function getAuthHeaders(): HeadersInit {
  const token = getAccessToken();
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
    };
  }
  return {};
}

// Configure axios or fetch with environment-based URL
export const apiClient = {
  async get(endpoint: string, options: RequestInit = {}) {
    const url = getApiUrl(endpoint);
    const response = await fetch(url, {
      ...options,
      method: 'GET',
      credentials: 'include', // Keep for backward compatibility
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  },

  async post(endpoint: string, data?: any, options: RequestInit = {}) {
    const url = getApiUrl(endpoint);
    const response = await fetch(url, {
      ...options,
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  },

  async put(endpoint: string, data?: any, options: RequestInit = {}) {
    const url = getApiUrl(endpoint);
    const response = await fetch(url, {
      ...options,
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  },

  async delete(endpoint: string, options: RequestInit = {}) {
    const url = getApiUrl(endpoint);
    const response = await fetch(url, {
      ...options,
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  },
};

export { API_BASE_URL, getApiUrl };
