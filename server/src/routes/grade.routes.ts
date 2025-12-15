import { Router } from 'express';
import { GradeController } from '../controllers/grade.controller';
import { isAuthenticated, requireRoles } from '../middleware/auth.middleware';

const router = Router();
const controller = new GradeController();

router.get('/', isAuthenticated, controller.getAllGrades);
router.get('/:id', isAuthenticated, controller.getGradeById);
router.post('/', requireRoles('admin', 'super_admin'), controller.createGrade);
router.put('/:id', requireRoles('admin', 'super_admin'), controller.updateGrade);
router.delete('/:id', requireRoles('admin', 'super_admin'), controller.deleteGrade);

export default router;
