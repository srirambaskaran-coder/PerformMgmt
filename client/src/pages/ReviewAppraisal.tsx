import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Filter, Mail, ChevronDown, ChevronRight, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReviewAppraisal() {
  const [filters, setFilters] = useState({
    appraisalGroup: "",
    employee: "",
    location: "",
    department: "",
    level: "",
    grade: "",
    manager: "",
  });

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Fetch initiated appraisals
  const { data: appraisals, isLoading } = useQuery({
    queryKey: ["/api/initiated-appraisals"],
  });

  // Fetch filter options
  const { data: appraisalGroups } = useQuery({
    queryKey: ["/api/appraisal-groups"],
  });

  const { data: locations } = useQuery({
    queryKey: ["/api/locations"],
  });

  const { data: departments } = useQuery({
    queryKey: ["/api/departments"],
  });

  const { data: levels } = useQuery({
    queryKey: ["/api/levels"],
  });

  const { data: grades } = useQuery({
    queryKey: ["/api/grades"],
  });

  const { data: managers } = useQuery({
    queryKey: ["/api/users", { role: "manager" }],
  });

  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const sendReminder = (employeeId: string) => {
    // TODO: Implement send reminder functionality
    console.log("Sending reminder to employee:", employeeId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6" data-testid="review-appraisal-page">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Review Appraisal</h1>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6" data-testid="review-appraisal-page">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" data-testid="page-title">Review Appraisal</h1>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm text-muted-foreground">Filter Options</span>
        </div>
      </div>

      {/* Filters Section */}
      <Card data-testid="filters-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appraisal-group" data-testid="label-appraisal-group">Appraisal Group</Label>
              <Select
                value={filters.appraisalGroup}
                onValueChange={(value) => setFilters({ ...filters, appraisalGroup: value })}
              >
                <SelectTrigger id="appraisal-group" data-testid="select-appraisal-group">
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Groups</SelectItem>
                  {(appraisalGroups || [])?.map((group: any) => (
                    <SelectItem key={group.id} value={group.id} data-testid={`group-option-${group.id}`}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee-search" data-testid="label-employee-search">Employee</Label>
              <Input
                id="employee-search"
                placeholder="Search by employee name"
                value={filters.employee}
                onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
                data-testid="input-employee-search"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location-filter" data-testid="label-location">Location</Label>
              <Select
                value={filters.location}
                onValueChange={(value) => setFilters({ ...filters, location: value })}
              >
                <SelectTrigger id="location-filter" data-testid="select-location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Locations</SelectItem>
                  {(locations || [])?.map((location: any) => (
                    <SelectItem key={location.id} value={location.id} data-testid={`location-option-${location.id}`}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department-filter" data-testid="label-department">Department</Label>
              <Select
                value={filters.department}
                onValueChange={(value) => setFilters({ ...filters, department: value })}
              >
                <SelectTrigger id="department-filter" data-testid="select-department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Departments</SelectItem>
                  {(departments || [])?.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id} data-testid={`department-option-${dept.id}`}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level-filter" data-testid="label-level">Level</Label>
              <Select
                value={filters.level}
                onValueChange={(value) => setFilters({ ...filters, level: value })}
              >
                <SelectTrigger id="level-filter" data-testid="select-level">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Levels</SelectItem>
                  {(levels || [])?.map((level: any) => (
                    <SelectItem key={level.id} value={level.id} data-testid={`level-option-${level.id}`}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade-filter" data-testid="label-grade">Grade</Label>
              <Select
                value={filters.grade}
                onValueChange={(value) => setFilters({ ...filters, grade: value })}
              >
                <SelectTrigger id="grade-filter" data-testid="select-grade">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Grades</SelectItem>
                  {(grades || [])?.map((grade: any) => (
                    <SelectItem key={grade.id} value={grade.id} data-testid={`grade-option-${grade.id}`}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager-filter" data-testid="label-manager">Manager</Label>
              <Select
                value={filters.manager}
                onValueChange={(value) => setFilters({ ...filters, manager: value })}
              >
                <SelectTrigger id="manager-filter" data-testid="select-manager">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Managers</SelectItem>
                  {(managers || [])?.map((manager: any) => (
                    <SelectItem key={manager.id} value={manager.id} data-testid={`manager-option-${manager.id}`}>
                      {manager.firstName} {manager.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFilters({
                  appraisalGroup: "",
                  employee: "",
                  location: "",
                  department: "",
                  level: "",
                  grade: "",
                  manager: "",
                })}
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appraisal Progress Summary */}
      <Card data-testid="progress-summary-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Appraisal Progress Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!appraisals || (appraisals as any[])?.length === 0 ? (
            <div className="text-center py-8" data-testid="no-appraisals-message">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Appraisals Found</h3>
              <p className="text-muted-foreground">
                No initiated appraisals match your current filters. Try adjusting your filter criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(appraisals as any[] || [])?.map((appraisal: any) => (
                <Card key={appraisal.id} className="border-l-4 border-l-primary" data-testid={`appraisal-card-${appraisal.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleGroupExpansion(appraisal.id)}
                          data-testid={`expand-button-${appraisal.id}`}
                        >
                          {expandedGroups.has(appraisal.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <div>
                          <h4 className="font-semibold" data-testid={`appraisal-title-${appraisal.id}`}>
                            {appraisal.appraisalGroup?.name || "Unknown Group"}
                          </h4>
                          <p className="text-sm text-muted-foreground" data-testid={`appraisal-type-${appraisal.id}`}>
                            {appraisal.appraisalType} • Status: {appraisal.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Progress</div>
                          <div className="font-semibold" data-testid={`progress-text-${appraisal.id}`}>
                            0/0 (0%)
                          </div>
                        </div>
                        <Progress value={0} className="w-32" data-testid={`progress-bar-${appraisal.id}`} />
                        <Badge variant="outline" data-testid={`status-badge-${appraisal.id}`}>
                          {appraisal.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedGroups.has(appraisal.id) && (
                      <div className="mt-4 pt-4 border-t border-border" data-testid={`expanded-content-${appraisal.id}`}>
                        <div className="mb-4">
                          <h5 className="font-semibold mb-2">Employee Progress</h5>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Manager</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {/* Placeholder - will be populated with actual employee data */}
                              <TableRow data-testid={`employee-row-placeholder-${appraisal.id}`}>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                  No employee progress data available
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}