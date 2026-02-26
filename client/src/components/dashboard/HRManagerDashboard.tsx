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
import {
  Users,
  Clock,
  ClipboardCheck,
  TrendingUp,
  AlertTriangle,
  Play,
  Search,
  Calendar,
  FileText,
  Target,
  CheckCircle2,
  CalendarCheck,
  User,
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

interface HRMetrics {
  activeAppraisalCycles: number;
  totalEmployeesInCycle: number;
  completionRate: number;
  pendingEvaluations: number;
  overdueEvaluations: number;
  upcomingDeadlines: number;
  averageRating: number;
  managerReviewsPending: number;
}

interface AppraisalCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "active" | "completed" | "planned";
  employeeCount: number;
  completionPercentage: number;
  overdueCount: number;
}

interface GroupProgress {
  id: string;
  name: string;
  employeeCount: number;
  selfCompleted: number;
  managerCompleted: number;
  overallProgress: number;
  deadline: string;
}

interface UpcomingDeadline {
  id: string;
  employeeName: string;
  evaluationType: "self" | "manager";
  dueDate: string;
  daysRemaining: number;
  priority: "high" | "medium" | "low";
}

interface MeetingData {
  id: string;
  meetingScheduledAt: string | null;
  meetingCompletedAt: string | null;
  employee: {
    firstName: string;
    lastName: string | null;
    email: string;
  } | null;
  manager: {
    firstName: string;
    lastName: string | null;
    email: string;
  } | null;
}

export default function HRManagerDashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<HRMetrics>({
    queryKey: ["/api/dashboard/hr-manager/metrics"],
  });

  const { data: cycles = [], isLoading: cyclesLoading } = useQuery<
    AppraisalCycle[]
  >({
    queryKey: ["/api/dashboard/hr-manager/cycles"],
    select: (data: any[]) => {
      if (!Array.isArray(data)) return [];
      return data.map((item: any) => {
        const createdOn = item.CreatedOn
          ? new Date(item.CreatedOn)
          : new Date();
        const daysToClose = item.DaysToClose || 30;
        const endDate = new Date(createdOn);
        endDate.setDate(endDate.getDate() + daysToClose);

        // Calculate overdue count from employee progress
        const now = new Date();
        const isOverdue = now > endDate;
        const overdueCount = isOverdue
          ? (item.progress?.employeeProgress || []).filter(
              (ep: any) => !ep.isCompleted,
            ).length
          : 0;

        // Determine status based on completion and dates
        let status: "active" | "completed" | "planned" = "active";
        if (item.progress?.percentage === 100) {
          status = "completed";
        } else if (createdOn > now) {
          status = "planned";
        }

        return {
          id: String(item.Id),
          name: item.AppraisalGroup?.name || `Appraisal #${item.Id}`,
          startDate: createdOn.toLocaleDateString(),
          endDate: endDate.toLocaleDateString(),
          status,
          employeeCount: item.progress?.totalEmployees || 0,
          completionPercentage: item.progress?.percentage || 0,
          overdueCount,
        };
      });
    },
  });

  const { data: groupProgress = [], isLoading: progressLoading } = useQuery<
    GroupProgress[]
  >({
    queryKey: ["/api/dashboard/hr-manager/group-progress"],
  });

  const { data: upcomingDeadlines = [], isLoading: deadlinesLoading } =
    useQuery<UpcomingDeadline[]>({
      queryKey: ["/api/dashboard/hr-manager/deadlines"],
    });

  // Fetch scheduled meetings
  const { data: meetings = [], isLoading: meetingsLoading } = useQuery<
    MeetingData[]
  >({
    queryKey: ["/api/hr-manager/scheduled-meetings"],
  });

  // Calculate meeting statistics
  const completedMeetings = meetings.filter((m) => m.meetingCompletedAt).length;
  const scheduledMeetings = meetings.filter(
    (m) => m.meetingScheduledAt && !m.meetingCompletedAt,
  );

  // Helper to clean names with trailing "null"
  const cleanName = (name: string | null | undefined): string => {
    if (!name) return "";
    return name.replace(/\s+null$/i, "").trim();
  };

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
    <div className="space-y-6" data-testid="hr-manager-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">HR Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage performance evaluation cycles
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/initiate-appraisal">
              <Play className="h-4 w-4 mr-2" />
              Initiate Appraisal
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/review-appraisal">
              <Search className="h-4 w-4 mr-2" />
              Review Progress
            </Link>
          </Button>
        </div>
      </div>

      {/* Key HR Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="active-cycles-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Cycles
                </p>
                <p className="text-2xl font-bold">
                  {metrics?.activeAppraisalCycles || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-blue-600">
                {metrics?.totalEmployeesInCycle || 0} employees
              </span>
              <span className="text-xs text-muted-foreground">
                in evaluation
              </span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="completion-rate-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completion Rate
                </p>
                <p className="text-2xl font-bold">
                  {metrics?.completionRate || 0}%
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={metrics?.completionRate || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="pending-evaluations-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Reviews
                </p>
                <p className="text-2xl font-bold">
                  {metrics?.pendingEvaluations || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-yellow-600">
                {metrics?.managerReviewsPending || 0} manager reviews
              </span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="completed-meetings-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completed Meetings
                </p>
                <p className="text-2xl font-bold">{completedMeetings}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-xs text-green-600">
                {scheduledMeetings.length} meetings scheduled
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appraisal Cycles and Group Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Appraisal Cycles</CardTitle>
              <CardDescription>
                Current evaluation periods and progress
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/review-appraisal">Manage</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {cyclesLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg"></div>
                ))}
              </div>
            ) : cycles.length > 0 ? (
              cycles.slice(0, 4).map((cycle) => (
                <div
                  key={cycle.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-xs font-medium text-primary-foreground">
                      {(cycle.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{cycle.name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">
                        {cycle.employeeCount || 0} employees •{" "}
                        {cycle.overdueCount > 0 && (
                          <span className="text-red-600">
                            {cycle.overdueCount} overdue
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 min-w-[100px]">
                    <Badge
                      variant={
                        cycle.status === "active"
                          ? "default"
                          : cycle.status === "completed"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {cycle.status}
                    </Badge>
                    <div className="flex items-center gap-2 w-full justify-end">
                      <span className="text-sm font-medium min-w-[32px] text-right">
                        {cycle.completionPercentage}%
                      </span>
                      <Progress
                        value={cycle.completionPercentage}
                        className="w-16 h-2"
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No active cycles
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Group Progress</CardTitle>
              <CardDescription>
                Evaluation progress by appraisal groups
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/appraisal-groups">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {progressLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg"></div>
                ))}
              </div>
            ) : groupProgress.length > 0 ? (
              groupProgress.slice(0, 4).map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-xs font-medium text-accent-foreground">
                      {(group.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{group.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {group.employeeCount} employees • Due {group.deadline}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{group.overallProgress}%</p>
                    <div className="text-xs text-muted-foreground mt-1">
                      Self: {group.selfCompleted} • Manager:{" "}
                      {group.managerCompleted}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No groups configured
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Meetings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Scheduled Meetings</CardTitle>
            <CardDescription>
              Upcoming performance review meetings
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/hr-meetings">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {meetingsLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded-lg"></div>
              ))}
            </div>
          ) : scheduledMeetings.length > 0 ? (
            <div className="space-y-3">
              {scheduledMeetings.slice(0, 3).map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {meeting.employee
                          ? cleanName(
                              `${meeting.employee.firstName} ${meeting.employee.lastName || ""}`,
                            )
                          : "Unknown Employee"}{" "}
                        &amp;{" "}
                        {meeting.manager
                          ? cleanName(
                              `${meeting.manager.firstName} ${meeting.manager.lastName || ""}`,
                            )
                          : "Unknown Manager"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {meeting.meetingScheduledAt &&
                          format(
                            new Date(meeting.meetingScheduledAt),
                            "PPP 'at' p",
                          )}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    <CalendarCheck className="h-3 w-3 mr-1" />
                    Scheduled
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No scheduled meetings
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common HR management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button asChild data-testid="initiate-appraisal-button">
              <Link href="/initiate-appraisal">
                <Play className="h-4 w-4 mr-2" />
                Initiate Appraisal
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              data-testid="review-progress-button"
            >
              <Link href="/review-appraisal">
                <Search className="h-4 w-4 mr-2" />
                Review Progress
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/appraisal-groups">
                <Users className="h-4 w-4 mr-2" />
                Appraisal Groups
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/appraisal-cycles">
                <Clock className="h-4 w-4 mr-2" />
                Manage Cycles
              </Link>
            </Button>
            {/* <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Send Reminders
            </Button> */}
            {/* <Button variant="outline">
              <Target className="h-4 w-4 mr-2" />
              Performance Reports
            </Button> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
