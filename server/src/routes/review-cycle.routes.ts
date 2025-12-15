import { Router } from 'express';
import { ReviewCycleController } from '../controllers/review-cycle.controller';
import { isAuthenticated, requireRoles } from '../middleware/auth.middleware';

const router = Router();
const controller = new ReviewCycleController();

router.get('/', isAuthenticated, controller.getAllReviewCycles);
router.get('/:id', isAuthenticated, controller.getReviewCycleById);
router.post('/', requireRoles('admin', 'super_admin', 'hr_manager'), controller.createReviewCycle);
router.put('/:id', requireRoles('admin', 'super_admin', 'hr_manager'), controller.updateReviewCycle);
router.delete('/:id', requireRoles('admin', 'super_admin'), controller.deleteReviewCycle);

export default router;
