import { describe, it, expect } from "vitest";
import {
  freshState, deal, hit, stand, doubleDown, split, surrender,
  decideInsurance, handValue, isSoft, isPair, hiLo, getCorrectAction,
  legalActions, makeDeck,
} from "./engine.js";

const C = (rank, suit = "♠") => ({ rank, suit });

// Force a specific deal by stacking the shoe. Pop order in deal(): c0,c1,c2,c3.
function stackedDeal(playerCards, dealerCards, bet = 100, bank = 5000) {
  const s = freshState(bank);
  s.shoe = makeDeck();
  s.shoe.push(dealerCards[1]); // hole  (4th pop)
  s.shoe.push(playerCards[1]); // c2    (3rd pop)
  s.shoe.push(dealerCards[0]); // up    (2nd pop)
  s.shoe.push(playerCards[0]); // c0    (1st pop)
  return deal(s, bet);
}

describe("hand evaluation", () => {
  it("counts aces flexibly", () => {
    expect(handValue([C("A"), C("9")])).toBe(20);
    expect(handValue([C("A"), C("9"), C("5")])).toBe(15); // ace drops to 1
    expect(handValue([C("A"), C("A"), C("9")])).toBe(21);
  });
  it("detects soft hands", () => {
    expect(isSoft([C("A"), C("6")])).toBe(true);
    expect(isSoft([C("A"), C("6"), C("10")])).toBe(false);
  });
  it("detects pairs including ten-values", () => {
    expect(isPair([C("10"), C("K")])).toBe(true);
    expect(isPair([C("9"), C("9")])).toBe(true);
    expect(isPair([C("9"), C("8")])).toBe(false);
  });
  it("hi-lo tags are correct", () => {
    expect([C("2"), C("6")].map(hiLo)).toEqual([1, 1]);
    expect([C("7"), C("9")].map(hiLo)).toEqual([0, 0]);
    expect([C("10"), C("K"), C("A")].map(hiLo)).toEqual([-1, -1, -1]);
  });
});

describe("basic strategy", () => {
  const opt = { canDouble: true, canSplit: true, canSurrender: true };
  it("surrenders the worst hands", () => {
    expect(getCorrectAction([C("10"), C("6")], C("9"), opt)).toBe("R");
    expect(getCorrectAction([C("10"), C("6")], C("10"), opt)).toBe("R");
    expect(getCorrectAction([C("10"), C("5")], C("10"), opt)).toBe("R");
  });
  it("doubles 11 vs 2-10 but hits vs Ace", () => {
    expect(getCorrectAction([C("6"), C("5")], C("10"), opt)).toBe("D");
    expect(getCorrectAction([C("6"), C("5")], C("A"), opt)).toBe("H");
  });
  it("always splits aces and eights", () => {
    expect(getCorrectAction([C("A"), C("A")], C("9"), opt)).toBe("P");
    expect(getCorrectAction([C("8"), C("8")], C("10"), opt)).toBe("P");
  });
  it("downgrades double to hit when not allowed", () => {
    expect(getCorrectAction([C("6"), C("5")], C("10"), { canDouble: false })).toBe("H");
  });
  it("treats unsplittable A-A as soft 12: always hit, never hard-12 stand", () => {
    const noSplit = { canDouble: true, canSplit: false, canSurrender: false };
    for (const up of ["2", "3", "4", "5", "6", "7", "10", "A"]) {
      expect(getCorrectAction([C("A"), C("A")], C(up), noSplit)).toBe("H");
    }
    expect(getCorrectAction([C("A"), C("A")], C("4"), { canSplit: true })).toBe("P");
  });
});

describe("payouts and special hands", () => {
  it("pays a player blackjack 3:2 and does not expose the hole", () => {
    const s = stackedDeal([C("A"), C("10")], [C("9"), C("5")]);
    expect(s.phase).toBe("result");
    expect(s.results).toEqual(["blackjack"]);
    expect(s.bank).toBe(5150);
    expect(s.revealed).toBe(false);
  });
  it("loses to a dealer blackjack when uninsured", () => {
    let s = stackedDeal([C("10"), C("10")], [C("A"), C("10")]);
    s = decideInsurance(s, false);
    expect(s.results).toEqual(["lose"]);
    expect(s.bank).toBe(4900);
  });
  it("breaks even on a dealer blackjack when insured", () => {
    let s = stackedDeal([C("10"), C("10")], [C("A"), C("10")]);
    s = decideInsurance(s, true);
    expect(s.bank).toBe(5000);
  });
  it("continues play when dealer peeks and has no blackjack", () => {
    let s = stackedDeal([C("10"), C("7")], [C("A"), C("5")]);
    s = decideInsurance(s, false);
    expect(s.phase).toBe("play");
  });
  it("surrender forfeits exactly half", () => {
    let s = stackedDeal([C("10"), C("6")], [C("10"), C("7")]);
    s = surrender(s);
    expect(s.results).toEqual(["surrender"]);
    expect(s.bank).toBe(4950);
  });
  it("split aces draw one card each and end the round", () => {
    let s = stackedDeal([C("A"), C("A")], [C("9"), C("8")]);
    s = split(s);
    expect(s.phase).toBe("result");
    expect(s.hands.length).toBe(2);
    expect(s.hands.every((h) => h.cards.length === 2)).toBe(true);
  });
});

describe("engine hardening", () => {
  it("settles plain hands correctly: win pays 1:1, push returns the stake", () => {
    let s = stackedDeal([C("10"), C("9")], [C("10"), C("8")]); // 19 vs 18
    s = stand(s);
    expect(s.results).toEqual(["win"]);
    expect(s.bank).toBe(5100);
    let p = stackedDeal([C("10"), C("8")], [C("10"), C("8")]); // 18 vs 18
    p = stand(p);
    expect(p.results).toEqual(["push"]);
    expect(p.bank).toBe(5000);
  });
  it("ignores deal() mid-hand and invalid or unaffordable bets", () => {
    const mid = stackedDeal([C("10"), C("7")], [C("10"), C("9")]);
    expect(mid.phase).toBe("play");
    expect(deal(mid, 100)).toBe(mid); // dealing mid-hand must be a no-op
    const done = stand(mid);
    expect(done.phase).toBe("result");
    expect(deal(done, done.bank + 1)).toBe(done); // can't bet more than the bank
    expect(deal(done, 0)).toBe(done);
    expect(deal(done, -50)).toBe(done);
  });
  it("refills the shoe instead of dealing undefined if it empties mid-hand", () => {
    let s = stackedDeal([C("2"), C("3")], [C("10"), C("2")]); // player 5, dealer 12
    expect(s.phase).toBe("play");
    s = { ...s, shoe: [] };  // pathological: shoe dry mid-hand
    s = hit(s);              // player draw comes from an emergency refill
    expect(s.hands[0].cards.every(Boolean)).toBe(true);
    let guard = 0;
    while (s.phase === "play" && guard++ < 30) s = stand(s);
    expect(s.phase).toBe("result"); // dealer must draw to 17+ from the refill
    expect(s.dealer.every(Boolean)).toBe(true);
    expect(handValue(s.dealer)).toBeGreaterThanOrEqual(17);
    expect(Number.isFinite(s.bank)).toBe(true);
  });
});

describe("hole-card counting integrity", () => {
  it("excludes the hole card from the running count until it is exposed", () => {
    // Player 3,4 (+1,+1) vs dealer 10 up (-1); hole (5=+1) hidden. RC = +1.
    let s = stackedDeal([C("3"), C("4")], [C("10"), C("5")]);
    expect(s.runningCount).toBe(1);
    expect(s.holeCounted).toBe(false);
    s = stand(s);
    expect(s.holeCounted).toBe(true); // hole now folded into the count exactly once
  });
});

// The safety net: thousands of random games must never throw or hang.
describe("fuzz: no crashes, no infinite loops", () => {
  it("plays 20000 random games to completion", () => {
    let completed = 0;
    for (let g = 0; g < 20000; g++) {
      let s = freshState(5000);
      for (let round = 0; round < 40; round++) {
        if (s.bank < 1000) s = freshState(5000);
        const bet = [25, 50, 100, 250, 500][Math.floor(Math.random() * 5)];
        if (bet > s.bank) continue;
        s = deal(s, bet);
        let guard = 0;
        while (s.phase === "insurance" || s.phase === "play") {
          if (++guard > 200) throw new Error("loop in phase " + s.phase);
          if (s.phase === "insurance") { s = decideInsurance(s, Math.random() < 0.5); continue; }
          const la = legalActions(s);
          const choices = ["hit", "stand"];
          if (la.canDouble) choices.push("double");
          if (la.canSplit) choices.push("split");
          if (la.canSurrender) choices.push("surrender");
          const move = choices[Math.floor(Math.random() * choices.length)];
          if (move === "hit") s = hit(s);
          else if (move === "stand") s = stand(s);
          else if (move === "double") s = doubleDown(s);
          else if (move === "split") s = split(s);
          else s = surrender(s);
        }
        expect(s.phase).toBe("result");
        expect(s.results.length).toBe(s.hands.length);
        expect(Number.isFinite(s.bank)).toBe(true);
      }
      completed++;
    }
    expect(completed).toBe(20000);
  });
});
