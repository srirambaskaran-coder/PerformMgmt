import { Request, Response } from 'express';
import { ReviewCycleService } from '../services/review-cycle.service';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export class ReviewCycleController {
  private reviewCycleService: ReviewCycleService;

  constructor() {
    this.reviewCycleService = new ReviewCycleService();
  }

  getAllReviewCycles = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.query.companyId as string | undefined;
    const cycles = await this.reviewCycleService.getAllReviewCycles(companyId);
    return ApiResponse.success(res, cycles);
  });

  getReviewCycleById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const cycle = await this.reviewCycleService.getReviewCycleById(id);
    return ApiResponse.success(res, cycle);
  });

  createReviewCycle = asyncHandler(async (req: Request, res: Response) => {
    const cycle = await this.reviewCycleService.createReviewCycle(req.body);
    return ApiResponse.created(res, cycle, 'Review cycle created successfully');
  });

  updateReviewCycle = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const cycle = await this.reviewCycleService.updateReviewCycle(id, req.body);
    return ApiResponse.success(res, cycle, 'Review cycle updated successfully');
  });

  deleteReviewCycle = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.reviewCycleService.deleteReviewCycle(id);
    return ApiResponse.success(res, null, 'Review cycle deleted successfully');
  });
}
