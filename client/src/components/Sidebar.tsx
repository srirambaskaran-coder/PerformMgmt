import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Building,
  ChartPie,
  Users,
  ClipboardList,
  ChartBar,
  FileText,
  Calendar,
  Settings,
  LogOut,
  Menu,
  MapPin,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: ChartPie },
  { href: "/companies", label: "Company Management", icon: Building, roles: ["super_admin", "admin"] },
  { href: "/users", label: "Employee Management", icon: Users, roles: ["super_admin", "admin"] },
  { href: "/locations", label: "Location Management", icon: MapPin, roles: ["admin"] },
  { href: "/performance-reviews", label: "Performance Reviews", icon: ClipboardList, roles: ["hr_manager"] },
  { href: "/review-progress", label: "Review Progress", icon: ChartBar, roles: ["hr_manager"] },
  { href: "/questionnaires", label: "Questionnaires", icon: FileText },
  { href: "/evaluations", label: "My Evaluations", icon: ClipboardList, roles: ["employee", "manager"] },
  { href: "/meetings", label: "Meetings", icon: Calendar },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes((user as any)?.role || "employee");
  });

  return (
    <div
      className={cn(
        "bg-card border-r border-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      data-testid="sidebar"
    >
      {/* Logo and Company Info */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Building className="h-6 w-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-semibold text-foreground">Performance Hub</h2>
              <p className="text-sm text-muted-foreground">Employee Management</p>
            </div>
          )}
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
            <span className="text-accent-foreground text-sm font-medium">
              {(user as any)?.firstName?.[0]}{(user as any)?.lastName?.[0]}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate" data-testid="user-name">
                {(user as any)?.firstName} {(user as any)?.lastName}
              </p>
              <p className="text-xs text-muted-foreground capitalize" data-testid="user-role">
                {(user as any)?.role?.replace('_', ' ')}
              </p>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setCollapsed(!collapsed)}
              data-testid="toggle-sidebar"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredNavItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              data-testid={`nav-${item.href.replace('/', '') || 'dashboard'}`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start gap-3 text-destructive hover:text-destructive",
            collapsed && "justify-center px-2"
          )}
          data-testid="logout-button"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>

      {/* Collapse toggle for collapsed state */}
      {collapsed && (
        <div className="p-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 p-0"
            onClick={() => setCollapsed(false)}
            data-testid="expand-sidebar"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
