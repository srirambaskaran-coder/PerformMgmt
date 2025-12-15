import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { storage } from '../lib/storage';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  getMetrics = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.session.userId!;
    
    const metrics = await this.dashboardService.getMetrics(userId);
    return ApiResponse.success(res, metrics);
  });

  getSuperAdminDashboard = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.query.companyId as string | undefined;
    const data = await this.dashboardService.getSuperAdminDashboard(companyId);
    return ApiResponse.success(res, data);
  });

  getAdminDashboard = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.session.userId!;
    const user = await storage.getUser(userId);
    
    if (!user?.companyId) {
      return ApiResponse.badRequest(res, 'Company ID not found');
    }
    
    const data = await this.dashboardService.getAdminDashboard(user.companyId);
    return ApiResponse.success(res, data);
  });

  getHRManagerDashboard = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.session.userId!;
    const user = await storage.getUser(userId);
    
    if (!user?.companyId) {
      return ApiResponse.badRequest(res, 'Company ID not found');
    }
    
    const data = await this.dashboardService.getHRManagerDashboard(user.companyId);
    return ApiResponse.success(res, data);
  });

  getManagerDashboard = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.session.userId!;
    const user = await storage.getUser(userId);
    
    if (!user?.companyId) {
      return ApiResponse.badRequest(res, 'Company ID not found');
    }
    
    const data = await this.dashboardService.getManagerDashboard(userId, user.companyId);
    return ApiResponse.success(res, data);
  });

  getEmployeeDashboard = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.session.userId!;
    
    const data = await this.dashboardService.getEmployeeDashboard(userId);
    return ApiResponse.success(res, data);
  });
}
