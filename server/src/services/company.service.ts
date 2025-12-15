import { storage } from '../lib/storage';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class CompanyService {
  async getAllCompanies(companyId?: string) {
    try {
      return await storage.getCompanies(companyId);
    } catch (error) {
      logger.error('Failed to get companies', { error });
      throw new AppError('Failed to retrieve companies', 500);
    }
  }

  async getCompanyById(id: string) {
    try {
      const company = await storage.getCompany(id);
      if (!company) {
        throw new AppError('Company not found', 404);
      }
      return company;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to get company', { id, error });
      throw new AppError('Failed to retrieve company', 500);
    }
  }

  async createCompany(companyData: any) {
    try {
      return await storage.createCompany(companyData);
    } catch (error) {
      logger.error('Failed to create company', { error });
      throw new AppError('Failed to create company', 500);
    }
  }

  async updateCompany(id: string, companyData: any) {
    try {
      return await storage.updateCompany(id, companyData);
    } catch (error) {
      logger.error('Failed to update company', { id, error });
      throw new AppError('Failed to update company', 500);
    }
  }

  async deleteCompany(id: string) {
    try {
      await storage.deleteCompany(id);
    } catch (error) {
      logger.error('Failed to delete company', { id, error });
      throw new AppError('Failed to delete company', 500);
    }
  }
}
