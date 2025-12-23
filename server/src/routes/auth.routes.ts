import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { isAuthenticated } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { z } from 'zod';

const router = Router();
const authController = new AuthController();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Routes
router.post(
  '/login',
  validateBody(loginSchema),
  authController.login
);

router.post(
  '/refresh',
  validateBody(refreshTokenSchema),
  authController.refreshToken
);

router.post(
  '/logout',
  isAuthenticated,
  authController.logout
);

router.get(
  '/me',
  isAuthenticated,
  authController.getCurrentUser
);

router.get(
  '/check',
  authController.checkAuth
);

export default router;
