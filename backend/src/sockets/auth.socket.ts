import { Socket } from 'socket.io';
import { verifyAccessToken } from '../config/jwt';
import logger from '../utils/logger';

export function authenticateSocket(socket: Socket, next: (err?: Error) => void) {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const payload = verifyAccessToken(token);
    socket.data.userId = payload.id;
    socket.data.role = payload.role;

    return next();
  } catch (error) {
    logger.warn('Socket authentication failed:', error);
    return next(new Error('Invalid or expired authentication token'));
  }
}
