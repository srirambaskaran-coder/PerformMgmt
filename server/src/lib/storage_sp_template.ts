/**
 * CONVERTED STORAGE.TS - MSSQL SP BASED
 * This file shows the complete pattern for converting storage.ts to use stored procedures
 * Apply these patterns to all remaining methods in your storage.ts
 */

import { getPool } from "./mssql";
import * as sql from "mssql";
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
  AccessToken,
  InsertAccessToken,
  CalendarCredential,
  InsertCalendarCredential,
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
} from "@shared/schema";

// Helper function to sanitize user objects by removing passwordHash
function sanitizeUser(user: User): SafeUser {
  const { passwordHash, ...sanitized } = user;
  return sanitized;
}

// Helper function to sanitize array of users
function sanitizeUsers(users: User[]): SafeUser[] {
  return users.map(sanitizeUser);
}

// Keep the same IStorage interface - NO CHANGES
export interface IStorage {
  // ... all interface methods remain exactly the same ...
}

export class DatabaseStorage implements IStorage {
  // ============================================
  // USER OPERATIONS
  // ============================================

  async getUser(id: string): Promise<User | undefined> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Id", sql.UniqueIdentifier, id)
      .execute("dbo.GetUser");
    return result.recordset[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Email", sql.NVarChar(255), email)
      .execute("dbo.GetUserByEmail");
    return result.recordset[0];
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
    const pool = await getPool();
    const result = await pool
      .request()
      .input("RequestingUserId", sql.UniqueIdentifier, requestingUserId || null)
      .input("Role", sql.NVarChar(50), filters?.role || null)
      .input("CompanyId", sql.UniqueIdentifier, filters?.companyId || null)
      .input("Department", sql.NVarChar(255), filters?.department || null)
      .input("Status", sql.NVarChar(20), filters?.status || null)
      .execute("dbo.GetUsers");
    return sanitizeUsers(result.recordset);
  }

  async getUsersByManager(managerId: string): Promise<SafeUser[]> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("ManagerId", sql.UniqueIdentifier, managerId)
      .execute("dbo.GetUsersByManager");
    return sanitizeUsers(result.recordset);
  }

  async createUser(user: InsertUser, creatorId?: string): Promise<SafeUser> {
    const pool = await getPool();
    const hashedPassword = user.passwordHash
      ? await bcrypt.hash(user.passwordHash, 10)
      : null;

    const result = await pool
      .request()
      .input("Email", sql.NVarChar(255), user.email)
      .input("FirstName", sql.NVarChar(255), user.firstName)
      .input("LastName", sql.NVarChar(255), user.lastName || null)
      .input("PasswordHash", sql.NVarChar(255), hashedPassword)
      .input("Role", sql.NVarChar(50), user.role || "employee")
      .input("Department", sql.NVarChar(255), user.department || null)
      .input("Designation", sql.NVarChar(255), user.designation || null)
      .input("ManagerId", sql.UniqueIdentifier, user.managerId || null)
      .input("CompanyId", sql.UniqueIdentifier, user.companyId || null)
      .input("LocationId", sql.UniqueIdentifier, user.locationId || null)
      .input("GradeId", sql.UniqueIdentifier, user.gradeId || null)
      .input("LevelId", sql.UniqueIdentifier, user.levelId || null)
      .input("Status", sql.NVarChar(20), user.status || "active")
      .input("Mobile", sql.NVarChar(20), user.mobile || null)
      .input("EmployeeCode", sql.NVarChar(50), user.employeeCode || null)
      .execute("dbo.CreateUser");

    return sanitizeUser(result.recordset[0]);
  }

  async updateUser(
    id: string,
    user: Partial<InsertUser>,
    requestingUserId?: string
  ): Promise<SafeUser> {
    const pool = await getPool();
    const hashedPassword = user.passwordHash
      ? await bcrypt.hash(user.passwordHash, 10)
      : null;

    const result = await pool
      .request()
      .input("Id", sql.UniqueIdentifier, id)
      .input("Email", sql.NVarChar(255), user.email || null)
      .input("FirstName", sql.NVarChar(255), user.firstName || null)
      .input("LastName", sql.NVarChar(255), user.lastName || null)
      .input("PasswordHash", sql.NVarChar(255), hashedPassword)
      .input("Role", sql.NVarChar(50), user.role || null)
      .input("Department", sql.NVarChar(255), user.department || null)
      .input("Designation", sql.NVarChar(255), user.designation || null)
      .input("ManagerId", sql.UniqueIdentifier, user.managerId || null)
      .input("CompanyId", sql.UniqueIdentifier, user.companyId || null)
      .input("LocationId", sql.UniqueIdentifier, user.locationId || null)
      .input("GradeId", sql.UniqueIdentifier, user.gradeId || null)
      .input("LevelId", sql.UniqueIdentifier, user.levelId || null)
      .input("Status", sql.NVarChar(20), user.status || null)
      .input("Mobile", sql.NVarChar(20), user.mobile || null)
      .input("EmployeeCode", sql.NVarChar(50), user.employeeCode || null)
      .input("RequestingUserId", sql.UniqueIdentifier, requestingUserId || null)
      .execute("dbo.UpdateUser");

    return sanitizeUser(result.recordset[0]);
  }

  async deleteUser(id: string, requestingUserId?: string): Promise<void> {
    const pool = await getPool();
    await pool
      .request()
      .input("Id", sql.UniqueIdentifier, id)
      .input("RequestingUserId", sql.UniqueIdentifier, requestingUserId || null)
      .execute("dbo.DeleteUser");
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Id", sql.UniqueIdentifier, userData.id)
      .input("Email", sql.NVarChar(255), userData.email)
      .input("FirstName", sql.NVarChar(255), userData.firstName || null)
      .input("LastName", sql.NVarChar(255), userData.lastName || null)
      .input(
        "ProfileImageUrl",
        sql.NVarChar(sql.MAX),
        userData.profileImageUrl || null
      )
      .execute("dbo.UpsertUser");
    return result.recordset[0];
  }

  // ============================================
  // COMPANY OPERATIONS
  // ============================================

  async getCompanies(): Promise<Company[]> {
    const pool = await getPool();
    const result = await pool.request().execute("dbo.GetCompanies");
    return result.recordset;
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Id", sql.UniqueIdentifier, id)
      .execute("dbo.GetCompany");
    return result.recordset[0];
  }

  async getCompanyByUrl(companyUrl: string): Promise<Company | undefined> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("CompanyUrl", sql.NVarChar(255), companyUrl)
      .execute("dbo.GetCompanyByUrl");
    return result.recordset[0];
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Name", sql.NVarChar(255), company.name)
      .input("CompanyUrl", sql.NVarChar(255), company.companyUrl)
      .input("Address", sql.NVarChar(sql.MAX), company.address || null)
      .input("City", sql.NVarChar(255), company.city || null)
      .input("State", sql.NVarChar(255), company.state || null)
      .input("Country", sql.NVarChar(255), company.country || null)
      .input("Pincode", sql.NVarChar(20), company.pincode || null)
      .input("Status", sql.NVarChar(20), company.status || "active")
      .execute("dbo.CreateCompany");
    return result.recordset[0];
  }

  async updateCompany(
    id: string,
    company: Partial<InsertCompany>
  ): Promise<Company> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Id", sql.UniqueIdentifier, id)
      .input("Name", sql.NVarChar(255), company.name || null)
      .input("CompanyUrl", sql.NVarChar(255), company.companyUrl || null)
      .input("Address", sql.NVarChar(sql.MAX), company.address || null)
      .input("City", sql.NVarChar(255), company.city || null)
      .input("State", sql.NVarChar(255), company.state || null)
      .input("Country", sql.NVarChar(255), company.country || null)
      .input("Pincode", sql.NVarChar(20), company.pincode || null)
      .input("Status", sql.NVarChar(20), company.status || null)
      .execute("dbo.UpdateCompany");
    return result.recordset[0];
  }

  async deleteCompany(id: string): Promise<void> {
    const pool = await getPool();
    await pool
      .request()
      .input("Id", sql.UniqueIdentifier, id)
      .execute("dbo.DeleteCompany");
  }

  // ============================================
  // LOCATION OPERATIONS
  // ============================================

  async getLocations(): Promise<Location[]> {
    const pool = await getPool();
    const result = await pool.request().execute("dbo.GetLocations");
    return result.recordset;
  }

  async getLocation(id: string): Promise<Location | undefined> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Id", sql.UniqueIdentifier, id)
      .execute("dbo.GetLocation");
    return result.recordset[0];
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Name", sql.NVarChar(255), location.name)
      .input("Address", sql.NVarChar(sql.MAX), location.address || null)
      .input("City", sql.NVarChar(255), location.city || null)
      .input("State", sql.NVarChar(255), location.state || null)
      .input("Country", sql.NVarChar(255), location.country || null)
      .input("Pincode", sql.NVarChar(20), location.pincode || null)
      .input("Status", sql.NVarChar(20), location.status || "active")
      .execute("dbo.CreateLocation");
    return result.recordset[0];
  }

  async updateLocation(
    id: string,
    location: Partial<InsertLocation>
  ): Promise<Location> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Id", sql.UniqueIdentifier, id)
      .input("Name", sql.NVarChar(255), location.name || null)
      .input("Address", sql.NVarChar(sql.MAX), location.address || null)
      .input("City", sql.NVarChar(255), location.city || null)
      .input("State", sql.NVarChar(255), location.state || null)
      .input("Country", sql.NVarChar(255), location.country || null)
      .input("Pincode", sql.NVarChar(20), location.pincode || null)
      .input("Status", sql.NVarChar(20), location.status || null)
      .execute("dbo.UpdateLocation");
    return result.recordset[0];
  }

  async deleteLocation(id: string): Promise<void> {
    const pool = await getPool();
    await pool
      .request()
      .input("Id", sql.UniqueIdentifier, id)
      .execute("dbo.DeleteLocation");
  }

  // ============================================
  // CONTINUE THIS PATTERN FOR ALL REMAINING ENTITIES:
  // - Levels (with createdById isolation)
  // - Grades (with createdById isolation)
  // - Departments (with createdById isolation)
  // - AppraisalCycles (with createdById isolation)
  // - ReviewFrequencies (with createdById isolation)
  // - FrequencyCalendars (with createdById isolation)
  // - FrequencyCalendarDetails (with createdById isolation)
  // - QuestionnaireTemplates (with JSON handling)
  // - ReviewCycles
  // - Evaluations (with JSON handling)
  // - EmailTemplates
  // - EmailConfig
  // - Registrations
  // - AccessTokens
  // - CalendarCredentials
  // - PublishQuestionnaires (with createdById isolation)
  // - AppraisalGroups (with createdById isolation)
  // - AppraisalGroupMembers
  // - InitiatedAppraisals
  // - InitiatedAppraisalDetailTimings
  // - ScheduledAppraisalTasks
  // ============================================

  // Example: LEVEL OPERATIONS (with isolation)
  async getLevels(createdById: string): Promise<Level[]> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("CreatedById", sql.UniqueIdentifier, createdById)
      .execute("dbo.GetLevels");
    return result.recordset;
  }

  async getLevel(id: string, createdById: string): Promise<Level | undefined> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Id", sql.UniqueIdentifier, id)
      .input("CreatedById", sql.UniqueIdentifier, createdById)
      .execute("dbo.GetLevel");
    return result.recordset[0];
  }

  async createLevel(level: InsertLevel, createdById: string): Promise<Level> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Name", sql.NVarChar(255), level.name)
      .input("Description", sql.NVarChar(sql.MAX), level.description || null)
      .input("Status", sql.NVarChar(20), level.status || "active")
      .input("CreatedById", sql.UniqueIdentifier, createdById)
      .execute("dbo.CreateLevel");
    return result.recordset[0];
  }

  async updateLevel(
    id: string,
    level: Partial<InsertLevel>,
    createdById: string
  ): Promise<Level> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Id", sql.UniqueIdentifier, id)
      .input("Name", sql.NVarChar(255), level.name || null)
      .input("Description", sql.NVarChar(sql.MAX), level.description || null)
      .input("Status", sql.NVarChar(20), level.status || null)
      .input("CreatedById", sql.UniqueIdentifier, createdById)
      .execute("dbo.UpdateLevel");
    return result.recordset[0];
  }

  async deleteLevel(id: string, createdById: string): Promise<void> {
    const pool = await getPool();
    await pool
      .request()
      .input("Id", sql.UniqueIdentifier, id)
      .input("CreatedById", sql.UniqueIdentifier, createdById)
      .execute("dbo.DeleteLevel");
  }

  // Example: QUESTIONNAIRE TEMPLATE (with JSON handling)
  async getQuestionnaireTemplates(
    requestingUserId?: string
  ): Promise<QuestionnaireTemplate[]> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("RequestingUserId", sql.UniqueIdentifier, requestingUserId || null)
      .execute("dbo.GetQuestionnaireTemplates");

    // Parse JSON fields
    return result.recordset.map((record: any) => ({
      ...record,
      questions: record.questions ? JSON.parse(record.questions) : null,
    }));
  }

  async createQuestionnaireTemplate(
    template: InsertQuestionnaireTemplate
  ): Promise<QuestionnaireTemplate> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Name", sql.NVarChar(255), template.name)
      .input("Description", sql.NVarChar(sql.MAX), template.description || null)
      .input("TargetRole", sql.NVarChar(50), template.targetRole)
      .input(
        "Questions",
        sql.NVarChar(sql.MAX),
        JSON.stringify(template.questions)
      )
      .input("Year", sql.Int, template.year || null)
      .input("Status", sql.NVarChar(20), template.status || "active")
      .input(
        "ApplicableCategory",
        sql.NVarChar(20),
        template.applicableCategory || null
      )
      .input(
        "ApplicableLevelId",
        sql.UniqueIdentifier,
        template.applicableLevelId || null
      )
      .input(
        "ApplicableGradeId",
        sql.UniqueIdentifier,
        template.applicableGradeId || null
      )
      .input(
        "ApplicableLocationId",
        sql.UniqueIdentifier,
        template.applicableLocationId || null
      )
      .input("SendOnMail", sql.Bit, template.sendOnMail || false)
      .input("CreatedById", sql.UniqueIdentifier, template.createdById || null)
      .execute("dbo.CreateQuestionnaireTemplate");

    // Parse JSON fields
    const record = result.recordset[0];
    if (record && record.questions) {
      record.questions = JSON.parse(record.questions);
    }
    return record;
  }

  // Example: PASSWORD CHANGE (special case)
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const pool = await getPool();

    // Get user's current password hash
    const userResult = await pool
      .request()
      .input("Id", sql.UniqueIdentifier, userId)
      .execute("dbo.GetUser");
    const user = userResult.recordset[0];

    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool
      .request()
      .input("Id", sql.UniqueIdentifier, userId)
      .input("PasswordHash", sql.NVarChar(255), hashedPassword)
      .input("Email", sql.NVarChar(255), null)
      .input("FirstName", sql.NVarChar(255), null)
      .input("LastName", sql.NVarChar(255), null)
      .input("Role", sql.NVarChar(50), null)
      .input("Department", sql.NVarChar(255), null)
      .input("Designation", sql.NVarChar(255), null)
      .input("ManagerId", sql.UniqueIdentifier, null)
      .input("CompanyId", sql.UniqueIdentifier, null)
      .input("LocationId", sql.UniqueIdentifier, null)
      .input("GradeId", sql.UniqueIdentifier, null)
      .input("LevelId", sql.UniqueIdentifier, null)
      .input("Status", sql.NVarChar(20), null)
      .input("Mobile", sql.NVarChar(20), null)
      .input("EmployeeCode", sql.NVarChar(50), null)
      .input("RequestingUserId", sql.UniqueIdentifier, null)
      .execute("dbo.UpdateUser");
  }

  // Example: APPRAISAL GROUPS WITH MEMBERS (complex join)
  async getAppraisalGroupsWithMembers(
    createdById: string
  ): Promise<(AppraisalGroup & { members: SafeUser[] })[]> {
    const pool = await getPool();

    // Get groups
    const groupsResult = await pool
      .request()
      .input("CreatedById", sql.UniqueIdentifier, createdById)
      .execute("dbo.GetAppraisalGroups");
    const groups = groupsResult.recordset;

    // For each group, get members
    const result = await Promise.all(
      groups.map(async (group: any) => {
        const membersResult = await pool
          .request()
          .input("AppraisalGroupId", sql.UniqueIdentifier, group.id)
          .execute("dbo.GetAppraisalGroupMembers");
        const memberRecords = membersResult.recordset;

        // Get user details for each member
        const memberUsers = await Promise.all(
          memberRecords.map(async (m: any) => {
            const userResult = await pool
              .request()
              .input("Id", sql.UniqueIdentifier, m.employeeId)
              .execute("dbo.GetUser");
            const user = userResult.recordset[0];
            return user ? sanitizeUser(user) : null;
          })
        );

        return {
          ...group,
          members: memberUsers.filter((u) => u !== null) as SafeUser[],
        };
      })
    );

    return result;
  }

  // TODO: Apply the same patterns to all remaining methods
  // Reference: STORAGE_CONVERSION_GUIDE.md for patterns
}

export const storage = new DatabaseStorage();
