import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Filter,
  LayoutGrid,
  LayoutList,
  Edit,
  Save,
  X,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import * as XLSX from "xlsx";

// Helper function to clean up names that end with "null"
const cleanName = (name: string | null | undefined): string => {
  if (!name) return "";
  return name.replace(/\s+null$/i, "").trim();
};

export default function CalibrateRatings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [editingEvaluation, setEditingEvaluation] = useState<any>(null);
  const [calibratedRating, setCalibratedRating] = useState<number | null>(null);
  const [calibrationRemarks, setCalibrationRemarks] = useState("");

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState({
    appraisalGroup: "all",
    appraisalCycle: "all",
    frequencyCalendar: "all",
    frequencyCalendarDetails: "all",
    employeeSearch: "",
    location: "all",
    department: "all",
    manager: "all",
  });

  // Fetch evaluations with ratings
  const { data: evaluations, isLoading } = useQuery({
    queryKey: ["/api/evaluations/calibrate"],
  });

  // Extract unique filter options from evaluations response data
  const filterOptions = useMemo(() => {
    if (!evaluations)
      return {
        locations: [],
        departments: [],
        managers: [],
        appraisalGroups: [],
        appraisalCycles: [],
        frequencyCalendars: [],
      };

    const locSet = new Map<string, string>();
    const deptSet = new Set<string>();
    const mgrMap = new Map<string, string>();
    const groupMap = new Map<string, string>();
    const cycleMap = new Map<string, string>();
    const calMap = new Map<string, string>();

    (evaluations as any[]).forEach((ev: any) => {
      if (ev.locationName && ev.locationName !== "N/A")
        locSet.set(ev.locationName, ev.locationName);
      if (ev.department && ev.department !== "N/A") deptSet.add(ev.department);
      if (ev.managerId && ev.managerName)
        mgrMap.set(ev.managerId, cleanName(ev.managerName));
      if (ev.appraisalGroupId && ev.appraisalGroupName)
        groupMap.set(ev.appraisalGroupId, ev.appraisalGroupName);
      if (
        ev.appraisalCycleId &&
        ev.appraisalCycleName &&
        ev.appraisalCycleName !== "N/A"
      )
        cycleMap.set(ev.appraisalCycleId, ev.appraisalCycleName);
      if (
        ev.frequencyCalendarId &&
        ev.frequencyCalendarName &&
        ev.frequencyCalendarName !== "N/A"
      )
        calMap.set(ev.frequencyCalendarId, ev.frequencyCalendarName);
    });

    return {
      locations: Array.from(locSet.values()).sort(),
      departments: Array.from(deptSet).sort(),
      managers: Array.from(mgrMap.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      appraisalGroups: Array.from(groupMap.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      appraisalCycles: Array.from(cycleMap.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      frequencyCalendars: Array.from(calMap.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [evaluations]);

  // Update calibration mutation
  const updateCalibrationMutation = useMutation({
    mutationFn: async ({
      evaluationId,
      calibratedRating,
      calibrationRemarks,
    }: {
      evaluationId: string;
      calibratedRating: number | null;
      calibrationRemarks: string;
    }) => {
      const response = await apiRequest(
        "PUT",
        `/api/evaluations/${evaluationId}/calibrate`,
        {
          calibratedRating,
          calibrationRemarks,
        },
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "An error occurred" }));
        throw new Error(errorData.message || "Failed to update calibration");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/evaluations/calibrate"],
      });
      setEditingEvaluation(null);
      setCalibratedRating(null);
      setCalibrationRemarks("");
      toast({
        title: "Calibration Updated",
        description: `Successfully updated rating for ${data.employeeName}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description:
          error.message || "An error occurred while updating the calibration",
        variant: "destructive",
      });
    },
  });

  const handleEditCalibration = (evaluation: any) => {
    setEditingEvaluation(evaluation);
    setCalibratedRating(
      evaluation.calibratedRating ?? evaluation.overallRating ?? null,
    );
    setCalibrationRemarks(evaluation.calibrationRemarks || "");
  };

  const handleSaveCalibration = () => {
    if (!editingEvaluation) return;

    updateCalibrationMutation.mutate({
      evaluationId: editingEvaluation.id,
      calibratedRating,
      calibrationRemarks,
    });
  };

  const importCalibrationsMutation = useMutation({
    mutationFn: async (data: any[]) => {
      const response = await apiRequest(
        "POST",
        "/api/evaluations/calibrate/import",
        { calibrations: data },
      );
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "An error occurred" }));
        throw new Error(errorData.message || "Failed to import calibrations");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/evaluations/calibrate"],
      });
      setImportResults(data);
      setSelectedFile(null);
      toast({
        title: "Import Completed",
        description: `Successfully imported ${data.summary.successful} calibrations, ${data.summary.failed} failed`,
      });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description:
          error.message || "An error occurred while importing calibrations",
        variant: "destructive",
      });
    },
  });

  const handleDownloadTemplate = () => {
    try {
      const templateData = filteredEvaluations.map((evaluation: any) => ({
        "Evaluation ID": evaluation.id,
        "Employee Code": evaluation.employeeCode,
        "Employee Name": evaluation.employeeName,
        "Appraisal Cycle": evaluation.appraisalCycleName || "N/A",
        "Calendar Period": evaluation.frequencyCalendarName || "N/A",
        "Current Manager Rating": evaluation.overallRating ?? "",
        "Calibrated Rating": evaluation.calibratedRating ?? "",
        Remarks: evaluation.calibrationRemarks || "",
      }));

      if (templateData.length === 0) {
        templateData.push({
          "Evaluation ID": "",
          "Employee Code": "",
          "Employee Name": "",
          "Appraisal Cycle": "",
          "Calendar Period": "",
          "Current Manager Rating": "",
          "Calibrated Rating": "",
          Remarks: "",
        });
      }

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Calibration Template");

      const columnWidths = [
        { wch: 40 },
        { wch: 15 },
        { wch: 25 },
        { wch: 35 },
        { wch: 20 },
        { wch: 20 },
        { wch: 18 },
        { wch: 40 },
      ];
      worksheet["!cols"] = columnWidths;

      const timestamp = format(new Date(), "yyyy-MM-dd_HHmmss");
      const filename = `Calibration_Template_${timestamp}.xlsx`;
      XLSX.writeFile(workbook, filename);

      toast({
        title: "Template Downloaded",
        description: `Downloaded template with ${templateData.length} employee records`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "An error occurred while generating the template",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        toast({
          title: "Invalid File",
          description: "Please upload an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setImportResults(null);
    }
  };

  const handleImport = () => {
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const calibrations = jsonData
          .map((row: any) => ({
            evaluationId: row["Evaluation ID"]?.toString().trim(),
            employeeCode: row["Employee Code"]?.toString().trim(),
            calibratedRating:
              row["Calibrated Rating"] !== undefined &&
              row["Calibrated Rating"] !== ""
                ? parseFloat(row["Calibrated Rating"])
                : null,
            remarks: row["Remarks"]?.toString().trim() || "",
          }))
          .filter((c: any) => c.evaluationId && c.calibratedRating !== null);

        if (calibrations.length === 0) {
          toast({
            title: "No Valid Data",
            description:
              "No valid calibration data found in the file. Ensure Evaluation ID and Calibrated Rating are filled.",
            variant: "destructive",
          });
          return;
        }

        importCalibrationsMutation.mutate(calibrations);
      } catch (error) {
        toast({
          title: "Import Failed",
          description:
            "Failed to read the Excel file. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
    setSelectedFile(null);
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Filter evaluations
  const filteredEvaluations = useMemo(() => {
    if (!evaluations) return [];

    return (evaluations as any[]).filter((evaluation: any) => {
      // Appraisal group filter
      if (
        filters.appraisalGroup !== "all" &&
        evaluation.appraisalGroupId !== filters.appraisalGroup
      ) {
        return false;
      }

      // Appraisal cycle filter
      if (
        filters.appraisalCycle !== "all" &&
        evaluation.appraisalCycleId !== filters.appraisalCycle
      ) {
        return false;
      }

      // Frequency calendar filter
      if (
        filters.frequencyCalendar !== "all" &&
        evaluation.frequencyCalendarId !== filters.frequencyCalendar
      ) {
        return false;
      }

      // Frequency calendar details filter (by date range key)
      if (filters.frequencyCalendarDetails !== "all") {
        const evalKey = `${evaluation.frequencyCalendarStartDate}_${evaluation.frequencyCalendarEndDate}`;
        if (evalKey !== filters.frequencyCalendarDetails) {
          return false;
        }
      }

      // Employee search filter (code or name)
      if (filters.employeeSearch) {
        const searchLower = filters.employeeSearch.toLowerCase();
        const matchesName = evaluation.employeeName
          ?.toLowerCase()
          .includes(searchLower);
        const matchesCode = evaluation.employeeCode
          ?.toLowerCase()
          .includes(searchLower);
        if (!matchesName && !matchesCode) {
          return false;
        }
      }

      // Location filter (by name)
      if (
        filters.location !== "all" &&
        evaluation.locationName !== filters.location
      ) {
        return false;
      }

      // Department filter (by name)
      if (
        filters.department !== "all" &&
        evaluation.department !== filters.department
      ) {
        return false;
      }

      // Manager filter (by id)
      if (
        filters.manager !== "all" &&
        evaluation.managerId !== filters.manager
      ) {
        return false;
      }

      return true;
    });
  }, [evaluations, filters]);

  const getRatingBadgeColor = (rating: number | null | undefined) => {
    if (rating === null || rating === undefined) return "secondary";
    if (rating >= 4) return "default";
    if (rating >= 3) return "secondary";
    return "destructive";
  };

  const getRatingLabel = (rating: number | null | undefined) => {
    if (rating === null || rating === undefined) return "Not Rated";
    return `Rating: ${rating.toFixed(1)}`;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">
            Calibrate Ratings
          </h1>
          <p className="text-muted-foreground">
            Review and adjust final employee ratings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportDialogOpen(true)}
            data-testid="import-ratings-btn"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Ratings
          </Button>
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("card")}
            data-testid="view-card"
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Card View
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
            data-testid="view-table"
          >
            <LayoutList className="h-4 w-4 mr-2" />
            Table View
          </Button>
        </div>
      </div>

      {/* Filters */}
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
                  {filterOptions.appraisalGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
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
                  {filterOptions.appraisalCycles.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.name}
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
                  {filterOptions.frequencyCalendars.map((calendar) => (
                    <SelectItem key={calendar.id} value={calendar.id}>
                      {calendar.name}
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
                Calendar Details
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
                  {(() => {
                    if (!evaluations || filters.frequencyCalendar === "all")
                      return null;
                    const detailSet = new Map<
                      string,
                      { start: string; end: string }
                    >();
                    (evaluations as any[]).forEach((ev: any) => {
                      if (
                        ev.frequencyCalendarId === filters.frequencyCalendar &&
                        ev.frequencyCalendarStartDate &&
                        ev.frequencyCalendarEndDate
                      ) {
                        const key = `${ev.frequencyCalendarStartDate}_${ev.frequencyCalendarEndDate}`;
                        if (!detailSet.has(key)) {
                          detailSet.set(key, {
                            start: ev.frequencyCalendarStartDate,
                            end: ev.frequencyCalendarEndDate,
                          });
                        }
                      }
                    });
                    const formatDate = (date: string) => {
                      const d = new Date(date);
                      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                    };
                    return Array.from(detailSet.entries()).map(([key, val]) => (
                      <SelectItem key={key} value={key}>
                        {formatDate(val.start)} - {formatDate(val.end)}
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="employee-search"
                data-testid="label-employee-search"
              >
                Employee Code/Name
              </Label>
              <Input
                id="employee-search"
                placeholder="Search by code or name..."
                value={filters.employeeSearch}
                onChange={(e) =>
                  setFilters({ ...filters, employeeSearch: e.target.value })
                }
                data-testid="input-employee-search"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" data-testid="label-location">
                Location
              </Label>
              <Select
                value={filters.location}
                onValueChange={(value) =>
                  setFilters({ ...filters, location: value })
                }
              >
                <SelectTrigger id="location" data-testid="select-location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {filterOptions.locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department" data-testid="label-department">
                Department
              </Label>
              <Select
                value={filters.department}
                onValueChange={(value) =>
                  setFilters({ ...filters, department: value })
                }
              >
                <SelectTrigger id="department" data-testid="select-department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {filterOptions.departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager" data-testid="label-manager">
                Manager
              </Label>
              <Select
                value={filters.manager}
                onValueChange={(value) =>
                  setFilters({ ...filters, manager: value })
                }
              >
                <SelectTrigger id="manager" data-testid="select-manager">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Managers</SelectItem>
                  {filterOptions.managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : filteredEvaluations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p
              className="text-muted-foreground"
              data-testid="no-evaluations-message"
            >
              No evaluations found with the selected filters.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvaluations.map((evaluation: any) => (
            <Card
              key={evaluation.id}
              data-testid={`evaluation-card-${evaluation.id}`}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3
                      className="font-semibold text-lg"
                      data-testid={`employee-name-${evaluation.id}`}
                    >
                      {evaluation.employeeName}
                    </h3>
                    <p
                      className="text-sm text-muted-foreground"
                      data-testid={`employee-code-${evaluation.id}`}
                    >
                      Code: {evaluation.employeeCode}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Appraisal Cycle:
                      </span>
                      <span
                        data-testid={`appraisal-cycle-${evaluation.id}`}
                        className="text-right font-medium"
                      >
                        {evaluation.appraisalCycleName !== "N/A"
                          ? evaluation.appraisalCycleName
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Calendar Period:
                      </span>
                      <span
                        data-testid={`calendar-period-${evaluation.id}`}
                        className="text-right"
                      >
                        {evaluation.calendarPeriodName !== "N/A" ? (
                          <>
                            {evaluation.frequencyCalendarName}
                            {evaluation.frequencyCalendarStartDate &&
                              evaluation.frequencyCalendarEndDate && (
                                <span className="text-xs text-muted-foreground block">
                                  (
                                  {new Date(
                                    evaluation.frequencyCalendarStartDate,
                                  ).toLocaleDateString("en-GB")}{" "}
                                  -{" "}
                                  {new Date(
                                    evaluation.frequencyCalendarEndDate,
                                  ).toLocaleDateString("en-GB")}
                                  )
                                </span>
                              )}
                          </>
                        ) : (
                          "N/A"
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span data-testid={`location-${evaluation.id}`}>
                        {evaluation.locationName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Department:</span>
                      <span data-testid={`department-${evaluation.id}`}>
                        {evaluation.department}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Manager:</span>
                      <span data-testid={`manager-${evaluation.id}`}>
                        {cleanName(evaluation.managerName)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Manager Rating:
                      </span>
                      <Badge
                        variant={getRatingBadgeColor(evaluation.overallRating)}
                        data-testid={`manager-rating-${evaluation.id}`}
                      >
                        {getRatingLabel(evaluation.overallRating)}
                      </Badge>
                    </div>
                    {evaluation.calibratedRating !== null && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Calibrated Rating:
                        </span>
                        <Badge
                          variant={getRatingBadgeColor(
                            evaluation.calibratedRating,
                          )}
                          data-testid={`calibrated-rating-${evaluation.id}`}
                        >
                          {getRatingLabel(evaluation.calibratedRating)}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => handleEditCalibration(evaluation)}
                    data-testid={`edit-calibration-${evaluation.id}`}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {evaluation.calibratedRating !== null
                      ? "Edit Calibration"
                      : "Calibrate Rating"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead data-testid="table-header-employee">
                    Employee
                  </TableHead>
                  <TableHead data-testid="table-header-code">Code</TableHead>
                  <TableHead data-testid="table-header-cycle">
                    Appraisal Cycle
                  </TableHead>
                  <TableHead data-testid="table-header-period">
                    Calendar Period
                  </TableHead>
                  <TableHead data-testid="table-header-location">
                    Location
                  </TableHead>
                  <TableHead data-testid="table-header-manager">
                    Manager
                  </TableHead>
                  <TableHead data-testid="table-header-manager-rating">
                    Manager Rating
                  </TableHead>
                  <TableHead data-testid="table-header-calibrated-rating">
                    Calibrated Rating
                  </TableHead>
                  <TableHead data-testid="table-header-actions">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvaluations.map((evaluation: any) => (
                  <TableRow
                    key={evaluation.id}
                    data-testid={`evaluation-row-${evaluation.id}`}
                  >
                    <TableCell
                      className="font-medium"
                      data-testid={`table-employee-name-${evaluation.id}`}
                    >
                      {evaluation.employeeName}
                    </TableCell>
                    <TableCell
                      data-testid={`table-employee-code-${evaluation.id}`}
                    >
                      {evaluation.employeeCode}
                    </TableCell>
                    <TableCell
                      data-testid={`table-appraisal-cycle-${evaluation.id}`}
                    >
                      {evaluation.appraisalCycleCode}
                    </TableCell>
                    <TableCell
                      data-testid={`table-calendar-period-${evaluation.id}`}
                    >
                      {evaluation.calendarPeriodName}
                      {evaluation.calendarPeriodStartDate &&
                        evaluation.calendarPeriodEndDate && (
                          <span className="text-xs text-muted-foreground block">
                            (
                            {new Date(
                              evaluation.calendarPeriodStartDate,
                            ).toLocaleDateString("en-GB")}{" "}
                            -{" "}
                            {new Date(
                              evaluation.calendarPeriodEndDate,
                            ).toLocaleDateString("en-GB")}
                            )
                          </span>
                        )}
                    </TableCell>
                    <TableCell data-testid={`table-location-${evaluation.id}`}>
                      {evaluation.locationName}
                    </TableCell>
                    <TableCell data-testid={`table-manager-${evaluation.id}`}>
                      {cleanName(evaluation.managerName)}
                    </TableCell>
                    <TableCell
                      data-testid={`table-manager-rating-${evaluation.id}`}
                    >
                      <Badge
                        variant={getRatingBadgeColor(evaluation.overallRating)}
                      >
                        {getRatingLabel(evaluation.overallRating)}
                      </Badge>
                    </TableCell>
                    <TableCell
                      data-testid={`table-calibrated-rating-${evaluation.id}`}
                    >
                      {evaluation.calibratedRating !== null ? (
                        <Badge
                          variant={getRatingBadgeColor(
                            evaluation.calibratedRating,
                          )}
                        >
                          {getRatingLabel(evaluation.calibratedRating)}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCalibration(evaluation)}
                        data-testid={`edit-calibration-${evaluation.id}`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {evaluation.calibratedRating !== null
                          ? "Edit"
                          : "Calibrate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit Calibration Dialog */}
      <Dialog
        open={!!editingEvaluation}
        onOpenChange={(open) => !open && setEditingEvaluation(null)}
      >
        <DialogContent data-testid="calibration-dialog">
          <DialogHeader>
            <DialogTitle>Calibrate Rating</DialogTitle>
            <DialogDescription>
              Adjust the final rating for {editingEvaluation?.employeeName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Manager's Rating</Label>
              <div className="p-3 bg-muted rounded-md">
                <Badge
                  variant={getRatingBadgeColor(
                    editingEvaluation?.overallRating,
                  )}
                >
                  {getRatingLabel(editingEvaluation?.overallRating)}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="calibrated-rating">Calibrated Rating*</Label>
              <Select
                value={calibratedRating?.toString() || ""}
                onValueChange={(value) =>
                  setCalibratedRating(value ? Number(value) : null)
                }
              >
                <SelectTrigger
                  id="calibrated-rating"
                  data-testid="select-calibrated-rating"
                >
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1.0 - Poor</SelectItem>
                  <SelectItem value="2">2.0 - Below Average</SelectItem>
                  <SelectItem value="3">3.0 - Average</SelectItem>
                  <SelectItem value="4">4.0 - Good</SelectItem>
                  <SelectItem value="5">5.0 - Excellent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="calibration-remarks">Remarks (Optional)</Label>
              <Textarea
                id="calibration-remarks"
                placeholder="Add any remarks about the calibration..."
                value={calibrationRemarks}
                onChange={(e) => setCalibrationRemarks(e.target.value)}
                rows={4}
                data-testid="textarea-calibration-remarks"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingEvaluation(null)}
                data-testid="button-cancel"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveCalibration}
                disabled={
                  updateCalibrationMutation.isPending ||
                  calibratedRating === null
                }
                data-testid="button-save"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateCalibrationMutation.isPending
                  ? "Saving..."
                  : "Save Calibration"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Ratings Dialog */}
      <Dialog
        open={importDialogOpen}
        onOpenChange={(open) => !open && handleCloseImportDialog()}
      >
        <DialogContent className="max-w-2xl" data-testid="import-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import Calibrated Ratings
            </DialogTitle>
            <DialogDescription>
              Upload an Excel file to bulk update calibrated ratings. Download
              the template first to ensure correct format.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg border">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Download className="h-4 w-4" />
                Step 1: Download Template
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Download the template to get the correct format. If you've
                selected Appraisal Cycle and Calendar Period filters, the
                template will be pre-filled with employees matching those
                filters.
              </p>
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                data-testid="download-template-btn"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg border">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Step 2: Upload Completed File
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Fill in the "Calibrated Rating" and "Remarks" columns in the
                template, then upload the file here.
              </p>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  className="max-w-xs"
                  data-testid="file-input"
                />
                {selectedFile && (
                  <span className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name}
                  </span>
                )}
              </div>
            </div>

            {importResults && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Import Results</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Successful: {importResults.summary.successful}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span>Failed: {importResults.summary.failed}</span>
                  </div>
                </div>
                {importResults.errors && importResults.errors.length > 0 && (
                  <div className="max-h-32 overflow-y-auto">
                    <p className="text-sm font-medium text-red-600 mb-2">
                      Errors:
                    </p>
                    <ul className="text-sm space-y-1">
                      {importResults.errors.map((error: any, index: number) => (
                        <li key={index} className="text-muted-foreground">
                          • {error.employeeCode}: {error.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCloseImportDialog}
              data-testid="close-import-btn"
            >
              Close
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || importCalibrationsMutation.isPending}
              data-testid="import-btn"
            >
              {importCalibrationsMutation.isPending ? (
                <>Processing...</>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Ratings
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
