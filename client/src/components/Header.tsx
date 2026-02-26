import { LogOut, User, RefreshCw, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useAuth,
  clearAuthData,
  getStoredUser,
  setStoredUser,
  setTokens,
} from "@/hooks/useAuth";
import { clearHRsuiteSession } from "@/lib/hrsuiteSession";
import {
  clearSSOAttempted,
  getLoginSource,
  getSSOLogoutUrl,
} from "@/lib/ssoAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/components/SidebarContext";
import { API_BASE_URL } from "@/config/api.config";

// Reverse map: PMS role code → HRSuite PascalCase role code
// Must match the inverse of HRSUITE_TO_PMS_ROLE_MAP in ssoAuth.ts
const PMS_TO_HRSUITE_ROLE_MAP: Record<string, string> = {
  employee: "Employee",
  manager: "Manager",
  hrmanager: "HRManager",
  admin: "Admin",
  superadmin: "SuperAdmin",
};

// Numeric role IDs as defined in the HRSuite database
// Used to set activeRoleId correctly when switching roles in PMS
const HRSUITE_ROLE_ID_MAP: Record<string, number> = {
  employee: 10,
  manager: 11,
  hrmanager: 18,
  admin: 29,
};

export function Header() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { toggleSidebar } = useSidebar();

  const switchRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      // Normalize role for API payload (remove underscores)
      const normalizedRole = role.toLowerCase().replace(/_/g, "");
      const response = await apiRequest("POST", "/api/auth/switch-role", {
        role: normalizedRole,
      });
      return response.json();
    },
    onSuccess: (data, role) => {
      // 1. Persist the new JWT tokens returned by the switch-role API.
      //    The old token still carries the previous role claim, so every API
      //    call after this would be rejected with 403 unless we replace it.
      if (data?.accessToken) {
        setTokens(data.accessToken, data.refreshToken || "", data.expiresIn);
        console.log("[Header] New JWT token stored after role switch");
      }

      // 2. Update stored user with new active role
      const storedUser = getStoredUser();
      if (storedUser) {
        const updatedUser = {
          ...storedUser,
          role: role as typeof storedUser.role,
          activeRole: role,
        } as Parameters<typeof setStoredUser>[0];
        setStoredUser(updatedUser);
      }
      // 3. Also update sessionStorage for HRsuite session compatibility.
      // IMPORTANT: use PascalCase role code and numeric roleId so we don't
      // corrupt the HRSuite session values that other parts of the app rely on.
      try {
        // Map PMS lowercase role back to HRSuite PascalCase format (e.g. "hrmanager" → "HRManager")
        const hrsuiteRoleCode =
          PMS_TO_HRSUITE_ROLE_MAP[role.toLowerCase()] || role;
        sessionStorage.setItem("activeRoleCode", hrsuiteRoleCode);

        // Use the numeric roleId returned by the API response, or fall back to
        // the known HRSuite role ID map. Never store the role string here —
        // HRSuite expects a numeric value (e.g. 18, not "hrmanager").
        const numericRoleId =
          data?.roleId ??
          data?.RoleId ??
          data?.user?.roleId ??
          data?.user?.RoleId ??
          data?.user?.ActiveRoleId ??
          data?.user?.activeRoleId ??
          HRSUITE_ROLE_ID_MAP[role.toLowerCase()];
        if (numericRoleId != null) {
          sessionStorage.setItem("activeRoleId", String(numericRoleId));
        }

        // Also patch the already-stored pms_hrsuite_session so the next SSO
        // check reads the correct (PascalCase) role without a full re-decrypt.
        try {
          const storedSession = sessionStorage.getItem("pms_hrsuite_session");
          if (storedSession) {
            const parsed = JSON.parse(storedSession);
            parsed.activeRoleCode = hrsuiteRoleCode;
            if (numericRoleId != null) {
              parsed.activeRoleId = numericRoleId;
            }
            sessionStorage.setItem(
              "pms_hrsuite_session",
              JSON.stringify(parsed),
            );
          }
        } catch {
          // non-critical: session will be rebuilt on next navigation
        }
      } catch (e) {
        console.warn("[Header] Failed to update sessionStorage:", e);
      }
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Role switched successfully",
        description: "Your active role has been updated.",
      });
      // Redirect to dashboard to show the appropriate role's dashboard
      window.location.href = `${import.meta.env.BASE_URL || "/"}`;
    },
    onError: (error: any) => {
      toast({
        title: "Failed to switch role",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSwitchRole = (role: string) => {
    switchRoleMutation.mutate(role);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    // Check if user logged in via HRsuite
    const loginSource = getLoginSource();

    // Clear sessionStorage auth data (per-tab)
    clearAuthData();
    // Clear SSO attempted flag so next login can try SSO again
    clearSSOAttempted();
    // Clear HRsuite session data if it exists
    clearHRsuiteSession();
    // Clear query cache
    queryClient.clear();

    // If logged in via HRsuite, redirect back to HRsuite (if applicable)
    // Otherwise, redirect to PMS login page
    if (loginSource === "hrsuite") {
      console.log("[Header] User logged in via HRsuite, redirecting to SSO...");
      const ssoLogoutUrl = getSSOLogoutUrl();
      window.location.href = ssoLogoutUrl;
      return;
    }

    // Force redirect to login page with page reload
    window.location.href = `${import.meta.env.BASE_URL || "/"}#/login`;
  };

  // Get active role and available roles from user object
  // Handle both uppercase and lowercase property names
  const activeRole =
    (user as any)?.activeRole ||
    (user as any)?.ActiveRole ||
    (user as any)?.role ||
    (user as any)?.Role;

  // Use 'roles' as the source of truth for available roles
  const availableRoles = (user as any)?.roles || (user as any)?.Roles || [];

  const hasMultipleRoles =
    Array.isArray(availableRoles) && availableRoles.length > 1;

  // Helper function to format role names properly for display
  const formatRoleName = (role: string) => {
    if (!role) return "Unknown";
    // Handle both formats: "hr_manager" and "hrmanager"
    const normalizedRole = role.toLowerCase().replace(/_/g, "");
    if (normalizedRole === "hrmanager") return "HR Manager";
    if (normalizedRole === "superadmin") return "Super Admin";
    // For other roles, capitalize first letter
    return role
      .split("_")
      .filter((word) => word && word.length > 0)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <header
      className="bg-card border-b border-border px-6 py-4"
      data-testid="header"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Sidebar Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleSidebar}
            data-testid="toggle-sidebar"
          >
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>

          <div>
            <h1 className="text-xl font-semibold" data-testid="page-title">
              Performance Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor and manage employee performance reviews
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full p-0"
                data-testid="user-profile-button"
              >
                <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                  <span className="text-accent-foreground text-sm font-medium">
                    {(user as any)?.firstName || (user as any)?.lastName ? (
                      `${(user as any)?.firstName?.[0]?.toUpperCase() || ""}${(user as any)?.lastName?.[0]?.toUpperCase() || ""}`.trim() || (
                        <User className="h-4 w-4" />
                      )
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p
                    className="text-sm font-medium leading-none"
                    data-testid="user-name-display"
                  >
                    {(user as any)?.firstName || (user as any)?.lastName
                      ? `${(user as any)?.firstName || ""} ${(user as any)?.lastName || ""}`.trim()
                      : "Loading..."}
                  </p>
                  <p
                    className="text-xs leading-none text-muted-foreground"
                    data-testid="user-email-display"
                  >
                    {(user as any)?.email || "Loading..."}
                  </p>
                  <p
                    className="text-xs leading-none text-muted-foreground"
                    data-testid="user-role-display"
                  >
                    {activeRole ? formatRoleName(activeRole) : "Loading..."}
                    {hasMultipleRoles && (
                      <span className="ml-1 text-primary">•</span>
                    )}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Role Switcher - Only show if user has multiple roles */}
              {hasMultipleRoles && (
                <>
                  <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                    Switch Role
                  </DropdownMenuLabel>
                  {availableRoles
                    .filter((role: string) => role)
                    .map((role: string) => (
                      <DropdownMenuItem
                        key={role}
                        onClick={() => handleSwitchRole(role)}
                        disabled={
                          role === activeRole || switchRoleMutation.isPending
                        }
                        data-testid={`switch-role-${role}`}
                      >
                        <RefreshCw
                          className={`mr-2 h-4 w-4 ${
                            switchRoleMutation.isPending ? "animate-spin" : ""
                          }`}
                        />
                        <span
                          className={role === activeRole ? "font-medium" : ""}
                        >
                          {formatRoleName(role)}
                          {role === activeRole && (
                            <span className="ml-2 text-primary">✓</span>
                          )}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem
                onClick={handleLogout}
                data-testid="logout-button"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
