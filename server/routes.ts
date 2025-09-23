import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireRoles } from "./replitAuth";
import { z } from "zod";
import { 
  insertUserSchema,
  insertCompanySchema,
  insertLocationSchema,
  insertQuestionnaireTemplateSchema,
  insertReviewCycleSchema,
  insertEvaluationSchema,
  insertEmailTemplateSchema,
  insertEmailConfigSchema,
  insertLevelSchema,
  insertGradeSchema,
  insertDepartmentSchema,
  insertAppraisalCycleSchema,
  insertReviewFrequencySchema,
  insertFrequencyCalendarSchema,
  insertFrequencyCalendarDetailsSchema,
  insertPublishQuestionnaireSchema,
  insertAppraisalGroupSchema,
  insertAppraisalGroupMemberSchema,
  updateUserSchema,
  passwordUpdateSchema,
  type SafeUser,
} from "@shared/schema";
import { sendEmail, sendReviewInvitation, sendReviewReminder, sendReviewCompletion } from "./emailService";
import { ObjectStorageService } from "./objectStorage";
import { seedTestUsers, testUsers } from "./seedUsers";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Sanitize user object to exclude passwordHash
      const { passwordHash, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard metrics
  app.get('/api/dashboard/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = req.user.claims.sub;
      const users = await storage.getUsers({}, requestingUserId);
      const evaluations = await storage.getEvaluations();
      const activeReviews = evaluations.filter(e => e.status === 'in_progress');
      const completed = evaluations.filter(e => e.status === 'completed');
      const pending = evaluations.filter(e => e.managerEvaluationData && !e.finalizedAt);

      const metrics = {
        totalEmployees: users.length,
        activeReviews: activeReviews.length,
        completionRate: evaluations.length > 0 ? Math.round((completed.length / evaluations.length) * 100) : 0,
        pendingApprovals: pending.length,
      };

      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // Company routes
  app.get('/api/companies', isAuthenticated, async (req, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.post('/api/companies', isAuthenticated, requireRoles(['super_admin', 'admin']), async (req, res) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(companyData);
      res.status(201).json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.put('/api/companies/:id', isAuthenticated, requireRoles(['super_admin', 'admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const companyData = insertCompanySchema.partial().parse(req.body);
      const company = await storage.updateCompany(id, companyData);
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  app.delete('/api/companies/:id', isAuthenticated, requireRoles(['super_admin', 'admin']), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCompany(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ message: "Failed to delete company" });
    }
  });

  // Location routes
  app.get('/api/locations', isAuthenticated, async (req, res) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  app.post('/api/locations', isAuthenticated, requireRoles(['super_admin', 'admin']), async (req, res) => {
    try {
      const locationData = insertLocationSchema.parse(req.body);
      const location = await storage.createLocation(locationData);
      res.status(201).json(location);
    } catch (error) {
      console.error("Error creating location:", error);
      res.status(500).json({ message: "Failed to create location" });
    }
  });

  app.put('/api/locations/:id', isAuthenticated, requireRoles(['super_admin', 'admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const locationData = insertLocationSchema.partial().parse(req.body);
      const location = await storage.updateLocation(id, locationData);
      res.json(location);
    } catch (error) {
      console.error("Error updating location:", error);
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  app.delete('/api/locations/:id', isAuthenticated, requireRoles(['super_admin', 'admin']), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteLocation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting location:", error);
      res.status(500).json({ message: "Failed to delete location" });
    }
  });

  // User management routes
  app.get('/api/users', isAuthenticated, requireRoles(['super_admin', 'admin', 'hr_manager']), async (req: any, res) => {
    try {
      const { role, department, status } = req.query;
      const requestingUserId = req.user.claims.sub;
      const filters = {
        role: role as string,
        department: department as string,
        status: status as string,
      };
      const users = await storage.getUsers(filters, requestingUserId);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', isAuthenticated, requireRoles(['super_admin', 'admin']), async (req: any, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const creatorId = req.user.claims.sub;
      const user = await storage.createUser(userData, creatorId);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put('/api/users/:id', isAuthenticated, requireRoles(['super_admin', 'admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const requestingUserId = req.user.claims.sub;
      const { password, confirmPassword, ...otherFields } = req.body;
      
      // SECURITY: Detect if this is a password update vs a regular update
      const isPasswordUpdate = password || confirmPassword;
      
      if (isPasswordUpdate) {
        // SECURITY: Get current user and target user for authorization checks
        const currentUser = await storage.getUser(requestingUserId);
        const targetUser = await storage.getUser(id);
        
        if (!currentUser || !targetUser) {
          return res.status(404).json({ message: "User not found" });
        }
        
        const isSuperAdmin = currentUser.role === 'super_admin';
        const isAdmin = currentUser.role === 'admin';
        const isUserCreatedByAdmin = targetUser.createdById !== null && targetUser.createdById === requestingUserId;
        const isTargetPrivileged = ['admin', 'super_admin'].includes(targetUser.role);
        
        // SECURITY: Allow password changes if:
        // 1. Super Admin (can change any password) OR
        // 2. Admin changing password of non-privileged user they created
        const canChangePassword = isSuperAdmin || (isAdmin && isUserCreatedByAdmin && !isTargetPrivileged);
        
        if (!canChangePassword) {
          const errorMessage = isSuperAdmin 
            ? "Password changes can only be performed by Super Administrators"
            : isAdmin
              ? isTargetPrivileged
                ? "Administrators cannot change passwords of other privileged users"
                : "Administrators can only change passwords of users they created"
              : "Insufficient privileges to change passwords";
              
          return res.status(403).json({ message: errorMessage });
        }
        
        // SECURITY: Validate password fields with dedicated schema
        const passwordData = passwordUpdateSchema.parse({ password, confirmPassword });
        
        // SECURITY: Validate other fields with update schema (strict mode)
        let otherData = {};
        if (Object.keys(otherFields).length > 0) {
          otherData = updateUserSchema.parse(otherFields);
        }
        
        // Combine validated data
        const userData = { ...otherData, ...passwordData };
        const user = await storage.updateUser(id, userData, requestingUserId);
        res.json(user);
      } else {
        // SECURITY: Regular update - validate with strict schema that excludes sensitive fields
        if (Object.keys(req.body).length === 0) {
          return res.status(400).json({ message: "No fields provided for update" });
        }
        
        // SECURITY: Use strict validation schema that rejects unknown keys
        const userData = updateUserSchema.parse(req.body);
        
        // SECURITY: Pass requesting user ID for role escalation protection
        const user = await storage.updateUser(id, userData, requestingUserId);
        res.json(user);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      
      // SECURITY: Provide specific error messages for validation failures
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: (error as any).errors 
        });
      }
      
      // Handle authorization errors specifically
      if (error instanceof Error && (error.message?.includes('Super Administrators') || error.message?.includes('super_admin'))) {
        return res.status(403).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, requireRoles(['super_admin', 'admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const requestingUserId = req.user.claims.sub;
      await storage.deleteUser(id, requestingUserId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      
      // Handle authorization errors specifically
      if (error instanceof Error && error.message?.includes('Forbidden')) {
        return res.status(403).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Questionnaire template routes
  app.get('/api/questionnaire-templates', isAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = req.user.claims.sub;
      const templates = await storage.getQuestionnaireTemplates(requestingUserId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching questionnaire templates:", error);
      res.status(500).json({ message: "Failed to fetch questionnaire templates" });
    }
  });

  app.post('/api/questionnaire-templates', isAuthenticated, requireRoles(['super_admin', 'admin', 'hr_manager']), async (req: any, res) => {
    try {
      const requestingUserId = req.user.claims.sub;
      const templateData = insertQuestionnaireTemplateSchema.parse(req.body);
      
      // Automatically set the createdById field to the requesting user
      templateData.createdById = requestingUserId;
      
      const template = await storage.createQuestionnaireTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating questionnaire template:", error);
      res.status(500).json({ message: "Failed to create questionnaire template" });
    }
  });

  app.get('/api/questionnaire-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const requestingUserId = req.user.claims.sub;
      const template = await storage.getQuestionnaireTemplate(id, requestingUserId);
      if (!template) {
        return res.status(404).json({ message: "Questionnaire template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching questionnaire template:", error);
      res.status(500).json({ message: "Failed to fetch questionnaire template" });
    }
  });

  app.put('/api/questionnaire-templates/:id', isAuthenticated, requireRoles(['super_admin', 'admin', 'hr_manager']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const requestingUserId = req.user.claims.sub;
      
      const templateData = insertQuestionnaireTemplateSchema.partial().parse(req.body);
      const template = await storage.updateQuestionnaireTemplate(id, templateData, requestingUserId);
      res.json(template);
    } catch (error) {
      console.error("Error updating questionnaire template:", error);
      
      // Handle authorization errors specifically
      if (error instanceof Error && error.message?.includes('Forbidden')) {
        return res.status(403).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to update questionnaire template" });
    }
  });

  app.delete('/api/questionnaire-templates/:id', isAuthenticated, requireRoles(['super_admin', 'admin', 'hr_manager']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const requestingUserId = req.user.claims.sub;
      
      await storage.deleteQuestionnaireTemplate(id, requestingUserId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting questionnaire template:", error);
      
      // Handle authorization errors specifically
      if (error instanceof Error && error.message?.includes('Forbidden')) {
        return res.status(403).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to delete questionnaire template" });
    }
  });

  app.post('/api/questionnaire-templates/:id/copy', isAuthenticated, requireRoles(['super_admin', 'admin', 'hr_manager']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const requestingUserId = req.user.claims.sub;
      
      const copiedTemplate = await storage.copyQuestionnaireTemplate(id, requestingUserId);
      res.status(201).json(copiedTemplate);
    } catch (error) {
      console.error("Error copying questionnaire template:", error);
      
      // Handle authorization errors specifically
      if (error instanceof Error && (error.message?.includes('Forbidden') || error.message?.includes('Template not found'))) {
        return res.status(404).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to copy questionnaire template" });
    }
  });

  // Review cycle routes
  app.get('/api/review-cycles', isAuthenticated, async (req, res) => {
    try {
      const cycles = await storage.getReviewCycles();
      res.json(cycles);
    } catch (error) {
      console.error("Error fetching review cycles:", error);
      res.status(500).json({ message: "Failed to fetch review cycles" });
    }
  });

  app.get('/api/review-cycles/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const cycle = await storage.getReviewCycle(id);
      if (!cycle) {
        return res.status(404).json({ message: "Review cycle not found" });
      }
      res.json(cycle);
    } catch (error) {
      console.error("Error fetching review cycle:", error);
      res.status(500).json({ message: "Failed to fetch review cycle" });
    }
  });

  app.post('/api/review-cycles', isAuthenticated, requireRoles(['super_admin', 'admin', 'hr_manager']), async (req, res) => {
    try {
      const cycleData = insertReviewCycleSchema.parse(req.body);
      const cycle = await storage.createReviewCycle(cycleData);
      res.status(201).json(cycle);
    } catch (error) {
      console.error("Error creating review cycle:", error);
      res.status(500).json({ message: "Failed to create review cycle" });
    }
  });

  app.put('/api/review-cycles/:id', isAuthenticated, requireRoles(['super_admin', 'admin', 'hr_manager']), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if review cycle exists
      const existingCycle = await storage.getReviewCycle(id);
      if (!existingCycle) {
        return res.status(404).json({ message: "Review cycle not found" });
      }
      
      const cycleData = insertReviewCycleSchema.partial().parse(req.body);
      const cycle = await storage.updateReviewCycle(id, cycleData);
      res.json(cycle);
    } catch (error) {
      console.error("Error updating review cycle:", error);
      res.status(500).json({ message: "Failed to update review cycle" });
    }
  });

  app.delete('/api/review-cycles/:id', isAuthenticated, requireRoles(['super_admin', 'admin', 'hr_manager']), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if review cycle exists
      const existingCycle = await storage.getReviewCycle(id);
      if (!existingCycle) {
        return res.status(404).json({ message: "Review cycle not found" });
      }
      
      await storage.deleteReviewCycle(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting review cycle:", error);
      res.status(500).json({ message: "Failed to delete review cycle" });
    }
  });

  // Evaluation routes
  app.get('/api/evaluations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { employeeId, managerId, reviewCycleId, status } = req.query;
      let filters = {
        employeeId: employeeId as string,
        managerId: managerId as string,
        reviewCycleId: reviewCycleId as string,
        status: status as string,
      };

      // Apply role-based access control
      if (currentUser.role === 'employee') {
        // Employees can only see their own evaluations
        filters.employeeId = currentUser.id;
      } else if (currentUser.role === 'manager') {
        // Managers can see evaluations they manage or their own
        if (!filters.employeeId && !filters.managerId) {
          // If no specific filter, show evaluations where they are the manager or employee
          const userManagedEvaluations = await storage.getEvaluations({ managerId: currentUser.id });
          const userOwnEvaluations = await storage.getEvaluations({ employeeId: currentUser.id });
          const combinedEvaluations = [...userManagedEvaluations, ...userOwnEvaluations];
          // Remove duplicates by id
          const uniqueEvaluations = combinedEvaluations.filter((evaluation, index, self) => 
            index === self.findIndex(e => e.id === evaluation.id)
          );
          return res.json(uniqueEvaluations);
        }
        // Validate they can access the requested data
        if (filters.managerId && filters.managerId !== currentUser.id) {
          return res.status(403).json({ message: "Access denied: Cannot view evaluations for other managers" });
        }
      }
      // super_admin, admin, hr_manager can access all evaluations (no additional filtering)

      const evaluations = await storage.getEvaluations(filters);
      res.json(evaluations);
    } catch (error) {
      console.error("Error fetching evaluations:", error);
      res.status(500).json({ message: "Failed to fetch evaluations" });
    }
  });

  app.post('/api/evaluations', isAuthenticated, requireRoles(['super_admin', 'admin', 'hr_manager']), async (req, res) => {
    try {
      const evaluationData = insertEvaluationSchema.parse(req.body);
      const evaluation = await storage.createEvaluation(evaluationData);
      res.status(201).json(evaluation);
    } catch (error) {
      console.error("Error creating evaluation:", error);
      res.status(500).json({ message: "Failed to create evaluation" });
    }
  });

  app.put('/api/evaluations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get the existing evaluation to check permissions
      const existingEvaluation = await storage.getEvaluation(id);
      if (!existingEvaluation) {
        return res.status(404).json({ message: "Evaluation not found" });
      }

      // Apply role-based access control for updates
      const evaluationData = insertEvaluationSchema.partial().parse(req.body);
      
      if (currentUser.role === 'employee') {
        // Employees can only update their own evaluations and only self-evaluation data
        if (existingEvaluation.employeeId !== currentUser.id) {
          return res.status(403).json({ message: "Access denied: Cannot update evaluation for other employees" });
        }
        // Restrict what employees can update
        const allowedUpdates = {
          selfEvaluationData: evaluationData.selfEvaluationData,
          selfEvaluationSubmittedAt: evaluationData.selfEvaluationSubmittedAt,
        };
        const filteredData = Object.fromEntries(
          Object.entries(allowedUpdates).filter(([_, value]) => value !== undefined)
        );
        const evaluation = await storage.updateEvaluation(id, filteredData);
        res.json(evaluation);
      } else if (currentUser.role === 'manager') {
        // Managers can update evaluations for their direct reports and their own
        if (existingEvaluation.managerId !== currentUser.id && existingEvaluation.employeeId !== currentUser.id) {
          return res.status(403).json({ message: "Access denied: Cannot update evaluation for other teams" });
        }
        
        if (existingEvaluation.employeeId === currentUser.id) {
          // Managers updating their own evaluation (as employee)
          const allowedUpdates = {
            selfEvaluationData: evaluationData.selfEvaluationData,
            selfEvaluationSubmittedAt: evaluationData.selfEvaluationSubmittedAt,
          };
          const filteredData = Object.fromEntries(
            Object.entries(allowedUpdates).filter(([_, value]) => value !== undefined)
          );
          const evaluation = await storage.updateEvaluation(id, filteredData);
          res.json(evaluation);
        } else {
          // Managers updating their direct report's evaluation
          const allowedUpdates = {
            managerEvaluationData: evaluationData.managerEvaluationData,
            managerEvaluationSubmittedAt: evaluationData.managerEvaluationSubmittedAt,
            overallRating: evaluationData.overallRating,
            finalizedAt: evaluationData.finalizedAt,
            status: evaluationData.status,
          };
          const filteredData = Object.fromEntries(
            Object.entries(allowedUpdates).filter(([_, value]) => value !== undefined)
          );
          const evaluation = await storage.updateEvaluation(id, filteredData);
          res.json(evaluation);
        }
      } else {
        // super_admin, admin, hr_manager can update any evaluation with any data
        const evaluation = await storage.updateEvaluation(id, evaluationData);
        res.json(evaluation);
      }
    } catch (error) {
      console.error("Error updating evaluation:", error);
      res.status(500).json({ message: "Failed to update evaluation" });
    }
  });

  // Generate evaluations for review cycle
  app.post('/api/review-cycles/:cycleId/generate-evaluations', isAuthenticated, requireRoles(['super_admin', 'admin', 'hr_manager']), async (req, res) => {
    try {
      const { cycleId } = req.params;
      const { employeeIds } = req.body;
      
      // Verify review cycle exists
      const reviewCycle = await storage.getReviewCycle(cycleId);
      if (!reviewCycle) {
        return res.status(404).json({ message: "Review cycle not found" });
      }
      
      const createdEvaluations = [];
      
      for (const employeeId of employeeIds) {
        const employee = await storage.getUser(employeeId);
        if (!employee) {
          console.warn(`Employee ${employeeId} not found, skipping`);
          continue;
        }
        
        // Check if evaluation already exists for this employee and cycle
        const existingEvaluation = await storage.getEvaluationByEmployeeAndCycle(employeeId, cycleId);
        if (existingEvaluation) {
          console.log(`Evaluation already exists for employee ${employeeId} in cycle ${cycleId}, skipping`);
          continue;
        }
        
        // Get the employee's manager
        let managerId = employee.reportingManagerId;
        if (!managerId) {
          // If no manager assigned, use a default admin/HR manager for now
          console.warn(`No manager found for employee ${employeeId}`);
          continue;
        }
        
        // Create evaluation record
        const evaluationData = {
          employeeId: employeeId,
          managerId: managerId,
          reviewCycleId: cycleId,
          status: 'draft' as const,
        };
        
        const evaluation = await storage.createEvaluation(evaluationData);
        createdEvaluations.push(evaluation);
      }
      
      res.status(201).json({
        message: `Created ${createdEvaluations.length} evaluations`,
        evaluations: createdEvaluations
      });
    } catch (error) {
      console.error("Error generating evaluations:", error);
      res.status(500).json({ message: "Failed to generate evaluations" });
    }
  });

  // Get evaluation by ID with role-based access
  app.get('/api/evaluations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const evaluation = await storage.getEvaluation(id);
      if (!evaluation) {
        return res.status(404).json({ message: "Evaluation not found" });
      }

      // Apply role-based access control
      if (currentUser.role === 'employee') {
        if (evaluation.employeeId !== currentUser.id) {
          return res.status(403).json({ message: "Access denied: Cannot view evaluation for other employees" });
        }
      } else if (currentUser.role === 'manager') {
        if (evaluation.managerId !== currentUser.id && evaluation.employeeId !== currentUser.id) {
          return res.status(403).json({ message: "Access denied: Cannot view evaluation for other teams" });
        }
      }
      // super_admin, admin, hr_manager can access any evaluation

      res.json(evaluation);
    } catch (error) {
      console.error("Error fetching evaluation:", error);
      res.status(500).json({ message: "Failed to fetch evaluation" });
    }
  });

  // Finalize an evaluation (manager completes the review process)
  app.post('/api/evaluations/:id/finalize', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const evaluation = await storage.getEvaluation(id);
      if (!evaluation) {
        return res.status(404).json({ message: "Evaluation not found" });
      }

      // Only managers, HR, or admins can finalize evaluations
      if (currentUser.role === 'employee') {
        return res.status(403).json({ message: "Access denied: Employees cannot finalize evaluations" });
      }

      if (currentUser.role === 'manager' && evaluation.managerId !== currentUser.id) {
        return res.status(403).json({ message: "Access denied: Can only finalize evaluations you manage" });
      }

      // Check if evaluation is ready to be finalized
      if (!evaluation.selfEvaluationSubmittedAt) {
        return res.status(400).json({ message: "Cannot finalize: Employee self-evaluation not yet submitted" });
      }

      if (!evaluation.managerEvaluationSubmittedAt) {
        return res.status(400).json({ message: "Cannot finalize: Manager evaluation not yet submitted" });
      }

      // Finalize the evaluation
      const finalizedEvaluation = await storage.updateEvaluation(id, {
        status: 'completed',
        finalizedAt: new Date(),
      });

      res.json(finalizedEvaluation);
    } catch (error) {
      console.error("Error finalizing evaluation:", error);
      res.status(500).json({ message: "Failed to finalize evaluation" });
    }
  });

  // Send review invitations
  app.post('/api/send-review-invitations', isAuthenticated, requireRoles(['super_admin', 'admin', 'hr_manager']), async (req, res) => {
    try {
      const { employeeIds, reviewCycleId } = req.body;
      
      for (const employeeId of employeeIds) {
        const employee = await storage.getUser(employeeId);
        if (employee && employee.email) {
          await sendReviewInvitation(employee.email, employee.firstName || '', reviewCycleId);
        }
      }
      
      res.json({ message: "Review invitations sent successfully" });
    } catch (error) {
      console.error("Error sending review invitations:", error);
      res.status(500).json({ message: "Failed to send review invitations" });
    }
  });

  // Email configuration routes
  app.get('/api/email-config', isAuthenticated, requireRoles(['super_admin', 'admin']), async (req, res) => {
    try {
      const config = await storage.getEmailConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching email config:", error);
      res.status(500).json({ message: "Failed to fetch email config" });
    }
  });

  app.post('/api/email-config', isAuthenticated, requireRoles(['super_admin', 'admin']), async (req, res) => {
    try {
      const configData = insertEmailConfigSchema.parse(req.body);
      const config = await storage.createEmailConfig(configData);
      res.status(201).json(config);
    } catch (error) {
      console.error("Error creating email config:", error);
      res.status(500).json({ message: "Failed to create email config" });
    }
  });

  // Object storage routes for company logos
  app.post('/api/objects/upload', isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  app.put('/api/company-logos', isAuthenticated, async (req, res) => {
    try {
      if (!req.body.logoURL) {
        return res.status(400).json({ error: "logoURL is required" });
      }

      const userId = (req.user as any)?.claims?.sub;
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.logoURL,
        {
          owner: userId,
          visibility: "public",
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting company logo:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Settings routes - Change password and Email Service configuration
  app.post('/api/settings/change-password', isAuthenticated, requireRoles(['super_admin', 'admin']), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { currentPassword, newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({ message: "New password is required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long" });
      }

      // Convert empty string to undefined for OIDC accounts
      const sanitizedCurrentPassword = currentPassword && currentPassword.trim() !== '' ? currentPassword : undefined;
      await storage.changePassword(userId, sanitizedCurrentPassword, newPassword);
      res.json({ message: "Password changed successfully" });
    } catch (error: any) {
      console.error("Error changing password:", error);
      if (error.message === 'User not found' || error.message === 'Current password is incorrect') {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.get('/api/settings/email', isAuthenticated, requireRoles(['admin']), async (req, res) => {
    try {
      const config = await storage.getEmailConfig();
      if (config) {
        // Remove sensitive password field from response
        const { smtpPassword, ...safeConfig } = config;
        res.json(safeConfig);
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error("Error fetching email settings:", error);
      res.status(500).json({ message: "Failed to fetch email settings" });
    }
  });

  app.post('/api/settings/email', isAuthenticated, requireRoles(['admin']), async (req, res) => {
    try {
      // Create API schema that matches frontend field names
      const emailConfigApiSchema = z.object({
        host: z.string().min(1, "SMTP host is required"),
        port: z.number().min(1, "Port is required").max(65535, "Invalid port"),
        username: z.string().min(1, "Username is required"),
        password: z.string().min(1, "Password is required"),
        secure: z.boolean(),
        fromEmail: z.string().email("Valid email address is required"),
        fromName: z.string().min(1, "From name is required"),
      });

      // Validate request body with API schema
      const validationResult = emailConfigApiSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid email configuration data",
          errors: validationResult.error.errors 
        });
      }

      const { host, port, username, password, secure, fromEmail, fromName } = validationResult.data;
      
      const emailConfigData = {
        smtpHost: host,
        smtpPort: port, // port is already a number from validation
        smtpUsername: username,
        smtpPassword: password,
        fromEmail,
        fromName,
        isActive: true, // Keep as true for now, secure is for SSL/TLS
        updatedAt: new Date(),
      };

      // Check if config already exists
      const existingConfig = await storage.getEmailConfig();
      let result;
      
      if (existingConfig) {
        // Update existing config
        result = await storage.updateEmailConfig(existingConfig.id, emailConfigData);
      } else {
        // Create new config
        result = await storage.createEmailConfig(emailConfigData);
      }

      // Remove password from response
      const { smtpPassword: _, ...safeResult } = result;
      res.json(safeResult);
    } catch (error) {
      console.error("Error saving email settings:", error);
      res.status(500).json({ message: "Failed to save email settings" });
    }
  });

  // Level management routes - Administrator isolated (GET endpoints accessible by HR Manager too)
  app.get('/api/levels', isAuthenticated, requireRoles(['admin', 'hr_manager']), async (req: any, res) => {
    try {
      const createdById = req.user.claims.sub;
      const levels = await storage.getLevels(createdById);
      res.json(levels);
    } catch (error) {
      console.error("Error fetching levels:", error);
      res.status(500).json({ message: "Failed to fetch levels" });
    }
  });

  app.get('/api/levels/:id', isAuthenticated, requireRoles(['admin', 'hr_manager']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const createdById = req.user.claims.sub;
      const level = await storage.getLevel(id, createdById);
      if (!level) {
        return res.status(404).json({ message: "Level not found" });
      }
      res.json(level);
    } catch (error) {
      console.error("Error fetching level:", error);
      res.status(500).json({ message: "Failed to fetch level" });
    }
  });

  app.post('/api/levels', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const levelData = insertLevelSchema.parse(req.body);
      const createdById = req.user.claims.sub;
      const level = await storage.createLevel(levelData, createdById);
      res.status(201).json(level);
    } catch (error) {
      console.error("Error creating level:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid level data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create level" });
    }
  });

  app.put('/api/levels/:id', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const createdById = req.user.claims.sub;
      
      // Check if level exists and belongs to the administrator
      const existingLevel = await storage.getLevel(id, createdById);
      if (!existingLevel) {
        return res.status(404).json({ message: "Level not found" });
      }
      
      // Parse and sanitize the request body to prevent ownership changes
      const { id: _id, createdById: _createdById, createdAt: _createdAt, ...safeLevelData } = insertLevelSchema.partial().parse(req.body);
      const level = await storage.updateLevel(id, safeLevelData, createdById);
      res.json(level);
    } catch (error) {
      console.error("Error updating level:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid level data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update level" });
    }
  });

  app.delete('/api/levels/:id', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const createdById = req.user.claims.sub;
      
      // Check if level exists and belongs to the administrator
      const existingLevel = await storage.getLevel(id, createdById);
      if (!existingLevel) {
        return res.status(404).json({ message: "Level not found" });
      }
      
      await storage.deleteLevel(id, createdById);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting level:", error);
      res.status(500).json({ message: "Failed to delete level" });
    }
  });

  // Grade management routes - Administrator isolated (GET endpoints accessible by HR Manager too)
  app.get('/api/grades', isAuthenticated, requireRoles(['admin', 'hr_manager']), async (req: any, res) => {
    try {
      const createdById = req.user.claims.sub;
      const grades = await storage.getGrades(createdById);
      res.json(grades);
    } catch (error) {
      console.error("Error fetching grades:", error);
      res.status(500).json({ message: "Failed to fetch grades" });
    }
  });

  app.get('/api/grades/:id', isAuthenticated, requireRoles(['admin', 'hr_manager']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const createdById = req.user.claims.sub;
      const grade = await storage.getGrade(id, createdById);
      if (!grade) {
        return res.status(404).json({ message: "Grade not found" });
      }
      res.json(grade);
    } catch (error) {
      console.error("Error fetching grade:", error);
      res.status(500).json({ message: "Failed to fetch grade" });
    }
  });

  app.post('/api/grades', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const gradeData = insertGradeSchema.parse(req.body);
      const createdById = req.user.claims.sub;
      const grade = await storage.createGrade(gradeData, createdById);
      res.status(201).json(grade);
    } catch (error) {
      console.error("Error creating grade:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid grade data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create grade" });
    }
  });

  app.put('/api/grades/:id', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const createdById = req.user.claims.sub;
      
      // Check if grade exists and belongs to the administrator
      const existingGrade = await storage.getGrade(id, createdById);
      if (!existingGrade) {
        return res.status(404).json({ message: "Grade not found" });
      }
      
      // Parse and sanitize the request body to prevent ownership changes
      const { id: _id, createdById: _createdById, createdAt: _createdAt, ...safeGradeData } = insertGradeSchema.partial().parse(req.body);
      const grade = await storage.updateGrade(id, safeGradeData, createdById);
      res.json(grade);
    } catch (error) {
      console.error("Error updating grade:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid grade data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update grade" });
    }
  });

  app.delete('/api/grades/:id', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const createdById = req.user.claims.sub;
      
      // Check if grade exists and belongs to the administrator
      const existingGrade = await storage.getGrade(id, createdById);
      if (!existingGrade) {
        return res.status(404).json({ message: "Grade not found" });
      }
      
      await storage.deleteGrade(id, createdById);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting grade:", error);
      res.status(500).json({ message: "Failed to delete grade" });
    }
  });

  // Department management routes - Administrator isolated
  app.get('/api/departments', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const createdById = req.user.claims.sub;
      const departments = await storage.getDepartments(createdById);
      res.json(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  app.get('/api/departments/:id', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const createdById = req.user.claims.sub;
      const department = await storage.getDepartment(id, createdById);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      res.json(department);
    } catch (error) {
      console.error("Error fetching department:", error);
      res.status(500).json({ message: "Failed to fetch department" });
    }
  });

  app.post('/api/departments', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const departmentData = insertDepartmentSchema.parse(req.body);
      const createdById = req.user.claims.sub;
      const department = await storage.createDepartment(departmentData, createdById);
      res.status(201).json(department);
    } catch (error) {
      console.error("Error creating department:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid department data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create department" });
    }
  });

  app.put('/api/departments/:id', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const createdById = req.user.claims.sub;
      
      // Check if department exists and belongs to the administrator
      const existingDepartment = await storage.getDepartment(id, createdById);
      if (!existingDepartment) {
        return res.status(404).json({ message: "Department not found" });
      }
      
      // Parse and sanitize the request body to prevent ownership changes
      const { id: _id, createdById: _createdById, createdAt: _createdAt, ...safeDepartmentData } = insertDepartmentSchema.partial().parse(req.body);
      const department = await storage.updateDepartment(id, safeDepartmentData, createdById);
      res.json(department);
    } catch (error) {
      console.error("Error updating department:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid department data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update department" });
    }
  });

  app.delete('/api/departments/:id', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const createdById = req.user.claims.sub;
      
      // Check if department exists and belongs to the administrator
      const existingDepartment = await storage.getDepartment(id, createdById);
      if (!existingDepartment) {
        return res.status(404).json({ message: "Department not found" });
      }
      
      await storage.deleteDepartment(id, createdById);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting department:", error);
      res.status(500).json({ message: "Failed to delete department" });
    }
  });

  // Appraisal Cycle management routes - Administrator isolated
  app.get('/api/appraisal-cycles', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const createdById = req.user.claims.sub;
      const cycles = await storage.getAppraisalCycles(createdById);
      res.json(cycles);
    } catch (error) {
      console.error("Error fetching appraisal cycles:", error);
      res.status(500).json({ message: "Failed to fetch appraisal cycles" });
    }
  });

  app.get('/api/appraisal-cycles/:id', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const createdById = req.user.claims.sub;
      const cycle = await storage.getAppraisalCycle(id, createdById);
      if (!cycle) {
        return res.status(404).json({ message: "Appraisal cycle not found" });
      }
      res.json(cycle);
    } catch (error) {
      console.error("Error fetching appraisal cycle:", error);
      res.status(500).json({ message: "Failed to fetch appraisal cycle" });
    }
  });

  app.post('/api/appraisal-cycles', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const cycleData = insertAppraisalCycleSchema.parse(req.body);
      const createdById = req.user.claims.sub;
      const cycle = await storage.createAppraisalCycle(cycleData, createdById);
      res.status(201).json(cycle);
    } catch (error) {
      console.error("Error creating appraisal cycle:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appraisal cycle data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create appraisal cycle" });
    }
  });

  app.put('/api/appraisal-cycles/:id', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const createdById = req.user.claims.sub;
      
      // Check if appraisal cycle exists and belongs to the administrator
      const existingCycle = await storage.getAppraisalCycle(id, createdById);
      if (!existingCycle) {
        return res.status(404).json({ message: "Appraisal cycle not found" });
      }
      
      // Parse and sanitize the request body to prevent ownership changes
      const { id: _id, createdById: _createdById, createdAt: _createdAt, ...safeCycleData } = insertAppraisalCycleSchema.partial().parse(req.body);
      const cycle = await storage.updateAppraisalCycle(id, safeCycleData, createdById);
      res.json(cycle);
    } catch (error) {
      console.error("Error updating appraisal cycle:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appraisal cycle data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update appraisal cycle" });
    }
  });

  app.delete('/api/appraisal-cycles/:id', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const createdById = req.user.claims.sub;
      
      // Check if appraisal cycle exists and belongs to the administrator
      const existingCycle = await storage.getAppraisalCycle(id, createdById);
      if (!existingCycle) {
        return res.status(404).json({ message: "Appraisal cycle not found" });
      }
      
      await storage.deleteAppraisalCycle(id, createdById);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting appraisal cycle:", error);
      res.status(500).json({ message: "Failed to delete appraisal cycle" });
    }
  });

  // Review Frequency management routes - Administrator isolated
  app.get('/api/review-frequencies', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const createdById = req.user.claims.sub;
      const frequencies = await storage.getReviewFrequencies(createdById);
      res.json(frequencies);
    } catch (error) {
      console.error("Error fetching review frequencies:", error);
      res.status(500).json({ message: "Failed to fetch review frequencies" });
    }
  });

  app.get('/api/review-frequencies/:id', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const createdById = req.user.claims.sub;
      const frequency = await storage.getReviewFrequency(id, createdById);
      if (!frequency) {
        return res.status(404).json({ message: "Review frequency not found" });
      }
      res.json(frequency);
    } catch (error) {
      console.error("Error fetching review frequency:", error);
      res.status(500).json({ message: "Failed to fetch review frequency" });
    }
  });

  app.post('/api/review-frequencies', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const frequencyData = insertReviewFrequencySchema.parse(req.body);
      const createdById = req.user.claims.sub;
      const frequency = await storage.createReviewFrequency(frequencyData, createdById);
      res.status(201).json(frequency);
    } catch (error) {
      console.error("Error creating review frequency:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review frequency data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create review frequency" });
    }
  });

  app.put('/api/review-frequencies/:id', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const createdById = req.user.claims.sub;
      
      // Check if review frequency exists and belongs to the administrator
      const existingFrequency = await storage.getReviewFrequency(id, createdById);
      if (!existingFrequency) {
        return res.status(404).json({ message: "Review frequency not found" });
      }
      
      // Parse and sanitize the request body to prevent ownership changes
      const { id: _id, createdById: _createdById, createdAt: _createdAt, ...safeFrequencyData } = insertReviewFrequencySchema.partial().parse(req.body);
      const frequency = await storage.updateReviewFrequency(id, safeFrequencyData, createdById);
      res.json(frequency);
    } catch (error) {
      console.error("Error updating review frequency:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review frequency data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update review frequency" });
    }
  });

  app.delete('/api/review-frequencies/:id', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const createdById = req.user.claims.sub;
      
      // Check if review frequency exists and belongs to the administrator
      const existingFrequency = await storage.getReviewFrequency(id, createdById);
      if (!existingFrequency) {
        return res.status(404).json({ message: "Review frequency not found" });
      }
      
      await storage.deleteReviewFrequency(id, createdById);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting review frequency:", error);
      res.status(500).json({ message: "Failed to delete review frequency" });
    }
  });

  // Frequency Calendar management routes - Administrator isolated
  app.get('/api/frequency-calendars', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const createdById = req.user.claims.sub;
      const calendars = await storage.getFrequencyCalendars(createdById);
      res.json(calendars);
    } catch (error) {
      console.error("Error fetching frequency calendars:", error);
      res.status(500).json({ message: "Failed to fetch frequency calendars" });
    }
  });

  app.get('/api/frequency-calendars/:id', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const createdById = req.user.claims.sub;
      const calendar = await storage.getFrequencyCalendar(id, createdById);
      if (!calendar) {
        return res.status(404).json({ message: "Frequency calendar not found" });
      }
      res.json(calendar);
    } catch (error) {
      console.error("Error fetching frequency calendar:", error);
      res.status(500).json({ message: "Failed to fetch frequency calendar" });
    }
  });

  app.post('/api/frequency-calendars', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const calendarData = insertFrequencyCalendarSchema.parse(req.body);
      const createdById = req.user.claims.sub;
      const calendar = await storage.createFrequencyCalendar(calendarData, createdById);
      res.status(201).json(calendar);
    } catch (error) {
      console.error("Error creating frequency calendar:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid frequency calendar data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create frequency calendar" });
    }
  });

  app.put('/api/frequency-calendars/:id', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const createdById = req.user.claims.sub;
      
      // Check if frequency calendar exists and belongs to the administrator
      const existingCalendar = await storage.getFrequencyCalendar(id, createdById);
      if (!existingCalendar) {
        return res.status(404).json({ message: "Frequency calendar not found" });
      }
      
      // Parse and sanitize the request body to prevent ownership changes
      const { id: _id, createdById: _createdById, createdAt: _createdAt, ...safeCalendarData } = insertFrequencyCalendarSchema.partial().parse(req.body);
      const calendar = await storage.updateFrequencyCalendar(id, safeCalendarData, createdById);
      res.json(calendar);
    } catch (error) {
      console.error("Error updating frequency calendar:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid frequency calendar data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update frequency calendar" });
    }
  });

  app.delete('/api/frequency-calendars/:id', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const createdById = req.user.claims.sub;
      
      // Check if frequency calendar exists and belongs to the administrator
      const existingCalendar = await storage.getFrequencyCalendar(id, createdById);
      if (!existingCalendar) {
        return res.status(404).json({ message: "Frequency calendar not found" });
      }
      
      await storage.deleteFrequencyCalendar(id, createdById);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting frequency calendar:", error);
      res.status(500).json({ message: "Failed to delete frequency calendar" });
    }
  });

  // Frequency Calendar Details management routes - Administrator isolated through parent calendar
  app.get('/api/frequency-calendar-details', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const createdById = req.user.claims.sub;
      const details = await storage.getFrequencyCalendarDetails(createdById);
      res.json(details);
    } catch (error) {
      console.error("Error fetching frequency calendar details:", error);
      res.status(500).json({ message: "Failed to fetch frequency calendar details" });
    }
  });

  app.get('/api/frequency-calendar-details/:id', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const createdById = req.user.claims.sub;
      const detail = await storage.getFrequencyCalendarDetail(id, createdById);
      if (!detail) {
        return res.status(404).json({ message: "Frequency calendar details not found" });
      }
      res.json(detail);
    } catch (error) {
      console.error("Error fetching frequency calendar detail:", error);
      res.status(500).json({ message: "Failed to fetch frequency calendar detail" });
    }
  });

  app.post('/api/frequency-calendar-details', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const detailsData = insertFrequencyCalendarDetailsSchema.parse(req.body);
      const createdById = req.user.claims.sub;
      const details = await storage.createFrequencyCalendarDetails(detailsData, createdById);
      res.status(201).json(details);
    } catch (error) {
      console.error("Error creating frequency calendar details:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid frequency calendar details data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create frequency calendar details" });
    }
  });

  app.put('/api/frequency-calendar-details/:id', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const createdById = req.user.claims.sub;
      
      // Check if frequency calendar details exist and belong to the administrator through parent calendar
      const existingDetails = await storage.getFrequencyCalendarDetail(id, createdById);
      if (!existingDetails) {
        return res.status(404).json({ message: "Frequency calendar details not found" });
      }
      
      // Parse and sanitize the request body to prevent ownership changes
      const { id: _id, createdAt: _createdAt, ...safeDetailsData } = insertFrequencyCalendarDetailsSchema.partial().parse(req.body);
      const details = await storage.updateFrequencyCalendarDetails(id, safeDetailsData, createdById);
      res.json(details);
    } catch (error) {
      console.error("Error updating frequency calendar details:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid frequency calendar details data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update frequency calendar details" });
    }
  });

  app.delete('/api/frequency-calendar-details/:id', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const createdById = req.user.claims.sub;
      
      // Check if frequency calendar details exist and belong to the administrator through parent calendar
      const existingDetails = await storage.getFrequencyCalendarDetail(id, createdById);
      if (!existingDetails) {
        return res.status(404).json({ message: "Frequency calendar details not found" });
      }
      
      await storage.deleteFrequencyCalendarDetails(id, createdById);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting frequency calendar details:", error);
      res.status(500).json({ message: "Failed to delete frequency calendar details" });
    }
  });

  // Publish Questionnaire management routes - Administrator isolated
  app.get('/api/publish-questionnaires', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const createdById = req.user.claims.sub;
      const questionnaires = await storage.getPublishQuestionnaires(createdById);
      res.json(questionnaires);
    } catch (error) {
      console.error("Error fetching publish questionnaires:", error);
      res.status(500).json({ message: "Failed to fetch publish questionnaires" });
    }
  });

  app.get('/api/publish-questionnaires/:id', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const createdById = req.user.claims.sub;
      const questionnaire = await storage.getPublishQuestionnaire(id, createdById);
      if (!questionnaire) {
        return res.status(404).json({ message: "Publish questionnaire not found" });
      }
      res.json(questionnaire);
    } catch (error) {
      console.error("Error fetching publish questionnaire:", error);
      res.status(500).json({ message: "Failed to fetch publish questionnaire" });
    }
  });

  app.post('/api/publish-questionnaires', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const questionnaireData = insertPublishQuestionnaireSchema.parse(req.body);
      const createdById = req.user.claims.sub;
      const questionnaire = await storage.createPublishQuestionnaire(questionnaireData, createdById);
      res.status(201).json(questionnaire);
    } catch (error) {
      console.error("Error creating publish questionnaire:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid publish questionnaire data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create publish questionnaire" });
    }
  });

  app.put('/api/publish-questionnaires/:id', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const createdById = req.user.claims.sub;
      
      // Check if publish questionnaire exists and belongs to the administrator
      const existingQuestionnaire = await storage.getPublishQuestionnaire(id, createdById);
      if (!existingQuestionnaire) {
        return res.status(404).json({ message: "Publish questionnaire not found" });
      }
      
      // Parse and sanitize the request body to prevent ownership changes
      const { id: _id, createdById: _createdById, createdAt: _createdAt, ...safeQuestionnaireData } = insertPublishQuestionnaireSchema.partial().parse(req.body);
      const questionnaire = await storage.updatePublishQuestionnaire(id, safeQuestionnaireData, createdById);
      res.json(questionnaire);
    } catch (error) {
      console.error("Error updating publish questionnaire:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid publish questionnaire data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update publish questionnaire" });
    }
  });

  app.delete('/api/publish-questionnaires/:id', isAuthenticated, requireRoles(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const createdById = req.user.claims.sub;
      
      // Check if publish questionnaire exists and belongs to the administrator
      const existingQuestionnaire = await storage.getPublishQuestionnaire(id, createdById);
      if (!existingQuestionnaire) {
        return res.status(404).json({ message: "Publish questionnaire not found" });
      }
      
      await storage.deletePublishQuestionnaire(id, createdById);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting publish questionnaire:", error);
      res.status(500).json({ message: "Failed to delete publish questionnaire" });
    }
  });

  // Appraisal Groups routes - HR Manager access
  app.get('/api/appraisal-groups', isAuthenticated, requireRoles(['hr_manager']), async (req: any, res) => {
    try {
      const requestingUserId = req.user.claims.sub;
      const groups = await storage.getAppraisalGroupsWithMembers(requestingUserId);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching appraisal groups:", error);
      res.status(500).json({ message: "Failed to fetch appraisal groups" });
    }
  });

  app.get('/api/appraisal-groups/:id', isAuthenticated, requireRoles(['hr_manager']), async (req: any, res) => {
    try {
      const requestingUserId = req.user.claims.sub;
      const { id } = req.params;
      const group = await storage.getAppraisalGroup(id, requestingUserId);
      if (!group) {
        return res.status(404).json({ message: "Appraisal group not found" });
      }
      res.json(group);
    } catch (error) {
      console.error("Error fetching appraisal group:", error);
      res.status(500).json({ message: "Failed to fetch appraisal group" });
    }
  });

  app.post('/api/appraisal-groups', isAuthenticated, requireRoles(['hr_manager']), async (req: any, res) => {
    try {
      const requestingUserId = req.user.claims.sub;
      // Validate request body and add createdById from session
      const validatedData = insertAppraisalGroupSchema.omit({ createdById: true }).parse(req.body);
      const groupData = {
        ...validatedData,
        createdById: requestingUserId,
      };
      const group = await storage.createAppraisalGroup(groupData, requestingUserId);
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating appraisal group:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create appraisal group" });
    }
  });

  app.put('/api/appraisal-groups/:id', isAuthenticated, requireRoles(['hr_manager']), async (req: any, res) => {
    try {
      const requestingUserId = req.user.claims.sub;
      const { id } = req.params;
      const validatedData = insertAppraisalGroupSchema.partial().parse(req.body);
      const group = await storage.updateAppraisalGroup(id, validatedData, requestingUserId);
      res.json(group);
    } catch (error) {
      console.error("Error updating appraisal group:", error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: "Appraisal group not found" });
      }
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update appraisal group" });
    }
  });

  app.delete('/api/appraisal-groups/:id', isAuthenticated, requireRoles(['hr_manager']), async (req: any, res) => {
    try {
      const requestingUserId = req.user.claims.sub;
      const { id } = req.params;
      await storage.deleteAppraisalGroup(id, requestingUserId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting appraisal group:", error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: "Appraisal group not found" });
      }
      res.status(500).json({ message: "Failed to delete appraisal group" });
    }
  });

  // Appraisal Group Members routes
  app.get('/api/appraisal-groups/:groupId/members', isAuthenticated, requireRoles(['hr_manager']), async (req: any, res) => {
    try {
      const requestingUserId = req.user.claims.sub;
      const { groupId } = req.params;
      const members = await storage.getAppraisalGroupMembers(groupId, requestingUserId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching group members:", error);
      res.status(500).json({ message: "Failed to fetch group members" });
    }
  });

  app.post('/api/appraisal-groups/:groupId/members', isAuthenticated, requireRoles(['hr_manager']), async (req: any, res) => {
    try {
      const requestingUserId = req.user.claims.sub;
      const { groupId } = req.params;
      const { userId } = req.body;
      
      const memberData = {
        appraisalGroupId: groupId,
        userId: userId,
        addedById: requestingUserId,
      };
      
      const validatedData = insertAppraisalGroupMemberSchema.parse(memberData);
      const member = await storage.addAppraisalGroupMember(validatedData, requestingUserId);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error adding group member:", error);
      if (error.message.includes('already a member')) {
        return res.status(409).json({ message: "User is already a member of this group" });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: "Group or user not found" });
      }
      res.status(500).json({ message: "Failed to add group member" });
    }
  });

  app.delete('/api/appraisal-groups/:groupId/members/:userId', isAuthenticated, requireRoles(['hr_manager']), async (req: any, res) => {
    try {
      const requestingUserId = req.user.claims.sub;
      const { groupId, userId } = req.params;
      await storage.removeAppraisalGroupMember(groupId, userId, requestingUserId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing group member:", error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: "Group member not found" });
      }
      res.status(500).json({ message: "Failed to remove group member" });
    }
  });

  // Development endpoints for user seeding and testing
  // Development endpoints - only available in development environment
  if (process.env.NODE_ENV === 'development') {
    app.post('/api/dev/seed-users', async (req, res) => {
      try {
        await seedTestUsers();
        res.json({ 
          message: "Test users seeded successfully",
          users: testUsers.map(u => ({ 
            role: u.role, 
            email: u.email, 
            name: `${u.firstName} ${u.lastName}` 
          }))
        });
      } catch (error) {
        console.error("Error seeding users:", error);
        res.status(500).json({ message: "Failed to seed users" });
      }
    });

    app.get('/api/dev/test-users', async (req, res) => {
      try {
        res.json({
          message: "Available test user accounts",
          instructions: "After seeding, you can login with any Replit account and manually change your role in the database, or use the 'Switch User' functionality if implemented",
          testUsers: testUsers.map(u => ({
            role: u.role,
            email: u.email,
            name: `${u.firstName} ${u.lastName}`,
            id: u.id
          }))
        });
      } catch (error) {
        console.error("Error getting test users:", error);
        res.status(500).json({ message: "Failed to get test users" });
      }
    });

    // Development login endpoint to bypass OAuth
    app.post('/api/dev/login', async (req, res) => {
      try {
        const { userId } = req.body;
        
        if (!userId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        // Get the user from storage
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Set the user in the session (mimicking OAuth flow)
        const expires_at = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days from now
        
        (req.session as any).passport = {
          user: {
            id: user.id,
            claims: {
              sub: user.id,
              email: user.email,
              first_name: user.firstName,
              last_name: user.lastName,
              exp: expires_at
            },
            expires_at: expires_at,
            access_token: 'dev-token',
            refresh_token: 'dev-refresh-token'
          }
        };

        // Mark request as authenticated for immediate use
        (req as any).user = (req.session as any).passport.user;

        res.json({ 
          message: "Logged in successfully",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          }
        });
      } catch (error) {
        console.error("Error in dev login:", error);
        res.status(500).json({ message: "Failed to login" });
      }
    });
  } else {
    // In production, return 404 for all dev endpoints
    app.all('/api/dev/*', (req, res) => {
      res.status(404).json({ message: "Not found" });
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}
