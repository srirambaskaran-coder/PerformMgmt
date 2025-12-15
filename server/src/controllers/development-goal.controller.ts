import { Request, Response } from 'express';
import { DevelopmentGoalService } from '../services/development-goal.service';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export class DevelopmentGoalController {
  private developmentGoalService: DevelopmentGoalService;

  constructor() {
    this.developmentGoalService = new DevelopmentGoalService();
  }

  getAllDevelopmentGoals = asyncHandler(async (req: Request, res: Response) => {
    const goals = await this.developmentGoalService.getAllDevelopmentGoals(req.query);
    return ApiResponse.success(res, goals);
  });

  getDevelopmentGoalById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const goal = await this.developmentGoalService.getDevelopmentGoalById(id);
    return ApiResponse.success(res, goal);
  });

  createDevelopmentGoal = asyncHandler(async (req: Request, res: Response) => {
    const goal = await this.developmentGoalService.createDevelopmentGoal(req.body);
    return ApiResponse.created(res, goal, 'Development goal created successfully');
  });

  updateDevelopmentGoal = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const goal = await this.developmentGoalService.updateDevelopmentGoal(id, req.body);
    return ApiResponse.success(res, goal, 'Development goal updated successfully');
  });

  deleteDevelopmentGoal = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.developmentGoalService.deleteDevelopmentGoal(id);
    return ApiResponse.success(res, null, 'Development goal deleted successfully');
  });

  submitDevelopmentGoal = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.developmentGoalService.submitDevelopmentGoal(id, req.body);
    return ApiResponse.success(res, result, 'Development goal submitted successfully');
  });

  approveDevelopmentGoal = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.developmentGoalService.approveDevelopmentGoal(id, req.body);
    return ApiResponse.success(res, result, 'Development goal approved successfully');
  });
}
