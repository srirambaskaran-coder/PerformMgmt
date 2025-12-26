import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/SidebarContext";
import { useQuery } from "@tanstack/react-query";
import {
  Building,
  ChartPie,
  Users,
  ClipboardList,
  ChartBar,
  FileText,
  Calendar,
  Settings,
  MapPin,
  Layers,
  Award,
  Clock,
  Repeat,
  CalendarDays,
  Building2,
  Play,
  Search,
  CalendarCheck,
  Target,
  BarChart3,
  MessageSquare,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: ChartPie },
  {
    href: "/companies",
    label: "Company Management",
    icon: Building,
    roles: ["super_admin"],
  },
  {
    href: "/locations",
    label: "Location Management",
    icon: MapPin,
    roles: ["admin"],
  },
  {
    href: "/departments",
    label: "Department Management",
    icon: Building2,
    roles: ["admin"],
  },
  {
    href: "/levels",
    label: "Level Management",
    icon: Layers,
    roles: ["admin"],
  },
  { href: "/grades", label: "Grade Management", icon: Award, roles: ["admin"] },
  {
    href: "/users",
    label: "User Management",
    icon: Users,
    roles: ["super_admin", "admin"],
  },
  {
    href: "/appraisal-cycles",
    label: "Appraisal Cycles",
    icon: Clock,
    roles: ["admin"],
  },
  {
    href: "/review-frequencies",
    label: "Review Frequencies",
    icon: Repeat,
    roles: ["admin"],
  },
  {
    href: "/frequency-calendars",
    label: "Frequency Calendars",
    icon: Calendar,
    roles: ["admin"],
  },
  {
    href: "/frequency-calendar-details",
    label: "Calendar Details",
    icon: CalendarDays,
    roles: ["admin"],
  },
  {
    href: "/appraisal-groups",
    label: "Appraisal Groups",
    icon: Users,
    roles: ["hr_manager"],
  },
  {
    href: "/initiate-appraisal",
    label: "Initiate Appraisal Cycle",
    icon: Play,
    roles: ["hr_manager"],
  },
  {
    href: "/review-appraisal",
    label: "Review Progress",
    icon: Search,
    roles: ["hr_manager"],
  },
  {
    href: "/hr-meetings",
    label: "View Meetings",
    icon: CalendarCheck,
    roles: ["hr_manager"],
  },
  {
    href: "/calibrate-ratings",
    label: "Calibrate Ratings",
    icon: Award,
    roles: ["hr_manager"],
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    roles: ["hr_manager"],
  },
  {
    href: "/questionnaires",
    label: "Questionnaires",
    icon: FileText,
    roles: ["super_admin", "admin", "hr_manager"],
  },
  {
    href: "/evaluations",
    label: "My Evaluations",
    icon: ClipboardList,
    roles: ["employee"],
  },
  {
    href: "/manager-submissions",
    label: "Submissions",
    icon: ClipboardList,
    roles: ["manager"],
  },
  {
    href: "/member-development-goals",
    label: "Member Development Goals",
    icon: Target,
    roles: ["manager"],
  },
  {
    href: "/meetings",
    label: "Meetings",
    icon: Calendar,
    roles: ["employee", "manager"],
  },
  {
    href: "/development-goals",
    label: "My Development Goals",
    icon: Target,
    roles: ["employee"],
  },
  {
    href: "/feedback-requests",
    label: "Feedback Requests",
    icon: MessageSquare,
    roles: ["employee"],
  },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { collapsed } = useSidebar();
  const [location] = useLocation();
  const { user } = useAuth();

  // Fetch company data if user has a companyId
  const companyId = (user as any)?.companyId;
  const { data: company } = useQuery({
    queryKey: ["/api/companies", companyId],
    enabled: !!companyId,
  });

  // Use active role from session for role switching support
  const activeRole =
    (user as any)?.activeRole || (user as any)?.role || "employee";

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(activeRole);
  });

  return (
    <div
      className={cn(
        "bg-card border-r border-border flex flex-col h-full transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-64"
      )}
      data-testid="sidebar"
    >
      {/* Logo and Company Info */}
      <div
        className={cn(
          "border-b border-border shrink-0 flex items-center",
          collapsed ? "h-16 justify-center" : "p-4"
        )}
      >
        <div
          className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "gap-3"
          )}
        >
          {(company as any)?.logoUrl ? (
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-background border border-border">
              <img
                src={(company as any).logoUrl}
                alt={(company as any)?.name || "Company Logo"}
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback to default icon if image fails to load
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement!.innerHTML = `
                    <div class="w-full h-full bg-primary rounded-lg flex items-center justify-center">
                      <svg class="h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    </div>
                  `;
                }}
              />
            </div>
          ) : (
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Building className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-foreground text-sm truncate">
                {(company as any)?.name || "Performance Hub"}
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                Employee Management
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu - Scrollable with custom scrollbar */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden space-y-1",
          collapsed
            ? "sidebar-scroll-collapsed px-1.5 py-2"
            : "sidebar-scroll px-2 py-2"
        )}
      >
        {filteredNavItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-md text-sm font-medium transition-colors",
                collapsed
                  ? "justify-center w-10 h-10 mx-auto"
                  : "gap-3 px-3 py-2",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              data-testid={`nav-${item.href.replace("/", "") || "dashboard"}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
