import { useState, useEffect, useRef, useCallback } from "react";

interface Zone {
  id: number;
  name: string;
  x: number;
  y: number;
  owner: "none" | "yours" | "enemy";
  holdTime: number;
  points: number;
  rate: number;
}

interface LeaderboardEntry {
  name: string;
  score: number;
  isYou?: boolean;
}

const ZONE_NAMES = ["Alpha","Bravo","Charlie","Delta","Echo","Foxtrot","Golf","Hotel","India","Juliet","Kilo","Lima","Mike","Nov","Oscar","Papa","Quebec","Romeo"];
const BOT_NAMES = ["Shadow","Blaze","Neon","Frost","Cipher","Raven","Storm","Vortex"];
const CAPTURE_TIME = 8;

export default function TurfWars() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [playerZones, setPlayerZones] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [holdTimer, setHoldTimer] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureTarget, setCaptureTarget] = useState<Zone | null>(null);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetZone, setSheetZone] = useState<Zone | null>(null);
  const [particles, setParticles] = useState<{id:number;x:number;y:number;text:string}[]>([]);
  const particleId = useRef(0);
  const rewardRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => [
    { name: "You", score: 0, isYou: true },
    ...BOT_NAMES.slice(0, 5).map(n => ({ name: n, score: Math.floor(Math.random() * 80) + 10 })),
  ]);

  // Generate hex grid on mount
  useEffect(() => {
    const hexW = 80, hexH = 70, offsetX = 10, offsetY = 10;
    const cols = 4, rows = 5;
    const generated: Zone[] = [];
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (idx >= ZONE_NAMES.length) break;
        const x = offsetX + c * (hexW * 0.88) + (r % 2 ? hexW * 0.44 : 0);
        const y = offsetY + r * (hexH * 0.78);
        const zone: Zone = { id: idx, name: ZONE_NAMES[idx], x, y, owner: "none", holdTime: 0, points: 0, rate: 1 };
        if (Math.random() < 0.25 && idx > 2) { zone.owner = "enemy"; zone.holdTime = Math.floor(Math.random() * 300); zone.points = Math.floor(Math.random() * 30); }
        generated.push(zone);
        idx++;
      }
    }
    setZones(generated);
  }, []);

  // Reward tick
  useEffect(() => {
    rewardRef.current = setInterval(() => {
      setZones(prev => {
        let earned = 0;
        const updated = prev.map(z => {
          if (z.owner === "yours") {
            const newHold = z.holdTime + 1;
            const newRate = Math.pow(2, Math.floor(newHold / 300));
            earned += newRate;
            return { ...z, holdTime: newHold, rate: newRate, points: z.points + newRate };
          }
          return z;
        });
        if (earned > 0) {
          setHoldTimer(h => {
            const newH = h + 1;
            setMultiplier(Math.min(8, 1 + Math.floor(newH / 60)));
            return newH;
          });
          setTotalPoints(p => {
            const newP = p + earned;
            setLeaderboard(lb => lb.map(e => e.isYou ? { ...e, score: newP } : e));
            return newP;
          });
          // Spawn particle on random owned zone
          const owned = updated.filter(z => z.owner === "yours");
          if (owned.length > 0) {
            const rz = owned[Math.floor(Math.random() * owned.length)];
            const pid = particleId.current++;
            setParticles(pp => [...pp, { id: pid, x: rz.x + 30, y: rz.y + 20, text: "+" + earned }]);
            setTimeout(() => setParticles(pp => pp.filter(p => p.id !== pid)), 1500);
          }
        }
        // Bot activity
        setLeaderboard(lb => lb.map(e => e.isYou ? e : { ...e, score: e.score + (Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 1 : 0) }));
        if (Math.random() < 0.02) {
          const unclaimed = updated.filter(z => z.owner === "none");
          if (unclaimed.length > 0) {
            const z = unclaimed[Math.floor(Math.random() * unclaimed.length)];
            return updated.map(zz => zz.id === z.id ? { ...zz, owner: "enemy" as const } : zz);
          }
        }
        return updated;
      });
    }, 1000);
    return () => { if (rewardRef.current) clearInterval(rewardRef.current); };
  }, []);

  // Capture logic
  const startCapture = useCallback((zone: Zone) => {
    if (isCapturing || zone.owner !== "none") return;
    setIsCapturing(true);
    setCaptureTarget(zone);
    setCaptureProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress++;
      setCaptureProgress(progress);
      if (progress >= CAPTURE_TIME) {
        clearInterval(interval);
        setZones(prev => prev.map(z => z.id === zone.id ? { ...z, owner: "yours" as const, holdTime: 0, points: 0, rate: 1 } : z));
        setPlayerZones(p => p + 1);
        setIsCapturing(false);
        setCaptureTarget(null);
        const pid = particleId.current++;
        setParticles(pp => [...pp, { id: pid, x: zone.x + 30, y: zone.y + 10, text: "CAPTURED!" }]);
        setTimeout(() => setParticles(pp => pp.filter(p => p.id !== pid)), 1500);
      }
    }, 1000);
  }, [isCapturing]);

  const onZoneTap = (zone: Zone) => {
    if (isCapturing) return;
    if (zone.owner === "none") { startCapture(zone); return; }
    setSheetZone(zone);
    setShowSheet(true);
  };

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const sorted = [...leaderboard].sort((a, b) => b.score - a.score);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* Score Bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, padding: "8px 16px", background: "linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: 2, background: "linear-gradient(135deg,#8b5cf6,#c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🏴 TURF WARS</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 700, fontSize: 16, color: "#f59e0b" }}>⭐ {totalPoints}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ label: "zones", val: playerZones }, { label: "streak", val: `x${multiplier}` }, { label: "hold", val: fmtTime(holdTimer) }].map(s => (
            <span key={s.label} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "2px 10px", fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>
              <span style={{ color: s.label === "streak" ? "#f59e0b" : "#f3f4f6" }}>{s.val}</span> {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Leaderboard Button */}
      <div onClick={() => setShowLeaderboard(true)} style={{ position: "absolute", top: 70, right: 12, zIndex: 20, width: 36, height: 36, borderRadius: "50%", background: "rgba(25,25,25,0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18 }}>🏆</div>

      {/* Hex Grid */}
      <div style={{ position: "absolute", inset: 0, paddingTop: 80 }}>
        {zones.map(z => (
          <div key={z.id} onClick={() => onZoneTap(z)} style={{ position: "absolute", left: z.x, top: z.y + 80, width: 80, height: 70, cursor: "pointer", transition: "all 0.3s" }}>
            <div style={{ position: "absolute", inset: -2, clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)", background: z.owner === "yours" ? "#8b5cf6" : z.owner === "enemy" ? "#ef4444" : "rgba(255,255,255,0.08)" }} />
            <div style={{ width: "100%", height: "100%", clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)", background: z.owner === "yours" ? "rgba(139,92,246,0.2)" : z.owner === "enemy" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.04)", boxShadow: z.owner === "yours" ? "0 0 20px rgba(139,92,246,0.4)" : "none" }} />
            <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 9, fontWeight: 700, color: z.owner === "yours" ? "#8b5cf6" : z.owner === "enemy" ? "#ef4444" : "rgba(255,255,255,0.5)", letterSpacing: 0.5, textTransform: "uppercase", whiteSpace: "nowrap" }}>{z.name}</span>
          </div>
        ))}
      </div>

      {/* Capture HUD */}
      {isCapturing && captureTarget && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ width: 120, height: 120, position: "relative" }}>
            <svg viewBox="0 0 120 120" style={{ width: 120, height: 120, position: "absolute" }}>
              <circle cx="60" cy="60" r="56" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
              <circle cx="60" cy="60" r="56" fill="none" stroke="#8b5cf6" strokeWidth="4" strokeLinecap="round" strokeDasharray="352" strokeDashoffset={352 - (352 * captureProgress / CAPTURE_TIME)} style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 0.3s", filter: "drop-shadow(0 0 8px rgba(139,92,246,0.4))" }} />
            </svg>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#8b5cf6" }}>{CAPTURE_TIME - captureProgress}</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 }}>Capturing</div>
            </div>
          </div>
          <span style={{ background: "rgba(25,25,25,0.7)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "4px 14px", fontSize: 12, fontWeight: 600, color: "#f3f4f6" }}>{captureTarget.name}</span>
        </div>
      )}

      {/* Reward Particles */}
      {particles.map(p => (
        <div key={p.id} style={{ position: "absolute", left: p.x, top: p.y + 80, fontSize: 12, fontWeight: 800, color: "#f59e0b", pointerEvents: "none", animation: "turfFloatUp 1.5s ease-out forwards", textShadow: "0 0 8px rgba(245,158,11,0.5)" }}>{p.text}</div>
      ))}

      {/* Leaderboard Panel */}
      {showLeaderboard && (
        <div style={{ position: "absolute", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setShowLeaderboard(false)}>
          <div style={{ position: "absolute", top: 60, right: 12, width: 240, background: "rgba(18,18,18,0.95)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 16 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 1, marginBottom: 12, background: "linear-gradient(135deg,#f59e0b,#fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🏆 LEADERBOARD</div>
            {sorted.map((e, i) => (
              <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, marginBottom: 4, background: e.isYou ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.03)", border: e.isYou ? "1px solid rgba(139,92,246,0.2)" : "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: i === 0 ? "linear-gradient(135deg,#f59e0b,#d97706)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: i === 0 ? "#000" : "#9ca3af" }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#f3f4f6" }}>{e.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b" }}>{e.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zone Sheet */}
      {showSheet && sheetZone && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 40, background: "rgba(18,18,18,0.95)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px 20px 0 0", padding: "12px 20px 80px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.2)", margin: "0 auto 12px" }} onClick={() => setShowSheet(false)} />
          <div style={{ fontSize: 15, fontWeight: 700 }}>{sheetZone.name}</div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 12 }}>{sheetZone.owner === "yours" ? "🟢 Owned by You" : sheetZone.owner === "enemy" ? "🔴 Enemy Territory" : "Unclaimed"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[{ label: "Hold", val: fmtTime(sheetZone.holdTime), c: "#8b5cf6" }, { label: "Points", val: sheetZone.points, c: "#f59e0b" }, { label: "Rate", val: `${sheetZone.rate}/s`, c: "#f3f4f6" }].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 10, textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.c }}>{s.val}</div>
                <div style={{ fontSize: 9, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Float-up animation */}
      <style>{`@keyframes turfFloatUp { 0% { opacity:1; transform:translateY(0) scale(1); } 100% { opacity:0; transform:translateY(-80px) scale(0.5); } }`}</style>
    </div>
  );
}