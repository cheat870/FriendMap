import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../utils/logger';

export async function getStats(req: Request, res: Response) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, activeUsers, newToday, activeNavigations, totalFriendships] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.navigationSession.count({ where: { status: 'active' } }),
      prisma.friendship.count(),
    ]);

    const io = (req.app as any).get('io');
    const onlineSocketsCount = io ? io.engine?.clientsCount || 0 : 0;

    return res.json({
      totalUsers,
      activeUsers,
      newToday,
      activeNavigations,
      totalFriendships,
      onlineUsers: onlineSocketsCount,
    });
  } catch (error) {
    logger.error('Error fetching admin stats:', error);
    return res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
}

export async function getUsers(req: Request, res: Response) {
  try {
    const { page = 1, limit = 20, search = '', status, role } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Math.min(Number(limit), 100);

    const where: any = {};
    if (status) where.status = status;
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { username: { contains: String(search) } },
        { displayName: { contains: String(search) } },
        { email: { contains: String(search) } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          role: true,
          status: true,
          emailVerified: true,
          lastActiveAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({
      users,
      pagination: {
        page: Number(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    logger.error('Error fetching admin users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
}

export async function updateUserStatus(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!['active', 'suspended', 'deleted'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        username: true,
        displayName: true,
        status: true,
      },
    });

    return res.json({ success: true, user: updated });
  } catch (error) {
    logger.error('Error updating user status:', error);
    return res.status(500).json({ error: 'Failed to update user status' });
  }
}

export async function updateUserRole(req: Request, res: Response) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can update user roles' });
    }

    const id = req.params.id as string;
    const { role } = req.body;

    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
      },
    });

    return res.json({ success: true, user: updated });
  } catch (error) {
    logger.error('Error updating user role:', error);
    return res.status(500).json({ error: 'Failed to update user role' });
  }
}
