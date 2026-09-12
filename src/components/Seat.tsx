import React from 'react';
import type { Player } from '../engine/types';
import { PlayingCard } from './PlayingCard';
import { PlayerAvatar } from './Avatars';
import { formatCurrency } from '../utils/format';

interface SeatProps {
  player: Player;
  isDealer: boolean;
  isCurrentTurn: boolean;
  positionClass: string;
  showCards?: boolean;
  handPhase: string;
}

export const Seat: React.FC<SeatProps> = ({
  player,
  isDealer,
  isCurrentTurn,
  positionClass,
  showCards = false,
  handPhase,
}) => {
  const hasCards = player.cards.length === 2 && !player.folded && !player.eliminated;
  const isHero = player.isUser;
  const revealCards = (isHero || showCards) && hasCards;


  // Calculate dealer button position:
  // For right-side seats (4 & 5: Sophia, Leo), place cleanly on the left of the capsule (towards table center).
  // For all other seats (0, 1, 2, 3: Hero, Alex, Elena, Marcus), place cleanly on the right of the capsule.
  // Uses exact pixel offsets to ensure 0px overlap with the capsule and a clean 2px separation on the felt.
  const getDealerButtonStyle = (seatIndex: number): React.CSSProperties => {
    if (seatIndex === 4 || seatIndex === 5) {
      return {
        left: -22,
        top: '50%',
        transform: 'translateY(-50%)',
      };
    }
    return {
      right: -22,
      top: '50%',
      transform: 'translateY(-50%)',
    };
  };

  return (
    <div
      className={`absolute select-none transition-all duration-300 ${positionClass} ${
        player.eliminated ? 'opacity-35 grayscale pointer-events-none' : ''
      }`}
    >
      <div className="relative flex flex-col items-center">
        {/* Hole cards (Hero and revealed opponents get full-size lg cards) */}
        {hasCards && (
          <div
            className={`absolute z-0 pointer-events-none transition-all duration-300 flex ${
              revealCards
                ? '-top-[50px] sm:-top-[54px] -space-x-3.5'
                : '-top-7 sm:-top-[32px] -space-x-2.5'
            }`}
          >
            <PlayingCard
              card={player.cards[0]}
              faceDown={!revealCards}
              tilt="left"
              size={revealCards ? 'lg' : 'sm'}
            />
            <PlayingCard
              card={player.cards[1]}
              faceDown={!revealCards}
              tilt="right"
              size={revealCards ? 'lg' : 'sm'}
            />
          </div>
        )}

        {/* Main Seat Capsule - Tightly wrapped with symmetric padding */}
        <div className="relative flex items-center z-10">
          <div
            className={`flex items-center gap-2.5 bg-white pl-1.5 pr-4 py-1.5 rounded-full border transition-all duration-300 whitespace-nowrap ${
              isCurrentTurn
                ? 'border-sky-400 ring-2 ring-sky-100 shadow-md'
                : 'border-neutral-200/80 shadow-xs'
            } ${player.folded ? 'opacity-40' : 'opacity-100'}`}
            style={{
              boxShadow: isCurrentTurn
                ? '0 0 0 2px rgba(56, 189, 248, 0.25), 0 4px 14px rgba(0,0,0,0.06)'
                : '0 1px 4px rgba(0,0,0,0.03)',
            }}
          >
            {/* High-end vector portrait avatar */}
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 shadow-2xs">
              <PlayerAvatar name={player.name} />
            </div>

            {/* Player Name and Chip Count */}
            <div className="flex flex-col text-left justify-center leading-none">
              <span className="text-[13px] font-semibold text-neutral-900 tracking-tight leading-none">
                {player.name}
              </span>

              <span className="text-xs font-medium text-neutral-400 tracking-tight leading-none mt-1 whitespace-nowrap">
                {player.eliminated
                  ? `Rank #${player.finishRank || 'Out'}`
                  : formatCurrency(player.chips)}
              </span>
            </div>
          </div>

          {/* Dealer Button Badge - Sits right beside the capsule with 0px overlap and 2px clean gap */}
          {isDealer && (
            <div
              className="absolute w-5 h-5 rounded-full bg-neutral-900 text-white font-bold text-[10px] flex items-center justify-center shadow-md border-[1.5px] border-white z-20 select-none pointer-events-none transition-all duration-300"
              style={{
                ...getDealerButtonStyle(player.seatIndex),
                boxShadow: '0 2px 6px rgba(0,0,0,0.22)',
              }}
            >
              D
            </div>
          )}
        </div>

        {/* Status Pill (Thinking, Bet, or Check) - positioned consistently directly under each player's capsule */}
        {isCurrentTurn && handPhase !== 'hand_ended' ? (
          <div className="absolute top-[calc(100%+6px)] left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/95 px-2.5 py-0.5 rounded-full border border-neutral-200/80 shadow-xs text-[11px] text-neutral-500 font-medium whitespace-nowrap z-20">
            <span className="flex items-center gap-0.5 text-neutral-400">
              <span className="w-1 h-1 rounded-full bg-neutral-400 animate-pulse-dot" />
              <span className="w-1 h-1 rounded-full bg-neutral-400 animate-pulse-dot" style={{ animationDelay: '0.2s' }} />
              <span className="w-1 h-1 rounded-full bg-neutral-400 animate-pulse-dot" style={{ animationDelay: '0.4s' }} />
            </span>
            <span>Thinking</span>
            <span className="text-neutral-300">·</span>
            <span
              className={`font-semibold tabular-nums transition-colors duration-200 ${
                (player.thinkingSeconds ?? 30) <= 8
                  ? 'text-rose-500 font-bold animate-pulse'
                  : 'text-neutral-700'
              }`}
            >
              {player.thinkingSeconds ?? 30}s
            </span>
          </div>
        ) : !player.folded && player.currentBet > 0 ? (
          <div className="absolute top-[calc(100%+6px)] left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white px-2.5 py-0.5 rounded-full border border-neutral-200/80 shadow-xs text-[11px] font-medium whitespace-nowrap z-20">
            <span className="text-neutral-400 text-[11px]">{player.isAllIn ? 'All-in' : 'Bet'}</span>
            <span className="font-semibold text-neutral-900 text-[11px]">{formatCurrency(player.currentBet)}</span>
          </div>
        ) : !player.folded && player.lastAction?.type === 'check' ? (
          <div className="absolute top-[calc(100%+6px)] left-1/2 -translate-x-1/2 flex items-center bg-white px-3 py-0.5 rounded-full border border-neutral-200/80 shadow-xs text-[11px] font-medium text-neutral-700 whitespace-nowrap z-20">
            Check
          </div>
        ) : null}
      </div>
    </div>
  );
};
