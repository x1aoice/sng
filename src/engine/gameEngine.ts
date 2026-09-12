import type {
  Player,
  Card,
  GamePhase,
  ActionType,
  HandResult,
  BlindLevel,
  HandLog,
} from './types';
import { createDeck, shuffleDeck } from './deck';
import { evaluateHand } from './pokerEvaluator';
import { calculatePots, awardPots } from './potManager';
import { sound } from '../utils/sound';
import { formatTokens } from '../utils/format';

export const TOURNAMENT_BUY_IN = 10_000_000; // $10M Buy-in per player
export const TOTAL_PRIZE_POOL = TOURNAMENT_BUY_IN * 6; // $60M total prize pool
export const PAYOUT_FIRST_PLACE = Math.round(TOTAL_PRIZE_POOL * 0.70); // $42M (70%)
export const PAYOUT_SECOND_PLACE = Math.round(TOTAL_PRIZE_POOL * 0.30); // $18M (30%)

export const INITIAL_SB = 250_000;
export const INITIAL_BB = 500_000;

/**
 * Hyper SNG: Blinds double every single hand!
 * Hand 1: SB $250K / BB $500K (20 BB Starting Stack)
 * Hand 2: SB $500K / BB $1M
 * Hand 3: SB $1M / BB $2M
 * Hand 4: SB $2M / BB $4M
 * Hand 5: SB $4M / BB $8M
 * Hand 6: SB $8M / BB $16M
 * Hand 7+: Exponential x2 progression indefinitely
 */
export function getBlindForHand(handNumber: number): BlindLevel {
  const level = Math.max(1, handNumber);
  const factor = Math.pow(2, level - 1);
  return {
    level,
    sb: INITIAL_SB * factor,
    bb: INITIAL_BB * factor,
  };
}

export const BLIND_LEVELS: BlindLevel[] = Array.from({ length: 12 }, (_, i) => getBlindForHand(i + 1));

export const INITIAL_PLAYERS: Omit<
  Player,
  'cards' | 'currentBet' | 'totalHandBet' | 'folded' | 'isAllIn' | 'hasActedThisRound' | 'eliminated'
>[] = [
  {
    id: 'p0',
    name: 'You',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    isUser: true,
    chips: 10_000_000,
    seatIndex: 0, // Bottom center
  },
  {
    id: 'p1',
    name: 'Alex',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    isUser: false,
    chips: 10_000_000,
    seatIndex: 1, // Bottom left
  },
  {
    id: 'p2',
    name: 'Elena',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    isUser: false,
    chips: 10_000_000,
    seatIndex: 2, // Top left
  },
  {
    id: 'p3',
    name: 'Marcus',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    isUser: false,
    chips: 10_000_000,
    seatIndex: 3, // Top center
  },
  {
    id: 'p4',
    name: 'Sophia',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    isUser: false,
    chips: 10_000_000,
    seatIndex: 4, // Top right
  },
  {
    id: 'p5',
    name: 'Leo',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    isUser: false,
    chips: 10_000_000,
    seatIndex: 5, // Bottom right
  },
];

export interface GameState {
  players: Player[];
  communityCards: Card[];
  deck: Card[];
  pot: number;
  currentHighestBet: number;
  minRaiseAmount: number;
  dealerSeat: number;
  sbSeat: number;
  bbSeat: number;
  currentTurnSeat: number | null;
  phase: GamePhase;
  handNumber: number;
  blindLevelIndex: number;
  handsPerBlindLevel: number;
  handResults: HandResult[];
  logs: HandLog[];
  showdownCardsRevealed: boolean;
}

export function createInitialGameState(): GameState {
  const players: Player[] = INITIAL_PLAYERS.map((p) => ({
    ...p,
    cards: [] as Card[],
    currentBet: 0,
    totalHandBet: 0,
    folded: false,
    isAllIn: false,
    hasActedThisRound: false,
    eliminated: false,
  }));

  return {
    players,
    communityCards: [],
    deck: [],
    pot: 0,
    currentHighestBet: 0,
    minRaiseAmount: INITIAL_BB,
    dealerSeat: 1, // Alex starts as Dealer
    sbSeat: 2,
    bbSeat: 3,
    currentTurnSeat: null,
    phase: 'idle',
    handNumber: 0,
    blindLevelIndex: 0,
    handsPerBlindLevel: 1, // Hyper SNG: Blinds double every single hand!
    handResults: [],
    logs: [],
    showdownCardsRevealed: false,
  };
}

// Find next active player seat in clockwise direction
export function getNextActiveSeat(
  players: Player[],
  fromSeat: number,
  criteria: 'inTournament' | 'inHand' | 'canAct' = 'inTournament'
): number {
  const total = players.length;
  for (let i = 1; i <= total; i++) {
    const seat = (fromSeat + i) % total;
    const p = players[seat];
    if (criteria === 'inTournament' && !p.eliminated) {
      return seat;
    }
    if (criteria === 'inHand' && !p.eliminated && !p.folded) {
      return seat;
    }
    if (criteria === 'canAct' && !p.eliminated && !p.folded && !p.isAllIn) {
      return seat;
    }
  }
  return fromSeat;
}

// Count players matching criteria
export function countPlayers(
  players: Player[],
  criteria: 'inTournament' | 'inHand' | 'canAct'
): number {
  return players.filter((p) => {
    if (p.eliminated) return false;
    if (criteria === 'inTournament') return true;
    if (criteria === 'inHand') return !p.folded;
    if (criteria === 'canAct') return !p.folded && !p.isAllIn;
    return false;
  }).length;
}

export function startHand(state: GameState): GameState {
  const activePlayers = state.players.filter((p) => !p.eliminated);
  if (activePlayers.length <= 1) {
    const awardedPlayers = state.players.map((p) => {
      if (p.finishRank === 1 || (!p.eliminated && p.chips > 0)) {
        return { ...p, finishRank: 1, prizeWon: PAYOUT_FIRST_PLACE };
      }
      if (p.finishRank === 2) return { ...p, prizeWon: PAYOUT_SECOND_PLACE };
      return { ...p, prizeWon: 0 };
    });

    return {
      ...state,
      players: awardedPlayers,
      phase: 'tournament_ended',
    };
  }

  // Hyper SNG: Blinds double every single hand!
  const handNum = state.handNumber + 1;
  const currentBlind = getBlindForHand(handNum);
  const blindIndex = handNum - 1;

  // Rotate dealer
  const nextDealer = getNextActiveSeat(state.players, state.dealerSeat, 'inTournament');

  // Determine SB and BB
  let sbSeat: number;
  let bbSeat: number;
  if (activePlayers.length === 2) {
    sbSeat = nextDealer;
    bbSeat = getNextActiveSeat(state.players, sbSeat, 'inTournament');
  } else {
    sbSeat = getNextActiveSeat(state.players, nextDealer, 'inTournament');
    bbSeat = getNextActiveSeat(state.players, sbSeat, 'inTournament');
  }

  // Shuffle deck
  const deck = shuffleDeck(createDeck());

  // Reset players and deal 2 hole cards
  const updatedPlayers: Player[] = state.players.map((p) => ({
    ...p,
    cards: [] as Card[],
    currentBet: 0,
    totalHandBet: 0,
    folded: p.eliminated,
    isAllIn: false,
    hasActedThisRound: false,
    lastAction: undefined,
    isThinking: false,
    thinkingSeconds: undefined,
  }));

  // Deal 2 cards each
  for (let i = 0; i < 2; i++) {
    for (const p of updatedPlayers) {
      if (!p.eliminated && deck.length > 0) {
        p.cards.push(deck.pop()!);
      }
    }
  }

  // Deduct SB
  const sbPlayer = updatedPlayers[sbSeat];
  const actualSB = Math.min(sbPlayer.chips, currentBlind.sb);
  sbPlayer.chips -= actualSB;
  sbPlayer.currentBet = actualSB;
  sbPlayer.totalHandBet = actualSB;
  if (sbPlayer.chips === 0) sbPlayer.isAllIn = true;
  sbPlayer.lastAction = { type: 'bet' as ActionType, amount: actualSB, text: `SB ${formatTokens(actualSB)}` };

  // Deduct BB
  const bbPlayer = updatedPlayers[bbSeat];
  const actualBB = Math.min(bbPlayer.chips, currentBlind.bb);
  bbPlayer.chips -= actualBB;
  bbPlayer.currentBet = actualBB;
  bbPlayer.totalHandBet = actualBB;
  if (bbPlayer.chips === 0) bbPlayer.isAllIn = true;
  bbPlayer.lastAction = { type: 'bet' as ActionType, amount: actualBB, text: `BB ${formatTokens(actualBB)}` };

  const pot = actualSB + actualBB;
  const currentHighestBet = Math.max(actualSB, actualBB);
  const minRaiseAmount = currentBlind.bb;

  // First to act preflop: UTG (seat after BB)
  const firstTurn =
    activePlayers.length === 2
      ? sbSeat
      : getNextActiveSeat(updatedPlayers, bbSeat, 'canAct');

  sound.playCardDeal();

  const newLog: HandLog = {
    id: `hand-${state.handNumber + 1}`,
    round: 'Preflop',
    text: `Hand #${state.handNumber + 1} dealt. Blinds: ${formatTokens(currentBlind.sb)} / ${formatTokens(currentBlind.bb)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  return {
    ...state,
    players: updatedPlayers,
    communityCards: [],
    deck,
    pot,
    currentHighestBet,
    minRaiseAmount,
    dealerSeat: nextDealer,
    sbSeat,
    bbSeat,
    currentTurnSeat: firstTurn,
    phase: 'preflop',
    handNumber: state.handNumber + 1,
    blindLevelIndex: blindIndex,
    handResults: [],
    logs: [newLog, ...state.logs.slice(0, 30)],
    showdownCardsRevealed: false,
  };
}

export function handlePlayerAction(
  state: GameState,
  action: ActionType,
  amount?: number
): GameState {
  if (
    state.currentTurnSeat === null ||
    state.phase === 'idle' ||
    state.phase === 'showdown' ||
    state.phase === 'hand_ended'
  ) {
    return state;
  }

  const currentSeat = state.currentTurnSeat;
  const updatedPlayers = state.players.map((pl) => ({ ...pl }));
  const p = updatedPlayers[currentSeat];

  let pot = state.pot;
  let currentHighestBet = state.currentHighestBet;
  let minRaiseAmount = state.minRaiseAmount;
  let logText = '';

  const toCall = currentHighestBet - p.currentBet;

  switch (action) {
    case 'fold': {
      p.folded = true;
      p.lastAction = { type: 'fold', text: 'Fold' };
      logText = `${p.name} folds`;
      sound.playFold();
      break;
    }

    case 'check': {
      p.lastAction = { type: 'check', text: 'Check' };
      logText = `${p.name} checks`;
      sound.playCheck();
      break;
    }

    case 'call': {
      const callChips = Math.min(p.chips, toCall);
      p.chips -= callChips;
      p.currentBet += callChips;
      p.totalHandBet += callChips;
      pot += callChips;
      if (p.chips === 0) p.isAllIn = true;
      p.lastAction = { type: 'call', amount: callChips, text: `Call ${formatTokens(p.currentBet)}` };
      logText = `${p.name} calls ${formatTokens(callChips)}`;
      sound.playChip();
      break;
    }

    case 'bet':
    case 'raise': {
      const targetBet = amount || currentHighestBet + minRaiseAmount;
      const additionalChips = targetBet - p.currentBet;
      const actualBet = Math.min(p.chips, additionalChips);

      p.chips -= actualBet;
      const newBetTotal = p.currentBet + actualBet;
      const raiseDiff = newBetTotal - currentHighestBet;

      p.currentBet = newBetTotal;
      p.totalHandBet += actualBet;
      pot += actualBet;

      if (raiseDiff > 0) {
        minRaiseAmount = Math.max(minRaiseAmount, raiseDiff);
        currentHighestBet = newBetTotal;
      }

      if (p.chips === 0) p.isAllIn = true;

      const actName = action === 'bet' ? 'Bet' : 'Raise';
      p.lastAction = {
        type: action,
        amount: newBetTotal,
        text: `${actName} ${formatTokens(newBetTotal)}`,
      };
      logText = `${p.name} ${actName.toLowerCase()}s to ${formatTokens(newBetTotal)}`;
      sound.playChip();
      break;
    }

    case 'allin': {
      const allInAmount = p.chips;
      p.chips = 0;
      const newBetTotal = p.currentBet + allInAmount;
      const raiseDiff = newBetTotal - currentHighestBet;

      p.currentBet = newBetTotal;
      p.totalHandBet += allInAmount;
      pot += allInAmount;
      p.isAllIn = true;

      if (raiseDiff > 0) {
        minRaiseAmount = Math.max(minRaiseAmount, raiseDiff);
        currentHighestBet = newBetTotal;
      }

      p.lastAction = {
        type: 'allin',
        amount: newBetTotal,
        text: `All-in ${formatTokens(newBetTotal)}`,
      };
      logText = `${p.name} goes All-in with ${formatTokens(newBetTotal)}`;
      sound.playChip();
      break;
    }
  }

  p.hasActedThisRound = true;
  p.isThinking = false;

  const newLog: HandLog = {
    id: `log-${Date.now()}-${Math.random()}`,
    round: state.phase.toUpperCase(),
    text: logText,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const nextState: GameState = {
    ...state,
    players: updatedPlayers,
    pot,
    currentHighestBet,
    minRaiseAmount,
    logs: [newLog, ...state.logs.slice(0, 30)],
  };

  return progressGameRound(nextState);
}

// Progress game round: check if hand ends, or advance phase, or next turn
export function progressGameRound(state: GameState): GameState {
  const playersInHand = state.players.filter((p) => !p.eliminated && !p.folded);

  // 1. Only 1 player remaining (everyone else folded)
  if (playersInHand.length <= 1) {
    const winner = playersInHand[0];
    const updatedPlayers = state.players.map((p) => {
      if (p.id === winner.id) {
        return { ...p, chips: p.chips + state.pot };
      }
      return p;
    });

    const handResult: HandResult = {
      playerId: winner.id,
      wonAmount: state.pot,
      description: 'Everyone else folded',
    };

    sound.playWin();

    return resolveHandEnd({
      ...state,
      players: updatedPlayers,
      handResults: [handResult],
      phase: 'hand_ended',
      currentTurnSeat: null,
    });
  }

  // 2. Check if betting round is completed
  const activeCanAct = state.players.filter((p) => !p.eliminated && !p.folded && !p.isAllIn);
  const isRoundComplete =
    activeCanAct.length === 0 ||
    activeCanAct.every((p) => p.hasActedThisRound && p.currentBet === state.currentHighestBet);

  if (!isRoundComplete) {
    // Next turn in current betting round
    const nextTurn = getNextActiveSeat(state.players, state.currentTurnSeat!, 'canAct');
    return {
      ...state,
      currentTurnSeat: nextTurn,
    };
  }

  return advanceToNextPhase(state);
}

export function advanceToNextPhase(state: GameState): GameState {
  const updatedPlayers = state.players.map((p) => ({
    ...p,
    currentBet: 0,
    hasActedThisRound: false,
    lastAction: undefined,
  }));

  const deck = [...state.deck];
  const communityCards = [...state.communityCards];

  if (state.phase === 'preflop') {
    // Deal Flop (burn 1, deal 3)
    if (deck.length > 3) {
      deck.pop(); // burn
      communityCards.push(deck.pop()!, deck.pop()!, deck.pop()!);
    }
    sound.playCardFlip();
    const canActCount = countPlayers(updatedPlayers, 'canAct');
    const firstTurn = canActCount > 0 ? getNextActiveSeat(updatedPlayers, state.dealerSeat, 'canAct') : null;

    const nextState: GameState = {
      ...state,
      players: updatedPlayers,
      deck,
      communityCards,
      currentHighestBet: 0,
      phase: 'flop',
      currentTurnSeat: firstTurn,
    };

    if (canActCount <= 1) {
      return advanceToNextPhase(nextState);
    }
    return nextState;
  }

  if (state.phase === 'flop') {
    // Deal Turn (burn 1, deal 1)
    if (deck.length > 1) {
      deck.pop(); // burn
      communityCards.push(deck.pop()!);
    }
    sound.playCardFlip();
    const canActCount = countPlayers(updatedPlayers, 'canAct');
    const firstTurn = canActCount > 0 ? getNextActiveSeat(updatedPlayers, state.dealerSeat, 'canAct') : null;

    const nextState: GameState = {
      ...state,
      players: updatedPlayers,
      deck,
      communityCards,
      currentHighestBet: 0,
      phase: 'turn',
      currentTurnSeat: firstTurn,
    };

    if (canActCount <= 1) {
      return advanceToNextPhase(nextState);
    }
    return nextState;
  }

  if (state.phase === 'turn') {
    // Deal River (burn 1, deal 1)
    if (deck.length > 1) {
      deck.pop(); // burn
      communityCards.push(deck.pop()!);
    }
    sound.playCardFlip();
    const canActCount = countPlayers(updatedPlayers, 'canAct');
    const firstTurn = canActCount > 0 ? getNextActiveSeat(updatedPlayers, state.dealerSeat, 'canAct') : null;

    const nextState: GameState = {
      ...state,
      players: updatedPlayers,
      deck,
      communityCards,
      currentHighestBet: 0,
      phase: 'river',
      currentTurnSeat: firstTurn,
    };

    if (canActCount <= 1) {
      return advanceToNextPhase(nextState);
    }
    return nextState;
  }

  if (state.phase === 'river') {
    // Showdown!
    return resolveShowdown({
      ...state,
      players: updatedPlayers,
      currentTurnSeat: null,
      phase: 'showdown',
      showdownCardsRevealed: true,
    });
  }

  return state;
}

// Showdown evaluation and pot distribution
export function resolveShowdown(state: GameState): GameState {
  const activePlayers = state.players.filter((p) => !p.eliminated && !p.folded);
  const evaluations = new Map();

  for (const p of activePlayers) {
    const handEval = evaluateHand([...p.cards, ...state.communityCards]);
    evaluations.set(p.id, handEval);
  }

  const sidePots = calculatePots(state.players);
  const awardList = awardPots(sidePots, evaluations);

  const updatedPlayers = state.players.map((p) => {
    const winItem = awardList.find((a) => a.playerId === p.id);
    if (winItem) {
      return { ...p, chips: p.chips + winItem.amount };
    }
    return p;
  });

  const handResults: HandResult[] = awardList.map((a) => {
    const p = state.players.find((pl) => pl.id === a.playerId)!;
    const handEval = evaluations.get(a.playerId);
    return {
      playerId: a.playerId,
      evaluation: handEval,
      wonAmount: a.amount,
      description: `${p.name} won ${formatTokens(a.amount, true)} with ${handEval?.description || ''}`,
    };
  });

  sound.playWin();

  return resolveHandEnd({
    ...state,
    players: updatedPlayers,
    handResults,
    phase: 'hand_ended',
    currentTurnSeat: null,
    showdownCardsRevealed: true,
  });
}

// Check eliminations and update tournament ranks
export function resolveHandEnd(state: GameState): GameState {
  const activeBefore = state.players.filter((p) => !p.eliminated).length;

  let currentRank = activeBefore;
  const updatedPlayers = state.players.map((p) => {
    if (!p.eliminated && p.chips <= 0) {
      return {
        ...p,
        eliminated: true,
        finishRank: currentRank--,
      };
    }
    return p;
  });

  const remaining = updatedPlayers.filter((p) => !p.eliminated);
  if (remaining.length === 1) {
    // We have a winner!
    remaining[0].finishRank = 1;

    const awardedPlayers = updatedPlayers.map((p) => {
      if (p.finishRank === 1) return { ...p, prizeWon: PAYOUT_FIRST_PLACE };
      if (p.finishRank === 2) return { ...p, prizeWon: PAYOUT_SECOND_PLACE };
      return { ...p, prizeWon: 0 };
    });

    return {
      ...state,
      players: awardedPlayers,
      phase: 'tournament_ended',
    };
  }

  return {
    ...state,
    players: updatedPlayers,
  };
}
