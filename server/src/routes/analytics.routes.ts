import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { requireRoles } from '../middleware/auth.middleware';

const router = Router();
const controller = new AnalyticsController();

router.get('/', requireRoles('admin', 'super_admin', 'hr_manager'), controller.getAnalytics);
router.get('/performance-distribution', requireRoles('admin', 'super_admin', 'hr_manager'), controller.getPerformanceDistribution);
router.get('/performance-trends', requireRoles('admin', 'super_admin', 'hr_manager'), controller.getPerformanceTrends);
router.get('/evaluation-trends', requireRoles('admin', 'super_admin', 'hr_manager'), controller.getEvaluationTrends);
router.get('/department', requireRoles('admin', 'super_admin', 'hr_manager'), controller.getDepartmentAnalytics);
router.get('/manager', requireRoles('manager', 'admin', 'super_admin', 'hr_manager'), controller.getManagerAnalytics);

export default router;
