import { Request, Response } from 'express';
import prisma from '../config/database';
import { RequestWithUser } from '../types';
import { sanitizeUser, parsePagination, paginationMeta } from '../utils/helpers';
import { createNotification, broadcastNotification } from '../services/notification.service';
import logger from '../utils/logger';

// Helper: get the io instance from the app
function getIO(req: Request) {
  return (req as any).app.get('io');
}

/**
 * GET /api/friends
 */
export async function getFriends(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as RequestWithUser).user.id;

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userId1: userId }, { userId2: userId }],
      },
      include: {
        user1: {
          select: {
            id: true, username: true, displayName: true, avatarUrl: true,
            status: true, lastActiveAt: true,
          },
        },
        user2: {
          select: {
            id: true, username: true, displayName: true, avatarUrl: true,
            status: true, lastActiveAt: true,
          },
        },
      },
    });

    const friends = friendships.map((f) => {
      const friend = f.userId1 === userId ? f.user2 : f.user1;
      return {
        ...friend,
        friendshipId: f.id,
        friendsSince: f.createdAt,
      };
    });

    // Get sharing permissions
    const friendIds = friends.map((f) => f.id);
    const permissions = await prisma.locationSharingPermission.findMany({
      where: {
        OR: [
          { ownerId: { in: friendIds }, viewerId: userId },
          { ownerId: userId, viewerId: { in: friendIds } },
        ],
      },
    });

    const sharingMap = new Map<string, { theyShareWithMe: boolean; iShareWithThem: boolean }>();
    for (const p of permissions) {
      const friendId = p.ownerId === userId ? p.viewerId : p.ownerId;
      const existing = sharingMap.get(friendId) || { theyShareWithMe: false, iShareWithThem: false };
      if (p.ownerId === friendId && p.viewerId === userId) {
        existing.theyShareWithMe = p.isActive;
      } else if (p.ownerId === userId && p.viewerId === friendId) {
        existing.iShareWithThem = p.isActive;
      }
      sharingMap.set(friendId, existing);
    }

    const result = friends.map((f) => ({
      ...f,
      sharing: sharingMap.get(f.id) || { theyShareWithMe: false, iShareWithThem: false },
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('GetFriends error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch friends' });
  }
}

/**
 * GET /api/friends/search
 */
export async function searchUsers(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as RequestWithUser).user.id;
    const { q = '', page: pageStr = '1', limit: limitStr = '20' } = req.query as any;
    const { page, limit, skip } = parsePagination(pageStr, limitStr, 50);

    if (!q.trim()) {
      res.status(400).json({ success: false, message: 'Search query is required' });
      return;
    }

    // Get blocked user IDs
    const blocks = await prisma.blockedUser.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    });
    const blockedIds = new Set(
      blocks.flatMap((b) => [b.blockerId, b.blockedId]).filter((id) => id !== userId)
    );

    // Get existing friend IDs
    const friendships = await prisma.friendship.findMany({
      where: { OR: [{ userId1: userId }, { userId2: userId }] },
      select: { userId1: true, userId2: true },
    });
    const friendIds = new Set(
      friendships.flatMap((f) => [f.userId1, f.userId2]).filter((id) => id !== userId)
    );

    const excludeIds = [userId, ...blockedIds, ...friendIds];

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          AND: [
            { id: { notIn: excludeIds } },
            { status: 'active' },
            {
              OR: [
                { username: { contains: q } },
                { displayName: { contains: q } },
              ],
            },
          ],
        },
        select: {
          id: true, username: true, displayName: true, avatarUrl: true, status: true,
        },
        skip,
        take: limit,
        orderBy: { username: 'asc' },
      }),
      prisma.user.count({
        where: {
          AND: [
            { id: { notIn: excludeIds } },
            { status: 'active' },
            {
              OR: [
                { username: { contains: q } },
                { displayName: { contains: q } },
              ],
            },
          ],
        },
      }),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: paginationMeta(total, page, limit),
    });
  } catch (error) {
    logger.error('SearchUsers error:', error);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
}

/**
 * POST /api/friends/request
 */
export async function sendRequest(req: Request, res: Response): Promise<void> {
  try {
    const senderId = (req as RequestWithUser).user.id;
    const { receiverId, message } = req.body;

    if (senderId === receiverId) {
      res.status(400).json({ success: false, message: 'Cannot send friend request to yourself' });
      return;
    }

    // Check receiver exists
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver || receiver.status !== 'active') {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Check for block
    const block = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: senderId, blockedId: receiverId },
          { blockerId: receiverId, blockedId: senderId },
        ],
      },
    });
    if (block) {
      res.status(403).json({ success: false, message: 'Cannot send request to this user' });
      return;
    }

    // Check existing friendship
    const uid1 = senderId < receiverId ? senderId : receiverId;
    const uid2 = senderId < receiverId ? receiverId : senderId;
    const friendship = await prisma.friendship.findUnique({
      where: { userId1_userId2: { userId1: uid1, userId2: uid2 } },
    });
    if (friendship) {
      res.status(409).json({ success: false, message: 'Already friends' });
      return;
    }

    // Check existing pending request
    const existing = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId, status: 'pending' },
          { senderId: receiverId, receiverId: senderId, status: 'pending' },
        ],
      },
    });
    if (existing) {
      res.status(409).json({ success: false, message: 'A pending request already exists' });
      return;
    }

    const friendRequest = await prisma.friendRequest.create({
      data: { senderId, receiverId, message },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    // Send notification
    const io = getIO(req);
    const notification = await createNotification(
      receiverId,
      'friend_request',
      'New Friend Request',
      `${friendRequest.sender.displayName} sent you a friend request`,
      { requestId: friendRequest.id, senderId },
      prisma
    );
    if (io) broadcastNotification(receiverId, notification, io);

    res.status(201).json({
      success: true,
      message: 'Friend request sent',
      data: friendRequest,
    });
  } catch (error) {
    logger.error('SendRequest error:', error);
    res.status(500).json({ success: false, message: 'Failed to send friend request' });
  }
}

/**
 * PATCH /api/friends/request/:requestId/accept
 */
export async function acceptRequest(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as RequestWithUser).user.id;
    const requestId = req.params.requestId as string;

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    if (!friendRequest) {
      res.status(404).json({ success: false, message: 'Friend request not found' });
      return;
    }
    if (friendRequest.receiverId !== userId) {
      res.status(403).json({ success: false, message: 'Not authorized to accept this request' });
      return;
    }
    if (friendRequest.status !== 'pending') {
      res.status(400).json({ success: false, message: 'Request is no longer pending' });
      return;
    }

    // Ensure user_id_1 < user_id_2 for the friendship
    const uid1 = friendRequest.senderId < userId ? friendRequest.senderId : userId;
    const uid2 = friendRequest.senderId < userId ? userId : friendRequest.senderId;

    const [, friendship] = await prisma.$transaction([
      prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'accepted' },
      }),
      prisma.friendship.create({
        data: { userId1: uid1, userId2: uid2 },
      }),
      // Auto-create sharing permissions (both directions)
      prisma.locationSharingPermission.upsert({
        where: { ownerId_viewerId: { ownerId: friendRequest.senderId, viewerId: userId } },
        create: { ownerId: friendRequest.senderId, viewerId: userId, isActive: false },
        update: {},
      }),
      prisma.locationSharingPermission.upsert({
        where: { ownerId_viewerId: { ownerId: userId, viewerId: friendRequest.senderId } },
        create: { ownerId: userId, viewerId: friendRequest.senderId, isActive: false },
        update: {},
      }),
    ]);

    // Send notification to sender
    const io = getIO(req);
    const receiverName = (friendRequest as any).receiver?.displayName || 'Friend';
    const notification = await createNotification(
      friendRequest.senderId,
      'friend_accepted',
      'Friend Request Accepted',
      `${receiverName} accepted your friend request`,
      { friendshipId: friendship.id, friendId: userId },
      prisma
    );
    if (io) broadcastNotification(friendRequest.senderId, notification, io);

    res.json({
      success: true,
      message: 'Friend request accepted',
      data: friendship,
    });
  } catch (error) {
    logger.error('AcceptRequest error:', error);
    res.status(500).json({ success: false, message: 'Failed to accept friend request' });
  }
}

/**
 * PATCH /api/friends/request/:requestId/reject
 */
export async function rejectRequest(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as RequestWithUser).user.id;
    const requestId = req.params.requestId as string;

    const friendRequest = await prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!friendRequest) {
      res.status(404).json({ success: false, message: 'Friend request not found' });
      return;
    }
    if (friendRequest.receiverId !== userId) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }
    if (friendRequest.status !== 'pending') {
      res.status(400).json({ success: false, message: 'Request is no longer pending' });
      return;
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'rejected' },
    });

    res.json({ success: true, message: 'Friend request rejected' });
  } catch (error) {
    logger.error('RejectRequest error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject friend request' });
  }
}

/**
 * DELETE /api/friends/request/:requestId
 */
export async function cancelRequest(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as RequestWithUser).user.id;
    const requestId = req.params.requestId as string;

    const friendRequest = await prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!friendRequest) {
      res.status(404).json({ success: false, message: 'Friend request not found' });
      return;
    }
    if (friendRequest.senderId !== userId) {
      res.status(403).json({ success: false, message: 'Not authorized to cancel this request' });
      return;
    }
    if (friendRequest.status !== 'pending') {
      res.status(400).json({ success: false, message: 'Request is no longer pending' });
      return;
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'cancelled' },
    });

    res.json({ success: true, message: 'Friend request cancelled' });
  } catch (error) {
    logger.error('CancelRequest error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel friend request' });
  }
}

/**
 * DELETE /api/friends/:friendId
 */
export async function removeFriend(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as RequestWithUser).user.id;
    const friendId = req.params.friendId as string;

    const uid1 = userId < friendId ? userId : friendId;
    const uid2 = userId < friendId ? friendId : userId;

    const friendship = await prisma.friendship.findUnique({
      where: { userId1_userId2: { userId1: uid1, userId2: uid2 } },
    });
    if (!friendship) {
      res.status(404).json({ success: false, message: 'Friendship not found' });
      return;
    }

    await prisma.$transaction([
      prisma.friendship.delete({ where: { id: friendship.id } }),
      prisma.locationSharingPermission.deleteMany({
        where: {
          OR: [
            { ownerId: userId, viewerId: friendId },
            { ownerId: friendId, viewerId: userId },
          ],
        },
      }),
    ]);

    res.json({ success: true, message: 'Friend removed successfully' });
  } catch (error) {
    logger.error('RemoveFriend error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove friend' });
  }
}

/**
 * POST /api/friends/:userId/block
 */
export async function blockUser(req: Request, res: Response): Promise<void> {
  try {
    const blockerId = (req as RequestWithUser).user.id;
    const blockedId = req.params.userId as string;
    const { reason } = req.body;

    if (blockerId === blockedId) {
      res.status(400).json({ success: false, message: 'Cannot block yourself' });
      return;
    }

    const blocked = await prisma.user.findUnique({ where: { id: blockedId } });
    if (!blocked) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Check if already blocked
    const existing = await prisma.blockedUser.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    if (existing) {
      res.status(409).json({ success: false, message: 'User already blocked' });
      return;
    }

    // Remove friendship if exists
    const uid1 = blockerId < blockedId ? blockerId : blockedId;
    const uid2 = blockerId < blockedId ? blockedId : blockerId;

    await prisma.$transaction([
      prisma.blockedUser.create({ data: { blockerId, blockedId, reason } }),
      prisma.friendship.deleteMany({
        where: { userId1: uid1, userId2: uid2 },
      }),
      prisma.locationSharingPermission.deleteMany({
        where: {
          OR: [
            { ownerId: blockerId, viewerId: blockedId },
            { ownerId: blockedId, viewerId: blockerId },
          ],
        },
      }),
      prisma.friendRequest.updateMany({
        where: {
          OR: [
            { senderId: blockerId, receiverId: blockedId, status: 'pending' },
            { senderId: blockedId, receiverId: blockerId, status: 'pending' },
          ],
        },
        data: { status: 'rejected' },
      }),
    ]);

    res.json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    logger.error('BlockUser error:', error);
    res.status(500).json({ success: false, message: 'Failed to block user' });
  }
}

/**
 * DELETE /api/friends/:userId/block
 */
export async function unblockUser(req: Request, res: Response): Promise<void> {
  try {
    const blockerId = (req as RequestWithUser).user.id;
    const blockedId = req.params.userId as string;

    const block = await prisma.blockedUser.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    if (!block) {
      res.status(404).json({ success: false, message: 'Block record not found' });
      return;
    }

    await prisma.blockedUser.delete({ where: { id: block.id } });
    res.json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    logger.error('UnblockUser error:', error);
    res.status(500).json({ success: false, message: 'Failed to unblock user' });
  }
}

/**
 * GET /api/friends/requests
 */
export async function getPendingRequests(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as RequestWithUser).user.id;

    const [incoming, outgoing] = await Promise.all([
      prisma.friendRequest.findMany({
        where: { receiverId: userId, status: 'pending' },
        include: {
          sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.friendRequest.findMany({
        where: { senderId: userId, status: 'pending' },
        include: {
          receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      success: true,
      data: { incoming, outgoing },
    });
  } catch (error) {
    logger.error('GetPendingRequests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending requests' });
  }
}
