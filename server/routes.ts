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

  app.post('/api/companies', isAuthenticated, async (req, res) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(companyData);
      res.status(201).json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.put('/api/companies/:id', isAuthenticated, async (req, res) => {
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

  app.delete('/api/companies/:id', isAuthenticated, async (req, res) => {
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

  app.post('/api/locations', isAuthenticated, async (req, res) => {
    try {
      const locationData = insertLocationSchema.parse(req.body);
      const location = await storage.createLocation(locationData);
      res.status(201).json(location);
    } catch (error) {
      console.error("Error creating location:", error);
      res.status(500).json({ message: "Failed to create location" });
    }
  });

  app.put('/api/locations/:id', isAuthenticated, async (req, res) => {
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

  app.delete('/api/locations/:id', isAuthenticated, async (req, res) => {
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
      const userData = insertUserSchema.partial().parse(req.body);
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

  app.post('/api/questionnaire-templates', isAuthenticated, async (req, res) => {
    try {
      const templateData = insertQuestionnaireTemplateSchema.parse(req.body);
      const template = await storage.createQuestionnaireTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating questionnaire template:", error);
      res.status(500).json({ message: "Failed to create questionnaire template" });
    }
  });

  app.put('/api/questionnaire-templates/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const templateData = insertQuestionnaireTemplateSchema.partial().parse(req.body);
      const template = await storage.updateQuestionnaireTemplate(id, templateData);
      res.json(template);
    } catch (error) {
      console.error("Error updating questionnaire template:", error);
      res.status(500).json({ message: "Failed to update questionnaire template" });
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

  app.post('/api/review-cycles', isAuthenticated, async (req, res) => {
    try {
      const cycleData = insertReviewCycleSchema.parse(req.body);
      const cycle = await storage.createReviewCycle(cycleData);
      res.status(201).json(cycle);
    } catch (error) {
      console.error("Error creating review cycle:", error);
      res.status(500).json({ message: "Failed to create review cycle" });
    }
  });

  // Evaluation routes
  app.get('/api/evaluations', isAuthenticated, async (req, res) => {
    try {
      const { employeeId, managerId, reviewCycleId, status } = req.query;
      const filters = {
        employeeId: employeeId as string,
        managerId: managerId as string,
        reviewCycleId: reviewCycleId as string,
        status: status as string,
      };
      const evaluations = await storage.getEvaluations(filters);
      res.json(evaluations);
    } catch (error) {
      console.error("Error fetching evaluations:", error);
      res.status(500).json({ message: "Failed to fetch evaluations" });
    }
  });

  app.post('/api/evaluations', isAuthenticated, async (req, res) => {
    try {
      const evaluationData = insertEvaluationSchema.parse(req.body);
      const evaluation = await storage.createEvaluation(evaluationData);
      res.status(201).json(evaluation);
    } catch (error) {
      console.error("Error creating evaluation:", error);
      res.status(500).json({ message: "Failed to create evaluation" });
    }
  });

  app.put('/api/evaluations/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const evaluationData = insertEvaluationSchema.partial().parse(req.body);
      const evaluation = await storage.updateEvaluation(id, evaluationData);
      res.json(evaluation);
    } catch (error) {
      console.error("Error updating evaluation:", error);
      res.status(500).json({ message: "Failed to update evaluation" });
    }
  });

  // Send review invitations
  app.post('/api/send-review-invitations', isAuthenticated, async (req, res) => {
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
  app.get('/api/email-config', isAuthenticated, async (req, res) => {
    try {
      const config = await storage.getEmailConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching email config:", error);
      res.status(500).json({ message: "Failed to fetch email config" });
    }
  });

  app.post('/api/email-config', isAuthenticated, async (req, res) => {
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

      const userId = req.user?.claims?.sub;
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

  const httpServer = createServer(app);
  return httpServer;
}
