'use client';

import { Check, X } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';

interface FriendRequestCardProps {
  request: any;
  type: 'incoming' | 'outgoing';
  onAccept?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
}

export default function FriendRequestCard({
  request,
  type,
  onAccept,
  onReject,
  onCancel,
}: FriendRequestCardProps) {
  const targetUser = type === 'incoming' ? request.sender : request.receiver;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar
          src={targetUser?.avatarUrl}
          name={targetUser?.displayName || targetUser?.username}
          size="md"
        />

        <div className="min-w-0">
          <h4 className="font-bold text-gray-900 text-sm truncate">
            {targetUser?.displayName}
          </h4>
          <p className="text-xs text-gray-400 truncate">@{targetUser?.username}</p>
          {request.message && (
            <p className="text-xs text-gray-600 mt-1 italic truncate">
              "{request.message}"
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {type === 'incoming' ? (
          <>
            <Button
              size="sm"
              variant="primary"
              className="px-3 py-1.5 rounded-xl text-xs flex items-center gap-1"
              onClick={() => onAccept && onAccept(request.id)}
            >
              <Check className="w-3.5 h-3.5" />
              <span>យល់ព្រម</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="p-2 text-gray-400 hover:text-red-500 rounded-xl"
              onClick={() => onReject && onReject(request.id)}
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="text-xs text-gray-500 hover:text-red-600 border-gray-200 rounded-xl"
            onClick={() => onCancel && onCancel(request.id)}
          >
            បោះបង់ (Cancel)
          </Button>
        )}
      </div>
    </div>
  );
}
