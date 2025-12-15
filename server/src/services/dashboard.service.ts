import { storage } from '../lib/storage';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class DashboardService {
  async getMetrics(userId: string) {
    try {
      return await storage.getDashboardMetrics(userId);
    } catch (error) {
      logger.error('Failed to get dashboard metrics', { userId, error });
      throw new AppError('Failed to retrieve dashboard metrics', 500);
    }
  }

  async getSuperAdminDashboard(companyId?: string) {
    try {
      return await storage.getSuperAdminDashboard(companyId);
    } catch (error) {
      logger.error('Failed to get super admin dashboard', { error });
      throw new AppError('Failed to retrieve dashboard data', 500);
    }
  }

  async getAdminDashboard(companyId: string) {
    try {
      return await storage.getAdminDashboard(companyId);
    } catch (error) {
      logger.error('Failed to get admin dashboard', { companyId, error });
      throw new AppError('Failed to retrieve dashboard data', 500);
    }
  }

  async getHRManagerDashboard(companyId: string) {
    try {
      return await storage.getHRManagerDashboard(companyId);
    } catch (error) {
      logger.error('Failed to get HR manager dashboard', { companyId, error });
      throw new AppError('Failed to retrieve dashboard data', 500);
    }
  }

  async getManagerDashboard(userId: string, companyId: string) {
    try {
      return await storage.getManagerDashboard(userId, companyId);
    } catch (error) {
      logger.error('Failed to get manager dashboard', { userId, error });
      throw new AppError('Failed to retrieve dashboard data', 500);
    }
  }

  async getEmployeeDashboard(userId: string) {
    try {
      return await storage.getEmployeeDashboard(userId);
    } catch (error) {
      logger.error('Failed to get employee dashboard', { userId, error });
      throw new AppError('Failed to retrieve dashboard data', 500);
    }
  }
}
