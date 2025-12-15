import { storage } from '../lib/storage';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class AnalyticsService {
  async getAnalytics(companyId: string, filters?: any) {
    try {
      return await storage.getAnalytics(companyId, filters);
    } catch (error) {
      logger.error('Failed to get analytics', { companyId, filters, error });
      throw new AppError('Failed to retrieve analytics', 500);
    }
  }

  async getPerformanceDistribution(companyId: string, cycleId?: string) {
    try {
      return await storage.getPerformanceDistribution(companyId, cycleId);
    } catch (error) {
      logger.error('Failed to get performance distribution', { companyId, cycleId, error });
      throw new AppError('Failed to retrieve performance distribution', 500);
    }
  }

  async getEvaluationTrends(companyId: string, filters?: any) {
    try {
      return await storage.getEvaluationTrends(companyId, filters);
    } catch (error) {
      logger.error('Failed to get evaluation trends', { companyId, filters, error });
      throw new AppError('Failed to retrieve evaluation trends', 500);
    }
  }

  async getDepartmentAnalytics(companyId: string, departmentId?: string) {
    try {
      return await storage.getDepartmentAnalytics(companyId, departmentId);
    } catch (error) {
      logger.error('Failed to get department analytics', { companyId, departmentId, error });
      throw new AppError('Failed to retrieve department analytics', 500);
    }
  }

  async getManagerAnalytics(managerId: string) {
    try {
      return await storage.getManagerAnalytics(managerId);
    } catch (error) {
      logger.error('Failed to get manager analytics', { managerId, error });
      throw new AppError('Failed to retrieve manager analytics', 500);
    }
  }
}
