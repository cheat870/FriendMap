import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../utils/logger';

export async function getNotifications(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { limit = 30, offset = 0 } = req.query;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: Math.min(Number(limit), 100),
        skip: Number(offset),
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return res.json({ notifications, unreadCount });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

export async function markAsRead(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const notif = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notif) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return res.json({ success: true, notification: updated });
  } catch (error) {
    logger.error('Error marking notification read:', error);
    return res.status(500).json({ error: 'Failed to update notification' });
  }
}

export async function markAllRead(req: Request, res: Response) {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Error marking all notifications read:', error);
    return res.status(500).json({ error: 'Failed to update notifications' });
  }
}

export async function deleteNotification(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    await prisma.notification.deleteMany({
      where: { id, userId },
    });

    return res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    return res.status(500).json({ error: 'Failed to delete notification' });
  }
}
