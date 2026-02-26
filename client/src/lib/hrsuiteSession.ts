/**
 * HRsuite Session Integration Utility
 *
 * This module handles the decryption and parsing of HRsuite session storage data
 * to enable Single Sign-On (SSO) between HRsuite and PMS.
 *
 * The session data in HRsuite is encrypted using AES encryption.
 * When a user logs in from HRsuite and navigates to PMS, this utility
 * decrypts the session data and uses it for authentication.
 */

import CryptoJS from "crypto-js";

// Encryption key used by HRsuite (same as their application)
const HRSUITE_ENCRYPT_KEY = "7061737323313233";

// HRsuite session storage keys that we need to read
export const HRSUITE_SESSION_KEYS = {
  loginResponses: "ngx-webstorage|loginresponses",
  token: "ngx-webstorage|token",
  companyCode: "ngx-webstorage|companycode",
  roleId: "ngx-webstorage|roleid",
  smeClient: "ngx-webstorage|sme_client",
  clientContract: "ngx-webstorage|sme_clientcontract",
  defaultClientCode: "ngx-webstorage|default_clientcode",
  defaultSmeClient: "ngx-webstorage|default_sme_client",
  defaultSmeCode: "ngx-webstorage|default_sme_code",
  defaultContractCode: "ngx-webstorage|default_contractcode",
  loginUserId: "loginUserId",
  currentUser: "currentUser",
  activeRoleCode: "activeRoleCode",
  activeRoleId: "activeRoleId",
  isEmployee: "isEmployee",
  companyId: "CompanyId",
} as const;

/**
 * Check if a string is valid JSON
 */
function isJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Decrypt a value from HRsuite session storage
 * @param encryptedValue - The encrypted value from session storage
 * @returns The decrypted value (parsed JSON if applicable, or string)
 */
export function decryptSessionValue(encryptedValue: string | null): any {
  if (!encryptedValue) {
    return null;
  }

  try {
    let valueToDecrypt = encryptedValue;

    // Remove surrounding quotes if present
    if (valueToDecrypt.startsWith('"') && valueToDecrypt.endsWith('"')) {
      valueToDecrypt = valueToDecrypt.slice(1, -1);
    }

    // Check if the value looks like it's encrypted (Base64 AES format starts with "U2Fsd")
    if (
      typeof valueToDecrypt === "string" &&
      valueToDecrypt.startsWith("U2Fsd")
    ) {
      const bytes = CryptoJS.AES.decrypt(valueToDecrypt, HRSUITE_ENCRYPT_KEY);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedString) {
        console.warn(
          "[HRsuite] Decryption returned empty string for value starting with:",
          valueToDecrypt.substring(0, 20),
        );
        return encryptedValue; // Return original if decryption fails
      }

      // Check if the decrypted value is STILL encrypted (nested encryption)
      if (decryptedString.startsWith("U2Fsd")) {
        return decryptSessionValue(decryptedString);
      }

      // Try to parse as JSON if it looks like JSON
      if (isJson(decryptedString)) {
        return JSON.parse(decryptedString);
      }

      return decryptedString;
    }

    // If not encrypted, try to parse as JSON directly
    if (isJson(valueToDecrypt)) {
      return JSON.parse(valueToDecrypt);
    }

    return valueToDecrypt;
  } catch (error) {
    console.error("[HRsuite] Failed to decrypt session value:", error);
    return encryptedValue; // Return original on error
  }
}

/**
 * Get a value from session storage (handles both encrypted and non-encrypted values)
 * @param key - The session storage key
 * @returns The decrypted/parsed value
 */
export function getHRsuiteSessionValue(key: string): any {
  try {
    const value = sessionStorage.getItem(key);
    return decryptSessionValue(value);
  } catch (error) {
    console.error(
      `[HRsuite] Failed to get session value for key ${key}:`,
      error,
    );
    return null;
  }
}

/**
 * Interface for HRsuite login response data structure
 */
export interface HRsuiteLoginResponse {
  EmployeeId?: number;
  Token?: string;
  Company?: {
    Code: string;
    Name: string;
    Description?: string;
    IsActive?: boolean;
  };
  Implementation?: {
    Code: string;
    Name: string;
    Description?: string;
  };
  ImplementationCompany?: {
    ImplementationId: number;
    CompanyId: number;
    BOPath?: string;
  };
  UserDetails?: {
    PersonId: number;
    UserName: string;
    Password?: string | null;
    MobileNo?: string;
    EmailId?: string;
    UserId?: number;
    DOB?: string;
    Gender?: string;
    FirstName?: string;
    LastName?: string;
    Address?: string;
    City?: string;
    State?: string;
    Country?: string;
    Zipcode?: string;
    UserType?: string;
    IsSuperAdmin?: boolean;
    IsSystemAdmin?: boolean;
    PhotoPath?: string;
  };
  UIRoles?: Array<{
    Role: {
      Code: string;
      Name: string;
      Roletype: number;
      Description?: string;
    };
    UserId?: number;
    CompanyApplicationRoles?: any[];
  }>;
  UserCompanyApplicationRoles?: Array<{
    Id: number;
    UserId: number;
    CompanyApplicationRoleId?: number;
  }>;
  HierarchyRole?: {
    IsCompanyHierarchy: boolean;
    AttributeId: number;
    AttributeName?: string;
  };
  ClientContractList?: Array<{
    Code: string;
    Name: string;
    Description?: string;
  }>;
  ClientList?: any[];
  IsActive?: boolean;
  IsSystemAdmin?: boolean;
  Key?: string;
  LastLoggedInAt?: string;
  LastPwdUpdatedOn?: string;
  ModuleId?: number;
  Vector?: string;
}

/**
 * Interface for PMS-compatible user data extracted from HRsuite session
 */
export interface HRsuitePMSUser {
  employeeId: number;
  email: string;
  firstName: string;
  lastName: string;
  companyCode: string;
  companyName: string;
  token: string;
  roles: string[];
  activeRole: string;
  designation?: string;
  department?: string;
  mobileNumber?: string;
  profileImageUrl?: string;
}

/**
 * Check if HRsuite session exists and is valid
 * @returns true if valid HRsuite session data exists
 */
export function hasHRsuiteSession(): boolean {
  try {
    console.log("[HRsuite] Checking for HRsuite session...");

    // Check for key HRsuite session indicators
    const loginResponses = sessionStorage.getItem(
      HRSUITE_SESSION_KEYS.loginResponses,
    );
    const token = sessionStorage.getItem(HRSUITE_SESSION_KEYS.token);
    const currentUser = sessionStorage.getItem(
      HRSUITE_SESSION_KEYS.currentUser,
    );
    const loginUserId = sessionStorage.getItem(
      HRSUITE_SESSION_KEYS.loginUserId,
    );

    console.log("[HRsuite] Session check:", {
      hasLoginResponses: !!loginResponses,
      hasToken: !!token,
      hasCurrentUser: !!currentUser,
      hasLoginUserId: !!loginUserId,
      loginResponsesStart: loginResponses?.substring(0, 20),
      tokenStart: token?.substring(0, 20),
    });

    // If we have encrypted login responses, we have an HRsuite session
    if (loginResponses && loginResponses.startsWith("U2Fsd")) {
      console.log("[HRsuite] Found encrypted loginResponses");
      return true;
    }

    // Also check for token
    if (token && token.startsWith("U2Fsd")) {
      console.log("[HRsuite] Found encrypted token");
      return true;
    }

    // Check for plain (already decrypted or stored differently) session
    if (currentUser || loginUserId) {
      console.log("[HRsuite] Found currentUser or loginUserId");
      return true;
    }

    // Check if loginResponses exists but is not encrypted (might be JSON)
    if (loginResponses) {
      console.log("[HRsuite] Found non-encrypted loginResponses");
      return true;
    }

    // Check if token exists but is not encrypted
    if (token) {
      console.log("[HRsuite] Found non-encrypted token");
      return true;
    }

    console.log("[HRsuite] No HRsuite session found");
    return false;
  } catch (error) {
    console.error("[HRsuite] Error checking session:", error);
    return false;
  }
}

/**
 * Extract user data from HRsuite session for PMS authentication
 * @returns PMS-compatible user data or null if session is invalid
 */
export function extractHRsuiteUserData(): HRsuitePMSUser | null {
  try {
    // Get and decrypt the login responses
    const loginResponses = getHRsuiteSessionValue(
      HRSUITE_SESSION_KEYS.loginResponses,
    ) as HRsuiteLoginResponse;

    if (!loginResponses) {
      console.log("[HRsuite] No login responses found in session");
      return null;
    }

    console.log("[HRsuite] Decrypted login responses:", loginResponses);

    // Get the token
    const token = getHRsuiteSessionValue(HRSUITE_SESSION_KEYS.token);

    if (!token && !loginResponses.Token) {
      console.log("[HRsuite] No token found in session");
      return null;
    }

    // Extract user details
    const userDetails = loginResponses.UserDetails;
    if (!userDetails) {
      console.log("[HRsuite] No user details found in login responses");
      return null;
    }

    // Extract roles from UIRoles
    const roles: string[] = [];
    if (loginResponses.UIRoles && Array.isArray(loginResponses.UIRoles)) {
      loginResponses.UIRoles.forEach((uiRole) => {
        if (uiRole.Role?.Name) {
          roles.push(uiRole.Role.Name.toLowerCase());
        }
      });
    }

    // Get active role from session or default to first role
    const activeRoleCode =
      getHRsuiteSessionValue(HRSUITE_SESSION_KEYS.activeRoleCode) ||
      sessionStorage.getItem(HRSUITE_SESSION_KEYS.activeRoleCode);
    const activeRole = activeRoleCode?.toLowerCase() || roles[0] || "employee";

    // Build the PMS user object
    const pmsUser: HRsuitePMSUser = {
      employeeId: loginResponses.EmployeeId || userDetails.PersonId || 0,
      email: userDetails.EmailId || "",
      firstName: userDetails.FirstName || userDetails.UserName || "",
      lastName: userDetails.LastName || "",
      companyCode: loginResponses.Company?.Code || "",
      companyName: loginResponses.Company?.Name || "",
      token: token || loginResponses.Token || "",
      roles: roles.length > 0 ? roles : ["employee"],
      activeRole: activeRole,
      designation: userDetails.UserType || "",
      mobileNumber: userDetails.MobileNo || "",
      profileImageUrl: userDetails.PhotoPath || undefined,
    };

    console.log("[HRsuite] Extracted PMS user data:", pmsUser);
    return pmsUser;
  } catch (error) {
    console.error("[HRsuite] Failed to extract user data:", error);
    return null;
  }
}

/**
 * Clear HRsuite session data (for logout)
 */
export function clearHRsuiteSession(): void {
  try {
    Object.values(HRSUITE_SESSION_KEYS).forEach((key) => {
      sessionStorage.removeItem(key);
    });
    console.log("[HRsuite] Session cleared");
  } catch (error) {
    console.error("[HRsuite] Failed to clear session:", error);
  }
}

/**
 * Get the company code from HRsuite session
 */
export function getHRsuiteCompanyCode(): string | null {
  try {
    const companyCode = getHRsuiteSessionValue(
      HRSUITE_SESSION_KEYS.companyCode,
    );
    if (companyCode) {
      return companyCode;
    }

    // Try to get from login responses
    const loginResponses = getHRsuiteSessionValue(
      HRSUITE_SESSION_KEYS.loginResponses,
    ) as HRsuiteLoginResponse;
    return loginResponses?.Company?.Code || null;
  } catch {
    return null;
  }
}

/**
 * Get the auth token from HRsuite session
 */
export function getHRsuiteToken(): string | null {
  try {
    const token = getHRsuiteSessionValue(HRSUITE_SESSION_KEYS.token);
    if (token) {
      return token;
    }

    // Try to get from login responses
    const loginResponses = getHRsuiteSessionValue(
      HRSUITE_SESSION_KEYS.loginResponses,
    ) as HRsuiteLoginResponse;
    return loginResponses?.Token || null;
  } catch {
    return null;
  }
}

/**
 * Extract only the essential fields from loginResponses to minimize storage size
 * This prevents QuotaExceededError when storing large session data
 */
function extractEssentialLoginResponses(loginResponses: any): any {
  if (!loginResponses) return null;

  // Extract only fields actually used by PMS
  const essential: any = {};

  // UserSession - only need EmailId
  if (loginResponses.UserSession) {
    essential.UserSession = {
      EmailId: loginResponses.UserSession.EmailId,
    };
  }

  // UserDetails - only essential fields
  if (loginResponses.UserDetails) {
    essential.UserDetails = {
      EmailId: loginResponses.UserDetails.EmailId,
      PersonId: loginResponses.UserDetails.PersonId,
      FirstName: loginResponses.UserDetails.FirstName,
      LastName: loginResponses.UserDetails.LastName,
      UserName: loginResponses.UserDetails.UserName,
      MobileNo: loginResponses.UserDetails.MobileNo,
      PhotoPath: loginResponses.UserDetails.PhotoPath,
      UserType: loginResponses.UserDetails.UserType,
    };
  }

  // Company - only Code and Name
  if (loginResponses.Company) {
    essential.Company = {
      Code: loginResponses.Company.Code,
      Name: loginResponses.Company.Name,
    };
  }

  // UIRoles - only Role.Code and Role.Name for each
  if (loginResponses.UIRoles && Array.isArray(loginResponses.UIRoles)) {
    essential.UIRoles = loginResponses.UIRoles.map((uiRole: any) => ({
      Role: uiRole.Role
        ? {
            Code: uiRole.Role.Code,
            Name: uiRole.Role.Name,
          }
        : null,
    }));
  }

  // UserCompanyAppliationRoles - only extract CompanyApplicationRole.Role.Name
  if (
    loginResponses.UserCompanyAppliationRoles &&
    Array.isArray(loginResponses.UserCompanyAppliationRoles)
  ) {
    essential.UserCompanyAppliationRoles =
      loginResponses.UserCompanyAppliationRoles.map((item: any) => ({
        CompanyApplicationRole: item.CompanyApplicationRole
          ? {
              Role: item.CompanyApplicationRole.Role
                ? {
                    Name: item.CompanyApplicationRole.Role.Name,
                  }
                : null,
            }
          : null,
      }));
  }

  // ClientList - only Id from first item
  if (loginResponses.ClientList && Array.isArray(loginResponses.ClientList)) {
    essential.ClientList = loginResponses.ClientList.slice(0, 1).map(
      (client: any) => ({
        Id: client.Id,
      }),
    );
  }

  // Token
  if (loginResponses.Token) {
    essential.Token = loginResponses.Token;
  }

  // EmployeeId
  if (loginResponses.EmployeeId) {
    essential.EmployeeId = loginResponses.EmployeeId;
  }

  return essential;
}

/**
 * Decrypt essential HRsuite encrypted session values and store them in a single key
 * Only decrypts and stores fields needed by PMS to prevent QuotaExceededError
 * @returns true if decryption and storage was successful
 */
export function decryptAndStoreHRsuiteSession(): boolean {
  try {
    console.log("[HRsuite] Decrypting and storing session...");

    const decryptedSession: Record<string, any> = {};

    // Only decrypt essential keys needed by PMS
    const essentialKeys = [
      "loginResponses",
      "token",
      "currentUser",
      "activeRoleCode",
      "activeRoleId",
      "companyId",
    ] as const;

    Object.entries(HRSUITE_SESSION_KEYS).forEach(([name, key]) => {
      // Skip non-essential keys
      if (!essentialKeys.includes(name as any)) {
        return;
      }

      let rawValue = sessionStorage.getItem(key);

      if (rawValue) {
        console.log(
          `[HRsuite] Raw value for ${name}:`,
          rawValue.substring(0, 50) + "...",
        );

        // ngx-webstorage might store values with extra quotes
        if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
          rawValue = rawValue.slice(1, -1);
        }

        const decryptedValue = decryptSessionValue(rawValue);

        if (decryptedValue !== null) {
          // For loginResponses, extract only essential fields
          if (name === "loginResponses" && typeof decryptedValue === "object") {
            decryptedSession[name] =
              extractEssentialLoginResponses(decryptedValue);
            console.log(
              `[HRsuite] Decrypted ${name}: extracted essential fields only`,
            );
          } else {
            decryptedSession[name] = decryptedValue;
            console.log(
              `[HRsuite] Decrypted ${name}:`,
              typeof decryptedValue === "object"
                ? "object"
                : decryptedValue.toString().substring(0, 50),
            );
          }
        }
      }
    });

    // Store all decrypted data in a single key
    const sessionJson = JSON.stringify(decryptedSession);
    console.log(
      `[HRsuite] Session size: ${(sessionJson.length / 1024).toFixed(2)} KB`,
    );

    sessionStorage.setItem("pms_hrsuite_session", sessionJson);

    console.log(
      "[HRsuite] Session decrypted and stored to pms_hrsuite_session",
    );
    console.log(
      "[HRsuite] Decrypted session keys:",
      Object.keys(decryptedSession),
    );
    return true;
  } catch (error) {
    console.error("[HRsuite] Failed to decrypt and store session:", error);
    return false;
  }
}

/**
 * Get the stored decrypted HRsuite session
 */
export function getStoredHRsuiteSession(): Record<string, any> | null {
  try {
    const stored = sessionStorage.getItem("pms_hrsuite_session");
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch {
    return null;
  }
}
