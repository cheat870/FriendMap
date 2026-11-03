import jwt, { SignOptions } from 'jsonwebtoken';
import { AuthUser } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'friendmap-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'friendmap-refresh-secret-change-in-production';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface AccessTokenPayload {
  userId: string;
  role: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  userId: string;
  type: 'refresh';
}

/**
 * Generate a short-lived access token
 */
export function generateAccessToken(userId: string, role: string): string {
  const payload: AccessTokenPayload = { userId, role, type: 'access' };
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);
}

/**
 * Generate a long-lived refresh token
 */
export function generateRefreshToken(userId: string): string {
  const payload: RefreshTokenPayload = { userId, type: 'refresh' };
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
}

/**
 * Verify an access token and return the decoded payload
 */
export function verifyAccessToken(token: string): AuthUser {
  const decoded = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
  if (decoded.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return { id: decoded.userId, role: decoded.role };
}

/**
 * Verify a refresh token and return the userId
 */
export function verifyRefreshToken(token: string): { userId: string } {
  const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return { userId: decoded.userId };
}

/**
 * Decode a token without verification (for debugging purposes)
 */
export function decodeToken(token: string): any {
  return jwt.decode(token);
}
