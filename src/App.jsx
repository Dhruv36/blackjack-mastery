import { useState, useEffect, useRef } from "react";
import {
  freshState, deal, hit, stand, doubleDown, split, surrender, decideInsurance,
  handValue, isSoft, isPair, getCorrectAction, legalActions,
  ACTION_LABELS, DEALER_COLS, BS_HARD, BS_SOFT, BS_PAIR,
} from "./engine.js";
import {
  COLORS as CL, ACTION_COLORS, buttonBase as btn, TIPS,
  RESULT_EMOJI as rE, RESULT_LABEL as rL, resultColor as rC,
} from "./theme.js";
import Card from "./Card.jsx";

function Stat({ label, value, color }) {
  return <div style={{ flex: 1, textAlign: "center" }}><div style={{ fontSize: 9, color: CL.muted, textTransform: "uppercase", letterSpacing: 1.2 }}>{label}</div><div style={{ fontSize: 15, fontWeight: 700, color: color || CL.text, marginTop: 1 }}>{value}</div></div>;
}
function Mini({ label, value, color }) {
  return <div style={{ textAlign: "center" }}><div style={{ fontSize: 9, color: CL.muted }}>{label}</div><div style={{ fontSize: 16, fontWeight: 700, color: color || CL.text }}>{value}</div></div>;
}
function Toggle({ on, onClick, label }) {
  return <button onClick={onClick} style={{ ...btn, padding: "5px 14px", fontSize: 11, background: on ? CL.accent + "18" : "#0d112040", color: on ? CL.accent : CL.muted, border: `1px solid ${on ? CL.accent + "35" : "#ffffff0a"}` }}>{label} {on ? "ON" : "OFF"}</button>;
}
function Disclaimer() {
  return <p style={{ fontSize: 10, color: CL.muted, textAlign: "center", margin: "4px 24px", lineHeight: 1.5 }}>For entertainment and educational use only. No real money is involved.</p>;
}

function StrategyTab({ sTab, setSTab }) {
  const table = sTab === "hard" ? BS_HARD : sTab === "soft" ? BS_SOFT : BS_PAIR;
  return (
    <main style={{ padding: "16px 12px 100px" }}>
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 21, margin: "0 0 3px", textAlign: "center" }}>Basic Strategy Charts</h2>
      <p style={{ fontSize: 11, color: CL.muted, textAlign: "center", margin: "0 0 14px" }}>6 decks · dealer stands soft 17 · double after split · late surrender</p>
      <div style={{ display: "flex", gap: 3, marginBottom: 14, background: "#080b14", borderRadius: 10, padding: 3 }}>
        {["hard", "soft", "pair"].map((t) => <button key={t} onClick={() => setSTab(t)} style={{ ...btn, flex: 1, padding: "8px 6px", fontSize: 12, background: sTab === t ? "#1a223660" : "transparent", color: sTab === t ? CL.accent : CL.muted, border: sTab === t ? "1px solid #ffffff0d" : "1px solid transparent" }}>{t === "pair" ? "Pairs" : t[0].toUpperCase() + t.slice(1)}</button>)}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 10, flexWrap: "wrap" }}>
        {Object.entries(ACTION_LABELS).map(([k, v]) => <div key={k} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: ACTION_COLORS[k] }} /><span style={{ color: CL.muted }}>{v}</span></div>)}
      </div>
      <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #ffffff0a" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 380 }}>
          <thead><tr><th style={{ padding: "7px 4px", background: "#111827", color: CL.muted, fontSize: 10, position: "sticky", left: 0, zIndex: 1 }}>{sTab === "pair" ? "Pair" : "Hand"}</th>{DEALER_COLS.map((d) => <th key={d} style={{ padding: "7px 2px", background: "#111827", color: CL.muted, fontSize: 11, textAlign: "center" }}>{d}</th>)}</tr></thead>
          <tbody>{Object.entries(table).map(([row, actions]) => <tr key={row}><td style={{ padding: "5px 7px", background: "#0d1120", fontWeight: 700, position: "sticky", left: 0, zIndex: 1, borderRight: "1px solid #ffffff08", fontSize: 11 }}>{sTab === "pair" ? `${row}-${row}` : sTab === "soft" ? `A-${row - 11}` : row}</td>{actions.map((a, i) => <td key={i} style={{ padding: "5px 2px", textAlign: "center", fontWeight: 700, background: ACTION_COLORS[a] + "20", color: ACTION_COLORS[a], borderBottom: "1px solid #ffffff06", fontSize: 11 }}>{a}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <section style={{ marginTop: 18, padding: 14, borderRadius: 14, background: "#0d112080", border: "1px solid #ffffff0a" }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 15, fontFamily: "'Playfair Display',serif" }}>🧠 Hi-Lo Card Counting</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
          {[{ c: "2-6", v: "+1", cl: CL.accent }, { c: "7-9", v: "0", cl: CL.muted }, { c: "10-A", v: "−1", cl: CL.red }].map((x, i) => <div key={i} style={{ textAlign: "center", padding: "8px 4px", borderRadius: 8, background: "#080b14" }}><div style={{ fontSize: 12, fontWeight: 700 }}>{x.c}</div><div style={{ fontSize: 18, fontWeight: 800, color: x.cl }}>{x.v}</div></div>)}
        </div>
        <div style={{ fontSize: 12, color: CL.muted, lineHeight: 1.5 }}><strong style={{ color: CL.text }}>True Count</strong> = Running Count ÷ Decks Remaining. Bet more at TC ≥ +2. A card is counted only once it becomes visible.</div>
      </section>
    </main>
  );
}

function TipsTab() {
  return (
    <main style={{ padding: "16px 12px 100px" }}>
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 21, margin: "0 0 3px", textAlign: "center" }}>Pro Tips & Tricks</h2>
      <p style={{ fontSize: 11, color: CL.muted, textAlign: "center", margin: "0 0 14px" }}>Mathematically proven strategies</p>
      {TIPS.map((tip, i) => <div key={i} style={{ padding: 14, borderRadius: 14, marginBottom: 8, background: "#0d112080", border: "1px solid #ffffff0a" }}><div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}><div style={{ width: 36, height: 36, borderRadius: 9, background: CL.accent + "12", border: `1px solid ${CL.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{tip.i}</div><div><h3 style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 700 }}>{tip.t}</h3><p style={{ margin: 0, fontSize: 12, color: CL.muted, lineHeight: 1.45 }}>{tip.d}</p></div></div></div>)}
    </main>
  );
}

export default function App() {
  const [tab, setTab] = useState("play");
  const [g, setG] = useState(() => freshState(5000));
  const [bet, setBet] = useState(100);
  const [showHint, setShowHint] = useState(false);
  const [fb, setFb] = useState(null);
  const [stats, setStats] = useState({ w: 0, l: 0, p: 0, cor: 0, tot: 0 });
  const [showCt, setShowCt] = useState(false);
  const [coach, setCoach] = useState(true);
  const [sTab, setSTab] = useState("hard");
  const [showResult, setShowResult] = useState(true);
  const [notice, setNotice] = useState("");
  const dealSeq = useRef(0);
  const lastKey = useRef("");
  const noticeT = useRef(null);

  const { phase, hands, active, dealer, revealed, results, bank, runningCount: rc } = g;
  const curHand = hands[active] ? hands[active].cards : [];
  const dealerUp = dealer && dealer.length > 0 ? dealer[0] : null;
  const la = legalActions(g);
  const opts = (cs, allH) => ({
    canDouble: cs.length === 2,
    canSplit: cs.length === 2 && isPair(cs) && allH.length < 4,
    canSurrender: allH.length === 1 && cs.length === 2,
  });

  useEffect(() => {
    if (phase !== "result" || !results.length) return;
    const key = dealSeq.current + ":" + results.join(",");
    if (lastKey.current === key) return;
    lastKey.current = key;
    let w = 0, l = 0, p = 0;
    for (const r of results) {
      if (["win", "dealerBust", "blackjack"].includes(r)) w++;
      else if (r === "push") p++;
      else l++;
    }
    setStats((s) => ({ ...s, w: s.w + w, l: s.l + l, p: s.p + p }));
  }, [phase, results]);

  useEffect(() => {
    if (phase !== "result") return;
    setShowResult(false);
    const extra = Math.max(0, dealer.length - 2) * 160;
    const t = setTimeout(() => setShowResult(true), 250 + extra);
    return () => clearTimeout(t);
  }, [phase, dealer.length]);

  useEffect(() => {
    if (!g.reshuffled) return;
    setNotice("🔄 Shoe reshuffled — count reset");
    if (noticeT.current) clearTimeout(noticeT.current);
    noticeT.current = setTimeout(() => setNotice(""), 2600);
  }, [g.reshuffled]);

  const record = (action) => {
    if (!coach || !dealerUp || curHand.length < 2) return;
    const correct = getCorrectAction(curHand, dealerUp, opts(curHand, hands));
    setStats((s) => ({ ...s, tot: s.tot + 1, cor: s.cor + (action === correct ? 1 : 0) }));
    setFb({ action, correct, wrong: action !== correct });
  };

  const onDeal = () => { if (bank < bet) return; setFb(null); setShowHint(false); dealSeq.current++; setG(deal(g, bet)); };
  const onInsurance = (yes) => { if (coach) setStats((s) => ({ ...s, tot: s.tot + 1, cor: s.cor + (yes ? 0 : 1) })); setG(decideInsurance(g, yes)); };
  const onHit = () => { record("H"); setG(hit(g)); };
  const onStand = () => { record("S"); setG(stand(g)); };
  const onDouble = () => { record("D"); setG(doubleDown(g)); };
  const onSplit = () => { record("P"); setFb(null); setG(split(g)); };
  const onSurrender = () => { record("R"); setG(surrender(g)); };
  const onRebuy = () => { setG(freshState(5000)); setStats({ w: 0, l: 0, p: 0, cor: 0, tot: 0 }); setFb(null); };

  const dLeft = Math.max(g.shoe.length / 52, 0.25);
  const tc = g.shoe.length < 312 ? (rc / dLeft).toFixed(1) : "0.0";
  const insBet = Math.floor(bet / 2);

  return (
    <div style={{ minHeight: "100vh", background: CL.bg, color: CL.text, fontFamily: "'Outfit',sans-serif", maxWidth: 480, margin: "0 auto" }}>
      <header style={{ background: "linear-gradient(180deg,#111827,#0f1525)", padding: "16px 20px 12px", borderBottom: "1px solid #ffffff0a", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: `linear-gradient(135deg,${CL.accent},${CL.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#000", fontWeight: 900 }}>♠</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontFamily: "'Playfair Display',serif", fontWeight: 900, background: `linear-gradient(135deg,#f0f0f0,${CL.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>BLACKJACK MASTERY</h1>
            <div style={{ fontSize: 9, color: CL.muted, letterSpacing: 2.5, textTransform: "uppercase" }}>Casino Training System</div>
          </div>
        </div>
        <nav style={{ display: "flex", gap: 3, background: "#080b14", borderRadius: 11, padding: 3 }}>
          {["play", "strategy", "tips"].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ ...btn, flex: 1, padding: "9px 8px", fontSize: 13, background: tab === t ? "#1a223660" : "transparent", color: tab === t ? CL.accent : CL.muted, border: tab === t ? `1px solid ${CL.accent}30` : "1px solid transparent" }}>
              {t === "play" ? "🃏 Play" : t === "strategy" ? "📊 Strategy" : "💡 Tips"}
            </button>
          ))}
        </nav>
      </header>

      {tab === "play" && (
        <main style={{ padding: "0 0 100px" }}>
          <div style={{ display: "flex", gap: 2, padding: "10px 16px", background: "#0d1120", borderBottom: "1px solid #ffffff06" }}>
            <Stat label="Bankroll" value={"$" + bank.toLocaleString()} color={bank >= 5000 ? CL.accent : bank < 2000 ? CL.red : CL.gold} />
            <Stat label="W/L/P" value={`${stats.w}/${stats.l}/${stats.p}`} />
            <Stat label="Accuracy" value={stats.tot > 0 ? Math.round((stats.cor / stats.tot) * 100) + "%" : "—"} color={stats.tot > 0 && stats.cor / stats.tot > 0.8 ? CL.accent : CL.gold} />
          </div>

          <div style={{ display: "flex", gap: 8, padding: "8px 16px", justifyContent: "center" }}>
            <Toggle on={coach} onClick={() => setCoach(!coach)} label="🎓 Coach" />
            <Toggle on={showCt} onClick={() => setShowCt(!showCt)} label="🔢 Count" />
          </div>

          {showCt && (
            <div style={{ margin: "0 16px 6px", padding: "8px 14px", borderRadius: 10, background: "#0d112080", border: "1px solid #ffffff0a", display: "flex", justifyContent: "space-around" }}>
              <Mini label="Running" value={(rc > 0 ? "+" : "") + rc} color={rc > 0 ? CL.accent : rc < 0 ? CL.red : CL.text} />
              <Mini label="True Count" value={(parseFloat(tc) > 0 ? "+" : "") + tc} color={parseFloat(tc) > 0 ? CL.accent : parseFloat(tc) < 0 ? CL.red : CL.text} />
              <Mini label="Cards Left" value={g.shoe.length} />
            </div>
          )}

          <div style={{ margin: "6px 12px", borderRadius: 20, position: "relative", background: "radial-gradient(ellipse at 50% 35%,#0f6b33,#0a5428 40%,#073d1d)", border: "5px solid #1a0e04", boxShadow: "inset 0 2px 40px rgba(0,0,0,0.25),0 8px 30px rgba(0,0,0,0.5)", minHeight: 370, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "18px 14px 16px", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 10, right: 14, padding: "3px 8px", borderRadius: 6, background: "#00000040", fontSize: 9, color: "#ffffff50", letterSpacing: 1 }}>SHOE: {Math.ceil(g.shoe.length / 52)}D</div>
            {notice && <div style={{ position: "absolute", top: 10, left: 14, padding: "3px 10px", borderRadius: 6, background: CL.gold + "30", border: `1px solid ${CL.gold}50`, fontSize: 10, color: CL.gold, fontWeight: 600, zIndex: 2 }}>{notice}</div>}

            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: 10, color: "#ffffff60", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>
                Dealer {revealed && dealer.length > 0 ? ` · ${handValue(dealer)}` : dealerUp ? ` · ${handValue([dealerUp])} showing` : ""}
              </div>
              <div style={{ display: "flex", minHeight: 84 }}>
                {dealer.map((c, i) => <div key={`${dealSeq.current}-d${i}`} style={{ marginLeft: i > 0 ? -8 : 0 }}><Card card={c} hidden={i === 1 && !revealed} small idx={i} deal={i < 2} /></div>)}
              </div>
            </div>

            <div style={{ textAlign: "center", minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", position: "relative", zIndex: 1 }}>
              {phase === "bet" && <div style={{ color: "#ffffff40", fontSize: 13, fontStyle: "italic" }}>Place your bet and deal</div>}
              {phase === "insurance" && <div style={{ color: CL.gold, fontSize: 13, fontWeight: 700 }}>Dealer shows an Ace — Insurance?</div>}
              {phase === "result" && showResult && results.length > 0 && (
                <div className="bjbanner" style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  {results.map((r, i) => <div key={i} style={{ fontSize: hands.length > 1 ? 13 : 17, fontWeight: 800, padding: "5px 14px", borderRadius: 10, background: rC(r) + "25", color: rC(r) }}>{rE[r]} {hands.length > 1 ? `H${i + 1}: ` : ""}{rL[r]}</div>)}
                </div>
              )}
              {fb && phase === "play" && <div style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, background: fb.wrong ? "#ef444420" : "#10b98120", color: fb.wrong ? "#fca5a5" : "#6ee7b7" }}>{fb.wrong ? `❌ ${ACTION_LABELS[fb.action]} → Best: ${ACTION_LABELS[fb.correct]}` : `✅ ${ACTION_LABELS[fb.action]}`}</div>}
            </div>

            <div style={{ position: "relative", zIndex: 1 }}>
              {hands.length > 1 && <div style={{ fontSize: 10, color: "#ffffff50", marginBottom: 4 }}>{hands.length} HANDS · Hand {active + 1}</div>}
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 2 }}>
                {hands.map((hand, hi) => {
                  const cs = hand.cards;
                  return (
                    <div key={hi} style={{ flex: hands.length === 1 ? 1 : "0 0 auto", padding: hands.length > 1 ? "6px 8px" : 0, borderRadius: 10, background: hands.length > 1 ? (hi === active && phase === "play" ? "#ffffff10" : "#ffffff05") : "transparent", border: hands.length > 1 ? `1.5px solid ${hi === active && phase === "play" ? CL.accent + "50" : "#ffffff10"}` : "none", position: "relative", minWidth: hands.length > 1 ? 100 : "auto" }}>
                      {hands.length > 1 && <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, marginBottom: 2, color: hi === active && phase === "play" ? CL.accent : "#ffffff50", display: "flex", justifyContent: "space-between" }}><span>HAND {hi + 1}</span><span style={{ color: "#ffffff40" }}>${hand.bet}</span></div>}
                      <div style={{ fontSize: 10, color: "#ffffff55", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{hands.length === 1 ? "You · " : ""}{cs.length > 0 ? handValue(cs) : ""}{cs.length > 0 && handValue(cs) > 21 ? " 💀" : ""}{cs.length > 0 && isSoft(cs) && handValue(cs) <= 21 ? " (soft)" : ""}</div>
                      <div style={{ display: "flex" }}>{cs.map((c, i) => <div key={`${dealSeq.current}-p${hi}-${i}`} style={{ marginLeft: i > 0 ? -6 : 0 }}><Card card={c} small idx={i} deal={hi === 0 && i < 2} /></div>)}</div>
                      {results[hi] && phase === "result" && <div style={{ position: "absolute", top: -6, right: -6, fontSize: 14, background: "#111", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${rC(results[hi])}` }}>{rE[results[hi]]}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ padding: "10px 16px" }}>
            {(phase === "bet" || phase === "result") && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: CL.muted, fontWeight: 600 }}>BET</span>
                  {[25, 50, 100, 250, 500].map((b) => <button key={b} onClick={() => setBet(b)} style={{ ...btn, padding: "7px 10px", fontSize: 12, background: bet === b ? CL.gold : "#111827", color: bet === b ? "#000" : CL.muted, border: `1px solid ${bet === b ? CL.gold : "#ffffff12"}` }}>${b}</button>)}
                </div>
                <button onClick={onDeal} disabled={bank < bet} style={{ ...btn, width: "100%", padding: 15, fontSize: 15, background: bank < bet ? "#222" : `linear-gradient(135deg,${CL.accent},${CL.accentDk})`, color: "#fff", opacity: bank < bet ? 0.4 : 1 }}>{bank < bet ? "INSUFFICIENT FUNDS" : `DEAL · $${bet}`}</button>
                {bank < bet && <button onClick={onRebuy} style={{ ...btn, width: "100%", padding: 13, fontSize: 14, marginTop: 8, background: CL.gold, color: "#000" }}>🔄 Rebuy $5,000 & Reset</button>}
              </div>
            )}

            {phase === "insurance" && (
              <div>
                <div style={{ textAlign: "center", fontSize: 12, color: CL.muted, marginBottom: 8 }}>Insurance costs ${insBet} (half your bet) and pays 2:1 if the dealer has blackjack.</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button onClick={() => onInsurance(true)} disabled={bank < insBet} style={{ ...btn, padding: 14, fontSize: 14, background: bank < insBet ? "#1a1a2e" : "#334155", color: "#fff", opacity: bank < insBet ? 0.4 : 1 }}>Take Insurance (${insBet})</button>
                  <button onClick={() => onInsurance(false)} style={{ ...btn, padding: 14, fontSize: 14, background: CL.accent, color: "#fff" }}>No Insurance ✓</button>
                </div>
              </div>
            )}

            {phase === "play" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                  <button onClick={onHit} style={{ ...btn, padding: 13, fontSize: 14, background: "#dc3545", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 3px 12px #dc354540" }}>👆 HIT</button>
                  <button onClick={onStand} style={{ ...btn, padding: 13, fontSize: 14, background: "#198754", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 3px 12px #19875440" }}>✋ STAND</button>
                  <button onClick={onDouble} disabled={!la.canDouble} style={{ ...btn, padding: 13, fontSize: 14, background: la.canDouble ? "#fd7e14" : "#1a1a2e", color: "#fff", opacity: la.canDouble ? 1 : 0.3, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>💰 DOUBLE</button>
                  <button onClick={onSplit} disabled={!la.canSplit} style={{ ...btn, padding: 13, fontSize: 14, background: la.canSplit ? "#0d6efd" : "#1a1a2e", color: "#fff", opacity: la.canSplit ? 1 : 0.3, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>✂️ SPLIT</button>
                </div>
                {la.canSurrender && <button onClick={onSurrender} style={{ ...btn, width: "100%", padding: 11, fontSize: 13, marginTop: 7, background: "#9333ea22", color: "#c4b5fd", border: "1px solid #9333ea55" }}>🏳️ SURRENDER (lose half)</button>}
                <button onClick={() => setShowHint(!showHint)} style={{ ...btn, width: "100%", padding: 10, fontSize: 12, marginTop: 7, background: showHint ? "#8b5cf620" : "#111827", color: showHint ? "#a78bfa" : CL.muted, border: `1px solid ${showHint ? "#8b5cf640" : "#ffffff10"}` }}>📖 {showHint ? "Hide" : "Show"} Strategy Hint</button>
              </div>
            )}
          </div>

          {showHint && phase === "play" && curHand.length >= 2 && dealerUp && (
            <div style={{ margin: "0 16px 12px", padding: 14, borderRadius: 14, background: "#111827", border: "1px solid #ffffff12" }}>
              <div style={{ fontSize: 11, color: CL.muted, marginBottom: 4 }}>Optimal play:</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: ACTION_COLORS[getCorrectAction(curHand, dealerUp, opts(curHand, hands))] }}>{ACTION_LABELS[getCorrectAction(curHand, dealerUp, opts(curHand, hands))]}</div>
              <div style={{ fontSize: 11, color: CL.muted, marginTop: 2 }}>{handValue(curHand)} vs Dealer {dealerUp.rank} · {isPair(curHand) ? "Pair" : isSoft(curHand) ? "Soft" : "Hard"}</div>
            </div>
          )}
          <Disclaimer />
        </main>
      )}

      {tab === "strategy" && <StrategyTab sTab={sTab} setSTab={setSTab} />}
      {tab === "tips" && <TipsTab />}
    </div>
  );
}
