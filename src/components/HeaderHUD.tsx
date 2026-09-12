import React from 'react';
import { Volume2, VolumeX, Zap, RotateCcw, ListCollapse } from 'lucide-react';
import { getBlindForHand, TOTAL_PRIZE_POOL, PAYOUT_FIRST_PLACE, PAYOUT_SECOND_PLACE } from '../engine/gameEngine';
import type { GameState } from '../engine/gameEngine';
import { formatTokens } from '../utils/format';

interface HeaderHUDProps {
  gameState: GameState;
  soundEnabled: boolean;
  onToggleSound: () => void;
  speed: number;
  onToggleSpeed: () => void;
  onResetGame: () => void;
  onToggleLogs: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  gameState,
  soundEnabled,
  onToggleSound,
  speed,
  onToggleSpeed,
  onResetGame,
  onToggleLogs,
}) => {
  const currentBlind = getBlindForHand(Math.max(1, gameState.handNumber));
  const activeCount = gameState.players.filter((p) => !p.eliminated).length;

  return (
    <header className="w-full max-w-5xl mx-auto px-4 py-3 flex items-center justify-between select-none">
      {/* Left: Tournament & Blind Info */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-neutral-200/90 shadow-2xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-neutral-800 tracking-tight">6-Max Hyper SNG</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full border border-neutral-200/90 shadow-2xs text-xs text-neutral-500 font-medium">
          <span>Hand #{Math.max(1, gameState.handNumber)}</span>
          <span className="text-neutral-300">·</span>
          <span className="text-neutral-900 font-semibold">
            {formatTokens(currentBlind.sb)} / {formatTokens(currentBlind.bb)}
          </span>
          <span className="text-[10px] text-amber-700 bg-amber-50 font-medium px-1.5 py-0.2 rounded-full border border-amber-200/60 ml-0.5">
            x2 next hand
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full border border-neutral-200/90 shadow-2xs text-xs text-neutral-500">
          <span>Prize:</span>
          <span className="font-semibold text-neutral-900">{formatTokens(TOTAL_PRIZE_POOL)}</span>
          <span className="text-[11px] text-neutral-400 font-normal">
            (1st {formatTokens(PAYOUT_FIRST_PLACE)} · 2nd {formatTokens(PAYOUT_SECOND_PLACE)})
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-neutral-200/90 shadow-2xs text-xs text-neutral-500">
          <span>Players:</span>
          <span className="font-semibold text-neutral-800">{activeCount} / 6</span>
        </div>
      </div>

      {/* Right: Controls (Sound, Speed, Reset, Logs) */}
      <div className="flex items-center gap-2">
        {/* Speed Toggle */}
        <button
          type="button"
          onClick={onToggleSpeed}
          aria-label={`Speed: ${speed}x`}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
            speed === 2
              ? 'bg-neutral-900 text-white border-neutral-900'
              : 'bg-white text-neutral-600 border-neutral-200/90 hover:bg-neutral-50 shadow-2xs'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{speed}x</span>
        </button>

        {/* Sound Toggle */}
        <button
          type="button"
          onClick={onToggleSound}
          aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          className="w-8 h-8 rounded-full bg-white border border-neutral-200/90 hover:bg-neutral-50 shadow-2xs flex items-center justify-center text-neutral-600 transition-all cursor-pointer"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-neutral-400" />}
        </button>

        {/* Action Logs Toggle */}
        <button
          type="button"
          onClick={onToggleLogs}
          aria-label="Hand history"
          className="w-8 h-8 rounded-full bg-white border border-neutral-200/90 hover:bg-neutral-50 shadow-2xs flex items-center justify-center text-neutral-600 transition-all cursor-pointer"
        >
          <ListCollapse className="w-4 h-4" />
        </button>

        {/* Restart Game */}
        <button
          type="button"
          onClick={onResetGame}
          aria-label="Reset tournament"
          className="w-8 h-8 rounded-full bg-white border border-neutral-200/90 hover:bg-neutral-50 shadow-2xs flex items-center justify-center text-neutral-600 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};

