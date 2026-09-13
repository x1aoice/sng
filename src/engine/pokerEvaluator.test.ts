import { describe, expect, it } from 'vitest';
import { createCard } from './deck';
import { compareHands, evaluateHand } from './pokerEvaluator';

describe('pokerEvaluator', () => {
  it('recognizes a royal flush', () => {
    const hand = evaluateHand([
      createCard('A', '♠'),
      createCard('K', '♠'),
      createCard('Q', '♠'),
      createCard('J', '♠'),
      createCard('T', '♠'),
      createCard('2', '♦'),
      createCard('3', '♣'),
    ]);

    expect(hand.category).toBe('Royal Flush');
  });

  it('ranks a six-high straight above a wheel', () => {
    const wheel = evaluateHand([
      createCard('A', '♠'),
      createCard('2', '♥'),
      createCard('3', '♦'),
      createCard('4', '♣'),
      createCard('5', '♠'),
    ]);
    const sixHigh = evaluateHand([
      createCard('2', '♠'),
      createCard('3', '♥'),
      createCard('4', '♦'),
      createCard('5', '♣'),
      createCard('6', '♠'),
    ]);

    expect(compareHands(sixHigh, wheel)).toBeGreaterThan(0);
  });
});
