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
        {/* Pure Minimalist White Card Back - Iconic Refined Kitsuné Fox Logo (Zero frames/borders) */}
        <svg
          viewBox={size === 'sm' ? '0 0 44 62' : '0 0 60 84'}
          className="w-full h-full text-neutral-900 select-none pointer-events-none"
          fill="none"
        >
          <g
            transform={
              size === 'sm'
                ? 'translate(22, 27) scale(0.95)'
                : 'translate(30, 42) scale(1.25)'
            }
          >
            {/* Geometric Fox Silhouette */}
            <polygon
              points={
                size === 'sm'
                  ? '0,-7 8.5,-16 7.5,-3 14,3 0,16 -14,3 -7.5,-3 -8.5,-16'
                  : '0,-8 9.5,-18 8.5,-4 15.5,3 0,18 -15.5,3 -8.5,-4 -9.5,-18'
              }
              fill="currentColor"
            />
            {/* White Ear Negative-Space Insets */}
            <polygon
              points={
                size === 'sm'
                  ? '6.5,-12 5.5,-5 2.5,-7.5'
                  : '7.5,-13 6.5,-5 3,-8'
              }
              fill="#ffffff"
            />
            <polygon
              points={
                size === 'sm'
                  ? '-6.5,-12 -5.5,-5 -2.5,-7.5'
                  : '-7.5,-13 -6.5,-5 -3,-8'
              }
              fill="#ffffff"
            />
            {/* Symmetrical White Cheek Masks */}
            <polygon
              points={
                size === 'sm'
                  ? '0,3 7,3 0,12.5'
                  : '0,3.5 8,3.5 0,14'
              }
              fill="#ffffff"
            />
            <polygon
              points={
                size === 'sm'
                  ? '0,3 -7,3 0,12.5'
                  : '0,3.5 -8,3.5 0,14'
              }
              fill="#ffffff"
            />
            {/* Keen Fox Eyes */}
            <circle
              cx={size === 'sm' ? 3.5 : 4}
              cy={size === 'sm' ? 1.5 : 1.8}
              r={size === 'sm' ? 0.9 : 1.1}
              fill="currentColor"
            />
            <circle
              cx={size === 'sm' ? -3.5 : -4}
              cy={size === 'sm' ? 1.5 : 1.8}
              r={size === 'sm' ? 0.9 : 1.1}
              fill="currentColor"
            />
            {/* Sleek Nose Tip */}
            <circle
              cx="0"
              cy={size === 'sm' ? 13.5 : 15}
              r={size === 'sm' ? 0.9 : 1.1}
              fill="currentColor"
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
