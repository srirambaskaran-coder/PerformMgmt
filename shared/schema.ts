import { z } from "zod";

// ============================================
// ENUMS - Pure TypeScript enum types
// ============================================

// Role names - supporting both formats:
// - With underscores (for display/internal use): super_admin, hr_manager
// - Without underscores (for API payload): superadmin, hrmanager
export const UserRoles = [
  "super_admin",
  "admin",
  "hr_manager",
  "employee",
  "manager",
  // Also accept without underscores (API format)
  "superadmin",
  "hrmanager",
] as const;
export type UserRole = (typeof UserRoles)[number];

export const StatusValues = ["active", "inactive"] as const;
export type Status = (typeof StatusValues)[number];

export const CategoryValues = ["employee", "manager"] as const;
export type Category = (typeof CategoryValues)[number];

export const PublishTypeValues = ["now", "as_per_calendar"] as const;
export type PublishType = (typeof PublishTypeValues)[number];

export const AppraisalTypeValues = [
  "questionnaire_based",
  "kpi_based",
  "mbo_based",
  "okr_based",
] as const;
export type AppraisalType = (typeof AppraisalTypeValues)[number];

export const AppraisalCycleStatusValues = [
  "draft",
  "active",
  "closed",
  "cancelled",
] as const;
export type AppraisalCycleStatus = (typeof AppraisalCycleStatusValues)[number];

export const CalendarProviderValues = ["google", "outlook"] as const;
export type CalendarProvider = (typeof CalendarProviderValues)[number];

export const GoalStatusValues = [
  "on_track",
  "delayed",
  "completed",
  "not_started",
] as const;
export type GoalStatus = (typeof GoalStatusValues)[number];

// Feedback rating enum for 360 degree feedback
export const FeedbackRatingValues = [
  "excellent",
  "good",
  "average",
  "needs_improvement",
  "poor",
  "not_applicable",
] as const;
export type FeedbackRating = (typeof FeedbackRatingValues)[number];

// Feedback request status enum
export const FeedbackRequestStatusValues = [
  "pending",
  "submitted",
  "cancelled",
] as const;
export type FeedbackRequestStatus =
  (typeof FeedbackRequestStatusValues)[number];

// ============================================
// INTERFACES - Pure TypeScript types
// ============================================

// Session storage interface
export interface Session {
  sid: string;
  sess: Record<string, any>;
  expire: Date;
}

// User interface
export interface User {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  code?: string | null;
  designation?: string | null;
  department?: string | null;
  dateOfJoining?: Date | null;
  mobileNumber?: string | null;
  reportingManagerId?: string | null;
  locationId?: string | null;
  companyId?: string | null;
  levelId?: string | null;
  gradeId?: string | null;
  role?: UserRole | null;
  roles?: string[] | null;
  status?: Status | null;
  passwordHash?: string | null;
  createdById?: string | null;
}

export type SafeUser = Omit<User, "passwordHash">;

// Company interface
export interface Company {
  id: string;
  name: string;
  address?: string | null;
  clientContact?: string | null;
  email?: string | null;
  contactNumber?: string | null;
  gstNumber?: string | null;
  logoUrl?: string | null;
  url?: string | null;
  companyUrl?: string | null;
  status?: Status | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// Location interface
export interface Location {
  id: string;
  code: string;
  name: string;
  state?: string | null;
  country?: string | null;
  companyId?: string | null;
  status?: Status | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  createdById?: string | null;
}

// Questionnaire Template interface
export interface QuestionnaireTemplate {
  id: string;
  name: string;
  description?: string | null;
  targetRole: UserRole;
  applicableCategory?: Category | null;
  applicableLevelId?: string | null;
  applicableGradeId?: string | null;
  applicableLocationId?: string | null;
  sendOnMail?: boolean | null;
  questions: Record<string, any>[] | any;
  year?: number | null;
  companyId?: string | null;
  status?: Status | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  createdById?: string | null;
}

// Review Cycle interface
export interface ReviewCycle {
  id: string;
  name: string;
  description?: string | null;
  startDate: Date;
  endDate: Date;
  questionnaireTemplateId: string;
  status?: Status | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// Evaluation interface
export interface Evaluation {
  id: string;
  employeeId: string;
  managerId: string;
  reviewCycleId?: string | null;
  initiatedAppraisalId?: string | null;
  selfEvaluationData?: Record<string, any> | null;
  selfEvaluationSubmittedAt?: Date | null;
  managerEvaluationData?: Record<string, any> | null;
  managerEvaluationSubmittedAt?: Date | null;
  overallRating?: number | null;
  status?: string | null;
  meetingScheduledAt?: Date | null;
  meetingNotes?: string | null;
  showNotesToEmployee?: boolean | null;
  meetingCompletedAt?: Date | null;
  finalizedAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// Email Template interface
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  templateType: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// Email Config interface
export interface EmailConfig {
  id: string;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  isActive?: boolean | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// Registration interface
export interface Registration {
  id: string;
  name: string;
  companyName: string;
  designation: string;
  email: string;
  mobile: string;
  status?: string | null;
  notificationSent?: boolean | null;
  notes?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// Access Token interface
export interface AccessToken {
  id: string;
  token: string;
  userId: string;
  evaluationId: string;
  tokenType: string;
  expiresAt: Date;
  usedAt?: Date | null;
  isActive?: boolean | null;
  createdAt?: Date | null;
}

// Calendar Credential interface
export interface CalendarCredential {
  id: string;
  companyId: string;
  provider: CalendarProvider;
  clientId: string;
  clientSecret: string;
  accessToken?: string | null;
  refreshToken: string;
  expiresAt?: Date | null;
  scope?: string | null;
  isActive?: boolean | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// Level interface
export interface Level {
  id: string;
  code: string;
  description: string;
  companyId?: string | null;
  status?: Status | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  createdById: string;
}

// Grade interface
export interface Grade {
  id: string;
  code: string;
  description: string;
  companyId?: string | null;
  status?: Status | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  createdById: string;
}

// Department interface
export interface Department {
  id: string;
  code: string;
  description: string;
  companyId?: string | null;
  status?: Status | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  createdById: string;
}

// Appraisal Cycle interface
export interface AppraisalCycle {
  id: string;
  code: string;
  description: string;
  fromDate: Date;
  toDate: Date;
  companyId?: string | null;
  status?: Status | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  createdById: string;
}

// Review Frequency interface
export interface ReviewFrequency {
  id: string;
  code: string;
  description: string;
  companyId?: string | null;
  status?: Status | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  createdById: string;
}

// Frequency Calendar interface
export interface FrequencyCalendar {
  id: string;
  code: string;
  description: string;
  appraisalCycleId: string;
  reviewFrequencyId: string;
  companyId?: string | null;
  status?: Status | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  createdById: string;
}

// Frequency Calendar Details interface
export interface FrequencyCalendarDetails {
  id: string;
  frequencyCalendarId: string;
  displayName: string;
  startDate: Date;
  endDate: Date;
  companyId?: string | null;
  status?: Status | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  createdById: string;
}

// Publish Questionnaire interface
export interface PublishQuestionnaire {
  id: string;
  code: string;
  displayName: string;
  templateId: string;
  frequencyCalendarId?: string | null;
  companyId?: string | null;
  status?: Status | null;
  publishType?: PublishType | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  createdById: string;
}

// Initiated Appraisal interface
export interface InitiatedAppraisal {
  id: string;
  appraisalGroupId: string;
  appraisalType: AppraisalType;
  questionnaireTemplateIds?: string[] | null;
  documentUrl?: string | null;
  frequencyCalendarId?: string | null;
  daysToInitiate?: number | null;
  daysToClose?: number | null;
  numberOfReminders?: number | null;
  excludeTenureLessThanYear?: boolean | null;
  excludedEmployeeIds?: string[] | null;
  status?: AppraisalCycleStatus | null;
  makePublic?: boolean | null;
  publishType?: PublishType | null;
  createdById: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// Initiated Appraisal Detail Timing interface
export interface InitiatedAppraisalDetailTiming {
  id: string;
  initiatedAppraisalId: string;
  frequencyCalendarDetailId: string;
  daysToInitiate: number;
  daysToClose: number;
  numberOfReminders: number;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// Scheduled Appraisal Task interface
export interface ScheduledAppraisalTask {
  id: string;
  initiatedAppraisalId: string;
  frequencyCalendarDetailId: string;
  scheduledDate: Date;
  status: string;
  executedAt?: Date | null;
  error?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// Appraisal Group interface
export interface AppraisalGroup {
  id: string;
  name: string;
  description?: string | null;
  createdById: string;
  companyId?: string | null;
  status?: Status | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// Appraisal Group Member interface
export interface AppraisalGroupMember {
  id: string;
  appraisalGroupId: string;
  userId: string;
  addedById: string;
  addedAt?: Date | null;
}

// Development Goal interface
export interface DevelopmentGoal {
  id: string;
  evaluationId: string;
  employeeId: string;
  description: string;
  plannedOutcome: string;
  targetDate: Date;
  progress?: number | null;
  status?: GoalStatus | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// Feedback Request interface for 360 degree feedback
export interface FeedbackRequest {
  id: string;
  requesterId: string; // Manager who requested the feedback
  reviewerId?: string | null; // Employee who needs to provide feedback (null for external reviewers)
  externalEmail?: string | null; // Email for external reviewers
  subjectId: string; // Employee being reviewed (the manager's team member)
  evaluationId?: string | null; // Optional link to evaluation
  appraisalCycleId?: string | null;
  status?: FeedbackRequestStatus | null;
  // Feedback response fields (filled when submitted)
  relationshipWithPeer?: string | null;
  collaborationRating?: FeedbackRating | null;
  communicationRating?: FeedbackRating | null;
  reliabilityRating?: FeedbackRating | null;
  problemSolvingRating?: FeedbackRating | null;
  ownershipRating?: FeedbackRating | null;
  opennessToFeedbackRating?: FeedbackRating | null;
  conflictHandlingRating?: FeedbackRating | null;
  jobSpecificCompetencies?: string | null;
  strengths?: string | null;
  developmentAreas?: string | null;
  overallSummary?: string | null;
  recommendedRating?: number | null; // 1-5
  submittedAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// ============================================
// INSERT TYPES - Types for creating records
// ============================================

export type InsertUser = Omit<
  User,
  "id" | "createdAt" | "updatedAt" | "passwordHash" | "createdById"
> & {
  password?: string;
  confirmPassword?: string;
};

export type InsertCompany = Omit<Company, "id" | "createdAt" | "updatedAt">;
export type InsertLocation = Omit<Location, "id" | "createdAt" | "updatedAt">;
export type InsertQuestionnaireTemplate = Omit<
  QuestionnaireTemplate,
  "id" | "createdAt" | "updatedAt"
>;
export type InsertReviewCycle = Omit<
  ReviewCycle,
  "id" | "createdAt" | "updatedAt"
>;
export type InsertEvaluation = Omit<
  Evaluation,
  "id" | "createdAt" | "updatedAt"
>;
export type InsertEmailTemplate = Omit<
  EmailTemplate,
  "id" | "createdAt" | "updatedAt"
>;
export type InsertEmailConfig = Omit<
  EmailConfig,
  "id" | "createdAt" | "updatedAt"
>;
export type InsertRegistration = Omit<
  Registration,
  "id" | "createdAt" | "updatedAt" | "notificationSent" | "status"
>;
export type InsertAccessToken = Omit<AccessToken, "id" | "createdAt">;
export type InsertCalendarCredential = Omit<
  CalendarCredential,
  "id" | "createdAt" | "updatedAt"
>;
export type InsertLevel = Omit<
  Level,
  "id" | "createdAt" | "updatedAt" | "createdById"
>;
export type InsertGrade = Omit<
  Grade,
  "id" | "createdAt" | "updatedAt" | "createdById"
>;
export type InsertDepartment = Omit<
  Department,
  "id" | "createdAt" | "updatedAt" | "createdById"
>;
export type InsertAppraisalCycle = Omit<
  AppraisalCycle,
  "id" | "createdAt" | "updatedAt" | "createdById"
>;
export type InsertReviewFrequency = Omit<
  ReviewFrequency,
  "id" | "createdAt" | "updatedAt" | "createdById"
>;
export type InsertFrequencyCalendar = Omit<
  FrequencyCalendar,
  "id" | "createdAt" | "updatedAt" | "createdById"
>;
export type InsertFrequencyCalendarDetails = Omit<
  FrequencyCalendarDetails,
  "id" | "createdAt" | "updatedAt" | "createdById"
>;
export type InsertPublishQuestionnaire = Omit<
  PublishQuestionnaire,
  "id" | "createdAt" | "updatedAt" | "createdById"
>;
export type InsertAppraisalGroup = Omit<
  AppraisalGroup,
  "id" | "createdAt" | "updatedAt"
>;
export type InsertAppraisalGroupMember = Omit<
  AppraisalGroupMember,
  "id" | "addedAt"
>;
export type InsertInitiatedAppraisal = Omit<
  InitiatedAppraisal,
  "id" | "createdAt" | "updatedAt"
>;
export type InsertInitiatedAppraisalDetailTiming = Omit<
  InitiatedAppraisalDetailTiming,
  "id" | "createdAt" | "updatedAt"
>;
export type InsertScheduledAppraisalTask = Omit<
  ScheduledAppraisalTask,
  "id" | "createdAt" | "updatedAt"
>;
export type InsertDevelopmentGoal = Omit<
  DevelopmentGoal,
  "id" | "createdAt" | "updatedAt" | "status"
>;

// Feedback Request insert type (for creating new feedback requests)
export type InsertFeedbackRequest = Omit<
  FeedbackRequest,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "submittedAt"
  | "status"
  | "relationshipWithPeer"
  | "collaborationRating"
  | "communicationRating"
  | "reliabilityRating"
  | "problemSolvingRating"
  | "ownershipRating"
  | "opennessToFeedbackRating"
  | "conflictHandlingRating"
  | "jobSpecificCompetencies"
  | "strengths"
  | "developmentAreas"
  | "overallSummary"
  | "recommendedRating"
>;

// Submit Feedback type (for submitting feedback response)
export interface SubmitFeedback {
  relationshipWithPeer: string;
  collaborationRating:
    | "excellent"
    | "good"
    | "average"
    | "needs_improvement"
    | "poor";
  communicationRating:
    | "excellent"
    | "good"
    | "average"
    | "needs_improvement"
    | "poor";
  reliabilityRating:
    | "excellent"
    | "good"
    | "average"
    | "needs_improvement"
    | "poor";
  problemSolvingRating:
    | "excellent"
    | "good"
    | "average"
    | "needs_improvement"
    | "poor";
  ownershipRating:
    | "excellent"
    | "good"
    | "average"
    | "needs_improvement"
    | "poor"
    | "not_applicable";
  opennessToFeedbackRating:
    | "excellent"
    | "good"
    | "average"
    | "needs_improvement"
    | "poor";
  conflictHandlingRating:
    | "excellent"
    | "good"
    | "average"
    | "needs_improvement"
    | "poor"
    | "not_applicable";
  jobSpecificCompetencies: string;
  strengths: string;
  developmentAreas: string;
  overallSummary: string;
  recommendedRating: number;
}

// ============================================
// ZOD VALIDATION SCHEMAS - Pure Zod without drizzle-zod
// ============================================

// User schema
export const insertUserSchema = z
  .object({
    email: z
      .string()
      .email("Please enter a valid email address")
      .optional()
      .nullable()
      .or(z.literal("")),
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    profileImageUrl: z.string().optional().nullable(),
    code: z.string().optional().nullable(),
    designation: z.string().optional().nullable(),
    department: z.string().optional().nullable(),
    dateOfJoining: z.preprocess(
      (val) => (val ? new Date(val as string) : null),
      z.date().nullable().optional(),
    ),
    mobileNumber: z
      .string()
      .regex(/^[0-9]{10}$/, "Mobile number must be exactly 10 digits")
      .optional()
      .nullable()
      .or(z.literal("")),
    reportingManagerId: z.string().optional().nullable(),
    locationId: z.string().optional().nullable(),
    companyId: z.string().optional().nullable(),
    levelId: z.string().optional().nullable(),
    gradeId: z.string().optional().nullable(),
    role: z.enum(UserRoles).optional().nullable(),
    roles: z.array(z.enum(UserRoles)).optional().default(["employee"]),
    status: z.enum(StatusValues).optional().nullable(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.password || data.confirmPassword) {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    },
  );

// Company schema
export const insertCompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  address: z.string().optional().nullable(),
  clientContact: z.string().optional().nullable(),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .nullable()
    .or(z.literal("")),
  contactNumber: z
    .string()
    .regex(/^[0-9]{10}$/, "Contact number must be exactly 10 digits")
    .optional()
    .nullable()
    .or(z.literal("")),
  gstNumber: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  url: z
    .string()
    .url("Invalid URL format")
    .optional()
    .nullable()
    .or(z.literal("")),
  companyUrl: z.string().optional().nullable(),
  status: z.enum(StatusValues).optional().nullable(),
});

// Location schema
export const insertLocationSchema = z.object({
  code: z.string().min(1, "Location code is required"),
  name: z.string().min(1, "Location name is required"),
  locationType: z.number().optional().nullable(),
  gstNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  isBillingAddress: z.boolean().optional().nullable(),
  isShippingAddress: z.boolean().optional().nullable(),
  isPrimaryLocation: z.boolean().optional().nullable(),
  companyId: z.string().optional().nullable(),
  status: z.enum(StatusValues).optional().nullable(),
  createdById: z.string().optional().nullable(),
});

// Questionnaire Template schema
export const insertQuestionnaireTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  targetRole: z.enum(UserRoles).optional().nullable(),
  applicableCategory: z.enum(CategoryValues).optional().nullable(),
  applicableLevelId: z.string().optional().nullable(),
  applicableGradeId: z.string().optional().nullable(),
  applicableLocationId: z.string().optional().nullable(),
  sendOnMail: z.boolean().optional().default(false),
  questions: z.any(),
  year: z.number().optional().nullable(),
  companyId: z.string().optional().nullable(),
  status: z.enum(StatusValues).optional().nullable(),
  createdById: z.string().optional().nullable(),
});

// Review Cycle schema
export const insertReviewCycleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  startDate: z.preprocess((val) => new Date(val as string), z.date()),
  endDate: z.preprocess((val) => new Date(val as string), z.date()),
  questionnaireTemplateId: z.string().min(1),
  status: z.enum(StatusValues).optional().nullable(),
});

// Evaluation schema
export const insertEvaluationSchema = z.object({
  employeeId: z.string().min(1),
  managerId: z.string().min(1),
  reviewCycleId: z.string().optional().nullable(),
  initiatedAppraisalId: z.string().optional().nullable(),
  selfEvaluationData: z.any().optional().nullable(),
  selfEvaluationSubmittedAt: z.preprocess(
    (val) => (val ? new Date(val as string) : null),
    z.date().nullable().optional(),
  ),
  managerEvaluationData: z.any().optional().nullable(),
  managerEvaluationSubmittedAt: z.preprocess(
    (val) => (val ? new Date(val as string) : null),
    z.date().nullable().optional(),
  ),
  overallRating: z.number().optional().nullable(),
  status: z.string().optional().default("not_started"),
  meetingScheduledAt: z.preprocess(
    (val) => (val ? new Date(val as string) : null),
    z.date().nullable().optional(),
  ),
  meetingNotes: z.string().optional().nullable(),
  showNotesToEmployee: z.boolean().optional().default(false),
  meetingCompletedAt: z.preprocess(
    (val) => (val ? new Date(val as string) : null),
    z.date().nullable().optional(),
  ),
  finalizedAt: z.preprocess(
    (val) => (val ? new Date(val as string) : null),
    z.date().nullable().optional(),
  ),
});

// Email Template schema
export const insertEmailTemplateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  templateType: z.string().min(1),
});

// Email Config schema
export const insertEmailConfigSchema = z.object({
  smtpHost: z.string().min(1),
  smtpPort: z.number().min(1).max(65535),
  smtpUsername: z.string().min(1),
  smtpPassword: z.string().min(1),
  fromEmail: z.string().email(),
  fromName: z.string().min(1),
  isActive: z.boolean().optional().default(true),
});

// Registration schema
export const insertRegistrationSchema = z.object({
  name: z.string().min(1),
  companyName: z.string().min(1),
  designation: z.string().min(1),
  email: z.string().email(),
  mobile: z.string().min(1),
  notes: z.string().optional().nullable(),
});

// Access Token schema
export const insertAccessTokenSchema = z.object({
  token: z.string().min(1),
  userId: z.string().min(1),
  evaluationId: z.string().min(1),
  tokenType: z.string().min(1),
  expiresAt: z.preprocess((val) => new Date(val as string), z.date()),
  usedAt: z.preprocess(
    (val) => (val ? new Date(val as string) : null),
    z.date().nullable().optional(),
  ),
  isActive: z.boolean().optional().default(true),
});

// Calendar Credential schema
export const insertCalendarCredentialSchema = z.object({
  companyId: z.string().min(1),
  provider: z.enum(CalendarProviderValues),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  accessToken: z.string().optional().nullable(),
  refreshToken: z.string().min(1),
  expiresAt: z.preprocess(
    (val) => (val ? new Date(val as string) : null),
    z.date().nullable().optional(),
  ),
  scope: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

// Level schema
export const insertLevelSchema = z.object({
  code: z.string().min(1),
  description: z.string().min(1),
  companyId: z.string().optional().nullable(),
  status: z.enum(StatusValues).optional().nullable(),
});

// Grade schema
export const insertGradeSchema = z.object({
  code: z.string().min(1),
  description: z.string().min(1),
  companyId: z.string().optional().nullable(),
  status: z.enum(StatusValues).optional().nullable(),
});

// Department schema
export const insertDepartmentSchema = z.object({
  code: z.string().min(1),
  description: z.string().min(1),
  companyId: z.string().optional().nullable(),
  status: z.enum(StatusValues).optional().nullable(),
});

// Appraisal Cycle schema
export const insertAppraisalCycleSchema = z.object({
  code: z.string().min(1),
  description: z.string().min(1),
  fromDate: z.preprocess((val) => new Date(val as string), z.date()),
  toDate: z.preprocess((val) => new Date(val as string), z.date()),
  companyId: z.string().optional().nullable(),
  status: z.enum(StatusValues).optional().nullable(),
});

// Review Frequency schema
export const insertReviewFrequencySchema = z.object({
  code: z.string().min(1),
  description: z.string().min(1),
  companyId: z.string().optional().nullable(),
  status: z.enum(StatusValues).optional().nullable(),
});

// Frequency Calendar schema
export const insertFrequencyCalendarSchema = z.object({
  code: z.string().min(1),
  description: z.string().min(1),
  appraisalCycleId: z.string().min(1),
  reviewFrequencyId: z.string().min(1),
  companyId: z.string().optional().nullable(),
  status: z.enum(StatusValues).optional().nullable(),
});

// Frequency Calendar Details schema
export const insertFrequencyCalendarDetailsSchema = z.object({
  frequencyCalendarId: z.string().min(1),
  displayName: z.string().min(1),
  startDate: z.preprocess((val) => new Date(val as string), z.date()),
  endDate: z.preprocess((val) => new Date(val as string), z.date()),
  companyId: z.string().optional().nullable(),
  status: z.enum(StatusValues).optional().nullable(),
});

// Publish Questionnaire schema
export const insertPublishQuestionnaireSchema = z.object({
  code: z.string().min(1),
  displayName: z.string().min(1),
  templateId: z.string().min(1),
  frequencyCalendarId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  status: z.enum(StatusValues).optional().nullable(),
  publishType: z.enum(PublishTypeValues).optional().nullable(),
});

// Appraisal Group schema
export const insertAppraisalGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  createdById: z.string().min(1),
  companyId: z.string().optional().nullable(),
  status: z.enum(StatusValues).optional().nullable(),
});

// Appraisal Group Member schema
export const insertAppraisalGroupMemberSchema = z.object({
  appraisalGroupId: z.string().min(1),
  userId: z.string().min(1),
  addedById: z.string().min(1),
});

// Initiated Appraisal schema
export const insertInitiatedAppraisalSchema = z.object({
  appraisalGroupId: z.string().min(1),
  appraisalType: z.enum(AppraisalTypeValues),
  questionnaireTemplateIds: z.array(z.string()).optional().nullable(),
  documentUrl: z.string().optional().nullable(),
  frequencyCalendarId: z.string().optional().nullable(),
  daysToInitiate: z.number().optional().default(0),
  daysToClose: z.number().optional().default(30),
  numberOfReminders: z.number().min(1).max(10).optional().default(3),
  excludeTenureLessThanYear: z.boolean().optional().default(false),
  excludedEmployeeIds: z.array(z.string()).optional().nullable(),
  status: z.enum(AppraisalCycleStatusValues).optional().default("draft"),
  makePublic: z.boolean().optional().default(false),
  publishType: z.enum(PublishTypeValues).optional().default("now"),
  createdById: z.string().min(1),
});

// Initiated Appraisal Detail Timing schema
export const insertInitiatedAppraisalDetailTimingSchema = z.object({
  initiatedAppraisalId: z.string().min(1),
  frequencyCalendarDetailId: z.string().min(1),
  daysToInitiate: z.number().default(0),
  daysToClose: z.number().default(30),
  numberOfReminders: z.number().default(3),
});

// Scheduled Appraisal Task schema
export const insertScheduledAppraisalTaskSchema = z.object({
  initiatedAppraisalId: z.string().min(1),
  frequencyCalendarDetailId: z.string().min(1),
  scheduledDate: z.preprocess((val) => new Date(val as string), z.date()),
  status: z.string().default("pending"),
  executedAt: z.preprocess(
    (val) => (val ? new Date(val as string) : null),
    z.date().nullable().optional(),
  ),
  error: z.string().optional().nullable(),
});

// Development Goal schema
export const insertDevelopmentGoalSchema = z.object({
  evaluationId: z.string().min(1),
  employeeId: z.string().min(1),
  description: z.string().min(1),
  plannedOutcome: z.string().min(1),
  targetDate: z.preprocess((val) => new Date(val as string), z.date()),
  progress: z.number().min(0).max(100).optional().default(0),
});

// Feedback request schemas
const feedbackRatingSchema = z.enum([
  "excellent",
  "good",
  "average",
  "needs_improvement",
  "poor",
]);
const feedbackRatingWithNASchema = z.enum([
  "excellent",
  "good",
  "average",
  "needs_improvement",
  "poor",
  "not_applicable",
]);

export const insertFeedbackRequestSchema = z.object({
  appraisalId: z.string().min(1, "Appraisal ID is required"),
  requesterId: z.string().min(1, "Requester ID is required"),
  subjectEmployeeId: z.string().min(1, "Subject employee ID is required"),
  respondentEmployeeId: z.string().optional().nullable(),
  externalEmail: z.string().email().optional().nullable(),
  dueDate: z.preprocess((val) => new Date(val as string), z.date()),
});

export const submitFeedbackSchema = z.object({
  relationshipWithPeer: z
    .string()
    .min(1, "Please describe your relationship with this employee"),
  collaborationRating: feedbackRatingSchema,
  communicationRating: feedbackRatingSchema,
  reliabilityRating: feedbackRatingSchema,
  problemSolvingRating: feedbackRatingSchema,
  ownershipRating: feedbackRatingWithNASchema,
  opennessToFeedbackRating: feedbackRatingSchema,
  conflictHandlingRating: feedbackRatingWithNASchema,
  jobSpecificCompetencies: z
    .string()
    .min(1, "Please describe their job-specific competencies"),
  strengths: z.string().min(1, "Please describe their strengths"),
  developmentAreas: z.string().min(1, "Please describe areas for development"),
  overallSummary: z.string().min(1, "Please provide an overall summary"),
  recommendedRating: z.number().min(1).max(5),
});

// Update schema for development goals
export const updateDevelopmentGoalSchema = z
  .object({
    description: z.string().min(1).optional(),
    plannedOutcome: z.string().min(1).optional(),
    targetDate: z.preprocess(
      (val) => (val ? new Date(val as string) : undefined),
      z.date().optional(),
    ),
    progress: z.number().min(0).max(100).optional(),
  })
  .strict();

// Update user schema
export const updateUserSchema = z
  .object({
    email: z.string().email().optional().nullable(),
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    profileImageUrl: z.string().optional().nullable(),
    code: z.string().optional().nullable(),
    designation: z.string().optional().nullable(),
    department: z.string().optional().nullable(),
    dateOfJoining: z.preprocess(
      (val) => (val ? new Date(val as string) : null),
      z.date().nullable().optional(),
    ),
    mobileNumber: z.string().optional().nullable(),
    reportingManagerId: z.string().optional().nullable(),
    locationId: z.string().optional().nullable(),
    companyId: z.string().optional().nullable(),
    levelId: z.string().optional().nullable(),
    gradeId: z.string().optional().nullable(),
    role: z.enum(UserRoles).optional().nullable(),
    roles: z.array(z.enum(UserRoles)).optional(),
    status: z.enum(StatusValues).optional().nullable(),
  })
  .partial()
  .strict();

// Password update schema
export const passwordUpdateSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Role update schema
export const roleUpdateSchema = z
  .object({
    role: z.enum(UserRoles).optional(),
    roles: z.array(z.enum(UserRoles)).optional(),
  })
  .strict();

// Send Reminder Request schema
export const sendReminderRequestSchema = z
  .object({
    employeeId: z.string().min(1, "Employee ID is required"),
    initiatedAppraisalId: z
      .string()
      .min(1, "Initiated Appraisal ID is required"),
  })
  .strict();

// Upsert user schema for Replit Auth
export const upsertUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  profileImageUrl: z.string().optional().nullable(),
});

// Export type inference from schemas
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type UpdateDevelopmentGoal = z.infer<typeof updateDevelopmentGoalSchema>;
