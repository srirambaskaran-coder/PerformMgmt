import { Router } from 'express';
import { DevelopmentGoalController } from '../controllers/development-goal.controller';
import { isAuthenticated, requireRoles } from '../middleware/auth.middleware';

const router = Router();
const controller = new DevelopmentGoalController();

router.get('/', isAuthenticated, controller.getAllDevelopmentGoals);
router.get('/:id', isAuthenticated, controller.getDevelopmentGoalById);
router.post('/', isAuthenticated, controller.createDevelopmentGoal);
router.put('/:id', isAuthenticated, controller.updateDevelopmentGoal);
router.post('/:id/submit', isAuthenticated, controller.submitDevelopmentGoal);
router.post('/:id/approve', requireRoles('manager', 'admin', 'super_admin', 'hr_manager'), controller.approveDevelopmentGoal);
router.delete('/:id', requireRoles('admin', 'super_admin'), controller.deleteDevelopmentGoal);

export default router;
