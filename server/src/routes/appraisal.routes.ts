import { Router } from 'express';
import { AppraisalController } from '../controllers/appraisal.controller';
import { isAuthenticated, requireRoles } from '../middleware/auth.middleware';

const router = Router();
const controller = new AppraisalController();

// Appraisals
router.get('/', isAuthenticated, controller.getAllAppraisals);
router.get('/:id', isAuthenticated, controller.getAppraisalById);
router.post('/', requireRoles('manager', 'admin', 'super_admin', 'hr_manager'), controller.createAppraisal);
router.put('/:id', isAuthenticated, controller.updateAppraisal);
router.delete('/:id', requireRoles('admin', 'super_admin'), controller.deleteAppraisal);

// Appraisal Cycles
router.get('/cycles/all', isAuthenticated, controller.getAppraisalCycles);
router.post('/cycles', requireRoles('admin', 'super_admin', 'hr_manager'), controller.createAppraisalCycle);

// Appraisal Groups
router.get('/groups/all', isAuthenticated, controller.getAppraisalGroups);
router.post('/groups', requireRoles('admin', 'super_admin', 'hr_manager'), controller.createAppraisalGroup);

export default router;
