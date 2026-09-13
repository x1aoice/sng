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
        {/* Pure Minimalist White Card Back - Dynamic Leaping Koi Fish Logo (Zero borders/frames) */}
        <svg
          viewBox={size === 'sm' ? '0 0 44 62' : '0 0 60 84'}
          className="w-full h-full text-neutral-900 select-none pointer-events-none"
          fill="none"
        >
          <g
            transform={
              size === 'sm'
                ? 'translate(22, 20) rotate(-25) scale(0.65)'
                : 'translate(30, 42) rotate(-25) scale(0.95)'
            }
          >
            {/* Fluid arching body */}
            <path
              d="M 18,-1 C 13,-7 2,-10 -8,-7 C -16,-4 -22,0 -23,1 C -21,2 -15,7 -6,8 C 4,9 14,5 18,-1 Z"
              fill="currentColor"
            />
            {/* Elegant sweeping tail */}
            <path
              d="M -21,1 C -25,-4 -30,-9 -34,-10 C -31,-3 -30,1 -31,1 C -30,1 -30,5 -33,12 C -29,9 -25,5 -21,1 Z"
              fill="currentColor"
            />
            {/* Swept dorsal fin */}
            <path
              d="M -4,-8 C 2,-15 10,-13 11,-5 C 5,-7 -1,-7 -4,-8 Z"
              fill="currentColor"
            />
            {/* Graceful pectoral fin */}
            <path
              d="M 5,6 C 3,12 -1,15 -4,14 C -3,11 2,7 5,6 Z"
              fill="currentColor"
            />
            {/* Subtle ventral fin */}
            <path
              d="M -10,6 C -12,9 -15,10 -16,10 C -15,8 -12,6 -10,6 Z"
              fill="currentColor"
            />
            {/* Negative-Space Eye */}
            <circle cx="12" cy="-2.5" r="1.3" fill="#ffffff" />
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
