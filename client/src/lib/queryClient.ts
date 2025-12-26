import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { API_BASE_URL } from "@/config/api.config";
import {
  getAccessToken,
  isTokenExpired,
  refreshAccessToken,
  clearAuthData,
} from "@/hooks/useAuth";

// Global error handler for system-wide errors
let systemErrorHandler: ((error: boolean, message?: string) => void) | null =
  null;

export function setSystemErrorHandler(
  handler: (error: boolean, message?: string) => void
) {
  systemErrorHandler = handler;
}

// Helper to build full API URL
function buildApiUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE_URL}${cleanUrl}`;
}

// Helper to get auth headers with JWT token
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  // Check if token needs refresh
  if (isTokenExpired()) {
    console.log("[API] Token expired, attempting refresh...");
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      console.log("[API] Token refresh failed, user needs to re-login");
      // Don't clear auth here, let the 401 handler do it
    }
  }

  const accessToken = getAccessToken();
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  return headers;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Handle 401 - clear auth and redirect to login
    if (res.status === 401) {
      console.log("[API] Received 401, clearing auth data");
      clearAuthData();
      window.location.href = `${import.meta.env.BASE_URL || "/"}#/`;
      throw new Error("Session expired. Please login again.");
    }
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined
): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(buildApiUrl(url), {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...authHeaders,
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    const authHeaders = await getAuthHeaders();
    const res = await fetch(buildApiUrl(url), {
      credentials: "include",
      headers: authHeaders,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    if (res.status === 401) {
      console.log("[API] Received 401, clearing auth data");
      clearAuthData();
      window.location.href = `${import.meta.env.BASE_URL || "/"}#/`;
      throw new Error("Session expired. Please login again.");
    }

    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      
      // Trigger system error modal for 500+ errors
      if (res.status >= 500 && systemErrorHandler) {
        systemErrorHandler(
          true,
          `Server error (${res.status}): Unable to communicate with the server. Please try again later.`
        );
      }
      
      throw new Error(`${res.status}: ${text}`);
    }

    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
      onError: (error: any) => {
        // Check if error is a 500+ server error
        if (error?.message?.match(/^5\d{2}:/) && systemErrorHandler) {
          systemErrorHandler(
            true,
            "The system is experiencing technical difficulties. Please contact support if the issue persists."
          );
        }
      },
    },
    mutations: {
      retry: false,
      onError: (error: any) => {
        // Check if error is a 500+ server error
        if (error?.message?.match(/^5\d{2}:/) && systemErrorHandler) {
          systemErrorHandler(
            true,
            "The system is experiencing technical difficulties. Please contact support if the issue persists."
          );
        }
      },
    },
  },
});
