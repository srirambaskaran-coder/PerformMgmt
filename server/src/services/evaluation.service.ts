import { storage } from '../lib/storage';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class EvaluationService {
  async getAllEvaluations(filters?: any) {
    try {
      return await storage.getAllEvaluations(filters);
    } catch (error) {
      logger.error('Failed to get evaluations', { filters, error });
      throw new AppError('Failed to retrieve evaluations', 500);
    }
  }

  async getEvaluationById(evaluationId: string) {
    try {
      const evaluation = await storage.getEvaluationById(evaluationId);
      if (!evaluation) {
        throw new AppError('Evaluation not found', 404);
      }
      return evaluation;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to get evaluation', { evaluationId, error });
      throw new AppError('Failed to retrieve evaluation', 500);
    }
  }

  async createEvaluation(data: any) {
    try {
      return await storage.createEvaluation(data);
    } catch (error) {
      logger.error('Failed to create evaluation', { data, error });
      throw new AppError('Failed to create evaluation', 500);
    }
  }

  async updateEvaluation(evaluationId: string, data: any) {
    try {
      await this.getEvaluationById(evaluationId);
      return await storage.updateEvaluation(evaluationId, data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to update evaluation', { evaluationId, data, error });
      throw new AppError('Failed to update evaluation', 500);
    }
  }

  async deleteEvaluation(evaluationId: string) {
    try {
      await this.getEvaluationById(evaluationId);
      return await storage.deleteEvaluation(evaluationId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to delete evaluation', { evaluationId, error });
      throw new AppError('Failed to delete evaluation', 500);
    }
  }

  async submitEvaluation(evaluationId: string, data: any) {
    try {
      await this.getEvaluationById(evaluationId);
      return await storage.submitEvaluation(evaluationId, data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to submit evaluation', { evaluationId, data, error });
      throw new AppError('Failed to submit evaluation', 500);
    }
  }

  async getCalibrationData(companyId: string, cycleId: string) {
    try {
      return await storage.getCalibrationData(companyId, cycleId);
    } catch (error) {
      logger.error('Failed to get calibration data', { companyId, cycleId, error });
      throw new AppError('Failed to retrieve calibration data', 500);
    }
  }

  async updateCalibration(data: any) {
    try {
      return await storage.updateCalibration(data);
    } catch (error) {
      logger.error('Failed to update calibration', { data, error });
      throw new AppError('Failed to update calibration', 500);
    }
  }
}
