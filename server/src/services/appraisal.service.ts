import { storage } from '../lib/storage';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class AppraisalService {
  async getAllAppraisals(filters?: any) {
    try {
      return await storage.getAllAppraisals(filters);
    } catch (error) {
      logger.error('Failed to get appraisals', { filters, error });
      throw new AppError('Failed to retrieve appraisals', 500);
    }
  }

  async getAppraisalById(appraisalId: string) {
    try {
      const appraisal = await storage.getAppraisalById(appraisalId);
      if (!appraisal) {
        throw new AppError('Appraisal not found', 404);
      }
      return appraisal;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to get appraisal', { appraisalId, error });
      throw new AppError('Failed to retrieve appraisal', 500);
    }
  }

  async createAppraisal(data: any) {
    try {
      return await storage.createAppraisal(data);
    } catch (error) {
      logger.error('Failed to create appraisal', { data, error });
      throw new AppError('Failed to create appraisal', 500);
    }
  }

  async updateAppraisal(appraisalId: string, data: any) {
    try {
      await this.getAppraisalById(appraisalId);
      return await storage.updateAppraisal(appraisalId, data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to update appraisal', { appraisalId, data, error });
      throw new AppError('Failed to update appraisal', 500);
    }
  }

  async deleteAppraisal(appraisalId: string) {
    try {
      await this.getAppraisalById(appraisalId);
      return await storage.deleteAppraisal(appraisalId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to delete appraisal', { appraisalId, error });
      throw new AppError('Failed to delete appraisal', 500);
    }
  }

  async getAppraisalCycles(companyId?: string) {
    try {
      return await storage.getAppraisalCycles(companyId);
    } catch (error) {
      logger.error('Failed to get appraisal cycles', { companyId, error });
      throw new AppError('Failed to retrieve appraisal cycles', 500);
    }
  }

  async createAppraisalCycle(data: any) {
    try {
      return await storage.createAppraisalCycle(data);
    } catch (error) {
      logger.error('Failed to create appraisal cycle', { data, error });
      throw new AppError('Failed to create appraisal cycle', 500);
    }
  }

  async getAppraisalGroups(companyId?: string) {
    try {
      return await storage.getAppraisalGroups(companyId);
    } catch (error) {
      logger.error('Failed to get appraisal groups', { companyId, error });
      throw new AppError('Failed to retrieve appraisal groups', 500);
    }
  }

  async createAppraisalGroup(data: any) {
    try {
      return await storage.createAppraisalGroup(data);
    } catch (error) {
      logger.error('Failed to create appraisal group', { data, error });
      throw new AppError('Failed to create appraisal group', 500);
    }
  }
}
