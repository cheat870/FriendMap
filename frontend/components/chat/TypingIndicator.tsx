'use client';

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-2xl w-fit border border-gray-100 shadow-sm mb-3">
      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}
