import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Sparkles,
  Dice5,
  Heart,
  Users,
  Briefcase,
  MessageSquare,
  RotateCcw,
  Star,
  Zap,
  UserPlus,
  Coffee,
  MapPin,
  Clock,
  Shield,
  ArrowRight,
} from "lucide-react";

type Category = "dating" | "friends" | "business";

interface RandomMatchProps {
  onBack: () => void;
  category?: Category;
}

interface MatchProfile {
  name: string;
  age: number;
  photo: string;
  bio: string;
  distance: string;
  interests: string[];
  compatibility: number; // 0-100
  emoji: string;
}

const PROFILES: Record<Category, MatchProfile[]> = {
  dating: [
    { name: "Aly", age: 30, photo: "https://picsum.photos/seed/rm_d1/200/200", bio: "Coffee addict & sunset chaser", distance: "0.3 mi", interests: ["Photography", "Travel", "Cooking"], compatibility: 87, emoji: "📸" },
    { name: "Jade", age: 26, photo: "https://picsum.photos/seed/rm_d2/200/200", bio: "Let's grab tacos & talk about life", distance: "0.5 mi", interests: ["Music", "Art", "Dogs"], compatibility: 92, emoji: "🎨" },
    { name: "Marcus", age: 31, photo: "https://picsum.photos/seed/rm_d3/200/200", bio: "Spontaneous explorer, love hiking", distance: "0.7 mi", interests: ["Hiking", "Guitar", "Gaming"], compatibility: 78, emoji: "🏔️" },
    { name: "Shay", age: 27, photo: "https://picsum.photos/seed/rm_d4/200/200", bio: "Dance floor enthusiast 💃", distance: "0.4 mi", interests: ["Dancing", "Yoga", "Film"], compatibility: 83, emoji: "💃" },
    { name: "Luna", age: 25, photo: "https://picsum.photos/seed/rm_d5/200/200", bio: "Star gazer & book collector", distance: "0.6 mi", interests: ["Astronomy", "Reading", "Tea"], compatibility: 95, emoji: "🌙" },
    { name: "Rio", age: 29, photo: "https://picsum.photos/seed/rm_d6/200/200", bio: "Chef by passion, nerd by nature", distance: "0.2 mi", interests: ["Cooking", "Anime", "Tech"], compatibility: 89, emoji: "👨‍🍳" },
    { name: "Sky", age: 28, photo: "https://picsum.photos/seed/rm_d7/200/200", bio: "Live music & late night drives", distance: "0.8 mi", interests: ["Concerts", "Driving", "Vinyl"], compatibility: 76, emoji: "🎵" },
    { name: "Kai", age: 24, photo: "https://picsum.photos/seed/rm_d8/200/200", bio: "Adventure seeker, thrill lover", distance: "0.9 mi", interests: ["Skydiving", "Rock Climbing", "Surfing"], compatibility: 81, emoji: "🏄" },
  ],
  friends: [
    { name: "Sarah", age: 24, photo: "https://picsum.photos/seed/rm_f1/200/200", bio: "Board game night every Friday!", distance: "0.3 mi", interests: ["Board Games", "Movies", "Pizza"], compatibility: 91, emoji: "🎲" },
    { name: "Kevin", age: 29, photo: "https://picsum.photos/seed/rm_f2/200/200", bio: "Running buddy needed 🏃", distance: "0.4 mi", interests: ["Running", "Fitness", "Coffee"], compatibility: 85, emoji: "🏃" },
    { name: "Jess", age: 26, photo: "https://picsum.photos/seed/rm_f3/200/200", bio: "Plant mom & podcast junkie", distance: "0.6 mi", interests: ["Plants", "Podcasts", "Brunch"], compatibility: 88, emoji: "🌿" },
    { name: "Tyler", age: 28, photo: "https://picsum.photos/seed/rm_f4/200/200", bio: "Basketball courts on weekends", distance: "0.5 mi", interests: ["Basketball", "Movies", "BBQ"], compatibility: 79, emoji: "🏀" },
    { name: "Mia", age: 23, photo: "https://picsum.photos/seed/rm_f5/200/200", bio: "Karaoke queen & taco lover", distance: "0.7 mi", interests: ["Karaoke", "Tacos", "Dancing"], compatibility: 94, emoji: "🎤" },
    { name: "Alex", age: 27, photo: "https://picsum.photos/seed/rm_f6/200/200", bio: "Dog park regular, golden retriever dad", distance: "0.2 mi", interests: ["Dogs", "Hiking", "Photography"], compatibility: 86, emoji: "🐕" },
    { name: "Priya", age: 25, photo: "https://picsum.photos/seed/rm_f7/200/200", bio: "Bookworm & amateur baker", distance: "0.8 mi", interests: ["Reading", "Baking", "Museums"], compatibility: 82, emoji: "📚" },
    { name: "Noah", age: 30, photo: "https://picsum.photos/seed/rm_f8/200/200", bio: "Escape room fanatic & trivia champ", distance: "0.9 mi", interests: ["Escape Rooms", "Trivia", "Board Games"], compatibility: 90, emoji: "🧩" },
  ],
  business: [
    { name: "David", age: 34, photo: "https://picsum.photos/seed/rm_b1/200/200", bio: "AI Startup Founder, Series A", distance: "0.3 mi", interests: ["AI/ML", "Startups", "Investing"], compatibility: 93, emoji: "🚀" },
    { name: "Elena", age: 31, photo: "https://picsum.photos/seed/rm_b2/200/200", bio: "B2B SaaS Growth Consultant", distance: "0.5 mi", interests: ["SaaS", "Growth", "Marketing"], compatibility: 88, emoji: "📈" },
    { name: "Aaron", age: 36, photo: "https://picsum.photos/seed/rm_b3/200/200", bio: "VC Partner at TechFund", distance: "0.4 mi", interests: ["Venture Capital", "Fintech", "Blockchain"], compatibility: 85, emoji: "💰" },
    { name: "Nina", age: 29, photo: "https://picsum.photos/seed/rm_b4/200/200", bio: "Product Designer at BigCo", distance: "0.6 mi", interests: ["UX Design", "Figma", "Web3"], compatibility: 81, emoji: "🎨" },
    { name: "Ryan", age: 33, photo: "https://picsum.photos/seed/rm_b5/200/200", bio: "DevRel & Open Source Advocate", distance: "0.7 mi", interests: ["Open Source", "DevRel", "Rust"], compatibility: 90, emoji: "💻" },
    { name: "Ava", age: 28, photo: "https://picsum.photos/seed/rm_b6/200/200", bio: "Climate Tech Entrepreneur", distance: "0.2 mi", interests: ["CleanTech", "Sustainability", "Impact"], compatibility: 87, emoji: "🌍" },
    { name: "James", age: 35, photo: "https://picsum.photos/seed/rm_b7/200/200", bio: "CTO building developer tools", distance: "0.8 mi", interests: ["Infrastructure", "APIs", "Cloud"], compatibility: 82, emoji: "⚙️" },
    { name: "Zara", age: 27, photo: "https://picsum.photos/seed/rm_b8/200/200", bio: "Content Creator & Brand Strategist", distance: "0.9 mi", interests: ["Branding", "Content", "Social Media"], compatibility: 84, emoji: "✨" },
  ],
};

const THEMES: Record<Category, {
  gradient: string;
  textAccent: string;
  bgAccent: string;
  borderAccent: string;
  spinGlow: string;
  ctaText: string;
  ctaIcon: typeof Heart;
  matchTitle: string;
}> = {
  dating: {
    gradient: "from-pink-500 via-rose-500 to-red-500",
    textAccent: "text-pink-400",
    bgAccent: "bg-pink-500/15",
    borderAccent: "border-pink-500/30",
    spinGlow: "shadow-[0_0_80px_rgba(236,72,153,0.4)]",
    ctaText: "Send a Heart",
    ctaIcon: Heart,
    matchTitle: "It's a Match!",
  },
  friends: {
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    textAccent: "text-emerald-400",
    bgAccent: "bg-emerald-500/15",
    borderAccent: "border-emerald-500/30",
    spinGlow: "shadow-[0_0_80px_rgba(16,185,129,0.4)]",
    ctaText: "Add Friend",
    ctaIcon: UserPlus,
    matchTitle: "New Friend Found!",
  },
  business: {
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    textAccent: "text-blue-400",
    bgAccent: "bg-blue-500/15",
    borderAccent: "border-blue-500/30",
    spinGlow: "shadow-[0_0_80px_rgba(59,130,246,0.4)]",
    ctaText: "Connect",
    ctaIcon: Briefcase,
    matchTitle: "Connection Found!",
  },
};

type GameState = "idle" | "spinning" | "reveal" | "profile";

export default function RandomMatch({ onBack, category = "dating" }: RandomMatchProps) {
  const theme = THEMES[category];
  const profiles = PROFILES[category];
  const CtaIcon = theme.ctaIcon;

  const [gameState, setGameState] = useState<GameState>("idle");
  const [spinsLeft, setSpinsLeft] = useState(3);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchedProfile, setMatchedProfile] = useState<MatchProfile | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchProfile[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const spinIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Slot machine rapid cycling
  const handleSpin = useCallback(() => {
    if (spinsLeft <= 0 || gameState === "spinning") return;

    setGameState("spinning");
    setMatchedProfile(null);
    setShowConfetti(false);

    let speed = 60; // ms per frame
    let elapsed = 0;
    const totalDuration = 2500 + Math.random() * 1000; // 2.5s - 3.5s
    let idx = currentIndex;

    const tick = () => {
      idx = (idx + 1) % profiles.length;
      setCurrentIndex(idx);
      elapsed += speed;

      if (elapsed < totalDuration) {
        // Gradually slow down near the end
        if (elapsed > totalDuration * 0.6) {
          speed = Math.min(speed + 12, 350);
        }
        spinIntervalRef.current = setTimeout(tick, speed);
      } else {
        // Final match
        const finalIdx = Math.floor(Math.random() * profiles.length);
        setCurrentIndex(finalIdx);
        const matched = profiles[finalIdx];
        setMatchedProfile(matched);
        setMatchHistory(prev => [matched, ...prev.slice(0, 9)]);
        setSpinsLeft(prev => prev - 1);
        setGameState("reveal");
        setShowConfetti(true);

        // Clear confetti after delay
        setTimeout(() => setShowConfetti(false), 3000);
      }
    };

    spinIntervalRef.current = setTimeout(tick, speed);
  }, [spinsLeft, gameState, currentIndex, profiles]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) clearTimeout(spinIntervalRef.current);
    };
  }, []);

  const handleViewProfile = () => {
    setGameState("profile");
  };

  const handleReset = () => {
    setSpinsLeft(3);
    setGameState("idle");
    setMatchedProfile(null);
    setMatchHistory([]);
    setShowConfetti(false);
  };

  const handleSpinAgain = () => {
    if (spinsLeft > 0) {
      setGameState("idle");
      setMatchedProfile(null);
    }
  };

  const currentProfile = profiles[currentIndex];

  // Confetti particles
  const confettiColors = category === "dating"
    ? ["#ec4899", "#f43f5e", "#f97316", "#fbbf24", "#a855f7"]
    : category === "friends"
    ? ["#10b981", "#14b8a6", "#06b6d4", "#22d3ee", "#34d399"]
    : ["#3b82f6", "#6366f1", "#8b5cf6", "#a78bfa", "#60a5fa"];

  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950 text-white select-none">

      {/* Background effects */}
      <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-[160px] opacity-15 bg-gradient-to-r ${theme.gradient}`} />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-[140px] opacity-10 bg-indigo-500" />

      {/* Confetti layer */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: -20,
                  rotate: 0,
                  scale: Math.random() * 0.5 + 0.5,
                }}
                animate={{
                  y: window.innerHeight + 20,
                  rotate: Math.random() * 720 - 360,
                  x: Math.random() * window.innerWidth,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 0.5,
                  ease: "easeOut",
                }}
                style={{
                  position: "absolute",
                  width: `${6 + Math.random() * 8}px`,
                  height: `${6 + Math.random() * 8}px`,
                  backgroundColor: confettiColors[i % confettiColors.length],
                  borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

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
            <Dice5 className={`w-4 h-4 ${theme.textAccent}`} />
            <span className={`text-sm font-black uppercase tracking-widest bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
              Random Match
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`px-2.5 py-1 rounded-full ${theme.bgAccent} border ${theme.borderAccent}`}>
              <span className={`text-[10px] font-black ${theme.textAccent}`}>{spinsLeft} left</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="absolute inset-0 flex flex-col" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 56px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

        {/* ── IDLE / SPINNING STATE ── */}
        {(gameState === "idle" || gameState === "spinning") && (
          <div className="flex-1 flex flex-col items-center justify-center px-6">

            {/* Instructions text */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 text-center"
            >
              <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">
                {gameState === "spinning" ? "Finding someone special..." : "Tap to spin the wheel"}
              </p>
            </motion.div>

            {/* Slot Machine Display */}
            <div className="relative w-full max-w-[280px] mb-8">
              {/* Frame outer glow */}
              <div className={`absolute -inset-2 rounded-[28px] ${gameState === "spinning" ? theme.spinGlow : ""} transition-shadow duration-300`} />

              {/* Slot window */}
              <div className={`relative rounded-3xl border-2 overflow-hidden backdrop-blur-md transition-all duration-300 ${
                gameState === "spinning"
                  ? `${theme.borderAccent} bg-slate-900/90`
                  : "border-slate-800 bg-slate-900/60"
              }`}>
                {/* Decorative top bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${theme.gradient} opacity-60`} />

                {/* Profile Display */}
                <div className="p-6 flex flex-col items-center relative">
                  {/* Spinning glow ring */}
                  {gameState === "spinning" && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <div className={`w-40 h-40 rounded-full border-2 border-t-transparent bg-gradient-to-r ${theme.gradient} opacity-20`}
                        style={{ borderImage: `linear-gradient(to right, transparent, ${category === "dating" ? "#ec4899" : category === "friends" ? "#10b981" : "#3b82f6"}, transparent) 1` }}
                      />
                    </motion.div>
                  )}

                  {/* Avatar */}
                  <motion.div
                    animate={gameState === "spinning" ? {
                      scale: [1, 1.05, 0.95, 1],
                    } : {}}
                    transition={{ duration: 0.15, repeat: Infinity }}
                    className="relative mb-4"
                  >
                    <div className={`w-28 h-28 rounded-full overflow-hidden border-3 ${
                      gameState === "spinning" ? theme.borderAccent : "border-slate-700"
                    } shadow-xl transition-all duration-200`}>
                      <img
                        src={currentProfile.photo}
                        alt={currentProfile.name}
                        className={`w-full h-full object-cover transition-all duration-100 ${
                          gameState === "spinning" ? "blur-[2px] scale-110" : ""
                        }`}
                      />
                    </div>
                    {/* Emoji badge */}
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-base">
                      {currentProfile.emoji}
                    </div>
                  </motion.div>

                  {/* Name cycling */}
                  <div className="text-center">
                    <motion.h2
                      key={currentIndex}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: gameState === "spinning" ? 0.5 : 1, y: 0 }}
                      className={`text-xl font-black tracking-tight ${
                        gameState === "spinning" ? "text-slate-400" : "text-white"
                      }`}
                    >
                      {currentProfile.name}, {currentProfile.age}
                    </motion.h2>
                    <p className={`text-xs mt-1 ${
                      gameState === "spinning" ? "text-slate-600" : "text-slate-400"
                    }`}>
                      {gameState === "spinning" ? "..." : currentProfile.bio}
                    </p>
                  </div>

                  {/* Proximity badge */}
                  {gameState !== "spinning" && (
                    <div className="flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/50">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span className="text-[10px] text-slate-400 font-bold">{currentProfile.distance} away</span>
                    </div>
                  )}
                </div>

                {/* Decorative bottom bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${theme.gradient} opacity-40`} />
              </div>
            </div>

            {/* Spin Button */}
            {spinsLeft > 0 ? (
              <motion.button
                onClick={handleSpin}
                disabled={gameState === "spinning"}
                whileTap={{ scale: 0.95 }}
                className={`w-full max-w-[280px] py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                  gameState === "spinning"
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : `bg-gradient-to-r ${theme.gradient} text-white shadow-xl active:scale-95`
                }`}
              >
                {gameState === "spinning" ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    >
                      <Dice5 className="w-5 h-5" />
                    </motion.div>
                    <span>Spinning...</span>
                  </>
                ) : (
                  <>
                    <Dice5 className="w-5 h-5" />
                    <span>Spin the Wheel</span>
                  </>
                )}
              </motion.button>
            ) : (
              <div className="text-center">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3">No spins left</p>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/50 text-slate-200 text-xs font-bold active:scale-95 transition-all flex items-center gap-2 mx-auto"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Spins</span>
                </button>
              </div>
            )}

            {/* Spin counter dots */}
            <div className="flex items-center gap-2 mt-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    i <= spinsLeft
                      ? `bg-gradient-to-r ${theme.gradient} shadow-sm`
                      : "bg-slate-800 border border-slate-700"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── REVEAL STATE ── */}
        {gameState === "reveal" && matchedProfile && (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-full max-w-sm"
            >
              {/* Match card */}
              <div className={`rounded-3xl border border-white/10 overflow-hidden shadow-2xl ${theme.spinGlow}`}>
                {/* Top gradient bar */}
                <div className={`h-2 bg-gradient-to-r ${theme.gradient}`} />

                <div className="bg-slate-900/90 backdrop-blur-md p-6">
                  {/* Title */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mb-5"
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Sparkles className={`w-5 h-5 ${theme.textAccent} animate-pulse`} />
                      <h2 className={`text-xl font-black bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
                        {theme.matchTitle}
                      </h2>
                      <Sparkles className={`w-5 h-5 ${theme.textAccent} animate-pulse`} />
                    </div>
                  </motion.div>

                  {/* Profile */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col items-center"
                  >
                    <div className="relative mb-4">
                      <div className={`w-24 h-24 rounded-full overflow-hidden border-3 ${theme.borderAccent} shadow-xl`}>
                        <img src={matchedProfile.photo} alt={matchedProfile.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-base">
                        {matchedProfile.emoji}
                      </div>
                    </div>

                    <h3 className="text-lg font-black text-white">{matchedProfile.name}, {matchedProfile.age}</h3>
                    <p className="text-xs text-slate-400 mt-1">{matchedProfile.bio}</p>

                    {/* Quick stats */}
                    <div className="flex items-center gap-3 mt-3">
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/50 text-[10px] text-slate-400 font-bold">
                        <MapPin className="w-3 h-3" /> {matchedProfile.distance}
                      </span>
                      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${theme.bgAccent} border ${theme.borderAccent} text-[10px] ${theme.textAccent} font-bold`}>
                        <Star className="w-3 h-3" /> {matchedProfile.compatibility}% match
                      </span>
                    </div>

                    {/* Interests */}
                    <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                      {matchedProfile.interests.map((interest) => (
                        <span
                          key={interest}
                          className="px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/30 text-[10px] text-slate-300 font-medium"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </motion.div>

                  {/* Actions */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 space-y-3"
                  >
                    {/* Primary CTA */}
                    <button
                      onClick={handleViewProfile}
                      className={`w-full py-4 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-black text-sm uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg`}
                    >
                      <CtaIcon className="w-5 h-5" />
                      <span>{theme.ctaText}</span>
                    </button>

                    {/* Secondary: Spin Again */}
                    {spinsLeft > 0 && (
                      <button
                        onClick={handleSpinAgain}
                        className="w-full py-3 rounded-2xl bg-slate-800/80 border border-slate-700/50 text-slate-200 text-sm font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <Dice5 className="w-4 h-4" />
                        <span>Spin Again ({spinsLeft} left)</span>
                      </button>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── PROFILE VIEW STATE ── */}
        {gameState === "profile" && matchedProfile && (
          <div className="flex-1 overflow-y-auto px-4 pb-6" style={{ paddingTop: "12px" }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm mx-auto"
            >
              {/* Profile hero */}
              <div className={`rounded-3xl overflow-hidden border border-white/10 mb-4 bg-gradient-to-br ${
                category === "dating" ? "from-pink-950/60 via-rose-950/30 to-slate-950" :
                category === "friends" ? "from-emerald-950/60 via-green-950/30 to-slate-950" :
                "from-blue-950/60 via-indigo-950/30 to-slate-950"
              }`}>
                <div className="p-6 flex flex-col items-center">
                  <div className="relative mb-4">
                    <div className={`w-32 h-32 rounded-full overflow-hidden border-3 ${theme.borderAccent} shadow-2xl`}>
                      <img src={matchedProfile.photo} alt={matchedProfile.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-1 -right-2 w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">
                      {matchedProfile.emoji}
                    </div>
                  </div>

                  <h2 className="text-2xl font-black text-white">{matchedProfile.name}, {matchedProfile.age}</h2>
                  <p className="text-sm text-slate-400 mt-1 italic">{matchedProfile.bio}</p>

                  {/* Compatibility bar */}
                  <div className="w-full mt-5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Compatibility</span>
                      <span className={`text-sm font-black ${theme.textAccent}`}>{matchedProfile.compatibility}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${matchedProfile.compatibility}%` }}
                        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                        className={`h-full rounded-full bg-gradient-to-r ${theme.gradient}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Info cards */}
              <div className="space-y-3">
                {/* Distance */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${theme.bgAccent} border ${theme.borderAccent} flex items-center justify-center shrink-0`}>
                    <MapPin className={`w-5 h-5 ${theme.textAccent}`} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-200 uppercase tracking-wider">Distance</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{matchedProfile.distance} away from you</p>
                  </div>
                </div>

                {/* Interests */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl ${theme.bgAccent} border ${theme.borderAccent} flex items-center justify-center shrink-0`}>
                      <Sparkles className={`w-5 h-5 ${theme.textAccent}`} />
                    </div>
                    <p className="text-xs font-black text-slate-200 uppercase tracking-wider">Interests</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {matchedProfile.interests.map((interest) => (
                      <span
                        key={interest}
                        className={`px-3 py-1.5 rounded-xl ${theme.bgAccent} border ${theme.borderAccent} text-xs ${theme.textAccent} font-bold`}
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Safety note */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-200 uppercase tracking-wider">Safety First</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Meet in public places · Share your location</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => {
                    alert(`${category === "dating" ? "Sending a heart to" : category === "friends" ? "Adding" : "Connecting with"} ${matchedProfile.name}!`);
                    onBack();
                  }}
                  className={`w-full py-4 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-black text-sm uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg`}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Start Conversation</span>
                </button>

                <button
                  onClick={() => setGameState("reveal")}
                  className="w-full py-3 rounded-2xl bg-slate-800/80 border border-slate-700/50 text-slate-200 text-sm font-bold active:scale-95 transition-all"
                >
                  Back to Match
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── MATCH HISTORY BAR (shows at bottom in idle/spinning) ── */}
        {(gameState === "idle" || gameState === "spinning") && matchHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 pb-6"
          >
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recent Matches</h4>
                <Clock className="w-3.5 h-3.5 text-slate-600" />
              </div>
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {matchHistory.map((profile, idx) => (
                  <div key={`${profile.name}-${idx}`} className="flex flex-col items-center shrink-0">
                    <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${theme.borderAccent} shadow-md`}>
                      <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold mt-1">{profile.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
