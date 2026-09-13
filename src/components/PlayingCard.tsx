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
        {/* Luxury Modern Ribbon Ace Card Back - 100% White Stock */}
        <svg
          viewBox="0 0 60 84"
          className="w-full h-full text-neutral-900 select-none pointer-events-none"
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
            strokeWidth="0.75"
            strokeOpacity="0.22"
          />

          {/* Medium & Large Card Luxury Flourishes */}
          {size !== 'sm' && (
            <>
              <rect
                x="6"
                y="6"
                width="48"
                height="72"
                rx="6"
                stroke="currentColor"
                strokeWidth="0.4"
                strokeOpacity="0.12"
              />
              {/* Corner Diamond Pips */}
              <polygon points="8.5,7 9.5,8.5 8.5,10 7.5,8.5" fill="currentColor" fillOpacity="0.25" />
              <polygon points="51.5,7 52.5,8.5 51.5,10 50.5,8.5" fill="currentColor" fillOpacity="0.25" />
              <polygon points="8.5,74 9.5,75.5 8.5,77 7.5,75.5" fill="currentColor" fillOpacity="0.25" />
              <polygon points="51.5,74 52.5,75.5 51.5,77 50.5,75.5" fill="currentColor" fillOpacity="0.25" />
              {/* Concentric Medallion Rings */}
              <circle cx="30" cy="42" r="20" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.16" />
              <circle cx="30" cy="42" r="17" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1 1.5" strokeOpacity="0.22" />
            </>
          )}

          {/* Swiss Starburst Compass Logo - Clean Luxury Geometry */}
          <g transform={`translate(30, ${size === 'sm' ? 34 : 42})`}>
            {/* Concentric Bezel Seal Rings */}
            <circle
              cx="0"
              cy="0"
              r={size === 'sm' ? 12 : 18}
              stroke="currentColor"
              strokeWidth={size === 'sm' ? 0.6 : 0.75}
              strokeOpacity={size === 'sm' ? 0.22 : 0.2}
            />
            <circle
              cx="0"
              cy="0"
              r={size === 'sm' ? 10 : 15}
              stroke="currentColor"
              strokeWidth="0.4"
              strokeDasharray="0.8 1.2"
              strokeOpacity={size === 'sm' ? 0.18 : 0.18}
            />

            {/* Subtle Cross-hair Axis */}
            <line
              x1={size === 'sm' ? -12 : -18}
              y1={0}
              x2={size === 'sm' ? 12 : 18}
              y2={0}
              stroke="currentColor"
              strokeWidth={size === 'sm' ? 0.5 : 0.6}
              strokeOpacity={size === 'sm' ? 0.2 : 0.25}
            />
            <line
              x1={0}
              y1={size === 'sm' ? -12 : -18}
              x2={0}
              y2={size === 'sm' ? 12 : 18}
              stroke="currentColor"
              strokeWidth={size === 'sm' ? 0.5 : 0.6}
              strokeOpacity={size === 'sm' ? 0.2 : 0.25}
            />
            {/* Primary 8-Point Sharp Star */}
            <path
              d={
                size === 'sm'
                  ? 'M 0,-9 Q 0,0 9,0 Q 0,0 0,9 Q 0,0 -9,0 Q 0,0 0,-9 Z'
                  : 'M 0,-13 Q 0,0 13,0 Q 0,0 0,13 Q 0,0 -13,0 Q 0,0 0,-13 Z'
              }
              fill="currentColor"
            />
            {/* Secondary Rotated Facet Rays */}
            <path
              d={
                size === 'sm'
                  ? 'M 0,-5.5 Q 0,0 5.5,0 Q 0,0 0,5.5 Q 0,0 -5.5,0 Q 0,0 0,-5.5 Z'
                  : 'M 0,-8 Q 0,0 8,0 Q 0,0 0,8 Q 0,0 -8,0 Q 0,0 0,-8 Z'
              }
              fill="#ffffff"
              transform="rotate(45)"
            />
            {/* Core Gem */}
            <circle cx="0" cy="0" r={size === 'sm' ? 1.5 : 2} fill="currentColor" />
            {size !== 'sm' && <circle cx="0" cy="0" r="0.8" fill="#ffffff" />}
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
