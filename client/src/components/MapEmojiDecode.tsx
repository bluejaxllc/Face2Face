import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smile,
  Send,
  Lightbulb,
  Eye,
  EyeOff,
  Trophy,
  RotateCcw,
  User,
  CheckCircle2,
  XCircle,
  Crown,
  Zap,
  Tag,
  Heart,
  Users,
  Briefcase,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────
   MapEmojiDecode — Compact emoji-to-word puzzle for map overlay
   5 puzzles, 20s each. No header/back — parent bottom sheet handles that.
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
    glowColor: "rgba(236,72,153,0.5)",
    glowColorSoft: "rgba(236,72,153,0.15)",
    glowColorMid: "rgba(236,72,153,0.3)",
    solidHex: "#ec4899",
    secondHex: "#f43f5e",
    warmHue: "rgba(236,72,153,0.08)",
    coolHue: "rgba(96,165,250,0.06)",
    categoryLabel: "Dating",
    CategoryIcon: Heart,
  },
  friends: {
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    glowColor: "rgba(16,185,129,0.5)",
    glowColorSoft: "rgba(16,185,129,0.15)",
    glowColorMid: "rgba(16,185,129,0.3)",
    solidHex: "#10b981",
    secondHex: "#14b8a6",
    warmHue: "rgba(16,185,129,0.08)",
    coolHue: "rgba(96,165,250,0.06)",
    categoryLabel: "Friends",
    CategoryIcon: Users,
  },
  business: {
    gradient: "from-blue-500 via-indigo-500 to-purple-500",
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    glowColor: "rgba(59,130,246,0.5)",
    glowColorSoft: "rgba(59,130,246,0.15)",
    glowColorMid: "rgba(59,130,246,0.3)",
    solidHex: "#3b82f6",
    secondHex: "#8b5cf6",
    warmHue: "rgba(59,130,246,0.08)",
    coolHue: "rgba(168,85,247,0.06)",
    categoryLabel: "Business",
    CategoryIcon: Briefcase,
  },
} as const;

/* ── Puzzle Data ── */

interface Puzzle {
  emojis: string;
  answer: string;
  hint: string;
}

const PUZZLES: Record<"dating" | "friends" | "business", Puzzle[]> = {
  dating: [
    { emojis: "💘🏹👼", answer: "cupid", hint: "Valentine's helper" },
    { emojis: "🌹🚢💔", answer: "titanic", hint: "Classic love story" },
    { emojis: "💌✈️📬", answer: "love letter", hint: "Written feelings" },
    { emojis: "🍝🕯️🍷", answer: "dinner date", hint: "Romantic evening" },
    { emojis: "💍💒👰🤵", answer: "wedding", hint: "Happily ever after" },
    { emojis: "🦋🫃😍", answer: "butterflies", hint: "That nervous feeling" },
    { emojis: "⭐🌙💫", answer: "stargazing", hint: "Looking up together" },
  ],
  friends: [
    { emojis: "🍕🎮🛋️", answer: "game night", hint: "Chill hangout" },
    { emojis: "🏖️🌊🏄", answer: "beach day", hint: "Sandy adventure" },
    { emojis: "🎤🎵🎶", answer: "karaoke", hint: "Sing your heart out" },
    { emojis: "🏕️🔥🌌", answer: "camping", hint: "Outdoor sleepover" },
    { emojis: "🎬🍿🥤", answer: "movie night", hint: "Big screen" },
    { emojis: "🎂🎈🎉", answer: "birthday party", hint: "Make a wish" },
    { emojis: "🧩🔍🕵️", answer: "escape room", hint: "Solve the clues" },
  ],
  business: [
    { emojis: "💡🚀🦄", answer: "startup", hint: "Disruptive idea" },
    { emojis: "📊📉📈", answer: "stock market", hint: "Bulls and bears" },
    { emojis: "☕💻🏠", answer: "remote work", hint: "WFH life" },
    { emojis: "🧠💭🗣️", answer: "brainstorm", hint: "Idea generation" },
    { emojis: "🏢🔝👔", answer: "promotion", hint: "Moving up" },
    { emojis: "🌐🔗⛓️", answer: "blockchain", hint: "Decentralized" },
    { emojis: "🤝💼📈", answer: "business deal", hint: "Growth partnership" },
  ],
};

// Random emoji pool for unscramble effect
const SCRAMBLE_EMOJIS = ["🎭", "🎪", "🎨", "🎯", "🎲", "🃏", "🔮", "💎", "🧩", "🎰", "🌀", "❓", "⚡", "🌈", "🦋", "🍀"];

const TOTAL_ROUNDS = 5;
const TIME_PER_ROUND = 20;

/* ── SVG Noise Texture ── */
function NoiseTexture() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03] z-50">
      <filter id="noise-emoji">
        <feTurbulence baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise-emoji)" />
    </svg>
  );
}

/* ── Ambient Dust Motes ── */
function AmbientParticles({ intensity, color }: { intensity: number; color: string }) {
  const count = Math.min(12, 8 + Math.floor(intensity * 4));
  const motes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1.5 + Math.random() * 2.5,
        dur: 6 + Math.random() * 8,
        delay: Math.random() * 4,
        drift: 20 + Math.random() * 40,
      })),
    [count]
  );
  const speed = 1 - intensity * 0.4;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[5]">
      {motes.map((m) => (
        <motion.div
          key={m.id}
          className="absolute rounded-full"
          style={{
            left: `${m.x}%`,
            top: `${m.y}%`,
            width: m.size,
            height: m.size,
            background: color,
            opacity: 0.15 + intensity * 0.2,
          }}
          animate={{
            y: [-m.drift, m.drift, -m.drift],
            x: [-m.drift * 0.5, m.drift * 0.3, -m.drift * 0.5],
            opacity: [0.1 + intensity * 0.15, 0.3 + intensity * 0.25, 0.1 + intensity * 0.15],
            scale: [0.8, 1.2 + intensity * 0.3, 0.8],
          }}
          transition={{
            duration: m.dur * speed,
            repeat: Infinity,
            ease: "easeInOut",
            delay: m.delay,
          }}
        />
      ))}
    </div>
  );
}

/* ── Levenshtein Distance ── */

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/* ── Fuzzy Matching ── */

function isCorrectGuess(guess: string, answer: string): boolean {
  const g = guess.trim().toLowerCase().replace(/[^a-z0-9 ]/g, "");
  const a = answer.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  if (g === a) return true;
  if (g.includes(a) || a.includes(g)) return true;
  if (g.length > 3 && levenshteinDistance(g, a) <= 2) return true;
  return false;
}

/* ── Types ── */

type Phase = "countdown" | "playing" | "results";

interface RoundResult {
  puzzle: Puzzle;
  playerGuess: string;
  playerCorrect: boolean;
  playerScore: number;
  opponentCorrect: boolean;
  opponentScore: number;
  hintUsed: boolean;
  timeLeft: number;
}

/* ── Score Odometer Digit ── */
function OdometerDigit({ digit, color }: { digit: string; color: string }) {
  return (
    <span className="inline-block overflow-hidden relative" style={{ width: "0.65em", height: "1.2em" }}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={digit}
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="absolute inset-0 flex items-center justify-center font-black"
          style={{ color, fontVariantNumeric: "tabular-nums" }}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function ScoreOdometer({ value, color, className }: { value: number; color: string; className?: string }) {
  const digits = String(value).split("");
  return (
    <span className={`inline-flex ${className || ""}`}>
      {digits.map((d, i) => (
        <OdometerDigit key={`${i}-${d}`} digit={d} color={color} />
      ))}
    </span>
  );
}

/* ── Score Change Ripple ── */
function ScoreRipple({ color, trigger }: { color: string; trigger: number }) {
  return (
    <AnimatePresence>
      {trigger > 0 && (
        <motion.div
          key={trigger}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ border: `2px solid ${color}` }}
          initial={{ scale: 0.5, opacity: 0.8 }}
          animate={{ scale: 2.5, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )}
    </AnimatePresence>
  );
}

/* ── Leading Player Crown ── */
function LeaderCrown({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <motion.div
      className="absolute -top-4 left-1/2 -translate-x-1/2 z-20"
      animate={{ y: [0, -3, 0], rotate: [-3, 3, -3] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <Crown className="w-3.5 h-3.5 text-amber-400" style={{ filter: "drop-shadow(0 0 6px rgba(245,158,11,0.6))" }} />
    </motion.div>
  );
}

/* ── Floating Text Popup ── */
function FloatingTextPopup({ text, color, delay = 0 }: { text: string; color: string; delay?: number }) {
  return (
    <motion.div
      initial={{ y: 0, opacity: 1, scale: 0.8 }}
      animate={{ y: -35, opacity: 0, scale: 1.1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.4, ease: "easeOut", delay }}
      className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none z-30"
    >
      <span
        className="text-[11px] font-black"
        style={{ color, textShadow: `0 0 8px ${color}80` }}
      >
        {text}
      </span>
    </motion.div>
  );
}

/* ── Typing Indicator Dots ── */
function TypingDots({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: color, opacity: 0.4 }}
          animate={{ opacity: [0.2, 0.6, 0.2], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ── Confetti Burst ── */
function ConfettiBurst({ color }: { color: string }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 200,
        y: -(Math.random() * 120 + 40),
        rotate: Math.random() * 720 - 360,
        scale: Math.random() * 0.6 + 0.4,
        delay: Math.random() * 0.2,
        emoji: ["✨", "🎉", "⭐", "💫", "🔥", "🎊"][Math.floor(Math.random() * 6)],
      })),
    []
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-30">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2 text-base"
          initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: 0,
            scale: p.scale,
            rotate: p.rotate,
          }}
          transition={{ duration: 1.2, delay: p.delay, ease: "easeOut" }}
        >
          {p.emoji}
        </motion.div>
      ))}
      {/* Expanding glow ring */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ border: `2px solid ${color}` }}
        initial={{ width: 0, height: 0, opacity: 0.8 }}
        animate={{ width: 250, height: 250, opacity: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  );
}

/* ── Particle Component for celebrations ── */
function WinParticles({ color }: { color: string }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: Math.random() * 200 - 100,
        y: -(Math.random() * 160 + 40),
        rotate: Math.random() * 720 - 360,
        scale: Math.random() * 0.6 + 0.4,
        delay: Math.random() * 0.3,
        emoji: ["✨", "🎉", "⭐", "💫", "🔥"][Math.floor(Math.random() * 5)],
      })),
    []
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2 text-lg"
          initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: 0,
            scale: p.scale,
            rotate: p.rotate,
          }}
          transition={{ duration: 1.4, delay: p.delay, ease: "easeOut" }}
        >
          {p.emoji}
        </motion.div>
      ))}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ border: `2px solid ${color}` }}
        initial={{ width: 0, height: 0, opacity: 0.8 }}
        animate={{ width: 300, height: 300, opacity: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </div>
  );
}

/* ── Circular Timer Ring ── */
function CircularTimerRing({
  timeLeft,
  totalTime,
  size = 42,
  strokeWidth = 3,
  color,
  dangerColor,
  intensity = 0,
}: {
  timeLeft: number;
  totalTime: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  dangerColor: string;
  intensity?: number;
}) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = timeLeft / totalTime;
  const isDanger = timeLeft <= 5;
  const activeColor = isDanger ? dangerColor : color;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-90" style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={activeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{
            strokeDashoffset: circumference * (1 - progress),
          }}
          transition={{ duration: 0.5, ease: "linear" }}
          style={{
            filter: `drop-shadow(0 0 ${4 + intensity * 6}px ${activeColor})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className="text-[9px] font-black"
          style={{
            color: activeColor,
            fontVariantNumeric: "tabular-nums",
          }}
          animate={
            isDanger
              ? { scale: [1, 1.15, 1], opacity: [1, 0.7, 1] }
              : {}
          }
          transition={
            isDanger
              ? { duration: 0.5 - intensity * 0.15, repeat: Infinity }
              : {}
          }
        >
          {timeLeft}
        </motion.span>
      </div>
    </div>
  );
}

/* ── Victory Rays ── */
function VictoryRays({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-0"
      style={{
        background: `conic-gradient(from 0deg, transparent, ${color}08, transparent, ${color}06, transparent, ${color}08, transparent, ${color}06, transparent)`,
        borderRadius: "1rem",
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    />
  );
}

/* ── Screen Shake ── */
function ScreenShake({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      animate={
        active
          ? { x: [0, -4, 4, -3, 3, 0], y: [0, 2, -2, 1, -1, 0] }
          : {}
      }
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}

/* ── Accuracy Ring ── */
function AccuracyRing({
  percent,
  size = 48,
  strokeWidth = 4,
  color,
  label,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset: circumference - (circumference * percent) / 100,
          }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
        />
      </svg>
      <span className="text-xs font-black text-white" style={{ fontVariantNumeric: "tabular-nums" }}>{percent}%</span>
      <span
        className="text-[6px] text-slate-500 uppercase font-bold"
        style={{ letterSpacing: "0.25em" }}
      >
        {label}
      </span>
    </div>
  );
}

/* ── Depth-of-Field Blur Overlay ── */
function DepthBlur({ active }: { active: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-[4]"
      animate={{ backdropFilter: active ? "blur(3px)" : "blur(0px)" }}
      transition={{ duration: 0.5 }}
    />
  );
}

/* ── Between-Rounds Scoreboard ── */
function RoundScoreboard({
  playerScore,
  opponentScore,
  playerName,
  opponentName,
  playerColor,
  opponentColor,
}: {
  playerScore: number;
  opponentScore: number;
  playerName: string;
  opponentName: string;
  playerColor: string;
  opponentColor: string;
}) {
  const maxScore = Math.max(playerScore, opponentScore, 1);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-2 px-3 py-2 rounded-lg"
      style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(71,85,105,0.3)" }}
    >
      <p className="text-[7px] font-black text-slate-500 uppercase mb-1.5" style={{ letterSpacing: "0.2em" }}>
        Score Comparison
      </p>
      {/* Player bar */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[8px] font-bold text-slate-400 w-8 text-right">{playerName}</span>
        <div className="flex-1 h-2 rounded-full bg-slate-800/60 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: playerColor }}
            initial={{ width: 0 }}
            animate={{ width: `${(playerScore / maxScore) * 100}%` }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          />
        </div>
        <span className="text-[8px] font-black text-white w-6" style={{ fontVariantNumeric: "tabular-nums" }}>{playerScore}</span>
      </div>
      {/* Opponent bar */}
      <div className="flex items-center gap-2">
        <span className="text-[8px] font-bold text-slate-400 w-8 text-right">{opponentName.slice(0, 5)}</span>
        <div className="flex-1 h-2 rounded-full bg-slate-800/60 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: opponentColor }}
            initial={{ width: 0 }}
            animate={{ width: `${(opponentScore / maxScore) * 100}%` }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          />
        </div>
        <span className="text-[8px] font-black text-white w-6" style={{ fontVariantNumeric: "tabular-nums" }}>{opponentScore}</span>
      </div>
    </motion.div>
  );
}

/* ── Typewriter Reveal for Correct Answer ── */
function TypewriterReveal({ text, color }: { text: string; color: string }) {
  const [revealed, setRevealed] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setRevealed((prev) => {
        if (prev >= text.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span className="font-black" style={{ color }}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: i < revealed ? 1 : 0.15 }}
          transition={{ duration: 0.05 }}
        >
          {char}
        </motion.span>
      ))}
      {revealed < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ color }}
        >
          |
        </motion.span>
      )}
    </span>
  );
}

export default function MapEmojiDecode({ opponent, category, onComplete }: MapGameChildProps) {
  const theme = THEMES[category];
  const opponentName = opponent.firstName;
  const allPuzzles = PUZZLES[category];
  const CategoryIcon = theme.CategoryIcon;

  // ── Game state ──
  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [showGo, setShowGo] = useState(false);
  const [letterboxVisible, setLetterboxVisible] = useState(true);
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_ROUND);

  // ── Input state ──
  const [guess, setGuess] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  // ── Scores ──
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);

  // ── Review state after submission ──
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{
    playerCorrect: boolean;
    opponentCorrect: boolean;
    playerPts: number;
    opponentPts: number;
  } | null>(null);

  // ── Visual state ──
  const [showConfetti, setShowConfetti] = useState(false);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [shakeResults, setShakeResults] = useState(false);

  // ── Emoji unscramble state ──
  const [emojiScrambled, setEmojiScrambled] = useState(true);
  const [scrambledEmojis, setScrambledEmojis] = useState<string[]>([]);

  // ── Floating text popups ──
  const [speedBonusPopup, setSpeedBonusPopup] = useState<{ id: number; value: number } | null>(null);
  const [hintPenaltyPopup, setHintPenaltyPopup] = useState<number>(0);
  const speedBonusCounter = useRef(0);

  // ── Score ripple triggers ──
  const [playerScoreRipple, setPlayerScoreRipple] = useState(0);
  const prevPlayerScore = useRef(0);

  // ── Depth blur ──
  const [showDepthBlur, setShowDepthBlur] = useState(false);

  // ── Radial wipe between rounds ──
  const [showWipe, setShowWipe] = useState(false);

  // ── Refs ──
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Initialize puzzles on mount ──
  useEffect(() => {
    const shuffled = [...allPuzzles].sort(() => Math.random() - 0.5).slice(0, TOTAL_ROUNDS);
    setPuzzles(shuffled);
  }, [allPuzzles]);

  // ── Computed intensity (0-1) based on time remaining ──
  const intensity = phase === "playing" ? Math.max(0, 1 - timeLeft / TIME_PER_ROUND) : 0;

  // ── useIntensity: progressive round-based intensity scaling ──
  const roundIntensity = useMemo(() => {
    const progress = (currentRound + 1) / TOTAL_ROUNDS;
    return 0.7 + progress * 0.5;
  }, [currentRound]);

  // ── Dynamic color temperature ──
  const colorTemp = useMemo(() => {
    if (phase !== "playing") return "transparent";
    if (playerScore > opponentScore) return theme.warmHue;
    if (opponentScore > playerScore) return theme.coolHue;
    return "transparent";
  }, [phase, playerScore, opponentScore, theme]);

  // ── winnerTint: score-based color temperature ──
  const winnerTint = useMemo(() => {
    if (playerScore > opponentScore) return 'warm';
    if (playerScore < opponentScore) return 'cool';
    return 'neutral';
  }, [playerScore, opponentScore]);

  // ── Score ripple detection ──
  useEffect(() => {
    if (playerScore !== prevPlayerScore.current) {
      if (playerScore > prevPlayerScore.current) {
        setPlayerScoreRipple((p) => p + 1);
      }
      prevPlayerScore.current = playerScore;
    }
  }, [playerScore]);

  // ── Emoji unscramble effect ──
  useEffect(() => {
    if (phase !== "playing" || !puzzles[currentRound]) return;
    const realEmojis = [...puzzles[currentRound].emojis];
    // Generate random scrambled emojis
    const scrambled = realEmojis.map(() => SCRAMBLE_EMOJIS[Math.floor(Math.random() * SCRAMBLE_EMOJIS.length)]);
    setScrambledEmojis(scrambled);
    setEmojiScrambled(true);

    // After 500ms, reveal real emojis one by one
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    realEmojis.forEach((_, idx) => {
      const t = setTimeout(() => {
        setScrambledEmojis((prev) => {
          const next = [...prev];
          next[idx] = realEmojis[idx];
          return next;
        });
      }, 400 + idx * 200);
      timeouts.push(t);
    });

    const finalT = setTimeout(() => {
      setEmojiScrambled(false);
    }, 400 + realEmojis.length * 200 + 100);
    timeouts.push(finalT);

    return () => timeouts.forEach(clearTimeout);
  }, [phase, currentRound, puzzles]);

  // ── Countdown phase ──
  useEffect(() => {
    if (phase === "countdown") {
      setCountdown(3);
      setLetterboxVisible(true);
      setShowGo(false);
      setShowDepthBlur(false);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setShowGo(true);
            setTimeout(() => {
              setShowGo(false);
              setLetterboxVisible(false);
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

  // ── Playing phase timer ──
  useEffect(() => {
    if (phase === "playing" && !submitted) {
      setTimeLeft(TIME_PER_ROUND);
      setGuess("");
      setHintVisible(false);
      setHintUsed(false);
      setShowResult(false);
      setLastResult(null);
      setShowConfetti(false);
      setShakeWrong(false);
      setSpeedBonusPopup(null);
      setHintPenaltyPopup(0);
      submittedRef.current = false;

      // Focus input after short delay for animation
      setTimeout(() => inputRef.current?.focus(), 300);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            if (!submittedRef.current) {
              submittedRef.current = true;
              setSubmitted(true);
              handleSubmitAnswer("", true);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentRound]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  // ── Submit answer ──
  const handleSubmitAnswer = useCallback(
    (playerGuess: string, isTimeout = false) => {
      if (timerRef.current) clearInterval(timerRef.current);

      const puzzle = puzzles[currentRound];
      if (!puzzle) return;

      const guessToCheck = isTimeout ? "" : playerGuess;
      const playerCorrect = guessToCheck.trim().length > 0 && isCorrectGuess(guessToCheck, puzzle.answer);

      // Score calculation
      let playerPts = 0;
      if (playerCorrect) {
        const timeBonus = timeLeft * 3;
        const hintPenalty = hintUsed ? 25 : 0;
        playerPts = 100 + timeBonus - hintPenalty;

        // Show speed bonus popup if time bonus is significant
        if (timeBonus >= 15) {
          speedBonusCounter.current += 1;
          setSpeedBonusPopup({ id: speedBonusCounter.current, value: timeBonus });
          setTimeout(() => setSpeedBonusPopup(null), 1500);
        }
      }

      // Opponent AI: 55-80% chance correct
      const opponentAccuracy = 0.55 + Math.random() * 0.25;
      const opponentCorrect = Math.random() < opponentAccuracy;
      let opponentPts = 0;
      if (opponentCorrect) {
        opponentPts = 100 + Math.floor(Math.random() * 46);
      }

      const result: RoundResult = {
        puzzle,
        playerGuess: guessToCheck,
        playerCorrect,
        playerScore: playerPts,
        opponentCorrect,
        opponentScore: opponentPts,
        hintUsed,
        timeLeft,
      };

      setRoundResults((prev) => [...prev, result]);
      setPlayerScore((s) => s + playerPts);
      setOpponentScore((s) => s + opponentPts);
      setLastResult({ playerCorrect, opponentCorrect, playerPts, opponentPts });
      setShowResult(true);

      // Visual feedback
      if (playerCorrect) {
        setShowConfetti(true);
      } else {
        setShakeWrong(true);
        setTimeout(() => setShakeWrong(false), 500);
      }

      // Auto-advance after 2 seconds
      autoAdvanceRef.current = setTimeout(() => {
        if (currentRound + 1 >= TOTAL_ROUNDS) {
          setPhase("results");
        } else {
          // Trigger radial wipe between rounds
          setShowWipe(true);
          setTimeout(() => setShowWipe(false), 700);
          setCurrentRound((r) => r + 1);
          setSubmitted(false);
          setShowResult(false);
          setLastResult(null);
          setShowConfetti(false);
        }
      }, 2000);
    },
    [puzzles, currentRound, timeLeft, hintUsed]
  );

  // ── Handle input submit ──
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !submittedRef.current && guess.trim().length > 0) {
      submittedRef.current = true;
      setSubmitted(true);
      handleSubmitAnswer(guess);
    }
  };

  const handleSendClick = () => {
    if (!submittedRef.current && guess.trim().length > 0) {
      submittedRef.current = true;
      setSubmitted(true);
      handleSubmitAnswer(guess);
    }
  };

  // ── Toggle hint ──
  const handleHint = () => {
    setHintVisible((v) => !v);
    if (!hintUsed) {
      setHintUsed(true);
      setHintPenaltyPopup((p) => p + 1);
    }
  };

  // ── Play again ──
  const handlePlayAgain = useCallback(() => {
    const shuffled = [...allPuzzles].sort(() => Math.random() - 0.5).slice(0, TOTAL_ROUNDS);
    setPuzzles(shuffled);
    setCurrentRound(0);
    setPlayerScore(0);
    setOpponentScore(0);
    setRoundResults([]);
    setGuess("");
    setSubmitted(false);
    setHintVisible(false);
    setHintUsed(false);
    setShowResult(false);
    setLastResult(null);
    setShowConfetti(false);
    setShakeWrong(false);
    setSpeedBonusPopup(null);
    setHintPenaltyPopup(0);
    prevPlayerScore.current = 0;
    submittedRef.current = false;
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    setPhase("countdown");
  }, [allPuzzles]);

  const puzzle = puzzles[currentRound];
  const playerWon = playerScore > opponentScore;
  const isTie = playerScore === opponentScore;
  const avatarUrl = opponent.profilePhoto || undefined;

  const playerCorrectCount = roundResults.filter((r) => r.playerCorrect).length;
  const opponentCorrectCount = roundResults.filter((r) => r.opponentCorrect).length;
  const playerAccuracy = roundResults.length > 0 ? Math.round((playerCorrectCount / roundResults.length) * 100) : 0;
  const opponentAccuracy = roundResults.length > 0 ? Math.round((opponentCorrectCount / roundResults.length) * 100) : 0;

  // Split emojis for display — use scrambled during unscramble phase
  const displayEmojis = emojiScrambled && scrambledEmojis.length > 0 ? scrambledEmojis : (puzzle ? [...puzzle.emojis] : []);

  // Character count & progress for input
  const answerLength = puzzle ? puzzle.answer.length : 10;
  const inputProgress = Math.min(guess.length / answerLength, 1);

  const countdownColors: Record<number, string> = {
    1: "#ef4444",
    2: "#f59e0b",
    3: "#22c55e",
  };

  return (
    <div className="flex flex-col w-full text-white select-none overflow-hidden relative">
      <NoiseTexture />
      <AmbientParticles intensity={Math.max(intensity, roundIntensity * 0.5)} color={theme.solidHex} />

      {/* ── Radial Wipe (between-round transition) ── */}
      <AnimatePresence>
        {showWipe && (
          <motion.div
            key="radial-wipe"
            className="absolute inset-0 rounded-full pointer-events-none z-50"
            style={{
              background: `radial-gradient(circle, ${winnerTint === 'warm' ? theme.solidHex : winnerTint === 'cool' ? '#3b82f6' : theme.solidHex} 0%, transparent 70%)`,
            }}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>

      {/* ── Dynamic Color Temperature Overlay ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-[2]"
        animate={{ background: colorTemp }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />

      {/* ── Depth Blur ── */}
      <DepthBlur active={showDepthBlur} />

      {/* ── Letterbox Bars ── */}
      <AnimatePresence>
        {letterboxVisible && phase === "countdown" && (
          <>
            <motion.div
              className="absolute top-0 left-0 right-0 bg-black z-[60]"
              initial={{ height: "15%" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-black z-[60]"
              initial={{ height: "15%" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </>
        )}
      </AnimatePresence>

      {/* ── PHASE: COUNTDOWN ── */}
      {phase === "countdown" && (
        <motion.div
          className="flex flex-col items-center justify-center py-16 relative"
          animate={showGo ? {} : { scale: [1.03, 1] }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Background radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${theme.glowColorSoft} 0%, transparent 70%)`,
            }}
          />

          {/* Layered glow rings */}
          <motion.div
            className="absolute w-40 h-40 rounded-full opacity-20 blur-3xl"
            style={{ background: theme.solidHex }}
            animate={{
              x: [0, 20, -10, 0],
              y: [0, -15, 10, 0],
              scale: [1, 1.3, 0.9, 1],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-32 h-32 rounded-full opacity-15 blur-[50px]"
            style={{ background: theme.secondHex }}
            animate={{
              scale: [1.2, 0.9, 1.2],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
          >
            <Smile
              className={`w-10 h-10 ${theme.text} mb-3`}
              style={{ filter: `drop-shadow(0 0 12px ${theme.glowColor})` }}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[10px] font-black uppercase mb-4"
            style={{
              letterSpacing: "0.3em",
              background: `linear-gradient(135deg, ${theme.solidHex}, ${theme.secondHex})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Emoji Decode
          </motion.p>

          <AnimatePresence mode="popLayout">
            {showGo ? (
              <motion.div
                key="go"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.8, opacity: 1 }}
                exit={{ scale: 3, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="relative"
              >
                {/* Radial shockwave */}
                <motion.div
                  className="absolute inset-0 -m-16 rounded-full"
                  style={{ border: `3px solid ${theme.solidHex}`, background: `${theme.solidHex}10` }}
                  initial={{ scale: 0.5, opacity: 1 }}
                  animate={{ scale: 3, opacity: 0 }}
                  transition={{ duration: 0.6 }}
                />
                <h1
                  className="text-7xl font-black"
                  style={{
                    background: `linear-gradient(135deg, ${theme.solidHex}, ${theme.secondHex}, #fff)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    letterSpacing: "0.15em",
                  }}
                >
                  GO!
                </h1>
              </motion.div>
            ) : (
              <motion.div
                key={countdown}
                initial={{ scale: 0, opacity: 0, rotate: -30 }}
                animate={{ scale: 1.5, opacity: 1, rotate: 0 }}
                exit={{ scale: 3, opacity: 0, rotate: 30 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 150 }}
                className="text-7xl font-black relative"
                style={{
                  color: countdownColors[countdown] || "#22c55e",
                  filter: `drop-shadow(0 0 30px ${theme.glowColor})`,
                }}
              >
                {countdown}
                {/* Double pulsing ring */}
                <motion.div
                  className="absolute inset-0 -m-6 rounded-full"
                  style={{ border: `2px solid ${countdownColors[countdown] || theme.glowColorMid}` }}
                  animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0 -m-10 rounded-full"
                  style={{ border: `1px solid ${countdownColors[countdown] || theme.glowColorMid}` }}
                  animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.15 }}
                />
                {/* Burst particles */}
                {Array.from({ length: 10 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0.7 }}
                    animate={{
                      x: Math.cos((i * Math.PI * 2) / 10) * 65,
                      y: Math.sin((i * Math.PI * 2) / 10) * 65,
                      scale: [0, 1, 0],
                      opacity: [0.7, 0.4, 0],
                    }}
                    transition={{ duration: 0.8, delay: 0.05 }}
                    className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full -ml-1 -mt-1"
                    style={{ background: countdownColors[countdown] || "#22c55e" }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs font-bold mt-10 uppercase text-slate-400"
            style={{ letterSpacing: "0.15em" }}
          >
            vs{" "}
            <span
              style={{
                background: `linear-gradient(135deg, ${theme.solidHex}, ${theme.secondHex})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {opponentName}
            </span>
          </motion.p>
        </motion.div>
      )}

      {/* ── PHASE: PLAYING ── */}
      {phase === "playing" && puzzle && (
        <div className="flex flex-col">
          {/* Score bar */}
          <div className="flex items-center gap-2 px-4 pt-3 pb-2">
            {/* Player */}
            <div className="flex items-center gap-1.5 flex-1">
              <div className="relative">
                <LeaderCrown visible={playerScore > opponentScore && playerScore > 0} />
                <div className="w-7 h-7 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center backdrop-blur-sm">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
              </div>
              <div className="relative">
                <div className="text-xs font-black relative">
                  <ScoreOdometer value={playerScore} color="#ffffff" />
                  <ScoreRipple color={theme.solidHex} trigger={playerScoreRipple} />
                </div>
                <p className="text-[7px] text-slate-500 font-bold" style={{ letterSpacing: "0.25em" }}>YOU</p>
              </div>
            </div>

            {/* Circular timer ring with round counter */}
            <div className="flex items-center gap-2">
              <CircularTimerRing
                timeLeft={timeLeft}
                totalTime={TIME_PER_ROUND}
                size={42}
                strokeWidth={3}
                color={theme.solidHex}
                dangerColor="#ef4444"
                intensity={intensity}
              />
              {/* Round dots inside/beside timer */}
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1">
                  {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
                    const isActive = i === currentRound;
                    const isPast = i < roundResults.length;
                    const dotCorrect = isPast ? roundResults[i].playerCorrect : false;
                    return (
                      <motion.div
                        key={i}
                        initial={isActive ? { scale: 0 } : {}}
                        animate={
                          isActive
                            ? { scale: [1, 1.3, 1] }
                            : { scale: 1 }
                        }
                        transition={
                          isActive
                            ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                            : {}
                        }
                        className={`w-2 h-2 rounded-full transition-colors ${
                          isPast
                            ? dotCorrect
                              ? "bg-emerald-500"
                              : "bg-red-500"
                            : isActive
                            ? ""
                            : "bg-slate-800"
                        }`}
                        style={
                          isActive
                            ? {
                                background: `linear-gradient(135deg, ${theme.solidHex}, ${theme.secondHex})`,
                                boxShadow: `0 0 8px ${theme.glowColorMid}`,
                              }
                            : isPast
                            ? {
                                boxShadow: dotCorrect
                                  ? "0 0 4px rgba(16,185,129,0.4)"
                                  : "0 0 4px rgba(239,68,68,0.4)",
                              }
                            : {}
                        }
                      />
                    );
                  })}
                </div>
                <span className="text-[6px] text-slate-600 font-bold uppercase" style={{ letterSpacing: "0.15em" }}>
                  R{currentRound + 1}/{TOTAL_ROUNDS}
                </span>
              </div>
            </div>

            {/* Opponent */}
            <div className="flex items-center gap-1.5 flex-1 justify-end">
              <div className="text-right">
                <div className="text-xs font-black">
                  <ScoreOdometer value={opponentScore} color="#ffffff" />
                </div>
                <p className="text-[7px] text-slate-500 font-bold" style={{ letterSpacing: "0.25em" }}>{opponentName.toUpperCase()}</p>
              </div>
              <div className="relative">
                <LeaderCrown visible={opponentScore > playerScore && opponentScore > 0} />
                <div
                  className={`w-7 h-7 rounded-full overflow-hidden border ${theme.border} bg-slate-800 flex items-center justify-center`}
                  style={{ boxShadow: `0 0 8px ${theme.glowColorSoft}` }}
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

          {/* Emoji display + input area */}
          <div className="px-4 py-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentRound}
                initial={{ x: 50, opacity: 0, filter: "blur(8px)" }}
                animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ x: -50, opacity: 0, filter: "blur(8px)" }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                {/* Round label + Category badge */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-[9px] font-black text-slate-500 uppercase" style={{ letterSpacing: "0.15em" }}>
                    Round {currentRound + 1}/{TOTAL_ROUNDS}
                  </span>
                  {/* Category badge */}
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[7px] font-black uppercase"
                    style={{
                      letterSpacing: "0.2em",
                      background: theme.glowColorSoft,
                      border: `1px solid ${theme.glowColorMid}`,
                      color: theme.solidHex,
                    }}
                  >
                    <CategoryIcon className="w-2.5 h-2.5" />
                    {theme.categoryLabel}
                  </motion.span>
                </div>

                {/* Emoji card — glassmorphic with aurora-like gradient border */}
                <ScreenShake active={shakeWrong}>
                  <div
                    className="relative rounded-2xl p-6 mb-3 text-center overflow-hidden"
                    style={{
                      background: "rgba(15,23,42,0.6)",
                      backdropFilter: "blur(16px)",
                      border: `1px solid ${
                        showResult && lastResult
                          ? lastResult.playerCorrect
                            ? "rgba(16,185,129,0.4)"
                            : "rgba(239,68,68,0.4)"
                          : "rgba(255,255,255,0.08)"
                      }`,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.3), 0 0 60px ${theme.glowColorSoft}`,
                      transition: "border-color 0.3s",
                    }}
                  >
                    {/* Aurora-like animated gradient border */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{
                        background: `conic-gradient(from 0deg, transparent, ${theme.solidHex}40, ${theme.secondHex}30, transparent, #06b6d440, ${theme.solidHex}30, transparent)`,
                        mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                        maskComposite: "exclude",
                        WebkitMaskComposite: "xor",
                        padding: "1.5px",
                        borderRadius: "1rem",
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 6 - intensity * 2, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Confetti on correct */}
                    {showConfetti && <ConfettiBurst color={theme.solidHex} />}

                    {/* Staggered emoji characters with unscramble + colored shadows */}
                    <div className="flex items-center justify-center gap-2">
                      {displayEmojis.map((char, idx) => (
                        <motion.span
                          key={`${currentRound}-${idx}-${char}`}
                          className="text-5xl inline-block relative"
                          initial={{ scale: 0, rotate: -30, opacity: 0 }}
                          animate={{
                            scale: 1,
                            rotate: 0,
                            opacity: 1,
                            y: [0, -4, 0],
                          }}
                          transition={{
                            scale: {
                              type: "spring",
                              stiffness: 260,
                              damping: 15,
                              delay: 0.15 + idx * 0.12,
                            },
                            y: {
                              duration: 2 + idx * 0.3,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: idx * 0.4,
                            },
                          }}
                          whileHover={{ scale: 1.2, rotate: 10 }}
                          style={{
                            filter: `drop-shadow(0 4px 12px rgba(0,0,0,0.4))`,
                          }}
                        >
                          {char}
                          {/* Colored shadow below each emoji */}
                          <motion.div
                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-2 rounded-full blur-sm pointer-events-none"
                            style={{
                              background: theme.solidHex,
                              opacity: 0.2 + intensity * 0.15,
                            }}
                            animate={{ opacity: [0.15, 0.3, 0.15], scaleX: [0.8, 1.1, 0.8] }}
                            transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                          />
                        </motion.span>
                      ))}
                    </div>

                    {/* Subtle animated glow behind emojis */}
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 50% 50%, ${theme.glowColorSoft} 0%, transparent 60%)`,
                      }}
                      animate={{ opacity: [0.3, 0.6 + intensity * 0.2, 0.3] }}
                      transition={{ duration: 3 - intensity, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                </ScreenShake>

                {/* Hint button + hint text */}
                <div className="flex items-center justify-center mb-3 relative">
                  {/* Hint penalty popup */}
                  <AnimatePresence>
                    {hintPenaltyPopup > 0 && hintUsed && (
                      <FloatingTextPopup key={`hint-${hintPenaltyPopup}`} text="-25" color="#ef4444" />
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    {hintVisible ? (
                      <motion.button
                        key="hint-visible"
                        onClick={handleHint}
                        disabled={submitted}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase transition-all ${
                          submitted ? "opacity-40 pointer-events-none" : ""
                        }`}
                        style={{
                          letterSpacing: "0.15em",
                          background: "rgba(245,158,11,0.1)",
                          border: "1px solid rgba(245,158,11,0.3)",
                          color: "#fbbf24",
                          boxShadow: "0 0 20px rgba(245,158,11,0.15)",
                        }}
                      >
                        {/* Pendulum swing lightbulb */}
                        <motion.div
                          animate={{ rotate: [0, 15, -15, 10, -10, 0] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                          style={{ transformOrigin: "top center" }}
                        >
                          <Lightbulb className="w-3.5 h-3.5" style={{ filter: "drop-shadow(0 0 6px rgba(245,158,11,0.5))" }} />
                        </motion.div>
                        <span>{puzzle.hint}</span>
                      </motion.button>
                    ) : (
                      <motion.button
                        key="hint-hidden"
                        onClick={handleHint}
                        disabled={submitted}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        whileTap={{ scale: 0.93 }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase border transition-all ${
                          submitted ? "opacity-40 pointer-events-none" : ""
                        }`}
                        style={{
                          letterSpacing: "0.15em",
                          background: "rgba(30,41,59,0.6)",
                          borderColor: "rgba(71,85,105,0.5)",
                          color: "#94a3b8",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                        }}
                      >
                        <EyeOff className="w-3 h-3" />
                        <span>Hint (-25pts)</span>
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {/* Input field + send button */}
                {!showResult && (
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 flex items-center rounded-xl overflow-hidden transition-all duration-300 relative cursor-text"
                        style={{
                          background: "rgba(15,23,42,0.6)",
                          backdropFilter: "blur(8px)",
                          border: `1px solid ${
                            submitted
                              ? "rgba(71,85,105,0.2)"
                              : inputFocused
                              ? theme.glowColorMid
                              : "rgba(71,85,105,0.5)"
                          }`,
                          boxShadow: inputFocused && !submitted
                            ? `0 0 20px ${theme.glowColorSoft}, inset 0 0 20px ${theme.glowColorSoft}`
                            : "none",
                          opacity: submitted ? 0.5 : 1,
                        }}
                        onClick={() => inputRef.current?.focus()}
                      >
                        {/* Typing indicator dots when empty and unfocused */}
                        {guess.length === 0 && !submitted && !inputFocused && (
                          <div className="absolute inset-0 flex items-center pointer-events-none">
                            <TypingDots color={theme.solidHex} />
                          </div>
                        )}
                        <input
                          ref={inputRef}
                          type="text"
                          value={guess}
                          onChange={(e) => setGuess(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onFocus={() => setInputFocused(true)}
                          onBlur={() => setInputFocused(false)}
                          disabled={submitted}
                          placeholder={inputFocused || guess.length > 0 ? "Type your answer..." : ""}
                          className="flex-1 bg-transparent px-4 py-3 text-sm font-bold text-white placeholder-slate-600 outline-none relative z-10"
                          style={{
                            caretColor: theme.solidHex,
                          }}
                          autoComplete="off"
                          autoCapitalize="off"
                        />
                        {/* Character count */}
                        {guess.length > 0 && !submitted && (
                          <span
                            className="text-[8px] font-bold pr-3 tabular-nums"
                            style={{ color: theme.solidHex, opacity: 0.6 }}
                          >
                            {guess.length}
                          </span>
                        )}
                      </div>

                      {/* Submit button with shimmer */}
                      <motion.button
                        onClick={handleSendClick}
                        disabled={submitted || guess.trim().length === 0}
                        whileTap={{ scale: 0.93 }}
                        className="w-12 h-12 rounded-xl flex items-center justify-center relative overflow-hidden transition-all"
                        style={{
                          background:
                            submitted || guess.trim().length === 0
                              ? "rgba(30,41,59,0.5)"
                              : `linear-gradient(135deg, ${theme.solidHex}, ${theme.secondHex})`,
                          boxShadow:
                            submitted || guess.trim().length === 0
                              ? "none"
                              : `0 4px 20px ${theme.glowColorMid}, 0 0 40px ${theme.glowColorSoft}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                          color:
                            submitted || guess.trim().length === 0
                              ? "#475569"
                              : "#ffffff",
                          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                        }}
                      >
                        <Send className="w-4 h-4 relative z-10" />
                        {/* Shimmer overlay */}
                        {!submitted && guess.trim().length > 0 && (
                          <motion.div
                            className="absolute inset-0"
                            style={{
                              background:
                                "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)",
                            }}
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 1,
                              ease: "easeInOut",
                            }}
                          />
                        )}
                      </motion.button>
                    </div>

                    {/* Progress bar underneath input */}
                    {!submitted && (
                      <div className="h-1 rounded-full overflow-hidden mx-1" style={{ background: "rgba(71,85,105,0.2)" }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${theme.solidHex}, ${theme.secondHex})`,
                            opacity: guess.length > 0 ? 0.7 : 0,
                          }}
                          animate={{ width: `${inputProgress * 100}%` }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        />
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Result card after submission */}
                {showResult && lastResult && (
                  <motion.div
                    initial={{ y: 20, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 18 }}
                    className="space-y-2 relative"
                  >
                    {/* Speed Bonus Popup */}
                    <AnimatePresence>
                      {speedBonusPopup && lastResult.playerCorrect && (
                        <FloatingTextPopup
                          key={speedBonusPopup.id}
                          text={`SPEED BONUS +${speedBonusPopup.value}`}
                          color="#fbbf24"
                          delay={0.3}
                        />
                      )}
                    </AnimatePresence>

                    {/* Correct: expanding green ring effect */}
                    {lastResult.playerCorrect && (
                      <>
                        <motion.div
                          className="absolute -inset-4 rounded-3xl pointer-events-none"
                          style={{ border: "2px solid rgba(16,185,129,0.4)" }}
                          initial={{ scale: 0.8, opacity: 1 }}
                          animate={{ scale: 1.1, opacity: 0 }}
                          transition={{ duration: 0.8 }}
                        />
                        <motion.div
                          className="absolute -inset-2 rounded-2xl pointer-events-none"
                          style={{ border: "1px solid rgba(16,185,129,0.3)" }}
                          initial={{ scale: 0.9, opacity: 1 }}
                          animate={{ scale: 1.15, opacity: 0 }}
                          transition={{ duration: 1, delay: 0.1 }}
                        />
                      </>
                    )}

                    {/* Player result */}
                    <motion.div
                      className="rounded-xl p-3 backdrop-blur-sm"
                      style={{
                        background: lastResult.playerCorrect
                          ? "rgba(16,185,129,0.1)"
                          : "rgba(239,68,68,0.1)",
                        border: `1px solid ${
                          lastResult.playerCorrect
                            ? "rgba(16,185,129,0.3)"
                            : "rgba(239,68,68,0.3)"
                        }`,
                        boxShadow: lastResult.playerCorrect
                          ? "0 0 24px rgba(16,185,129,0.1)"
                          : "0 0 24px rgba(239,68,68,0.1)",
                      }}
                      animate={
                        lastResult.playerCorrect
                          ? {}
                          : { x: [0, -6, 6, -4, 4, -2, 2, 0] }
                      }
                      transition={{ duration: 0.5 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {lastResult.playerCorrect ? (
                            <>
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 300 }}
                              >
                                <CheckCircle2
                                  className="w-5 h-5 text-emerald-400"
                                  style={{ filter: "drop-shadow(0 0 8px rgba(16,185,129,0.5))" }}
                                />
                              </motion.div>
                              <motion.span
                                className="text-xs font-black text-emerald-400 uppercase"
                                style={{ letterSpacing: "0.15em" }}
                                animate={{ textShadow: ["0 0 0px transparent", "0 0 8px rgba(16,185,129,0.5)", "0 0 0px transparent"] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              >
                                Correct!
                              </motion.span>
                            </>
                          ) : (
                            <>
                              <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 0.5 }}
                              >
                                <XCircle className="w-5 h-5 text-red-400" style={{ filter: "drop-shadow(0 0 8px rgba(239,68,68,0.5))" }} />
                              </motion.div>
                              <span className="text-xs font-black text-red-400 uppercase" style={{ letterSpacing: "0.15em" }}>
                                {guess.trim().length === 0 ? "Time's Up!" : "Wrong!"}
                              </span>
                            </>
                          )}
                        </div>
                        {lastResult.playerCorrect && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.2 }}
                            className="text-[9px] font-black text-emerald-400/80"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                          >
                            +{lastResult.playerPts}pts
                          </motion.span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">
                        Answer:{" "}
                        {!lastResult.playerCorrect ? (
                          <TypewriterReveal text={puzzle.answer} color="#ffffff" />
                        ) : (
                          <span className="text-white font-black">{puzzle.answer}</span>
                        )}
                      </p>
                    </motion.div>

                    {/* Opponent result */}
                    <motion.div
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-center justify-between rounded-lg px-3 py-2 backdrop-blur-sm"
                      style={{
                        background: "rgba(15,23,42,0.4)",
                        border: "1px solid rgba(71,85,105,0.4)",
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-5 h-5 rounded-full overflow-hidden border ${theme.border} bg-slate-800 flex items-center justify-center`}
                        >
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={opponentName} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-3 h-3 text-slate-400" />
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{opponentName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {lastResult.opponentCorrect ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span className="text-[9px] font-black text-emerald-400" style={{ fontVariantNumeric: "tabular-nums" }}>+{lastResult.opponentPts}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-red-400" />
                            <span className="text-[9px] font-black text-red-400">Miss</span>
                          </>
                        )}
                      </div>
                    </motion.div>

                    {/* Between-rounds scoreboard comparison */}
                    {currentRound + 1 < TOTAL_ROUNDS && (
                      <RoundScoreboard
                        playerScore={playerScore}
                        opponentScore={opponentScore}
                        playerName="You"
                        opponentName={opponentName}
                        playerColor={theme.solidHex}
                        opponentColor={theme.secondHex}
                      />
                    )}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── PHASE: RESULTS ── */}
      {phase === "results" && (
        <ScreenShake active={shakeResults}>
          <div className="flex flex-col items-center px-4 py-5 relative">
            {/* Background radial glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: playerWon
                  ? "radial-gradient(circle at 50% 30%, rgba(245,158,11,0.1) 0%, transparent 70%)"
                  : `radial-gradient(circle at 50% 30%, ${theme.glowColorSoft} 0%, transparent 70%)`,
              }}
            />

            {/* Victory Rays */}
            {playerWon && <VictoryRays color="#f59e0b" />}

            {/* Win particles */}
            {playerWon && <WinParticles color={theme.solidHex} />}

            <motion.div
              initial={{ scale: 0, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 16 }}
              className="w-full max-w-sm relative"
            >
              {/* Glassmorphic result card */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(15,23,42,0.8)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 60px ${theme.glowColorSoft}`,
                }}
              >
                {/* Rotating conic-gradient border */}
                <motion.div
                  className="absolute inset-0 rounded-2xl pointer-events-none z-0"
                  style={{
                    background: `conic-gradient(from 0deg, transparent, ${theme.solidHex}20, transparent, ${theme.secondHex}20, transparent)`,
                    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    maskComposite: "exclude",
                    WebkitMaskComposite: "xor",
                    padding: "1px",
                    borderRadius: "1rem",
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                />

                {/* Gradient top strip */}
                <div
                  className="h-1.5"
                  style={{
                    background: `linear-gradient(90deg, ${theme.solidHex}, ${theme.secondHex})`,
                  }}
                />

                <div className="p-5 text-center">
                  {/* Result icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
                    className="rounded-full mx-auto mb-3 flex items-center justify-center relative"
                    style={{
                      width: 72,
                      height: 72,
                      background: playerWon
                        ? "rgba(245,158,11,0.1)"
                        : isTie
                        ? "rgba(30,41,59,1)"
                        : "rgba(239,68,68,0.1)",
                      border: `2px solid ${
                        playerWon
                          ? "rgba(245,158,11,0.3)"
                          : isTie
                          ? "rgba(71,85,105,0.5)"
                          : "rgba(239,68,68,0.3)"
                      }`,
                      boxShadow: playerWon
                        ? "0 0 30px rgba(245,158,11,0.2)"
                        : "none",
                    }}
                  >
                    {playerWon ? (
                      <motion.div
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Trophy
                          className="w-9 h-9 text-amber-400"
                          style={{ filter: "drop-shadow(0 0 12px rgba(245,158,11,0.5))" }}
                        />
                      </motion.div>
                    ) : isTie ? (
                      <Smile className="w-9 h-9 text-slate-400" />
                    ) : (
                      <span className="text-4xl">😢</span>
                    )}
                    {playerWon && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ border: "2px solid rgba(245,158,11,0.2)" }}
                        animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl font-black uppercase mb-1"
                    style={{
                      letterSpacing: "0.15em",
                      ...(playerWon
                        ? {
                            background: "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }
                        : {}),
                    }}
                  >
                    {playerWon ? "You Win!" : isTie ? "It's a Tie!" : "Defeated!"}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className={`text-[10px] font-bold uppercase mb-5 ${
                      playerWon ? "text-amber-400/70" : isTie ? "text-slate-400" : "text-red-400/70"
                    }`}
                    style={{ letterSpacing: "0.25em" }}
                  >
                    {playerWon ? "Emoji master!" : isTie ? "Evenly matched" : `${opponentName} decoded faster`}
                  </motion.p>

                  {/* Score comparison with odometer */}
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="rounded-xl p-2.5 backdrop-blur-sm"
                      style={{
                        background: "rgba(30,41,59,0.6)",
                        border: `1px solid ${
                          playerWon ? "rgba(245,158,11,0.3)" : "rgba(71,85,105,0.4)"
                        }`,
                        boxShadow: playerWon
                          ? "0 0 16px rgba(245,158,11,0.1)"
                          : "none",
                      }}
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-1">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <ScoreOdometer
                        value={playerScore}
                        color={playerWon ? "#fbbf24" : "#ffffff"}
                        className="text-lg font-black block"
                      />
                      <p className="text-[6px] text-slate-500 uppercase font-bold" style={{ letterSpacing: "0.25em" }}>You</p>
                    </motion.div>

                    <div className="flex items-center justify-center">
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                        className="text-[10px] font-black text-slate-600 uppercase"
                      >
                        vs
                      </motion.span>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="rounded-xl p-2.5 backdrop-blur-sm"
                      style={{
                        background: "rgba(30,41,59,0.6)",
                        border: `1px solid ${
                          !playerWon && !isTie ? "rgba(245,158,11,0.3)" : "rgba(71,85,105,0.4)"
                        }`,
                        boxShadow:
                          !playerWon && !isTie
                            ? "0 0 16px rgba(245,158,11,0.1)"
                            : "none",
                      }}
                    >
                      <div
                        className={`w-7 h-7 rounded-full overflow-hidden border ${theme.border} bg-slate-800 mx-auto mb-1 flex items-center justify-center`}
                      >
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={opponentName} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <ScoreOdometer
                        value={opponentScore}
                        color={!playerWon && !isTie ? "#fbbf24" : "#ffffff"}
                        className="text-lg font-black block"
                      />
                      <p className="text-[6px] text-slate-500 uppercase font-bold" style={{ letterSpacing: "0.25em" }}>{opponentName}</p>
                    </motion.div>
                  </div>

                  {/* Accuracy ring charts */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center justify-center gap-8 mb-5"
                  >
                    <AccuracyRing
                      percent={playerAccuracy}
                      color="#10b981"
                      label="Your Accuracy"
                      size={52}
                      strokeWidth={4}
                    />
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-black text-emerald-400" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {playerCorrectCount}/{TOTAL_ROUNDS}
                      </span>
                      <span className="text-[6px] text-slate-500 uppercase font-bold" style={{ letterSpacing: "0.25em" }}>
                        Correct
                      </span>
                    </div>
                    <AccuracyRing
                      percent={opponentAccuracy}
                      color={theme.solidHex}
                      label={`${opponentName} Acc`}
                      size={52}
                      strokeWidth={4}
                    />
                  </motion.div>

                  {/* Round-by-round vertical timeline */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="rounded-xl p-3 mb-4"
                    style={{
                      background: "rgba(30,41,59,0.4)",
                      border: "1px solid rgba(71,85,105,0.25)",
                    }}
                  >
                    <p
                      className="text-[8px] font-black text-slate-500 uppercase mb-2"
                      style={{ letterSpacing: "0.25em" }}
                    >
                      Round Breakdown
                    </p>
                    <div className="relative">
                      {/* Connecting vertical line */}
                      <div
                        className="absolute left-[7px] top-2 bottom-2 w-[1px]"
                        style={{ background: "rgba(71,85,105,0.3)" }}
                      />
                      <div className="space-y-2">
                        {roundResults.map((r, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 + i * 0.12 }}
                            className="flex items-start gap-3 relative"
                          >
                            {/* Timeline dot */}
                            <div
                              className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-1 z-10 flex items-center justify-center"
                              style={{
                                background: r.playerCorrect ? "#10b981" : "#ef4444",
                                boxShadow: r.playerCorrect
                                  ? "0 0 8px rgba(16,185,129,0.5)"
                                  : "0 0 8px rgba(239,68,68,0.5)",
                              }}
                            >
                              {r.playerCorrect ? (
                                <span className="text-[6px] text-white font-black">✓</span>
                              ) : (
                                <span className="text-[6px] text-white font-black">✗</span>
                              )}
                            </div>
                            {/* Content */}
                            <div
                              className="flex-1 rounded-lg px-2.5 py-1.5"
                              style={{
                                background: r.playerCorrect
                                  ? "rgba(16,185,129,0.05)"
                                  : "rgba(239,68,68,0.03)",
                                border: `1px solid ${r.playerCorrect ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.1)"}`,
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm">{r.puzzle.emojis}</span>
                                <div className="flex items-center gap-1">
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{
                                      background: r.playerCorrect ? "#10b981" : "#ef4444",
                                    }}
                                  />
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{
                                      background: r.opponentCorrect ? "#10b981" : "#ef4444",
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-0.5">
                                <span className="text-[8px] font-bold text-slate-500">{r.puzzle.answer}</span>
                                {r.playerGuess && (
                                  <span className={`text-[7px] font-bold ${r.playerCorrect ? "text-emerald-400" : "text-red-400"}`}>
                                    "{r.playerGuess}"
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 mt-2">
                      <span className="text-[7px] font-bold text-slate-600">● You</span>
                      <span className="text-[7px] font-bold text-slate-600">● {opponentName}</span>
                    </div>
                  </motion.div>

                  {/* Action buttons — improved */}
                  <div className="space-y-2">
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                      whileTap={{ scale: 0.93 }}
                      onClick={handlePlayAgain}
                      className="w-full py-3 rounded-2xl text-white font-black text-xs uppercase flex items-center justify-center gap-2 relative overflow-hidden"
                      style={{
                        letterSpacing: "0.15em",
                        background: `linear-gradient(135deg, ${theme.solidHex}, ${theme.secondHex})`,
                        boxShadow: `0 4px 20px ${theme.glowColorMid}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                      }}
                    >
                      <RotateCcw className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">Play Again</span>
                      {/* Shimmer */}
                      <motion.div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                        }}
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          repeatDelay: 1.5,
                          ease: "easeInOut",
                        }}
                      />
                    </motion.button>

                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      whileTap={{ scale: 0.93 }}
                      onClick={onComplete}
                      className="w-full py-2.5 rounded-xl text-slate-300 text-xs font-bold transition-all"
                      style={{
                        background: "rgba(30,41,59,0.8)",
                        border: "1px solid rgba(71,85,105,0.4)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                      }}
                    >
                      Done
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </ScreenShake>
      )}
    </div>
  );
}
