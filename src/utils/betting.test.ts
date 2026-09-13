import { describe, expect, it } from 'vitest';
import { getBettingBounds, isAllInTarget } from './betting';

describe('betting controls', () => {
  it('compares an action target with the total stack footprint', () => {
    const bounds = getBettingBounds(
      { chips: 9_750, currentBet: 250, canRaise: true },
      500,
      500
    );

    expect(bounds).toEqual({
      minTarget: 1_000,
      maxTarget: 10_000,
      canIncreaseBet: true,
    });
    expect(isAllInTarget(9_750, bounds.maxTarget)).toBe(false);
    expect(isAllInTarget(10_000, bounds.maxTarget)).toBe(true);
  });

  it('uses the all-in target when a short stack cannot make a full raise', () => {
    const bounds = getBettingBounds(
      { chips: 300, currentBet: 400, canRaise: true },
      500,
      500
    );

    expect(bounds.minTarget).toBe(700);
    expect(bounds.maxTarget).toBe(700);
  });

  it('allows completion to the minimum bet after a short opening all-in', () => {
    const bounds = getBettingBounds(
      { chips: 5_000, currentBet: 0, canRaise: true },
      200,
      500
    );

    expect(bounds.minTarget).toBe(500);
  });
});
