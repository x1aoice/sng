import type { Player, Card, GamePhase, ActionType } from '../engine/types';

export interface BotDecision {
  action: ActionType;
  amount?: number;
}

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
 * Distinct tournament poker personalities fed directly to the LLM prompt
 */
const BOT_STYLES: Record<string, string> = {
  Marcus: '松凶型选手(LAG)，极其激进，擅长利用下注施加巨额筹码压力与适时诈唬',
  Leo: '狂野奔放型选手，入池率高，偏好在大底池中制造混乱并全下',
  Alex: '稳健紧凶型选手(TAG)，深谙正期望值EV与起手牌范围，攻守平衡',
  Elena: '多变灵动型选手，善于慢打强牌并敏锐捕捉对手破绽',
  Sophia: '极度克制的石头型选手(Rock)，弃牌率极高，仅在拿到绝对强牌时猛烈反击',
};

/**
 * 100% Pure LLM Poker Decision Engine
 * Every single bot move is decided exclusively by FreeLLMAPI (no local bot algorithm).
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
      : '无 (翻牌前)';

  const styleDesc = BOT_STYLES[bot.name] || '职业德州扑克选手';

  const prompt = `你是德州扑克(6-Max SNG)选手【${bot.name}】。
你的风格：${styleDesc}。

当前牌局状况：
- 你的手牌: [${cardsStr}]
- 公共牌: [${commStr}]
- 当前轮次: ${phase}
- 当前底池: $${pot}
- 当前最高注: $${currentHighestBet}
- 你需跟注: $${toCall}
- 你的筹码: $${bot.chips}
- 最小加注: $${minRaiseAmount}

请以你的扑克风格，评估手牌赢率与底池赔率做出决策。
必须且仅返回纯 JSON，严禁任何额外文字或解释：
{"action": "fold" | "check" | "call" | "raise" | "allin", "amount": 数字}`;

  const startTime = performance.now();

  try {
    const controller = new AbortController();
    // 8-second safety timeout
    const timeoutId = setTimeout(() => controller.abort(), 8000);

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
      `%c[🤖 LLM Player · ${bot.name}] Action: ${action.toUpperCase()}${amount ? ` ($${amount})` : ''} | Latency: ${elapsed}ms`,
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
