import type { Player, Card, GamePhase, ActionType } from '../engine/types';

export interface BotDecision {
  action: ActionType;
  amount?: number;
}

/**
 * Distinct tournament poker personalities fed directly to the LLM prompt
 */
const BOT_STYLES: Record<string, string> = {
  Marcus: 'Loose-Aggressive (LAG): highly aggressive, applies relentless pressure with big bets and timely bluffs',
  Leo: 'Wild & Unpredictable: high VPIP, loves building massive pots, creating chaos, and shoving all-in',
  Alex: 'Tight-Aggressive (TAG): disciplined, strictly calculates +EV starting hand ranges, balanced attack and defense',
  Elena: 'Tricky & Exploitative: excels at slow-playing monsters and identifying opponent weaknesses',
  Sophia: 'Nit / Rock: ultra-patient, high fold frequency, strikes fiercely only with premium hands',
};

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
  const cardsStr = bot.cards.map((c) => `${c.rank}${c.suit}`).join(' ');
  const commStr =
    communityCards.length > 0
      ? communityCards.map((c) => `${c.rank}${c.suit}`).join(' ')
      : 'None (Pre-flop)';

  const styleDesc = BOT_STYLES[bot.name] || 'Professional Texas Hold\'em Player';

  const prompt = `You are Texas Hold'em (6-Max SNG) player [${bot.name}].
Playing style: ${styleDesc}.

Current table state:
- Your hole cards: [${cardsStr}]
- Community cards: [${commStr}]
- Betting round: ${phase}
- Pot size: $${pot}
- Current highest bet: $${currentHighestBet}
- Amount to call: $${toCall}
- Your stack: $${bot.chips}
- Min raise: $${minRaiseAmount}

Evaluate your hand equity, pot odds, and opponent dynamics according to your style.
At the very end of your response, output a single JSON line:
\`\`\`json
{"action": "fold" | "check" | "call" | "raise" | "allin", "amount": number}
\`\`\``;

  const startTime = performance.now();

  try {
    const controller = new AbortController();
    // 12-second safety timeout accommodates auto reasoning models while fitting within 30s timer
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const url = '/api/chat';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const res = await fetch(url, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: 'auto',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.25,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content || '';
    const match = rawContent.match(/\{[\s\S]*?\}/);
    if (!match) {
      throw new Error(`Invalid JSON format: ${rawContent}`);
    }

    const parsed = JSON.parse(match[0]);
    const validActions: ActionType[] = ['fold', 'check', 'call', 'raise', 'allin'];
    if (!validActions.includes(parsed.action)) {
      throw new Error(`Invalid action: ${parsed.action}`);
    }

    let action = parsed.action as ActionType;
    // Sanity check: cannot check if facing a bet
    if (action === 'check' && toCall > 0) {
      action = 'call';
    }

    let amount = typeof parsed.amount === 'number' ? parsed.amount : undefined;
    if (action === 'allin') {
      amount = bot.chips;
    } else if (action === 'raise' && !amount) {
      amount = Math.min(bot.chips, currentHighestBet + minRaiseAmount);
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
