import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
// Import other route modules here as you create them

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Add other routes here:
// router.use('/companies', companyRoutes);
// router.use('/reviews', reviewRoutes);
// router.use('/evaluations', evaluationRoutes);
// etc.

export default router;
