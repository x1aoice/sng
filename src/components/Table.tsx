import React, { useMemo, useRef, useState, useEffect } from 'react';
import type { GameState } from '../engine/gameEngine';
import { getBlindForHand } from '../engine/gameEngine';
import type { ActionType } from '../engine/types';
import { Seat } from './Seat';
import { CommunityCards } from './CommunityCards';
import { ActionPanel } from './ActionPanel';
import { formatCurrency, formatTokens } from '../utils/format';
import { Play, Pause } from 'lucide-react';

interface TableProps {
  gameState: GameState;
  onHeroAction: (action: ActionType, amount?: number) => void;
  onStartNextHand: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
}

export const Table: React.FC<TableProps> = ({
  gameState,
  onHeroAction,
  onStartNextHand,
  isPaused,
  onTogglePause,
}) => {
  const hero = gameState.players[0]; // 'You' at seatIndex 0
  const isHeroTurn = gameState.currentTurnSeat === 0;

  const handNum = Math.max(1, gameState.handNumber);
  const currentBlind = getBlindForHand(handNum);

  // Pot bump animation key on value increases
  const [potBumpKey, setPotBumpKey] = useState(0);
  const prevPotRef = useRef(gameState.pot);

  useEffect(() => {
    if (gameState.pot > prevPotRef.current) {
      setPotBumpKey((k) => k + 1);
    }
    prevPotRef.current = gameState.pot;
  }, [gameState.pot]);

  // Compute winning cards for showdown highlights
  const winningCardKeys = useMemo(() => {
    if (gameState.phase !== 'showdown' && gameState.phase !== 'hand_ended') {
      return new Set<string>();
    }
    const keys = new Set<string>();
    for (const r of gameState.handResults) {
      if (r.evaluation?.bestFiveCards) {
        for (const c of r.evaluation.bestFiveCards) {
          keys.add(`${c.rank}-${c.suit}`);
        }
      }
    }
    return keys;
  }, [gameState.phase, gameState.handResults]);

  // Compute winner IDs for seat aura
  const winnerIds = useMemo(() => {
    if (gameState.phase !== 'hand_ended') return new Set<string>();
    return new Set(gameState.handResults.map((r) => r.playerId));
  }, [gameState.phase, gameState.handResults]);

  // 6 radial seating positions along the perimeter of the 700x405 stadium (mathematically symmetric)
  const seatPositions = [
    'left-1/2 top-[100%] -translate-x-1/2 -translate-y-1/2',  // Seat 0: You (bottom center)
    'left-[4%] top-[75%] -translate-x-1/2 -translate-y-1/2',   // Seat 1: Alex (bottom left)
    'left-[4%] top-[25%] -translate-x-1/2 -translate-y-1/2',   // Seat 2: Elena (top left)
    'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2',        // Seat 3: Marcus (top center)
    'left-[96%] top-[25%] -translate-x-1/2 -translate-y-1/2',  // Seat 4: Sophia (top right)
    'left-[96%] top-[75%] -translate-x-1/2 -translate-y-1/2',  // Seat 5: Leo (bottom right)
  ];

  return (
    <div className="relative w-full flex flex-col items-center justify-center select-none pt-6 sm:pt-8 pb-2">
      {/* Top-Right Pure Minimalist Floating Pause/Resume Icon Button */}
      <div className="fixed top-4 right-4 sm:top-5 sm:right-6 z-50">
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
      </div>

      {/* Main Game Area (Turns completely grayscale when paused) */}
      <div
        className={`w-full flex flex-col items-center justify-center transition-all duration-300 ${
          isPaused ? 'grayscale opacity-60 pointer-events-none' : ''
        }`}
      >
        {/* Stadium Poker Table - Expansive 750px x 430px with classic 1.74:1 golden proportion */}
        <div
          className="relative w-[min(750px,82vw)] h-[240px] sm:w-[min(750px,92vw,101vh)] sm:h-auto sm:aspect-[750/430] rounded-full bg-[#f5f5f7] border border-neutral-200/40 transition-all flex items-center justify-center"
          style={{
            boxShadow: '0 2px 20px rgba(0, 0, 0, 0.025)',
          }}
        >
          {/* Center Area: Dead Centered Board (Community Cards, Pot, Blind Level, Announcements) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10">
            {/* Center Pot Pill - Fixed cleanly above community cards with bump pulse on chips increase */}
            <div
              key={`pot-pill-${potBumpKey}`}
              className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3.5 flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-neutral-200/80 shadow-2xs pointer-events-auto whitespace-nowrap transition-all duration-200 ${
                potBumpKey > 0 ? 'animate-pot-bump' : ''
              }`}
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
            >
              <span className="text-xs text-neutral-400 font-normal">Pot</span>
              <span className="text-xs sm:text-[13px] font-bold text-neutral-900 tabular-nums">
                {formatCurrency(gameState.pot)}
              </span>
            </div>

            {/* 5 Community Cards - Locked at the exact geometric center of the table (y=50%, x=50%) */}
            <div className="pointer-events-auto flex items-center justify-center">
              <CommunityCards
                cards={gameState.communityCards}
                phase={gameState.phase}
                winningCardKeys={winningCardKeys}
              />
            </div>

            {/* Sub-center Area below Community Cards (Blind Level, Announcements, Start Button) */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3.5 flex flex-col items-center pointer-events-auto whitespace-nowrap gap-2">

              {/* Hand Result Announcement Banner (Shown on hand_ended) with spring entrance and smooth countdown line */}
              {gameState.phase === 'hand_ended' && gameState.handResults.length > 0 && (() => {
                const heroPlayer = gameState.players.find((p) => p.isUser);
                const isHeroBusted = heroPlayer ? (heroPlayer.eliminated || heroPlayer.chips <= 0) : false;
                const isHeroWinner = gameState.handResults.some((r) => r.playerId === heroPlayer?.id);
                const resultText =
                  gameState.handResults.length > 1
                    ? `${gameState.handResults
                        .map((r) => {
                          const p = gameState.players.find((pl) => pl.id === r.playerId);
                          return p?.isUser ? 'You' : p?.name || 'Player';
                        })
                        .join(' & ')} split the pot`
                    : gameState.handResults[0].description;

                return (
                  <div
                    onClick={onStartNextHand}
                    className="flex flex-col items-center animate-banner-spring cursor-pointer group select-none relative"
                  >
                    <div className="relative overflow-hidden bg-neutral-900 text-white text-[11px] sm:text-[13px] font-medium px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-lg flex items-center justify-center gap-2 max-w-[90vw] whitespace-nowrap group-hover:scale-[1.02] active:scale-95 transition-all">
                      <span>{isHeroBusted ? '💀' : isHeroWinner ? '🏆' : '✨'}</span>
                      <span className="tracking-tight">{resultText}</span>
                      {isHeroBusted ? (
                        <span className="text-neutral-400 text-xs font-normal border-l border-neutral-700 pl-2">
                          Eliminated · View Results
                        </span>
                      ) : (
                        <span className="text-neutral-400 text-[10px] font-normal border-l border-neutral-700 pl-2 group-hover:text-white transition-colors">
                          Tap to skip
                        </span>
                      )}
                      {/* Countdown indicator bar across bottom of pill */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-400 via-indigo-400 to-amber-400 opacity-80"
                        style={{
                          animation: `progress-countdown ${isHeroBusted ? 1.4 : 2.2}s linear forwards`,
                        }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Initial Start Button (Shown in idle phase) */}
              {gameState.phase === 'idle' && (
                <button
                  type="button"
                  onClick={onStartNextHand}
                  className="px-8 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-full shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  Start Tournament
                </button>
              )}

              {/* Blind Level Typography (Pure text, no border/box, hidden when idle or hand_ended) */}
              {gameState.phase !== 'idle' && gameState.phase !== 'hand_ended' && (
                <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium tracking-tight animate-fade-in select-none">
                  <span>Hand #{handNum}</span>
                  <span className="text-neutral-300">·</span>
                  <span className="text-neutral-700 font-semibold">
                    {formatTokens(currentBlind.sb)} / {formatTokens(currentBlind.bb)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 6 Radial Seats Centered on the Stadium Boundary */}
          {gameState.players.map((player) => {
            const isCurrent = gameState.currentTurnSeat === player.seatIndex;
            const isDealer = gameState.dealerSeat === player.seatIndex;
            const isWinner = winnerIds.has(player.id);

            return (
              <Seat
                key={player.id}
                player={player}
                isDealer={isDealer}
                isCurrentTurn={isCurrent}
                positionClass={seatPositions[player.seatIndex]}
                showCards={gameState.showdownCardsRevealed}
                handPhase={gameState.phase}
                isWinner={isWinner}
                winningCardKeys={winningCardKeys}
              />
            );
          })}
        </div>

        {/* Bottom Action Controls Area - Harmoniously spaced below Hero */}
        <div className="w-full flex justify-center mt-12 sm:mt-20 z-30">
          <ActionPanel
            hero={hero}
            pot={gameState.pot}
            currentHighestBet={gameState.currentHighestBet}
            minRaiseAmount={gameState.minRaiseAmount}
            isHeroTurn={isHeroTurn}
            onAction={onHeroAction}
            gamePhase={gameState.phase}
          />
        </div>
      </div>
    </div>
  );
};
