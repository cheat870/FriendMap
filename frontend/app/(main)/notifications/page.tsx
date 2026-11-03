'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { notificationsApi } from '@/services/api';
import { Bell, Check, Trash2, UserPlus, MessageSquare, MapPin, Navigation, CheckCircle2 } from 'lucide-react';
import { formatLastSeen } from '@/services/location.service';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationsApi.getAll();
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('បានសម្គាល់ថាបានអានទាំងអស់ (All marked as read)');
    } catch (e) {
      toast.error('បរាជ័យក្នុងការធ្វើបច្ចុប្បន្នភាព');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationsApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast('បានលុបការជូនដំណឹង (Deleted)');
    } catch (e) {
      toast.error('បរាជ័យក្នុងការលុប');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
      case 'friend_accepted':
        return <UserPlus className="w-5 h-5 text-indigo-600" />;
      case 'new_message':
        return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case 'location_sharing_started':
      case 'location_sharing_stopped':
        return <MapPin className="w-5 h-5 text-emerald-600" />;
      case 'navigation_started':
        return <Navigation className="w-5 h-5 text-cyan-600" />;
      case 'arrival':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <MainLayout title="ការជូនដំណឹង (Notifications)" showNav={true} showBottom={true}>
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Header action */}
        {notifications.length > 0 && unreadCount > 0 && (
          <div className="flex justify-between items-center px-1">
            <span className="text-xs text-gray-500">
              មិនទាន់អាន (Unread): <b className="text-indigo-600">{unreadCount}</b>
            </span>
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>អានទាំងអស់ (Mark all as read)</span>
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-gray-400">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">កំពុងផ្ទុកការជូនដំណឹង...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-bold text-gray-800 text-sm">មិនមានការជូនដំណឹងថ្មីទេ</h3>
            <p className="text-xs text-gray-400 mt-1">
              You are all caught up! No notifications right now.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkAsRead(n.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  n.isRead
                    ? 'bg-white border-gray-100 text-gray-700'
                    : 'bg-indigo-50/50 border-indigo-100 text-gray-900 shadow-sm'
                }`}
              >
                <div className="p-2 rounded-xl bg-white shadow-sm border border-gray-100 shrink-0">
                  {getNotificationIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-sm truncate">{n.title}</h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                    )}
                  </div>
                  {n.body && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {n.body}
                    </p>
                  )}
                  <span className="text-[10px] text-gray-400 mt-1.5 block">
                    {formatLastSeen(n.createdAt)}
                  </span>
                </div>

                <button
                  onClick={(e) => handleDelete(n.id, e)}
                  className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-white transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
