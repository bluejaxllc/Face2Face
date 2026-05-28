import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Zap, Trophy, ShieldAlert, Timer, RefreshCcw, User, Sparkles, Award, Crown } from "lucide-react";

/* ────────────────────────────────────────────────────────────────
   MapBumpBattle — Compact reflex-speed duel for the map overlay
   Best of 3 rounds. No header/back — parent bottom sheet handles that.
   ──────────────────────────────────────────────────────────────── */

interface MapGameChildProps {
  opponent: {
    id: number;
    firstName: string;
    lastName: string;
    age: number;
    sex: string;
    profilePhoto?: string | null;
    category: string;
  };
  category: "dating" | "friends" | "business";
  onComplete: () => void;
  onBack: () => void;
}

const THEMES = {
  dating: {
    gradient: "from-pink-500 via-rose-500 to-red-500",
    text: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    ring: "ring-pink-500/40",
    accent: "pink",
    glow: "rgba(236,72,153,0.45)",
    glowSoft: "rgba(236,72,153,0.12)",
    hex: "#ec4899",
    hexAlt: "#f43f5e",
  },
  friends: {
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    ring: "ring-emerald-500/40",
    accent: "emerald",
    glow: "rgba(16,185,129,0.45)",
    glowSoft: "rgba(16,185,129,0.12)",
    hex: "#10b981",
    hexAlt: "#14b8a6",
  },
  business: {
    gradient: "from-blue-500 via-indigo-500 to-purple-500",
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    ring: "ring-blue-500/40",
    accent: "blue",
    glow: "rgba(59,130,246,0.45)",
    glowSoft: "rgba(59,130,246,0.12)",
    hex: "#3b82f6",
    hexAlt: "#6366f1",
  },
} as const;

const TOTAL_ROUNDS = 3;

type Phase = "countdown" | "ready" | "flash" | "round-result" | "match-result";

/* ── Compute winner tint — warm if player winning, cool if opponent ── */
function useWinnerTint(playerScore: number, opponentScore: number) {
  if (playerScore > opponentScore) return { warm: 0.15, cool: 0 }; // warm amber/gold undertone
  if (opponentScore > playerScore) return { warm: 0, cool: 0.15 }; // cool blue/purple undertone
  return { warm: 0, cool: 0 }; // neutral
}

/* ── Speed rating based on reaction time ── */
function getSpeedRating(time: number): { label: string; color: string } {
  if (time < 180) return { label: "⚡ LIGHTNING!", color: "#fbbf24" };
  if (time < 280) return { label: "🔥 FAST!", color: "#34d399" };
  if (time < 400) return { label: "👍 GOOD", color: "#60a5fa" };
  return { label: "🐢 SLOW", color: "#f87171" };
}

/* ── Progressive intensity factor (increases with rounds and close scores) ── */
function useIntensity(currentRound: number, playerScore: number, opponentScore: number) {
  const roundFactor = currentRound / TOTAL_ROUNDS; // 0.33 → 1
  const closeness = 1 - Math.abs(playerScore - opponentScore) / TOTAL_ROUNDS; // closer = more intense
  return 0.6 + roundFactor * 0.25 + closeness * 0.15; // range ~0.6 to 1.0
}

/* ── Animated digit (slot-machine odometer) ── */
function AnimatedDigit({ value }: { value: number }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="inline-block tabular-nums"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

/* ── Score odometer — each digit rolls individually ── */
function ScoreOdometer({ value, color }: { value: number; color: string }) {
  const digits = String(value).split("").map(Number);
  return (
    <span style={{ color, fontVariantNumeric: "tabular-nums" }} className="inline-flex">
      {digits.map((d, i) => (
        <AnimatedDigit key={`${i}-${d}`} value={d} />
      ))}
    </span>
  );
}

/* ── Score with pulse ripple on change ── */
function ScoreWithRipple({ value, color, rippleColor }: { value: number; color: string; rippleColor: string }) {
  const [rippleKey, setRippleKey] = useState(0);
  const prevValue = useRef(value);
  useEffect(() => {
    if (value !== prevValue.current) {
      setRippleKey((k) => k + 1);
      prevValue.current = value;
    }
  }, [value]);
  return (
    <div className="relative inline-flex">
      <AnimatePresence>
        {rippleKey > 0 && (
          <motion.div
            key={rippleKey}
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ border: `2px solid ${rippleColor}` }}
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
      <ScoreOdometer value={value} color={color} />
    </div>
  );
}

/* ── Animated gradient border card wrapper ── */
function GlowBorderCard({ children, color1, color2, className = "" }: { children: React.ReactNode; color1: string; color2: string; className?: string }) {
  const [rotation, setRotation] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      setRotation((r) => (r + 0.5) % 360);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, []);
  return (
    <div className={`relative rounded-2xl p-[1.5px] ${className}`} style={{ background: `conic-gradient(from ${rotation}deg, ${color1}, ${color2}, ${color1})` }}>
      <div className="rounded-2xl bg-slate-950/90 backdrop-blur-md h-full">{children}</div>
    </div>
  );
}

/* ── Speed gauge arc for reaction times ── */
function SpeedGauge({ time, maxTime = 600 }: { time: number; maxTime?: number }) {
  const pct = Math.min(time / maxTime, 1);
  const angle = pct * 180;
  const r = 36;
  const cx = 44;
  const cy = 44;
  const startAngle = -180;
  const endAngle = startAngle + angle;
  const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180);
  const y1 = cy + r * Math.sin((startAngle * Math.PI) / 180);
  const x2 = cx + r * Math.cos((endAngle * Math.PI) / 180);
  const y2 = cy + r * Math.sin((endAngle * Math.PI) / 180);
  const largeArc = angle > 180 ? 1 : 0;
  const gaugeColor = pct < 0.35 ? "#34d399" : pct < 0.65 ? "#fbbf24" : "#f87171";

  return (
    <svg width="88" height="50" viewBox="0 0 88 50" className="mx-auto">
      {/* Background arc */}
      <path d={`M 8 44 A ${r} ${r} 0 0 1 80 44`} fill="none" stroke="rgba(51,65,85,0.4)" strokeWidth="5" strokeLinecap="round" />
      {/* Filled arc */}
      <motion.path
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
        fill="none"
        stroke={gaugeColor}
        strokeWidth="5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
        style={{ filter: `drop-shadow(0 0 6px ${gaugeColor})` }}
      />
      {/* Needle dot */}
      <motion.circle
        cx={x2}
        cy={y2}
        r="4"
        fill={gaugeColor}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.9 }}
        style={{ filter: `drop-shadow(0 0 4px ${gaugeColor})` }}
      />
    </svg>
  );
}

/* ── Floating orb background (ambient) — with dynamic color temperature ── */
function FloatingOrbs({ color1, color2, intensity = 1, warmTint = 0, coolTint = 0 }: { color1: string; color2: string; intensity?: number; warmTint?: number; coolTint?: number }) {
  // Blend tint into orb colors
  const orbColor1 = warmTint > 0 ? `rgba(251,191,36,${warmTint})` : coolTint > 0 ? `rgba(99,102,241,${coolTint})` : color1;
  const orbColor2 = warmTint > 0 ? `rgba(245,158,11,${warmTint})` : coolTint > 0 ? `rgba(139,92,246,${coolTint})` : color2;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 80 + i * 40,
            height: 80 + i * 40,
            background: `radial-gradient(circle, ${i % 2 === 0 ? color1 : color2} 0%, ${i % 2 === 0 ? orbColor1 : orbColor2} 40%, transparent 70%)`,
            opacity: 0.15 + intensity * 0.05,
            left: `${15 + i * 30}%`,
            top: `${20 + i * 20}%`,
          }}
          animate={{
            x: [0, 20 - i * 15, 0],
            y: [0, -15 + i * 10, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: Math.max(2, (5 + i * 2) / intensity),
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      {/* Extra tinted orbs for winner bias */}
      {warmTint > 0 && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 120,
            height: 120,
            background: `radial-gradient(circle, rgba(251,191,36,${warmTint * 0.7}) 0%, transparent 70%)`,
            opacity: 0.2,
            right: "10%",
            top: "30%",
          }}
          animate={{ x: [0, -10, 0], y: [0, 10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {coolTint > 0 && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 120,
            height: 120,
            background: `radial-gradient(circle, rgba(99,102,241,${coolTint * 0.7}) 0%, transparent 70%)`,
            opacity: 0.2,
            left: "10%",
            bottom: "30%",
          }}
          animate={{ x: [0, 10, 0], y: [0, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}

/* ── Ambient floating dust motes / embers ── */
function AmbientParticles({ intensity = 1, color }: { intensity: number; color: string }) {
  const particles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      opacity: 0.3 + Math.random() * 0.3,
      yDrift: -40 - Math.random() * 60,
      xDrift: (Math.random() - 0.5) * 30,
      dur: 3 + Math.random() * 4,
      delay: Math.random() * 3,
    })),
  []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.slice(0, Math.round(8 * intensity)).map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-1 h-1 rounded-full"
          style={{ background: color, left: `${p.left}%`, top: `${p.top}%`, opacity: p.opacity }}
          animate={{
            y: [0, p.yDrift],
            x: [0, p.xDrift],
            opacity: [0.4, 0],
          }}
          transition={{ duration: p.dur / intensity, repeat: Infinity, delay: p.delay }}
        />
      ))}
    </div>
  );
}

/* ── Sparkle particles for wins ── */
function SparkleParticles({ color }: { color: string }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 2,
        duration: 1.5 + Math.random() * 2,
      })),
    []
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: color,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            y: [0, -30],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

/* ── Confetti dots for match result ── */
function ConfettiDots() {
  const dots = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: ["#fbbf24", "#f472b6", "#34d399", "#60a5fa", "#a78bfa", "#fb923c"][i % 6],
        size: 3 + Math.random() * 5,
        delay: Math.random() * 1.5,
        duration: 2 + Math.random() * 2,
      })),
    []
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((d) => (
        <motion.div
          key={d.id}
          className="absolute rounded-full"
          style={{
            width: d.size,
            height: d.size,
            left: `${d.x}%`,
            top: "-5%",
            background: d.color,
          }}
          animate={{
            y: [0, 400],
            x: [0, (Math.random() - 0.5) * 60],
            rotate: [0, 360],
            opacity: [1, 0],
          }}
          transition={{
            duration: d.duration,
            delay: d.delay,
            repeat: Infinity,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}

/* ── Countdown particle burst ── */
function CountdownBurst({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 6,
            height: 6,
            background: color,
          }}
          initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
          animate={{
            scale: [0, 1.2, 0.5],
            opacity: [1, 0.6, 0],
            x: Math.cos((i / 12) * Math.PI * 2) * 90,
            y: Math.sin((i / 12) * Math.PI * 2) * 90,
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

/* ── Radial shockwave ring ── */
function ShockwaveRing({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {[0, 1, 2].map((r) => (
        <motion.div
          key={r}
          className="absolute rounded-full"
          style={{ border: `2px solid ${color}`, width: 40, height: 40 }}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 4 + r * 1.5, opacity: 0 }}
          transition={{ duration: 0.9, delay: r * 0.12, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

/* ── Victory rotating light rays ── */
function VictoryRays() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute"
        style={{
          width: 280,
          height: 280,
          background: "conic-gradient(from 0deg, transparent 0%, rgba(251,191,36,0.08) 10%, transparent 20%, rgba(251,191,36,0.05) 30%, transparent 40%, rgba(251,191,36,0.07) 55%, transparent 65%, rgba(251,191,36,0.04) 75%, transparent 85%)",
          borderRadius: "50%",
        }}
      />
    </div>
  );
}

/* ── SVG noise texture overlay ── */
function NoiseOverlay() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03] z-50" xmlns="http://www.w3.org/2000/svg">
      <filter id="bb-noise"><feTurbulence baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/></filter>
      <rect width="100%" height="100%" filter="url(#bb-noise)"/>
    </svg>
  );
}

/* ── Radial wipe transition between rounds ── */
function RadialWipe({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
    >
      <motion.div
        className="absolute rounded-full"
        style={{ width: 60, height: 60, background: `radial-gradient(circle, ${color}, transparent)` }}
        initial={{ scale: 0, opacity: 0.6 }}
        animate={{ scale: 8, opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </motion.div>
  );
}

/* ── Floating crown for leading player ── */
function LeadingCrown() {
  return (
    <motion.div
      className="absolute -top-4 left-1/2 z-20 pointer-events-none"
      style={{ marginLeft: -8 }}
      animate={{ y: [0, -3, 0], rotate: [0, 5, -5, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <Crown className="w-4 h-4 text-amber-400" style={{ filter: "drop-shadow(0 0 4px rgba(251,191,36,0.6))" }} />
    </motion.div>
  );
}

/* ── Tension meter bar for ready phase ── */
function TensionMeter({ intensity }: { intensity: number }) {
  return (
    <div className="w-48 mx-auto mt-5 relative z-10">
      <p className="text-center mb-1.5" style={{ fontSize: "7px", letterSpacing: "0.25em", color: "rgba(148,163,184,0.5)", fontWeight: 700, textTransform: "uppercase" }}>
        Tension
      </p>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
        <motion.div
          className="h-full rounded-full relative"
          style={{
            background: "linear-gradient(90deg, rgba(245,158,11,0.4), rgba(245,158,11,0.8), #f59e0b)",
          }}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.5 + Math.random() * 2.5, ease: "easeIn" }}
        >
          {/* Shimmer on tension bar */}
          <motion.div
            className="absolute inset-0"
            style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)" }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>
    </div>
  );
}

/* ── Instant replay comparison bars ── */
function InstantReplay({ playerTime, opponentTime, opponentName }: { playerTime: number | null; opponentTime: number; opponentName: string }) {
  if (!playerTime) return null;
  const maxTime = Math.max(playerTime, opponentTime, 500);
  const playerPct = (playerTime / maxTime) * 100;
  const opponentPct = (opponentTime / maxTime) * 100;
  const playerFaster = playerTime < opponentTime;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="w-full mb-4"
    >
      <p className="text-center mb-2" style={{ fontSize: "7px", letterSpacing: "0.25em", color: "rgba(148,163,184,0.6)", fontWeight: 800, textTransform: "uppercase" }}>
        ⏱ Instant Replay
      </p>
      {/* Player bar */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-slate-400 w-12 text-right" style={{ fontSize: "8px", fontWeight: 700 }}>You</span>
        <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "rgba(30,41,59,0.5)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{
              background: playerFaster
                ? "linear-gradient(90deg, #34d399, #10b981)"
                : "linear-gradient(90deg, #94a3b8, #64748b)",
              boxShadow: playerFaster ? "0 0 8px rgba(16,185,129,0.4)" : "none",
            }}
            initial={{ width: "0%" }}
            animate={{ width: `${playerPct}%` }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          />
        </div>
        <span className="text-xs font-black tabular-nums w-12" style={{ color: playerFaster ? "#34d399" : "#94a3b8" }}>
          {playerTime}ms
        </span>
      </div>
      {/* Opponent bar */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400 w-12 text-right" style={{ fontSize: "8px", fontWeight: 700 }}>{opponentName}</span>
        <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "rgba(30,41,59,0.5)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{
              background: !playerFaster
                ? "linear-gradient(90deg, #fb7185, #f43f5e)"
                : "linear-gradient(90deg, #94a3b8, #64748b)",
              boxShadow: !playerFaster ? "0 0 8px rgba(244,63,94,0.4)" : "none",
            }}
            initial={{ width: "0%" }}
            animate={{ width: `${opponentPct}%` }}
            transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
          />
        </div>
        <span className="text-xs font-black tabular-nums w-12" style={{ color: !playerFaster ? "#fb7185" : "#94a3b8" }}>
          {opponentTime}ms
        </span>
      </div>
    </motion.div>
  );
}

export default function MapBumpBattle({ opponent, category, onComplete, onBack }: MapGameChildProps) {
  const theme = THEMES[category];
  const opponentName = opponent.firstName;

  // ── Game state ──
  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [currentRound, setCurrentRound] = useState(1);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [roundsHistory, setRoundsHistory] = useState<
    { winner: "player" | "opponent" | "foul"; playerTime: number | null; opponentTime: number }[]
  >([]);

  // ── Current round results ──
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [opponentTime, setOpponentTime] = useState(0);
  const [roundWinner, setRoundWinner] = useState<"player" | "opponent" | "foul" | null>(null);

  // ── GO! flash state ──
  const [showGo, setShowGo] = useState(false);

  // ── Round transition wipe ──
  const [showWipe, setShowWipe] = useState(false);

  // ── Refs for timers (avoid stale closures) ──
  const triggerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerTimeRef = useRef<number>(0);
  const isTriggerableRef = useRef(false);
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ── Dynamic color temperature ──
  const winnerTint = useWinnerTint(playerScore, opponentScore);

  // ── Progressive intensity ──
  const intensity = useIntensity(currentRound, playerScore, opponentScore);

  // ── Depth-of-field focus moment ──
  const isFocusMoment = phase === "flash";

  // ── Generate opponent reaction time (200-500ms) ──
  const genOpponentTime = useCallback(() => {
    return Math.floor(Math.random() * 300) + 200;
  }, []);

  // ── Countdown effect ──
  useEffect(() => {
    if (phase === "countdown") {
      setCountdown(3);
      setShowGo(false);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // Show GO! flash before transitioning
            setShowGo(true);
            setTimeout(() => {
              setShowGo(false);
              setPhase("ready");
            }, 700);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // ── Ready → Flash delay (1.5-4s) ──
  useEffect(() => {
    if (phase === "ready") {
      isTriggerableRef.current = false;
      const delay = 1500 + Math.random() * 2500;

      triggerTimeoutRef.current = setTimeout(() => {
        setPhase("flash");
        triggerTimeRef.current = Date.now();
        isTriggerableRef.current = true;
      }, delay);

      return () => {
        if (triggerTimeoutRef.current) clearTimeout(triggerTimeoutRef.current);
      };
    }
  }, [phase]);

  // ── Handle tap ──
  const handleBumpTap = useCallback(() => {
    if (phaseRef.current === "ready") {
      // FOUL — tapped too early
      if (triggerTimeoutRef.current) clearTimeout(triggerTimeoutRef.current);
      isTriggerableRef.current = false;

      const opTime = genOpponentTime();
      setRoundWinner("foul");
      setReactionTime(null);
      setOpponentTime(opTime);
      setOpponentScore((s) => s + 1);
      setRoundsHistory((h) => [...h, { winner: "foul", playerTime: null, opponentTime: opTime }]);
      setPhase("round-result");
      return;
    }

    if (phaseRef.current === "flash" && isTriggerableRef.current) {
      isTriggerableRef.current = false;
      const clickTime = Date.now() - triggerTimeRef.current;
      setReactionTime(clickTime);

      const opTime = genOpponentTime();
      setOpponentTime(opTime);

      const winner: "player" | "opponent" = clickTime < opTime ? "player" : "opponent";
      if (winner === "player") setPlayerScore((s) => s + 1);
      else setOpponentScore((s) => s + 1);

      setRoundWinner(winner);
      setRoundsHistory((h) => [...h, { winner, playerTime: clickTime, opponentTime: opTime }]);
      setPhase("round-result");
    }
  }, [genOpponentTime]);

  // ── Next round / match end ──
  const handleNextRound = useCallback(() => {
    if (playerScore + (roundWinner === "player" ? 0 : 0) >= 2 ||
        opponentScore + (roundWinner === "opponent" || roundWinner === "foul" ? 0 : 0) >= 2 ||
        currentRound >= TOTAL_ROUNDS) {
      // Check actual accumulated scores (state already updated)
      setPhase("match-result");
    } else {
      // Show radial wipe transition
      setShowWipe(true);
      setTimeout(() => {
        setShowWipe(false);
        setCurrentRound((r) => r + 1);
        setRoundWinner(null);
        setReactionTime(null);
        setPhase("countdown");
      }, 500);
    }
  }, [playerScore, opponentScore, currentRound, roundWinner]);

  // ── Restart ──
  const handlePlayAgain = useCallback(() => {
    setPhase("countdown");
    setCurrentRound(1);
    setPlayerScore(0);
    setOpponentScore(0);
    setRoundsHistory([]);
    setRoundWinner(null);
    setReactionTime(null);
  }, []);

  const playerWon = playerScore > opponentScore;

  // Avatar fallback
  const avatarUrl = opponent.profilePhoto || undefined;

  // Countdown color map
  const countdownColors: Record<number, { text: string; glow: string }> = {
    3: { text: "text-emerald-400", glow: "rgba(52,211,153,0.5)" },
    2: { text: "text-amber-400", glow: "rgba(251,191,36,0.5)" },
    1: { text: "text-rose-500", glow: "rgba(244,63,94,0.6)" },
  };

  // Screen shake amplitude scales with intensity
  const shakeAmplitude = phase === "round-result" ? Math.round(4 * intensity) : 0;

  return (
    <motion.div
      className="flex flex-col w-full text-white select-none overflow-hidden relative"
      /* Cinematic zoom: scale from 1.02 → 1 on mount */
      initial={{ scale: 1.02 }}
      animate={{ scale: 1 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      /* Screen shake on round result — amplitude scales with intensity */
      {...(phase === "round-result" ? {
        animate: { x: [0, -shakeAmplitude, shakeAmplitude * 1.5, -shakeAmplitude * 0.75, shakeAmplitude * 0.5, 0], scale: 1 },
        transition: { duration: 0.4 },
      } : {})}
    >
      {/* ── SVG Noise Texture Overlay ── */}
      <NoiseOverlay />

      {/* ── Ambient floating orbs (with dynamic color temperature) ── */}
      <FloatingOrbs
        color1={theme.hex}
        color2={theme.hexAlt}
        intensity={intensity}
        warmTint={winnerTint.warm}
        coolTint={winnerTint.cool}
      />

      {/* ── Ambient dust motes/embers ── */}
      <AmbientParticles
        intensity={intensity}
        color={winnerTint.warm > 0 ? "rgba(251,191,36,0.6)" : winnerTint.cool > 0 ? "rgba(139,92,246,0.5)" : "rgba(148,163,184,0.3)"}
      />

      {/* ── Radial wipe transition ── */}
      <AnimatePresence>
        {showWipe && <RadialWipe color={theme.hex} />}
      </AnimatePresence>

      {/* ── VS HEADER (always visible except countdown) ── */}
      <AnimatePresence>
        {phase !== "countdown" && (
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative z-10 flex items-center justify-between px-4 py-3"
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "linear-gradient(180deg, rgba(15,23,42,0.5) 0%, transparent 100%)",
              filter: isFocusMoment ? "blur(2px)" : "none",
              transition: "filter 0.3s",
            }}
          >
            {/* Player */}
            <div className="flex items-center gap-2.5">
              <div className="relative">
                {/* Leading crown */}
                {playerScore > opponentScore && <LeadingCrown />}
                {/* Orbiting glow ring for leading player */}
                {playerScore > opponentScore && (
                  <motion.div
                    className="absolute -inset-1 rounded-full"
                    style={{ border: `2px solid ${theme.hex}`, opacity: 0.4 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                )}
                <div
                  className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center overflow-hidden backdrop-blur-sm"
                  style={{
                    boxShadow: playerScore > opponentScore ? `0 0 14px ${theme.glow}` : "none",
                  }}
                >
                  <User className="w-5 h-5 text-slate-400" />
                </div>
              </div>
              <div
                className="rounded-lg px-2.5 py-1.5 backdrop-blur-md"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${playerScore > opponentScore ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.06)'}`,
                  boxShadow: playerScore > opponentScore ? '0 0 12px rgba(52,211,153,0.08)' : 'none',
                }}
              >
                <p className="text-[10px] font-black text-slate-400 uppercase" style={{ letterSpacing: "0.25em", fontSize: "7px" }}>You</p>
                <div className="text-base font-black" style={{ fontVariantNumeric: "tabular-nums" }}>
                  <ScoreWithRipple
                    value={playerScore}
                    color={playerScore > opponentScore ? "#34d399" : "#cbd5e1"}
                    rippleColor="#34d399"
                  />
                </div>
              </div>
            </div>

            {/* Round tracker with connecting gradient line */}
            <div className="flex items-center gap-2 relative">
              {/* Connecting line behind dots */}
              <div className="absolute top-[22px] left-3 right-3 h-px" style={{ background: `linear-gradient(90deg, ${theme.hex}33, ${theme.hexAlt}33)` }} />
              {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
                const round = roundsHistory[i];
                let bgColor = "rgba(30,41,59,0.8)";
                let borderColor = "rgba(51,65,85,0.5)";
                let label = "";
                let textColor = "rgba(148,163,184,0.5)";

                if (round) {
                  if (round.winner === "player") {
                    bgColor = "rgba(16,185,129,0.15)";
                    borderColor = "rgba(16,185,129,0.6)";
                    textColor = "#34d399";
                    label = "W";
                  } else if (round.winner === "foul") {
                    bgColor = "rgba(239,68,68,0.15)";
                    borderColor = "rgba(239,68,68,0.6)";
                    textColor = "#f87171";
                    label = "F";
                  } else {
                    bgColor = "rgba(244,63,94,0.15)";
                    borderColor = "rgba(244,63,94,0.6)";
                    textColor = "#fb7185";
                    label = "L";
                  }
                } else if (i === currentRound - 1) {
                  bgColor = theme.glowSoft;
                  borderColor = theme.hex;
                  textColor = theme.hex;
                  label = "•";
                }

                return (
                  <motion.div
                    key={i}
                    initial={i === currentRound - 1 ? { scale: 0.8 } : {}}
                    animate={i === currentRound - 1 ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                    transition={i === currentRound - 1 ? { duration: 1.5, repeat: Infinity } : {}}
                    className="flex flex-col items-center gap-0.5 relative z-10"
                  >
                    <span className="text-[7px] text-slate-500 font-black uppercase" style={{ letterSpacing: "0.25em" }}>R{i + 1}</span>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black"
                      style={{
                        background: bgColor,
                        border: `1.5px solid ${borderColor}`,
                        color: textColor,
                        boxShadow: i === currentRound - 1 ? `0 0 8px ${theme.glow}` : "none",
                      }}
                    >
                      {label}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Opponent */}
            <div className="flex items-center gap-2.5">
              <div
                className="text-right rounded-lg px-2.5 py-1.5 backdrop-blur-md"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${opponentScore > playerScore ? 'rgba(251,113,133,0.15)' : 'rgba(255,255,255,0.06)'}`,
                  boxShadow: opponentScore > playerScore ? '0 0 12px rgba(251,113,133,0.08)' : 'none',
                }}
              >
                <p className="text-[10px] font-black text-slate-400 uppercase" style={{ letterSpacing: "0.25em", fontSize: "7px" }}>{opponentName}</p>
                <div className="text-base font-black" style={{ fontVariantNumeric: "tabular-nums" }}>
                  <ScoreWithRipple
                    value={opponentScore}
                    color={opponentScore > playerScore ? "#fb7185" : "#cbd5e1"}
                    rippleColor="#fb7185"
                  />
                </div>
              </div>
              <div className="relative">
                {/* Leading crown */}
                {opponentScore > playerScore && <LeadingCrown />}
                {opponentScore > playerScore && (
                  <motion.div
                    className="absolute -inset-1 rounded-full"
                    style={{ border: `2px solid ${theme.hex}`, opacity: 0.4 }}
                    animate={{ rotate: -360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                )}
                <div
                  className="w-10 h-10 rounded-full overflow-hidden bg-slate-800/80 border border-slate-700/50 flex items-center justify-center backdrop-blur-sm"
                  style={{
                    borderColor: opponentScore > playerScore ? theme.hex : "rgba(51,65,85,0.5)",
                    boxShadow: opponentScore > playerScore ? `0 0 14px ${theme.glow}` : "none",
                  }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={opponentName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PHASE: COUNTDOWN ── */}
      <AnimatePresence mode="wait">
        {phase === "countdown" && (
          <motion.div
            key="countdown-phase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-16 relative"
          >
            {/* Letterbox bars */}
            <motion.div
              className="absolute top-0 left-0 right-0 bg-black z-20"
              initial={{ height: 40 }}
              animate={{ height: showGo ? 0 : 40 }}
              transition={{ duration: 0.6 }}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-black z-20"
              initial={{ height: 40 }}
              animate={{ height: showGo ? 0 : 40 }}
              transition={{ duration: 0.6 }}
            />

            {/* Background radial glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${theme.glowSoft} 0%, transparent 60%)`,
              }}
            />

            <motion.p
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-[10px] font-black text-slate-500 uppercase mb-4 relative z-10"
              style={{ letterSpacing: "0.3em" }}
            >
              {currentRound === 1 ? "⚡ Duel Starting" : `Round ${currentRound}`}
            </motion.p>

            {/* GO! flash */}
            <AnimatePresence>
              {showGo && (
                <>
                  {/* Full screen flash */}
                  <motion.div
                    className="absolute inset-0 z-30"
                    initial={{ opacity: 0.9 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ background: "white" }}
                  />
                  <motion.div
                    key="go-text"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 2, opacity: [0, 1, 1, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute z-40 text-6xl font-black uppercase"
                    style={{
                      letterSpacing: "0.15em",
                      background: `linear-gradient(135deg, ${theme.hex}, #fbbf24, ${theme.hexAlt})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      textShadow: `0 0 40px ${theme.glow}`,
                      fontWeight: 900,
                    }}
                  >
                    GO!
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <AnimatePresence mode="popLayout">
              {countdown > 0 && (
                <motion.div
                  key={countdown}
                  initial={{ scale: 0, opacity: 0, rotate: -15 }}
                  animate={{ scale: 1.5, opacity: 1, rotate: 0 }}
                  exit={{ scale: 3, opacity: 0 }}
                  transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
                  className="relative z-10"
                >
                  {/* Multiple layered glow rings */}
                  {[0, 1, 2].map((ring) => (
                    <motion.div
                      key={ring}
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: countdownColors[countdown]?.glow || "transparent",
                        transform: `scale(${2.5 + ring * 1.2})`,
                        opacity: 0.3 - ring * 0.08,
                        filter: `blur(${12 + ring * 8}px)`,
                      }}
                    />
                  ))}
                  {/* Radial shockwave */}
                  <ShockwaveRing color={countdownColors[countdown]?.glow || "white"} />
                  {/* Particle burst ring */}
                  <CountdownBurst color={countdownColors[countdown]?.glow || "white"} />
                  <h1
                    className={`text-8xl relative z-10 ${countdownColors[countdown]?.text || "text-white"}`}
                    style={{
                      textShadow: `0 0 40px ${countdownColors[countdown]?.glow || "transparent"}, 0 0 80px ${countdownColors[countdown]?.glow || "transparent"}, 0 0 120px ${countdownColors[countdown]?.glow || "transparent"}`,
                      fontWeight: 900,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {countdown}
                  </h1>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xs font-bold mt-10 uppercase relative z-10"
              style={{
                letterSpacing: "0.15em",
                background: `linear-gradient(135deg, ${theme.hex}, ${theme.hexAlt})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ⚔ vs {opponentName}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PHASE: READY ── */}
      <AnimatePresence mode="wait">
        {phase === "ready" && (
          <motion.div
            key="ready-phase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.2 }}
            onClick={handleBumpTap}
            className="flex flex-col items-center justify-center py-12 cursor-pointer relative"
          >
            {/* Slowly shifting dark tones background */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{
                background: [
                  "radial-gradient(ellipse at 50% 50%, rgba(15,23,60,0.6) 0%, transparent 70%)",
                  "radial-gradient(ellipse at 50% 50%, rgba(45,15,60,0.5) 0%, transparent 70%)",
                  "radial-gradient(ellipse at 50% 50%, rgba(15,40,50,0.5) 0%, transparent 70%)",
                  "radial-gradient(ellipse at 50% 50%, rgba(15,23,60,0.6) 0%, transparent 70%)",
                ],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Creeping ambient glow */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{
                background: [
                  `radial-gradient(circle at 50% 50%, rgba(245,158,11,0.0) 0%, transparent 60%)`,
                  `radial-gradient(circle at 50% 50%, rgba(245,158,11,0.12) 0%, transparent 60%)`,
                  `radial-gradient(circle at 50% 50%, rgba(245,158,11,0.0) 0%, transparent 60%)`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Concentric pulsing border rings */}
            <div className="relative w-24 h-24 flex items-center justify-center mb-6">
              {[0, 1, 2].map((r) => (
                <motion.div
                  key={r}
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: `2px solid rgba(245,158,11,${0.15 - r * 0.04})`,
                  }}
                  animate={{
                    scale: [1, 1.6 + r * 0.3, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: r * 0.4,
                    ease: "easeInOut",
                  }}
                />
              ))}

              {/* Pulsing ring behind timer — always visible, hinting danger */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: "1px solid rgba(245,158,11,0.15)" }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Heartbeat pulse center */}
              <motion.div
                animate={{
                  scale: [1, 1.12, 1, 1.06, 1],
                  boxShadow: [
                    "0 0 0px rgba(245,158,11,0.0)",
                    "0 0 30px rgba(245,158,11,0.4)",
                    "0 0 0px rgba(245,158,11,0.0)",
                    "0 0 15px rgba(245,158,11,0.2)",
                    "0 0 0px rgba(245,158,11,0.0)",
                  ],
                }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                className="w-18 h-18 rounded-full border-2 border-amber-500/30 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center"
                style={{ width: 72, height: 72 }}
              >
                <Timer className="w-8 h-8 text-amber-500" />
              </motion.div>
            </div>

            <motion.h2
              animate={{
                opacity: [0.6, 1, 0.6],
                textShadow: [
                  "0 0 0px rgba(245,158,11,0)",
                  "0 0 20px rgba(245,158,11,0.5)",
                  "0 0 0px rgba(245,158,11,0)",
                ],
              }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="text-2xl font-black uppercase text-amber-500 text-center relative z-10"
              style={{ letterSpacing: "0.15em", fontWeight: 900 }}
            >
              WAIT FOR IT...
            </motion.h2>

            <p
              className="text-[10px] text-slate-500 uppercase tracking-widest mt-4 text-center max-w-[240px] leading-relaxed relative z-10"
              style={{ letterSpacing: "0.25em", fontSize: "7px" }}
            >
              Tap as soon as the screen flashes. Tap early = FOUL!
            </p>

            <motion.p
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-[9px] text-red-500/70 font-bold uppercase tracking-wide mt-3 relative z-10"
            >
              ⚠️ Don't tap yet
            </motion.p>

            {/* ── Tension meter ── */}
            <TensionMeter intensity={intensity} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PHASE: FLASH ── */}
      <AnimatePresence mode="wait">
        {phase === "flash" && (
          <motion.div
            key="flash-phase"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleBumpTap}
            className="relative flex flex-col items-center justify-center py-10 cursor-pointer rounded-2xl mx-3 my-2 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${theme.hex} 0%, ${theme.hexAlt} 100%)`,
              boxShadow: `0 0 60px ${theme.glow}, inset 0 0 60px rgba(255,255,255,0.1)`,
              perspective: "800px",
            }}
          >
            {/* Full-screen white flash that fades */}
            <motion.div
              className="absolute inset-0 z-20"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{ background: "white" }}
            />

            {/* Screen-wide gradient flash overlay */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.6) 0%, transparent 70%)",
              }}
            />

            {/* 6+ Concentric expanding rings */}
            {[0, 1, 2, 3, 4, 5].map((r) => (
              <motion.div
                key={r}
                className="absolute rounded-full border-2 border-white/30"
                style={{
                  width: 60,
                  height: 60,
                  left: "50%",
                  top: "50%",
                  marginLeft: -30,
                  marginTop: -30,
                }}
                initial={{ scale: 0.5, opacity: 0.8 }}
                animate={{ scale: 4 + r * 1.2, opacity: 0 }}
                transition={{
                  duration: 0.8,
                  delay: r * 0.12,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            ))}

            {/* Pulsing rings — faster & brighter */}
            <div className="relative w-28 h-28 flex items-center justify-center mb-4 z-10">
              {[1, 2, 3].map((r) => (
                <motion.div
                  key={r}
                  initial={{ scale: 0.8, opacity: 0.9 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: r * 0.2 }}
                  className="absolute inset-0 rounded-full border-[3px] border-white/60"
                />
              ))}
              <motion.div
                animate={{
                  scale: [1, 1.08, 1],
                  boxShadow: [
                    "0 0 20px rgba(255,255,255,0.3)",
                    "0 0 40px rgba(255,255,255,0.6)",
                    "0 0 20px rgba(255,255,255,0.3)",
                  ],
                }}
                transition={{ duration: 0.4, repeat: Infinity }}
                className="w-20 h-20 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-2xl relative z-10"
                whileTap={{ scale: 0.93 }}
              >
                <Swords className="w-10 h-10" />
              </motion.div>
            </div>

            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-4xl uppercase tracking-wider text-white drop-shadow-lg z-10"
              style={{
                textShadow: "0 0 30px rgba(255,255,255,0.5), 0 2px 10px rgba(0,0,0,0.3)",
                fontWeight: 900,
                letterSpacing: "0.15em",
              }}
            >
              BUMP NOW!
            </motion.h1>

            <motion.span
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              whileTap={{ scale: 0.93 }}
              className="mt-3 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white font-black text-[10px] uppercase tracking-widest border border-white/30 z-10"
            >
              TAP SCREEN
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PHASE: ROUND RESULT ── */}
      <AnimatePresence mode="wait">
        {phase === "round-result" && (
          <motion.div
            key="round-result-phase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center px-4 py-6 relative"
            style={{
              background: "radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.02) 0%, transparent 60%)",
            }}
          >
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="w-full max-w-sm"
              style={{ perspective: "800px" }}
            >
              {/* 3D entrance card */}
              <motion.div
                initial={{ rotateX: 6, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {/* Result icon with glow */}
                <motion.div
                  className="flex justify-center mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                >
                  {roundWinner === "player" ? (
                    <div
                      className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 relative"
                      style={{ boxShadow: "0 0 30px rgba(16,185,129,0.3)" }}
                    >
                      <Trophy className="w-8 h-8" />
                      {/* Mini sparkles */}
                      {[0, 1, 2, 3].map((s) => (
                        <motion.div
                          key={s}
                          className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400"
                          animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                            x: Math.cos((s / 4) * Math.PI * 2) * 30,
                            y: Math.sin((s / 4) * Math.PI * 2) * 30,
                          }}
                          transition={{ duration: 1.2, delay: s * 0.2, repeat: Infinity }}
                        />
                      ))}
                    </div>
                  ) : roundWinner === "foul" ? (
                    <motion.div
                      animate={{
                        x: [0, -5, 5, -5, 5, 0],
                        boxShadow: [
                          "0 0 0px rgba(239,68,68,0)",
                          "0 0 25px rgba(239,68,68,0.4)",
                          "0 0 0px rgba(239,68,68,0)",
                        ],
                      }}
                      transition={{ duration: 0.5, repeat: 2 }}
                      className="w-16 h-16 rounded-full bg-red-500/15 border-2 border-red-500/40 flex items-center justify-center text-red-400"
                    >
                      <ShieldAlert className="w-8 h-8" />
                    </motion.div>
                  ) : (
                    <div
                      className="w-16 h-16 rounded-full bg-rose-500/15 border-2 border-rose-500/40 flex items-center justify-center text-rose-400"
                      style={{ boxShadow: "0 0 20px rgba(244,63,94,0.2)" }}
                    >
                      <Zap className="w-8 h-8" />
                    </div>
                  )}
                </motion.div>

                {/* Title with gradient */}
                <motion.h3
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl uppercase text-center mb-1"
                  style={{
                    fontWeight: 900,
                    letterSpacing: "0.15em",
                    ...(roundWinner === "player"
                      ? {
                          background: "linear-gradient(135deg, #34d399, #10b981)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }
                      : roundWinner === "foul"
                      ? {
                          background: "linear-gradient(135deg, #f87171, #ef4444)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }
                      : {
                          background: "linear-gradient(135deg, #fb7185, #f43f5e)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }),
                  }}
                >
                  {roundWinner === "player" ? "Round Won!" : roundWinner === "foul" ? "FOUL!" : "Round Lost!"}
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-slate-400 uppercase text-center mb-2"
                  style={{ letterSpacing: "0.25em", fontSize: "7px", fontWeight: 700 }}
                >
                  {roundWinner === "player"
                    ? "You reacted faster!"
                    : roundWinner === "foul"
                    ? "You tapped before the trigger!"
                    : `${opponentName} was faster!`}
                </motion.p>

                {/* ── Speed Rating ── */}
                {roundWinner !== "foul" && reactionTime && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.25, type: "spring", stiffness: 300 }}
                    className="text-center mb-3"
                  >
                    <motion.span
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase"
                      style={{
                        letterSpacing: "0.1em",
                        color: getSpeedRating(reactionTime).color,
                        background: `${getSpeedRating(reactionTime).color}15`,
                        border: `1px solid ${getSpeedRating(reactionTime).color}40`,
                        boxShadow: `0 0 12px ${getSpeedRating(reactionTime).color}20`,
                        textShadow: `0 0 8px ${getSpeedRating(reactionTime).color}40`,
                      }}
                    >
                      {getSpeedRating(reactionTime).label}
                    </motion.span>
                  </motion.div>
                )}

                {/* Speed gauge for player reaction */}
                {roundWinner !== "foul" && reactionTime && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mb-3"
                  >
                    <SpeedGauge time={reactionTime} />
                  </motion.div>
                )}

                {/* ── Instant Replay comparison bars ── */}
                <InstantReplay
                  playerTime={reactionTime}
                  opponentTime={opponentTime}
                  opponentName={opponentName}
                />

                {/* Reaction times — glassmorphic cards with staggered entrance */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    {
                      label: "Your Speed",
                      value: roundWinner === "foul" ? "FOUL" : reactionTime ? `${reactionTime}ms` : "—",
                      highlight: roundWinner === "player",
                      color: roundWinner === "player" ? "#34d399" : "#cbd5e1",
                      delay: 0.3,
                    },
                    {
                      label: opponentName,
                      value: `${opponentTime}ms`,
                      highlight: roundWinner === "opponent",
                      color: roundWinner === "opponent" ? "#fb7185" : "#cbd5e1",
                      delay: 0.45,
                    },
                  ].map((card, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: card.delay, type: "spring", stiffness: 200 }}
                      className="rounded-xl p-3.5 text-center backdrop-blur-sm"
                      style={{
                        background: "rgba(15,23,42,0.6)",
                        border: `1px solid ${card.highlight ? card.color + "40" : "rgba(51,65,85,0.5)"}`,
                        boxShadow: card.highlight ? `0 0 20px ${card.color}20` : "none",
                        transform: "perspective(800px) rotateX(2deg)",
                      }}
                    >
                      <p className="text-slate-500 uppercase font-bold mb-1.5" style={{ letterSpacing: "0.25em", fontSize: "7px" }}>{card.label}</p>
                      <motion.p
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: card.delay + 0.15, type: "spring" }}
                        className="text-xl font-black"
                        style={{ color: card.color, fontVariantNumeric: "tabular-nums" }}
                      >
                        {card.value}
                      </motion.p>
                    </motion.div>
                  ))}
                </div>

                {/* Button with gradient glow + 3D press + inner highlight + text shadow */}
                <motion.button
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  whileHover={{ scale: 1.02, boxShadow: `0 6px 35px ${theme.glow}` }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextRound}
                  className={`w-full py-3.5 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white text-xs uppercase transition-transform relative overflow-hidden`}
                  style={{
                    boxShadow: `0 4px 25px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                    fontWeight: 900,
                    letterSpacing: "0.15em",
                    transform: "perspective(600px) translateZ(0)",
                    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                  }}
                >
                  {/* Shimmer sweep */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)" }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                  />
                  <span className="relative z-10">
                    {currentRound >= TOTAL_ROUNDS || playerScore >= 2 || opponentScore >= 2
                      ? "See Final Results"
                      : "Next Round →"}
                  </span>
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PHASE: MATCH RESULT ── */}
      <AnimatePresence mode="wait">
        {phase === "match-result" && (
          <motion.div
            key="match-result-phase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center px-4 py-6 relative"
          >
            {/* Win celebration effects */}
            {playerWon && (
              <>
                <SparkleParticles color="#fbbf24" />
                <ConfettiDots />
                <VictoryRays />
                {/* Gold ambient particles for victory */}
                <AmbientParticles intensity={1.5} color="rgba(251,191,36,0.7)" />
              </>
            )}

            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="w-full max-w-sm relative z-10"
            >
              <GlowBorderCard color1={playerWon ? "#fbbf24" : theme.hex} color2={playerWon ? "#f59e0b" : theme.hexAlt}>
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "rgba(15,23,42,0.85)",
                  }}
                >
                  {/* Top gradient bar */}
                  <div
                    className="h-1.5"
                    style={{
                      background: `linear-gradient(90deg, ${theme.hex}, ${theme.hexAlt})`,
                    }}
                  />

                  <div className="p-6 text-center">
                    {/* Winner icon with bounce animation */}
                    <motion.div
                      initial={{ y: -30, scale: 0 }}
                      animate={{ y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                      className="relative w-18 h-18 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{
                        width: 72,
                        height: 72,
                        background: playerWon
                          ? "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.1))"
                          : "rgba(30,41,59,0.8)",
                        border: `2px solid ${playerWon ? "rgba(251,191,36,0.4)" : "rgba(51,65,85,0.5)"}`,
                        boxShadow: playerWon ? "0 0 40px rgba(251,191,36,0.2)" : "none",
                      }}
                    >
                      {playerWon ? (
                        <motion.div
                          animate={{ rotate: [0, -10, 10, -5, 0] }}
                          transition={{ duration: 1, delay: 0.5 }}
                        >
                          <Trophy className="w-9 h-9 text-amber-400" />
                        </motion.div>
                      ) : (
                        <Award className="w-9 h-9 text-slate-400" />
                      )}

                      {playerWon && (
                        <motion.div
                          className="absolute -top-1 -right-1"
                          animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Sparkles className="w-5 h-5 text-amber-300" />
                        </motion.div>
                      )}

                      {/* Winner crown above icon */}
                      {playerWon && (
                        <motion.div
                          className="absolute -top-5"
                          animate={{ y: [0, -2, 0], rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Crown className="w-6 h-6 text-amber-400" style={{ filter: "drop-shadow(0 0 6px rgba(251,191,36,0.6))" }} />
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Title with gradient text + text-shadow glow for winner */}
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-2xl uppercase mb-1"
                      style={{
                        fontWeight: 900,
                        letterSpacing: "0.15em",
                        background: playerWon
                          ? "linear-gradient(135deg, #fbbf24, #f59e0b, #fbbf24)"
                          : "linear-gradient(135deg, #94a3b8, #64748b)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        textShadow: playerWon ? "0 0 30px rgba(251,191,36,0.3)" : "none",
                      }}
                    >
                      {playerWon ? "Match Won!" : "Match Defeated!"}
                    </motion.h2>

                    {/* Score with odometer animation */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.45, type: "spring" }}
                      className="flex items-center justify-center gap-3 text-2xl font-black my-4"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        <ScoreOdometer value={playerScore} color={playerWon ? "#34d399" : "#94a3b8"} />
                      </motion.span>
                      <span className="text-slate-600 text-lg">—</span>
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                      >
                        <ScoreOdometer value={opponentScore} color={!playerWon ? "#fb7185" : "#94a3b8"} />
                      </motion.span>
                    </motion.div>

                    {/* Round breakdown */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="flex items-center justify-center gap-4 mb-5"
                    >
                      {roundsHistory.map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.6 + i * 0.1, type: "spring" }}
                          className="flex flex-col items-center gap-1"
                        >
                          <span className="text-slate-500 uppercase font-black" style={{ letterSpacing: "0.25em", fontSize: "7px" }}>R{i + 1}</span>
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black"
                            style={{
                              background:
                                h.winner === "player"
                                  ? "rgba(16,185,129,0.15)"
                                  : h.winner === "foul"
                                  ? "rgba(239,68,68,0.15)"
                                  : "rgba(244,63,94,0.15)",
                              border: `1.5px solid ${
                                h.winner === "player"
                                  ? "rgba(16,185,129,0.5)"
                                  : h.winner === "foul"
                                  ? "rgba(239,68,68,0.5)"
                                  : "rgba(244,63,94,0.5)"
                              }`,
                              color:
                                h.winner === "player" ? "#34d399" : h.winner === "foul" ? "#f87171" : "#fb7185",
                            }}
                          >
                            {h.winner === "player" ? "W" : h.winner === "foul" ? "F" : "L"}
                          </div>
                          <span className="text-slate-500 font-bold" style={{ fontSize: "7px", fontVariantNumeric: "tabular-nums" }}>
                            {h.playerTime ? `${h.playerTime}ms` : "FOUL"}
                          </span>
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Average reaction — glassmorphic */}
                    {roundsHistory.some((h) => h.playerTime !== null) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="rounded-xl p-3.5 mb-5 backdrop-blur-sm"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <p className="text-slate-500 uppercase font-bold mb-1" style={{ letterSpacing: "0.25em", fontSize: "7px" }}>
                          Your Avg. Reaction
                        </p>
                        <p className="text-xl font-black text-white" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {Math.round(
                            roundsHistory
                              .filter((h) => h.playerTime !== null)
                              .reduce((sum, h) => sum + (h.playerTime || 0), 0) /
                              roundsHistory.filter((h) => h.playerTime !== null).length
                          )}
                          <span className="text-sm text-slate-400 ml-0.5">ms</span>
                        </p>
                      </motion.div>
                    )}

                    {/* Action buttons with glow + 3D press + inner highlight + text shadow */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="space-y-2.5"
                    >
                      <motion.button
                        whileHover={{ scale: 1.02, boxShadow: `0 6px 35px ${theme.glow}` }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePlayAgain}
                        className={`w-full py-3.5 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white text-xs uppercase transition-transform flex items-center justify-center gap-2 relative overflow-hidden`}
                        style={{
                          boxShadow: `0 4px 25px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                          fontWeight: 900,
                          letterSpacing: "0.15em",
                          transform: "perspective(600px) translateZ(0)",
                          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                        }}
                      >
                        {/* Shimmer sweep */}
                        <motion.div
                          className="absolute inset-0 pointer-events-none"
                          style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)" }}
                          animate={{ x: ["-100%", "200%"] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
                        />
                        <RefreshCcw className="w-4 h-4 relative z-10" />
                        <span className="relative z-10">Play Again</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02, background: "rgba(30,41,59,0.8)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onComplete}
                        className="w-full py-3 rounded-xl text-slate-300 text-xs font-bold transition-all backdrop-blur-sm"
                        style={{
                          background: "rgba(30,41,59,0.6)",
                          border: "1px solid rgba(51,65,85,0.4)",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                          textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                        }}
                      >
                        Done
                      </motion.button>
                    </motion.div>
                  </div>
                </div>
              </GlowBorderCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
