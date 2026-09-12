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
        } bg-white border border-neutral-200/90 shadow-sm flex items-center justify-center transition-all duration-300 select-none overflow-hidden p-0`}
        style={{
          boxShadow: '0 2px 8px -1px rgba(0,0,0,0.06), 0 1px 3px -1px rgba(0,0,0,0.04)',
        }}
      >
        {/* Luxury Symmetric Casino Poker Card Back */}
        <svg
          viewBox="0 0 100 144"
          preserveAspectRatio="none"
          className="w-full h-full text-neutral-800"
          fill="none"
          stroke="currentColor"
        >
          <defs>
            {/* Background Luxury Diamond Lattice Pattern */}
            <pattern id="card-lattice" width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M 3,0 L 6,3 L 3,6 L 0,3 Z" fill="none" stroke="currentColor" strokeWidth="0.3" strokeOpacity="0.07" />
            </pattern>

            {/* Refined Spade Half with Intaglio Engraved Faceting */}
            <g id="spade-half">
              <path
                d="M 50,36 C 46.8,42 36.5,49 36.5,56 C 36.5,61 40.5,63.8 45,63.8 C 48,63.8 50,61.8 50,60.5"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="0.75"
                strokeLinejoin="round"
              />
              <path
                d="M 49.2,39 C 46.5,43.5 39,50 39,56 C 39,59.5 41.5,61.8 45,61.8 C 47.2,61.8 49.2,60.2 49.2,60.2"
                stroke="#ffffff"
                strokeWidth="0.75"
                fill="none"
                strokeLinecap="round"
                strokeOpacity="0.45"
              />
            </g>

            {/* Full Symmetrical Top Spade */}
            <g id="top-spade">
              <use href="#spade-half" />
              <use href="#spade-half" transform="translate(100, 0) scale(-1, 1)" />
              {/* Spade Stem */}
              <path
                d="M 48.2,60 C 48.2,62.5 45.8,64.5 44.5,65.5 L 55.5,65.5 C 54.2,64.5 51.8,62.5 51.8,60 Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="0.6"
                strokeLinejoin="round"
              />
              {/* Central hairline slit */}
              <line x1="50" y1="37" x2="50" y2="64" stroke="#ffffff" strokeWidth="0.7" strokeOpacity="0.75" />
            </g>

            {/* Top Royal Crest (3-Diamond Tiara) */}
            <g id="top-crest">
              <polygon points="50,24.5 52.8,28.5 50,32.5 47.2,28.5" fill="currentColor" />
              <polygon points="42.5,28.5 44.5,30.8 42.5,33 40.5,30.8" fill="currentColor" fillOpacity="0.85" />
              <polygon points="57.5,28.5 59.5,30.8 57.5,33 55.5,30.8" fill="currentColor" fillOpacity="0.85" />
              <path d="M 38.5,31 Q 50,34 61.5,31" stroke="currentColor" strokeWidth="0.7" fill="none" strokeOpacity="0.5" />
            </g>

            {/* Corner Filigree Ornament (Top-Left) */}
            <g id="corner-ornament">
              <polygon points="12.5,12.5 15,15 12.5,17.5 10,15" fill="currentColor" fillOpacity="0.75" />
              <path d="M 9.5,20 L 9.5,9.5 L 20,9.5" stroke="currentColor" strokeWidth="0.8" fill="none" strokeOpacity="0.45" />
              <path d="M 12.5,23 L 12.5,12.5 L 23,12.5" stroke="currentColor" strokeWidth="0.5" fill="none" strokeOpacity="0.25" />
            </g>

            {/* Symmetrical Upper Half Master Group */}
            <g id="card-top-half">
              <use href="#top-spade" />
              <use href="#top-crest" />
              <use href="#corner-ornament" />
              <use href="#corner-ornament" transform="translate(100, 0) scale(-1, 1)" />
              <line x1="50" y1="16" x2="50" y2="23" stroke="currentColor" strokeWidth="0.65" strokeDasharray="1 1.5" strokeOpacity="0.4" />
              <polygon points="50,13 51.6,15 50,17 48.4,15" fill="currentColor" fillOpacity="0.6" />
            </g>
          </defs>

          {/* Crisp Card Stock Background */}
          <rect x="0" y="0" width="100" height="144" rx="8" fill="#ffffff" />

          {/* Casino Inset Borders */}
          <rect x="4.5" y="4.5" width="91" height="135" rx="5.5" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.25" />
          <rect x="7" y="7" width="86" height="130" rx="4" stroke="currentColor" strokeWidth="0.65" strokeOpacity="0.45" />

          {/* Fine Banknote Guilloche Diamond Lattice */}
          <rect x="7" y="7" width="86" height="130" rx="4" fill="url(#card-lattice)" />

          {/* Center Medallion Backdrop: Crisp Circular Cutout */}
          <circle cx="50" cy="72" r="28" fill="#ffffff" />

          {/* Central Rotation Group: Upper Half */}
          <use href="#card-top-half" />

          {/* 180-Degree Rotated Group: Lower Half (Absolute Two-Way Symmetry) */}
          <use href="#card-top-half" transform="rotate(180 50 72)" />

          {/* Concentric Guilloche Medallion Rings */}
          <circle cx="50" cy="72" r="27.5" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
          <circle cx="50" cy="72" r="24.5" stroke="currentColor" strokeWidth="0.75" strokeDasharray="1.2 1.8" strokeOpacity="0.45" />
          <circle cx="50" cy="72" r="21" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
          <circle cx="50" cy="72" r="10.5" stroke="currentColor" strokeWidth="0.65" strokeOpacity="0.35" />

          {/* Lateral Spearpoints (East & West at y=72) */}
          <polygon points="19,72 23.5,70.2 22,72 23.5,73.8" fill="currentColor" fillOpacity="0.7" />
          <line x1="22" y1="72" x2="28" y2="72" stroke="currentColor" strokeWidth="0.65" strokeOpacity="0.5" />

          <polygon points="81,72 76.5,70.2 78,72 76.5,73.8" fill="currentColor" fillOpacity="0.7" />
          <line x1="78" y1="72" x2="72" y2="72" stroke="currentColor" strokeWidth="0.65" strokeOpacity="0.5" />

          {/* Center 8-Point Diamond Star Jewel (✦) */}
          <g transform="translate(50, 72)">
            <path d="M 0,-7.2 Q 0,0 7.2,0 Q 0,0 0,7.2 Q 0,0 -7.2,0 Q 0,0 0,-7.2 Z" fill="currentColor" />
            <path d="M 0,-4.5 Q 0,0 4.5,0 Q 0,0 0,4.5 Q 0,0 -4.5,0 Q 0,0 0,-4.5 Z" fill="currentColor" transform="rotate(45)" fillOpacity="0.85" />
            <polygon points="0,-2.2 2.2,0 0,2.2 -2.2,0" fill="#ffffff" />
            <circle cx="0" cy="0" r="0.7" fill="currentColor" />
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
