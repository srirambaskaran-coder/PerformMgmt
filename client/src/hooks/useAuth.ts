import { useState, useEffect } from "react";
import { type SafeUser } from "@shared/schema";
import { API_BASE_URL } from "@/config/api.config";

// Storage keys for sessionStorage-based auth (per-tab, independent sessions)
const AUTH_USER_KEY = "pms_auth_user";
const ACCESS_TOKEN_KEY = "pms_access_token";
const REFRESH_TOKEN_KEY = "pms_refresh_token";
const TOKEN_EXPIRY_KEY = "pms_token_expiry";

// Get access token from sessionStorage
export function getAccessToken(): string | null {
  try {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

// Get refresh token from sessionStorage
export function getRefreshToken(): string | null {
  try {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

// Store tokens in sessionStorage (per-tab)
export function setTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn?: number,
): void {
  try {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (expiresIn) {
      const expiryTime = Date.now() + expiresIn * 1000;
      sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(expiryTime));
    }
    console.log("[useAuth] Tokens stored successfully");
  } catch (error) {
    console.error("[useAuth] Failed to store tokens:", error);
  }
}

// Check if token is expired or about to expire (within 5 minutes)
export function isTokenExpired(): boolean {
  try {
    const expiryTime = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryTime) return false;
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
    return Date.now() > parseInt(expiryTime) - bufferTime;
  } catch {
    return false;
  }
}

// Refresh the access token
export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    console.log("[useAuth] No refresh token available");
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.accessToken) {
        setTokens(
          data.accessToken,
          data.refreshToken || refreshToken,
          data.expiresIn,
        );
        console.log("[useAuth] Token refreshed successfully");
        return true;
      }
    }

    console.log("[useAuth] Token refresh failed");
    return false;
  } catch (error) {
    console.error("[useAuth] Token refresh error:", error);
    return false;
  }
}

// Get stored user from sessionStorage (per-tab)
export function getStoredUser(): SafeUser | null {
  try {
    const userJson = sessionStorage.getItem(AUTH_USER_KEY);
    if (!userJson) return null;
    return JSON.parse(userJson);
  } catch (error) {
    console.error("[useAuth] Failed to parse user from sessionStorage:", error);
    return null;
  }
}

// Set stored user in sessionStorage (per-tab)
export function setStoredUser(user: SafeUser): void {
  try {
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("[useAuth] Failed to store user:", error);
  }
}

// Normalize user object from API (convert uppercase keys to lowercase)
export function normalizeUser(apiUser: any): SafeUser {
  // Handle Name field - try to split into firstName/lastName
  let firstName = apiUser.FirstName || apiUser.firstName;
  let lastName = apiUser.LastName || apiUser.lastName;

  // If no firstName/lastName but have Name, split it
  if (!firstName && !lastName && (apiUser.Name || apiUser.UserName)) {
    const fullName = apiUser.Name || apiUser.UserName || "";
    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length >= 2) {
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(" ");
    } else {
      firstName = fullName;
      lastName = "";
    }
  }

  return {
    id: apiUser.Id || apiUser.id,
    email: apiUser.EmailId || apiUser.Email || apiUser.email,
    firstName: firstName || "",
    lastName: lastName || "",
    profileImageUrl: apiUser.ProfileImageUrl || apiUser.profileImageUrl,
    code: apiUser.SystemUserCode || apiUser.Code || apiUser.code,
    designation: apiUser.Designation || apiUser.designation,
    department: apiUser.Department || apiUser.department,
    dateOfJoining: apiUser.DateOfJoining || apiUser.dateOfJoining,
    mobileNumber: apiUser.MobileNumber || apiUser.mobileNumber,
    reportingManagerId:
      apiUser.ReportingManagerId || apiUser.reportingManagerId,
    locationId: apiUser.LocationId || apiUser.locationId,
    companyId:
      apiUser.CompanyId ||
      apiUser.companyId ||
      apiUser.ClientId ||
      apiUser.clientId,
    levelId: apiUser.LevelId || apiUser.levelId,
    gradeId: apiUser.GradeId || apiUser.gradeId,
    role: apiUser.Role || apiUser.role,
    roles: (() => {
      const rawRoles = apiUser.Roles || apiUser.roles;
      if (!rawRoles) return [];
      if (Array.isArray(rawRoles)) return rawRoles;
      if (typeof rawRoles === "string") {
        let parsed: any = rawRoles;
        // Handle potentially double/triple-encoded JSON strings
        try {
          // Keep parsing until we get an array or can't parse anymore
          let attempts = 0;
          while (typeof parsed === "string" && attempts < 5) {
            attempts++;
            try {
              parsed = JSON.parse(parsed);
            } catch {
              break;
            }
          }
          if (Array.isArray(parsed)) return parsed;
          // If still a string after parsing, try splitting by comma
          if (typeof parsed === "string") {
            return parsed
              .split(",")
              .map((r: string) => r.trim())
              .filter(Boolean);
          }
          return [];
        } catch {
          // If not JSON, split by comma
          return rawRoles
            .split(",")
            .map((r: string) => r.trim())
            .filter(Boolean);
        }
      }
      return [];
    })(),
    status:
      apiUser.Status !== undefined && apiUser.Status !== null
        ? apiUser.Status
          ? "active"
          : "inactive"
        : apiUser.status || "active",
    createdAt: apiUser.CreatedOn || apiUser.createdAt,
    updatedAt: apiUser.LastUpdatedOn || apiUser.updatedAt,
    createdById: apiUser.CreatedBy || apiUser.createdById,
    // Set activeRole and availableRoles for role switching
    activeRole:
      apiUser.ActiveRole || apiUser.activeRole || apiUser.Role || apiUser.role,
    availableRoles: (() => {
      const rawRoles = apiUser.Roles || apiUser.roles;
      if (!rawRoles) return [];
      if (Array.isArray(rawRoles)) return rawRoles;
      if (typeof rawRoles === "string") {
        let parsed: any = rawRoles;
        try {
          let attempts = 0;
          while (typeof parsed === "string" && attempts < 5) {
            attempts++;
            try {
              parsed = JSON.parse(parsed);
            } catch {
              break;
            }
          }
          if (Array.isArray(parsed)) return parsed;
          if (typeof parsed === "string") {
            return parsed
              .split(",")
              .map((r: string) => r.trim())
              .filter(Boolean);
          }
          return [];
        } catch {
          return rawRoles
            .split(",")
            .map((r: string) => r.trim())
            .filter(Boolean);
        }
      }
      return [];
    })(),
  };
}

// Clear all auth data from sessionStorage
export function clearAuthData(): void {
  try {
    sessionStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    console.log("[useAuth] Auth data cleared");
  } catch (error) {
    console.error("[useAuth] Failed to clear auth data:", error);
  }
}

export function useAuth() {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();
    const accessToken = getAccessToken();

    // Check authentication:
    // - If JWT token exists, require both user and token
    // - If no JWT (session-based auth), just check for stored user
    if (storedUser) {
      if (accessToken) {
        // JWT-based auth: have both user and token
        console.log("[useAuth] JWT auth: user and token found");
        setUser(storedUser);
      } else {
        // Session-based auth: have user, backend uses cookies
        console.log("[useAuth] Session auth: user found (no JWT token)");
        setUser(storedUser);
      }
    } else {
      console.log("[useAuth] No stored user found");
    }
    setIsLoading(false);
  }, []);

  // User is authenticated if we have stored user data
  // (backend may use JWT tokens OR session cookies)
  const isAuthenticated = !!user;

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}
