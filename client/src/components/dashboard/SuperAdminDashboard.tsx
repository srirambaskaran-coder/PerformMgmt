import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Building, 
  Users, 
  Globe,
  Activity,
  TrendingUp,
  AlertTriangle,
  Settings,
  Database,
  Shield,
  Plus
} from "lucide-react";
import { Link } from "wouter";

interface SuperAdminMetrics {
  totalCompanies: number;
  totalUsers: number;
  activeCompanies: number;
  systemHealth: number;
  recentSignups: number;
  systemAlerts: number;
  storageUsage: number;
  activeEvaluations: number;
}

interface CompanyOverview {
  id: string;
  name: string;
  domain: string;
  userCount: number;
  status: 'active' | 'inactive' | 'trial';
  planType: string;
}

interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: string;
}

export default function SuperAdminDashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<SuperAdminMetrics>({
    queryKey: ["/api/dashboard/super-admin/metrics"],
  });

  const { data: companies = [], isLoading: companiesLoading } = useQuery<CompanyOverview[]>({
    queryKey: ["/api/dashboard/super-admin/companies"],
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery<SystemAlert[]>({
    queryKey: ["/api/dashboard/super-admin/alerts"],
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
    <div className="space-y-6" data-testid="super-admin-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Overview</h1>
          <p className="text-muted-foreground">Manage the entire performance management platform</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/companies">
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/settings">
              <Settings className="h-4 w-4 mr-2" />
              System Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Key System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="total-companies-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Companies</p>
                <p className="text-2xl font-bold">{metrics?.totalCompanies || 0}</p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Building className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-green-600">+{metrics?.recentSignups || 0}</span>
              <span className="text-xs text-muted-foreground">new this month</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="total-users-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{metrics?.totalUsers || 0}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-blue-600">Across all companies</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="system-health-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Health</p>
                <p className="text-2xl font-bold">{metrics?.systemHealth || 0}%</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={metrics?.systemHealth || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="system-alerts-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Alerts</p>
                <p className="text-2xl font-bold">{metrics?.systemAlerts || 0}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-xs text-orange-600">Requires attention</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Overview and System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Company Overview</CardTitle>
              <CardDescription>Active companies and their status</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/companies">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {companiesLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg"></div>
                ))}
              </div>
            ) : companies.length > 0 ? (
              companies.slice(0, 5).map((company) => (
                <div key={company.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-xs font-medium text-primary-foreground">
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-sm text-muted-foreground">{company.userCount} users • {company.planType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={company.status === 'active' ? 'default' : company.status === 'trial' ? 'secondary' : 'destructive'}>
                      {company.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No companies found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Recent system notifications and warnings</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {alertsLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded-lg"></div>
                ))}
              </div>
            ) : alerts.length > 0 ? (
              alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    alert.type === 'error' ? 'bg-destructive' : 
                    alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.timestamp}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No alerts</p>
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
            <Button asChild data-testid="manage-companies-button">
              <Link href="/companies">
                <Building className="h-4 w-4 mr-2" />
                Manage Companies
              </Link>
            </Button>
            <Button variant="outline" asChild data-testid="user-management-button">
              <Link href="/users">
                <Users className="h-4 w-4 mr-2" />
                User Management
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </Link>
            </Button>
            <Button variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Database Backup
            </Button>
            <Button variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Security Audit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}