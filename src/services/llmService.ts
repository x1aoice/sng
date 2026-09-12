export interface LLMConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
  botChatEnabled: boolean;
  coachEnabled: boolean;
}

const STORAGE_KEY = 'poker_freellmapi_config';

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  enabled: true,
  baseUrl: 'https://free.icomefrom.asia/v1',
  apiKey: 'YOUR_API_KEY_HERE',
  model: 'auto',
  botChatEnabled: true,
  coachEnabled: true,
};

export function loadLLMConfig(): LLMConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LLM_CONFIG;
    return { ...DEFAULT_LLM_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_LLM_CONFIG;
  }
}

export function saveLLMConfig(config: LLMConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('Failed to save LLM config', err);
  }
}

/**
 * Smart endpoint resolver:
 * 1. If deployed on HTTPS (e.g. Vercel) and user enters an insecure HTTP URL (http://...),
 *    browser blocks direct fetch (Mixed Content). We route via /api/chat serverless proxy!
 * 2. If user sets /api/chat or leaves empty, route via /api/chat with server env variables.
 * 3. Otherwise direct fetch to ${baseUrl}/chat/completions.
 */
function resolveFetchEndpoint(config: LLMConfig): {
  url: string;
  headers: Record<string, string>;
} {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const rawBase = (config.baseUrl || '').trim();
  const isHttpUrl = rawBase.startsWith('http://');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.apiKey.trim()) {
    headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
  }

  if (rawBase === '/api/chat' || (isHttps && isHttpUrl) || !rawBase) {
    if (rawBase && isHttpUrl) {
      headers['x-freellmapi-url'] = rawBase;
    }
    return {
      url: '/api/chat',
      headers,
    };
  }

  return {
    url: `${rawBase.replace(/\/+$/, '')}/chat/completions`,
    headers,
  };
}

/**
 * Test server connectivity with a lightweight prompt
 */
export async function testLLMConnection(config: LLMConfig): Promise<{
  success: boolean;
  latencyMs: number;
  message?: string;
  error?: string;
}> {
  const start = performance.now();
  const { url, headers } = resolveFetchEndpoint(config);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: config.model || 'deepseek-chat',
        messages: [{ role: 'user', content: 'Ping' }],
        max_tokens: 5,
        temperature: 0.1,
      }),
    });

    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - start);

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        latencyMs,
        error: `HTTP ${res.status}: ${errText.slice(0, 100)}`,
      };
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || 'OK';

    return {
      success: true,
      latencyMs,
      message: `连通成功！模型响应正常: "${reply.trim()}"`,
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      success: false,
      latencyMs,
      error: err.name === 'AbortError' ? '请求超时 (6秒无响应)' : (err.message || '网络连接失败，请检查跨域CORS或服务地址'),
    };
  }
}

// Built-in witty fallback dialogues for bot personalities when API is offline
const FALLBACK_DIALOGUES: Record<string, Record<string, string[]>> = {
  Marcus: {
    allin: [
      '就这点筹码也配跟我玩？全下了！',
      '直接刺刀见红，谁怂谁回家！',
      '你有种就跟，没种就乖乖弃牌！',
    ],
    raise: [
      '小注没意思，加注给你们点压力！',
      '这池子归我了，识相的快跑。',
      '别磨蹭，想看牌就得买门票！',
    ],
    fold: [
      '哼，这把牌太臭，先放你一马。',
      '先让你得意一把，下局收拾你。',
    ],
    win: [
      '看到没有？这就叫绝对统治力！',
      '全桌一个能打的都没有！',
    ],
  },
  Elena: {
    allin: [
      '底池这么大，不得不推啦！来碰碰运气~',
      '孤注一掷！牌桌就得这么玩才有意思！',
    ],
    raise: [
      '加注加注！大家一起玩嘛~',
      '感觉这把我运势正旺，加一手！',
    ],
    fold: [
      '哎呀，手牌不赏脸，下次再来~',
      '溜了溜了，保命要紧。',
    ],
    win: [
      '哈哈！运气也是实力的一部分嘛~',
      '收筹码咯，谢谢老板们捧场！',
    ],
  },
  Alex: {
    allin: [
      '手牌赢率期望值大幅占优，全下是最佳决策。',
      '根据短码 GTO 策略，此处无条件 Push。',
    ],
    raise: [
      '你的下注暴露了弱项，加注隔离。',
      '重构底池赔率，请慎重做决定。',
    ],
    fold: [
      '底池赔率不足以支持跟注，数学上必须 Fold。',
      'EV 为负，理性止损。',
    ],
    win: [
      '数学概率从不说谎。',
      '符合模型预期，稳步收下底池。',
    ],
  },
  Sophia: {
    allin: [
      '等待了这么久，终于等到值得出手的牌了。',
      '我的范围极度强劲，建议你直接弃牌。',
    ],
    raise: [
      '我从不轻易加注，你应该知道这意味着什么。',
      '翻牌正中我的范围，加注。',
    ],
    fold: [
      '没有足够把握的牌，我一眼都不会看。',
      '耐心是最好的武器，弃牌。',
    ],
    win: [
      '坚守纪律的人终将获得胜利。',
      '毫无意外的结果。',
    ],
  },
  Leo: {
    allin: [
      '猜猜我是诈唬还是坚果？ All-in！',
      '心跳加速了吗？敢不敢抓我这把？',
    ],
    raise: [
      '我就喜欢把水搅浑，加注！',
      '眼神别闪烁，你的底牌被我看穿了~',
    ],
    fold: [
      '哎呀被抓包了，算你厉害这次！',
      '撤退！留得青山在，不怕没柴烧。',
    ],
    win: [
      '虚虚实实，兵不厌诈！',
      '感谢老铁送来的大筹码！',
    ],
  },
};

export function getRandomFallback(botName: string, action: string): string {
  const persona = FALLBACK_DIALOGUES[botName] || FALLBACK_DIALOGUES['Leo'];
  const pool = persona[action] || persona['raise'] || ['我跟一手看看！'];
  return pool[Math.floor(Math.random() * pool.length)];
}

const BOT_SYSTEM_PROMPTS: Record<string, string> = {
  Marcus: '你是德州扑克狂躁激进型选手Marcus，性格极度狂妄、凶悍、喜欢挑衅和心理压迫，用简短犀利的中文垃圾话威慑对手。',
  Elena: '你是德州扑克松凶玩家Elena，性格开朗俏皮、爱跟注爱看热闹、口吻轻松调侃，常用简短活泼的中文发言。',
  Alex: '你是德州扑克理性数据派Alex，性格冷静严谨，言语充满数学概率、GTO、期望值EV术语，口吻极度理智。',
  Sophia: '你是德州扑克超紧岩石选手Sophia，极度克制谨慎、冷酷干练，只玩顶级大牌，言语少而充满压迫感。',
  Leo: '你是德州扑克狡黠诈唬大师Leo，性格戏谑捉弄人、擅长真假难辨的心理战，喜欢逗弄对手。',
};

/**
 * Generate in-character trash talk / dialogue for a bot action
 */
export async function generateBotDialogue(
  botName: string,
  action: 'raise' | 'allin' | 'call' | 'fold' | 'win',
  context: {
    holeCardsStr?: string;
    potAmountStr?: string;
    actionAmountStr?: string;
  },
  config: LLMConfig
): Promise<string> {
  if (!config.enabled || !config.botChatEnabled || !config.baseUrl) {
    return getRandomFallback(botName, action);
  }

  const systemPrompt = BOT_SYSTEM_PROMPTS[botName] || BOT_SYSTEM_PROMPTS['Leo'];
  const userPrompt = `当前你正在急速德州扑克锦标赛中。
行动类型: ${action.toUpperCase()}
当前底池: ${context.potAmountStr || '未知'}
你的行动金额: ${context.actionAmountStr || '全下'}
请根据你的专属人设，说一句非常简短生动的桌上发言或垃圾话（12个字以内，纯中文，严禁带任何解释、标签或引号）。`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const { url, headers } = resolveFetchEndpoint(config);

    const res = await fetch(url, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: config.model || 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 35,
        temperature: 0.85,
      }),
    });

    clearTimeout(timeoutId);
    if (!res.ok) {
      return getRandomFallback(botName, action);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return getRandomFallback(botName, action);

    // Clean up any extra quotation marks
    return text.replace(/^["'“]+|["'”]+$/g, '').slice(0, 25);
  } catch {
    return getRandomFallback(botName, action);
  }
}

/**
 * Generate real-time poker coach analysis for Hero's current spot
 */
export async function generateCoachAdvice(
  heroCards: string,
  communityCards: string,
  phase: string,
  potStr: string,
  toCallStr: string,
  heroChipsStr: string,
  bbCount: number,
  config: LLMConfig
): Promise<string> {
  if (!config.enabled || !config.coachEnabled || !config.baseUrl) {
    return `当前深度约 ${bbCount.toFixed(1)} BB。在急速 SNG 中，当筹码低于 10 BB 时进入短码 Push/Fold 阶段。如果手牌具备优质高牌或口袋对，全下 (All-in) 的期望值往往优于被动弃牌。`;
  }

  const systemPrompt = `你是一位世界顶尖德州扑克职业教练，擅长急速 SNG (Hyper Sit & Go) 锦标赛策略与短码 GTO 理论。
请根据当前局势，用清晰、专业、精炼的中文给出决策建议。回答需严格控制在 100 字以内，分条列出：
1. 局面定性与赔率
2. 推荐行动 (Push全下 / Fold弃牌 / Call / Raise) 与核心理由。`;

  const userPrompt = `我的手牌: [${heroCards}]
公共牌: [${communityCards || '翻牌前'}]
当前轮次: ${phase}
底池大小: ${potStr}
需跟注金额: ${toCallStr}
我的剩余筹码: ${heroChipsStr} (约 ${bbCount.toFixed(1)} BB)
请给出你的决策分析。`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const { url, headers } = resolveFetchEndpoint(config);

    const res = await fetch(url, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: config.model || 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 150,
        temperature: 0.3,
      }),
    });

    clearTimeout(timeoutId);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '分析完成：建议根据底池赔率选择进退。';
  } catch (err: any) {
    return `【教练分析 (本地离线提示)】当前剩余筹码约 ${bbCount.toFixed(1)} BB。翻前若手握高张(A/K)或对子，建议果断 Push 全下压制对手；若为边缘杂色小牌且赔率不佳，请及时 Fold 止损等待下一手。（在线连接失败: ${err.message || '超时'}）`;
  }
}
