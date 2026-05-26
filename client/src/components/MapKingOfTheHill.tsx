import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mountain,
  Crown,
  Trophy,
  RefreshCcw,
  User,
  Zap,
  Timer,
  Sparkles,
  Star,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────
   MapKingOfTheHill — Compact territory-control tap game
   3 zones, 10s each. Tap rapidly to claim the hill.
   No header/back — parent bottom sheet handles that.
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
    playerColor: "#ec4899",
    opponentColor: "#f43f5e",
    glow: "rgba(236,72,153,0.4)",
    glowStrong: "rgba(236,72,153,0.7)",
    color1: "#ec4899",
    color2: "#ef4444",
  },
  friends: {
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    playerColor: "#10b981",
    opponentColor: "#14b8a6",
    glow: "rgba(16,185,129,0.4)",
    glowStrong: "rgba(16,185,129,0.7)",
    color1: "#10b981",
    color2: "#06b6d4",
  },
  business: {
    gradient: "from-blue-500 via-indigo-500 to-purple-500",
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    playerColor: "#3b82f6",
    opponentColor: "#6366f1",
    glow: "rgba(59,130,246,0.4)",
    glowStrong: "rgba(59,130,246,0.7)",
    color1: "#3b82f6",
    color2: "#8b5cf6",
  },
} as const;

const TOTAL_ZONES = 3;
const ZONE_DURATION = 10; // seconds per zone

type Phase = "countdown" | "playing" | "zone-result" | "results";

/* ── SVG Noise Texture ── */
function NoiseTexture() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03] z-50">
      <filter id="noiseK">
        <feTurbulence baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noiseK)" />
    </svg>
  );
}

/* ── Ambient dust motes ── */
function DustMotes({ intensity = 1 }: { intensity?: number }) {
  const count = Math.round(8 + 4 * intensity);
  const motes = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: 60 + Math.random() * 40,
        size: 1 + Math.random() * 1.5,
        duration: 6 + Math.random() * 8,
        delay: Math.random() * 5,
        drift: (Math.random() - 0.5) * 30,
      })),
    [count]
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {motes.map((m) => (
        <motion.div
          key={m.id}
          className="absolute rounded-full"
          style={{
            width: m.size,
            height: m.size,
            left: `${m.x}%`,
            top: `${m.y}%`,
            background: `rgba(255,255,255,${0.15 + intensity * 0.1})`,
          }}
          animate={{
            y: [0, -(80 + intensity * 40)],
            x: [0, m.drift],
            opacity: [0, 0.4 * intensity, 0.3 * intensity, 0],
          }}
          transition={{
            duration: m.duration / (0.8 + intensity * 0.2),
            delay: m.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ── Dynamic color temperature orbs ── */
function DynamicOrbs({ color1, color2, warmTint, coolTint, isLeading, intensity }: {
  color1: string; color2: string; warmTint: string; coolTint: string; isLeading: boolean; intensity: number;
}) {
  const tint = isLeading ? warmTint : coolTint;
  const speed = 0.8 + intensity * 0.4;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-48 h-48 rounded-full blur-3xl"
        style={{ top: "-20%", left: "-20%", opacity: 0.12 }}
        animate={{
          x: [0, 30 + intensity * 15, 0],
          y: [0, 20, 0],
          background: [tint, color1, tint],
          opacity: [0.08, 0.15 + intensity * 0.05, 0.08],
        }}
        transition={{ duration: 8 / speed, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-36 h-36 rounded-full blur-3xl"
        style={{ bottom: "0%", right: "-15%", opacity: 0.1 }}
        animate={{
          x: [0, -20, 0],
          y: [0, -25, 0],
          background: [color2, tint, color2],
          opacity: [0.06, 0.12 + intensity * 0.04, 0.06],
        }}
        transition={{ duration: 10 / speed, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-28 h-28 rounded-full blur-3xl"
        style={{ top: "50%", left: "60%", opacity: 0.06 }}
        animate={{ x: [0, -15, 15, 0], y: [0, 10, -10, 0] }}
        transition={{ duration: 12 / speed, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ── Confetti / particle burst for wins ── */
function ConfettiBurst({ color1, color2 }: { color1: string; color2: string }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        id: i,
        angle: (i / 24) * 360 + Math.random() * 15,
        distance: 50 + Math.random() * 80,
        size: 3 + Math.random() * 5,
        color: i % 2 === 0 ? color1 : color2,
        delay: Math.random() * 0.4,
        rotation: Math.random() * 360,
      })),
    [color1, color2]
  );
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            width: p.size,
            height: p.size * 1.5,
            background: p.color,
            borderRadius: 2,
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{
            x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
            y: Math.sin((p.angle * Math.PI) / 180) * p.distance + 40,
            opacity: 0,
            rotate: p.rotation,
            scale: 0.3,
          }}
          transition={{ duration: 1.2, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

/* ── Impact crater ring (fades after tap) ── */
function ImpactCrater({ color, id }: { color: string; id: number }) {
  return (
    <motion.div
      key={id}
      className="absolute inset-0 rounded-3xl pointer-events-none"
      initial={{ boxShadow: `inset 0 0 20px 4px ${color}60`, opacity: 0.8 }}
      animate={{ boxShadow: `inset 0 0 0 0 transparent`, opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{ border: `1.5px solid ${color}40` }}
    />
  );
}

/* ── Combo text floating up ── */
function ComboText({ count, color }: { count: number; color: string }) {
  return (
    <motion.div
      initial={{ y: 0, opacity: 1, scale: 0.8 }}
      animate={{ y: -40, opacity: 0, scale: 1.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none z-30"
    >
      <span
        className="text-sm font-black uppercase"
        style={{
          color,
          textShadow: `0 0 12px ${color}, 0 0 24px ${color}60`,
          letterSpacing: "0.1em",
        }}
      >
        COMBO ×{count}!
      </span>
    </motion.div>
  );
}

/* ── Score change ripple ── */
function ScoreRipple({ color, trigger }: { color: string; trigger: number }) {
  return (
    <AnimatePresence>
      {trigger > 0 && (
        <motion.div
          key={trigger}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ border: `2px solid ${color}` }}
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{ scale: 2.5, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )}
    </AnimatePresence>
  );
}

/* ── Multi-ring tap ripple expanding from touch ── */
function TapRippleRings({ color, trigger }: { color: string; trigger: number }) {
  return (
    <AnimatePresence>
      {trigger > 0 && [0, 1, 2].map((ring) => (
        <motion.div
          key={`${trigger}-${ring}`}
          className="absolute inset-0 rounded-3xl pointer-events-none"
          initial={{ boxShadow: `inset 0 0 0 0 ${color}`, opacity: 0.6 - ring * 0.15 }}
          animate={{ boxShadow: `inset 0 0 60px 10px transparent`, opacity: 0, scale: 1 + ring * 0.08 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: ring * 0.08 }}
          style={{ border: `${2 - ring * 0.5}px solid ${color}` }}
        />
      ))}
    </AnimatePresence>
  );
}

/* ── Pulsing glow rings for tap button ── */
function PulseRings({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <motion.div
        className="absolute inset-0 rounded-3xl"
        style={{ border: `2px solid ${color}` }}
        animate={{ scale: [1, 1.15], opacity: [0.4, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.div
        className="absolute inset-0 rounded-3xl"
        style={{ border: `1.5px solid ${color}` }}
        animate={{ scale: [1, 1.25], opacity: [0.3, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
      />
      <motion.div
        className="absolute inset-0 rounded-3xl"
        style={{ border: `1px solid ${color}` }}
        animate={{ scale: [1, 1.35], opacity: [0.2, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
      />
    </div>
  );
}

/* ── Odometer digit ── */
function OdometerDigit({ value }: { value: number }) {
  return (
    <span className="inline-flex overflow-hidden relative" style={{ height: '1.2em', width: '0.65em' }}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ── Animated number counter ── */
function AnimatedCounter({ value, className }: { value: number | string; className?: string }) {
  const numVal = typeof value === "string" ? parseFloat(value) : value;
  const isFloat = typeof value === "string" && value.includes(".");
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const end = numVal;
    const duration = 600;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * end);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [numVal]);

  const displayStr = isFloat ? display.toFixed(1) : String(Math.round(display));
  const digits = displayStr.split('');

  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {digits.map((d, i) =>
        d === '.' ? <span key={`dot-${i}`}>.</span> : <OdometerDigit key={`${i}-${d}`} value={parseInt(d)} />
      )}
    </span>
  );
}

/* ── Victory rays of light ── */
function VictoryRays() {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        width: 250,
        height: 250,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        background: `conic-gradient(from 0deg, transparent 0%, rgba(251,191,36,0.08) 10%, transparent 20%, transparent 25%, rgba(251,191,36,0.06) 35%, transparent 45%, transparent 50%, rgba(251,191,36,0.08) 60%, transparent 70%, transparent 75%, rgba(251,191,36,0.06) 85%, transparent 95%)`,
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    />
  );
}

/* ── Particle trail following tug bar marker ── */
function TugBarParticles({ position, color }: { position: number; color: string }) {
  const particles = useMemo(() =>
    Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      size: 2 + Math.random() * 2,
      yOffset: (Math.random() - 0.5) * 12,
      delay: i * 0.05,
    })),
  []);
  return (
    <>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            background: color,
            top: `calc(50% + ${p.yOffset}px)`,
            boxShadow: `0 0 4px ${color}`,
          }}
          animate={{
            left: `${position}%`,
            opacity: [0.6, 0],
            scale: [1, 0.3],
          }}
          transition={{
            left: { duration: 0.15, ease: "easeOut" },
            opacity: { duration: 0.4, delay: p.delay },
            scale: { duration: 0.4, delay: p.delay },
          }}
        />
      ))}
    </>
  );
}

/* ── Zone name with typewriter effect ── */
function ZoneNameTyper({ name, color }: { name: string; color: string }) {
  const [displayedChars, setDisplayedChars] = useState(0);
  useEffect(() => {
    setDisplayedChars(0);
    const interval = setInterval(() => {
      setDisplayedChars((prev) => {
        if (prev >= name.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [name]);

  return (
    <span style={{ color }}>
      {name.split('').map((ch, i) => (
        <motion.span
          key={`${name}-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: i < displayedChars ? 1 : 0 }}
          transition={{ duration: 0.05 }}
        >
          {ch}
        </motion.span>
      ))}
      {displayedChars < name.length && (
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ color }}
        >
          _
        </motion.span>
      )}
    </span>
  );
}

/* ── Ambient theme-colored particles ── */
function AmbientParticles({ intensity = 1, color }: { intensity: number; color: string }) {
  return <>{Array.from({length: Math.round(8 * intensity)}, (_, i) => (
    <motion.div key={`dust-${i}`} className="absolute w-1 h-1 rounded-full pointer-events-none" style={{ background: color, left: `${10 + Math.random()*80}%`, top: `${10 + Math.random()*80}%`, opacity: 0.2 + Math.random()*0.3 }} animate={{ y: [0, -30 - Math.random()*50], x: [0, (Math.random()-0.5)*20], opacity: [0.3, 0] }} transition={{ duration: 3 + Math.random()*4, repeat: Infinity, delay: Math.random()*3, ease: 'linear' }} />
  ))}</>;
}

/* ── Radial wipe transition between zones ── */
function RadialWipe({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-full pointer-events-none z-50"
      style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }}
      initial={{ scale: 0, opacity: 0.6 }}
      animate={{ scale: 3, opacity: 0 }}
      transition={{ duration: 0.6 }}
    />
  );
}

export default function MapKingOfTheHill({ opponent, category, onComplete, onBack }: MapGameChildProps) {
  const theme = THEMES[category];
  const opponentName = opponent.firstName;

  // ── Game state ──
  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [currentZone, setCurrentZone] = useState(1);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ZONE_DURATION);

  // ── Display values (updated every 100ms from refs) ──
  const [displayPlayerTaps, setDisplayPlayerTaps] = useState(0);
  const [displayOpponentTaps, setDisplayOpponentTaps] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(50); // 0-100, 50 = neutral

  // ── Zone results history ──
  const [zonesHistory, setZonesHistory] = useState<
    { winner: "player" | "opponent" | "tie"; playerTaps: number; opponentTaps: number }[]
  >([]);

  // ── Current zone result (for zone-result phase) ──
  const [zoneWinner, setZoneWinner] = useState<"player" | "opponent" | "tie" | null>(null);

  // ── Tap bounce animation ──
  const [tapBounce, setTapBounce] = useState(0);

  // ── Screen shake ──
  const [shakeScreen, setShakeScreen] = useState(false);

  // ── Show GO! flash ──
  const [showGo, setShowGo] = useState(false);

  // ── Taps per second tracking ──
  const [tapsPerSecond, setTapsPerSecond] = useState(0);
  const tapTimestampsRef = useRef<number[]>([]);

  // ── Zone transition wipe ──
  const [showWipe, setShowWipe] = useState(false);

  // ── Impact craters (up to 3) ──
  const [craters, setCraters] = useState<number[]>([]);

  // ── Combo system ──
  const [comboCount, setComboCount] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [comboKey, setComboKey] = useState(0);
  const lastTapTimeRef = useRef(0);

  // ── Score ripple ──
  const [playerRipple, setPlayerRipple] = useState(0);
  const [opponentRipple, setOpponentRipple] = useState(0);

  // ── Refs for performance (tap counts NOT in state to avoid re-renders) ──
  const playerTapsRef = useRef(0);
  const opponentTapsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const opponentIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const displayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiSpeedRef = useRef(5); // taps per second for this zone
  const phaseRef = useRef(phase);

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ── Progressive intensity ──
  const progressIntensity = Math.min(currentZone / TOTAL_ZONES, 1);
  const isFinalZone = currentZone === TOTAL_ZONES;

  // ── Dynamic color temperature ──
  const isLeading = playerScore > opponentScore;

  // ── Winner tint — HSL-based color temperature for orbs ──
  const winnerTint = useMemo(() => {
    if (playerScore > opponentScore) return { h1: '35', s1: '90%', l1: '55%' }; // warm amber
    if (playerScore < opponentScore) return { h1: '230', s1: '80%', l1: '55%' }; // cool blue
    return { h1: '270', s1: '70%', l1: '50%' }; // neutral purple
  }, [playerScore, opponentScore]);

  // ── Progressive intensity scaling ──
  const intensity = useMemo(() => {
    const roundFactor = currentZone / TOTAL_ZONES;
    const scoreDiff = Math.abs(playerScore - opponentScore);
    const closeness = 1 - Math.min(scoreDiff / 3, 1);
    return 0.7 + roundFactor * 0.5 + closeness * 0.3;
  }, [currentZone, playerScore, opponentScore]);

  // ── Radial wipe state ──
  const [showRadialWipe, setShowRadialWipe] = useState(false);

  // ── Cleanup all intervals ──
  const clearAllIntervals = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (opponentIntervalRef.current) { clearInterval(opponentIntervalRef.current); opponentIntervalRef.current = null; }
    if (displayIntervalRef.current) { clearInterval(displayIntervalRef.current); displayIntervalRef.current = null; }
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
            setShowGo(true);
            setTimeout(() => {
              setShowGo(false);
              startZone();
            }, 500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // ── Start a new zone round ──
  const startZone = useCallback(() => {
    // Reset tap counts
    playerTapsRef.current = 0;
    opponentTapsRef.current = 0;
    setDisplayPlayerTaps(0);
    setDisplayOpponentTaps(0);
    setDisplayProgress(50);
    setTimeLeft(ZONE_DURATION);
    tapTimestampsRef.current = [];
    setTapsPerSecond(0);
    setCraters([]);
    setComboCount(0);
    setShowCombo(false);
    lastTapTimeRef.current = 0;

    // Randomize AI speed for this zone (3-7 taps/sec)
    aiSpeedRef.current = 3 + Math.random() * 4;

    // Zone wipe transition
    setShowWipe(true);
    setTimeout(() => setShowWipe(false), 600);

    // Radial wipe transition
    setShowRadialWipe(true);
    setTimeout(() => setShowRadialWipe(false), 600);

    setPhase("playing");
  }, []);

  // ── Playing phase: timers, AI, display updates ──
  useEffect(() => {
    if (phase !== "playing") return;

    // Countdown timer (1s intervals)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Zone ended
          clearAllIntervals();
          finalizeZone();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Opponent AI interval (every 200ms, add 1-2 taps based on speed)
    opponentIntervalRef.current = setInterval(() => {
      // aiSpeedRef taps/sec → per 200ms = aiSpeed * 0.2
      const tapsThisTick = aiSpeedRef.current * 0.2;
      // Add fractional taps with some randomness
      const actualTaps = Math.random() < (tapsThisTick % 1)
        ? Math.ceil(tapsThisTick)
        : Math.floor(tapsThisTick);
      opponentTapsRef.current += Math.max(1, actualTaps);
    }, 200);

    // Display update interval (every 100ms)
    displayIntervalRef.current = setInterval(() => {
      setDisplayPlayerTaps(playerTapsRef.current);
      setDisplayOpponentTaps(opponentTapsRef.current);

      const total = playerTapsRef.current + opponentTapsRef.current;
      if (total === 0) {
        setDisplayProgress(50);
      } else {
        setDisplayProgress((playerTapsRef.current / total) * 100);
      }

      // Calculate taps per second
      const now = Date.now();
      tapTimestampsRef.current = tapTimestampsRef.current.filter(t => now - t < 1000);
      setTapsPerSecond(tapTimestampsRef.current.length);
    }, 100);

    return () => clearAllIntervals();
  }, [phase, clearAllIntervals]);

  // ── Finalize a zone ──
  const finalizeZone = useCallback(() => {
    const pTaps = playerTapsRef.current;
    const oTaps = opponentTapsRef.current;
    let winner: "player" | "opponent" | "tie";

    if (pTaps > oTaps) {
      winner = "player";
      setPlayerScore((s) => s + 1);
      setPlayerRipple((t) => t + 1);
    } else if (oTaps > pTaps) {
      winner = "opponent";
      setOpponentScore((s) => s + 1);
      setOpponentRipple((t) => t + 1);
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 400);
    } else {
      winner = "tie";
    }

    setZoneWinner(winner);
    setZonesHistory((h) => [...h, { winner, playerTaps: pTaps, opponentTaps: oTaps }]);
    setDisplayPlayerTaps(pTaps);
    setDisplayOpponentTaps(oTaps);

    const total = pTaps + oTaps;
    setDisplayProgress(total === 0 ? 50 : (pTaps / total) * 100);

    setPhase("zone-result");
  }, []);

  // ── Handle tap (player) ──
  const handleTap = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    playerTapsRef.current += 1;
    setTapBounce((b) => b + 1);
    tapTimestampsRef.current.push(Date.now());

    // Impact crater (keep last 3)
    setCraters((prev) => {
      const next = [...prev, Date.now()];
      return next.slice(-3);
    });

    // Combo detection (< 200ms between taps)
    const now = Date.now();
    if (lastTapTimeRef.current > 0 && now - lastTapTimeRef.current < 200) {
      setComboCount((c) => {
        const next = c + 1;
        if (next >= 3) {
          setShowCombo(true);
          setComboKey((k) => k + 1);
          setTimeout(() => setShowCombo(false), 600);
        }
        return next;
      });
    } else {
      setComboCount(1);
    }
    lastTapTimeRef.current = now;
  }, []);

  // ── Next zone or results ──
  const handleNextZone = useCallback(() => {
    if (currentZone >= TOTAL_ZONES) {
      setPhase("results");
    } else {
      setCurrentZone((z) => z + 1);
      setZoneWinner(null);
      setPhase("countdown");
    }
  }, [currentZone]);

  // ── Play again ──
  const handlePlayAgain = useCallback(() => {
    clearAllIntervals();
    setPhase("countdown");
    setCurrentZone(1);
    setPlayerScore(0);
    setOpponentScore(0);
    setZonesHistory([]);
    setZoneWinner(null);
    setTapBounce(0);
    playerTapsRef.current = 0;
    opponentTapsRef.current = 0;
    setDisplayPlayerTaps(0);
    setDisplayOpponentTaps(0);
    setDisplayProgress(50);
    setTimeLeft(ZONE_DURATION);
    tapTimestampsRef.current = [];
    setTapsPerSecond(0);
    setCraters([]);
    setComboCount(0);
    setShowCombo(false);
    lastTapTimeRef.current = 0;
  }, [clearAllIntervals]);

  const playerWon = playerScore > opponentScore;
  const isTie = playerScore === opponentScore;
  const avatarUrl = opponent.profilePhoto || undefined;

  // Compute tap speeds for results
  const totalPlayerTaps = zonesHistory.reduce((sum, z) => sum + z.playerTaps, 0);
  const totalOpponentTaps = zonesHistory.reduce((sum, z) => sum + z.opponentTaps, 0);
  const playerTapsPerSec = zonesHistory.length > 0 ? (totalPlayerTaps / (zonesHistory.length * ZONE_DURATION)).toFixed(1) : "0";
  const opponentTapsPerSec = zonesHistory.length > 0 ? (totalOpponentTaps / (zonesHistory.length * ZONE_DURATION)).toFixed(1) : "0";

  const ZONE_NAMES = ["Summit", "Ridge", "Peak"];

  return (
    <motion.div
      className="relative flex flex-col w-full text-white select-none overflow-hidden"
      animate={shakeScreen ? { x: [0, -4, 6, -3, 2, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* ── SVG noise texture ── */}
      <NoiseTexture />

      {/* ── Dynamic color temperature orbs ── */}
      <DynamicOrbs
        color1={theme.glow}
        color2={theme.glowStrong}
        warmTint="rgba(251,191,36,0.15)"
        coolTint="rgba(59,130,246,0.15)"
        isLeading={isLeading}
        intensity={progressIntensity}
      />

      {/* ── Ambient dust motes ── */}
      <DustMotes intensity={0.6 + progressIntensity * 0.6} />

      {/* ── Ambient theme-colored particles ── */}
      <AmbientParticles intensity={1 + currentZone * 0.15} color={`hsl(${winnerTint.h1}, ${winnerTint.s1}, ${winnerTint.l1})`} />

      {/* ── Radial wipe transition between zones ── */}
      <AnimatePresence>
        {showRadialWipe && <RadialWipe color={theme.color1} />}
      </AnimatePresence>

      {/* ── Final zone urgency border pulse ── */}
      {isFinalZone && phase === "playing" && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-40 rounded-none"
          animate={{
            boxShadow: [
              "inset 0 0 20px 4px rgba(239,68,68,0.15)",
              "inset 0 0 40px 8px rgba(239,68,68,0.25)",
              "inset 0 0 20px 4px rgba(239,68,68,0.15)",
            ],
          }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* ── Zone transition wipe effect ── */}
      <AnimatePresence>
        {showWipe && (
          <motion.div
            className="absolute inset-0 z-40 pointer-events-none"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${theme.color1}30 40%, ${theme.color2}40 60%, transparent 100%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* ── SCOREBOARD (visible during playing & zone-result) ── */}
      {(phase === "playing" || phase === "zone-result") && (
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            borderBottom: "1px solid rgba(30,41,59,0.6)",
            background: "rgba(15,23,42,0.4)",
            backdropFilter: "blur(10px)",
          }}
        >
          {/* Player with crown */}
          <div className="flex items-center gap-2">
            <div className="relative">
              {/* Leading crown */}
              <AnimatePresence>
                {playerScore > opponentScore && (
                  <motion.div
                    initial={{ scale: 0, y: 5 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-3 left-1/2 -translate-x-1/2 z-20"
                  >
                    <motion.div
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Crown className="w-3 h-3" style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.6))' }} />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div
                className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden relative"
                style={{
                  border: `2px solid ${playerScore > opponentScore ? theme.playerColor : "rgba(51,65,85,0.6)"}`,
                  boxShadow: playerScore > opponentScore ? `0 0 12px ${theme.glow}` : "none",
                }}
              >
                <User className="w-5 h-5 text-slate-400" />
                <ScoreRipple color={theme.playerColor} trigger={playerRipple} />
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-slate-200" style={{ letterSpacing: '0.02em' }}>You</p>
              <motion.p
                key={playerScore}
                animate={{ scale: [1.3, 1] }}
                className={`text-sm font-black ${playerScore > opponentScore ? "text-emerald-400" : "text-slate-300"}`}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {playerScore}
              </motion.p>
            </div>
          </div>

          {/* Zone tracker with connecting lines */}
          <div className="flex items-center gap-0">
            {Array.from({ length: TOTAL_ZONES }).map((_, i) => {
              const zone = zonesHistory[i];
              let bgCol = "rgba(30,41,59,0.6)";
              let borderCol = "rgba(51,65,85,0.5)";
              let textCol = "rgba(148,163,184,0.4)";
              let label = "";
              let glowShadow = "none";

              if (zone) {
                if (zone.winner === "player") {
                  bgCol = "rgba(16,185,129,0.15)";
                  borderCol = "rgba(16,185,129,0.6)";
                  textCol = "#34d399";
                  label = "W";
                  glowShadow = "0 0 8px rgba(16,185,129,0.3)";
                } else if (zone.winner === "tie") {
                  bgCol = "rgba(245,158,11,0.15)";
                  borderCol = "rgba(245,158,11,0.6)";
                  textCol = "#fbbf24";
                  label = "T";
                } else {
                  bgCol = "rgba(244,63,94,0.15)";
                  borderCol = "rgba(244,63,94,0.6)";
                  textCol = "#fb7185";
                  label = "L";
                }
              } else if (i === currentZone - 1) {
                bgCol = `${theme.glow.replace("0.4", "0.1")}`;
                borderCol = theme.playerColor;
                textCol = theme.playerColor;
                label = "•";
                glowShadow = `0 0 10px ${theme.glow}`;
              }
              return (
                <div key={i} className="flex items-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <span
                      className="text-[7px] font-black uppercase"
                      style={{
                        letterSpacing: '0.1em',
                        background: i === currentZone - 1 && !zone
                          ? `linear-gradient(90deg, ${theme.color1}, ${theme.color2})`
                          : undefined,
                        WebkitBackgroundClip: i === currentZone - 1 && !zone ? "text" : undefined,
                        WebkitTextFillColor: i === currentZone - 1 && !zone ? "transparent" : undefined,
                        color: i === currentZone - 1 && !zone ? undefined : "rgba(100,116,139,0.8)",
                      }}
                    >
                      Z{i + 1}
                    </span>
                    <motion.div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black"
                      style={{
                        background: bgCol,
                        border: `1.5px solid ${borderCol}`,
                        color: textCol,
                        boxShadow: glowShadow,
                      }}
                      animate={i === currentZone - 1 && !zone ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      {label}
                    </motion.div>
                  </div>
                  {i < TOTAL_ZONES - 1 && (
                    <div
                      className="w-4 h-[1.5px] mx-0.5"
                      style={{
                        background: zone
                          ? `linear-gradient(90deg, ${borderCol}80, ${zonesHistory[i + 1] ? (zonesHistory[i + 1].winner === 'player' ? 'rgba(16,185,129,0.5)' : zonesHistory[i + 1].winner === 'tie' ? 'rgba(245,158,11,0.5)' : 'rgba(244,63,94,0.5)') : 'rgba(51,65,85,0.4)'})`
                          : "rgba(51,65,85,0.4)",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Opponent with crown */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs font-black text-slate-200" style={{ letterSpacing: '0.02em' }}>{opponentName}</p>
              <motion.p
                key={opponentScore}
                animate={{ scale: [1.3, 1] }}
                className={`text-sm font-black ${opponentScore > playerScore ? "text-rose-400" : "text-slate-300"}`}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {opponentScore}
              </motion.p>
            </div>
            <div className="relative">
              <AnimatePresence>
                {opponentScore > playerScore && (
                  <motion.div
                    initial={{ scale: 0, y: 5 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-3 left-1/2 -translate-x-1/2 z-20"
                  >
                    <motion.div
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Crown className="w-3 h-3" style={{ color: '#fb7185', filter: 'drop-shadow(0 0 4px rgba(244,63,94,0.6))' }} />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div
                className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center relative"
                style={{
                  border: `2px solid ${opponentScore > playerScore ? theme.opponentColor : "rgba(51,65,85,0.6)"}`,
                  boxShadow: opponentScore > playerScore ? `0 0 12px rgba(244,63,94,0.4)` : "none",
                }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={opponentName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-slate-400" />
                )}
                <ScoreRipple color={theme.opponentColor} trigger={opponentRipple} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PHASE: COUNTDOWN ── */}
      <AnimatePresence mode="wait">
        {phase === "countdown" && (
          <motion.div
            key="countdown-phase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative flex flex-col items-center justify-center py-16"
          >
            {/* Cinematic letterbox bars */}
            <motion.div
              className="absolute top-0 left-0 right-0 bg-black z-30"
              initial={{ height: 36 }}
              animate={{ height: countdown === 0 ? 0 : 36 }}
              transition={{ duration: 0.5 }}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-black z-30"
              initial={{ height: 36 }}
              animate={{ height: countdown === 0 ? 0 : 36 }}
              transition={{ duration: 0.5 }}
            />

            {/* Subtle zoom-out */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ scale: 1.03 }}
              animate={{ scale: 1 }}
              transition={{ duration: 3, ease: "easeOut" }}
              style={{
                background: `radial-gradient(circle at 50% 50%, ${theme.glow.replace('0.4', '0.08')} 0%, transparent 60%)`,
              }}
            />

            <motion.p
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-[10px] font-black uppercase mb-1 z-20"
              style={{
                letterSpacing: '0.3em',
                background: `linear-gradient(90deg, ${theme.color1}, ${theme.color2})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {currentZone === 1 ? "King of the Hill" : (
                <span className="flex items-center gap-1">
                  Zone {currentZone} —{" "}
                  <ZoneNameTyper name={ZONE_NAMES[currentZone - 1] || "Hill"} color={theme.color1} />
                </span>
              )}
            </motion.p>

            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring" }}
              className="z-20"
            >
              <Mountain
                className="w-7 h-7 mb-3"
                style={{
                  color: theme.playerColor,
                  filter: `drop-shadow(0 0 8px ${theme.glow})`,
                }}
              />
            </motion.div>

            <AnimatePresence mode="popLayout">
              {showGo ? (
                <motion.div
                  key="go"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 2, opacity: 1 }}
                  exit={{ scale: 4, opacity: 0, filter: "blur(12px)" }}
                  transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                  className="relative z-20"
                >
                  <span
                    className="text-7xl font-black"
                    style={{
                      background: `linear-gradient(135deg, ${theme.color1}, ${theme.color2})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      filter: `drop-shadow(0 0 40px ${theme.glowStrong})`,
                    }}
                  >
                    GO!
                  </span>
                </motion.div>
              ) : countdown > 0 ? (
                <motion.div
                  key={countdown}
                  initial={{ scale: 0, opacity: 0, rotate: -15 }}
                  animate={{ scale: 1.5, opacity: 1, rotate: 0 }}
                  exit={{ scale: 3, opacity: 0, filter: "blur(10px)" }}
                  transition={{ duration: 0.6, type: "spring", stiffness: 150 }}
                  className="relative z-20"
                >
                  <span
                    className="text-8xl font-black"
                    style={{
                      color:
                        countdown === 1 ? "#f43f5e" : countdown === 2 ? "#f59e0b" : "#10b981",
                      filter: `drop-shadow(0 0 30px ${
                        countdown === 1
                          ? "rgba(244,63,94,0.6)"
                          : countdown === 2
                          ? "rgba(245,158,11,0.6)"
                          : "rgba(16,185,129,0.6)"
                      })`,
                    }}
                  >
                    {countdown}
                  </span>
                  {/* Layered glow rings */}
                  {[0, 1, 2].map((ring) => (
                    <motion.div
                      key={ring}
                      className="absolute rounded-full"
                      style={{
                        width: 80 + ring * 30,
                        height: 80 + ring * 30,
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        border: `${2 - ring * 0.5}px solid ${
                          countdown === 1 ? '#f43f5e' : countdown === 2 ? '#f59e0b' : '#10b981'
                        }`,
                        opacity: 0.3 - ring * 0.1,
                      }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3 - ring * 0.1, 0, 0.3 - ring * 0.1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: ring * 0.15 }}
                    />
                  ))}
                  {/* Radial shockwave */}
                  <motion.div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: 60,
                      height: 60,
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      border: `2px solid ${countdown === 1 ? '#f43f5e' : countdown === 2 ? '#f59e0b' : '#10b981'}`,
                    }}
                    initial={{ scale: 0.5, opacity: 0.8 }}
                    animate={{ scale: 4, opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                  <motion.div
                    className="absolute rounded-full"
                    style={{
                      width: 80,
                      height: 80,
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      boxShadow: `0 0 60px 20px ${
                        countdown === 1
                          ? "rgba(244,63,94,0.3)"
                          : countdown === 2
                          ? "rgba(245,158,11,0.3)"
                          : "rgba(16,185,129,0.3)"
                      }`,
                    }}
                    animate={{ opacity: [0.5, 0.2, 0.5], scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>

            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xs text-slate-400 font-bold mt-10 uppercase z-20"
              style={{ letterSpacing: '0.15em' }}
            >
              vs {opponentName}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PHASE: PLAYING ── */}
      {phase === "playing" && (
        <div className="relative flex flex-col items-center px-4 py-4 flex-1">

          {/* Timer pill with glow */}
          <motion.div
            className="px-5 py-2 rounded-full mb-4"
            style={{
              background: timeLeft <= 3 ? "rgba(239,68,68,0.12)" : "rgba(30,41,59,0.6)",
              border: `1px solid ${timeLeft <= 3 ? "rgba(239,68,68,0.4)" : "rgba(51,65,85,0.4)"}`,
              boxShadow: timeLeft <= 3 ? "0 0 15px rgba(239,68,68,0.2)" : "none",
              backdropFilter: "blur(10px)",
            }}
            animate={timeLeft <= 3 ? { scale: [1, 1.03, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <div className="flex items-center gap-2">
              <motion.div
                animate={timeLeft <= 3 ? { rotate: [0, 15, -15, 0] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Timer className={`w-3.5 h-3.5 ${timeLeft <= 3 ? "text-red-400" : "text-slate-400"}`} />
              </motion.div>
              <span className={`text-lg font-black ${timeLeft <= 3 ? "text-red-400" : "text-white"}`}
                style={{ fontVariantNumeric: 'tabular-nums' }}>
                {timeLeft}s
              </span>
              {/* Final zone label */}
              {isFinalZone && (
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-[8px] font-black uppercase text-red-400 ml-1"
                  style={{ letterSpacing: "0.1em" }}
                >
                  FINAL
                </motion.span>
              )}
            </div>
          </motion.div>

          {/* Zone hill indicator with glow */}
          <div className="relative w-32 h-32 mb-4">
            {/* Radial glow behind */}
            <div
              className="absolute inset-0 rounded-full blur-2xl"
              style={{
                background: displayProgress > 50 ? theme.glow : `rgba(244,63,94,0.3)`,
                opacity: 0.3,
              }}
            />
            {/* Background ring */}
            <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(30,41,59,0.6)" strokeWidth="8" />
              {/* Player arc */}
              <motion.circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke={theme.playerColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(displayProgress / 100) * 264} 264`}
                initial={{ strokeDasharray: "132 264" }}
                animate={{ strokeDasharray: `${(displayProgress / 100) * 264} 264` }}
                transition={{ duration: 0.1 }}
                style={{ filter: `drop-shadow(0 0 4px ${theme.playerColor})` }}
              />
              {/* Opponent arc */}
              <motion.circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke={theme.opponentColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${((100 - displayProgress) / 100) * 264} 264`}
                strokeDashoffset={`-${(displayProgress / 100) * 264}`}
                initial={{ strokeDasharray: "132 264" }}
                animate={{
                  strokeDasharray: `${((100 - displayProgress) / 100) * 264} 264`,
                  strokeDashoffset: `-${(displayProgress / 100) * 264}`,
                }}
                transition={{ duration: 0.1 }}
                style={{ filter: `drop-shadow(0 0 4px ${theme.opponentColor})` }}
              />
            </svg>
            {/* Crown floating above winning side */}
            <AnimatePresence>
              {displayProgress > 60 && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.5 }}
                  animate={{ opacity: 1, y: -6, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-30"
                >
                  <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}>
                    <Crown className="w-5 h-5" style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.6))' }} />
                  </motion.div>
                </motion.div>
              )}
              {displayProgress < 40 && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.5 }}
                  animate={{ opacity: 1, y: -6, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-30"
                >
                  <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}>
                    <Crown className="w-5 h-5" style={{ color: '#fb7185', filter: 'drop-shadow(0 0 6px rgba(244,63,94,0.6))' }} />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(15,23,42,0.9)",
                  border: `2px solid ${displayProgress > 55 ? theme.playerColor : displayProgress < 45 ? theme.opponentColor : "rgba(51,65,85,0.6)"}`,
                  boxShadow: displayProgress > 55
                    ? `0 0 15px ${theme.glow}`
                    : displayProgress < 45
                    ? `0 0 15px rgba(244,63,94,0.3)`
                    : "none",
                  transition: "border-color 0.3s, box-shadow 0.3s",
                }}
              >
                <Mountain
                  className="w-7 h-7"
                  style={{
                    color: displayProgress > 55 ? theme.playerColor : displayProgress < 45 ? theme.opponentColor : "rgba(148,163,184,0.6)",
                    transition: "color 0.3s",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Tug-of-war bar with particle trail */}
          <div className="w-full max-w-xs mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-[8px] font-black uppercase"
                style={{
                  letterSpacing: '0.25em',
                  background: `linear-gradient(90deg, ${theme.color1}, ${theme.color2})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                You
              </span>
              <span className="text-[8px] font-black uppercase text-slate-500" style={{ letterSpacing: '0.25em' }}>
                {opponentName}
              </span>
            </div>
            <div
              className="h-5 rounded-full overflow-hidden relative"
              style={{
                background: "rgba(30,41,59,0.6)",
                border: "1px solid rgba(51,65,85,0.4)",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              {/* Player bar with liquid gradient */}
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${theme.playerColor}dd, ${theme.playerColor})`,
                  boxShadow: `0 0 12px ${theme.glow}`,
                }}
                animate={{ width: `${displayProgress}%` }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              />
              {/* Opponent bar */}
              <motion.div
                className="absolute inset-y-0 right-0 rounded-full"
                style={{
                  background: `linear-gradient(270deg, ${theme.opponentColor}dd, ${theme.opponentColor})`,
                  boxShadow: `0 0 12px rgba(244,63,94,0.3)`,
                }}
                animate={{ width: `${100 - displayProgress}%` }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              />
              {/* Particle trail following position marker */}
              <TugBarParticles position={displayProgress} color={theme.playerColor} />
              {/* Center marker */}
              <div className="absolute inset-y-0 left-1/2 -translate-x-px w-0.5 bg-white/40 z-10" />
              {/* Shimmer on player side */}
              <motion.div
                className="absolute inset-y-0 left-0"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                  width: "30%",
                }}
                animate={{ x: ["-100%", "400%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </div>

          {/* Tap counters with glassmorphic cards + TPS display */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              className="rounded-xl px-4 py-2.5 text-center min-w-[90px]"
              style={{
                background: "rgba(15,23,42,0.6)",
                border: `1px solid ${displayProgress > 55 ? `${theme.playerColor}40` : "rgba(51,65,85,0.4)"}`,
                backdropFilter: "blur(10px)",
                boxShadow: displayProgress > 55 ? `0 0 15px ${theme.glow.replace("0.4", "0.15")}` : "none",
                transition: "border-color 0.3s, box-shadow 0.3s",
              }}
            >
              <p className="text-[7px] text-slate-500 uppercase font-bold mb-0.5" style={{ letterSpacing: '0.2em' }}>Your taps</p>
              <p className={`text-xl font-black ${theme.text}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {displayPlayerTaps}
              </p>
              {/* Taps per second */}
              <p className="text-[8px] font-bold mt-0.5" style={{
                background: `linear-gradient(90deg, ${theme.color1}, ${theme.color2})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {tapsPerSecond} /sec
              </p>
            </motion.div>
            <div
              className="text-[10px] font-black uppercase"
              style={{
                background: `linear-gradient(135deg, ${theme.color1}, ${theme.color2})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              vs
            </div>
            <motion.div
              className="rounded-xl px-4 py-2.5 text-center min-w-[90px]"
              style={{
                background: "rgba(15,23,42,0.6)",
                border: `1px solid ${displayProgress < 45 ? "rgba(244,63,94,0.3)" : "rgba(51,65,85,0.4)"}`,
                backdropFilter: "blur(10px)",
                boxShadow: displayProgress < 45 ? "0 0 15px rgba(244,63,94,0.15)" : "none",
                transition: "border-color 0.3s, box-shadow 0.3s",
              }}
            >
              <p className="text-[7px] text-slate-500 uppercase font-bold mb-0.5" style={{ letterSpacing: '0.2em' }}>{opponentName}</p>
              <p className="text-xl font-black text-slate-300" style={{ fontVariantNumeric: 'tabular-nums' }}>{displayOpponentTaps}</p>
              <p className="text-[8px] text-slate-500 font-bold mt-0.5">—</p>
            </motion.div>
          </div>

          {/* TAP BUTTON with impact craters, combo, multi-ring ripple + pulse rings */}
          <div className="relative w-full max-w-xs">
            <PulseRings color={theme.glow} />
            <TapRippleRings color={theme.glow} trigger={tapBounce} />
            {/* Impact craters (last 3 taps) */}
            {craters.map((id) => (
              <ImpactCrater key={id} color={theme.playerColor} id={id} />
            ))}
            {/* Combo text */}
            <AnimatePresence>
              {showCombo && comboCount >= 3 && (
                <ComboText key={comboKey} count={comboCount} color={theme.color1} />
              )}
            </AnimatePresence>
            <motion.button
              key={tapBounce}
              onClick={handleTap}
              animate={{ scale: [1, 0.92, 1] }}
              transition={{ duration: 0.1 }}
              className="relative w-full py-6 rounded-3xl text-white font-black text-sm uppercase flex items-center justify-center gap-2.5 overflow-hidden"
              style={{
                letterSpacing: '0.2em',
                background: `linear-gradient(135deg, ${theme.color1}, ${theme.color2})`,
                boxShadow: `0 8px 30px ${theme.glow}, 0 0 40px ${theme.glow.replace("0.4", "0.15")}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                textShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            >
              {/* Button shimmer */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
                  width: "40%",
                }}
                animate={{ x: ["-100%", "350%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              />
              <Zap className="w-5 h-5 relative z-10" style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.5))" }} />
              <span className="relative z-10">TAP TO CLAIM!</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* ── PHASE: ZONE RESULT ── */}
      {phase === "zone-result" && (
        <div className="relative flex flex-col items-center px-4 py-6">
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="w-full max-w-sm"
          >
            {/* Result icon with glow */}
            <div className="relative flex justify-center mb-4">
              {zoneWinner === "player" && <ConfettiBurst color1={theme.color1} color2={theme.color2} />}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 250, delay: 0.1 }}
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: zoneWinner === "player"
                    ? "rgba(16,185,129,0.15)"
                    : zoneWinner === "tie"
                    ? "rgba(245,158,11,0.15)"
                    : "rgba(244,63,94,0.15)",
                  border: `2px solid ${
                    zoneWinner === "player"
                      ? "rgba(16,185,129,0.5)"
                      : zoneWinner === "tie"
                      ? "rgba(245,158,11,0.5)"
                      : "rgba(244,63,94,0.5)"
                  }`,
                  boxShadow: `0 0 25px ${
                    zoneWinner === "player"
                      ? "rgba(16,185,129,0.3)"
                      : zoneWinner === "tie"
                      ? "rgba(245,158,11,0.3)"
                      : "rgba(244,63,94,0.3)"
                  }`,
                  color: zoneWinner === "player"
                    ? "#34d399"
                    : zoneWinner === "tie"
                    ? "#fbbf24"
                    : "#fb7185",
                }}
              >
                {zoneWinner === "player" ? (
                  <Trophy className="w-7 h-7" />
                ) : zoneWinner === "tie" ? (
                  <Mountain className="w-7 h-7" />
                ) : (
                  <Zap className="w-7 h-7" />
                )}
              </motion.div>
            </div>

            <motion.h3
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg font-black uppercase text-center mb-1"
              style={{
                letterSpacing: '0.15em',
                background: zoneWinner === "player"
                  ? "linear-gradient(90deg, #34d399, #2dd4bf)"
                  : zoneWinner === "tie"
                  ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
                  : "linear-gradient(90deg, #fb7185, #f43f5e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {zoneWinner === "player" ? "Hill Claimed!" : zoneWinner === "tie" ? "Contested!" : "Hill Lost!"}
            </motion.h3>
            <p className="text-[10px] text-slate-400 uppercase text-center mb-5 font-bold" style={{ letterSpacing: '0.15em' }}>
              {zoneWinner === "player"
                ? "You dominated this zone!"
                : zoneWinner === "tie"
                ? "Even battle — no points awarded"
                : `${opponentName} held the hill!`}
            </p>

            {/* Tap comparison cards */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: "Your Taps", value: displayPlayerTaps, isWinner: zoneWinner === "player", color: "#34d399", speed: (displayPlayerTaps / ZONE_DURATION).toFixed(1) },
                { label: opponentName, value: displayOpponentTaps, isWinner: zoneWinner === "opponent", color: "#fb7185", speed: (displayOpponentTaps / ZONE_DURATION).toFixed(1) },
              ].map((card, idx) => (
                <motion.div
                  key={idx}
                  initial={{ y: 20, opacity: 0, rotateX: 2 }}
                  animate={{ y: 0, opacity: 1, rotateX: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1, type: "spring" }}
                  className="rounded-xl p-3 text-center"
                  style={{
                    background: "rgba(15,23,42,0.6)",
                    border: `1px solid ${card.isWinner ? `${card.color}40` : "rgba(51,65,85,0.4)"}`,
                    backdropFilter: "blur(10px)",
                    boxShadow: card.isWinner ? `0 0 15px ${card.color}20` : "none",
                    perspective: '800px',
                  }}
                >
                  <p className="text-[8px] text-slate-500 uppercase font-bold mb-1" style={{ letterSpacing: '0.2em' }}>{card.label}</p>
                  <p className={`text-2xl font-black ${card.isWinner ? "" : "text-slate-300"}`} style={{ ...(card.isWinner ? { color: card.color } : {}), fontVariantNumeric: 'tabular-nums' }}>
                    <AnimatedCounter value={card.value} />
                  </p>
                  <p className="text-[7px] text-slate-500 font-bold mt-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {card.speed}/sec
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.button
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={handleNextZone}
              whileTap={{ scale: 0.95, background: `linear-gradient(135deg, ${theme.color2}, ${theme.color1})` }}
              className="relative w-full py-3.5 rounded-2xl text-white font-black text-xs uppercase overflow-hidden"
              style={{
                letterSpacing: '0.15em',
                background: `linear-gradient(135deg, ${theme.color1}, ${theme.color2})`,
                boxShadow: `0 4px 20px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
              }}
            >
              <motion.div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
                  width: "40%",
                }}
                animate={{ x: ["-100%", "350%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <span className="relative z-10">
                {currentZone >= TOTAL_ZONES ? "See Final Results" : "Next Zone"}
              </span>
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* ── PHASE: RESULTS ── */}
      {phase === "results" && (
        <div className="relative flex flex-col items-center px-4 py-5">
          {/* Confetti for winner */}
          {playerWon && <ConfettiBurst color1={theme.color1} color2="#fbbf24" />}

          {/* Victory rays */}
          {playerWon && <VictoryRays />}

          <motion.div
            initial={{ scale: 0, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 15 }}
            className="w-full max-w-sm"
          >
            {/* Animated conic gradient border */}
            <div className="relative rounded-2xl overflow-visible">
              <motion.div
                className="absolute -inset-[1px] rounded-2xl pointer-events-none z-0"
                style={{
                  background: playerWon
                    ? `conic-gradient(from 0deg, rgba(251,191,36,0.3), transparent, rgba(245,158,11,0.3), transparent, rgba(251,191,36,0.3))`
                    : `conic-gradient(from 0deg, ${theme.color1}30, transparent, ${theme.color2}30, transparent, ${theme.color1}30)`,
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              />
              <div
                className="relative rounded-2xl overflow-hidden z-10"
                style={{
                  background: "rgba(15,23,42,0.85)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: `0 25px 60px rgba(0,0,0,0.5), 0 0 40px ${
                    playerWon ? "rgba(251,191,36,0.1)" : theme.glow.replace("0.4", "0.1")
                  }`,
                }}
              >
                {/* Top accent */}
                <div
                  className="h-1.5"
                  style={{
                    background: playerWon
                      ? "linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)"
                      : `linear-gradient(90deg, ${theme.color1}, ${theme.color2})`,
                    boxShadow: playerWon
                      ? "0 2px 15px rgba(245,158,11,0.5)"
                      : `0 2px 15px ${theme.glow}`,
                  }}
                />
                <div className="p-5 text-center">
                  {/* Winner icon with glow */}
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="relative w-18 h-18 mx-auto mb-4"
                  >
                    <div
                      className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                      style={{
                        background: playerWon
                          ? "rgba(245,158,11,0.1)"
                          : isTie
                          ? "rgba(30,41,59,0.6)"
                          : "rgba(239,68,68,0.1)",
                        border: `2px solid ${
                          playerWon
                            ? "rgba(245,158,11,0.4)"
                            : isTie
                            ? "rgba(51,65,85,0.6)"
                            : "rgba(239,68,68,0.3)"
                        }`,
                        boxShadow: playerWon
                          ? "0 0 30px rgba(245,158,11,0.3)"
                          : isTie
                          ? "none"
                          : "0 0 20px rgba(239,68,68,0.2)",
                      }}
                    >
                      {playerWon ? (
                        <Crown className="w-8 h-8 text-amber-400" style={{ filter: "drop-shadow(0 0 8px rgba(251,191,36,0.5))" }} />
                      ) : isTie ? (
                        <Mountain className="w-8 h-8 text-slate-400" />
                      ) : (
                        <span className="text-3xl">😢</span>
                      )}
                    </div>
                    {playerWon && (
                      <motion.div
                        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-1 -right-1"
                      >
                        <Sparkles className="w-5 h-5 text-amber-300" style={{ filter: "drop-shadow(0 0 4px rgba(251,191,36,0.6))" }} />
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Title */}
                  <motion.h2
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl font-black uppercase mb-1"
                    style={{
                      letterSpacing: '0.15em',
                      background: playerWon
                        ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
                        : isTie
                        ? "linear-gradient(90deg, #94a3b8, #64748b)"
                        : "linear-gradient(90deg, #fb7185, #f43f5e)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {playerWon ? "King of the Hill!" : isTie ? "Contested Territory!" : "Dethroned!"}
                  </motion.h2>
                  <p className={`text-[10px] font-bold uppercase mb-4 ${
                    playerWon ? "text-amber-400" : isTie ? "text-slate-400" : "text-red-400"
                  }`} style={{ letterSpacing: '0.15em' }}>
                    {playerWon ? "You reign supreme" : isTie ? "Neither could dominate" : `${opponentName} claimed the hill`}
                  </p>

                  {/* Final score with animated counters */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                    className="flex items-center justify-center gap-3 text-2xl font-black my-3"
                  >
                    <span style={{ color: playerWon ? "#34d399" : "#94a3b8", fontVariantNumeric: 'tabular-nums' }}>
                      <AnimatedCounter value={playerScore} />
                    </span>
                    <span className="text-slate-700">—</span>
                    <span style={{ color: !playerWon && !isTie ? "#fb7185" : "#94a3b8", fontVariantNumeric: 'tabular-nums' }}>
                      <AnimatedCounter value={opponentScore} />
                    </span>
                  </motion.div>

                  {/* Zone breakdown with connecting gradient lines */}
                  <div className="flex items-center justify-center gap-0 mb-4">
                    {zonesHistory.map((z, i) => (
                      <div key={i} className="flex items-center">
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
                          className="flex flex-col items-center gap-0.5"
                        >
                          <span
                            className="text-[7px] uppercase font-black"
                            style={{
                              letterSpacing: '0.1em',
                              background: `linear-gradient(90deg, ${theme.color1}, ${theme.color2})`,
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                            }}
                          >
                            Z{i + 1}
                          </span>
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black"
                            style={{
                              background: z.winner === "player"
                                ? "rgba(16,185,129,0.15)"
                                : z.winner === "tie"
                                ? "rgba(245,158,11,0.15)"
                                : "rgba(244,63,94,0.15)",
                              border: `1.5px solid ${
                                z.winner === "player"
                                  ? "rgba(16,185,129,0.5)"
                                  : z.winner === "tie"
                                  ? "rgba(245,158,11,0.5)"
                                  : "rgba(244,63,94,0.5)"
                              }`,
                              color: z.winner === "player" ? "#34d399" : z.winner === "tie" ? "#fbbf24" : "#fb7185",
                              boxShadow: `0 0 10px ${
                                z.winner === "player"
                                  ? "rgba(16,185,129,0.2)"
                                  : z.winner === "tie"
                                  ? "rgba(245,158,11,0.2)"
                                  : "rgba(244,63,94,0.2)"
                              }`,
                            }}
                          >
                            {z.winner === "player" ? "W" : z.winner === "tie" ? "T" : "L"}
                          </div>
                          <span className="text-[7px] text-slate-500 font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {z.playerTaps}v{z.opponentTaps}
                          </span>
                        </motion.div>
                        {i < zonesHistory.length - 1 && (
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.6 + i * 0.1 }}
                            className="w-5 h-[1.5px] mx-1 self-center"
                            style={{
                              background: `linear-gradient(90deg, ${
                                z.winner === 'player' ? 'rgba(16,185,129,0.4)' : z.winner === 'tie' ? 'rgba(245,158,11,0.4)' : 'rgba(244,63,94,0.4)'
                              }, ${
                                zonesHistory[i + 1]?.winner === 'player' ? 'rgba(16,185,129,0.4)' : zonesHistory[i + 1]?.winner === 'tie' ? 'rgba(245,158,11,0.4)' : 'rgba(244,63,94,0.4)'
                              })`,
                              transformOrigin: "left",
                              marginBottom: 14,
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Tap speed comparison glassmorphic */}
                  <motion.div
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="rounded-xl p-4 mb-4"
                    style={{
                      background: "rgba(30,41,59,0.3)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <p
                      className="text-[8px] uppercase font-bold mb-3"
                      style={{
                        letterSpacing: '0.2em',
                        background: `linear-gradient(90deg, ${theme.color1}, ${theme.color2})`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      Tap Speed Comparison
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xl font-black" style={{ color: playerWon ? "#34d399" : "#e2e8f0", fontVariantNumeric: 'tabular-nums' }}>
                          <AnimatedCounter value={playerTapsPerSec} />
                        </p>
                        <p className="text-[7px] text-slate-500 uppercase font-bold" style={{ letterSpacing: '0.15em' }}>
                          Your taps/sec
                        </p>
                      </div>
                      <div>
                        <p className="text-xl font-black" style={{ color: !playerWon && !isTie ? "#fb7185" : "#e2e8f0", fontVariantNumeric: 'tabular-nums' }}>
                          <AnimatedCounter value={opponentTapsPerSec} />
                        </p>
                        <p className="text-[7px] text-slate-500 uppercase font-bold" style={{ letterSpacing: '0.15em' }}>
                          {opponentName}'s taps/sec
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 justify-center mt-3 pt-2" style={{ borderTop: "1px solid rgba(51,65,85,0.3)" }}>
                      <Zap className="w-3 h-3 text-amber-400" style={{ filter: "drop-shadow(0 0 3px rgba(251,191,36,0.5))" }} />
                      <span className="text-[8px] font-black text-amber-400 uppercase" style={{ letterSpacing: '0.1em', fontVariantNumeric: 'tabular-nums' }}>
                        Total: {totalPlayerTaps} vs {totalOpponentTaps} taps
                      </span>
                    </div>
                  </motion.div>

                  {/* Action buttons */}
                  <div className="space-y-2">
                    <motion.button
                      onClick={handlePlayAgain}
                      whileTap={{ scale: 0.95, background: `linear-gradient(135deg, ${theme.color2}, ${theme.color1})` }}
                      whileHover={{ scale: 1.02 }}
                      className="relative w-full py-3.5 rounded-2xl text-white font-black text-xs uppercase flex items-center justify-center gap-2 overflow-hidden"
                      style={{
                        letterSpacing: '0.15em',
                        background: `linear-gradient(135deg, ${theme.color1}, ${theme.color2})`,
                        boxShadow: `0 4px 20px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                      }}
                    >
                      <motion.div
                        className="absolute inset-0"
                        style={{
                          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
                          width: "40%",
                        }}
                        animate={{ x: ["-100%", "350%"] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      />
                      <RefreshCcw className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">Play Again</span>
                    </motion.button>
                    <motion.button
                      onClick={onComplete}
                      whileTap={{ scale: 0.95 }}
                      className="w-full py-2.5 rounded-xl text-slate-300 text-xs font-bold"
                      style={{
                        background: "rgba(30,41,59,0.6)",
                        border: "1px solid rgba(51,65,85,0.4)",
                        backdropFilter: "blur(10px)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                        textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                      }}
                    >
                      Done
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
