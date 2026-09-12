import React from 'react';
import type { GameState } from '../engine/gameEngine';
import type { ActionType } from '../engine/types';
import { Seat } from './Seat';
import { CommunityCards } from './CommunityCards';
import { ActionPanel } from './ActionPanel';
import { formatCurrency } from '../utils/format';

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
    <div className="relative w-full flex flex-col items-center justify-center select-none pt-10 sm:pt-12 pb-2">
      {/* Top-Right Pure Circle Pause Button */}
      <div className="absolute top-2 right-4 sm:top-3 sm:right-6 z-40">
        <button
          type="button"
          onClick={onTogglePause}
          title={isPaused ? '继续对局' : '暂停对局'}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 hover:bg-white border transition-all duration-200 active:scale-90 cursor-pointer flex items-center justify-center backdrop-blur-xs ${
            isPaused
              ? 'border-sky-400 ring-2 ring-sky-300/40 shadow-sm text-sky-600'
              : 'border-neutral-200/90 hover:border-neutral-300 shadow-2xs hover:shadow-xs text-neutral-700 hover:text-neutral-900'
          }`}
        >
          {isPaused ? (
            /* Optical center play triangle */
            <svg
              className="w-4 h-4 fill-current translate-x-0.5"
              viewBox="0 0 24 24"
            >
              <path d="M8 5.14v13.72a1 1 0 0 0 1.55.83l10.29-6.86a1 1 0 0 0 0-1.66L9.55 4.31A1 1 0 0 0 8 5.14z" />
            </svg>
          ) : (
            /* Symmetrical rounded pause bars */
            <svg
              className="w-4 h-4 fill-current"
              viewBox="0 0 24 24"
            >
              <rect x="6" y="5" width="3.5" height="14" rx="1.5" />
              <rect x="14.5" y="5" width="3.5" height="14" rx="1.5" />
            </svg>
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
          className="relative w-[750px] max-w-[92vw] h-[430px] max-h-[58vh] rounded-full bg-[#f5f5f7] border border-neutral-200/40 transition-all flex items-center justify-center"
        style={{
          boxShadow: '0 2px 20px rgba(0, 0, 0, 0.025)',
        }}
      >
        {/* Center Area: Rock-solid Dead Centered Board (Community Cards, Pot, Hints, Announcements) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10">
          {/* Center Pot Pill (matching reference "Pot $1.7M") - Fixed cleanly above community cards */}
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3.5 flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-neutral-200/80 shadow-2xs pointer-events-auto whitespace-nowrap"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
          >
            <span className="text-xs text-neutral-400 font-normal">Pot</span>
            <span className="text-xs sm:text-[13px] font-bold text-neutral-900">
              {formatCurrency(gameState.pot)}
            </span>
          </div>

          {/* 5 Community Cards - Locked at the exact geometric center of the table (y=50%, x=50%) */}
          <div className="pointer-events-auto flex items-center justify-center">
            <CommunityCards
              cards={gameState.communityCards}
              phase={gameState.phase}
            />
          </div>

          {/* Sub-center Area below Community Cards (Results Announcement / Next Hand Button) */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3.5 flex flex-col items-center pointer-events-auto whitespace-nowrap">

            {/* Hand Result Announcement Banner (Auto-deals next hand) */}
            {gameState.phase === 'hand_ended' && gameState.handResults.length > 0 && (
              <div
                onClick={onStartNextHand}
                className="flex flex-col items-center animate-fade-in cursor-pointer group select-none"
                title="Click to deal immediately"
              >
                <div className="bg-neutral-900 text-white text-[13px] font-medium px-5 py-2 rounded-full shadow-md flex items-center gap-2 group-hover:scale-[1.02] active:scale-95 transition-all">
                  <span>🏆</span>
                  <span>{gameState.handResults[0].description}</span>
                </div>
              </div>
            )}

            {/* Initial Start Button */}
            {gameState.phase === 'idle' && (
              <button
                type="button"
                onClick={onStartNextHand}
                className="px-8 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-full shadow-md active:scale-95 transition-all cursor-pointer"
              >
                Start Tournament
              </button>
            )}
          </div>
        </div>

        {/* 6 Radial Seats Centered on the Stadium Boundary */}
        {gameState.players.map((player) => {
          const isCurrent = gameState.currentTurnSeat === player.seatIndex;
          const isDealer = gameState.dealerSeat === player.seatIndex;

          return (
            <Seat
              key={player.id}
              player={player}
              isDealer={isDealer}
              isCurrentTurn={isCurrent}
              positionClass={seatPositions[player.seatIndex]}
              showCards={gameState.showdownCardsRevealed}
              handPhase={gameState.phase}
            />
          );
        })}
      </div>

      {/* Bottom Action Controls Area - Harmoniously spaced below Hero */}
      <div className="w-full flex justify-center mt-16 sm:mt-20 z-30">
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
