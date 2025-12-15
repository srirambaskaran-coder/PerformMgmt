import { Request, Response } from 'express';
import { SettingsService } from '../services/settings.service';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class SettingsController {
  private settingsService: SettingsService;

  constructor() {
    this.settingsService = new SettingsService();
  }

  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.session.userId!;
    const { currentPassword, newPassword } = req.body;
    
    await this.settingsService.changePassword(userId, currentPassword, newPassword);
    return ApiResponse.success(res, null, 'Password changed successfully');
  });

  getCompanySettings = asyncHandler(async (req: Request, res: Response) => {
    const { companyId } = req.params;
    const settings = await this.settingsService.getCompanySettings(companyId);
    return ApiResponse.success(res, settings);
  });

  updateCompanySettings = asyncHandler(async (req: Request, res: Response) => {
    const { companyId } = req.params;
    const settings = await this.settingsService.updateCompanySettings(companyId, req.body);
    return ApiResponse.success(res, settings, 'Company settings updated successfully');
  });

  getUserPreferences = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.session.userId!;
    const preferences = await this.settingsService.getUserPreferences(userId);
    return ApiResponse.success(res, preferences);
  });

  updateUserPreferences = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.session.userId!;
    const preferences = await this.settingsService.updateUserPreferences(userId, req.body);
    return ApiResponse.success(res, preferences, 'User preferences updated successfully');
  });

  getReviewFrequencies = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.query.companyId as string | undefined;
    const frequencies = await this.settingsService.getReviewFrequencies(companyId);
    return ApiResponse.success(res, frequencies);
  });

  createReviewFrequency = asyncHandler(async (req: Request, res: Response) => {
    const frequency = await this.settingsService.createReviewFrequency(req.body);
    return ApiResponse.created(res, frequency, 'Review frequency created successfully');
  });

  getFrequencyCalendars = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.query.companyId as string | undefined;
    const calendars = await this.settingsService.getFrequencyCalendars(companyId);
    return ApiResponse.success(res, calendars);
  });

  createFrequencyCalendar = asyncHandler(async (req: Request, res: Response) => {
    const calendar = await this.settingsService.createFrequencyCalendar(req.body);
    return ApiResponse.created(res, calendar, 'Frequency calendar created successfully');
  });
}
