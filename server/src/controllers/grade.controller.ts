import { Request, Response } from 'express';
import { GradeService } from '../services/grade.service';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export class GradeController {
  private gradeService: GradeService;

  constructor() {
    this.gradeService = new GradeService();
  }

  getAllGrades = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.query.companyId as string | undefined;
    const grades = await this.gradeService.getAllGrades(companyId);
    return ApiResponse.success(res, grades);
  });

  getGradeById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const grade = await this.gradeService.getGradeById(id);
    return ApiResponse.success(res, grade);
  });

  createGrade = asyncHandler(async (req: Request, res: Response) => {
    const grade = await this.gradeService.createGrade(req.body);
    return ApiResponse.created(res, grade, 'Grade created successfully');
  });

  updateGrade = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const grade = await this.gradeService.updateGrade(id, req.body);
    return ApiResponse.success(res, grade, 'Grade updated successfully');
  });

  deleteGrade = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.gradeService.deleteGrade(id);
    return ApiResponse.success(res, null, 'Grade deleted successfully');
  });
}
