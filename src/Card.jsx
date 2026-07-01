import { SUIT_COLORS } from "./theme.js";

export default function Card({ card, hidden, small, idx = 0, deal = false }) {
  const w = small ? 56 : 72;
  const h = small ? 80 : 104;
  const fs = small ? 13 : 17;
  const sfs = small ? 16 : 22;
  const cls = deal ? "bjcard bjdeal" : "bjcard bjpop";
  const common = { width: w, height: h, borderRadius: 10, flexShrink: 0, animationDelay: `${deal ? idx * 0.16 : 0}s` };

  if (hidden || !card) {
    return (
      <div className={cls} style={{ ...common, border: "2px solid #334155", background: "repeating-linear-gradient(45deg,#1e293b,#1e293b 4px,#131c2e 4px,#131c2e 8px)", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 18px rgba(0,0,0,0.5)" }}>
        <span style={{ fontSize: 20, opacity: 0.12 }}>♠</span>
      </div>
    );
  }
  const col = SUIT_COLORS[card.suit] || "#333";
  return (
    <div className={cls} style={{ ...common, border: "2px solid #d4d8de", background: "linear-gradient(155deg,#fff,#f0f2f5 50%,#e8ecf0)", display: "inline-flex", flexDirection: "column", justifyContent: "space-between", padding: small ? "4px 6px" : "6px 9px", boxShadow: "0 2px 8px rgba(0,0,0,0.18),0 6px 20px rgba(0,0,0,0.15)", fontFamily: "Georgia,serif", position: "relative" }}>
      <div style={{ color: col, fontSize: fs, fontWeight: 700, lineHeight: 1 }}>{card.rank}<br /><span style={{ fontSize: sfs }}>{card.suit}</span></div>
      <div style={{ color: col, fontSize: sfs + 10, position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", opacity: 0.08 }}>{card.suit}</div>
      <div style={{ color: col, fontSize: fs, fontWeight: 700, lineHeight: 1, textAlign: "right", transform: "rotate(180deg)" }}>{card.rank}<br /><span style={{ fontSize: sfs }}>{card.suit}</span></div>
    </div>
  );
}
