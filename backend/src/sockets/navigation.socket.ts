import { Server as SocketIOServer, Socket } from 'socket.io';
import prisma from '../config/database';
import { haversineDistance } from '../services/location.service';
import logger from '../utils/logger';

const ARRIVAL_RADIUS_M = parseInt(process.env.ARRIVAL_RADIUS_M || '50', 10);

export function registerNavigationHandlers(io: SocketIOServer, socket: Socket) {
  const userId = socket.data.userId;

  socket.on('navigation:progress', async (data: {
    sessionId: string;
    userLat: number;
    userLng: number;
    destLat: number;
    destLng: number;
    remainingM: number;
    remainingS: number;
  }) => {
    try {
      const { sessionId, userLat, userLng, destLat, destLng, remainingM, remainingS } = data;

      const session = await prisma.navigationSession.findFirst({
        where: { id: sessionId, userId, status: 'active' },
      });

      if (!session) return;

      const distanceToDest = haversineDistance(userLat, userLng, destLat, destLng);
      const arrived = distanceToDest <= ARRIVAL_RADIUS_M;

      if (arrived) {
        await prisma.navigationSession.update({
          where: { id: sessionId },
          data: {
            status: 'completed',
            arrivedAt: new Date(),
            endedAt: new Date(),
          },
        });

        io.to(`user:${session.targetUserId}`).emit('navigation:arrived', {
          sessionId,
          userId,
        });
        io.to(`user:${userId}`).emit('navigation:arrived', {
          sessionId,
          targetUserId: session.targetUserId,
        });
      } else {
        // Forward progress to friend so they can track where the navigator is
        io.to(`user:${session.targetUserId}`).emit('navigation:partner_progress', {
          sessionId,
          userLat,
          userLng,
          remainingM,
          remainingS,
        });
      }
    } catch (error) {
      logger.error('Error handling socket navigation:progress:', error);
    }
  });

  socket.on('navigation:cancel', async ({ sessionId }: { sessionId: string }) => {
    try {
      const session = await prisma.navigationSession.findFirst({
        where: { id: sessionId, userId },
      });

      if (!session) return;

      await prisma.navigationSession.update({
        where: { id: sessionId },
        data: { status: 'cancelled', endedAt: new Date() },
      });

      io.to(`user:${session.targetUserId}`).emit('navigation:ended', {
        sessionId,
        userId,
      });
    } catch (error) {
      logger.error('Error handling socket navigation:cancel:', error);
    }
  });
}
