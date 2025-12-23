import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader, TokenPayload } from '../utils/jwt';

// Extended request interface for JWT-authenticated requests
export interface AuthenticatedRequest extends Request {
  // JWT payload attached by middleware
  user?: TokenPayload;
  // Legacy session properties accessed dynamically
  session: Request['session'] & {
    userId?: string;
    activeRole?: string;
  };
}

/**
 * Authentication middleware - validates JWT token from Authorization header
 * Falls back to session-based auth for backward compatibility
 */
export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authReq = req as AuthenticatedRequest;
  
  // Try JWT authentication first (preferred method)
  const token = extractTokenFromHeader(req.headers.authorization);
  
  if (token) {
    const payload = verifyAccessToken(token);
    
    if (payload) {
      // Attach user info to request
      authReq.user = payload;
      return next();
    }
    
    // Token provided but invalid/expired
    return res.status(401).json({ 
      message: 'Unauthorized - Invalid or expired token',
      code: 'TOKEN_INVALID'
    });
  }
  
  // Fallback to session-based auth (for backward compatibility)
  if (authReq.session?.userId) {
    return next();
  }
  
  return res.status(401).json({ 
    message: 'Unauthorized - Please login',
    code: 'NO_AUTH'
  });
};

/**
 * Role-based authorization middleware
 * Checks if the authenticated user has one of the allowed roles
 */
export const requireRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    
    // Check JWT-based authentication first
    if (authReq.user) {
      const userRole = authReq.user.role;
      const availableRoles = authReq.user.roles || [userRole];
      
      // Check if user has any of the allowed roles
      const hasRole = allowedRoles.some(role => availableRoles.includes(role));
      
      if (!hasRole) {
        return res.status(403).json({ 
          message: 'Forbidden - Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
      
      return next();
    }
    
    // Fallback to session-based auth
    if (!authReq.session?.userId) {
      return res.status(401).json({ 
        message: 'Unauthorized - Please login',
        code: 'NO_AUTH'
      });
    }
    
    const userRole = authReq.session.activeRole;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Forbidden - Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    next();
  };
};

/**
 * Helper to get user ID from request (supports both JWT and session)
 */
export function getUserId(req: Request): string | undefined {
  const authReq = req as AuthenticatedRequest;
  return authReq.user?.userId || authReq.session?.userId;
}

/**
 * Helper to get active role from request (supports both JWT and session)
 */
export function getActiveRole(req: Request): string | undefined {
  const authReq = req as AuthenticatedRequest;
  return authReq.user?.role || authReq.session?.activeRole;
}
