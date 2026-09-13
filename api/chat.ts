export const config = {
  runtime: 'edge',
};

const BOT_STYLES: Record<string, string> = {
  Marcus: 'Loose-Aggressive (LAG): applies pressure with large bets and timely bluffs',
  Leo: 'Wild and unpredictable: plays many hands and is willing to shove all-in',
  Alex: 'Tight-Aggressive (TAG): disciplined, selective, and value oriented',
  Elena: 'Tricky and exploitative: mixes traps with pressure against weak ranges',
  Sophia: 'Nit / Rock: patient and strongly weighted toward premium hands',
};

const GAME_PHASES = new Set(['preflop', 'flop', 'turn', 'river']);
const COMMUNITY_CARD_COUNTS: Record<string, number> = {
  preflop: 0,
  flop: 3,
  turn: 4,
  river: 5,
};
const CARD_PATTERN = /^(?:[2-9TJQKA])[♠♥♦♣]$/u;
const MAX_CHIP_VALUE = 1_000_000_000_000;
const MAX_BODY_BYTES = 4_096;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_REQUESTS = 60;

interface PokerDecisionRequest {
  playerName: string;
  holeCards: string[];
  communityCards: string[];
  phase: string;
  pot: number;
  currentHighestBet: number;
  currentBet: number;
  stack: number;
  minRaiseAmount: number;
  canRaise: boolean;
}

interface RateLimitBucket {
  count: number;
  resetsAt: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();

function jsonResponse(payload: unknown, status: number, extraHeaders?: HeadersInit): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

function getClientKey(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',').at(-1)?.trim() || 'unknown';
  }
  return req.headers.get('x-real-ip') || 'unknown';
}

function consumeRateLimit(req: Request): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const key = getClientKey(req);
  const current = rateLimitBuckets.get(key);

  if (!current || current.resetsAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetsAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= RATE_LIMIT_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetsAt - now) / 1_000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

function isChipValue(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= MAX_CHIP_VALUE;
}

function isCardList(value: unknown, expectedLength?: number): value is string[] {
  return (
    Array.isArray(value) &&
    (expectedLength === undefined || value.length === expectedLength) &&
    value.every((card) => typeof card === 'string' && CARD_PATTERN.test(card))
  );
}

function parsePokerDecisionRequest(value: unknown): PokerDecisionRequest | null {
  if (!value || typeof value !== 'object') return null;
  const body = value as Record<string, unknown>;

  if (
    typeof body.playerName !== 'string' ||
    !Object.hasOwn(BOT_STYLES, body.playerName) ||
    !isCardList(body.holeCards, 2) ||
    !isCardList(body.communityCards) ||
    body.communityCards.length > 5 ||
    typeof body.phase !== 'string' ||
    !GAME_PHASES.has(body.phase) ||
    !isChipValue(body.pot) ||
    !isChipValue(body.currentHighestBet) ||
    !isChipValue(body.currentBet) ||
    !isChipValue(body.stack) ||
    !isChipValue(body.minRaiseAmount) ||
    typeof body.canRaise !== 'boolean'
  ) {
    return null;
  }

  if (body.communityCards.length !== COMMUNITY_CARD_COUNTS[body.phase]) {
    return null;
  }

  const dealtCards = [...body.holeCards, ...body.communityCards];
  if (new Set(dealtCards).size !== dealtCards.length) {
    return null;
  }

  return body as unknown as PokerDecisionRequest;
}

function buildPokerPrompt(state: PokerDecisionRequest): string {
  const toCall = Math.max(0, state.currentHighestBet - state.currentBet);
  const communityCards = state.communityCards.length > 0
    ? state.communityCards.join(' ')
    : 'None (Pre-flop)';

  return `You are Texas Hold'em (6-Max SNG) player [${state.playerName}].
Playing style: ${BOT_STYLES[state.playerName]}.

Current table state:
- Your hole cards: [${state.holeCards.join(' ')}]
- Community cards: [${communityCards}]
- Betting round: ${state.phase}
- Pot size: $${state.pot}
- Current highest bet: $${state.currentHighestBet}
- Amount to call: $${toCall}
- Your stack: $${state.stack}
- Min raise: $${state.minRaiseAmount}
- Raising is currently allowed: ${state.canRaise ? 'yes' : 'no'}

Evaluate hand equity and pot odds according to your style. The action must be fold, check, call, raise, or allin. End with one JSON line, for example:
{"action":"raise","amount":1500000}`;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, { Allow: 'POST' });
  }

  const declaredLength = Number(req.headers.get('content-length') || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return jsonResponse({ error: 'Request body is too large' }, 413);
  }

  const rateLimit = consumeRateLimit(req);
  if (!rateLimit.allowed) {
    return jsonResponse(
      { error: 'Too many requests' },
      429,
      { 'Retry-After': String(rateLimit.retryAfterSeconds) }
    );
  }

  try {
    const rawBody = await req.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return jsonResponse({ error: 'Request body is too large' }, 413);
    }

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const state = parsePokerDecisionRequest(parsedBody);
    if (!state) {
      return jsonResponse({ error: 'Invalid poker decision request' }, 400);
    }

    const envUrl = process.env.FREELLMAPI_URL;
    const envKey = process.env.FREELLMAPI_KEY;
    const envModel = process.env.FREELLMAPI_MODEL;

    if (!envKey) {
      return jsonResponse({ error: 'FREELLMAPI_KEY is not configured on server' }, 500);
    }

    const baseUrl = (envUrl || 'https://free.icomefrom.asia/v1').replace(/\/+$/, '');
    const parsedUrl = new URL(baseUrl);
    if (parsedUrl.protocol !== 'https:') {
      throw new Error('FREELLMAPI_URL must use HTTPS');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12_000);

    try {
      const upstreamResponse = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${envKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: envModel || 'auto',
          messages: [{ role: 'user', content: buildPokerPrompt(state) }],
          max_tokens: 500,
          temperature: 0.25,
        }),
      });

      const data = await upstreamResponse.json();
      return jsonResponse(data, upstreamResponse.status);
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ error: message }, 500);
  }
}
