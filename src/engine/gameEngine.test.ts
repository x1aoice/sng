import { describe, expect, it } from 'vitest';
import { createInitialGameState, handlePlayerAction } from './gameEngine';

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
});
