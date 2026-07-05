// =============================================================
//  Blackjack engine — pure, synchronous, framework-agnostic.
//  Every action takes a state and returns a NEW state.
//  No timers, no mutation, no React. Verified by fuzz + unit tests.
//
//  Rules: 6 decks, dealer stands on soft 17 (S17),
//  double after split allowed, late surrender, blackjack pays 3:2.
// =============================================================

export const SUITS = ["♠", "♥", "♦", "♣"];
export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
export const DEALER_COLS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];

export const ACTION_LABELS = { H: "Hit", S: "Stand", D: "Double", P: "Split", R: "Surrender" };

// Basic strategy charts (S17, DAS, late surrender). R = surrender.
export const BS_HARD = {
  21: ["S","S","S","S","S","S","S","S","S","S"], 20: ["S","S","S","S","S","S","S","S","S","S"],
  19: ["S","S","S","S","S","S","S","S","S","S"], 18: ["S","S","S","S","S","S","S","S","S","S"],
  17: ["S","S","S","S","S","S","S","S","S","S"], 16: ["S","S","S","S","S","H","H","R","R","R"],
  15: ["S","S","S","S","S","H","H","H","R","H"], 14: ["S","S","S","S","S","H","H","H","H","H"],
  13: ["S","S","S","S","S","H","H","H","H","H"], 12: ["H","H","S","S","S","H","H","H","H","H"],
  11: ["D","D","D","D","D","D","D","D","D","H"], 10: ["D","D","D","D","D","D","D","D","H","H"],
  9:  ["H","D","D","D","D","H","H","H","H","H"], 8:  ["H","H","H","H","H","H","H","H","H","H"],
  7:  ["H","H","H","H","H","H","H","H","H","H"], 6:  ["H","H","H","H","H","H","H","H","H","H"],
  5:  ["H","H","H","H","H","H","H","H","H","H"],
};
export const BS_SOFT = {
  20: ["S","S","S","S","S","S","S","S","S","S"], 19: ["S","S","S","S","S","S","S","S","S","S"],
  18: ["S","D","D","D","D","S","S","H","H","H"], 17: ["H","D","D","D","D","H","H","H","H","H"],
  16: ["H","H","D","D","D","H","H","H","H","H"], 15: ["H","H","D","D","D","H","H","H","H","H"],
  14: ["H","H","H","D","D","H","H","H","H","H"], 13: ["H","H","H","D","D","H","H","H","H","H"],
};
export const BS_PAIR = {
  "A": ["P","P","P","P","P","P","P","P","P","P"], "10": ["S","S","S","S","S","S","S","S","S","S"],
  "9": ["P","P","P","P","P","S","P","P","S","S"], "8": ["P","P","P","P","P","P","P","P","P","P"],
  "7": ["P","P","P","P","P","P","H","H","H","H"], "6": ["P","P","P","P","P","H","H","H","H","H"],
  "5": ["D","D","D","D","D","D","D","D","H","H"], "4": ["H","H","H","P","P","H","H","H","H","H"],
  "3": ["P","P","P","P","P","P","H","H","H","H"], "2": ["P","P","P","P","P","P","H","H","H","H"],
};

const RESHUFFLE_THRESHOLD = 60; // reshuffle between hands when the shoe runs low

// Draw from the shoe, refilling it if it somehow runs dry mid-hand (only
// reachable through pathological draw sequences, but a dealt card must never
// be undefined).
function takeCard(shoe) {
  if (shoe.length === 0) shoe.push(...makeDeck());
  return shoe.pop();
}

export function makeDeck(numDecks = 6) {
  const deck = [];
  for (let i = 0; i < numDecks; i++)
    for (const s of SUITS) for (const r of RANKS) deck.push({ rank: r, suit: s });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function cardValue(rank) {
  if (rank === "A") return 11;
  if (["K", "Q", "J"].includes(rank)) return 10;
  return parseInt(rank, 10);
}

export function handValue(cards) {
  if (!cards || !cards.length) return 0;
  let total = 0, aces = 0;
  for (const c of cards) {
    if (!c) continue;
    total += cardValue(c.rank);
    if (c.rank === "A") aces++;
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

export function isSoft(cards) {
  if (!cards || !cards.length) return false;
  let total = 0, aces = 0;
  for (const c of cards) {
    if (!c) continue;
    total += cardValue(c.rank);
    if (c.rank === "A") aces++;
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return aces > 0 && total <= 21;
}

export function isPair(cards) {
  if (!cards || cards.length !== 2 || !cards[0] || !cards[1]) return false;
  const norm = (r) => (["K", "Q", "J"].includes(r) ? "10" : r);
  return norm(cards[0].rank) === norm(cards[1].rank);
}

export function hiLo(card) {
  if (!card) return 0;
  const r = card.rank;
  if (["2", "3", "4", "5", "6"].includes(r)) return 1;
  if (["7", "8", "9"].includes(r)) return 0;
  return -1; // 10, J, Q, K, A
}

export function normRank(r) {
  return ["K", "Q", "J"].includes(r) ? "10" : r;
}

// Optimal basic-strategy action. opts gates moves that aren't currently legal.
export function getCorrectAction(cards, dealerUp, opts) {
  const o = opts || { canDouble: cards && cards.length === 2, canSplit: false, canSurrender: false };
  if (!cards || cards.length < 2 || !dealerUp) return "S";
  const v = handValue(cards);
  const di = DEALER_COLS.indexOf(normRank(dealerUp.rank));
  if (di < 0) return v >= 17 ? "S" : "H";
  if (o.canSplit && isPair(cards)) {
    const row = BS_PAIR[normRank(cards[0].rank)];
    if (row && row[di] === "P") return "P";
  }
  if (isSoft(cards)) {
    if (v === 12) return "H"; // A-A when splitting isn't possible: soft 12 always hits
    const row = BS_SOFT[v];
    if (row && row[di]) {
      const a = row[di];
      if (a === "D" && !o.canDouble) return v >= 18 ? "S" : "H";
      return a;
    }
  }
  const row = BS_HARD[v];
  if (row && row[di]) {
    let a = row[di];
    if (a === "R" && !o.canSurrender) a = "H";
    if (a === "D" && !o.canDouble) return "H";
    return a;
  }
  return v >= 17 ? "S" : "H";
}

export function freshState(bank = 5000) {
  return {
    shoe: makeDeck(), bank, phase: "bet", hands: [], active: 0,
    dealer: [], revealed: false, holeCounted: true, results: [],
    runningCount: 0, insured: false, pending: null, lastBet: 100, reshuffled: false,
  };
}

export function deal(state, bet) {
  if (state.phase !== "bet" && state.phase !== "result") return state;
  if (!Number.isFinite(bet) || bet <= 0 || bet > state.bank) return state;
  let shoe = state.shoe.slice();
  let runningCount = state.runningCount;
  let reshuffled = false;
  if (shoe.length < RESHUFFLE_THRESHOLD) {
    shoe = makeDeck();
    runningCount = 0;
    reshuffled = true;
  }
  const c0 = takeCard(shoe), c1 = takeCard(shoe), c2 = takeCard(shoe), c3 = takeCard(shoe);
  runningCount += hiLo(c0) + hiLo(c1) + hiLo(c2); // 3 visible; hole (c3) not counted yet

  const next = {
    ...state, shoe, runningCount, reshuffled, bank: state.bank - bet,
    hands: [{ cards: [c0, c2], bet, done: false }], active: 0,
    dealer: [c1, c3], revealed: false, holeCounted: false, results: [],
    insured: false, pending: null, lastBet: bet,
  };
  const up = normRank(c1.rank);
  const playerBJ = handValue([c0, c2]) === 21;
  const dealerBJ = (up === "A" || up === "10") && handValue([c1, c3]) === 21;

  if (up === "A") { next.phase = "insurance"; next.pending = { playerBJ, dealerBJ, bet }; return next; }
  if (up === "10") return resolvePeek(next, { playerBJ, dealerBJ, bet }, false);
  if (playerBJ) {
    next.phase = "result";
    next.results = ["blackjack"];
    next.bank += bet + Math.floor(bet * 1.5);
    return next;
  }
  next.phase = "play";
  return next;
}

function resolvePeek(state, info, insured) {
  let bank = state.bank;
  let runningCount = state.runningCount;
  const insBet = insured ? Math.floor(info.bet / 2) : 0;
  if (insured) bank -= insBet;

  if (info.dealerBJ) {
    runningCount += hiLo(state.dealer[1]); // hole exposed
    if (info.playerBJ) bank += info.bet;   // both blackjack -> push
    if (insured) bank += insBet * 3;        // 2:1 win + stake back
    return {
      ...state, bank, runningCount, revealed: true, holeCounted: true, insured,
      results: [info.playerBJ ? "push" : "lose"], phase: "result", pending: null,
    };
  }
  if (info.playerBJ) {
    return {
      ...state, bank: bank + info.bet + Math.floor(info.bet * 1.5),
      runningCount, insured, results: ["blackjack"], phase: "result", pending: null,
    };
  }
  return { ...state, bank, runningCount, insured, phase: "play", pending: null };
}

export function decideInsurance(state, takeIt) {
  if (state.phase !== "insurance" || !state.pending) return state;
  return resolvePeek(state, state.pending, takeIt);
}

function advance(state) {
  let a = state.active + 1;
  while (a < state.hands.length && state.hands[a].done) a++;
  if (a < state.hands.length) return { ...state, active: a };
  return playDealer(state);
}

export function hit(state) {
  if (state.phase !== "play") return state;
  const shoe = state.shoe.slice();
  const card = takeCard(shoe);
  const runningCount = state.runningCount + hiLo(card);
  let hands = state.hands.map((h, i) => (i === state.active ? { ...h, cards: [...h.cards, card] } : h));
  const next = { ...state, shoe, runningCount, hands };
  if (handValue(hands[state.active].cards) > 21) {
    next.hands = hands.map((h, i) => (i === state.active ? { ...h, done: true } : h));
    return advance(next);
  }
  return next;
}

export function stand(state) {
  if (state.phase !== "play") return state;
  const hands = state.hands.map((h, i) => (i === state.active ? { ...h, done: true } : h));
  return advance({ ...state, hands });
}

export function doubleDown(state) {
  if (state.phase !== "play") return state;
  const h = state.hands[state.active];
  if (h.cards.length !== 2 || state.bank < h.bet) return state;
  const shoe = state.shoe.slice();
  const card = takeCard(shoe);
  const runningCount = state.runningCount + hiLo(card);
  const hands = state.hands.map((x, i) =>
    i === state.active ? { ...x, cards: [...x.cards, card], bet: x.bet * 2, done: true } : x
  );
  return advance({ ...state, shoe, runningCount, hands, bank: state.bank - h.bet });
}

export function split(state) {
  if (state.phase !== "play") return state;
  const h = state.hands[state.active];
  if (h.cards.length !== 2 || !isPair(h.cards) || state.hands.length >= 4 || state.bank < h.bet) return state;
  const shoe = state.shoe.slice();
  const [c1, c2] = h.cards;
  const n1 = takeCard(shoe), n2 = takeCard(shoe);
  const runningCount = state.runningCount + hiLo(n1) + hiLo(n2);
  const aces = c1.rank === "A";
  const hands = state.hands.slice();
  hands[state.active] = { cards: [c1, n1], bet: h.bet, done: aces };
  hands.splice(state.active + 1, 0, { cards: [c2, n2], bet: h.bet, done: aces });
  const next = { ...state, shoe, runningCount, hands, bank: state.bank - h.bet };
  if (aces) return advance(next); // split aces: one card each, no further action
  return next;
}

export function surrender(state) {
  if (state.phase !== "play" || state.hands.length !== 1 || state.active !== 0) return state;
  const h = state.hands[0];
  if (h.cards.length !== 2) return state;
  return {
    ...state, bank: state.bank + Math.floor(h.bet / 2),
    results: ["surrender"], phase: "result", revealed: false,
  };
}

function playDealer(state) {
  let runningCount = state.runningCount;
  let dealer = state.dealer.slice();
  let shoe = state.shoe.slice();
  if (!state.holeCounted) runningCount += hiLo(dealer[1]);
  const allBust = state.hands.every((h) => handValue(h.cards) > 21);
  if (!allBust) {
    let guard = 0;
    while (handValue(dealer) < 17 && guard < 20) {
      const c = takeCard(shoe);
      dealer.push(c);
      runningCount += hiLo(c);
      guard++;
    }
  }
  const dv = handValue(dealer);
  const dealerBust = dv > 21;
  const results = state.hands.map((h) => {
    const pv = handValue(h.cards);
    if (pv > 21) return "bust";
    if (dealerBust) return "dealerBust";
    if (pv > dv) return "win";
    if (pv < dv) return "lose";
    return "push";
  });
  let bank = state.bank;
  results.forEach((r, i) => {
    const b = state.hands[i].bet;
    if (r === "win" || r === "dealerBust") bank += b * 2;
    else if (r === "push") bank += b;
  });
  return { ...state, dealer, shoe, runningCount, holeCounted: true, revealed: true, results, bank, phase: "result" };
}

// Helper for the UI: which moves are legal for the active hand right now.
export function legalActions(state) {
  if (state.phase !== "play") return {};
  const h = state.hands[state.active];
  const cards = h ? h.cards : [];
  return {
    canDouble: cards.length === 2 && state.bank >= (h?.bet || 0),
    canSplit: cards.length === 2 && isPair(cards) && state.hands.length < 4 && state.bank >= (h?.bet || 0),
    canSurrender: state.hands.length === 1 && state.active === 0 && cards.length === 2,
  };
}
