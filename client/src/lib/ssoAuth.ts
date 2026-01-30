/**
 * SSO Authentication Service
 *
 * Handles Single Sign-On authentication between HRsuite and PMS.
 * When a user accesses PMS from HRsuite, this service:
 * 1. Detects the HRsuite session
 * 2. Decrypts the session data
 * 3. Calls the PMS auth/login API with user details
 */

import { API_BASE_URL } from "@/config/api.config";
import { setStoredUser, setTokens, normalizeUser } from "@/hooks/useAuth";
import {
  hasHRsuiteSession,
  decryptAndStoreHRsuiteSession,
  getStoredHRsuiteSession,
} from "./hrsuiteSession";

// Key to track if SSO login has been attempted in this session
const SSO_ATTEMPTED_KEY = "pms_sso_attempted";
const SSO_SOURCE_KEY = "pms_login_source";

export type LoginSource = "pms" | "hrsuite" | "unknown";

/**
 * Check if SSO login has already been attempted in this session
 */
export function hasSSOBeenAttempted(): boolean {
  try {
    const attempted = sessionStorage.getItem(SSO_ATTEMPTED_KEY) === "true";
    console.log("[SSO] Has SSO been attempted?", attempted);
    return attempted;
  } catch {
    return false;
  }
}

/**
 * Mark SSO as attempted
 */
export function markSSOAttempted(): void {
  try {
    sessionStorage.setItem(SSO_ATTEMPTED_KEY, "true");
  } catch (error) {
    console.error("[SSO] Failed to mark SSO attempted:", error);
  }
}

/**
 * Clear SSO attempted flag (for testing or re-login)
 */
export function clearSSOAttempted(): void {
  try {
    sessionStorage.removeItem(SSO_ATTEMPTED_KEY);
  } catch (error) {
    console.error("[SSO] Failed to clear SSO attempted:", error);
  }
}

/**
 * Get the login source (how the user logged in)
 */
export function getLoginSource(): LoginSource {
  try {
    const source = localStorage.getItem(SSO_SOURCE_KEY);
    if (source === "pms" || source === "hrsuite") {
      return source;
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Set the login source
 */
export function setLoginSource(source: LoginSource): void {
  try {
    localStorage.setItem(SSO_SOURCE_KEY, source);
  } catch (error) {
    console.error("[SSO] Failed to set login source:", error);
  }
}

/**
 * Map HRsuite role names to PMS role names
 * HRsuite uses PascalCase (Employee, TalentAcquistionManager)
 * PMS API expects lowercase without underscores (employee, admin, manager, hrmanager, superadmin)
 */
const HRSUITE_TO_PMS_ROLE_MAP: Record<string, string> = {
  Employee: "employee",
  Manager: "manager",
  HRManager: "hrmanager",
  "HR Manager": "hrmanager",
  Admin: "admin",
  Administrator: "admin",
  SuperAdmin: "superadmin",
  "Super Admin": "superadmin",
};

/**
 * Normalize role for API payload - removes underscores
 */
export function normalizeRoleForPayload(role: string): string {
  if (!role) return role;
  return role.toLowerCase().replace(/_/g, "");
}

/**
 * Get the clientId from stored HRsuite session
 * Returns the ClientList[0].Id as a number, or null if not available
 */
export function getClientIdFromSession(): number | null {
  const session = getStoredHRsuiteSession();
  if (!session) return null;

  const loginResponses = session.loginResponses || {};
  const clientList = loginResponses.ClientList || [];
  const clientId = clientList[0]?.Id;

  return clientId != null ? Number(clientId) : null;
}

function mapHRsuiteRoleToPMS(hrsuiteRole: string): string {
  return (
    HRSUITE_TO_PMS_ROLE_MAP[hrsuiteRole] ||
    hrsuiteRole.toLowerCase().replace(/_/g, "")
  );
}

function mapHRsuiteRolesToPMS(hrsuiteRoles: string[]): string[] {
  return hrsuiteRoles.map(mapHRsuiteRoleToPMS);
}

/**
 * Extract user payload from decrypted HRsuite session for PMS auth API
 */
function extractAuthPayload(session: Record<string, any>) {
  const loginResponses = session.loginResponses || {};
  const userSession = loginResponses.UserSession || {};
  const company = loginResponses.Company || {};

  const email =
    userSession.EmailId || loginResponses.UserDetails?.EmailId || "";
  const hrsuiteRole =
    session.activeRoleCode || loginResponses.UIRoles?.[0]?.Role?.Code;
  // Map HRsuite role to PMS role format
  const role = mapHRsuiteRoleToPMS(hrsuiteRole || "");

  // Full UserCompanyAppliationRoles array for API payload
  const userCompanyRoles = loginResponses.UserCompanyAppliationRoles || [];

  // Extract only role names for application use
  // Path: UserCompanyAppliationRoles[].CompanyApplicationRole.Role.Name
  const hrsuiteRoleNames: string[] = userCompanyRoles
    .map((item: any) => item?.CompanyApplicationRole?.Role?.Name)
    .filter((name: string | undefined) => name);
  // Map to PMS role format
  const roleNames = mapHRsuiteRolesToPMS(hrsuiteRoleNames);

  const clientList = loginResponses.ClientList || [];
  const clientId = clientList[0]?.Id || null;

  return {
    userId: session.currentUser,
    email: email,
    role: role,
    roles: userCompanyRoles, // Full objects for API
    roleNames: roleNames, // Just names for application
    clientId: clientId,
  };
}

/**
 * Attempt SSO login by decrypting HRsuite session and calling PMS auth API
 * @returns true if SSO login was successful
 */
export async function attemptSSOLogin(): Promise<boolean> {
  console.log("[SSO] attemptSSOLogin started");

  // Check if HRsuite session exists
  const hasSession = hasHRsuiteSession();
  console.log("[SSO] hasHRsuiteSession:", hasSession);

  if (!hasSession) {
    console.log("[SSO] No HRsuite session found");
    return false;
  }

  // Decrypt and store the session
  console.log("[SSO] Decrypting HRsuite session...");
  const decrypted = decryptAndStoreHRsuiteSession();
  console.log("[SSO] Decryption result:", decrypted);

  if (!decrypted) {
    console.log("[SSO] Failed to decrypt HRsuite session");
    return false;
  }

  // Get the decrypted session
  const session = getStoredHRsuiteSession();
  console.log("[SSO] Retrieved stored session:", session ? "exists" : "null");

  if (!session) {
    console.log("[SSO] No decrypted session found");
    return false;
  }

  // Extract auth payload
  const payload = extractAuthPayload(session);
  console.log("[SSO] Auth payload:", payload);

  if (!payload.userId) {
    console.log("[SSO] No userId found in session");
    return false;
  }

  await new Promise((resolve) => setTimeout(resolve, 10000));

  try {
    // Call PMS auth/login API
    console.log("[SSO] Calling PMS auth API...");
    console.log("[SSO] API URL:", `${API_BASE_URL}/api/auth/login`);
    console.log("[SSO] API Payload:", payload);

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        roles: payload.roleNames, // Array of strings: ["employee", "manager", etc.]
        clientId: payload.clientId,
      }),
    });

    console.log("[SSO] API response status:", response.status);

    if (response.ok) {
      const result = await response.json();
      await new Promise((resolve) => setTimeout(resolve, 10000));
      console.log("[SSO] Login response:", result);

      // DEBUG: 10 second delay to inspect response

      // Store JWT tokens if provided
      if (result.accessToken) {
        setTokens(
          result.accessToken,
          result.refreshToken || "",
          result.expiresIn,
        );
        console.log("[SSO] JWT tokens stored");
      }

      // Store user data
      if (result.user) {
        const normalizedUser = normalizeUser(result.user);
        // Use role from HRsuite session (activeRoleCode) - cast to UserRole type
        normalizedUser.role =
          (payload.role as typeof normalizedUser.role) || normalizedUser.role;
        // normalizedUser.role = "admin";

        // Store only role names for application use
        normalizedUser.roles = payload.roleNames;
        setStoredUser(normalizedUser);
        console.log("[SSO] User stored:", normalizedUser);
      }

      // Mark login source as HRsuite
      setLoginSource("hrsuite");

      console.log("[SSO] SSO login successful");
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "[SSO] Login failed:",
        response.status,
        errorData.message || response.statusText,
      );
      return false;
    }
  } catch (error) {
    console.error("[SSO] Login error:", error);
    return false;
  }
}

/**
 * Check if user should be auto-logged in via SSO
 * Call this on app initialization
 */
export async function checkAndPerformSSOLogin(): Promise<boolean> {
  console.log("[SSO] ========== Starting SSO Check ==========");

  // Don't attempt SSO if already logged in
  const existingUser = localStorage.getItem("pms_auth_user");
  if (existingUser) {
    console.log("[SSO] User already logged in, skipping SSO");
    return false;
  }
  console.log("[SSO] No existing user, proceeding with SSO check");

  // Don't attempt SSO if already tried this session
  if (hasSSOBeenAttempted()) {
    console.log("[SSO] SSO already attempted this session, skipping");
    return false;
  }
  console.log("[SSO] SSO not yet attempted, proceeding");

  // Mark SSO as attempted
  markSSOAttempted();

  // Attempt SSO login
  console.log("[SSO] Calling attemptSSOLogin...");
  const success = await attemptSSOLogin();
  console.log("[SSO] attemptSSOLogin result:", success);

  if (success) {
    console.log("[SSO] SSO login successful, reloading page...");
    window.location.reload();
    return true;
  }

  console.log("[SSO] SSO login not successful, user needs to login manually");
  console.log("[SSO] ========== SSO Check Complete ==========");
  return false;
}
