import { describe, expect, it } from 'vitest';
import type { Player } from './types';
import { calculatePots } from './potManager';

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
});
