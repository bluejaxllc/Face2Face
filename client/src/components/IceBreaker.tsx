import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Heart, Users, Briefcase, Zap, Flame, Trophy, ChevronLeft, RotateCcw, Sparkles, ArrowLeft, ArrowRight, Check } from "lucide-react";

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

const THEMES: Record<Category, {
  gradient: string; accent: string; accentBg: string; cardGrad: string;
  icon: any; label: string; orbColors: string[]; glowFrom: string; glowTo: string;
}> = {
  dating: {
    gradient: "from-pink-500 via-rose-500 to-red-500", accent: "text-pink-400",
    accentBg: "bg-pink-500/15", cardGrad: "from-pink-950/80 via-rose-950/60 to-slate-950/90",
    icon: Heart, label: "Dating",
    orbColors: ["#ec4899", "#f43f5e", "#fb7185", "#e11d48", "#be185d"],
    glowFrom: "#ec4899", glowTo: "#f43f5e",
  },
  friends: {
    gradient: "from-emerald-500 via-green-500 to-teal-500", accent: "text-emerald-400",
    accentBg: "bg-emerald-500/15", cardGrad: "from-emerald-950/80 via-green-950/60 to-slate-950/90",
    icon: Users, label: "Friends",
    orbColors: ["#10b981", "#14b8a6", "#34d399", "#059669", "#0d9488"],
    glowFrom: "#10b981", glowTo: "#14b8a6",
  },
  business: {
    gradient: "from-blue-500 via-indigo-500 to-violet-500", accent: "text-blue-400",
    accentBg: "bg-blue-500/15", cardGrad: "from-blue-950/80 via-indigo-950/60 to-slate-950/90",
    icon: Briefcase, label: "Business",
    orbColors: ["#3b82f6", "#6366f1", "#60a5fa", "#4f46e5", "#818cf8"],
    glowFrom: "#3b82f6", glowTo: "#6366f1",
  },
};

// ─── Floating Orb Sub-Component ──────────────────────────────
function FloatingOrb({ color, size, delay, duration, x1, y1, x2, y2 }: {
  color: string; size: number; delay: number; duration: number;
  x1: string; y1: string; x2: string; y2: string;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size, height: size,
        background: `radial-gradient(circle, ${color}40 0%, ${color}10 50%, transparent 70%)`,
        filter: `blur(${size * 0.3}px)`,
      }}
      initial={{ left: x1, top: y1, opacity: 0 }}
      animate={{
        left: [x1, x2, x1],
        top: [y1, y2, y1],
        opacity: [0.15, 0.45, 0.15],
        scale: [1, 1.3, 1],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

// ─── Dust Mote Particle ──────────────────────────────────────
function DustMote({ delay, category }: { delay: number; category: Category }) {
  const c = category === "dating"
    ? "bg-pink-400/25"
    : category === "friends"
    ? "bg-emerald-400/25"
    : "bg-blue-400/25";
  const xStart = `${Math.random() * 100}%`;
  const yStart = `${Math.random() * 100}%`;

  return (
    <motion.div
      className={`absolute w-1 h-1 rounded-full ${c} pointer-events-none`}
      style={{ left: xStart, top: yStart }}
      animate={{
        y: [0, -30, -10, -40, 0],
        x: [0, 15, -10, 20, 0],
        opacity: [0, 0.6, 0.3, 0.7, 0],
        scale: [0.5, 1, 0.8, 1.2, 0.5],
      }}
      transition={{
        duration: 8 + Math.random() * 6,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

// ─── Match Celebration Particle ──────────────────────────────
function CelebrationParticle({ index }: { index: number }) {
  const angle = (index / 20) * Math.PI * 2;
  const distance = 80 + Math.random() * 60;
  const colors = [
    "#fbbf24", "#f472b6", "#34d399", "#60a5fa",
    "#a78bfa", "#fb923c", "#f87171", "#2dd4bf",
  ];
  const color = colors[index % colors.length];
  const size = 4 + Math.random() * 6;

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size, height: size, backgroundColor: color,
        left: "50%", top: "50%",
        marginLeft: -size / 2, marginTop: -size / 2,
      }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        opacity: 0,
        scale: 0,
      }}
      transition={{ duration: 0.8 + Math.random() * 0.4, ease: "easeOut" }}
    />
  );
}

// ─── SVG Noise Filter ────────────────────────────────────────
function NoiseOverlay() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-[1] opacity-[0.03]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id="ib-noise">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.85"
          numOctaves="4"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#ib-noise)" />
    </svg>
  );
}

// ─── Main Component ──────────────────────────────────────────
interface IceBreakerProps {
  onBack: () => void;
  category?: Category;
}

export default function IceBreaker({ onBack, category = "dating" }: IceBreakerProps) {
  const theme = THEMES[category];
  const questions =
    category === "dating"
      ? DATING_QUESTIONS
      : category === "friends"
      ? FRIENDS_QUESTIONS
      : BUSINESS_QUESTIONS;

  // ── State ──────────────────────────────────────────────────
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
  const [showCelebration, setShowCelebration] = useState(false);
  const [resultPercentA] = useState(() => Math.floor(Math.random() * 30) + 35);

  const currentQuestion = questions[currentIndex];
  const isComplete = currentIndex >= questions.length;

  // ── Persist streak ─────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("f2f_ib_streak", streak.toString());
    localStorage.setItem("f2f_ib_total", totalAnswered.toString());
  }, [streak, totalAnswered]);

  // ── Handle answer ──────────────────────────────────────────
  const handleAnswer = useCallback(
    (choice: "A" | "B") => {
      if (isAnimating || !currentQuestion) return;
      setIsAnimating(true);
      setExitDir(choice === "A" ? "left" : "right");
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: choice }));

      // Generate fake compatibility
      const shuffled = [...NEARBY_USERS].sort(() => Math.random() - 0.5);
      const matchCount = Math.floor(Math.random() * 4) + 2;
      setCompatUsers(shuffled.slice(0, matchCount));

      setTotalAnswered((prev) => prev + 1);
      setStreak((prev) => prev + 1);

      // Show celebration + result
      setTimeout(() => {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 900);
        setShowResult(true);
      }, 300);
    },
    [isAnimating, currentQuestion]
  );

  const advanceToNext = useCallback(() => {
    setShowResult(false);
    setIsAnimating(false);
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const resetGame = () => {
    setCurrentIndex(0);
    setAnswers({});
    setShowResult(false);
    setIsAnimating(false);
  };

  // ── Swipe handling ─────────────────────────────────────────
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacityLeft = useTransform(x, [-200, -50, 0], [1, 0.5, 0]);
  const opacityRight = useTransform(x, [0, 50, 200], [0, 0.5, 1]);
  const cardGlowRight = useTransform(
    x,
    [0, 200],
    ["0 0 0px rgba(34,197,94,0)", "0 0 40px rgba(34,197,94,0.4)"]
  );

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 80) {
      handleAnswer(info.offset.x < 0 ? "A" : "B");
    }
  };

  // ── Memoized ambient config ────────────────────────────────
  const dustMotes = useMemo(
    () => Array.from({ length: 10 }, (_, i) => i),
    []
  );

  const orbConfigs = useMemo(
    () => [
      { size: 140, delay: 0, duration: 18, x1: "5%", y1: "10%", x2: "25%", y2: "30%" },
      { size: 100, delay: 2, duration: 22, x1: "70%", y1: "15%", x2: "55%", y2: "45%" },
      { size: 120, delay: 4, duration: 20, x1: "80%", y1: "60%", x2: "60%", y2: "80%" },
      { size: 90, delay: 1, duration: 25, x1: "15%", y1: "70%", x2: "35%", y2: "50%" },
      { size: 110, delay: 3, duration: 19, x1: "50%", y1: "5%", x2: "40%", y2: "25%" },
    ],
    []
  );

  // Progress percentage
  const progress = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

  // ══════════════════════════════════════════════════════════════
  // ── RENDER ────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950">
      {/* ── SVG Noise Overlay ── */}
      <NoiseOverlay />

      {/* ── Floating Background Orbs ── */}
      {orbConfigs.map((orb, i) => (
        <FloatingOrb
          key={i}
          color={theme.orbColors[i % theme.orbColors.length]}
          {...orb}
        />
      ))}

      {/* ── Ambient Dust Motes ── */}
      {dustMotes.map((i) => (
        <DustMote key={`dust-${i}`} delay={i * 0.7} category={category} />
      ))}

      {/* ── Radial gradient behind card area ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${theme.glowFrom}08 0%, transparent 70%)`,
        }}
      />

      {/* ── Celebration Flash ── */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="absolute inset-0 z-50 pointer-events-none bg-white/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* ── Celebration Particles ── */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
            {Array.from({ length: 20 }, (_, i) => (
              <CelebrationParticle key={`cel-${i}`} index={i} />
            ))}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 0.7 }}
            >
              <Check className="w-16 h-16 text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.8)]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ── Header ─────────────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          {/* Glassmorphic back button */}
          <motion.button
            onClick={onBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-full bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] flex items-center justify-center hover:bg-white/10 transition-colors shadow-[0_2px_12px_rgba(0,0,0,0.3)]"
          >
            <ChevronLeft className="w-5 h-5 text-slate-300" />
          </motion.button>

          {/* Title with gradient text */}
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className={`w-4 h-4 ${theme.accent}`} />
            </motion.div>
            <span
              className={`text-sm font-black uppercase tracking-[0.2em] bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent drop-shadow-sm`}
            >
              Ice Breaker
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 backdrop-blur-sm border border-amber-500/20 text-amber-400 text-[8px] uppercase tracking-wider font-bold">
              BETA
            </span>
          </div>

          {/* Streak badge with pulse glow */}
          <motion.div
            className="flex items-center gap-1 bg-white/[0.06] backdrop-blur-xl border border-amber-500/20 rounded-full px-2.5 py-1 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
            whileHover={{ scale: 1.05 }}
            animate={
              streak > 3
                ? {
                    boxShadow: [
                      "0 0 8px rgba(245,158,11,0.1)",
                      "0 0 16px rgba(245,158,11,0.3)",
                      "0 0 8px rgba(245,158,11,0.1)",
                    ],
                  }
                : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <motion.span
              key={streak}
              className="text-xs font-black text-amber-400"
              initial={{ scale: 1.4, y: -4 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              {streak}
            </motion.span>
          </motion.div>
        </div>

        {/* ── Glassmorphic Progress Bar ── */}
        <div className="mt-3 relative">
          <div className="h-1.5 rounded-full bg-white/[0.05] backdrop-blur-sm border border-white/[0.05] overflow-hidden">
            <motion.div
              className="h-full rounded-full relative"
              style={{
                backgroundImage: `linear-gradient(to right, ${theme.glowFrom}, ${theme.glowTo})`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              {/* Shimmer sweep */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
                style={{
                  animation: "shimmer 2s infinite",
                  backgroundSize: "200% 100%",
                }}
              />
            </motion.div>
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] text-slate-500 font-bold tracking-wider">
              {currentIndex}/{questions.length}
            </span>
            <span className={`text-[9px] font-bold tracking-wider ${theme.accent}`}>
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ── Card Stack Area ────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div
        className="absolute inset-0 flex items-center justify-center px-6"
        style={{ paddingTop: 100, paddingBottom: 100 }}
      >
        {/* Ghost cards behind (stack depth effect) */}
        {!isComplete && currentQuestion && !showResult && (
          <>
            {currentIndex + 2 < questions.length && (
              <div
                className="absolute w-full max-w-sm px-6"
                style={{ paddingTop: 100 }}
              >
                <div
                  className={`rounded-2xl border border-white/[0.04] bg-gradient-to-br ${theme.cardGrad} opacity-[0.15] scale-[0.88] translate-y-4 h-72`}
                />
              </div>
            )}
            {currentIndex + 1 < questions.length && (
              <div
                className="absolute w-full max-w-sm px-6"
                style={{ paddingTop: 100 }}
              >
                <div
                  className={`rounded-2xl border border-white/[0.06] bg-gradient-to-br ${theme.cardGrad} opacity-[0.3] scale-[0.94] translate-y-2 h-72`}
                />
              </div>
            )}
          </>
        )}

        {/* ── Active Swipeable Card ── */}
        <AnimatePresence mode="popLayout">
          {!isComplete && currentQuestion && !showResult && (
            <motion.div
              key={currentQuestion.id}
              className="w-full max-w-sm relative z-10"
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
                transition: { duration: 0.35 },
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Swipe direction indicators */}
              <motion.div
                className="absolute -left-3 top-1/2 -translate-y-1/2 bg-red-500/20 backdrop-blur-xl border border-red-500/30 rounded-2xl px-3 py-6 z-10 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                style={{ opacity: opacityLeft }}
              >
                <ArrowLeft className="w-5 h-5 text-red-400" />
              </motion.div>
              <motion.div
                className="absolute -right-3 top-1/2 -translate-y-1/2 bg-emerald-500/20 backdrop-blur-xl border border-emerald-500/30 rounded-2xl px-3 py-6 z-10 shadow-[0_0_20px_rgba(52,211,153,0.2)]"
                style={{ opacity: opacityRight }}
              >
                <ArrowRight className="w-5 h-5 text-emerald-400" />
              </motion.div>

              {/* ── Glassmorphic Card ── */}
              <motion.div
                className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
                style={{ boxShadow: cardGlowRight }}
              >
                {/* Top decorative glow */}
                <div
                  className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-[80px] opacity-15 bg-gradient-to-r ${theme.gradient}`}
                />
                {/* Subtle inner gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

                <div className="relative z-10 p-6 pt-8">
                  {/* Emoji with gentle float */}
                  <motion.div
                    className="text-center mb-6"
                    animate={{ y: [0, -4, 0] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <span
                      className="text-6xl drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                      role="img"
                    >
                      {currentQuestion.emoji}
                    </span>
                  </motion.div>

                  {/* Question text */}
                  <h2 className="text-xl font-bold text-center leading-snug mb-8 px-2 text-white/90">
                    {currentQuestion.text}
                  </h2>

                  {/* Option buttons */}
                  <div className="space-y-3">
                    <motion.button
                      onClick={() => handleAnswer("A")}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full group relative overflow-hidden rounded-2xl border border-pink-500/20 bg-white/[0.04] backdrop-blur-md hover:bg-pink-500/10 transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/5 to-pink-500/0 group-hover:via-pink-500/10 transition-all" />
                      <div className="relative px-5 py-4 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-pink-500/15 backdrop-blur-sm border border-pink-500/25 flex items-center justify-center text-pink-400 text-sm font-black shrink-0">
                          A
                        </span>
                        <span className="text-sm font-semibold text-slate-200 text-left">
                          {currentQuestion.optionA}
                        </span>
                      </div>
                    </motion.button>

                    <div className="flex items-center gap-3 px-4">
                      <div className="flex-1 h-px bg-white/[0.06]" />
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        or
                      </span>
                      <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>

                    <motion.button
                      onClick={() => handleAnswer("B")}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full group relative overflow-hidden rounded-2xl border border-blue-500/20 bg-white/[0.04] backdrop-blur-md hover:bg-blue-500/10 transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 group-hover:via-blue-500/10 transition-all" />
                      <div className="relative px-5 py-4 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-blue-500/15 backdrop-blur-sm border border-blue-500/25 flex items-center justify-center text-blue-400 text-sm font-black shrink-0">
                          B
                        </span>
                        <span className="text-sm font-semibold text-slate-200 text-left">
                          {currentQuestion.optionB}
                        </span>
                      </div>
                    </motion.button>
                  </div>

                  {/* Swipe hint */}
                  <p className="text-center text-[10px] text-slate-500/60 mt-5 font-medium tracking-wide uppercase">
                    swipe left for A · swipe right for B · or tap
                  </p>
                </div>
              </motion.div>

              {/* Card counter */}
              <div className="text-center mt-4">
                <span
                  className={`text-xs font-bold tracking-widest bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}
                >
                  {currentIndex + 1} / {questions.length}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── Result Overlay ───────────────────────────────────── */}
        {/* ══════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showResult && currentQuestion && (
            <motion.div
              className="w-full max-w-sm"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0, y: -50 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {/* Glassmorphic result card with conic border */}
              <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.4)] p-6">
                {/* Rotating conic gradient border accent */}
                <div
                  className="absolute -inset-[1px] rounded-2xl opacity-20 pointer-events-none"
                  style={{
                    background: `conic-gradient(from 0deg, ${theme.glowFrom}, ${theme.glowTo}, transparent, ${theme.glowFrom})`,
                  }}
                />

                {/* Your answer */}
                <div className="text-center mb-5 relative z-10">
                  <motion.span
                    className="text-3xl mb-2 block"
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                  >
                    {currentQuestion.emoji}
                  </motion.span>
                  <p className="text-xs text-slate-500 uppercase tracking-[0.2em] font-bold mb-1">
                    You chose
                  </p>
                  <motion.p
                    className={`text-lg font-bold ${
                      answers[currentQuestion.id] === "A"
                        ? "text-pink-400"
                        : "text-blue-400"
                    }`}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {answers[currentQuestion.id] === "A"
                      ? currentQuestion.optionA
                      : currentQuestion.optionB}
                  </motion.p>
                </div>

                {/* Compatibility */}
                <div className="border-t border-white/[0.06] pt-4 relative z-10">
                  <motion.p
                    className={`text-xs uppercase tracking-[0.15em] font-bold mb-3 text-center bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    ✨ {compatUsers.length} nearby matched your answer
                  </motion.p>
                  <div className="flex flex-wrap justify-center gap-3 mb-4">
                    {compatUsers.map((user, i) => (
                      <motion.div
                        key={user.name}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          delay: 0.3 + i * 0.1,
                          type: "spring",
                          stiffness: 400,
                        }}
                        className="flex flex-col items-center gap-1 group cursor-pointer"
                      >
                        <motion.div
                          whileHover={{ scale: 1.15 }}
                          className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all shadow-lg ${
                            category === "dating"
                              ? "border-pink-500/40 shadow-pink-500/10"
                              : category === "friends"
                              ? "border-emerald-500/40 shadow-emerald-500/10"
                              : "border-blue-500/40 shadow-blue-500/10"
                          }`}
                        >
                          <img
                            src={user.photo}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                        <span className="text-[10px] font-bold text-slate-300">
                          {user.name}
                        </span>
                        <span className="text-[9px] text-slate-500">
                          {user.age}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Percentage bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-pink-400">A — {resultPercentA}%</span>
                      <span className="text-blue-400">
                        B — {100 - resultPercentA}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.04] backdrop-blur-sm border border-white/[0.05] overflow-hidden flex">
                      <motion.div
                        className="h-full bg-gradient-to-r from-pink-500 to-pink-600 rounded-l-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${resultPercentA}%` }}
                        transition={{
                          duration: 0.8,
                          delay: 0.4,
                          ease: "easeOut",
                        }}
                      />
                      <div className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-r-full flex-1" />
                    </div>
                  </div>

                  {/* Shimmer action button */}
                  <motion.button
                    onClick={advanceToNext}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full py-3.5 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white text-sm font-black uppercase tracking-[0.15em] shadow-lg relative overflow-hidden`}
                    style={{ boxShadow: `0 4px 20px ${theme.glowFrom}30` }}
                  >
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                      style={{
                        animation: "shimmer 2.5s infinite",
                        backgroundSize: "200% 100%",
                      }}
                    />
                    <span className="relative z-10">
                      {currentIndex + 1 < questions.length
                        ? "Next Question"
                        : "See Results"}
                    </span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── Game Complete ─────────────────────────────────────── */}
        {/* ══════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              className="w-full max-w-sm text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.4)] p-8">
                {/* Rotating conic gradient border (victory rays) */}
                <motion.div
                  className="absolute -inset-[1px] rounded-2xl opacity-20 pointer-events-none"
                  style={{
                    background: `conic-gradient(from 0deg, ${theme.glowFrom}, ${theme.glowTo}, transparent, ${theme.glowFrom})`,
                  }}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />

                {/* Inner glow */}
                <div
                  className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[100px] opacity-10 bg-gradient-to-r ${theme.gradient}`}
                />

                <div className="relative z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: 0.2,
                      type: "spring",
                      stiffness: 300,
                    }}
                  >
                    <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4 drop-shadow-[0_0_24px_rgba(245,158,11,0.5)]" />
                  </motion.div>

                  <motion.h2
                    className={`text-2xl font-black mb-2 bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Round Complete!
                  </motion.h2>
                  <p className="text-sm text-slate-500 mb-6">
                    You answered all {questions.length} questions
                  </p>

                  {/* Stat cards */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      {
                        val: questions.length,
                        label: "Answered",
                        color: "text-amber-400",
                      },
                      {
                        val: Object.keys(answers).length,
                        label: "Matches",
                        color: "text-emerald-400",
                      },
                      {
                        val: streak,
                        label: "Streak",
                        color: "text-pink-400",
                      },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl p-3"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                      >
                        <motion.p
                          className={`text-2xl font-black ${stat.color}`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: 0.6 + i * 0.1,
                            type: "spring",
                            stiffness: 400,
                          }}
                        >
                          {stat.val}
                        </motion.p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-[0.15em] font-bold mt-1">
                          {stat.label}
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-3">
                    <motion.button
                      onClick={resetGame}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-full py-3.5 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white text-sm font-black uppercase tracking-[0.15em] shadow-lg flex items-center justify-center gap-2 relative overflow-hidden`}
                      style={{
                        boxShadow: `0 4px 20px ${theme.glowFrom}30`,
                      }}
                    >
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                        style={{
                          animation: "shimmer 2.5s infinite",
                          backgroundSize: "200% 100%",
                        }}
                      />
                      <RotateCcw className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">Play Again</span>
                    </motion.button>
                    <motion.button
                      onClick={onBack}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full py-3 rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] text-slate-400 text-sm font-bold transition-all hover:bg-white/[0.08]"
                    >
                      Back to Games
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ── Bottom Stats Bar ───────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════ */}
      {!isComplete && (
        <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-4 pt-8 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent">
          <div className="flex items-center justify-between max-w-sm mx-auto">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/[0.06] backdrop-blur-sm border border-white/[0.06] flex items-center justify-center">
                <Zap className={`w-4 h-4 ${theme.accent}`} />
              </div>
              <div>
                <p className="text-[10px] text-slate-600 uppercase tracking-[0.15em] font-bold">
                  Total
                </p>
                <motion.p
                  key={totalAnswered}
                  className="text-sm font-black text-white"
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {totalAnswered}
                </motion.p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-full px-3 py-1.5">
              <span className="text-[9px] text-slate-500 uppercase tracking-[0.12em] font-bold">
                {category === "dating"
                  ? "💕 Dating Mode"
                  : category === "friends"
                  ? "👋 Friends Mode"
                  : "💼 Business Mode"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div>
                <p className="text-[10px] text-slate-600 uppercase tracking-[0.15em] font-bold text-right">
                  Streak
                </p>
                <motion.p
                  key={`s-${streak}`}
                  className="text-sm font-black text-amber-400 text-right"
                  initial={{ scale: 1.3, y: -2 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {streak} 🔥
                </motion.p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Shimmer Keyframes ── */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
