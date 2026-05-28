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
  orbColor1: string;
  orbColor2: string;
  orbColor3: string;
  glowRgb: string;
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
    orbColor1: "rgba(236,72,153,0.25)",
    orbColor2: "rgba(244,63,94,0.2)",
    orbColor3: "rgba(168,85,247,0.15)",
    glowRgb: "236,72,153",
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
    orbColor1: "rgba(16,185,129,0.25)",
    orbColor2: "rgba(20,184,166,0.2)",
    orbColor3: "rgba(6,182,212,0.15)",
    glowRgb: "16,185,129",
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
    orbColor1: "rgba(59,130,246,0.25)",
    orbColor2: "rgba(99,102,241,0.2)",
    orbColor3: "rgba(139,92,246,0.15)",
    glowRgb: "59,130,246",
  },
};

type GameState = "idle" | "spinning" | "reveal" | "profile";

/* ─── Noise SVG as inline data URI ─── */
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`;

/* ─── Floating Orb Component ─── */
function FloatingOrb({ color, size, x, y, dur }: { color: string; size: number; x: string; y: string; dur: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        left: x,
        top: y,
        filter: `blur(${size * 0.4}px)`,
      }}
      animate={{
        x: [0, 30, -20, 15, 0],
        y: [0, -25, 15, -10, 0],
        scale: [1, 1.15, 0.9, 1.05, 1],
        opacity: [0.6, 0.8, 0.5, 0.7, 0.6],
      }}
      transition={{
        duration: dur,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

/* ─── Ambient Dust Mote ─── */
function DustMote({ delay, category }: { delay: number; category: Category }) {
  const colors: Record<Category, string> = {
    dating: "bg-pink-400/30",
    friends: "bg-emerald-400/30",
    business: "bg-blue-400/30",
  };
  return (
    <motion.div
      className={`absolute w-1 h-1 rounded-full ${colors[category]} pointer-events-none`}
      style={{
        left: `${10 + Math.random() * 80}%`,
        top: `${10 + Math.random() * 80}%`,
      }}
      animate={{
        y: [0, -60, -120],
        x: [0, Math.random() * 40 - 20, Math.random() * 30 - 15],
        opacity: [0, 0.6, 0],
        scale: [0.5, 1.2, 0.3],
      }}
      transition={{
        duration: 6 + Math.random() * 4,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

/* ─── Animated Gradient Ring for Avatars ─── */
function GradientRing({ size, category, spinning = false }: { size: number; category: Category; spinning?: boolean }) {
  const gradients: Record<Category, string> = {
    dating: "conic-gradient(from 0deg, #ec4899, #f43f5e, #f97316, #ec4899)",
    friends: "conic-gradient(from 0deg, #10b981, #14b8a6, #06b6d4, #10b981)",
    business: "conic-gradient(from 0deg, #3b82f6, #6366f1, #8b5cf6, #3b82f6)",
  };
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size + 6,
        height: size + 6,
        top: -3,
        left: -3,
        background: gradients[category],
        padding: 3,
      }}
      animate={{ rotate: 360 }}
      transition={{
        duration: spinning ? 1.5 : 4,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <div className="w-full h-full rounded-full bg-slate-950" />
    </motion.div>
  );
}

/* ─── Compatibility Counter ─── */
function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * value);
      setDisplay(start);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <span className={className}>{display}%</span>;
}

/* ─── Particle Burst on Match ─── */
function ParticleBurst({ colors }: { colors: string[] }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * 360;
        const rad = (angle * Math.PI) / 180;
        const dist = 80 + Math.random() * 60;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 4 + Math.random() * 4,
              height: 4 + Math.random() * 4,
              backgroundColor: colors[i % colors.length],
              left: "50%",
              top: "50%",
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(rad) * dist,
              y: Math.sin(rad) * dist,
              opacity: 0,
              scale: 0.2,
            }}
            transition={{
              duration: 0.8 + Math.random() * 0.4,
              delay: Math.random() * 0.15,
              ease: "easeOut",
            }}
          />
        );
      })}
    </div>
  );
}

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
  const [showFlash, setShowFlash] = useState(false);
  const spinIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Slot machine rapid cycling
  const handleSpin = useCallback(() => {
    if (spinsLeft <= 0 || gameState === "spinning") return;

    setGameState("spinning");
    setMatchedProfile(null);
    setShowConfetti(false);
    setShowFlash(false);

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

        // White flash then reveal
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 400);

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

      {/* ── SVG Noise Overlay ── */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none opacity-40"
        style={{ backgroundImage: NOISE_SVG, backgroundRepeat: "repeat", backgroundSize: "128px 128px" }}
      />

      {/* ── Floating Background Orbs ── */}
      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
        <FloatingOrb color={theme.orbColor1} size={220} x="5%" y="10%" dur={18} />
        <FloatingOrb color={theme.orbColor2} size={180} x="70%" y="5%" dur={22} />
        <FloatingOrb color={theme.orbColor3} size={160} x="15%" y="60%" dur={20} />
        <FloatingOrb color={theme.orbColor1} size={140} x="80%" y="55%" dur={16} />
        <FloatingOrb color={theme.orbColor2} size={120} x="50%" y="80%" dur={24} />
        <FloatingOrb color={theme.orbColor3} size={100} x="35%" y="30%" dur={19} />
      </div>

      {/* ── Ambient Dust Motes ── */}
      <div className="absolute inset-0 z-[3] pointer-events-none overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          <DustMote key={i} delay={i * 0.8} category={category} />
        ))}
      </div>

      {/* ── Radial gradient behind match area ── */}
      <div
        className="absolute z-[2] pointer-events-none"
        style={{
          width: 500,
          height: 500,
          left: "50%",
          top: "40%",
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, rgba(${theme.glowRgb},0.08) 0%, transparent 70%)`,
        }}
      />

      {/* ── White Flash Overlay ── */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            className="absolute inset-0 z-[70] pointer-events-none bg-white"
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {/* ── Confetti layer ── */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 z-[50] pointer-events-none overflow-hidden">
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 400),
                  y: -20,
                  rotate: 0,
                  scale: Math.random() * 0.5 + 0.5,
                }}
                animate={{
                  y: (typeof window !== "undefined" ? window.innerHeight : 800) + 20,
                  rotate: Math.random() * 720 - 360,
                  x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 400),
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
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.06] bg-slate-950/60 backdrop-blur-xl">
          <motion.button
            onClick={onBack}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.1] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-300" />
          </motion.button>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Dice5 className={`w-4 h-4 ${theme.textAccent}`} />
            </motion.div>
            <span className={`text-sm font-black uppercase tracking-[0.2em] bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
              Random Match
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <motion.div
              className={`px-2.5 py-1 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08]`}
              animate={{
                boxShadow: spinsLeft > 0
                  ? [`0 0 0 rgba(${theme.glowRgb},0)`, `0 0 12px rgba(${theme.glowRgb},0.3)`, `0 0 0 rgba(${theme.glowRgb},0)`]
                  : "none",
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className={`text-[10px] font-black ${theme.textAccent}`}>{spinsLeft} left</span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="absolute inset-0 flex flex-col z-[10]" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 56px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

        {/* ── IDLE / SPINNING STATE ── */}
        {(gameState === "idle" || gameState === "spinning") && (
          <div className="flex-1 flex flex-col items-center justify-center px-6">

            {/* Instructions text */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 text-center"
            >
              <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.25em]">
                {gameState === "spinning" ? "Finding someone special..." : "Tap to spin the wheel"}
              </p>
            </motion.div>

            {/* ── Glassmorphic Slot Machine ── */}
            <div className="relative w-full max-w-[300px] mb-8">
              {/* Outer breathing glow */}
              <motion.div
                className="absolute -inset-3 rounded-[32px] pointer-events-none"
                animate={gameState === "spinning" ? {
                  boxShadow: [
                    `0 0 40px rgba(${theme.glowRgb},0.15)`,
                    `0 0 80px rgba(${theme.glowRgb},0.35)`,
                    `0 0 40px rgba(${theme.glowRgb},0.15)`,
                  ],
                } : {
                  boxShadow: `0 0 30px rgba(${theme.glowRgb},0.1)`,
                }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Glassmorphic card */}
              <div
                className={`relative rounded-3xl overflow-hidden backdrop-blur-xl transition-all duration-300 border ${
                  gameState === "spinning"
                    ? "border-white/[0.12] bg-white/[0.06]"
                    : "border-white/[0.08] bg-white/[0.04]"
                }`}
                style={{
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 20px 60px rgba(0,0,0,0.4)`,
                }}
              >
                {/* Top accent bar */}
                <div className={`h-[2px] w-full bg-gradient-to-r ${theme.gradient}`}
                  style={{ opacity: gameState === "spinning" ? 0.9 : 0.5 }}
                />

                {/* Profile Display */}
                <div className="p-7 flex flex-col items-center relative">

                  {/* Spinning glow ring behind avatar */}
                  {gameState === "spinning" && (
                    <motion.div
                      animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                      transition={{ rotate: { duration: 1.2, repeat: Infinity, ease: "linear" }, scale: { duration: 0.6, repeat: Infinity } }}
                      className="absolute top-6 pointer-events-none"
                      style={{
                        width: 140,
                        height: 140,
                        borderRadius: "50%",
                        background: `conic-gradient(from 0deg, rgba(${theme.glowRgb},0.4), transparent, rgba(${theme.glowRgb},0.4))`,
                        filter: "blur(8px)",
                      }}
                    />
                  )}

                  {/* Avatar with animated gradient ring */}
                  <motion.div
                    animate={gameState === "spinning" ? {
                      scale: [1, 1.05, 0.95, 1],
                    } : {}}
                    transition={{ duration: 0.15, repeat: Infinity }}
                    className="relative mb-5"
                  >
                    {/* Gradient ring */}
                    <GradientRing size={112} category={category} spinning={gameState === "spinning"} />

                    <div className={`w-28 h-28 rounded-full overflow-hidden shadow-2xl relative z-10`}>
                      <img
                        src={currentProfile.photo}
                        alt={currentProfile.name}
                        className={`w-full h-full object-cover transition-all duration-100 ${
                          gameState === "spinning" ? "blur-[3px] scale-110 brightness-110" : ""
                        }`}
                      />
                    </div>

                    {/* Emoji badge */}
                    <motion.div
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/[0.1] flex items-center justify-center text-base z-20"
                      animate={gameState === "spinning" ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3, repeat: Infinity }}
                    >
                      {currentProfile.emoji}
                    </motion.div>
                  </motion.div>

                  {/* Name cycling */}
                  <div className="text-center">
                    <AnimatePresence mode="wait">
                      <motion.h2
                        key={currentIndex}
                        initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                        animate={{
                          opacity: gameState === "spinning" ? 0.5 : 1,
                          y: 0,
                          filter: "blur(0px)",
                        }}
                        exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                        transition={{ duration: 0.1 }}
                        className={`text-xl font-black tracking-tight ${
                          gameState === "spinning"
                            ? "text-slate-400"
                            : `bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`
                        }`}
                      >
                        {currentProfile.name}, {currentProfile.age}
                      </motion.h2>
                    </AnimatePresence>
                    <p className={`text-xs mt-1.5 ${
                      gameState === "spinning" ? "text-slate-600" : "text-slate-400"
                    }`}>
                      {gameState === "spinning" ? "..." : currentProfile.bio}
                    </p>
                  </div>

                  {/* Proximity badge — glassmorphic pill */}
                  {gameState !== "spinning" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-white/[0.05] backdrop-blur-md border border-white/[0.08]"
                    >
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span className="text-[10px] text-slate-400 font-bold tracking-wide">{currentProfile.distance} away</span>
                    </motion.div>
                  )}
                </div>

                {/* Bottom accent */}
                <div className={`h-[2px] w-full bg-gradient-to-r ${theme.gradient}`}
                  style={{ opacity: gameState === "spinning" ? 0.7 : 0.3 }}
                />
              </div>
            </div>

            {/* ── Spin Button — Large Glassmorphic ── */}
            {spinsLeft > 0 ? (
              <motion.button
                onClick={handleSpin}
                disabled={gameState === "spinning"}
                whileHover={gameState !== "spinning" ? { scale: 1.02 } : {}}
                whileTap={gameState !== "spinning" ? { scale: 0.95 } : {}}
                className={`w-full max-w-[300px] py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 relative overflow-hidden ${
                  gameState === "spinning"
                    ? "bg-white/[0.04] border border-white/[0.06] text-slate-500 cursor-not-allowed"
                    : `bg-gradient-to-r ${theme.gradient} text-white`
                }`}
                style={gameState !== "spinning" ? {
                  boxShadow: `0 0 30px rgba(${theme.glowRgb},0.3), 0 10px 40px rgba(0,0,0,0.3)`,
                } : undefined}
                animate={gameState !== "spinning" ? {
                  boxShadow: [
                    `0 0 20px rgba(${theme.glowRgb},0.2), 0 10px 40px rgba(0,0,0,0.3)`,
                    `0 0 40px rgba(${theme.glowRgb},0.4), 0 10px 40px rgba(0,0,0,0.3)`,
                    `0 0 20px rgba(${theme.glowRgb},0.2), 0 10px 40px rgba(0,0,0,0.3)`,
                  ],
                } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Shimmer sweep */}
                {gameState !== "spinning" && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                    }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                  />
                )}

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
                <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mb-3">No spins left</p>
                <motion.button
                  onClick={handleReset}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 rounded-2xl bg-white/[0.05] backdrop-blur-md border border-white/[0.08] text-slate-200 text-xs font-bold transition-all flex items-center gap-2 mx-auto"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Spins</span>
                </motion.button>
              </div>
            )}

            {/* Spin counter dots */}
            <div className="flex items-center gap-2.5 mt-5">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    i <= spinsLeft
                      ? `bg-gradient-to-r ${theme.gradient}`
                      : "bg-white/[0.06] border border-white/[0.08]"
                  }`}
                  animate={i <= spinsLeft ? {
                    boxShadow: [
                      `0 0 0 rgba(${theme.glowRgb},0)`,
                      `0 0 8px rgba(${theme.glowRgb},0.5)`,
                      `0 0 0 rgba(${theme.glowRgb},0)`,
                    ],
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── REVEAL STATE ── */}
        {gameState === "reveal" && matchedProfile && (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <motion.div
              initial={{ scale: 0, rotate: -10, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 180, damping: 14, mass: 1.2 }}
              className="w-full max-w-sm relative"
            >
              {/* Particle burst */}
              <ParticleBurst colors={confettiColors} />

              {/* ── Glassmorphic Match Card with conic-gradient border ── */}
              <div className="relative rounded-3xl p-[2px] overflow-hidden"
                style={{
                  background: `conic-gradient(from 0deg, rgba(${theme.glowRgb},0.5), transparent 30%, rgba(${theme.glowRgb},0.3) 50%, transparent 70%, rgba(${theme.glowRgb},0.5))`,
                }}
              >
                {/* Rotating border glow */}
                <motion.div
                  className="absolute inset-0 rounded-3xl"
                  style={{
                    background: `conic-gradient(from 0deg, rgba(${theme.glowRgb},0.6), transparent 25%, rgba(${theme.glowRgb},0.4) 50%, transparent 75%, rgba(${theme.glowRgb},0.6))`,
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                />

                {/* Inner card */}
                <div
                  className="relative rounded-[22px] overflow-hidden bg-slate-950/80 backdrop-blur-2xl"
                  style={{
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 30px 80px rgba(0,0,0,0.5), 0 0 60px rgba(${theme.glowRgb},0.15)`,
                  }}
                >
                  {/* Top gradient bar */}
                  <div className={`h-[3px] bg-gradient-to-r ${theme.gradient}`} />

                  <div className="p-6">
                    {/* Title */}
                    <motion.div
                      initial={{ opacity: 0, y: -15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25, type: "spring", stiffness: 200 }}
                      className="text-center mb-5"
                    >
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <motion.div
                          animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Sparkles className={`w-5 h-5 ${theme.textAccent}`} />
                        </motion.div>
                        <h2 className={`text-2xl font-black bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent tracking-tight`}>
                          {theme.matchTitle}
                        </h2>
                        <motion.div
                          animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Sparkles className={`w-5 h-5 ${theme.textAccent}`} />
                        </motion.div>
                      </div>
                    </motion.div>

                    {/* Profile */}
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35, type: "spring" }}
                      className="flex flex-col items-center"
                    >
                      {/* Avatar with gradient ring — 96px */}
                      <div className="relative mb-4">
                        <GradientRing size={96} category={category} />
                        <div className="w-24 h-24 rounded-full overflow-hidden relative z-10 shadow-2xl">
                          <img src={matchedProfile.photo} alt={matchedProfile.name} className="w-full h-full object-cover" />
                        </div>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/[0.1] flex items-center justify-center text-base z-20"
                        >
                          {matchedProfile.emoji}
                        </motion.div>
                      </div>

                      {/* Name — gradient text */}
                      <h3 className={`text-lg font-black bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
                        {matchedProfile.name}, {matchedProfile.age}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 italic">{matchedProfile.bio}</p>

                      {/* Quick stats as glassmorphic pills */}
                      <div className="flex items-center gap-2.5 mt-3">
                        <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.05] backdrop-blur-md border border-white/[0.08] text-[10px] text-slate-400 font-bold">
                          <MapPin className="w-3 h-3" /> {matchedProfile.distance}
                        </span>
                        <motion.span
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${theme.bgAccent} backdrop-blur-md border ${theme.borderAccent} text-[10px] ${theme.textAccent} font-black`}
                          animate={{
                            boxShadow: [
                              `0 0 0 rgba(${theme.glowRgb},0)`,
                              `0 0 16px rgba(${theme.glowRgb},0.3)`,
                              `0 0 0 rgba(${theme.glowRgb},0)`,
                            ],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Star className="w-3 h-3" />
                          <AnimatedCounter value={matchedProfile.compatibility} />
                          <span className="ml-0.5">match</span>
                        </motion.span>
                      </div>

                      {/* Interests as glassmorphic pills */}
                      <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                        {matchedProfile.interests.map((interest, idx) => (
                          <motion.span
                            key={interest}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + idx * 0.1, type: "spring" }}
                            className="px-3 py-1.5 rounded-full bg-white/[0.05] backdrop-blur-md border border-white/[0.08] text-[10px] text-slate-300 font-medium"
                          >
                            {interest}
                          </motion.span>
                        ))}
                      </div>
                    </motion.div>

                    {/* Actions */}
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="mt-6 space-y-3"
                    >
                      {/* Primary CTA — breathing glow */}
                      <motion.button
                        onClick={handleViewProfile}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-full py-4 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-2 relative overflow-hidden`}
                        animate={{
                          boxShadow: [
                            `0 0 20px rgba(${theme.glowRgb},0.25)`,
                            `0 0 40px rgba(${theme.glowRgb},0.5)`,
                            `0 0 20px rgba(${theme.glowRgb},0.25)`,
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        {/* Shimmer */}
                        <motion.div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                          }}
                          animate={{ x: ["-100%", "200%"] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
                        />
                        <CtaIcon className="w-5 h-5" />
                        <span>{theme.ctaText}</span>
                      </motion.button>

                      {/* Secondary: Spin Again — glassmorphic outline */}
                      {spinsLeft > 0 && (
                        <motion.button
                          onClick={handleSpinAgain}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-full py-3 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/[0.1] text-slate-200 text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/[0.08] transition-colors"
                        >
                          <Dice5 className="w-4 h-4" />
                          <span>Spin Again ({spinsLeft} left)</span>
                        </motion.button>
                      )}
                    </motion.div>
                  </div>
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
              {/* ── Profile Hero — glassmorphic card ── */}
              <div
                className="rounded-3xl overflow-hidden border border-white/[0.08] mb-4 bg-white/[0.03] backdrop-blur-xl"
                style={{
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(${theme.glowRgb},0.08)`,
                }}
              >
                {/* Top gradient line */}
                <div className={`h-[2px] bg-gradient-to-r ${theme.gradient} opacity-60`} />

                <div className="p-6 flex flex-col items-center relative">
                  {/* Background radial glow */}
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-60 h-60 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, rgba(${theme.glowRgb},0.06) 0%, transparent 70%)`,
                    }}
                  />

                  {/* Avatar with gradient ring */}
                  <div className="relative mb-4">
                    <GradientRing size={128} category={category} />
                    <div className="w-32 h-32 rounded-full overflow-hidden relative z-10 shadow-2xl">
                      <img src={matchedProfile.photo} alt={matchedProfile.name} className="w-full h-full object-cover" />
                    </div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                      className="absolute -bottom-1 -right-2 w-10 h-10 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/[0.1] flex items-center justify-center text-xl z-20"
                    >
                      {matchedProfile.emoji}
                    </motion.div>
                  </div>

                  {/* Name — gradient text */}
                  <h2 className={`text-2xl font-black bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent tracking-tight`}>
                    {matchedProfile.name}, {matchedProfile.age}
                  </h2>
                  <p className="text-sm text-slate-400 mt-1 italic">{matchedProfile.bio}</p>

                  {/* Category tag with accent */}
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`mt-3 px-3 py-1 rounded-full ${theme.bgAccent} border ${theme.borderAccent}`}
                  >
                    <span className={`text-[10px] font-black uppercase tracking-widest ${theme.textAccent}`}>
                      {category === "dating" ? "💕 Dating" : category === "friends" ? "🤝 Friends" : "💼 Business"}
                    </span>
                  </motion.div>

                  {/* Compatibility bar */}
                  <div className="w-full mt-5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Compatibility</span>
                      <span className={`text-sm font-black ${theme.textAccent}`}>
                        <AnimatedCounter value={matchedProfile.compatibility} />
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${matchedProfile.compatibility}%` }}
                        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                        className={`h-full rounded-full bg-gradient-to-r ${theme.gradient} relative overflow-hidden`}
                      >
                        {/* Shimmer on bar */}
                        <motion.div
                          className="absolute inset-0"
                          style={{
                            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                          }}
                          animate={{ x: ["-100%", "200%"] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                        />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Info Cards — glassmorphic ── */}
              <div className="space-y-3">
                {/* Distance */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-4 flex items-center gap-4"
                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
                >
                  <div className={`w-10 h-10 rounded-xl ${theme.bgAccent} border ${theme.borderAccent} flex items-center justify-center shrink-0`}>
                    <MapPin className={`w-5 h-5 ${theme.textAccent}`} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-200 uppercase tracking-wider">Distance</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{matchedProfile.distance} away from you</p>
                  </div>
                </motion.div>

                {/* Interests */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-4"
                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl ${theme.bgAccent} border ${theme.borderAccent} flex items-center justify-center shrink-0`}>
                      <Sparkles className={`w-5 h-5 ${theme.textAccent}`} />
                    </div>
                    <p className="text-xs font-black text-slate-200 uppercase tracking-wider">Interests</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {matchedProfile.interests.map((interest, idx) => (
                      <motion.span
                        key={interest}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + idx * 0.1, type: "spring" }}
                        className={`px-3 py-1.5 rounded-xl ${theme.bgAccent} backdrop-blur-md border ${theme.borderAccent} text-xs ${theme.textAccent} font-bold`}
                      >
                        {interest}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>

                {/* Safety note */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-4 flex items-center gap-4"
                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-200 uppercase tracking-wider">Safety First</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Meet in public places · Share your location</p>
                  </div>
                </motion.div>
              </div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 space-y-3"
              >
                {/* Start Conversation — shimmer gradient */}
                <motion.button
                  onClick={() => {
                    alert(`${category === "dating" ? "Sending a heart to" : category === "friends" ? "Adding" : "Connecting with"} ${matchedProfile.name}!`);
                    onBack();
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full py-4 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-2 relative overflow-hidden`}
                  animate={{
                    boxShadow: [
                      `0 0 20px rgba(${theme.glowRgb},0.25)`,
                      `0 0 40px rgba(${theme.glowRgb},0.5)`,
                      `0 0 20px rgba(${theme.glowRgb},0.25)`,
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                    }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
                  />
                  <MessageSquare className="w-5 h-5" />
                  <span>Start Conversation</span>
                </motion.button>

                {/* Back to Match — glassmorphic outline */}
                <motion.button
                  onClick={() => setGameState("reveal")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-3 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/[0.1] text-slate-200 text-sm font-bold hover:bg-white/[0.08] transition-colors"
                >
                  Back to Match
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        )}

        {/* ── MATCH HISTORY BAR — Glassmorphic with mini rings ── */}
        {(gameState === "idle" || gameState === "spinning") && matchHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 pb-6"
          >
            <div
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-4"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 10px 40px rgba(0,0,0,0.3)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Recent Matches</h4>
                <Clock className="w-3.5 h-3.5 text-slate-600" />
              </div>
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {matchHistory.map((profile, idx) => (
                  <motion.div
                    key={`${profile.name}-${idx}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.08, type: "spring" }}
                    className="flex flex-col items-center shrink-0"
                  >
                    {/* Mini gradient ring */}
                    <div className="relative">
                      <div
                        className="absolute -inset-[2px] rounded-full"
                        style={{
                          background: category === "dating"
                            ? "conic-gradient(from 0deg, #ec4899, #f43f5e, #ec4899)"
                            : category === "friends"
                            ? "conic-gradient(from 0deg, #10b981, #14b8a6, #10b981)"
                            : "conic-gradient(from 0deg, #3b82f6, #6366f1, #3b82f6)",
                          padding: 2,
                        }}
                      >
                        <div className="w-full h-full rounded-full bg-slate-950" />
                      </div>
                      <div className="w-12 h-12 rounded-full overflow-hidden relative z-10 shadow-md">
                        <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
                      </div>
                      {/* Status indicator */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 z-20 bg-gradient-to-r ${theme.gradient}`} />
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold mt-1.5">{profile.name}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
