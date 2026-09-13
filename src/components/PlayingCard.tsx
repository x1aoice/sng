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
        } bg-[#18181b] text-white border border-neutral-800/90 shadow-sm flex items-center justify-center transition-all duration-300 select-none overflow-hidden p-0`}
        style={{
          boxShadow: '0 2px 8px -1px rgba(0,0,0,0.18), 0 1px 3px -1px rgba(0,0,0,0.12)',
        }}
      >
        {/* Luxury Modern Apex Sovereign Spade Card Back */}
        <svg
          viewBox="0 0 60 84"
          className="w-full h-full text-white select-none pointer-events-none"
          fill="none"
        >
          {/* Refined Inset Border */}
          <rect
            x="3.5"
            y="3.5"
            width="53"
            height="77"
            rx={size === 'lg' ? 7 : 5}
            stroke="currentColor"
            strokeWidth="0.8"
            strokeOpacity="0.25"
          />

          {/* Corner Diamond Pips (for medium & large cards) */}
          {size !== 'sm' && (
            <>
              <polygon points="7,7 8.5,8.5 7,10 5.5,8.5" fill="currentColor" fillOpacity="0.35" />
              <polygon points="53,7 54.5,8.5 53,10 51.5,8.5" fill="currentColor" fillOpacity="0.35" />
              <polygon points="7,77 8.5,75.5 7,74 5.5,75.5" fill="currentColor" fillOpacity="0.35" />
              <polygon points="53,77 54.5,75.5 53,74 51.5,75.5" fill="currentColor" fillOpacity="0.35" />
              {/* Concentric Medallion Rings */}
              <circle cx="30" cy="42" r="21" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.2" />
              <circle cx="30" cy="42" r="18" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 1.5" strokeOpacity="0.3" />
            </>
          )}

          {/* Center Master Apex Spade */}
          <g transform={`translate(30, ${size === 'sm' ? 34 : 42}) ${size === 'sm' ? 'scale(0.85)' : 'scale(1)'}`}>
            {/* Spade Outer Body */}
            <path
              d="M 0,-18 C -3,-11 -15,-2 -15,7 C -15,14 -10,18 -3.5,18 C -1,18 0,16.5 0,16.5 C 0,16.5 1,18 3.5,18 C 10,18 15,14 15,7 C 15,-2 3,-11 0,-18 Z"
              fill="currentColor"
            />
            {/* Geometric Stem */}
            <path d="M -2,16.5 L -4,22 L 4,22 L 2,16.5 Z" fill="currentColor" />
            {/* Center Chiseled Facet Division */}
            <path d="M 0,-17 L 0,16" stroke="#18181b" strokeWidth="0.8" strokeOpacity="0.6" />
            {/* Radiant Negative-Space Star Gem Core */}
            <path
              d="M 0,-4.5 Q 0,0 4.5,0 Q 0,0 0,4.5 Q 0,0 -4.5,0 Q 0,0 0,-4.5 Z"
              fill="#18181b"
            />
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
