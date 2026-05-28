import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import {
  ChevronLeft,
  Eye,
  Timer,
  Zap,
  Trophy,
  Star,
  CheckCircle2,
  XCircle,
  Flame,
  Sparkles,
  Heart,
  UserPlus,
  Briefcase,
  RotateCcw,
  Award,
  ThumbsDown,
  ThumbsUp,
  MessageCircle,
  Shield,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Types & Interfaces (PRESERVED)
   ───────────────────────────────────────────── */

type Category = "dating" | "friends" | "business";

interface TwoTruthsProps {
  onBack: () => void;
  category?: Category;
}

interface Statement {
  text: string;
  isLie: boolean;
}

interface Round {
  person: {
    name: string;
    age: number;
    photo: string;
    emoji: string;
    tagline: string;
  };
  statements: Statement[];
}

/* ─────────────────────────────────────────────
   Static Data (PRESERVED)
   ───────────────────────────────────────────── */

const ROUNDS_DATA: Record<Category, Round[]> = {
  dating: [
    {
      person: { name: "Sophia", age: 26, photo: "https://i.pravatar.cc/120?img=5", emoji: "🌸", tagline: "Hopeless romantic & bookworm" },
      statements: [
        { text: "I've read over 200 romance novels", isLie: false },
        { text: "I once got proposed to on a hot air balloon", isLie: false },
        { text: "I've never been on a blind date", isLie: true },
      ],
    },
    {
      person: { name: "Marcus", age: 29, photo: "https://i.pravatar.cc/120?img=11", emoji: "🔥", tagline: "Chef by day, dancer by night" },
      statements: [
        { text: "I can cook a 5-course French meal", isLie: false },
        { text: "I've won a salsa dancing competition", isLie: false },
        { text: "I've never watched a romantic comedy", isLie: true },
      ],
    },
    {
      person: { name: "Luna", age: 24, photo: "https://i.pravatar.cc/120?img=16", emoji: "🌙", tagline: "Stargazer & adventure seeker" },
      statements: [
        { text: "I've seen the Northern Lights twice", isLie: false },
        { text: "My first kiss was at a planetarium", isLie: false },
        { text: "I've never used a dating app before", isLie: true },
      ],
    },
    {
      person: { name: "Jake", age: 27, photo: "https://i.pravatar.cc/120?img=12", emoji: "🎸", tagline: "Musician with a heart of gold" },
      statements: [
        { text: "I wrote a love song that went viral on TikTok", isLie: false },
        { text: "I once serenaded someone on a subway", isLie: false },
        { text: "I've been in a relationship for 10 years", isLie: true },
      ],
    },
    {
      person: { name: "Aria", age: 25, photo: "https://i.pravatar.cc/120?img=9", emoji: "💎", tagline: "Travel lover & foodie" },
      statements: [
        { text: "I've visited 30 countries before turning 25", isLie: false },
        { text: "I once had a dinner date inside a volcano", isLie: true },
        { text: "My favorite cuisine is Ethiopian", isLie: false },
      ],
    },
    {
      person: { name: "Ethan", age: 31, photo: "https://i.pravatar.cc/120?img=7", emoji: "🏔️", tagline: "Mountain climber & poet" },
      statements: [
        { text: "I proposed to my ex on top of Mt. Fuji", isLie: true },
        { text: "I've summited 5 of the Seven Summits", isLie: false },
        { text: "I write a love poem every Valentine's Day", isLie: false },
      ],
    },
    {
      person: { name: "Mia", age: 23, photo: "https://i.pravatar.cc/120?img=20", emoji: "🎨", tagline: "Artist & coffee addict" },
      statements: [
        { text: "I painted a mural in downtown LA", isLie: false },
        { text: "I drink 6 cups of coffee a day", isLie: false },
        { text: "I've never had my heart broken", isLie: true },
      ],
    },
    {
      person: { name: "Noah", age: 28, photo: "https://i.pravatar.cc/120?img=33", emoji: "🐕", tagline: "Dog dad & fitness enthusiast" },
      statements: [
        { text: "I have 3 rescue dogs named after Greek gods", isLie: false },
        { text: "I ran a marathon with one of my dogs", isLie: false },
        { text: "I've never cried during a movie", isLie: true },
      ],
    },
    {
      person: { name: "Zara", age: 26, photo: "https://i.pravatar.cc/120?img=25", emoji: "✨", tagline: "Fashion designer & yogi" },
      statements: [
        { text: "My dress was featured in Vogue magazine", isLie: true },
        { text: "I can hold a headstand for 10 minutes", isLie: false },
        { text: "I've designed costumes for a Broadway show", isLie: false },
      ],
    },
    {
      person: { name: "Leo", age: 30, photo: "https://i.pravatar.cc/120?img=3", emoji: "🎭", tagline: "Actor & amateur magician" },
      statements: [
        { text: "I once performed magic on live television", isLie: false },
        { text: "I've appeared in a Marvel movie as an extra", isLie: false },
        { text: "I've never been nervous on a first date", isLie: true },
      ],
    },
  ],
  friends: [
    {
      person: { name: "Tyler", age: 25, photo: "https://i.pravatar.cc/120?img=12", emoji: "🎮", tagline: "Pro gamer & meme lord" },
      statements: [
        { text: "I once stayed awake for 48 hours gaming", isLie: false },
        { text: "I have a meme account with 500k followers", isLie: true },
        { text: "I've been to 12 gaming conventions", isLie: false },
      ],
    },
    {
      person: { name: "Mika", age: 22, photo: "https://i.pravatar.cc/120?img=20", emoji: "🎵", tagline: "DJ & vinyl collector" },
      statements: [
        { text: "I own over 2,000 vinyl records", isLie: false },
        { text: "I DJ'd at Coachella's after-party", isLie: true },
        { text: "I can beatbox in three different styles", isLie: false },
      ],
    },
    {
      person: { name: "Kai", age: 27, photo: "https://i.pravatar.cc/120?img=33", emoji: "🏄", tagline: "Surfer & marine biologist" },
      statements: [
        { text: "I've surfed in every ocean on Earth", isLie: false },
        { text: "I once swam with a whale shark", isLie: false },
        { text: "I've never been stung by a jellyfish", isLie: true },
      ],
    },
    {
      person: { name: "Zoe", age: 24, photo: "https://i.pravatar.cc/120?img=25", emoji: "⚡", tagline: "Rock climber & thrill-seeker" },
      statements: [
        { text: "I've bungee jumped off the Bloukrans Bridge", isLie: false },
        { text: "I free-climbed El Capitan in under a day", isLie: true },
        { text: "I have a fear of spiders despite loving heights", isLie: false },
      ],
    },
    {
      person: { name: "Dex", age: 26, photo: "https://i.pravatar.cc/120?img=7", emoji: "🍕", tagline: "Pizza fanatic & trivia nerd" },
      statements: [
        { text: "I've eaten pizza in 15 different countries", isLie: false },
        { text: "I won a national trivia championship", isLie: false },
        { text: "I've never eaten pineapple on pizza", isLie: true },
      ],
    },
    {
      person: { name: "Riley", age: 23, photo: "https://i.pravatar.cc/120?img=9", emoji: "📸", tagline: "Photographer & urban explorer" },
      statements: [
        { text: "I've been inside 50 abandoned buildings", isLie: false },
        { text: "My photo was used as a phone wallpaper by Samsung", isLie: true },
        { text: "I once got locked inside a cemetery overnight", isLie: false },
      ],
    },
    {
      person: { name: "Ash", age: 28, photo: "https://i.pravatar.cc/120?img=3", emoji: "🎲", tagline: "Board game designer & cat person" },
      statements: [
        { text: "I've designed a board game that sold 10k copies", isLie: false },
        { text: "I have 4 cats all named after board games", isLie: false },
        { text: "I've never lost at Monopoly", isLie: true },
      ],
    },
    {
      person: { name: "Sam", age: 29, photo: "https://i.pravatar.cc/120?img=11", emoji: "🏕️", tagline: "Wilderness guide & storyteller" },
      statements: [
        { text: "I once lived off-grid for 3 months", isLie: false },
        { text: "I've encountered a bear in the wild 4 times", isLie: false },
        { text: "I've never used a GPS while hiking", isLie: true },
      ],
    },
    {
      person: { name: "Noa", age: 21, photo: "https://i.pravatar.cc/120?img=16", emoji: "🎤", tagline: "Stand-up comic & podcast host" },
      statements: [
        { text: "I bombed on stage so hard, I got a standing ovation", isLie: false },
        { text: "My podcast has over 1 million downloads", isLie: true },
        { text: "I've opened for a famous comedian at a comedy club", isLie: false },
      ],
    },
    {
      person: { name: "Jess", age: 25, photo: "https://i.pravatar.cc/120?img=5", emoji: "🧁", tagline: "Baker & marathon runner" },
      statements: [
        { text: "I bake a different cake every week for strangers", isLie: false },
        { text: "I've run 7 marathons on 7 continents", isLie: true },
        { text: "I once made a wedding cake for 500 guests", isLie: false },
      ],
    },
  ],
  business: [
    {
      person: { name: "Alex", age: 32, photo: "https://i.pravatar.cc/120?img=3", emoji: "📊", tagline: "Data scientist & angel investor" },
      statements: [
        { text: "I've invested in 15 startups, 3 became unicorns", isLie: true },
        { text: "I built an ML model that predicted stock trends", isLie: false },
        { text: "I dropped out of an MBA program to start coding", isLie: false },
      ],
    },
    {
      person: { name: "Nina", age: 28, photo: "https://i.pravatar.cc/120?img=23", emoji: "🚀", tagline: "Startup founder & TEDx speaker" },
      statements: [
        { text: "My startup was acquired for $10M at age 25", isLie: true },
        { text: "I've given a TEDx talk on imposter syndrome", isLie: false },
        { text: "I was rejected by 50 investors before getting funded", isLie: false },
      ],
    },
    {
      person: { name: "Derek", age: 35, photo: "https://i.pravatar.cc/120?img=7", emoji: "💼", tagline: "Corporate strategist & author" },
      statements: [
        { text: "I wrote a business book that hit the NYT list", isLie: false },
        { text: "I've consulted for 3 Fortune 500 companies", isLie: false },
        { text: "I've never been fired from a job", isLie: true },
      ],
    },
    {
      person: { name: "Priya", age: 27, photo: "https://i.pravatar.cc/120?img=26", emoji: "💡", tagline: "UX designer & accessibility advocate" },
      statements: [
        { text: "I redesigned a government website used by millions", isLie: false },
        { text: "I hold a patent for a haptic feedback interface", isLie: true },
        { text: "I taught UX design at a bootcamp for 2 years", isLie: false },
      ],
    },
    {
      person: { name: "Omar", age: 30, photo: "https://i.pravatar.cc/120?img=11", emoji: "🌐", tagline: "Web3 builder & community leader" },
      statements: [
        { text: "I launched a DAO with 5,000 members", isLie: false },
        { text: "I've minted an NFT collection that sold out in minutes", isLie: false },
        { text: "I predicted Bitcoin would hit $100k in 2021", isLie: true },
      ],
    },
    {
      person: { name: "Lena", age: 29, photo: "https://i.pravatar.cc/120?img=9", emoji: "📱", tagline: "Product manager & side hustler" },
      statements: [
        { text: "I've launched 4 apps, 2 hit #1 in the App Store", isLie: true },
        { text: "My side hustle makes more than my day job", isLie: false },
        { text: "I've managed a product with 10M daily active users", isLie: false },
      ],
    },
    {
      person: { name: "Ryan", age: 33, photo: "https://i.pravatar.cc/120?img=12", emoji: "🎯", tagline: "Sales director & mentor" },
      statements: [
        { text: "I closed a $5M deal on my first day as director", isLie: true },
        { text: "I mentor 12 junior salespeople every quarter", isLie: false },
        { text: "I once cold-called 200 prospects in a single day", isLie: false },
      ],
    },
    {
      person: { name: "Tara", age: 26, photo: "https://i.pravatar.cc/120?img=16", emoji: "🧬", tagline: "Biotech researcher & entrepreneur" },
      statements: [
        { text: "I co-authored a paper published in Nature", isLie: false },
        { text: "I founded a biotech startup valued at $50M", isLie: true },
        { text: "I've worked in labs on 3 different continents", isLie: false },
      ],
    },
    {
      person: { name: "Victor", age: 31, photo: "https://i.pravatar.cc/120?img=33", emoji: "🏗️", tagline: "Civil engineer & sustainability advocate" },
      statements: [
        { text: "I've designed bridges in 4 countries", isLie: false },
        { text: "I hold 2 patents for green building materials", isLie: false },
        { text: "I've never visited a construction site", isLie: true },
      ],
    },
    {
      person: { name: "Clara", age: 28, photo: "https://i.pravatar.cc/120?img=5", emoji: "📝", tagline: "Content strategist & newsletter guru" },
      statements: [
        { text: "My newsletter has 100k subscribers", isLie: false },
        { text: "I ghost-wrote a bestselling CEO's autobiography", isLie: true },
        { text: "I've worked with brands like Nike and Airbnb", isLie: false },
      ],
    },
  ],
};

const TOTAL_ROUNDS = 7;
const TIME_PER_ROUND = 20;

/* ─────────────────────────────────────────────
   Theme Configuration (PRESERVED + Enhanced)
   ───────────────────────────────────────────── */

const themes: Record<Category, { gradient: string; text: string; accent: string; bg: string; glow: string; orbColors: string[] }> = {
  dating: { gradient: "from-pink-500 via-rose-500 to-red-500", text: "text-pink-400", accent: "border-pink-500/30", bg: "bg-pink-500/10", glow: "shadow-pink-500/20", orbColors: ["#ec4899", "#f43f5e", "#fb7185", "#f472b6", "#e879f9"] },
  friends: { gradient: "from-emerald-500 via-teal-500 to-cyan-500", text: "text-emerald-400", accent: "border-emerald-500/30", bg: "bg-emerald-500/10", glow: "shadow-emerald-500/20", orbColors: ["#10b981", "#14b8a6", "#06b6d4", "#34d399", "#2dd4bf"] },
  business: { gradient: "from-blue-500 via-indigo-500 to-purple-500", text: "text-blue-400", accent: "border-blue-500/30", bg: "bg-blue-500/10", glow: "shadow-blue-500/20", orbColors: ["#3b82f6", "#6366f1", "#8b5cf6", "#818cf8", "#a78bfa"] },
};

/* ─────────────────────────────────────────────
   SVG Noise Filter
   ───────────────────────────────────────────── */

const NoiseOverlay = () => (
  <div className="pointer-events-none fixed inset-0 z-[100]" style={{ opacity: 0.03 }}>
    <svg width="100%" height="100%">
      <filter id="tt-noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#tt-noise)" />
    </svg>
  </div>
);

/* ─────────────────────────────────────────────
   Floating Background Orbs
   ───────────────────────────────────────────── */

const FloatingOrbs = ({ colors }: { colors: string[] }) => {
  const orbs = useMemo(() =>
    colors.map((color, i) => ({
      id: i,
      color,
      size: 180 + Math.random() * 200,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 18 + Math.random() * 14,
      delay: i * 1.5,
    })), [colors]
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            background: `radial-gradient(circle, ${orb.color}18 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
          animate={{
            x: [0, 80, -60, 40, 0],
            y: [0, -70, 50, -30, 0],
            scale: [1, 1.2, 0.9, 1.1, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Ambient Dust Motes
   ───────────────────────────────────────────── */

const DustMotes = () => {
  const motes = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => ({
      id: i,
      size: 2 + Math.random() * 3,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 12 + Math.random() * 18,
      delay: Math.random() * 8,
      opacity: 0.15 + Math.random() * 0.25,
    })), []
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[1]">
      {motes.map((m) => (
        <motion.div
          key={m.id}
          className="absolute rounded-full bg-white"
          style={{ width: m.size, height: m.size, left: `${m.x}%`, top: `${m.y}%` }}
          animate={{
            y: [0, -40, 20, -60, 0],
            x: [0, 25, -15, 30, 0],
            opacity: [m.opacity, m.opacity * 1.5, m.opacity * 0.5, m.opacity * 1.2, m.opacity],
          }}
          transition={{ duration: m.duration, repeat: Infinity, ease: "easeInOut", delay: m.delay }}
        />
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Cinematic Letterbox Countdown
   ───────────────────────────────────────────── */

const CinematicCountdown = ({ value }: { value: number }) => {
  const label = value === 0 ? "GO!" : String(value);
  const isGo = value === 0;

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative">
      {/* Letterbox bars */}
      <motion.div
        className="absolute top-0 left-0 right-0 bg-black z-10"
        initial={{ height: 0 }}
        animate={{ height: "12%" }}
        transition={{ duration: 0.4 }}
      />
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-black z-10"
        initial={{ height: 0 }}
        animate={{ height: "12%" }}
        transition={{ duration: 0.4 }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ scale: 3, opacity: 0, rotateX: -90 }}
          animate={{ scale: 1, opacity: 1, rotateX: 0 }}
          exit={{ scale: 0.3, opacity: 0, rotateX: 90, filter: "blur(12px)" }}
          transition={{ type: "spring", stiffness: 200, damping: 18, duration: 0.5 }}
          className="relative z-20"
        >
          <span
            className={`text-9xl font-black tracking-tight ${
              isGo
                ? "bg-gradient-to-r from-emerald-400 via-cyan-300 to-teal-400 bg-clip-text text-transparent"
                : "bg-gradient-to-b from-white via-slate-200 to-slate-500 bg-clip-text text-transparent"
            }`}
          >
            {label}
          </span>
          {/* Glow ring */}
          <motion.div
            className="absolute inset-0 -m-8 rounded-full"
            style={{
              background: isGo
                ? "radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
            }}
            animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </motion.div>
      </AnimatePresence>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        className="text-xs text-slate-500 font-bold mt-12 uppercase tracking-[0.3em] z-20"
      >
        {isGo ? "Spot the faker!" : "Get ready…"}
      </motion.p>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Glassmorphic Statement Card
   ───────────────────────────────────────────── */

interface StatementCardProps {
  stmt: Statement;
  idx: number;
  showResult: boolean;
  isSelected: boolean;
  onSelect: (idx: number) => void;
  roundIntensity: number;
}

const StatementCard = ({ stmt, idx, showResult, isSelected, onSelect, roundIntensity }: StatementCardProps) => {
  const isLie = stmt.isLie;
  const springConfig = { type: "spring" as const, stiffness: 300 + roundIntensity * 40, damping: 20 };

  // Determine visual state
  let borderColor = "border-white/[0.08]";
  let bgStyle = "bg-white/[0.04] backdrop-blur-xl";
  let glowShadow = "";
  let labelText = "";
  let labelIcon: React.ReactNode = null;

  if (showResult) {
    if (isLie) {
      borderColor = "border-red-500/50";
      bgStyle = "bg-red-500/[0.08] backdrop-blur-xl";
      glowShadow = "shadow-[0_0_30px_rgba(239,68,68,0.2)]";
      labelText = "THE LIE";
      labelIcon = <ThumbsDown className="w-4 h-4 text-red-400" />;
    } else {
      borderColor = "border-emerald-500/30";
      bgStyle = "bg-emerald-500/[0.04] backdrop-blur-xl";
      glowShadow = "shadow-[0_0_20px_rgba(16,185,129,0.1)]";
      labelText = "TRUTH";
      labelIcon = <ThumbsUp className="w-4 h-4 text-emerald-400" />;
    }
    if (isSelected) {
      if (isLie) {
        borderColor = "border-emerald-400/60";
        bgStyle = "bg-emerald-500/[0.12] backdrop-blur-xl";
        glowShadow = "shadow-[0_0_40px_rgba(16,185,129,0.25)]";
      } else {
        borderColor = "border-red-400/60";
        bgStyle = "bg-red-500/[0.12] backdrop-blur-xl";
        glowShadow = "shadow-[0_0_40px_rgba(239,68,68,0.25)]";
      }
    }
  }

  const numberGradient = showResult
    ? isLie
      ? "from-red-500 to-rose-600"
      : "from-emerald-500 to-teal-600"
    : "from-violet-500 to-fuchsia-600";

  return (
    <motion.button
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...springConfig, delay: idx * 0.12 }}
      whileHover={!showResult ? { scale: 1.02, y: -2 } : {}}
      whileTap={!showResult ? { scale: 0.97 } : {}}
      onClick={() => !showResult && onSelect(idx)}
      disabled={showResult}
      className={`w-full text-left rounded-2xl p-4 border transition-all duration-300 ${borderColor} ${bgStyle} ${glowShadow} relative overflow-hidden group`}
    >
      {/* Hover shimmer for unselected */}
      {!showResult && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent pointer-events-none" />
      )}

      {/* Reveal overlay icons */}
      {showResult && isLie && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.08 }}
          transition={{ delay: 0.3 }}
          className="absolute right-4 top-1/2 -translate-y-1/2"
        >
          <XCircle className="w-16 h-16 text-red-400" />
        </motion.div>
      )}
      {showResult && !isLie && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.06 }}
          transition={{ delay: 0.3 }}
          className="absolute right-4 top-1/2 -translate-y-1/2"
        >
          <CheckCircle2 className="w-16 h-16 text-emerald-400" />
        </motion.div>
      )}

      <div className="flex items-start gap-3 relative z-10">
        {/* Number indicator with gradient */}
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${numberGradient} flex items-center justify-center text-xs font-black text-white shrink-0 mt-0.5 shadow-lg`}>
          {showResult ? (labelIcon || (idx + 1)) : (idx + 1)}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-relaxed ${showResult ? (isLie ? "text-red-300" : "text-emerald-300/80") : "text-slate-200"}`}>
            "{stmt.text}"
          </p>
          {showResult && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`text-[10px] font-black uppercase tracking-wider mt-1.5 ${isLie ? "text-red-400" : "text-emerald-500"}`}
            >
              {labelText}
              {isSelected && (
                <span className={`ml-2 ${isLie ? "text-emerald-400" : "text-red-400"}`}>
                  ← Your pick {isLie ? "✓ Correct!" : "✗ Wrong"}
                </span>
              )}
            </motion.p>
          )}
        </div>
      </div>
    </motion.button>
  );
};

/* ─────────────────────────────────────────────
   Animated Score Display (Spring Physics)
   ───────────────────────────────────────────── */

const AnimatedScore = ({ value, className }: { value: number; className?: string }) => {
  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, { stiffness: 80, damping: 20 });
  const display = useTransform(springVal, (v) => Math.round(v));
  const [displayStr, setDisplayStr] = useState("0");

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  useEffect(() => {
    const unsub = display.on("change", (v) => setDisplayStr(String(v)));
    return unsub;
  }, [display]);

  return <span className={className}>{displayStr}</span>;
};

/* ─────────────────────────────────────────────
   Victory Rays Effect
   ───────────────────────────────────────────── */

const VictoryRays = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none z-0"
    initial={{ opacity: 0, rotate: 0 }}
    animate={{ opacity: [0, 0.15, 0.08], rotate: 360 }}
    transition={{ opacity: { duration: 1.5 }, rotate: { duration: 30, repeat: Infinity, ease: "linear" } }}
    style={{
      background: "conic-gradient(from 0deg, transparent, rgba(16,185,129,0.1), transparent, rgba(16,185,129,0.08), transparent, rgba(16,185,129,0.1), transparent)",
    }}
  />
);

/* ─────────────────────────────────────────────
   Screen Shake Wrapper
   ───────────────────────────────────────────── */

const ScreenShake = ({ active, children }: { active: boolean; children: React.ReactNode }) => (
  <motion.div
    animate={active ? { x: [0, -6, 6, -4, 4, -2, 2, 0], y: [0, 3, -3, 2, -2, 1, -1, 0] } : {}}
    transition={{ duration: 0.5 }}
    className="w-full h-full"
  >
    {children}
  </motion.div>
);

/* ─────────────────────────────────────────────
   Radial Wipe Transition
   ───────────────────────────────────────────── */

const RadialWipe = ({ active }: { active: boolean }) => (
  <AnimatePresence>
    {active && (
      <motion.div
        className="fixed inset-0 z-[200] pointer-events-none"
        initial={{ clipPath: "circle(0% at 50% 50%)" }}
        animate={{ clipPath: "circle(150% at 50% 50%)" }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{ background: "rgba(2, 6, 23, 0.95)" }}
      />
    )}
  </AnimatePresence>
);

/* ─────────────────────────────────────────────
   Particle Burst Effect
   ───────────────────────────────────────────── */

const ParticleBurst = ({ active }: { active: boolean }) => {
  const particles = useMemo(() =>
    Array.from({ length: 16 }, (_, i) => ({
      id: i,
      angle: (i / 16) * Math.PI * 2,
      distance: 60 + Math.random() * 80,
      size: 3 + Math.random() * 5,
      color: ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#fbbf24", "#fcd34d"][Math.floor(Math.random() * 6)],
    })), []
  );

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      ))}
    </div>
  );
};

/* ═════════════════════════════════════════════
   MAIN COMPONENT
   ═════════════════════════════════════════════ */

export default function TwoTruths({ onBack, category = "dating" }: TwoTruthsProps) {
  const theme = themes[category];
  const [phase, setPhase] = useState<"intro" | "countdown" | "playing" | "review" | "results">("intro");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_ROUND);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [playerResults, setPlayerResults] = useState<boolean[]>([]);
  const [countdown, setCountdown] = useState(3);
  const [shakeActive, setShakeActive] = useState(false);
  const [wipeActive, setWipeActive] = useState(false);
  const [burstActive, setBurstActive] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answeredRef = useRef(false);
  const currentRoundRef = useRef(0);
  const showResultRef = useRef(false);

  const r = rounds[currentRound];
  const roundIntensity = Math.min(currentRound / TOTAL_ROUNDS, 1);

  // Dynamic color temperature
  const tempClass = useMemo(() => {
    if (playerResults.length === 0) return "";
    const recent = playerResults.slice(-3);
    const wins = recent.filter(Boolean).length;
    if (wins >= 2) return ""; // warm - default
    return ""; // cool tones handled by category
  }, [playerResults]);

  // Init rounds (PRESERVED)
  useEffect(() => {
    if (phase !== "intro") return;
    const pool = [...ROUNDS_DATA[category]];
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, TOTAL_ROUNDS);
    const prepared = shuffled.map(round => ({
      ...round,
      statements: [...round.statements].sort(() => Math.random() - 0.5),
    }));
    setRounds(prepared);
  }, [phase, category]);

  // Countdown (PRESERVED)
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

  // Round timer (PRESERVED)
  useEffect(() => {
    if (phase !== "playing") return;
    if (showResultRef.current) return;

    setTimeLeft(TIME_PER_ROUND);
    setSelectedIdx(null);
    answeredRef.current = false;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (!answeredRef.current) {
            answeredRef.current = true;
            showResultRef.current = true;
            setPlayerResults(pr => [...pr, false]);
            setStreak(0);
            setShowResult(true);
            setShakeActive(true);
            setTimeout(() => setShakeActive(false), 600);
            setPhase("review");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, currentRound]);

  // Handle select (PRESERVED + effects)
  const handleSelect = useCallback((idx: number) => {
    if (answeredRef.current || !r) return;
    answeredRef.current = true;
    showResultRef.current = true;
    setSelectedIdx(idx);
    if (timerRef.current) clearInterval(timerRef.current);

    const isCorrect = r.statements[idx].isLie;
    setPlayerResults(prev => [...prev, isCorrect]);

    if (isCorrect) {
      const timeBonus = Math.round(timeLeft * 5);
      const streakBonus = streak * 15;
      setPlayerScore(prev => prev + 100 + timeBonus + streakBonus);
      setStreak(prev => {
        const ns = prev + 1;
        setBestStreak(bs => Math.max(bs, ns));
        return ns;
      });
      setBurstActive(true);
      setTimeout(() => setBurstActive(false), 900);
    } else {
      setStreak(0);
      setShakeActive(true);
      setTimeout(() => setShakeActive(false), 600);
    }

    setShowResult(true);
    setPhase("review");
  }, [r, timeLeft, streak]);

  // Handle next (PRESERVED + wipe)
  const handleNext = useCallback(() => {
    if (currentRoundRef.current + 1 >= TOTAL_ROUNDS) {
      setPhase("results");
    } else {
      setWipeActive(true);
      setTimeout(() => {
        showResultRef.current = false;
        answeredRef.current = false;
        setShowResult(false);
        setWipeActive(false);
        setCurrentRound(prev => {
          const next = prev + 1;
          currentRoundRef.current = next;
          return next;
        });
        setPhase("playing");
      }, 400);
    }
  }, []);

  // Handle restart (PRESERVED)
  const handleRestart = () => {
    setPhase("intro");
    setRounds([]);
    setCurrentRound(0);
    currentRoundRef.current = 0;
    showResultRef.current = false;
    answeredRef.current = false;
    setTimeLeft(TIME_PER_ROUND);
    setSelectedIdx(null);
    setShowResult(false);
    setPlayerScore(0);
    setStreak(0);
    setBestStreak(0);
    setPlayerResults([]);
  };

  const timerColor = timeLeft <= 5 ? "text-red-400" : timeLeft <= 10 ? "text-amber-400" : "text-emerald-400";
  const timerBg = timeLeft <= 5 ? "bg-red-500/20 border-red-500/40" : timeLeft <= 10 ? "bg-amber-500/20 border-amber-500/40" : "bg-emerald-500/20 border-emerald-500/40";
  const correctCount = playerResults.filter(Boolean).length;

  return (
    <div className={`fixed inset-0 bg-slate-950 text-white overflow-hidden ${tempClass}`}>
      {/* ── Premium Background Layers ── */}
      <NoiseOverlay />
      <FloatingOrbs colors={theme.orbColors} />
      <DustMotes />
      <RadialWipe active={wipeActive} />

      <ScreenShake active={shakeActive}>
        {/* ── HEADER (Glassmorphic) ── */}
        <div className="fixed top-0 left-0 right-0 z-[60]" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
          <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.06] bg-white/[0.03] backdrop-blur-2xl">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.1] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-300" />
            </motion.button>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-black uppercase tracking-[0.2em] bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                Two Truths & a Lie
              </span>
            </div>
            {(phase === "playing" || phase === "review") ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] backdrop-blur-md">
                <span className="text-[10px] font-black bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Round {currentRound + 1}/{TOTAL_ROUNDS}
                </span>
              </div>
            ) : (
              <div style={{ width: "60px" }} />
            )}
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="absolute inset-0 flex flex-col" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 56px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

          {/* ── INTRO (Premium) ── */}
          {phase === "intro" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20 backdrop-blur-xl flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.15)]"
              >
                <span className="text-5xl">🤥</span>
              </motion.div>

              <div className="text-center max-w-xs">
                <h2 className="text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent mb-2 tracking-tight">
                  Two Truths & a Lie
                </h2>
                <p className="text-xs text-slate-400/80 leading-relaxed mb-6">
                  Meet new people! Read 3 statements about someone — two are true, one is a lie. Can you spot the faker?
                </p>
              </div>

              {/* How to play */}
              <div className="w-full max-w-xs space-y-3">
                {[
                  { icon: "👤", text: "Meet a new person each round" },
                  { icon: "📖", text: "Read their 3 statements carefully" },
                  { icon: "🔍", text: "Tap the one you think is the LIE" },
                  { icon: "⚡", text: "Faster = more points!" },
                ].map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.12, type: "spring", stiffness: 200, damping: 20 }}
                    className="flex items-center gap-3 bg-white/[0.03] backdrop-blur-xl rounded-xl px-4 py-3 border border-white/[0.06]"
                  >
                    <span className="text-lg">{step.icon}</span>
                    <span className="text-xs text-slate-300 font-medium">{step.text}</span>
                  </motion.div>
                ))}
              </div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, type: "spring" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPhase("countdown")}
                className="mt-4 px-10 py-4 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white font-black text-sm uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(139,92,246,0.3)] relative overflow-hidden group"
              >
                {/* Button shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="flex items-center gap-2 relative z-10">
                  <Sparkles className="w-5 h-5" />
                  Start Playing
                </span>
              </motion.button>
            </div>
          )}

          {/* ── COUNTDOWN (Cinematic) ── */}
          {phase === "countdown" && <CinematicCountdown value={countdown} />}

          {/* ── PLAYING / REVIEW ── */}
          {(phase === "playing" || phase === "review") && r && (
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
              {/* Top bar: score, timer, progress */}
              <div className="px-4 pt-3 pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <Trophy className={`w-4 h-4 ${theme.text}`} />
                    <AnimatedScore value={playerScore} className={`text-sm font-black ${theme.text}`} />
                    {streak > 1 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20"
                      >
                        🔥 {streak}x
                      </motion.span>
                    )}
                  </div>

                  <motion.div
                    animate={timeLeft <= 5 && !showResult ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full border backdrop-blur-md ${timerBg} ${showResult ? "opacity-50" : ""}`}
                  >
                    <Timer className={`w-3.5 h-3.5 ${timerColor}`} />
                    <span className={`text-sm font-black tabular-nums ${timerColor}`}>
                      {showResult ? "—" : timeLeft}
                    </span>
                  </motion.div>

                  <div className="flex gap-1 flex-1 justify-end">
                    {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={i === currentRound ? { scale: 0 } : {}}
                        animate={i === currentRound ? { scale: 1 } : {}}
                        transition={{ type: "spring", stiffness: 300 }}
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                          i < playerResults.length
                            ? playerResults[i] ? "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]" : "bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.5)]"
                            : i === currentRound ? "bg-violet-400 animate-pulse shadow-[0_0_6px_rgba(139,92,246,0.5)]" : "bg-slate-700/50"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Person card + statements */}
              <div className="flex flex-col items-center px-4 py-2 my-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentRound}
                    initial={{ x: 100, opacity: 0, filter: "blur(8px)" }}
                    animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                    exit={{ x: -100, opacity: 0, filter: "blur(8px)" }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    className="w-full max-w-md"
                  >
                    {/* Person header (Glassmorphic) */}
                    <div className="flex items-center gap-4 mb-5 bg-white/[0.04] backdrop-blur-xl rounded-2xl p-4 border border-white/[0.06]">
                      <div className="relative shrink-0">
                        {/* Avatar ring glow */}
                        <motion.div
                          className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-500/40 to-fuchsia-500/40"
                          animate={{ opacity: [0.4, 0.7, 0.4] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          style={{ filter: "blur(4px)" }}
                        />
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-violet-500/40 shadow-lg shadow-violet-500/10">
                          <img src={r.person.photo} alt={r.person.name} className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-white">{r.person.name}</h3>
                          <span className="text-sm">{r.person.emoji}</span>
                          <span className="text-xs text-slate-500 font-medium">{r.person.age}</span>
                        </div>
                        <p className="text-[11px] text-slate-400/80 font-medium mt-0.5">{r.person.tagline}</p>
                      </div>
                    </div>

                    {/* Instruction */}
                    {!showResult && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-[11px] font-bold uppercase tracking-[0.2em] mb-3"
                      >
                        <span className="text-slate-500">Tap the statement you think is the </span>
                        <span className="bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">LIE</span>
                      </motion.p>
                    )}

                    {/* Statements */}
                    <div className="space-y-3 relative">
                      <ParticleBurst active={burstActive} />
                      {r.statements.map((stmt, idx) => (
                        <StatementCard
                          key={idx}
                          stmt={stmt}
                          idx={idx}
                          showResult={showResult}
                          isSelected={selectedIdx === idx}
                          onSelect={handleSelect}
                          roundIntensity={roundIntensity}
                        />
                      ))}
                    </div>

                    {/* Result feedback (Glassmorphic) */}
                    {showResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="mt-4"
                      >
                        {selectedIdx !== null ? (
                          r.statements[selectedIdx].isLie ? (
                            <div className="bg-emerald-500/[0.08] backdrop-blur-xl border border-emerald-500/20 rounded-xl p-3.5 flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                              <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 0.5 }}
                              >
                                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                              </motion.div>
                              <div>
                                <p className="text-sm font-black text-emerald-400">Nice catch! 🎯</p>
                                <p className="text-[10px] text-emerald-400/60">+{100 + Math.round(timeLeft * 5) + streak * 15} points</p>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-red-500/[0.08] backdrop-blur-xl border border-red-500/20 rounded-xl p-3.5 flex items-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                              <XCircle className="w-6 h-6 text-red-400 shrink-0" />
                              <div>
                                <p className="text-sm font-black text-red-400">Fooled! 😅</p>
                                <p className="text-[10px] text-red-400/60">That was actually true</p>
                              </div>
                            </div>
                          )
                        ) : (
                          <div className="bg-amber-500/[0.08] backdrop-blur-xl border border-amber-500/20 rounded-xl p-3.5 flex items-center gap-3">
                            <Timer className="w-6 h-6 text-amber-400 shrink-0" />
                            <div>
                              <p className="text-sm font-black text-amber-400">Time's up! ⏰</p>
                              <p className="text-[10px] text-amber-400/60">The lie is highlighted in red</p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* ── REVIEW FOOTER (Glassmorphic) ── */}
          {showResult && r && phase === "review" && (
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="fixed bottom-0 left-0 right-0 z-[61] px-6 pb-6 pt-3 bg-white/[0.03] backdrop-blur-2xl border-t border-white/[0.06]"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(139,92,246,0.25)] relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                {currentRound + 1 >= TOTAL_ROUNDS ? (
                  <span className="flex items-center gap-2 relative z-10">
                    <Trophy className="w-5 h-5" />
                    See Results
                  </span>
                ) : (
                  <span className="flex items-center gap-2 relative z-10">
                    <Zap className="w-5 h-5" />
                    Next Person
                  </span>
                )}
              </motion.button>
            </motion.div>
          )}

          {/* ── RESULTS (Full Glassmorphic Overlay) ── */}
          {phase === "results" && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
              {correctCount >= 5 && <VictoryRays />}

              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 150, damping: 18 }}
                className="w-full max-w-sm relative"
              >
                {/* Rotating conic-gradient border */}
                <motion.div
                  className="absolute -inset-[1px] rounded-3xl z-0"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  style={{
                    background: "conic-gradient(from 0deg, #8b5cf6, #ec4899, #6366f1, #f43f5e, #8b5cf6)",
                    opacity: 0.4,
                    filter: "blur(1px)",
                  }}
                />
                <div className="relative z-10 bg-slate-950/90 backdrop-blur-2xl rounded-3xl border border-white/[0.06] p-6 space-y-5">
                  {/* Result header */}
                  <div className="-mt-6 -mx-6 px-6 py-5 rounded-t-3xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="text-5xl mb-2 relative z-10"
                    >
                      {correctCount >= 5 ? "🕵️" : correctCount >= 3 ? "🤔" : "🤥"}
                    </motion.div>
                    <h2 className="text-xl font-black text-white uppercase tracking-[0.15em] relative z-10">
                      {correctCount >= 5 ? "Lie Detector!" : correctCount >= 3 ? "Not Bad!" : "Easily Fooled!"}
                    </h2>
                    <p className="text-xs text-white/70 font-bold mt-1 relative z-10">
                      {correctCount >= 5
                        ? "You can see through anyone!"
                        : correctCount >= 3
                        ? "You've got some good instincts"
                        : "Better luck next time!"}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-center">
                    <AnimatedScore value={playerScore} className="text-5xl font-black bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent" />
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Total Points</p>
                  </div>

                  {/* Stats */}
                  <div className="flex justify-center gap-6 text-center">
                    <div className="px-3">
                      <p className={`text-lg font-black ${theme.text}`}>{correctCount}/{TOTAL_ROUNDS}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Detected</p>
                    </div>
                    <div className="w-px bg-white/[0.06]" />
                    <div className="px-3">
                      <p className={`text-lg font-black ${theme.text}`}>{bestStreak}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Best Streak</p>
                    </div>
                    <div className="w-px bg-white/[0.06]" />
                    <div className="px-3">
                      <p className={`text-lg font-black ${theme.text}`}>{Math.round((correctCount / TOTAL_ROUNDS) * 100)}%</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Accuracy</p>
                    </div>
                  </div>

                  {/* Progress dots */}
                  <div className="flex justify-center gap-2">
                    {playerResults.map((correct, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.08, type: "spring", stiffness: 400 }}
                        className={`w-3.5 h-3.5 rounded-full ${correct
                          ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                          : "bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]"}`}
                      />
                    ))}
                  </div>

                  {/* Buttons */}
                  <div className="space-y-2.5">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRestart}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(139,92,246,0.25)] relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      <span className="relative z-10 flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Play Again
                      </span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onBack}
                      className="w-full py-3.5 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] text-slate-400 font-bold text-sm hover:bg-white/[0.08] transition-colors"
                    >
                      Exit to Games
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </ScreenShake>
    </div>
  );
}
