import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Timer,
  Zap,
  Trophy,
  CheckCircle2,
  XCircle,
  Flame,
  Users,
  RotateCcw,
  User,
  Crown,
  Star,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────
   MapTriviaClash — Compact head-to-head trivia for map overlay
   5 questions, 10s each. No header/back — parent bottom sheet handles that.
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
    hex: "#ec4899",
    hexAlt: "#f43f5e",
    glow: "rgba(236,72,153,0.45)",
    glowSoft: "rgba(236,72,153,0.12)",
  },
  friends: {
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    hex: "#10b981",
    hexAlt: "#14b8a6",
    glow: "rgba(16,185,129,0.45)",
    glowSoft: "rgba(16,185,129,0.12)",
  },
  business: {
    gradient: "from-blue-500 via-indigo-500 to-purple-500",
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    hex: "#3b82f6",
    hexAlt: "#6366f1",
    glow: "rgba(59,130,246,0.45)",
    glowSoft: "rgba(59,130,246,0.12)",
  },
} as const;

/* ── Questions Pool (10 per category, pick 5 random) ── */

interface Question {
  question: string;
  options: string[];
  correct: number;
  difficulty: "easy" | "medium" | "hard";
}

const QUESTIONS: Record<"dating" | "friends" | "business", Question[]> = {
  dating: [
    { question: "What's the most popular first-date spot?", options: ["Coffee shop ☕", "Fancy restaurant 🍽️", "Park walk 🌳", "Movie theater 🎬"], correct: 0, difficulty: "easy" },
    { question: "What % of couples now meet online?", options: ["15%", "30%", "40%", "55%"], correct: 2, difficulty: "medium" },
    { question: "Which love language is most common?", options: ["Words of Affirmation", "Physical Touch", "Quality Time", "Acts of Service"], correct: 2, difficulty: "medium" },
    { question: "What flower represents romance?", options: ["Tulip 🌷", "Rose 🌹", "Lily 🌸", "Sunflower 🌻"], correct: 1, difficulty: "easy" },
    { question: "Which city is the 'City of Love'?", options: ["Venice", "Barcelona", "Paris", "Prague"], correct: 2, difficulty: "easy" },
    { question: "How many emojis is ideal in a text?", options: ["0", "1-2", "3-5", "6+"], correct: 1, difficulty: "medium" },
    { question: "What zodiac sign is most romantic?", options: ["Leo ♌", "Libra ♎", "Pisces ♓", "Scorpio ♏"], correct: 2, difficulty: "hard" },
    { question: "What does 'ghosting' mean in dating?", options: ["Wearing white", "Disappearing suddenly", "Being shy", "Playing hard to get"], correct: 1, difficulty: "easy" },
    { question: "Avg dates before becoming exclusive?", options: ["3-4", "5-6", "7-10", "12+"], correct: 1, difficulty: "hard" },
    { question: "Most attractive trait on first date?", options: ["Humor", "Looks", "Intelligence", "Confidence"], correct: 0, difficulty: "medium" },
  ],
  friends: [
    { question: "Most popular group hangout activity?", options: ["Board games 🎲", "Sports ⚽", "Eating out 🍔", "Concerts 🎵"], correct: 2, difficulty: "easy" },
    { question: "How many close friends does avg person have?", options: ["1-2", "3-5", "6-8", "10+"], correct: 1, difficulty: "medium" },
    { question: "What makes friendships last longest?", options: ["Proximity", "Shared interests", "Trust & honesty", "Frequent contact"], correct: 2, difficulty: "medium" },
    { question: "Most popular party game?", options: ["Charades", "Cards Against Humanity", "Beer Pong", "Truth or Dare"], correct: 1, difficulty: "easy" },
    { question: "When is International Friendship Day?", options: ["Jan 1", "May 15", "Jul 30", "Sep 22"], correct: 2, difficulty: "hard" },
    { question: "Avg friends on social media?", options: ["150", "338", "500", "750"], correct: 1, difficulty: "hard" },
    { question: "#1 activity friends do together?", options: ["Watch TV", "Share meals", "Exercise", "Shopping"], correct: 1, difficulty: "medium" },
    { question: "Best icebreaker question?", options: ["What do you do?", "Where you from?", "What's your passion?", "Nice weather, right?"], correct: 2, difficulty: "easy" },
    { question: "Hours to form a close friendship?", options: ["50 hours", "100 hours", "200 hours", "500 hours"], correct: 2, difficulty: "hard" },
    { question: "What ruins friendships the most?", options: ["Distance", "Betrayal", "Time", "Money"], correct: 1, difficulty: "medium" },
  ],
  business: [
    { question: "What's the #1 networking skill?", options: ["Public speaking", "Active listening", "Body language", "Elevator pitch"], correct: 1, difficulty: "easy" },
    { question: "Best time to send a follow-up email?", options: ["Same day", "Next day", "Within 48 hours", "Next week"], correct: 2, difficulty: "medium" },
    { question: "Most valuable LinkedIn feature?", options: ["Posts", "Connections", "Recommendations", "Skills endorsements"], correct: 2, difficulty: "medium" },
    { question: "Avg time a recruiter reads a resume?", options: ["3 seconds", "7 seconds", "30 seconds", "2 minutes"], correct: 1, difficulty: "easy" },
    { question: "Ideal elevator pitch length?", options: ["15 seconds", "30 seconds", "1 minute", "2 minutes"], correct: 1, difficulty: "easy" },
    { question: "Most important soft skill for 2025?", options: ["Creativity", "Adaptability", "Communication", "Leadership"], correct: 1, difficulty: "hard" },
    { question: "What % of jobs are filled via networking?", options: ["30%", "50%", "70%", "90%"], correct: 2, difficulty: "hard" },
    { question: "Best day for business meetings?", options: ["Monday", "Tuesday", "Wednesday", "Thursday"], correct: 1, difficulty: "medium" },
    { question: "What kills first impressions fastest?", options: ["Bad breath", "Weak handshake", "Phone checking", "Late arrival"], correct: 3, difficulty: "medium" },
    { question: "Avg attention span in a meeting?", options: ["5 min", "10 min", "18 min", "30 min"], correct: 2, difficulty: "hard" },
  ],
};

const TOTAL_QUESTIONS = 5;
const TIME_PER_QUESTION = 10;

type Phase = "countdown" | "question" | "review" | "results";

/* ── Dynamic color temperature — warm if player winning, cool if opponent ── */
function useWinnerTint(playerScore: number, opponentScore: number) {
  if (playerScore > opponentScore) return { warm: 0.15, cool: 0 };
  if (opponentScore > playerScore) return { warm: 0, cool: 0.15 };
  return { warm: 0, cool: 0 };
}

/* ── Progressive intensity (increases with question progression and close scores) ── */
function useIntensity(currentQ: number, playerScore: number, opponentScore: number) {
  const progressFactor = (currentQ + 1) / TOTAL_QUESTIONS;
  const closeness = playerScore > 0 || opponentScore > 0
    ? 1 - Math.abs(playerScore - opponentScore) / Math.max(playerScore + opponentScore, 1)
    : 0.5;
  return 0.6 + progressFactor * 0.25 + closeness * 0.15;
}

/* ── SVG noise texture overlay ── */
function NoiseOverlay() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03] z-50" xmlns="http://www.w3.org/2000/svg">
      <filter id="tc-noise"><feTurbulence baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/></filter>
      <rect width="100%" height="100%" filter="url(#tc-noise)"/>
    </svg>
  );
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

/* ── Score odometer ── */
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

/* ── Floating background orbs with dynamic color temperature ── */
function FloatingOrbs({ c1, c2, intensity = 1, warmTint = 0, coolTint = 0 }: { c1: string; c2: string; intensity?: number; warmTint?: number; coolTint?: number }) {
  const tintColor1 = warmTint > 0 ? `rgba(251,191,36,${warmTint})` : coolTint > 0 ? `rgba(99,102,241,${coolTint})` : c1;
  const tintColor2 = warmTint > 0 ? `rgba(245,158,11,${warmTint})` : coolTint > 0 ? `rgba(139,92,246,${coolTint})` : c2;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 70 + i * 35,
            height: 70 + i * 35,
            background: `radial-gradient(circle, ${i % 2 === 0 ? c1 : c2} 0%, ${i % 2 === 0 ? tintColor1 : tintColor2} 40%, transparent 70%)`,
            opacity: 0.1 + intensity * 0.04,
            left: `${10 + i * 30}%`,
            top: `${25 + i * 18}%`,
          }}
          animate={{
            x: [0, 15 - i * 12, 0],
            y: [0, -12 + i * 8, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: Math.max(2, (6 + i * 2) / intensity), repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      {warmTint > 0 && (
        <motion.div
          className="absolute rounded-full"
          style={{ width: 100, height: 100, background: `radial-gradient(circle, rgba(251,191,36,${warmTint * 0.6}) 0%, transparent 70%)`, opacity: 0.2, right: "15%", top: "25%" }}
          animate={{ x: [0, -8, 0], y: [0, 8, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {coolTint > 0 && (
        <motion.div
          className="absolute rounded-full"
          style={{ width: 100, height: 100, background: `radial-gradient(circle, rgba(99,102,241,${coolTint * 0.6}) 0%, transparent 70%)`, opacity: 0.2, left: "15%", bottom: "25%" }}
          animate={{ x: [0, 8, 0], y: [0, -8, 0], scale: [1, 1.1, 1] }}
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
          animate={{ y: [0, p.yDrift], x: [0, p.xDrift], opacity: [0.4, 0] }}
          transition={{ duration: p.dur / intensity, repeat: Infinity, delay: p.delay }}
        />
      ))}
    </div>
  );
}

/* ── Sparkle particles ── */
function SparkleParticles({ color }: { color: string }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 2,
        dur: 1.5 + Math.random() * 2,
      })),
    []
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`, background: color }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [0, -25] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

/* ── Confetti for wins ── */
function ConfettiDots() {
  const dots = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: ["#fbbf24", "#f472b6", "#34d399", "#60a5fa", "#a78bfa", "#fb923c"][i % 6],
        size: 3 + Math.random() * 4,
        delay: Math.random() * 1.5,
        dur: 2 + Math.random() * 2,
      })),
    []
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((d) => (
        <motion.div
          key={d.id}
          className="absolute rounded-full"
          style={{ width: d.size, height: d.size, left: `${d.x}%`, top: "-4%", background: d.color }}
          animate={{ y: [0, 350], x: [0, (Math.random() - 0.5) * 50], rotate: [0, 360], opacity: [1, 0] }}
          transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

/* ── Fire emoji particles for streak ── */
function FireParticles() {
  const emojis = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: 30 + Math.random() * 40,
        size: 10 + Math.random() * 8,
        delay: Math.random() * 1.5,
        dur: 1.5 + Math.random() * 1.5,
      })),
    []
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
      {emojis.map((e) => (
        <motion.div
          key={e.id}
          className="absolute"
          style={{ left: `${e.x}%`, bottom: "10%", fontSize: e.size }}
          animate={{ y: [0, -80, -150], opacity: [0, 1, 0], x: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 40] }}
          transition={{ duration: e.dur, delay: e.delay, repeat: Infinity, ease: "easeOut" }}
        >
          🔥
        </motion.div>
      ))}
    </div>
  );
}

/* ── Animated counter hook ── */
function useAnimatedCounter(target: number, duration = 1200, delay = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = Date.now();
      const tick = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        // ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);
  return value;
}

/* ── Countdown particle burst ── */
function CountdownBurst({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ width: 5, height: 5, background: color }}
          initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
          animate={{
            scale: [0, 1.2, 0.5],
            opacity: [1, 0.6, 0],
            x: Math.cos((i / 12) * Math.PI * 2) * 80,
            y: Math.sin((i / 12) * Math.PI * 2) * 80,
          }}
          transition={{ duration: 0.7, ease: "easeOut" }}
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
          initial={{ scale: 0, opacity: 0.7 }}
          animate={{ scale: 3.5 + r * 1.2, opacity: 0 }}
          transition={{ duration: 0.8, delay: r * 0.1, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

/* ── Green ripple effect for correct answer ── */
function CorrectRipple() {
  return (
    <motion.div
      className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {[0, 1, 2].map((r) => (
        <motion.div
          key={r}
          className="absolute rounded-full"
          style={{
            width: 20,
            height: 20,
            left: "50%",
            top: "50%",
            marginLeft: -10,
            marginTop: -10,
            background: "rgba(16,185,129,0.15)",
            border: "1px solid rgba(16,185,129,0.3)",
          }}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 15, opacity: 0 }}
          transition={{ duration: 0.8, delay: r * 0.15, ease: "easeOut" }}
        />
      ))}
    </motion.div>
  );
}

/* ── Radial wipe transition between questions ── */
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
      className="absolute -top-3.5 left-1/2 z-20 pointer-events-none"
      style={{ marginLeft: -6 }}
      animate={{ y: [0, -2, 0], rotate: [0, 5, -5, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <Crown className="w-3 h-3 text-amber-400" style={{ filter: "drop-shadow(0 0 3px rgba(251,191,36,0.6))" }} />
    </motion.div>
  );
}

/* ── Difficulty stars indicator ── */
function DifficultyStars({ difficulty }: { difficulty: "easy" | "medium" | "hard" }) {
  const count = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
  const color = difficulty === "easy" ? "#34d399" : difficulty === "medium" ? "#fbbf24" : "#f87171";
  return (
    <div className="flex items-center justify-center gap-0.5 mt-1">
      {Array.from({ length: 3 }).map((_, i) => (
        <Star
          key={i}
          className="w-2.5 h-2.5"
          style={{
            color: i < count ? color : "rgba(51,65,85,0.4)",
            fill: i < count ? color : "transparent",
            filter: i < count ? `drop-shadow(0 0 2px ${color})` : "none",
          }}
        />
      ))}
    </div>
  );
}

/* ── Thinking dots animation ── */
function ThinkingDots() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center gap-1 py-2"
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-slate-400"
          animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
        />
      ))}
    </motion.div>
  );
}

export default function MapTriviaClash({ opponent, category, onComplete, onBack }: MapGameChildProps) {
  const theme = THEMES[category];
  const opponentName = opponent.firstName;
  const allQuestions = QUESTIONS[category];

  // ── Game state ──
  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);

  // ── GO! flash state ──
  const [showGo, setShowGo] = useState(false);

  // ── Transition wipe ──
  const [showWipe, setShowWipe] = useState(false);

  // ── Thinking state (after selecting, before reveal) ──
  const [showThinking, setShowThinking] = useState(false);

  // ── Answers + scores ──
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [opponentAnswer, setOpponentAnswer] = useState<number | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [playerAnswers, setPlayerAnswers] = useState<(number | null)[]>([]);
  const [opponentAnswers, setOpponentAnswers] = useState<(number | null)[]>([]);
  const [streak, setStreak] = useState(0);

  // ── Pressed answer for focus dimming ──
  const [pressedAnswer, setPressedAnswer] = useState<number | null>(null);

  // ── Refs to avoid stale closures ──
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const opponentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answeredRef = useRef(false);
  const currentQRef = useRef(currentQ);
  const questionsRef = useRef(questions);

  useEffect(() => { currentQRef.current = currentQ; }, [currentQ]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);

  // ── Dynamic color temperature ──
  const winnerTint = useWinnerTint(playerScore, opponentScore);

  // ── Progressive intensity ──
  const intensity = useIntensity(currentQ, playerScore, opponentScore);

  // ── Depth-of-field: blur score bar during review reveal ──
  const isFocusMoment = phase === "review";

  // ── Initialize questions on mount ──
  useEffect(() => {
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, TOTAL_QUESTIONS);
    setQuestions(shuffled);
  }, [allQuestions]);

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
              setPhase("question");
            }, 700);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // ── Question timer + opponent AI ──
  useEffect(() => {
    if (phase === "question") {
      setTimeLeft(TIME_PER_QUESTION);
      setSelectedAnswer(null);
      setOpponentAnswer(null);
      setPressedAnswer(null);
      setShowThinking(false);
      answeredRef.current = false;

      // Countdown timer
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            if (!answeredRef.current) {
              answeredRef.current = true;
              setPlayerAnswers((pa) => [...pa, null]);
              setStreak(0);
              finalizeQuestion();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Opponent AI — 60-85% accuracy, answers 2-6s after question
      const opponentDelay = 2000 + Math.random() * 4000;
      const accuracy = 0.6 + Math.random() * 0.25; // 60-85%

      opponentTimerRef.current = setTimeout(() => {
        const qq = questionsRef.current[currentQRef.current];
        if (!qq) return;
        const isCorrect = Math.random() < accuracy;
        let answer: number;
        if (isCorrect) {
          answer = qq.correct;
        } else {
          const wrongOptions = qq.options.map((_, i) => i).filter((i) => i !== qq.correct);
          answer = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
        }
        setOpponentAnswer(answer);
      }, opponentDelay);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (opponentTimerRef.current) clearTimeout(opponentTimerRef.current);
      };
    }
  }, [phase, currentQ]);

  // ── Finalize question (generate opponent answer if missing, transition to review) ──
  const finalizeQuestion = useCallback(() => {
    // Show thinking dots briefly before revealing
    setShowThinking(true);
    setTimeout(() => {
      setShowThinking(false);
      const qq = questionsRef.current[currentQRef.current];
      if (!qq) {
        setPhase("review");
        return;
      }

      setOpponentAnswer((prev) => {
        if (prev !== null) {
          // Already answered — score them
          if (prev === qq.correct) {
            const bonus = Math.round(Math.random() * 50);
            setOpponentScore((s) => s + 100 + bonus);
          }
          setOpponentAnswers((a) => [...a, prev]);
          return prev;
        }
        // Generate answer now
        const accuracy = 0.6 + Math.random() * 0.25;
        const isCorrect = Math.random() < accuracy;
        let answer: number;
        if (isCorrect) {
          answer = qq.correct;
        } else {
          const wrongOptions = qq.options.map((_, i) => i).filter((i) => i !== qq.correct);
          answer = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
        }
        if (answer === qq.correct) {
          const bonus = Math.round(Math.random() * 50);
          setOpponentScore((s) => s + 100 + bonus);
        }
        setOpponentAnswers((a) => [...a, answer]);
        return answer;
      });

      setPhase("review");
    }, 600); // Brief thinking delay
  }, []);

  // ── Player selects answer ──
  const handleSelectAnswer = useCallback(
    (idx: number) => {
      if (answeredRef.current) return;
      answeredRef.current = true;
      setSelectedAnswer(idx);
      setPressedAnswer(idx);
      if (timerRef.current) clearInterval(timerRef.current);

      const qq = questions[currentQ];
      if (!qq) return;

      const isCorrect = idx === qq.correct;
      if (isCorrect) {
        const timeBonus = timeLeft * 10;
        const streakBonus = streak * 10;
        setPlayerScore((s) => s + 100 + timeBonus + streakBonus);
        setStreak((s) => s + 1);
      } else {
        setStreak(0);
      }

      setPlayerAnswers((pa) => [...pa, idx]);
      finalizeQuestion();
    },
    [questions, currentQ, timeLeft, streak, finalizeQuestion]
  );

  // ── Next question ──
  const handleNextQuestion = useCallback(() => {
    if (currentQ + 1 >= TOTAL_QUESTIONS) {
      setPhase("results");
    } else {
      // Radial wipe transition
      setShowWipe(true);
      setTimeout(() => {
        setShowWipe(false);
        setCurrentQ((q) => q + 1);
        setPhase("question");
      }, 400);
    }
  }, [currentQ]);

  // ── Play again ──
  const handlePlayAgain = useCallback(() => {
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, TOTAL_QUESTIONS);
    setQuestions(shuffled);
    setCurrentQ(0);
    setPlayerScore(0);
    setOpponentScore(0);
    setPlayerAnswers([]);
    setOpponentAnswers([]);
    setSelectedAnswer(null);
    setOpponentAnswer(null);
    setStreak(0);
    setPressedAnswer(null);
    setShowThinking(false);
    answeredRef.current = false;
    setPhase("countdown");
  }, [allQuestions]);

  const q = questions[currentQ];
  const playerWon = playerScore > opponentScore;
  const isTie = playerScore === opponentScore;
  const avatarUrl = opponent.profilePhoto || undefined;

  const difficultyMeta: Record<string, { color: string; bg: string; border: string }> = {
    easy: { color: "#34d399", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)" },
    medium: { color: "#fbbf24", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" },
    hard: { color: "#f87171", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" },
  };

  const countdownColors: Record<number, { text: string; glow: string }> = {
    3: { text: theme.hex, glow: theme.glow },
    2: { text: "#fbbf24", glow: "rgba(251,191,36,0.5)" },
    1: { text: "#f43f5e", glow: "rgba(244,63,94,0.5)" },
  };

  // Streak glow intensity for question card border
  const streakGlow = streak >= 2 ? Math.min(streak * 0.15, 0.6) : 0;

  // Screen shake amplitude scales with intensity
  const shakeAmplitude = Math.round(4 * intensity);

  return (
    <motion.div
      className="flex flex-col w-full text-white select-none overflow-hidden relative"
      /* Cinematic zoom */
      initial={{ scale: 1.02 }}
      animate={{ scale: 1 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      /* Screen shake on review (wrong answer) — amplitude scales with intensity */
      {...(phase === "review" && selectedAnswer !== null && selectedAnswer !== q?.correct ? {
        animate: { x: [0, -shakeAmplitude, shakeAmplitude * 1.5, -shakeAmplitude * 0.75, shakeAmplitude * 0.5, 0], scale: 1 },
        transition: { duration: 0.4 },
      } : {})}
    >
      {/* SVG Noise Texture */}
      <NoiseOverlay />

      {/* Ambient floating orbs with dynamic color temperature */}
      <FloatingOrbs
        c1={theme.hex}
        c2={theme.hexAlt}
        intensity={intensity}
        warmTint={winnerTint.warm}
        coolTint={winnerTint.cool}
      />

      {/* Ambient dust motes */}
      <AmbientParticles
        intensity={intensity}
        color={winnerTint.warm > 0 ? "rgba(251,191,36,0.5)" : winnerTint.cool > 0 ? "rgba(139,92,246,0.4)" : "rgba(148,163,184,0.3)"}
      />

      {/* Radial wipe transition */}
      <AnimatePresence>
        {showWipe && <RadialWipe color={theme.hex} />}
      </AnimatePresence>

      {/* ── PHASE: COUNTDOWN ── */}
      <AnimatePresence mode="wait">
        {phase === "countdown" && (
          <motion.div
            key="countdown"
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

            {/* Radial glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(circle at 50% 50%, ${theme.glowSoft} 0%, transparent 60%)` }}
            />

            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center gap-2 mb-4 relative z-10"
            >
              <Brain className="w-4 h-4" style={{ color: theme.hex }} />
              <p className="text-slate-500 uppercase font-black" style={{ letterSpacing: "0.3em", fontSize: "10px" }}>Get Ready!</p>
            </motion.div>

            {/* GO! flash */}
            <AnimatePresence>
              {showGo && (
                <>
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
                    className="absolute z-40 text-6xl uppercase"
                    style={{
                      fontWeight: 900,
                      letterSpacing: "0.15em",
                      background: `linear-gradient(135deg, ${theme.hex}, #fbbf24, ${theme.hexAlt})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      textShadow: `0 0 40px ${theme.glow}`,
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
                  initial={{ scale: 0, opacity: 0, rotate: -10 }}
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
                  <ShockwaveRing color={countdownColors[countdown]?.glow || "white"} />
                  <CountdownBurst color={countdownColors[countdown]?.glow || "white"} />
                  <div
                    className="text-8xl relative z-10"
                    style={{
                      color: countdownColors[countdown]?.text || "white",
                      textShadow: `0 0 40px ${countdownColors[countdown]?.glow || "transparent"}, 0 0 80px ${countdownColors[countdown]?.glow || "transparent"}, 0 0 120px ${countdownColors[countdown]?.glow || "transparent"}`,
                      fontWeight: 900,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {countdown}
                  </div>
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
              🧠 vs {opponentName}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PHASE: QUESTION / REVIEW ── */}
      <AnimatePresence mode="wait">
        {(phase === "question" || phase === "review") && q && (
          <motion.div
            key="gameplay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col relative"
          >
            {/* Score bar — blurs during review for depth-of-field effect */}
            <div
              className="flex items-center gap-2 px-4 pt-3 pb-2 relative z-10"
              style={{
                filter: isFocusMoment ? "blur(1.5px)" : "none",
                transition: "filter 0.3s",
              }}
            >
              {/* Player */}
              <div className="flex items-center gap-2 flex-1">
                <div className="relative">
                  {/* Leading crown */}
                  {playerScore > opponentScore && <LeadingCrown />}
                  {/* Orbiting glow for leader */}
                  {playerScore > opponentScore && (
                    <motion.div
                      className="absolute -inset-0.5 rounded-full"
                      style={{ border: `1.5px solid ${theme.hex}`, opacity: 0.4 }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                  <div
                    className="w-8 h-8 rounded-full bg-slate-800/80 backdrop-blur-sm flex items-center justify-center overflow-hidden"
                    style={{
                      border: `1.5px solid ${playerScore > opponentScore ? theme.hex : "rgba(51,65,85,0.5)"}`,
                      boxShadow: playerScore > opponentScore ? `0 0 12px ${theme.glow}` : "none",
                    }}
                  >
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
                <div>
                  <div className="text-xs font-black" style={{ fontVariantNumeric: "tabular-nums" }}>
                    <ScoreWithRipple value={playerScore} color="white" rippleColor="#34d399" />
                  </div>
                  <p className="text-slate-500 font-bold uppercase" style={{ letterSpacing: "0.25em", fontSize: "7px" }}>You</p>
                </div>
              </div>

              {/* Timer pill with shimmer + pulsing ring */}
              <div className="relative">
                {/* Always-present pulsing ring behind timer */}
                <motion.div
                  className="absolute -inset-1 rounded-full"
                  style={{
                    border: `1.5px solid ${timeLeft <= 3 && phase === "question" ? "rgba(239,68,68,0.4)" : "rgba(148,163,184,0.15)"}`,
                  }}
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{ duration: timeLeft <= 3 && phase === "question" ? 0.5 : 1.5, repeat: Infinity }}
                />
                <div
                  className="relative px-3.5 py-1.5 rounded-full overflow-hidden"
                  style={{
                    background: timeLeft <= 3 && phase === "question"
                      ? "rgba(239,68,68,0.1)"
                      : "rgba(30,41,59,0.6)",
                    border: `1px solid ${timeLeft <= 3 && phase === "question" ? "rgba(239,68,68,0.4)" : "rgba(51,65,85,0.5)"}`,
                  }}
                >
                  {/* Animated shimmer gradient */}
                  {phase === "question" && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `linear-gradient(90deg, transparent 0%, ${
                          timeLeft <= 3 ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)"
                        } 50%, transparent 100%)`,
                      }}
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                  <div className="flex items-center gap-1.5 relative z-10">
                    <Timer
                      className="w-3.5 h-3.5"
                      style={{ color: timeLeft <= 3 && phase === "question" ? "#f87171" : "#94a3b8" }}
                    />
                    <span
                      className="text-sm font-black"
                      style={{
                        color: timeLeft <= 3 && phase === "question" ? "#f87171" : "white",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {phase === "review" ? "—" : timeLeft}
                    </span>
                  </div>
                  {/* Timer urgency pulse */}
                  {timeLeft <= 3 && phase === "question" && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ border: "1px solid rgba(239,68,68,0.4)" }}
                      animate={{ opacity: [0, 0.8, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                  )}
                </div>
              </div>

              {/* Opponent */}
              <div className="flex items-center gap-2 flex-1 justify-end">
                <div className="text-right">
                  <div className="text-xs font-black" style={{ fontVariantNumeric: "tabular-nums" }}>
                    <ScoreWithRipple value={opponentScore} color="white" rippleColor="#fb7185" />
                  </div>
                  <p className="text-slate-500 font-bold uppercase" style={{ letterSpacing: "0.25em", fontSize: "7px" }}>{opponentName.toUpperCase()}</p>
                </div>
                <div className="relative">
                  {/* Leading crown */}
                  {opponentScore > playerScore && <LeadingCrown />}
                  {opponentScore > playerScore && (
                    <motion.div
                      className="absolute -inset-0.5 rounded-full"
                      style={{ border: `1.5px solid ${theme.hex}`, opacity: 0.4 }}
                      animate={{ rotate: -360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                  <div
                    className="w-8 h-8 rounded-full overflow-hidden bg-slate-800/80 backdrop-blur-sm flex items-center justify-center"
                    style={{
                      border: `1.5px solid ${opponentScore > playerScore ? theme.hex : "rgba(51,65,85,0.5)"}`,
                      boxShadow: opponentScore > playerScore ? `0 0 12px ${theme.glow}` : "none",
                    }}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={opponentName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Timer progress bar */}
            <div className="px-4 pb-1 relative z-10">
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ background: "rgba(30,41,59,0.6)" }}
              >
                <motion.div
                  className="h-full rounded-full relative"
                  style={{
                    background:
                      timeLeft <= 3 && phase === "question"
                        ? "linear-gradient(90deg, #ef4444, #f87171)"
                        : `linear-gradient(90deg, ${theme.hex}, ${theme.hexAlt})`,
                    width: phase === "review" ? "0%" : `${(timeLeft / TIME_PER_QUESTION) * 100}%`,
                  }}
                  initial={false}
                  animate={{ width: phase === "review" ? "0%" : `${(timeLeft / TIME_PER_QUESTION) * 100}%` }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Shimmer on timer bar */}
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                    }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
              </div>
            </div>

            {/* Progress dots with connecting gradient line */}
            <div className="flex items-center justify-center gap-2 py-2 relative z-10">
              {/* Connecting line */}
              <div className="absolute top-1/2 left-[38%] right-[38%] h-px" style={{ background: `linear-gradient(90deg, ${theme.hex}33, ${theme.hexAlt}33)`, transform: "translateY(-50%)" }} />
              {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => {
                let dotBg = "rgba(30,41,59,0.8)";
                let dotBorder = "rgba(51,65,85,0.3)";
                let dotShadow = "none";
                if (i < playerAnswers.length) {
                  const wasCorrect = playerAnswers[i] !== null && playerAnswers[i] === questions[i]?.correct;
                  if (wasCorrect) {
                    dotBg = "#10b981";
                    dotBorder = "#34d399";
                    dotShadow = "0 0 6px rgba(16,185,129,0.4)";
                  } else {
                    dotBg = "#ef4444";
                    dotBorder = "#f87171";
                    dotShadow = "0 0 6px rgba(239,68,68,0.4)";
                  }
                } else if (i === currentQ) {
                  dotBg = theme.hex;
                  dotBorder = theme.hexAlt;
                  dotShadow = `0 0 8px ${theme.glow}`;
                }
                return (
                  <motion.div
                    key={i}
                    animate={i === currentQ ? { scale: [1, 1.3, 1] } : {}}
                    transition={i === currentQ ? { duration: 1.5, repeat: Infinity } : {}}
                    className="w-2.5 h-2.5 rounded-full relative z-10"
                    style={{
                      background: dotBg,
                      border: `1px solid ${dotBorder}`,
                      boxShadow: dotShadow,
                    }}
                  />
                );
              })}
            </div>

            {/* Streak badge with fire particles */}
            <AnimatePresence>
              {streak >= 2 && (
                <motion.div
                  key={`streak-${streak}`}
                  initial={{ scale: 0, opacity: 0, y: -10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="flex items-center justify-center gap-1.5 pb-1 relative z-10"
                >
                  {/* Fire emoji particles floating up */}
                  <FireParticles />
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      rotate: [0, -10, 10, 0],
                    }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  >
                    <Flame className="w-4 h-4 text-orange-400" />
                  </motion.div>
                  <span
                    className="text-[10px] font-black uppercase"
                    style={{
                      letterSpacing: "0.15em",
                      background: "linear-gradient(135deg, #f97316, #fbbf24)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      textShadow: "0 0 10px rgba(249,115,22,0.3)",
                    }}
                  >
                    {streak} streak! 🔥
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Question card — 3D card-flip rotation from right */}
            <div className="px-4 py-2 relative z-10" style={{ perspective: "800px" }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQ}
                  initial={{ x: 80, opacity: 0, rotateY: 25 }}
                  animate={{ x: 0, opacity: 1, rotateY: 0 }}
                  exit={{ x: -80, opacity: 0, rotateY: -25 }}
                  transition={{ duration: 0.4, type: "spring", stiffness: 180, damping: 22 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Question number + difficulty */}
                  <div className="flex items-center justify-center gap-2.5 mb-3">
                    <span className="font-black text-slate-500 uppercase" style={{ letterSpacing: "0.25em", fontSize: "7px" }}>
                      Q{currentQ + 1}/{TOTAL_QUESTIONS}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full font-black uppercase"
                      style={{
                        color: difficultyMeta[q.difficulty]?.color,
                        background: difficultyMeta[q.difficulty]?.bg,
                        border: `1px solid ${difficultyMeta[q.difficulty]?.border}`,
                        letterSpacing: "0.25em",
                        fontSize: "7px",
                      }}
                    >
                      {q.difficulty}
                    </span>
                  </div>

                  {/* Difficulty stars */}
                  <DifficultyStars difficulty={q.difficulty} />

                  {/* Glassmorphic question text card — golden border glow on streak */}
                  <div
                    className="rounded-xl p-4 mb-3 mt-2 backdrop-blur-md"
                    style={{
                      background: "rgba(15,23,42,0.6)",
                      border: `1px solid ${streakGlow > 0 ? `rgba(251,191,36,${streakGlow})` : "rgba(255,255,255,0.06)"}`,
                      boxShadow: streakGlow > 0
                        ? `0 0 ${Math.round(streakGlow * 30)}px rgba(251,191,36,${streakGlow * 0.5}), inset 0 0 ${Math.round(streakGlow * 15)}px rgba(251,191,36,${streakGlow * 0.1})`
                        : "0 4px 20px rgba(0,0,0,0.2)",
                      transform: "perspective(800px) rotateX(2deg)",
                      transition: "border-color 0.3s, box-shadow 0.3s",
                    }}
                  >
                    <p className="text-sm text-white text-center leading-relaxed" style={{ fontWeight: 900 }}>{q.question}</p>
                  </div>

                  {/* Thinking dots — shown after selecting before reveal */}
                  <AnimatePresence>
                    {showThinking && <ThinkingDots />}
                  </AnimatePresence>

                  {/* Answer options — staggered from bottom with 60ms delay */}
                  <div className="space-y-2">
                    {q.options.map((option, idx) => {
                      const isReview = phase === "review";
                      const isCorrectAnswer = idx === q.correct;
                      const isPlayerWrongAnswer = isReview && idx === selectedAnswer && idx !== q.correct;
                      const isSelected = selectedAnswer === idx;
                      const letter = String.fromCharCode(65 + idx);

                      // ── Focus dimming: when pressing an answer, dim others ──
                      const isDimmedByFocus = !isReview && pressedAnswer !== null && pressedAnswer !== idx;

                      // Compute styles
                      let bgStyle = "rgba(15,23,42,0.4)";
                      let borderStyle = "rgba(51,65,85,0.5)";
                      let shadowStyle = "none";
                      let textColor = "#e2e8f0";
                      let letterBg = "rgba(30,41,59,0.8)";
                      let letterColor = "#94a3b8";
                      let opacity = 1;

                      if (isReview) {
                        if (isCorrectAnswer) {
                          bgStyle = "rgba(16,185,129,0.08)";
                          borderStyle = "rgba(16,185,129,0.5)";
                          shadowStyle = "0 0 15px rgba(16,185,129,0.15), inset 0 0 15px rgba(16,185,129,0.05)";
                          textColor = "#6ee7b7";
                          letterBg = "#10b981";
                          letterColor = "#ffffff";
                        } else if (isPlayerWrongAnswer) {
                          bgStyle = "rgba(239,68,68,0.08)";
                          borderStyle = "rgba(239,68,68,0.5)";
                          shadowStyle = "0 0 15px rgba(239,68,68,0.15)";
                          textColor = "#fca5a5";
                          letterBg = "#ef4444";
                          letterColor = "#ffffff";
                        } else {
                          opacity = 0.35;
                        }
                      } else if (isSelected) {
                        bgStyle = theme.glowSoft;
                        borderStyle = theme.hex;
                        shadowStyle = `0 0 15px ${theme.glow}`;
                      }

                      // Apply focus dimming
                      if (isDimmedByFocus) {
                        opacity = 0.5;
                      }

                      return (
                        <motion.button
                          key={idx}
                          onClick={() => handleSelectAnswer(idx)}
                          disabled={answeredRef.current || isReview}
                          initial={{ y: 30, opacity: 0 }}
                          animate={{
                            y: 0,
                            opacity: opacity,
                            /* Crack/shatter effect for wrong answer */
                            ...(isPlayerWrongAnswer
                              ? { scale: [1, 0.97, 1.01, 0.98, 1] }
                              : {}),
                          }}
                          transition={{
                            delay: idx * 0.06,
                            duration: 0.25,
                            ...(isPlayerWrongAnswer ? { duration: 0.4 } : {}),
                          }}
                          whileHover={
                            !isReview && !answeredRef.current
                              ? { scale: 1.02, transition: { duration: 0.15 } }
                              : {}
                          }
                          whileTap={
                            !isReview && !answeredRef.current
                              ? { scale: 0.93 }
                              : {}
                          }
                          className="w-full py-3 px-4 rounded-xl text-left flex items-center gap-3 transition-colors backdrop-blur-sm relative overflow-hidden"
                          style={{
                            background: bgStyle,
                            border: `1px solid ${borderStyle}`,
                            boxShadow: shadowStyle,
                            opacity,
                            transform: "perspective(600px) translateZ(0)",
                            transition: "opacity 0.2s",
                          }}
                        >
                          {/* Correct answer green ripple */}
                          {isReview && isCorrectAnswer && <CorrectRipple />}

                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 relative z-10"
                            style={{
                              background: letterBg,
                              color: letterColor,
                            }}
                          >
                            {isReview && isCorrectAnswer ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : isPlayerWrongAnswer ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              letter
                            )}
                          </div>
                          <span className="text-xs font-bold relative z-10" style={{ color: textColor, textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
                            {option}
                          </span>

                          {/* Opponent answered indicator */}
                          {isReview && opponentAnswer === idx && (
                            <div className="ml-auto shrink-0 relative z-10">
                              <div
                                className="w-5 h-5 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center"
                                style={{ border: `1.5px solid ${theme.hex}` }}
                              >
                                {avatarUrl ? (
                                  <img src={avatarUrl} alt={opponentName} className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-3 h-3 text-slate-400" />
                                )}
                              </div>
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Review: correct/wrong feedback pulse */}
                  {isReviewFeedback(phase, selectedAnswer, q) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 pointer-events-none rounded-xl"
                      style={{
                        background:
                          selectedAnswer === q.correct
                            ? "radial-gradient(circle at 50% 50%, rgba(16,185,129,0.1) 0%, transparent 70%)"
                            : "radial-gradient(circle at 50% 50%, rgba(239,68,68,0.08) 0%, transparent 70%)",
                      }}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Review footer */}
            <AnimatePresence>
              {phase === "review" && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="px-4 pb-3 pt-2 relative z-10"
                >
                  {/* Result line */}
                  <div className="flex items-center justify-between mb-3">
                    <motion.div
                      initial={{ x: -15, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="flex items-center gap-1.5"
                    >
                      {selectedAnswer === q?.correct ? (
                        <>
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.5, repeat: 2 }}
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          </motion.div>
                          <span
                            className="text-xs font-black uppercase"
                            style={{
                              letterSpacing: "0.15em",
                              background: "linear-gradient(135deg, #34d399, #10b981)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                            }}
                          >
                            Correct!
                          </span>
                        </>
                      ) : (
                        <>
                          <motion.div
                            animate={{ x: [0, -3, 3, -3, 3, 0] }}
                            transition={{ duration: 0.4 }}
                          >
                            <XCircle className="w-4 h-4 text-red-400" />
                          </motion.div>
                          <span className="text-xs font-black text-red-400 uppercase" style={{ letterSpacing: "0.15em" }}>
                            {selectedAnswer === null ? "Time's Up!" : "Wrong!"}
                          </span>
                        </>
                      )}
                    </motion.div>
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold" style={{ fontSize: "10px" }}>
                      {opponentName}:
                      {opponentAnswer === q?.correct ? (
                        <span className="text-emerald-400">✓</span>
                      ) : (
                        <span className="text-red-400">✗</span>
                      )}
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={handleNextQuestion}
                    className={`w-full py-3.5 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white text-xs uppercase transition-transform flex items-center justify-center gap-2`}
                    style={{
                      boxShadow: `0 4px 25px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                      fontWeight: 900,
                      letterSpacing: "0.15em",
                      transform: "perspective(600px) translateZ(0)",
                      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                    }}
                  >
                    {currentQ + 1 >= TOTAL_QUESTIONS ? (
                      <>
                        <Trophy className="w-4 h-4" />
                        <span>See Results</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Next Question</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PHASE: RESULTS ── */}
      <AnimatePresence mode="wait">
        {phase === "results" && (
          <ResultsScreen
            playerScore={playerScore}
            opponentScore={opponentScore}
            playerWon={playerWon}
            isTie={isTie}
            opponentName={opponentName}
            avatarUrl={avatarUrl}
            theme={theme}
            playerAnswers={playerAnswers}
            questions={questions}
            handlePlayAgain={handlePlayAgain}
            onComplete={onComplete}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Helper: check if we should show review feedback overlay ── */
function isReviewFeedback(phase: Phase, selectedAnswer: number | null, q: Question | undefined): boolean {
  return phase === "review" && q !== undefined;
}

/* ── Results screen (separate to use hooks) ── */
function ResultsScreen({
  playerScore,
  opponentScore,
  playerWon,
  isTie,
  opponentName,
  avatarUrl,
  theme,
  playerAnswers,
  questions,
  handlePlayAgain,
  onComplete,
}: {
  playerScore: number;
  opponentScore: number;
  playerWon: boolean;
  isTie: boolean;
  opponentName: string;
  avatarUrl: string | undefined;
  theme: (typeof THEMES)[keyof typeof THEMES];
  playerAnswers: (number | null)[];
  questions: Question[];
  handlePlayAgain: () => void;
  onComplete: () => void;
}) {
  const animPlayerScore = useAnimatedCounter(playerScore, 1200, 500);
  const animOpponentScore = useAnimatedCounter(opponentScore, 1200, 700);

  const correctCount = playerAnswers.filter((a, i) => a === questions[i]?.correct).length;
  const bestStreak = Math.max(
    0,
    ...playerAnswers.reduce<number[]>((acc, a, i) => {
      const isCorrect = a !== null && a === questions[i]?.correct;
      const last = acc.length > 0 ? acc[acc.length - 1] : 0;
      acc.push(isCorrect ? last + 1 : 0);
      return acc;
    }, [])
  );

  /* Animated gradient border rotation */
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
    <motion.div
      key="results"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center px-4 py-5 relative"
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
        {/* Animated gradient border card */}
        <div
          className="relative rounded-2xl p-[1.5px]"
          style={{
            background: playerWon
              ? `conic-gradient(from ${rotation}deg, #fbbf24, #f59e0b, #fbbf24)`
              : `conic-gradient(from ${rotation}deg, ${theme.hex}, ${theme.hexAlt}, ${theme.hex})`,
          }}
        >
          <div
            className="rounded-2xl overflow-hidden backdrop-blur-md"
            style={{
              background: "rgba(15,23,42,0.92)",
            }}
          >
            {/* Top gradient bar */}
            <div
              className="h-1.5"
              style={{ background: `linear-gradient(90deg, ${theme.hex}, ${theme.hexAlt})` }}
            />
            <div className="p-5 text-center">
              {/* Result icon */}
              <motion.div
                initial={{ y: -25, scale: 0 }}
                animate={{ y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.15 }}
                className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center relative"
                style={{
                  background: playerWon
                    ? "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.1))"
                    : isTie
                    ? "rgba(30,41,59,0.8)"
                    : "rgba(239,68,68,0.1)",
                  border: `2px solid ${playerWon ? "rgba(251,191,36,0.4)" : isTie ? "rgba(51,65,85,0.5)" : "rgba(239,68,68,0.3)"}`,
                  boxShadow: playerWon ? "0 0 30px rgba(251,191,36,0.2)" : "none",
                }}
              >
                {playerWon ? (
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -5, 0] }}
                    transition={{ duration: 1, delay: 0.4 }}
                  >
                    <Trophy className="w-8 h-8 text-amber-400" />
                  </motion.div>
                ) : isTie ? (
                  <Users className="w-8 h-8 text-slate-400" />
                ) : (
                  <span className="text-3xl">😢</span>
                )}

                {/* Winner crown */}
                {playerWon && (
                  <motion.div
                    className="absolute -top-4"
                    animate={{ y: [0, -2, 0], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Crown className="w-5 h-5 text-amber-400" style={{ filter: "drop-shadow(0 0 5px rgba(251,191,36,0.6))" }} />
                  </motion.div>
                )}
              </motion.div>

              {/* Title gradient text with multi-color for winner */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-xl uppercase mb-1"
                style={{
                  fontWeight: 900,
                  letterSpacing: "0.15em",
                  background: playerWon
                    ? "linear-gradient(135deg, #fbbf24, #f59e0b, #fbbf24)"
                    : isTie
                    ? "linear-gradient(135deg, #94a3b8, #64748b)"
                    : "linear-gradient(135deg, #f87171, #ef4444)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: playerWon ? "0 0 30px rgba(251,191,36,0.3)" : "none",
                }}
              >
                {playerWon ? "You Win!" : isTie ? "It's a Tie!" : "Defeated!"}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="font-bold uppercase mb-4"
                style={{
                  color: playerWon ? "#fbbf24" : isTie ? "#94a3b8" : "#f87171",
                  letterSpacing: "0.25em",
                  fontSize: "7px",
                }}
              >
                {playerWon ? "Brain power reigns supreme" : isTie ? "Evenly matched" : `${opponentName} outsmarted you`}
              </motion.p>

              {/* Score comparison with animated counters */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-3 gap-2 mb-4"
              >
                <div
                  className="rounded-xl p-3 backdrop-blur-sm"
                  style={{
                    background: "rgba(30,41,59,0.5)",
                    border: `1px solid ${playerWon ? "rgba(251,191,36,0.3)" : "rgba(51,65,85,0.4)"}`,
                    boxShadow: playerWon ? "0 0 15px rgba(251,191,36,0.1)" : "none",
                    transform: "perspective(800px) rotateX(2deg)",
                  }}
                >
                  <div className="w-7 h-7 rounded-full bg-slate-700/60 flex items-center justify-center mx-auto mb-1.5">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <p
                    className="text-xl font-black"
                    style={{ color: playerWon ? "#fbbf24" : "white", fontVariantNumeric: "tabular-nums" }}
                  >
                    {animPlayerScore}
                  </p>
                  <p className="text-slate-500 uppercase font-bold" style={{ letterSpacing: "0.25em", fontSize: "6px" }}>You</p>
                </div>
                <div className="flex items-center justify-center">
                  <span className="font-black text-slate-600 uppercase" style={{ fontSize: "10px", letterSpacing: "0.15em" }}>vs</span>
                </div>
                <div
                  className="rounded-xl p-3 backdrop-blur-sm"
                  style={{
                    background: "rgba(30,41,59,0.5)",
                    border: `1px solid ${!playerWon && !isTie ? "rgba(251,191,36,0.3)" : "rgba(51,65,85,0.4)"}`,
                    boxShadow: !playerWon && !isTie ? "0 0 15px rgba(251,191,36,0.1)" : "none",
                    transform: "perspective(800px) rotateX(2deg)",
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full overflow-hidden bg-slate-800 mx-auto mb-1.5 flex items-center justify-center"
                    style={{ border: `1.5px solid ${theme.hex}` }}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={opponentName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <p
                    className="text-xl font-black"
                    style={{ color: !playerWon && !isTie ? "#fbbf24" : "white", fontVariantNumeric: "tabular-nums" }}
                  >
                    {animOpponentScore}
                  </p>
                  <p className="text-slate-500 uppercase font-bold" style={{ letterSpacing: "0.25em", fontSize: "6px" }}>{opponentName}</p>
                </div>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="flex items-center justify-center gap-5 mb-4"
              >
                <div className="text-center">
                  <p className="text-sm font-black text-emerald-400">{correctCount}/{TOTAL_QUESTIONS}</p>
                  <p className="text-slate-500 uppercase font-bold" style={{ letterSpacing: "0.25em", fontSize: "6px" }}>Correct</p>
                </div>
                <div className="w-px h-6" style={{ background: "rgba(30,41,59,0.8)" }} />
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {bestStreak >= 2 && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      >
                        <Flame className="w-3 h-3 text-orange-400" />
                      </motion.div>
                    )}
                    <p className="text-sm font-black text-orange-400">{bestStreak}</p>
                  </div>
                  <p className="text-slate-500 uppercase font-bold" style={{ letterSpacing: "0.25em", fontSize: "6px" }}>Best Streak</p>
                </div>
              </motion.div>

              {/* Question review dots */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center gap-2 mb-4"
              >
                {playerAnswers.map((a, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.65 + i * 0.08, type: "spring" }}
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: a !== null && a === questions[i]?.correct ? "#10b981" : "#ef4444",
                      boxShadow: `0 0 6px ${a !== null && a === questions[i]?.correct ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
                    }}
                  />
                ))}
              </motion.div>

              {/* Action buttons — with inner highlight + text shadow */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75 }}
                className="space-y-2.5"
              >
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={handlePlayAgain}
                  className={`w-full py-3.5 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white text-xs uppercase transition-transform flex items-center justify-center gap-2`}
                  style={{
                    boxShadow: `0 4px 25px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                    fontWeight: 900,
                    letterSpacing: "0.15em",
                    transform: "perspective(600px) translateZ(0)",
                    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Play Again</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.93 }}
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
        </div>
      </motion.div>
    </motion.div>
  );
}
