import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Brain, X, Gamepad2, Clock, ChevronRight, MessageCircleQuestion, Mountain, Radar, Flag, Smile, Sparkles, Zap, User } from "lucide-react";

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

/* ── Unique icon animation per game ── */
function AnimatedGameIcon({ game, hovered, theme }: { game: GameOption; hovered: boolean; theme: typeof THEMES.dating }) {
  const Icon = game.icon;
  const key = game.key;

  const getAnimation = () => {
    switch (key) {
      case "bump-battle":
        // Swords cross/uncross
        return {
          animate: hovered
            ? { rotate: [0, 15, -15, 10, -10, 0], scale: [1, 1.15, 1.15, 1.1, 1.1, 1] }
            : { rotate: [0, 5, -5, 0] },
          transition: hovered
            ? { duration: 0.8, ease: "easeInOut" }
            : { duration: 3, repeat: Infinity, ease: "easeInOut" },
        };
      case "trivia-clash":
        // Brain pulses
        return {
          animate: hovered
            ? { scale: [1, 1.2, 0.95, 1.15, 1] }
            : { scale: [1, 1.08, 1], opacity: [1, 0.8, 1] },
          transition: hovered
            ? { duration: 0.6, ease: "easeOut" }
            : { duration: 2, repeat: Infinity, ease: "easeInOut" },
        };
      case "proximity-tag":
        // Radar sweeps
        return {
          animate: hovered
            ? { rotate: 360, scale: [1, 1.1, 1] }
            : { rotate: [0, 360] },
          transition: hovered
            ? { duration: 1, ease: "easeInOut" }
            : { duration: 4, repeat: Infinity, ease: "linear" },
        };
      case "turf-wars":
        // Flag waves
        return {
          animate: hovered
            ? { rotateZ: [0, 12, -12, 8, -8, 0] }
            : { rotateZ: [0, 6, -6, 0] },
          transition: hovered
            ? { duration: 0.7, ease: "easeInOut" }
            : { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
        };
      case "king-of-the-hill":
        // Mountain tremor
        return {
          animate: hovered
            ? { y: [0, -4, 0], scale: [1, 1.1, 1] }
            : { y: [0, -2, 0] },
          transition: hovered
            ? { duration: 0.5, ease: "easeOut" }
            : { duration: 3, repeat: Infinity, ease: "easeInOut" },
        };
      case "two-truths":
        // Question wobble
        return {
          animate: hovered
            ? { rotate: [0, -15, 15, -10, 10, 0] }
            : { rotate: [0, -5, 5, 0] },
          transition: hovered
            ? { duration: 0.6, ease: "easeInOut" }
            : { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
        };
      case "emoji-decode":
        // Smile bounce
        return {
          animate: hovered
            ? { y: [0, -6, 0], rotate: [0, 10, -10, 0] }
            : { y: [0, -3, 0] },
          transition: hovered
            ? { duration: 0.5, ease: "easeOut" }
            : { duration: 2, repeat: Infinity, ease: "easeInOut" },
        };
      default:
        return {
          animate: { scale: [1, 1.05, 1] },
          transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
        };
    }
  };

  const anim = getAnimation();

  return (
    <motion.div animate={anim.animate} transition={anim.transition}>
      <Icon
        className="w-6 h-6 transition-all duration-300"
        style={{
          color: theme.solidHex,
          filter: hovered
            ? `drop-shadow(0 0 10px ${theme.glowColor})`
            : `drop-shadow(0 0 4px ${theme.glowSoft})`,
        }}
      />
    </motion.div>
  );
}

/* ── Typewriter Text ── */
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
        // Blink cursor a few times then hide
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

/* ── Animated Ellipsis ── */
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

/* ── Lightning Bolt SVG ── */
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

/* ── Game Card Component ── */
function GameCard({
  game,
  theme,
  idx,
  onSelect,
  isRecommended,
}: {
  game: GameOption;
  theme: typeof THEMES.dating;
  idx: number;
  onSelect: () => void;
  isRecommended: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, x: -60, rotateY: -15 }}
      animate={{ opacity: 1, x: 0, rotateY: 0 }}
      transition={{
        delay: 0.2 + idx * 0.1,
        type: "spring",
        stiffness: 180,
        damping: 18,
      }}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
      className="w-full p-4 rounded-2xl flex items-center gap-4 text-left relative overflow-hidden transition-all duration-300"
      style={{
        background: hovered
          ? `linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))`
          : "rgba(15,23,42,0.6)",
        backdropFilter: "blur(16px)",
        border: `1px solid ${
          hovered ? theme.glowMid : "rgba(255,255,255,0.06)"
        }`,
        boxShadow: hovered
          ? `0 8px 32px rgba(0,0,0,0.3), 0 0 40px ${theme.glowSoft}, inset 0 1px 0 rgba(255,255,255,0.06)`
          : "0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)",
        perspective: "800px",
        transformStyle: "preserve-3d",
      }}
      whileTap={{ scale: 0.96 }}
    >
      {/* RECOMMENDED badge */}
      {isRecommended && (
        <motion.div
          className="absolute -top-0.5 -right-0.5 z-30"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div
            className="px-2 py-0.5 text-[7px] font-black uppercase tracking-widest rounded-bl-lg rounded-tr-2xl"
            style={{
              background: `linear-gradient(135deg, #fbbf24, #f59e0b)`,
              color: "#000",
              boxShadow: "0 2px 12px rgba(245,158,11,0.4)",
            }}
          >
            ★ Recommended
          </div>
        </motion.div>
      )}

      {/* Hover deep gradient overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background: `linear-gradient(135deg, ${theme.glowSoft}, transparent 50%, ${theme.glowSoft})`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Rotating conic-gradient border */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: `conic-gradient(from 0deg, transparent 25%, ${theme.solidHex}30, transparent 40%, ${theme.secondHex}30, transparent 55%, ${theme.solidHex}20, transparent 75%)`,
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          padding: "1px",
          borderRadius: "1rem",
          opacity: hovered ? 1 : 0.3,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Icon with glow halo + unique animation */}
      <div className="relative flex-shrink-0">
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{
            background: `radial-gradient(circle, ${theme.glowMid} 0%, transparent 70%)`,
          }}
          initial={{ scale: 1.3, opacity: 0.4 }}
          animate={{
            scale: hovered ? [1.4, 1.8, 1.4] : [1.3, 1.5, 1.3],
            opacity: hovered ? [0.5, 0.8, 0.5] : [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center relative z-10 transition-all duration-300"
          style={{
            background: hovered
              ? `linear-gradient(135deg, ${theme.glowSoft}, ${theme.glowMid})`
              : theme.glowSoft,
            border: `1px solid ${theme.glowMid}`,
            boxShadow: hovered ? `0 0 24px ${theme.glowSoft}, inset 0 1px 0 rgba(255,255,255,0.1)` : "none",
          }}
        >
          <AnimatedGameIcon game={game} hovered={hovered} theme={theme} />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 relative z-10">
        <h3
          className="text-sm font-black uppercase tracking-wider"
          style={{
            letterSpacing: "0.15em",
            color: hovered ? theme.solidHex : "#e2e8f0",
            transition: "color 0.3s",
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
              border: "1px solid rgba(71,85,105,0.3)",
              color: "#64748b",
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
        animate={{ x: hovered ? 4 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      >
        <ChevronRight
          className="w-5 h-5 transition-colors duration-300"
          style={{
            color: hovered ? theme.solidHex : "#475569",
            filter: hovered ? `drop-shadow(0 0 8px ${theme.glowColor})` : "none",
          }}
        />
      </motion.div>
    </motion.button>
  );
}

/* ── SVG Noise Texture Overlay ── */
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

export default function MapGamePicker({ opponent, onSelectGame, onClose, category }: MapGamePickerProps) {
  const resolvedCategory: Category =
    category || (opponent.category as Category) || "dating";
  const theme = THEMES[resolvedCategory];

  const initials = `${opponent.firstName[0]}${(opponent.lastName || "")[0] || ""}`.toUpperCase();
  const avatarUrl = opponent.profilePhoto || undefined;

  // Pick a random recommended game index
  const recommendedIdx = useMemo(() => Math.floor(Math.random() * GAMES.length), []);

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
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
          style={{
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(8px)",
          }}
          onClick={onClose}
        />

        {/* Bottom Sheet */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 26, stiffness: 260, mass: 0.9 }}
          className="absolute bottom-0 left-0 right-0 rounded-t-3xl shadow-2xl overflow-hidden"
          style={{
            background: "rgba(2,6,23,0.95)",
            backdropFilter: "blur(24px)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            boxShadow: `0 -8px 60px rgba(0,0,0,0.5), 0 0 80px ${theme.glowSoft}`,
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {/* SVG Noise Texture */}
          <NoiseTexture />

          {/* Background gradient orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute w-48 h-48 rounded-full blur-[80px] opacity-20"
              style={{
                background: theme.solidHex,
                top: "-20%",
                right: "-10%",
              }}
              animate={{
                x: [0, 30, -20, 0],
                y: [0, 20, -10, 0],
                scale: [1, 1.2, 0.9, 1],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute w-36 h-36 rounded-full blur-[60px] opacity-15"
              style={{
                background: theme.secondHex,
                bottom: "10%",
                left: "-5%",
              }}
              animate={{
                x: [0, -20, 15, 0],
                y: [0, -15, 20, 0],
                scale: [1, 0.8, 1.1, 1],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-1 relative z-10">
            <motion.div
              className="w-10 h-1 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${theme.solidHex}60, ${theme.secondHex}60)`,
              }}
              initial={{ width: 0 }}
              animate={{ width: 40 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            />
          </div>

          {/* Close Button */}
          <motion.button
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center z-20 transition-all"
            style={{
              background: "rgba(30,41,59,0.8)",
              border: "1px solid rgba(71,85,105,0.4)",
              backdropFilter: "blur(8px)",
            }}
            whileTap={{ scale: 0.85 }}
          >
            <X className="w-4 h-4 text-slate-400" />
          </motion.button>

          {/* Header: VS Display with Lightning Bolt */}
          <div className="px-5 pt-2 pb-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-center justify-center gap-3 mb-4"
            >
              {/* Player Avatar */}
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
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
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

              {/* Opponent Avatar */}
              <motion.div
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="relative"
              >
                <motion.div
                  className="absolute -inset-1 rounded-full"
                  style={{
                    background: `conic-gradient(from 180deg, ${theme.secondHex}60, transparent, ${theme.solidHex}60, transparent)`,
                  }}
                  animate={{ rotate: -360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                />
                <div
                  className={`w-12 h-12 rounded-full overflow-hidden relative z-10 bg-slate-800 flex items-center justify-center`}
                  style={{
                    border: `2px solid ${theme.glowMid}`,
                    boxShadow: `0 0 20px ${theme.glowSoft}`,
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={opponent.firstName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-sm font-black text-slate-400">
                      {initials}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>

            {/* Typewriter header */}
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
                <span style={{ color: theme.solidHex }}>{opponent.firstName}</span>
              </motion.p>
            </motion.div>

            {/* Section Label — gradient text with sparkle */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex items-center gap-2 mb-3"
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
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

            {/* Game Cards — domino-fall stagger with 3D perspective */}
            <div
              className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1"
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
                  onSelect={() => onSelectGame(game.key)}
                  isRecommended={idx === recommendedIdx}
                />
              ))}
            </div>

            {/* Footer: "More games coming soon..." with animated ellipsis */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-center mt-4 mb-2"
            >
              <p className="text-[9px] font-medium" style={{ color: "#475569" }}>
                More games coming soon
                <AnimatedEllipsis />
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
