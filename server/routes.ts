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
  insertRegistrationSchema,
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
  sendReminderRequestSchema,
  type SafeUser,
} from "@shared/schema";
import { sendEmail, sendReviewInvitation, sendReviewReminder, sendReviewCompletion, generateRegistrationNotificationEmail } from "./emailService";
import { ObjectStorageService } from "./objectStorage";
import { seedTestUsers, testUsers } from "./seedUsers";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Public registration route (no authentication required)
  app.post('/api/registration', async (req, res) => {
    try {
      const registrationData = insertRegistrationSchema.parse(req.body);
      
      // Create registration record
      const registration = await storage.createRegistration(registrationData);
      
      // Send notification email to kiran.shetty@refur.app
      try {
        const { subject, html } = generateRegistrationNotificationEmail(
          registrationData.name,
          registrationData.companyName,
          registrationData.designation,
          registrationData.email,
          registrationData.mobile
        );
        
        await sendEmail({
          to: 'kiran.shetty@refur.app',
          subject,
          html
        });
        
        // Mark notification as sent
        await storage.updateRegistration(registration.id, { notificationSent: true });
      } catch (emailError) {
        console.error('Failed to send registration notification email:', emailError);
        // Don't fail the registration if email fails, just log it
      }
      
      res.status(201).json({ 
        message: 'Registration submitted successfully. We will contact you soon.',
        id: registration.id 
      });
    } catch (error) {
      console.error('Error processing registration:', error);
      res.status(500).json({ message: 'Failed to submit registration. Please try again later.' });
    }
  });

  // Company login route (no authentication required)
  app.post('/api/login/company', async (req, res) => {
    try {
      const { companyUrl, email, password } = req.body;
      
      if (!companyUrl || !email || !password) {
        return res.status(400).json({ message: 'Company URL, email, and password are required.' });
      }
      
      // 1. Find company by URL slug
      const normalizedUrl = companyUrl.toLowerCase().trim();
      const company = await storage.getCompanyByUrl(normalizedUrl);
      
      if (!company) {
        return res.status(400).json({ message: 'Invalid company URL. Please check your company URL and try again.' });
      }
      
      // 2. Find user by email and verify they belong to this company
      const user = await storage.getUserByEmail(email.toLowerCase());
      
      console.log(`Company login attempt - Email: ${email}, Company: ${normalizedUrl}, Company ID: ${company.id}`);
      console.log(`Found user:`, user ? `${user.email} (ID: ${user.id}, Company: ${user.companyId})` : 'Not found');
      console.log(`User has password hash:`, user ? (user.passwordHash ? 'YES' : 'NO') : 'N/A');
      
      // Verify user belongs to this company
      if (!user || user.companyId !== company.id) {
        console.log(`User company mismatch - Expected: ${company.id}, Got: ${user?.companyId}`);
        return res.status(401).json({ message: 'Invalid email or password, or user not found in this company.' });
      }
      
      // 3. Verify password
      if (!user.passwordHash) {
        return res.status(401).json({ message: 'Password not set for this account. Please contact your administrator.' });
      }
      
      const bcrypt = await import('bcrypt');
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }
      
      // 4. Create session (using Passport login mechanism)
      const userSession = {
        claims: {
          sub: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          profile_image_url: user.profileImageUrl
        },
        access_token: 'company-login-token', // Placeholder token for company login
        refresh_token: 'company-login-refresh', // Placeholder refresh token
        expires_at: Math.floor(Date.now() / 1000) + 86400 // 24 hours from now
      };
      
      // Use Passport's login mechanism to properly authenticate the user
      req.login(userSession, (err) => {
        if (err) {
          console.error('Error establishing session:', err);
          return res.status(500).json({ message: 'Login failed. Please try again later.' });
        }
        
        // 5. Return success with user data
        const { passwordHash, ...safeUser } = user;
        res.json({ 
          message: 'Login successful',
          user: safeUser,
          companyUrl: normalizedUrl
        });
      });
      
    } catch (error) {
      console.error('Error in company login:', error);
      res.status(500).json({ message: 'Login failed. Please try again later.' });
    }
  });

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
      
      // Include active role from session if available, otherwise use database role
      const activeRole = req.user.activeRole || user.role;
      res.json({ ...safeUser, activeRole, availableRoles: user.roles || [user.role] });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Role switching endpoint
  app.post('/api/auth/switch-role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({ message: "Role is required" });
      }

      // Get current user data
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has the requested role
      const availableRoles = user.roles || [user.role];
      if (!availableRoles.includes(role)) {
        return res.status(403).json({ 
          message: "You don't have permission to switch to this role",
          availableRoles 
        });
      }

      // Update session with new active role
      req.user.activeRole = role;
      
      // Save session
      req.session.save((err: any) => {
        if (err) {
          console.error('Error saving session after role switch:', err);
          return res.status(500).json({ message: 'Failed to switch role' });
        }

        // Return updated user data
        const { passwordHash, ...safeUser } = user;
        res.json({ 
          message: 'Role switched successfully',
          user: { ...safeUser, activeRole: role, availableRoles }
        });
      });
    } catch (error) {
      console.error("Error switching role:", error);
      res.status(500).json({ message: "Failed to switch role" });
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
      
      // Check for duplicates before creating user - more efficient individual checks
      const creator = await storage.getUser(creatorId);
      
      // Check for duplicate email
      if (userData.email) {
        const existingEmailUser = await storage.getUserByEmail(userData.email);
        if (existingEmailUser) {
          // For admins, also check if it's in their company scope
          if (creator && creator.role === 'admin' && creator.companyId && existingEmailUser.companyId !== creator.companyId) {
            // Allow if it's a different company
          } else {
            return res.status(400).json({ 
              message: "Email address already exists. Please use a different email address.",
              field: "email"
            });
          }
        }
      }
      
      // Check for duplicate code  
      if (userData.code && userData.code.trim() !== '') {
        const existingCodeUser = await storage.getUserByCode(userData.code);
        if (existingCodeUser) {
          // For admins, also check if it's in their company scope
          if (creator && creator.role === 'admin' && creator.companyId && existingCodeUser.companyId !== creator.companyId) {
            // Allow if it's a different company
          } else {
            return res.status(400).json({ 
              message: "Employee code already exists. Please use a different code.",
              field: "code"
            });
          }
        }
      }
      
      // Check for duplicate mobile number
      if (userData.mobileNumber && userData.mobileNumber.trim() !== '') {
        const existingMobileUser = await storage.getUserByMobile(userData.mobileNumber);
        if (existingMobileUser) {
          // For admins, also check if it's in their company scope
          if (creator && creator.role === 'admin' && creator.companyId && existingMobileUser.companyId !== creator.companyId) {
            // Allow if it's a different company
          } else {
            return res.status(400).json({ 
              message: "Mobile number already exists. Please use a different mobile number.",
              field: "mobileNumber"
            });
          }
        }
      }
      
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

      const { employeeId, managerId, reviewCycleId, status, includeQuestionnaires } = req.query;
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
          const getEvaluationsMethod = includeQuestionnaires === 'true' 
            ? storage.getEvaluationsWithQuestionnaires 
            : storage.getEvaluations;
          
          const userManagedEvaluations = await getEvaluationsMethod({ managerId: currentUser.id });
          const userOwnEvaluations = await getEvaluationsMethod({ employeeId: currentUser.id });
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

      // Use enhanced method if questionnaires are requested
      const evaluations = includeQuestionnaires === 'true' 
        ? await storage.getEvaluationsWithQuestionnaires(filters)
        : await storage.getEvaluations(filters);
        
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

      // Convert date strings to Date objects before validation
      const requestBody = { ...req.body };
      if (requestBody.selfEvaluationSubmittedAt && typeof requestBody.selfEvaluationSubmittedAt === 'string') {
        requestBody.selfEvaluationSubmittedAt = new Date(requestBody.selfEvaluationSubmittedAt);
      }
      if (requestBody.managerEvaluationSubmittedAt && typeof requestBody.managerEvaluationSubmittedAt === 'string') {
        requestBody.managerEvaluationSubmittedAt = new Date(requestBody.managerEvaluationSubmittedAt);
      }
      if (requestBody.finalizedAt && typeof requestBody.finalizedAt === 'string') {
        requestBody.finalizedAt = new Date(requestBody.finalizedAt);
      }
      if (requestBody.meetingScheduledAt && typeof requestBody.meetingScheduledAt === 'string') {
        requestBody.meetingScheduledAt = new Date(requestBody.meetingScheduledAt);
      }
      if (requestBody.meetingCompletedAt && typeof requestBody.meetingCompletedAt === 'string') {
        requestBody.meetingCompletedAt = new Date(requestBody.meetingCompletedAt);
      }

      // Apply role-based access control for updates
      const evaluationData = insertEvaluationSchema.partial().parse(requestBody);
      
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

  // Get evaluations requiring manager review (submitted by employees) - MUST come before /:id route
  app.get('/api/evaluations/manager-submissions', isAuthenticated, requireRoles(['manager']), async (req: any, res) => {
    try {
      const managerId = req.user.claims.sub;
      
      // Get all evaluations where:
      // 1. Manager is the current user
      // 2. Employee has submitted their evaluation
      // 3. Manager hasn't submitted their review yet
      const evaluations = await storage.getEvaluations({ managerId });
      const submissionsForReview = evaluations.filter(evaluation => 
        evaluation.selfEvaluationSubmittedAt && !evaluation.managerEvaluationSubmittedAt
      );

      // Get questionnaire data for each evaluation
      const evaluationsWithQuestionnaires = await Promise.all(
        submissionsForReview.map(async (evaluation) => {
          // Get employee details
          const employee = await storage.getUser(evaluation.employeeId);
          // Get questionnaire template details from selfEvaluationData
          let questionnaireTemplate = null;
          
          // First try to get from selfEvaluationData.questionnaires array
          if (evaluation.selfEvaluationData?.questionnaires && Array.isArray(evaluation.selfEvaluationData.questionnaires)) {
            const questionnaireIds = evaluation.selfEvaluationData.questionnaires;
            if (questionnaireIds.length > 0) {
              // Get all questionnaire templates referenced in the evaluation
              const templates = await Promise.all(
                questionnaireIds.map(async (templateId: string) => {
                  return await storage.getQuestionnaireTemplate(templateId);
                })
              );
              // Filter out null results and return array of templates
              questionnaireTemplate = templates.filter(template => template !== null);
            }
          }
          
          // Fallback to reviewCycle approach if no questionnaires found
          if (!questionnaireTemplate && evaluation.reviewCycleId && !evaluation.reviewCycleId.startsWith('initiated-appraisal-')) {
            const reviewCycle = await storage.getReviewCycle(evaluation.reviewCycleId);
            if (reviewCycle?.questionnaireTemplateId) {
              questionnaireTemplate = await storage.getQuestionnaireTemplate(reviewCycle.questionnaireTemplateId);
            }
          }
          
          return {
            ...evaluation,
            employee: employee ? {
              id: employee.id,
              firstName: employee.firstName,
              lastName: employee.lastName,
              email: employee.email,
              department: employee.department,
              designation: employee.designation
            } : null,
            questionnaireTemplate
          };
        })
      );

      res.json(evaluationsWithQuestionnaires);
    } catch (error) {
      console.error("Error fetching manager submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions for review" });
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

  // Export evaluation to PDF/DOCX - secure server-side data fetching
  app.post('/api/evaluations/export', isAuthenticated, async (req: any, res) => {
    try {
      const { evaluationId, format } = req.body;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const evaluation = await storage.getEvaluation(evaluationId);
      if (!evaluation) {
        return res.status(404).json({ message: "Evaluation not found" });
      }

      // Check access permissions
      if (currentUser.role === 'employee' && evaluation.employeeId !== currentUser.id) {
        return res.status(403).json({ message: "Access denied: Can only export your own evaluation" });
      }

      if (currentUser.role === 'manager' && evaluation.managerId !== currentUser.id && evaluation.employeeId !== currentUser.id) {
        return res.status(403).json({ message: "Access denied: Can only export evaluations you manage or your own" });
      }

      // Get additional evaluation details from database (secure)
      const employee = await storage.getUser(evaluation.employeeId);
      const manager = await storage.getUser(evaluation.managerId);
      const reviewCycle = evaluation.reviewCycleId ? await storage.getReviewCycle(evaluation.reviewCycleId) : null;
      
      // Extract responses and calculate average from stored data
      const selfEvaluationData = evaluation.selfEvaluationData as any;
      const responses = selfEvaluationData?.responses || selfEvaluationData || {};
      const averageRating = selfEvaluationData?.averageRating || 0;
      
      // Get questionnaires associated with this evaluation from database
      let questionnaires: any[] = [];
      if (evaluation.initiatedAppraisalId) {
        const initiatedAppraisal = await storage.getInitiatedAppraisal(evaluation.initiatedAppraisalId);
        if (initiatedAppraisal && initiatedAppraisal.questionnaireTemplateIds) {
          questionnaires = await Promise.all(
            initiatedAppraisal.questionnaireTemplateIds.map(id => storage.getQuestionnaireTemplate(id))
          );
        }
      }

      if (format === 'pdf') {
        // Generate PDF using PDFKit
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument();
        
        // Set response headers for PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="evaluation-${evaluationId}.pdf"`);
        
        // Pipe the PDF to the response
        doc.pipe(res);
        
        // Add content to PDF
        doc.fontSize(20).text('Performance Evaluation Report', 50, 50);
        doc.fontSize(12).moveDown();
        
        // Employee information
        doc.text(`Employee: ${employee?.firstName} ${employee?.lastName}`, 50);
        doc.text(`Manager: ${manager?.firstName} ${manager?.lastName}`, 50);
        doc.text(`Review Cycle: ${reviewCycle?.name || 'N/A'}`, 50);
        doc.text(`Average Rating: ${averageRating?.toFixed(1) || 'N/A'}/5.0`, 50);
        doc.moveDown();
        
        // Questionnaires and responses
        if (questionnaires && questionnaires.length > 0) {
          questionnaires.forEach((questionnaire: any, qIndex: number) => {
            doc.fontSize(16).text(`${questionnaire.name}`, 50);
            doc.fontSize(10).text(`${questionnaire.description || ''}`, 50);
            doc.moveDown();
            
            if (questionnaire.questions) {
              questionnaire.questions.forEach((question: any, index: number) => {
                const questionKey = `${questionnaire.id}_${question.id || index}`;
                const response = responses?.find((r: any) => r.questionId === questionKey);
                
                doc.fontSize(12).text(`Q${index + 1}: ${question.text}`, 50);
                
                if (response) {
                  if (response.rating) {
                    doc.fontSize(10).text(`Rating: ${response.rating}/5`, 70);
                  }
                  if (response.response) {
                    doc.fontSize(10).text(`Response: ${response.response}`, 70);
                  }
                  if (response.remarks) {
                    doc.fontSize(10).text(`Remarks: ${response.remarks}`, 70);
                  }
                } else {
                  doc.fontSize(10).text('No response provided', 70);
                }
                doc.moveDown();
              });
            }
            doc.moveDown();
          });
        }
        
        // Finalize the PDF
        doc.end();
        
      } else if (format === 'docx') {
        // Generate DOCX using docxtemplater
        const PizZip = require('pizzip');
        const Docxtemplater = require('docxtemplater');
        const fs = require('fs');
        const path = require('path');
        
        // Create a simple DOCX template
        const templateContent = `
          Performance Evaluation Report
          
          Employee: ${employee?.firstName} ${employee?.lastName}
          Manager: ${manager?.firstName} ${manager?.lastName}
          Review Cycle: ${reviewCycle?.name || 'N/A'}
          Average Rating: ${averageRating?.toFixed(1) || 'N/A'}/5.0
          
          ${questionnaires?.map((questionnaire: any, qIndex: number) => `
            ${questionnaire.name}
            ${questionnaire.description || ''}
            
            ${questionnaire.questions?.map((question: any, index: number) => {
              const questionKey = `${questionnaire.id}_${question.id || index}`;
              const response = responses?.find((r: any) => r.questionId === questionKey);
              
              return `Q${index + 1}: ${question.text}
              ${response?.rating ? `Rating: ${response.rating}/5` : ''}
              ${response?.response ? `Response: ${response.response}` : 'No response provided'}
              ${response?.remarks ? `Remarks: ${response.remarks}` : ''}
              `;
            }).join('\n') || ''}
          `).join('\n') || ''}
        `;
        
        // Create a minimal DOCX structure
        const zip = new PizZip();
        
        // Add basic DOCX structure
        zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
          <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
            <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
            <Default Extension="xml" ContentType="application/xml"/>
            <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
          </Types>`);
          
        zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
          <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
            <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
          </Relationships>`);
          
        zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
          <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:body>
              <w:p><w:r><w:t>${templateContent.replace(/\n/g, '</w:t></w:r></w:p><w:p><w:r><w:t>')}</w:t></w:r></w:p>
            </w:body>
          </w:document>`);
        
        const buffer = zip.generate({ type: 'nodebuffer' });
        
        // Set response headers for DOCX
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="evaluation-${evaluationId}.docx"`);
        
        res.send(buffer);
        
      } else {
        return res.status(400).json({ message: "Invalid format. Supported formats: pdf, docx" });
      }
      
    } catch (error) {
      console.error("Error exporting evaluation:", error);
      res.status(500).json({ message: "Failed to export evaluation" });
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

  // Department management routes - Administrator and HR Manager access for filtering
  app.get('/api/departments', isAuthenticated, requireRoles(['admin', 'hr_manager']), async (req: any, res) => {
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
  app.get('/api/frequency-calendars', isAuthenticated, requireRoles(['admin', 'hr_manager']), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // HR managers can see all calendars, admins see only theirs
      // Use active role from session if available, otherwise fall back to database role
      const activeRole = req.user.activeRole || user.role;
      let calendars;
      if (activeRole === 'hr_manager') {
        calendars = await storage.getAllFrequencyCalendars();
      } else {
        calendars = await storage.getFrequencyCalendars(userId);
      }
      
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

  // New endpoint for HR managers to get frequency calendar details by calendar ID
  app.get('/api/frequency-calendars/:calendarId/details', isAuthenticated, requireRoles(['admin', 'hr_manager']), async (req: any, res) => {
    try {
      const { calendarId } = req.params;
      const details = await storage.getFrequencyCalendarDetailsByCalendarId(calendarId);
      res.json(details);
    } catch (error) {
      console.error("Error fetching frequency calendar details by calendar ID:", error);
      res.status(500).json({ message: "Failed to fetch frequency calendar details" });
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

  // Initiate Appraisal endpoint - HR Manager can initiate appraisals for groups
  app.post('/api/initiate-appraisal', isAuthenticated, requireRoles(['hr_manager']), async (req: any, res) => {
    try {
      const requestingUserId = req.user.claims.sub;
      
      // Handle form data if file upload is present
      let parsedData: any;
      let documentUrl: string | undefined;

      if (req.headers['content-type']?.includes('multipart/form-data')) {
        // Handle file upload (this would need multer middleware setup)
        // For now, we'll handle JSON data in the 'data' field
        parsedData = JSON.parse(req.body.data);
        // File handling would be implemented here with proper upload logic
        if (req.file) {
          // Upload file to object storage and get URL
          documentUrl = `/uploads/${req.file.filename}`;
        }
      } else {
        // Handle regular JSON data
        parsedData = req.body;
      }

      // Validate the appraisal initiation data
      const validatedData = {
        appraisalGroupId: parsedData.appraisalGroupId,
        appraisalType: parsedData.appraisalType,
        questionnaireTemplateIds: Array.isArray(parsedData.questionnaireTemplateIds) 
          ? parsedData.questionnaireTemplateIds 
          : [],
        documentUrl: documentUrl || parsedData.documentUrl || null,
        frequencyCalendarId: parsedData.frequencyCalendarId || null,
        calendarDetailTimings: parsedData.calendarDetailTimings || [], // Add calendar detail timings
        daysToInitiate: parsedData.daysToInitiate || 0,
        daysToClose: parsedData.daysToClose || 30,
        numberOfReminders: parsedData.numberOfReminders || 3,
        excludeTenureLessThanYear: parsedData.excludeTenureLessThanYear || false,
        excludedEmployeeIds: parsedData.excludedEmployeeIds || [],
        makePublic: parsedData.makePublic || false,
        publishType: parsedData.publishType || 'now',
        createdById: requestingUserId,
      };

      // Basic validation
      if (!validatedData.appraisalGroupId) {
        return res.status(400).json({ message: "Appraisal group ID is required" });
      }

      if (!validatedData.appraisalType) {
        return res.status(400).json({ message: "Appraisal type is required" });
      }

      // Type-specific validation
      if (validatedData.appraisalType === 'questionnaire_based' && (!validatedData.questionnaireTemplateIds || validatedData.questionnaireTemplateIds.length === 0)) {
        return res.status(400).json({ message: "At least one questionnaire template is required for questionnaire-based appraisals" });
      }

      if ((validatedData.appraisalType === 'kpi_based' || validatedData.appraisalType === 'mbo_based') && !validatedData.documentUrl) {
        return res.status(400).json({ message: "Document is required for KPI/MBO-based appraisals" });
      }

      // Create the initiated appraisal
      const initiatedAppraisal = await storage.createInitiatedAppraisal(validatedData, requestingUserId);
      
      let evaluationsCreated = 0;
      let emailsSent = 0;
      
      // If publish type is "now", automatically generate evaluations and send notifications
      if (validatedData.publishType === 'now') {
        try {
          // Get all members of the appraisal group
          const members = await storage.getAppraisalGroupMembers(validatedData.appraisalGroupId, requestingUserId);
          const activeMembers = members.filter(member => member.user && member.user.status === 'active');
          
          // Create evaluations for each active member
          for (const member of activeMembers) {
            const employee = member.user!;
            
            // Skip if employee is in excluded list
            if (validatedData.excludedEmployeeIds?.includes(employee.id)) {
              continue;
            }
            
            // Get the employee's manager
            let managerId = employee.reportingManagerId;
            if (!managerId) {
              // If no manager assigned, use the HR manager who created the appraisal
              managerId = requestingUserId;
            }
            
            // Create evaluation record with initiated appraisal link
            const evaluationData = {
              employeeId: employee.id,
              managerId: managerId,
              reviewCycleId: 'initiated-appraisal-' + initiatedAppraisal.id,
              initiatedAppraisalId: initiatedAppraisal.id,
              status: 'not_started' as const,
            };
            
            try {
              await storage.createEvaluation(evaluationData);
              evaluationsCreated++;
              console.log(`Created evaluation for employee ${employee.id} (${employee.email})`);
            } catch (evalError) {
              console.error(`Failed to create evaluation for employee ${employee.id} (${employee.email}):`, evalError);
            }
            
            // Send email notification to employee (if email service is configured)
            try {
              // TODO: Implement email notification logic here
              // await sendEvaluationNotificationEmail(employee.email, initiatedAppraisal);
              emailsSent++;
            } catch (emailError) {
              console.error(`Failed to send email to ${employee.email}:`, emailError);
            }
          }
          
          // Update appraisal status to 'active' since it's published now
          await storage.updateInitiatedAppraisalStatus(initiatedAppraisal.id, 'active');
          
        } catch (error) {
          console.error("Error generating evaluations or sending notifications:", error);
          // Don't fail the entire request, but log the error
        }
      }
      
      res.status(201).json({
        message: "Appraisal initiated successfully",
        appraisal: { ...initiatedAppraisal, status: validatedData.publishType === 'now' ? 'active' : 'draft' },
        evaluationsCreated,
        emailsSent
      });
      
    } catch (error) {
      console.error("Error initiating appraisal:", error);
      if (error.message?.includes('not found')) {
        return res.status(404).json({ message: "Appraisal group not found" });
      }
      if (error.message?.includes('access')) {
        return res.status(403).json({ message: "Access denied to this appraisal group" });
      }
      res.status(500).json({ message: "Failed to initiate appraisal" });
    }
  });

  // GET /api/initiated-appraisals - Get all initiated appraisals for HR manager
  app.get('/api/initiated-appraisals', isAuthenticated, requireRoles(['hr_manager']), async (req: any, res) => {
    try {
      const requestingUserId = req.user.claims.sub;
      const appraisals = await storage.getInitiatedAppraisals(requestingUserId);
      res.json(appraisals);
    } catch (error) {
      console.error('Error fetching initiated appraisals:', error);
      res.status(500).json({ message: "Internal server error" });
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

  // Generate evaluations for initiated appraisal
  app.post('/api/initiated-appraisals/:appraisalId/generate-evaluations', isAuthenticated, requireRoles(['hr_manager']), async (req: any, res) => {
    try {
      const { appraisalId } = req.params;
      const requestingUserId = req.user.claims.sub;
      
      // Verify initiated appraisal exists and belongs to the HR manager
      const userAppraisals = await storage.getInitiatedAppraisals(requestingUserId);
      const targetAppraisal = userAppraisals.find(appraisal => appraisal.id === appraisalId);
      
      if (!targetAppraisal) {
        return res.status(403).json({ message: "Initiated appraisal not found or access denied" });
      }

      // Get all members of the appraisal group
      const members = await storage.getAppraisalGroupMembers(targetAppraisal.appraisalGroupId);
      const activeMembers = members.filter(member => member.user && member.user.status === 'active');
      
      if (activeMembers.length === 0) {
        return res.status(400).json({ message: "No active members found in the appraisal group" });
      }

      const createdEvaluations = [];
      
      for (const member of activeMembers) {
        const employee = member.user!;
        
        // Check if evaluation already exists for this employee and initiated appraisal
        const existingEvaluations = await storage.getEvaluationsByInitiatedAppraisal(appraisalId);
        const existingEvaluation = existingEvaluations.find(evaluation => evaluation.employeeId === employee.id);
        
        if (existingEvaluation) {
          console.log(`Evaluation already exists for employee ${employee.id} in initiated appraisal ${appraisalId}, skipping`);
          continue;
        }
        
        // Get the employee's manager
        let managerId = employee.reportingManagerId;
        if (!managerId) {
          // If no manager assigned, use the HR manager who created the appraisal
          managerId = requestingUserId;
          console.warn(`No manager found for employee ${employee.id}, using HR manager as fallback`);
        }
        
        // Create evaluation record with initiated appraisal link
        const evaluationData = {
          employeeId: employee.id,
          managerId: managerId,
          reviewCycleId: 'initiated-appraisal-' + appraisalId, // Create a synthetic review cycle ID
          initiatedAppraisalId: appraisalId, // Link to the initiated appraisal
          status: 'not_started' as const,
        };
        
        const evaluation = await storage.createEvaluation(evaluationData);
        createdEvaluations.push(evaluation);
      }
      
      res.status(201).json({
        message: `Created ${createdEvaluations.length} evaluations for initiated appraisal`,
        evaluations: createdEvaluations,
        totalMembers: activeMembers.length,
        skipped: activeMembers.length - createdEvaluations.length
      });
    } catch (error) {
      console.error("Error generating evaluations for initiated appraisal:", error);
      res.status(500).json({ message: "Failed to generate evaluations" });
    }
  });

  // Send Reminder Email endpoint
  app.post('/api/send-reminder', isAuthenticated, requireRoles(['hr_manager']), async (req: any, res) => {
    try {
      const requestingUserId = req.user.claims.sub;
      
      // Validate request body with Zod schema
      const { employeeId, initiatedAppraisalId } = sendReminderRequestSchema.parse(req.body);

      // Get employee details
      const employee = await storage.getUser(employeeId, requestingUserId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Verify the initiated appraisal exists and belongs to the requesting HR manager
      const userAppraisals = await storage.getInitiatedAppraisals(requestingUserId);
      const targetAppraisal = userAppraisals.find(appraisal => appraisal.id === initiatedAppraisalId);
      
      if (!targetAppraisal) {
        return res.status(403).json({ message: "Initiated appraisal not found or access denied" });
      }

      // Verify the employee is part of this appraisal and needs a reminder
      const progress = targetAppraisal.progress;
      if (!progress || !progress.employeeProgress) {
        return res.status(400).json({ message: "No progress data available for this appraisal" });
      }

      const employeeProgress = progress.employeeProgress.find((ep: any) => ep.employee.id === employeeId);
      if (!employeeProgress) {
        return res.status(403).json({ message: "Employee is not part of this appraisal" });
      }

      if (employeeProgress.status === 'completed') {
        return res.status(400).json({ message: "Employee has already completed their evaluation" });
      }

      // Calculate due date (7 days from now as default)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);
      const formattedDueDate = dueDate.toLocaleDateString();

      // Send reminder email
      await sendReviewReminder(
        employee.email,
        `${employee.firstName} ${employee.lastName}`,
        formattedDueDate
      );

      res.json({ 
        message: "Reminder sent successfully",
        employeeName: `${employee.firstName} ${employee.lastName}`,
        employeeEmail: employee.email,
        dueDate: formattedDueDate
      });
    } catch (error) {
      console.error("Error sending reminder:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send reminder" });
    }
  });

  // Manager Workflow API Routes (moved above to avoid route conflicts)

  // Submit manager review with remarks and final rating
  app.put('/api/evaluations/:id/manager-review', isAuthenticated, requireRoles(['manager']), async (req: any, res) => {
    try {
      const evaluationId = req.params.id;
      const managerId = req.user.claims.sub;
      
      const { managerRemarks, finalRating, managerEvaluationData } = req.body;
      
      // Validate the evaluation belongs to this manager
      const evaluation = await storage.getEvaluation(evaluationId);
      if (!evaluation) {
        return res.status(404).json({ message: "Evaluation not found" });
      }
      if (evaluation.managerId !== managerId) {
        return res.status(403).json({ message: "Access denied: You can only review evaluations for your direct reports" });
      }
      if (!evaluation.selfEvaluationSubmittedAt) {
        return res.status(400).json({ message: "Cannot review: Employee hasn't submitted their evaluation yet" });
      }
      
      // Prepare manager evaluation data with remarks
      const completeManagerEvaluationData = {
        ...managerEvaluationData,
        managerRemarks: managerRemarks
      };
      
      // Update evaluation with manager review
      const updatedEvaluation = await storage.updateEvaluation(evaluationId, {
        managerEvaluationData: completeManagerEvaluationData,
        overallRating: finalRating,
        managerEvaluationSubmittedAt: new Date(),
        status: 'reviewed'
      });
      
      res.json({
        message: "Manager review submitted successfully",
        evaluation: updatedEvaluation
      });
    } catch (error) {
      console.error("Error submitting manager review:", error);
      res.status(500).json({ message: "Failed to submit manager review" });
    }
  });

  // Schedule one-on-one meeting and send calendar invite
  app.post('/api/evaluations/:id/schedule-meeting', isAuthenticated, requireRoles(['manager']), async (req: any, res) => {
    try {
      const evaluationId = req.params.id;
      const managerId = req.user.claims.sub;
      
      const { meetingDate, meetingTitle, meetingDescription } = req.body;
      
      if (!meetingDate) {
        return res.status(400).json({ message: "Meeting date is required" });
      }
      
      // Validate the evaluation belongs to this manager
      const evaluation = await storage.getEvaluation(evaluationId);
      if (!evaluation) {
        return res.status(404).json({ message: "Evaluation not found" });
      }
      if (evaluation.managerId !== managerId) {
        return res.status(403).json({ message: "Access denied: You can only schedule meetings for your direct reports" });
      }
      if (!evaluation.managerEvaluationSubmittedAt) {
        return res.status(400).json({ message: "Cannot schedule meeting: Complete your review first" });
      }

      // Get employee and manager details
      const employee = await storage.getUser(evaluation.employeeId);
      const manager = await storage.getUser(managerId);
      
      if (!employee || !manager) {
        return res.status(404).json({ message: "Employee or manager not found" });
      }

      // Update evaluation with meeting schedule
      const updatedEvaluation = await storage.updateEvaluation(evaluationId, {
        meetingScheduledAt: new Date(meetingDate)
      });

      // Send calendar invite
      const { sendMeetingInvite } = await import('./emailService');
      await sendMeetingInvite(
        employee.email,
        `${employee.firstName} ${employee.lastName}`,
        `${manager.firstName} ${manager.lastName}`,
        new Date(meetingDate),
        meetingTitle || 'Performance Review One-on-One Meeting',
        meetingDescription || 'Discussion about your performance review and career development.'
      );

      res.json({
        message: "Meeting scheduled successfully and calendar invite sent",
        evaluation: updatedEvaluation,
        meetingDetails: {
          date: meetingDate,
          title: meetingTitle || 'Performance Review One-on-One Meeting',
          attendees: [employee.email, manager.email]
        }
      });
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      res.status(500).json({ message: "Failed to schedule meeting" });
    }
  });

  // Add or update meeting notes
  app.put('/api/evaluations/:id/meeting-notes', isAuthenticated, requireRoles(['manager']), async (req: any, res) => {
    try {
      const evaluationId = req.params.id;
      const managerId = req.user.claims.sub;
      
      const { meetingNotes, finalRating } = req.body;
      
      if (!meetingNotes) {
        return res.status(400).json({ message: "Meeting notes are required" });
      }
      
      // Validate the evaluation belongs to this manager
      const evaluation = await storage.getEvaluation(evaluationId);
      if (!evaluation) {
        return res.status(404).json({ message: "Evaluation not found" });
      }
      if (evaluation.managerId !== managerId) {
        return res.status(403).json({ message: "Access denied: You can only add notes for your direct reports" });
      }
      if (!evaluation.meetingScheduledAt) {
        return res.status(400).json({ message: "Cannot add notes: Schedule a meeting first" });
      }

      // Update evaluation with meeting notes
      const updateData: any = {
        meetingNotes,
        meetingCompletedAt: new Date()
      };
      
      // Allow updating final rating if provided
      if (finalRating !== undefined) {
        updateData.overallRating = finalRating;
      }
      
      const updatedEvaluation = await storage.updateEvaluation(evaluationId, updateData);
      
      res.json({
        message: "Meeting notes saved successfully",
        evaluation: updatedEvaluation
      });
    } catch (error) {
      console.error("Error saving meeting notes:", error);
      res.status(500).json({ message: "Failed to save meeting notes" });
    }
  });

  // Mark evaluation as completed and send notifications
  app.post('/api/evaluations/:id/complete', isAuthenticated, requireRoles(['manager']), async (req: any, res) => {
    try {
      const evaluationId = req.params.id;
      const managerId = req.user.claims.sub;
      
      // Validate the evaluation belongs to this manager
      const evaluation = await storage.getEvaluation(evaluationId);
      if (!evaluation) {
        return res.status(404).json({ message: "Evaluation not found" });
      }
      if (evaluation.managerId !== managerId) {
        return res.status(403).json({ message: "Access denied: You can only complete evaluations for your direct reports" });
      }
      if (!evaluation.managerEvaluationSubmittedAt) {
        return res.status(400).json({ message: "Cannot complete: Submit your review first" });
      }
      if (evaluation.finalizedAt) {
        return res.status(400).json({ message: "Evaluation already completed" });
      }

      // Mark evaluation as completed
      const updatedEvaluation = await storage.updateEvaluation(evaluationId, {
        status: 'completed',
        finalizedAt: new Date()
      });

      // Get all parties for notification
      const employee = await storage.getUser(evaluation.employeeId);
      const manager = await storage.getUser(managerId);
      
      if (!employee || !manager) {
        return res.status(404).json({ message: "Employee or manager not found" });
      }

      // Find HR Manager(s) from the same company
      const allUsers = await storage.getUsers({ role: 'hr_manager' });
      const hrManagers = allUsers.filter(user => user.companyId === manager.companyId);
      
      // Send completion notifications
      const { sendEvaluationCompletionNotification } = await import('./emailService');
      
      // Notify employee (primary recipient)
      await sendEvaluationCompletionNotification(
        employee.email,
        `${employee.firstName} ${employee.lastName}`,
        `${manager.firstName} ${manager.lastName}`,
        updatedEvaluation,
        'employee'
      );

      // Notify manager (secondary recipient) 
      await sendEvaluationCompletionNotification(
        manager.email,
        `${manager.firstName} ${manager.lastName}`,
        `${employee.firstName} ${employee.lastName}`,
        updatedEvaluation,
        'manager'
      );

      // Notify HR Manager(s) (CC recipients)
      for (const hrManager of hrManagers) {
        if (hrManager.email) {
          await sendEvaluationCompletionNotification(
            hrManager.email,
            `${hrManager.firstName} ${hrManager.lastName}`,
            `${employee.firstName} ${employee.lastName}`,
            updatedEvaluation,
            'hr_manager'
          );
        }
      }

      res.json({
        message: "Evaluation completed successfully and notifications sent",
        evaluation: updatedEvaluation,
        notificationsSent: {
          employee: employee.email,
          manager: manager.email,
          hrManagers: hrManagers.map(hr => hr.email).filter(Boolean)
        }
      });
    } catch (error) {
      console.error("Error completing evaluation:", error);
      res.status(500).json({ message: "Failed to complete evaluation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
