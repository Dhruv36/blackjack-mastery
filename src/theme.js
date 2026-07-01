export const COLORS = {
  bg: "#0a0e1a", accent: "#10b981", accentDk: "#059669",
  gold: "#f59e0b", red: "#ef4444", text: "#e2e8f0", muted: "#64748b",
};

export const ACTION_COLORS = { H: "#e74c3c", S: "#27ae60", D: "#f39c12", P: "#3498db", R: "#9333ea" };

export const SUIT_COLORS = { "♠": "#1a1a2e", "♣": "#1a1a2e", "♥": "#c0392b", "♦": "#c0392b" };

export const buttonBase = {
  border: "none", borderRadius: 12, cursor: "pointer",
  fontFamily: "'Outfit', sans-serif", fontWeight: 600,
  transition: "all 0.15s", letterSpacing: "0.5px",
};

export const TIPS = [
  { t: "Never Take Insurance", d: "~7.4% house edge. The app offers it on a dealer Ace — decline every time.", i: "🛡️" },
  { t: "Always Split Aces & 8s", d: "Two hands starting at 11 or 8 beat one 12 or 16.", i: "✂️" },
  { t: "Never Split 10s", d: "A pat 20 is too strong to break up.", i: "🔒" },
  { t: "Double Down on 11", d: "Best chance to make 21. Double vs 2-10; hit vs Ace.", i: "💰" },
  { t: "Stand on Hard 17+", d: "Bust risk is too high to hit.", i: "🧱" },
  { t: "Soft Hands Are Flexible", d: "With an Ace as 11 you can't bust on one hit — be aggressive.", i: "🎯" },
  { t: "Surrender 16 vs 9/10/A", d: "Forfeit half to escape the worst spots. Also 15 vs 10.", i: "🏳️" },
  { t: "Hi-Lo Counting", d: "+1 for 2-6, 0 for 7-9, -1 for 10-A. Raise bets at true count +2.", i: "🧠" },
  { t: "Avoid Side Bets", d: "5-25% house edges. Stick to the main game.", i: "⚠️" },
  { t: "Manage Bankroll", d: "Bet 1-2% of your roll per hand.", i: "📊" },
];

export const RESULT_EMOJI = { blackjack: "🎰", win: "🏆", dealerBust: "💥", lose: "😞", bust: "💀", push: "🤝", surrender: "🏳️" };
export const RESULT_LABEL = { blackjack: "BLACKJACK!", win: "WIN", dealerBust: "DEALER BUST", lose: "LOSE", bust: "BUST", push: "PUSH", surrender: "SURRENDER" };

export function resultColor(r) {
  if (["win", "blackjack", "dealerBust"].includes(r)) return COLORS.accent;
  if (r === "push") return COLORS.gold;
  if (r === "surrender") return COLORS.muted;
  return COLORS.red;
}
