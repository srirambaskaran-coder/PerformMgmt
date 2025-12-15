import { Request, Response } from 'express';
import { AppraisalService } from '../services/appraisal.service';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export class AppraisalController {
  private appraisalService: AppraisalService;

  constructor() {
    this.appraisalService = new AppraisalService();
  }

  getAllAppraisals = asyncHandler(async (req: Request, res: Response) => {
    const appraisals = await this.appraisalService.getAllAppraisals(req.query);
    return ApiResponse.success(res, appraisals);
  });

  getAppraisalById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const appraisal = await this.appraisalService.getAppraisalById(id);
    return ApiResponse.success(res, appraisal);
  });

  createAppraisal = asyncHandler(async (req: Request, res: Response) => {
    const appraisal = await this.appraisalService.createAppraisal(req.body);
    return ApiResponse.created(res, appraisal, 'Appraisal created successfully');
  });

  updateAppraisal = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const appraisal = await this.appraisalService.updateAppraisal(id, req.body);
    return ApiResponse.success(res, appraisal, 'Appraisal updated successfully');
  });

  deleteAppraisal = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.appraisalService.deleteAppraisal(id);
    return ApiResponse.success(res, null, 'Appraisal deleted successfully');
  });

  getAppraisalCycles = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.query.companyId as string | undefined;
    const cycles = await this.appraisalService.getAppraisalCycles(companyId);
    return ApiResponse.success(res, cycles);
  });

  createAppraisalCycle = asyncHandler(async (req: Request, res: Response) => {
    const cycle = await this.appraisalService.createAppraisalCycle(req.body);
    return ApiResponse.created(res, cycle, 'Appraisal cycle created successfully');
  });

  getAppraisalGroups = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.query.companyId as string | undefined;
    const groups = await this.appraisalService.getAppraisalGroups(companyId);
    return ApiResponse.success(res, groups);
  });

  createAppraisalGroup = asyncHandler(async (req: Request, res: Response) => {
    const group = await this.appraisalService.createAppraisalGroup(req.body);
    return ApiResponse.created(res, group, 'Appraisal group created successfully');
  });
}
