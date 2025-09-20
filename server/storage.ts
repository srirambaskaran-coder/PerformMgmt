import {
  users,
  companies,
  locations,
  questionnaireTemplates,
  reviewCycles,
  evaluations,
  emailTemplates,
  emailConfig,
  accessTokens,
  type User,
  type UpsertUser,
  type InsertUser,
  type Company,
  type InsertCompany,
  type Location,
  type InsertLocation,
  type QuestionnaireTemplate,
  type InsertQuestionnaireTemplate,
  type ReviewCycle,
  type InsertReviewCycle,
  type Evaluation,
  type InsertEvaluation,
  type EmailTemplate,
  type InsertEmailTemplate,
  type EmailConfig,
  type InsertEmailConfig,
  type AccessToken,
  type InsertAccessToken,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, like, inArray, or, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Company operations
  getCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company>;
  deleteCompany(id: string): Promise<void>;
  
  // Location operations
  getLocations(): Promise<Location[]>;
  getLocation(id: string): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: string, location: Partial<InsertLocation>): Promise<Location>;
  deleteLocation(id: string): Promise<void>;
  
  // User management operations
  getUsers(filters?: { role?: string; department?: string; status?: string }): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getUsersByManager(managerId: string): Promise<User[]>;
  
  // Questionnaire template operations
  getQuestionnaireTemplates(): Promise<QuestionnaireTemplate[]>;
  getQuestionnaireTemplate(id: string): Promise<QuestionnaireTemplate | undefined>;
  createQuestionnaireTemplate(template: InsertQuestionnaireTemplate): Promise<QuestionnaireTemplate>;
  updateQuestionnaireTemplate(id: string, template: Partial<InsertQuestionnaireTemplate>): Promise<QuestionnaireTemplate>;
  deleteQuestionnaireTemplate(id: string): Promise<void>;
  getQuestionnaireTemplatesByYear(year: number): Promise<QuestionnaireTemplate[]>;
  
  // Review cycle operations
  getReviewCycles(): Promise<ReviewCycle[]>;
  getReviewCycle(id: string): Promise<ReviewCycle | undefined>;
  createReviewCycle(cycle: InsertReviewCycle): Promise<ReviewCycle>;
  updateReviewCycle(id: string, cycle: Partial<InsertReviewCycle>): Promise<ReviewCycle>;
  deleteReviewCycle(id: string): Promise<void>;
  getActiveReviewCycles(): Promise<ReviewCycle[]>;
  
  // Evaluation operations
  getEvaluations(filters?: { employeeId?: string; managerId?: string; reviewCycleId?: string; status?: string }): Promise<Evaluation[]>;
  getEvaluation(id: string): Promise<Evaluation | undefined>;
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  updateEvaluation(id: string, evaluation: Partial<InsertEvaluation>): Promise<Evaluation>;
  deleteEvaluation(id: string): Promise<void>;
  getEvaluationByEmployeeAndCycle(employeeId: string, reviewCycleId: string): Promise<Evaluation | undefined>;
  
  // Email operations
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(id: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate>;
  deleteEmailTemplate(id: string): Promise<void>;
  
  getEmailConfig(): Promise<EmailConfig | undefined>;
  createEmailConfig(config: InsertEmailConfig): Promise<EmailConfig>;
  updateEmailConfig(id: string, config: Partial<InsertEmailConfig>): Promise<EmailConfig>;
  
  // Access token operations
  createAccessToken(token: InsertAccessToken): Promise<AccessToken>;
  getAccessToken(token: string): Promise<AccessToken | undefined>;
  markTokenAsUsed(token: string): Promise<void>;
  deactivateToken(token: string): Promise<void>;
  getActiveTokensByUser(userId: string): Promise<AccessToken[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Normalize role and roles fields for consistency
    const normalizedData = { ...userData };
    
    if (normalizedData.roles && normalizedData.roles.length > 0) {
      // Deduplicate roles and ensure at least one role
      normalizedData.roles = Array.from(new Set(normalizedData.roles));
      normalizedData.role = normalizedData.roles[0] as any; // Set single role to first role
    } else if (normalizedData.role) {
      // If only single role provided, create roles array
      normalizedData.roles = [normalizedData.role];
    } else {
      // Default fallback
      normalizedData.role = 'employee' as any;
      normalizedData.roles = ['employee'];
    }
    
    const [user] = await db
      .insert(users)
      .values(normalizedData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...normalizedData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Company operations
  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(asc(companies.name));
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  async updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company> {
    const [updatedCompany] = await db
      .update(companies)
      .set({ ...company, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return updatedCompany;
  }

  async deleteCompany(id: string): Promise<void> {
    await db.delete(companies).where(eq(companies.id, id));
  }

  // Location operations
  async getLocations(): Promise<Location[]> {
    return await db.select().from(locations).orderBy(asc(locations.name));
  }

  async getLocation(id: string): Promise<Location | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    return location;
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const [newLocation] = await db.insert(locations).values(location).returning();
    return newLocation;
  }

  async updateLocation(id: string, location: Partial<InsertLocation>): Promise<Location> {
    const [updatedLocation] = await db
      .update(locations)
      .set({ ...location, updatedAt: new Date() })
      .where(eq(locations.id, id))
      .returning();
    return updatedLocation;
  }

  async deleteLocation(id: string): Promise<void> {
    await db.delete(locations).where(eq(locations.id, id));
  }

  // User management operations
  async getUsers(filters?: { role?: string; department?: string; status?: string }): Promise<User[]> {
    const conditions = [];
    if (filters?.role) {
      // Support filtering by both single role and roles array
      conditions.push(
        or(
          eq(users.role, filters.role as any),
          sql`${users.roles} @> ARRAY[${filters.role}]::text[]`
        )
      );
    }
    if (filters?.status) {
      conditions.push(eq(users.status, filters.status as any));
    }
    if (filters?.department) {
      conditions.push(eq(users.department, filters.department));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(users).where(and(...conditions)).orderBy(asc(users.firstName));
    }
    
    return await db.select().from(users).orderBy(asc(users.firstName));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    // Handle empty codes by converting to null to avoid unique constraint violations
    const userData = {
      ...user,
      code: user.code && user.code.trim() !== '' ? user.code : null,
    };
    
    // Normalize role and roles fields for consistency
    if (userData.roles && userData.roles.length > 0) {
      // Deduplicate roles and ensure at least one role
      userData.roles = Array.from(new Set(userData.roles));
      userData.role = userData.roles[0] as any; // Set single role to first role
    } else if (userData.role) {
      // If only single role provided, create roles array
      userData.roles = [userData.role];
    } else {
      // Default fallback
      userData.role = 'employee' as any;
      userData.roles = ['employee'];
    }
    
    const [newUser] = await db.insert(users).values(userData).returning();
    return newUser;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User> {
    // Handle empty codes by converting to null to avoid unique constraint violations
    const userData = {
      ...user,
      code: user.code !== undefined ? (user.code && user.code.trim() !== '' ? user.code : null) : undefined,
      updatedAt: new Date(),
    };
    
    // Normalize role and roles fields for consistency
    if (userData.roles !== undefined) {
      if (userData.roles && userData.roles.length > 0) {
        // Deduplicate roles and ensure at least one role
        userData.roles = Array.from(new Set(userData.roles));
        userData.role = userData.roles[0] as any; // Set single role to first role
      } else {
        // If roles is empty, set default
        userData.role = 'employee' as any;
        userData.roles = ['employee'];
      }
    } else if (userData.role !== undefined && userData.role) {
      // If only single role provided, create roles array
      userData.roles = [userData.role];
    }
    
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getUsersByManager(managerId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.reportingManagerId, managerId));
  }

  // Questionnaire template operations
  async getQuestionnaireTemplates(): Promise<QuestionnaireTemplate[]> {
    return await db.select().from(questionnaireTemplates).orderBy(desc(questionnaireTemplates.createdAt));
  }

  async getQuestionnaireTemplate(id: string): Promise<QuestionnaireTemplate | undefined> {
    const [template] = await db.select().from(questionnaireTemplates).where(eq(questionnaireTemplates.id, id));
    return template;
  }

  async createQuestionnaireTemplate(template: InsertQuestionnaireTemplate): Promise<QuestionnaireTemplate> {
    const [newTemplate] = await db.insert(questionnaireTemplates).values(template).returning();
    return newTemplate;
  }

  async updateQuestionnaireTemplate(id: string, template: Partial<InsertQuestionnaireTemplate>): Promise<QuestionnaireTemplate> {
    const [updatedTemplate] = await db
      .update(questionnaireTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(questionnaireTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteQuestionnaireTemplate(id: string): Promise<void> {
    await db.delete(questionnaireTemplates).where(eq(questionnaireTemplates.id, id));
  }

  async getQuestionnaireTemplatesByYear(year: number): Promise<QuestionnaireTemplate[]> {
    return await db.select().from(questionnaireTemplates).where(eq(questionnaireTemplates.year, year));
  }

  // Review cycle operations
  async getReviewCycles(): Promise<ReviewCycle[]> {
    return await db.select().from(reviewCycles).orderBy(desc(reviewCycles.createdAt));
  }

  async getReviewCycle(id: string): Promise<ReviewCycle | undefined> {
    const [cycle] = await db.select().from(reviewCycles).where(eq(reviewCycles.id, id));
    return cycle;
  }

  async createReviewCycle(cycle: InsertReviewCycle): Promise<ReviewCycle> {
    const [newCycle] = await db.insert(reviewCycles).values(cycle).returning();
    return newCycle;
  }

  async updateReviewCycle(id: string, cycle: Partial<InsertReviewCycle>): Promise<ReviewCycle> {
    const [updatedCycle] = await db
      .update(reviewCycles)
      .set({ ...cycle, updatedAt: new Date() })
      .where(eq(reviewCycles.id, id))
      .returning();
    return updatedCycle;
  }

  async deleteReviewCycle(id: string): Promise<void> {
    await db.delete(reviewCycles).where(eq(reviewCycles.id, id));
  }

  async getActiveReviewCycles(): Promise<ReviewCycle[]> {
    return await db.select().from(reviewCycles).where(eq(reviewCycles.status, 'active'));
  }

  // Evaluation operations
  async getEvaluations(filters?: { employeeId?: string; managerId?: string; reviewCycleId?: string; status?: string }): Promise<Evaluation[]> {
    const conditions = [];
    if (filters?.employeeId) conditions.push(eq(evaluations.employeeId, filters.employeeId));
    if (filters?.managerId) conditions.push(eq(evaluations.managerId, filters.managerId));
    if (filters?.reviewCycleId) conditions.push(eq(evaluations.reviewCycleId, filters.reviewCycleId));
    if (filters?.status) conditions.push(eq(evaluations.status, filters.status));
    
    if (conditions.length > 0) {
      return await db.select().from(evaluations).where(and(...conditions)).orderBy(desc(evaluations.createdAt));
    }
    
    return await db.select().from(evaluations).orderBy(desc(evaluations.createdAt));
  }

  async getEvaluation(id: string): Promise<Evaluation | undefined> {
    const [evaluation] = await db.select().from(evaluations).where(eq(evaluations.id, id));
    return evaluation;
  }

  async createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation> {
    const [newEvaluation] = await db.insert(evaluations).values(evaluation).returning();
    return newEvaluation;
  }

  async updateEvaluation(id: string, evaluation: Partial<InsertEvaluation>): Promise<Evaluation> {
    const [updatedEvaluation] = await db
      .update(evaluations)
      .set({ ...evaluation, updatedAt: new Date() })
      .where(eq(evaluations.id, id))
      .returning();
    return updatedEvaluation;
  }

  async deleteEvaluation(id: string): Promise<void> {
    await db.delete(evaluations).where(eq(evaluations.id, id));
  }

  async getEvaluationByEmployeeAndCycle(employeeId: string, reviewCycleId: string): Promise<Evaluation | undefined> {
    const [evaluation] = await db
      .select()
      .from(evaluations)
      .where(and(eq(evaluations.employeeId, employeeId), eq(evaluations.reviewCycleId, reviewCycleId)));
    return evaluation;
  }

  // Email operations
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).orderBy(asc(emailTemplates.name));
  }

  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return template;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db.insert(emailTemplates).values(template).returning();
    return newTemplate;
  }

  async updateEmailTemplate(id: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
    const [updatedTemplate] = await db
      .update(emailTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteEmailTemplate(id: string): Promise<void> {
    await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
  }

  async getEmailConfig(): Promise<EmailConfig | undefined> {
    const [config] = await db.select().from(emailConfig).where(eq(emailConfig.isActive, true));
    return config;
  }

  async createEmailConfig(config: InsertEmailConfig): Promise<EmailConfig> {
    const [newConfig] = await db.insert(emailConfig).values(config).returning();
    return newConfig;
  }

  async updateEmailConfig(id: string, config: Partial<InsertEmailConfig>): Promise<EmailConfig> {
    const [updatedConfig] = await db
      .update(emailConfig)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(emailConfig.id, id))
      .returning();
    return updatedConfig;
  }

  // Access token operations
  async createAccessToken(token: InsertAccessToken): Promise<AccessToken> {
    const [newToken] = await db.insert(accessTokens).values(token).returning();
    return newToken;
  }

  async getAccessToken(token: string): Promise<AccessToken | undefined> {
    const [accessToken] = await db.select().from(accessTokens).where(
      and(
        eq(accessTokens.token, token),
        eq(accessTokens.isActive, true)
      )
    );
    return accessToken;
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await db
      .update(accessTokens)
      .set({ usedAt: new Date() })
      .where(eq(accessTokens.token, token));
  }

  async deactivateToken(token: string): Promise<void> {
    await db
      .update(accessTokens)
      .set({ isActive: false })
      .where(eq(accessTokens.token, token));
  }

  async getActiveTokensByUser(userId: string): Promise<AccessToken[]> {
    return await db.select().from(accessTokens).where(
      and(
        eq(accessTokens.userId, userId),
        eq(accessTokens.isActive, true)
      )
    ).orderBy(desc(accessTokens.createdAt));
  }
}

export const storage = new DatabaseStorage();
