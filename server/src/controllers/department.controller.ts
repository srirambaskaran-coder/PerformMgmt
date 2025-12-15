import { Request, Response } from 'express';
import { DepartmentService } from '../services/department.service';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export class DepartmentController {
  private departmentService: DepartmentService;

  constructor() {
    this.departmentService = new DepartmentService();
  }

  getAllDepartments = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.query.companyId as string | undefined;
    const departments = await this.departmentService.getAllDepartments(companyId);
    return ApiResponse.success(res, departments);
  });

  getDepartmentById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const department = await this.departmentService.getDepartmentById(id);
    return ApiResponse.success(res, department);
  });

  createDepartment = asyncHandler(async (req: Request, res: Response) => {
    const department = await this.departmentService.createDepartment(req.body);
    return ApiResponse.created(res, department, 'Department created successfully');
  });

  updateDepartment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const department = await this.departmentService.updateDepartment(id, req.body);
    return ApiResponse.success(res, department, 'Department updated successfully');
  });

  deleteDepartment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.departmentService.deleteDepartment(id);
    return ApiResponse.success(res, null, 'Department deleted successfully');
  });
}
