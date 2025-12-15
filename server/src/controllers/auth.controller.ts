import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const authReq = req as AuthenticatedRequest;

    const user = await this.authService.login(email, password);

    // Set session
    authReq.session.userId = user.id;
    authReq.session.activeRole = user.role;

    await new Promise<void>((resolve, reject) => {
      authReq.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    return ApiResponse.success(res, { user }, 'Login successful');
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.session.userId;

    if (userId) {
      await this.authService.logout(userId);
    }

    await new Promise<void>((resolve, reject) => {
      authReq.session.destroy((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    return ApiResponse.success(res, null, 'Logout successful');
  });

  getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.session.userId!;

    const user = await this.authService.getCurrentUser(userId);

    return ApiResponse.success(res, { user }, 'User retrieved successfully');
  });

  checkAuth = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.session.userId) {
      return ApiResponse.unauthorized(res, 'Not authenticated');
    }

    const user = await this.authService.getCurrentUser(authReq.session.userId);

    return ApiResponse.success(res, { user, authenticated: true });
  });
}
