import { describe, expect, it } from 'vitest';
import {
  advanceToNextPhase,
  createInitialGameState,
  handlePlayerAction,
  resolveHandEnd,
  startHand,
} from './gameEngine';

function bettingState() {
  const state = createInitialGameState();
  state.phase = 'preflop';
  state.currentTurnSeat = 0;
  state.currentHighestBet = 500;
  state.minRaiseAmount = 500;
  state.pot = 750;
  state.players[0] = {
    ...state.players[0],
    chips: 5_000,
    currentBet: 0,
    totalHandBet: 0,
    isThinking: true,
    thinkingSeconds: 30,
  };
  return state;
}

describe('handlePlayerAction validation', () => {
  it('clamps an invalid raise target to the legal minimum', () => {
    const result = handlePlayerAction(bettingState(), 'raise', -100);
    const hero = result.players[0];

    expect(hero.currentBet).toBe(1_000);
    expect(hero.chips).toBe(4_000);
    expect(result.pot).toBe(1_750);
  });

  it('turns an under-minimum short-stack raise into an all-in', () => {
    const state = bettingState();
    state.players[0] = {
      ...state.players[0],
      chips: 300,
      currentBet: 400,
      totalHandBet: 400,
    };

    const result = handlePlayerAction(state, 'raise', 600);
    const hero = result.players[0];

    expect(hero.currentBet).toBe(700);
    expect(hero.chips).toBe(0);
    expect(hero.isAllIn).toBe(true);
    expect(result.pot).toBe(1_050);
  });

  it('normalizes an illegal check facing a bet into a call', () => {
    const result = handlePlayerAction(bettingState(), 'check');
    const hero = result.players[0];

    expect(hero.currentBet).toBe(500);
    expect(hero.chips).toBe(4_500);
    expect(hero.lastAction?.type).toBe('call');
  });

  it('does not reopen raising after an under-minimum all-in', () => {
    const state = bettingState();
    state.currentTurnSeat = 1;
    state.pot = 1_000;
    state.players = state.players.map((player, index) => ({
      ...player,
      folded: index > 1,
    }));
    state.players[0] = {
      ...state.players[0],
      chips: 5_000,
      currentBet: 500,
      totalHandBet: 500,
      hasActedThisRound: true,
      canRaise: false,
    };
    state.players[1] = {
      ...state.players[1],
      chips: 200,
      currentBet: 500,
      totalHandBet: 500,
      hasActedThisRound: false,
      canRaise: true,
    };

    const afterShortAllIn = handlePlayerAction(state, 'allin');
    expect(afterShortAllIn.currentTurnSeat).toBe(0);
    expect(afterShortAllIn.players[0].canRaise).toBe(false);

    const afterAttemptedAllIn = handlePlayerAction(afterShortAllIn, 'allin');
    expect(afterAttemptedAllIn.logs[0].text).toBe('You calls $200');
    expect(afterAttemptedAllIn.players[0].totalHandBet).toBe(700);

    const afterAttemptedRaise = handlePlayerAction(afterShortAllIn, 'raise', 1_200);
    expect(afterAttemptedRaise.logs[0].text).toBe('You calls $200');
    expect(afterAttemptedRaise.players[0].totalHandBet).toBe(700);
    expect(afterAttemptedRaise.players[0].currentBet).toBe(0);
    expect(afterAttemptedRaise.phase).toBe('hand_ended');
  });

  it('reopens raising after a full raise', () => {
    const state = bettingState();
    state.currentTurnSeat = 1;
    state.players[0] = {
      ...state.players[0],
      currentBet: 500,
      totalHandBet: 500,
      hasActedThisRound: true,
      canRaise: false,
    };
    state.players[1] = {
      ...state.players[1],
      chips: 5_000,
      currentBet: 500,
      totalHandBet: 500,
      canRaise: true,
    };

    const result = handlePlayerAction(state, 'raise', 1_000);

    expect(result.players[0].canRaise).toBe(true);
  });

  it('allows a checked player to raise a short opening all-in', () => {
    const state = bettingState();
    state.currentHighestBet = 0;
    state.pot = 0;
    state.players = state.players.map((player, index) => ({
      ...player,
      currentBet: 0,
      totalHandBet: 0,
      folded: index > 1,
    }));
    state.players[1] = {
      ...state.players[1],
      chips: 200,
    };

    const afterCheck = handlePlayerAction(state, 'check');
    expect(afterCheck.currentTurnSeat).toBe(1);
    expect(afterCheck.players[0].canRaise).toBe(true);

    const afterShortOpeningBet = handlePlayerAction(afterCheck, 'allin');
    expect(afterShortOpeningBet.currentTurnSeat).toBe(0);
    expect(afterShortOpeningBet.players[0].canRaise).toBe(true);

    const afterRaise = handlePlayerAction(afterShortOpeningBet, 'raise', 500);
    expect(afterRaise.logs[0].text).toBe('You raises to $500');
    expect(afterRaise.players[0].totalHandBet).toBe(500);
  });
});

describe('resolveHandEnd', () => {
  it('ranks simultaneous eliminations by their stack at the start of the hand', () => {
    const state = createInitialGameState();
    state.phase = 'hand_ended';
    state.players[0] = {
      ...state.players[0],
      chips: 0,
      totalHandBet: 1_000,
    };
    state.players[1] = {
      ...state.players[1],
      chips: 0,
      totalHandBet: 3_000,
    };

    const result = resolveHandEnd(state);

    expect(result.players[1].finishRank).toBe(5);
    expect(result.players[0].finishRank).toBe(6);
  });
});

describe('full hand flow', () => {
  it('preserves all tournament chips when every player but one folds', () => {
    let state = startHand(createInitialGameState());
    const initialTotal = state.players.reduce((sum, player) => sum + player.chips, 0) + state.pot;

    while (state.phase !== 'hand_ended' && state.phase !== 'tournament_ended') {
      state = handlePlayerAction(state, 'fold');
    }

    const finalTotal = state.players.reduce((sum, player) => sum + player.chips, 0);
    expect(initialTotal).toBe(60_000_000);
    expect(finalTotal).toBe(60_000_000);
    expect(state.handResults).toHaveLength(1);
  });

  it('resets the minimum opening bet to the big blind on a new street', () => {
    const state = startHand(createInitialGameState());
    state.minRaiseAmount = 2_000_000;

    const flop = advanceToNextPhase(state);

    expect(flop.phase).toBe('flop');
    expect(flop.minRaiseAmount).toBe(500_000);
  });
});
