import { useState, useEffect } from "react";
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

// Generate leaderboard data
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

const THEMES: Record<Category, {
  gradient: string;
  textAccent: string;
  bgAccent: string;
  borderAccent: string;
}> = {
  dating: {
    gradient: "from-pink-500 via-rose-500 to-red-500",
    textAccent: "text-pink-400",
    bgAccent: "bg-pink-500/15",
    borderAccent: "border-pink-500/30",
  },
  friends: {
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    textAccent: "text-emerald-400",
    bgAccent: "bg-emerald-500/15",
    borderAccent: "border-emerald-500/30",
  },
  business: {
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    textAccent: "text-blue-400",
    bgAccent: "bg-blue-500/15",
    borderAccent: "border-blue-500/30",
  },
};

const BOARD_LABELS: Record<LeaderboardType, { label: string; icon: typeof Trophy; unit: string }> = {
  bumps: { label: "Bumps", icon: Zap, unit: "bumps" },
  streaks: { label: "Streaks", icon: Flame, unit: "days" },
  games: { label: "Games", icon: Target, unit: "wins" },
};

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
      {/* Background */}
      <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-[160px] opacity-15 bg-gradient-to-r ${theme.gradient}`} />

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
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-black uppercase tracking-widest bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">
              Leaderboard
            </span>
          </div>
          <div style={{ width: "36px" }} />
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="absolute inset-0 flex flex-col" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 56px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

        {/* Board type tabs */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 bg-slate-900/60 rounded-xl p-1 border border-slate-800">
            {(["bumps", "streaks", "games"] as LeaderboardType[]).map(type => {
              const info = BOARD_LABELS[type];
              const Icon = info.icon;
              return (
                <button
                  key={type}
                  onClick={() => setBoardType(type)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    boardType === type
                      ? `bg-gradient-to-r ${theme.gradient} text-white shadow-md`
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{info.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time filter tabs */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            {([
              { key: "today" as TimeFilter, label: "Today" },
              { key: "week" as TimeFilter, label: "This Week" },
              { key: "alltime" as TimeFilter, label: "All Time" },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTimeFilter(key)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                  timeFilter === key
                    ? `${theme.bgAccent} ${theme.textAccent} border ${theme.borderAccent}`
                    : 'text-slate-500 border border-transparent hover:text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">

          {/* Top 3 Podium */}
          <div className="flex items-end justify-center gap-3 mb-6 pt-2">
            {/* 2nd place */}
            {top3[1] && (
              <motion.div
                initial={animateEntries ? { y: 40, opacity: 0 } : false}
                animate={animateEntries ? { y: 0, opacity: 1 } : false}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center w-24"
              >
                <div className="relative mb-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-600 shadow-lg">
                    <img src={top3[1].photo} alt={top3[1].name} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 text-lg">🥈</div>
                </div>
                <p className="text-xs font-black text-slate-200 truncate w-full text-center">{top3[1].name}</p>
                <p className="text-[10px] font-bold text-slate-400">{top3[1].score} {boardInfo.unit}</p>
                <div className="w-full h-16 bg-gradient-to-t from-slate-400/10 to-slate-400/5 rounded-t-xl mt-2 border-t border-x border-slate-700/30" />
              </motion.div>
            )}

            {/* 1st place */}
            {top3[0] && (
              <motion.div
                initial={animateEntries ? { y: 40, opacity: 0 } : false}
                animate={animateEntries ? { y: 0, opacity: 1 } : false}
                transition={{ delay: 0 }}
                className="flex flex-col items-center w-28"
              >
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mb-1"
                >
                  <Crown className="w-6 h-6 text-amber-400" />
                </motion.div>
                <div className="relative mb-2">
                  <div className={`w-20 h-20 rounded-full overflow-hidden border-3 border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.2)]`}>
                    <img src={top3[0].photo} alt={top3[0].name} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 text-lg">🥇</div>
                </div>
                <p className="text-sm font-black text-white truncate w-full text-center">{top3[0].name}</p>
                <p className="text-xs font-bold text-amber-400">{top3[0].score} {boardInfo.unit}</p>
                <div className="w-full h-24 bg-gradient-to-t from-amber-500/10 to-amber-500/5 rounded-t-xl mt-2 border-t border-x border-amber-500/20" />
              </motion.div>
            )}

            {/* 3rd place */}
            {top3[2] && (
              <motion.div
                initial={animateEntries ? { y: 40, opacity: 0 } : false}
                animate={animateEntries ? { y: 0, opacity: 1 } : false}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center w-24"
              >
                <div className="relative mb-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-700/40 shadow-lg">
                    <img src={top3[2].photo} alt={top3[2].name} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 text-lg">🥉</div>
                </div>
                <p className="text-xs font-black text-slate-200 truncate w-full text-center">{top3[2].name}</p>
                <p className="text-[10px] font-bold text-slate-400">{top3[2].score} {boardInfo.unit}</p>
                <div className="w-full h-12 bg-gradient-to-t from-orange-500/10 to-orange-500/5 rounded-t-xl mt-2 border-t border-x border-orange-500/20" />
              </motion.div>
            )}
          </div>

          {/* Your position highlight */}
          {userEntry && (
            <motion.div
              initial={animateEntries ? { x: -20, opacity: 0 } : false}
              animate={animateEntries ? { x: 0, opacity: 1 } : false}
              transition={{ delay: 0.3 }}
              className={`mb-4 p-3 rounded-2xl border ${theme.borderAccent} ${theme.bgAccent} flex items-center gap-3`}
            >
              <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${theme.gradient} flex items-center justify-center text-white font-black text-sm`}>
                {userEntry.rank}
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                {userEntry.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-black text-sm ${theme.textAccent}`}>You</span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase bg-slate-800 px-1.5 py-0.5 rounded">#{userEntry.rank}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">{userEntry.score} {boardInfo.unit}</p>
              </div>
              <div className="flex items-center gap-1">
                {userEntry.trend === "up" && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                {userEntry.trend === "down" && <ChevronDown className="w-4 h-4 text-red-400" />}
                {userEntry.trend === "same" && <span className="text-slate-600 text-xs">—</span>}
              </div>
            </motion.div>
          )}

          {/* Rest of leaderboard */}
          <div className="space-y-1">
            {rest.map((entry, idx) => (
              <motion.div
                key={`${entry.name}-${entry.rank}`}
                initial={animateEntries ? { x: -15, opacity: 0 } : false}
                animate={animateEntries ? { x: 0, opacity: 1 } : false}
                transition={{ delay: 0.3 + idx * 0.04 }}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                  entry.name === "You"
                    ? `${theme.bgAccent} border ${theme.borderAccent}`
                    : 'hover:bg-slate-900/50'
                }`}
              >
                {/* Rank */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                  entry.name === "You"
                    ? `bg-gradient-to-r ${theme.gradient} text-white`
                    : 'bg-slate-800/60 text-slate-400 border border-slate-700/50'
                }`}>
                  {entry.rank}
                </div>

                {/* Avatar */}
                <div className="shrink-0">
                  {entry.photo ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-700/50">
                      <img src={entry.photo} alt={entry.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                      {entry.emoji}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-bold text-sm ${entry.name === "You" ? theme.textAccent : 'text-slate-200'}`}>
                      {entry.name}
                    </span>
                    {entry.name !== "You" && (
                      <span className="text-[10px] text-slate-500">{entry.age}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">{entry.subtitle}</p>
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <p className={`text-sm font-black ${entry.name === "You" ? theme.textAccent : 'text-slate-300'}`}>
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
