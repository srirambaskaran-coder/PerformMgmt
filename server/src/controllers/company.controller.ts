import { Request, Response } from 'express';
import { CompanyService } from '../services/company.service';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class CompanyController {
  private companyService: CompanyService;

  constructor() {
    this.companyService = new CompanyService();
  }

  getAllCompanies = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.session.userId;
    
    // Get user's company ID for filtering
    const companyId = req.query.companyId as string | undefined;
    
    const companies = await this.companyService.getAllCompanies(companyId);
    return ApiResponse.success(res, { companies });
  });

  getCompanyById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const company = await this.companyService.getCompanyById(id);
    return ApiResponse.success(res, { company });
  });

  createCompany = asyncHandler(async (req: Request, res: Response) => {
    const company = await this.companyService.createCompany(req.body);
    return ApiResponse.created(res, { company });
  });

  updateCompany = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const company = await this.companyService.updateCompany(id, req.body);
    return ApiResponse.success(res, { company });
  });

  deleteCompany = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.companyService.deleteCompany(id);
    return ApiResponse.success(res, null, 'Company deleted successfully');
  });
}
