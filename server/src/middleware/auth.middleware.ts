import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  session: {
    userId?: string;
    activeRole?: string;
    save: (callback: (err: any) => void) => void;
    destroy: (callback: (err: any) => void) => void;
  };
}

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authReq = req as AuthenticatedRequest;
  
  if (!authReq.session?.userId) {
    return res.status(401).json({ message: 'Unauthorized - Please login' });
  }
  
  next();
};

export const requireRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.session?.userId) {
      return res.status(401).json({ message: 'Unauthorized - Please login' });
    }
    
    const userRole = authReq.session.activeRole;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Forbidden - Insufficient permissions' 
      });
    }
    
    next();
  };
};
