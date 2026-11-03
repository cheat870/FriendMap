import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/services/api';
import { useSocket } from '@/hooks/useSocket';
import { Message, Conversation } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export function useConversations() {
  const qc = useQueryClient();
  const { socket } = useSocket();

  const query = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await chatApi.conversations();
      return data as Conversation[];
    },
    staleTime: 30_000,
  });

  // Refresh conversations when a new message arrives on any conversation
  useEffect(() => {
    if (!socket) return;
    const handle = () => qc.invalidateQueries({ queryKey: ['conversations'] });
    socket.on('message:received', handle);
    return () => { socket.off('message:received', handle); };
  }, [socket, qc]);

  return query;
}

export function useMessages(conversationId: string) {
  const qc = useQueryClient();
  const { socket } = useSocket();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data } = await chatApi.messages(conversationId);
      return data as Message[];
    },
    enabled: !!conversationId,
    staleTime: 5_000,
  });

  // Listen for new messages on this conversation
  useEffect(() => {
    if (!socket || !conversationId) return;
    const handle = (msg: Message) => {
      if (msg.conversationId !== conversationId) return;
      qc.setQueryData<Message[]>(['messages', conversationId], (old = []) =>
        [...old.filter((m) => m.id !== msg.id), msg].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      );
    };
    socket.on('message:received', handle);
    return () => { socket.off('message:received', handle); };
  }, [socket, conversationId, qc]);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const { data } = await chatApi.sendMessage(conversationId, content);
      return data as Message;
    },
    onMutate: async (content: string) => {
      // Optimistic update
      const tempMsg: Message = {
        id: `temp-${Date.now()}`,
        conversationId,
        senderId: user?.id ?? '',
        sender: user as Message['sender'],
        content,
        type: 'text',
        status: 'sending',
        readAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      qc.setQueryData<Message[]>(['messages', conversationId], (old = []) => [
        ...old,
        tempMsg,
      ]);
      return { tempMsg };
    },
    onSuccess: (msg, _content, ctx) => {
      qc.setQueryData<Message[]>(['messages', conversationId], (old = []) =>
        old.map((m) => (m.id === ctx?.tempMsg.id ? msg : m))
      );
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (_err, _content, ctx) => {
      qc.setQueryData<Message[]>(['messages', conversationId], (old = []) =>
        old.map((m) =>
          m.id === ctx?.tempMsg.id ? { ...m, status: 'failed' as const } : m
        )
      );
      toast.error('Failed to send message');
    },
  });

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!socket) return;
      socket.emit(isTyping ? 'typing:start' : 'typing:stop', { conversationId });
    },
    [socket, conversationId]
  );

  return { query, sendMessage, sendTyping };
}

export function useChat(conversationId: string) {
  return useMessages(conversationId);
}
