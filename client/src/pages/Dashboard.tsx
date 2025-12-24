import { useAuth } from "@/hooks/useAuth";
import SuperAdminDashboard from "@/components/dashboard/SuperAdminDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import HRManagerDashboard from "@/components/dashboard/HRManagerDashboard";
import ManagerDashboard from "@/components/dashboard/ManagerDashboard";
import EmployeeDashboard from "@/components/dashboard/EmployeeDashboard";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Handle both uppercase (from API) and lowercase (from schema) property names
  const userAny = user as any;
  const currentRole =
    userAny.activeRole || userAny.ActiveRole || userAny.role || userAny.Role;

  console.log("[Dashboard] User:", user, "Current role:", currentRole);

  switch (currentRole) {
    case "super_admin":
      return <SuperAdminDashboard />;
    case "admin":
      return <AdminDashboard />;
    case "hr_manager":
      return <HRManagerDashboard />;
    case "manager":
      return <ManagerDashboard />;
    case "employee":
      return <EmployeeDashboard />;
    default:
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground">
              Dashboard not available for your role.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Please contact your administrator.
            </p>
          </div>
        </div>
      );
  }
}
