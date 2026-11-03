'use client';

import { useRouter } from 'next/navigation';
import { Navigation, MessageSquare, ExternalLink, X, MapPin, Clock } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { formatDistance, formatLastSeen, getGoogleMapsUrl } from '@/services/location.service';

interface FriendDetailSheetProps {
  friend: any;
  userLocation: { latitude: number; longitude: number } | null;
  onClose: () => void;
  onGetDirections: (friend: any) => void;
}

export default function FriendDetailSheet({
  friend,
  userLocation,
  onClose,
  onGetDirections,
}: FriendDetailSheetProps) {
  const router = useRouter();

  if (!friend) return null;

  const loc = friend.location;
  const isOnline = friend.isOnline || (friend.lastActiveAt && (Date.now() - new Date(friend.lastActiveAt).getTime()) < 300000);

  const googleMapsUrl = userLocation && loc
    ? getGoogleMapsUrl(userLocation.latitude, userLocation.longitude, Number(loc.latitude), Number(loc.longitude))
    : '#';

  return (
    <div className="fixed inset-x-0 bottom-16 sm:bottom-6 sm:max-w-md sm:mx-auto z-40 p-4 slide-up">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100 p-5 overflow-hidden relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Friend info row */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <Avatar
              src={friend.avatarUrl}
              name={friend.displayName || friend.username}
              size="lg"
            />
            <span
              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                isOnline ? 'bg-emerald-500' : 'bg-gray-400'
              }`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-lg truncate">
              {friend.displayName}
            </h3>
            <p className="text-xs text-gray-500 truncate">@{friend.username}</p>

            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-600">
              {friend.distanceMeters !== undefined && (
                <span className="flex items-center gap-1 font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  <MapPin className="w-3.5 h-3.5" />
                  {formatDistance(friend.distanceMeters)}
                </span>
              )}

              {loc?.recordedAt && (
                <span className="flex items-center gap-1 text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  {formatLastSeen(loc.recordedAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="grid grid-cols-2 gap-2.5 mt-2">
          <Button
            variant="primary"
            className="flex items-center justify-center gap-2 py-3 rounded-2xl shadow-md shadow-indigo-200"
            onClick={() => onGetDirections(friend)}
          >
            <Navigation className="w-4 h-4" />
            <span>រកផ្លូវ (Directions)</span>
          </Button>

          <Button
            variant="secondary"
            className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200"
            onClick={() => router.push(`/chat?friendId=${friend.id}`)}
          >
            <MessageSquare className="w-4 h-4" />
            <span>ផ្ញើសារ (Chat)</span>
          </Button>
        </div>

        {/* Google Maps link */}
        {loc && (
          <div className="mt-3 text-center">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-indigo-600 transition-colors"
            >
              <span>បើកក្នុង Google Maps (Open in Google Maps)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
