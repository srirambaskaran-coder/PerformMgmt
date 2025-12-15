import { Router } from 'express';
import { EvaluationController } from '../controllers/evaluation.controller';
import { isAuthenticated, requireRoles } from '../middleware/auth.middleware';

const router = Router();
const controller = new EvaluationController();

router.get('/', isAuthenticated, controller.getAllEvaluations);
router.get('/calibration', requireRoles('admin', 'super_admin', 'hr_manager'), controller.getCalibrationData);
router.get('/:id', isAuthenticated, controller.getEvaluationById);
router.post('/', requireRoles('manager', 'admin', 'super_admin', 'hr_manager'), controller.createEvaluation);
router.put('/calibration', requireRoles('admin', 'super_admin', 'hr_manager'), controller.updateCalibration);
router.put('/:id', isAuthenticated, controller.updateEvaluation);
router.post('/:id/submit', isAuthenticated, controller.submitEvaluation);
router.delete('/:id', requireRoles('admin', 'super_admin'), controller.deleteEvaluation);

export default router;
