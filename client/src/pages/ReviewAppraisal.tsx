import { useState, useMemo } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Filter,
  Mail,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Users,
  LayoutGrid,
  LayoutList,
  Download,
  FileDown,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import * as XLSX from "xlsx";

export default function ReviewAppraisal() {
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  const [filters, setFilters] = useState({
    appraisalGroup: "all",
    appraisalCycle: "all",
    frequencyCalendar: "all",
    frequencyCalendarDetails: "all",
    employee: "",
    location: "all",
    department: "all",
    manager: "all",
  });

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Pagination state for table view
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting state for table view
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Fetch initiated appraisals
  const { data: appraisals, isLoading } = useQuery({
    queryKey: ["/api/initiated-appraisals"],
    select: (data: any[]) => {
      return data.map((appraisal: any) => ({
        id: appraisal.Id,
        appraisalGroupId: appraisal.AppraisalGroupId,
        appraisalGroup: appraisal.AppraisalGroup
          ? {
              id: appraisal.AppraisalGroup.id,
              name: appraisal.AppraisalGroup.name,
              description: appraisal.AppraisalGroup.description,
            }
          : null,
        appraisalType: appraisal.AppraisalType,
        questionnaireTemplateId: appraisal.QuestionnaireTemplateId,
        questionnaireTemplateIds: appraisal.QuestionnaireTemplateIds,
        frequencyCalendarId: appraisal.FrequencyCalendarId,
        daysToClose: appraisal.DaysToClose,
        daysToInitiate: appraisal.DaysToInitiate,
        noOfReminders: appraisal.NoOfReminders,
        status: appraisal.Status,
        createdAt: appraisal.CreatedOn,
        createdBy: appraisal.CreatedBy,
        progress: appraisal.progress
          ? {
              totalEmployees: appraisal.progress.totalEmployees,
              completedEvaluations: appraisal.progress.completedEvaluations,
              percentage: appraisal.progress.percentage,
              employeeProgress: (appraisal.progress.employeeProgress || []).map(
                (ep: any) => ({
                  employee: {
                    id: ep.employee?.Id || ep.employee?.id,
                    firstName: ep.employee?.FirstName || ep.employee?.firstName,
                    lastName: ep.employee?.LastName || ep.employee?.lastName,
                    designation:
                      ep.employee?.Designation || ep.employee?.designation,
                    department:
                      ep.employee?.Department || ep.employee?.department,
                    departmentId:
                      ep.employee?.DepartmentId || ep.employee?.departmentId,
                    locationId:
                      ep.employee?.LocationId || ep.employee?.locationId,
                    levelId: ep.employee?.LevelId || ep.employee?.levelId,
                    gradeId: ep.employee?.GradeId || ep.employee?.gradeId,
                    reportingManagerId:
                      ep.employee?.ReportingManagerId ||
                      ep.employee?.reportingManagerId,
                  },
                  status: ep.status,
                  isCompleted: ep.isCompleted,
                  evaluation: ep.evaluation
                    ? {
                        id: ep.evaluation.Id || ep.evaluation.id,
                        employeeId:
                          ep.evaluation.EmployeeId || ep.evaluation.employeeId,
                        managerId:
                          ep.evaluation.ManagerId || ep.evaluation.managerId,
                        reviewCycleId:
                          ep.evaluation.ReviewCycleId ||
                          ep.evaluation.reviewCycleId,
                        initiatedAppraisalId:
                          ep.evaluation.InitiatedAppraisalId ||
                          ep.evaluation.initiatedAppraisalId,
                        selfEvaluationData:
                          ep.evaluation.SelfEvaluationData ||
                          ep.evaluation.selfEvaluationData,
                        selfEvaluationSubmittedAt:
                          ep.evaluation.SelfEvaluationSubmittedAt ||
                          ep.evaluation.selfEvaluationSubmittedAt,
                        managerEvaluationData:
                          ep.evaluation.ManagerEvaluationData ||
                          ep.evaluation.managerEvaluationData,
                        managerEvaluationSubmittedAt:
                          ep.evaluation.ManagerEvaluationSubmittedAt ||
                          ep.evaluation.managerEvaluationSubmittedAt,
                        overallRating:
                          ep.evaluation.OverallRating ||
                          ep.evaluation.overallRating,
                        meetingScheduledAt:
                          ep.evaluation.MeetingScheduledAt ||
                          ep.evaluation.meetingScheduledAt,
                        meetingNotes:
                          ep.evaluation.MeetingNotes ||
                          ep.evaluation.meetingNotes,
                        meetingCompletedAt:
                          ep.evaluation.MeetingCompletedAt ||
                          ep.evaluation.meetingCompletedAt,
                        finalizedAt:
                          ep.evaluation.FinalizedAt ||
                          ep.evaluation.finalizedAt,
                        status: ep.evaluation.Status || ep.evaluation.status,
                        calibratedRating:
                          ep.evaluation.CalibratedRating ||
                          ep.evaluation.calibratedRating,
                        calibrationRemarks:
                          ep.evaluation.CalibrationRemarks ||
                          ep.evaluation.calibrationRemarks,
                        calibratedBy:
                          ep.evaluation.CalibratedBy ||
                          ep.evaluation.calibratedBy,
                        calibratedAt:
                          ep.evaluation.CalibratedAt ||
                          ep.evaluation.calibratedAt,
                        manager:
                          ep.evaluation.manager || ep.evaluation.Manager
                            ? {
                                id:
                                  ep.evaluation.manager?.id ||
                                  ep.evaluation.Manager?.Id ||
                                  ep.evaluation.manager?.Id ||
                                  ep.evaluation.Manager?.id,
                                firstName:
                                  ep.evaluation.manager?.firstName ||
                                  ep.evaluation.Manager?.FirstName ||
                                  ep.evaluation.manager?.FirstName ||
                                  ep.evaluation.Manager?.firstName,
                                lastName:
                                  ep.evaluation.manager?.lastName ||
                                  ep.evaluation.Manager?.LastName ||
                                  ep.evaluation.manager?.LastName ||
                                  ep.evaluation.Manager?.lastName,
                                email:
                                  ep.evaluation.manager?.email ||
                                  ep.evaluation.Manager?.Email ||
                                  ep.evaluation.manager?.Email ||
                                  ep.evaluation.Manager?.email,
                              }
                            : null,
                      }
                    : null,
                }),
              ),
            }
          : {
              totalEmployees: 0,
              completedEvaluations: 0,
              percentage: 0,
              employeeProgress: [],
            },
      }));
    },
  });

  // Fetch filter options
  const { data: appraisalGroups } = useQuery({
    queryKey: ["/api/appraisal-groups"],
    select: (data: any[]) => {
      return data
        .filter((group: any) => group.Status === true)
        .map((group: any) => ({
          id: group.Id,
          name: group.Name,
          description: group.Description,
        }));
    },
  });

  const { data: appraisalCycles } = useQuery({
    queryKey: ["/api/appraisal-cycles"],
    select: (data: any[]) => {
      return data
        .filter((cycle: any) => cycle.Status === true)
        .map((cycle: any) => ({
          id: cycle.Id,
          code: cycle.Code,
          description: cycle.Description,
        }));
    },
  });

  const { data: locations } = useQuery({
    queryKey: ["/api/locations"],
    select: (data: any[]) => {
      return data
        .filter((location: any) => location.Status === 1)
        .map((location: any) => ({
          id: location.Id,
          name: location.LocationName,
          code: location.Code,
        }));
    },
  });

  const { data: departments } = useQuery({
    queryKey: ["/api/departments"],
    select: (data: any[]) => {
      return data
        .filter((dept: any) => dept.Status === true)
        .map((dept: any) => ({
          id: dept.Id,
          code: dept.Code,
          description: dept.Description,
        }));
    },
  });

  const { data: levels } = useQuery({
    queryKey: ["/api/levels"],
    select: (data: any[]) => {
      return data.map((level: any) => ({
        id: level.Id,
        code: level.Code,
        description: level.Description,
      }));
    },
  });

  const { data: grades } = useQuery({
    queryKey: ["/api/grades"],
    select: (data: any[]) => {
      return data.map((grade: any) => ({
        id: grade.Id,
        code: grade.Code,
        description: grade.Description,
      }));
    },
  });

  // Fetch users for manager filter - get all users and filter those with manager/reporting relationships
  const { data: allUsers } = useQuery({
    queryKey: ["/api/users"],
    select: (data: any[]) => {
      return data.map((user: any) => ({
        id: user.Id,
        firstName: user.FirstName,
        lastName: user.LastName,
        email: user.Email,
        reportingManagerId: user.ReportingManagerId,
      }));
    },
  });

  // Extract unique managers from appraisals evaluation data
  const managers = useMemo(() => {
    if (!appraisals) return [];
    const managerMap = new Map<
      string,
      { id: string; firstName: string; lastName: string }
    >();

    (appraisals as any[]).forEach((appraisal: any) => {
      const employeeProgress = appraisal.progress?.employeeProgress || [];
      employeeProgress.forEach((ep: any) => {
        const manager = ep.evaluation?.manager;
        if (manager && manager.id) {
          managerMap.set(manager.id, {
            id: manager.id,
            firstName: manager.firstName || "",
            lastName: manager.lastName || "",
          });
        }
      });
    });

    return Array.from(managerMap.values());
  }, [appraisals]);

  // Extract unique departments from appraisals employee progress data
  const employeeDepartments = useMemo(() => {
    if (!appraisals) return [];
    const deptSet = new Set<string>();

    (appraisals as any[]).forEach((appraisal: any) => {
      const employeeProgress = appraisal.progress?.employeeProgress || [];
      employeeProgress.forEach((ep: any) => {
        const dept = ep.employee?.department;
        if (dept && dept !== "N/A") {
          deptSet.add(dept);
        }
      });
    });

    return Array.from(deptSet).sort();
  }, [appraisals]);

  // Fetch frequency calendars
  const { data: frequencyCalendars } = useQuery({
    queryKey: ["/api/frequency-calendars"],
    select: (data: any[]) => {
      return data
        .filter((calendar: any) => calendar.Status === true)
        .map((calendar: any) => ({
          id: calendar.Id,
          code: calendar.Code,
          description: calendar.Description,
          appraisalCycleId: calendar.AppraisalCycleId,
        }));
    },
  });

  // Fetch frequency calendar details
  const { data: frequencyCalendarDetails } = useQuery({
    queryKey: ["/api/frequency-calendar-details"],
    select: (data: any[]) => {
      return data.map((detail: any) => ({
        id: detail.Id,
        frequencyCalendarId: detail.FrequencyCalendarId,
        displayName: detail.DisplayName,
      }));
    },
  });

  // Send reminder mutation
  const sendReminderMutation = useMutation({
    mutationFn: async ({
      employeeId,
      initiatedAppraisalId,
    }: {
      employeeId: string;
      initiatedAppraisalId: string;
    }) => {
      const response = await apiRequest("POST", "/api/send-reminder", {
        employeeId,
        initiatedAppraisalId,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "An error occurred" }));
        throw new Error(errorData.message || "Failed to send reminder");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reminder Sent",
        description: `Reminder email sent to ${data.employeeName} (${data.employeeEmail})`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Send Reminder",
        description:
          error.message || "An error occurred while sending the reminder",
        variant: "destructive",
      });
    },
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

  // Helper function to format appraisal type
  const getAppraisalTypeLabel = (type: string | number) => {
    const typeMap: Record<string, string> = {
      "1": "Self Evaluation",
      "2": "Manager Evaluation",
      "3": "Self & Manager Evaluation",
      self: "Self Evaluation",
      manager: "Manager Evaluation",
      self_and_manager: "Self & Manager Evaluation",
    };
    return (
      typeMap[String(type)] ||
      String(type)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())
    );
  };

  // Helper function to format status
  const getStatusLabel = (status: boolean | string) => {
    if (typeof status === "boolean") {
      return status ? "Active" : "Inactive";
    }
    return String(status)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Helper function to get appraisal cycle name from frequency calendar ID
  const getAppraisalCycleName = (frequencyCalendarId: string | null) => {
    if (!frequencyCalendarId) return null;
    const appraisalCycleId =
      frequencyCalendarToCycleMap.get(frequencyCalendarId);
    if (!appraisalCycleId) return null;
    return appraisalCyclesMap.get(appraisalCycleId) || null;
  };

  const sendReminder = (employeeId: string, initiatedAppraisalId: string) => {
    sendReminderMutation.mutate({ employeeId, initiatedAppraisalId });
  };

  // Download evaluation mutation
  const downloadEvaluationMutation = useMutation({
    mutationFn: async ({
      evaluationId,
      format,
    }: {
      evaluationId: string;
      format: "pdf" | "docx";
    }) => {
      const response = await apiRequest("POST", "/api/evaluations/export", {
        evaluationId,
        format,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "An error occurred" }));
        throw new Error(errorData.message || "Failed to download evaluation");
      }

      return { response, format, evaluationId };
    },
    onSuccess: async (data) => {
      // Download the file
      const blob = await data.response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `evaluation-${data.evaluationId}.${data.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Successful",
        description: `Evaluation downloaded as ${data.format.toUpperCase()}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Download Failed",
        description:
          error.message || "An error occurred while downloading the evaluation",
        variant: "destructive",
      });
    },
  });

  const downloadEvaluation = (evaluationId: string, format: "pdf" | "docx") => {
    downloadEvaluationMutation.mutate({ evaluationId, format });
  };

  // Export to Excel function
  const exportToExcel = () => {
    try {
      // Prepare data for Excel export
      const excelData = filteredRows.map((row: any) => ({
        "Employee Name": row.employeeName,
        Location: row.locationName,
        Department: row.departmentName,
        Manager: row.managerName,
        "Appraisal Group": row.appraisalGroupName,
        "Appraisal Type": getAppraisalTypeLabel(row.appraisalType),
        "Frequency Calendar": row.frequencyCalendarName,
        Status: row.status
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l: string) => l.toUpperCase()),
        "Due Date": row.dueDate
          ? format(new Date(row.dueDate), "MMM dd, yyyy")
          : "N/A",
        "Member Rating":
          typeof row.memberRating === "number"
            ? row.memberRating.toFixed(1)
            : "N/A",
        "Final Manager Rating":
          typeof row.finalManagerRating === "number"
            ? row.finalManagerRating.toFixed(1)
            : "N/A",
        "Calibrated Rating":
          typeof row.calibratedRating === "number"
            ? row.calibratedRating.toFixed(1)
            : "N/A",
      }));

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Appraisal Progress");

      // Set column widths for better readability
      const columnWidths = [
        { wch: 25 }, // Employee Name
        { wch: 20 }, // Location
        { wch: 20 }, // Department
        { wch: 25 }, // Manager
        { wch: 25 }, // Appraisal Group
        { wch: 20 }, // Appraisal Type
        { wch: 25 }, // Frequency Calendar
        { wch: 15 }, // Status
        { wch: 15 }, // Due Date
        { wch: 18 }, // Member Rating
        { wch: 22 }, // Final Manager Rating
        { wch: 18 }, // Calibrated Rating
      ];
      worksheet["!cols"] = columnWidths;

      // Generate filename with timestamp
      const timestamp = format(new Date(), "yyyy-MM-dd_HHmmss");
      const filename = `Appraisal_Progress_${timestamp}.xlsx`;

      // Download the file
      XLSX.writeFile(workbook, filename);

      toast({
        title: "Export Successful",
        description: `Downloaded ${filteredRows.length} employee records to ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting to Excel",
        variant: "destructive",
      });
    }
  };

  // Create frequency calendar lookup map (for display names)
  const frequencyCalendarMap = useMemo(() => {
    if (!frequencyCalendars) return new Map();
    return new Map(
      (frequencyCalendars as any[]).map((cal) => [
        cal.id,
        `${cal.code} - ${cal.description}`,
      ]),
    );
  }, [frequencyCalendars]);

  // Create frequency calendar to appraisal cycle lookup map (for filtering)
  const frequencyCalendarToCycleMap = useMemo(() => {
    if (!frequencyCalendars) return new Map();
    return new Map(
      (frequencyCalendars as any[]).map((cal) => [
        cal.id,
        cal.appraisalCycleId,
      ]),
    );
  }, [frequencyCalendars]);

  // Create location lookup map
  const locationMap = useMemo(() => {
    if (!locations) return new Map();
    return new Map((locations as any[]).map((loc) => [loc.id, loc.name]));
  }, [locations]);

  // Create appraisal groups lookup map
  const appraisalGroupsMap = useMemo(() => {
    if (!appraisalGroups) return new Map();
    return new Map(
      (appraisalGroups as any[]).map((group) => [group.id, group.name]),
    );
  }, [appraisalGroups]);

  // Create appraisal cycles lookup map
  const appraisalCyclesMap = useMemo(() => {
    if (!appraisalCycles) return new Map();
    return new Map(
      (appraisalCycles as any[]).map((cycle) => [cycle.id, cycle.code]),
    );
  }, [appraisalCycles]);

  // Filter frequency calendar details based on selected frequency calendar
  const filteredFrequencyCalendarDetails = useMemo(() => {
    if (!frequencyCalendarDetails) return [];
    if (filters.frequencyCalendar === "all") {
      return frequencyCalendarDetails as any[];
    }
    return (frequencyCalendarDetails as any[]).filter(
      (detail: any) => detail.frequencyCalendarId === filters.frequencyCalendar,
    );
  }, [frequencyCalendarDetails, filters.frequencyCalendar]);

  // Flatten appraisals data into rows for table view
  const flattenedRows = useMemo(() => {
    if (!appraisals) return [];

    const rows: any[] = [];
    (appraisals as any[]).forEach((appraisal: any) => {
      const employeeProgress = appraisal.progress?.employeeProgress || [];

      employeeProgress.forEach((empProgress: any) => {
        // Calculate due date if available
        let dueDate = null;
        if (appraisal.createdAt && appraisal.daysToClose) {
          const createdDate = new Date(appraisal.createdAt);
          dueDate = new Date(
            createdDate.getTime() + appraisal.daysToClose * 24 * 60 * 60 * 1000,
          );
        }

        // Extract ratings from evaluation data
        // Parse selfEvaluationData if it's a string
        let memberRating = null;
        if (empProgress.evaluation?.selfEvaluationData) {
          try {
            const selfEvalData =
              typeof empProgress.evaluation.selfEvaluationData === "string"
                ? JSON.parse(empProgress.evaluation.selfEvaluationData)
                : empProgress.evaluation.selfEvaluationData;
            memberRating = selfEvalData?.averageRating ?? null;
          } catch (e) {
            memberRating = null;
          }
        }

        // Use overallRating for final manager rating
        const finalManagerRating =
          empProgress.evaluation?.overallRating ?? null;

        // Get calibrated rating separately
        const calibratedRating =
          empProgress.evaluation?.calibratedRating ?? null;

        // Get appraisal cycle ID from frequency calendar
        const appraisalCycleId = appraisal.frequencyCalendarId
          ? frequencyCalendarToCycleMap.get(appraisal.frequencyCalendarId) ||
            null
          : null;

        rows.push({
          employeeId: empProgress.employee.id,
          initiatedAppraisalId: appraisal.id,
          evaluationId: empProgress.evaluation?.id || null,
          employeeName:
            `${empProgress.employee.firstName || ""} ${empProgress.employee.lastName || ""}`.trim(),
          employeeFirstName: empProgress.employee.firstName,
          employeeLastName: empProgress.employee.lastName,
          departmentId: empProgress.employee.departmentId || null,
          departmentName: empProgress.employee.department || "N/A",
          locationId: empProgress.employee.locationId,
          locationName: empProgress.employee.locationId
            ? locationMap.get(empProgress.employee.locationId) || "N/A"
            : "N/A",
          levelId: empProgress.employee.levelId,
          gradeId: empProgress.employee.gradeId,
          managerId:
            empProgress.evaluation?.manager?.id ||
            empProgress.evaluation?.managerId ||
            null,
          managerName: empProgress.evaluation?.manager
            ? `${empProgress.evaluation.manager.firstName || ""} ${empProgress.evaluation.manager.lastName || ""}`.trim()
            : "N/A",
          appraisalGroupId: appraisal.appraisalGroupId,
          appraisalGroupName: appraisal.appraisalGroup?.name || "Unknown Group",
          appraisalType: appraisal.appraisalType,
          appraisalCycleId: appraisalCycleId,
          frequencyCalendarId: appraisal.frequencyCalendarId,
          frequencyCalendarName: appraisal.frequencyCalendarId
            ? frequencyCalendarMap.get(appraisal.frequencyCalendarId) || "N/A"
            : "N/A",
          status: empProgress.status,
          dueDate: dueDate,
          appraisalStatus: appraisal.status,
          memberRating: memberRating,
          finalManagerRating: finalManagerRating,
          calibratedRating: calibratedRating,
        });
      });
    });

    return rows;
  }, [
    appraisals,
    frequencyCalendarMap,
    frequencyCalendarToCycleMap,
    locationMap,
  ]);

  // Apply filters to flattened rows
  const filteredRows = useMemo(() => {
    return flattenedRows.filter((row) => {
      // Appraisal group filter
      if (
        filters.appraisalGroup !== "all" &&
        row.appraisalGroupId !== filters.appraisalGroup
      ) {
        return false;
      }

      // Appraisal cycle filter
      if (
        filters.appraisalCycle !== "all" &&
        row.appraisalCycleId !== filters.appraisalCycle
      ) {
        return false;
      }

      // Frequency calendar filter
      if (
        filters.frequencyCalendar !== "all" &&
        row.frequencyCalendarId !== filters.frequencyCalendar
      ) {
        return false;
      }

      // Frequency calendar details filter (placeholder for now)
      if (filters.frequencyCalendarDetails !== "all") {
        // This would filter by specific calendar detail/period if that data becomes available
        // For now, we'll keep this as a placeholder
      }

      // Employee name filter
      if (
        filters.employee &&
        !row.employeeName.toLowerCase().includes(filters.employee.toLowerCase())
      ) {
        return false;
      }

      // Location filter
      if (filters.location !== "all" && row.locationId !== filters.location) {
        return false;
      }

      // Department filter (match by department name from employee progress)
      if (
        filters.department !== "all" &&
        row.departmentName !== filters.department
      ) {
        return false;
      }

      // Manager filter
      if (filters.manager !== "all" && row.managerId !== filters.manager) {
        return false;
      }

      return true;
    });
  }, [flattenedRows, filters]);

  // Sorting for table view
  const sortedRows = useMemo(() => {
    if (!sortColumn) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      let aValue = a[sortColumn];
      let bValue = b[sortColumn];

      // Handle null/undefined values
      if (aValue == null) aValue = "";
      if (bValue == null) bValue = "";

      // Handle date sorting
      if (sortColumn === "dueDate") {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      // String comparison
      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue
          .toLowerCase()
          .localeCompare(bValue.toLowerCase());
        return sortDirection === "asc" ? comparison : -comparison;
      }

      // Number comparison
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortColumn, sortDirection]);

  // Pagination for table view
  const totalPages = Math.ceil(sortedRows.length / rowsPerPage);
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedRows.slice(startIndex, endIndex);
  }, [sortedRows, currentPage, rowsPerPage]);

  // Handle column sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Sort indicator component
  const SortIndicator = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4" />
    );
  };

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [filters]);

  // Filter appraisals for card view based on filtered rows
  const filteredAppraisals = useMemo(() => {
    if (!appraisals) return [];

    // Build a map for O(1) membership checks: appraisalId -> Set<employeeId>
    const filteredEmployeesByAppraisal = new Map<string, Set<string>>();
    filteredRows.forEach((row) => {
      if (!filteredEmployeesByAppraisal.has(row.initiatedAppraisalId)) {
        filteredEmployeesByAppraisal.set(row.initiatedAppraisalId, new Set());
      }
      filteredEmployeesByAppraisal
        .get(row.initiatedAppraisalId)!
        .add(row.employeeId);
    });

    return (appraisals as any[])
      .map((appraisal: any) => {
        // Check if appraisal matches appraisal group filter
        if (
          filters.appraisalGroup !== "all" &&
          appraisal.appraisalGroupId !== filters.appraisalGroup
        ) {
          return null;
        }

        // Check if appraisal matches frequency calendar filter
        if (
          filters.frequencyCalendar !== "all" &&
          appraisal.frequencyCalendarId !== filters.frequencyCalendar
        ) {
          return null;
        }

        // Check if appraisal matches appraisal cycle filter (via frequency calendar)
        if (filters.appraisalCycle !== "all") {
          const appraisalCycleId = appraisal.frequencyCalendarId
            ? frequencyCalendarToCycleMap.get(appraisal.frequencyCalendarId)
            : null;
          if (appraisalCycleId !== filters.appraisalCycle) {
            return null;
          }
        }

        // If there are employee rows, filter by them
        const employeeSet = filteredEmployeesByAppraisal.get(appraisal.id);

        // If there are employee-level filters applied and no matching employees, skip this appraisal
        const hasEmployeeLevelFilters =
          filters.employee !== "" ||
          filters.location !== "all" ||
          filters.department !== "all" ||
          filters.manager !== "all";

        // If employee-level filters are applied and this appraisal has no matching employees, exclude it
        if (hasEmployeeLevelFilters && !employeeSet) {
          return null;
        }

        // Filter the employee progress to only show matching employees
        const filteredEmployeeProgress = employeeSet
          ? (appraisal.progress?.employeeProgress || []).filter(
              (empProgress: any) => {
                return employeeSet.has(empProgress.employee.id);
              },
            )
          : appraisal.progress?.employeeProgress || [];

        // If filtered and no employees match, skip
        if (hasEmployeeLevelFilters && filteredEmployeeProgress.length === 0) {
          return null;
        }

        return {
          ...appraisal,
          progress: {
            ...appraisal.progress,
            employeeProgress: filteredEmployeeProgress,
            totalEmployees:
              appraisal.progress?.totalEmployees ||
              filteredEmployeeProgress.length,
            completedEvaluations: filteredEmployeeProgress.filter(
              (emp: any) => emp.status === "completed",
            ).length,
            percentage:
              filteredEmployeeProgress.length > 0
                ? Math.round(
                    (filteredEmployeeProgress.filter(
                      (emp: any) => emp.status === "completed",
                    ).length /
                      filteredEmployeeProgress.length) *
                      100,
                  )
                : appraisal.progress?.percentage || 0,
          },
        };
      })
      .filter((appraisal) => appraisal !== null);
  }, [appraisals, filteredRows, filters, frequencyCalendarToCycleMap]);

  if (isLoading) {
    return (
      <div
        className="container mx-auto py-6 space-y-6"
        data-testid="review-appraisal-page"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Review Appraisal Progress</h1>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="container mx-auto py-6 space-y-6"
      data-testid="review-appraisal-page"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" data-testid="page-title">
          Review Appraisal Progress
        </h1>
        <div className="flex items-center gap-3">
          <Button
            onClick={exportToExcel}
            variant="outline"
            disabled={!filteredRows || filteredRows.length === 0}
            data-testid="button-export-excel"
          >
            <Download className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
          <Tabs
            value={viewMode}
            onValueChange={(value) => setViewMode(value as "card" | "table")}
            data-testid="view-mode-tabs"
          >
            <TabsList>
              <TabsTrigger value="card" data-testid="tab-card">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Card View
              </TabsTrigger>
              <TabsTrigger value="table" data-testid="tab-table">
                <LayoutList className="h-4 w-4 mr-2" />
                Table View
              </TabsTrigger>
            </TabsList>
          </Tabs>
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
              <Label
                htmlFor="appraisal-group"
                data-testid="label-appraisal-group"
              >
                Appraisal Group
              </Label>
              <Select
                value={filters.appraisalGroup}
                onValueChange={(value) =>
                  setFilters({ ...filters, appraisalGroup: value })
                }
              >
                <SelectTrigger
                  id="appraisal-group"
                  data-testid="select-appraisal-group"
                >
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {(appraisalGroups || [])?.map((group: any) => (
                    <SelectItem
                      key={group.id}
                      value={group.id}
                      data-testid={`group-option-${group.id}`}
                    >
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="appraisal-cycle"
                data-testid="label-appraisal-cycle"
              >
                Appraisal Cycle
              </Label>
              <Select
                value={filters.appraisalCycle}
                onValueChange={(value) =>
                  setFilters({ ...filters, appraisalCycle: value })
                }
              >
                <SelectTrigger
                  id="appraisal-cycle"
                  data-testid="select-appraisal-cycle"
                >
                  <SelectValue placeholder="Select cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cycles</SelectItem>
                  {(appraisalCycles || [])?.map((cycle: any) => (
                    <SelectItem
                      key={cycle.id}
                      value={cycle.id}
                      data-testid={`cycle-option-${cycle.id}`}
                    >
                      {cycle.code} - {cycle.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="frequency-calendar"
                data-testid="label-frequency-calendar"
              >
                Frequency Calendar
              </Label>
              <Select
                value={filters.frequencyCalendar}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    frequencyCalendar: value,
                    frequencyCalendarDetails: "all",
                  })
                }
              >
                <SelectTrigger
                  id="frequency-calendar"
                  data-testid="select-frequency-calendar"
                >
                  <SelectValue placeholder="Select calendar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Calendars</SelectItem>
                  {(frequencyCalendars || [])?.map((calendar: any) => (
                    <SelectItem
                      key={calendar.id}
                      value={calendar.id}
                      data-testid={`calendar-option-${calendar.id}`}
                    >
                      {calendar.code} - {calendar.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="frequency-calendar-details"
                data-testid="label-frequency-calendar-details"
              >
                Frequency Calendar Details
              </Label>
              <Select
                value={filters.frequencyCalendarDetails}
                onValueChange={(value) =>
                  setFilters({ ...filters, frequencyCalendarDetails: value })
                }
              >
                <SelectTrigger
                  id="frequency-calendar-details"
                  data-testid="select-frequency-calendar-details"
                >
                  <SelectValue placeholder="Select details" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Details</SelectItem>
                  {filteredFrequencyCalendarDetails.map((detail: any) => (
                    <SelectItem
                      key={detail.id}
                      value={detail.id}
                      data-testid={`calendar-detail-option-${detail.id}`}
                    >
                      {detail.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="employee-search"
                data-testid="label-employee-search"
              >
                Employee
              </Label>
              <Input
                id="employee-search"
                placeholder="Search by employee name"
                value={filters.employee}
                onChange={(e) =>
                  setFilters({ ...filters, employee: e.target.value })
                }
                data-testid="input-employee-search"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location-filter" data-testid="label-location">
                Location
              </Label>
              <Select
                value={filters.location}
                onValueChange={(value) =>
                  setFilters({ ...filters, location: value })
                }
              >
                <SelectTrigger
                  id="location-filter"
                  data-testid="select-location"
                >
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {(locations || [])?.map((location: any) => (
                    <SelectItem
                      key={location.id}
                      value={location.name}
                      data-testid={`location-option-${location.id}`}
                    >
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department-filter" data-testid="label-department">
                Department
              </Label>
              <Select
                value={filters.department}
                onValueChange={(value) =>
                  setFilters({ ...filters, department: value })
                }
              >
                <SelectTrigger
                  id="department-filter"
                  data-testid="select-department"
                >
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {employeeDepartments.map((dept: string) => (
                    <SelectItem
                      key={dept}
                      value={dept}
                      data-testid={`department-option-${dept}`}
                    >
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager-filter" data-testid="label-manager">
                Manager
              </Label>
              <Select
                value={filters.manager}
                onValueChange={(value) =>
                  setFilters({ ...filters, manager: value })
                }
              >
                <SelectTrigger id="manager-filter" data-testid="select-manager">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Managers</SelectItem>
                  {(managers || [])?.map((manager: any) => (
                    <SelectItem
                      key={manager.id}
                      value={manager.id}
                      data-testid={`manager-option-${manager.id}`}
                    >
                      {manager.firstName} {manager.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear Filters Button - Right Aligned */}
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() =>
                setFilters({
                  appraisalGroup: "all",
                  appraisalCycle: "all",
                  frequencyCalendar: "all",
                  frequencyCalendarDetails: "all",
                  employee: "",
                  location: "all",
                  department: "all",
                  manager: "all",
                })
              }
              data-testid="button-clear-filters"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
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
            <div
              className="text-center py-8"
              data-testid="no-appraisals-message"
            >
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Appraisals Found
              </h3>
              <p className="text-muted-foreground">
                No initiated appraisals match your current filters. Try
                adjusting your filter criteria.
              </p>
            </div>
          ) : viewMode === "table" ? (
            /* Table View */
            <div className="space-y-4" data-testid="table-view">
              {filteredRows.length === 0 ? (
                <div
                  className="text-center py-8"
                  data-testid="no-filtered-results-message"
                >
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Results Found
                  </h3>
                  <p className="text-muted-foreground">
                    No employees match your current filters. Try adjusting your
                    filter criteria.
                  </p>
                </div>
              ) : (
                <>
                  <div className="relative overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead
                            className="sticky left-0 bg-background z-10 min-w-[200px] border-r-2 border-muted whitespace-nowrap cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort("employeeName")}
                          >
                            <div className="flex items-center">
                              Employee Name
                              <SortIndicator column="employeeName" />
                            </div>
                          </TableHead>
                          <TableHead
                            className="whitespace-nowrap cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort("departmentName")}
                          >
                            <div className="flex items-center">
                              Department
                              <SortIndicator column="departmentName" />
                            </div>
                          </TableHead>
                          <TableHead
                            className="whitespace-nowrap cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort("managerName")}
                          >
                            <div className="flex items-center">
                              Manager
                              <SortIndicator column="managerName" />
                            </div>
                          </TableHead>
                          <TableHead
                            className="whitespace-nowrap cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort("appraisalGroupName")}
                          >
                            <div className="flex items-center">
                              Appraisal Group
                              <SortIndicator column="appraisalGroupName" />
                            </div>
                          </TableHead>
                          <TableHead
                            className="whitespace-nowrap cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort("status")}
                          >
                            <div className="flex items-center">
                              Status
                              <SortIndicator column="status" />
                            </div>
                          </TableHead>
                          <TableHead
                            className="whitespace-nowrap cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort("dueDate")}
                          >
                            <div className="flex items-center">
                              Due Date
                              <SortIndicator column="dueDate" />
                            </div>
                          </TableHead>
                          <TableHead className="text-right pr-6 whitespace-nowrap">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedRows.map((row: any, index: number) => (
                          <TableRow
                            key={`${row.employeeId}-${row.initiatedAppraisalId}`}
                            data-testid={`table-row-${index}`}
                          >
                            <TableCell
                              className="sticky left-0 bg-background z-10 min-w-[200px] border-r-2 border-muted font-medium whitespace-nowrap"
                              data-testid={`table-employee-name-${index}`}
                            >
                              {row.employeeName}
                            </TableCell>
                            <TableCell
                              className="whitespace-nowrap"
                              data-testid={`table-department-${index}`}
                            >
                              {row.departmentName}
                            </TableCell>
                            <TableCell
                              className="whitespace-nowrap"
                              data-testid={`table-manager-${index}`}
                            >
                              {row.managerName}
                            </TableCell>
                            <TableCell
                              className="whitespace-nowrap"
                              data-testid={`table-appraisal-group-${index}`}
                            >
                              {row.appraisalGroupName}
                            </TableCell>
                            <TableCell
                              className="whitespace-nowrap"
                              data-testid={`table-status-${index}`}
                            >
                              <Badge
                                variant={
                                  row.status === "completed"
                                    ? "default"
                                    : row.status === "in_progress"
                                      ? "secondary"
                                      : row.status === "overdue"
                                        ? "destructive"
                                        : "outline"
                                }
                              >
                                {row.status
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (l: string) =>
                                    l.toUpperCase(),
                                  )}
                              </Badge>
                            </TableCell>
                            <TableCell
                              className="whitespace-nowrap"
                              data-testid={`table-due-date-${index}`}
                            >
                              {row.dueDate
                                ? format(new Date(row.dueDate), "MMM dd, yyyy")
                                : "N/A"}
                            </TableCell>
                            <TableCell
                              className="text-right pr-6 whitespace-nowrap"
                              data-testid={`table-actions-${index}`}
                            >
                              <div className="flex gap-2 justify-end">
                                {row.status !== "completed" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      sendReminder(
                                        row.employeeId,
                                        row.initiatedAppraisalId,
                                      )
                                    }
                                    data-testid={`table-button-send-reminder-${index}`}
                                    disabled={sendReminderMutation.isPending}
                                  >
                                    <Mail className="h-4 w-4 mr-1" />
                                    Send Reminder
                                  </Button>
                                )}
                                {row.status === "completed" &&
                                  row.evaluationId && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          downloadEvaluation(
                                            row.evaluationId,
                                            "pdf",
                                          )
                                        }
                                        data-testid={`table-button-download-pdf-${index}`}
                                        disabled={
                                          downloadEvaluationMutation.isPending
                                        }
                                      >
                                        <FileDown className="h-4 w-4 mr-1" />
                                        PDF
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          downloadEvaluation(
                                            row.evaluationId,
                                            "docx",
                                          )
                                        }
                                        data-testid={`table-button-download-docx-${index}`}
                                        disabled={
                                          downloadEvaluationMutation.isPending
                                        }
                                      >
                                        <FileDown className="h-4 w-4 mr-1" />
                                        DOCX
                                      </Button>
                                    </>
                                  )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Rows per page:
                      </span>
                      <Select
                        value={rowsPerPage.toString()}
                        onValueChange={(value) => {
                          setRowsPerPage(Number(value));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[70px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground ml-4">
                        Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
                        {Math.min(currentPage * rowsPerPage, sortedRows.length)}{" "}
                        of {sortedRows.length} entries
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm px-2">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        Last
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Card View */
            <div className="space-y-4" data-testid="card-view">
              {filteredAppraisals.length === 0 ? (
                <div
                  className="text-center py-8"
                  data-testid="no-filtered-results-message"
                >
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Results Found
                  </h3>
                  <p className="text-muted-foreground">
                    No appraisals match your current filters. Try adjusting your
                    filter criteria.
                  </p>
                </div>
              ) : (
                filteredAppraisals.map((appraisal: any) => (
                  <Card
                    key={appraisal.id}
                    className="border-l-4 border-l-primary"
                    data-testid={`appraisal-card-${appraisal.id}`}
                  >
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
                            <h4
                              className="font-semibold"
                              data-testid={`appraisal-title-${appraisal.id}`}
                            >
                              {appraisal.appraisalGroup?.name ||
                                (appraisal.appraisalGroupId
                                  ? appraisalGroupsMap.get(
                                      appraisal.appraisalGroupId,
                                    ) || "Unknown Group"
                                  : "Unknown Group")}
                              {getAppraisalCycleName(
                                appraisal.frequencyCalendarId,
                              ) && (
                                <span className="text-muted-foreground font-normal ml-2">
                                  (
                                  {getAppraisalCycleName(
                                    appraisal.frequencyCalendarId,
                                  )}
                                  )
                                </span>
                              )}
                            </h4>
                            <p
                              className="text-sm text-muted-foreground"
                              data-testid={`appraisal-type-${appraisal.id}`}
                            >
                              {getAppraisalTypeLabel(appraisal.appraisalType)}
                              {appraisal.frequencyCalendarId &&
                                frequencyCalendarMap.get(
                                  appraisal.frequencyCalendarId,
                                ) && (
                                  <>
                                    {" "}
                                    •{" "}
                                    {frequencyCalendarMap.get(
                                      appraisal.frequencyCalendarId,
                                    )}
                                  </>
                                )}{" "}
                              • Status: {getStatusLabel(appraisal.status)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                              Progress
                            </div>
                            <div
                              className="font-semibold"
                              data-testid={`progress-text-${appraisal.id}`}
                            >
                              {appraisal.progress?.completedEvaluations || 0}/
                              {appraisal.progress?.totalEmployees || 0} (
                              {appraisal.progress?.percentage || 0}%)
                            </div>
                          </div>
                          <Progress
                            value={appraisal.progress?.percentage || 0}
                            className="w-32"
                            data-testid={`progress-bar-${appraisal.id}`}
                          />
                          <Badge
                            variant={
                              appraisal.status === true ||
                              appraisal.status === "active"
                                ? "default"
                                : "outline"
                            }
                            data-testid={`status-badge-${appraisal.id}`}
                          >
                            {getStatusLabel(appraisal.status)}
                          </Badge>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {expandedGroups.has(appraisal.id) && (
                        <div
                          className="mt-4 pt-4 border-t border-border"
                          data-testid={`expanded-content-${appraisal.id}`}
                        >
                          <div className="mb-4">
                            <h5 className="font-semibold mb-2">
                              Employee Progress
                            </h5>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Employee</TableHead>
                                  <TableHead>Location</TableHead>
                                  <TableHead>Department</TableHead>
                                  <TableHead>Manager</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {appraisal.progress?.employeeProgress?.length >
                                0 ? (
                                  appraisal.progress.employeeProgress.map(
                                    (employeeProgress: any, index: number) => (
                                      <TableRow
                                        key={employeeProgress.employee.id}
                                        data-testid={`employee-row-${appraisal.id}-${employeeProgress.employee.id}`}
                                      >
                                        <TableCell
                                          data-testid={`employee-name-${employeeProgress.employee.id}`}
                                        >
                                          {employeeProgress.employee.firstName}{" "}
                                          {employeeProgress.employee.lastName}
                                        </TableCell>
                                        <TableCell
                                          data-testid={`employee-location-${employeeProgress.employee.id}`}
                                        >
                                          {employeeProgress.employee.locationId
                                            ? locationMap.get(
                                                employeeProgress.employee
                                                  .locationId,
                                              ) || "N/A"
                                            : "N/A"}
                                        </TableCell>
                                        <TableCell
                                          data-testid={`employee-department-${employeeProgress.employee.id}`}
                                        >
                                          {employeeProgress.employee
                                            .department || "N/A"}
                                        </TableCell>
                                        <TableCell
                                          data-testid={`employee-manager-${employeeProgress.employee.id}`}
                                        >
                                          {employeeProgress.evaluation?.manager
                                            ? `${employeeProgress.evaluation.manager.firstName} ${employeeProgress.evaluation.manager.lastName}`
                                            : "N/A"}
                                        </TableCell>
                                        <TableCell
                                          data-testid={`employee-status-${employeeProgress.employee.id}`}
                                        >
                                          <Badge
                                            variant={
                                              employeeProgress.status ===
                                              "completed"
                                                ? "default"
                                                : employeeProgress.status ===
                                                    "in_progress"
                                                  ? "secondary"
                                                  : employeeProgress.status ===
                                                      "overdue"
                                                    ? "destructive"
                                                    : "outline"
                                            }
                                          >
                                            {employeeProgress.status
                                              .replace(/_/g, " ")
                                              .replace(/\b\w/g, (l: string) =>
                                                l.toUpperCase(),
                                              )}
                                          </Badge>
                                        </TableCell>
                                        <TableCell
                                          data-testid={`employee-actions-${employeeProgress.employee.id}`}
                                        >
                                          <div className="flex gap-2">
                                            {employeeProgress.status !==
                                              "completed" && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  sendReminder(
                                                    employeeProgress.employee
                                                      .id,
                                                    appraisal.id,
                                                  )
                                                }
                                                data-testid={`button-send-reminder-${employeeProgress.employee.id}`}
                                                disabled={
                                                  sendReminderMutation.isPending
                                                }
                                              >
                                                <Mail className="h-4 w-4 mr-1" />
                                                Send Reminder
                                              </Button>
                                            )}
                                            {employeeProgress.status ===
                                              "completed" &&
                                              employeeProgress.evaluation
                                                ?.id && (
                                                <>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                      downloadEvaluation(
                                                        employeeProgress
                                                          .evaluation.id,
                                                        "pdf",
                                                      )
                                                    }
                                                    data-testid={`button-download-pdf-${employeeProgress.employee.id}`}
                                                    disabled={
                                                      downloadEvaluationMutation.isPending
                                                    }
                                                  >
                                                    <FileDown className="h-4 w-4 mr-1" />
                                                    PDF
                                                  </Button>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                      downloadEvaluation(
                                                        employeeProgress
                                                          .evaluation.id,
                                                        "docx",
                                                      )
                                                    }
                                                    data-testid={`button-download-docx-${employeeProgress.employee.id}`}
                                                    disabled={
                                                      downloadEvaluationMutation.isPending
                                                    }
                                                  >
                                                    <FileDown className="h-4 w-4 mr-1" />
                                                    DOCX
                                                  </Button>
                                                </>
                                              )}
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ),
                                  )
                                ) : (
                                  <TableRow
                                    data-testid={`employee-row-placeholder-${appraisal.id}`}
                                  >
                                    <TableCell
                                      colSpan={5}
                                      className="text-center text-muted-foreground"
                                    >
                                      No employee progress data available
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
