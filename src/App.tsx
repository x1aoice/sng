import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  startHand,
  handlePlayerAction,
  createInitialGameState,
} from './engine/gameEngine';
import type { GameState } from './engine/gameEngine';
import { decideBotAction } from './ai/pokerBot';
import { Table } from './components/Table';
import { GameOverModal } from './components/GameOverModal';
import type { ActionType } from './engine/types';

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Reset tournament
  const handleResetGame = () => {
    setGameState(createInitialGameState());
  };

  // Start hand
  const handleStartNextHand = useCallback(() => {
    setGameState((prev) => startHand(prev));
  }, []);

  // Handle hero user action
  const handleHeroAction = useCallback((action: ActionType, amount?: number) => {
    setGameState((prev) => handlePlayerAction(prev, action, amount));
  }, []);

  // Automatically start next hand after a hand concludes
  useEffect(() => {
    if (gameState.phase !== 'hand_ended') return;

    const autoDealDelay = 2200;
    const timer = setTimeout(() => {
      setGameState((prev) => (prev.phase === 'hand_ended' ? startHand(prev) : prev));
    }, autoDealDelay);

    return () => clearTimeout(timer);
  }, [gameState.phase, gameState.handNumber]);

  // Bot AI decision and thinking simulation loop
  useEffect(() => {
    const state = gameState;
    const currentSeat = state.currentTurnSeat;

    if (
      currentSeat === null ||
      currentSeat === 0 ||
      state.phase === 'idle' ||
      state.phase === 'showdown' ||
      state.phase === 'hand_ended' ||
      state.phase === 'tournament_ended'
    ) {
      return;
    }

    const bot = state.players[currentSeat];
    if (!bot || bot.folded || bot.eliminated || bot.isAllIn) {
      return;
    }

    const baseThinkingMs = 1100 + Math.random() * 1100;
    const initialSeconds = Math.max(1, Math.round(baseThinkingMs / 1000));

    setGameState((prev) => {
      if (prev.currentTurnSeat !== currentSeat) return prev;
      return {
        ...prev,
        players: prev.players.map((p, idx) =>
          idx === currentSeat ? { ...p, isThinking: true, thinkingSeconds: initialSeconds } : p
        ),
      };
    });

    const timeoutId = setTimeout(() => {
      const latest = gameStateRef.current;
      if (latest.currentTurnSeat !== currentSeat) return;

      const decision = decideBotAction(
        latest.players[currentSeat],
        latest.communityCards,
        latest.pot,
        latest.currentHighestBet,
        latest.minRaiseAmount,
        latest.phase
      );

      setGameState((prev) => handlePlayerAction(prev, decision.action, decision.amount));
    }, baseThinkingMs);

    return () => clearTimeout(timeoutId);
  }, [gameState.currentTurnSeat, gameState.phase, gameState.pot, gameState.currentHighestBet]);

  // Hero countdown timer
  useEffect(() => {
    const state = gameState;
    if (
      state.currentTurnSeat !== 0 ||
      state.phase === 'idle' ||
      state.phase === 'showdown' ||
      state.phase === 'hand_ended' ||
      state.phase === 'tournament_ended'
    ) {
      return;
    }

    setGameState((prev) => {
      if (prev.currentTurnSeat !== 0 || prev.players[0].isThinking) return prev;
      return {
        ...prev,
        players: prev.players.map((p, idx) =>
          idx === 0 ? { ...p, isThinking: true, thinkingSeconds: 30 } : p
        ),
      };
    });

    const intervalId = setInterval(() => {
      setGameState((prev) => {
        if (prev.currentTurnSeat !== 0) return prev;
        const hero = prev.players[0];
        const sec = hero.thinkingSeconds ?? 30;
        if (sec <= 1) {
          const toCall = prev.currentHighestBet - hero.currentBet;
          return handlePlayerAction(prev, toCall <= 0 ? 'check' : 'fold');
        }
        return {
          ...prev,
          players: prev.players.map((p, idx) =>
            idx === 0 ? { ...p, thinkingSeconds: sec - 1 } : p
          ),
        };
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [gameState.currentTurnSeat, gameState.phase]);

  return (
    <div className="min-h-screen w-full bg-white text-neutral-900 flex flex-col justify-center items-center select-none relative overflow-x-hidden overflow-y-auto p-4 sm:p-6">

      {/* Main Poker Arena - purely centered table and controls */}
      <main className="w-full flex items-center justify-center my-auto">
        <Table
          gameState={gameState}
          onHeroAction={handleHeroAction}
          onStartNextHand={handleStartNextHand}
        />
      </main>

      {/* Game Over / Tournament Finished Modal */}
      {gameState.phase === 'tournament_ended' && (
        <GameOverModal
          players={gameState.players}
          onRestart={handleResetGame}
        />
      )}
    </div>
  );
};

export default App;
