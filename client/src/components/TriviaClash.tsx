import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Brain,
  Timer,
  Zap,
  Trophy,
  Star,
  CheckCircle2,
  XCircle,
  Flame,
  Users,
  Sparkles,
  Heart,
  UserPlus,
  Briefcase,
  RotateCcw,
  Award,
} from "lucide-react";

type Category = "dating" | "friends" | "business";

interface TriviaClashProps {
  onBack: () => void;
  category?: Category;
}

interface Question {
  question: string;
  options: string[];
  correct: number; // index
  difficulty: "easy" | "medium" | "hard";
}

interface Opponent {
  name: string;
  age: number;
  photo: string;
  emoji: string;
  speed: number; // 0-1: how fast they answer (affects timing)
  accuracy: number; // 0-1: how likely they answer correctly
}

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
  gradient: string;
  textAccent: string;
  bgAccent: string;
  borderAccent: string;
  correctColor: string;
  wrongColor: string;
}> = {
  dating: {
    gradient: "from-pink-500 via-rose-500 to-red-500",
    textAccent: "text-pink-400",
    bgAccent: "bg-pink-500/15",
    borderAccent: "border-pink-500/30",
    correctColor: "border-emerald-500 bg-emerald-500/10",
    wrongColor: "border-red-500 bg-red-500/10",
  },
  friends: {
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    textAccent: "text-emerald-400",
    bgAccent: "bg-emerald-500/15",
    borderAccent: "border-emerald-500/30",
    correctColor: "border-emerald-500 bg-emerald-500/10",
    wrongColor: "border-red-500 bg-red-500/10",
  },
  business: {
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    textAccent: "text-blue-400",
    bgAccent: "bg-blue-500/15",
    borderAccent: "border-blue-500/30",
    correctColor: "border-emerald-500 bg-emerald-500/10",
    wrongColor: "border-red-500 bg-red-500/10",
  },
};

type GamePhase = "matchmaking" | "countdown" | "playing" | "review" | "results";

const TOTAL_QUESTIONS = 7;
const TIME_PER_QUESTION = 12; // seconds

export default function TriviaClash({ onBack, category = "dating" }: TriviaClashProps) {
  const theme = THEMES[category];
  const allQuestions = QUESTIONS[category];
  const opponents = OPPONENTS[category];

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

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const opponentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentQRef = useRef(currentQ);
  const questionsRef = useRef(questions);
  const opponentRef = useRef(opponent);
  const answeredRef = useRef(false);

  // Keep refs synced
  useEffect(() => { currentQRef.current = currentQ; }, [currentQ]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { opponentRef.current = opponent; }, [opponent]);

  // Matchmaking animation
  useEffect(() => {
    if (phase === "matchmaking") {
      const dotInterval = setInterval(() => {
        setMatchmakingDots(prev => (prev + 1) % 4);
      }, 400);

      // Auto-match after 2s
      const matchTimeout = setTimeout(() => {
        const opp = opponents[Math.floor(Math.random() * opponents.length)];
        setOpponent(opp);

        // Shuffle and pick questions
        const shuffled = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, TOTAL_QUESTIONS);
        setQuestions(shuffled);

        // Short pause, then countdown
        setTimeout(() => setPhase("countdown"), 800);
      }, 2000);

      return () => {
        clearInterval(dotInterval);
        clearTimeout(matchTimeout);
      };
    }
  }, [phase, opponents, allQuestions]);

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

  // Question timer
  useEffect(() => {
    if (phase === "playing" && !showResult) {
      setTimeLeft(TIME_PER_QUESTION);
      setSelectedAnswer(null);
      setOpponentAnswer(null);
      setShowResult(false);
      answeredRef.current = false;

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            // Time's up — finalize with no answer
            if (!answeredRef.current) {
              answeredRef.current = true;
              setPlayerAnswers(pa => [...pa, null]);
              setStreak(0);
              finalizeQuestion();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Simulate opponent answer
      const opp = opponentRef.current;
      if (opp) {
        const opponentDelay = (2000 + Math.random() * 6000) * (1 - opp.speed * 0.5);
        opponentTimerRef.current = setTimeout(() => {
          const qq = questionsRef.current[currentQRef.current];
          if (!qq) return;
          const isCorrect = Math.random() < opp.accuracy;
          let answer: number;
          if (isCorrect) {
            answer = qq.correct;
          } else {
            const wrongOptions = qq.options.map((_, i) => i).filter(i => i !== qq.correct);
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

  const finalizeQuestion = useCallback(() => {
    // Generate opponent answer if they haven't answered yet
    setTimeout(() => {
      const qq = questionsRef.current[currentQRef.current];
      const opp = opponentRef.current;
      if (!qq || !opp) {
        setShowResult(true);
        setPhase("review");
        return;
      }

      setOpponentAnswer(prev => {
        if (prev !== null) {
          // Already answered — score them and record
          if (prev === qq.correct) {
            setOpponentScore(s => s + 100 + Math.round(Math.random() * 40));
          }
          setOpponentAnswers(a => [...a, prev]);
          return prev;
        }
        // Generate their answer now
        const isCorrect = Math.random() < opp.accuracy;
        let answer: number;
        if (isCorrect) {
          answer = qq.correct;
        } else {
          const wrongOptions = qq.options.map((_, i) => i).filter(i => i !== qq.correct);
          answer = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
        }
        if (answer === qq.correct) {
          setOpponentScore(s => s + 100 + Math.round(Math.random() * 40));
        }
        setOpponentAnswers(a => [...a, answer]);
        return answer;
      });

      setShowResult(true);
      setPhase("review");
    }, 500);
  }, []);

  const handleSelectAnswer = (idx: number) => {
    if (answeredRef.current || showResult) return;
    answeredRef.current = true;

    setSelectedAnswer(idx);
    if (timerRef.current) clearInterval(timerRef.current);

    const qq = questions[currentQ];
    if (!qq) return;

    const isCorrect = idx === qq.correct;

    // Score: base points + time bonus + streak bonus
    if (isCorrect) {
      const timeBonus = Math.round(timeLeft * 5);
      const streakBonus = streak * 10;
      const points = 100 + timeBonus + streakBonus;
      setPlayerScore(prev => prev + points);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }

    setPlayerAnswers(prev => [...prev, idx]);
    finalizeQuestion();
  };

  const handleNextQuestion = () => {
    if (currentQ + 1 >= TOTAL_QUESTIONS) {
      setPhase("results");
    } else {
      setCurrentQ(prev => prev + 1);
      setShowResult(false);
      setSelectedAnswer(null);
      setOpponentAnswer(null);
      setPhase("playing");
    }
  };

  const handleRestart = () => {
    setPhase("matchmaking");
    setOpponent(null);
    setQuestions([]);
    setCurrentQ(0);
    setPlayerScore(0);
    setOpponentScore(0);
    setPlayerAnswers([]);
    setOpponentAnswers([]);
    setSelectedAnswer(null);
    setOpponentAnswer(null);
    setShowResult(false);
    setStreak(0);
    answeredRef.current = false;
  };


  const q = questions[currentQ];
  const playerWon = playerScore > opponentScore;
  const isTie = playerScore === opponentScore;

  const difficultyColors: Record<string, string> = {
    easy: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    hard: "text-red-400 bg-red-500/10 border-red-500/30",
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950 text-white select-none">
      {/* Background effects */}
      <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-[160px] opacity-15 bg-gradient-to-r ${theme.gradient}`} />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-[140px] opacity-10 bg-violet-500" />

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
            <Brain className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-black uppercase tracking-widest bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              Trivia Clash
            </span>
          </div>
          {(phase === "playing" || phase === "review") ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
              <span className="text-[10px] font-black text-slate-400">{currentQ + 1}/{TOTAL_QUESTIONS}</span>
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
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            {!opponent ? (
              <>
                {/* Searching animation */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-24 h-24 rounded-full border-4 border-slate-800 border-t-violet-500 mb-6"
                />
                <p className="text-lg font-black text-white uppercase tracking-wider">
                  Finding Opponent{".".repeat(matchmakingDots)}
                </p>
                <p className="text-xs text-slate-500 font-medium mt-2">Scanning nearby players...</p>
              </>
            ) : (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="flex flex-col items-center"
              >
                <div className="flex items-center gap-6">
                  {/* You */}
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-2xl mb-2">👑</div>
                    <p className="text-sm font-black text-white">You</p>
                  </div>
                  {/* VS */}
                  <div className="text-2xl font-black text-slate-600">VS</div>
                  {/* Opponent */}
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-violet-500/50 mb-2">
                      <img src={opponent.photo} alt={opponent.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-sm font-black text-white">{opponent.name} {opponent.emoji}</p>
                  </div>
                </div>
                <p className="text-xs text-violet-400 font-bold uppercase tracking-wider mt-4">Match Found!</p>
              </motion.div>
            )}
          </div>
        )}

        {/* ── COUNTDOWN ── */}
        {phase === "countdown" && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Get Ready!</p>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={countdown}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                exit={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="text-8xl font-black text-violet-400"
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
        {(phase === "playing" || phase === "review") && q && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            {/* Score bar */}
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center gap-3">
                {/* Player score */}
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm">👑</div>
                  <div>
                    <p className="text-xs font-black text-white">{playerScore}</p>
                    <p className="text-[8px] text-slate-500 font-bold">YOU</p>
                  </div>
                </div>

                {/* Timer */}
                <div className={`px-4 py-2 rounded-full border transition-colors ${
                  timeLeft <= 3 && phase === "playing"
                    ? 'bg-red-500/10 border-red-500/40 animate-pulse'
                    : 'bg-slate-800/60 border-slate-700/50'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <Timer className={`w-3.5 h-3.5 ${timeLeft <= 3 && phase === "playing" ? 'text-red-400' : 'text-slate-400'}`} />
                    <span className={`text-sm font-black tabular-nums ${timeLeft <= 3 && phase === "playing" ? 'text-red-400' : 'text-white'}`}>
                      {phase === "review" ? "—" : timeLeft}
                    </span>
                  </div>
                </div>

                {/* Opponent score */}
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <div className="text-right">
                    <p className="text-xs font-black text-white">{opponentScore}</p>
                    <p className="text-[8px] text-slate-500 font-bold">{opponent?.name?.toUpperCase()}</p>
                  </div>
                  {opponent && (
                    <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-700">
                      <img src={opponent.photo} alt={opponent.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => {
                  let dotColor = "bg-slate-800";
                  if (i < playerAnswers.length) {
                    const wasCorrect = playerAnswers[i] !== null && playerAnswers[i] === questions[i]?.correct;
                    dotColor = wasCorrect ? "bg-emerald-500" : "bg-red-500";
                  } else if (i === currentQ) {
                    dotColor = `bg-gradient-to-r ${theme.gradient}`;
                  }
                  return (
                    <div key={i} className={`w-2 h-2 rounded-full ${dotColor} transition-colors`} />
                  );
                })}
              </div>

              {/* Streak badge */}
              {streak >= 2 && (
                <motion.div
                  key={streak}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center justify-center gap-1 mt-2"
                >
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-[10px] font-black text-orange-400 uppercase">{streak} streak!</span>
                </motion.div>
              )}
            </div>

            {/* Question card */}
            <div className="flex flex-col items-center px-4 py-4 my-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQ}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full max-w-md"
                >
                  {/* Difficulty & category */}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${difficultyColors[q.difficulty]}`}>
                      {q.difficulty}
                    </span>
                  </div>

                  {/* Question */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-5 backdrop-blur-sm">
                    <p className="text-lg font-black text-white text-center leading-relaxed">{q.question}</p>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    {q.options.map((option, idx) => {
                      let optionStyles = "bg-slate-900/40 border-slate-700/50 hover:border-slate-600 active:scale-[0.98]";

                      if (showResult) {
                        if (idx === q.correct) {
                          optionStyles = theme.correctColor + " ring-1 ring-emerald-500/50";
                        } else if (idx === selectedAnswer && idx !== q.correct) {
                          optionStyles = theme.wrongColor + " ring-1 ring-red-500/50";
                        } else {
                          optionStyles = "bg-slate-900/20 border-slate-800 opacity-40";
                        }
                      } else if (selectedAnswer === idx) {
                        optionStyles = `${theme.bgAccent} ${theme.borderAccent}`;
                      }

                      const letter = String.fromCharCode(65 + idx); // A, B, C, D

                      return (
                        <motion.button
                          key={idx}
                          onClick={() => handleSelectAnswer(idx)}
                          disabled={selectedAnswer !== null || showResult}
                          whileTap={!showResult && selectedAnswer === null ? { scale: 0.97 } : {}}
                          className={`w-full py-4 px-5 rounded-xl border text-left flex items-center gap-4 transition-all ${optionStyles}`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0 ${
                            showResult && idx === q.correct
                              ? 'bg-emerald-500 text-white'
                              : showResult && idx === selectedAnswer && idx !== q.correct
                              ? 'bg-red-500 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {showResult && idx === q.correct ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : showResult && idx === selectedAnswer && idx !== q.correct ? (
                              <XCircle className="w-5 h-5" />
                            ) : (
                              letter
                            )}
                          </div>
                          <span className={`text-sm font-bold ${
                            showResult && idx === q.correct ? 'text-emerald-300' :
                            showResult && idx === selectedAnswer && idx !== q.correct ? 'text-red-300' :
                            'text-slate-200'
                          }`}>{option}</span>

                          {/* Opponent answered indicator */}
                          {showResult && opponentAnswer === idx && (
                            <div className="ml-auto shrink-0">
                              {opponent && (
                                <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-600">
                                  <img src={opponent.photo} alt={opponent.name} className="w-full h-full object-cover" />
                                </div>
                              )}
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

        {/* ── REVIEW FOOTER (fixed at bottom) ── */}
        {showResult && q && phase === "review" && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-0 left-0 right-0 z-[61] px-6 pb-6 pt-3 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/50"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}
          >
            {/* Result summary */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {selectedAnswer === q?.correct ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-black text-emerald-400 uppercase">Correct!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span className="text-sm font-black text-red-400 uppercase">
                      {selectedAnswer === null ? "Time's Up!" : "Wrong!"}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                {opponent && (
                  <>
                    {opponent.name}:
                    {opponentAnswer === q?.correct ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span className="text-red-400">✗</span>
                    )}
                  </>
                )}
              </div>
            </div>

            <button
              onClick={handleNextQuestion}
              className={`w-full py-4 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-black text-sm uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg`}
            >
              {currentQ + 1 >= TOTAL_QUESTIONS ? (
                <>
                  <Trophy className="w-5 h-5" />
                  <span>See Results</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Next Question</span>
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* ── RESULTS ── */}
        {phase === "results" && opponent && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-y-auto">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-full max-w-sm"
            >
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-md shadow-2xl overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${theme.gradient}`} />
                <div className="p-6 text-center">
                  {/* Result icon */}
                  <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                    playerWon ? 'bg-amber-500/10 border-2 border-amber-500/30' :
                    isTie ? 'bg-slate-800 border-2 border-slate-700' :
                    'bg-red-500/10 border-2 border-red-500/30'
                  }`}>
                    {playerWon ? (
                      <Trophy className="w-10 h-10 text-amber-400" />
                    ) : isTie ? (
                      <Users className="w-10 h-10 text-slate-400" />
                    ) : (
                      <span className="text-4xl">😢</span>
                    )}
                  </div>

                  <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-1">
                    {playerWon ? "You Win!" : isTie ? "It's a Tie!" : "Defeated!"}
                  </h2>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-6 ${
                    playerWon ? 'text-amber-400' : isTie ? 'text-slate-400' : 'text-red-400'
                  }`}>
                    {playerWon ? "Brain power reigns supreme" : isTie ? "Evenly matched minds" : `${opponent.name} outsmarted you`}
                  </p>

                  {/* Score comparison */}
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm mx-auto mb-1">👑</div>
                      <p className={`text-xl font-black ${playerWon ? 'text-amber-400' : 'text-white'}`}>{playerScore}</p>
                      <p className="text-[7px] text-slate-500 uppercase tracking-widest font-bold">You</p>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="text-xs font-black text-slate-600 uppercase">vs</span>
                    </div>
                    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-600 mx-auto mb-1">
                        <img src={opponent.photo} alt={opponent.name} className="w-full h-full object-cover" />
                      </div>
                      <p className={`text-xl font-black ${!playerWon && !isTie ? 'text-amber-400' : 'text-white'}`}>{opponentScore}</p>
                      <p className="text-[7px] text-slate-500 uppercase tracking-widest font-bold">{opponent.name}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-center gap-4 mb-5">
                    <div className="text-center">
                      <p className="text-sm font-black text-emerald-400">
                        {playerAnswers.filter((a, i) => a === questions[i]?.correct).length}/{TOTAL_QUESTIONS}
                      </p>
                      <p className="text-[7px] text-slate-500 uppercase tracking-widest font-bold">Correct</p>
                    </div>
                    <div className="w-px h-6 bg-slate-800" />
                    <div className="text-center">
                      <p className="text-sm font-black text-orange-400">
                        {Math.max(0, ...playerAnswers.reduce<number[]>((acc, a, i) => {
                          const isCorrect = a !== null && a === questions[i]?.correct;
                          const last = acc.length > 0 ? acc[acc.length - 1] : 0;
                          acc.push(isCorrect ? last + 1 : 0);
                          return acc;
                        }, []))}
                      </p>
                      <p className="text-[7px] text-slate-500 uppercase tracking-widest font-bold">Best Streak</p>
                    </div>
                  </div>

                  {/* Question review dots */}
                  <div className="flex items-center justify-center gap-1.5 mb-6">
                    {playerAnswers.map((a, i) => (
                      <div key={i} className={`w-3 h-3 rounded-full ${
                        a !== null && a === questions[i]?.correct ? 'bg-emerald-500' : 'bg-red-500'
                      }`} />
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <button
                      onClick={handleRestart}
                      className={`w-full py-4 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-black text-sm uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg`}
                    >
                      <RotateCcw className="w-5 h-5" />
                      <span>Play Again</span>
                    </button>
                    <button
                      onClick={onBack}
                      className="w-full py-3 rounded-2xl bg-slate-800/80 border border-slate-700/50 text-slate-200 text-sm font-bold active:scale-95 transition-all"
                    >
                      Exit to Games
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
