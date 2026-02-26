import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RoleGuard } from "@/components/RoleGuard";
import { useTour } from "@/contexts/TourContext";
import {
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle,
  CalendarCheck,
  CalendarX,
  MessageSquare,
} from "lucide-react";
import type { Evaluation, User as UserType } from "@shared/schema";

interface EvaluationWithDetails extends Evaluation {
  employee?: Partial<UserType> & {
    firstName?: string;
    lastName?: string;
    email?: string;
    code?: string;
    department?: string;
    designation?: string;
  };
  manager?: Partial<UserType> & {
    firstName?: string;
    lastName?: string;
    email?: string;
    code?: string;
    department?: string;
    designation?: string;
  };
  reviewCycle?: {
    id: string;
    name: string;
    description?: string;
    fromDate?: string;
    toDate?: string;
  };
  frequencyCalendar?: {
    id: string;
    code?: string;
    description?: string;
  };
  questionnaires?: Array<{
    id: string;
    name: string;
    description?: string;
    questions?: any[];
  }>;
}

interface MeetingNotesData {
  meetingNotes: string;
  finalRating?: number;
  showNotesToEmployee: boolean;
}

export default function Meetings() {
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] =
    useState<EvaluationWithDetails | null>(null);
  const [notesData, setNotesData] = useState<MeetingNotesData>({
    meetingNotes: "",
    finalRating: undefined,
    showNotesToEmployee: false,
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isTourMode, currentAction, clearAction } = useTour();
  const [showDemoData, setShowDemoData] = useState(false);

  // Get active role for role switching support
  const activeRole =
    (user as any)?.activeRole ||
    (user as any)?.ActiveRole ||
    (user as any)?.role ||
    (user as any)?.Role ||
    "employee";

  // Demo meetings for tour - different data based on role
  const demoMeetingsForManager: EvaluationWithDetails[] = [
    {
      id: "demo-meeting-1",
      employeeId: "demo-emp-1",
      managerId: user?.id || "manager-1",
      reviewCycleId: "cycle-2024",
      initiatedAppraisalId: "appraisal-1",
      selfEvaluationData: null,
      selfEvaluationSubmittedAt: new Date(
        Date.now() - 10 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      managerEvaluationData: null,
      managerEvaluationSubmittedAt: new Date(
        Date.now() - 5 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      overallRating: 4,
      meetingScheduledAt: new Date(
        Date.now() + 2 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      meetingNotes: null,
      meetingCompletedAt: null,
      finalizedAt: null,
      showNotesToEmployee: false,
      calibratedRating: null,
      calibrationRemarks: null,
      createdOn: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: "system",
      lastUpdatedOn: new Date(
        Date.now() - 5 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      lastUpdatedBy: user?.id || "manager-1",
      employee: {
        id: "demo-emp-1",
        code: "EMP001",
        email: "john.doe@company.com",
        password: "",
        firstName: "John",
        lastName: "Doe",
        designation: "Software Engineer",
        department: "Engineering",
        role: "employee",
        managerId: user?.id || "manager-1",
        companyId: "company-1",
        locationId: "loc-1",
        levelId: "level-3",
        gradeId: "grade-b",
        isActive: true,
        createdOn: new Date(
          Date.now() - 365 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        createdBy: "hr",
        lastUpdatedOn: null,
        lastUpdatedBy: null,
      },
      manager: {
        id: user?.id || "manager-1",
        code: "MGR001",
        email: user?.email || "manager@company.com",
        password: "",
        firstName: user?.firstName || "Manager",
        lastName: user?.lastName || "User",
        designation: "Engineering Manager",
        department: "Engineering",
        role: "manager",
        managerId: null,
        companyId: "company-1",
        locationId: "loc-1",
        levelId: "level-5",
        gradeId: "grade-a",
        isActive: true,
        createdOn: new Date(
          Date.now() - 730 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        createdBy: "hr",
        lastUpdatedOn: null,
        lastUpdatedBy: null,
      },
    },
    {
      id: "demo-meeting-2",
      employeeId: "demo-emp-2",
      managerId: user?.id || "manager-1",
      reviewCycleId: "cycle-2024",
      initiatedAppraisalId: "appraisal-2",
      selfEvaluationData: null,
      selfEvaluationSubmittedAt: new Date(
        Date.now() - 8 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      managerEvaluationData: null,
      managerEvaluationSubmittedAt: new Date(
        Date.now() - 3 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      overallRating: 5,
      meetingScheduledAt: new Date(
        Date.now() + 5 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      meetingNotes: null,
      meetingCompletedAt: null,
      finalizedAt: null,
      showNotesToEmployee: false,
      calibratedRating: null,
      calibrationRemarks: null,
      createdOn: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: "system",
      lastUpdatedOn: new Date(
        Date.now() - 3 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      lastUpdatedBy: user?.id || "manager-1",
      employee: {
        id: "demo-emp-2",
        code: "EMP002",
        email: "jane.smith@company.com",
        password: "",
        firstName: "Jane",
        lastName: "Smith",
        designation: "Senior Developer",
        department: "Engineering",
        role: "employee",
        managerId: user?.id || "manager-1",
        companyId: "company-1",
        locationId: "loc-1",
        levelId: "level-4",
        gradeId: "grade-a",
        isActive: true,
        createdOn: new Date(
          Date.now() - 500 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        createdBy: "hr",
        lastUpdatedOn: null,
        lastUpdatedBy: null,
      },
      manager: {
        id: user?.id || "manager-1",
        code: "MGR001",
        email: user?.email || "manager@company.com",
        password: "",
        firstName: user?.firstName || "Manager",
        lastName: user?.lastName || "User",
        designation: "Engineering Manager",
        department: "Engineering",
        role: "manager",
        managerId: null,
        companyId: "company-1",
        locationId: "loc-1",
        levelId: "level-5",
        gradeId: "grade-a",
        isActive: true,
        createdOn: new Date(
          Date.now() - 730 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        createdBy: "hr",
        lastUpdatedOn: null,
        lastUpdatedBy: null,
      },
    },
  ];

  // Demo meetings for employee tour - shows meetings from employee perspective
  const demoMeetingsForEmployee: EvaluationWithDetails[] = [
    {
      id: "demo-employee-meeting-1",
      employeeId: user?.id || "employee-1",
      managerId: "manager-demo-1",
      reviewCycleId: "cycle-2024",
      initiatedAppraisalId: "appraisal-1",
      selfEvaluationData: { responses: {}, averageRating: 4 },
      selfEvaluationSubmittedAt: new Date(
        Date.now() - 14 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      managerEvaluationData: {
        managerRemarks: "Great performance this quarter!",
      },
      managerEvaluationSubmittedAt: new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      overallRating: 4,
      meetingScheduledAt: new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      meetingNotes: null,
      meetingCompletedAt: null,
      finalizedAt: null,
      showNotesToEmployee: false,
      calibratedRating: null,
      calibrationRemarks: null,
      createdOn: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: "system",
      lastUpdatedOn: new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      lastUpdatedBy: "manager-demo-1",
      employee: {
        id: user?.id || "employee-1",
        code: user?.code || "EMP001",
        email: user?.email || "employee@company.com",
        password: "",
        firstName: user?.firstName || "John",
        lastName: user?.lastName || "Doe",
        designation: user?.designation || "Software Engineer",
        department: "Engineering",
        role: "employee",
        managerId: "manager-demo-1",
        companyId: "company-1",
        locationId: "loc-1",
        levelId: "level-3",
        gradeId: "grade-b",
        isActive: true,
        createdOn: new Date(
          Date.now() - 365 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        createdBy: "hr",
        lastUpdatedOn: null,
        lastUpdatedBy: null,
      },
      manager: {
        id: "manager-demo-1",
        code: "MGR001",
        email: "sarah.manager@company.com",
        password: "",
        firstName: "Sarah",
        lastName: "Johnson",
        designation: "Engineering Manager",
        department: "Engineering",
        role: "manager",
        managerId: null,
        companyId: "company-1",
        locationId: "loc-1",
        levelId: "level-5",
        gradeId: "grade-a",
        isActive: true,
        createdOn: new Date(
          Date.now() - 730 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        createdBy: "hr",
        lastUpdatedOn: null,
        lastUpdatedBy: null,
      },
    },
    {
      id: "demo-employee-meeting-2",
      employeeId: user?.id || "employee-1",
      managerId: "manager-demo-1",
      reviewCycleId: "cycle-2023-q3",
      initiatedAppraisalId: "appraisal-prev",
      selfEvaluationData: { responses: {}, averageRating: 4.5 },
      selfEvaluationSubmittedAt: new Date(
        Date.now() - 90 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      managerEvaluationData: {
        managerRemarks:
          "Excellent work on the Q3 projects. Continue the momentum!",
      },
      managerEvaluationSubmittedAt: new Date(
        Date.now() - 85 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      overallRating: 4.5,
      meetingScheduledAt: new Date(
        Date.now() - 80 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      meetingNotes:
        "Discussed Q3 achievements including the successful API migration. Set goals for improving documentation and mentoring junior developers. Employee shows strong technical skills and leadership potential.",
      meetingCompletedAt: new Date(
        Date.now() - 80 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      finalizedAt: new Date(
        Date.now() - 79 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      showNotesToEmployee: true,
      calibratedRating: 4.5,
      calibrationRemarks: null,
      createdOn: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: "system",
      lastUpdatedOn: new Date(
        Date.now() - 79 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      lastUpdatedBy: "manager-demo-1",
      employee: {
        id: user?.id || "employee-1",
        code: user?.code || "EMP001",
        email: user?.email || "employee@company.com",
        password: "",
        firstName: user?.firstName || "John",
        lastName: user?.lastName || "Doe",
        designation: user?.designation || "Software Engineer",
        department: "Engineering",
        role: "employee",
        managerId: "manager-demo-1",
        companyId: "company-1",
        locationId: "loc-1",
        levelId: "level-3",
        gradeId: "grade-b",
        isActive: true,
        createdOn: new Date(
          Date.now() - 365 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        createdBy: "hr",
        lastUpdatedOn: null,
        lastUpdatedBy: null,
      },
      manager: {
        id: "manager-demo-1",
        code: "MGR001",
        email: "sarah.manager@company.com",
        password: "",
        firstName: "Sarah",
        lastName: "Johnson",
        designation: "Engineering Manager",
        department: "Engineering",
        role: "manager",
        managerId: null,
        companyId: "company-1",
        locationId: "loc-1",
        levelId: "level-5",
        gradeId: "grade-a",
        isActive: true,
        createdOn: new Date(
          Date.now() - 730 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        createdBy: "hr",
        lastUpdatedOn: null,
        lastUpdatedBy: null,
      },
    },
  ];

  // Select appropriate demo data based on role
  const demoMeetings =
    activeRole === "manager" ? demoMeetingsForManager : demoMeetingsForEmployee;

  // Handle tour actions
  useEffect(() => {
    // Reset demo data when tour ends
    if (!isTourMode) {
      setShowDemoData(false);
      return;
    }

    if (!currentAction) return;

    if (currentAction === "showDemoMeetings") {
      setShowDemoData(true);
      clearAction();
    }
  }, [isTourMode, currentAction, clearAction]);

  console.log("[Meetings] User:", user?.id, "Active Role:", activeRole);

  // Normalize evaluation data from PascalCase API response to camelCase
  const normalizeEvaluation = (evaluation: any): EvaluationWithDetails => ({
    id: evaluation.Id || evaluation.id,
    employeeId: evaluation.EmployeeId || evaluation.employeeId,
    managerId: evaluation.ManagerId || evaluation.managerId,
    reviewCycleId: evaluation.ReviewCycleId || evaluation.reviewCycleId,
    initiatedAppraisalId:
      evaluation.InitiatedAppraisalId || evaluation.initiatedAppraisalId,
    selfEvaluationData: evaluation.SelfEvaluationData
      ? typeof evaluation.SelfEvaluationData === "string"
        ? JSON.parse(evaluation.SelfEvaluationData)
        : evaluation.SelfEvaluationData
      : evaluation.selfEvaluationData || null,
    selfEvaluationSubmittedAt:
      evaluation.SelfEvaluationSubmittedAt ||
      evaluation.selfEvaluationSubmittedAt,
    managerEvaluationData: evaluation.ManagerEvaluationData
      ? typeof evaluation.ManagerEvaluationData === "string"
        ? JSON.parse(evaluation.ManagerEvaluationData)
        : evaluation.ManagerEvaluationData
      : evaluation.managerEvaluationData || null,
    managerEvaluationSubmittedAt:
      evaluation.ManagerEvaluationSubmittedAt ||
      evaluation.managerEvaluationSubmittedAt,
    overallRating: evaluation.OverallRating || evaluation.overallRating,
    meetingScheduledAt:
      evaluation.MeetingScheduledAt || evaluation.meetingScheduledAt,
    meetingNotes: evaluation.MeetingNotes || evaluation.meetingNotes,
    meetingCompletedAt:
      evaluation.MeetingCompletedAt || evaluation.meetingCompletedAt,
    finalizedAt: evaluation.FinalizedAt || evaluation.finalizedAt,
    showNotesToEmployee:
      evaluation.ShowNotesToEmployee ?? evaluation.showNotesToEmployee ?? false,
    calibratedRating:
      evaluation.CalibratedRating || evaluation.calibratedRating,
    calibrationRemarks:
      evaluation.CalibrationRemarks || evaluation.calibrationRemarks,
    calibratedBy: evaluation.CalibratedBy || evaluation.calibratedBy,
    calibratedAt: evaluation.CalibratedAt || evaluation.calibratedAt,
    status: evaluation.Status || evaluation.status,
    createdOn: evaluation.CreatedOn || evaluation.createdOn,
    lastUpdatedOn: evaluation.LastUpdatedOn || evaluation.lastUpdatedOn,
    // Handle employee - API returns Name field instead of FirstName/LastName
    employee: evaluation.employee
      ? {
          id: evaluation.employee.Id || evaluation.employee.id,
          firstName:
            evaluation.employee.FirstName ||
            evaluation.employee.firstName ||
            evaluation.employee.Name?.split(" ")[0] ||
            "",
          lastName:
            evaluation.employee.LastName ||
            evaluation.employee.lastName ||
            evaluation.employee.Name?.split(" ").slice(1).join(" ") ||
            "",
          email:
            evaluation.employee.Email ||
            evaluation.employee.email ||
            evaluation.employee.EmailId ||
            "",
          code:
            evaluation.employee.SystemUserCode ||
            evaluation.employee.code ||
            "",
          department:
            evaluation.employee.Department || evaluation.employee.department,
          designation:
            evaluation.employee.Designation || evaluation.employee.designation,
        }
      : undefined,
    // Handle manager - API returns Name field instead of FirstName/LastName
    manager: evaluation.manager
      ? {
          id: evaluation.manager.Id || evaluation.manager.id,
          firstName:
            evaluation.manager.FirstName ||
            evaluation.manager.firstName ||
            evaluation.manager.Name?.split(" ")[0] ||
            "",
          lastName:
            evaluation.manager.LastName ||
            evaluation.manager.lastName ||
            evaluation.manager.Name?.split(" ").slice(1).join(" ") ||
            "",
          email:
            evaluation.manager.Email ||
            evaluation.manager.email ||
            evaluation.manager.EmailId ||
            "",
          code:
            evaluation.manager.SystemUserCode || evaluation.manager.code || "",
          department:
            evaluation.manager.Department || evaluation.manager.department,
          designation:
            evaluation.manager.Designation || evaluation.manager.designation,
        }
      : undefined,
    // Handle appraisalCycle and frequencyCalendar
    reviewCycle: evaluation.appraisalCycle
      ? {
          id: evaluation.appraisalCycle.Id || evaluation.appraisalCycle.id,
          name:
            evaluation.appraisalCycle.Code ||
            evaluation.appraisalCycle.code ||
            evaluation.appraisalCycle.Description ||
            "",
          description:
            evaluation.appraisalCycle.Description ||
            evaluation.appraisalCycle.description,
          fromDate:
            evaluation.appraisalCycle.FromDate ||
            evaluation.appraisalCycle.fromDate,
          toDate:
            evaluation.appraisalCycle.ToDate ||
            evaluation.appraisalCycle.toDate,
        }
      : undefined,
    frequencyCalendar: evaluation.frequencyCalendar
      ? {
          id:
            evaluation.frequencyCalendar.Id || evaluation.frequencyCalendar.id,
          code:
            evaluation.frequencyCalendar.Code ||
            evaluation.frequencyCalendar.code,
          description:
            evaluation.frequencyCalendar.Description ||
            evaluation.frequencyCalendar.description,
        }
      : undefined,
    questionnaires: evaluation.questionnaires
      ? evaluation.questionnaires.map((q: any) => ({
          id: q.Id || q.id,
          name: q.Name || q.name,
          description: q.Description || q.description,
          questions:
            typeof q.Questions === "string"
              ? JSON.parse(q.Questions)
              : q.Questions || q.questions,
        }))
      : undefined,
  });

  // Fetch evaluations filtered by active role:
  // - As Employee: show evaluations where user is the employee
  // - As Manager: show evaluations where user is the manager (meetings with their reporting members)
  const { data: evaluations = [], isLoading } = useQuery<
    EvaluationWithDetails[]
  >({
    queryKey: ["/api/evaluations", { includeQuestionnaires: "true" }],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        "/api/evaluations?includeQuestionnaires=true",
      );
      const data = await response.json();
      console.log("[Meetings] API Response data:", data);
      return data as EvaluationWithDetails[];
    },
    select: (data: any[]) => {
      // Normalize data from PascalCase to camelCase - no filtering, show all data
      const normalizedData = data.map(normalizeEvaluation);
      console.log(
        "[Meetings] All evaluations:",
        normalizedData.length,
        normalizedData,
      );
      return normalizedData;
    },
  });

  // Merge demo data with real data when in tour mode
  // Show demo data immediately in tour mode without waiting for action
  const baseMeetings = isTourMode
    ? [...evaluations, ...demoMeetings]
    : evaluations;

  const scheduleMeetingMutation = useMutation({
    mutationFn: async ({
      id,
      meetingDate,
    }: {
      id: string;
      meetingDate: Date;
    }) => {
      await apiRequest("PUT", `/api/evaluations/${id}`, {
        meetingScheduledAt: meetingDate,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evaluations"] });
      setIsScheduleModalOpen(false);
      toast({
        title: "Success",
        description: "Meeting scheduled successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to schedule meeting",
        variant: "destructive",
      });
    },
  });

  // Save meeting notes mutation (for managers)
  const saveNotesMutation = useMutation({
    mutationFn: async (data: {
      evaluationId: string;
      notesData: MeetingNotesData;
    }) => {
      const response = await apiRequest(
        "PUT",
        `/api/evaluations/${data.evaluationId}/meeting-notes`,
        data.notesData,
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evaluations"] });
      setIsNotesDialogOpen(false);
      setSelectedEvaluation(null);
      toast({
        title: "Notes Saved",
        description: "Meeting notes have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save notes",
        variant: "destructive",
      });
    },
  });

  const form = useForm({
    defaultValues: {
      meetingDate: "",
      meetingTime: "",
    },
  });

  const handleScheduleMeeting = (evaluation: EvaluationWithDetails) => {
    setSelectedEvaluation(evaluation);
    setIsScheduleModalOpen(true);
  };

  const handleAddNotes = (evaluation: EvaluationWithDetails) => {
    setSelectedEvaluation(evaluation);
    setNotesData({
      meetingNotes: evaluation.meetingNotes || "",
      finalRating: evaluation.overallRating || undefined,
      showNotesToEmployee: evaluation.showNotesToEmployee ?? false,
    });
    setIsNotesDialogOpen(true);
  };

  const onSubmitSchedule = (data: any) => {
    if (selectedEvaluation) {
      const meetingDateTime = new Date(
        `${data.meetingDate}T${data.meetingTime}`,
      );
      scheduleMeetingMutation.mutate({
        id: selectedEvaluation.id,
        meetingDate: meetingDateTime,
      });
    }
  };

  const getMeetingStatus = (evaluation: EvaluationWithDetails) => {
    if (evaluation.meetingCompletedAt) return "completed";
    if (evaluation.meetingScheduledAt) return "scheduled";
    return "not_scheduled";
  };

  const getMeetingStatusBadge = (evaluation: EvaluationWithDetails) => {
    const status = getMeetingStatus(evaluation);
    switch (status) {
      case "completed":
        return (
          <Badge variant="default">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "scheduled":
        return (
          <Badge variant="secondary">
            <CalendarCheck className="h-3 w-3 mr-1" />
            Scheduled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <CalendarX className="h-3 w-3 mr-1" />
            Not Scheduled
          </Badge>
        );
    }
  };

  const canScheduleMeeting = (evaluation: EvaluationWithDetails) => {
    // Can schedule if both evaluations are done and not yet scheduled
    return (
      !evaluation.meetingScheduledAt &&
      evaluation.selfEvaluationSubmittedAt &&
      evaluation.managerEvaluationSubmittedAt
    );
  };

  const canAddNotes = (evaluation: EvaluationWithDetails) => {
    // Manager can add notes after meeting is scheduled
    return (
      user?.id === evaluation.managerId &&
      evaluation.meetingScheduledAt &&
      !evaluation.finalizedAt
    );
  };

  const isManager = (evaluation: EvaluationWithDetails) => {
    return user?.id === evaluation.managerId;
  };

  // Show all evaluations that are ready for meetings (both evaluations submitted)
  const eligibleEvaluations = (baseMeetings || []).filter(
    (evaluation: EvaluationWithDetails) =>
      evaluation.selfEvaluationSubmittedAt &&
      evaluation.managerEvaluationSubmittedAt,
  );

  console.log(
    "[Meetings] Total evaluations after role filter:",
    (baseMeetings || []).length,
  );
  console.log(
    "[Meetings] Eligible evaluations (both submitted):",
    eligibleEvaluations.length,
  );
  console.log("[Meetings] Eligible evaluations details:", eligibleEvaluations);

  return (
    <RoleGuard allowedRoles={["employee", "manager"]}>
      <div className="space-y-6" data-testid="meetings">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              Performance Review Meetings
            </h1>
            <p className="text-muted-foreground">
              Schedule and manage one-on-one performance review meetings
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
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Meetings
                  </p>
                  <p
                    className="text-2xl font-bold"
                    data-testid="total-meetings"
                  >
                    {
                      (evaluations || []).filter(
                        (e: EvaluationWithDetails) =>
                          e.meetingScheduledAt || e.meetingCompletedAt,
                      ).length
                    }
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
                  <p className="text-sm font-medium text-muted-foreground">
                    Scheduled
                  </p>
                  <p
                    className="text-2xl font-bold"
                    data-testid="scheduled-meetings"
                  >
                    {
                      (evaluations || []).filter(
                        (e: EvaluationWithDetails) =>
                          e.meetingScheduledAt && !e.meetingCompletedAt,
                      ).length
                    }
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
                  <p className="text-sm font-medium text-muted-foreground">
                    Completed
                  </p>
                  <p
                    className="text-2xl font-bold"
                    data-testid="completed-meetings"
                  >
                    {
                      (evaluations || []).filter(
                        (e: EvaluationWithDetails) => e.meetingCompletedAt,
                      ).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meetings List */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Review Meetings</CardTitle>
            <CardDescription>
              Meetings for evaluations ready for discussion
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-4 animate-pulse"
                  >
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : eligibleEvaluations.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg mb-2">
                  No meetings ready to schedule
                </p>
                <p className="text-muted-foreground text-sm">
                  Meetings become available after both employee and manager
                  complete their evaluations
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {eligibleEvaluations.map(
                  (evaluation: EvaluationWithDetails) => (
                    <div
                      key={evaluation.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/20 transition-colors"
                      data-testid={`meeting-row-${evaluation.id}`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <p
                              className="font-medium"
                              data-testid={`meeting-participants-${evaluation.id}`}
                            >
                              {user?.id === evaluation.employeeId ? (
                                <>
                                  Meeting with {evaluation.manager?.firstName}{" "}
                                  {evaluation.manager?.lastName}
                                </>
                              ) : (
                                <>
                                  {evaluation.employee?.firstName}{" "}
                                  {evaluation.employee?.lastName} - Performance
                                  Review
                                </>
                              )}
                            </p>
                            {getMeetingStatusBadge(evaluation)}
                          </div>

                          {evaluation.meetingScheduledAt && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(
                                  evaluation.meetingScheduledAt,
                                ).toLocaleDateString()}{" "}
                                at{" "}
                                {new Date(
                                  evaluation.meetingScheduledAt,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          )}

                          {evaluation.meetingCompletedAt &&
                            evaluation.meetingNotes &&
                            (evaluation.showNotesToEmployee ||
                              user?.id === evaluation.managerId) && (
                              <div className="mt-2 p-3 bg-muted/30 rounded-lg">
                                <p className="text-sm font-medium mb-1">
                                  Meeting Notes:
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {evaluation.meetingNotes}
                                </p>
                              </div>
                            )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {!evaluation.meetingScheduledAt && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleScheduleMeeting(evaluation)}
                            data-testid={`schedule-meeting-${evaluation.id}`}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule
                          </Button>
                        )}

                        {evaluation.meetingScheduledAt &&
                          !evaluation.meetingCompletedAt &&
                          isManager(evaluation) && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAddNotes(evaluation)}
                              data-testid={`complete-review-${evaluation.id}`}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Complete Review
                            </Button>
                          )}

                        {canAddNotes(evaluation) &&
                          evaluation.meetingCompletedAt && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddNotes(evaluation)}
                              data-testid={`edit-notes-${evaluation.id}`}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Edit Notes
                            </Button>
                          )}

                        {evaluation.finalizedAt && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            data-testid={`meeting-finalized-${evaluation.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Finalized
                          </Button>
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule Meeting Modal */}
        <Dialog
          open={isScheduleModalOpen}
          onOpenChange={setIsScheduleModalOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule Meeting</DialogTitle>
              <DialogDescription>
                Schedule a one-on-one performance review meeting
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmitSchedule)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="meetingDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          min={new Date().toISOString().split("T")[0]}
                          data-testid="input-meeting-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meetingTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          data-testid="input-meeting-time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={scheduleMeetingMutation.isPending}
                    data-testid="submit-schedule-meeting"
                  >
                    Schedule Meeting
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Meeting Notes Dialog (Manager Only) */}
        <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Meeting Notes</DialogTitle>
              <DialogDescription>
                Add notes from your one-on-one meeting with{" "}
                {selectedEvaluation?.employee?.firstName}{" "}
                {selectedEvaluation?.employee?.lastName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Meeting Notes</Label>
                <Textarea
                  id="notes"
                  rows={8}
                  placeholder="Enter detailed notes from your meeting..."
                  value={notesData.meetingNotes}
                  onChange={(e) =>
                    setNotesData((prev) => ({
                      ...prev,
                      meetingNotes: e.target.value,
                    }))
                  }
                  data-testid="textarea-meeting-notes"
                />
              </div>
              <div>
                <Label htmlFor="updated-rating">
                  Update Final Rating (Optional)
                </Label>
                <Select
                  value={
                    notesData.finalRating
                      ? String(notesData.finalRating)
                      : undefined
                  }
                  onValueChange={(value) =>
                    setNotesData((prev) => ({
                      ...prev,
                      finalRating: value ? parseInt(value) : undefined,
                    }))
                  }
                >
                  <SelectTrigger data-testid="select-final-rating">
                    <SelectValue placeholder="Keep current rating or update" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Below Expectations</SelectItem>
                    <SelectItem value="2">
                      2 - Partially Meets Expectations
                    </SelectItem>
                    <SelectItem value="3">3 - Meets Expectations</SelectItem>
                    <SelectItem value="4">4 - Exceeds Expectations</SelectItem>
                    <SelectItem value="5">5 - Outstanding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Show Meeting Notes to Employee</Label>
                <RadioGroup
                  value={notesData.showNotesToEmployee ? "yes" : "no"}
                  onValueChange={(value) =>
                    setNotesData((prev) => ({
                      ...prev,
                      showNotesToEmployee: value === "yes",
                    }))
                  }
                  className="flex gap-4 mt-2"
                  data-testid="radio-show-notes"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="yes"
                      id="show-yes"
                      data-testid="radio-show-yes"
                    />
                    <Label
                      htmlFor="show-yes"
                      className="font-normal cursor-pointer"
                    >
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="no"
                      id="show-no"
                      data-testid="radio-show-no"
                    />
                    <Label
                      htmlFor="show-no"
                      className="font-normal cursor-pointer"
                    >
                      No
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsNotesDialogOpen(false)}
                data-testid="button-cancel-notes"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedEvaluation) {
                    saveNotesMutation.mutate({
                      evaluationId: selectedEvaluation.id,
                      notesData,
                    });
                  }
                }}
                disabled={saveNotesMutation.isPending}
                data-testid="button-save-notes"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Save Notes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
