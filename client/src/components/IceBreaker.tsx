import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Heart, Users, Briefcase, Zap, Flame, Trophy, ChevronLeft, RotateCcw, Sparkles, ArrowLeft, ArrowRight } from "lucide-react";

// ─── Question Banks ───────────────────────────────────────────
interface Question {
  id: number;
  text: string;
  optionA: string;
  optionB: string;
  emoji: string;
}

const DATING_QUESTIONS: Question[] = [
  { id: 1, text: "On a first date, would you rather...", optionA: "Cook dinner together at home", optionB: "Try a new rooftop restaurant", emoji: "🍷" },
  { id: 2, text: "Would you rather your partner...", optionA: "Send you a good morning text every day", optionB: "Surprise you with a random date night", emoji: "💕" },
  { id: 3, text: "On a weekend, would you rather...", optionA: "Stay in and binge a show together", optionB: "Go on a spontaneous road trip", emoji: "🚗" },
  { id: 4, text: "Which matters more to you?", optionA: "Physical chemistry", optionB: "Emotional connection", emoji: "🔥" },
  { id: 5, text: "Would you rather date someone who...", optionA: "Makes you laugh non-stop", optionB: "Gives the best deep conversations", emoji: "😂" },
  { id: 6, text: "For an anniversary, would you rather...", optionA: "Get a heartfelt handwritten letter", optionB: "Get a surprise vacation trip", emoji: "✈️" },
  { id: 7, text: "Would you rather your partner...", optionA: "Be your best friend first", optionB: "Be mysterious and exciting", emoji: "🎭" },
  { id: 8, text: "When it comes to PDA...", optionA: "Hold hands everywhere we go", optionB: "Keep affection private", emoji: "🤝" },
  { id: 9, text: "Would you rather go on a date at...", optionA: "A live music concert", optionB: "A quiet art gallery", emoji: "🎵" },
  { id: 10, text: "Love language — which speaks louder?", optionA: "Words of affirmation", optionB: "Acts of service", emoji: "💬" },
  { id: 11, text: "Would you rather your partner...", optionA: "Be extremely ambitious", optionB: "Be extremely laid back", emoji: "🏆" },
  { id: 12, text: "Would you rather...", optionA: "Meet their family early on", optionB: "Keep things between you two for a while", emoji: "👨‍👩‍👦" },
];

const FRIENDS_QUESTIONS: Question[] = [
  { id: 101, text: "Friday night — would you rather...", optionA: "Game night at someone's place", optionB: "Bar crawl downtown", emoji: "🎮" },
  { id: 102, text: "Would you rather your friend group...", optionA: "Is a tight crew of 4-5 people", optionB: "Is a massive squad of 15+ people", emoji: "👥" },
  { id: 103, text: "Which friend are you?", optionA: "The one who plans everything", optionB: "The one who just shows up", emoji: "📋" },
  { id: 104, text: "Would you rather hang out at...", optionA: "A coffee shop for hours", optionB: "A hiking trail in the mountains", emoji: "☕" },
  { id: 105, text: "Best way to bond with someone new?", optionA: "Share a meal together", optionB: "Do an activity together", emoji: "🍕" },
  { id: 106, text: "Would you rather...", optionA: "Have a friend who's brutally honest", optionB: "Have a friend who's always supportive", emoji: "🤞" },
  { id: 107, text: "Group chat vibes — would you rather...", optionA: "Memes and chaos 24/7", optionB: "Meaningful check-ins once a day", emoji: "📱" },
  { id: 108, text: "Would you rather try...", optionA: "A cooking class with friends", optionB: "An escape room challenge", emoji: "🧩" },
  { id: 109, text: "Weekend plans — would you rather...", optionA: "Beach day with the crew", optionB: "Road trip to a new city", emoji: "🏖️" },
  { id: 110, text: "Would you rather your bestie...", optionA: "Lives in the same neighborhood", optionB: "Lives far but visits often", emoji: "🏠" },
];

const BUSINESS_QUESTIONS: Question[] = [
  { id: 201, text: "In business, would you rather...", optionA: "Be the visionary CEO", optionB: "Be the operational COO", emoji: "💼" },
  { id: 202, text: "Networking style — would you rather...", optionA: "Work the room at big events", optionB: "Build deep 1-on-1 connections", emoji: "🤝" },
  { id: 203, text: "Would you rather your startup...", optionA: "Grow fast and raise funding", optionB: "Grow slow and stay bootstrapped", emoji: "🚀" },
  { id: 204, text: "Work environment — would you rather...", optionA: "Hustle in a co-working space", optionB: "Focus from a home office", emoji: "🏢" },
  { id: 205, text: "Would you rather...", optionA: "Have a massive following with low revenue", optionB: "Have a small audience with high revenue", emoji: "📊" },
  { id: 206, text: "Team building — would you rather...", optionA: "Hire experienced industry veterans", optionB: "Train passionate newcomers", emoji: "🧑‍💻" },
  { id: 207, text: "Would you rather pitch to...", optionA: "A room of 500 investors", optionB: "One billionaire over dinner", emoji: "🎤" },
  { id: 208, text: "Business philosophy...", optionA: "Move fast and break things", optionB: "Measure twice, cut once", emoji: "⚡" },
  { id: 209, text: "Would you rather your company be known for...", optionA: "Innovation and disruption", optionB: "Reliability and trust", emoji: "🏅" },
  { id: 210, text: "Deal breaker in a business partner?", optionA: "Lack of communication", optionB: "Lack of work ethic", emoji: "🚩" },
];

// ─── Fake Nearby Users ───────────────────────────────────────
const NEARBY_USERS = [
  { name: "Shay", age: 27, photo: "https://picsum.photos/seed/ib1/80/80" },
  { name: "Aly", age: 30, photo: "https://picsum.photos/seed/ib2/80/80" },
  { name: "Kyniah", age: 29, photo: "https://picsum.photos/seed/ib3/80/80" },
  { name: "Kia", age: 22, photo: "https://picsum.photos/seed/ib4/80/80" },
  { name: "Aaliyah", age: 24, photo: "https://picsum.photos/seed/ib5/80/80" },
  { name: "Kaylin", age: 29, photo: "https://picsum.photos/seed/ib6/80/80" },
  { name: "Marcus", age: 31, photo: "https://picsum.photos/seed/ib7/80/80" },
  { name: "Deon", age: 26, photo: "https://picsum.photos/seed/ib8/80/80" },
];

// ─── Theme Config ─────────────────────────────────────────────
type Category = "dating" | "friends" | "business";

const THEMES: Record<Category, { gradient: string; accent: string; accentBg: string; cardGrad: string; icon: any; label: string }> = {
  dating: { gradient: "from-pink-500 via-rose-500 to-red-500", accent: "text-pink-400", accentBg: "bg-pink-500/15", cardGrad: "from-pink-950/80 via-rose-950/60 to-slate-950/90", icon: Heart, label: "Dating" },
  friends: { gradient: "from-emerald-500 via-green-500 to-teal-500", accent: "text-emerald-400", accentBg: "bg-emerald-500/15", cardGrad: "from-emerald-950/80 via-green-950/60 to-slate-950/90", icon: Users, label: "Friends" },
  business: { gradient: "from-blue-500 via-indigo-500 to-violet-500", accent: "text-blue-400", accentBg: "bg-blue-500/15", cardGrad: "from-blue-950/80 via-indigo-950/60 to-slate-950/90", icon: Briefcase, label: "Business" },
};

// ─── Main Component ──────────────────────────────────────────
interface IceBreakerProps {
  onBack: () => void;
  category?: Category;
}

export default function IceBreaker({ onBack, category = "dating" }: IceBreakerProps) {
  const theme = THEMES[category];
  const questions = category === "dating" ? DATING_QUESTIONS : category === "friends" ? FRIENDS_QUESTIONS : BUSINESS_QUESTIONS;

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, "A" | "B">>({});
  const [showResult, setShowResult] = useState(false);
  const [compatUsers, setCompatUsers] = useState<typeof NEARBY_USERS>([]);
  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem("f2f_ib_streak");
    return saved ? parseInt(saved) : 0;
  });
  const [totalAnswered, setTotalAnswered] = useState(() => {
    const saved = localStorage.getItem("f2f_ib_total");
    return saved ? parseInt(saved) : 0;
  });
  const [exitDir, setExitDir] = useState<"left" | "right">("left");
  const [isAnimating, setIsAnimating] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isComplete = currentIndex >= questions.length;

  // Persist streak
  useEffect(() => {
    localStorage.setItem("f2f_ib_streak", streak.toString());
    localStorage.setItem("f2f_ib_total", totalAnswered.toString());
  }, [streak, totalAnswered]);

  // Handle answer
  const handleAnswer = useCallback((choice: "A" | "B") => {
    if (isAnimating || !currentQuestion) return;
    setIsAnimating(true);
    setExitDir(choice === "A" ? "left" : "right");
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: choice }));
    
    // Generate fake compatibility
    const shuffled = [...NEARBY_USERS].sort(() => Math.random() - 0.5);
    const matchCount = Math.floor(Math.random() * 4) + 2;
    setCompatUsers(shuffled.slice(0, matchCount));
    
    setTotalAnswered(prev => prev + 1);
    setStreak(prev => prev + 1);

    // Show result briefly, then advance
    setTimeout(() => {
      setShowResult(true);
    }, 300);
  }, [isAnimating, currentQuestion]);

  const advanceToNext = useCallback(() => {
    setShowResult(false);
    setIsAnimating(false);
    setCurrentIndex(prev => prev + 1);
  }, []);

  const resetGame = () => {
    setCurrentIndex(0);
    setAnswers({});
    setShowResult(false);
    setIsAnimating(false);
  };

  // Swipe handling
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacityLeft = useTransform(x, [-200, -50, 0], [1, 0.5, 0]);
  const opacityRight = useTransform(x, [0, 50, 200], [0, 0.5, 1]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 80) {
      handleAnswer(info.offset.x < 0 ? "A" : "B");
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950">
      {/* ── Header ── */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-slate-800/80 backdrop-blur-md border border-slate-700/50 flex items-center justify-center hover:bg-slate-700/80 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className={`w-4 h-4 ${theme.accent}`} />
            <span className={`text-sm font-black uppercase tracking-widest bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
              Ice Breaker
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[8px] uppercase tracking-wider font-bold">BETA</span>
          </div>
          <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 rounded-full px-2.5 py-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-black text-amber-400">{streak}</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-all duration-500"
              style={{
                background: i < currentIndex ? `linear-gradient(to right, var(--tw-gradient-stops))` : i === currentIndex ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
                ...(i < currentIndex ? { backgroundImage: `linear-gradient(to right, ${category === 'dating' ? '#ec4899, #f43f5e' : category === 'friends' ? '#10b981, #14b8a6' : '#3b82f6, #6366f1'})` } : {}),
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Card Stack ── */}
      <div className="absolute inset-0 flex items-center justify-center px-6" style={{ paddingTop: 90, paddingBottom: 100 }}>
        <AnimatePresence mode="popLayout">
          {!isComplete && currentQuestion && !showResult && (
            <motion.div
              key={currentQuestion.id}
              className="w-full max-w-sm relative"
              style={{ x, rotate }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={handleDragEnd}
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{
                x: exitDir === "left" ? -300 : 300,
                rotate: exitDir === "left" ? -20 : 20,
                opacity: 0,
                transition: { duration: 0.35 }
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Swipe indicators */}
              <motion.div
                className="absolute -left-3 top-1/2 -translate-y-1/2 bg-pink-500/30 backdrop-blur-md border border-pink-500/50 rounded-2xl px-3 py-6 z-10"
                style={{ opacity: opacityLeft }}
              >
                <ArrowLeft className="w-5 h-5 text-pink-400" />
              </motion.div>
              <motion.div
                className="absolute -right-3 top-1/2 -translate-y-1/2 bg-blue-500/30 backdrop-blur-md border border-blue-500/50 rounded-2xl px-3 py-6 z-10"
                style={{ opacity: opacityRight }}
              >
                <ArrowRight className="w-5 h-5 text-blue-400" />
              </motion.div>

              {/* Card */}
              <div className={`relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-br ${theme.cardGrad}`}>
                {/* Decorative glow */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-[80px] opacity-20 bg-gradient-to-r ${theme.gradient}`} />

                <div className="relative z-10 p-6 pt-8">
                  {/* Emoji */}
                  <div className="text-center mb-6">
                    <span className="text-6xl drop-shadow-lg" role="img">{currentQuestion.emoji}</span>
                  </div>

                  {/* Question */}
                  <h2 className="text-xl font-bold text-white text-center leading-snug mb-8 px-2">
                    {currentQuestion.text}
                  </h2>

                  {/* Options */}
                  <div className="space-y-3">
                    <button
                      onClick={() => handleAnswer("A")}
                      className="w-full group relative overflow-hidden rounded-2xl border border-pink-500/30 bg-pink-500/10 hover:bg-pink-500/20 transition-all duration-300 active:scale-95"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/5 to-pink-500/0 group-hover:via-pink-500/10 transition-all" />
                      <div className="relative px-5 py-4 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 text-sm font-black shrink-0">A</span>
                        <span className="text-sm font-semibold text-slate-200 text-left">{currentQuestion.optionA}</span>
                      </div>
                    </button>

                    <div className="flex items-center gap-3 px-4">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">or</span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>

                    <button
                      onClick={() => handleAnswer("B")}
                      className="w-full group relative overflow-hidden rounded-2xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-all duration-300 active:scale-95"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 group-hover:via-blue-500/10 transition-all" />
                      <div className="relative px-5 py-4 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-sm font-black shrink-0">B</span>
                        <span className="text-sm font-semibold text-slate-200 text-left">{currentQuestion.optionB}</span>
                      </div>
                    </button>
                  </div>

                  {/* Swipe hint */}
                  <p className="text-center text-[10px] text-slate-500 mt-5 font-medium tracking-wide uppercase">
                    swipe left for A · swipe right for B · or tap
                  </p>
                </div>
              </div>

              {/* Card counter */}
              <div className="text-center mt-4">
                <span className="text-xs text-slate-500 font-bold">
                  {currentIndex + 1} / {questions.length}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Result Overlay ── */}
        <AnimatePresence>
          {showResult && currentQuestion && (
            <motion.div
              className="w-full max-w-sm"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0, y: -50 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className={`rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-br ${theme.cardGrad} p-6`}>
                {/* Your answer */}
                <div className="text-center mb-5">
                  <span className="text-3xl mb-2 block">{currentQuestion.emoji}</span>
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">You chose</p>
                  <p className={`text-lg font-bold ${answers[currentQuestion.id] === "A" ? "text-pink-400" : "text-blue-400"}`}>
                    {answers[currentQuestion.id] === "A" ? currentQuestion.optionA : currentQuestion.optionB}
                  </p>
                </div>

                {/* Compatibility */}
                <div className="border-t border-white/10 pt-4">
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-3 text-center">
                    {compatUsers.length} nearby matched your answer
                  </p>
                  <div className="flex flex-wrap justify-center gap-3 mb-4">
                    {compatUsers.map((user, i) => (
                      <motion.div
                        key={user.name}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex flex-col items-center gap-1 group cursor-pointer"
                      >
                        <div className={`w-12 h-12 rounded-full overflow-hidden border-2 group-hover:scale-110 transition-transform ${
                          category === 'dating' ? 'border-pink-500/50' : category === 'friends' ? 'border-emerald-500/50' : 'border-blue-500/50'
                        }`}>
                          <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-300">{user.name}</span>
                        <span className="text-[9px] text-slate-500">{user.age}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Percentage bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-pink-400">A — {Math.floor(Math.random() * 30) + 35}%</span>
                      <span className="text-blue-400">B — {Math.floor(Math.random() * 30) + 35}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden flex">
                      <div className="h-full bg-gradient-to-r from-pink-500 to-pink-600 rounded-l-full" style={{ width: `${Math.floor(Math.random() * 30) + 35}%` }} />
                      <div className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-r-full flex-1" />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={advanceToNext}
                      className={`flex-1 py-3 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white text-sm font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg`}
                    >
                      {currentIndex + 1 < questions.length ? "Next Question" : "See Results"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Game Complete ── */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              className="w-full max-w-sm text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <div className={`rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-br ${theme.cardGrad} p-8`}>
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[100px] opacity-15 bg-gradient-to-r ${theme.gradient}`} />
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                >
                  <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4 drop-shadow-lg" />
                </motion.div>

                <h2 className="text-2xl font-black text-white mb-2">Round Complete!</h2>
                <p className="text-sm text-slate-400 mb-6">You answered all {questions.length} questions</p>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <p className="text-2xl font-black text-amber-400">{questions.length}</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-1">Answered</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <p className="text-2xl font-black text-emerald-400">{Object.keys(answers).length}</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-1">Matches</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <p className="text-2xl font-black text-pink-400">{streak}</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-1">Streak</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={resetGame}
                    className={`w-full py-3.5 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white text-sm font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Play Again
                  </button>
                  <button
                    onClick={onBack}
                    className="w-full py-3 rounded-2xl bg-slate-800/80 border border-slate-700/50 text-slate-300 text-sm font-bold transition-all active:scale-95 hover:bg-slate-700/80"
                  >
                    Back to Games
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom Stats Bar ── */}
      {!isComplete && (
        <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-4 pt-8 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent">
          <div className="flex items-center justify-between max-w-sm mx-auto">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full ${theme.accentBg} flex items-center justify-center`}>
                <Zap className={`w-4 h-4 ${theme.accent}`} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total</p>
                <p className="text-sm font-black text-white">{totalAnswered}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/40 rounded-full px-3 py-1.5">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">
                {category === "dating" ? "💕 Dating Mode" : category === "friends" ? "👋 Friends Mode" : "💼 Business Mode"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold text-right">Streak</p>
                <p className="text-sm font-black text-amber-400 text-right">{streak} 🔥</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
