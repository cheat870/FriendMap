import { Request, Response, NextFunction } from 'express';
import { Socket } from 'socket.io';
import { verifyAccessToken } from '../config/jwt';
import { AuthUser, RequestWithUser } from '../types';
import logger from '../utils/logger';

/**
 * Express middleware: extract Bearer token, verify JWT, attach req.user
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'No authentication token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const user = verifyAccessToken(token);
    (req as RequestWithUser).user = user;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, message: 'Token has expired' });
      return;
    }
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ success: false, message: 'Invalid token' });
      return;
    }
    logger.error('Auth middleware error:', error);
    res.status(401).json({ success: false, message: 'Authentication failed' });
  }
}

/**
 * RBAC middleware factory: check that req.user.role is in allowed roles
 */
export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as RequestWithUser).user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    if (!roles.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`,
      });
      return;
    }
    next();
  };
}

/**
 * Socket.IO auth middleware: verify token from handshake, attach socket.data
 */
export function authenticateSocket(
  socket: Socket,
  next: (err?: Error) => void
): void {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('No authentication token'));
    }

    const user = verifyAccessToken(token);
    socket.data.userId = user.id;
    socket.data.role = user.role;
    next();
  } catch (error: any) {
    logger.warn('Socket auth failed:', error.message);
    next(new Error('Authentication failed'));
  }
}
