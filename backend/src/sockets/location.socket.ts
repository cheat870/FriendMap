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

      // Find all friends with active permissions
      const permissions = await prisma.locationSharingPermission.findMany({
        where: {
          ownerId: userId,
          isActive: true,
        },
      });

      const validPermissions = permissions.filter(
        (p) => !p.expiresAt || new Date(p.expiresAt) > now
      );

      for (const p of validPermissions) {
        io.to(`user:${p.viewerId}`).emit('location:friend_updated', {
          userId,
          latitude,
          longitude,
          accuracy: location.accuracy,
          heading: location.heading,
          speed: location.speed,
          recordedAt: location.recordedAt,
        });
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
