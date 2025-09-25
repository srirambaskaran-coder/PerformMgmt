import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
  Clock
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
}

interface SetupItem {
  id: string;
  name: string;
  status: 'completed' | 'pending' | 'in_progress';
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface DepartmentStats {
  id: string;
  name: string;
  employeeCount: number;
  managersCount: number;
  completionRate: number;
}

export default function AdminDashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<AdminMetrics>({
    queryKey: ["/api/dashboard/admin/metrics"],
  });

  const { data: setupItems = [], isLoading: setupLoading } = useQuery<SetupItem[]>({
    queryKey: ["/api/dashboard/admin/setup-items"],
  });

  const { data: departments = [], isLoading: departmentsLoading } = useQuery<DepartmentStats[]>({
    queryKey: ["/api/dashboard/admin/departments"],
  });

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
          <p className="text-muted-foreground">Manage company structure and system configuration</p>
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
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{metrics?.totalEmployees || 0}</p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-green-600">{metrics?.activeUsers || 0} active</span>
              <span className="text-xs text-muted-foreground">users this week</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="departments-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold">{metrics?.departments || 0}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-blue-600">{metrics?.locations || 0} locations</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="templates-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Templates</p>
                <p className="text-2xl font-bold">{metrics?.questionnaireTemplates || 0}</p>
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

        <Card data-testid="system-config-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Setup</p>
                <p className="text-2xl font-bold">{metrics?.configurationComplete || 0}%</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Settings className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={metrics?.configurationComplete || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Setup Tasks and Department Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Setup Tasks</CardTitle>
              <CardDescription>Complete system configuration</CardDescription>
            </div>
            <Badge variant="outline">{setupItems.filter(item => item.status === 'pending').length} pending</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {setupLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded-lg"></div>
                ))}
              </div>
            ) : setupItems.length > 0 ? (
              setupItems.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      item.status === 'completed' ? 'bg-green-100' :
                      item.status === 'in_progress' ? 'bg-yellow-100' : 'bg-gray-100'
                    }`}>
                      {item.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : item.status === 'in_progress' ? (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                      {item.priority}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">All setup tasks completed</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Department Overview</CardTitle>
              <CardDescription>Employee distribution and management</CardDescription>
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
                <div key={dept.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-xs font-medium text-primary-foreground">
                      {dept.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{dept.name}</p>
                      <p className="text-sm text-muted-foreground">{dept.employeeCount} employees • {dept.managersCount} managers</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{dept.completionRate}%</p>
                    <Progress value={dept.completionRate} className="w-20 h-2 mt-1" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No departments configured</p>
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
            <Button variant="outline" asChild data-testid="manage-departments-button">
              <Link href="/departments">
                <Building2 className="h-4 w-4 mr-2" />
                Departments
              </Link>
            </Button>
            <Button variant="outline" asChild data-testid="manage-locations-button">
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