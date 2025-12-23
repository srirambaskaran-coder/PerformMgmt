import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { ApiResponse } from "../utils/response";
import { asyncHandler } from "../middleware/error.middleware";
import { AuthenticatedRequest, getUserId } from "../middleware/auth.middleware";
import { generateTokens, verifyRefreshToken, TokenPayload } from "../utils/jwt";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await this.authService.login(email, password);

    // Generate JWT tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      roles: user.roles || [user.role],
      companyId: user.companyId,
    };

    const tokens = generateTokens(tokenPayload);

    return ApiResponse.success(
      res,
      {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
      "Login successful"
    );
  });

  /**
   * Refresh access token using a valid refresh token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return ApiResponse.badRequest(res, "Refresh token is required");
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      return ApiResponse.unauthorized(res, "Invalid or expired refresh token");
    }

    // Get current user data
    const user = await this.authService.getCurrentUser(payload.userId);

    // Generate new tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      roles: user.roles || [user.role],
      companyId: user.companyId,
    };

    const tokens = generateTokens(tokenPayload);

    return ApiResponse.success(
      res,
      {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
      "Token refreshed successfully"
    );
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = getUserId(req);

    if (userId) {
      await this.authService.logout(userId);
    }

    // For session-based auth (backward compatibility)
    if (authReq.session?.destroy) {
      await new Promise<void>((resolve, reject) => {
        authReq.session.destroy((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    return ApiResponse.success(res, null, "Logout successful");
  });

  getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = getUserId(req);

    if (!userId) {
      return ApiResponse.unauthorized(res, "Not authenticated");
    }

    const user = await this.authService.getCurrentUser(userId);

    return ApiResponse.success(res, { user }, "User retrieved successfully");
  });

  checkAuth = asyncHandler(async (req: Request, res: Response) => {
    const userId = getUserId(req);

    if (!userId) {
      return ApiResponse.unauthorized(res, "Not authenticated");
    }

    const user = await this.authService.getCurrentUser(userId);

    return ApiResponse.success(res, { user, authenticated: true });
  });
}
