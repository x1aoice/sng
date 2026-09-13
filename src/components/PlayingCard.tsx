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
        {/* Pure Minimalist White Card Back - Cute Chibi Bubble Fish Logo (Zero borders/frames) */}
        <svg
          viewBox={size === 'sm' ? '0 0 44 62' : '0 0 60 84'}
          className="w-full h-full text-neutral-900 select-none pointer-events-none"
          fill="none"
        >
          <g
            transform={
              size === 'sm'
                ? 'translate(22, 19) scale(0.68)'
                : 'translate(30, 42) scale(0.95)'
            }
          >
            {/* Cute Little Bubble with shine */}
            <circle cx="16" cy="-10" r="1.8" fill="currentColor" />
            <circle cx="16.5" cy="-10.5" r="0.6" fill="#ffffff" />
            {/* Chubby Round Fish Body */}
            <path
              d="M 12,-1 C 12,-9 1,-13 -8,-10 C -16,-7 -18,-2 -19,1 C -18,4 -15,10 -7,10 C 2,10 12,6 12,-1 Z"
              fill="currentColor"
            />
            {/* Cute Butterfly/Scallop Tail */}
            <path
              d="M -17,1 C -21,-4 -26,-7 -29,-6 C -27,-1 -25,1 -27,3 C -25,3 -23,4 -21,6 C -20,4 -18,2 -17,1 Z"
              fill="currentColor"
            />
            {/* Adorable Dorsal Fin */}
            <path
              d="M -3,-10 C 0,-14 5,-14 6,-9 C 2,-10 0,-10 -3,-10 Z"
              fill="currentColor"
            />
            {/* Flutter Pectoral Fin with negative space */}
            <ellipse cx="-1" cy="4" rx="4" ry="2.2" transform="rotate(-30 -1 4)" fill="#ffffff" />
            <ellipse cx="-1.5" cy="4" rx="2.8" ry="1.5" transform="rotate(-30 -1.5 4)" fill="currentColor" />
            {/* Giant Sparkly Anime Chibi Eye */}
            <circle cx="4.5" cy="-2.5" r="3.6" fill="#ffffff" />
            <circle cx="5.2" cy="-2.5" r="2.4" fill="currentColor" />
            <circle cx="6.2" cy="-3.3" r="1.0" fill="#ffffff" />
            <circle cx="4.2" cy="-1.5" r="0.5" fill="#ffffff" />
            {/* Cute Pout Mouth */}
            <path d="M 12,-2 C 14,-1.5 14,-0.5 12,0 Z" fill="currentColor" />
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
