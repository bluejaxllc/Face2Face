import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  User,
  Timer,
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
  },
  friends: {
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    ring: "ring-emerald-500/30",
  },
  business: {
    gradient: "from-blue-500 via-indigo-500 to-purple-500",
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    ring: "ring-blue-500/30",
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

  // ── Refs (avoid stale closures) ──
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answeredRef = useRef(false);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Countdown ──
  useEffect(() => {
    if (phase === "countdown") {
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown((prev) => {
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

  // ── Round timer ──
  useEffect(() => {
    if (phase === "playing") {
      setTimeLeft(TIME_PER_ROUND);
      setSelectedIdx(null);
      answeredRef.current = false;

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            if (!answeredRef.current) {
              answeredRef.current = true;
              setPlayerGuesses((g) => [...g, null]);
              setPhase("reveal");
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
      autoAdvanceRef.current = setTimeout(() => {
        if (currentRound + 1 >= TOTAL_ROUNDS) {
          setPhase("results");
        } else {
          setCurrentRound((r) => r + 1);
          setPhase("playing");
        }
      }, 2000);
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
      setPhase("reveal");
    },
    []
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

  // ── Derived ──
  const round = rounds[currentRound];
  const correctCount = playerGuesses.filter(
    (g, i) => g !== null && g === rounds[i]?.lieIndex
  ).length;
  const totalAnswered = playerGuesses.length;
  const scorePercent = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  const timerPercent = (timeLeft / TIME_PER_ROUND) * 100;

  return (
    <div className="flex flex-col w-full text-white select-none overflow-hidden">

      {/* ── PHASE: COUNTDOWN ── */}
      {phase === "countdown" && (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
            Two Truths & a Lie
          </p>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={countdown}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.6 }}
              className={`text-7xl font-black bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}
            >
              {countdown}
            </motion.div>
          </AnimatePresence>
          <p className="text-xs text-slate-400 font-bold mt-8 uppercase tracking-wider">
            Guess {opponentName}'s Lies
          </p>
        </div>
      )}

      {/* ── PHASE: PLAYING / REVEAL ── */}
      {(phase === "playing" || phase === "reveal") && round && (
        <div className="flex flex-col">
          {/* Top: Avatar + name + round indicator */}
          <div className="flex items-center gap-3 px-4 pt-3 pb-2">
            <div className={`w-10 h-10 rounded-full overflow-hidden border-2 ${theme.border} bg-slate-800 flex items-center justify-center shrink-0`}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={opponentName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white truncate">
                {opponentName}'s Truths
              </p>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                Spot the Lie
              </p>
            </div>

            {/* Round indicator */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
                let dotColor = "bg-slate-800";
                if (i < playerGuesses.length) {
                  const wasCorrect = playerGuesses[i] !== null && playerGuesses[i] === rounds[i]?.lieIndex;
                  dotColor = wasCorrect ? "bg-emerald-500" : "bg-red-500";
                } else if (i === currentRound) {
                  dotColor = `bg-gradient-to-r ${theme.gradient}`;
                }
                return (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <span className="text-[6px] text-slate-500 font-black">{i + 1}</span>
                    <div className={`w-2 h-2 rounded-full ${dotColor} transition-colors`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statement cards */}
          <div className="px-4 py-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentRound}
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -40, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-2"
              >
                {round.statements.map((statement, idx) => {
                  const isRevealed = phase === "reveal";
                  const isTheLie = idx === round.lieIndex;
                  const wasSelected = selectedIdx === idx;

                  let cardStyles = "bg-slate-900/40 border-slate-700/50 active:scale-[0.98]";

                  if (isRevealed) {
                    if (isTheLie && wasSelected) {
                      // Correctly identified the lie
                      cardStyles = "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/50";
                    } else if (isTheLie && !wasSelected) {
                      // This was the lie but player didn't pick it (or timed out)
                      cardStyles = "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/40";
                    } else if (wasSelected && !isTheLie) {
                      // Player picked this but it's a truth (wrong guess)
                      cardStyles = "border-red-500 bg-red-500/10 ring-1 ring-red-500/50";
                    } else {
                      // Truth, not selected
                      cardStyles = "bg-slate-900/20 border-slate-800 opacity-40";
                    }
                  } else if (wasSelected) {
                    cardStyles = `${theme.bg} ${theme.border} ring-1 ${theme.ring}`;
                  }

                  return (
                    <motion.button
                      key={idx}
                      onClick={() => handleSelect(idx)}
                      disabled={answeredRef.current || isRevealed}
                      whileTap={!isRevealed && !answeredRef.current ? { scale: 0.97 } : {}}
                      className={`w-full py-3 px-4 rounded-xl border text-left flex items-center gap-3 transition-all ${cardStyles}`}
                    >
                      {/* Number badge */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                        isRevealed && isTheLie && wasSelected
                          ? "bg-emerald-500 text-white"
                          : isRevealed && isTheLie && !wasSelected
                          ? "bg-amber-500 text-white"
                          : isRevealed && wasSelected && !isTheLie
                          ? "bg-red-500 text-white"
                          : "bg-slate-800 text-slate-400"
                      }`}>
                        {isRevealed && isTheLie ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : isRevealed && wasSelected && !isTheLie ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          idx + 1
                        )}
                      </div>

                      {/* Statement text */}
                      <span className={`text-xs font-bold leading-relaxed ${
                        isRevealed && isTheLie && wasSelected ? "text-emerald-300" :
                        isRevealed && isTheLie && !wasSelected ? "text-amber-300" :
                        isRevealed && wasSelected && !isTheLie ? "text-red-300" :
                        "text-slate-200"
                      }`}>
                        {statement}
                      </span>

                      {/* Reveal label */}
                      {isRevealed && isTheLie && (
                        <span className="ml-auto shrink-0 text-[7px] font-black uppercase tracking-wider text-amber-400">
                          LIE
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Timer bar */}
          <div className="px-4 pt-1 pb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Timer className={`w-3 h-3 ${
                timeLeft <= 5 && phase === "playing" ? "text-red-400" : "text-slate-400"
              }`} />
              <span className={`text-xs font-black tabular-nums ${
                timeLeft <= 5 && phase === "playing" ? "text-red-400" : "text-slate-300"
              }`}>
                {phase === "reveal" ? "—" : `${timeLeft}s`}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800/60 overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${
                  timeLeft <= 5 && phase === "playing"
                    ? "from-red-500 to-orange-500"
                    : theme.gradient
                }`}
                initial={false}
                animate={{ width: phase === "reveal" ? "0%" : `${timerPercent}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Reveal feedback */}
          {phase === "reveal" && (
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="px-4 pb-3"
            >
              <div className="flex items-center justify-center gap-2">
                {selectedIdx !== null && selectedIdx === round.lieIndex ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black text-emerald-400 uppercase">
                      Correct! You found the lie!
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-black text-red-400 uppercase">
                      {selectedIdx === null ? "Time's Up!" : "Wrong! That was a truth."}
                    </span>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* ── PHASE: RESULTS ── */}
      {phase === "results" && (
        <div className="flex flex-col items-center px-4 py-5">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-full max-w-sm"
          >
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-md shadow-2xl overflow-hidden">
              <div className={`h-1.5 bg-gradient-to-r ${theme.gradient}`} />
              <div className="p-5 text-center">
                {/* Score circle */}
                <div className="relative w-20 h-20 mx-auto mb-3">
                  {/* BG ring */}
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle
                      cx="40" cy="40" r="34"
                      fill="none"
                      stroke="currentColor"
                      className="text-slate-800"
                      strokeWidth="6"
                    />
                    <circle
                      cx="40" cy="40" r="34"
                      fill="none"
                      stroke="url(#scoreGrad)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - scorePercent / 100)}`}
                      className="transition-all duration-700"
                    />
                    <defs>
                      <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={category === "dating" ? "#ec4899" : category === "friends" ? "#10b981" : "#3b82f6"} />
                        <stop offset="100%" stopColor={category === "dating" ? "#ef4444" : category === "friends" ? "#06b6d4" : "#8b5cf6"} />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-white">{correctCount}</span>
                    <span className="text-[7px] text-slate-500 font-bold uppercase">/{TOTAL_ROUNDS}</span>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-black uppercase tracking-wider mb-1">
                  {correctCount >= 4 ? "Lie Detector!" : correctCount >= 3 ? "Sharp Eye!" : correctCount >= 2 ? "Not Bad!" : "Keep Trying!"}
                </h2>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-4 ${
                  correctCount >= 4 ? "text-amber-400" : correctCount >= 3 ? theme.text : correctCount >= 2 ? "text-slate-400" : "text-red-400"
                }`}>
                  {correctCount >= 4
                    ? "You can't be fooled"
                    : correctCount >= 3
                    ? "Great instincts"
                    : correctCount >= 2
                    ? "Room for improvement"
                    : "Everyone falls for a good lie"}
                </p>

                {/* Opponent avatar + context */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className={`w-6 h-6 rounded-full overflow-hidden border ${theme.border} bg-slate-800 flex items-center justify-center`}>
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

                {/* Round-by-round recap dots */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  {playerGuesses.map((g, i) => {
                    const wasCorrect = g !== null && g === rounds[i]?.lieIndex;
                    return (
                      <div key={i} className="flex flex-col items-center gap-0.5">
                        <span className="text-[7px] text-slate-500 font-black">R{i + 1}</span>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                          wasCorrect
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                            : "bg-red-500/20 border-red-500 text-red-400"
                        }`}>
                          {wasCorrect ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm font-black text-emerald-400">{correctCount}</p>
                    <p className="text-[6px] text-slate-500 uppercase tracking-widest font-bold">Correct</p>
                  </div>
                  <div className="w-px h-5 bg-slate-800" />
                  <div className="text-center">
                    <p className="text-sm font-black text-red-400">{TOTAL_ROUNDS - correctCount}</p>
                    <p className="text-[6px] text-slate-500 uppercase tracking-widest font-bold">Wrong</p>
                  </div>
                  <div className="w-px h-5 bg-slate-800" />
                  <div className="text-center">
                    <p className="text-sm font-black text-white">{scorePercent}%</p>
                    <p className="text-[6px] text-slate-500 uppercase tracking-widest font-bold">Accuracy</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-2">
                  <button
                    onClick={handlePlayAgain}
                    className={`w-full py-3 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Play Again</span>
                  </button>
                  <button
                    onClick={onComplete}
                    className="w-full py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-300 text-xs font-bold active:scale-95 transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
