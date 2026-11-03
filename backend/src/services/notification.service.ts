import { PrismaClient } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';
import logger from '../utils/logger';

/**
 * Create a notification in the database and return it
 */
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string | null,
  data: Record<string, any> | null,
  prisma: PrismaClient
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        data: data ? JSON.stringify(data) : undefined,
      },
    });
    return notification;
  } catch (error) {
    logger.error('Failed to create notification:', error);
    throw error;
  }
}

/**
 * Emit a notification to a user's socket room
 */
export function broadcastNotification(
  userId: string,
  notification: any,
  io: SocketIOServer
): void {
  try {
    io.to(`user:${userId}`).emit('notification:new', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data ? (typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data) : null,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    });
  } catch (error) {
    logger.error('Failed to broadcast notification:', error);
  }
}

/**
 * Create and immediately broadcast a notification
 */
export async function createAndBroadcastNotification(
  userId: string,
  type: string,
  title: string,
  body: string | null,
  data: Record<string, any> | null,
  prisma: PrismaClient,
  io: SocketIOServer
): Promise<any> {
  const notification = await createNotification(userId, type, title, body, data, prisma);
  broadcastNotification(userId, notification, io);
  return notification;
}
