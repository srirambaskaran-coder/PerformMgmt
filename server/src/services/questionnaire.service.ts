import { storage } from '../lib/storage';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class QuestionnaireService {
  async getAllQuestionnaires(companyId?: string) {
    try {
      return await storage.getAllQuestionnaires(companyId);
    } catch (error) {
      logger.error('Failed to get questionnaires', { companyId, error });
      throw new AppError('Failed to retrieve questionnaires', 500);
    }
  }

  async getQuestionnaireById(questionnaireId: string) {
    try {
      const questionnaire = await storage.getQuestionnaireById(questionnaireId);
      if (!questionnaire) {
        throw new AppError('Questionnaire not found', 404);
      }
      return questionnaire;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to get questionnaire', { questionnaireId, error });
      throw new AppError('Failed to retrieve questionnaire', 500);
    }
  }

  async createQuestionnaire(data: any) {
    try {
      return await storage.createQuestionnaire(data);
    } catch (error) {
      logger.error('Failed to create questionnaire', { data, error });
      throw new AppError('Failed to create questionnaire', 500);
    }
  }

  async updateQuestionnaire(questionnaireId: string, data: any) {
    try {
      await this.getQuestionnaireById(questionnaireId);
      return await storage.updateQuestionnaire(questionnaireId, data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to update questionnaire', { questionnaireId, data, error });
      throw new AppError('Failed to update questionnaire', 500);
    }
  }

  async deleteQuestionnaire(questionnaireId: string) {
    try {
      await this.getQuestionnaireById(questionnaireId);
      return await storage.deleteQuestionnaire(questionnaireId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to delete questionnaire', { questionnaireId, error });
      throw new AppError('Failed to delete questionnaire', 500);
    }
  }

  async publishQuestionnaire(data: any) {
    try {
      return await storage.publishQuestionnaire(data);
    } catch (error) {
      logger.error('Failed to publish questionnaire', { data, error });
      throw new AppError('Failed to publish questionnaire', 500);
    }
  }

  async getPublishedQuestionnaires(filters?: any) {
    try {
      return await storage.getPublishedQuestionnaires(filters);
    } catch (error) {
      logger.error('Failed to get published questionnaires', { filters, error });
      throw new AppError('Failed to retrieve published questionnaires', 500);
    }
  }
}
