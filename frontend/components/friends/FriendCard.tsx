'use client';

import { MapPin, Navigation, MessageSquare, MoreVertical, Radio } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { formatDistance, formatLastSeen } from '@/services/location.service';

interface FriendCardProps {
  friend: any;
  userLocation: { latitude: number; longitude: number } | null;
  onLocate: (friend: any) => void;
  onChat: (friend: any) => void;
  onNavigate: (friend: any) => void;
}

export default function FriendCard({
  friend,
  userLocation,
  onLocate,
  onChat,
  onNavigate,
}: FriendCardProps) {
  const isOnline = friend.isOnline || (friend.lastActiveAt && (Date.now() - new Date(friend.lastActiveAt).getTime()) < 300000);
  const hasLocation = Boolean(friend.location?.latitude && friend.location?.longitude);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="relative">
          <Avatar
            src={friend.avatarUrl}
            name={friend.displayName || friend.username}
            size="md"
          />
          <span
            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
              isOnline ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
          />
        </div>

        <div className="min-w-0">
          <h4 className="font-bold text-gray-900 text-sm truncate">
            {friend.displayName}
          </h4>
          <p className="text-xs text-gray-400 truncate">@{friend.username}</p>

          <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
            {hasLocation && friend.distanceMeters !== undefined ? (
              <span className="flex items-center gap-1 text-indigo-600 font-medium">
                <MapPin className="w-3 h-3" />
                {formatDistance(friend.distanceMeters)}
              </span>
            ) : (
              <span className="text-gray-400">ទីតាំងត្រូវបានបិទ (Hidden)</span>
            )}

            {isOnline ? (
              <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                <Radio className="w-3 h-3 animate-pulse" /> Live
              </span>
            ) : friend.lastActiveAt ? (
              <span>{formatLastSeen(friend.lastActiveAt)}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {hasLocation && (
          <button
            onClick={() => onNavigate(friend)}
            className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
            title="Directions"
          >
            <Navigation className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => onChat(friend)}
          className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          title="Chat"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        {hasLocation && (
          <button
            onClick={() => onLocate(friend)}
            className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
            title="Locate on Map"
          >
            <MapPin className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
