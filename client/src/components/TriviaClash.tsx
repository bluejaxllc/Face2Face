import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ChevronLeft, Brain, Timer, Zap, Trophy, Star, CheckCircle2, XCircle,
  Flame, Users, Sparkles, Heart, UserPlus, Briefcase, RotateCcw, Award,
} from "lucide-react";

type Category = "dating" | "friends" | "business";

interface TriviaClashProps {
  onBack: () => void;
  category?: Category;
}

interface Question {
  question: string;
  options: string[];
  correct: number;
  difficulty: "easy" | "medium" | "hard";
}

interface Opponent {
  name: string;
  age: number;
  photo: string;
  emoji: string;
  speed: number;
  accuracy: number;
}

/* ═══════════════════════════════════════════════════════
   STATIC DATA
   ═══════════════════════════════════════════════════════ */

const OPPONENTS: Record<Category, Opponent[]> = {
  dating: [
    { name: "Jade", age: 26, photo: "https://picsum.photos/seed/tc_d1/100/100", emoji: "🔥", speed: 0.6, accuracy: 0.7 },
    { name: "Marcus", age: 31, photo: "https://picsum.photos/seed/tc_d2/100/100", emoji: "😎", speed: 0.5, accuracy: 0.8 },
    { name: "Luna", age: 25, photo: "https://picsum.photos/seed/tc_d3/100/100", emoji: "🌙", speed: 0.7, accuracy: 0.65 },
  ],
  friends: [
    { name: "Tyler", age: 28, photo: "https://picsum.photos/seed/tc_f1/100/100", emoji: "🏀", speed: 0.55, accuracy: 0.75 },
    { name: "Mia", age: 23, photo: "https://picsum.photos/seed/tc_f2/100/100", emoji: "🎤", speed: 0.65, accuracy: 0.7 },
    { name: "Noah", age: 30, photo: "https://picsum.photos/seed/tc_f3/100/100", emoji: "🧩", speed: 0.4, accuracy: 0.85 },
  ],
  business: [
    { name: "Elena", age: 31, photo: "https://picsum.photos/seed/tc_b1/100/100", emoji: "📈", speed: 0.5, accuracy: 0.85 },
    { name: "David", age: 34, photo: "https://picsum.photos/seed/tc_b2/100/100", emoji: "🚀", speed: 0.6, accuracy: 0.8 },
    { name: "Nina", age: 29, photo: "https://picsum.photos/seed/tc_b3/100/100", emoji: "💡", speed: 0.45, accuracy: 0.9 },
  ],
};

const QUESTIONS: Record<Category, Question[]> = {
  dating: [
    { question: "What's the most popular first-date activity?", options: ["Coffee ☕", "Dinner 🍽️", "Walk in the park 🌳", "Movie 🎬"], correct: 0, difficulty: "easy" },
    { question: "What % of couples meet online now?", options: ["15%", "30%", "40%", "55%"], correct: 2, difficulty: "medium" },
    { question: "Which love language is most common?", options: ["Words of Affirmation", "Physical Touch", "Quality Time", "Acts of Service"], correct: 2, difficulty: "medium" },
    { question: "How long is the average first date?", options: ["30 min", "1 hour", "1.5 hours", "2+ hours"], correct: 1, difficulty: "easy" },
    { question: "What flower represents romance most?", options: ["Tulip 🌷", "Rose 🌹", "Lily 🌸", "Sunflower 🌻"], correct: 1, difficulty: "easy" },
    { question: "Which city is called the City of Love?", options: ["Venice", "Barcelona", "Paris", "Prague"], correct: 2, difficulty: "easy" },
    { question: "What's the ideal number of emojis in a text?", options: ["0", "1-2", "3-5", "6+"], correct: 1, difficulty: "medium" },
    { question: "Which zodiac sign is considered most romantic?", options: ["Leo ♌", "Libra ♎", "Pisces ♓", "Scorpio ♏"], correct: 2, difficulty: "hard" },
    { question: "What's 'ghosting' in dating terms?", options: ["Wearing white", "Disappearing suddenly", "Being shy", "Playing hard to get"], correct: 1, difficulty: "easy" },
    { question: "Average number of dates before exclusivity?", options: ["3-4", "5-6", "7-10", "12+"], correct: 1, difficulty: "hard" },
  ],
  friends: [
    { question: "What's the most popular group activity?", options: ["Board games 🎲", "Sports ⚽", "Eating out 🍔", "Concerts 🎵"], correct: 2, difficulty: "easy" },
    { question: "How many close friends does the average person have?", options: ["1-2", "3-5", "6-8", "10+"], correct: 1, difficulty: "medium" },
    { question: "What makes a friendship last longest?", options: ["Proximity", "Shared interests", "Trust & honesty", "Frequent contact"], correct: 2, difficulty: "medium" },
    { question: "Most popular party game?", options: ["Charades", "Cards Against Humanity", "Beer Pong", "Truth or Dare"], correct: 1, difficulty: "easy" },
    { question: "What day is International Friendship Day?", options: ["Jan 1", "May 15", "Jul 30", "Sep 22"], correct: 2, difficulty: "hard" },
    { question: "Average number of friends on social media?", options: ["150", "338", "500", "750"], correct: 1, difficulty: "hard" },
    { question: "What's the #1 activity friends do together?", options: ["Watch TV", "Share meals", "Exercise", "Shopping"], correct: 1, difficulty: "medium" },
    { question: "Best icebreaker question?", options: ["What do you do?", "Where are you from?", "What's your passion?", "Nice weather, right?"], correct: 2, difficulty: "easy" },
    { question: "How long to form a close friendship?", options: ["50 hours", "100 hours", "200 hours", "500 hours"], correct: 2, difficulty: "hard" },
    { question: "What ruins friendships most?", options: ["Distance", "Betrayal", "Time", "Money"], correct: 1, difficulty: "medium" },
  ],
  business: [
    { question: "What's the #1 networking skill?", options: ["Public speaking", "Active listening", "Body language", "Elevator pitch"], correct: 1, difficulty: "easy" },
    { question: "Best time to send a follow-up email?", options: ["Same day", "Next day", "Within 48 hours", "Next week"], correct: 2, difficulty: "medium" },
    { question: "Most valuable LinkedIn feature?", options: ["Posts", "Connections", "Recommendations", "Skills endorsements"], correct: 2, difficulty: "medium" },
    { question: "Average time a recruiter reads a resume?", options: ["3 seconds", "7 seconds", "30 seconds", "2 minutes"], correct: 1, difficulty: "easy" },
    { question: "What's the ideal elevator pitch length?", options: ["15 seconds", "30 seconds", "1 minute", "2 minutes"], correct: 1, difficulty: "easy" },
    { question: "Most important soft skill for 2025?", options: ["Creativity", "Adaptability", "Communication", "Leadership"], correct: 1, difficulty: "hard" },
    { question: "What % of jobs are filled via networking?", options: ["30%", "50%", "70%", "90%"], correct: 2, difficulty: "hard" },
    { question: "Best day for business meetings?", options: ["Monday", "Tuesday", "Wednesday", "Thursday"], correct: 1, difficulty: "medium" },
    { question: "What kills first impressions fastest?", options: ["Bad breath", "Weak handshake", "Phone checking", "Late arrival"], correct: 3, difficulty: "medium" },
    { question: "Average attention span in a meeting?", options: ["5 min", "10 min", "18 min", "30 min"], correct: 2, difficulty: "hard" },
  ],
};

const THEMES: Record<Category, {
  gradient: string; textAccent: string; bgAccent: string;
  borderAccent: string; correctColor: string; wrongColor: string;
}> = {
  dating: { gradient: "from-pink-500 via-rose-500 to-red-500", textAccent: "text-pink-400", bgAccent: "bg-pink-500/15", borderAccent: "border-pink-500/30", correctColor: "border-emerald-500 bg-emerald-500/10", wrongColor: "border-red-500 bg-red-500/10" },
  friends: { gradient: "from-emerald-500 via-green-500 to-teal-500", textAccent: "text-emerald-400", bgAccent: "bg-emerald-500/15", borderAccent: "border-emerald-500/30", correctColor: "border-emerald-500 bg-emerald-500/10", wrongColor: "border-red-500 bg-red-500/10" },
  business: { gradient: "from-blue-500 via-indigo-500 to-violet-500", textAccent: "text-blue-400", bgAccent: "bg-blue-500/15", borderAccent: "border-blue-500/30", correctColor: "border-emerald-500 bg-emerald-500/10", wrongColor: "border-red-500 bg-red-500/10" },
};

type GamePhase = "matchmaking" | "countdown" | "playing" | "review" | "results";
const TOTAL_QUESTIONS = 7;
const TIME_PER_QUESTION = 12;

const CAT_COLORS: Record<Category, { primary: string; glow: string }> = {
  dating: { primary: "#ec4899", glow: "rgba(236,72,153,0.35)" },
  friends: { primary: "#10b981", glow: "rgba(16,185,129,0.35)" },
  business: { primary: "#6366f1", glow: "rgba(99,102,241,0.35)" },
};

const OPT_ACCENTS = [
  { border: "border-sky-500/25", bg: "bg-sky-500/5", ring: "ring-sky-400/40" },
  { border: "border-amber-500/25", bg: "bg-amber-500/5", ring: "ring-amber-400/40" },
  { border: "border-fuchsia-500/25", bg: "bg-fuchsia-500/5", ring: "ring-fuchsia-400/40" },
  { border: "border-teal-500/25", bg: "bg-teal-500/5", ring: "ring-teal-400/40" },
];

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENTS — Premium visual primitives
   ═══════════════════════════════════════════════════════ */

/** Spring-physics animated score digit — bounces to new value */
function SpringDigit({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const sp = useSpring(mv, { stiffness: 120, damping: 18 });
  const display = useTransform(sp, (v) => Math.round(v).toLocaleString());
  useEffect(() => { mv.set(value); }, [value, mv]);
  return <motion.span>{display}</motion.span>;
}

/** SVG fractal-noise texture overlay */
function NoiseOverlay() {
  return (
    <svg className="pointer-events-none fixed inset-0 z-[200] w-full h-full opacity-[0.028]" aria-hidden>
      <filter id="tcNoise">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#tcNoise)" />
    </svg>
  );
}

/** Floating background orb with complex motion path */
function FloatingOrb({ color, size, delay, dur, x1, y1, x2, y2 }: {
  color: string; size: number; delay: number; dur: number;
  x1: string; y1: string; x2: string; y2: string;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ width: size, height: size, background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, filter: `blur(${size * 0.4}px)` }}
      initial={{ left: x1, top: y1, opacity: 0 }}
      animate={{ left: [x1, x2, x1], top: [y1, y2, y1], opacity: [0.12, 0.22, 0.12], scale: [1, 1.15, 1] }}
      transition={{ duration: dur, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/** Ambient dust motes — tiny particles drifting upward */
function DustMotes({ count = 10 }: { count?: number }) {
  const motes = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: 1.5 + Math.random() * 2.5, dur: 8 + Math.random() * 14,
    delay: Math.random() * 6, drift: 15 + Math.random() * 30,
  })), [count]);

  return (
    <>
      {motes.map((m) => (
        <motion.div key={m.id} className="absolute rounded-full bg-white/20 pointer-events-none"
          style={{ width: m.size, height: m.size, left: `${m.x}%`, top: `${m.y}%` }}
          animate={{ y: [0, -m.drift, 0], x: [0, m.drift * 0.4, 0], opacity: [0, 0.5, 0] }}
          transition={{ duration: m.dur, delay: m.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

/** Circular timer ring with urgency pulse + color transitions (blue→yellow→red) */
function TimerRing({ timeLeft, total, phase }: { timeLeft: number; total: number; phase: string }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const fraction = phase === "review" ? 0 : timeLeft / total;
  const offset = circumference * (1 - fraction);
  const urgency = timeLeft <= 5 && phase === "playing";
  const critical = timeLeft <= 3 && phase === "playing";
  const strokeColor = critical ? "#ef4444" : timeLeft <= 5 ? "#eab308" : "#60a5fa";
  const textColor = critical ? "text-red-400" : timeLeft <= 5 ? "text-yellow-400" : "text-white";

  return (
    <motion.div className="relative flex items-center justify-center"
      animate={urgency ? { scale: [1, 1.08, 1] } : {}}
      transition={urgency ? { duration: 0.5, repeat: Infinity } : {}}>
      {/* Glow behind ring when urgent */}
      {urgency && (
        <motion.div className="absolute rounded-full"
          style={{ width: 70, height: 70, background: `radial-gradient(circle, ${critical ? 'rgba(239,68,68,0.25)' : 'rgba(234,179,8,0.2)'} 0%, transparent 70%)` }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 0.6, repeat: Infinity }} />
      )}
      <svg width="64" height="64" className="rotate-[-90deg]">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <motion.circle cx="32" cy="32" r={radius} fill="none" stroke={strokeColor} strokeWidth="4"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 6px ${strokeColor})` }}
          transition={{ duration: 0.4, ease: "easeOut" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-black tabular-nums ${textColor}`}>
          {phase === "review" ? "—" : timeLeft}
        </span>
      </div>
    </motion.div>
  );
}

/** Flying "+N" score animation */
function FlyingScore({ points, side }: { points: string; side: "left" | "right" }) {
  return (
    <motion.div className="absolute z-50 pointer-events-none" style={{ [side]: "20%", top: "8%" }}
      initial={{ y: 0, opacity: 1, scale: 0.8 }} animate={{ y: -40, opacity: 0, scale: 1.3 }}
      exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: "easeOut" }}>
      <span className="text-lg font-black text-emerald-400 drop-shadow-lg">+{points}</span>
    </motion.div>
  );
}

/** Conic-gradient victory rays rotating behind winner */
function VictoryRays() {
  return (
    <motion.div className="absolute inset-0 pointer-events-none z-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
      <motion.div className="absolute inset-[-50%]"
        style={{ background: "conic-gradient(from 0deg, transparent 0%, rgba(251,191,36,0.06) 4%, transparent 8%, transparent 12.5%)" }}
        animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} />
    </motion.div>
  );
}

/** Glassmorphic card with optional rotating conic-gradient border */
function GlassCard({ children, className = "", glowColor }: {
  children: React.ReactNode; className?: string; glowColor?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {glowColor && (
        <motion.div className="absolute -inset-[1px] rounded-[inherit] opacity-40 pointer-events-none"
          style={{ background: `conic-gradient(from 0deg, transparent 0%, ${glowColor} 25%, transparent 50%, ${glowColor} 75%, transparent 100%)` }}
          animate={{ rotate: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} />
      )}
      <div className="relative rounded-[inherit] bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] overflow-hidden">
        {children}
      </div>
    </div>
  );
}

/** Shimmer button with sweeping highlight + glow shadow */
function ShimmerButton({ children, onClick, className = "", gradient }: {
  children: React.ReactNode; onClick?: () => void; className?: string; gradient: string;
}) {
  return (
    <motion.button onClick={onClick} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
      className={`relative overflow-hidden ${className}`}>
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient}`} />
      <motion.div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)" }}
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }} />
      <div className="relative z-10 flex items-center justify-center gap-2">{children}</div>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function TriviaClash({ onBack, category = "dating" }: TriviaClashProps) {
  const theme = THEMES[category];
  const allQuestions = QUESTIONS[category];
  const opponents = OPPONENTS[category];
  const cc = CAT_COLORS[category];

  /* ─── State ─── */
  const [phase, setPhase] = useState<GamePhase>("matchmaking");
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [opponentAnswer, setOpponentAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [playerAnswers, setPlayerAnswers] = useState<(number | null)[]>([]);
  const [opponentAnswers, setOpponentAnswers] = useState<(number | null)[]>([]);
  const [streak, setStreak] = useState(0);
  const [matchmakingDots, setMatchmakingDots] = useState(0);
  const [lastScoreGain, setLastScoreGain] = useState<number | null>(null);
  const [shakeScreen, setShakeScreen] = useState(false);

  /* ─── Refs ─── */
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const opponentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentQRef = useRef(currentQ);
  const questionsRef = useRef(questions);
  const opponentRef = useRef(opponent);
  const answeredRef = useRef(false);

  // Keep refs synced with state
  useEffect(() => { currentQRef.current = currentQ; }, [currentQ]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { opponentRef.current = opponent; }, [opponent]);

  /* ─── Matchmaking phase ─── */
  useEffect(() => {
    if (phase === "matchmaking") {
      const dotInterval = setInterval(() => setMatchmakingDots((p) => (p + 1) % 4), 400);
      const matchTimeout = setTimeout(() => {
        const opp = opponents[Math.floor(Math.random() * opponents.length)];
        setOpponent(opp);
        const shuffled = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, TOTAL_QUESTIONS);
        setQuestions(shuffled);
        setTimeout(() => setPhase("countdown"), 800);
      }, 2000);
      return () => { clearInterval(dotInterval); clearTimeout(matchTimeout); };
    }
  }, [phase, opponents, allQuestions]);

  /* ─── Countdown phase ─── */
  useEffect(() => {
    if (phase === "countdown") {
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) { clearInterval(interval); setPhase("playing"); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  /* ─── Question timer + opponent AI ─── */
  useEffect(() => {
    if (phase === "playing" && !showResult) {
      setTimeLeft(TIME_PER_QUESTION);
      setSelectedAnswer(null);
      setOpponentAnswer(null);
      setShowResult(false);
      answeredRef.current = false;
      setLastScoreGain(null);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            if (!answeredRef.current) {
              answeredRef.current = true;
              setPlayerAnswers((pa) => [...pa, null]);
              setStreak(0);
              setShakeScreen(true);
              setTimeout(() => setShakeScreen(false), 500);
              finalizeQuestion();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Simulate opponent answer timing based on speed attribute
      const opp = opponentRef.current;
      if (opp) {
        const opponentDelay = (2000 + Math.random() * 6000) * (1 - opp.speed * 0.5);
        opponentTimerRef.current = setTimeout(() => {
          const qq = questionsRef.current[currentQRef.current];
          if (!qq) return;
          const isCorrect = Math.random() < opp.accuracy;
          let answer: number;
          if (isCorrect) { answer = qq.correct; }
          else {
            const wrongOptions = qq.options.map((_, i) => i).filter((i) => i !== qq.correct);
            answer = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
          }
          setOpponentAnswer(answer);
        }, opponentDelay);
      }

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (opponentTimerRef.current) clearTimeout(opponentTimerRef.current);
      };
    }
  }, [phase, currentQ, showResult]);

  /* ─── Finalize question — resolve opponent answer + transition to review ─── */
  const finalizeQuestion = useCallback(() => {
    setTimeout(() => {
      const qq = questionsRef.current[currentQRef.current];
      const opp = opponentRef.current;
      if (!qq || !opp) { setShowResult(true); setPhase("review"); return; }

      setOpponentAnswer((prev) => {
        if (prev !== null) {
          if (prev === qq.correct) setOpponentScore((s) => s + 100 + Math.round(Math.random() * 40));
          setOpponentAnswers((a) => [...a, prev]);
          return prev;
        }
        const isCorrect = Math.random() < opp.accuracy;
        let answer: number;
        if (isCorrect) { answer = qq.correct; }
        else {
          const wrongOptions = qq.options.map((_, i) => i).filter((i) => i !== qq.correct);
          answer = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
        }
        if (answer === qq.correct) setOpponentScore((s) => s + 100 + Math.round(Math.random() * 40));
        setOpponentAnswers((a) => [...a, answer]);
        return answer;
      });

      setShowResult(true);
      setPhase("review");
    }, 500);
  }, []);

  /* ─── Player selects an answer ─── */
  const handleSelectAnswer = (idx: number) => {
    if (answeredRef.current || showResult) return;
    answeredRef.current = true;
    setSelectedAnswer(idx);
    if (timerRef.current) clearInterval(timerRef.current);

    const qq = questions[currentQ];
    if (!qq) return;
    const isCorrect = idx === qq.correct;

    if (isCorrect) {
      const timeBonus = Math.round(timeLeft * 5);
      const streakBonus = streak * 10;
      const points = 100 + timeBonus + streakBonus;
      setPlayerScore((prev) => prev + points);
      setStreak((prev) => prev + 1);
      setLastScoreGain(points);
    } else {
      setStreak(0);
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 500);
    }
    setPlayerAnswers((prev) => [...prev, idx]);
    finalizeQuestion();
  };

  /* ─── Next question or show results ─── */
  const handleNextQuestion = () => {
    if (currentQ + 1 >= TOTAL_QUESTIONS) { setPhase("results"); }
    else {
      setCurrentQ((prev) => prev + 1);
      setShowResult(false);
      setSelectedAnswer(null);
      setOpponentAnswer(null);
      setPhase("playing");
    }
  };

  /* ─── Restart match ─── */
  const handleRestart = () => {
    setPhase("matchmaking"); setOpponent(null); setQuestions([]); setCurrentQ(0);
    setPlayerScore(0); setOpponentScore(0); setPlayerAnswers([]); setOpponentAnswers([]);
    setSelectedAnswer(null); setOpponentAnswer(null); setShowResult(false);
    setStreak(0); setLastScoreGain(null); answeredRef.current = false;
  };

  /* ─── Derived values ─── */
  const q = questions[currentQ];
  const playerWon = playerScore > opponentScore;
  const isTie = playerScore === opponentScore;
  const isLeading = playerScore > opponentScore;
  const playerCorrectCount = playerAnswers.filter((a, i) => a === questions[i]?.correct).length;
  const playerAccuracy = playerAnswers.length > 0 ? Math.round((playerCorrectCount / playerAnswers.length) * 100) : 0;

  const diffColors: Record<string, string> = {
    easy: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    hard: "text-red-400 bg-red-500/10 border-red-500/30",
  };

  // Progressive intensity — animations speed up in later rounds
  const intensity = 1 + (currentQ / TOTAL_QUESTIONS) * 0.4;
  // Dynamic color temperature — warm when winning, cool when losing
  const tempOverlay = isLeading
    ? "from-amber-500/[0.03] to-orange-500/[0.02]"
    : playerScore < opponentScore
      ? "from-blue-500/[0.03] to-cyan-500/[0.02]"
      : "from-slate-500/[0.01] to-slate-500/[0.01]";
  // Best streak for results screen
  const bestStreak = Math.max(0, ...playerAnswers.reduce<number[]>((acc, a, i) => {
    const correct = a !== null && a === questions[i]?.correct;
    const last = acc.length > 0 ? acc[acc.length - 1] : 0;
    acc.push(correct ? last + 1 : 0);
    return acc;
  }, []));

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */
  return (
    <motion.div className="absolute inset-0 overflow-hidden bg-slate-950 text-white select-none"
      animate={shakeScreen ? { x: [0, -6, 6, -4, 4, 0] } : {}}
      transition={shakeScreen ? { duration: 0.4 } : {}}>

      {/* ── Ambient layers ── */}
      <NoiseOverlay />
      <div className={`absolute inset-0 bg-gradient-to-br ${tempOverlay} pointer-events-none z-[1] transition-all duration-1000`} />
      <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-[160px] opacity-15 bg-gradient-to-r ${theme.gradient} pointer-events-none`} />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-[140px] opacity-10 bg-violet-500 pointer-events-none" />

      {/* ── 6 Floating Orbs ── */}
      <FloatingOrb color={cc.primary} size={200} delay={0} dur={18} x1="10%" y1="15%" x2="30%" y2="45%" />
      <FloatingOrb color="#8b5cf6"   size={160} delay={2} dur={22} x1="75%" y1="10%" x2="55%" y2="35%" />
      <FloatingOrb color={cc.primary} size={120} delay={4} dur={16} x1="60%" y1="70%" x2="80%" y2="50%" />
      <FloatingOrb color="#06b6d4"   size={180} delay={1} dur={24} x1="20%" y1="75%" x2="40%" y2="55%" />
      <FloatingOrb color="#f59e0b"   size={100} delay={3} dur={20} x1="85%" y1="60%" x2="65%" y2="80%" />
      <FloatingOrb color="#ec4899"   size={140} delay={5} dur={19} x1="5%"  y1="45%" x2="25%" y2="25%" />

      {/* ── 10 Ambient Dust Motes ── */}
      <DustMotes count={10} />

      {/* ══════════════ HEADER ══════════════ */}
      <div className="fixed top-0 left-0 right-0 z-[60]" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.06] bg-slate-950/70 backdrop-blur-2xl">
          <motion.button onClick={onBack} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.1] transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-300" />
          </motion.button>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4" style={{ color: cc.primary }} />
            <span className="text-sm font-black uppercase tracking-[0.2em]"
              style={{ background: `linear-gradient(135deg, ${cc.primary}, #a78bfa, #e879f9)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Trivia Clash
            </span>
          </div>
          {(phase === "playing" || phase === "review") ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] backdrop-blur-md">
              <span className="text-[10px] font-black text-slate-400 tracking-wider">Q{currentQ + 1}/{TOTAL_QUESTIONS}</span>
            </div>
          ) : <div style={{ width: 60 }} />}
        </div>
      </div>

      {/* ══════════════ MAIN CONTENT ══════════════ */}
      <div className="absolute inset-0 flex flex-col z-[2]"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 56px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

        {/* ═══ MATCHMAKING ═══ */}
        {phase === "matchmaking" && (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            {!opponent ? (
              <>
                {/* Dual-ring searching spinner */}
                <div className="relative mb-8">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                    className="w-24 h-24 rounded-full border-[3px] border-white/[0.06] border-t-transparent" style={{ borderTopColor: cc.primary }} />
                  <motion.div animate={{ rotate: -360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-2 rounded-full border-[2px] border-white/[0.04] border-b-transparent" style={{ borderBottomColor: cc.primary, opacity: 0.5 }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Users className="w-7 h-7 text-slate-400" />
                  </div>
                </div>
                <p className="text-lg font-black text-white uppercase tracking-[0.15em]">
                  Finding Opponent{".".repeat(matchmakingDots)}
                </p>
                <p className="text-xs text-slate-500 font-medium mt-2 tracking-wide">Scanning nearby players...</p>
                {/* Pulsing placeholder avatars */}
                <div className="flex gap-2 mt-6 opacity-30">
                  {[1, 2, 3].map((i) => (
                    <motion.div key={i} className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.06]"
                      animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }} />
                  ))}
                </div>
              </>
            ) : (
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }} className="flex flex-col items-center">
                <div className="flex items-center gap-8">
                  {/* Player avatar with gradient ring */}
                  <motion.div initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring" }} className="flex flex-col items-center">
                    <div className="relative">
                      <div className="rounded-full bg-slate-800/80 border-2 border-white/10 flex items-center justify-center text-2xl"
                        style={{ width: 72, height: 72 }}>👑</div>
                      <div className="absolute -inset-1 rounded-full border-2 opacity-40 pointer-events-none"
                        style={{ borderColor: cc.primary }} />
                    </div>
                    <p className="text-sm font-black text-white mt-2">You</p>
                  </motion.div>

                  {/* VS badge */}
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 300 }}>
                    <GlassCard className="rounded-xl" glowColor={cc.primary}>
                      <div className="px-4 py-2">
                        <span className="text-xl font-black tracking-widest bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">VS</span>
                      </div>
                    </GlassCard>
                  </motion.div>

                  {/* Opponent avatar with gradient ring */}
                  <motion.div initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring" }} className="flex flex-col items-center">
                    <div className="relative">
                      <div className="rounded-full overflow-hidden border-2"
                        style={{ width: 72, height: 72, borderColor: cc.primary + "80" }}>
                        <img src={opponent.photo} alt={opponent.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -inset-1 rounded-full border-2 opacity-40 pointer-events-none"
                        style={{ borderColor: cc.primary }} />
                    </div>
                    <p className="text-sm font-black text-white mt-2">{opponent.name} {opponent.emoji}</p>
                  </motion.div>
                </div>
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="text-xs font-bold uppercase tracking-[0.25em] mt-5" style={{ color: cc.primary }}>
                  ✦ Match Found ✦
                </motion.p>
              </motion.div>
            )}
          </div>
        )}

        {/* ═══ COUNTDOWN — Cinematic letterbox 3→2→1→GO! ═══ */}
        {phase === "countdown" && (
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Cinematic letterbox bars */}
            <motion.div className="absolute top-0 left-0 right-0 bg-black z-10"
              initial={{ height: 0 }} animate={{ height: 60 }} transition={{ duration: 0.4 }} />
            <motion.div className="absolute bottom-0 left-0 right-0 bg-black z-10"
              initial={{ height: 0 }} animate={{ height: 60 }} transition={{ duration: 0.4 }} />

            <motion.p initial={{ opacity: 0, letterSpacing: "0em" }} animate={{ opacity: 1, letterSpacing: "0.3em" }}
              className="text-sm font-black text-slate-400 uppercase mb-8 z-20">
              Get Ready
            </motion.p>

            <AnimatePresence mode="popLayout">
              <motion.div key={countdown} className="z-20 relative"
                initial={{ scale: 0, opacity: 0, rotate: -20 }}
                animate={{ scale: 1.5, opacity: 1, rotate: 0 }}
                exit={{ scale: 3, opacity: 0, rotate: 10 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 200 }}>
                {/* Glow halo behind number */}
                <div className="absolute inset-0 rounded-full blur-2xl"
                  style={{ background: cc.glow, width: 120, height: 120, left: "50%", top: "50%", transform: "translate(-50%, -50%)" }} />
                <span className="text-8xl font-black relative"
                  style={{ background: `linear-gradient(135deg, ${cc.primary}, #e879f9)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: `drop-shadow(0 0 30px ${cc.glow})` }}>
                  {countdown === 0 ? "GO!" : countdown}
                </span>
              </motion.div>
            </AnimatePresence>

            {opponent && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.5 }}
                className="text-xs text-slate-500 font-bold mt-10 z-20">
                vs {opponent.name} {opponent.emoji}
              </motion.p>
            )}
          </div>
        )}

        {/* ═══ PLAYING / REVIEW ═══ */}
        {(phase === "playing" || phase === "review") && q && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            {/* ── Glassmorphic Score Header ── */}
            <div className="px-4 pt-3 pb-2 relative">
              <AnimatePresence>
                {lastScoreGain !== null && showResult && (
                  <FlyingScore points={String(lastScoreGain)} side="left" />
                )}
              </AnimatePresence>

              <GlassCard className="rounded-2xl">
                <div className="px-4 py-3 flex items-center gap-3">
                  {/* Player score */}
                  <div className="flex items-center gap-2.5 flex-1">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center text-lg">👑</div>
                      {isLeading && (
                        <motion.div className="absolute -inset-1 rounded-full border-2 pointer-events-none" style={{ borderColor: cc.primary }}
                          animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} />
                      )}
                      {isLeading && (
                        <motion.span className="absolute -top-2.5 -right-1 text-[10px]"
                          animate={{ y: [0, -2, 0] }} transition={{ duration: 1, repeat: Infinity }}>👑</motion.span>
                      )}
                    </div>
                    <div>
                      <p className="text-base font-black text-white tabular-nums"><SpringDigit value={playerScore} /></p>
                      <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">You</p>
                    </div>
                  </div>

                  {/* Center timer ring */}
                  <TimerRing timeLeft={timeLeft} total={TIME_PER_QUESTION} phase={phase} />

                  {/* Opponent score */}
                  <div className="flex items-center gap-2.5 flex-1 justify-end">
                    <div className="text-right">
                      <p className="text-base font-black text-white tabular-nums"><SpringDigit value={opponentScore} /></p>
                      <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{opponent?.name?.toUpperCase()}</p>
                    </div>
                    {opponent && (
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10">
                          <img src={opponent.photo} alt={opponent.name} className="w-full h-full object-cover" />
                        </div>
                        {!isLeading && !isTie && (
                          <motion.div className="absolute -inset-1 rounded-full border-2 pointer-events-none" style={{ borderColor: cc.primary }}
                            animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} />
                        )}
                        {!isLeading && !isTie && (
                          <motion.span className="absolute -top-2.5 -right-1 text-[10px]"
                            animate={{ y: [0, -2, 0] }} transition={{ duration: 1, repeat: Infinity }}>👑</motion.span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => {
                  let dotColor = "bg-white/[0.08]";
                  if (i < playerAnswers.length) {
                    const wasCorrect = playerAnswers[i] !== null && playerAnswers[i] === questions[i]?.correct;
                    dotColor = wasCorrect ? "bg-emerald-500" : "bg-red-500";
                  } else if (i === currentQ) {
                    dotColor = `bg-gradient-to-r ${theme.gradient}`;
                  }
                  return (
                    <motion.div key={i} className={`w-2 h-2 rounded-full ${dotColor} transition-colors`}
                      animate={i === currentQ ? { scale: [1, 1.3, 1] } : {}}
                      transition={i === currentQ ? { duration: 1, repeat: Infinity } : {}} />
                  );
                })}
              </div>

              {/* Streak badge */}
              {streak >= 2 && (
                <motion.div key={streak} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center justify-center gap-1.5 mt-2">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-wider">{streak} streak!</span>
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                </motion.div>
              )}
            </div>

            {/* ── Question Card ── */}
            <div className="flex flex-col items-center px-4 py-4 my-auto">
              <AnimatePresence mode="wait">
                <motion.div key={currentQ} className="w-full max-w-md"
                  initial={{ y: 40, opacity: 0, scale: 0.97 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -30, opacity: 0, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28, duration: 0.3 / intensity }}>

                  {/* Difficulty & category tag pills */}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${diffColors[q.difficulty]}`}>
                      {q.difficulty}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border border-white/10 text-slate-400 bg-white/[0.03]">
                      {category}
                    </span>
                  </div>

                  {/* Glassmorphic question card */}
                  <GlassCard className="rounded-2xl mb-5" glowColor={cc.primary}>
                    <div className="p-6">
                      <p className="text-lg font-black text-white text-center leading-relaxed tracking-wide">{q.question}</p>
                    </div>
                  </GlassCard>

                  {/* Answer option buttons — 2×2 grid on wider screens */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((option, idx) => {
                      const accent = OPT_ACCENTS[idx];
                      let optStyles = `${accent.bg} ${accent.border} hover:bg-white/[0.06]`;
                      let iconBg = "bg-white/[0.06] text-slate-400";
                      let txtColor = "text-slate-200";
                      let ringStyle = "";
                      let isCorrectAns = false;
                      let isWrongPick = false;

                      if (showResult) {
                        if (idx === q.correct) {
                          optStyles = "bg-emerald-500/10 border-emerald-500/50";
                          iconBg = "bg-emerald-500 text-white";
                          txtColor = "text-emerald-300";
                          ringStyle = "ring-2 ring-emerald-500/30";
                          isCorrectAns = true;
                        } else if (idx === selectedAnswer && idx !== q.correct) {
                          optStyles = "bg-red-500/10 border-red-500/50";
                          iconBg = "bg-red-500 text-white";
                          txtColor = "text-red-300";
                          ringStyle = "ring-2 ring-red-500/30";
                          isWrongPick = true;
                        } else {
                          optStyles = "bg-white/[0.02] border-white/[0.04] opacity-35";
                        }
                      } else if (selectedAnswer === idx) {
                        optStyles = `${theme.bgAccent} ${theme.borderAccent}`;
                        ringStyle = `ring-2 ${accent.ring}`;
                      }

                      const letter = String.fromCharCode(65 + idx);

                      return (
                        <motion.button key={idx} onClick={() => handleSelectAnswer(idx)}
                          disabled={selectedAnswer !== null || showResult}
                          whileHover={!showResult && selectedAnswer === null ? { scale: 1.02 } : {}}
                          whileTap={!showResult && selectedAnswer === null ? { scale: 0.95 } : {}}
                          animate={isWrongPick ? { x: [0, -6, 6, -4, 4, 0] } : isCorrectAns ? { scale: [1, 1.03, 1] } : {}}
                          transition={isWrongPick ? { duration: 0.4 } : isCorrectAns ? { duration: 0.5, repeat: 1 } : {}}
                          className={`w-full py-4 px-5 rounded-xl border text-left flex items-center gap-4 transition-all backdrop-blur-md ${optStyles} ${ringStyle}`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0 ${iconBg} transition-colors`}>
                            {showResult && idx === q.correct ? <CheckCircle2 className="w-5 h-5" />
                              : showResult && idx === selectedAnswer && idx !== q.correct ? <XCircle className="w-5 h-5" />
                              : letter}
                          </div>
                          <span className={`text-sm font-bold ${txtColor} transition-colors`}>{option}</span>
                          {/* Opponent pick indicator */}
                          {showResult && opponentAnswer === idx && opponent && (
                            <div className="ml-auto shrink-0">
                              <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20">
                                <img src={opponent.photo} alt={opponent.name} className="w-full h-full object-cover" />
                              </div>
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ═══ REVIEW FOOTER ═══ */}
        {showResult && q && phase === "review" && (
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[61] px-6 pb-6 pt-3 bg-slate-950/90 backdrop-blur-2xl border-t border-white/[0.06]"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {selectedAnswer === q?.correct ? (
                  <>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </motion.div>
                    <span className="text-sm font-black text-emerald-400 uppercase tracking-wider">Correct!</span>
                    {lastScoreGain && <span className="text-[10px] font-bold text-emerald-500/60 ml-1">+{lastScoreGain}</span>}
                  </>
                ) : (
                  <>
                    <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400 }}>
                      <XCircle className="w-5 h-5 text-red-400" />
                    </motion.div>
                    <span className="text-sm font-black text-red-400 uppercase tracking-wider">
                      {selectedAnswer === null ? "Time's Up!" : "Wrong!"}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                {opponent && <>{opponent.name}: {opponentAnswer === q?.correct ? <span className="text-emerald-400">✓</span> : <span className="text-red-400">✗</span>}</>}
              </div>
            </div>
            <ShimmerButton onClick={handleNextQuestion} gradient={theme.gradient}
              className="w-full py-4 rounded-2xl text-white font-black text-sm uppercase tracking-[0.15em] shadow-lg">
              {currentQ + 1 >= TOTAL_QUESTIONS
                ? <><Trophy className="w-5 h-5" /><span>See Results</span></>
                : <><Zap className="w-5 h-5" /><span>Next Question</span></>}
            </ShimmerButton>
          </motion.div>
        )}

        {/* ═══ RESULTS ═══ */}
        {phase === "results" && opponent && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-y-auto relative">
            {playerWon && <VictoryRays />}

            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }} className="w-full max-w-sm relative z-10">
              <GlassCard className="rounded-3xl" glowColor={playerWon ? "#fbbf24" : isTie ? "#94a3b8" : "#ef4444"}>
                <div className="relative overflow-hidden">
                  <div className={`h-1.5 bg-gradient-to-r ${theme.gradient}`} />
                  <div className="p-6 text-center">
                    {/* Result icon */}
                    <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                        playerWon ? 'bg-amber-500/10 border-2 border-amber-500/30'
                        : isTie ? 'bg-white/[0.05] border-2 border-white/10'
                        : 'bg-red-500/10 border-2 border-red-500/30'
                      }`}>
                      {playerWon ? (
                        <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                          <Trophy className="w-10 h-10 text-amber-400" />
                        </motion.div>
                      ) : isTie ? (
                        <Users className="w-10 h-10 text-slate-400" />
                      ) : <span className="text-4xl">😢</span>}
                    </motion.div>

                    {/* Winner heading with gradient text */}
                    <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                      className="text-2xl font-black uppercase tracking-[0.15em] mb-1"
                      style={playerWon ? { background: "linear-gradient(135deg, #fbbf24, #f59e0b, #fcd34d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } : {}}>
                      {playerWon ? "🏆 You Win! 🏆" : isTie ? "It's a Tie!" : "Defeated!"}
                    </motion.h2>
                    <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-6 ${playerWon ? 'text-amber-400/70' : isTie ? 'text-slate-500' : 'text-red-400/70'}`}>
                      {playerWon ? "Brain power reigns supreme" : isTie ? "Evenly matched minds" : `${opponent.name} outsmarted you`}
                    </p>

                    {/* Score comparison cards */}
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      <GlassCard className="rounded-xl">
                        <div className="p-3 text-center">
                          <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-sm mx-auto mb-1">👑</div>
                          <p className={`text-xl font-black tabular-nums ${playerWon ? 'text-amber-400' : 'text-white'}`}><SpringDigit value={playerScore} /></p>
                          <p className="text-[7px] text-slate-500 uppercase tracking-widest font-bold">You</p>
                        </div>
                      </GlassCard>
                      <div className="flex items-center justify-center">
                        <span className="text-xs font-black text-slate-600 uppercase tracking-widest">vs</span>
                      </div>
                      <GlassCard className="rounded-xl">
                        <div className="p-3 text-center">
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 mx-auto mb-1">
                            <img src={opponent.photo} alt={opponent.name} className="w-full h-full object-cover" />
                          </div>
                          <p className={`text-xl font-black tabular-nums ${!playerWon && !isTie ? 'text-amber-400' : 'text-white'}`}><SpringDigit value={opponentScore} /></p>
                          <p className="text-[7px] text-slate-500 uppercase tracking-widest font-bold">{opponent.name}</p>
                        </div>
                      </GlassCard>
                    </div>

                    {/* Animated bar chart comparison */}
                    <div className="mb-5 px-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-bold text-slate-500 w-8">YOU</span>
                        <div className="flex-1 h-3 bg-white/[0.04] rounded-full overflow-hidden">
                          <motion.div className={`h-full rounded-full bg-gradient-to-r ${theme.gradient}`} initial={{ width: 0 }}
                            animate={{ width: `${Math.max(5, (playerScore / Math.max(playerScore, opponentScore, 1)) * 100)}%` }}
                            transition={{ delay: 0.5, duration: 1, ease: "easeOut" }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-500 w-8 truncate">{opponent.name.slice(0, 4).toUpperCase()}</span>
                        <div className="flex-1 h-3 bg-white/[0.04] rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full bg-gradient-to-r from-slate-500 to-slate-400" initial={{ width: 0 }}
                            animate={{ width: `${Math.max(5, (opponentScore / Math.max(playerScore, opponentScore, 1)) * 100)}%` }}
                            transition={{ delay: 0.7, duration: 1, ease: "easeOut" }} />
                        </div>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center justify-center gap-4 mb-5">
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="text-center">
                        <p className="text-sm font-black text-emerald-400">{playerCorrectCount}/{TOTAL_QUESTIONS}</p>
                        <p className="text-[7px] text-slate-500 uppercase tracking-widest font-bold">Correct</p>
                      </motion.div>
                      <div className="w-px h-6 bg-white/[0.06]" />
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="text-center">
                        <p className="text-sm font-black text-orange-400">{bestStreak}</p>
                        <p className="text-[7px] text-slate-500 uppercase tracking-widest font-bold">Best Streak</p>
                      </motion.div>
                      <div className="w-px h-6 bg-white/[0.06]" />
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="text-center">
                        <p className="text-sm font-black" style={{ color: cc.primary }}>{playerAccuracy}%</p>
                        <p className="text-[7px] text-slate-500 uppercase tracking-widest font-bold">Accuracy</p>
                      </motion.div>
                    </div>

                    {/* Question review dots */}
                    <div className="flex items-center justify-center gap-1.5 mb-6">
                      {playerAnswers.map((a, i) => (
                        <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 + i * 0.08 }}
                          className={`w-3 h-3 rounded-full ${a !== null && a === questions[i]?.correct ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-3">
                      <ShimmerButton onClick={handleRestart} gradient={theme.gradient}
                        className="w-full py-4 rounded-2xl text-white font-black text-sm uppercase tracking-[0.15em] shadow-lg">
                        <RotateCcw className="w-5 h-5" /><span>Play Again</span>
                      </ShimmerButton>
                      <motion.button onClick={onBack} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
                        className="w-full py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md text-slate-300 text-sm font-bold transition-all hover:bg-white/[0.06]">
                        Exit to Games
                      </motion.button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
