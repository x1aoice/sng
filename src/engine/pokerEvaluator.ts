import type { Card, HandEvaluation } from './types';
import { RANK_NAMES } from './deck';

function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];
  const head = arr[0];
  const tail = arr.slice(1);
  const withHead = getCombinations(tail, k - 1).map((c) => [head, ...c]);
  const withoutHead = getCombinations(tail, k);
  return [...withHead, ...withoutHead];
}

/**
 * Evaluates exactly 5 cards.
 */
function evaluate5Cards(cards: Card[]): HandEvaluation {
  // Sort cards descending by value
  const sorted = [...cards].sort((a, b) => b.value - a.value);

  const values = sorted.map((c) => c.value);
  const suits = sorted.map((c) => c.suit);

  const isFlush = suits.every((s) => s === suits[0]);

  // Check straight
  let isStraight = false;
  let straightHigh = 0;

  // Regular straight
  if (
    values[0] - values[1] === 1 &&
    values[1] - values[2] === 1 &&
    values[2] - values[3] === 1 &&
    values[3] - values[4] === 1
  ) {
    isStraight = true;
    straightHigh = values[0];
  } else if (
    // Wheel straight: A-2-3-4-5 (14, 5, 4, 3, 2)
    values[0] === 14 &&
    values[1] === 5 &&
    values[2] === 4 &&
    values[3] === 3 &&
    values[4] === 2
  ) {
    isStraight = true;
    straightHigh = 5; // In wheel, 5 is the high card
  }

  // Count frequencies
  const counts: Record<number, number> = {};
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
  }

  // Group by frequency descending, then by value descending
  const groups = Object.entries(counts)
    .map(([valStr, count]) => ({ value: Number(valStr), count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.value - a.value;
    });

  // Calculate score helper: categoryScore * 10^10 + ranks
  const calcScore = (cat: number, orderedRanks: number[]) => {
    let s = cat * 1e10;
    let multiplier = 1e8;
    for (const r of orderedRanks) {
      s += r * multiplier;
      multiplier /= 100;
    }
    return s;
  };

  const getRankName = (val: number): string => {
    const card = cards.find((c) => c.value === val);
    return card ? RANK_NAMES[card.rank] : val.toString();
  };

  // 1. Royal Flush & Straight Flush
  if (isFlush && isStraight) {
    if (straightHigh === 14) {
      return {
        category: 'Royal Flush',
        categoryScore: 9,
        score: calcScore(9, [14]),
        bestFiveCards: sorted,
        description: 'Royal Flush',
      };
    }
    return {
      category: 'Straight Flush',
      categoryScore: 8,
      score: calcScore(8, [straightHigh]),
      bestFiveCards: sorted,
      description: `Straight Flush, ${getRankName(straightHigh)} High`,
    };
  }

  // 2. Four of a Kind
  if (groups[0].count === 4) {
    const quadVal = groups[0].value;
    const kickerVal = groups[1].value;
    return {
      category: 'Four of a Kind',
      categoryScore: 7,
      score: calcScore(7, [quadVal, kickerVal]),
      bestFiveCards: sorted,
      description: `Four of a Kind, ${getRankName(quadVal)}s`,
    };
  }

  // 3. Full House
  if (groups[0].count === 3 && groups[1].count === 2) {
    const tripVal = groups[0].value;
    const pairVal = groups[1].value;
    return {
      category: 'Full House',
      categoryScore: 6,
      score: calcScore(6, [tripVal, pairVal]),
      bestFiveCards: sorted,
      description: `Full House, ${getRankName(tripVal)}s full of ${getRankName(pairVal)}s`,
    };
  }

  // 4. Flush
  if (isFlush) {
    return {
      category: 'Flush',
      categoryScore: 5,
      score: calcScore(5, values),
      bestFiveCards: sorted,
      description: `Flush, ${getRankName(values[0])} High`,
    };
  }

  // 5. Straight
  if (isStraight) {
    return {
      category: 'Straight',
      categoryScore: 4,
      score: calcScore(4, [straightHigh]),
      bestFiveCards: sorted,
      description: `Straight, ${getRankName(straightHigh)} High`,
    };
  }

  // 6. Three of a Kind
  if (groups[0].count === 3) {
    const tripVal = groups[0].value;
    const kickers = [groups[1].value, groups[2].value];
    return {
      category: 'Three of a Kind',
      categoryScore: 3,
      score: calcScore(3, [tripVal, ...kickers]),
      bestFiveCards: sorted,
      description: `Three of a Kind, ${getRankName(tripVal)}s`,
    };
  }

  // 7. Two Pair
  if (groups[0].count === 2 && groups[1].count === 2) {
    const pair1 = groups[0].value;
    const pair2 = groups[1].value;
    const kicker = groups[2].value;
    return {
      category: 'Two Pair',
      categoryScore: 2,
      score: calcScore(2, [pair1, pair2, kicker]),
      bestFiveCards: sorted,
      description: `Two Pair, ${getRankName(pair1)}s and ${getRankName(pair2)}s`,
    };
  }

  // 8. One Pair
  if (groups[0].count === 2) {
    const pairVal = groups[0].value;
    const kickers = [groups[1].value, groups[2].value, groups[3].value];
    return {
      category: 'One Pair',
      categoryScore: 1,
      score: calcScore(1, [pairVal, ...kickers]),
      bestFiveCards: sorted,
      description: `Pair of ${getRankName(pairVal)}s, ${getRankName(kickers[0])} Kicker`,
    };
  }

  // 9. High Card
  return {
    category: 'High Card',
    categoryScore: 0,
    score: calcScore(0, values),
    bestFiveCards: sorted,
    description: `High Card, ${getRankName(values[0])}`,
  };
}

/**
 * Evaluates best hand from up to 7 cards (hole cards + community cards).
 */
export function evaluateHand(cards: Card[]): HandEvaluation {
  if (cards.length === 0) {
    return {
      category: 'High Card',
      categoryScore: 0,
      score: 0,
      bestFiveCards: [],
      description: 'No cards',
    };
  }

  if (cards.length <= 5) {
    return evaluate5Cards(cards);
  }

  // If 6 or 7 cards, check all combinations of 5 cards
  const combinations = getCombinations(cards, 5);
  let bestEval: HandEvaluation | null = null;

  for (const combo of combinations) {
    const currentEval = evaluate5Cards(combo);
    if (!bestEval || currentEval.score > bestEval.score) {
      bestEval = currentEval;
    }
  }

  return bestEval!;
}

/**
 * Compares two hand evaluations.
 * Returns > 0 if A wins, < 0 if B wins, 0 if tie.
 */
export function compareHands(a: HandEvaluation, b: HandEvaluation): number {
  return a.score - b.score;
}

