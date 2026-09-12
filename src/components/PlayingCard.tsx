import React from 'react';
import type { Card } from '../engine/types';
import { SuitIcon } from './SuitIcon';

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  className?: string;
  tilt?: 'left' | 'right' | 'none';
  dimmed?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  faceDown = false,
  className = '',
  tilt = 'none',
  dimmed = false,
  size = 'md',
}) => {
  const isRed = card?.suit === '♥' || card?.suit === '♦';

  const sizeClasses = {
    sm: 'w-[44px] h-[62px] rounded-lg pt-1 pl-1.5 pr-1 pb-1',
    md: 'w-[50px] h-[72px] rounded-lg pt-1.5 pl-2 pr-1.5 pb-1.5',
    lg: 'w-[62px] h-[88px] rounded-xl pt-2.5 pl-2.5 pr-2 pb-2',
  }[size];

  const tiltClass =
    tilt === 'left' ? '-rotate-6 -translate-x-1' : tilt === 'right' ? 'rotate-6 translate-x-1' : '';

  if (faceDown || !card) {
    return (
      <div
        className={`relative ${sizeClasses} ${tiltClass} ${className} ${
          dimmed ? 'opacity-40 grayscale' : 'opacity-100'
        } bg-white border border-neutral-200/90 shadow-sm flex items-center justify-center transition-all duration-300 select-none overflow-hidden`}
        style={{
          boxShadow: '0 2px 8px -1px rgba(0,0,0,0.06), 0 1px 3px -1px rgba(0,0,0,0.04)',
        }}
      >
        {/* OpenAI-style swirl/spiral logo for card back */}
        <svg
          viewBox="0 0 24 24"
          className={`${size === 'lg' ? 'w-7 h-7' : 'w-4 h-4'} ${
            size === 'sm' ? '-translate-y-2' : ''
          } text-neutral-800`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a10 10 0 0 1 10 10c0 4.418-2.865 8.166-6.839 9.489A10.026 10.026 0 0 1 12 22C6.477 22 2 17.523 2 12S6.477 2 12 2z" strokeOpacity="0.15" />
          <path d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0z" />
          <path d="M12 7.5A4.5 4.5 0 0 1 16.5 12" />
          <path d="M8.5 9.5a4.5 4.5 0 0 1 7 5" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`relative ${sizeClasses} ${tiltClass} ${className} ${
        dimmed ? 'opacity-35 grayscale' : 'opacity-100'
      } bg-white border border-neutral-200/90 shadow-sm flex flex-col transition-all duration-300 select-none overflow-hidden`}
      style={{
        boxShadow: '0 2px 8px -1px rgba(0,0,0,0.06), 0 1px 3px -1px rgba(0,0,0,0.04)',
      }}
    >
      {/* Top-Left Corner Index with refined typographic hierarchy */}
      <div className="flex flex-col items-center leading-none self-start">
        <span
          className={`font-bold tracking-tight leading-none ${
            isRed ? 'text-rose-600' : 'text-neutral-900'
          }`}
          style={{
            fontSize: size === 'sm' ? '14px' : size === 'md' ? '16px' : '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
          }}
        >
          {card.rank === 'T' ? '10' : card.rank}
        </span>
        <div
          className={`mt-0.5 flex items-center justify-center ${
            isRed ? 'text-rose-600' : 'text-neutral-900'
          }`}
        >
          <SuitIcon
            suit={card.suit}
            size={size === 'sm' ? 10 : size === 'md' ? 12 : 14}
          />
        </div>
      </div>
    </div>
  );
};
