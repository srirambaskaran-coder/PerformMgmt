import { emailService } from '../lib/emailService';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import { storage } from '../lib/storage';

export class EmailService {
  async sendEmail(to: string, subject: string, body: string) {
    try {
      return await emailService.sendEmail(to, subject, body);
    } catch (error) {
      logger.error('Failed to send email', { to, subject, error });
      throw new AppError('Failed to send email', 500);
    }
  }

  async getEmailTemplates(companyId?: string) {
    try {
      return await storage.getEmailTemplates(companyId);
    } catch (error) {
      logger.error('Failed to get email templates', { companyId, error });
      throw new AppError('Failed to retrieve email templates', 500);
    }
  }

  async getEmailTemplateById(templateId: string) {
    try {
      const template = await storage.getEmailTemplateById(templateId);
      if (!template) {
        throw new AppError('Email template not found', 404);
      }
      return template;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to get email template', { templateId, error });
      throw new AppError('Failed to retrieve email template', 500);
    }
  }

  async createEmailTemplate(data: any) {
    try {
      return await storage.createEmailTemplate(data);
    } catch (error) {
      logger.error('Failed to create email template', { data, error });
      throw new AppError('Failed to create email template', 500);
    }
  }

  async updateEmailTemplate(templateId: string, data: any) {
    try {
      await this.getEmailTemplateById(templateId);
      return await storage.updateEmailTemplate(templateId, data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to update email template', { templateId, data, error });
      throw new AppError('Failed to update email template', 500);
    }
  }

  async deleteEmailTemplate(templateId: string) {
    try {
      await this.getEmailTemplateById(templateId);
      return await storage.deleteEmailTemplate(templateId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to delete email template', { templateId, error });
      throw new AppError('Failed to delete email template', 500);
    }
  }

  async getEmailConfig(companyId?: string) {
    try {
      return await storage.getEmailConfig(companyId);
    } catch (error) {
      logger.error('Failed to get email config', { companyId, error });
      throw new AppError('Failed to retrieve email configuration', 500);
    }
  }

  async updateEmailConfig(data: any) {
    try {
      return await storage.updateEmailConfig(data);
    } catch (error) {
      logger.error('Failed to update email config', { data, error });
      throw new AppError('Failed to update email configuration', 500);
    }
  }
}
