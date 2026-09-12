import React from 'react';
import type { Card } from '../engine/types';
import { PlayingCard } from './PlayingCard';

interface CommunityCardsProps {
  cards: Card[];
  phase: string;
}

export const CommunityCards: React.FC<CommunityCardsProps> = ({ cards, phase }) => {
  const slots = [0, 1, 2, 3, 4];
  const isActive = phase !== 'idle';

  return (
    <div className="flex items-center gap-2 sm:gap-2.5">
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

        if (isActive) {
          return (
            <PlayingCard
              key={`comm-empty-${idx}`}
              faceDown={true}
              size="lg"
            />
          );
        }

        return (
          <div
            key={`comm-placeholder-${idx}`}
            className="w-[62px] h-[88px] rounded-xl border border-dashed border-neutral-200/80 bg-white/40 flex items-center justify-center text-neutral-300"
          >
            <span className="text-xs">·</span>
          </div>
        );
      })}
    </div>
  );
};
