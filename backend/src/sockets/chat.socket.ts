import { Server as SocketIOServer, Socket } from 'socket.io';
import prisma from '../config/database';
import logger from '../utils/logger';

export function registerChatHandlers(io: SocketIOServer, socket: Socket) {
  const userId = socket.data.userId;

  socket.on('conversation:join', (conversationId: string) => {
    socket.join(`conversation:${conversationId}`);
    logger.info(`User ${userId} joined room conversation:${conversationId}`);
  });

  socket.on('conversation:leave', (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on('typing:start', ({ conversationId }: { conversationId: string }) => {
    socket.to(`conversation:${conversationId}`).emit('typing:user', {
      conversationId,
      userId,
      isTyping: true,
    });
  });

  socket.on('typing:stop', ({ conversationId }: { conversationId: string }) => {
    socket.to(`conversation:${conversationId}`).emit('typing:user', {
      conversationId,
      userId,
      isTyping: false,
    });
  });

  socket.on('message:send', async ({ conversationId, content, type = 'text' }: { conversationId: string; content: string; type?: string }) => {
    try {
      if (!content || !content.trim()) return;

      // Verify membership
      const member = await prisma.conversationMember.findUnique({
        where: { conversationId_userId: { conversationId, userId } },
      });

      if (!member) return;

      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: content.trim(),
          type: (type as any) || 'text',
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
        data: { lastMessageAt: new Date() },
      });

      io.to(`conversation:${conversationId}`).emit('message:received', message);

      // Notify all other members outside room
      const otherMembers = await prisma.conversationMember.findMany({
        where: { conversationId, userId: { not: userId } },
      });

      for (const m of otherMembers) {
        io.to(`user:${m.userId}`).emit('message:notification', {
          conversationId,
          message,
        });
      }
    } catch (error) {
      logger.error('Error handling socket message:send:', error);
    }
  });
}
