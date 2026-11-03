'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import FriendCard from '@/components/friends/FriendCard';
import FriendRequestCard from '@/components/friends/FriendRequestCard';
import { useLocationContext } from '@/contexts/LocationContext';
import { friendsApi } from '@/services/api';
import { Search, UserPlus, Users, Inbox, UserCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import toast from 'react-hot-toast';

export default function FriendsPage() {
  const router = useRouter();
  const { position } = useLocationContext();

  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'find'>('friends');
  const [friends, setFriends] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Load friends
  const loadFriends = async () => {
    try {
      setLoading(true);
      const res = await friendsApi.getAll();
      if (res.data?.data) {
        setFriends(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load friends:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load pending requests
  const loadRequests = async () => {
    try {
      const res = await friendsApi.getRequests();
      if (res.data?.data) {
        setIncomingRequests(res.data.data.incoming || []);
        setOutgoingRequests(res.data.data.outgoing || []);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    }
  };

  useEffect(() => {
    loadFriends();
    loadRequests();
  }, []);

  // Search users
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await friendsApi.search(searchQuery.trim());
      if (res.data?.data) {
        setSearchResults(res.data.data);
      }
    } catch (err) {
      toast.error('បរាជ័យក្នុងការស្វែងរក (Search failed)');
    } finally {
      setSearching(false);
    }
  };

  // Send friend request
  const handleSendRequest = async (receiverId: string) => {
    try {
      await friendsApi.sendRequest({ receiverId });
      toast.success('បានផ្ញើសំណើមិត្តភក្តិហើយ! (Request sent)');
      setSearchResults((prev) => prev.filter((u) => u.id !== receiverId));
      loadRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'បរាជ័យក្នុងការផ្ញើសំណើ');
    }
  };

  // Accept request
  const handleAcceptRequest = async (requestId: string) => {
    try {
      await friendsApi.acceptRequest(requestId);
      toast.success('បានយល់ព្រមធ្វើជាមិត្តភក្តិ! (Accepted)');
      loadRequests();
      loadFriends();
    } catch (err) {
      toast.error('បរាជ័យក្នុងការយល់ព្រម');
    }
  };

  // Reject request
  const handleRejectRequest = async (requestId: string) => {
    try {
      await friendsApi.rejectRequest(requestId);
      toast('បានបដិសេធសំណើ (Rejected)');
      loadRequests();
    } catch (err) {
      toast.error('បរាជ័យក្នុងការបដិសេធ');
    }
  };

  // Cancel request
  const handleCancelRequest = async (requestId: string) => {
    try {
      await friendsApi.cancelRequest(requestId);
      toast('បានបោះបង់សំណើ (Cancelled)');
      loadRequests();
    } catch (err) {
      toast.error('បរាជ័យក្នុងការបោះបង់');
    }
  };

  return (
    <MainLayout title="មិត្តភក្តិ (Friends)" showNav={true} showBottom={true}>
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Navigation Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-2xl gap-1">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'friends'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>មិត្តភក្តិ ({friends.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 relative ${
              activeTab === 'requests'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>សំណើ ({incomingRequests.length})</span>
            {incomingRequests.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('find')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'find'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>ស្វែងរក</span>
          </button>
        </div>

        {/* Tab 1: Friends List */}
        {activeTab === 'friends' && (
          <div className="space-y-3">
            {loading ? (
              <div className="py-12 text-center text-gray-400">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs">កំពុងផ្ទុកបញ្ជីមិត្តភក្តិ...</p>
              </div>
            ) : friends.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-bold text-gray-800 text-sm">មិនទាន់មានមិត្តភក្តិនៅឡើយ</h3>
                <p className="text-xs text-gray-400 mt-1 mb-5">
                  You don't have any friends added yet.
                </p>
                <Button variant="primary" size="sm" onClick={() => setActiveTab('find')}>
                  ស្វែងរកមិត្តភក្តិឥឡូវនេះ (Find Friends)
                </Button>
              </div>
            ) : (
              friends.map((f) => (
                <FriendCard
                  key={f.id}
                  friend={f}
                  userLocation={position}
                  onLocate={() => router.push('/map')}
                  onChat={(friend) => router.push(`/chat?friendId=${friend.id}`)}
                  onNavigate={(friend) => router.push(`/navigation?friendId=${friend.id}`)}
                />
              ))
            )}
          </div>
        )}

        {/* Tab 2: Requests List */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Incoming Requests */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
                សំណើចូល (Incoming Requests)
              </h3>
              {incomingRequests.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 text-gray-400 text-xs">
                  មិនមានសំណើមិត្តភក្តិថ្មីទេ (No incoming requests)
                </div>
              ) : (
                <div className="space-y-2">
                  {incomingRequests.map((req) => (
                    <FriendRequestCard
                      key={req.id}
                      request={req}
                      type="incoming"
                      onAccept={handleAcceptRequest}
                      onReject={handleRejectRequest}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing Requests */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
                សំណើបានផ្ញើ (Sent Requests)
              </h3>
              {outgoingRequests.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 text-gray-400 text-xs">
                  មិនមានសំណើបានផ្ញើទេ (No sent requests)
                </div>
              ) : (
                <div className="space-y-2">
                  {outgoingRequests.map((req) => (
                    <FriendRequestCard
                      key={req.id}
                      request={req}
                      type="outgoing"
                      onCancel={handleCancelRequest}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Find Users */}
        {activeTab === 'find' && (
          <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ស្វែងរកតាមឈ្មោះ ឬ @username..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                />
              </div>
              <Button type="submit" variant="primary" loading={searching} className="rounded-2xl px-5 text-xs">
                ស្វែងរក
              </Button>
            </form>

            <div className="space-y-2">
              {searchResults.length === 0 && searchQuery && !searching ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 text-gray-400 text-xs">
                  រកមិនឃើញអ្នកប្រើប្រាស់ "{searchQuery}" ទេ
                </div>
              ) : (
                searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatarUrl} name={user.displayName} size="md" />
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{user.displayName}</h4>
                        <p className="text-xs text-gray-400">@{user.username}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      className="rounded-xl text-xs flex items-center gap-1.5"
                      onClick={() => handleSendRequest(user.id)}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>ផ្ញើសំណើ (Add)</span>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
