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
import { SettingsModal } from './components/SettingsModal';
import { CoachModal } from './components/CoachModal';
import {
  loadLLMConfig,
  generateBotDialogue,
  type LLMConfig,
} from './services/llmService';
import { formatCurrency } from './utils/format';
import type { ActionType } from './engine/types';

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(loadLLMConfig);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Record<number, string>>({});
  const chatTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Trigger in-character bot dialogue bubble
  const triggerBotChat = useCallback(
    async (
      seatIndex: number,
      action: 'raise' | 'allin' | 'call' | 'fold' | 'win',
      context: {
        potAmountStr?: string;
        actionAmountStr?: string;
      }
    ) => {
      if (!llmConfig.botChatEnabled) return;

      const bot = gameStateRef.current.players[seatIndex];
      if (!bot || bot.isUser) return;

      const text = await generateBotDialogue(bot.name, action, context, llmConfig);
      if (!text) return;

      if (chatTimersRef.current[seatIndex]) {
        clearTimeout(chatTimersRef.current[seatIndex]);
      }

      setChatMessages((prev) => ({ ...prev, [seatIndex]: text }));

      chatTimersRef.current[seatIndex] = setTimeout(() => {
        setChatMessages((prev) => {
          const next = { ...prev };
          delete next[seatIndex];
          return next;
        });
      }, 4200);
    },
    [llmConfig]
  );

  // Reset tournament
  const handleResetGame = () => {
    setGameState(createInitialGameState());
    setChatMessages({});
  };

  // Start hand
  const handleStartNextHand = useCallback(() => {
    setGameState((prev) => startHand(prev));
  }, []);

  // Handle hero user action
  const handleHeroAction = useCallback((action: ActionType, amount?: number) => {
    setGameState((prev) => handlePlayerAction(prev, action, amount));
  }, []);

  // Automatically start next hand after a hand concludes & trigger winner dialogue
  useEffect(() => {
    if (gameState.phase !== 'hand_ended') return;

    // If bot won the hand, trigger victory trash talk / reaction
    if (gameState.handResults.length > 0) {
      const winnerId = gameState.handResults[0].playerId;
      const winnerPlayer = gameState.players.find((p) => p.id === winnerId);
      if (winnerPlayer && !winnerPlayer.isUser && Math.random() < 0.8) {
        triggerBotChat(winnerPlayer.seatIndex, 'win', {
          potAmountStr: formatCurrency(gameState.handResults[0].wonAmount),
        });
      }
    }

    const autoDealDelay = 2500;
    const timer = setTimeout(() => {
      setGameState((prev) => (prev.phase === 'hand_ended' ? startHand(prev) : prev));
    }, autoDealDelay);

    return () => clearTimeout(timer);
  }, [gameState.phase, gameState.handNumber, triggerBotChat]);

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

      // Trigger in-character bot dialogue for noteworthy moves
      if (decision.action === 'allin') {
        triggerBotChat(currentSeat, 'allin', {
          potAmountStr: formatCurrency(latest.pot),
          actionAmountStr: 'All-in 全下',
        });
      } else if (decision.action === 'raise') {
        triggerBotChat(currentSeat, 'raise', {
          potAmountStr: formatCurrency(latest.pot),
          actionAmountStr: formatCurrency(decision.amount),
        });
      } else if (decision.action === 'fold' && latest.currentHighestBet > 0 && Math.random() < 0.4) {
        triggerBotChat(currentSeat, 'fold', {
          potAmountStr: formatCurrency(latest.pot),
        });
      }
    }, baseThinkingMs);

    return () => clearTimeout(timeoutId);
  }, [gameState.currentTurnSeat, gameState.phase, gameState.pot, gameState.currentHighestBet, triggerBotChat]);

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
          chatMessages={chatMessages}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenCoach={() => setIsCoachOpen(true)}
        />
      </main>

      {/* Settings Modal for FreeLLMAPI */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={llmConfig}
        onUpdateConfig={(newCfg) => setLlmConfig(newCfg)}
      />

      {/* AI Poker Coach Modal */}
      <CoachModal
        isOpen={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
        hero={gameState.players[0]}
        communityCards={gameState.communityCards}
        phase={gameState.phase}
        pot={gameState.pot}
        currentHighestBet={gameState.currentHighestBet}
        minRaiseAmount={gameState.minRaiseAmount}
        config={llmConfig}
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
