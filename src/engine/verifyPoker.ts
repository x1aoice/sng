import { createCard } from './deck';
import { evaluateHand, compareHands } from './pokerEvaluator';
import { calculatePots, awardPots } from './potManager';
import type { Player } from './types';

function runTests() {
  console.log('--- Running Poker Hand Evaluation Tests ---');

  // Test 1: Royal Flush vs Straight Flush
  const royalCards = [
    createCard('A', '♠'),
    createCard('K', '♠'),
    createCard('Q', '♠'),
    createCard('J', '♠'),
    createCard('T', '♠'),
    createCard('2', '♦'),
    createCard('3', '♣'),
  ];
  const sfCards = [
    createCard('9', '♥'),
    createCard('8', '♥'),
    createCard('7', '♥'),
    createCard('6', '♥'),
    createCard('5', '♥'),
    createCard('K', '♦'),
    createCard('A', '♣'),
  ];
  const royalEval = evaluateHand(royalCards);
  const sfEval = evaluateHand(sfCards);
  console.log('Royal Flush:', royalEval.category, royalEval.description);
  console.log('Straight Flush:', sfEval.category, sfEval.description);
  console.assert(royalEval.category === 'Royal Flush', 'Should be Royal Flush');
  console.assert(sfEval.category === 'Straight Flush', 'Should be Straight Flush');
  console.assert(compareHands(royalEval, sfEval) > 0, 'Royal Flush beats Straight Flush');

  // Test 2: Full House vs Flush
  const fhCards = [
    createCard('K', '♠'),
    createCard('K', '♦'),
    createCard('K', '♣'),
    createCard('T', '♠'),
    createCard('T', '♥'),
    createCard('2', '♦'),
    createCard('3', '♣'),
  ];
  const flushCards = [
    createCard('A', '♦'),
    createCard('J', '♦'),
    createCard('8', '♦'),
    createCard('6', '♦'),
    createCard('2', '♦'),
    createCard('K', '♠'),
    createCard('Q', '♣'),
  ];
  const fhEval = evaluateHand(fhCards);
  const flushEval = evaluateHand(flushCards);
  console.log('Full House:', fhEval.description);
  console.log('Flush:', flushEval.description);
  console.assert(fhEval.category === 'Full House', 'Should be Full House');
  console.assert(flushEval.category === 'Flush', 'Should be Flush');
  console.assert(compareHands(fhEval, flushEval) > 0, 'Full House beats Flush');

  // Test 3: Two pair with kicker tiebreaker
  const tpCards1 = [
    createCard('A', '♠'),
    createCard('A', '♦'),
    createCard('K', '♠'),
    createCard('K', '♦'),
    createCard('Q', '♠'), // Queen kicker
    createCard('2', '♣'),
    createCard('3', '♣'),
  ];
  const tpCards2 = [
    createCard('A', '♣'),
    createCard('A', '♥'),
    createCard('K', '♣'),
    createCard('K', '♥'),
    createCard('J', '♠'), // Jack kicker
    createCard('2', '♦'),
    createCard('3', '♦'),
  ];
  const tp1 = evaluateHand(tpCards1);
  const tp2 = evaluateHand(tpCards2);
  console.log('Two Pair 1:', tp1.description);
  console.log('Two Pair 2:', tp2.description);
  console.assert(compareHands(tp1, tp2) > 0, 'Queen kicker beats Jack kicker');

  // Test 4: Side Pots
  console.log('--- Testing Side Pot Calculation ---');
  const dummyPlayers: Player[] = [
    {
      id: 'p1',
      name: 'Player 1 (Short)',
      chips: 0,
      totalHandBet: 1000,
      currentBet: 0,
      cards: [],
      folded: false,
      isAllIn: true,
      hasActedThisRound: true,
      eliminated: false,
      isUser: false,
      avatar: '',
      seatIndex: 0,
    },
    {
      id: 'p2',
      name: 'Player 2 (Medium)',
      chips: 0,
      totalHandBet: 3000,
      currentBet: 0,
      cards: [],
      folded: false,
      isAllIn: true,
      hasActedThisRound: true,
      eliminated: false,
      isUser: false,
      avatar: '',
      seatIndex: 1,
    },
    {
      id: 'p3',
      name: 'Player 3 (Deep)',
      chips: 5000,
      totalHandBet: 5000,
      currentBet: 0,
      cards: [],
      folded: false,
      isAllIn: false,
      hasActedThisRound: true,
      eliminated: false,
      isUser: true,
      avatar: '',
      seatIndex: 2,
    },
  ];

  const sidePots = calculatePots(dummyPlayers);
  console.log('Side pots created:', sidePots.length);
  console.assert(sidePots.length === 3, 'Should have 3 pots (Main, Side 1, Side 2)');
  console.assert(sidePots[0].amount === 3000, 'Main pot should be 1000 * 3 = 3000');
  console.assert(sidePots[1].amount === 4000, 'Side pot 1 should be (3000-1000) * 2 = 4000');
  console.assert(sidePots[2].amount === 2000, 'Side pot 2 should be (5000-3000) * 1 = 2000');

  // Test awarding pots
  const evalMap = new Map();
  evalMap.set('p1', tp1);
  evalMap.set('p2', fhEval); // p2 has Full House (beats p1 and p3)
  evalMap.set('p3', tp2);
  const awards = awardPots(sidePots, evalMap);
  console.log('Awards distributed:', awards);
  console.assert(awards.length > 0, 'Awards should be calculated');

  console.log('All poker engine tests passed successfully! ✅');
}

runTests();
