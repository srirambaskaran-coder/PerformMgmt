/**
 * CLEAN STORAGE IMPLEMENTATION (MSSQL SP WRAPPERS)
 * Maps PascalCase result columns from stored procedures to camelCase domain types.
 * Only core entities (User / Company / Location / QuestionnaireTemplate) fully implemented now.
 * Remaining methods stubbed to unblock build; will be incrementally migrated.
 */

import { getPool } from "./mssql";
import bcrypt from "bcrypt";
import type {
  User,
  SafeUser,
  UpsertUser,
  InsertUser,
  Company,
  InsertCompany,
  Location,
  InsertLocation,
  QuestionnaireTemplate,
  InsertQuestionnaireTemplate,
  ReviewCycle,
  InsertReviewCycle,
  Evaluation,
  InsertEvaluation,
  EmailTemplate,
  InsertEmailTemplate,
  EmailConfig,
  InsertEmailConfig,
  Registration,
  InsertRegistration,
  Level,
  InsertLevel,
  Grade,
  InsertGrade,
  Department,
  InsertDepartment,
  AppraisalCycle,
  InsertAppraisalCycle,
  ReviewFrequency,
  InsertReviewFrequency,
  FrequencyCalendar,
  InsertFrequencyCalendar,
  FrequencyCalendarDetails,
  InsertFrequencyCalendarDetails,
  PublishQuestionnaire,
  InsertPublishQuestionnaire,
  AppraisalGroup,
  InsertAppraisalGroup,
  AppraisalGroupMember,
  InsertAppraisalGroupMember,
  InitiatedAppraisal,
  InsertInitiatedAppraisal,
  InitiatedAppraisalDetailTiming,
  InsertInitiatedAppraisalDetailTiming,
  ScheduledAppraisalTask,
  InsertScheduledAppraisalTask,
  AccessToken,
  InsertAccessToken,
  CalendarCredential,
  InsertCalendarCredential,
} from "@shared/schema";
import {
  saveInitiatedAppraisalAugmentation,
  getInitiatedAppraisalAugmentation,
  mergeInitiatedAppraisal,
} from "./augmentationStore";

// ---------- Mapping Helpers ----------
function parseRoles(raw: any): string[] | null {
  const r = raw.Roles ?? raw.roles;
  if (!r) return null;
  if (Array.isArray(r)) return r as string[];
  try {
    return JSON.parse(r);
  } catch {
    return null;
  }
}

function mapRawUser(raw: any): User {
  return {
    id: raw.Id ?? raw.id,
    email: raw.Email ?? raw.email,
    firstName: raw.FirstName ?? raw.first_name ?? raw.firstName,
    lastName: raw.LastName ?? raw.last_name ?? raw.lastName,
    profileImageUrl:
      raw.ProfileImageUrl ??
      raw.profile_image_url ??
      raw.profileImageUrl ??
      null,
    createdAt: raw.CreatedAt ?? raw.created_at ?? raw.createdAt,
    updatedAt: raw.UpdatedAt ?? raw.updated_at ?? raw.updatedAt,
    code: raw.Code ?? raw.code ?? null,
    designation: raw.Designation ?? raw.designation ?? null,
    dateOfJoining:
      raw.DateOfJoining ?? raw.date_of_joining ?? raw.dateOfJoining ?? null,
    mobileNumber:
      raw.MobileNumber ?? raw.mobile_number ?? raw.mobileNumber ?? null,
    reportingManagerId:
      raw.ReportingManagerId ??
      raw.reporting_manager_id ??
      raw.reportingManagerId ??
      null,
    locationId: raw.LocationId ?? raw.location_id ?? raw.locationId ?? null,
    companyId: raw.CompanyId ?? raw.company_id ?? raw.companyId ?? null,
    role: raw.Role ?? raw.role,
    status: raw.Status ?? raw.status,
    department: raw.Department ?? raw.department ?? null,
    roles: parseRoles(raw),
    passwordHash:
      raw.PasswordHash ?? raw.password_hash ?? raw.passwordHash ?? null,
    createdById:
      raw.CreatedById ?? raw.created_by_id ?? raw.createdById ?? null,
    levelId: raw.LevelId ?? raw.level_id ?? raw.levelId ?? null,
    gradeId: raw.GradeId ?? raw.grade_id ?? raw.gradeId ?? null,
  } as User;
}

function sanitizeUser(user: User): SafeUser {
  const { passwordHash, ...rest } = user;
  return rest;
}

function sanitizeUsersFromRaw(rawRows: any[]): SafeUser[] {
  return rawRows.map((r) => sanitizeUser(mapRawUser(r)));
}

function mapRawCompany(raw: any): Company {
  return {
    id: raw.Id ?? raw.id,
    name: raw.Name ?? raw.name,
    address: raw.Address ?? raw.address ?? null,
    clientContact:
      raw.ClientContact ?? raw.client_contact ?? raw.clientContact ?? null,
    email: raw.Email ?? raw.email ?? null,
    contactNumber:
      raw.ContactNumber ?? raw.contact_number ?? raw.contactNumber ?? null,
    gstNumber: raw.GstNumber ?? raw.gst_number ?? raw.gstNumber ?? null,
    logoUrl: raw.LogoUrl ?? raw.logo_url ?? raw.logoUrl ?? null,
    status: raw.Status ?? raw.status ?? "active",
    createdAt: raw.CreatedAt ?? raw.created_at ?? raw.createdAt,
    updatedAt: raw.UpdatedAt ?? raw.updated_at ?? raw.updatedAt,
    url: raw.Url ?? raw.url ?? null,
    companyUrl: raw.CompanyUrl ?? raw.company_url ?? raw.companyUrl ?? null,
  } as Company;
}

function mapRawLocation(raw: any): Location {
  return {
    id: raw.Id ?? raw.id,
    code: raw.Code ?? raw.code ?? null,
    name: raw.Name ?? raw.name,
    state: raw.State ?? raw.state ?? null,
    country: raw.Country ?? raw.country ?? null,
    status: raw.Status ?? raw.status ?? "active",
    createdAt: raw.CreatedAt ?? raw.created_at ?? raw.createdAt,
    updatedAt: raw.UpdatedAt ?? raw.updated_at ?? raw.updatedAt,
  } as Location;
}

function mapRawQuestionnaireTemplate(raw: any): QuestionnaireTemplate {
  let questionsParsed: any = raw.Questions ?? raw.questions;
  if (typeof questionsParsed === "string") {
    try {
      questionsParsed = JSON.parse(questionsParsed);
    } catch {
      /* ignore */
    }
  }
  return {
    id: raw.Id ?? raw.id,
    name: raw.Name ?? raw.name,
    description: raw.Description ?? raw.description ?? null,
    targetRole: raw.TargetRole ?? raw.targetRole ?? null,
    applicableCategory:
      raw.ApplicableCategory ?? raw.applicableCategory ?? null,
    applicableLevelId: raw.ApplicableLevelId ?? raw.applicableLevelId ?? null,
    applicableGradeId: raw.ApplicableGradeId ?? raw.applicableGradeId ?? null,
    applicableLocationId:
      raw.ApplicableLocationId ?? raw.applicableLocationId ?? null,
    sendOnMail: raw.SendOnMail ?? raw.sendOnMail ?? false,
    questions: questionsParsed ?? null,
    year: raw.Year ?? raw.year ?? null,
    status: raw.Status ?? raw.status ?? "active",
    createdAt: raw.CreatedAt ?? raw.created_at ?? raw.createdAt,
    updatedAt: raw.UpdatedAt ?? raw.updated_at ?? raw.updatedAt,
    createdById: raw.CreatedById ?? raw.createdById ?? null,
  } as QuestionnaireTemplate;
}

function mapRawEmailTemplate(raw: any): EmailTemplate {
  return {
    id: raw.Id ?? raw.id,
    name: raw.Name ?? raw.name,
    subject: raw.Subject ?? raw.subject ?? null,
    body: raw.Body ?? raw.body ?? null,
    templateType:
      raw.TemplateType ?? raw.template_type ?? raw.templateType ?? null,
    createdAt: raw.CreatedAt ?? raw.created_at ?? raw.createdAt,
    updatedAt: raw.UpdatedAt ?? raw.updated_at ?? raw.updatedAt,
  } as EmailTemplate;
}

function mapRawEmailConfig(raw: any): EmailConfig {
  return {
    id: raw.Id ?? raw.id,
    smtpHost: raw.SmtpHost ?? raw.smtp_host ?? raw.smtpHost ?? null,
    smtpPort: raw.SmtpPort ?? raw.smtp_port ?? raw.smtpPort ?? null,
    smtpUsername:
      raw.SmtpUsername ?? raw.smtp_username ?? raw.smtpUsername ?? null,
    smtpPassword:
      raw.SmtpPassword ?? raw.smtp_password ?? raw.smtpPassword ?? null,
    fromEmail: raw.FromEmail ?? raw.from_email ?? raw.fromEmail ?? null,
    fromName: raw.FromName ?? raw.from_name ?? raw.fromName ?? null,
    isActive: raw.IsActive ?? raw.is_active ?? raw.isActive ?? false,
    createdAt: raw.CreatedAt ?? raw.created_at ?? raw.createdAt,
    updatedAt: raw.UpdatedAt ?? raw.updated_at ?? raw.updatedAt,
  } as EmailConfig;
}

function mapRawRegistration(raw: any): Registration {
  return {
    id: raw.Id ?? raw.id,
    name: raw.Name ?? raw.name,
    companyName: raw.CompanyName ?? raw.companyName ?? null,
    designation: raw.Designation ?? raw.designation ?? null,
    email: raw.Email ?? raw.email ?? null,
    mobile: raw.Mobile ?? raw.mobile ?? null,
    notes: raw.Notes ?? raw.notes ?? null,
    notificationSent: raw.NotificationSent ?? raw.notificationSent ?? false,
    createdAt: raw.CreatedAt ?? raw.created_at ?? raw.createdAt,
    updatedAt: raw.UpdatedAt ?? raw.updated_at ?? raw.updatedAt,
  } as Registration;
}

function mapRawAccessToken(raw: any): AccessToken {
  return {
    id: raw.Id ?? raw.id,
    token: raw.Token ?? raw.token,
    tokenType: raw.TokenType ?? raw.tokenType ?? raw.token_type ?? "generic",
    userId: raw.UserId ?? raw.user_id ?? raw.userId ?? "",
    evaluationId:
      raw.EvaluationId ?? raw.evaluation_id ?? raw.evaluationId ?? "",
    expiresAt: raw.ExpiresAt ?? raw.expires_at ?? raw.expiresAt ?? null,
    usedAt: raw.UsedAt ?? raw.used_at ?? raw.usedAt ?? null,
    createdAt: raw.CreatedAt ?? raw.created_at ?? raw.createdAt ?? null,
    isActive: raw.IsActive ?? raw.is_active ?? raw.isActive ?? null,
  } as AccessToken;
}

function mapRawCalendarCredential(raw: any): CalendarCredential {
  return {
    id: raw.Id ?? raw.id,
    companyId: raw.CompanyId ?? raw.company_id ?? raw.companyId ?? null,
    provider: raw.Provider ?? raw.provider,
    clientId: raw.ClientId ?? raw.client_id ?? raw.clientId ?? null,
    clientSecret:
      raw.ClientSecret ?? raw.client_secret ?? raw.clientSecret ?? null,
    accessToken: raw.AccessToken ?? raw.access_token ?? raw.accessToken ?? null,
    refreshToken:
      raw.RefreshToken ?? raw.refresh_token ?? raw.refreshToken ?? null,
    expiresAt: raw.ExpiresAt ?? raw.expires_at ?? raw.expiresAt ?? null,
    scope: raw.Scope ?? raw.scope ?? null,
    isActive: raw.IsActive ?? raw.is_active ?? raw.isActive ?? true,
    createdAt: raw.CreatedAt ?? raw.created_at ?? raw.createdAt,
    updatedAt: raw.UpdatedAt ?? raw.updated_at ?? raw.updatedAt,
  } as CalendarCredential;
}

function mapRawLevel(raw: any): Level {
  return {
    id: raw.Id ?? raw.id,
    code: raw.Code ?? raw.code,
    description: raw.Description ?? raw.description,
    status: raw.Status ?? raw.status ?? "active",
    createdAt: raw.CreatedAt ?? raw.created_at ?? raw.createdAt ?? null,
    updatedAt: raw.UpdatedAt ?? raw.updated_at ?? raw.updatedAt ?? null,
    createdById:
      raw.CreatedById ?? raw.created_by_id ?? raw.createdById ?? null,
  } as Level;
}

function mapRawGrade(raw: any): Grade {
  return {
    id: raw.Id ?? raw.id,
    code: raw.Code ?? raw.code,
    description: raw.Description ?? raw.description,
    status: raw.Status ?? raw.status ?? "active",
    createdAt: raw.CreatedAt ?? raw.created_at ?? raw.createdAt ?? null,
    updatedAt: raw.UpdatedAt ?? raw.updated_at ?? raw.updatedAt ?? null,
    createdById:
      raw.CreatedById ?? raw.created_by_id ?? raw.createdById ?? null,
  } as Grade;
}

function mapRawDepartment(raw: any): Department {
  return {
    id: raw.Id ?? raw.id,
    code: raw.Code ?? raw.code,
    description: raw.Description ?? raw.description,
    status: raw.Status ?? raw.status ?? "active",
    createdAt: raw.CreatedAt ?? raw.created_at ?? raw.createdAt ?? null,
    updatedAt: raw.UpdatedAt ?? raw.updated_at ?? raw.updatedAt ?? null,
    createdById:
      raw.CreatedById ?? raw.created_by_id ?? raw.createdById ?? null,
  } as Department;
}

function mapRawAppraisalCycle(raw: any): AppraisalCycle {
  return {
    id: raw.Id ?? raw.id,
    code: raw.Code ?? raw.code,
    description: raw.Description ?? raw.description,
    fromDate: raw.FromDate ? new Date(raw.FromDate) : null,
    toDate: raw.ToDate ? new Date(raw.ToDate) : null,
    status: raw.Status ?? raw.status ?? "active",
    createdAt: raw.CreatedAt ?? raw.created_at ?? raw.createdAt ?? null,
    updatedAt: raw.UpdatedAt ?? raw.updated_at ?? raw.updatedAt ?? null,
    createdById:
      raw.CreatedById ?? raw.created_by_id ?? raw.createdById ?? null,
  } as AppraisalCycle;
}

function mapRawReviewFrequency(raw: any): ReviewFrequency {
  return {
    id: raw.Id ?? raw.id,
    code: raw.Code ?? raw.code,
    description: raw.Description ?? raw.description,
    status: raw.Status ?? raw.status ?? "active",
    createdAt: raw.CreatedAt ?? raw.created_at ?? raw.createdAt ?? null,
    updatedAt: raw.UpdatedAt ?? raw.updated_at ?? raw.updatedAt ?? null,
    createdById:
      raw.CreatedById ?? raw.created_by_id ?? raw.createdById ?? null,
  } as ReviewFrequency;
}

function mapRawFrequencyCalendar(raw: any): FrequencyCalendar {
  return {
    id: raw.Id ?? raw.id,
    code: raw.Code ?? raw.code,
    description: raw.Description ?? raw.description,
    appraisalCycleId:
      raw.AppraisalCycleId ??
      raw.appraisal_cycle_id ??
      raw.appraisalCycleId ??
      null,
    reviewFrequencyId:
      raw.ReviewFrequencyId ??
      raw.review_frequency_id ??
      raw.reviewFrequencyId ??
      null,
    status: raw.Status ?? raw.status ?? "active",
    createdAt: raw.CreatedAt ?? raw.created_at ?? raw.createdAt ?? null,
    updatedAt: raw.UpdatedAt ?? raw.updated_at ?? raw.updatedAt ?? null,
    createdById:
      raw.CreatedById ?? raw.created_by_id ?? raw.createdById ?? null,
  } as FrequencyCalendar;
}

function mapRawFrequencyCalendarDetails(raw: any): FrequencyCalendarDetails {
  return {
    id: raw.Id ?? raw.id,
    frequencyCalendarId:
      raw.FrequencyCalendarId ??
      raw.frequency_calendar_id ??
      raw.frequencyCalendarId ??
      null,
    displayName: raw.DisplayName ?? raw.display_name ?? raw.displayName ?? null,
    startDate: raw.StartDate ? new Date(raw.StartDate) : null,
    endDate: raw.EndDate ? new Date(raw.EndDate) : null,
    status: raw.Status ?? raw.status ?? "active",
    createdAt: raw.CreatedAt ?? raw.created_at ?? raw.createdAt ?? null,
    updatedAt: raw.UpdatedAt ?? raw.updated_at ?? raw.updatedAt ?? null,
    createdById:
      raw.CreatedById ?? raw.created_by_id ?? raw.createdById ?? null,
  } as FrequencyCalendarDetails;
}

function mapRawAppraisalGroup(raw: any): AppraisalGroup {
  return {
    id: raw.Id ?? raw.id,
    name: raw.Name ?? raw.name,
    description: raw.Description ?? raw.description ?? null,
    createdById:
      raw.CreatedById ?? raw.created_by_id ?? raw.createdById ?? null,
    companyId: raw.CompanyId ?? raw.company_id ?? raw.companyId ?? null,
    status: raw.Status ?? raw.status ?? "active",
    createdAt: raw.CreatedAt ?? raw.created_at ?? raw.createdAt ?? null,
    updatedAt: raw.UpdatedAt ?? raw.updated_at ?? raw.updatedAt ?? null,
  } as AppraisalGroup;
}

function mapRawAppraisalGroupMember(raw: any): AppraisalGroupMember {
  return {
    id: raw.Id ?? raw.id,
    appraisalGroupId:
      raw.AppraisalGroupId ?? raw.appraisal_group_id ?? raw.appraisalGroupId,
    userId: raw.UserId ?? raw.user_id ?? raw.userId,
    addedById: raw.AddedById ?? raw.added_by_id ?? raw.addedById,
    addedAt: raw.AddedAt ?? raw.added_at ?? raw.addedAt ?? null,
  } as AppraisalGroupMember;
}

function parseTemplateIds(value: any): string[] | null {
  if (!value) return null;
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string") {
    try {
      // Accept CSV or JSON array
      if (value.trim().startsWith("[")) return JSON.parse(value);
      return value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } catch {
      return null;
    }
  }
  return null;
}

function safeParseJson(value: any): any {
  if (value == null) return null;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return null;
}

function mapRawInitiatedAppraisal(raw: any): InitiatedAppraisal {
  return {
    id: raw.Id ?? raw.id,
    appraisalGroupId:
      raw.AppraisalGroupId ?? raw.appraisal_group_id ?? raw.appraisalGroupId,
    appraisalType: raw.AppraisalType ?? raw.appraisal_type ?? raw.appraisalType,
    questionnaireTemplateIds:
      parseTemplateIds(
        raw.QuestionnaireTemplateIds ?? raw.questionnaire_template_ids
      ) ?? [],
    documentUrl: raw.DocumentUrl ?? raw.document_url ?? raw.documentUrl ?? null,
    frequencyCalendarId:
      raw.FrequencyCalendarId ??
      raw.frequency_calendar_id ??
      raw.frequencyCalendarId ??
      null,
    daysToInitiate: raw.DaysToInitiate ?? raw.days_to_initiate ?? 0,
    daysToClose: raw.DaysToClose ?? raw.days_to_close ?? 30,
    numberOfReminders: raw.NumberOfReminders ?? raw.number_of_reminders ?? 3,
    excludeTenureLessThanYear:
      raw.ExcludeTenureLessThanYear ??
      raw.exclude_tenure_less_than_year ??
      false,
    excludedEmployeeIds: Array.isArray(
      raw.ExcludedEmployeeIds ?? raw.excluded_employee_ids
    )
      ? raw.ExcludedEmployeeIds ?? raw.excluded_employee_ids
      : parseTemplateIds(
          raw.ExcludedEmployeeIds ?? raw.excluded_employee_ids
        ) || [],
    status: raw.Status ?? raw.status ?? "draft",
    makePublic: raw.MakePublic ?? raw.make_public ?? false,
    publishType:
      raw.PublishType ?? raw.publish_type ?? raw.publishType ?? "now",
    createdById:
      raw.CreatedById ?? raw.created_by_id ?? raw.createdById ?? null,
    createdAt: raw.CreatedAt ?? raw.created_at ?? raw.createdAt ?? null,
    updatedAt: raw.UpdatedAt ?? raw.updated_at ?? raw.updatedAt ?? null,
  } as InitiatedAppraisal;
}

function mapRawInitiatedAppraisalDetailTiming(
  raw: any
): InitiatedAppraisalDetailTiming {
  return {
    id: raw.Id ?? raw.id,
    initiatedAppraisalId:
      raw.InitiatedAppraisalId ??
      raw.initiated_appraisal_id ??
      raw.initiatedAppraisalId,
    frequencyCalendarDetailId:
      raw.FrequencyCalendarDetailId ??
      raw.frequency_calendar_detail_id ??
      raw.frequencyCalendarDetailId,
    daysToInitiate: raw.DaysToInitiate ?? raw.days_to_initiate ?? 0,
    daysToClose: raw.DaysToClose ?? raw.days_to_close ?? 30,
    numberOfReminders: raw.NumberOfReminders ?? raw.number_of_reminders ?? 3,
    createdAt: raw.CreatedAt ?? raw.created_at ?? raw.createdAt ?? null,
    updatedAt: raw.UpdatedAt ?? raw.updated_at ?? raw.updatedAt ?? null,
  } as InitiatedAppraisalDetailTiming;
}

function mapRawScheduledAppraisalTask(raw: any): ScheduledAppraisalTask {
  return {
    id: raw.Id ?? raw.id,
    initiatedAppraisalId:
      raw.InitiatedAppraisalId ??
      raw.initiated_appraisal_id ??
      raw.initiatedAppraisalId,
    frequencyCalendarDetailId:
      raw.FrequencyCalendarDetailId ??
      raw.frequency_calendar_detail_id ??
      raw.frequencyCalendarDetailId,
    scheduledDate: raw.ScheduledDate ? new Date(raw.ScheduledDate) : null,
    status: raw.Status ?? raw.status ?? "pending",
    executedAt: raw.ExecutedAt ? new Date(raw.ExecutedAt) : null,
    error: raw.Error ?? raw.error ?? null,
    createdAt: raw.CreatedAt ?? raw.created_at ?? raw.createdAt ?? null,
    updatedAt: raw.UpdatedAt ?? raw.updated_at ?? raw.updatedAt ?? null,
  } as ScheduledAppraisalTask;
}

function mapRawEvaluation(raw: any): Evaluation {
  return {
    id: raw.Id ?? raw.id,
    employeeId: raw.EmployeeId ?? raw.employee_id ?? raw.employeeId,
    managerId: raw.ManagerId ?? raw.manager_id ?? raw.managerId,
    reviewCycleId:
      raw.ReviewCycleId ?? raw.review_cycle_id ?? raw.reviewCycleId ?? null,
    initiatedAppraisalId:
      raw.InitiatedAppraisalId ??
      raw.initiated_appraisal_id ??
      raw.initiatedAppraisalId ??
      null,
    selfEvaluationData: raw.SelfEvaluationData
      ? safeParseJson(raw.SelfEvaluationData)
      : null,
    selfEvaluationSubmittedAt:
      raw.SelfEvaluationSubmittedAt ?? raw.self_evaluation_submitted_at ?? null,
    managerEvaluationData: raw.ManagerEvaluationData
      ? safeParseJson(raw.ManagerEvaluationData)
      : null,
    managerEvaluationSubmittedAt:
      raw.ManagerEvaluationSubmittedAt ??
      raw.manager_evaluation_submitted_at ??
      null,
    overallRating: raw.OverallRating ?? raw.overall_rating ?? null,
    status: raw.Status ?? raw.status ?? "not_started",
    meetingScheduledAt:
      raw.MeetingScheduledAt ?? raw.meeting_scheduled_at ?? null,
    meetingNotes: raw.MeetingNotes ?? raw.meeting_notes ?? null,
    meetingCompletedAt:
      raw.MeetingCompletedAt ?? raw.meeting_completed_at ?? null,
    finalizedAt: raw.FinalizedAt ?? raw.finalized_at ?? null,
    createdAt: raw.CreatedAt ?? raw.created_at ?? null,
    updatedAt: raw.UpdatedAt ?? raw.updated_at ?? null,
    showNotesToEmployee:
      raw.ShowNotesToEmployee ?? raw.show_notes_to_employee ?? false,
    calibratedRating: raw.CalibratedRating ?? raw.calibrated_rating ?? null,
    calibrationRemarks:
      raw.CalibrationRemarks ?? raw.calibration_remarks ?? null,
    calibratedBy: raw.CalibratedBy ?? raw.calibrated_by ?? null,
    calibratedAt: raw.CalibratedAt ?? raw.calibrated_at ?? null,
  } as Evaluation;
}

// ---------- Interface ----------
export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(
    filters?: {
      role?: string;
      department?: string;
      status?: string;
      companyId?: string;
    },
    requestingUserId?: string
  ): Promise<SafeUser[]>;
  createUser(user: InsertUser, creatorId?: string): Promise<SafeUser>;
  updateUser(
    id: string,
    user: Partial<InsertUser>,
    requestingUserId?: string
  ): Promise<SafeUser>;
  deleteUser(id: string, requestingUserId?: string): Promise<void>;
  getUsersByManager(managerId: string): Promise<SafeUser[]>;
  changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void>;
  upsertUser(userData: UpsertUser): Promise<User>;
  getUserByCode(code: string): Promise<User | undefined>;
  getUserByMobile(mobileNumber: string): Promise<User | undefined>;

  // Companies
  getCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  getCompanyByUrl(companyUrl: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company>;
  deleteCompany(id: string): Promise<void>;

  // Locations
  getLocations(): Promise<Location[]>;
  getLocation(id: string): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(
    id: string,
    location: Partial<InsertLocation>
  ): Promise<Location>;
  deleteLocation(id: string): Promise<void>;

  // Questionnaire Templates (partial)
  getQuestionnaireTemplates(
    requestingUserId?: string
  ): Promise<QuestionnaireTemplate[]>;
  getQuestionnaireTemplate(
    id: string,
    requestingUserId?: string
  ): Promise<QuestionnaireTemplate | undefined>;
  createQuestionnaireTemplate(
    template: InsertQuestionnaireTemplate
  ): Promise<QuestionnaireTemplate>;
  updateQuestionnaireTemplate(
    id: string,
    template: Partial<InsertQuestionnaireTemplate>,
    requestingUserId?: string
  ): Promise<QuestionnaireTemplate>;
  deleteQuestionnaireTemplate(
    id: string,
    requestingUserId?: string
  ): Promise<void>;

  // Email Templates
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(id: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(
    id: string,
    template: Partial<InsertEmailTemplate>
  ): Promise<EmailTemplate>;
  deleteEmailTemplate(id: string): Promise<void>;

  // Email Config
  getEmailConfig(): Promise<EmailConfig | undefined>;
  createEmailConfig(config: InsertEmailConfig): Promise<EmailConfig>;
  updateEmailConfig(
    id: string,
    config: Partial<InsertEmailConfig>
  ): Promise<EmailConfig>;

  // Registrations
  getRegistrations(): Promise<Registration[]>;
  getRegistration(id: string): Promise<Registration | undefined>;
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  updateRegistration(
    id: string,
    registration: Partial<Registration>
  ): Promise<Registration>;

  // Access Tokens
  createAccessToken(token: InsertAccessToken): Promise<AccessToken>;
  getAccessToken(token: string): Promise<AccessToken | undefined>;
  markTokenAsUsed(token: string): Promise<void>;
  deactivateToken(token: string): Promise<void>;
  getActiveTokensByUser(userId: string): Promise<AccessToken[]>;

  // Calendar Credentials
  getCalendarCredential(
    companyId: string,
    provider: "google" | "outlook"
  ): Promise<CalendarCredential | undefined>;
  createCalendarCredential(
    credential: InsertCalendarCredential
  ): Promise<CalendarCredential>;
  updateCalendarCredential(
    id: string,
    credential: Partial<InsertCalendarCredential>
  ): Promise<CalendarCredential>;
  updateCalendarCredentialTokens(
    companyId: string,
    provider: "google" | "outlook",
    accessToken: string,
    refreshToken?: string,
    expiresAt?: Date
  ): Promise<void>;
  deleteCalendarCredential(id: string): Promise<void>;

  // ----- Stubs (return empty / not implemented yet) -----
  getEvaluations(filters?: {
    employeeId?: string;
    managerId?: string;
    reviewCycleId?: string;
    status?: string;
  }): Promise<Evaluation[]>;
  getEvaluation(id: string): Promise<Evaluation | undefined>;
  createEvaluation(e: InsertEvaluation): Promise<Evaluation>;
  updateEvaluation(
    id: string,
    e: Partial<InsertEvaluation>
  ): Promise<Evaluation>;
  deleteEvaluation(id: string): Promise<void>;
  getEvaluationByEmployeeAndCycle(
    employeeId: string,
    reviewCycleId: string
  ): Promise<Evaluation | undefined>;
  getEvaluationsByInitiatedAppraisal(
    initiatedAppraisalId: string
  ): Promise<Evaluation[]>;
  getQuestionnaireTemplatesByYear(
    year: number
  ): Promise<QuestionnaireTemplate[]>;
  getScheduledMeetingsForCompany(companyId: string): Promise<any[]>;

  // Levels
  getLevels(createdById: string): Promise<Level[]>;
  getLevel(id: string, createdById: string): Promise<Level | undefined>;
  createLevel(level: InsertLevel, createdById: string): Promise<Level>;
  updateLevel(
    id: string,
    level: Partial<InsertLevel>,
    createdById: string
  ): Promise<Level>;
  deleteLevel(id: string, createdById: string): Promise<void>;

  // Grades
  getGrades(createdById: string): Promise<Grade[]>;
  getGrade(id: string, createdById: string): Promise<Grade | undefined>;
  createGrade(grade: InsertGrade, createdById: string): Promise<Grade>;
  updateGrade(
    id: string,
    grade: Partial<InsertGrade>,
    createdById: string
  ): Promise<Grade>;
  deleteGrade(id: string, createdById: string): Promise<void>;

  // Departments
  getDepartments(createdById: string): Promise<Department[]>;
  getDepartment(
    id: string,
    createdById: string
  ): Promise<Department | undefined>;
  createDepartment(
    department: InsertDepartment,
    createdById: string
  ): Promise<Department>;
  updateDepartment(
    id: string,
    department: Partial<InsertDepartment>,
    createdById: string
  ): Promise<Department>;
  deleteDepartment(id: string, createdById: string): Promise<void>;

  // Appraisal Cycles
  getAppraisalCycles(createdById: string): Promise<AppraisalCycle[]>;
  getAllAppraisalCycles(companyId: string): Promise<AppraisalCycle[]>;
  getAppraisalCycle(
    id: string,
    createdById?: string
  ): Promise<AppraisalCycle | undefined>;
  createAppraisalCycle(
    cycle: InsertAppraisalCycle,
    createdById: string
  ): Promise<AppraisalCycle>;
  updateAppraisalCycle(
    id: string,
    cycle: Partial<InsertAppraisalCycle>,
    createdById: string
  ): Promise<AppraisalCycle>;
  deleteAppraisalCycle(id: string, createdById: string): Promise<void>;

  // Review Frequencies
  getReviewFrequencies(createdById: string): Promise<ReviewFrequency[]>;
  getReviewFrequency(
    id: string,
    createdById: string
  ): Promise<ReviewFrequency | undefined>;
  createReviewFrequency(
    freq: InsertReviewFrequency,
    createdById: string
  ): Promise<ReviewFrequency>;
  updateReviewFrequency(
    id: string,
    freq: Partial<InsertReviewFrequency>,
    createdById: string
  ): Promise<ReviewFrequency>;
  deleteReviewFrequency(id: string, createdById: string): Promise<void>;

  // Frequency Calendars
  getFrequencyCalendars(createdById: string): Promise<FrequencyCalendar[]>;
  getAllFrequencyCalendars(): Promise<FrequencyCalendar[]>;
  getFrequencyCalendar(
    id: string,
    createdById?: string
  ): Promise<FrequencyCalendar | undefined>;
  createFrequencyCalendar(
    calendar: InsertFrequencyCalendar,
    createdById: string
  ): Promise<FrequencyCalendar>;
  updateFrequencyCalendar(
    id: string,
    calendar: Partial<InsertFrequencyCalendar>,
    createdById: string
  ): Promise<FrequencyCalendar>;
  deleteFrequencyCalendar(id: string, createdById: string): Promise<void>;

  // Frequency Calendar Details
  getFrequencyCalendarDetails(
    createdById: string
  ): Promise<FrequencyCalendarDetails[]>;
  getAllFrequencyCalendarDetails(
    companyId: string
  ): Promise<FrequencyCalendarDetails[]>;
  getFrequencyCalendarDetailsByCalendarId(
    calendarId: string
  ): Promise<FrequencyCalendarDetails[]>;
  getFrequencyCalendarDetail(
    id: string,
    createdById?: string
  ): Promise<FrequencyCalendarDetails | undefined>;
  createFrequencyCalendarDetails(
    details: InsertFrequencyCalendarDetails,
    createdById: string
  ): Promise<FrequencyCalendarDetails>;
  updateFrequencyCalendarDetails(
    id: string,
    details: Partial<InsertFrequencyCalendarDetails>
  ): Promise<FrequencyCalendarDetails>;
  deleteFrequencyCalendarDetails(id: string): Promise<void>;

  // Appraisal Groups & Members
  getAppraisalGroups(createdById: string): Promise<AppraisalGroup[]>;
  getAppraisalGroupsWithMembers(
    createdById: string
  ): Promise<(AppraisalGroup & { members: AppraisalGroupMember[] })[]>;
  getAppraisalGroup(
    id: string,
    createdById: string
  ): Promise<AppraisalGroup | undefined>;
  createAppraisalGroup(
    group: InsertAppraisalGroup,
    createdById: string,
    companyId?: string
  ): Promise<AppraisalGroup>;
  updateAppraisalGroup(
    id: string,
    group: Partial<InsertAppraisalGroup>,
    createdById: string
  ): Promise<AppraisalGroup>;
  deleteAppraisalGroup(id: string, createdById: string): Promise<void>;
  getAppraisalGroupMembers(
    appraisalGroupId: string,
    createdById: string
  ): Promise<AppraisalGroupMember[]>;
  addAppraisalGroupMember(
    member: InsertAppraisalGroupMember,
    createdById: string
  ): Promise<AppraisalGroupMember>;
  removeAppraisalGroupMember(
    appraisalGroupId: string,
    userId: string,
    createdById: string
  ): Promise<void>;

  // Initiated Appraisals
  createInitiatedAppraisal(
    appraisal: InsertInitiatedAppraisal,
    createdById: string
  ): Promise<InitiatedAppraisal>;
  getInitiatedAppraisal(id: string): Promise<InitiatedAppraisal | undefined>;
  getInitiatedAppraisals(createdById: string): Promise<InitiatedAppraisal[]>;
  updateInitiatedAppraisalStatus(id: string, status: string): Promise<void>;
  createInitiatedAppraisalDetailTiming(
    timing: InsertInitiatedAppraisalDetailTiming
  ): Promise<InitiatedAppraisalDetailTiming>;
  getInitiatedAppraisalDetailTimings(
    initiatedAppraisalId: string
  ): Promise<InitiatedAppraisalDetailTiming[]>;
  updateInitiatedAppraisalDetailTimingStatus(
    id: string,
    status: string
  ): Promise<void>;

  // Publish Questionnaires
  getPublishQuestionnaires(
    createdById: string
  ): Promise<PublishQuestionnaire[]>;
  getPublishQuestionnaire(
    id: string,
    createdById: string
  ): Promise<PublishQuestionnaire | undefined>;
  createPublishQuestionnaire(
    pq: InsertPublishQuestionnaire,
    createdById: string
  ): Promise<PublishQuestionnaire>;
  updatePublishQuestionnaire(
    id: string,
    pq: Partial<InsertPublishQuestionnaire>,
    createdById: string
  ): Promise<PublishQuestionnaire>;
  deletePublishQuestionnaire(id: string, createdById: string): Promise<void>;

  // Scheduled Tasks
  createScheduledAppraisalTask(
    task: InsertScheduledAppraisalTask
  ): Promise<ScheduledAppraisalTask>;
  // (Future: retrieval or execution endpoints)
}

export class DatabaseStorage implements IStorage {
  // ---------- User Operations ----------
  async getUser(id: string): Promise<User | undefined> {
    const pool = await getPool();
    const result = await pool.request().input("Id", id).execute("dbo.GetUser");
    const raw = result.recordset[0];
    return raw ? mapRawUser(raw) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Email", email)
      .execute("dbo.GetUserByEmail");
    const raw = result.recordset[0];
    return raw ? mapRawUser(raw) : undefined;
  }

  async getUsers(
    filters?: {
      role?: string;
      department?: string;
      status?: string;
      companyId?: string;
    },
    requestingUserId?: string
  ): Promise<SafeUser[]> {
    // Temporary: use GetUsers SP if exists; else fetch individually by known filters later.
    const pool = await getPool();
    try {
      const req = pool.request();
      req.input("RequestingUserId", requestingUserId || null);
      req.input("Role", filters?.role || null);
      req.input("CompanyId", filters?.companyId || null);
      req.input("Department", filters?.department || null);
      req.input("Status", filters?.status || null);
      const result = await req.execute("dbo.GetUsers"); // May not yet exist; catch error.
      return sanitizeUsersFromRaw(result.recordset || []);
    } catch {
      // Fallback: return empty until SP added.
      return [];
    }
  }

  async getUsersByManager(managerId: string): Promise<SafeUser[]> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("ManagerId", managerId)
        .execute("dbo.GetUsersByManager");
      return sanitizeUsersFromRaw(result.recordset || []);
    } catch {
      return [];
    }
  }

  async getUserByCode(code: string): Promise<User | undefined> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("Code", code)
        .execute("dbo.GetUserByCode");
      const raw = result.recordset[0];
      return raw ? mapRawUser(raw) : undefined;
    } catch {
      return undefined;
    }
  }

  async getUserByMobile(mobileNumber: string): Promise<User | undefined> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("MobileNumber", mobileNumber)
        .execute("dbo.GetUserByMobile");
      const raw = result.recordset[0];
      return raw ? mapRawUser(raw) : undefined;
    } catch {
      return undefined;
    }
  }

  async createUser(user: InsertUser, creatorId?: string): Promise<SafeUser> {
    const pool = await getPool();
    const hashedPassword = user.password
      ? await bcrypt.hash(user.password, 10)
      : null;
    const req = pool
      .request()
      .input("Email", user.email)
      .input("FirstName", user.firstName || null)
      .input("LastName", user.lastName || null)
      .input("Code", user.code || null)
      .input("Designation", user.designation || null)
      .input("DateOfJoining", user.dateOfJoining || null)
      .input("MobileNumber", user.mobileNumber || null)
      .input("ReportingManagerId", user.reportingManagerId || null)
      .input("LocationId", user.locationId || null)
      .input("CompanyId", user.companyId || null)
      .input("Role", user.role || "employee")
      .input("Status", user.status || "active")
      .input("Department", user.department || null)
      .input(
        "Roles",
        JSON.stringify(
          user.roles && user.roles.length
            ? user.roles
            : [user.role || "employee"]
        )
      )
      .input("PasswordHash", hashedPassword)
      .input("CreatedById", creatorId || null)
      .input("LevelId", user.levelId || null)
      .input("GradeId", user.gradeId || null);
    const result = await req.execute("dbo.CreateUser");
    const raw = result.recordset[0];
    const mapped = mapRawUser(raw);
    return sanitizeUser(mapped);
  }

  async updateUser(
    id: string,
    user: Partial<InsertUser>,
    requestingUserId?: string
  ): Promise<SafeUser> {
    const pool = await getPool();
    const hashedPassword = user.password
      ? await bcrypt.hash(user.password, 10)
      : null;
    const req = pool
      .request()
      .input("Id", id)
      .input("Email", user.email || null)
      .input("FirstName", user.firstName || null)
      .input("LastName", user.lastName || null)
      .input("ProfileImageUrl", user.profileImageUrl || null)
      .input("Code", user.code || null)
      .input("Designation", user.designation || null)
      .input("DateOfJoining", user.dateOfJoining || null)
      .input("MobileNumber", user.mobileNumber || null)
      .input("ReportingManagerId", user.reportingManagerId || null)
      .input("LocationId", user.locationId || null)
      .input("CompanyId", user.companyId || null)
      .input("Role", user.role || null)
      .input("Status", user.status || null)
      .input("Department", user.department || null)
      .input("Roles", user.roles ? JSON.stringify(user.roles) : null)
      .input("PasswordHash", hashedPassword)
      .input("LevelId", user.levelId || null)
      .input("GradeId", user.gradeId || null);
    const result = await req.execute("dbo.UpdateUser");
    const raw = result.recordset[0];
    return sanitizeUser(mapRawUser(raw));
  }

  async deleteUser(id: string): Promise<void> {
    const pool = await getPool();
    try {
      await pool.request().input("Id", id).execute("dbo.DeleteUser");
    } catch {
      // swallow for now
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const existing = await this.getUser(userId);
    if (!existing) throw new Error("User not found");
    if (existing.passwordHash) {
      const valid = await bcrypt.compare(
        currentPassword,
        existing.passwordHash
      );
      if (!valid) throw new Error("Current password is incorrect");
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.updateUser(userId, { password: newPassword });
    // NOTE: updateUser already hashes if password provided, but we ensured above.
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const pool = await getPool();
    const request = pool
      .request()
      .input("Id", userData.id || null)
      .input("Email", userData.email)
      .input("FirstName", userData.firstName || null)
      .input("LastName", userData.lastName || null)
      .input("ProfileImageUrl", userData.profileImageUrl || null)
      .input("Role", (userData as any).role || "employee")
      .input(
        "Roles",
        JSON.stringify(
          (userData as any).roles || [(userData as any).role || "employee"]
        )
      );
    const result = await request.execute("dbo.UpsertUser");
    const raw = result.recordset[0];
    if (raw) return mapRawUser(raw);
    // Fallback: if SP didn't return, try direct fetch when id exists
    if (userData.id) {
      const fetched = await this.getUser(userData.id);
      if (fetched) return fetched;
    }
    if (userData.email) {
      const fetchedByEmail = await this.getUserByEmail(userData.email);
      if (fetchedByEmail) return fetchedByEmail;
    }
    throw new Error("UpsertUser failed to retrieve resulting user");
  }

  // ---------- Company Operations ----------
  async getCompanies(): Promise<Company[]> {
    const pool = await getPool();
    const result = await pool.request().execute("dbo.GetCompanies");
    return (result.recordset || []).map(mapRawCompany);
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Id", id)
      .execute("dbo.GetCompany");
    const raw = result.recordset[0];
    return raw ? mapRawCompany(raw) : undefined;
  }

  async getCompanyByUrl(companyUrl: string): Promise<Company | undefined> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("CompanyUrl", companyUrl)
      .execute("dbo.GetCompanyByUrl");
    const raw = result.recordset[0];
    return raw ? mapRawCompany(raw) : undefined;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Name", company.name)
      .input("Address", company.address || null)
      .input("ClientContact", company.clientContact || null)
      .input("Email", company.email || null)
      .input("ContactNumber", company.contactNumber || null)
      .input("GstNumber", company.gstNumber || null)
      .input("LogoUrl", company.logoUrl || null)
      .input("Status", company.status || "active")
      .input("Url", company.url || null)
      .input("CompanyUrl", company.companyUrl || null);
    const result = await req.execute("dbo.CreateCompany");
    return mapRawCompany(result.recordset[0]);
  }

  async updateCompany(
    id: string,
    company: Partial<InsertCompany>
  ): Promise<Company> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Id", id)
      .input("Name", company.name || null)
      .input("Address", company.address || null)
      .input("ClientContact", company.clientContact || null)
      .input("Email", company.email || null)
      .input("ContactNumber", company.contactNumber || null)
      .input("GstNumber", company.gstNumber || null)
      .input("LogoUrl", company.logoUrl || null)
      .input("Status", company.status || null)
      .input("Url", company.url || null)
      .input("CompanyUrl", company.companyUrl || null);
    const result = await req.execute("dbo.UpdateCompany");
    return mapRawCompany(result.recordset[0]);
  }

  async deleteCompany(id: string): Promise<void> {
    const pool = await getPool();
    try {
      await pool.request().input("Id", id).execute("dbo.DeleteCompany");
    } catch {}
  }

  // ---------- Location Operations ----------
  async getLocations(): Promise<Location[]> {
    const pool = await getPool();
    const result = await pool.request().execute("dbo.GetLocations");
    return (result.recordset || []).map(mapRawLocation);
  }

  async getLocation(id: string): Promise<Location | undefined> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Id", id)
      .execute("dbo.GetLocation");
    const raw = result.recordset[0];
    return raw ? mapRawLocation(raw) : undefined;
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Code", location.code || null)
      .input("Name", location.name)
      .input("State", location.state || null)
      .input("Country", location.country || null)
      .input("Status", location.status || "active");
    const result = await req.execute("dbo.CreateLocation");
    return mapRawLocation(result.recordset[0]);
  }

  async updateLocation(
    id: string,
    location: Partial<InsertLocation>
  ): Promise<Location> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Id", id)
      .input("Code", location.code || null)
      .input("Name", location.name || null)
      .input("State", location.state || null)
      .input("Country", location.country || null)
      .input("Status", location.status || null);
    const result = await req.execute("dbo.UpdateLocation");
    return mapRawLocation(result.recordset[0]);
  }

  async deleteLocation(id: string): Promise<void> {
    const pool = await getPool();
    try {
      await pool.request().input("Id", id).execute("dbo.DeleteLocation");
    } catch {}
  }

  // ---------- Email Templates ----------
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    const pool = await getPool();
    try {
      const result = await pool.request().execute("dbo.GetEmailTemplates");
      return (result.recordset || []).map(mapRawEmailTemplate);
    } catch {
      return [];
    }
  }
  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("Id", id)
        .execute("dbo.GetEmailTemplate");
      const raw = result.recordset[0];
      return raw ? mapRawEmailTemplate(raw) : undefined;
    } catch {
      return undefined;
    }
  }
  async createEmailTemplate(
    template: InsertEmailTemplate
  ): Promise<EmailTemplate> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Name", template.name)
      .input("Subject", template.subject || null)
      .input("Body", template.body || null)
      .input("TemplateType", template.templateType || null);
    const result = await req.execute("dbo.CreateEmailTemplate");
    return mapRawEmailTemplate(result.recordset[0]);
  }
  async updateEmailTemplate(
    id: string,
    template: Partial<InsertEmailTemplate>
  ): Promise<EmailTemplate> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Id", id)
      .input("Name", template.name || null)
      .input("Subject", template.subject || null)
      .input("Body", template.body || null)
      .input("TemplateType", template.templateType || null);
    const result = await req.execute("dbo.UpdateEmailTemplate");
    return mapRawEmailTemplate(result.recordset[0]);
  }
  async deleteEmailTemplate(id: string): Promise<void> {
    const pool = await getPool();
    try {
      await pool.request().input("Id", id).execute("dbo.DeleteEmailTemplate");
    } catch {}
  }

  // ---------- Email Config ----------
  async getEmailConfig(): Promise<EmailConfig | undefined> {
    const pool = await getPool();
    try {
      const result = await pool.request().execute("dbo.GetEmailConfig");
      const raw = result.recordset[0];
      return raw ? mapRawEmailConfig(raw) : undefined;
    } catch {
      return undefined;
    }
  }
  async createEmailConfig(config: InsertEmailConfig): Promise<EmailConfig> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("SmtpHost", config.smtpHost)
      .input("SmtpPort", config.smtpPort)
      .input("SmtpUsername", config.smtpUsername)
      .input("SmtpPassword", config.smtpPassword)
      .input("FromEmail", config.fromEmail)
      .input("FromName", config.fromName);
    const result = await req.execute("dbo.CreateEmailConfig");
    return mapRawEmailConfig(result.recordset[0]);
  }
  async updateEmailConfig(
    id: string,
    config: Partial<InsertEmailConfig>
  ): Promise<EmailConfig> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Id", id)
      .input("SmtpHost", config.smtpHost || null)
      .input("SmtpPort", config.smtpPort ?? null)
      .input("SmtpUsername", config.smtpUsername || null)
      .input("SmtpPassword", config.smtpPassword || null)
      .input("FromEmail", config.fromEmail || null)
      .input("FromName", config.fromName || null);
    const result = await req.execute("dbo.UpdateEmailConfig");
    return mapRawEmailConfig(result.recordset[0]);
  }

  // ---------- Registrations ----------
  async getRegistrations(): Promise<Registration[]> {
    const pool = await getPool();
    try {
      const result = await pool.request().execute("dbo.GetRegistrations");
      return (result.recordset || []).map(mapRawRegistration);
    } catch {
      return [];
    }
  }
  async getRegistration(id: string): Promise<Registration | undefined> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("Id", id)
        .execute("dbo.GetRegistration");
      const raw = result.recordset[0];
      return raw ? mapRawRegistration(raw) : undefined;
    } catch {
      return undefined;
    }
  }
  async createRegistration(
    registration: InsertRegistration
  ): Promise<Registration> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Name", registration.name)
      .input("CompanyName", registration.companyName || null)
      .input("Designation", registration.designation || null)
      .input("Email", registration.email || null)
      .input("Mobile", registration.mobile || null);
    const result = await req.execute("dbo.CreateRegistration");
    return mapRawRegistration(result.recordset[0]);
  }
  async updateRegistration(
    id: string,
    registration: Partial<Registration>
  ): Promise<Registration> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Id", id)
      .input("Name", registration.name || null)
      .input("CompanyName", (registration as any).companyName || null)
      .input("Designation", registration.designation || null)
      .input("Email", registration.email || null)
      .input("Mobile", (registration as any).mobile || null)
      .input("Notes", registration.notes || null)
      .input("NotificationSent", registration.notificationSent ?? null);
    const result = await req.execute("dbo.UpdateRegistration");
    return mapRawRegistration(result.recordset[0]);
  }

  // ---------- Access Tokens ----------
  async createAccessToken(token: InsertAccessToken): Promise<AccessToken> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Token", token.token)
      .input("UserId", token.userId)
      .input("EvaluationId", (token as any).evaluationId || null)
      .input("TokenType", (token as any).tokenType || "generic")
      .input("ExpiresAt", token.expiresAt || null);
    const result = await req.execute("dbo.CreateAccessToken");
    return mapRawAccessToken(result.recordset[0]);
  }
  async getAccessToken(tokenStr: string): Promise<AccessToken | undefined> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("Token", tokenStr)
        .execute("dbo.GetAccessToken");
      const raw = result.recordset[0];
      return raw ? mapRawAccessToken(raw) : undefined;
    } catch {
      return undefined;
    }
  }
  async markTokenAsUsed(tokenStr: string): Promise<void> {
    const pool = await getPool();
    try {
      await pool
        .request()
        .input("Token", tokenStr)
        .execute("dbo.MarkTokenAsUsed");
    } catch {}
  }
  async deactivateToken(tokenStr: string): Promise<void> {
    const pool = await getPool();
    try {
      await pool
        .request()
        .input("Token", tokenStr)
        .execute("dbo.DeactivateToken");
    } catch {}
  }
  async getActiveTokensByUser(userId: string): Promise<AccessToken[]> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("UserId", userId)
        .execute("dbo.GetActiveTokensByUser");
      return (result.recordset || []).map(mapRawAccessToken);
    } catch {
      return [];
    }
  }

  // ---------- Calendar Credentials ----------
  async getCalendarCredential(
    companyId: string,
    provider: "google" | "outlook"
  ): Promise<CalendarCredential | undefined> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("CompanyId", companyId)
        .input("Provider", provider)
        .execute("dbo.GetCalendarCredential");
      const raw = result.recordset[0];
      return raw ? mapRawCalendarCredential(raw) : undefined;
    } catch {
      return undefined;
    }
  }
  async createCalendarCredential(
    credential: InsertCalendarCredential
  ): Promise<CalendarCredential> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("CompanyId", credential.companyId)
      .input("Provider", credential.provider)
      .input("ClientId", credential.clientId || null)
      .input("ClientSecret", credential.clientSecret || null)
      .input("AccessToken", credential.accessToken || null)
      .input("RefreshToken", credential.refreshToken || null)
      .input("ExpiresAt", credential.expiresAt || null)
      .input("Scope", (credential as any).scope || null);
    const result = await req.execute("dbo.CreateCalendarCredential");
    return mapRawCalendarCredential(result.recordset[0]);
  }
  async updateCalendarCredential(
    id: string,
    credential: Partial<InsertCalendarCredential>
  ): Promise<CalendarCredential> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Id", id)
      .input("ClientId", credential.clientId || null)
      .input("ClientSecret", credential.clientSecret || null)
      .input("AccessToken", credential.accessToken || null)
      .input("RefreshToken", credential.refreshToken || null)
      .input("ExpiresAt", credential.expiresAt || null)
      .input("Scope", (credential as any).scope || null);
    const result = await req.execute("dbo.UpdateCalendarCredential");
    return mapRawCalendarCredential(result.recordset[0]);
  }
  async updateCalendarCredentialTokens(
    companyId: string,
    provider: "google" | "outlook",
    accessToken: string,
    refreshToken?: string,
    expiresAt?: Date
  ): Promise<void> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("CompanyId", companyId)
      .input("Provider", provider)
      .input("AccessToken", accessToken)
      .input("RefreshToken", refreshToken || null)
      .input("ExpiresAt", expiresAt || null);
    try {
      await req.execute("dbo.UpdateCalendarCredentialTokens");
    } catch {}
  }
  async deleteCalendarCredential(id: string): Promise<void> {
    const pool = await getPool();
    try {
      await pool
        .request()
        .input("Id", id)
        .execute("dbo.DeleteCalendarCredential");
    } catch {}
  }

  // ---------- Questionnaire Templates ----------
  async getQuestionnaireTemplates(
    requestingUserId?: string
  ): Promise<QuestionnaireTemplate[]> {
    const pool = await getPool();
    try {
      const req = pool.request();
      req.input("RequestingUserId", requestingUserId || null);
      const result = await req.execute("dbo.GetQuestionnaireTemplates");
      return (result.recordset || []).map(
        (raw:any) =>
          ({
            id: raw.Id ?? raw.id,
            name: raw.Name ?? raw.name,
            description: raw.Description ?? raw.description ?? null,
            targetRole:
              raw.TargetRole ?? raw.target_role ?? raw.targetRole ?? null,
            questions: raw.Questions ? safeParseJson(raw.Questions) : null,
            year: raw.Year ?? raw.year ?? null,
            status: raw.Status ?? raw.status ?? "active",
            createdAt: raw.CreatedAt ? new Date(raw.CreatedAt) : null,
            updatedAt: raw.UpdatedAt ? new Date(raw.UpdatedAt) : null,
            createdById:
              raw.CreatedById ?? raw.created_by_id ?? raw.createdById ?? null,
            applicableCategory:
              raw.ApplicableCategory ?? raw.applicable_category ?? null,
            applicableLevelId:
              raw.ApplicableLevelId ?? raw.applicable_level_id ?? null,
            applicableGradeId:
              raw.ApplicableGradeId ?? raw.applicable_grade_id ?? null,
            applicableLocationId:
              raw.ApplicableLocationId ?? raw.applicable_location_id ?? null,
            sendOnMail: raw.SendOnMail ?? raw.send_on_mail ?? false,
          } as QuestionnaireTemplate)
      );
    } catch {
      return [];
    }
  }
  async getQuestionnaireTemplate(
    id: string
  ): Promise<QuestionnaireTemplate | undefined> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("Id", id)
        .execute("dbo.GetQuestionnaireTemplate");
      const raw = result.recordset[0];
      if (!raw) return undefined;
      return {
        id: raw.Id ?? raw.id,
        name: raw.Name ?? raw.name,
        description: raw.Description ?? raw.description ?? null,
        targetRole: raw.TargetRole ?? raw.target_role ?? raw.targetRole ?? null,
        questions: raw.Questions ? safeParseJson(raw.Questions) : null,
        year: raw.Year ?? raw.year ?? null,
        status: raw.Status ?? raw.status ?? "active",
        createdAt: raw.CreatedAt ? new Date(raw.CreatedAt) : null,
        updatedAt: raw.UpdatedAt ? new Date(raw.UpdatedAt) : null,
        createdById:
          raw.CreatedById ?? raw.created_by_id ?? raw.createdById ?? null,
        applicableCategory:
          raw.ApplicableCategory ?? raw.applicable_category ?? null,
        applicableLevelId:
          raw.ApplicableLevelId ?? raw.applicable_level_id ?? null,
        applicableGradeId:
          raw.ApplicableGradeId ?? raw.applicable_grade_id ?? null,
        applicableLocationId:
          raw.ApplicableLocationId ?? raw.applicable_location_id ?? null,
        sendOnMail: raw.SendOnMail ?? raw.send_on_mail ?? false,
      } as QuestionnaireTemplate;
    } catch {
      return undefined;
    }
  }
  async createQuestionnaireTemplate(
    template: InsertQuestionnaireTemplate
  ): Promise<QuestionnaireTemplate> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Name", template.name)
      .input("Description", template.description || null)
      .input("TargetRole", (template as any).targetRole || null)
      .input("Questions", JSON.stringify((template as any).questions || []))
      .input("Year", (template as any).year || null)
      .input("Status", template.status || "active")
      .input("ApplicableCategory", (template as any).applicableCategory || null)
      .input("ApplicableLevelId", (template as any).applicableLevelId || null)
      .input("ApplicableGradeId", (template as any).applicableGradeId || null)
      .input(
        "ApplicableLocationId",
        (template as any).applicableLocationId || null
      )
      .input("SendOnMail", (template as any).sendOnMail || false)
      .input("CreatedById", (template as any).createdById || null);
    const result = await req.execute("dbo.CreateQuestionnaireTemplate");
    return (await this.getQuestionnaireTemplate(result.recordset[0].Id))!;
  }
  async updateQuestionnaireTemplate(
    id: string,
    template: Partial<InsertQuestionnaireTemplate>
  ): Promise<QuestionnaireTemplate> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Id", id)
      .input("Name", template.name || null)
      .input("Description", template.description || null)
      .input("TargetRole", (template as any).targetRole || null)
      .input(
        "Questions",
        template.questions ? JSON.stringify(template.questions) : null
      )
      .input("Year", (template as any).year || null)
      .input("Status", template.status || null)
      .input("ApplicableCategory", (template as any).applicableCategory || null)
      .input("ApplicableLevelId", (template as any).applicableLevelId || null)
      .input("ApplicableGradeId", (template as any).applicableGradeId || null)
      .input(
        "ApplicableLocationId",
        (template as any).applicableLocationId || null
      )
      .input("SendOnMail", (template as any).sendOnMail ?? null);
    const result = await req.execute("dbo.UpdateQuestionnaireTemplate");
    return (await this.getQuestionnaireTemplate(result.recordset[0].Id))!;
  }
  async deleteQuestionnaireTemplate(id: string): Promise<void> {
    const pool = await getPool();
    try {
      await pool
        .request()
        .input("Id", id)
        .execute("dbo.DeleteQuestionnaireTemplate");
    } catch {}
  }
  async getQuestionnaireTemplatesByYear(
    year: number
  ): Promise<QuestionnaireTemplate[]> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("Year", year)
        .execute("dbo.GetQuestionnaireTemplatesByYear");
      return (result.recordset || []).map(
        (r:any) =>
          ({
            id: r.Id,
            name: r.Name,
            description: r.Description ?? null,
            targetRole: r.TargetRole ?? null,
            questions: r.Questions ? safeParseJson(r.Questions) : null,
            year: r.Year ?? null,
            status: r.Status ?? "active",
            createdAt: r.CreatedAt ?? null,
            updatedAt: r.UpdatedAt ?? null,
            createdById: r.CreatedById ?? null,
            applicableCategory: r.ApplicableCategory ?? null,
            applicableLevelId: r.ApplicableLevelId ?? null,
            applicableGradeId: r.ApplicableGradeId ?? null,
            applicableLocationId: r.ApplicableLocationId ?? null,
            sendOnMail: r.SendOnMail ?? false,
          } as QuestionnaireTemplate)
      );
    } catch {
      return [];
    }
  }

  // ---------- Evaluations ----------
  async getEvaluations(filters?: {
    employeeId?: string;
    managerId?: string;
    reviewCycleId?: string;
    status?: string;
  }): Promise<Evaluation[]> {
    const pool = await getPool();
    try {
      const req = pool
        .request()
        .input("EmployeeId", filters?.employeeId || null)
        .input("ManagerId", filters?.managerId || null)
        .input("ReviewCycleId", filters?.reviewCycleId || null)
        .input("Status", filters?.status || null);
      const result = await req.execute("dbo.GetEvaluations");
      return (result.recordset || []).map(mapRawEvaluation);
    } catch {
      return [];
    }
  }
  async getEvaluation(id: string): Promise<Evaluation | undefined> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("Id", id)
        .execute("dbo.GetEvaluation");
      const raw = result.recordset[0];
      return raw ? mapRawEvaluation(raw) : undefined;
    } catch {
      return undefined;
    }
  }
  async createEvaluation(e: InsertEvaluation): Promise<Evaluation> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("EmployeeId", e.employeeId)
      .input("ManagerId", e.managerId)
      .input("ReviewCycleId", e.reviewCycleId || null)
      .input("Status", e.status || "not_started")
      .input("InitiatedAppraisalId", (e as any).initiatedAppraisalId || null);
    const result = await req.execute("dbo.CreateEvaluation");
    return mapRawEvaluation(result.recordset[0]);
  }
  async updateEvaluation(
    id: string,
    e: Partial<InsertEvaluation>
  ): Promise<Evaluation> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Id", id)
      .input(
        "SelfEvaluationData",
        e.selfEvaluationData ? JSON.stringify(e.selfEvaluationData) : null
      )
      .input(
        "SelfEvaluationSubmittedAt",
        (e as any).selfEvaluationSubmittedAt || null
      )
      .input(
        "ManagerEvaluationData",
        e.managerEvaluationData ? JSON.stringify(e.managerEvaluationData) : null
      )
      .input(
        "ManagerEvaluationSubmittedAt",
        (e as any).managerEvaluationSubmittedAt || null
      )
      .input("OverallRating", (e as any).overallRating || null)
      .input("Status", e.status || null)
      .input("MeetingScheduledAt", (e as any).meetingScheduledAt || null)
      .input("MeetingNotes", (e as any).meetingNotes || null)
      .input("MeetingCompletedAt", (e as any).meetingCompletedAt || null)
      .input("FinalizedAt", (e as any).finalizedAt || null)
      .input("ShowNotesToEmployee", (e as any).showNotesToEmployee ?? null)
      .input("CalibratedRating", (e as any).calibratedRating || null)
      .input("CalibrationRemarks", (e as any).calibrationRemarks || null)
      .input("CalibratedBy", (e as any).calibratedBy || null)
      .input("CalibratedAt", (e as any).calibratedAt || null);
    const result = await req.execute("dbo.UpdateEvaluation");
    return mapRawEvaluation(result.recordset[0]);
  }
  async deleteEvaluation(id: string): Promise<void> {
    const pool = await getPool();
    try {
      await pool.request().input("Id", id).execute("dbo.DeleteEvaluation");
    } catch {}
  }
  async getEvaluationByEmployeeAndCycle(
    employeeId: string,
    reviewCycleId: string
  ): Promise<Evaluation | undefined> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("EmployeeId", employeeId)
        .input("ReviewCycleId", reviewCycleId)
        .execute("dbo.GetEvaluationByEmployeeAndCycle");
      const raw = result.recordset[0];
      return raw ? mapRawEvaluation(raw) : undefined;
    } catch {
      return undefined;
    }
  }
  async getEvaluationsByInitiatedAppraisal(
    initiatedAppraisalId: string
  ): Promise<Evaluation[]> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("InitiatedAppraisalId", initiatedAppraisalId)
        .execute("dbo.GetEvaluationsByInitiatedAppraisal");
      return (result.recordset || []).map(mapRawEvaluation);
    } catch {
      return [];
    }
  }
  async getScheduledMeetingsForCompany(companyId: string): Promise<any[]> {
    return [];
  }

  // ---------- Levels ----------
  async getLevels(createdById: string): Promise<Level[]> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("CreatedById", createdById)
        .execute("dbo.GetLevels");
      return (result.recordset || []).map(mapRawLevel);
    } catch {
      return [];
    }
  }
  async getLevel(id: string, createdById: string): Promise<Level | undefined> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("Id", id)
        .input("CreatedById", createdById)
        .execute("dbo.GetLevel");
      const raw = result.recordset[0];
      return raw ? mapRawLevel(raw) : undefined;
    } catch {
      return undefined;
    }
  }
  async createLevel(level: InsertLevel, createdById: string): Promise<Level> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Code", level.code)
      .input("Description", level.description)
      .input("CreatedById", createdById)
      .input("Status", level.status || "active");
    const result = await req.execute("dbo.CreateLevel");
    return mapRawLevel(result.recordset[0]);
  }
  async updateLevel(
    id: string,
    level: Partial<InsertLevel>,
    createdById: string
  ): Promise<Level> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Id", id)
      .input("Code", level.code || null)
      .input("Description", level.description || null)
      .input("Status", level.status || null)
      .input("CreatedById", createdById);
    const result = await req.execute("dbo.UpdateLevel");
    return mapRawLevel(result.recordset[0]);
  }
  async deleteLevel(id: string, createdById: string): Promise<void> {
    const pool = await getPool();
    try {
      await pool
        .request()
        .input("Id", id)
        .input("CreatedById", createdById)
        .execute("dbo.DeleteLevel");
    } catch {}
  }

  // ---------- Grades ----------
  async getGrades(createdById: string): Promise<Grade[]> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("CreatedById", createdById)
        .execute("dbo.GetGrades");
      return (result.recordset || []).map(mapRawGrade);
    } catch {
      return [];
    }
  }
  async getGrade(id: string, createdById: string): Promise<Grade | undefined> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("Id", id)
        .input("CreatedById", createdById)
        .execute("dbo.GetGrade");
      const raw = result.recordset[0];
      return raw ? mapRawGrade(raw) : undefined;
    } catch {
      return undefined;
    }
  }
  async createGrade(grade: InsertGrade, createdById: string): Promise<Grade> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Code", grade.code)
      .input("Description", grade.description)
      .input("CreatedById", createdById)
      .input("Status", grade.status || "active");
    const result = await req.execute("dbo.CreateGrade");
    return mapRawGrade(result.recordset[0]);
  }
  async updateGrade(
    id: string,
    grade: Partial<InsertGrade>,
    createdById: string
  ): Promise<Grade> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Id", id)
      .input("Code", grade.code || null)
      .input("Description", grade.description || null)
      .input("Status", grade.status || null)
      .input("CreatedById", createdById);
    const result = await req.execute("dbo.UpdateGrade");
    return mapRawGrade(result.recordset[0]);
  }
  async deleteGrade(id: string, createdById: string): Promise<void> {
    const pool = await getPool();
    try {
      await pool
        .request()
        .input("Id", id)
        .input("CreatedById", createdById)
        .execute("dbo.DeleteGrade");
    } catch {}
  }

  // ---------- Departments ----------
  async getDepartments(createdById: string): Promise<Department[]> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("CreatedById", createdById)
        .execute("dbo.GetDepartments");
      return (result.recordset || []).map(mapRawDepartment);
    } catch {
      return [];
    }
  }
  async getDepartment(
    id: string,
    createdById: string
  ): Promise<Department | undefined> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("Id", id)
        .input("CreatedById", createdById)
        .execute("dbo.GetDepartment");
      const raw = result.recordset[0];
      return raw ? mapRawDepartment(raw) : undefined;
    } catch {
      return undefined;
    }
  }
  async createDepartment(
    department: InsertDepartment,
    createdById: string
  ): Promise<Department> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Code", department.code)
      .input("Description", department.description)
      .input("CreatedById", createdById)
      .input("Status", department.status || "active");
    const result = await req.execute("dbo.CreateDepartment");
    return mapRawDepartment(result.recordset[0]);
  }
  async updateDepartment(
    id: string,
    department: Partial<InsertDepartment>,
    createdById: string
  ): Promise<Department> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Id", id)
      .input("Code", department.code || null)
      .input("Description", department.description || null)
      .input("Status", department.status || null)
      .input("CreatedById", createdById);
    const result = await req.execute("dbo.UpdateDepartment");
    return mapRawDepartment(result.recordset[0]);
  }
  async deleteDepartment(id: string, createdById: string): Promise<void> {
    const pool = await getPool();
    try {
      await pool
        .request()
        .input("Id", id)
        .input("CreatedById", createdById)
        .execute("dbo.DeleteDepartment");
    } catch {}
  }

  // ---------- Appraisal Cycles ----------
  async getAppraisalCycles(createdById: string): Promise<AppraisalCycle[]> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("CreatedById", createdById)
        .execute("dbo.GetAppraisalCycles");
      return (result.recordset || []).map(mapRawAppraisalCycle);
    } catch {
      return [];
    }
  }
  async getAllAppraisalCycles(companyId: string): Promise<AppraisalCycle[]> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("CompanyId", companyId)
        .execute("dbo.GetAllAppraisalCycles");
      return (result.recordset || []).map(mapRawAppraisalCycle);
    } catch {
      return [];
    }
  }
  async getAppraisalCycle(
    id: string,
    createdById?: string
  ): Promise<AppraisalCycle | undefined> {
    const pool = await getPool();
    try {
      const req = pool.request().input("Id", id);
      if (createdById) req.input("CreatedById", createdById);
      const result = await req.execute("dbo.GetAppraisalCycle");
      const raw = result.recordset[0];
      return raw ? mapRawAppraisalCycle(raw) : undefined;
    } catch {
      return undefined;
    }
  }
  async createAppraisalCycle(
    cycle: InsertAppraisalCycle,
    createdById: string
  ): Promise<AppraisalCycle> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Code", cycle.code)
      .input("Description", cycle.description)
      .input("FromDate", cycle.fromDate)
      .input("ToDate", cycle.toDate)
      .input("CreatedById", createdById)
      .input("Status", cycle.status || "active");
    const result = await req.execute("dbo.CreateAppraisalCycle");
    return mapRawAppraisalCycle(result.recordset[0]);
  }
  async updateAppraisalCycle(
    id: string,
    cycle: Partial<InsertAppraisalCycle>,
    createdById: string
  ): Promise<AppraisalCycle> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Id", id)
      .input("Code", cycle.code || null)
      .input("Description", cycle.description || null)
      .input("FromDate", cycle.fromDate || null)
      .input("ToDate", cycle.toDate || null)
      .input("Status", cycle.status || null)
      .input("CreatedById", createdById);
    const result = await req.execute("dbo.UpdateAppraisalCycle");
    return mapRawAppraisalCycle(result.recordset[0]);
  }
  async deleteAppraisalCycle(id: string, createdById: string): Promise<void> {
    const pool = await getPool();
    try {
      await pool
        .request()
        .input("Id", id)
        .input("CreatedById", createdById)
        .execute("dbo.DeleteAppraisalCycle");
    } catch {}
  }

  // ---------- Review Frequencies ----------
  async getReviewFrequencies(createdById: string): Promise<ReviewFrequency[]> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("CreatedById", createdById)
        .execute("dbo.GetReviewFrequencies");
      return (result.recordset || []).map(mapRawReviewFrequency);
    } catch {
      return [];
    }
  }
  async getReviewFrequency(
    id: string,
    createdById: string
  ): Promise<ReviewFrequency | undefined> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("Id", id)
        .input("CreatedById", createdById)
        .execute("dbo.GetReviewFrequency");
      const raw = result.recordset[0];
      return raw ? mapRawReviewFrequency(raw) : undefined;
    } catch {
      return undefined;
    }
  }
  async createReviewFrequency(
    freq: InsertReviewFrequency,
    createdById: string
  ): Promise<ReviewFrequency> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Code", freq.code)
      .input("Description", freq.description)
      .input("CreatedById", createdById)
      .input("Status", freq.status || "active");
    const result = await req.execute("dbo.CreateReviewFrequency");
    return mapRawReviewFrequency(result.recordset[0]);
  }
  async updateReviewFrequency(
    id: string,
    freq: Partial<InsertReviewFrequency>,
    createdById: string
  ): Promise<ReviewFrequency> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Id", id)
      .input("Code", freq.code || null)
      .input("Description", freq.description || null)
      .input("Status", freq.status || null)
      .input("CreatedById", createdById);
    const result = await req.execute("dbo.UpdateReviewFrequency");
    return mapRawReviewFrequency(result.recordset[0]);
  }
  async deleteReviewFrequency(id: string, createdById: string): Promise<void> {
    const pool = await getPool();
    try {
      await pool
        .request()
        .input("Id", id)
        .input("CreatedById", createdById)
        .execute("dbo.DeleteReviewFrequency");
    } catch {}
  }

  // ---------- Frequency Calendars ----------
  async getFrequencyCalendars(
    createdById: string
  ): Promise<FrequencyCalendar[]> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("CreatedById", createdById)
        .execute("dbo.GetFrequencyCalendars");
      return (result.recordset || []).map(mapRawFrequencyCalendar);
    } catch {
      return [];
    }
  }
  async getAllFrequencyCalendars(): Promise<FrequencyCalendar[]> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .execute("dbo.GetAllFrequencyCalendars");
      return (result.recordset || []).map(mapRawFrequencyCalendar);
    } catch {
      return [];
    }
  }
  async getFrequencyCalendar(
    id: string,
    createdById?: string
  ): Promise<FrequencyCalendar | undefined> {
    const pool = await getPool();
    try {
      const req = pool.request().input("Id", id);
      if (createdById) req.input("CreatedById", createdById);
      const result = await req.execute("dbo.GetFrequencyCalendar");
      const raw = result.recordset[0];
      return raw ? mapRawFrequencyCalendar(raw) : undefined;
    } catch {
      return undefined;
    }
  }
  async createFrequencyCalendar(
    calendar: InsertFrequencyCalendar,
    createdById: string
  ): Promise<FrequencyCalendar> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Code", calendar.code)
      .input("Description", calendar.description)
      .input("AppraisalCycleId", calendar.appraisalCycleId)
      .input("ReviewFrequencyId", calendar.reviewFrequencyId)
      .input("CreatedById", createdById)
      .input("Status", calendar.status || "active");
    const result = await req.execute("dbo.CreateFrequencyCalendar");
    return mapRawFrequencyCalendar(result.recordset[0]);
  }
  async updateFrequencyCalendar(
    id: string,
    calendar: Partial<InsertFrequencyCalendar>,
    createdById: string
  ): Promise<FrequencyCalendar> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Id", id)
      .input("Code", calendar.code || null)
      .input("Description", calendar.description || null)
      .input("AppraisalCycleId", calendar.appraisalCycleId || null)
      .input("ReviewFrequencyId", calendar.reviewFrequencyId || null)
      .input("Status", calendar.status || null)
      .input("CreatedById", createdById);
    const result = await req.execute("dbo.UpdateFrequencyCalendar");
    return mapRawFrequencyCalendar(result.recordset[0]);
  }
  async deleteFrequencyCalendar(
    id: string,
    createdById: string
  ): Promise<void> {
    const pool = await getPool();
    try {
      await pool
        .request()
        .input("Id", id)
        .input("CreatedById", createdById)
        .execute("dbo.DeleteFrequencyCalendar");
    } catch {}
  }

  // ---------- Frequency Calendar Details ----------
  async getFrequencyCalendarDetails(
    createdById: string
  ): Promise<FrequencyCalendarDetails[]> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("CreatedById", createdById)
        .execute("dbo.GetFrequencyCalendarDetails");
      return (result.recordset || []).map(mapRawFrequencyCalendarDetails);
    } catch {
      return [];
    }
  }
  async getAllFrequencyCalendarDetails(
    companyId: string
  ): Promise<FrequencyCalendarDetails[]> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("CompanyId", companyId)
        .execute("dbo.GetAllFrequencyCalendarDetails");
      return (result.recordset || []).map(mapRawFrequencyCalendarDetails);
    } catch {
      return [];
    }
  }
  async getFrequencyCalendarDetailsByCalendarId(
    calendarId: string
  ): Promise<FrequencyCalendarDetails[]> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("CalendarId", calendarId)
        .execute("dbo.GetFrequencyCalendarDetailsByCalendarId");
      return (result.recordset || []).map(mapRawFrequencyCalendarDetails);
    } catch {
      return [];
    }
  }
  async getFrequencyCalendarDetail(
    id: string,
    createdById?: string
  ): Promise<FrequencyCalendarDetails | undefined> {
    const pool = await getPool();
    try {
      const req = pool.request().input("Id", id);
      if (createdById) req.input("CreatedById", createdById);
      const result = await req.execute("dbo.GetFrequencyCalendarDetail");
      const raw = result.recordset[0];
      return raw ? mapRawFrequencyCalendarDetails(raw) : undefined;
    } catch {
      return undefined;
    }
  }
  async createFrequencyCalendarDetails(
    details: InsertFrequencyCalendarDetails,
    createdById: string
  ): Promise<FrequencyCalendarDetails> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("FrequencyCalendarId", details.frequencyCalendarId)
      .input("DisplayName", details.displayName)
      .input("StartDate", details.startDate)
      .input("EndDate", details.endDate)
      .input("CreatedById", createdById)
      .input("Status", details.status || "active");
    const result = await req.execute("dbo.CreateFrequencyCalendarDetails");
    return mapRawFrequencyCalendarDetails(result.recordset[0]);
  }
  async updateFrequencyCalendarDetails(
    id: string,
    details: Partial<InsertFrequencyCalendarDetails>
  ): Promise<FrequencyCalendarDetails> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Id", id)
      .input("FrequencyCalendarId", details.frequencyCalendarId || null)
      .input("DisplayName", details.displayName || null)
      .input("StartDate", details.startDate || null)
      .input("EndDate", details.endDate || null)
      .input("Status", details.status || null);
    const result = await req.execute("dbo.UpdateFrequencyCalendarDetails");
    return mapRawFrequencyCalendarDetails(result.recordset[0]);
  }
  async deleteFrequencyCalendarDetails(id: string): Promise<void> {
    const pool = await getPool();
    try {
      await pool
        .request()
        .input("Id", id)
        .execute("dbo.DeleteFrequencyCalendarDetails");
    } catch {}
  }

  // ---------- Appraisal Groups ----------
  async getAppraisalGroups(createdById: string): Promise<AppraisalGroup[]> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("CreatedById", createdById)
        .execute("dbo.GetAppraisalGroups");
      return (result.recordset || []).map(mapRawAppraisalGroup);
    } catch {
      return [];
    }
  }
  async getAppraisalGroup(
    id: string,
    createdById: string
  ): Promise<AppraisalGroup | undefined> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("Id", id)
        .input("CreatedById", createdById)
        .execute("dbo.GetAppraisalGroup");
      const raw = result.recordset[0];
      return raw ? mapRawAppraisalGroup(raw) : undefined;
    } catch {
      return undefined;
    }
  }
  async createAppraisalGroup(
    group: InsertAppraisalGroup,
    createdById: string,
    companyId?: string
  ): Promise<AppraisalGroup> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Name", group.name)
      .input("Description", group.description || null)
      .input("CreatedById", createdById)
      .input("CompanyId", companyId || null)
      .input("Status", (group as any).status || "active");
    const result = await req.execute("dbo.CreateAppraisalGroup");
    return mapRawAppraisalGroup(result.recordset[0]);
  }
  async updateAppraisalGroup(
    id: string,
    group: Partial<InsertAppraisalGroup>,
    createdById: string
  ): Promise<AppraisalGroup> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("Id", id)
      .input("Name", group.name || null)
      .input("Description", group.description || null)
      .input("Status", (group as any).status || null)
      .input("CreatedById", createdById);
    const result = await req.execute("dbo.UpdateAppraisalGroup");
    return mapRawAppraisalGroup(result.recordset[0]);
  }
  async deleteAppraisalGroup(id: string, createdById: string): Promise<void> {
    const pool = await getPool();
    try {
      await pool
        .request()
        .input("Id", id)
        .input("CreatedById", createdById)
        .execute("dbo.DeleteAppraisalGroup");
    } catch {}
  }
  async getAppraisalGroupsWithMembers(
    createdById: string
  ): Promise<(AppraisalGroup & { members: AppraisalGroupMember[] })[]> {
    const groups = await this.getAppraisalGroups(createdById);
    const withMembers = await Promise.all(
      groups.map(async (g) => {
        const members = await this.getAppraisalGroupMembers(g.id, createdById);
        return { ...g, members };
      })
    );
    return withMembers;
  }
  async getAppraisalGroupMembers(
    appraisalGroupId: string,
    _createdById: string
  ): Promise<AppraisalGroupMember[]> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("AppraisalGroupId", appraisalGroupId)
        .execute("dbo.GetAppraisalGroupMembers");
      return (result.recordset || []).map(mapRawAppraisalGroupMember);
    } catch {
      return [];
    }
  }
  async addAppraisalGroupMember(
    member: InsertAppraisalGroupMember,
    _createdById: string
  ): Promise<AppraisalGroupMember> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("AppraisalGroupId", member.appraisalGroupId)
      .input("UserId", member.userId)
      .input("AddedById", member.addedById);
    const result = await req.execute("dbo.AddAppraisalGroupMember");
    return mapRawAppraisalGroupMember(result.recordset[0]);
  }
  async removeAppraisalGroupMember(
    appraisalGroupId: string,
    userId: string,
    _createdById: string
  ): Promise<void> {
    const pool = await getPool();
    try {
      await pool
        .request()
        .input("AppraisalGroupId", appraisalGroupId)
        .input("UserId", userId)
        .execute("dbo.RemoveAppraisalGroupMember");
    } catch {}
  }

  // ---------- Initiated Appraisals ----------
  async createInitiatedAppraisal(
    appraisal: InsertInitiatedAppraisal,
    createdById: string
  ): Promise<InitiatedAppraisal> {
    const pool = await getPool();
    // Align with current SP signature (FrequencyCalendarDetailId, AppraisalCycleId, QuestionnaireTemplateId, InitiatedById, Status)
    // We persist extended fields only in memory for now until SP/table evolves.
    const questionnaireTemplateId =
      (appraisal.questionnaireTemplateIds &&
        appraisal.questionnaireTemplateIds[0]) ||
      (appraisal as any).questionnaireTemplateId ||
      null;
    const req = pool
      .request()
      .input(
        "FrequencyCalendarDetailId",
        (appraisal as any).frequencyCalendarDetailId || null
      )
      .input("AppraisalCycleId", (appraisal as any).appraisalCycleId || null)
      .input("QuestionnaireTemplateId", questionnaireTemplateId)
      .input("InitiatedById", createdById)
      .input("Status", appraisal.status || "initiated");
    const result = await req.execute("dbo.CreateInitiatedAppraisal");
    const raw = result.recordset[0];
    const mapped = mapRawInitiatedAppraisal(raw);
    const augmented: InitiatedAppraisal = {
      ...mapped,
      appraisalGroupId: appraisal.appraisalGroupId,
      appraisalType: appraisal.appraisalType,
      questionnaireTemplateIds:
        appraisal.questionnaireTemplateIds ||
        (questionnaireTemplateId ? [questionnaireTemplateId] : []),
      documentUrl: appraisal.documentUrl || null,
      frequencyCalendarId: appraisal.frequencyCalendarId || null,
      daysToInitiate: appraisal.daysToInitiate || 0,
      daysToClose: appraisal.daysToClose || 30,
      numberOfReminders: appraisal.numberOfReminders || 3,
      excludeTenureLessThanYear: appraisal.excludeTenureLessThanYear || false,
      excludedEmployeeIds: appraisal.excludedEmployeeIds || [],
      makePublic: appraisal.makePublic || false,
      publishType: appraisal.publishType || "now",
    } as InitiatedAppraisal;
    saveInitiatedAppraisalAugmentation({
      id: augmented.id,
      appraisalGroupId: augmented.appraisalGroupId,
      appraisalType: augmented.appraisalType,
      questionnaireTemplateIds: augmented.questionnaireTemplateIds,
      documentUrl: augmented.documentUrl,
      frequencyCalendarId: augmented.frequencyCalendarId,
      daysToInitiate: augmented.daysToInitiate,
      daysToClose: augmented.daysToClose,
      numberOfReminders: augmented.numberOfReminders,
      excludeTenureLessThanYear: augmented.excludeTenureLessThanYear,
      excludedEmployeeIds: augmented.excludedEmployeeIds,
      makePublic: augmented.makePublic,
      publishType: augmented.publishType,
    });
    return augmented;
  }
  async getInitiatedAppraisal(
    id: string
  ): Promise<InitiatedAppraisal | undefined> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("Id", id)
        .execute("dbo.GetInitiatedAppraisal");
      const raw = result.recordset[0];
      if (!raw) return undefined;
      const mapped = mapRawInitiatedAppraisal(raw);
      const aug = getInitiatedAppraisalAugmentation(mapped.id);
      return aug ? { ...mapped, ...aug } : mapped;
    } catch {
      return undefined;
    }
  }
  async getInitiatedAppraisals(
    createdById: string
  ): Promise<InitiatedAppraisal[]> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("CreatedById", createdById)
        .execute("dbo.GetInitiatedAppraisals");
      return (result.recordset || []).map((r:any) =>
        mergeInitiatedAppraisal(mapRawInitiatedAppraisal(r))
      );
    } catch {
      return [];
    }
  }
  async updateInitiatedAppraisalStatus(
    id: string,
    status: string
  ): Promise<void> {
    const pool = await getPool();
    try {
      await pool
        .request()
        .input("Id", id)
        .input("Status", status)
        .execute("dbo.UpdateInitiatedAppraisalStatus");
    } catch {}
  }
  async createInitiatedAppraisalDetailTiming(
    timing: InsertInitiatedAppraisalDetailTiming
  ): Promise<InitiatedAppraisalDetailTiming> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("InitiatedAppraisalId", timing.initiatedAppraisalId)
      .input("FrequencyCalendarDetailId", timing.frequencyCalendarDetailId)
      .input("DaysToInitiate", timing.daysToInitiate)
      .input("DaysToClose", timing.daysToClose)
      .input("NumberOfReminders", timing.numberOfReminders);
    const result = await req.execute(
      "dbo.CreateInitiatedAppraisalDetailTiming"
    );
    return mapRawInitiatedAppraisalDetailTiming(result.recordset[0]);
  }
  async getInitiatedAppraisalDetailTimings(
    initiatedAppraisalId: string
  ): Promise<InitiatedAppraisalDetailTiming[]> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("InitiatedAppraisalId", initiatedAppraisalId)
        .execute("dbo.GetInitiatedAppraisalDetailTimings");
      return (result.recordset || []).map(mapRawInitiatedAppraisalDetailTiming);
    } catch {
      return [];
    }
  }
  async updateInitiatedAppraisalDetailTimingStatus(
    id: string,
    status: string
  ): Promise<void> {
    const pool = await getPool();
    try {
      await pool
        .request()
        .input("Id", id)
        .input("Status", status)
        .execute("dbo.UpdateInitiatedAppraisalDetailTimingStatus");
    } catch {}
  }

  // ---------- Publish Questionnaires ----------
  async getPublishQuestionnaires(
    createdById: string
  ): Promise<PublishQuestionnaire[]> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("CreatedById", createdById)
        .execute("dbo.GetPublishQuestionnaires");
      return (result.recordset || []).map(
        (raw:any) =>
          ({
            id: raw.Id ?? raw.id,
            code: raw.Code ?? raw.code,
            displayName: raw.DisplayName ?? raw.display_name ?? raw.displayName,
            templateId:
              raw.QuestionnaireTemplateId ?? raw.template_id ?? raw.templateId,
            frequencyCalendarId:
              raw.FrequencyCalendarDetailId ??
              raw.frequency_calendar_id ??
              null,
            status: raw.Status ?? raw.status ?? "active",
            publishType:
              raw.PublishType ?? raw.publish_type ?? raw.publishType ?? "now",
            createdAt: raw.CreatedAt ? new Date(raw.CreatedAt) : null,
            updatedAt: raw.UpdatedAt ? new Date(raw.UpdatedAt) : null,
            createdById:
              raw.CreatedById ??
              raw.created_by_id ??
              raw.createdById ??
              createdById,
          } as PublishQuestionnaire)
      );
    } catch {
      return [];
    }
  }
  async getPublishQuestionnaire(
    id: string,
    createdById: string
  ): Promise<PublishQuestionnaire | undefined> {
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input("Id", id)
        .execute("dbo.GetPublishQuestionnaire");
      const raw = result.recordset[0];
      if (!raw) return undefined;
      if (
        (raw.CreatedById ?? raw.created_by_id) &&
        (raw.CreatedById ?? raw.created_by_id) !== createdById
      )
        return undefined;
      return {
        id: raw.Id ?? raw.id,
        code: raw.Code ?? raw.code,
        displayName: raw.DisplayName ?? raw.display_name ?? raw.DisplayName,
        templateId:
          raw.QuestionnaireTemplateId ?? raw.template_id ?? raw.templateId,
        frequencyCalendarId:
          raw.FrequencyCalendarDetailId ?? raw.frequency_calendar_id ?? null,
        status: raw.Status ?? raw.status ?? "active",
        publishType:
          raw.PublishType ?? raw.publish_type ?? raw.publishType ?? "now",
        createdAt: raw.CreatedAt ? new Date(raw.CreatedAt) : null,
        updatedAt: raw.UpdatedAt ? new Date(raw.UpdatedAt) : null,
        createdById:
          raw.CreatedById ??
          raw.created_by_id ??
          raw.createdById ??
          createdById,
      } as PublishQuestionnaire;
    } catch {
      return undefined;
    }
  }
  async createPublishQuestionnaire(
    pq: InsertPublishQuestionnaire,
    createdById: string
  ): Promise<PublishQuestionnaire> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("QuestionnaireTemplateId", pq.templateId)
      .input("QuestionnaireName", pq.displayName)
      .input("FrequencyCalendarDetailId", pq.frequencyCalendarId || null)
      .input("FrequencyCalendarName", "")
      .input("ApplicableTo", "all")
      .input("InitiatedAppraisalId", null)
      .input("Code", pq.code)
      .input("DisplayName", pq.displayName)
      .input("PublishType", pq.publishType || "now")
      .input("Status", pq.status || "active")
      .input("CreatedById", createdById);
    const result = await req.execute("dbo.CreatePublishQuestionnaire");
    return (await this.getPublishQuestionnaire(
      result.recordset[0].Id,
      createdById
    ))!;
  }
  async updatePublishQuestionnaire(
    id: string,
    pq: Partial<InsertPublishQuestionnaire>,
    createdById: string
  ): Promise<PublishQuestionnaire> {
    const pool = await getPool();
    // Ownership check
    const existing = await this.getPublishQuestionnaire(id, createdById);
    if (!existing) throw new Error("Not found");
    const req = pool
      .request()
      .input("Id", id)
      .input("InitiatedAppraisalId", null);
    const result = await req.execute("dbo.UpdatePublishQuestionnaire");
    return (await this.getPublishQuestionnaire(
      result.recordset[0].Id,
      createdById
    ))!;
  }
  async deletePublishQuestionnaire(
    id: string,
    createdById: string
  ): Promise<void> {
    const pool = await getPool();
    try {
      const existing = await this.getPublishQuestionnaire(id, createdById);
      if (!existing) throw new Error("Not found");
      await pool
        .request()
        .input("Id", id)
        .execute("dbo.DeletePublishQuestionnaire");
    } catch {}
  }

  // ---------- Scheduled Tasks ----------
  async createScheduledAppraisalTask(
    task: InsertScheduledAppraisalTask
  ): Promise<ScheduledAppraisalTask> {
    const pool = await getPool();
    const req = pool
      .request()
      .input("InitiatedAppraisalId", task.initiatedAppraisalId)
      .input("FrequencyCalendarDetailId", task.frequencyCalendarDetailId)
      .input("ScheduledDate", task.scheduledDate)
      .input("Status", task.status || "pending");
    const result = await req.execute("dbo.CreateScheduledAppraisalTask");
    return mapRawScheduledAppraisalTask(result.recordset[0]);
  }
}

export const storage = new DatabaseStorage();
