import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'admin', 
  'hr_manager',
  'employee',
  'manager'
]);

// User status enum
export const statusEnum = pgEnum('status', ['active', 'inactive']);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Additional fields for the app
  code: varchar("code").unique(),
  designation: varchar("designation"),
  department: varchar("department"),
  dateOfJoining: timestamp("date_of_joining"),
  mobileNumber: varchar("mobile_number"),
  reportingManagerId: varchar("reporting_manager_id"),
  locationId: varchar("location_id"),
  companyId: varchar("company_id"),
  role: userRoleEnum("role").default('employee'),
  roles: text("roles").array(),
  status: statusEnum("status").default('active'),
  // Password field for admin-managed accounts
  passwordHash: varchar("password_hash"),
});

// Companies table
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  address: text("address"),
  clientContact: varchar("client_contact"),
  email: varchar("email"),
  contactNumber: varchar("contact_number"),
  gstNumber: varchar("gst_number"),
  logoUrl: varchar("logo_url"),
  status: statusEnum("status").default('active'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Locations table
export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").unique().notNull(),
  name: varchar("name").notNull(),
  state: varchar("state"),
  country: varchar("country"),
  status: statusEnum("status").default('active'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Questionnaire templates table
export const questionnaireTemplates = pgTable("questionnaire_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  targetRole: userRoleEnum("target_role").notNull(), // 'employee' or 'manager'
  questions: jsonb("questions").notNull(), // Array of question objects
  year: integer("year"),
  status: statusEnum("status").default('active'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Performance review cycles table
export const reviewCycles = pgTable("review_cycles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  questionnaireTemplateId: varchar("questionnaire_template_id").notNull(),
  status: statusEnum("status").default('active'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employee evaluations table
export const evaluations = pgTable("evaluations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  managerId: varchar("manager_id").notNull(),
  reviewCycleId: varchar("review_cycle_id").notNull(),
  selfEvaluationData: jsonb("self_evaluation_data"), // Employee responses
  selfEvaluationSubmittedAt: timestamp("self_evaluation_submitted_at"),
  managerEvaluationData: jsonb("manager_evaluation_data"), // Manager responses
  managerEvaluationSubmittedAt: timestamp("manager_evaluation_submitted_at"),
  overallRating: integer("overall_rating"),
  status: varchar("status").default('not_started'), // not_started, in_progress, completed, overdue
  meetingScheduledAt: timestamp("meeting_scheduled_at"),
  meetingNotes: text("meeting_notes"),
  meetingCompletedAt: timestamp("meeting_completed_at"),
  finalizedAt: timestamp("finalized_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email templates table
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  subject: varchar("subject").notNull(),
  body: text("body").notNull(),
  templateType: varchar("template_type").notNull(), // review_invitation, reminder, completion, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email configuration table
export const emailConfig = pgTable("email_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  smtpHost: varchar("smtp_host").notNull(),
  smtpPort: integer("smtp_port").notNull(),
  smtpUsername: varchar("smtp_username").notNull(),
  smtpPassword: varchar("smtp_password").notNull(),
  fromEmail: varchar("from_email").notNull(),
  fromName: varchar("from_name").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Secure access tokens for email links
export const accessTokens = pgTable("access_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: varchar("token").notNull().unique(),
  userId: varchar("user_id").notNull(),
  evaluationId: varchar("evaluation_id").notNull(),
  tokenType: varchar("token_type").notNull(), // 'self_evaluation', 'manager_review'
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  reportingManager: one(users, {
    fields: [users.reportingManagerId],
    references: [users.id],
  }),
  directReports: many(users),
  location: one(locations, {
    fields: [users.locationId],
    references: [locations.id],
  }),
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  evaluationsAsEmployee: many(evaluations, {
    relationName: "employeeEvaluations",
  }),
  evaluationsAsManager: many(evaluations, {
    relationName: "managerEvaluations",
  }),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
  users: many(users),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
}));

export const reviewCyclesRelations = relations(reviewCycles, ({ one, many }) => ({
  questionnaireTemplate: one(questionnaireTemplates, {
    fields: [reviewCycles.questionnaireTemplateId],
    references: [questionnaireTemplates.id],
  }),
  evaluations: many(evaluations),
}));

export const evaluationsRelations = relations(evaluations, ({ one }) => ({
  employee: one(users, {
    fields: [evaluations.employeeId],
    references: [users.id],
    relationName: "employeeEvaluations",
  }),
  manager: one(users, {
    fields: [evaluations.managerId],
    references: [users.id],
    relationName: "managerEvaluations",
  }),
  reviewCycle: one(reviewCycles, {
    fields: [evaluations.reviewCycleId],
    references: [reviewCycles.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  passwordHash: true,
}).extend({
  roles: z.array(z.enum(['super_admin', 'admin', 'hr_manager', 'employee', 'manager'])).optional().default(['employee']),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.password || data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuestionnaireTemplateSchema = createInsertSchema(questionnaireTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReviewCycleSchema = createInsertSchema(reviewCycles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEvaluationSchema = createInsertSchema(evaluations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailConfigSchema = createInsertSchema(emailConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAccessTokenSchema = createInsertSchema(accessTokens).omit({
  id: true,
  createdAt: true,
});

// Upsert user schema for Replit Auth
export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type QuestionnaireTemplate = typeof questionnaireTemplates.$inferSelect;
export type InsertQuestionnaireTemplate = z.infer<typeof insertQuestionnaireTemplateSchema>;
export type ReviewCycle = typeof reviewCycles.$inferSelect;
export type InsertReviewCycle = z.infer<typeof insertReviewCycleSchema>;
export type Evaluation = typeof evaluations.$inferSelect;
export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailConfig = typeof emailConfig.$inferSelect;
export type InsertEmailConfig = z.infer<typeof insertEmailConfigSchema>;
export type AccessToken = typeof accessTokens.$inferSelect;
export type InsertAccessToken = z.infer<typeof insertAccessTokenSchema>;
