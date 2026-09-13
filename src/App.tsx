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
  const handleResetGame = useCallback(() => {
    setGameState(createInitialGameState());
    setIsPaused(false);
  }, []);

  // Start hand
  const handleStartNextHand = useCallback(() => {
    setGameState((prev) => startHand(prev));
  }, []);

  // Handle hero user action
  const handleHeroAction = useCallback((action: ActionType, amount?: number) => {
    setGameState((prev) => handlePlayerAction(prev, action, amount));
  }, []);

  // Automatically start next hand or tournament conclusion after a hand concludes
  useEffect(() => {
    if (gameState.phase !== 'hand_ended' || isPaused) return;

    const hero = gameState.players.find((p) => p.isUser);
    const isHeroEliminated = hero ? (hero.eliminated || hero.chips <= 0) : false;
    const autoDealDelay = isHeroEliminated ? 1400 : 2200;

    const timer = setTimeout(() => {
      setGameState((prev) => (prev.phase === 'hand_ended' ? startHand(prev) : prev));
    }, autoDealDelay);

    return () => clearTimeout(timer);
  }, [gameState.phase, gameState.handNumber, isPaused]);

  // 1. Universal 30-second turn countdown timer for active player (both Hero and Bots)
  useEffect(() => {
    if (isPaused) return;
    const currentSeat = gameState.currentTurnSeat;
    if (
      currentSeat === null ||
      gameState.phase === 'idle' ||
      gameState.phase === 'showdown' ||
      gameState.phase === 'hand_ended' ||
      gameState.phase === 'tournament_ended'
    ) {
      return;
    }

    const currentPlayer = gameState.players[currentSeat];
    if (!currentPlayer || currentPlayer.folded || currentPlayer.eliminated || currentPlayer.isAllIn) {
      return;
    }

    // Set 30-second time-bank when turn begins
    setGameState((prev) => {
      if (prev.currentTurnSeat !== currentSeat) return prev;
      const p = prev.players[currentSeat];
      if (p.isThinking && p.thinkingSeconds !== undefined) return prev;
      return {
        ...prev,
        players: prev.players.map((pl, idx) =>
          idx === currentSeat ? { ...pl, isThinking: true, thinkingSeconds: 30 } : pl
        ),
      };
    });

    // Tick every 1000ms
    const intervalId = setInterval(() => {
      setGameState((prev) => {
        if (prev.currentTurnSeat !== currentSeat) return prev;
        const player = prev.players[currentSeat];
        const sec = player.thinkingSeconds ?? 30;

        if (sec <= 1) {
          const toCall = prev.currentHighestBet - player.currentBet;
          return handlePlayerAction(prev, toCall <= 0 ? 'check' : 'fold');
        }

        return {
          ...prev,
          players: prev.players.map((pl, idx) =>
            idx === currentSeat ? { ...pl, thinkingSeconds: sec - 1 } : pl
          ),
        };
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [gameState.currentTurnSeat, gameState.phase, isPaused]);

  // 2. Bot AI decision & realistic thinking pacing (powered by built-in FreeLLMAPI)
  useEffect(() => {
    if (isPaused) return;
    const currentSeat = gameState.currentTurnSeat;

    // Only for bot turns (seat > 0)
    if (
      currentSeat === null ||
      currentSeat === 0 ||
      gameState.phase === 'idle' ||
      gameState.phase === 'showdown' ||
      gameState.phase === 'hand_ended' ||
      gameState.phase === 'tournament_ended'
    ) {
      return;
    }

    const bot = gameState.players[currentSeat];
    if (!bot || bot.folded || bot.eliminated || bot.isAllIn) {
      return;
    }

    // Determine realistic thinking duration based on the hand situation
    const toCall = gameState.currentHighestBet - bot.currentBet;
    const isFacingAllIn = toCall >= bot.chips || gameState.currentHighestBet >= bot.chips * 0.4;
    const isBigPot = gameState.pot > 4000000;

    let targetThinkMs: number;
    if (toCall === 0) {
      // Free check / unraised pot: 1.6s ~ 2.6s (counts down 30s -> 29s -> 28s)
      targetThinkMs = 1600 + Math.random() * 1000;
    } else if (isFacingAllIn || isBigPot) {
      // High-pressure all-in decision / massive pot: 4.5s ~ 7.5s (visibly counts down 4~7 seconds!)
      targetThinkMs = 4500 + Math.random() * 3000;
    } else {
      // Standard raise or call: 2.5s ~ 4.2s (visibly counts down 2~4 seconds)
      targetThinkMs = 2500 + Math.random() * 1700;
    }

    let isCancelled = false;

    (async () => {
      const startTime = performance.now();

      // Query FreeLLMAPI bot decision
      const decision = await decideBotActionWithLLM(
        bot,
        gameState.communityCards,
        gameState.pot,
        gameState.currentHighestBet,
        gameState.minRaiseAmount,
        gameState.phase
      );

      const elapsed = performance.now() - startTime;
      const waitRemaining = Math.max(0, targetThinkMs - elapsed);

      setTimeout(() => {
        if (isCancelled) return;
        const latest = gameStateRef.current;
        if (latest.currentTurnSeat !== currentSeat) return;

        setGameState((prev) => handlePlayerAction(prev, decision.action, decision.amount));
      }, waitRemaining);
    })();

    return () => {
      isCancelled = true;
    };
  }, [gameState.currentTurnSeat, gameState.phase, gameState.pot, gameState.currentHighestBet, isPaused]);

  return (
    <div className="min-h-screen w-full bg-white text-neutral-900 flex flex-col justify-center items-center select-none relative overflow-x-hidden overflow-y-auto p-4 sm:p-6">
      {/* Main Poker Arena - purely centered table with 0 clutter */}
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
