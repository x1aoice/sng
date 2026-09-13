import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Player } from '../engine/types';
import { createCard } from '../engine/deck';
import { decideBotActionWithLLM } from './llmService';

const bot: Player = {
  id: 'p5',
  name: 'Leo',
  avatar: '',
  isUser: false,
  chips: 9_500_000,
  currentBet: 500_000,
  totalHandBet: 500_000,
  cards: [createCard('A', '♠'), createCard('K', '♠')],
  folded: false,
  isAllIn: false,
  hasActedThisRound: false,
  canRaise: true,
  eliminated: false,
  seatIndex: 5,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('decideBotActionWithLLM', () => {
  it('sends structured poker state and uses the final decision object', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({
      choices: [{
        message: {
          content: 'Example {"action":"fold"}\nFinal {"action":"raise","amount":1500000}',
        },
      }],
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const decision = await decideBotActionWithLLM(
      bot,
      [createCard('Q', '♦'), createCard('J', '♣'), createCard('2', '♥')],
      2_000_000,
      500_000,
      500_000,
      'flop'
    );

    expect(decision).toEqual({ action: 'raise', amount: 1_500_000 });
    const request = fetchMock.mock.calls[0][1];
    const body = JSON.parse(String(request?.body));
    expect(body).toEqual({
      playerName: 'Leo',
      holeCards: ['A♠', 'K♠'],
      communityCards: ['Q♦', 'J♣', '2♥'],
      phase: 'flop',
      pot: 2_000_000,
      currentHighestBet: 500_000,
      currentBet: 500_000,
      stack: 9_500_000,
      minRaiseAmount: 500_000,
      canRaise: true,
    });
  });
});
