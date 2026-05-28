import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import {
  ChevronLeft,
  Smile,
  Timer,
  Zap,
  Trophy,
  Star,
  CheckCircle2,
  XCircle,
  Flame,
  Sparkles,
  Heart,
  UserPlus,
  Briefcase,
  RotateCcw,
  Award,
  Lightbulb,
  Eye,
  EyeOff,
  Send,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────
type Category = "dating" | "friends" | "business";

interface EmojiDecodeProps {
  onBack: () => void;
  category?: Category;
}

interface Puzzle {
  emojis: string;
  answer: string;
  hints: string[];
  category: "movie" | "phrase" | "song" | "concept";
  difficulty: "easy" | "medium" | "hard";
}

// ─── Themed puzzle banks ─────────────────────────────────────────
const PUZZLES: Record<Category, Puzzle[]> = {
  dating: [
    { emojis: "💘🏹👼", answer: "cupid", hints: ["Valentine's helper", "Has wings and a bow"], category: "concept", difficulty: "easy" },
    { emojis: "🌹🚢💔", answer: "titanic", hints: ["Classic love story", "Jack and Rose"], category: "movie", difficulty: "easy" },
    { emojis: "💌✈️📬", answer: "love letter", hints: ["Written feelings", "Sent from the heart"], category: "concept", difficulty: "easy" },
    { emojis: "🦋🫃😍", answer: "butterflies", hints: ["That nervous feeling", "In your stomach"], category: "concept", difficulty: "easy" },
    { emojis: "🍝🕯️🍷", answer: "dinner date", hints: ["Romantic evening", "Candlelit ambiance"], category: "concept", difficulty: "easy" },
    { emojis: "💏🌉🌙", answer: "moonlight kiss", hints: ["Under the stars", "On a bridge"], category: "concept", difficulty: "medium" },
    { emojis: "📱💬❤️🔥", answer: "flirting", hints: ["Texting game", "Sending signals"], category: "concept", difficulty: "easy" },
    { emojis: "🎭🖤🌹", answer: "phantom of the opera", hints: ["Broadway classic", "Masked romance"], category: "movie", difficulty: "hard" },
    { emojis: "💕📖✨", answer: "love story", hints: ["Taylor Swift classic", "A tale as old as time"], category: "song", difficulty: "easy" },
    { emojis: "🏰👸🐉", answer: "shrek", hints: ["Animated fairy tale", "Ogre love story"], category: "movie", difficulty: "easy" },
    { emojis: "⭐🌙💫", answer: "stargazing", hints: ["Nighttime activity", "Looking up together"], category: "concept", difficulty: "easy" },
    { emojis: "🎡🎢🍭", answer: "carnival date", hints: ["Fun outing", "Rides and treats"], category: "concept", difficulty: "medium" },
    { emojis: "🧊🏔️❄️👑", answer: "frozen", hints: ["Let it go", "Disney princess"], category: "movie", difficulty: "easy" },
    { emojis: "💍💒👰🤵", answer: "wedding", hints: ["Happily ever after", "Ceremony of love"], category: "concept", difficulty: "easy" },
    { emojis: "☕📚🌧️", answer: "cozy date", hints: ["Stay-in romance", "Rain outside"], category: "concept", difficulty: "medium" },
  ],
  friends: [
    { emojis: "🍕🎮🛋️", answer: "game night", hints: ["Chill hangout", "Pizza and controllers"], category: "concept", difficulty: "easy" },
    { emojis: "🏖️🌊🏄", answer: "beach day", hints: ["Sandy adventure", "Waves and sun"], category: "concept", difficulty: "easy" },
    { emojis: "🎤🎵🎶", answer: "karaoke", hints: ["Sing your heart out", "Grab the mic"], category: "concept", difficulty: "easy" },
    { emojis: "🏕️🔥🌌", answer: "camping", hints: ["Outdoor sleepover", "Under the stars"], category: "concept", difficulty: "easy" },
    { emojis: "🎳🎯🏆", answer: "bowling", hints: ["Strike!", "Roll the ball"], category: "concept", difficulty: "easy" },
    { emojis: "🎒🗺️✈️", answer: "road trip", hints: ["Adventure awaits", "Pack your bags"], category: "concept", difficulty: "easy" },
    { emojis: "🃏🎲🍺", answer: "poker night", hints: ["Cards on the table", "Bluff or fold"], category: "concept", difficulty: "medium" },
    { emojis: "👻🎃🍬", answer: "halloween", hints: ["Trick or treat", "Costume party"], category: "concept", difficulty: "easy" },
    { emojis: "🎬🍿🥤", answer: "movie night", hints: ["Big screen", "Popcorn bucket"], category: "concept", difficulty: "easy" },
    { emojis: "🏋️‍♂️💪🥊", answer: "gym buddy", hints: ["Workout partner", "Stronger together"], category: "concept", difficulty: "medium" },
    { emojis: "📸🤳✌️", answer: "selfie", hints: ["Say cheese!", "Phone camera"], category: "concept", difficulty: "easy" },
    { emojis: "🎂🎈🎉", answer: "birthday party", hints: ["Celebration time", "Make a wish"], category: "concept", difficulty: "easy" },
    { emojis: "🧩🔍🕵️", answer: "escape room", hints: ["Solve the clues", "60 minutes"], category: "concept", difficulty: "medium" },
    { emojis: "🎸🥁🎹", answer: "jam session", hints: ["Making music", "Band practice"], category: "concept", difficulty: "medium" },
    { emojis: "🏀⛹️🔥", answer: "pickup game", hints: ["Ball is life", "Court time"], category: "concept", difficulty: "medium" },
  ],
  business: [
    { emojis: "🤝💼📈", answer: "business deal", hints: ["Signed agreement", "Growth partnership"], category: "concept", difficulty: "easy" },
    { emojis: "💡🚀🦄", answer: "startup", hints: ["Innovation hub", "Disruptive idea"], category: "concept", difficulty: "easy" },
    { emojis: "📊📉📈", answer: "stock market", hints: ["Wall Street", "Bulls and bears"], category: "concept", difficulty: "easy" },
    { emojis: "🎯🏹💰", answer: "sales target", hints: ["Hit the goal", "Revenue milestone"], category: "concept", difficulty: "medium" },
    { emojis: "☕💻🏠", answer: "remote work", hints: ["WFH life", "No commute"], category: "concept", difficulty: "easy" },
    { emojis: "🎙️📱💫", answer: "podcast", hints: ["Audio content", "Subscribe & listen"], category: "concept", difficulty: "easy" },
    { emojis: "🧠💭🗣️", answer: "brainstorm", hints: ["Idea generation", "Think tank"], category: "concept", difficulty: "easy" },
    { emojis: "📧📎✅", answer: "email", hints: ["Digital mail", "Inbox zero"], category: "concept", difficulty: "easy" },
    { emojis: "🏢🔝👔", answer: "promotion", hints: ["Moving up", "Corner office"], category: "concept", difficulty: "easy" },
    { emojis: "🤖🧬🔮", answer: "artificial intelligence", hints: ["Machine learning", "The future is now"], category: "concept", difficulty: "medium" },
    { emojis: "📱🛒🛍️", answer: "e-commerce", hints: ["Online shopping", "Add to cart"], category: "concept", difficulty: "easy" },
    { emojis: "🎓📚🧪", answer: "research", hints: ["Deep dive", "Academic pursuit"], category: "concept", difficulty: "medium" },
    { emojis: "🌐🔗⛓️", answer: "blockchain", hints: ["Decentralized", "Crypto foundation"], category: "concept", difficulty: "medium" },
    { emojis: "📝✍️📋", answer: "contract", hints: ["Sign here", "Legal agreement"], category: "concept", difficulty: "easy" },
    { emojis: "🏗️🏛️🌆", answer: "construction", hints: ["Building dreams", "Hard hat zone"], category: "concept", difficulty: "easy" },
  ],
};

// ─── Opponent names per category ─────────────────────────────────
const OPPONENTS: Record<Category, { name: string; emoji: string; photo: string }[]> = {
  dating: [
    { name: "Sophie", emoji: "💋", photo: "https://i.pravatar.cc/100?img=5" },
    { name: "Jade", emoji: "💎", photo: "https://i.pravatar.cc/100?img=9" },
    { name: "Luna", emoji: "🌙", photo: "https://i.pravatar.cc/100?img=16" },
    { name: "Marcus", emoji: "🔥", photo: "https://i.pravatar.cc/100?img=11" },
  ],
  friends: [
    { name: "Tyler", emoji: "🎮", photo: "https://i.pravatar.cc/100?img=12" },
    { name: "Mika", emoji: "🎵", photo: "https://i.pravatar.cc/100?img=20" },
    { name: "Kai", emoji: "🏄", photo: "https://i.pravatar.cc/100?img=33" },
    { name: "Zoe", emoji: "⚡", photo: "https://i.pravatar.cc/100?img=25" },
  ],
  business: [
    { name: "Alex", emoji: "📊", photo: "https://i.pravatar.cc/100?img=3" },
    { name: "Nina", emoji: "🚀", photo: "https://i.pravatar.cc/100?img=23" },
    { name: "Derek", emoji: "💼", photo: "https://i.pravatar.cc/100?img=7" },
    { name: "Priya", emoji: "💡", photo: "https://i.pravatar.cc/100?img=26" },
  ],
};

const TOTAL_ROUNDS = 7;
const TIME_PER_ROUND = 30;

const themes: Record<Category, { gradient: string; text: string; accent: string; bg: string; glow: string; rgb: string }> = {
  dating: { gradient: "from-pink-500 via-rose-500 to-red-500", text: "text-pink-400", accent: "border-pink-500/30", bg: "bg-pink-500/10", glow: "shadow-pink-500/30", rgb: "236,72,153" },
  friends: { gradient: "from-emerald-500 via-teal-500 to-cyan-500", text: "text-emerald-400", accent: "border-emerald-500/30", bg: "bg-emerald-500/10", glow: "shadow-emerald-500/30", rgb: "16,185,129" },
  business: { gradient: "from-blue-500 via-indigo-500 to-purple-500", text: "text-blue-400", accent: "border-blue-500/30", bg: "bg-blue-500/10", glow: "shadow-blue-500/30", rgb: "59,130,246" },
};

// ─── SVG Noise Overlay ───────────────────────────────────────────
function NoiseOverlay() {
  return (
    <svg className="pointer-events-none fixed inset-0 z-[1] w-full h-full opacity-[0.03]">
      <filter id="emoji-noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#emoji-noise)" />
    </svg>
  );
}

// ─── Floating Background Orbs ────────────────────────────────────
function FloatingOrbs({ category }: { category: Category }) {
  const orbColors: Record<Category, string[]> = {
    dating: ["rgba(236,72,153,0.12)", "rgba(244,63,94,0.10)", "rgba(251,113,133,0.08)", "rgba(190,24,93,0.10)", "rgba(219,39,119,0.07)", "rgba(244,114,182,0.09)"],
    friends: ["rgba(16,185,129,0.12)", "rgba(20,184,166,0.10)", "rgba(6,182,212,0.08)", "rgba(5,150,105,0.10)", "rgba(13,148,136,0.07)", "rgba(34,211,238,0.09)"],
    business: ["rgba(59,130,246,0.12)", "rgba(99,102,241,0.10)", "rgba(168,85,247,0.08)", "rgba(37,99,235,0.10)", "rgba(79,70,229,0.07)", "rgba(139,92,246,0.09)"],
  };
  const colors = orbColors[category];
  const orbs = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    id: i,
    size: 120 + Math.random() * 200,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 18 + Math.random() * 14,
    delay: i * 1.2,
    color: colors[i % colors.length],
  })), [category]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[0] overflow-hidden">
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className="absolute rounded-full blur-3xl"
          style={{
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            left: `${orb.x}%`,
            top: `${orb.y}%`,
          }}
          animate={{
            x: [0, 50, -30, 20, 0],
            y: [0, -40, 30, -20, 0],
            scale: [1, 1.15, 0.9, 1.05, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}
    </div>
  );
}

// ─── Ambient Dust Motes ──────────────────────────────────────────
function DustMotes() {
  const motes = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    id: i,
    size: 1.5 + Math.random() * 2.5,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 12 + Math.random() * 16,
    delay: i * 0.8,
  })), []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[2] overflow-hidden">
      {motes.map((m) => (
        <motion.div
          key={m.id}
          className="absolute rounded-full bg-white/20"
          style={{ width: m.size, height: m.size, left: `${m.x}%`, top: `${m.y}%` }}
          animate={{
            y: [0, -60, -120],
            x: [0, 15, -10, 5],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: m.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: m.delay,
          }}
        />
      ))}
    </div>
  );
}

// ─── Spring-Physics Animated Counter ─────────────────────────────
function AnimatedScore({ value, className = "" }: { value: number; className?: string }) {
  const spring = useSpring(0, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v));
  const [rendered, setRendered] = useState(0);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = display.on("change", (v) => setRendered(v));
    return unsubscribe;
  }, [display]);

  return <motion.span className={className}>{rendered}</motion.span>;
}

// ─── Circular Timer Ring ─────────────────────────────────────────
function TimerRing({ timeLeft, total, submitted }: { timeLeft: number; total: number; submitted: boolean }) {
  const progress = submitted ? 0 : timeLeft / total;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference * progress;
  const strokeColor = timeLeft <= 5 ? "#ef4444" : timeLeft <= 10 ? "#f59e0b" : "#10b981";

  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <motion.circle
          cx="22" cy="22" r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference - strokeDash }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </svg>
      <span className={`text-xs font-black tabular-nums ${timeLeft <= 5 ? "text-red-400" : timeLeft <= 10 ? "text-amber-400" : "text-emerald-400"}`}>
        {submitted ? "—" : timeLeft}
      </span>
    </div>
  );
}

// ─── Flying Points Animation ─────────────────────────────────────
function FlyingPoints({ points, show }: { points: number; show: boolean }) {
  if (!show || points <= 0) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1, y: 0, scale: 1 }}
        animate={{ opacity: 0, y: -60, scale: 1.3 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute top-0 left-1/2 -translate-x-1/2 text-amber-400 font-black text-lg pointer-events-none z-50"
      >
        +{points}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Emoji Confetti Burst ────────────────────────────────────────
function EmojiConfetti({ active }: { active: boolean }) {
  const particles = useMemo(() => {
    const emojis = ["🎉", "✨", "🌟", "🎊", "💫", "⭐", "🏆", "🔥", "💎", "🎯"];
    return Array.from({ length: 16 }, (_, i) => ({
      id: i,
      emoji: emojis[i % emojis.length],
      x: (Math.random() - 0.5) * 300,
      y: -(100 + Math.random() * 200),
      rotate: Math.random() * 720 - 360,
      delay: Math.random() * 0.4,
      size: 14 + Math.random() * 14,
    }));
  }, [active]);

  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute"
          style={{ fontSize: p.size }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate, scale: 1.2 }}
          transition={{ duration: 1.8, ease: "easeOut", delay: p.delay }}
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
  );
}

// ─── Glassmorphic Card Wrapper ───────────────────────────────────
function GlassCard({ children, className = "", glow = false, glowColor = "" }: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  glowColor?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl border border-white/[0.08] backdrop-blur-xl ${className}`}
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
        boxShadow: glow ? `0 0 30px -5px ${glowColor || "rgba(251,191,36,0.15)"}` : "0 8px 32px rgba(0,0,0,0.3)",
      }}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ═══ MAIN COMPONENT ══════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
export default function EmojiDecode({ onBack, category = "dating" }: EmojiDecodeProps) {
  const theme = themes[category];
  const [phase, setPhase] = useState<"matchmaking" | "countdown" | "playing" | "review" | "results">("matchmaking");
  const [opponent, setOpponent] = useState<{ name: string; emoji: string; photo: string; speed: number; accuracy: number } | null>(null);
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_ROUND);
  const [guess, setGuess] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [playerCorrect, setPlayerCorrect] = useState(false);
  const [opponentCorrect, setOpponentCorrect] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [playerResults, setPlayerResults] = useState<boolean[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [revealedHints, setRevealedHints] = useState<number[]>([]);
  const [countdown, setCountdown] = useState(3);
  const [submitted, setSubmitted] = useState(false);
  const [lastPoints, setLastPoints] = useState(0);
  const [showPoints, setShowPoints] = useState(false);
  const [screenShake, setScreenShake] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const p = puzzles[currentRound];

  // ─── Matchmaking ─────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "matchmaking") return;
    const cat = category;
    const oppList = OPPONENTS[cat];
    const timer = setTimeout(() => {
      const opp = oppList[Math.floor(Math.random() * oppList.length)];
      setOpponent({ ...opp, speed: 0.3 + Math.random() * 0.5, accuracy: 0.5 + Math.random() * 0.4 });
      const pool = [...PUZZLES[cat]];
      const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, TOTAL_ROUNDS);
      setPuzzles(shuffled);
      setPhase("countdown");
    }, 1500 + Math.random() * 1000);
    return () => clearTimeout(timer);
  }, [phase, category]);

  // ─── Countdown ───────────────────────────────────────────────
  useEffect(() => {
    if (phase === "countdown") {
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setPhase("playing");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // ─── Round timer ─────────────────────────────────────────────
  useEffect(() => {
    if (phase === "playing" && !showResult) {
      setTimeLeft(TIME_PER_ROUND);
      setGuess("");
      setSubmitted(false);
      submittedRef.current = false;
      setRevealedHints([]);
      setPlayerCorrect(false);
      setOpponentCorrect(false);
      setShowPoints(false);

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            if (!submittedRef.current) {
              submittedRef.current = true;
              setSubmitted(true);
              setPlayerCorrect(false);
              setPlayerResults(pr => [...pr, false]);
              setStreak(0);
              setScreenShake(true);
              setTimeout(() => setScreenShake(false), 500);
              simulateOpponent(false);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setTimeout(() => inputRef.current?.focus(), 300);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [phase, currentRound, showResult]);

  const simulateOpponent = useCallback((playerGotIt: boolean) => {
    if (!opponent) return;
    const isCorrect = Math.random() < opponent.accuracy;
    setOpponentCorrect(isCorrect);
    if (isCorrect) {
      const timeBonus = Math.round(Math.random() * 15 * 5);
      setOpponentScore(prev => prev + 100 + timeBonus);
    }
    setShowResult(true);
    setPhase("review");
  }, [opponent]);

  const handleSubmit = useCallback(() => {
    if (submittedRef.current || !p) return;
    submittedRef.current = true;
    setSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const normalized = guess.trim().toLowerCase().replace(/[^a-z0-9 ]/g, "");
    const answer = p.answer.toLowerCase().replace(/[^a-z0-9 ]/g, "");
    const isCorrect = normalized === answer ||
      normalized.includes(answer) ||
      answer.includes(normalized) ||
      (normalized.length > 3 && levenshtein(normalized, answer) <= 2);

    setPlayerCorrect(isCorrect);
    setPlayerResults(prev => [...prev, isCorrect]);

    if (isCorrect) {
      const timeBonus = Math.round(timeLeft * 3);
      const streakBonus = streak * 15;
      const hintPenalty = revealedHints.length * 25;
      const points = Math.max(50, 100 + timeBonus + streakBonus - hintPenalty);
      setPlayerScore(prev => prev + points);
      setLastPoints(points);
      setShowPoints(true);
      setTimeout(() => setShowPoints(false), 1200);
      setStreak(prev => {
        const newStreak = prev + 1;
        setBestStreak(bs => Math.max(bs, newStreak));
        return newStreak;
      });
    } else {
      setStreak(0);
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 500);
    }

    simulateOpponent(isCorrect);
  }, [guess, p, timeLeft, streak, revealedHints, simulateOpponent]);

  const handleRevealHint = useCallback(() => {
    if (!p || revealedHints.length >= p.hints.length) return;
    setRevealedHints(prev => [...prev, prev.length]);
    setHintsUsed(prev => prev + 1);
  }, [p, revealedHints]);

  const handleNextRound = useCallback(() => {
    if (currentRound + 1 >= TOTAL_ROUNDS) {
      setPhase("results");
    } else {
      setCurrentRound(prev => prev + 1);
      setShowResult(false);
      setPhase("playing");
    }
  }, [currentRound]);

  const handleRestart = () => {
    setPhase("matchmaking");
    setOpponent(null);
    setPuzzles([]);
    setCurrentRound(0);
    setTimeLeft(TIME_PER_ROUND);
    setGuess("");
    setShowResult(false);
    setPlayerScore(0);
    setOpponentScore(0);
    setStreak(0);
    setBestStreak(0);
    setPlayerResults([]);
    setHintsUsed(0);
    setRevealedHints([]);
    setSubmitted(false);
    setShowPoints(false);
    setScreenShake(false);
  };

  function levenshtein(a: string, b: string): number {
    const dp = Array.from({ length: a.length + 1 }, (_, i) =>
      Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
    return dp[a.length][b.length];
  }

  const playerWon = playerScore > opponentScore;
  const tie = playerScore === opponentScore;
  const correctCount = playerResults.filter(Boolean).length;
  const accuracy = playerResults.length > 0 ? Math.round((correctCount / playerResults.length) * 100) : 0;
  const leading = playerScore >= opponentScore;

  // ─── Dynamic color temperature ─────────────────────────────
  const warmCool = leading
    ? "from-amber-950/20 via-slate-950 to-slate-950"
    : "from-slate-950 via-slate-950 to-blue-950/20";

  return (
    <motion.div
      className={`fixed inset-0 bg-gradient-to-br ${warmCool} text-white overflow-hidden`}
      animate={screenShake ? { x: [0, -6, 6, -4, 4, 0], y: [0, 3, -3, 2, -2, 0] } : { x: 0, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <NoiseOverlay />
      <FloatingOrbs category={category} />
      <DustMotes />

      {/* ── HEADER ── */}
      <div className="fixed top-0 left-0 right-0 z-[60]" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.06] bg-slate-950/60 backdrop-blur-2xl">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/[0.05] backdrop-blur-md border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.1] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-300" />
          </motion.button>
          <div className="flex items-center gap-2">
            <Smile className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-black uppercase tracking-[0.2em] bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
              Emoji Decode
            </span>
          </div>
          {(phase === "playing" || phase === "review") ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
              <span className="text-[10px] font-black text-slate-400 tracking-wider">{currentRound + 1}/{TOTAL_ROUNDS}</span>
            </div>
          ) : (
            <div style={{ width: "60px" }} />
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="absolute inset-0 flex flex-col z-[10]" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 56px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

        {/* ── MATCHMAKING ── */}
        {phase === "matchmaking" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              className="relative"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/15 to-pink-500/15 border border-amber-500/20 flex items-center justify-center backdrop-blur-xl">
                <Smile className="w-10 h-10 text-amber-400" />
              </div>
              <div className="absolute inset-0 rounded-2xl animate-ping bg-amber-500/10" />
            </motion.div>
            <div className="text-center">
              <h2 className="text-lg font-black tracking-wide bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mb-1.5">
                Finding Decoder...
              </h2>
              <p className="text-xs text-slate-500 tracking-wide">Matching you with an emoji expert</p>
            </div>
            <div className="flex gap-2">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-500 to-pink-500"
                  animate={{ scale: [1, 1.6, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25 }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── COUNTDOWN (Cinematic Letterbox) ── */}
        {phase === "countdown" && (
          <div className="flex-1 flex flex-col items-center justify-center relative">
            {/* Letterbox bars */}
            <motion.div
              className="absolute top-0 left-0 right-0 bg-black z-10"
              initial={{ height: 0 }}
              animate={{ height: 60 }}
              transition={{ duration: 0.5 }}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-black z-10"
              initial={{ height: 0 }}
              animate={{ height: 60 }}
              transition={{ duration: 0.5 }}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={countdown}
                initial={{ scale: 3, opacity: 0, filter: "blur(20px)" }}
                animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                exit={{ scale: 0.5, opacity: 0, filter: "blur(10px)" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative"
              >
                <span className="text-9xl font-black bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                  {countdown === 0 ? "GO!" : countdown}
                </span>
                {/* Pulse ring */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <div className="w-32 h-32 rounded-full border-2 border-amber-400/40" />
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {opponent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-10 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                  <img src={opponent.photo} alt={opponent.name} className="w-full h-full object-cover" />
                </div>
                <p className="text-sm text-slate-400 font-bold tracking-wide">
                  vs <span className="text-white">{opponent.name}</span> {opponent.emoji}
                </p>
              </motion.div>
            )}
          </div>
        )}

        {/* ── PLAYING / REVIEW ── */}
        {(phase === "playing" || phase === "review") && p && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            {/* Score bar */}
            <div className="px-4 pt-3 pb-2">
              <GlassCard className="px-3 py-2.5">
                <div className="flex items-center gap-3">
                  {/* Player */}
                  <div className="flex items-center gap-2 flex-1 relative">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-pink-500 flex items-center justify-center text-xs">
                        {leading && playerScore > 0 ? "👑" : "👤"}
                      </div>
                      {streak >= 2 && (
                        <motion.span
                          className="absolute -top-1 -right-1 text-[10px]"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                        >
                          🔥
                        </motion.span>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 leading-tight">You</p>
                      <div className="relative">
                        <AnimatedScore value={playerScore} className={`text-sm font-black ${theme.text}`} />
                        <FlyingPoints points={lastPoints} show={showPoints} />
                      </div>
                    </div>
                    {streak >= 2 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-1 px-1.5 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/20"
                      >
                        <span className="text-[9px] font-black text-orange-400">{streak}🔥</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Timer Ring */}
                  <TimerRing timeLeft={timeLeft} total={TIME_PER_ROUND} submitted={submitted} />

                  {/* Progress dots */}
                  <div className="flex gap-1 mx-1">
                    {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
                      <motion.div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${
                          i < playerResults.length
                            ? playerResults[i] ? "bg-emerald-400" : "bg-red-400"
                            : i === currentRound ? "bg-amber-400" : "bg-slate-700"
                        }`}
                        animate={i === currentRound && !submitted ? { scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    ))}
                  </div>

                  {/* Opponent */}
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 leading-tight">{opponent?.name}</p>
                      <AnimatedScore value={opponentScore} className="text-sm font-black text-slate-300" />
                    </div>
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                        {opponent && <img src={opponent.photo} alt={opponent.name} className="w-full h-full object-cover" />}
                      </div>
                      {!leading && opponentScore > 0 && (
                        <span className="absolute -top-1 -right-1 text-[10px]">👑</span>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Puzzle Card */}
            <div className="flex flex-col items-center px-4 py-4 my-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentRound}
                  initial={{ x: 100, opacity: 0, scale: 0.95 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  exit={{ x: -100, opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="w-full max-w-md"
                >
                  {/* Badges row */}
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md border ${
                      p.difficulty === "easy" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      p.difficulty === "medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                      {p.difficulty === "easy" ? "⚡" : p.difficulty === "medium" ? "🎯" : "💀"} {p.difficulty}
                    </span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/[0.04] text-slate-500 border border-white/[0.06]">
                      {p.category}
                    </span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/[0.04] text-slate-500 border border-white/[0.06]">
                      Puzzle {currentRound + 1}/{TOTAL_ROUNDS}
                    </span>
                  </div>

                  {/* Emoji Display — Large Glassmorphic Card */}
                  <GlassCard
                    className="p-8 mb-4 text-center relative overflow-hidden"
                    glow
                    glowColor={`rgba(${theme.rgb},0.1)`}
                  >
                    {/* Radial gradient behind emojis */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at center, rgba(${theme.rgb},0.08) 0%, transparent 70%)`,
                      }}
                    />
                    <motion.p
                      className="text-6xl tracking-[0.35em] leading-relaxed select-none relative z-10"
                      animate={!submitted ? {
                        y: [0, -4, 0],
                      } : {}}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {/* Stagger each emoji character */}
                      {[...p.emojis].map((char, i) => (
                        <motion.span
                          key={`${currentRound}-${i}`}
                          initial={{ y: 30, opacity: 0, scale: 0.5 }}
                          animate={{ y: 0, opacity: 1, scale: 1 }}
                          transition={{
                            delay: 0.1 + i * 0.12,
                            type: "spring",
                            stiffness: 300,
                            damping: 15,
                          }}
                          className="inline-block"
                        >
                          {char}
                        </motion.span>
                      ))}
                    </motion.p>
                  </GlassCard>

                  {/* Hints */}
                  {!submitted && (
                    <div className="mb-4">
                      {/* Hint counter badge */}
                      <div className="flex items-center justify-center mb-2">
                        <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                          {revealedHints.length}/{p.hints.length} hints used
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {p.hints.map((hint, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + i * 0.15 }}
                            className="flex-1"
                          >
                            {revealedHints.includes(i) ? (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                              >
                                <GlassCard className="px-3 py-2.5 border-amber-500/20" glow glowColor="rgba(245,158,11,0.08)">
                                  <div className="flex items-start gap-2">
                                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                    <motion.span
                                      initial={{ x: -10, opacity: 0 }}
                                      animate={{ x: 0, opacity: 1 }}
                                      transition={{ type: "spring", stiffness: 250, damping: 18, delay: 0.1 }}
                                      className="text-xs text-amber-300 font-medium"
                                    >
                                      {hint}
                                    </motion.span>
                                  </div>
                                </GlassCard>
                              </motion.div>
                            ) : (
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleRevealHint}
                                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl px-3 py-2.5 flex items-center justify-center gap-2 hover:bg-amber-500/5 hover:border-amber-500/15 transition-all"
                                style={{ boxShadow: "0 0 15px rgba(245,158,11,0.05)" }}
                              >
                                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-xs text-slate-500 font-bold">Hint {i + 1}</span>
                              </motion.button>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input area */}
                  {!submitted ? (
                    <div className="flex gap-2">
                      <div className="flex-1 relative group">
                        <input
                          ref={inputRef}
                          type="text"
                          value={guess}
                          onChange={e => setGuess(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && guess.trim() && handleSubmit()}
                          placeholder="Type your guess..."
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/40 focus:bg-white/[0.06] transition-all backdrop-blur-xl"
                          style={{ boxShadow: "0 0 0 0px rgba(251,191,36,0)" }}
                          autoComplete="off"
                        />
                        {/* Character count */}
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600 tabular-nums">
                          {guess.length}
                        </span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={handleSubmit}
                        disabled={!guess.trim()}
                        className={`px-5 rounded-xl bg-gradient-to-r ${theme.gradient} text-white font-bold text-sm flex items-center gap-1.5 disabled:opacity-20 disabled:cursor-not-allowed transition-all`}
                        style={{
                          boxShadow: guess.trim() ? `0 0 25px rgba(${theme.rgb},0.3)` : "none",
                        }}
                      >
                        <Send className="w-4 h-4" />
                      </motion.button>
                    </div>
                  ) : (
                    /* Result display */
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="space-y-3 relative"
                    >
                      {/* Confetti on correct */}
                      <EmojiConfetti active={playerCorrect} />

                      {/* Player result */}
                      <motion.div
                        initial={{ x: playerCorrect ? 0 : 0 }}
                        animate={playerCorrect
                          ? { scale: [1, 1.02, 1], boxShadow: ["0 0 0px rgba(16,185,129,0)", "0 0 30px rgba(16,185,129,0.2)", "0 0 0px rgba(16,185,129,0)"] }
                          : { x: [0, -8, 8, -4, 4, 0] }
                        }
                        transition={playerCorrect ? { duration: 1.5, repeat: 2 } : { duration: 0.4 }}
                      >
                        <GlassCard
                          className={`p-4 ${playerCorrect ? "border-emerald-500/20" : "border-red-500/20"}`}
                          glow
                          glowColor={playerCorrect ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)"}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.15 }}
                            >
                              {playerCorrect ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-400" />
                              )}
                            </motion.div>
                            <span className={`text-sm font-black uppercase tracking-wider ${playerCorrect ? "text-emerald-400" : "text-red-400"}`}>
                              {playerCorrect ? "Correct!" : timeLeft === 0 && !guess.trim() ? "Time's Up!" : "Wrong!"}
                            </span>
                            {playerCorrect && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3, type: "spring" }}
                                className="ml-auto text-lg"
                              >
                                🎉
                              </motion.span>
                            )}
                          </div>
                          {guess.trim() && (
                            <p className="text-xs text-slate-400">Your guess: <span className="text-white font-bold">{guess}</span></p>
                          )}
                          {!playerCorrect && (
                            <p className="text-xs text-slate-400 mt-1">Answer: <span className="text-amber-400 font-bold capitalize">{p.answer}</span></p>
                          )}
                        </GlassCard>
                      </motion.div>

                      {/* Opponent result */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <GlassCard className={`p-3 ${opponentCorrect ? "border-emerald-500/10" : "border-red-500/10"}`}>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full overflow-hidden border border-white/10">
                              {opponent && <img src={opponent.photo} alt="" className="w-full h-full object-cover" />}
                            </div>
                            <span className="text-xs text-slate-400 font-medium">{opponent?.name}</span>
                            {opponentCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400 ml-auto" />
                            )}
                          </div>
                        </GlassCard>
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ── REVIEW FOOTER ── */}
        {showResult && p && phase === "review" && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-0 left-0 right-0 z-[61] px-6 pb-6 pt-3 bg-slate-950/80 backdrop-blur-2xl border-t border-white/[0.06]"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNextRound}
              className={`w-full py-4 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-black text-sm uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-transform relative overflow-hidden`}
              style={{ boxShadow: `0 0 30px rgba(${theme.rgb},0.25)` }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
              />
              <span className="relative z-10 flex items-center gap-2">
                {currentRound + 1 >= TOTAL_ROUNDS ? (
                  <>
                    <Trophy className="w-5 h-5" />
                    <span>See Results</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Next Puzzle</span>
                  </>
                )}
              </span>
            </motion.button>
          </motion.div>
        )}

        {/* ── RESULTS ── */}
        {phase === "results" && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
            {/* Victory rays for winner */}
            {playerWon && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div
                  className="w-[500px] h-[500px] rounded-full"
                  style={{
                    background: "conic-gradient(from 0deg, transparent, rgba(251,191,36,0.06), transparent, rgba(251,191,36,0.04), transparent, rgba(251,191,36,0.06), transparent)",
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            )}

            <EmojiConfetti active={playerWon} />

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15, stiffness: 200 }}
              className="w-full max-w-sm relative"
            >
              {/* Rotating conic-gradient border */}
              <div className="absolute -inset-[1px] rounded-3xl overflow-hidden">
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: `conic-gradient(from 0deg, rgba(${theme.rgb},0.3), transparent 30%, rgba(${theme.rgb},0.15), transparent 60%, rgba(${theme.rgb},0.3))`,
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
              </div>

              <div className="relative rounded-3xl bg-slate-950/90 backdrop-blur-2xl p-6 space-y-5 border border-white/[0.05]">
                {/* Result header */}
                <div className={`-mt-6 -mx-6 px-6 py-5 rounded-t-3xl bg-gradient-to-r ${theme.gradient} text-center relative overflow-hidden`}>
                  {/* Shimmer across header */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
                  />
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="text-5xl mb-1.5 relative z-10"
                  >
                    {playerWon ? "🎉" : tie ? "🤝" : "😢"}
                  </motion.div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-[0.15em] relative z-10">
                    {playerWon ? "Decoded!" : tie ? "Tied!" : "Defeated!"}
                  </h2>
                  <p className="text-xs text-white/70 font-bold mt-1 relative z-10 tracking-wide">
                    {playerWon
                      ? `You out-decoded ${opponent?.name}!`
                      : tie
                      ? "A battle of equals!"
                      : `${opponent?.name} decoded faster!`}
                  </p>
                </div>

                {/* Score comparison */}
                <div className="flex items-center justify-center gap-4">
                  <GlassCard
                    className={`text-center px-5 py-3 ${playerWon ? "border-amber-500/20" : ""}`}
                    glow={playerWon}
                    glowColor="rgba(245,158,11,0.12)"
                  >
                    <div className="w-10 h-10 mx-auto mb-1.5 rounded-full bg-gradient-to-br from-amber-500 to-pink-500 flex items-center justify-center text-base">
                      {playerWon ? "👑" : "👤"}
                    </div>
                    <AnimatedScore value={playerScore} className="text-xl font-black text-white block" />
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">You</p>
                  </GlassCard>

                  <span className="text-xs font-black text-slate-600 uppercase tracking-widest">vs</span>

                  <GlassCard
                    className={`text-center px-5 py-3 ${!playerWon && !tie ? "border-amber-500/20" : ""}`}
                    glow={!playerWon && !tie}
                    glowColor="rgba(245,158,11,0.12)"
                  >
                    <div className="w-10 h-10 mx-auto mb-1.5 rounded-full overflow-hidden border border-white/10">
                      {opponent && <img src={opponent.photo} alt={opponent.name} className="w-full h-full object-cover" />}
                    </div>
                    <AnimatedScore value={opponentScore} className="text-xl font-black text-white block" />
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{opponent?.name}</p>
                  </GlassCard>
                </div>

                {/* Accuracy bar */}
                <div className="px-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Accuracy</span>
                    <motion.span
                      className={`text-sm font-black ${theme.text}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      {accuracy}%
                    </motion.span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full bg-gradient-to-r ${theme.gradient}`}
                      initial={{ width: "0%" }}
                      animate={{ width: `${accuracy}%` }}
                      transition={{ delay: 0.3, duration: 1.2, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex justify-center gap-6 text-center">
                  {[
                    { label: "Decoded", value: `${correctCount}/${TOTAL_ROUNDS}`, icon: "✅" },
                    { label: "Best Streak", value: `${bestStreak}`, icon: "🔥" },
                    { label: "Hints Used", value: `${hintsUsed}`, icon: "💡" },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.15 }}
                    >
                      <p className="text-base mb-0.5">{stat.icon}</p>
                      <p className={`text-sm font-black ${theme.text}`}>{stat.value}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Progress dots */}
                <div className="flex justify-center gap-2">
                  {playerResults.map((correct, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6 + i * 0.08, type: "spring", stiffness: 400, damping: 15 }}
                      className={`w-3.5 h-3.5 rounded-full ${correct ? "bg-emerald-400" : "bg-red-400"}`}
                    />
                  ))}
                </div>

                {/* Buttons */}
                <div className="space-y-2.5 pt-1">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRestart}
                    className={`w-full py-3.5 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-black text-sm uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-transform relative overflow-hidden`}
                    style={{ boxShadow: `0 0 30px rgba(${theme.rgb},0.25)` }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
                    />
                    <RotateCcw className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">Play Again</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onBack}
                    className="w-full py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-slate-400 font-bold text-sm hover:bg-white/[0.06] transition-all tracking-wide"
                  >
                    Exit to Games
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
