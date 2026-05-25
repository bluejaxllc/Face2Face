import { useState, useEffect, useRef, useCallback } from "react";
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
  },
  friends: {
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  business: {
    gradient: "from-blue-500 via-indigo-500 to-purple-500",
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
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

  // ── Answers + scores ──
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [opponentAnswer, setOpponentAnswer] = useState<number | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [playerAnswers, setPlayerAnswers] = useState<(number | null)[]>([]);
  const [opponentAnswers, setOpponentAnswers] = useState<(number | null)[]>([]);
  const [streak, setStreak] = useState(0);

  // ── Refs to avoid stale closures ──
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const opponentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answeredRef = useRef(false);
  const currentQRef = useRef(currentQ);
  const questionsRef = useRef(questions);

  useEffect(() => { currentQRef.current = currentQ; }, [currentQ]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);

  // ── Initialize questions on mount ──
  useEffect(() => {
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, TOTAL_QUESTIONS);
    setQuestions(shuffled);
  }, [allQuestions]);

  // ── Countdown ──
  useEffect(() => {
    if (phase === "countdown") {
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setPhase("question");
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
    setTimeout(() => {
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
    }, 400);
  }, []);

  // ── Player selects answer ──
  const handleSelectAnswer = useCallback(
    (idx: number) => {
      if (answeredRef.current) return;
      answeredRef.current = true;
      setSelectedAnswer(idx);
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
      setCurrentQ((q) => q + 1);
      setPhase("question");
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
    answeredRef.current = false;
    setPhase("countdown");
  }, [allQuestions]);

  const q = questions[currentQ];
  const playerWon = playerScore > opponentScore;
  const isTie = playerScore === opponentScore;
  const avatarUrl = opponent.profilePhoto || undefined;

  const difficultyColors: Record<string, string> = {
    easy: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    hard: "text-red-400 bg-red-500/10 border-red-500/30",
  };

  return (
    <div className="flex flex-col w-full text-white select-none overflow-hidden">

      {/* ── PHASE: COUNTDOWN ── */}
      {phase === "countdown" && (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Get Ready!</p>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={countdown}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.6 }}
              className={`text-7xl font-black ${theme.text}`}
            >
              {countdown}
            </motion.div>
          </AnimatePresence>
          <p className="text-xs text-slate-400 font-bold mt-8 uppercase tracking-wider">
            vs {opponentName}
          </p>
        </div>
      )}

      {/* ── PHASE: QUESTION / REVIEW ── */}
      {(phase === "question" || phase === "review") && q && (
        <div className="flex flex-col">
          {/* Score bar */}
          <div className="flex items-center gap-2 px-4 pt-3 pb-2">
            {/* Player */}
            <div className="flex items-center gap-1.5 flex-1">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                <User className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-xs font-black text-white">{playerScore}</p>
                <p className="text-[7px] text-slate-500 font-bold">YOU</p>
              </div>
            </div>

            {/* Timer */}
            <div className={`px-3 py-1.5 rounded-full border transition-colors ${
              timeLeft <= 3 && phase === "question"
                ? "bg-red-500/10 border-red-500/40 animate-pulse"
                : "bg-slate-800/60 border-slate-700/50"
            }`}>
              <div className="flex items-center gap-1">
                <Timer className={`w-3 h-3 ${timeLeft <= 3 && phase === "question" ? "text-red-400" : "text-slate-400"}`} />
                <span className={`text-sm font-black tabular-nums ${
                  timeLeft <= 3 && phase === "question" ? "text-red-400" : "text-white"
                }`}>
                  {phase === "review" ? "—" : timeLeft}
                </span>
              </div>
            </div>

            {/* Opponent */}
            <div className="flex items-center gap-1.5 flex-1 justify-end">
              <div className="text-right">
                <p className="text-xs font-black text-white">{opponentScore}</p>
                <p className="text-[7px] text-slate-500 font-bold">{opponentName.toUpperCase()}</p>
              </div>
              <div className={`w-7 h-7 rounded-full overflow-hidden border ${theme.border} bg-slate-800 flex items-center justify-center`}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={opponentName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 pb-2">
            {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => {
              let dotColor = "bg-slate-800";
              if (i < playerAnswers.length) {
                const wasCorrect = playerAnswers[i] !== null && playerAnswers[i] === questions[i]?.correct;
                dotColor = wasCorrect ? "bg-emerald-500" : "bg-red-500";
              } else if (i === currentQ) {
                dotColor = `bg-gradient-to-r ${theme.gradient}`;
              }
              return <div key={i} className={`w-2 h-2 rounded-full ${dotColor} transition-colors`} />;
            })}
          </div>

          {/* Streak badge */}
          {streak >= 2 && (
            <motion.div
              key={streak}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center justify-center gap-1 pb-1"
            >
              <Flame className="w-3 h-3 text-orange-400" />
              <span className="text-[9px] font-black text-orange-400 uppercase">{streak} streak!</span>
            </motion.div>
          )}

          {/* Question card */}
          <div className="px-4 py-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQ}
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -40, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {/* Question number + difficulty */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                    Q{currentQ + 1}/{TOTAL_QUESTIONS}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider border ${difficultyColors[q.difficulty]}`}>
                    {q.difficulty}
                  </span>
                </div>

                {/* Question text */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-3 backdrop-blur-sm">
                  <p className="text-sm font-black text-white text-center leading-relaxed">{q.question}</p>
                </div>

                {/* Answer options */}
                <div className="space-y-2">
                  {q.options.map((option, idx) => {
                    const isReview = phase === "review";
                    let optionStyles = "bg-slate-900/40 border-slate-700/50 active:scale-[0.98]";

                    if (isReview) {
                      if (idx === q.correct) {
                        optionStyles = "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/50";
                      } else if (idx === selectedAnswer && idx !== q.correct) {
                        optionStyles = "border-red-500 bg-red-500/10 ring-1 ring-red-500/50";
                      } else {
                        optionStyles = "bg-slate-900/20 border-slate-800 opacity-40";
                      }
                    } else if (selectedAnswer === idx) {
                      optionStyles = `${theme.bg} ${theme.border}`;
                    }

                    const letter = String.fromCharCode(65 + idx);

                    return (
                      <motion.button
                        key={idx}
                        onClick={() => handleSelectAnswer(idx)}
                        disabled={answeredRef.current || isReview}
                        whileTap={!isReview && !answeredRef.current ? { scale: 0.97 } : {}}
                        className={`w-full py-3 px-4 rounded-xl border text-left flex items-center gap-3 transition-all ${optionStyles}`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                          isReview && idx === q.correct
                            ? "bg-emerald-500 text-white"
                            : isReview && idx === selectedAnswer && idx !== q.correct
                            ? "bg-red-500 text-white"
                            : "bg-slate-800 text-slate-400"
                        }`}>
                          {isReview && idx === q.correct ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : isReview && idx === selectedAnswer && idx !== q.correct ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            letter
                          )}
                        </div>
                        <span className={`text-xs font-bold ${
                          isReview && idx === q.correct ? "text-emerald-300" :
                          isReview && idx === selectedAnswer && idx !== q.correct ? "text-red-300" :
                          "text-slate-200"
                        }`}>{option}</span>

                        {/* Opponent answered indicator */}
                        {isReview && opponentAnswer === idx && (
                          <div className="ml-auto shrink-0">
                            <div className={`w-5 h-5 rounded-full overflow-hidden border ${theme.border} bg-slate-800 flex items-center justify-center`}>
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
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Review footer */}
          {phase === "review" && (
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="px-4 pb-3 pt-2"
            >
              {/* Result line */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  {selectedAnswer === q?.correct ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-black text-emerald-400 uppercase">Correct!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-black text-red-400 uppercase">
                        {selectedAnswer === null ? "Time's Up!" : "Wrong!"}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                  {opponentName}:
                  {opponentAnswer === q?.correct ? (
                    <span className="text-emerald-400">✓</span>
                  ) : (
                    <span className="text-red-400">✗</span>
                  )}
                </div>
              </div>

              <button
                onClick={handleNextQuestion}
                className={`w-full py-3 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2`}
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
              </button>
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
                {/* Result icon */}
                <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${
                  playerWon
                    ? "bg-amber-500/10 border-2 border-amber-500/30"
                    : isTie
                    ? "bg-slate-800 border-2 border-slate-700"
                    : "bg-red-500/10 border-2 border-red-500/30"
                }`}>
                  {playerWon ? (
                    <Trophy className="w-8 h-8 text-amber-400" />
                  ) : isTie ? (
                    <Users className="w-8 h-8 text-slate-400" />
                  ) : (
                    <span className="text-3xl">😢</span>
                  )}
                </div>

                <h2 className="text-xl font-black uppercase tracking-wider mb-1">
                  {playerWon ? "You Win!" : isTie ? "It's a Tie!" : "Defeated!"}
                </h2>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-4 ${
                  playerWon ? "text-amber-400" : isTie ? "text-slate-400" : "text-red-400"
                }`}>
                  {playerWon ? "Brain power reigns supreme" : isTie ? "Evenly matched" : `${opponentName} outsmarted you`}
                </p>

                {/* Score comparison */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-1">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className={`text-lg font-black ${playerWon ? "text-amber-400" : "text-white"}`}>{playerScore}</p>
                    <p className="text-[6px] text-slate-500 uppercase tracking-widest font-bold">You</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="text-[10px] font-black text-slate-600 uppercase">vs</span>
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-2.5">
                    <div className={`w-7 h-7 rounded-full overflow-hidden border ${theme.border} bg-slate-800 mx-auto mb-1 flex items-center justify-center`}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={opponentName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <p className={`text-lg font-black ${!playerWon && !isTie ? "text-amber-400" : "text-white"}`}>{opponentScore}</p>
                    <p className="text-[6px] text-slate-500 uppercase tracking-widest font-bold">{opponentName}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm font-black text-emerald-400">
                      {playerAnswers.filter((a, i) => a === questions[i]?.correct).length}/{TOTAL_QUESTIONS}
                    </p>
                    <p className="text-[6px] text-slate-500 uppercase tracking-widest font-bold">Correct</p>
                  </div>
                  <div className="w-px h-5 bg-slate-800" />
                  <div className="text-center">
                    <p className="text-sm font-black text-orange-400">
                      {Math.max(0, ...playerAnswers.reduce<number[]>((acc, a, i) => {
                        const isCorrect = a !== null && a === questions[i]?.correct;
                        const last = acc.length > 0 ? acc[acc.length - 1] : 0;
                        acc.push(isCorrect ? last + 1 : 0);
                        return acc;
                      }, []))}
                    </p>
                    <p className="text-[6px] text-slate-500 uppercase tracking-widest font-bold">Best Streak</p>
                  </div>
                </div>

                {/* Question review dots */}
                <div className="flex items-center justify-center gap-1.5 mb-4">
                  {playerAnswers.map((a, i) => (
                    <div key={i} className={`w-2.5 h-2.5 rounded-full ${
                      a !== null && a === questions[i]?.correct ? "bg-emerald-500" : "bg-red-500"
                    }`} />
                  ))}
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
