import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

// Themed puzzle banks
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

// Opponent names per category
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
const TIME_PER_ROUND = 30; // 30 seconds per puzzle

const themes: Record<Category, { gradient: string; text: string; accent: string; bg: string }> = {
  dating: { gradient: "from-pink-500 via-rose-500 to-red-500", text: "text-pink-400", accent: "border-pink-500/30", bg: "bg-pink-500/10" },
  friends: { gradient: "from-emerald-500 via-teal-500 to-cyan-500", text: "text-emerald-400", accent: "border-emerald-500/30", bg: "bg-emerald-500/10" },
  business: { gradient: "from-blue-500 via-indigo-500 to-purple-500", text: "text-blue-400", accent: "border-blue-500/30", bg: "bg-blue-500/10" },
};

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

  // Refs for stable callbacks
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const p = puzzles[currentRound];

  // Matchmaking
  useEffect(() => {
    if (phase !== "matchmaking") return;
    const cat = category;
    const oppList = OPPONENTS[cat];
    const timer = setTimeout(() => {
      const opp = oppList[Math.floor(Math.random() * oppList.length)];
      setOpponent({ ...opp, speed: 0.3 + Math.random() * 0.5, accuracy: 0.5 + Math.random() * 0.4 });

      // Select puzzles
      const pool = [...PUZZLES[cat]];
      const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, TOTAL_ROUNDS);
      setPuzzles(shuffled);

      setPhase("countdown");
    }, 1500 + Math.random() * 1000);
    return () => clearTimeout(timer);
  }, [phase, category]);

  // Countdown
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

  // Round timer
  useEffect(() => {
    if (phase === "playing" && !showResult) {
      setTimeLeft(TIME_PER_ROUND);
      setGuess("");
      setSubmitted(false);
      submittedRef.current = false;
      setRevealedHints([]);
      setPlayerCorrect(false);
      setOpponentCorrect(false);

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
              // Simulate opponent
              simulateOpponent(false);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-focus input
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

    // Check answer (fuzzy match)
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
      setStreak(prev => {
        const newStreak = prev + 1;
        setBestStreak(bs => Math.max(bs, newStreak));
        return newStreak;
      });
    } else {
      setStreak(0);
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
  };

  // Simple Levenshtein distance
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

  const timerColor = timeLeft <= 5 ? "text-red-400" : timeLeft <= 10 ? "text-amber-400" : "text-emerald-400";
  const timerBg = timeLeft <= 5 ? "bg-red-500/20 border-red-500/40" : timeLeft <= 10 ? "bg-amber-500/20 border-amber-500/40" : "bg-emerald-500/20 border-emerald-500/40";
  const playerWon = playerScore > opponentScore;
  const tie = playerScore === opponentScore;
  const correctCount = playerResults.filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-slate-950 text-white overflow-hidden">
      {/* ── HEADER ── */}
      <div className="fixed top-0 left-0 right-0 z-[60]" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="px-4 py-3 flex items-center justify-between border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-slate-800/80 backdrop-blur-md border border-slate-700/50 flex items-center justify-center hover:bg-slate-700/80 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div className="flex items-center gap-2">
            <Smile className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-black uppercase tracking-widest bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
              Emoji Decode
            </span>
          </div>
          {(phase === "playing" || phase === "review") ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
              <span className="text-[10px] font-black text-slate-400">{currentRound + 1}/{TOTAL_ROUNDS}</span>
            </div>
          ) : (
            <div style={{ width: "60px" }} />
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="absolute inset-0 flex flex-col" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 56px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

        {/* ── MATCHMAKING ── */}
        {phase === "matchmaking" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-pink-500/20 border border-amber-500/30 flex items-center justify-center"
            >
              <Smile className="w-8 h-8 text-amber-400" />
            </motion.div>
            <div className="text-center">
              <h2 className="text-lg font-black text-slate-200 mb-1">Finding Decoder...</h2>
              <p className="text-xs text-slate-500">Matching you with an emoji expert</p>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-amber-500"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── COUNTDOWN ── */}
        {phase === "countdown" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={countdown}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-8xl font-black text-amber-400"
              >
                {countdown}
              </motion.div>
            </AnimatePresence>
            {opponent && (
              <p className="text-xs text-slate-500 font-bold mt-8">
                vs {opponent.name} {opponent.emoji}
              </p>
            )}
          </div>
        )}

        {/* ── PLAYING / REVIEW ── */}
        {(phase === "playing" || phase === "review") && p && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            {/* Score bar */}
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center gap-3">
                {/* Player */}
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-pink-500 flex items-center justify-center text-[10px]">👤</div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 leading-tight">You</p>
                    <p className={`text-sm font-black ${theme.text}`}>{playerScore}</p>
                  </div>
                </div>

                {/* Timer */}
                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full border ${timerBg} ${showResult ? "opacity-50" : ""}`}>
                  <Timer className={`w-3.5 h-3.5 ${timerColor}`} />
                  <span className={`text-sm font-black tabular-nums ${timerColor}`}>
                    {showResult ? "—" : timeLeft}
                  </span>
                </div>

                {/* Progress dots */}
                <div className="flex gap-1 mx-2">
                  {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        i < playerResults.length
                          ? playerResults[i] ? "bg-emerald-400" : "bg-red-400"
                          : i === currentRound ? `bg-amber-400 animate-pulse` : "bg-slate-700"
                      }`}
                    />
                  ))}
                </div>

                {/* Opponent */}
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 leading-tight">{opponent?.name}</p>
                    <p className="text-sm font-black text-slate-300">{opponentScore}</p>
                  </div>
                  <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-700">
                    {opponent && <img src={opponent.photo} alt={opponent.name} className="w-full h-full object-cover" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Puzzle Card */}
            <div className="flex flex-col items-center px-4 py-4 my-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentRound}
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full max-w-md"
                >
                  {/* Difficulty badge */}
                  <div className="flex justify-center mb-3">
                    <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      p.difficulty === "easy" ? "bg-emerald-500/20 text-emerald-400" :
                      p.difficulty === "medium" ? "bg-amber-500/20 text-amber-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {p.difficulty}
                    </span>
                    <span className="ml-2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/5 text-slate-500">
                      {p.category}
                    </span>
                  </div>

                  {/* Emoji Display */}
                  <motion.div
                    className="bg-slate-900/80 rounded-2xl border border-slate-800/50 p-6 mb-4 text-center"
                    animate={!submitted ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <p className="text-5xl tracking-widest leading-relaxed select-none" style={{ letterSpacing: "0.3em" }}>
                      {p.emojis}
                    </p>
                  </motion.div>

                  {/* Hints */}
                  {!submitted && (
                    <div className="flex gap-2 mb-4">
                      {p.hints.map((hint, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex-1"
                        >
                          {revealedHints.includes(i) ? (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 flex items-center gap-2">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="text-xs text-amber-300">{hint}</span>
                            </div>
                          ) : (
                            <button
                              onClick={handleRevealHint}
                              className="w-full bg-slate-800/50 border border-slate-700/30 rounded-xl px-3 py-2 flex items-center justify-center gap-2 hover:bg-slate-700/50 transition-colors"
                            >
                              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-xs text-slate-500">Hint {i + 1}</span>
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Input area */}
                  {!submitted ? (
                    <div className="flex gap-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={guess}
                        onChange={e => setGuess(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && guess.trim() && handleSubmit()}
                        placeholder="Type your guess..."
                        className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                        autoComplete="off"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSubmit}
                        disabled={!guess.trim()}
                        className={`px-5 rounded-xl bg-gradient-to-r ${theme.gradient} text-white font-bold text-sm flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg`}
                      >
                        <Send className="w-4 h-4" />
                      </motion.button>
                    </div>
                  ) : (
                    /* Result display */
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-3"
                    >
                      {/* Player result */}
                      <div className={`rounded-xl p-4 border ${playerCorrect ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}`}>
                        <div className="flex items-center gap-2 mb-2">
                          {playerCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400" />
                          )}
                          <span className={`text-sm font-black uppercase ${playerCorrect ? "text-emerald-400" : "text-red-400"}`}>
                            {playerCorrect ? "Correct!" : timeLeft === 0 && !guess.trim() ? "Time's Up!" : "Wrong!"}
                          </span>
                        </div>
                        {guess.trim() && (
                          <p className="text-xs text-slate-400">Your guess: <span className="text-white font-bold">{guess}</span></p>
                        )}
                        {!playerCorrect && (
                          <p className="text-xs text-slate-400 mt-1">Answer: <span className="text-amber-400 font-bold capitalize">{p.answer}</span></p>
                        )}
                      </div>

                      {/* Opponent result */}
                      <div className={`rounded-xl p-3 border ${opponentCorrect ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full overflow-hidden">
                            {opponent && <img src={opponent.photo} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <span className="text-xs text-slate-400">{opponent?.name}</span>
                          {opponentCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400 ml-auto" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ── REVIEW FOOTER (fixed at bottom) ── */}
        {showResult && p && phase === "review" && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-0 left-0 right-0 z-[61] px-6 pb-6 pt-3 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/50"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}
          >
            <button
              onClick={handleNextRound}
              className={`w-full py-4 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-black text-sm uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg`}
            >
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
            </button>
          </motion.div>
        )}

        {/* ── RESULTS ── */}
        {phase === "results" && (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="w-full max-w-sm bg-slate-900/80 rounded-3xl border border-slate-800/50 p-6 space-y-5"
            >
              {/* Result header */}
              <div className={`-mt-6 -mx-6 px-6 py-4 rounded-t-3xl bg-gradient-to-r ${theme.gradient} text-center`}>
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-4xl mb-1"
                >
                  {playerWon ? "🎉" : tie ? "🤝" : "😢"}
                </motion.div>
                <h2 className="text-xl font-black text-white uppercase tracking-wide">
                  {playerWon ? "Decoded!" : tie ? "Tied!" : "Defeated!"}
                </h2>
                <p className="text-xs text-white/70 font-bold mt-0.5">
                  {playerWon
                    ? `You out-decoded ${opponent?.name}!`
                    : tie
                    ? "A battle of equals!"
                    : `${opponent?.name} decoded faster!`}
                </p>
              </div>

              {/* Score comparison */}
              <div className="flex items-center justify-center gap-4">
                <div className={`text-center px-4 py-3 rounded-xl ${playerWon ? "bg-amber-500/10 border border-amber-500/30" : "bg-slate-800/50 border border-slate-700/30"}`}>
                  <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-gradient-to-br from-amber-500 to-pink-500 flex items-center justify-center text-sm">
                    {playerWon ? "👑" : "👤"}
                  </div>
                  <p className="text-lg font-black text-white">{playerScore}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">You</p>
                </div>
                <span className="text-xs font-black text-slate-600 uppercase">vs</span>
                <div className={`text-center px-4 py-3 rounded-xl ${!playerWon && !tie ? "bg-amber-500/10 border border-amber-500/30" : "bg-slate-800/50 border border-slate-700/30"}`}>
                  <div className="w-8 h-8 mx-auto mb-1 rounded-full overflow-hidden border border-slate-700">
                    {opponent && <img src={opponent.photo} alt={opponent.name} className="w-full h-full object-cover" />}
                  </div>
                  <p className="text-lg font-black text-white">{opponentScore}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">{opponent?.name}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex justify-center gap-6 text-center">
                <div>
                  <p className={`text-sm font-black ${theme.text}`}>{correctCount}/{TOTAL_ROUNDS}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Decoded</p>
                </div>
                <div>
                  <p className={`text-sm font-black ${theme.text}`}>{bestStreak}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Best Streak</p>
                </div>
                <div>
                  <p className={`text-sm font-black ${theme.text}`}>{hintsUsed}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Hints Used</p>
                </div>
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-1.5">
                {playerResults.map((correct, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full ${correct ? "bg-emerald-400" : "bg-red-400"}`} />
                ))}
              </div>

              {/* Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleRestart}
                  className={`w-full py-3.5 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg`}
                >
                  <RotateCcw className="w-4 h-4" />
                  Play Again
                </button>
                <button
                  onClick={onBack}
                  className="w-full py-3 rounded-2xl bg-slate-800/50 border border-slate-700/30 text-slate-400 font-bold text-sm hover:bg-slate-700/50 transition-colors"
                >
                  Exit to Games
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
