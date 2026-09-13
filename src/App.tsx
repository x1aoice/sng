import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  startHand,
  handlePlayerAction,
  createInitialGameState,
} from './engine/gameEngine';
import type { GameState } from './engine/gameEngine';
import { decideBotActionWithLLM } from './services/llmService';
import { Table } from './components/Table';
import { HeaderHUD } from './components/HeaderHUD';
import { HandLogDrawer } from './components/HandLogDrawer';
import { GameOverModal } from './components/GameOverModal';
import { sound } from './utils/sound';
import { formatCurrency } from './utils/format';
import type { ActionType, HandLog } from './engine/types';

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => sound.isEnabled());
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [handLogs, setHandLogs] = useState<HandLog[]>([]);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Add a record to hand history logs
  const addLog = useCallback((round: string, text: string) => {
    const newLog: HandLog = {
      id: Math.random().toString(36).substring(2, 9),
      round,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setHandLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  }, []);

  // Reset tournament
  const handleResetGame = useCallback(() => {
    setGameState(createInitialGameState());
    setIsPaused(false);
    setHandLogs([]);
  }, []);

  // Sound toggle
  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      sound.setEnabled(next);
      return next;
    });
  }, []);

  // Speed toggle (1x / 2x)
  const handleToggleSpeed = useCallback(() => {
    setSpeed((prev) => (prev === 1 ? 2 : 1));
  }, []);

  // Start hand
  const handleStartNextHand = useCallback(() => {
    setGameState((prev) => {
      const next = startHand(prev);
      addLog(`Hand #${next.handNumber} · START`, `Hand #${next.handNumber} dealt. Blinds posted.`);
      return next;
    });
  }, [addLog]);

  // Handle hero user action
  const handleHeroAction = useCallback((action: ActionType, amount?: number) => {
    const latest = gameStateRef.current;
    const amountStr = amount ? ` $${formatCurrency(amount).replace('$', '')}` : '';
    addLog(
      `Hand #${latest.handNumber} · ${latest.phase.toUpperCase()}`,
      `You: ${action.toUpperCase()}${amountStr}`
    );
    setGameState((prev) => handlePlayerAction(prev, action, amount));
  }, [addLog]);

  // Automatically start next hand or tournament conclusion after a hand concludes
  useEffect(() => {
    if (gameState.phase !== 'hand_ended' || isPaused) return;

    const hero = gameState.players.find((p) => p.isUser);
    const isHeroEliminated = hero ? (hero.eliminated || hero.chips <= 0) : false;
    // If Hero was eliminated, transition to tournament results promptly; adjust for speed
    const baseDelay = isHeroEliminated ? 1400 : 2200;
    const autoDealDelay = Math.round(baseDelay / speed);

    const timer = setTimeout(() => {
      setGameState((prev) => (prev.phase === 'hand_ended' ? startHand(prev) : prev));
    }, autoDealDelay);

    return () => clearTimeout(timer);
  }, [gameState.phase, gameState.handNumber, isPaused, speed]);

  // Log hand end results
  useEffect(() => {
    if (gameState.phase !== 'hand_ended') return;
    if (gameState.handResults.length > 0) {
      for (const res of gameState.handResults) {
        addLog(`Hand #${gameState.handNumber} · SHOWDOWN`, res.description);
      }
    }
  }, [gameState.phase, gameState.handNumber, addLog]);

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

    // Tick every 1000ms adjusted for speed
    const intervalMs = Math.round(1000 / speed);
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
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [gameState.currentTurnSeat, gameState.phase, isPaused, speed]);

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
      const waitRemaining = Math.max(0, Math.round((targetThinkMs - elapsed) / speed));

      setTimeout(() => {
        if (isCancelled) return;
        const latest = gameStateRef.current;
        if (latest.currentTurnSeat !== currentSeat) return;

        const amountStr = decision.amount ? ` $${formatCurrency(decision.amount).replace('$', '')}` : '';
        addLog(
          `Hand #${latest.handNumber} · ${latest.phase.toUpperCase()}`,
          `${bot.name}: ${decision.action.toUpperCase()}${amountStr}`
        );
        setGameState((prev) => handlePlayerAction(prev, decision.action, decision.amount));
      }, waitRemaining);
    })();

    return () => {
      isCancelled = true;
    };
  }, [gameState.currentTurnSeat, gameState.phase, gameState.pot, gameState.currentHighestBet, isPaused, speed, addLog]);

  return (
    <div className="min-h-screen w-full bg-white text-neutral-900 flex flex-col justify-between items-center select-none relative overflow-x-hidden overflow-y-auto">
      {/* Top Header HUD (Always visible blind level & controls) */}
      <HeaderHUD
        gameState={gameState}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        speed={speed}
        onToggleSpeed={handleToggleSpeed}
        onResetGame={handleResetGame}
        onToggleLogs={() => setIsLogsOpen(true)}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused((prev) => !prev)}
      />

      {/* Main Poker Arena - purely centered table and controls with 0 clutter */}
      <main className="w-full flex-1 flex items-center justify-center p-2 sm:p-4 my-auto">
        <Table
          gameState={gameState}
          onHeroAction={handleHeroAction}
          onStartNextHand={handleStartNextHand}
          isPaused={isPaused}
        />
      </main>

      {/* Hand History Drawer */}
      <HandLogDrawer
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
        logs={handLogs}
      />

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
