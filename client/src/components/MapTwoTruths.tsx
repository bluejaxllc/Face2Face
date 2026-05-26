import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  User,
  Timer,
  Sparkles,
  Star,
  Crown,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────
   MapTwoTruths — Compact 'Two Truths and a Lie' for map overlay
   5 rounds, 15s each. No header/back — parent bottom sheet handles that.
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
    ring: "ring-pink-500/30",
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
    ring: "ring-emerald-500/30",
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
    ring: "ring-blue-500/30",
    glow: "rgba(59,130,246,0.4)",
    glowStrong: "rgba(59,130,246,0.7)",
    color1: "#3b82f6",
    color2: "#8b5cf6",
  },
} as const;

/* ── Statement sets: 2 truths + 1 lie per set, 5 sets per category ── */

interface StatementSet {
  truths: [string, string];
  lie: string;
}

const STATEMENT_POOLS: Record<"dating" | "friends" | "business", StatementSet[]> = {
  dating: [
    { truths: ["I believe in love at first sight", "I enjoy candlelit dinners"], lie: "I have been on over 200 dates" },
    { truths: ["I write love poems sometimes", "My ideal date involves stargazing"], lie: "I once dated a celebrity" },
    { truths: ["I think communication is key", "I enjoy long walks on the beach"], lie: "I proposed on the first date" },
    { truths: ["I believe in soulmates", "Cooking together is romantic"], lie: "I have 15 ex-partners" },
    { truths: ["I love surprise gifts", "Honesty matters most to me"], lie: "I got married in Vegas at 18" },
  ],
  friends: [
    { truths: ["I love game nights with friends", "I text my bestie daily"], lie: "I have over 5000 friends on social media" },
    { truths: ["Road trips are the best adventures", "I enjoy trying new restaurants"], lie: "I once threw a party for 500 people" },
    { truths: ["I always remember birthdays", "Group chats are my thing"], lie: "I have a friend on every continent" },
    { truths: ["Movie marathons are my jam", "I love hiking with friends"], lie: "I started my own social network" },
    { truths: ["I believe in loyalty above all", "I enjoy board game nights"], lie: "I once had 20 roommates" },
  ],
  business: [
    { truths: ["I enjoy networking events", "I read business books weekly"], lie: "I founded a billion-dollar company" },
    { truths: ["I prefer early morning meetings", "I use a digital planner"], lie: "I have 50 patents to my name" },
    { truths: ["I believe in work-life balance", "I mentor junior colleagues"], lie: "I was CEO of three companies simultaneously" },
    { truths: ["I love brainstorming sessions", "I track my goals quarterly"], lie: "I turned down a $100M offer" },
    { truths: ["Continuous learning is vital", "I enjoy team building activities"], lie: "I gave a TED talk at age 12" },
  ],
};

const TOTAL_ROUNDS = 5;
const TIME_PER_ROUND = 15;

type Phase = "countdown" | "playing" | "reveal" | "results";

interface RoundData {
  statements: string[];
  lieIndex: number;
}

/** Shuffle array in-place (Fisher–Yates) and return it. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build 5 rounds of shuffled statements from the pool. */
function buildRounds(category: "dating" | "friends" | "business"): RoundData[] {
  const pool = shuffle(STATEMENT_POOLS[category]).slice(0, TOTAL_ROUNDS);
  return pool.map((set) => {
    const all = [...set.truths, set.lie];
    const shuffled = shuffle(all);
    const lieIndex = shuffled.indexOf(set.lie);
    return { statements: shuffled, lieIndex };
  });
}

/* ── SVG Noise Texture overlay ── */
function NoiseTexture() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03] z-50">
      <filter id="noiseT">
        <feTurbulence baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noiseT)" />
    </svg>
  );
}

/* ── Ambient dust motes — tiny dots drifting upward ── */
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

/* ── Floating Particle component ── */
function FloatingParticles({ color, count = 12, speed = 1 }: { color: string; count?: number; speed?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 3,
        duration: (4 + Math.random() * 6) / speed,
        delay: Math.random() * 3,
      })),
    [count, speed]
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
            opacity: 0,
          }}
          animate={{
            y: [0, -30, -60, -30, 0],
            x: [0, 15, -10, 20, 0],
            opacity: [0, 0.6, 0.3, 0.5, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ── Sparkle burst for celebrations ── */
function SparkleBurst({ color }: { color: string }) {
  const sparks = useMemo(
    () =>
      Array.from({ length: 16 }).map((_, i) => ({
        id: i,
        angle: (i / 16) * 360,
        distance: 40 + Math.random() * 60,
        size: 3 + Math.random() * 4,
        delay: Math.random() * 0.3,
      })),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none">
      {sparks.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full"
          style={{
            width: s.size,
            height: s.size,
            background: color,
            left: "50%",
            top: "50%",
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos((s.angle * Math.PI) / 180) * s.distance,
            y: Math.sin((s.angle * Math.PI) / 180) * s.distance,
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 0.8, delay: s.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

/* ── Score odometer digit ── */
function OdometerDigit({ value }: { value: number }) {
  return (
    <span className="inline-flex overflow-hidden relative" style={{ height: '1.2em', width: '0.7em' }}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ── Animated counter with odometer ── */
function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 600;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  const digits = String(display).split('');
  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {digits.map((d, i) => (
        <OdometerDigit key={`${i}-${d}`} value={parseInt(d)} />
      ))}
    </span>
  );
}

/* ── Victory rays of light ── */
function VictoryRays({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        width: 200,
        height: 200,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        background: `conic-gradient(from 0deg, transparent 0%, ${color}08 10%, transparent 20%, transparent 25%, ${color}06 35%, transparent 45%, transparent 50%, ${color}08 60%, transparent 70%, transparent 75%, ${color}06 85%, transparent 95%)`,
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    />
  );
}

/* ── Score change ripple — expanding colored ring ── */
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

/* ── Trust Meter — small gauge ── */
function TrustMeter({ correctCount, totalRounds, color1, color2 }: { correctCount: number; totalRounds: number; color1: string; color2: string }) {
  const percent = totalRounds > 0 ? (correctCount / totalRounds) * 100 : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{
        background: "rgba(15,23,42,0.6)",
        border: "1px solid rgba(51,65,85,0.4)",
        backdropFilter: "blur(8px)",
      }}
    >
      <span
        className="text-[7px] font-black uppercase"
        style={{ letterSpacing: "0.15em", color: "rgba(148,163,184,0.7)" }}
      >
        Trust
      </span>
      <div
        className="w-16 h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(30,41,59,0.8)" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color1}, ${color2})` }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <span
        className="text-[8px] font-black"
        style={{
          background: `linear-gradient(90deg, ${color1}, ${color2})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {Math.round(percent)}%
      </span>
    </motion.div>
  );
}

/* ── Animated mesh gradient background for cards ── */
function MeshGradientBg({ color1, color2, speed = 1 }: { color1: string; color2: string; speed?: number }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
      style={{ opacity: 0.06 }}
    >
      <motion.div
        className="absolute w-[200%] h-[200%] -left-1/2 -top-1/2"
        style={{
          background: `radial-gradient(ellipse at 30% 40%, ${color1}90 0%, transparent 50%),
                       radial-gradient(ellipse at 70% 60%, ${color2}90 0%, transparent 50%)`,
        }}
        animate={{
          x: [0, 20, -10, 0],
          y: [0, -15, 10, 0],
        }}
        transition={{ duration: 8 / speed, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

/* ── Ambient theme-colored particles ── */
function AmbientParticles({ intensity = 1, color }: { intensity: number; color: string }) {
  return <>{Array.from({length: Math.round(8 * intensity)}, (_, i) => (
    <motion.div key={`dust-${i}`} className="absolute w-1 h-1 rounded-full pointer-events-none" style={{ background: color, left: `${10 + Math.random()*80}%`, top: `${10 + Math.random()*80}%`, opacity: 0.2 + Math.random()*0.3 }} animate={{ y: [0, -30 - Math.random()*50], x: [0, (Math.random()-0.5)*20], opacity: [0.3, 0] }} transition={{ duration: 3 + Math.random()*4, repeat: Infinity, delay: Math.random()*3, ease: 'linear' }} />
  ))}</>;
}

/* ── Radial wipe transition between rounds ── */
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

export default function MapTwoTruths({ opponent, category, onComplete }: MapGameChildProps) {
  const theme = THEMES[category];
  const opponentName = opponent.firstName;
  const avatarUrl = opponent.profilePhoto || undefined;

  // ── Game state ──
  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [rounds, setRounds] = useState<RoundData[]>(() => buildRounds(category));
  const [currentRound, setCurrentRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_ROUND);

  // ── Per-round state ──
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [playerGuesses, setPlayerGuesses] = useState<(number | null)[]>([]);

  // ── Screen shake state ──
  const [shakeScreen, setShakeScreen] = useState(false);

  // ── Show GO! flash ──
  const [showGo, setShowGo] = useState(false);

  // ── Score ripple trigger ──
  const [scoreRippleTrigger, setScoreRippleTrigger] = useState(0);

  // ── Analyzing state for pre-reveal ──
  const [showAnalyzing, setShowAnalyzing] = useState(false);

  // ── Refs (avoid stale closures) ──
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answeredRef = useRef(false);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived ──
  const round = rounds[currentRound];
  const correctCount = playerGuesses.filter(
    (g, i) => g !== null && g === rounds[i]?.lieIndex
  ).length;
  const totalAnswered = playerGuesses.length;
  const scorePercent = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
  const timerPercent = (timeLeft / TIME_PER_ROUND) * 100;

  // ── Progressive intensity (0-1 based on round progress) ──
  const progressIntensity = Math.min((currentRound + 1) / TOTAL_ROUNDS, 1);

  // ── Dynamic color temperature — warm if leading, cool if behind ──
  const isLeading = correctCount > (totalAnswered - correctCount);
  const warmColor = "rgba(251,191,36,0.15)";
  const coolColor = "rgba(59,130,246,0.15)";
  const orbTint = totalAnswered === 0 ? theme.glow : isLeading ? warmColor : coolColor;

  // ── Winner tint — HSL-based color temperature for orbs ──
  const winnerTint = useMemo(() => {
    if (correctCount > (totalAnswered - correctCount)) return { h1: '35', s1: '90%', l1: '55%' }; // warm amber
    if (correctCount < (totalAnswered - correctCount)) return { h1: '230', s1: '80%', l1: '55%' }; // cool blue
    return { h1: '270', s1: '70%', l1: '50%' }; // neutral purple
  }, [correctCount, totalAnswered]);

  // ── Progressive intensity scaling ──
  const intensity = useMemo(() => {
    const roundFactor = currentRound / TOTAL_ROUNDS;
    const scoreDiff = Math.abs(correctCount - (totalAnswered - correctCount));
    const closeness = 1 - Math.min(scoreDiff / 3, 1);
    return 0.7 + roundFactor * 0.5 + closeness * 0.3;
  }, [currentRound, correctCount, totalAnswered]);

  // ── Radial wipe state ──
  const [showRadialWipe, setShowRadialWipe] = useState(false);

  // Card fan rotation offsets
  const cardRotations = [-3, 0, 3];

  // ── Countdown ──
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
              setPhase("playing");
            }, 600);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // ── Round timer ──
  useEffect(() => {
    if (phase === "playing") {
      setTimeLeft(TIME_PER_ROUND);
      setSelectedIdx(null);
      setShowAnalyzing(false);
      answeredRef.current = false;

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            if (!answeredRef.current) {
              answeredRef.current = true;
              setPlayerGuesses((g) => [...g, null]);
              setShakeScreen(true);
              setTimeout(() => setShakeScreen(false), 400);
              // Show analyzing before reveal
              setShowAnalyzing(true);
              setTimeout(() => {
                setShowAnalyzing(false);
                setPhase("reveal");
              }, 800);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [phase, currentRound]);

  // ── Auto-advance from reveal ──
  useEffect(() => {
    if (phase === "reveal") {
      setScoreRippleTrigger((t) => t + 1);
      autoAdvanceRef.current = setTimeout(() => {
        if (currentRound + 1 >= TOTAL_ROUNDS) {
          setPhase("results");
        } else {
          // Trigger radial wipe between rounds
          setShowRadialWipe(true);
          setTimeout(() => setShowRadialWipe(false), 600);
          setCurrentRound((r) => r + 1);
          setPhase("playing");
        }
      }, 2500);
      return () => {
        if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
      };
    }
  }, [phase, currentRound]);

  // ── Player picks a statement as the lie ──
  const handleSelect = useCallback(
    (idx: number) => {
      if (answeredRef.current) return;
      answeredRef.current = true;
      setSelectedIdx(idx);
      if (timerRef.current) clearInterval(timerRef.current);
      setPlayerGuesses((g) => [...g, idx]);

      // If wrong, shake
      const round = rounds[currentRound];
      if (round && idx !== round.lieIndex) {
        setShakeScreen(true);
        setTimeout(() => setShakeScreen(false), 400);
      }

      // Show analyzing before reveal
      setShowAnalyzing(true);
      setTimeout(() => {
        setShowAnalyzing(false);
        setPhase("reveal");
      }, 1000);
    },
    [rounds, currentRound]
  );

  // ── Play again ──
  const handlePlayAgain = useCallback(() => {
    const newRounds = buildRounds(category);
    setRounds(newRounds);
    setCurrentRound(0);
    setPlayerGuesses([]);
    setSelectedIdx(null);
    answeredRef.current = false;
    setPhase("countdown");
  }, [category]);

  return (
    <motion.div
      className="relative flex flex-col w-full text-white select-none overflow-hidden"
      animate={shakeScreen ? { x: [0, -4, 6, -3, 2, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* ── SVG noise texture ── */}
      <NoiseTexture />

      {/* ── Dynamic color temperature background orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-40 h-40 rounded-full blur-3xl"
          style={{ top: "-10%", left: "-15%", opacity: 0.15 }}
          animate={{
            x: [0, 20 + progressIntensity * 15, 0],
            y: [0, 15, 0],
            background: [orbTint, theme.glow, orbTint],
          }}
          transition={{ duration: 8 / (0.8 + progressIntensity * 0.4) / intensity, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-32 h-32 rounded-full blur-3xl"
          style={{ bottom: "5%", right: "-10%", opacity: 0.1 }}
          animate={{
            x: [0, -15, 0],
            y: [0, -20, 0],
            background: [theme.glow, orbTint, theme.glow],
          }}
          transition={{ duration: 10 / (0.8 + progressIntensity * 0.4) / intensity, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* ── Floating particles (speed scales with intensity) ── */}
      <FloatingParticles color={theme.glow} count={Math.round(10 + progressIntensity * 6)} speed={0.8 + progressIntensity * 0.6} />

      {/* ── Ambient dust motes ── */}
      <DustMotes intensity={0.6 + progressIntensity * 0.6} />

      {/* ── Ambient theme-colored particles ── */}
      <AmbientParticles intensity={1 + currentRound * 0.15} color={`hsl(${winnerTint.h1}, ${winnerTint.s1}, ${winnerTint.l1})`} />

      {/* ── Radial wipe transition between rounds ── */}
      <AnimatePresence>
        {showRadialWipe && <RadialWipe color={theme.color1} />}
      </AnimatePresence>

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
              initial={{ height: 40 }}
              animate={{ height: countdown === 0 ? 0 : 40 }}
              transition={{ duration: 0.5 }}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-black z-30"
              initial={{ height: 40 }}
              animate={{ height: countdown === 0 ? 0 : 40 }}
              transition={{ duration: 0.5 }}
            />

            {/* Subtle zoom-out background */}
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
              transition={{ delay: 0.1 }}
              className="text-[10px] font-black uppercase mb-3 z-20"
              style={{
                letterSpacing: '0.3em',
                background: `linear-gradient(90deg, ${theme.color1}, ${theme.color2})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Two Truths & a Lie
            </motion.p>

            <AnimatePresence mode="popLayout">
              {showGo ? (
                <motion.div
                  key="go"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 2, opacity: 1 }}
                  exit={{ scale: 4, opacity: 0, filter: "blur(12px)" }}
                  transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
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
                  initial={{ scale: 0, opacity: 0, rotate: -20 }}
                  animate={{ scale: 1.5, opacity: 1, rotate: 0 }}
                  exit={{ scale: 3, opacity: 0, filter: "blur(8px)" }}
                  transition={{ duration: 0.6, type: "spring", stiffness: 150 }}
                  className="relative z-20"
                >
                  <span
                    className="text-8xl font-black"
                    style={{
                      background: `linear-gradient(135deg, ${theme.color1}, ${theme.color2})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      filter: `drop-shadow(0 0 30px ${theme.glow})`,
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
                        border: `${2 - ring * 0.5}px solid ${theme.color1}`,
                        opacity: 0.3 - ring * 0.1,
                      }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3 - ring * 0.1, 0, 0.3 - ring * 0.1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: ring * 0.15 }}
                    />
                  ))}
                  {/* Radial shockwave on each tick */}
                  <motion.div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: 60,
                      height: 60,
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      border: `2px solid ${theme.color1}`,
                    }}
                    initial={{ scale: 0.5, opacity: 0.8 }}
                    animate={{ scale: 4, opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                  {/* Main glow behind number */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      boxShadow: `0 0 60px 20px ${theme.glow}`,
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      width: 80,
                      height: 80,
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
              Guess {opponentName}'s Lies
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PHASE: PLAYING / REVEAL ── */}
      {(phase === "playing" || phase === "reveal" || showAnalyzing) && round && (
        <div className="relative flex flex-col">
          {/* Top: Avatar + name + round indicator + trust meter */}
          <motion.div
            className="flex items-center gap-3 px-4 pt-3 pb-2"
            animate={phase === "reveal" ? { filter: "blur(0px)" } : {}}
          >
            {/* Avatar with glowing ring + leading crown */}
            <div className="relative shrink-0">
              <motion.div
                className="absolute -inset-1 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${theme.color1}, ${theme.color2})`,
                  opacity: 0.6,
                }}
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-slate-900 bg-slate-800 flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={opponentName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {/* Leading player crown */}
                <AnimatePresence>
                  {isLeading && totalAnswered > 0 && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1, y: [0, -2, 0] }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <motion.div
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Crown className="w-3.5 h-3.5" style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.6))' }} />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <p className="text-sm font-black text-white truncate" style={{ letterSpacing: '0.02em' }}>
                  {opponentName}'s Truths
                </p>
              </div>
              <p
                className="text-[9px] uppercase font-bold"
                style={{
                  letterSpacing: '0.25em',
                  background: `linear-gradient(90deg, ${theme.color1}, ${theme.color2})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Spot the Lie
              </p>
            </div>

            {/* Round indicator with connecting gradient line */}
            <div className="flex items-center gap-0">
              {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
                let dotColor = "bg-slate-800";
                let glowShadow = "none";
                if (i < playerGuesses.length) {
                  const wasCorrect = playerGuesses[i] !== null && playerGuesses[i] === rounds[i]?.lieIndex;
                  dotColor = wasCorrect ? "bg-emerald-500" : "bg-red-500";
                  glowShadow = wasCorrect ? "0 0 8px rgba(16,185,129,0.6)" : "0 0 8px rgba(239,68,68,0.6)";
                } else if (i === currentRound) {
                  dotColor = "";
                  glowShadow = `0 0 10px ${theme.glow}`;
                }
                return (
                  <div key={i} className="flex items-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[6px] text-slate-500 font-black" style={{ letterSpacing: '0.1em' }}>{i + 1}</span>
                      <motion.div
                        className={`w-2.5 h-2.5 rounded-full ${dotColor}`}
                        style={{
                          boxShadow: glowShadow,
                          ...(i === currentRound && !dotColor
                            ? {
                                background: `linear-gradient(135deg, ${theme.color1}, ${theme.color2})`,
                              }
                            : {}),
                        }}
                        animate={i === currentRound ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </div>
                    {/* Connecting gradient line */}
                    {i < TOTAL_ROUNDS - 1 && (
                      <div
                        className="w-3 h-[1.5px] mx-0.5"
                        style={{
                          background:
                            i < playerGuesses.length
                              ? `linear-gradient(90deg, ${
                                  playerGuesses[i] !== null && playerGuesses[i] === rounds[i]?.lieIndex
                                    ? "rgba(16,185,129,0.5)"
                                    : "rgba(239,68,68,0.5)"
                                }, ${
                                  i + 1 < playerGuesses.length
                                    ? playerGuesses[i + 1] !== null && playerGuesses[i + 1] === rounds[i + 1]?.lieIndex
                                      ? "rgba(16,185,129,0.5)"
                                      : "rgba(239,68,68,0.5)"
                                    : "rgba(30,41,59,0.3)"
                                })`
                              : i === currentRound
                              ? `linear-gradient(90deg, ${theme.color1}60, rgba(30,41,59,0.3))`
                              : "rgba(30,41,59,0.4)",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Trust Meter */}
          {totalAnswered > 0 && (
            <div className="flex justify-center px-4 pb-1">
              <TrustMeter
                correctCount={correctCount}
                totalRounds={totalAnswered}
                color1={theme.color1}
                color2={theme.color2}
              />
            </div>
          )}

          {/* Analyzing overlay between selection and reveal */}
          <AnimatePresence>
            {showAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-4 py-2 flex items-center justify-center gap-2"
              >
                <motion.div
                  className="relative overflow-hidden rounded-full px-4 py-1.5"
                  style={{
                    background: "rgba(15,23,42,0.7)",
                    border: `1px solid ${theme.color1}30`,
                  }}
                >
                  {/* Scanning line */}
                  <motion.div
                    className="absolute top-0 bottom-0 w-px"
                    style={{
                      background: `linear-gradient(180deg, transparent, ${theme.color1}, transparent)`,
                      boxShadow: `0 0 8px ${theme.color1}`,
                    }}
                    animate={{ left: ["0%", "100%", "0%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <span
                    className="text-[9px] font-black uppercase relative z-10"
                    style={{
                      letterSpacing: "0.2em",
                      background: `linear-gradient(90deg, ${theme.color1}, ${theme.color2})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Analyzing...
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Statement cards — fan out like playing cards */}
          <div className="px-4 py-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentRound}
                initial={{ x: 50, opacity: 0, filter: "blur(4px)" }}
                animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ x: -50, opacity: 0, filter: "blur(4px)" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="space-y-2.5"
              >
                {round.statements.map((statement, idx) => {
                  const isRevealed = phase === "reveal";
                  const isTheLie = idx === round.lieIndex;
                  const wasSelected = selectedIdx === idx;
                  const rotation = cardRotations[idx] || 0;
                  const hasSelection = selectedIdx !== null;
                  const isUnselected = hasSelection && !wasSelected && !isRevealed;

                  // Card visual state
                  let borderGradient = "rgba(51,65,85,0.4)";
                  let bgColor = "rgba(15,23,42,0.5)";
                  let glowEffect = "none";
                  let dimmed = false;
                  let liftY = 0;

                  if (isRevealed) {
                    if (isTheLie && wasSelected) {
                      borderGradient = "rgba(16,185,129,0.8)";
                      bgColor = "rgba(16,185,129,0.08)";
                      glowEffect = "0 0 20px rgba(16,185,129,0.3), inset 0 0 20px rgba(16,185,129,0.05)";
                    } else if (isTheLie && !wasSelected) {
                      borderGradient = "rgba(245,158,11,0.7)";
                      bgColor = "rgba(245,158,11,0.08)";
                      glowEffect = "0 0 15px rgba(245,158,11,0.2)";
                    } else if (wasSelected && !isTheLie) {
                      borderGradient = "rgba(239,68,68,0.8)";
                      bgColor = "rgba(239,68,68,0.08)";
                      glowEffect = "0 0 20px rgba(239,68,68,0.3)";
                    } else {
                      dimmed = true;
                      bgColor = "rgba(15,23,42,0.2)";
                    }
                  } else if (wasSelected) {
                    borderGradient = theme.glowStrong;
                    bgColor = `${theme.glow.replace("0.4", "0.08")}`;
                    glowEffect = `0 0 20px ${theme.glow}, inset 0 0 15px ${theme.glow.replace("0.4", "0.05")}`;
                    liftY = -8;
                  }

                  return (
                    <motion.button
                      key={idx}
                      onClick={() => handleSelect(idx)}
                      disabled={answeredRef.current || isRevealed || showAnalyzing}
                      layout
                      initial={{
                        opacity: 0,
                        y: 20,
                        rotateZ: rotation,
                        rotateX: 2,
                      }}
                      animate={{
                        opacity: dimmed ? 0.3 : isUnselected ? 0.5 : 1,
                        y: isUnselected ? 4 : liftY,
                        rotateZ: isRevealed ? 0 : rotation,
                        rotateX: 0,
                        scale: isUnselected ? 0.97 : 1,
                        ...(isRevealed && isTheLie
                          ? { rotateY: [0, 90, 180], scale: [1, 1.02, 1] }
                          : isRevealed && wasSelected && !isTheLie
                          ? { x: [0, -6, 6, -4, 4, 0] }
                          : {}),
                      }}
                      transition={{
                        ...(isRevealed && isTheLie
                          ? { duration: 0.6, ease: "easeInOut" }
                          : isRevealed && wasSelected && !isTheLie
                          ? { duration: 0.5, ease: "easeInOut" }
                          : { duration: 0.4, delay: idx * 0.05 }),
                      }}
                      whileTap={!isRevealed && !answeredRef.current && !showAnalyzing ? { scale: 0.96 } : {}}
                      className="w-full py-3.5 px-4 rounded-2xl text-left flex items-center gap-3 transition-colors duration-300 backdrop-blur-md relative overflow-hidden"
                      style={{
                        background: bgColor,
                        border: `1px solid ${borderGradient}`,
                        boxShadow: glowEffect,
                        perspective: '800px',
                        transformStyle: 'preserve-3d',
                        filter: isUnselected ? "brightness(0.7)" : "brightness(1)",
                      }}
                    >
                      {/* Animated mesh gradient background */}
                      <MeshGradientBg
                        color1={theme.color1}
                        color2={theme.color2}
                        speed={0.8 + progressIntensity * 0.4}
                      />

                      {/* Number badge / stamp */}
                      <motion.div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 relative z-10"
                        style={{
                          background:
                            isRevealed && isTheLie && wasSelected
                              ? "linear-gradient(135deg, #10b981, #06b6d4)"
                              : isRevealed && isTheLie && !wasSelected
                              ? "linear-gradient(135deg, #f59e0b, #f97316)"
                              : isRevealed && wasSelected && !isTheLie
                              ? "linear-gradient(135deg, #ef4444, #dc2626)"
                              : "rgba(30,41,59,0.8)",
                          color:
                            isRevealed && (isTheLie || wasSelected) ? "#fff" : "rgba(148,163,184,0.8)",
                          boxShadow:
                            isRevealed && isTheLie && wasSelected
                              ? "0 0 12px rgba(16,185,129,0.4)"
                              : "none",
                        }}
                      >
                        {isRevealed && isTheLie ? (
                          <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 400, delay: 0.3 }}
                          >
                            {wasSelected ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400" />
                            )}
                          </motion.div>
                        ) : isRevealed && wasSelected && !isTheLie ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, delay: 0.3 }}
                          >
                            <XCircle className="w-4 h-4" />
                          </motion.div>
                        ) : isRevealed && !isTheLie && !wasSelected ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, delay: 0.3 }}
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400/60" />
                          </motion.div>
                        ) : (
                          idx + 1
                        )}
                      </motion.div>

                      {/* Statement text */}
                      <span
                        className={`text-xs font-semibold leading-relaxed relative z-10 ${
                          isRevealed && isTheLie && wasSelected
                            ? "text-emerald-300"
                            : isRevealed && isTheLie && !wasSelected
                            ? "text-amber-300"
                            : isRevealed && wasSelected && !isTheLie
                            ? "text-red-300"
                            : "text-slate-200"
                        }`}
                        style={{
                          textDecoration: isRevealed && isTheLie ? 'line-through' : 'none',
                          textDecorationColor: isRevealed && isTheLie ? 'rgba(239,68,68,0.6)' : undefined,
                        }}
                      >
                        {statement}
                      </span>

                      {/* BUSTED stamp — rubber stamp bounce on lie card */}
                      {isRevealed && isTheLie && (
                        <motion.div
                          initial={{ scale: 3, opacity: 0, rotate: -25 }}
                          animate={{ scale: 1, opacity: 1, rotate: -8 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 12,
                            delay: 0.4,
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 z-20"
                        >
                          <div
                            className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase"
                            style={{
                              letterSpacing: '0.15em',
                              color: "#ef4444",
                              border: "2px solid #ef4444",
                              background: "rgba(239,68,68,0.08)",
                              boxShadow: "0 0 12px rgba(239,68,68,0.3), inset 0 0 8px rgba(239,68,68,0.1)",
                              textShadow: "0 0 8px rgba(239,68,68,0.5)",
                            }}
                          >
                            BUSTED
                          </div>
                        </motion.div>
                      )}

                      {/* Reveal label — TRUTH stamp for truth cards */}
                      {isRevealed && !isTheLie && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 0.6 }}
                          transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
                          className="ml-auto shrink-0 px-2 py-0.5 rounded-full text-[7px] font-black uppercase relative z-10"
                          style={{
                            letterSpacing: '0.15em',
                            background: "rgba(16,185,129,0.1)",
                            color: "#34d399",
                            border: "1px solid rgba(16,185,129,0.3)",
                          }}
                        >
                          ✓ TRUE
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Timer bar with shimmer — blurs during reveal (depth-of-field) */}
          <motion.div
            className="px-4 pt-1 pb-3"
            animate={phase === "reveal" ? { filter: "blur(3px)", opacity: 0.5 } : { filter: "blur(0px)", opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <motion.div
                animate={
                  timeLeft <= 5 && phase === "playing"
                    ? { scale: [1, 1.2, 1] }
                    : {}
                }
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Timer
                  className={`w-3.5 h-3.5 ${
                    timeLeft <= 5 && phase === "playing" ? "text-red-400" : "text-slate-400"
                  }`}
                />
              </motion.div>
              <span
                className={`text-xs font-black ${
                  timeLeft <= 5 && phase === "playing" ? "text-red-400" : "text-slate-300"
                }`}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {phase === "reveal" ? "—" : `${timeLeft}s`}
              </span>
            </div>
            <div className="relative w-full h-2 rounded-full bg-slate-800/60 overflow-hidden">
              <motion.div
                className="h-full rounded-full relative overflow-hidden"
                style={{
                  background:
                    timeLeft <= 5 && phase === "playing"
                      ? "linear-gradient(90deg, #ef4444, #f97316)"
                      : `linear-gradient(90deg, ${theme.color1}, ${theme.color2})`,
                  boxShadow:
                    timeLeft <= 5 && phase === "playing"
                      ? "0 0 12px rgba(239,68,68,0.5)"
                      : `0 0 10px ${theme.glow}`,
                }}
                initial={false}
                animate={{ width: phase === "reveal" ? "0%" : `${timerPercent}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                    width: "50%",
                  }}
                  animate={{ x: ["-100%", "300%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Reveal feedback with opponent thought bubble */}
          <AnimatePresence>
            {phase === "reveal" && (
              <motion.div
                initial={{ y: 20, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="px-4 pb-3"
              >
                <div
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl backdrop-blur-md"
                  style={{
                    background:
                      selectedIdx !== null && selectedIdx === round.lieIndex
                        ? "rgba(16,185,129,0.1)"
                        : "rgba(239,68,68,0.1)",
                    border: `1px solid ${
                      selectedIdx !== null && selectedIdx === round.lieIndex
                        ? "rgba(16,185,129,0.3)"
                        : "rgba(239,68,68,0.3)"
                    }`,
                    boxShadow:
                      selectedIdx !== null && selectedIdx === round.lieIndex
                        ? "0 0 20px rgba(16,185,129,0.15)"
                        : "0 0 20px rgba(239,68,68,0.15)",
                  }}
                >
                  {selectedIdx !== null && selectedIdx === round.lieIndex ? (
                    <>
                      <motion.div
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </motion.div>
                      <span className="text-xs font-black text-emerald-400 uppercase" style={{ letterSpacing: '0.1em' }}>
                        Correct! You found the lie!
                      </span>
                      <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-black text-red-400 uppercase" style={{ letterSpacing: '0.1em' }}>
                        {selectedIdx === null ? "Time's Up!" : "Wrong! That was a truth."}
                      </span>
                    </>
                  )}
                </div>

                {/* Score change ripple */}
                <div className="relative flex justify-center mt-1">
                  <ScoreRipple
                    color={selectedIdx !== null && selectedIdx === round.lieIndex ? "#34d399" : "#ef4444"}
                    trigger={scoreRippleTrigger}
                  />
                </div>

                {/* Opponent thought bubble */}
                <motion.div
                  initial={{ scale: 0, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
                  className="flex items-center justify-center gap-2 mt-2"
                >
                  <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-full"
                    style={{
                      background: 'rgba(30,41,59,0.6)',
                      border: '1px solid rgba(51,65,85,0.4)',
                    }}
                  >
                    {/* Thought bubble dots */}
                    <div className="absolute -bottom-1 left-4 w-2 h-2 rounded-full" style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(51,65,85,0.4)' }} />
                    <div className="absolute -bottom-3 left-2 w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(51,65,85,0.4)' }} />

                    <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center shrink-0"
                      style={{ border: `1px solid ${theme.color1}40` }}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={opponentName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold italic">
                      {selectedIdx !== null && selectedIdx === round.lieIndex
                        ? `"How did you know?!"`
                        : `"Fooled you! 😏"`}
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── PHASE: RESULTS ── */}
      {phase === "results" && (
        <div className="relative flex flex-col items-center px-4 py-5">
          {/* Sparkle burst for good scores */}
          {correctCount >= 3 && <SparkleBurst color={theme.color1} />}

          {/* Victory rays for great scores */}
          {correctCount >= 4 && <VictoryRays color="#fbbf24" />}

          <motion.div
            initial={{ scale: 0, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 15 }}
            className="w-full max-w-sm"
          >
            {/* Animated conic gradient border wrapper */}
            <div className="relative rounded-2xl overflow-visible">
              <motion.div
                className="absolute -inset-[1px] rounded-2xl pointer-events-none z-0"
                style={{
                  background: `conic-gradient(from 0deg, ${theme.color1}30, transparent, ${theme.color2}30, transparent, ${theme.color1}30)`,
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
                  boxShadow: `0 25px 60px rgba(0,0,0,0.5), 0 0 40px ${theme.glow.replace("0.4", "0.1")}`,
                }}
              >
                {/* Top gradient accent */}
                <div
                  className="h-1.5"
                  style={{
                    background: `linear-gradient(90deg, ${theme.color1}, ${theme.color2})`,
                    boxShadow: `0 2px 15px ${theme.glow}`,
                  }}
                />
                <div className="p-5 text-center">
                  {/* Score circle */}
                  <motion.div
                    className="relative w-24 h-24 mx-auto mb-4"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
                  >
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                      <circle
                        cx="48" cy="48" r="40"
                        fill="none"
                        stroke="rgba(30,41,59,0.6)"
                        strokeWidth="6"
                      />
                      <motion.circle
                        cx="48" cy="48" r="40"
                        fill="none"
                        stroke={`url(#scoreGradTT)`}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - scorePercent / 100) }}
                        transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
                        style={{
                          filter: `drop-shadow(0 0 8px ${theme.glow})`,
                        }}
                      />
                      <defs>
                        <linearGradient id="scoreGradTT" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor={theme.color1} />
                          <stop offset="100%" stopColor={theme.color2} />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <AnimatedCounter
                        value={correctCount}
                        className="text-2xl font-black text-white"
                      />
                      <span className="text-[7px] text-slate-500 font-bold uppercase" style={{ letterSpacing: '0.15em' }}>/{TOTAL_ROUNDS}</span>
                    </div>
                  </motion.div>

                  {/* Title with gradient */}
                  <motion.h2
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-xl font-black uppercase mb-1"
                    style={{
                      letterSpacing: '0.15em',
                      background:
                        correctCount >= 4
                          ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
                          : correctCount >= 3
                          ? `linear-gradient(90deg, ${theme.color1}, ${theme.color2})`
                          : undefined,
                      WebkitBackgroundClip: correctCount >= 3 ? "text" : undefined,
                      WebkitTextFillColor: correctCount >= 3 ? "transparent" : undefined,
                      color: correctCount < 3 ? "#e2e8f0" : undefined,
                    }}
                  >
                    {correctCount >= 4
                      ? "Lie Detector!"
                      : correctCount >= 3
                      ? "Sharp Eye!"
                      : correctCount >= 2
                      ? "Not Bad!"
                      : "Keep Trying!"}
                  </motion.h2>
                  <p
                    className={`text-[10px] font-bold uppercase mb-4 ${
                      correctCount >= 4
                        ? "text-amber-400"
                        : correctCount >= 3
                        ? theme.text
                        : correctCount >= 2
                        ? "text-slate-400"
                        : "text-red-400"
                    }`}
                    style={{ letterSpacing: '0.15em' }}
                  >
                    {correctCount >= 4
                      ? "You can't be fooled"
                      : correctCount >= 3
                      ? "Great instincts"
                      : correctCount >= 2
                      ? "Room for improvement"
                      : "Everyone falls for a good lie"}
                  </p>

                  {/* Trust Meter final result */}
                  <div className="flex justify-center mb-4">
                    <TrustMeter
                      correctCount={correctCount}
                      totalRounds={TOTAL_ROUNDS}
                      color1={theme.color1}
                      color2={theme.color2}
                    />
                  </div>

                  {/* Opponent avatar + context */}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div
                      className="w-6 h-6 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center"
                      style={{ border: `1.5px solid ${theme.color1}40` }}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={opponentName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">
                      You identified {correctCount} of {opponentName}'s lies
                    </span>
                  </div>

                  {/* Round-by-round recap with connecting gradient lines */}
                  <div className="flex items-center justify-center gap-0 mb-4">
                    {playerGuesses.map((g, i) => {
                      const wasCorrect = g !== null && g === rounds[i]?.lieIndex;
                      return (
                        <div key={i} className="flex items-center">
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
                            className="flex flex-col items-center gap-0.5"
                          >
                            <span className="text-[7px] text-slate-500 font-black" style={{ letterSpacing: '0.1em' }}>R{i + 1}</span>
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center"
                              style={{
                                background: wasCorrect ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                                border: `1.5px solid ${wasCorrect ? "rgba(16,185,129,0.6)" : "rgba(239,68,68,0.6)"}`,
                                boxShadow: wasCorrect
                                  ? "0 0 10px rgba(16,185,129,0.2)"
                                  : "0 0 10px rgba(239,68,68,0.2)",
                                color: wasCorrect ? "#34d399" : "#f87171",
                              }}
                            >
                              {wasCorrect ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                            </div>
                          </motion.div>
                          {i < playerGuesses.length - 1 && (
                            <motion.div
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ delay: 0.6 + i * 0.1 }}
                              className="w-4 h-[1.5px] mx-0.5"
                              style={{
                                background: `linear-gradient(90deg, ${
                                  wasCorrect ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'
                                }, ${
                                  playerGuesses[i + 1] !== null && playerGuesses[i + 1] === rounds[i + 1]?.lieIndex
                                    ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'
                                })`,
                                transformOrigin: "left",
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Stats with glassmorphic cards */}
                  <div className="flex items-center justify-center gap-3 mb-4">
                    {[
                      { label: "Correct", value: correctCount, color: "#34d399" },
                      { label: "Wrong", value: TOTAL_ROUNDS - correctCount, color: "#f87171" },
                      { label: "Accuracy", value: `${scorePercent}%`, color: "#fff" },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ y: 15, opacity: 0, rotateX: 2 }}
                        animate={{ y: 0, opacity: 1, rotateX: 0 }}
                        transition={{ delay: 0.7 + i * 0.1 }}
                        className="text-center px-3 py-2 rounded-xl"
                        style={{
                          background: "rgba(30,41,59,0.4)",
                          border: "1px solid rgba(51,65,85,0.4)",
                          perspective: '800px',
                        }}
                      >
                        <p className="text-sm font-black" style={{ color: stat.color, fontVariantNumeric: 'tabular-nums' }}>
                          {typeof stat.value === "number" ? (
                            <AnimatedCounter value={stat.value} />
                          ) : (
                            stat.value
                          )}
                        </p>
                        <p className="text-[6px] text-slate-500 uppercase font-bold" style={{ letterSpacing: '0.2em' }}>
                          {stat.label}
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Action buttons — improved with gradient shift, inset shadow, text shadow */}
                  <div className="space-y-2">
                    <motion.button
                      onClick={handlePlayAgain}
                      whileTap={{ scale: 0.95, background: `linear-gradient(135deg, ${theme.color2}, ${theme.color1})` }}
                      whileHover={{ scale: 1.02 }}
                      className="w-full py-3 rounded-2xl text-white font-black text-xs uppercase flex items-center justify-center gap-2 relative overflow-hidden"
                      style={{
                        letterSpacing: '0.15em',
                        background: `linear-gradient(135deg, ${theme.color1}, ${theme.color2})`,
                        boxShadow: `0 4px 20px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                      }}
                    >
                      {/* Button shimmer */}
                      <motion.div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
                          width: "40%",
                        }}
                        animate={{ x: ["-100%", "350%"] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      />
                      <RotateCcw className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">Play Again</span>
                    </motion.button>
                    <motion.button
                      onClick={onComplete}
                      whileTap={{ scale: 0.95 }}
                      className="w-full py-2.5 rounded-xl text-slate-300 text-xs font-bold backdrop-blur-sm"
                      style={{
                        background: "rgba(30,41,59,0.6)",
                        border: "1px solid rgba(51,65,85,0.4)",
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
