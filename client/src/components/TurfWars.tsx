import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { Trophy, Shield, Zap, Clock, MapPin, Crown, ChevronDown, Hexagon } from "lucide-react";

/* ─────────────────────────── Interfaces (PRESERVED) ─────────────────────────── */

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

/* ─────────────────────────── Constants (PRESERVED) ─────────────────────────── */

const ZONE_NAMES = ["Alpha","Bravo","Charlie","Delta","Echo","Foxtrot","Golf","Hotel","India","Juliet","Kilo","Lima","Mike","Nov","Oscar","Papa","Quebec","Romeo"];
const BOT_NAMES = ["Shadow","Blaze","Neon","Frost","Cipher","Raven","Storm","Vortex"];
const CAPTURE_TIME = 8;

/* ─────────────────────────── Palette ─────────────────────────── */

const P = {
  yours: "#8b5cf6",
  yoursGlow: "rgba(139,92,246,0.45)",
  enemy: "#ef4444",
  enemyGlow: "rgba(239,68,68,0.35)",
  gold: "#f59e0b",
  goldGlow: "rgba(245,158,11,0.4)",
  glass: "rgba(255,255,255,0.04)",
  glassBorder: "rgba(255,255,255,0.08)",
  glassBorderHover: "rgba(255,255,255,0.14)",
  text: "#f3f4f6",
  textDim: "#9ca3af",
  bg1: "#0a0a0f",
  bg2: "#12101e",
};

/* ─────────────────────────── Noise Overlay ─────────────────────────── */

const NoiseOverlay = () => (
  <svg className="pointer-events-none fixed inset-0 z-[100] h-full w-full opacity-[0.03]">
    <filter id="turfNoise">
      <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
    </filter>
    <rect width="100%" height="100%" filter="url(#turfNoise)" />
  </svg>
);

/* ─────────────────────────── Floating Orbs ─────────────────────────── */

const orbConfigs = [
  { size: 180, color: "rgba(139,92,246,0.12)", x: ["-10%","60%","-10%"], y: ["10%","50%","10%"], dur: 22 },
  { size: 140, color: "rgba(245,158,11,0.08)", x: ["80%","20%","80%"], y: ["60%","15%","60%"], dur: 26 },
  { size: 120, color: "rgba(59,130,246,0.09)", x: ["50%","5%","50%"], y: ["80%","40%","80%"], dur: 30 },
  { size: 100, color: "rgba(239,68,68,0.07)", x: ["30%","70%","30%"], y: ["5%","70%","5%"], dur: 24 },
];

const FloatingOrbs = () => (
  <>
    {orbConfigs.map((o, i) => (
      <motion.div
        key={i}
        className="pointer-events-none absolute rounded-full"
        style={{ width: o.size, height: o.size, background: `radial-gradient(circle, ${o.color}, transparent 70%)`, filter: "blur(40px)" }}
        animate={{ x: o.x, y: o.y }}
        transition={{ duration: o.dur, repeat: Infinity, ease: "easeInOut" }}
      />
    ))}
  </>
);

/* ─────────────────────────── Dust Motes ─────────────────────────── */

const dustMotes = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  size: Math.random() * 2.5 + 1,
  left: `${Math.random() * 100}%`,
  delay: Math.random() * 8,
  dur: 6 + Math.random() * 6,
  drift: (Math.random() - 0.5) * 60,
}));

const DustMotes = () => (
  <>
    {dustMotes.map(m => (
      <motion.div
        key={m.id}
        className="pointer-events-none absolute rounded-full bg-white/10"
        style={{ width: m.size, height: m.size, left: m.left, bottom: -4 }}
        animate={{ y: [0, -window.innerHeight - 20], x: [0, m.drift], opacity: [0, 0.5, 0.3, 0] }}
        transition={{ duration: m.dur, delay: m.delay, repeat: Infinity, ease: "easeOut" }}
      />
    ))}
  </>
);

/* ─────────────────────────── Animated Score Digit ─────────────────────────── */

const AnimatedScore = ({ value, color = P.gold, size = 16 }: { value: number; color?: string; size?: number }) => {
  const spring = useSpring(0, { stiffness: 120, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v));
  const [text, setText] = useState(String(value));

  useEffect(() => { spring.set(value); }, [value, spring]);
  useEffect(() => {
    const unsub = display.on("change", (v) => setText(String(v)));
    return unsub;
  }, [display]);

  return (
    <motion.span
      style={{ fontSize: size, fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}
      key={value}
    >
      {text}
    </motion.span>
  );
};

/* ─────────────────────────── Territory Progress Bar ─────────────────────────── */

const TerritoryBar = ({ zones }: { zones: Zone[] }) => {
  const total = zones.length || 1;
  const yours = zones.filter(z => z.owner === "yours").length;
  const enemy = zones.filter(z => z.owner === "enemy").length;
  const yoursPct = (yours / total) * 100;
  const enemyPct = (enemy / total) * 100;

  return (
    <div className="relative mx-4 mt-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold tracking-wider" style={{ color: P.yours }}>
          YOU {yours}
        </span>
        <span className="text-[9px] font-semibold" style={{ color: P.textDim }}>
          TERRITORY
        </span>
        <span className="text-[10px] font-bold tracking-wider" style={{ color: P.enemy }}>
          {enemy} FOE
        </span>
      </div>
      <div
        className="relative h-2 overflow-hidden rounded-full"
        style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${P.glassBorder}` }}
      >
        {/* Your territory from left */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: `linear-gradient(90deg, ${P.yours}, #a78bfa)` }}
          animate={{ width: `${yoursPct}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 18 }}
        />
        {/* Enemy territory from right */}
        <motion.div
          className="absolute inset-y-0 right-0 rounded-full"
          style={{ background: `linear-gradient(270deg, ${P.enemy}, #f87171)` }}
          animate={{ width: `${enemyPct}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 18 }}
        />
        {/* Leading glow */}
        {yoursPct > enemyPct && (
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: P.yoursGlow, filter: "blur(6px)" }}
            animate={{ width: `${yoursPct}%`, opacity: [0.4, 0.7, 0.4] }}
            transition={{ width: { type: "spring", stiffness: 100 }, opacity: { duration: 2, repeat: Infinity } }}
          />
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────── Glassmorphic Hex Cell ─────────────────────────── */

const HEX_CLIP = "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)";

const HexCell = ({ zone, onTap, isCapturing, captureId }: { zone: Zone; onTap: (z: Zone) => void; isCapturing: boolean; captureId: number | null }) => {
  const isTarget = captureId === zone.id;
  const ownerColor = zone.owner === "yours" ? P.yours : zone.owner === "enemy" ? P.enemy : "rgba(255,255,255,0.12)";
  const fillBg = zone.owner === "yours"
    ? "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(167,139,250,0.15))"
    : zone.owner === "enemy"
    ? "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(248,113,113,0.1))"
    : "rgba(255,255,255,0.03)";
  const glowShadow = zone.owner === "yours"
    ? `0 0 24px ${P.yoursGlow}, inset 0 0 12px rgba(139,92,246,0.1)`
    : zone.owner === "enemy"
    ? `0 0 16px ${P.enemyGlow}`
    : "none";

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{ left: zone.x, top: zone.y + 80, width: 80, height: 70 }}
      onClick={() => onTap(zone)}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      layout
    >
      {/* Outer border / glow ring */}
      <motion.div
        className="absolute"
        style={{ inset: -2, clipPath: HEX_CLIP, background: ownerColor }}
        animate={
          isTarget
            ? { opacity: [0.5, 1, 0.5] }
            : zone.owner === "enemy"
            ? { opacity: [0.6, 0.9, 0.6] }
            : {}
        }
        transition={isTarget || zone.owner === "enemy" ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : {}}
      />
      {/* Inner fill */}
      <div
        className="relative h-full w-full"
        style={{ clipPath: HEX_CLIP, background: fillBg, boxShadow: glowShadow, backdropFilter: "blur(8px)" }}
      />
      {/* Zone name */}
      <span
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center"
        style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: zone.owner === "yours" ? "#c4b5fd" : zone.owner === "enemy" ? "#fca5a5" : "rgba(255,255,255,0.45)" }}
      >
        {zone.name}
      </span>
      {/* Capture ripple */}
      <AnimatePresence>
        {isTarget && (
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: P.yoursGlow }}
            initial={{ width: 0, height: 0, opacity: 0.8 }}
            animate={{ width: 90, height: 90, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ─────────────────────────── Capture HUD (Circular Timer) ─────────────────────────── */

const CaptureHUD = ({ target, progress }: { target: Zone; progress: number }) => {
  const remaining = CAPTURE_TIME - progress;
  const pct = progress / CAPTURE_TIME;
  const circumference = 2 * Math.PI * 52;
  const isUrgent = remaining <= 2;

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 z-30 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3"
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.6, opacity: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      {/* Circular ring */}
      <div className="relative" style={{ width: 120, height: 120 }}>
        <svg viewBox="0 0 120 120" className="absolute h-full w-full">
          {/* Background track */}
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          {/* Progress arc */}
          <motion.circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke={isUrgent ? "#22c55e" : P.yours}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - circumference * pct}
            style={{ transform: "rotate(-90deg)", transformOrigin: "center", filter: `drop-shadow(0 0 10px ${isUrgent ? "rgba(34,197,94,0.5)" : P.yoursGlow})` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </svg>
        {/* Inner content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-extrabold"
            style={{ fontSize: 32, color: isUrgent ? "#22c55e" : P.yours }}
            animate={isUrgent ? { scale: [1, 1.15, 1] } : {}}
            transition={isUrgent ? { duration: 0.6, repeat: Infinity } : {}}
          >
            {remaining}
          </motion.span>
          <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: P.textDim }}>
            Capturing
          </span>
        </div>
        {/* Urgency pulse ring */}
        {isUrgent && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: "2px solid rgba(34,197,94,0.3)" }}
            animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>
      {/* Zone label */}
      <motion.span
        className="rounded-xl px-4 py-1.5 text-xs font-semibold"
        style={{ background: "rgba(18,18,18,0.8)", backdropFilter: "blur(16px)", border: `1px solid ${P.glassBorder}`, color: P.text }}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <Hexagon className="mr-1.5 inline h-3 w-3" style={{ color: P.yours }} />
        {target.name}
      </motion.span>
    </motion.div>
  );
};

/* ─────────────────────────── Shimmer Stat Pill ─────────────────────────── */

const StatPill = ({ label, value, accent }: { label: string; value: string | number; accent: string }) => (
  <motion.div
    className="relative overflow-hidden rounded-2xl px-3 py-1"
    style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${P.glassBorder}` }}
    whileHover={{ scale: 1.04, borderColor: P.glassBorderHover }}
  >
    {/* Shimmer */}
    <motion.div
      className="pointer-events-none absolute inset-0 -translate-x-full"
      style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)" }}
      animate={{ x: ["-100%", "200%"] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
    />
    <span className="text-xs font-bold tabular-nums" style={{ color: accent }}>{value}</span>
    <span className="ml-1 text-[10px] font-medium" style={{ color: P.textDim }}>{label}</span>
  </motion.div>
);

/* ═══════════════════════════ MAIN COMPONENT ═══════════════════════════ */

export default function TurfWars() {
  /* ── State (ALL PRESERVED) ── */
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

  /* ── Generate hex grid on mount (PRESERVED) ── */
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

  /* ── Reward tick (PRESERVED) ── */
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

  /* ── Capture logic (PRESERVED) ── */
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
  const sorted = useMemo(() => [...leaderboard].sort((a, b) => b.score - a.score), [leaderboard]);
  const playerRank = sorted.findIndex(e => e.isYou) + 1;

  /* ─────────────────────────── Render ─────────────────────────── */

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: `linear-gradient(145deg, ${P.bg1}, ${P.bg2})` }}>
      <NoiseOverlay />
      <FloatingOrbs />
      <DustMotes />

      {/* ═══════ Score Bar ═══════ */}
      <motion.div
        className="absolute left-0 right-0 top-0 z-20 flex flex-col gap-1.5"
        style={{ padding: "10px 16px 8px", background: "linear-gradient(to bottom, rgba(0,0,0,0.88), rgba(0,0,0,0.3), transparent)" }}
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
      >
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold tracking-[2px]" style={{ background: `linear-gradient(135deg, ${P.yours}, #c084fc)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              🏴 TURF WARS
            </span>
            {playerRank === 1 && (
              <motion.span
                animate={{ rotate: [0, -12, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                👑
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" style={{ color: P.gold }} />
            <AnimatedScore value={totalPoints} color={P.gold} size={18} />
          </div>
        </div>

        {/* Stat pills */}
        <div className="flex gap-2">
          <StatPill label="zones" value={playerZones} accent={P.text} />
          <StatPill label="streak" value={`x${multiplier}`} accent={P.gold} />
          <StatPill label="hold" value={fmtTime(holdTimer)} accent={P.yours} />
          <StatPill label={`#${playerRank}`} value="" accent={P.textDim} />
        </div>

        {/* Territory Bar */}
        <TerritoryBar zones={zones} />
      </motion.div>

      {/* ═══════ Leaderboard Button ═══════ */}
      <motion.div
        className="absolute z-20 flex cursor-pointer items-center justify-center rounded-full"
        style={{ top: 100, right: 12, width: 40, height: 40, background: "rgba(18,18,18,0.7)", backdropFilter: "blur(16px)", border: `1px solid ${P.glassBorder}`, boxShadow: `0 0 12px rgba(245,158,11,0.15)` }}
        onClick={() => setShowLeaderboard(true)}
        whileHover={{ scale: 1.08, borderColor: P.goldGlow }}
        whileTap={{ scale: 0.92 }}
      >
        <Trophy className="h-4 w-4" style={{ color: P.gold }} />
      </motion.div>

      {/* ═══════ Hex Grid ═══════ */}
      <div className="absolute inset-0" style={{ paddingTop: 80 }}>
        <AnimatePresence>
          {zones.map((z, i) => (
            <motion.div
              key={z.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 180, damping: 16, delay: i * 0.04 }}
            >
              <HexCell
                zone={z}
                onTap={onZoneTap}
                isCapturing={isCapturing}
                captureId={captureTarget?.id ?? null}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ═══════ Capture HUD ═══════ */}
      <AnimatePresence>
        {isCapturing && captureTarget && (
          <CaptureHUD target={captureTarget} progress={captureProgress} />
        )}
      </AnimatePresence>

      {/* ═══════ Reward Particles ═══════ */}
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="pointer-events-none absolute text-xs font-extrabold"
            style={{ left: p.x, top: p.y + 80, color: p.text === "CAPTURED!" ? "#22c55e" : P.gold, textShadow: `0 0 10px ${p.text === "CAPTURED!" ? "rgba(34,197,94,0.5)" : P.goldGlow}` }}
            initial={{ opacity: 1, y: 0, scale: 1.2 }}
            animate={{ opacity: 0, y: -70, scale: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          >
            {p.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ═══════ Leaderboard Panel ═══════ */}
      <AnimatePresence>
        {showLeaderboard && (
          <motion.div
            className="absolute inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
            onClick={() => setShowLeaderboard(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute rounded-2xl"
              style={{
                top: 56, right: 12, width: 260,
                background: "rgba(14,14,20,0.92)",
                backdropFilter: "blur(28px)",
                border: `1px solid ${P.glassBorder}`,
                padding: 16,
                boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
              }}
              onClick={e => e.stopPropagation()}
              initial={{ x: 60, opacity: 0, scale: 0.9 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 60, opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
              {/* Header */}
              <div className="mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4" style={{ color: P.gold }} />
                <span className="text-sm font-extrabold tracking-wider" style={{ background: `linear-gradient(135deg, ${P.gold}, #fbbf24)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  LEADERBOARD
                </span>
              </div>

              {/* Entries */}
              {sorted.map((e, i) => (
                <motion.div
                  key={e.name}
                  className="mb-1 flex items-center gap-2.5 rounded-xl px-2.5 py-2"
                  style={{
                    background: e.isYou ? "rgba(139,92,246,0.1)" : P.glass,
                    border: `1px solid ${e.isYou ? "rgba(139,92,246,0.2)" : P.glassBorder}`,
                  }}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 200, damping: 20 }}
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.06)" }}
                >
                  {/* Rank badge */}
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-extrabold"
                    style={{
                      background: i === 0 ? `linear-gradient(135deg, ${P.gold}, #d97706)` : "rgba(255,255,255,0.06)",
                      color: i === 0 ? "#000" : P.textDim,
                      boxShadow: i === 0 ? `0 0 10px ${P.goldGlow}` : "none",
                    }}
                  >
                    {i === 0 ? "👑" : i + 1}
                  </span>
                  <span className="flex-1 text-xs font-semibold" style={{ color: e.isYou ? "#c4b5fd" : P.text }}>
                    {e.name}
                    {e.isYou && <span className="ml-1 text-[9px] font-medium" style={{ color: P.textDim }}>(you)</span>}
                  </span>
                  <AnimatedScore value={e.score} color={P.gold} size={12} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ Zone Detail Sheet ═══════ */}
      <AnimatePresence>
        {showSheet && sheetZone && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 z-40 rounded-t-2xl"
            style={{
              background: "rgba(14,14,20,0.95)",
              backdropFilter: "blur(28px)",
              borderTop: `1px solid ${P.glassBorder}`,
              padding: "12px 20px 80px",
              boxShadow: "0 -12px 40px rgba(0,0,0,0.5)",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
          >
            {/* Drag handle */}
            <motion.div
              className="mx-auto mb-3 cursor-pointer rounded-full"
              style={{ width: 36, height: 4, background: "rgba(255,255,255,0.2)" }}
              onClick={() => setShowSheet(false)}
              whileHover={{ scaleX: 1.3, background: "rgba(255,255,255,0.35)" }}
            />

            {/* Zone title */}
            <div className="mb-1 flex items-center gap-2">
              <Hexagon className="h-4 w-4" style={{ color: sheetZone.owner === "yours" ? P.yours : sheetZone.owner === "enemy" ? P.enemy : P.textDim }} />
              <span className="text-base font-bold" style={{ color: P.text }}>{sheetZone.name}</span>
            </div>
            <div className="mb-3 flex items-center gap-1.5 text-[11px] font-medium" style={{ color: P.textDim }}>
              {sheetZone.owner === "yours" ? (
                <><Shield className="h-3 w-3" style={{ color: P.yours }} /> <span style={{ color: "#a78bfa" }}>Owned by You</span></>
              ) : sheetZone.owner === "enemy" ? (
                <><Shield className="h-3 w-3" style={{ color: P.enemy }} /> <span style={{ color: "#fca5a5" }}>Enemy Territory</span></>
              ) : (
                <><MapPin className="h-3 w-3" /> Unclaimed</>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Hold", val: fmtTime(sheetZone.holdTime), c: P.yours, icon: Clock },
                { label: "Points", val: sheetZone.points, c: P.gold, icon: Zap },
                { label: "Rate", val: `${sheetZone.rate}/s`, c: P.text, icon: Zap },
              ].map(s => (
                <motion.div
                  key={s.label}
                  className="rounded-xl p-3 text-center"
                  style={{ background: P.glass, border: `1px solid ${P.glassBorder}` }}
                  whileHover={{ scale: 1.04, borderColor: P.glassBorderHover }}
                >
                  <s.icon className="mx-auto mb-1 h-3 w-3" style={{ color: s.c, opacity: 0.6 }} />
                  <div className="text-lg font-extrabold" style={{ color: s.c }}>{s.val}</div>
                  <div className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: P.textDim }}>{s.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}