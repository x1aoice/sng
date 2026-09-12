import React from 'react';

interface ChatBubbleProps {
  message: string;
  seatIndex: number;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, seatIndex }) => {
  if (!message) return null;

  // Compute smart bubble offset based on seat position around the oval table
  // so the bubble always expands toward the felt and doesn't get clipped by viewport
  const getBubblePositionClass = () => {
    switch (seatIndex) {
      case 0: // Hero (bottom center)
        return 'bottom-[calc(100%+14px)] left-1/2 -translate-x-1/2';
      case 1: // Bottom Left
        return 'bottom-[calc(100%+8px)] left-4';
      case 2: // Top Left
        return 'top-[calc(100%+8px)] left-4';
      case 3: // Top Center
        return 'top-[calc(100%+10px)] left-1/2 -translate-x-1/2';
      case 4: // Top Right
        return 'top-[calc(100%+8px)] right-4';
      case 5: // Bottom Right
        return 'bottom-[calc(100%+8px)] right-4';
      default:
        return 'bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2';
    }
  };

  return (
    <div
      className={`absolute z-30 pointer-events-none transition-all duration-300 ${getBubblePositionClass()}`}
    >
      <div
        className="relative bg-white/95 backdrop-blur-xs text-neutral-800 text-[11.5px] sm:text-[12px] font-medium leading-snug px-3 py-1.5 rounded-2xl border border-neutral-200/90 shadow-md max-w-[170px] sm:max-w-[200px] text-center whitespace-normal break-words animate-in fade-in zoom-in-95 duration-200"
        style={{
          boxShadow: '0 4px 14px -1px rgba(0,0,0,0.08), 0 2px 6px -1px rgba(0,0,0,0.04)',
        }}
      >
        <span className="text-sky-500 mr-1 text-[10px]">💬</span>
        {message}
      </div>
    </div>
  );
};
