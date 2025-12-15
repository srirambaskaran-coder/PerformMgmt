import { Request, Response } from 'express';
import { EvaluationService } from '../services/evaluation.service';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export class EvaluationController {
  private evaluationService: EvaluationService;

  constructor() {
    this.evaluationService = new EvaluationService();
  }

  getAllEvaluations = asyncHandler(async (req: Request, res: Response) => {
    const evaluations = await this.evaluationService.getAllEvaluations(req.query);
    return ApiResponse.success(res, evaluations);
  });

  getEvaluationById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const evaluation = await this.evaluationService.getEvaluationById(id);
    return ApiResponse.success(res, evaluation);
  });

  createEvaluation = asyncHandler(async (req: Request, res: Response) => {
    const evaluation = await this.evaluationService.createEvaluation(req.body);
    return ApiResponse.created(res, evaluation, 'Evaluation created successfully');
  });

  updateEvaluation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const evaluation = await this.evaluationService.updateEvaluation(id, req.body);
    return ApiResponse.success(res, evaluation, 'Evaluation updated successfully');
  });

  deleteEvaluation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.evaluationService.deleteEvaluation(id);
    return ApiResponse.success(res, null, 'Evaluation deleted successfully');
  });

  submitEvaluation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.evaluationService.submitEvaluation(id, req.body);
    return ApiResponse.success(res, result, 'Evaluation submitted successfully');
  });

  getCalibrationData = asyncHandler(async (req: Request, res: Response) => {
    const { companyId, cycleId } = req.query;
    const data = await this.evaluationService.getCalibrationData(
      companyId as string,
      cycleId as string
    );
    return ApiResponse.success(res, data);
  });

  updateCalibration = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.evaluationService.updateCalibration(req.body);
    return ApiResponse.success(res, result, 'Calibration updated successfully');
  });
}
