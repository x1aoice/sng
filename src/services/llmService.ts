import type { Player, Card, GamePhase, ActionType } from '../engine/types';

export interface BotDecision {
  action: ActionType;
  amount?: number;
}

/**
 * 100% Pure LLM Poker Decision Engine
 * Routes through secure /api/chat proxy (Vite dev proxy or Vercel Edge Serverless Function).
 * Zero hardcoded private API keys in client-side bundles!
 */
export async function decideBotActionWithLLM(
  bot: Player,
  communityCards: Card[],
  pot: number,
  currentHighestBet: number,
  minRaiseAmount: number,
  phase: GamePhase
): Promise<BotDecision> {
  const toCall = Math.max(0, currentHighestBet - bot.currentBet);
  const startTime = performance.now();

  try {
    const controller = new AbortController();
    // 12-second safety timeout accommodates auto reasoning models while fitting within 30s timer
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const url = '/api/chat';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          playerName: bot.name,
          holeCards: bot.cards.map((card) => `${card.rank}${card.suit}`),
          communityCards: communityCards.map((card) => `${card.rank}${card.suit}`),
          phase,
          pot,
          currentHighestBet,
          currentBet: bot.currentBet,
          stack: bot.chips,
          minRaiseAmount,
          canRaise: bot.canRaise,
        }),
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content || '';
    const matches = rawContent.match(/\{[^{}]*\}/g);
    const decisionJson = matches?.at(-1);
    if (!decisionJson) {
      throw new Error(`Invalid JSON format: ${rawContent}`);
    }

    const parsed = JSON.parse(decisionJson);
    const validActions: ActionType[] = ['fold', 'check', 'call', 'raise', 'allin'];
    if (!validActions.includes(parsed.action)) {
      throw new Error(`Invalid action: ${parsed.action}`);
    }

    let action = parsed.action as ActionType;
    // Sanity check: cannot check if facing a bet
    if (action === 'check' && toCall > 0) {
      action = 'call';
    }

    let amount = typeof parsed.amount === 'number' && Number.isFinite(parsed.amount)
      ? parsed.amount
      : undefined;
    if (action === 'allin') {
      amount = bot.chips;
    } else if (action === 'raise' && !amount) {
      amount = Math.min(bot.currentBet + bot.chips, currentHighestBet + minRaiseAmount);
    }

    const elapsed = Math.round(performance.now() - startTime);
    console.log(
      `%c[🤖 LLM Player · ${bot.name} (auto)] Action: ${action.toUpperCase()}${amount ? ` ($${amount})` : ''} | Latency: ${elapsed}ms`,
      'color: #0284c7; font-weight: bold;'
    );

    return { action, amount };
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - startTime);
    console.error(`[⚠️ LLM Error · ${bot.name}] (${elapsed}ms):`, err);
    // Standard poker tournament rules when player times out or disconnects: auto-check or auto-fold
    const timeoutAction: ActionType = toCall <= 0 ? 'check' : 'fold';
    return { action: timeoutAction, amount: 0 };
  }
}
