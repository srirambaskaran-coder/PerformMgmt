import { storage } from '../lib/storage';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class ReviewCycleService {
  async getAllReviewCycles(companyId?: string) {
    try {
      return await storage.getAllReviewCycles(companyId);
    } catch (error) {
      logger.error('Failed to get review cycles', { companyId, error });
      throw new AppError('Failed to retrieve review cycles', 500);
    }
  }

  async getReviewCycleById(cycleId: string) {
    try {
      const cycle = await storage.getReviewCycleById(cycleId);
      if (!cycle) {
        throw new AppError('Review cycle not found', 404);
      }
      return cycle;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to get review cycle', { cycleId, error });
      throw new AppError('Failed to retrieve review cycle', 500);
    }
  }

  async createReviewCycle(data: any) {
    try {
      return await storage.createReviewCycle(data);
    } catch (error) {
      logger.error('Failed to create review cycle', { data, error });
      throw new AppError('Failed to create review cycle', 500);
    }
  }

  async updateReviewCycle(cycleId: string, data: any) {
    try {
      await this.getReviewCycleById(cycleId);
      return await storage.updateReviewCycle(cycleId, data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to update review cycle', { cycleId, data, error });
      throw new AppError('Failed to update review cycle', 500);
    }
  }

  async deleteReviewCycle(cycleId: string) {
    try {
      await this.getReviewCycleById(cycleId);
      return await storage.deleteReviewCycle(cycleId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to delete review cycle', { cycleId, error });
      throw new AppError('Failed to delete review cycle', 500);
    }
  }
}
