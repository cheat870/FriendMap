'use client';

import { Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  message: any;
  isSelf: boolean;
}

export default function MessageBubble({ message, isSelf }: MessageBubbleProps) {
  const timeFormatted = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`flex flex-col mb-3 ${isSelf ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isSelf
            ? 'bg-indigo-600 text-white rounded-br-none'
            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
        }`}
      >
        <p className="break-words">{message.content}</p>
      </div>

      <div className={`flex items-center gap-1 mt-1 text-[10px] text-gray-400 px-1`}>
        <span>{timeFormatted}</span>
        {isSelf && (
          <CheckCheck className="w-3.5 h-3.5 text-indigo-500" />
        )}
      </div>
    </div>
  );
}
