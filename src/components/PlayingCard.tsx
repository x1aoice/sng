import React from 'react';
import type { Card } from '../engine/types';
import { SuitIcon } from './SuitIcon';

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  className?: string;
  tilt?: 'left' | 'right' | 'none';
  dimmed?: boolean;
  highlighted?: boolean;
  animateDeal?: boolean;
  dealDelayMs?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  faceDown = false,
  className = '',
  tilt = 'none',
  dimmed = false,
  highlighted = false,
  animateDeal = false,
  dealDelayMs = 0,
  size = 'md',
}) => {
  const isRed = card?.suit === '♥' || card?.suit === '♦';

  const cardDimensions = {
    sm: 'w-[44px] h-[62px] rounded-lg',
    md: 'w-[50px] h-[72px] rounded-lg',
    lg: 'w-[42px] h-[60px] rounded-lg sm:w-[62px] sm:h-[88px] sm:rounded-xl',
  }[size];

  const faceUpPadding = {
    sm: 'pt-1 pl-1.5 pr-1 pb-1',
    md: 'pt-1.5 pl-2 pr-1.5 pb-1.5',
    lg: 'pt-1.5 pl-1.5 pr-1 pb-1 sm:pt-2.5 sm:pl-2.5 sm:pr-2 sm:pb-2',
  }[size];

  const rankSize = {
    sm: 'text-[14px]',
    md: 'text-[16px]',
    lg: 'text-[15px] sm:text-[20px]',
  }[size];

  const tiltClass =
    tilt === 'left' ? '-rotate-6 -translate-x-1' : tilt === 'right' ? 'rotate-6 translate-x-1' : '';

  const animationClass = animateDeal ? 'animate-card-flip' : '';
  const highlightClass = highlighted
    ? '-translate-y-1 sm:-translate-y-2 ring-2 ring-amber-400 shadow-[0_6px_20px_rgba(251,191,36,0.35)] z-20'
    : '';
  const animationStyle = dealDelayMs ? { animationDelay: `${dealDelayMs}ms` } : undefined;

  if (faceDown || !card) {
    return (
      <div
        className={`relative ${cardDimensions} ${tiltClass} ${animationClass} ${highlightClass} ${className} ${
          dimmed ? 'opacity-40 grayscale' : 'opacity-100'
        } bg-white text-neutral-900 border border-neutral-200/90 shadow-sm flex items-center justify-center transition-all duration-300 select-none overflow-hidden p-0`}
        style={{
          boxShadow: '0 2px 8px -1px rgba(0,0,0,0.06), 0 1px 3px -1px rgba(0,0,0,0.04)',
          ...animationStyle,
        }}
      >
        {/* Pure Minimalist White Card Back - Iconic Polaris Star Mark (Dead Center, Small & Refined) */}
        <svg
          viewBox={size === 'sm' ? '0 0 44 62' : '0 0 60 84'}
          className="w-full h-full text-neutral-900 select-none pointer-events-none"
          fill="none"
        >
          <g
            transform={
              size === 'sm'
                ? 'translate(22, 31) scale(0.85)'
                : 'translate(30, 42) scale(1.18)'
            }
          >
            {/* Modern Polaris 4-Point Concave Star */}
            <path
              d="M 0,-7.5 C 0.5,-2.2 2.2,-0.5 7.5,0 C 2.2,0.5 0.5,2.2 0,7.5 C -0.5,2.2 -2.2,0.5 -7.5,0 C -2.2,-0.5 -0.5,-2.2 0,-7.5 Z"
              fill="currentColor"
            />
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`relative ${cardDimensions} ${faceUpPadding} ${tiltClass} ${animationClass} ${highlightClass} ${className} ${
        dimmed ? 'opacity-35 grayscale' : 'opacity-100'
      } bg-white border border-neutral-200/90 shadow-sm flex flex-col transition-all duration-300 select-none overflow-hidden`}
      style={{
        boxShadow: '0 2px 8px -1px rgba(0,0,0,0.06), 0 1px 3px -1px rgba(0,0,0,0.04)',
        ...animationStyle,
      }}
    >
      {/* Top-Left Corner Index with refined typographic hierarchy */}
      <div className="flex flex-col items-center leading-none self-start">
        <span
          className={`${rankSize} font-bold tracking-tight leading-none ${
            isRed ? 'text-rose-600' : 'text-neutral-900'
          }`}
          style={{
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
