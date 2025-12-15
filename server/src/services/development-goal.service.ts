import { storage } from '../lib/storage';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class DevelopmentGoalService {
  async getAllDevelopmentGoals(filters?: any) {
    try {
      return await storage.getAllDevelopmentGoals(filters);
    } catch (error) {
      logger.error('Failed to get development goals', { filters, error });
      throw new AppError('Failed to retrieve development goals', 500);
    }
  }

  async getDevelopmentGoalById(goalId: string) {
    try {
      const goal = await storage.getDevelopmentGoalById(goalId);
      if (!goal) {
        throw new AppError('Development goal not found', 404);
      }
      return goal;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to get development goal', { goalId, error });
      throw new AppError('Failed to retrieve development goal', 500);
    }
  }

  async createDevelopmentGoal(data: any) {
    try {
      return await storage.createDevelopmentGoal(data);
    } catch (error) {
      logger.error('Failed to create development goal', { data, error });
      throw new AppError('Failed to create development goal', 500);
    }
  }

  async updateDevelopmentGoal(goalId: string, data: any) {
    try {
      await this.getDevelopmentGoalById(goalId);
      return await storage.updateDevelopmentGoal(goalId, data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to update development goal', { goalId, data, error });
      throw new AppError('Failed to update development goal', 500);
    }
  }

  async deleteDevelopmentGoal(goalId: string) {
    try {
      await this.getDevelopmentGoalById(goalId);
      return await storage.deleteDevelopmentGoal(goalId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to delete development goal', { goalId, error });
      throw new AppError('Failed to delete development goal', 500);
    }
  }

  async submitDevelopmentGoal(goalId: string, data: any) {
    try {
      await this.getDevelopmentGoalById(goalId);
      return await storage.submitDevelopmentGoal(goalId, data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to submit development goal', { goalId, data, error });
      throw new AppError('Failed to submit development goal', 500);
    }
  }

  async approveDevelopmentGoal(goalId: string, data: any) {
    try {
      await this.getDevelopmentGoalById(goalId);
      return await storage.approveDevelopmentGoal(goalId, data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to approve development goal', { goalId, data, error });
      throw new AppError('Failed to approve development goal', 500);
    }
  }
}
