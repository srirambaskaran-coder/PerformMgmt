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
} from "@/hooks/useAuth";
import { clearHRsuiteSession } from "@/lib/hrsuiteSession";
import { clearSSOAttempted, getLoginSource } from "@/lib/ssoAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/components/SidebarContext";
import { API_BASE_URL } from "@/config/api.config";

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
      // Update stored user with new active role
      const storedUser = getStoredUser();
      if (storedUser) {
        const updatedUser = {
          ...storedUser,
          role: role,
          activeRole: role,
        };
        setStoredUser(updatedUser);
      }
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Role switched successfully",
        description: "Your active role has been updated.",
      });
      // Reload the page to apply the new role throughout the app
      window.location.reload();
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

    // Clear localStorage auth data
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
      // You can customize this URL to redirect back to HRsuite
      console.log("[Header] User logged in via HRsuite, logging out...");
    }

    // Force redirect to login page with page reload
    window.location.href = `${import.meta.env.BASE_URL || "/"}#/login`;
    window.location.reload();
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
                    {(user as any)?.firstName && (user as any)?.lastName ? (
                      `${(user as any).firstName[0]?.toUpperCase()}${(
                        user as any
                      ).lastName[0]?.toUpperCase()}`
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
                    {(user as any)?.firstName && (user as any)?.lastName
                      ? `${(user as any).firstName} ${(user as any).lastName}`
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
