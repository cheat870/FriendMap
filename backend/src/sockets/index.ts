import { Server as SocketIOServer } from 'socket.io';
import { authenticateSocket } from './auth.socket';
import { registerLocationHandlers } from './location.socket';
import { registerChatHandlers } from './chat.socket';
import { registerNavigationHandlers } from './navigation.socket';
import prisma from '../config/database';
import logger from '../utils/logger';

export function initializeSockets(io: SocketIOServer) {
  // Authentication middleware
  io.use(authenticateSocket);

  io.on('connection', async (socket) => {
    const userId = socket.data.userId;
    logger.info(`Socket connected: ${socket.id} (user: ${userId})`);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Update user active status
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { lastActiveAt: new Date() },
      });
    } catch (e) {
      // ignore
    }

    // Register all feature event handlers
    registerLocationHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerNavigationHandlers(io, socket);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id} (user: ${userId})`);
    });
  });
}

export default initializeSockets;
