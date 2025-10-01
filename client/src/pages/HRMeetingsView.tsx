import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RoleGuard } from "@/components/RoleGuard";
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle,
  CalendarCheck,
  Building2,
  Search,
  X
} from "lucide-react";
import { format } from "date-fns";

interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  designation: string;
}

interface MeetingData {
  id: string;
  employeeId: string;
  managerId: string;
  meetingScheduledAt: string | null;
  meetingCompletedAt: string | null;
  meetingNotes: string | null;
  employee: Employee | null;
  manager: Manager | null;
}

export default function HRMeetingsView() {
  const { data: meetings = [], isLoading } = useQuery<MeetingData[]>({
    queryKey: ["/api/hr-manager/scheduled-meetings"],
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Get unique departments from meetings
  const departments = useMemo(() => {
    const depts = new Set<string>();
    meetings.forEach((meeting) => {
      if (meeting.employee?.department) depts.add(meeting.employee.department);
      if (meeting.manager?.department) depts.add(meeting.manager.department);
    });
    return Array.from(depts).sort();
  }, [meetings]);

  // Filter meetings
  const filteredMeetings = useMemo(() => {
    return meetings.filter((meeting) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const employeeName = meeting.employee
          ? `${meeting.employee.firstName} ${meeting.employee.lastName}`.toLowerCase()
          : "";
        const managerName = meeting.manager
          ? `${meeting.manager.firstName} ${meeting.manager.lastName}`.toLowerCase()
          : "";
        
        if (!employeeName.includes(query) && !managerName.includes(query)) {
          return false;
        }
      }

      // Department filter
      if (departmentFilter !== "all") {
        const employeeDept = meeting.employee?.department || "";
        const managerDept = meeting.manager?.department || "";
        if (employeeDept !== departmentFilter && managerDept !== departmentFilter) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "completed" && !meeting.meetingCompletedAt) {
          return false;
        }
        if (statusFilter === "scheduled" && (!meeting.meetingScheduledAt || meeting.meetingCompletedAt)) {
          return false;
        }
      }

      // Date range filter
      if (dateFrom || dateTo) {
        const meetingDate = meeting.meetingScheduledAt ? new Date(meeting.meetingScheduledAt) : null;
        if (!meetingDate) return false;
        
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (meetingDate < fromDate) return false;
        }
        
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (meetingDate > toDate) return false;
        }
      }

      return true;
    });
  }, [meetings, searchQuery, departmentFilter, statusFilter, dateFrom, dateTo]);

  // Statistics based on filtered data
  const totalMeetings = filteredMeetings.length;
  const scheduledMeetings = filteredMeetings.filter(
    (m) => m.meetingScheduledAt && !m.meetingCompletedAt
  ).length;
  const completedMeetings = filteredMeetings.filter((m) => m.meetingCompletedAt).length;

  const clearFilters = () => {
    setSearchQuery("");
    setDepartmentFilter("all");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters = searchQuery || departmentFilter !== "all" || statusFilter !== "all" || dateFrom || dateTo;

  const getMeetingStatusBadge = (meeting: MeetingData) => {
    if (meeting.meetingCompletedAt) {
      return (
        <Badge variant="default" data-testid={`badge-completed-${meeting.id}`}>
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    }
    if (meeting.meetingScheduledAt) {
      return (
        <Badge variant="secondary" data-testid={`badge-scheduled-${meeting.id}`}>
          <CalendarCheck className="h-3 w-3 mr-1" />
          Scheduled
        </Badge>
      );
    }
    return null;
  };

  return (
    <RoleGuard allowedRoles={["hr_manager"]}>
      <div className="space-y-6" data-testid="hr-meetings-view">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Scheduled Meetings Overview</h1>
            <p className="text-muted-foreground">
              View all scheduled performance review meetings across the organization
            </p>
          </div>
        </div>

        {/* Meeting Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Meetings</p>
                  <p className="text-2xl font-bold" data-testid="total-meetings">
                    {totalMeetings}
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
                  <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                  <p className="text-2xl font-bold" data-testid="scheduled-meetings">
                    {scheduledMeetings}
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
                  <p className="text-2xl font-bold" data-testid="completed-meetings">
                    {completedMeetings}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by employee or manager name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-meetings"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger data-testid="select-department-filter">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger data-testid="select-status-filter">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">From Date</label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      data-testid="input-date-from"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">To Date</label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      data-testid="input-date-to"
                    />
                  </div>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors border rounded-md hover:bg-muted/50"
                    data-testid="button-clear-filters"
                  >
                    <X className="h-4 w-4" />
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meetings List */}
        <Card>
          <CardHeader>
            <CardTitle>All Scheduled Meetings</CardTitle>
            <CardDescription>
              Performance review meetings scheduled between employees and managers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 animate-pulse">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredMeetings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg mb-2">
                  {meetings.length === 0 ? "No meetings scheduled yet" : "No meetings match your filters"}
                </p>
                <p className="text-muted-foreground text-sm">
                  {meetings.length === 0 
                    ? "Meetings will appear here once employees and managers schedule them"
                    : "Try adjusting your filters to see more results"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/20 transition-colors"
                    data-testid={`meeting-row-${meeting.id}`}
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-medium" data-testid={`meeting-participants-${meeting.id}`}>
                            {meeting.employee
                              ? `${meeting.employee.firstName} ${meeting.employee.lastName}`
                              : "Unknown Employee"}{" "}
                            &amp;{" "}
                            {meeting.manager
                              ? `${meeting.manager.firstName} ${meeting.manager.lastName}`
                              : "Unknown Manager"}
                          </p>
                          {getMeetingStatusBadge(meeting)}
                        </div>

                        <div className="space-y-1 text-sm text-muted-foreground">
                          {meeting.employee && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span data-testid={`employee-info-${meeting.id}`}>
                                {meeting.employee.designation} - {meeting.employee.department}
                              </span>
                            </div>
                          )}
                          {meeting.manager && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              <span data-testid={`manager-info-${meeting.id}`}>
                                Manager: {meeting.manager.email}
                              </span>
                            </div>
                          )}
                          {meeting.meetingScheduledAt && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span data-testid={`meeting-time-${meeting.id}`}>
                                {format(new Date(meeting.meetingScheduledAt), "PPP 'at' p")}
                              </span>
                            </div>
                          )}
                          {meeting.meetingCompletedAt && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              <span data-testid={`meeting-completed-time-${meeting.id}`}>
                                Completed on {format(new Date(meeting.meetingCompletedAt), "PPP")}
                              </span>
                            </div>
                          )}
                        </div>

                        {meeting.meetingCompletedAt && meeting.meetingNotes && (
                          <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                            <p className="text-sm font-medium mb-1">Meeting Notes:</p>
                            <p className="text-sm text-muted-foreground" data-testid={`meeting-notes-${meeting.id}`}>
                              {meeting.meetingNotes}
                            </p>
                          </div>
                        )}
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
