import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const { companyId } = req.query;

    // Get user's company ID for filtering
    const userCompanyId = companyId as string | undefined;

    const users = await this.userService.getAllUsers(userCompanyId);

    return ApiResponse.success(res, { users }, 'Users retrieved successfully');
  });

  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await this.userService.getUserById(id);

    return ApiResponse.success(res, { user }, 'User retrieved successfully');
  });

  createUser = asyncHandler(async (req: Request, res: Response) => {
    const userData = req.body;

    const user = await this.userService.createUser(userData);

    return ApiResponse.created(res, { user }, 'User created successfully');
  });

  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userData = req.body;

    const user = await this.userService.updateUser(id, userData);

    return ApiResponse.success(res, { user }, 'User updated successfully');
  });

  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await this.userService.deleteUser(id);

    return ApiResponse.success(res, null, 'User deleted successfully');
  });
}
