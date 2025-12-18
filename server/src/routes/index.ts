import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import companyRoutes from './company.routes';
import dashboardRoutes from './dashboard.routes';
import locationRoutes from './location.routes';
import departmentRoutes from './department.routes';
import levelRoutes from './level.routes';
import gradeRoutes from './grade.routes';
import reviewCycleRoutes from './review-cycle.routes';
import evaluationRoutes from './evaluation.routes';
import questionnaireRoutes from './questionnaire.routes';
import appraisalRoutes from './appraisal.routes';
import developmentGoalRoutes from './development-goal.routes';
import analyticsRoutes from './analytics.routes';
import emailRoutes from './email.routes';
import settingsRoutes from './settings.routes';
import feedbackRequestRoutes from './feedback-request.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/companies', companyRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/locations', locationRoutes);
router.use('/departments', departmentRoutes);
router.use('/levels', levelRoutes);
router.use('/grades', gradeRoutes);
router.use('/review-cycles', reviewCycleRoutes);
router.use('/evaluations', evaluationRoutes);
router.use('/questionnaires', questionnaireRoutes);
router.use('/appraisals', appraisalRoutes);
router.use('/development-goals', developmentGoalRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/email', emailRoutes);
router.use('/settings', settingsRoutes);
router.use('/feedback-requests', feedbackRequestRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

export default router;
