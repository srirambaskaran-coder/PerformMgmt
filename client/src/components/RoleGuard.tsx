import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Normalize role for comparison - removes underscores and converts to lowercase
 * This allows "hr_manager" and "hrmanager" to match
 */
function normalizeRole(role: string): string {
  if (!role) return "";
  return role.toLowerCase().replace(/_/g, "");
}

export function RoleGuard({
  allowedRoles,
  children,
  fallback,
}: RoleGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Use active role from session for role switching support
  // Handle both uppercase (from API) and lowercase (from schema) property names
  const userAny = user as any;
  const activeRole =
    userAny?.activeRole ||
    userAny?.ActiveRole ||
    userAny?.role ||
    userAny?.Role ||
    "";

  // Normalize roles for comparison (handles both "hr_manager" and "hrmanager")
  const normalizedActiveRole = normalizeRole(activeRole);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);
  const hasAccess = normalizedAllowedRoles.includes(normalizedActiveRole);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !hasAccess) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
    }
  }, [isLoading, isAuthenticated, user, hasAccess, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      fallback || (
        <div className="text-center p-8">
          <p className="text-muted-foreground">
            You need to be logged in to access this page.
          </p>
        </div>
      )
    );
  }

  if (!hasAccess) {
    return (
      fallback || (
        <div className="text-center p-8">
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
      )
    );
  }

  return <>{children}</>;
}
