import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { isAuthenticated, requireRoles } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { insertUserSchema, updateUserSchema } from '@shared/schema';

const router = Router();
const userController = new UserController();

// All user routes require authentication
router.use(isAuthenticated);

// Routes
router.get(
  '/',
  requireRoles('super_admin', 'admin', 'hr_manager'),
  userController.getAllUsers
);

router.get(
  '/:id',
  userController.getUserById
);

router.post(
  '/',
  requireRoles('super_admin', 'admin', 'hr_manager'),
  validateBody(insertUserSchema),
  userController.createUser
);

router.put(
  '/:id',
  requireRoles('super_admin', 'admin', 'hr_manager'),
  validateBody(updateUserSchema),
  userController.updateUser
);

router.delete(
  '/:id',
  requireRoles('super_admin', 'admin'),
  userController.deleteUser
);

export default router;
