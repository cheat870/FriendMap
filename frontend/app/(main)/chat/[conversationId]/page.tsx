'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { chatApi } from '@/services/api';
import MessageBubble from '@/components/chat/MessageBubble';
import TypingIndicator from '@/components/chat/TypingIndicator';
import Avatar from '@/components/ui/Avatar';
import { ArrowLeft, Send } from 'lucide-react';

export default function ConversationRoomPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;

  const { user } = useAuth();
  const { socket } = useSocket();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!conversationId) return;

    chatApi
      .getMessages(conversationId)
      .then((res) => {
        if (res.data?.messages) {
          setMessages(res.data.messages);
        }
      })
      .finally(() => {
        setLoading(false);
        setTimeout(scrollToBottom, 100);
      });
  }, [conversationId]);

  // Join conversation socket room
  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit('conversation:join', conversationId);

    const handleMessageReceived = (msg: any) => {
      if (msg.conversationId === conversationId) {
        setMessages((prev) => [...prev, msg]);
        setTimeout(scrollToBottom, 50);
      }
    };

    const handleTypingUser = (data: any) => {
      if (data.conversationId === conversationId && data.userId !== user?.id) {
        setIsFriendTyping(data.isTyping);
      }
    };

    socket.on('message:received', handleMessageReceived);
    socket.on('typing:user', handleTypingUser);

    return () => {
      socket.emit('conversation:leave', conversationId);
      socket.off('message:received', handleMessageReceived);
      socket.off('typing:user', handleTypingUser);
    };
  }, [socket, conversationId, user?.id]);

  // Handle typing debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (socket) {
      socket.emit('typing:start', { conversationId });
      setTimeout(() => {
        socket.emit('typing:stop', { conversationId });
      }, 2500);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !conversationId) return;

    const text = inputText.trim();
    setInputText('');

    try {
      if (socket) {
        socket.emit('message:send', { conversationId, content: text });
      } else {
        const res = await chatApi.sendMessage(conversationId, text);
        if (res.data?.message) {
          setMessages((prev) => [...prev, res.data.message]);
          setTimeout(scrollToBottom, 50);
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-20 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/chat')}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Avatar name="Friend" size="sm" />
          <div>
            <h3 className="font-bold text-gray-900 text-sm">ការសន្ទនា (Chat)</h3>
            <p className="text-[11px] text-emerald-600 font-medium">Live Active</p>
          </div>
        </div>
      </header>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="py-12 text-center text-gray-400">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">កំពុងផ្ទុកប្រវត្តិសារ...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 text-xs py-12">
            ចាប់ផ្តើមការសន្ទនាជាមួយមិត្តភក្តិរបស់អ្នក!
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isSelf={msg.senderId === user?.id}
            />
          ))
        )}

        {isFriendTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <footer className="p-3 bg-white border-t border-gray-100 shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-lg mx-auto">
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="សរសេរសារនៅទីនេះ... (Write a message)"
            className="flex-1 bg-gray-100 text-gray-900 text-sm rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-11 h-11 bg-indigo-600 disabled:opacity-50 hover:bg-indigo-700 active:scale-95 text-white rounded-2xl flex items-center justify-center shadow-md shadow-indigo-200 transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>
    </div>
  );
}
