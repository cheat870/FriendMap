import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../utils/logger';

export async function getConversations(req: Request, res: Response) {
  try {
    const userId = req.user!.id;

    const memberships = await prisma.conversationMember.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                    lastActiveAt: true,
                    status: true,
                  },
                },
              },
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                content: true,
                type: true,
                createdAt: true,
                senderId: true,
              },
            },
          },
        },
      },
      orderBy: { conversation: { lastMessageAt: 'desc' } },
    });

    const conversations = memberships.map((m) => {
      const conv = m.conversation;
      const otherMember = conv.members.find((member) => member.userId !== userId)?.user;
      const lastMessage = conv.messages[0] || null;

      return {
        id: conv.id,
        type: conv.type,
        name: conv.name || otherMember?.displayName || 'Chat',
        otherUser: otherMember || null,
        lastMessage,
        lastMessageAt: conv.lastMessageAt,
        joinedAt: m.joinedAt,
      };
    });

    return res.json({ conversations });
  } catch (error) {
    logger.error('Error fetching conversations:', error);
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
}

export async function getOrCreateDirectConversation(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ error: 'friendId is required' });
    }

    if (userId === friendId) {
      return res.status(400).json({ error: 'Cannot chat with yourself' });
    }

    const u1 = userId < friendId ? userId : friendId;
    const u2 = userId < friendId ? friendId : userId;
    const friendship = await prisma.friendship.findUnique({
      where: { userId1_userId2: { userId1: u1, userId2: u2 } },
    });

    if (!friendship) {
      return res.status(403).json({ error: 'You can only message approved friends' });
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        type: 'direct',
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: friendId } } },
        ],
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                lastActiveAt: true,
              },
            },
          },
        },
      },
    });

    if (existing) {
      return res.json({ conversation: existing });
    }

    const newConv = await prisma.conversation.create({
      data: {
        type: 'direct',
        createdBy: userId,
        members: {
          create: [
            { userId },
            { userId: friendId },
          ],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                lastActiveAt: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json({ conversation: newConv });
  } catch (error) {
    logger.error('Error creating direct conversation:', error);
    return res.status(500).json({ error: 'Failed to open conversation' });
  }
}

export async function getMessages(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.conversationId as string;
    const { limit = 50, before } = req.query;

    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!member) {
      return res.status(403).json({ error: 'Not a member of this conversation' });
    }

    const where: any = { conversationId, isDeleted: false };
    if (before) {
      where.createdAt = { lt: new Date(String(before)) };
    }

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit), 100),
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    await prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });

    return res.json({ messages: messages.reverse() });
  } catch (error) {
    logger.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Failed to get messages' });
  }
}

export async function sendMessage(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.conversationId as string;
    const { content, type = 'text' } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }

    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!member) {
      return res.status(403).json({ error: 'Not authorized to send messages in this conversation' });
    }

    const now = new Date();

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: content.trim(),
        type,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: now },
    });

    const io = (req.app as any).get('io');
    if (io) {
      io.to(`conversation:${conversationId}`).emit('message:received', message);

      const otherMembers = await prisma.conversationMember.findMany({
        where: {
          conversationId,
          userId: { not: userId },
        },
      });

      for (const m of otherMembers) {
        io.to(`user:${m.userId}`).emit('message:notification', {
          conversationId,
          message,
        });
      }
    }

    return res.status(201).json({ message });
  } catch (error) {
    logger.error('Error sending message:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}
