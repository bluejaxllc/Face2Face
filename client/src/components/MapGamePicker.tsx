import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords, Brain, X, Gamepad2, Clock, ChevronRight,
  MessageCircleQuestion, Mountain, Radar, Flag, Smile,
  Sparkles, Zap, User, Shield, Loader2, Check, Crown
} from "lucide-react";

/* ════════════════════════════════════════════════════════════════
   TYPES & INTERFACES — PRESERVED EXACTLY
   ════════════════════════════════════════════════════════════════ */

type Category = "dating" | "friends" | "business";

interface MapGamePickerProps {
  opponent: {
    id: number;
    firstName: string;
    lastName: string;
    age: number;
    sex: string;
    profilePhoto?: string | null;
    category: string;
  };
  onSelectGame: (gameKey: string) => void;
  onClose: () => void;
  category?: Category;
}

interface GameOption {
  key: string;
  name: string;
  description: string;
  duration: string;
  icon: typeof Swords;
}

/* ════════════════════════════════════════════════════════════════
   GAMES ARRAY — PRESERVED EXACTLY
   ════════════════════════════════════════════════════════════════ */

const GAMES: GameOption[] = [
  {
    key: "bump-battle",
    name: "Bump Battle",
    description: "Test your reflexes in a 1v1 duel",
    duration: "~2 min",
    icon: Swords,
  },
  {
    key: "trivia-clash",
    name: "Trivia Clash",
    description: "Head-to-head quiz battle",
    duration: "~3 min",
    icon: Brain,
  },
  {
    key: "two-truths",
    name: "Two Truths",
    description: "Spot the lie in 3 statements",
    duration: "~3 min",
    icon: MessageCircleQuestion,
  },
  {
    key: "king-of-the-hill",
    name: "King of the Hill",
    description: "Tap fast to claim the territory",
    duration: "~2 min",
    icon: Mountain,
  },
  {
    key: "proximity-tag",
    name: "Proximity Tag",
    description: "Time your taps on the radar",
    duration: "~2 min",
    icon: Radar,
  },
  {
    key: "turf-wars",
    name: "Turf Wars",
    description: "Capture hex territories in 60s",
    duration: "~1 min",
    icon: Flag,
  },
  {
    key: "emoji-decode",
    name: "Emoji Decode",
    description: "Guess the emoji puzzle",
    duration: "~3 min",
    icon: Smile,
  },
];

/* ════════════════════════════════════════════════════════════════
   THEME MAP — PRESERVED EXACTLY
   ════════════════════════════════════════════════════════════════ */

const THEMES: Record<Category, {
  gradient: string;
  textAccent: string;
  bgAccent: string;
  borderAccent: string;
  iconBg: string;
  solidHex: string;
  secondHex: string;
  glowColor: string;
  glowSoft: string;
  glowMid: string;
}> = {
  dating: {
    gradient: "from-pink-500 via-rose-500 to-red-500",
    textAccent: "text-pink-400",
    bgAccent: "bg-pink-500/10",
    borderAccent: "border-pink-500/30",
    iconBg: "bg-pink-500/15",
    solidHex: "#ec4899",
    secondHex: "#f43f5e",
    glowColor: "rgba(236,72,153,0.5)",
    glowSoft: "rgba(236,72,153,0.12)",
    glowMid: "rgba(236,72,153,0.25)",
  },
  friends: {
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    textAccent: "text-emerald-400",
    bgAccent: "bg-emerald-500/10",
    borderAccent: "border-emerald-500/30",
    iconBg: "bg-emerald-500/15",
    solidHex: "#10b981",
    secondHex: "#14b8a6",
    glowColor: "rgba(16,185,129,0.5)",
    glowSoft: "rgba(16,185,129,0.12)",
    glowMid: "rgba(16,185,129,0.25)",
  },
  business: {
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    textAccent: "text-blue-400",
    bgAccent: "bg-blue-500/10",
    borderAccent: "border-blue-500/30",
    iconBg: "bg-blue-500/15",
    solidHex: "#3b82f6",
    secondHex: "#8b5cf6",
    glowColor: "rgba(59,130,246,0.5)",
    glowSoft: "rgba(59,130,246,0.12)",
    glowMid: "rgba(59,130,246,0.25)",
  },
};

/* Per-game accent colours for card glow differentiation */
const GAME_COLORS: Record<string, { primary: string; glow: string }> = {
  "bump-battle":      { primary: "#f97316", glow: "rgba(249,115,22,0.35)" },
  "trivia-clash":     { primary: "#a855f7", glow: "rgba(168,85,247,0.35)" },
  "two-truths":       { primary: "#06b6d4", glow: "rgba(6,182,212,0.35)" },
  "king-of-the-hill": { primary: "#eab308", glow: "rgba(234,179,8,0.35)" },
  "proximity-tag":    { primary: "#22d3ee", glow: "rgba(34,211,238,0.35)" },
  "turf-wars":        { primary: "#ef4444", glow: "rgba(239,68,68,0.35)" },
  "emoji-decode":     { primary: "#f472b6", glow: "rgba(244,114,182,0.35)" },
};

/* ════════════════════════════════════════════════════════════════
   SVG NOISE TEXTURE OVERLAY
   ════════════════════════════════════════════════════════════════ */

function NoiseTexture() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03] z-50">
      <filter id="noise-picker">
        <feTurbulence baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise-picker)" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════
   AMBIENT DUST MOTES — 10 floating particles
   ════════════════════════════════════════════════════════════════ */

function AmbientDustMotes({ color }: { color: string }) {
  const motes = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        size: 1.5 + Math.random() * 2.5,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: 6 + Math.random() * 8,
        delay: Math.random() * 4,
        opacity: 0.15 + Math.random() * 0.25,
      })),
    [],
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
      {motes.map((m) => (
        <motion.div
          key={m.id}
          className="absolute rounded-full"
          style={{
            width: m.size,
            height: m.size,
            left: `${m.x}%`,
            top: `${m.y}%`,
            background: color,
            filter: `blur(${m.size > 3 ? 1 : 0}px)`,
          }}
          animate={{
            y: [0, -30, -15, -45, 0],
            x: [0, 12, -8, 18, 0],
            opacity: [0, m.opacity, m.opacity * 0.6, m.opacity, 0],
          }}
          transition={{
            duration: m.duration,
            repeat: Infinity,
            delay: m.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   FLOATING BACKGROUND ORBS — 6 with complex motion paths
   ════════════════════════════════════════════════════════════════ */

function FloatingOrbs({ theme }: { theme: typeof THEMES.dating }) {
  const orbDefs = useMemo(
    () => [
      { color: theme.solidHex, size: 200, top: "-15%", right: "-8%", blur: 90, opacity: 0.18, dur: 9 },
      { color: theme.secondHex, size: 160, bottom: "5%", left: "-6%", blur: 70, opacity: 0.14, dur: 11 },
      { color: theme.solidHex, size: 120, top: "40%", right: "10%", blur: 60, opacity: 0.1, dur: 13 },
      { color: theme.secondHex, size: 100, top: "20%", left: "15%", blur: 50, opacity: 0.08, dur: 10 },
      { color: theme.solidHex, size: 80, bottom: "25%", right: "25%", blur: 45, opacity: 0.12, dur: 14 },
      { color: `${theme.solidHex}80`, size: 140, top: "60%", left: "40%", blur: 75, opacity: 0.09, dur: 12 },
    ],
    [theme],
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[0]">
      {orbDefs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            background: orb.color,
            filter: `blur(${orb.blur}px)`,
            opacity: orb.opacity,
            top: orb.top,
            bottom: (orb as any).bottom,
            left: (orb as any).left,
            right: (orb as any).right,
          }}
          animate={{
            x: [0, 35 * (i % 2 === 0 ? 1 : -1), -25 * (i % 2 === 0 ? 1 : -1), 15, 0],
            y: [0, 25, -20, 30, 0],
            scale: [1, 1.15, 0.85, 1.1, 1],
          }}
          transition={{
            duration: orb.dur,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.8,
          }}
        />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   UNIQUE ICON ANIMATION PER GAME — PRESERVED
   ════════════════════════════════════════════════════════════════ */

function AnimatedGameIcon({
  game,
  hovered,
  theme,
}: {
  game: GameOption;
  hovered: boolean;
  theme: typeof THEMES.dating;
}) {
  const Icon = game.icon;
  const key = game.key;
  const gameColor = GAME_COLORS[key]?.primary || theme.solidHex;
  const gameGlow = GAME_COLORS[key]?.glow || theme.glowSoft;

  const getAnimation = () => {
    switch (key) {
      case "bump-battle":
        return {
          animate: hovered
            ? { rotate: [0, 15, -15, 10, -10, 0], scale: [1, 1.15, 1.15, 1.1, 1.1, 1] }
            : { rotate: [0, 5, -5, 0] },
          transition: hovered
            ? { duration: 0.8, ease: "easeInOut" as const }
            : { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
        };
      case "trivia-clash":
        return {
          animate: hovered
            ? { scale: [1, 1.2, 0.95, 1.15, 1] }
            : { scale: [1, 1.08, 1], opacity: [1, 0.8, 1] },
          transition: hovered
            ? { duration: 0.6, ease: "easeOut" as const }
            : { duration: 2, repeat: Infinity, ease: "easeInOut" as const },
        };
      case "proximity-tag":
        return {
          animate: hovered
            ? { rotate: 360, scale: [1, 1.1, 1] }
            : { rotate: [0, 360] },
          transition: hovered
            ? { duration: 1, ease: "easeInOut" as const }
            : { duration: 4, repeat: Infinity, ease: "linear" as const },
        };
      case "turf-wars":
        return {
          animate: hovered
            ? { rotateZ: [0, 12, -12, 8, -8, 0] }
            : { rotateZ: [0, 6, -6, 0] },
          transition: hovered
            ? { duration: 0.7, ease: "easeInOut" as const }
            : { duration: 2.5, repeat: Infinity, ease: "easeInOut" as const },
        };
      case "king-of-the-hill":
        return {
          animate: hovered
            ? { y: [0, -4, 0], scale: [1, 1.1, 1] }
            : { y: [0, -2, 0] },
          transition: hovered
            ? { duration: 0.5, ease: "easeOut" as const }
            : { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
        };
      case "two-truths":
        return {
          animate: hovered
            ? { rotate: [0, -15, 15, -10, 10, 0] }
            : { rotate: [0, -5, 5, 0] },
          transition: hovered
            ? { duration: 0.6, ease: "easeInOut" as const }
            : { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const },
        };
      case "emoji-decode":
        return {
          animate: hovered
            ? { y: [0, -6, 0], rotate: [0, 10, -10, 0] }
            : { y: [0, -3, 0] },
          transition: hovered
            ? { duration: 0.5, ease: "easeOut" as const }
            : { duration: 2, repeat: Infinity, ease: "easeInOut" as const },
        };
      default:
        return {
          animate: { scale: [1, 1.05, 1] },
          transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const },
        };
    }
  };

  const anim = getAnimation();

  return (
    <motion.div animate={anim.animate} transition={anim.transition}>
      <Icon
        className="w-6 h-6 transition-all duration-300"
        style={{
          color: gameColor,
          filter: hovered
            ? `drop-shadow(0 0 12px ${gameGlow}) drop-shadow(0 0 4px ${gameGlow})`
            : `drop-shadow(0 0 4px ${gameGlow})`,
        }}
      />
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════
   TYPEWRITER TEXT — PRESERVED
   ════════════════════════════════════════════════════════════════ */

function TypewriterText({ text, theme }: { text: string; theme: typeof THEMES.dating }) {
  const [displayText, setDisplayText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setShowCursor(false), 2000);
      }
    }, 70);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span>
      <span
        style={{
          background: `linear-gradient(135deg, ${theme.solidHex}, ${theme.secondHex}, #fff)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {displayText}
      </span>
      {showCursor && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity }}
          style={{ color: theme.solidHex }}
        >
          |
        </motion.span>
      )}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════
   ANIMATED ELLIPSIS — PRESERVED
   ════════════════════════════════════════════════════════════════ */

function AnimatedEllipsis() {
  return (
    <span className="inline-flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
          className="text-slate-600"
        >
          .
        </motion.span>
      ))}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════
   LIGHTNING BOLT SVG — PRESERVED
   ════════════════════════════════════════════════════════════════ */

function LightningBolt({ color }: { color: string }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <Zap
        className="w-6 h-6"
        style={{
          color,
          filter: `drop-shadow(0 0 12px ${color}) drop-shadow(0 0 24px ${color})`,
        }}
      />
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════
   GLASSMORPHIC GAME CARD — PREMIUM UPGRADE
   ════════════════════════════════════════════════════════════════ */

function GameCard({
  game,
  theme,
  idx,
  onSelect,
  isRecommended,
  isSelected,
}: {
  game: GameOption;
  theme: typeof THEMES.dating;
  idx: number;
  onSelect: () => void;
  isRecommended: boolean;
  isSelected: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const gameAccent = GAME_COLORS[game.key] || { primary: theme.solidHex, glow: theme.glowSoft };
  const active = hovered || isSelected;

  return (
    <motion.button
      initial={{ opacity: 0, x: 60, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        delay: 0.15 + idx * 0.08,
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
      className="w-full p-4 rounded-2xl flex items-center gap-4 text-left relative overflow-hidden transition-all duration-300"
      style={{
        background: active
          ? `linear-gradient(135deg, rgba(30,41,59,0.85), rgba(15,23,42,0.92))`
          : "rgba(15,23,42,0.55)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: isSelected
          ? `1.5px solid ${gameAccent.primary}80`
          : `1px solid ${active ? theme.glowMid : "rgba(255,255,255,0.06)"}`,
        boxShadow: isSelected
          ? `0 0 30px ${gameAccent.glow}, 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)`
          : active
            ? `0 8px 32px rgba(0,0,0,0.3), 0 0 40px ${theme.glowSoft}, inset 0 1px 0 rgba(255,255,255,0.06)`
            : "0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)",
        perspective: "800px",
        transformStyle: "preserve-3d",
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* RECOMMENDED badge */}
      {isRecommended && (
        <motion.div
          className="absolute -top-0.5 -right-0.5 z-30"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div
            className="px-2 py-0.5 text-[7px] font-black uppercase tracking-widest rounded-bl-lg rounded-tr-2xl flex items-center gap-0.5"
            style={{
              background: `linear-gradient(135deg, #fbbf24, #f59e0b)`,
              color: "#000",
              boxShadow: "0 2px 12px rgba(245,158,11,0.4)",
            }}
          >
            <Crown className="w-2.5 h-2.5" />
            Recommended
          </div>
        </motion.div>
      )}

      {/* Selected checkmark badge */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            className="absolute top-2 left-2 z-30"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${gameAccent.primary}, ${theme.solidHex})`,
                boxShadow: `0 0 12px ${gameAccent.glow}`,
              }}
            >
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover deep gradient overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background: `linear-gradient(135deg, ${theme.glowSoft}, transparent 50%, ${gameAccent.glow})`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Rotating conic-gradient border */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: isSelected
            ? `conic-gradient(from 0deg, ${gameAccent.primary}60, transparent 20%, ${theme.secondHex}60, transparent 40%, ${gameAccent.primary}40, transparent 60%, ${theme.solidHex}60, transparent 80%)`
            : `conic-gradient(from 0deg, transparent 25%, ${theme.solidHex}30, transparent 40%, ${theme.secondHex}30, transparent 55%, ${theme.solidHex}20, transparent 75%)`,
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          padding: "1px",
          borderRadius: "1rem",
          opacity: isSelected ? 1 : active ? 0.7 : 0.3,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: isSelected ? 4 : 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Selection pulse ring */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ border: `2px solid ${gameAccent.primary}` }}
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 1.04 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {/* Icon with glow ring + unique animation */}
      <div className="relative flex-shrink-0">
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{
            background: `radial-gradient(circle, ${gameAccent.glow} 0%, transparent 70%)`,
          }}
          initial={{ scale: 1.3, opacity: 0.4 }}
          animate={{
            scale: active ? [1.4, 1.9, 1.4] : [1.3, 1.5, 1.3],
            opacity: active ? [0.5, 0.9, 0.5] : [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center relative z-10 transition-all duration-300"
          style={{
            background: active
              ? `linear-gradient(135deg, ${gameAccent.glow}, ${theme.glowMid})`
              : theme.glowSoft,
            border: `1px solid ${isSelected ? gameAccent.primary + "80" : theme.glowMid}`,
            boxShadow: active
              ? `0 0 24px ${gameAccent.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`
              : "none",
          }}
        >
          <AnimatedGameIcon game={game} hovered={active} theme={theme} />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 relative z-10">
        <h3
          className="text-sm font-black uppercase tracking-wider"
          style={{
            letterSpacing: "0.15em",
            color: isSelected ? gameAccent.primary : active ? theme.solidHex : "#e2e8f0",
            transition: "color 0.3s",
            textShadow: isSelected ? `0 0 12px ${gameAccent.glow}` : "none",
          }}
        >
          {game.name}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5 truncate">
          {game.description}
        </p>
        <div className="flex items-center gap-1 mt-1.5">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Clock className="w-3 h-3 text-slate-600" />
          </motion.div>
          <motion.span
            className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
            style={{
              background: "rgba(30,41,59,0.6)",
              border: `1px solid ${isSelected ? gameAccent.primary + "40" : "rgba(71,85,105,0.3)"}`,
              color: isSelected ? gameAccent.primary : "#64748b",
              fontVariantNumeric: "tabular-nums",
            }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: idx * 0.2 }}
          >
            {game.duration}
          </motion.span>
        </div>
      </div>

      {/* Animated chevron arrow */}
      <motion.div
        className="flex-shrink-0 relative z-10"
        animate={{ x: active ? 4 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      >
        <ChevronRight
          className="w-5 h-5 transition-colors duration-300"
          style={{
            color: isSelected ? gameAccent.primary : active ? theme.solidHex : "#475569",
            filter: active ? `drop-shadow(0 0 8px ${gameAccent.glow})` : "none",
          }}
        />
      </motion.div>
    </motion.button>
  );
}

/* ════════════════════════════════════════════════════════════════
   SHIMMER BUTTON COMPONENT
   ════════════════════════════════════════════════════════════════ */

function ShimmerButton({
  children,
  onClick,
  disabled,
  loading,
  theme,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  theme: typeof THEMES.dating;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      className="relative w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-sm overflow-hidden transition-all duration-300"
      style={{
        background: disabled
          ? "rgba(30,41,59,0.5)"
          : `linear-gradient(135deg, ${theme.solidHex}, ${theme.secondHex})`,
        color: disabled ? "#475569" : "#fff",
        boxShadow: disabled
          ? "none"
          : `0 8px 32px ${theme.glowColor}, 0 0 60px ${theme.glowSoft}`,
        border: disabled
          ? "1px solid rgba(71,85,105,0.3)"
          : `1px solid ${theme.solidHex}60`,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, type: "spring", stiffness: 200, damping: 20 }}
    >
      {/* Shimmer sweep */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)`,
            backgroundSize: "200% 100%",
          }}
          animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Breathing glow ring */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{
            boxShadow: [
              `0 0 20px ${theme.glowSoft}`,
              `0 0 40px ${theme.glowMid}`,
              `0 0 20px ${theme.glowSoft}`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-4 h-4" />
            </motion.div>
            Sending Challenge...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            {children}
          </>
        )}
      </span>
    </motion.button>
  );
}

/* ════════════════════════════════════════════════════════════════
   AVATAR WITH ANIMATED GRADIENT RING
   ════════════════════════════════════════════════════════════════ */

function AvatarRing({
  src,
  fallback,
  sex,
  size = 72,
  theme,
}: {
  src?: string;
  fallback: string;
  sex: string;
  size?: number;
  theme: typeof THEMES.dating;
}) {
  const ringColor1 = sex === "female" ? "#ec4899" : "#3b82f6";
  const ringColor2 = sex === "female" ? "#f43f5e" : "#6366f1";

  return (
    <div className="relative" style={{ width: size + 8, height: size + 8 }}>
      {/* Animated gradient ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, ${ringColor1}, ${ringColor2}, transparent, ${ringColor1})`,
          padding: 3,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
      {/* Outer glow pulse */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        animate={{
          boxShadow: [
            `0 0 15px ${ringColor1}40`,
            `0 0 30px ${ringColor1}60`,
            `0 0 15px ${ringColor1}40`,
          ],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Avatar image */}
      <div
        className="absolute rounded-full overflow-hidden bg-slate-800 flex items-center justify-center"
        style={{
          top: 3,
          left: 3,
          width: size + 2,
          height: size + 2,
          border: "2px solid rgba(2,6,23,0.9)",
        }}
      >
        {src ? (
          <img src={src} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <span
            className="font-black text-lg"
            style={{
              background: `linear-gradient(135deg, ${ringColor1}, ${ringColor2})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {fallback}
          </span>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CHALLENGE BANNER — Breathing glow badge
   ════════════════════════════════════════════════════════════════ */

function ChallengeBanner({ theme }: { theme: typeof THEMES.dating }) {
  return (
    <motion.div
      className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full mx-auto"
      style={{
        background: `linear-gradient(135deg, ${theme.glowSoft}, ${theme.glowMid})`,
        border: `1px solid ${theme.solidHex}40`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 15 }}
    >
      <motion.div
        animate={{
          filter: [
            `drop-shadow(0 0 3px ${theme.glowSoft})`,
            `drop-shadow(0 0 8px ${theme.glowColor})`,
            `drop-shadow(0 0 3px ${theme.glowSoft})`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Shield className="w-3.5 h-3.5" style={{ color: theme.solidHex }} />
      </motion.div>
      <span
        className="text-[9px] font-black uppercase tracking-[0.2em]"
        style={{
          background: `linear-gradient(135deg, ${theme.solidHex}, ${theme.secondHex}, #fff)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Ready to Challenge
      </span>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CATEGORY PILL
   ════════════════════════════════════════════════════════════════ */

function CategoryPill({ category, theme }: { category: string; theme: typeof THEMES.dating }) {
  const label = category.charAt(0).toUpperCase() + category.slice(1);
  return (
    <motion.div
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
      style={{
        background: theme.glowSoft,
        border: `1px solid ${theme.solidHex}30`,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.45 }}
    >
      <motion.div
        className="w-1.5 h-1.5 rounded-full"
        style={{
          background: theme.solidHex,
          boxShadow: `0 0 6px ${theme.glowColor}`,
        }}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span
        className="text-[9px] font-bold uppercase tracking-widest"
        style={{ color: theme.solidHex }}
      >
        {label}
      </span>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════
   AGE BADGE — Frosted pill
   ════════════════════════════════════════════════════════════════ */

function AgeBadge({ age }: { age: number }) {
  return (
    <motion.div
      className="inline-flex items-center px-2.5 py-1 rounded-full"
      style={{
        background: "rgba(30,41,59,0.7)",
        border: "1px solid rgba(71,85,105,0.4)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 }}
    >
      <span className="text-[10px] font-bold text-slate-300 tracking-wide">
        {age} yrs
      </span>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT — MapGamePicker
   ════════════════════════════════════════════════════════════════ */

export default function MapGamePicker({
  opponent,
  onSelectGame,
  onClose,
  category,
}: MapGamePickerProps) {
  const resolvedCategory: Category =
    category || (opponent.category as Category) || "dating";
  const theme = THEMES[resolvedCategory];

  const initials = `${opponent.firstName[0]}${(opponent.lastName || "")[0] || ""}`.toUpperCase();
  const avatarUrl = opponent.profilePhoto || undefined;

  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Pick a random recommended game index
  const recommendedIdx = useMemo(
    () => Math.floor(Math.random() * GAMES.length),
    [],
  );

  // Handle game selection — toggle or set
  const handleSelectGame = useCallback((gameKey: string) => {
    setSelectedGame((prev) => (prev === gameKey ? null : gameKey));
  }, []);

  // Handle challenge — trigger loading + fire onSelectGame
  const handleChallenge = useCallback(() => {
    if (!selectedGame) return;
    setIsLoading(true);
    // Small delay for UX feedback, then fire the real handler
    setTimeout(() => {
      onSelectGame(selectedGame);
    }, 400);
  }, [selectedGame, onSelectGame]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[4000]">
        {/* ── Backdrop ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
          style={{
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
          onClick={onClose}
        />

        {/* ── Bottom Sheet ── */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{
            type: "spring",
            damping: 28,
            stiffness: 280,
            mass: 0.85,
          }}
          className="absolute bottom-0 left-0 right-0 rounded-t-3xl shadow-2xl overflow-hidden"
          style={{
            background: "rgba(2,6,23,0.95)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            boxShadow: `0 -8px 60px rgba(0,0,0,0.5), 0 0 80px ${theme.glowSoft}`,
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {/* SVG Noise Texture */}
          <NoiseTexture />

          {/* Floating Background Orbs */}
          <FloatingOrbs theme={theme} />

          {/* Ambient Dust Motes */}
          <AmbientDustMotes color={theme.solidHex} />

          {/* ── Drag Handle ── */}
          <div className="flex justify-center pt-3 pb-1 relative z-10">
            <motion.div
              className="w-10 h-1.5 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${theme.solidHex}60, ${theme.secondHex}60)`,
              }}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 40, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
            />
          </div>

          {/* ── Close Button — Glassmorphic ── */}
          <motion.button
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              delay: 0.3,
              type: "spring",
              stiffness: 200,
              damping: 15,
            }}
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center z-20"
            style={{
              background: "rgba(30,41,59,0.75)",
              border: "1px solid rgba(71,85,105,0.5)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
            whileHover={{
              scale: 1.1,
              boxShadow: `0 0 20px ${theme.glowSoft}`,
            }}
            whileTap={{ scale: 0.85 }}
          >
            <X className="w-4 h-4 text-slate-400" />
          </motion.button>

          {/* ── Content ── */}
          <div className="px-5 pt-2 pb-4 relative z-10">
            {/* ═══ Opponent Profile Section ═══ */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
              className="flex flex-col items-center mb-5"
            >
              {/* VS Row: You — Lightning — Opponent */}
              <div className="flex items-center justify-center gap-4 mb-3">
                {/* Player Avatar (You) */}
                <motion.div
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="relative"
                >
                  <motion.div
                    className="absolute -inset-1 rounded-full"
                    style={{
                      background: `conic-gradient(from 0deg, ${theme.solidHex}60, transparent, ${theme.secondHex}60, transparent)`,
                    }}
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <div
                    className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center relative z-10 overflow-hidden"
                    style={{
                      border: `2px solid ${theme.glowMid}`,
                      boxShadow: `0 0 20px ${theme.glowSoft}`,
                    }}
                  >
                    <User className="w-6 h-6 text-slate-400" />
                  </div>
                </motion.div>

                {/* Lightning VS */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.35, type: "spring", stiffness: 300 }}
                  className="flex flex-col items-center"
                >
                  <LightningBolt color={theme.solidHex} />
                  <span
                    className="text-[8px] font-black uppercase tracking-widest mt-0.5"
                    style={{
                      color: theme.solidHex,
                      textShadow: `0 0 8px ${theme.glowColor}`,
                    }}
                  >
                    VS
                  </span>
                </motion.div>

                {/* Opponent Avatar — Larger with gradient ring */}
                <motion.div
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <AvatarRing
                    src={avatarUrl}
                    fallback={initials}
                    sex={opponent.sex}
                    size={64}
                    theme={theme}
                  />
                </motion.div>
              </div>

              {/* Opponent Name — Gradient text */}
              <motion.h3
                className="text-xl font-black uppercase tracking-wider text-center"
                style={{
                  letterSpacing: "0.12em",
                  background: `linear-gradient(135deg, #fff, ${theme.solidHex}, ${theme.secondHex})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                {opponent.firstName} {opponent.lastName}
              </motion.h3>

              {/* Badges Row: Age + Category */}
              <motion.div
                className="flex items-center gap-2 mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <AgeBadge age={opponent.age} />
                <CategoryPill category={resolvedCategory} theme={theme} />
              </motion.div>

              {/* Challenge Banner */}
              <div className="mt-3">
                <ChallengeBanner theme={theme} />
              </div>
            </motion.div>

            {/* ═══ Typewriter Header ═══ */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-4"
            >
              <h2
                className="text-lg font-black uppercase"
                style={{ letterSpacing: "0.15em" }}
              >
                <TypewriterText text="Choose your battle" theme={theme} />
              </h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1"
              >
                Challenge{" "}
                <span style={{ color: theme.solidHex }}>
                  {opponent.firstName}
                </span>
              </motion.p>
            </motion.div>

            {/* ═══ Section Label — gradient text with sparkle ═══ */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex items-center gap-2 mb-3"
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Sparkles
                  className="w-3.5 h-3.5"
                  style={{
                    color: theme.solidHex,
                    filter: `drop-shadow(0 0 6px ${theme.glowColor})`,
                  }}
                />
              </motion.div>
              <span
                className="text-[10px] font-black uppercase"
                style={{
                  letterSpacing: "0.25em",
                  background: `linear-gradient(135deg, ${theme.solidHex}, ${theme.secondHex}, #fff)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Available Games
              </span>
              <Gamepad2
                className="w-3 h-3"
                style={{ color: theme.solidHex, opacity: 0.4 }}
              />
            </motion.div>

            {/* ═══ Game Cards — staggered from right ═══ */}
            <div
              className="space-y-2.5 max-h-[42vh] overflow-y-auto pr-1"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: `${theme.glowMid} transparent`,
                perspective: "1000px",
              }}
            >
              {GAMES.map((game, idx) => (
                <GameCard
                  key={game.key}
                  game={game}
                  theme={theme}
                  idx={idx}
                  onSelect={() => handleSelectGame(game.key)}
                  isRecommended={idx === recommendedIdx}
                  isSelected={selectedGame === game.key}
                />
              ))}
            </div>

            {/* ═══ Footer: "More games coming soon..." ═══ */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-center mt-3 mb-3"
            >
              <p
                className="text-[9px] font-medium"
                style={{ color: "#475569" }}
              >
                More games coming soon
                <AnimatedEllipsis />
              </p>
            </motion.div>

            {/* ═══ Challenge Button — Shimmer with breathing glow ═══ */}
            <ShimmerButton
              onClick={handleChallenge}
              disabled={!selectedGame}
              loading={isLoading}
              theme={theme}
            >
              {selectedGame
                ? `Challenge with ${GAMES.find((g) => g.key === selectedGame)?.name}`
                : "Select a Game"}
            </ShimmerButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
