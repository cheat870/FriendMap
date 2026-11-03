'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import Avatar from '@/components/ui/Avatar';
import { chatApi } from '@/services/api';
import { MessageSquare, Search, Clock } from 'lucide-react';
import { formatLastSeen } from '@/services/location.service';

function ChatListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const friendIdParam = searchParams.get('friendId');

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Auto-open or create direct conversation if friendIdParam is provided
  useEffect(() => {
    if (friendIdParam) {
      chatApi.getOrCreateDirect(friendIdParam).then((res) => {
        if (res.data?.conversation) {
          router.replace(`/chat/${res.data.conversation.id}`);
        }
      });
    }
  }, [friendIdParam, router]);

  useEffect(() => {
    chatApi
      .getConversations()
      .then((res) => {
        if (res.data?.conversations) {
          setConversations(res.data.conversations);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ស្វែងរកសារ... (Search messages)"
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
        />
      </div>

      {/* Conversations list */}
      {loading ? (
        <div className="py-12 text-center text-gray-400">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">កំពុងផ្ទុកសារ...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-800 text-sm">មិនទាន់មានការសន្ទនានៅឡើយ</h3>
          <p className="text-xs text-gray-400 mt-1 mb-5">
            Select a friend from the friends list to start chatting!
          </p>
          <button
            onClick={() => router.push('/friends')}
            className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-2xl text-xs hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
          >
            ស្វែងរកមិត្តភក្តិ (Find Friends)
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((conv) => (
            <div
              key={conv.id}
              onClick={() => router.push(`/chat/${conv.id}`)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:border-indigo-300 transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <Avatar
                  src={conv.otherUser?.avatarUrl}
                  name={conv.name}
                  size="md"
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-gray-900 text-sm truncate">
                    {conv.name}
                  </h4>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {conv.lastMessage?.content || 'បានចាប់ផ្តើមការសន្ទនា'}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                {conv.lastMessageAt && (
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatLastSeen(conv.lastMessageAt)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChatListPage() {
  return (
    <MainLayout title="សារ (Messages)" showNav={true} showBottom={true}>
      <Suspense
        fallback={
          <div className="py-12 text-center text-gray-400">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">កំពុងផ្ទុកសារ...</p>
          </div>
        }
      >
        <ChatListContent />
      </Suspense>
    </MainLayout>
  );
}
