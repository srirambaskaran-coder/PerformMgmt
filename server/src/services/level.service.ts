import { storage } from '../lib/storage';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class LevelService {
  async getAllLevels(companyId?: string) {
    try {
      return await storage.getAllLevels(companyId);
    } catch (error) {
      logger.error('Failed to get levels', { companyId, error });
      throw new AppError('Failed to retrieve levels', 500);
    }
  }

  async getLevelById(levelId: string) {
    try {
      const level = await storage.getLevelById(levelId);
      if (!level) {
        throw new AppError('Level not found', 404);
      }
      return level;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to get level', { levelId, error });
      throw new AppError('Failed to retrieve level', 500);
    }
  }

  async createLevel(data: any) {
    try {
      return await storage.createLevel(data);
    } catch (error) {
      logger.error('Failed to create level', { data, error });
      throw new AppError('Failed to create level', 500);
    }
  }

  async updateLevel(levelId: string, data: any) {
    try {
      await this.getLevelById(levelId);
      return await storage.updateLevel(levelId, data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to update level', { levelId, data, error });
      throw new AppError('Failed to update level', 500);
    }
  }

  async deleteLevel(levelId: string) {
    try {
      await this.getLevelById(levelId);
      return await storage.deleteLevel(levelId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to delete level', { levelId, error });
      throw new AppError('Failed to delete level', 500);
    }
  }
}
