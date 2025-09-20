import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { RoleGuard } from "@/components/RoleGuard";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Send, 
  CheckCircle, 
  Clock, 
  XCircle,
  User,
  Calendar,
  TrendingUp
} from "lucide-react";
import type { Evaluation, User as UserType } from "@shared/schema";

interface EvaluationWithUser extends Evaluation {
  employee?: UserType;
  manager?: UserType;
}

export default function ReviewProgress() {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { toast } = useToast();

  const { data: evaluations = [], isLoading } = useQuery<EvaluationWithUser[]>({
    queryKey: ["/api/evaluations"],
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  // Create evaluations with user data
  const evaluationsWithUsers = evaluations.map(evaluation => ({
    ...evaluation,
    employee: users.find(user => user.id === evaluation.employeeId),
    manager: users.find(user => user.id === evaluation.managerId),
  }));

  const filteredEvaluations = evaluationsWithUsers.filter((evaluation) => {
    const employee = evaluation.employee;
    const matchesSearch = searchQuery === "" || 
      employee?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = departmentFilter === "" || 
      employee?.designation?.toLowerCase().includes(departmentFilter.toLowerCase());
    
    const matchesStatus = statusFilter === "" || evaluation.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-accent" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'overdue':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const calculateProgress = (evaluation: EvaluationWithUser) => {
    let progress = 0;
    if (evaluation.selfEvaluationSubmittedAt) progress += 40;
    if (evaluation.managerEvaluationSubmittedAt) progress += 40;
    if (evaluation.meetingCompletedAt) progress += 20;
    return progress;
  };

  // Calculate statistics
  const totalEvaluations = filteredEvaluations.length;
  const completedEvaluations = filteredEvaluations.filter(e => e.status === 'completed').length;
  const inProgressEvaluations = filteredEvaluations.filter(e => e.status === 'in_progress').length;
  const overdueEvaluations = filteredEvaluations.filter(e => e.status === 'overdue').length;
  const completionRate = totalEvaluations > 0 ? Math.round((completedEvaluations / totalEvaluations) * 100) : 0;

  return (
    <RoleGuard allowedRoles={["hr_manager"]}>
      <div className="space-y-6" data-testid="review-progress">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Review Progress</h1>
            <p className="text-muted-foreground">Track progress of ongoing performance reviews</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" data-testid="export-progress-button">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
                  <p className="text-2xl font-bold" data-testid="total-reviews">
                    {totalEvaluations}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold" data-testid="completed-reviews">
                    {completedEvaluations}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold" data-testid="in-progress-reviews">
                    {inProgressEvaluations}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                  <p className="text-2xl font-bold" data-testid="completion-rate">
                    {completionRate}%
                  </p>
                </div>
              </div>
              <Progress value={completionRate} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="search-employees"
                />
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[180px]" data-testid="filter-department">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Departments</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="hr">Human Resources</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]" data-testid="filter-status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Progress Table */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Review Status</CardTitle>
            <CardDescription>
              {filteredEvaluations.length} evaluation{filteredEvaluations.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 animate-pulse">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredEvaluations.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No evaluations found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvaluations.map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/20 transition-colors"
                    data-testid={`evaluation-row-${evaluation.id}`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-medium text-sm">
                          {evaluation.employee?.firstName?.[0]}{evaluation.employee?.lastName?.[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-medium" data-testid={`employee-name-${evaluation.id}`}>
                            {evaluation.employee?.firstName} {evaluation.employee?.lastName}
                          </p>
                          <Badge variant={getStatusVariant(evaluation.status || 'not_started')}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(evaluation.status || 'not_started')}
                              <span>{evaluation.status?.replace('_', ' ')}</span>
                            </div>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {evaluation.employee?.designation} • Manager: {evaluation.manager?.firstName} {evaluation.manager?.lastName}
                        </p>
                        <div className="mt-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground">Progress:</span>
                            <span className="text-xs font-medium">{calculateProgress(evaluation)}%</span>
                          </div>
                          <Progress value={calculateProgress(evaluation)} className="h-2 w-48" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      {/* Progress Indicators */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Self:</span>
                          {evaluation.selfEvaluationSubmittedAt ? (
                            <CheckCircle className="h-4 w-4 text-accent" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Manager:</span>
                          {evaluation.managerEvaluationSubmittedAt ? (
                            <CheckCircle className="h-4 w-4 text-accent" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Meeting:</span>
                          {evaluation.meetingCompletedAt ? (
                            <CheckCircle className="h-4 w-4 text-accent" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`view-evaluation-${evaluation.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`send-reminder-${evaluation.id}`}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
