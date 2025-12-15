import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { isAuthenticated, requireRoles } from '../middleware/auth.middleware';

const router = Router();
const controller = new DashboardController();

// Legacy metrics endpoint
router.get('/metrics', isAuthenticated, controller.getMetrics);

// Role-specific dashboards
router.get('/super-admin', requireRoles('super_admin'), controller.getSuperAdminDashboard);
router.get('/admin', requireRoles('admin'), controller.getAdminDashboard);
router.get('/hr-manager', requireRoles('hr_manager'), controller.getHRManagerDashboard);
router.get('/manager', requireRoles('manager'), controller.getManagerDashboard);
router.get('/employee', requireRoles('employee'), controller.getEmployeeDashboard);

export default router;
