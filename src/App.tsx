import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  startHand,
  handlePlayerAction,
  createInitialGameState,
} from './engine/gameEngine';
import type { GameState } from './engine/gameEngine';
import { decideBotActionWithLLM } from './services/llmService';
import { Table } from './components/Table';
import { GameOverModal } from './components/GameOverModal';
import type { ActionType } from './engine/types';

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [isPaused, setIsPaused] = useState(false);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Reset tournament
  const handleResetGame = () => {
    setGameState(createInitialGameState());
    setIsPaused(false);
  };

  // Start hand
  const handleStartNextHand = useCallback(() => {
    setGameState((prev) => startHand(prev));
  }, []);

  // Handle hero user action
  const handleHeroAction = useCallback((action: ActionType, amount?: number) => {
    setGameState((prev) => handlePlayerAction(prev, action, amount));
  }, []);

  // Automatically start next hand after a hand concludes (freezes if paused)
  useEffect(() => {
    if (gameState.phase !== 'hand_ended' || isPaused) return;

    const autoDealDelay = 2200;
    const timer = setTimeout(() => {
      setGameState((prev) => (prev.phase === 'hand_ended' ? startHand(prev) : prev));
    }, autoDealDelay);

    return () => clearTimeout(timer);
  }, [gameState.phase, gameState.handNumber, isPaused]);

  // Bot AI decision and thinking simulation loop (powered by built-in FreeLLMAPI)
  useEffect(() => {
    if (isPaused) return;
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

    const baseThinkingMs = 1200 + Math.random() * 800;
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

    let isCancelled = false;

    // Concurrently trigger LLM decision while bot is thinking
    (async () => {
      const decision = await decideBotActionWithLLM(
        bot,
        state.communityCards,
        state.pot,
        state.currentHighestBet,
        state.minRaiseAmount,
        state.phase
      );

      setTimeout(() => {
        if (isCancelled) return;
        const latest = gameStateRef.current;
        if (latest.currentTurnSeat !== currentSeat) return;

        setGameState((prev) => handlePlayerAction(prev, decision.action, decision.amount));
      }, baseThinkingMs);
    })();

    return () => {
      isCancelled = true;
    };
  }, [gameState.currentTurnSeat, gameState.phase, gameState.pot, gameState.currentHighestBet]);

  // Hero countdown timer (freezes if paused)
  useEffect(() => {
    if (isPaused) return;
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
  }, [gameState.currentTurnSeat, gameState.phase, isPaused]);

  return (
    <div className="min-h-screen w-full bg-white text-neutral-900 flex flex-col justify-center items-center select-none relative overflow-x-hidden overflow-y-auto p-4 sm:p-6">
      {/* Main Poker Arena - purely centered table and controls with 0 clutter */}
      <main className="w-full flex items-center justify-center my-auto">
        <Table
          gameState={gameState}
          onHeroAction={handleHeroAction}
          onStartNextHand={handleStartNextHand}
          isPaused={isPaused}
          onTogglePause={() => setIsPaused((prev) => !prev)}
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
