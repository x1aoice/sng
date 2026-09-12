import type { Player, Card, GamePhase, ActionType } from '../engine/types';
import { decideBotAction, type BotDecision } from '../ai/pokerBot';

/**
 * Built-in FreeLLMAPI Configuration
 * Directly embedded for serverless and browser play
 */
export const BUILTIN_LLM_CONFIG = {
  baseUrl: 'https://free.icomefrom.asia/v1',
  apiKey: 'YOUR_API_KEY_HERE',
  model: 'auto',
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

  try {
    const controller = new AbortController();
    // 2.2s timeout to maintain fast game pace
    const timeoutId = setTimeout(() => controller.abort(), 2200);

    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const useProxy = isHttps;
    const url = useProxy ? '/api/chat' : `${BUILTIN_LLM_CONFIG.baseUrl}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${BUILTIN_LLM_CONFIG.apiKey}`,
    };
    if (useProxy) {
      headers['x-freellmapi-url'] = BUILTIN_LLM_CONFIG.baseUrl;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: BUILTIN_LLM_CONFIG.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 40,
        temperature: 0.3,
      }),
    });

    clearTimeout(timeoutId);
    if (!res.ok) return fallback;

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content || '';
    const match = rawContent.match(/\{[\s\S]*?\}/);
    if (!match) return fallback;

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
      return { action, amount };
    }
    return fallback;
  } catch {
    return fallback;
  }
}
