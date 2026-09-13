import React from 'react';
import type { Card } from '../engine/types';
import { PlayingCard } from './PlayingCard';

interface CommunityCardsProps {
  cards: Card[];
  phase: string;
}

export const CommunityCards: React.FC<CommunityCardsProps> = ({ cards }) => {
  const slots = [0, 1, 2, 3, 4];

  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5">
      {slots.map((idx) => {
        const card = cards[idx];
        if (card) {
          return (
            <PlayingCard
              key={`comm-${idx}-${card.rank}-${card.suit}`}
              card={card}
              faceDown={false}
              size="lg"
            />
          );
        }



        return (
          <div
            key={`comm-placeholder-${idx}`}
            className="w-[42px] h-[60px] sm:w-[62px] sm:h-[88px] rounded-lg sm:rounded-xl border border-dashed border-neutral-200/80 bg-white/40 flex items-center justify-center text-neutral-300"
          >
            <span className="text-xs">·</span>
          </div>
        );
      })}
    </div>
  );
};
