import type { Player, Card, GamePhase, ActionType } from '../engine/types';
import { evaluateHand } from '../engine/pokerEvaluator';

export interface BotPersonality {
  tightness: number;   // 0 (very loose) .. 1 (very tight)
  aggression: number;  // 0 (passive) .. 1 (hyper aggressive)
  bluffFrequency: number; // 0..0.4
}

export const BOT_PERSONALITIES: Record<string, BotPersonality> = {
  Marcus: {
    tightness: 0.25,
    aggression: 0.85,
    bluffFrequency: 0.28,
  },
  Leo: {
    tightness: 0.35,
    aggression: 0.80,
    bluffFrequency: 0.22,
  },
  Alex: {
    tightness: 0.55,
    aggression: 0.65,
    bluffFrequency: 0.15,
  },
  Elena: {
    tightness: 0.30,
    aggression: 0.60,
    bluffFrequency: 0.25,
  },
  Sophia: {
    tightness: 0.70,
    aggression: 0.50,
    bluffFrequency: 0.08,
  },
};

/**
 * Basic preflop score (0..100) using high card values, pairs, suitedness, connectors.
 */
function getPreflopStrength(holeCards: Card[]): number {
  if (holeCards.length < 2) return 0;
  const [c1, c2] = holeCards;
  const high = Math.max(c1.value, c2.value);
  const low = Math.min(c1.value, c2.value);
  const isPair = high === low;
  const isSuited = c1.suit === c2.suit;
  const gap = high - low;

  let score = high * 4 + low * 2;
  if (isPair) score += 35 + high * 2;
  if (isSuited) score += 8;
  if (gap === 1) score += 5;
  else if (gap === 2) score += 3;

  return Math.min(100, Math.max(0, score));
}

export interface BotDecision {
  action: ActionType;
  amount: number;
}

export function decideBotAction(
  bot: Player,
  communityCards: Card[],
  pot: number,
  currentHighestBet: number,
  minRaiseAmount: number,
  phase: GamePhase
): BotDecision {
  const personality = BOT_PERSONALITIES[bot.name] || {
    tightness: 0.45,
    aggression: 0.6,
    bluffFrequency: 0.15,
  };

  const callAmount = currentHighestBet - bot.currentBet;
  const totalPot = pot;
  const potOdds = callAmount > 0 ? callAmount / (totalPot + callAmount) : 0;

  // Evaluate hand strength
  let handStrength = 0;
  if (phase === 'preflop') {
    const preflopScore = getPreflopStrength(bot.cards);
    handStrength = preflopScore / 100;
  } else {
    const handEval = evaluateHand([...bot.cards, ...communityCards]);
    handStrength = Math.min(1, handEval.categoryScore / 6 + 0.1);
  }

  // Factor in bluff roll
  const willBluff = Math.random() < personality.bluffFrequency;
  const effectiveStrength = willBluff ? Math.max(handStrength, 0.7) : handStrength;

  const bbCount = minRaiseAmount > 0 ? bot.chips / minRaiseAmount : 100;

  // Hyper SNG Short-Stack Push/Fold Strategy:
  // When stack is under 10 BB (and especially under 5 BB), players push or fold
  if (phase === 'preflop' && bbCount <= 10) {
    if (callAmount <= 0) {
      // First in or unraised: shove all-in with reasonable hands
      const pushThreshold = bbCount <= 5 ? 0.32 : 0.42;
      if (effectiveStrength >= pushThreshold) {
        return { action: 'allin', amount: bot.chips };
      }
      return { action: 'check', amount: 0 };
    } else {
      // Facing a raise/bet
      const callShoveThreshold = bbCount <= 5 ? 0.35 : 0.48;
      if (effectiveStrength >= callShoveThreshold || (potOdds <= 0.30 && effectiveStrength > 0.28)) {
        return { action: callAmount >= bot.chips ? 'allin' : 'call', amount: Math.min(bot.chips, callAmount) };
      }
      return { action: 'fold', amount: 0 };
    }
  }

  // Case 1: Can check (no bet to call)
  if (callAmount <= 0) {
    const shouldBet = effectiveStrength > 0.45 + personality.tightness * 0.2;
    if (shouldBet && Math.random() < personality.aggression) {
      const betPct = [0.33, 0.5, 0.75, 1.0][Math.floor(Math.random() * 4)];
      let betAmount = Math.round(totalPot * betPct);
      betAmount = Math.max(minRaiseAmount, betAmount);
      betAmount = Math.min(bot.chips, betAmount);

      if (betAmount >= bot.chips) {
        return { action: 'allin', amount: bot.chips };
      }
      return { action: 'bet', amount: betAmount };
    }
    return { action: 'check', amount: 0 };
  }

  // Case 2: Facing a bet (callAmount > 0)
  if (callAmount >= bot.chips) {
    if (effectiveStrength > 0.55 || (potOdds < 0.25 && effectiveStrength > 0.35)) {
      return { action: 'allin', amount: bot.chips };
    }
    return { action: 'fold', amount: 0 };
  }

  // Consider raise if strong hand
  const canRaise = bot.chips > callAmount + minRaiseAmount;
  const shouldRaise =
    canRaise &&
    ((effectiveStrength > 0.75 && Math.random() < personality.aggression) ||
      (willBluff && Math.random() < 0.3));

  if (shouldRaise) {
    const raiseSize = Math.min(
      bot.chips,
      callAmount + Math.round(totalPot * (0.5 + Math.random() * 0.5))
    );
    if (raiseSize >= bot.chips) {
      return { action: 'allin', amount: bot.chips };
    }
    return { action: 'raise', amount: raiseSize };
  }

  // Consider call vs fold based on pot odds and hand strength
  const callThreshold = Math.max(0.15, potOdds * (0.8 + personality.tightness * 0.4));
  if (effectiveStrength >= callThreshold) {
    return { action: 'call', amount: callAmount };
  }

  // Otherwise fold
  return { action: 'fold', amount: 0 };
}
