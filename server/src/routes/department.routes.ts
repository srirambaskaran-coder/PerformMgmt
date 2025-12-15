import { Router } from 'express';
import { DepartmentController } from '../controllers/department.controller';
import { isAuthenticated, requireRoles } from '../middleware/auth.middleware';

const router = Router();
const controller = new DepartmentController();

router.get('/', isAuthenticated, controller.getAllDepartments);
router.get('/:id', isAuthenticated, controller.getDepartmentById);
router.post('/', requireRoles('admin', 'super_admin'), controller.createDepartment);
router.put('/:id', requireRoles('admin', 'super_admin'), controller.updateDepartment);
router.delete('/:id', requireRoles('admin', 'super_admin'), controller.deleteDepartment);

export default router;
