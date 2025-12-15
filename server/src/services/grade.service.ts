import { storage } from '../lib/storage';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class GradeService {
  async getAllGrades(companyId?: string) {
    try {
      return await storage.getAllGrades(companyId);
    } catch (error) {
      logger.error('Failed to get grades', { companyId, error });
      throw new AppError('Failed to retrieve grades', 500);
    }
  }

  async getGradeById(gradeId: string) {
    try {
      const grade = await storage.getGradeById(gradeId);
      if (!grade) {
        throw new AppError('Grade not found', 404);
      }
      return grade;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to get grade', { gradeId, error });
      throw new AppError('Failed to retrieve grade', 500);
    }
  }

  async createGrade(data: any) {
    try {
      return await storage.createGrade(data);
    } catch (error) {
      logger.error('Failed to create grade', { data, error });
      throw new AppError('Failed to create grade', 500);
    }
  }

  async updateGrade(gradeId: string, data: any) {
    try {
      await this.getGradeById(gradeId);
      return await storage.updateGrade(gradeId, data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to update grade', { gradeId, data, error });
      throw new AppError('Failed to update grade', 500);
    }
  }

  async deleteGrade(gradeId: string) {
    try {
      await this.getGradeById(gradeId);
      return await storage.deleteGrade(gradeId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to delete grade', { gradeId, error });
      throw new AppError('Failed to delete grade', 500);
    }
  }
}
