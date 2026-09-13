export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number; // 2..14 (T=10, J=11, Q=12, K=13, A=14)
}

export type HandRankCategory =
  | 'High Card'
  | 'One Pair'
  | 'Two Pair'
  | 'Three of a Kind'
  | 'Straight'
  | 'Flush'
  | 'Full House'
  | 'Four of a Kind'
  | 'Straight Flush'
  | 'Royal Flush';

export interface HandEvaluation {
  category: HandRankCategory;
  categoryScore: number; // 0..9
  score: number; // calculated total score for precise kicker comparisons
  bestFiveCards: Card[];
  description: string;
}

export type GamePhase =
  | 'idle'
  | 'preflop'
  | 'flop'
  | 'turn'
  | 'river'
  | 'showdown'
  | 'hand_ended'
  | 'tournament_ended';

export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allin';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isUser: boolean;
  chips: number;
  currentBet: number;       // In current betting round (preflop/flop/turn/river)
  totalHandBet: number;     // In whole hand, for side pot calculations
  cards: Card[];
  folded: boolean;
  isAllIn: boolean;
  hasActedThisRound: boolean;
  canRaise: boolean;         // false after acting until a full raise reopens betting
  eliminated: boolean;
  finishRank?: number;      // 1st, 2nd, ... 6th
  prizeWon?: number;        // Tournament payout prize ($42M for 1st, $18M for 2nd)
  verified?: boolean;
  badge?: 'openai' | 'vercel' | 'framer' | 'twitter' | 'none';
  lastAction?: {
    type: ActionType;
    amount?: number;
    text: string;
  };
  isThinking?: boolean;
  thinkingSeconds?: number;
  seatIndex: number;
}

export interface SidePot {
  amount: number;
  eligiblePlayerIds: string[];
}

export interface HandResult {
  playerId: string;
  evaluation?: HandEvaluation;
  wonAmount: number;
  description: string;
}

export interface BlindLevel {
  level: number;
  sb: number;
  bb: number;
}

export interface HandLog {
  id: string;
  round: string;
  text: string;
  timestamp: string;
}
