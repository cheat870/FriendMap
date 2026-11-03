import { Server as SocketIOServer, Socket } from 'socket.io';
import prisma from '../config/database';
import logger from '../utils/logger';

export function registerLocationHandlers(io: SocketIOServer, socket: Socket) {
  const userId = socket.data.userId;

  socket.on('location:update', async (data: { latitude: number; longitude: number; accuracy?: number; heading?: number; speed?: number }) => {
    try {
      const { latitude, longitude, accuracy, heading, speed } = data;
      if (latitude === undefined || longitude === undefined) return;

      const now = new Date();

      // Upsert location
      const location = await prisma.location.upsert({
        where: { userId },
        update: {
          latitude,
          longitude,
          accuracy: accuracy || null,
          heading: heading || null,
          speed: speed || null,
          recordedAt: now,
        },
        create: {
          userId,
          latitude,
          longitude,
          accuracy: accuracy || null,
          heading: heading || null,
          speed: speed || null,
          recordedAt: now,
        },
      });

      // Update user last active
      await prisma.user.update({
        where: { id: userId },
        data: { lastActiveAt: now },
      });

      // Find all friends
      const friendships = await prisma.friendship.findMany({
        where: { OR: [{ userId1: userId }, { userId2: userId }] },
      });
      const friendIds = friendships.map((f) => (f.userId1 === userId ? f.userId2 : f.userId1));

      if (friendIds.length > 0) {
        const blocks = await prisma.blockedUser.findMany({
          where: {
            OR: [
              { blockerId: userId, blockedId: { in: friendIds } },
              { blockerId: { in: friendIds }, blockedId: userId },
            ],
          },
        });
        const blockedIds = new Set([
          ...blocks.map((b) => b.blockedId),
          ...blocks.map((b) => b.blockerId),
        ]);

        const permissions = await prisma.locationSharingPermission.findMany({
          where: {
            ownerId: userId,
            viewerId: { in: friendIds },
          },
        });
        const permissionMap = new Map(permissions.map((p) => [p.viewerId, p]));

        for (const friendId of friendIds) {
          if (blockedIds.has(friendId)) continue;
          const p = permissionMap.get(friendId);
          if (p) {
            if (p.isActive === false) continue;
            if (p.expiresAt && new Date(p.expiresAt) < now) continue;
          }

          io.to(`user:${friendId}`).emit('location:friend_updated', {
            userId,
            latitude,
            longitude,
            accuracy: location.accuracy,
            heading: location.heading,
            speed: location.speed,
            recordedAt: location.recordedAt,
          });
        }
      }
    } catch (error) {
      logger.error('Error handling socket location update:', error);
    }
  });

  socket.on('location:sharing_stopped', async () => {
    try {
      await prisma.locationSharingPermission.updateMany({
        where: { ownerId: userId },
        data: { isActive: false },
      });

      // Notify friends
      const friendships = await prisma.friendship.findMany({
        where: { OR: [{ userId1: userId }, { userId2: userId }] },
      });

      for (const f of friendships) {
        const friendId = f.userId1 === userId ? f.userId2 : f.userId1;
        io.to(`user:${friendId}`).emit('location:sharing_stopped', { userId });
      }
    } catch (error) {
      logger.error('Error in location:sharing_stopped socket event:', error);
    }
  });
}
