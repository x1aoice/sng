interface BettingPlayerState {
  chips: number;
  currentBet: number;
  canRaise: boolean;
}

export interface BettingBounds {
  maxTarget: number;
  minTarget: number;
  canIncreaseBet: boolean;
}

export function getBettingBounds(
  player: BettingPlayerState,
  currentHighestBet: number,
  minRaiseAmount: number
): BettingBounds {
  const maxTarget = player.chips + player.currentBet;
  const legalMinimum = currentHighestBet === 0 || currentHighestBet < minRaiseAmount
    ? minRaiseAmount
    : currentHighestBet + minRaiseAmount;

  return {
    maxTarget,
    minTarget: Math.min(maxTarget, legalMinimum),
    canIncreaseBet: player.canRaise && maxTarget > currentHighestBet,
  };
}

export function isAllInTarget(target: number, maxTarget: number): boolean {
  return target >= maxTarget;
}
