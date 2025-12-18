import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  getAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { companyId } = req.query;
    const analytics = await this.analyticsService.getAnalytics(companyId as string, req.query);
    return ApiResponse.success(res, analytics);
  });

  getPerformanceDistribution = asyncHandler(async (req: Request, res: Response) => {
    const { companyId, cycleId } = req.query;
    const distribution = await this.analyticsService.getPerformanceDistribution(
      companyId as string,
      cycleId as string | undefined
    );
    return ApiResponse.success(res, distribution);
  });

  getEvaluationTrends = asyncHandler(async (req: Request, res: Response) => {
    const { companyId } = req.query;
    const trends = await this.analyticsService.getEvaluationTrends(companyId as string, req.query);
    return ApiResponse.success(res, trends);
  });

  getDepartmentAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { companyId, departmentId } = req.query;
    const analytics = await this.analyticsService.getDepartmentAnalytics(
      companyId as string,
      departmentId as string | undefined
    );
    return ApiResponse.success(res, analytics);
  });

  getManagerAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { managerId } = req.query;
    const analytics = await this.analyticsService.getManagerAnalytics(managerId as string);
    return ApiResponse.success(res, analytics);
  });

  /**
   * Get comprehensive performance trends for HR Manager analytics dashboard
   */
  getPerformanceTrends = asyncHandler(async (req: Request, res: Response) => {
    const requestingUserId = (req as any).user?.id || (req as any).user?.claims?.sub;
    const trends = await this.analyticsService.getPerformanceTrends(requestingUserId);
    return ApiResponse.success(res, trends);
  });
}
