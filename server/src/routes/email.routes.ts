import { Router } from 'express';
import { EmailController } from '../controllers/email.controller';
import { isAuthenticated, requireRoles } from '../middleware/auth.middleware';

const router = Router();
const controller = new EmailController();

router.post('/send', requireRoles('admin', 'super_admin', 'hr_manager'), controller.sendEmail);

// Email Templates
router.get('/templates', requireRoles('admin', 'super_admin', 'hr_manager'), controller.getEmailTemplates);
router.get('/templates/:id', requireRoles('admin', 'super_admin', 'hr_manager'), controller.getEmailTemplateById);
router.post('/templates', requireRoles('admin', 'super_admin'), controller.createEmailTemplate);
router.put('/templates/:id', requireRoles('admin', 'super_admin'), controller.updateEmailTemplate);
router.delete('/templates/:id', requireRoles('admin', 'super_admin'), controller.deleteEmailTemplate);

// Email Configuration
router.get('/config', requireRoles('admin', 'super_admin'), controller.getEmailConfig);
router.put('/config', requireRoles('admin', 'super_admin'), controller.updateEmailConfig);

export default router;
