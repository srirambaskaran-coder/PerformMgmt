import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { logger } from './logger';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  roles?: string[];
  companyId?: string;
}

export interface JwtTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

// Get secrets from environment or use defaults (change in production!)
const JWT_SECRET = process.env.JWT_SECRET || 'jwt-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'jwt-refresh-secret-change-in-production';

// Token expiration times in seconds
const ACCESS_TOKEN_EXPIRY_SECONDS = parseInt(process.env.JWT_ACCESS_EXPIRY_SECONDS || '900', 10); // 15 minutes
const REFRESH_TOKEN_EXPIRY_SECONDS = parseInt(process.env.JWT_REFRESH_EXPIRY_SECONDS || '604800', 10); // 7 days

/**
 * Generate access and refresh tokens for a user
 */
export function generateTokens(payload: TokenPayload): JwtTokens {
  const accessTokenOptions: SignOptions = {
    expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
  };

  const refreshTokenOptions: SignOptions = {
    expiresIn: REFRESH_TOKEN_EXPIRY_SECONDS,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, accessTokenOptions);
  const refreshToken = jwt.sign(
    { userId: payload.userId, type: 'refresh' },
    JWT_REFRESH_SECRET,
    refreshTokenOptions
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
  };
}

/**
 * Verify an access token and return the payload
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload & JwtPayload;
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      roles: decoded.roles,
      companyId: decoded.companyId,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.debug('Access token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.debug('Invalid access token', { error: (error as Error).message });
    }
    return null;
  }
}

/**
 * Verify a refresh token and return the user ID
 */
export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload & { userId: string; type: string };
    
    if (decoded.type !== 'refresh') {
      logger.debug('Invalid token type for refresh');
      return null;
    }
    
    return { userId: decoded.userId };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.debug('Refresh token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.debug('Invalid refresh token', { error: (error as Error).message });
    }
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  // Support "Bearer <token>" format
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Also support raw token
  return authHeader;
}
