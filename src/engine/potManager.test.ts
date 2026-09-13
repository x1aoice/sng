import { describe, expect, it } from 'vitest';
import type { Player } from './types';
import { awardPots, calculatePots } from './potManager';
import { createCard } from './deck';
import { evaluateHand } from './pokerEvaluator';

function contributor(id: string, totalHandBet: number, folded = false): Player {
  return {
    id,
    name: id,
    avatar: '',
    isUser: false,
    chips: 0,
    currentBet: 0,
    totalHandBet,
    cards: [],
    folded,
    isAllIn: true,
    hasActedThisRound: true,
    canRaise: false,
    eliminated: false,
    seatIndex: 0,
  };
}

describe('calculatePots', () => {
  it('builds main and side pots from unequal all-ins', () => {
    const pots = calculatePots([
      contributor('short', 1_000),
      contributor('middle', 3_000),
      contributor('deep', 5_000),
    ]);

    expect(pots).toEqual([
      { amount: 3_000, eligiblePlayerIds: ['short', 'middle', 'deep'] },
      { amount: 4_000, eligiblePlayerIds: ['middle', 'deep'] },
      { amount: 2_000, eligiblePlayerIds: ['deep'] },
    ]);
  });

  it('counts folded chips but excludes the folded player from winning', () => {
    const pots = calculatePots([
      contributor('folded', 1_000, true),
      contributor('live-a', 1_000),
      contributor('live-b', 1_000),
    ]);

    expect(pots).toEqual([
      { amount: 3_000, eligiblePlayerIds: ['live-a', 'live-b'] },
    ]);
  });

  it('splits a tied pot without losing an odd chip', () => {
    const tiedHand = evaluateHand([
      createCard('A', '♠'),
      createCard('K', '♥'),
      createCard('Q', '♦'),
      createCard('J', '♣'),
      createCard('9', '♠'),
    ]);
    const awards = awardPots(
      [{ amount: 1_001, eligiblePlayerIds: ['a', 'b'] }],
      new Map([['a', tiedHand], ['b', tiedHand]])
    );

    expect(awards.reduce((sum, award) => sum + award.amount, 0)).toBe(1_001);
    expect(awards.map((award) => award.amount)).toEqual([501, 500]);
  });
});
