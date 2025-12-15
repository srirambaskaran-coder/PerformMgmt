import { Request, Response } from 'express';
import { QuestionnaireService } from '../services/questionnaire.service';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export class QuestionnaireController {
  private questionnaireService: QuestionnaireService;

  constructor() {
    this.questionnaireService = new QuestionnaireService();
  }

  getAllQuestionnaires = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.query.companyId as string | undefined;
    const questionnaires = await this.questionnaireService.getAllQuestionnaires(companyId);
    return ApiResponse.success(res, questionnaires);
  });

  getQuestionnaireById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const questionnaire = await this.questionnaireService.getQuestionnaireById(id);
    return ApiResponse.success(res, questionnaire);
  });

  createQuestionnaire = asyncHandler(async (req: Request, res: Response) => {
    const questionnaire = await this.questionnaireService.createQuestionnaire(req.body);
    return ApiResponse.created(res, questionnaire, 'Questionnaire created successfully');
  });

  updateQuestionnaire = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const questionnaire = await this.questionnaireService.updateQuestionnaire(id, req.body);
    return ApiResponse.success(res, questionnaire, 'Questionnaire updated successfully');
  });

  deleteQuestionnaire = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.questionnaireService.deleteQuestionnaire(id);
    return ApiResponse.success(res, null, 'Questionnaire deleted successfully');
  });

  publishQuestionnaire = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.questionnaireService.publishQuestionnaire(req.body);
    return ApiResponse.created(res, result, 'Questionnaire published successfully');
  });

  getPublishedQuestionnaires = asyncHandler(async (req: Request, res: Response) => {
    const questionnaires = await this.questionnaireService.getPublishedQuestionnaires(req.query);
    return ApiResponse.success(res, questionnaires);
  });
}
