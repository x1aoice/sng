import type { Player, Card, GamePhase, ActionType } from '../engine/types';
import { decideBotAction, type BotDecision } from '../ai/pokerBot';

/**
 * Built-in FreeLLMAPI Configuration
 * Directly embedded for serverless and browser play
 */
export const BUILTIN_LLM_CONFIG = {
  baseUrl: 'https://free.icomefrom.asia/v1',
  apiKey: 'YOUR_API_KEY_HERE',
  model: 'llama-3.1-8b-instruct',
};

/**
 * Powered by built-in FreeLLMAPI:
 * Intelligently decides poker action (Fold/Check/Call/Raise/All-in) via LLM,
 * with instantaneous local GTO fallback if the network request exceeds timeout or fails.
 */
export async function decideBotActionWithLLM(
  bot: Player,
  communityCards: Card[],
  pot: number,
  currentHighestBet: number,
  minRaiseAmount: number,
  phase: GamePhase
): Promise<BotDecision> {
  // Always compute fallback first
  const fallback = decideBotAction(
    bot,
    communityCards,
    pot,
    currentHighestBet,
    minRaiseAmount,
    phase
  );

  const toCall = Math.max(0, currentHighestBet - bot.currentBet);
  const cardsStr = bot.cards.map((c) => `${c.rank}${c.suit}`).join(' ');
  const commStr =
    communityCards.length > 0
      ? communityCards.map((c) => `${c.rank}${c.suit}`).join(' ')
      : '无 (翻牌前)';

  const prompt = `你是德州扑克(6-Max SNG)职业选手${bot.name}。当前轮到你行动。
底牌: [${cardsStr}]
公共牌: [${commStr}]
当前阶段: ${phase}
当前底池: $${pot}
当前最高下注: $${currentHighestBet}
你需要跟注: $${toCall}
你的剩余筹码: $${bot.chips}
最小加注额: $${minRaiseAmount}

请根据你的手牌强弱、底池赔率和筹码深度做出最优决策。
严格仅返回一行纯 JSON 格式：
{"action": "fold" | "check" | "call" | "raise" | "allin", "amount": 数字}
严禁附带任何其他文字、分析或 markdown 标签。`;

  const startTime = performance.now();

  try {
    const controller = new AbortController();
    // 6s timeout gives ample headroom for fast 2s LLM generation
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    // Route through /api/chat (proxied by Vite in dev, Edge function on Vercel to bypass CORS)
    const url = '/api/chat';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${BUILTIN_LLM_CONFIG.apiKey}`,
      'x-freellmapi-url': BUILTIN_LLM_CONFIG.baseUrl,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: BUILTIN_LLM_CONFIG.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 40,
        temperature: 0.2,
      }),
    });

    clearTimeout(timeoutId);
    if (!res.ok) {
      console.warn(`[⚠️ FreeLLMAPI HTTP ${res.status}] ${bot.name} fallback to local GTO:`, fallback.action);
      return fallback;
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content || '';
    const match = rawContent.match(/\{[\s\S]*?\}/);
    if (!match) {
      console.warn(`[⚠️ FreeLLMAPI format mismatch] raw: "${rawContent}", fallback to local GTO:`, fallback.action);
      return fallback;
    }

    const parsed = JSON.parse(match[0]);
    const validActions: ActionType[] = ['fold', 'check', 'call', 'raise', 'allin'];
    if (validActions.includes(parsed.action)) {
      let action = parsed.action as ActionType;
      // Sanity checks
      if (action === 'check' && toCall > 0) {
        action = 'call';
      }
      let amount = typeof parsed.amount === 'number' ? parsed.amount : fallback.amount;
      if (action === 'allin') {
        amount = bot.chips;
      }
      const elapsed = Math.round(performance.now() - startTime);
      console.log(`%c[🤖 FreeLLMAPI] ${bot.name} acted ${action.toUpperCase()}${amount ? ` ($${amount})` : ''} (${elapsed}ms)`, 'color: #0284c7; font-weight: bold;');
      return { action, amount };
    }

    return fallback;
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - startTime);
    console.warn(`[⚠️ FreeLLMAPI ${err instanceof Error ? err.name : 'Error'} after ${elapsed}ms] ${bot.name} fallback to local GTO:`, fallback.action);
    return fallback;
  }
}
