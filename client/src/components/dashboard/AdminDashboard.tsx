import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  Building2,
  MapPin,
  Award,
  Layers,
  FileText,
  Settings,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  CalendarCheck,
  Mail,
  ChevronRight,
} from "lucide-react";
import { Link } from "wouter";

interface AdminMetrics {
  totalEmployees: number;
  departments: number;
  locations: number;
  questionnaireTemplates: number;
  configurationComplete: number;
  pendingSetups: number;
  activeUsers: number;
  systemIntegrations: number;
  appraisalCycles: number;
}

interface SetupItem {
  id: string;
  name: string;
  status: "completed" | "pending" | "in_progress";
  description: string;
  priority: "high" | "medium" | "low";
  route?: string;
}

interface DepartmentStats {
  id: string;
  name: string;
  employeeCount: number;
  managersCount: number;
  completionRate: number;
}

interface CompanyUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department?: string;
  profileImageUrl?: string;
}

// Route mapping for setup items
const setupItemRoutes: Record<string, string> = {
  "1": "/departments", // Configure Departments
  "2": "/locations", // Add Locations
  "3": "/questionnaires", // Create Questionnaire Templates
  "4": "/settings", // Email Service Configuration
};

export default function AdminDashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<AdminMetrics>({
    queryKey: ["/api/dashboard/admin/metrics"],
  });

  const { data: setupItems = [], isLoading: setupLoading } = useQuery<
    SetupItem[]
  >({
    queryKey: ["/api/dashboard/admin/setup-items"],
  });

  const { data: departments = [], isLoading: departmentsLoading } = useQuery<
    DepartmentStats[]
  >({
    queryKey: ["/api/dashboard/admin/departments"],
  });

  const { data: companyUsers = [], isLoading: usersLoading } = useQuery<
    CompanyUser[]
  >({
    queryKey: ["/api/users"],
  });

  // Check if all setup tasks are completed
  const allSetupComplete =
    setupItems.length > 0 &&
    setupItems.every((item) => item.status === "completed");

  if (metricsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administration Dashboard</h1>
          <p className="text-muted-foreground">
            Manage company structure and system configuration
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/users">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Admin Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="total-employees-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Employees
                </p>
                <p className="text-2xl font-bold">
                  {metrics?.totalEmployees || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-green-600">
                {metrics?.activeUsers || 0} active
              </span>
              <span className="text-xs text-muted-foreground">
                users this week
              </span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="departments-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Departments
                </p>
                <p className="text-2xl font-bold">
                  {metrics?.departments || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-blue-600">
                {metrics?.locations || 0} locations
              </span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="templates-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Templates
                </p>
                <p className="text-2xl font-bold">
                  {metrics?.questionnaireTemplates || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-xs text-green-600">Ready for use</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="appraisal-cycles-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Appraisal Cycles
                </p>
                <p className="text-2xl font-bold">
                  {metrics?.appraisalCycles || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <CalendarCheck className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <Link href="/appraisal-cycles">
                <span className="text-xs text-purple-600 hover:underline cursor-pointer">
                  Manage cycles →
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Setup Tasks / User Overview and Department Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {allSetupComplete ? (
          /* User Overview - shown when all setup tasks are complete */
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Overview</CardTitle>
                <CardDescription>
                  Company employees and team members
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/users">View All</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {usersLoading ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-14 bg-muted rounded-lg"></div>
                  ))}
                </div>
              ) : companyUsers.length > 0 ? (
                companyUsers.slice(0, 6).map((user) => (
                  <Link key={user.id} href={`/users/${user.id}`}>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={user.profileImageUrl}
                            alt={`${user.firstName} ${user.lastName}`}
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {user.firstName?.charAt(0)}
                            {user.lastName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {user.role?.replace("_", " ")}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No users found
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Setup Tasks - shown when setup is incomplete */
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Setup Tasks</CardTitle>
                <CardDescription>Complete system configuration</CardDescription>
              </div>
              <Badge variant="outline">
                {setupItems.filter((item) => item.status === "pending").length}{" "}
                pending
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {setupLoading ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted rounded-lg"></div>
                  ))}
                </div>
              ) : setupItems.length > 0 ? (
                setupItems.slice(0, 6).map((item) => {
                  const route = setupItemRoutes[item.id];
                  const ItemWrapper = route ? Link : "div";
                  const itemProps = route ? { href: route } : {};

                  return (
                    <ItemWrapper key={item.id} {...(itemProps as any)}>
                      <div
                        className={`flex items-center justify-between p-3 bg-muted/30 rounded-lg ${
                          route
                            ? "hover:bg-muted/50 transition-colors cursor-pointer"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              item.status === "completed"
                                ? "bg-green-100"
                                : item.status === "in_progress"
                                ? "bg-yellow-100"
                                : "bg-gray-100"
                            }`}
                          >
                            {item.status === "completed" ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : item.status === "in_progress" ? (
                              <Clock className="h-4 w-4 text-yellow-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              item.priority === "high"
                                ? "destructive"
                                : item.priority === "medium"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {item.priority}
                          </Badge>
                          {route && (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </ItemWrapper>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  All setup tasks completed
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Department Overview</CardTitle>
              <CardDescription>
                Employee distribution and management
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/departments">Manage</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {departmentsLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg"></div>
                ))}
              </div>
            ) : departments.length > 0 ? (
              departments.slice(0, 5).map((dept) => (
                <div
                  key={dept.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-xs font-medium text-primary-foreground">
                      {dept.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{dept.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {dept.employeeCount} employees • {dept.managersCount}{" "}
                        managers
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{dept.completionRate}%</p>
                    <Progress
                      value={dept.completionRate}
                      className="w-20 h-2 mt-1"
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No departments configured
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button asChild data-testid="manage-users-button">
              <Link href="/users">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              data-testid="manage-departments-button"
            >
              <Link href="/departments">
                <Building2 className="h-4 w-4 mr-2" />
                Departments
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              data-testid="manage-locations-button"
            >
              <Link href="/locations">
                <MapPin className="h-4 w-4 mr-2" />
                Locations
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/levels">
                <Layers className="h-4 w-4 mr-2" />
                Levels & Grades
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/questionnaires">
                <FileText className="h-4 w-4 mr-2" />
                Templates
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
