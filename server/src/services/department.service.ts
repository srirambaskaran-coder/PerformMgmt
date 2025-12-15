import { storage } from '../lib/storage';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class DepartmentService {
  async getAllDepartments(companyId?: string) {
    try {
      return await storage.getAllDepartments(companyId);
    } catch (error) {
      logger.error('Failed to get departments', { companyId, error });
      throw new AppError('Failed to retrieve departments', 500);
    }
  }

  async getDepartmentById(departmentId: string) {
    try {
      const department = await storage.getDepartmentById(departmentId);
      if (!department) {
        throw new AppError('Department not found', 404);
      }
      return department;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to get department', { departmentId, error });
      throw new AppError('Failed to retrieve department', 500);
    }
  }

  async createDepartment(data: any) {
    try {
      return await storage.createDepartment(data);
    } catch (error) {
      logger.error('Failed to create department', { data, error });
      throw new AppError('Failed to create department', 500);
    }
  }

  async updateDepartment(departmentId: string, data: any) {
    try {
      await this.getDepartmentById(departmentId);
      return await storage.updateDepartment(departmentId, data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to update department', { departmentId, data, error });
      throw new AppError('Failed to update department', 500);
    }
  }

  async deleteDepartment(departmentId: string) {
    try {
      await this.getDepartmentById(departmentId);
      return await storage.deleteDepartment(departmentId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to delete department', { departmentId, error });
      throw new AppError('Failed to delete department', 500);
    }
  }
}
