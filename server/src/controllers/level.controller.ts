import { Request, Response } from 'express';
import { LevelService } from '../services/level.service';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export class LevelController {
  private levelService: LevelService;

  constructor() {
    this.levelService = new LevelService();
  }

  getAllLevels = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.query.companyId as string | undefined;
    const levels = await this.levelService.getAllLevels(companyId);
    return ApiResponse.success(res, levels);
  });

  getLevelById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const level = await this.levelService.getLevelById(id);
    return ApiResponse.success(res, level);
  });

  createLevel = asyncHandler(async (req: Request, res: Response) => {
    const level = await this.levelService.createLevel(req.body);
    return ApiResponse.created(res, level, 'Level created successfully');
  });

  updateLevel = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const level = await this.levelService.updateLevel(id, req.body);
    return ApiResponse.success(res, level, 'Level updated successfully');
  });

  deleteLevel = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.levelService.deleteLevel(id);
    return ApiResponse.success(res, null, 'Level deleted successfully');
  });
}
