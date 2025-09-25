import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  ClipboardCheck,
  Calendar,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Video,
  Star
} from "lucide-react";
import { Link } from "wouter";

interface ManagerMetrics {
  directReports: number;
  pendingReviews: number;
  completedReviews: number;
  scheduledMeetings: number;
  overdueReviews: number;
  teamAverageRating: number;
  meetingsCompleted: number;
  teamCompletionRate: number;
}

interface DirectReport {
  id: string;
  name: string;
  position: string;
  selfEvaluationStatus: 'completed' | 'pending' | 'overdue';
  managerReviewStatus: 'completed' | 'pending' | 'not_started';
  meetingStatus: 'completed' | 'scheduled' | 'not_scheduled';
  dueDate: string;
  rating?: number;
}

interface UpcomingMeeting {
  id: string;
  employeeName: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  type: 'performance_review' | 'one_on_one' | 'feedback';
  status: 'scheduled' | 'confirmed';
}

interface TeamMetric {
  metric: string;
  current: number;
  previous: number;
  trend: 'up' | 'down' | 'stable';
  unit: 'percentage' | 'number' | 'rating';
}

export default function ManagerDashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<ManagerMetrics>({
    queryKey: ["/api/dashboard/manager/metrics"],
  });

  const { data: directReports = [], isLoading: reportsLoading } = useQuery<DirectReport[]>({
    queryKey: ["/api/dashboard/manager/direct-reports"],
  });

  const { data: upcomingMeetings = [], isLoading: meetingsLoading } = useQuery<UpcomingMeeting[]>({
    queryKey: ["/api/dashboard/manager/meetings"],
  });

  const { data: teamMetrics = [], isLoading: teamMetricsLoading } = useQuery<TeamMetric[]>({
    queryKey: ["/api/dashboard/manager/team-metrics"],
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
    <div className="space-y-6" data-testid="manager-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">Monitor your team's performance and evaluation progress</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/manager-submissions">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Review Submissions
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/meetings">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Manager Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="direct-reports-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Direct Reports</p>
                <p className="text-2xl font-bold">{metrics?.directReports || 0}</p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-green-600">{metrics?.teamCompletionRate || 0}%</span>
              <span className="text-xs text-muted-foreground">evaluation completion</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="pending-reviews-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Reviews</p>
                <p className="text-2xl font-bold">{metrics?.pendingReviews || 0}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4">
              {metrics?.overdueReviews ? (
                <span className="text-xs text-red-600">{metrics.overdueReviews} overdue</span>
              ) : (
                <span className="text-xs text-green-600">All on track</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="scheduled-meetings-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Scheduled Meetings</p>
                <p className="text-2xl font-bold">{metrics?.scheduledMeetings || 0}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-blue-600">{metrics?.meetingsCompleted || 0} completed</span>
              <span className="text-xs text-muted-foreground">this cycle</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="team-rating-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Avg Rating</p>
                <p className="text-2xl font-bold">{metrics?.teamAverageRating?.toFixed(1) || '0.0'}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Star className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`h-3 w-3 ${star <= (metrics?.teamAverageRating || 0) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Status and Upcoming Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Team Evaluation Status</CardTitle>
              <CardDescription>Direct reports and their evaluation progress</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/manager-submissions">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {reportsLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg"></div>
                ))}
              </div>
            ) : directReports.length > 0 ? (
              directReports.slice(0, 6).map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-xs font-medium text-primary-foreground">
                      {report.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-sm text-muted-foreground">{report.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right text-xs">
                      <div className="flex items-center gap-1 mb-1">
                        <div className={`w-2 h-2 rounded-full ${
                          report.selfEvaluationStatus === 'completed' ? 'bg-green-500' :
                          report.selfEvaluationStatus === 'overdue' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></div>
                        <span>Self</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          report.managerReviewStatus === 'completed' ? 'bg-green-500' :
                          report.managerReviewStatus === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'
                        }`}></div>
                        <span>Manager</span>
                      </div>
                    </div>
                    <Badge variant={
                      report.managerReviewStatus === 'pending' ? 'default' :
                      report.managerReviewStatus === 'completed' ? 'secondary' : 'outline'
                    }>
                      {report.managerReviewStatus === 'pending' ? 'Review' :
                       report.managerReviewStatus === 'completed' ? 'Complete' : 'Not Started'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No direct reports</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Meetings</CardTitle>
              <CardDescription>Scheduled one-on-ones and reviews</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/meetings">Schedule New</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {meetingsLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg"></div>
                ))}
              </div>
            ) : upcomingMeetings.length > 0 ? (
              upcomingMeetings.slice(0, 5).map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {meeting.type === 'performance_review' ? (
                        <ClipboardCheck className="h-4 w-4 text-blue-600" />
                      ) : meeting.location.includes('Video') ? (
                        <Video className="h-4 w-4 text-blue-600" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{meeting.employeeName}</p>
                      <p className="text-sm text-muted-foreground">
                        {meeting.date} at {meeting.time} • {meeting.duration}min
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={meeting.status === 'confirmed' ? 'default' : 'outline'}>
                      {meeting.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{meeting.location}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No upcoming meetings</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance Trends</CardTitle>
          <CardDescription>Key metrics and trends for your team</CardDescription>
        </CardHeader>
        <CardContent>
          {teamMetricsLoading ? (
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded-lg"></div>
                ))}
              </div>
            </div>
          ) : teamMetrics.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {teamMetrics.map((metric, index) => (
                <div key={index} className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">{metric.metric}</p>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      metric.trend === 'up' ? 'bg-green-100' :
                      metric.trend === 'down' ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      <TrendingUp className={`h-3 w-3 ${
                        metric.trend === 'up' ? 'text-green-600' :
                        metric.trend === 'down' ? 'text-red-600 rotate-180' : 'text-gray-600'
                      }`} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold">
                    {metric.current}
                    {metric.unit === 'percentage' && '%'}
                    {metric.unit === 'rating' && '/5'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    vs {metric.previous}{metric.unit === 'percentage' && '%'} last period
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No performance data available</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button asChild data-testid="review-submissions-button">
              <Link href="/manager-submissions">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Review Submissions
              </Link>
            </Button>
            <Button variant="outline" asChild data-testid="schedule-meetings-button">
              <Link href="/meetings">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meetings
              </Link>
            </Button>
            <Button variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Feedback
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Team Report
            </Button>
            <Button variant="outline">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Bulk Actions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}