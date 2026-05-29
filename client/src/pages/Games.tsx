import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useScrollSave } from "@/hooks/use-scroll-save";
import { PageTransition } from "@/components/PageTransition";
import BottomNavigation from "@/components/BottomNavigation";
import {
  Gamepad2, Radio, Swords, Target, Trophy, Zap, Dice5, Crown,
  Flag, Sparkles, Lock, Brain, Smile, Eye, Star, Clock, Users,
  TrendingUp, Flame, Award, ChevronRight, MapPin,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────
type Category = "dating" | "friends" | "business";

// ─── Category Colors ────────────────────────────────────────────────────────────
const catColors = {
  dating: { accent: "#ec4899", accentLight: "#f472b6", grad: "from-pink-500 via-rose-500 to-red-500", glow: "rgba(236,72,153,0.3)", text: "text-pink-400", bg: "bg-pink-500", bgSoft: "bg-pink-500/15", border: "border-pink-500/30" },
  friends: { accent: "#10b981", accentLight: "#34d399", grad: "from-emerald-500 via-teal-500 to-cyan-500", glow: "rgba(16,185,129,0.3)", text: "text-emerald-400", bg: "bg-emerald-500", bgSoft: "bg-emerald-500/15", border: "border-emerald-500/30" },
  business: { accent: "#3b82f6", accentLight: "#60a5fa", grad: "from-blue-500 via-indigo-500 to-purple-500", glow: "rgba(59,130,246,0.3)", text: "text-blue-400", bg: "bg-blue-500", bgSoft: "bg-blue-500/15", border: "border-blue-500/30" },
};

// ─── Game Data ──────────────────────────────────────────────────────────────────
const gamesList = [
  { id: "icebreaker", icon: Sparkles, name: "Ice Breaker", desc: "Swipe through questions to match", color: "purple", mode: "solo" as const, difficulty: 1, time: "~3 MIN", gameKey: "icebreaker" as const, ready: true, badge: "NEW" as const },
  { id: "bump-battle", icon: Swords, name: "Bump Battle", desc: "Test your reflexes in a 1v1 duel", color: "rose", mode: "1v1" as const, difficulty: 1, time: "~2 MIN", gameKey: "bumpbattle" as const, ready: true, badge: "NEW" as const },
  { id: "trivia-clash", icon: Brain, name: "Trivia Clash", desc: "Head-to-head quiz battle", color: "violet", mode: "1v1" as const, difficulty: 2, time: "~3 MIN", gameKey: "triviaclash" as const, ready: true, badge: "NEW" as const },
  { id: "two-truths", icon: Eye, name: "Two Truths & a Lie", desc: "Spot the faker — 3 statements, 1 lie", color: "violet", mode: "1v1" as const, difficulty: 2, time: "~3 MIN", gameKey: "twotruths" as const, ready: true, badge: "NEW" as const },
  { id: "king-of-hill", icon: Crown, name: "King of the Hill", desc: "Hold your spot the longest", color: "fuchsia", mode: "1v1" as const, difficulty: 3, time: "~5 MIN", gameKey: "kingofthehill" as const, ready: true, badge: "NEW" as const },
  { id: "proximity-tag", icon: Target, name: "Proximity Tag", desc: "Tag players within your range", color: "blue", mode: "1v1" as const, difficulty: 2, time: "~2 MIN", gameKey: "proximitytag" as const, ready: true, badge: "NEW" as const },
  { id: "turf-wars", icon: Flag, name: "Turf Wars", desc: "Capture real-world territories", color: "violet", mode: "1v1" as const, difficulty: 3, time: "~5 MIN", gameKey: "turfwars" as const, ready: true, badge: null },
  { id: "emoji-decode", icon: Smile, name: "Emoji Decode", desc: "Guess the emoji puzzle", color: "amber", mode: "1v1" as const, difficulty: 1, time: "~2 MIN", gameKey: "emojidecode" as const, ready: true, badge: "NEW" as const },
  { id: "random-match", icon: Dice5, name: "Random Match", desc: "Spin to meet someone new", color: "emerald", mode: "solo" as const, difficulty: 1, time: "~1 MIN", gameKey: "randommatch" as const, ready: true, badge: "NEW" as const },
  { id: "leaderboard", icon: Trophy, name: "Leaderboard", desc: "Top bumpers this week", color: "amber", mode: "solo" as const, difficulty: 0, time: "", gameKey: "leaderboard" as const, ready: true, badge: null },
];

// Color map for game card accents
const gameColorMap: Record<string, { accent: string; glow: string; iconBg: string; iconBorder: string; textColor: string }> = {
  purple: { accent: "#a855f7", glow: "rgba(168,85,247,0.25)", iconBg: "bg-purple-500/15", iconBorder: "border-purple-500/30", textColor: "text-purple-400" },
  rose: { accent: "#f43f5e", glow: "rgba(244,63,94,0.25)", iconBg: "bg-rose-500/15", iconBorder: "border-rose-500/30", textColor: "text-rose-400" },
  violet: { accent: "#8b5cf6", glow: "rgba(139,92,246,0.25)", iconBg: "bg-violet-500/15", iconBorder: "border-violet-500/30", textColor: "text-violet-400" },
  blue: { accent: "#3b82f6", glow: "rgba(59,130,246,0.25)", iconBg: "bg-blue-500/15", iconBorder: "border-blue-500/30", textColor: "text-blue-400" },
  fuchsia: { accent: "#d946ef", glow: "rgba(217,70,239,0.25)", iconBg: "bg-fuchsia-500/15", iconBorder: "border-fuchsia-500/30", textColor: "text-fuchsia-400" },
  amber: { accent: "#f59e0b", glow: "rgba(245,158,11,0.25)", iconBg: "bg-amber-500/15", iconBorder: "border-amber-500/30", textColor: "text-amber-400" },
  emerald: { accent: "#10b981", glow: "rgba(16,185,129,0.25)", iconBg: "bg-emerald-500/15", iconBorder: "border-emerald-500/30", textColor: "text-emerald-400" },
};

// ─── Hero carousel slides ───────────────────────────────────────────────────────
const heroSlides = [
  { gameKey: "icebreaker" as const, icon: Sparkles, title: "Ice Breaker", subtitle: "Swipe & Match", tagline: "Find your vibe — swipe through questions", gradient: "from-purple-600 via-violet-600 to-indigo-600" },
  { gameKey: "bumpbattle" as const, icon: Swords, title: "Bump Battle", subtitle: "1v1 Duels", tagline: "Challenge someone to a lightning-fast duel", gradient: "from-rose-600 via-pink-600 to-red-600" },
  { gameKey: "triviaclash" as const, icon: Brain, title: "Trivia Clash", subtitle: "Brain vs Brain", tagline: "Outsmart your opponent in a quiz showdown", gradient: "from-violet-600 via-purple-600 to-fuchsia-600" },
];

// ─── Sections ───────────────────────────────────────────────────────────────────
const competitiveKeys = ["bumpbattle", "triviaclash", "twotruths", "kingofthehill", "proximitytag", "turfwars", "emojidecode"];
const soloKeys = ["icebreaker", "randommatch"];
const rankingKeys = ["leaderboard"];

// ─── Animated Counter ───────────────────────────────────────────────────────────
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame: number;
    const duration = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{display}{suffix}</>;
}

// ─── Floating Background Orbs ───────────────────────────────────────────────────
function FloatingOrbs({ category }: { category: Category }) {
  const c = catColors[category];
  const orbs = useMemo(() => [
    { size: 180, x: "10%", y: "15%", delay: 0, duration: 20 },
    { size: 120, x: "75%", y: "35%", delay: 3, duration: 25 },
    { size: 200, x: "50%", y: "70%", delay: 6, duration: 22 },
    { size: 90, x: "85%", y: "85%", delay: 2, duration: 18 },
    { size: 140, x: "25%", y: "55%", delay: 5, duration: 23 },
  ], []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size, height: orb.size,
            left: orb.x, top: orb.y,
            background: `radial-gradient(circle, ${c.accent}15, transparent 70%)`,
            filter: "blur(40px)",
          }}
          animate={{
            x: [0, 30, -20, 10, 0],
            y: [0, -20, 15, -10, 0],
            scale: [1, 1.1, 0.9, 1.05, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            delay: orb.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── SVG Noise Overlay ──────────────────────────────────────────────────────────
function NoiseOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, opacity: 0.03 }}>
      <svg width="100%" height="100%">
        <filter id="gamesNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#gamesNoise)" />
      </svg>
    </div>
  );
}

// ─── Difficulty Stars ───────────────────────────────────────────────────────────
function DifficultyStars({ level, color }: { level: number; color: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((s) => (
        <Star
          key={s}
          style={{ width: 10, height: 10 }}
          className={s <= level ? color : "text-slate-700"}
          fill={s <= level ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

// ─── Game Card ──────────────────────────────────────────────────────────────────
function GameCard({ game, index, onPlay, category }: {
  game: typeof gamesList[0]; index: number;
  onPlay: (gameKey: string) => void; category: Category;
}) {
  const colors = gameColorMap[game.color] || gameColorMap.purple;
  const IconComp = game.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => game.ready && onPlay(game.gameKey)}
      className={`w-full text-left relative group ${!game.ready ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {/* Glassmorphic card */}
      <div
        className="relative rounded-2xl overflow-hidden p-4 transition-all duration-300"
        style={{
          background: "rgba(15,23,42,0.6)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(148,163,184,0.08)",
          boxShadow: `0 0 0 1px rgba(148,163,184,0.04), 0 4px 24px rgba(0,0,0,0.3)`,
        }}
      >
        {/* Hover glow */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ boxShadow: `inset 0 0 30px ${colors.glow}, 0 0 20px ${colors.glow}` }}
        />

        <div className="relative flex items-center gap-3.5">
          {/* Icon with glow ring */}
          <div className="relative flex-shrink-0">
            <motion.div
              className="absolute inset-0 rounded-xl opacity-40"
              style={{ background: colors.accent, filter: "blur(12px)" }}
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className={`relative w-13 h-13 rounded-xl ${colors.iconBg} border ${colors.iconBorder} flex items-center justify-center`}
              style={{ width: 52, height: 52 }}>
              <IconComp className={colors.textColor} style={{ width: 24, height: 24 }} />
              {!game.ready && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <Lock className="w-2.5 h-2.5 text-slate-500" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="font-black text-sm bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(135deg, #fff 0%, ${colors.accent} 100%)` }}
              >
                {game.name}
              </span>
              {game.badge && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400">
                  {game.badge}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-tight mb-1.5">{game.desc}</p>
            <div className="flex items-center gap-2.5">
              {game.difficulty > 0 && <DifficultyStars level={game.difficulty} color={colors.textColor} />}
              {game.time && (
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Clock style={{ width: 10, height: 10 }} />
                  <span>{game.time}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Users style={{ width: 10, height: 10 }} />
                <span className="uppercase font-bold">{game.mode}</span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          {game.ready && (
            <div className="flex-shrink-0 opacity-40 group-hover:opacity-80 transition-opacity">
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// ─── Section Header ─────────────────────────────────────────────────────────────
function SectionHeader({ emoji, title, category, delay = 0 }: {
  emoji: string; title: string; category: Category; delay?: number;
}) {
  const c = catColors[category];
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="flex items-center gap-2.5 mb-3"
    >
      <span className="text-lg">{emoji}</span>
      <div className="flex flex-col">
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90">{title}</span>
        <div className={`h-[2px] mt-1 rounded-full bg-gradient-to-r ${c.grad}`} style={{ width: "100%" }} />
      </div>
    </motion.div>
  );
}

// ─── Hero Carousel ──────────────────────────────────────────────────────────────
function HeroCarousel({ category, onPlay }: { category: Category; onPlay: (gameKey: string) => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const c = catColors[category];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = heroSlides[currentSlide];
  const IconComp = slide.icon;

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ minHeight: 160 }}>
      {/* Background gradient */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{ opacity: 0.3 }}
        />
      </AnimatePresence>

      {/* Animated background particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 4 + Math.random() * 6,
              height: 4 + Math.random() * 6,
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              background: c.accent,
              opacity: 0.15,
            }}
            animate={{
              y: [0, -20 - Math.random() * 30, 0],
              x: [0, 10 - Math.random() * 20, 0],
              opacity: [0.1, 0.35, 0.1],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Glow orb behind icon */}
      <div className="absolute top-1/2 left-8 -translate-y-1/2 w-32 h-32 rounded-full" style={{ background: `radial-gradient(circle, ${c.accent}30, transparent 70%)`, filter: "blur(20px)" }} />

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          className="relative z-10 p-5 flex items-center gap-4"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.4 }}
        >
          {/* Icon with glow */}
          <div className="relative flex-shrink-0">
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{ background: c.accent, filter: "blur(16px)", opacity: 0.4 }}
              animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <div
              className={`relative w-16 h-16 rounded-2xl ${c.bgSoft} border ${c.border} flex items-center justify-center`}
            >
              <IconComp className={c.text} style={{ width: 32, height: 32 }} />
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-0.5">{slide.subtitle}</p>
            <h3
              className="text-xl font-black bg-clip-text text-transparent mb-1"
              style={{ backgroundImage: `linear-gradient(135deg, #fff, ${c.accentLight})` }}
            >
              {slide.title}
            </h3>
            <p className="text-xs text-slate-400 leading-tight">{slide.tagline}</p>
          </div>

          {/* Play button */}
          <motion.div
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
            onClick={(e) => { e.stopPropagation(); onPlay(slide.gameKey); }}
            className={`flex-shrink-0 w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center cursor-pointer`}
            style={{ boxShadow: `0 4px 20px ${c.glow}` }}
          >
            <Zap className="w-6 h-6 text-white" fill="white" />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Glassmorphic border */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ border: "1px solid rgba(255,255,255,0.08)" }} />

      {/* Dots */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === currentSlide ? 20 : 6,
              height: 6,
              background: i === currentSlide ? c.accent : "rgba(148,163,184,0.3)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Stats Bar ──────────────────────────────────────────────────────────────────
function StatsBar({ category }: { category: Category }) {
  const c = catColors[category];
  const stats = [
    { icon: Gamepad2, label: "Played", value: 0, suffix: "" },
    { icon: TrendingUp, label: "Win Rate", value: 0, suffix: "%" },
    { icon: Flame, label: "Streak", value: 0, suffix: "" },
    { icon: Award, label: "Rank", value: 0, suffix: "", display: "Rookie" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-xl p-3 flex items-center justify-between"
      style={{
        background: "rgba(15,23,42,0.5)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(148,163,184,0.06)",
      }}
    >
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <Icon className={c.text} style={{ width: 14, height: 14, opacity: 0.7 }} />
            <span className="text-white font-black text-sm leading-none">
              {stat.display || <AnimatedCounter value={stat.value} suffix={stat.suffix} />}
            </span>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-medium">{stat.label}</span>
          </div>
        );
      })}
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════════
export default function Games() {
  const gamesScroll = useScrollSave("f2f_scroll_games");
  const [isLive, setIsLive] = useState(true);
  const [, navigate] = useLocation();
  const [category, setCategory] = useState<Category>(() => {
    return (localStorage.getItem("f2f_activeCategory") as Category) || "dating";
  });

  // Sync category when localStorage changes
  useEffect(() => {
    const sync = () => {
      const cat = localStorage.getItem("f2f_activeCategory") as Category;
      if (cat) setCategory(cat);
    };
    window.addEventListener("storage", sync);
    window.addEventListener("f2f:categoryChange", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("f2f:categoryChange", sync);
    };
  }, []);

  const c = catColors[category];

  // Navigate to the map — games are played there against nearby users
  const handlePlay = useCallback((gameKey?: string) => {
    if (gameKey) {
      let paramKey = gameKey;
      if (gameKey === "bumpbattle") paramKey = "bump-battle";
      else if (gameKey === "triviaclash") paramKey = "trivia-clash";
      else if (gameKey === "twotruths") paramKey = "two-truths";
      else if (gameKey === "kingofthehill") paramKey = "king-of-the-hill";
      else if (gameKey === "proximitytag") paramKey = "proximity-tag";
      else if (gameKey === "turfwars") paramKey = "turf-wars";
      else if (gameKey === "emojidecode") paramKey = "emoji-decode";
      navigate(`/map?game=${paramKey}`);
    } else {
      navigate("/map");
    }
  }, [navigate]);

  // ─── Sectioned game lists ──────────────────────────────────────────────────
  const competitiveGames = useMemo(() => gamesList.filter((g) => competitiveKeys.includes(g.gameKey)), []);
  const soloGames = useMemo(() => gamesList.filter((g) => soloKeys.includes(g.gameKey)), []);
  const rankingGames = useMemo(() => gamesList.filter((g) => rankingKeys.includes(g.gameKey)), []);

  // ─── Main Games Hub ────────────────────────────────────────────────────────
  return (
    <PageTransition className="h-screen w-full page-dark relative overflow-hidden">
      {/* Background atmosphere */}
      <FloatingOrbs category={category} />
      <NoiseOverlay />

      {/* ═══ Title Bar ═══ */}
      <div className="fixed top-0 left-0 right-0 z-[9999]" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full flex items-center justify-between px-4"
          style={{
            height: 44,
            background: "rgba(15,23,42,0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(148,163,184,0.08)",
          }}
        >
          {/* Left spacer */}
          <div style={{ width: 60 }} />

          {/* Centered title */}
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Gamepad2 className={c.text} style={{ width: 18, height: 18 }} />
            </motion.div>
            <h1 className="font-black text-white tracking-tight flex items-center gap-1.5" style={{ fontSize: 16 }}>
              <span className={`text-transparent bg-clip-text bg-gradient-to-r ${c.grad}`}>
                Games
              </span>
              <motion.span
                className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-black transform -translate-y-0.5"
                style={{ background: `${c.accent}20`, color: c.accent }}
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                BETA
              </motion.span>
            </h1>
          </div>

          {/* GO LIVE toggle */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-1.5 rounded-full border transition-all duration-300 ${
              isLive
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                : "bg-slate-800/50 border-slate-700/50 text-slate-500"
            }`}
            style={{ padding: "4px 10px", height: 28 }}
          >
            <Radio
              className={isLive ? "animate-pulse" : ""}
              style={{ width: 12, height: 12 }}
            />
            <span className="font-bold uppercase tracking-wider" style={{ fontSize: 8 }}>
              {isLive ? "LIVE" : "OFF"}
            </span>
          </motion.button>
        </motion.div>
      </div>

      {/* ═══ Scrollable Content ═══ */}
      <div
        {...gamesScroll}
        onScroll={gamesScroll.onScroll}
        className="fixed left-0 right-0 overflow-y-auto overflow-x-hidden"
        style={{ top: 44, bottom: 60, zIndex: 2 }}
      >
        <div className="px-4 pt-4 pb-8 flex flex-col gap-5">

          {/* ─── Hero Carousel ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <HeroCarousel category={category} onPlay={handlePlay} />
          </motion.div>

          {/* ─── Stats Bar ─── */}
          <StatsBar category={category} />

          {/* ─── Go to Map CTA ─── */}
          <motion.button
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handlePlay()}
            className="w-full relative overflow-hidden rounded-2xl p-4 cursor-pointer group"
            style={{
              background: `linear-gradient(135deg, ${c.accent}15, ${c.accent}08)`,
              border: `1px solid ${c.accent}25`,
            }}
          >
            <div className="relative flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl ${c.bgSoft} border ${c.border} flex items-center justify-center flex-shrink-0`}
              >
                <MapPin className={`w-5 h-5 ${c.text}`} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-black text-white">Find Opponents on the Map</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Challenge nearby users to play any game</p>
              </div>
              <div
                className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
            </div>
          </motion.button>

          {/* ─── Competitive Section ─── */}
          <div>
            <SectionHeader emoji="⚔️" title="COMPETITIVE" category={category} delay={0.2} />
            <div className="flex flex-col gap-2.5">
              {competitiveGames.map((game, i) => (
                <GameCard key={game.id} game={game} index={i} onPlay={handlePlay} category={category} />
              ))}
            </div>
          </div>

          {/* ─── Solo Section ─── */}
          <div>
            <SectionHeader emoji="🎯" title="SOLO" category={category} delay={0.35} />
            <div className="flex flex-col gap-2.5">
              {soloGames.map((game, i) => (
                <GameCard key={game.id} game={game} index={i} onPlay={handlePlay} category={category} />
              ))}
            </div>
          </div>

          {/* ─── Rankings Section ─── */}
          <div>
            <SectionHeader emoji="🏆" title="RANKINGS" category={category} delay={0.5} />
            <div className="flex flex-col gap-2.5">
              {rankingGames.map((game, i) => (
                <GameCard key={game.id} game={game} index={i} onPlay={handlePlay} category={category} />
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ═══ Bottom Navigation ═══ */}
      <BottomNavigation />
    </PageTransition>
  );
}
