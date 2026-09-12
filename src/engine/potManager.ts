import type { Player, SidePot, HandEvaluation } from './types';

/**
 * Calculates side pots from player contributions across the entire hand.
 */
export function calculatePots(players: Player[]): SidePot[] {
  // Only players who contributed chips
  const contributors = players
    .filter((p) => p.totalHandBet > 0)
    .map((p) => ({
      playerId: p.id,
      amount: p.totalHandBet,
      folded: p.folded,
    }));

  if (contributors.length === 0) return [];

  // Distinct non-zero bet levels sorted ascending
  const uniqueLevels = Array.from(new Set(contributors.map((c) => c.amount))).sort((a, b) => a - b);

  const pots: SidePot[] = [];
  let previousLevel = 0;

  for (const level of uniqueLevels) {
    const tierContribution = level - previousLevel;
    if (tierContribution <= 0) continue;

    let potAmount = 0;
    const eligiblePlayerIds: string[] = [];

    for (const c of contributors) {
      if (c.amount >= level) {
        potAmount += tierContribution;
        // Only active (non-folded) players are eligible to win the pot
        if (!c.folded) {
          eligiblePlayerIds.push(c.playerId);
        }
      } else if (c.amount > previousLevel) {
        potAmount += c.amount - previousLevel;
      }
    }

    if (potAmount > 0 && eligiblePlayerIds.length > 0) {
      pots.push({
        amount: potAmount,
        eligiblePlayerIds,
      });
    } else if (potAmount > 0 && eligiblePlayerIds.length === 0 && pots.length > 0) {
      // If all eligible folded, roll over to the previous pot
      pots[pots.length - 1].amount += potAmount;
    }

    previousLevel = level;
  }

  return pots;
}

export interface PotAwardResult {
  playerId: string;
  amount: number;
}

/**
 * Distributes pots among eligible players based on hand evaluations.
 */
export function awardPots(
  pots: SidePot[],
  playerEvaluations: Map<string, HandEvaluation>
): PotAwardResult[] {
  const awards = new Map<string, number>();

  for (const pot of pots) {
    if (pot.eligiblePlayerIds.length === 1) {
      // Only one player eligible, wins by default
      const winnerId = pot.eligiblePlayerIds[0];
      awards.set(winnerId, (awards.get(winnerId) || 0) + pot.amount);
      continue;
    }

    // Find best evaluation among eligible players
    let bestScore = -Infinity;
    let winners: string[] = [];

    for (const pid of pot.eligiblePlayerIds) {
      const evalResult = playerEvaluations.get(pid);
      if (!evalResult) continue;

      if (evalResult.score > bestScore) {
        bestScore = evalResult.score;
        winners = [pid];
      } else if (evalResult.score === bestScore) {
        winners.push(pid);
      }
    }

    if (winners.length > 0) {
      const splitAmount = Math.floor(pot.amount / winners.length);
      let remainder = pot.amount % winners.length;

      for (const wid of winners) {
        let win = splitAmount;
        if (remainder > 0) {
          win += 1;
          remainder--;
        }
        awards.set(wid, (awards.get(wid) || 0) + win);
      }
    }
  }

  return Array.from(awards.entries()).map(([playerId, amount]) => ({
    playerId,
    amount,
  }));
}

