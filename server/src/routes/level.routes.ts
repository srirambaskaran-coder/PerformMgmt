import { Router } from 'express';
import { LevelController } from '../controllers/level.controller';
import { isAuthenticated, requireRoles } from '../middleware/auth.middleware';

const router = Router();
const controller = new LevelController();

router.get('/', isAuthenticated, controller.getAllLevels);
router.get('/:id', isAuthenticated, controller.getLevelById);
router.post('/', requireRoles('admin', 'super_admin'), controller.createLevel);
router.put('/:id', requireRoles('admin', 'super_admin'), controller.updateLevel);
router.delete('/:id', requireRoles('admin', 'super_admin'), controller.deleteLevel);

export default router;
