import React from 'react';
import { Volume2, VolumeX, Zap, RotateCcw, History, Play, Pause } from 'lucide-react';
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
  isPaused: boolean;
  onTogglePause: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  gameState,
  soundEnabled,
  onToggleSound,
  speed,
  onToggleSpeed,
  onResetGame,
  onToggleLogs,
  isPaused,
  onTogglePause,
}) => {
  const handNum = Math.max(1, gameState.handNumber);
  const currentBlind = getBlindForHand(handNum);
  const activeCount = gameState.players.filter((p) => !p.eliminated).length;

  return (
    <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-3 pb-1 flex items-center justify-between gap-3 select-none">
      {/* Left: Tournament & Blind Info (Always visible!) */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Tournament Badge */}
        <div className="flex items-center gap-2 bg-white/95 px-3 py-1.5 rounded-full border border-neutral-200/90 shadow-2xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-neutral-800 tracking-tight whitespace-nowrap">
            6-Max Hyper SNG
          </span>
        </div>

        {/* Blind Level Pill (Always Visible!) */}
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

        {/* Prize Pool Pill (Hidden on mobile, visible on md+) */}
        <div className="hidden md:flex items-center gap-1.5 bg-white/95 px-3.5 py-1.5 rounded-full border border-neutral-200/90 shadow-2xs text-xs text-neutral-500 whitespace-nowrap">
          <span>Prize:</span>
          <span className="font-bold text-neutral-900">{formatTokens(TOTAL_PRIZE_POOL)}</span>
          <span className="text-[11px] text-neutral-400 font-normal">
            (1st {formatTokens(PAYOUT_FIRST_PLACE)} · 2nd {formatTokens(PAYOUT_SECOND_PLACE)})
          </span>
        </div>

        {/* Players Count (Hidden on mobile/tablet, visible on lg+) */}
        <div className="hidden lg:flex items-center gap-1.5 bg-white/95 px-3 py-1.5 rounded-full border border-neutral-200/90 shadow-2xs text-xs text-neutral-500 whitespace-nowrap">
          <span>Players:</span>
          <span className="font-bold text-neutral-800">{activeCount} / 6</span>
        </div>
      </div>

      {/* Right: Consolidated Controls (Pause, Speed, Sound, Logs, Reset) */}
      <div className="flex items-center gap-2">
        {/* Pause / Resume Button */}
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

        {/* Speed Toggle */}
        <button
          type="button"
          onClick={onToggleSpeed}
          aria-label={`Speed: ${speed}x`}
          className={`flex items-center gap-1 px-2.5 h-8 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none active:scale-95 ${
            speed === 2
              ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs hover:bg-neutral-800'
              : 'bg-white/95 hover:bg-white text-neutral-600 hover:text-neutral-900 border-neutral-200/90 hover:border-neutral-300 shadow-2xs hover:shadow-xs'
          }`}
        >
          <Zap className="w-3 h-3" />
          <span>{speed}x</span>
        </button>

        {/* Sound Toggle */}
        <button
          type="button"
          onClick={onToggleSound}
          aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          className="w-8 h-8 rounded-full bg-white/95 hover:bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200/90 hover:border-neutral-300 shadow-2xs hover:shadow-xs flex items-center justify-center transition-all cursor-pointer select-none active:scale-95"
        >
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
          )}
        </button>

        {/* Hand History Toggle */}
        <button
          type="button"
          onClick={onToggleLogs}
          aria-label="Hand history"
          className="w-8 h-8 rounded-full bg-white/95 hover:bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200/90 hover:border-neutral-300 shadow-2xs hover:shadow-xs flex items-center justify-center transition-all cursor-pointer select-none active:scale-95"
        >
          <History className="w-3.5 h-3.5" />
        </button>

        {/* Restart Game */}
        <button
          type="button"
          onClick={onResetGame}
          aria-label="Reset tournament"
          className="w-8 h-8 rounded-full bg-white/95 hover:bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200/90 hover:border-neutral-300 shadow-2xs hover:shadow-xs flex items-center justify-center transition-all cursor-pointer select-none active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};

