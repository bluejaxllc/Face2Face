import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Trophy,
  Crown,
  Medal,
  Flame,
  TrendingUp,
  Star,
  Zap,
  Timer,
  Target,
  MapPin,
  Users,
  Sparkles,
  ChevronDown,
  Heart,
  UserPlus,
  Briefcase,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────
type Category = "dating" | "friends" | "business";
type TimeFilter = "today" | "week" | "alltime";
type LeaderboardType = "bumps" | "streaks" | "games";

interface LeaderboardProps {
  onBack: () => void;
  category?: Category;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  age: number;
  photo: string;
  score: number;
  trend: "up" | "down" | "same";
  badge?: string;
  emoji: string;
  subtitle: string;
}

// ─── Leaderboard Data Generator ─────────────────────────────────
function generateLeaderboard(type: LeaderboardType, category: Category, timeFilter: TimeFilter): LeaderboardEntry[] {
  const seedNames: Record<Category, { name: string; age: number; emoji: string }[]> = {
    dating: [
      { name: "Luna", age: 25, emoji: "🌙" },
      { name: "Shay", age: 27, emoji: "💃" },
      { name: "Rio", age: 29, emoji: "👨‍🍳" },
      { name: "Jade", age: 26, emoji: "🎨" },
      { name: "Marcus", age: 31, emoji: "🏔️" },
      { name: "Aly", age: 30, emoji: "📸" },
      { name: "Sky", age: 28, emoji: "🎵" },
      { name: "Kai", age: 24, emoji: "🏄" },
      { name: "Nova", age: 23, emoji: "⭐" },
      { name: "Zara", age: 27, emoji: "✨" },
      { name: "You", age: 28, emoji: "👑" },
    ],
    friends: [
      { name: "Tyler", age: 28, emoji: "🏀" },
      { name: "Mia", age: 23, emoji: "🎤" },
      { name: "Sarah", age: 24, emoji: "🎲" },
      { name: "Kevin", age: 29, emoji: "🏃" },
      { name: "Noah", age: 30, emoji: "🧩" },
      { name: "Jess", age: 26, emoji: "🌿" },
      { name: "Alex", age: 27, emoji: "🐕" },
      { name: "Priya", age: 25, emoji: "📚" },
      { name: "Leo", age: 22, emoji: "🎮" },
      { name: "Sam", age: 28, emoji: "☕" },
      { name: "You", age: 28, emoji: "👑" },
    ],
    business: [
      { name: "David", age: 34, emoji: "🚀" },
      { name: "Elena", age: 31, emoji: "📈" },
      { name: "Aaron", age: 36, emoji: "💰" },
      { name: "Ava", age: 28, emoji: "🌍" },
      { name: "Ryan", age: 33, emoji: "💻" },
      { name: "Nina", age: 29, emoji: "🎨" },
      { name: "James", age: 35, emoji: "⚙️" },
      { name: "Zara", age: 27, emoji: "✨" },
      { name: "Chris", age: 32, emoji: "📊" },
      { name: "Maya", age: 30, emoji: "🎯" },
      { name: "You", age: 28, emoji: "👑" },
    ],
  };

  const names = seedNames[category];
  const subtitles: Record<LeaderboardType, string[]> = {
    bumps: ["Most Bumps Given", "Bump Legend", "Serial Bumper", "Bump Master", "Quick Bumper", "Power Bumper", "Bump Enthusiast", "Steady Bumper", "Rising Bumper", "New Bumper", "Your Stats"],
    streaks: ["Longest Streak", "On Fire", "Streak King", "Committed", "Consistent", "Blazing", "Dedicated", "Growing", "Starting", "Newcomer", "Your Stats"],
    games: ["Game Champion", "All-Rounder", "Strategy King", "Quick Thinker", "Skilled Player", "Competitor", "Challenger", "Learner", "Newcomer", "Beginner", "Your Stats"],
  };

  const baseScores: Record<LeaderboardType, Record<TimeFilter, number>> = {
    bumps: { today: 25, week: 150, alltime: 2400 },
    streaks: { today: 5, week: 18, alltime: 120 },
    games: { today: 8, week: 45, alltime: 680 },
  };

  const base = baseScores[type][timeFilter];
  const trends: ("up" | "down" | "same")[] = ["up", "up", "same", "down", "up", "same", "down", "up", "down", "same", "up"];
  const badges = ["🥇", "🥈", "🥉"];

  return names
    .map((person, idx) => ({
      rank: idx + 1,
      name: person.name,
      age: person.age,
      photo: person.name === "You" ? "" : `https://picsum.photos/seed/lb_${category}_${idx}/80/80`,
      score: Math.max(1, Math.round(base * (1 - idx * 0.08) + (Math.random() * base * 0.1))),
      trend: trends[idx],
      badge: idx < 3 ? badges[idx] : undefined,
      emoji: person.emoji,
      subtitle: subtitles[type][idx],
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
}

// ─── Theme & Label Constants ────────────────────────────────────
const THEMES: Record<Category, {
  gradient: string;
  textAccent: string;
  bgAccent: string;
  borderAccent: string;
  rgb: string;
  orbColors: string[];
}> = {
  dating: {
    gradient: "from-pink-500 via-rose-500 to-red-500",
    textAccent: "text-pink-400",
    bgAccent: "bg-pink-500/15",
    borderAccent: "border-pink-500/30",
    rgb: "236,72,153",
    orbColors: ["rgba(236,72,153,0.15)", "rgba(244,63,94,0.12)", "rgba(251,113,133,0.10)", "rgba(190,24,93,0.08)", "rgba(225,29,72,0.12)"],
  },
  friends: {
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    textAccent: "text-emerald-400",
    bgAccent: "bg-emerald-500/15",
    borderAccent: "border-emerald-500/30",
    rgb: "16,185,129",
    orbColors: ["rgba(16,185,129,0.15)", "rgba(34,197,94,0.12)", "rgba(52,211,153,0.10)", "rgba(5,150,105,0.08)", "rgba(20,184,166,0.12)"],
  },
  business: {
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    textAccent: "text-blue-400",
    bgAccent: "bg-blue-500/15",
    borderAccent: "border-blue-500/30",
    rgb: "59,130,246",
    orbColors: ["rgba(59,130,246,0.15)", "rgba(99,102,241,0.12)", "rgba(96,165,250,0.10)", "rgba(37,99,235,0.08)", "rgba(139,92,246,0.12)"],
  },
};

const BOARD_LABELS: Record<LeaderboardType, { label: string; icon: typeof Trophy; unit: string }> = {
  bumps: { label: "Bumps", icon: Zap, unit: "bumps" },
  streaks: { label: "Streaks", icon: Flame, unit: "days" },
  games: { label: "Games", icon: Target, unit: "wins" },
};

// ─── Sub-Components ─────────────────────────────────────────────

/** SVG noise texture overlay for cinematic grain */
function NoiseOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] opacity-[0.03]">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <filter id="leaderboard-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#leaderboard-noise)" />
      </svg>
    </div>
  );
}

/** Floating atmospheric orbs */
function FloatingOrbs({ colors }: { colors: string[] }) {
  const orbData = useMemo(() => colors.map((color, i) => ({
    color,
    size: 120 + i * 60,
    x1: 10 + (i * 18) % 80,
    y1: 5 + (i * 23) % 70,
    x2: 70 - (i * 14) % 55,
    y2: 80 - (i * 19) % 60,
    duration: 14 + i * 3,
  })), [colors]);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {orbData.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            filter: "blur(40px)",
          }}
          animate={{
            left: [`${orb.x1}%`, `${orb.x2}%`, `${orb.x1}%`],
            top: [`${orb.y1}%`, `${orb.y2}%`, `${orb.y1}%`],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: orb.duration, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/** Dust mote particles */
function DustMotes({ rgb }: { rgb: string }) {
  const motes = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 6,
    duration: 8 + Math.random() * 8,
    size: 1.5 + Math.random() * 2,
  })), []);

  return (
    <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
      {motes.map(m => (
        <motion.div
          key={m.id}
          className="absolute rounded-full"
          style={{
            width: m.size,
            height: m.size,
            left: `${m.left}%`,
            background: `rgba(${rgb},0.4)`,
          }}
          animate={{
            y: ["100vh", "-10vh"],
            x: [0, Math.sin(m.id) * 30, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: m.duration,
            delay: m.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

/** Sparkle particles around first place */
function SparkleParticles() {
  const sparks = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    id: i,
    angle: (i / 6) * 360,
    radius: 42 + (i % 2) * 8,
    delay: i * 0.4,
    size: 3 + (i % 3),
  })), []);

  return (
    <>
      {sparks.map(s => (
        <motion.div
          key={s.id}
          className="absolute rounded-full bg-amber-400"
          style={{
            width: s.size,
            height: s.size,
            left: "50%",
            top: "50%",
          }}
          animate={{
            x: [0, Math.cos((s.angle * Math.PI) / 180) * s.radius],
            y: [0, Math.sin((s.angle * Math.PI) / 180) * s.radius],
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 0],
          }}
          transition={{
            duration: 2,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </>
  );
}

// ─── Main Component ─────────────────────────────────────────────
export default function Leaderboard({ onBack, category = "dating" }: LeaderboardProps) {
  const theme = THEMES[category];
  const [boardType, setBoardType] = useState<LeaderboardType>("bumps");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("week");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [animateEntries, setAnimateEntries] = useState(false);

  useEffect(() => {
    setAnimateEntries(false);
    const data = generateLeaderboard(boardType, category, timeFilter);
    setEntries(data);
    // Small delay to trigger animation
    requestAnimationFrame(() => setAnimateEntries(true));
  }, [boardType, category, timeFilter]);

  const boardInfo = BOARD_LABELS[boardType];
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const userEntry = entries.find(e => e.name === "You");

  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950 text-white select-none">
      {/* ── Atmospheric Layers ── */}
      <NoiseOverlay />
      <FloatingOrbs colors={theme.orbColors} />
      <DustMotes rgb={theme.rgb} />

      {/* Radial glow behind podium area */}
      <div
        className="pointer-events-none absolute z-0"
        style={{
          left: "50%",
          top: "40%",
          transform: "translate(-50%, -50%)",
          width: 500,
          height: 400,
          background: `radial-gradient(ellipse, rgba(${theme.rgb},0.08) 0%, transparent 70%)`,
        }}
      />

      {/* ── HEADER ── */}
      <div className="fixed top-0 left-0 right-0 z-[60]" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.06] bg-slate-950/90 backdrop-blur-xl">
          <motion.button
            onClick={onBack}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.10] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-300" />
          </motion.button>
          <div className="flex items-center gap-2.5">
            <motion.div
              animate={{ filter: ["drop-shadow(0 0 4px rgba(251,191,36,0.4))", "drop-shadow(0 0 12px rgba(251,191,36,0.7))", "drop-shadow(0 0 4px rgba(251,191,36,0.4))"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Trophy className="w-4.5 h-4.5 text-amber-400" />
            </motion.div>
            <span
              className="text-sm font-black uppercase tracking-[0.2em]"
              style={{
                backgroundImage: `linear-gradient(135deg, #fbbf24, #f97316, #ef4444, #f97316, #fbbf24)`,
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Leaderboard
            </span>
          </div>
          <div style={{ width: "36px" }} />
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div
        className="absolute inset-0 flex flex-col z-[3]"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 56px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Board type tabs */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 bg-white/[0.04] backdrop-blur-lg rounded-2xl p-1 border border-white/[0.06]">
            {(["bumps", "streaks", "games"] as LeaderboardType[]).map(type => {
              const info = BOARD_LABELS[type];
              const Icon = info.icon;
              const isActive = boardType === type;
              return (
                <motion.button
                  key={type}
                  onClick={() => setBoardType(type)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  animate={isActive ? { scale: [0.97, 1] } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className={`flex-1 relative flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                    isActive ? "text-white" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-board-tab"
                      className={`absolute inset-0 rounded-xl bg-gradient-to-r ${theme.gradient}`}
                      style={{ boxShadow: `0 4px 20px rgba(${theme.rgb},0.3)` }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{info.label}</span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Time filter pills */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            {([
              { key: "today" as TimeFilter, label: "Today" },
              { key: "week" as TimeFilter, label: "This Week" },
              { key: "alltime" as TimeFilter, label: "All Time" },
            ]).map(({ key, label }) => {
              const isActive = timeFilter === key;
              return (
                <motion.button
                  key={key}
                  onClick={() => setTimeFilter(key)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                    isActive
                      ? `${theme.bgAccent} ${theme.textAccent} border ${theme.borderAccent} backdrop-blur-sm`
                      : "text-slate-500 border border-transparent hover:text-slate-400 hover:border-white/[0.06]"
                  }`}
                  style={isActive ? { boxShadow: `0 0 12px rgba(${theme.rgb},0.15)` } : {}}
                >
                  {label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${boardType}-${timeFilter}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {/* ── Top 3 Podium ── */}
              <div className="flex items-end justify-center gap-3 mb-6 pt-2">
                {/* 2nd Place */}
                {top3[1] && (
                  <motion.div
                    initial={animateEntries ? { y: 60, opacity: 0 } : false}
                    animate={animateEntries ? { y: 0, opacity: 1 } : false}
                    transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.12 }}
                    className="flex flex-col items-center w-24"
                  >
                    <div className="relative mb-2">
                      {/* Silver rotating ring */}
                      <motion.div
                        className="absolute -inset-1 rounded-full"
                        style={{
                          background: "conic-gradient(from 0deg, #94a3b8, #e2e8f0, #94a3b8, #cbd5e1, #94a3b8)",
                          padding: 2,
                        }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      >
                        <div className="w-full h-full rounded-full bg-slate-950" />
                      </motion.div>
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-slate-400/40 shadow-lg">
                        <img src={top3[1].photo} alt={top3[1].name} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 text-lg">🥈</div>
                    </div>
                    <p className="text-xs font-black text-slate-200 truncate w-full text-center">{top3[1].name}</p>
                    <p className="text-[10px] font-bold text-slate-400">{top3[1].score} {boardInfo.unit}</p>
                    {/* Glassmorphic podium bar */}
                    <div className="w-full h-16 rounded-t-xl mt-2 border-t border-x border-white/[0.06] bg-gradient-to-t from-slate-400/10 to-white/[0.02] backdrop-blur-sm" />
                  </motion.div>
                )}

                {/* 1st Place */}
                {top3[0] && (
                  <motion.div
                    initial={animateEntries ? { y: 60, opacity: 0 } : false}
                    animate={animateEntries ? { y: 0, opacity: 1 } : false}
                    transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0 }}
                    className="flex flex-col items-center w-28"
                  >
                    {/* Floating crown with bounce */}
                    <motion.div
                      animate={{ y: [0, -6, 0], rotate: [0, -3, 3, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      className="mb-1"
                    >
                      <Crown className="w-7 h-7 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                    </motion.div>
                    <div className="relative mb-2">
                      {/* Golden rotating gradient ring */}
                      <motion.div
                        className="absolute -inset-1.5 rounded-full"
                        style={{
                          background: "conic-gradient(from 0deg, #fbbf24, #f59e0b, #d97706, #fbbf24, #fde68a, #fbbf24)",
                          padding: 3,
                        }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                      >
                        <div className="w-full h-full rounded-full bg-slate-950" />
                      </motion.div>
                      {/* Golden glow halo */}
                      <div
                        className="absolute -inset-3 rounded-full"
                        style={{ background: "radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)" }}
                      />
                      <div className="relative w-20 h-20 rounded-full overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.25)]">
                        <img src={top3[0].photo} alt={top3[0].name} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 text-lg">🥇</div>
                      {/* Sparkle particles */}
                      <SparkleParticles />
                    </div>
                    <p className="text-sm font-black text-white truncate w-full text-center">{top3[0].name}</p>
                    <p className="text-xs font-bold text-amber-400">{top3[0].score} {boardInfo.unit}</p>
                    {/* Glassmorphic podium bar — tallest */}
                    <div className="w-full h-24 rounded-t-xl mt-2 border-t border-x border-amber-500/20 bg-gradient-to-t from-amber-500/10 to-amber-500/[0.02] backdrop-blur-sm" />
                  </motion.div>
                )}

                {/* 3rd Place */}
                {top3[2] && (
                  <motion.div
                    initial={animateEntries ? { y: 60, opacity: 0 } : false}
                    animate={animateEntries ? { y: 0, opacity: 1 } : false}
                    transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.2 }}
                    className="flex flex-col items-center w-24"
                  >
                    <div className="relative mb-2">
                      {/* Bronze rotating ring */}
                      <motion.div
                        className="absolute -inset-1 rounded-full"
                        style={{
                          background: "conic-gradient(from 0deg, #b45309, #d97706, #92400e, #d97706, #b45309)",
                          padding: 2,
                        }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      >
                        <div className="w-full h-full rounded-full bg-slate-950" />
                      </motion.div>
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-700/40 shadow-lg">
                        <img src={top3[2].photo} alt={top3[2].name} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 text-lg">🥉</div>
                    </div>
                    <p className="text-xs font-black text-slate-200 truncate w-full text-center">{top3[2].name}</p>
                    <p className="text-[10px] font-bold text-slate-400">{top3[2].score} {boardInfo.unit}</p>
                    {/* Glassmorphic podium bar — shortest */}
                    <div className="w-full h-12 rounded-t-xl mt-2 border-t border-x border-orange-500/15 bg-gradient-to-t from-orange-500/10 to-orange-500/[0.02] backdrop-blur-sm" />
                  </motion.div>
                )}
              </div>

              {/* ── Your Position Card ── */}
              {userEntry && (
                <motion.div
                  initial={animateEntries ? { x: -25, opacity: 0 } : false}
                  animate={animateEntries ? { x: 0, opacity: 1 } : false}
                  transition={{ type: "spring", stiffness: 350, damping: 25, delay: 0.3 }}
                  className="relative mb-4 p-3.5 rounded-2xl overflow-hidden"
                >
                  {/* Breathing glow border */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: `linear-gradient(135deg, rgba(${theme.rgb},0.25), transparent 50%, rgba(${theme.rgb},0.15))`,
                      padding: 1,
                    }}
                    animate={{
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="w-full h-full rounded-2xl bg-slate-950/90" />
                  </motion.div>

                  {/* Content */}
                  <div className="relative z-10 flex items-center gap-3">
                    <motion.div
                      className={`w-9 h-9 rounded-full bg-gradient-to-r ${theme.gradient} flex items-center justify-center text-white font-black text-sm shadow-lg`}
                      style={{ boxShadow: `0 0 16px rgba(${theme.rgb},0.3)` }}
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {userEntry.rank}
                    </motion.div>
                    <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm flex items-center justify-center text-lg">
                      {userEntry.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-black text-sm ${theme.textAccent}`}>You</span>
                        <span className="text-[8px] font-bold text-slate-500 uppercase bg-white/[0.06] px-1.5 py-0.5 rounded backdrop-blur-sm">#{userEntry.rank}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">{userEntry.score} {boardInfo.unit}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {userEntry.trend === "up" && (
                        <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                          <TrendingUp className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                        </motion.div>
                      )}
                      {userEntry.trend === "down" && (
                        <motion.div animate={{ y: [0, 2, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                          <ChevronDown className="w-4 h-4 text-red-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.5)]" />
                        </motion.div>
                      )}
                      {userEntry.trend === "same" && <span className="text-slate-600 text-xs">—</span>}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Rest of Leaderboard ── */}
              <div className="space-y-1.5">
                {rest.map((entry, idx) => {
                  const isUser = entry.name === "You";
                  return (
                    <motion.div
                      key={`${entry.name}-${entry.rank}`}
                      initial={animateEntries ? { x: -20, opacity: 0 } : false}
                      animate={animateEntries ? { x: 0, opacity: 1 } : false}
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 25,
                        delay: 0.35 + idx * 0.04,
                      }}
                      whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                        isUser
                          ? `${theme.bgAccent} border ${theme.borderAccent} backdrop-blur-sm`
                          : "bg-white/[0.02] border border-transparent hover:border-white/[0.06]"
                      }`}
                      style={isUser ? { boxShadow: `0 0 20px rgba(${theme.rgb},0.08)` } : {}}
                    >
                      {/* Rank badge */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                          isUser
                            ? `bg-gradient-to-r ${theme.gradient} text-white`
                            : "bg-white/[0.05] text-slate-400 border border-white/[0.06] backdrop-blur-sm"
                        }`}
                      >
                        {entry.rank}
                      </div>

                      {/* Avatar */}
                      <div className="shrink-0">
                        {entry.photo ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/[0.08]">
                            <img src={entry.photo} alt={entry.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm flex items-center justify-center text-lg">
                            {entry.emoji}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold text-sm ${isUser ? theme.textAccent : "text-slate-200"}`}>
                            {entry.name}
                          </span>
                          {!isUser && (
                            <span className="text-[10px] text-slate-500">{entry.age}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">{entry.subtitle}</p>
                      </div>

                      {/* Score */}
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-black tabular-nums ${isUser ? theme.textAccent : "text-slate-300"}`}>
                          {entry.score}
                        </p>
                        <p className="text-[8px] text-slate-600 uppercase tracking-wider font-bold">{boardInfo.unit}</p>
                      </div>

                      {/* Trend */}
                      <div className="shrink-0 w-5">
                        {entry.trend === "up" && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                        {entry.trend === "down" && <ChevronDown className="w-4 h-4 text-red-400" />}
                        {entry.trend === "same" && <span className="text-slate-600 text-[10px]">—</span>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
