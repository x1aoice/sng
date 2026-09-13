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

  const cardDimensions = {
    sm: 'w-[44px] h-[62px] rounded-lg',
    md: 'w-[50px] h-[72px] rounded-lg',
    lg: 'w-[62px] h-[88px] rounded-xl',
  }[size];

  const faceUpPadding = {
    sm: 'pt-1 pl-1.5 pr-1 pb-1',
    md: 'pt-1.5 pl-2 pr-1.5 pb-1.5',
    lg: 'pt-2.5 pl-2.5 pr-2 pb-2',
  }[size];

  const tiltClass =
    tilt === 'left' ? '-rotate-6 -translate-x-1' : tilt === 'right' ? 'rotate-6 translate-x-1' : '';

  if (faceDown || !card) {
    return (
      <div
        className={`relative ${cardDimensions} ${tiltClass} ${className} ${
          dimmed ? 'opacity-40 grayscale' : 'opacity-100'
        } bg-white text-neutral-900 border border-neutral-200/90 shadow-sm flex items-center justify-center transition-all duration-300 select-none overflow-hidden p-0`}
        style={{
          boxShadow: '0 2px 8px -1px rgba(0,0,0,0.06), 0 1px 3px -1px rgba(0,0,0,0.04)',
        }}
      >
        {/* Pure Minimalist White Card Back - Zero internal frames or boxes, single iconic logo */}
        <svg
          viewBox={size === 'sm' ? '0 0 44 62' : '0 0 60 84'}
          className="w-full h-full text-neutral-900 select-none pointer-events-none"
          fill="none"
        >
          <g
            transform={
              size === 'sm'
                ? 'translate(22, 27) scale(0.9)'
                : 'translate(30, 42) scale(1.15)'
            }
          >
            {/* Iconic Radiant 8-Point Diamond Star Compass */}
            <path
              d={
                size === 'sm'
                  ? 'M 0,-11 Q 0,0 11,0 Q 0,0 0,11 Q 0,0 -11,0 Q 0,0 0,-11 Z'
                  : 'M 0,-15 Q 0,0 15,0 Q 0,0 0,15 Q 0,0 -15,0 Q 0,0 0,-15 Z'
              }
              fill="currentColor"
            />
            {/* Secondary Negative-Space Faceted Rays */}
            <path
              d={
                size === 'sm'
                  ? 'M 0,-6.5 Q 0,0 6.5,0 Q 0,0 0,6.5 Q 0,0 -6.5,0 Q 0,0 0,-6.5 Z'
                  : 'M 0,-9 Q 0,0 9,0 Q 0,0 0,9 Q 0,0 -9,0 Q 0,0 0,-9 Z'
              }
              fill="#ffffff"
              transform="rotate(45)"
            />
            {/* Center Core Jewel */}
            <circle cx="0" cy="0" r={size === 'sm' ? 1.8 : 2.5} fill="currentColor" />
            {size !== 'sm' && <circle cx="0" cy="0" r="1" fill="#ffffff" />}
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`relative ${cardDimensions} ${faceUpPadding} ${tiltClass} ${className} ${
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
