import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireRoles } from "./replitAuth";
import { 
  insertUserSchema,
  insertCompanySchema,
  insertLocationSchema,
  insertQuestionnaireTemplateSchema,
  insertReviewCycleSchema,
  insertEvaluationSchema,
  insertEmailTemplateSchema,
  insertEmailConfigSchema,
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
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard metrics
  app.get('/api/dashboard/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const users = await storage.getUsers();
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
  app.get('/api/users', isAuthenticated, requireRoles(['super_admin', 'admin']), async (req, res) => {
    try {
      const { role, department, status } = req.query;
      const filters = {
        role: role as string,
        department: department as string,
        status: status as string,
      };
      const users = await storage.getUsers(filters);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', isAuthenticated, requireRoles(['super_admin', 'admin']), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put('/api/users/:id', isAuthenticated, requireRoles(['super_admin', 'admin']), async (req, res) => {
    try {
      const { id } = req.params;
      // Parse with the full schema to get password validation, then pass to storage
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.updateUser(id, userData);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, requireRoles(['super_admin', 'admin']), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUser(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Questionnaire template routes
  app.get('/api/questionnaire-templates', isAuthenticated, async (req, res) => {
    try {
      const templates = await storage.getQuestionnaireTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching questionnaire templates:", error);
      res.status(500).json({ message: "Failed to fetch questionnaire templates" });
    }
  });

  app.post('/api/questionnaire-templates', isAuthenticated, requireRoles(['super_admin', 'admin', 'hr_manager']), async (req, res) => {
    try {
      const templateData = insertQuestionnaireTemplateSchema.parse(req.body);
      const template = await storage.createQuestionnaireTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating questionnaire template:", error);
      res.status(500).json({ message: "Failed to create questionnaire template" });
    }
  });

  app.get('/api/questionnaire-templates/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const template = await storage.getQuestionnaireTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Questionnaire template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching questionnaire template:", error);
      res.status(500).json({ message: "Failed to fetch questionnaire template" });
    }
  });

  app.put('/api/questionnaire-templates/:id', isAuthenticated, requireRoles(['super_admin', 'admin', 'hr_manager']), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if template exists
      const existingTemplate = await storage.getQuestionnaireTemplate(id);
      if (!existingTemplate) {
        return res.status(404).json({ message: "Questionnaire template not found" });
      }
      
      const templateData = insertQuestionnaireTemplateSchema.partial().parse(req.body);
      const template = await storage.updateQuestionnaireTemplate(id, templateData);
      res.json(template);
    } catch (error) {
      console.error("Error updating questionnaire template:", error);
      res.status(500).json({ message: "Failed to update questionnaire template" });
    }
  });

  app.delete('/api/questionnaire-templates/:id', isAuthenticated, requireRoles(['super_admin', 'admin', 'hr_manager']), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if template exists
      const existingTemplate = await storage.getQuestionnaireTemplate(id);
      if (!existingTemplate) {
        return res.status(404).json({ message: "Questionnaire template not found" });
      }
      
      await storage.deleteQuestionnaireTemplate(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting questionnaire template:", error);
      res.status(500).json({ message: "Failed to delete questionnaire template" });
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
