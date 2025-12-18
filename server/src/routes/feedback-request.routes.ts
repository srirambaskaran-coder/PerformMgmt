import { Router } from 'express';
import { FeedbackRequestController } from '../controllers/feedback-request.controller';
import { isAuthenticated, requireRoles } from '../middleware/auth.middleware';

const router = Router();
const controller = new FeedbackRequestController();

// Get feedback requests for the current employee (as reviewer)
router.get('/', isAuthenticated, controller.getMyFeedbackRequests);

// Get available peer employees for 360 feedback selection (managers only)
// IMPORTANT: This route must be defined BEFORE /:id to avoid route conflicts
router.get('/peer-employees', isAuthenticated, requireRoles('manager'), controller.getPeerEmployees);

// Get feedback requests for a specific subject (team member) - managers only
// IMPORTANT: This route must be defined BEFORE /:id to avoid route conflicts
router.get('/subject/:subjectId', isAuthenticated, requireRoles('manager'), controller.getSubjectFeedbackRequests);

// Create feedback requests for team member (360 degree feedback) - managers only
router.post('/create-for-team-member', isAuthenticated, requireRoles('manager'), controller.createForTeamMember);

// Get a specific feedback request by ID
router.get('/:id', isAuthenticated, controller.getFeedbackRequestById);

// Submit feedback for a request
router.post('/:id/submit', isAuthenticated, controller.submitFeedback);

// Download feedback as PDF - managers only
router.get('/:id/pdf', isAuthenticated, requireRoles('manager'), controller.downloadPdf);

export default router;
