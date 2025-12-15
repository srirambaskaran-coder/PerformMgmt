import { storage } from '../lib/storage';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';

export class SettingsService {
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw new AppError('Current password is incorrect', 401);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      return await storage.updateUserPassword(userId, hashedPassword);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to change password', { userId, error });
      throw new AppError('Failed to change password', 500);
    }
  }

  async getCompanySettings(companyId: string) {
    try {
      return await storage.getCompanySettings(companyId);
    } catch (error) {
      logger.error('Failed to get company settings', { companyId, error });
      throw new AppError('Failed to retrieve company settings', 500);
    }
  }

  async updateCompanySettings(companyId: string, data: any) {
    try {
      return await storage.updateCompanySettings(companyId, data);
    } catch (error) {
      logger.error('Failed to update company settings', { companyId, data, error });
      throw new AppError('Failed to update company settings', 500);
    }
  }

  async getUserPreferences(userId: string) {
    try {
      return await storage.getUserPreferences(userId);
    } catch (error) {
      logger.error('Failed to get user preferences', { userId, error });
      throw new AppError('Failed to retrieve user preferences', 500);
    }
  }

  async updateUserPreferences(userId: string, data: any) {
    try {
      return await storage.updateUserPreferences(userId, data);
    } catch (error) {
      logger.error('Failed to update user preferences', { userId, data, error });
      throw new AppError('Failed to update user preferences', 500);
    }
  }

  async getReviewFrequencies(companyId?: string) {
    try {
      return await storage.getReviewFrequencies(companyId);
    } catch (error) {
      logger.error('Failed to get review frequencies', { companyId, error });
      throw new AppError('Failed to retrieve review frequencies', 500);
    }
  }

  async createReviewFrequency(data: any) {
    try {
      return await storage.createReviewFrequency(data);
    } catch (error) {
      logger.error('Failed to create review frequency', { data, error });
      throw new AppError('Failed to create review frequency', 500);
    }
  }

  async getFrequencyCalendars(companyId?: string) {
    try {
      return await storage.getFrequencyCalendars(companyId);
    } catch (error) {
      logger.error('Failed to get frequency calendars', { companyId, error });
      throw new AppError('Failed to retrieve frequency calendars', 500);
    }
  }

  async createFrequencyCalendar(data: any) {
    try {
      return await storage.createFrequencyCalendar(data);
    } catch (error) {
      logger.error('Failed to create frequency calendar', { data, error });
      throw new AppError('Failed to create frequency calendar', 500);
    }
  }
}
