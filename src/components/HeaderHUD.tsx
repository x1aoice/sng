import React from 'react';
import { Play, Pause } from 'lucide-react';
import { getBlindForHand } from '../engine/gameEngine';
import type { GameState } from '../engine/gameEngine';
import { formatTokens } from '../utils/format';

interface HeaderHUDProps {
  gameState: GameState;
  isPaused: boolean;
  onTogglePause: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  gameState,
  isPaused,
  onTogglePause,
}) => {
  const handNum = Math.max(1, gameState.handNumber);
  const currentBlind = getBlindForHand(handNum);

  return (
    <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-3 pb-1 flex items-center justify-between select-none">
      {/* Blind Level Pill */}
      <div className="flex items-center gap-2 bg-white/95 px-3.5 py-1.5 rounded-full border border-neutral-200/90 shadow-2xs text-xs whitespace-nowrap">
        <span className="text-neutral-500 font-medium">Hand #{handNum}</span>
        <span className="text-neutral-300">·</span>
        <span className="font-bold text-neutral-900">
          {formatTokens(currentBlind.sb)} / {formatTokens(currentBlind.bb)}
        </span>
        <span className="text-[10px] text-amber-700 bg-amber-50 font-semibold px-2 py-0.5 rounded-full border border-amber-200/70 ml-0.5">
          x2 next hand
        </span>
      </div>

      {/* Pure Minimalist Pause / Resume Button */}
      <button
        type="button"
        onClick={onTogglePause}
        aria-label={isPaused ? 'Resume' : 'Pause'}
        className={`w-8 h-8 rounded-full border transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center select-none ${
          isPaused
            ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs hover:bg-neutral-800'
            : 'bg-white/95 hover:bg-white text-neutral-600 hover:text-neutral-900 border-neutral-200/90 hover:border-neutral-300 shadow-2xs hover:shadow-xs'
        }`}
      >
        {isPaused ? (
          <Play className="w-3.5 h-3.5 fill-current" />
        ) : (
          <Pause className="w-3.5 h-3.5 fill-current" />
        )}
      </button>
    </header>
  );
};
