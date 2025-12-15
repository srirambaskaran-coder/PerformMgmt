import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { isAuthenticated, requireRoles } from '../middleware/auth.middleware';

const router = Router();
const controller = new SettingsController();

// Password
router.post('/password/change', isAuthenticated, controller.changePassword);

// Company Settings
router.get('/company/:companyId', requireRoles('admin', 'super_admin'), controller.getCompanySettings);
router.put('/company/:companyId', requireRoles('admin', 'super_admin'), controller.updateCompanySettings);

// User Preferences
router.get('/preferences', isAuthenticated, controller.getUserPreferences);
router.put('/preferences', isAuthenticated, controller.updateUserPreferences);

// Review Frequencies
router.get('/review-frequencies', isAuthenticated, controller.getReviewFrequencies);
router.post('/review-frequencies', requireRoles('admin', 'super_admin', 'hr_manager'), controller.createReviewFrequency);

// Frequency Calendars
router.get('/frequency-calendars', isAuthenticated, controller.getFrequencyCalendars);
router.post('/frequency-calendars', requireRoles('admin', 'super_admin', 'hr_manager'), controller.createFrequencyCalendar);

export default router;
