import React, { useRef, useEffect } from 'react';
import type { Card } from '../engine/types';
import { PlayingCard } from './PlayingCard';

interface CommunityCardsProps {
  cards: Card[];
  phase: string;
  winningCardKeys?: Set<string>;
}

export const CommunityCards: React.FC<CommunityCardsProps> = ({
  cards,
  phase,
  winningCardKeys,
}) => {
  const prevCountRef = useRef(0);

  useEffect(() => {
    prevCountRef.current = cards.length;
  }, [cards.length]);

  const isShowdown = phase === 'showdown' || phase === 'hand_ended';
  const hasWinningCards = isShowdown && winningCardKeys && winningCardKeys.size > 0;
  const slots = [0, 1, 2, 3, 4];

  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5">
      {slots.map((idx) => {
        const card = cards[idx];
        if (card) {
          const cardKey = `${card.rank}-${card.suit}`;
          const isWinningCard = hasWinningCards && winningCardKeys?.has(cardKey);
          const isDimmed = hasWinningCards && !isWinningCard;

          // Staggered deal animation for new street cards
          const isNewlyDealt = idx >= prevCountRef.current;
          let dealDelay = 0;
          if (isNewlyDealt && cards.length === 3) {
            dealDelay = idx * 75; // Flop stagger: 0ms, 75ms, 150ms
          }

          return (
            <PlayingCard
              key={`comm-${idx}-${cardKey}`}
              card={card}
              faceDown={false}
              size="lg"
              animateDeal={isNewlyDealt}
              dealDelayMs={dealDelay}
              highlighted={isWinningCard}
              dimmed={isDimmed}
            />
          );
        }

        return (
          <div
            key={`comm-placeholder-${idx}`}
            className="w-[42px] h-[60px] sm:w-[62px] sm:h-[88px] rounded-lg sm:rounded-xl border border-dashed border-neutral-200/80 bg-white/40 flex items-center justify-center text-neutral-300 transition-all duration-300"
          >
            <span className="text-xs">·</span>
          </div>
        );
      })}
    </div>
  );
};
