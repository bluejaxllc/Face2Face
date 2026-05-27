import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Crown,
  Shield,
  Zap,
  Timer,
  MapPin,
  Trophy,
  Flame,
  Star,
  TrendingUp,
  Users,
  MessageSquare,
  RotateCcw,
  Target,
  Sparkles,
  Heart,
  UserPlus,
  Briefcase,
} from "lucide-react";

// ─── Types & Interfaces (PRESERVED) ─────────────────────────────────────────

type Category = "dating" | "friends" | "business";

interface KingOfTheHillProps {
  onBack: () => void;
  category?: Category;
}

interface Challenger {
  name: string;
  age: number;
  photo: string;
  power: number; // 1-100
  style: string;
  emoji: string;
}

// ─── Data Constants (PRESERVED) ─────────────────────────────────────────────

const CHALLENGERS: Record<Category, Challenger[]> = {
  dating: [
    { name: "Aly", age: 30, photo: "https://picsum.photos/seed/kh_d1/120/120", power: 72, style: "Charming", emoji: "💋" },
    { name: "Jade", age: 26, photo: "https://picsum.photos/seed/kh_d2/120/120", power: 85, style: "Bold", emoji: "🔥" },
    { name: "Marcus", age: 31, photo: "https://picsum.photos/seed/kh_d3/120/120", power: 68, style: "Smooth", emoji: "😎" },
    { name: "Shay", age: 27, photo: "https://picsum.photos/seed/kh_d4/120/120", power: 90, style: "Fierce", emoji: "⚡" },
    { name: "Luna", age: 25, photo: "https://picsum.photos/seed/kh_d5/120/120", power: 78, style: "Mysterious", emoji: "🌙" },
  ],
  friends: [
    { name: "Sarah", age: 24, photo: "https://picsum.photos/seed/kh_f1/120/120", power: 75, style: "Social", emoji: "🎉" },
    { name: "Kevin", age: 29, photo: "https://picsum.photos/seed/kh_f2/120/120", power: 82, style: "Athletic", emoji: "💪" },
    { name: "Jess", age: 26, photo: "https://picsum.photos/seed/kh_f3/120/120", power: 70, style: "Creative", emoji: "🎨" },
    { name: "Tyler", age: 28, photo: "https://picsum.photos/seed/kh_f4/120/120", power: 88, style: "Competitive", emoji: "🏆" },
    { name: "Mia", age: 23, photo: "https://picsum.photos/seed/kh_f5/120/120", power: 65, style: "Chill", emoji: "✌️" },
  ],
  business: [
    { name: "David", age: 34, photo: "https://picsum.photos/seed/kh_b1/120/120", power: 92, style: "Visionary", emoji: "🚀" },
    { name: "Elena", age: 31, photo: "https://picsum.photos/seed/kh_b2/120/120", power: 80, style: "Strategist", emoji: "♟️" },
    { name: "Aaron", age: 36, photo: "https://picsum.photos/seed/kh_b3/120/120", power: 86, style: "Networker", emoji: "🤝" },
    { name: "Nina", age: 29, photo: "https://picsum.photos/seed/kh_b4/120/120", power: 74, style: "Innovator", emoji: "💡" },
    { name: "Ryan", age: 33, photo: "https://picsum.photos/seed/kh_b5/120/120", power: 78, style: "Builder", emoji: "🔧" },
  ],
};

const THEMES: Record<Category, {
  gradient: string;
  textAccent: string;
  bgAccent: string;
  borderAccent: string;
  crownColor: string;
  ctaText: string;
  ctaIcon: typeof Heart;
  orbColors: string[];
  accentHex: string;
}> = {
  dating: {
    gradient: "from-pink-500 via-rose-500 to-red-500",
    textAccent: "text-pink-400",
    bgAccent: "bg-pink-500/15",
    borderAccent: "border-pink-500/30",
    crownColor: "text-pink-400",
    ctaText: "Send a Heart",
    ctaIcon: Heart,
    orbColors: ["#ec4899", "#f43f5e", "#f97316", "#a855f7", "#e11d48"],
    accentHex: "#ec4899",
  },
  friends: {
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    textAccent: "text-emerald-400",
    bgAccent: "bg-emerald-500/15",
    borderAccent: "border-emerald-500/30",
    crownColor: "text-emerald-400",
    ctaText: "Add Friend",
    ctaIcon: UserPlus,
    orbColors: ["#10b981", "#14b8a6", "#06b6d4", "#22c55e", "#34d399"],
    accentHex: "#10b981",
  },
  business: {
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    textAccent: "text-blue-400",
    bgAccent: "bg-blue-500/15",
    borderAccent: "border-blue-500/30",
    crownColor: "text-blue-400",
    ctaText: "Connect",
    ctaIcon: Briefcase,
    orbColors: ["#3b82f6", "#6366f1", "#8b5cf6", "#2563eb", "#818cf8"],
    accentHex: "#3b82f6",
  },
};

type GamePhase = "lobby" | "claiming" | "defending" | "victory" | "defeat";

// ─── Premium Subcomponents ──────────────────────────────────────────────────

/* SVG noise texture overlay */
const NoiseOverlay = () => (
  <svg className="pointer-events-none fixed inset-0 z-[100] h-full w-full opacity-[0.035]">
    <filter id="koth-noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#koth-noise)" />
  </svg>
);

/* Floating background orb with complex motion */
const FloatingOrb = ({ color, size, delay, x, y }: {
  color: string; size: number; delay: number; x: string; y: string;
}) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{
      width: size,
      height: size,
      background: `radial-gradient(circle, ${color}30 0%, ${color}05 70%, transparent 100%)`,
      left: x,
      top: y,
      filter: `blur(${size / 3}px)`,
    }}
    animate={{
      x: [0, 30, -20, 15, 0],
      y: [0, -25, 15, -10, 0],
      scale: [1, 1.15, 0.9, 1.05, 1],
      opacity: [0.4, 0.7, 0.3, 0.6, 0.4],
    }}
    transition={{
      duration: 12 + delay * 2,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
  />
);

/* Ambient dust motes (10 particles) */
const DustMotes = () => (
  <>
    {Array.from({ length: 10 }).map((_, i) => (
      <motion.div
        key={`dust-${i}`}
        className="absolute rounded-full bg-white/20 pointer-events-none"
        style={{
          width: 2 + Math.random() * 2,
          height: 2 + Math.random() * 2,
          left: `${10 + Math.random() * 80}%`,
          top: `${10 + Math.random() * 80}%`,
        }}
        animate={{
          y: [0, -40 - Math.random() * 60, 0],
          x: [0, (Math.random() - 0.5) * 40, 0],
          opacity: [0, 0.6, 0],
        }}
        transition={{
          duration: 6 + Math.random() * 6,
          repeat: Infinity,
          delay: Math.random() * 5,
          ease: "easeInOut",
        }}
      />
    ))}
  </>
);

/* Tap ripple effect */
const TapRipple = ({ x, y, color }: { x: number; y: number; color: string }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none z-[80]"
    style={{
      left: x - 30,
      top: y - 30,
      width: 60,
      height: 60,
      border: `2px solid ${color}`,
    }}
    initial={{ scale: 0.3, opacity: 0.8 }}
    animate={{ scale: 2.5, opacity: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
  />
);

/* Glassmorphic card wrapper */
const GlassCard = ({ children, className = "", glowColor }: {
  children: React.ReactNode; className?: string; glowColor?: string;
}) => (
  <div
    className={`relative rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-2xl overflow-hidden ${className}`}
    style={glowColor ? {
      boxShadow: `0 0 40px ${glowColor}15, inset 0 1px 0 rgba(255,255,255,0.06)`,
    } : {
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
    }}
  >
    {children}
  </div>
);

/* Shimmer button with glow shadow */
const ShimmerButton = ({ children, onClick, disabled, variant = "primary", className = "" }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
}) => (
  <motion.button
    onClick={onClick}
    disabled={disabled}
    whileHover={{ scale: disabled ? 1 : 1.02 }}
    whileTap={{ scale: disabled ? 1 : 0.95 }}
    className={`relative overflow-hidden transition-all ${
      variant === "primary"
        ? `bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-black shadow-lg shadow-orange-500/20 ${disabled ? "opacity-40 cursor-not-allowed" : ""}`
        : `bg-white/[0.04] backdrop-blur-md border border-white/[0.08] text-slate-200 font-bold ${disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-white/[0.08]"}`
    } ${className}`}
  >
    {!disabled && variant === "primary" && (
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
      />
    )}
    <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
  </motion.button>
);

/* Circular progress ring for timer */
const TimerRing = ({ timeHeld, isUrgent }: { timeHeld: number; isUrgent?: boolean }) => {
  const circumference = 2 * Math.PI * 20;
  const progress = (timeHeld % 60) / 60;
  return (
    <div className="relative w-14 h-14">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <motion.circle
          cx="24" cy="24" r="20" fill="none"
          stroke={isUrgent ? "#ef4444" : "#f59e0b"}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          animate={isUrgent ? { opacity: [1, 0.4, 1] } : {}}
          transition={isUrgent ? { duration: 0.6, repeat: Infinity } : {}}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Timer className={`w-4 h-4 ${isUrgent ? "text-red-400" : "text-amber-400"}`} />
      </div>
    </div>
  );
};

/* Victory rays overlay (conic-gradient rotation) */
const VictoryRays = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none z-[60] opacity-10"
    style={{
      background: "conic-gradient(from 0deg, transparent 0deg, rgba(251,191,36,0.3) 10deg, transparent 20deg, transparent 30deg, rgba(251,191,36,0.3) 40deg, transparent 50deg, transparent 60deg, rgba(251,191,36,0.3) 70deg, transparent 80deg, transparent 90deg, rgba(251,191,36,0.3) 100deg, transparent 110deg, transparent 120deg)",
    }}
    animate={{ rotate: 360 }}
    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
  />
);

/* Particle burst effect for victory/defeat moments */
const ParticleBurst = ({ color }: { color: string }) => (
  <>
    {Array.from({ length: 8 }).map((_, i) => {
      const angle = (i / 8) * Math.PI * 2;
      const dist = 60 + Math.random() * 40;
      return (
        <motion.div
          key={`particle-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 4 + Math.random() * 4,
            height: 4 + Math.random() * 4,
            background: color,
            left: "50%",
            top: "50%",
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist,
            opacity: 0,
            scale: 0.2,
          }}
          transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.05 }}
        />
      );
    })}
  </>
);

// ─── Main Component ─────────────────────────────────────────────────────────

export default function KingOfTheHill({ onBack, category = "dating" }: KingOfTheHillProps) {
  const theme = THEMES[category];
  const challengers = CHALLENGERS[category];

  // ── State (ALL PRESERVED) ──
  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [hillHP, setHillHP] = useState(100);
  const [timeHeld, setTimeHeld] = useState(0);
  const [bestTime, setBestTime] = useState(0);
  const [currentChallenger, setCurrentChallenger] = useState<Challenger | null>(null);
  const [challengerHP, setChallengerHP] = useState(100);
  const [defenseEnergy, setDefenseEnergy] = useState(100);
  const [shieldActive, setShieldActive] = useState(false);
  const [shieldCooldown, setShieldCooldown] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [score, setScore] = useState(0);
  const [challengersDefeated, setChallengersDefeated] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [claimCountdown, setClaimCountdown] = useState(3);
  const [attackFlash, setAttackFlash] = useState(false);
  const [defenseFlash, setDefenseFlash] = useState(false);

  // ── Premium visual state ──
  const [tapRipples, setTapRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [screenShake, setScreenShake] = useState(false);
  const [territoryPulse, setTerritoryPulse] = useState(false);
  const [captureFlash, setCaptureFlash] = useState(false);
  const [showParticleBurst, setShowParticleBurst] = useState(false);
  const rippleIdRef = useRef(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const challengerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = useCallback((msg: string) => {
    setLog(prev => [msg, ...prev.slice(0, 12)]);
  }, []);

  // ── Claiming countdown (PRESERVED) ──
  useEffect(() => {
    if (phase === "claiming") {
      setClaimCountdown(3);
      const interval = setInterval(() => {
        setClaimCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setPhase("defending");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // ── Start defense phase (PRESERVED) ──
  useEffect(() => {
    if (phase === "defending") {
      setHillHP(100);
      setTimeHeld(0);
      setComboCount(0);
      setScore(0);
      setChallengersDefeated(0);
      setDefenseEnergy(100);
      setShieldCooldown(0);
      setLog(["👑 You claimed the hill! Defend your position!"]);

      // Spawn first challenger
      spawnChallenger();

      // Time counter
      timerRef.current = setInterval(() => {
        setTimeHeld(prev => prev + 1);
        setScore(prev => prev + 2); // +2 points per second holding
      }, 1000);

      // Shield cooldown ticker
      cooldownRef.current = setInterval(() => {
        setShieldCooldown(prev => prev > 0 ? prev - 1 : 0);
        // Regenerate defense energy slowly
        setDefenseEnergy(prev => Math.min(100, prev + 0.5));
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (cooldownRef.current) clearInterval(cooldownRef.current);
      };
    }
  }, [phase]);

  // ── Challenger attacks on interval (PRESERVED + screen shake) ──
  useEffect(() => {
    if (phase === "defending" && currentChallenger) {
      challengerTimerRef.current = setInterval(() => {
        const baseDmg = 3 + Math.random() * (currentChallenger.power / 20);
        const actualDmg = shieldActive ? baseDmg * 0.3 : baseDmg;

        setHillHP(prev => {
          const next = Math.max(0, prev - actualDmg);
          if (next <= 0) {
            // Player loses
            if (timerRef.current) clearInterval(timerRef.current);
            if (challengerTimerRef.current) clearInterval(challengerTimerRef.current);
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            setBestTime(prev => {
              const held = timeHeld;
              return Math.max(prev, held);
            });
            setPhase("defeat");
          }
          return Math.round(next * 10) / 10;
        });

        if (shieldActive) {
          setAttackFlash(false);
        } else {
          setAttackFlash(true);
          setScreenShake(true);
          setTimeout(() => {
            setAttackFlash(false);
            setScreenShake(false);
          }, 200);
        }
      }, 1500);

      return () => {
        if (challengerTimerRef.current) clearInterval(challengerTimerRef.current);
      };
    }
  }, [phase, currentChallenger, shieldActive]);

  const spawnChallenger = useCallback(() => {
    const randomIdx = Math.floor(Math.random() * challengers.length);
    const c = challengers[randomIdx];
    setCurrentChallenger(c);
    setChallengerHP(100);
    setTerritoryPulse(true);
    setTimeout(() => setTerritoryPulse(false), 600);
    addLog(`⚔️ ${c.name} (${c.style}) is challenging you!`);
  }, [challengers, addLog]);

  // ── Attack the challenger (PRESERVED + tap ripple + capture flash) ──
  const handleAttack = (e?: React.MouseEvent | React.TouchEvent) => {
    if (phase !== "defending" || !currentChallenger || defenseEnergy < 8) return;

    // Add tap ripple at click position
    if (e && "clientX" in e) {
      const id = ++rippleIdRef.current;
      setTapRipples(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setTapRipples(prev => prev.filter(r => r.id !== id)), 700);
    }

    const baseDmg = 12 + Math.random() * 10;
    const comboDmg = baseDmg + comboCount * 2;
    setDefenseEnergy(prev => Math.max(0, prev - 8));
    setComboCount(prev => prev + 1);
    setDefenseFlash(true);
    setTimeout(() => setDefenseFlash(false), 150);

    setChallengerHP(prev => {
      const next = Math.max(0, prev - comboDmg);
      if (next <= 0) {
        // Challenger defeated!
        setChallengersDefeated(prev => prev + 1);
        setScore(prev => prev + 50 + comboCount * 10);
        setComboCount(0);
        addLog(`🏆 ${currentChallenger.name} defeated! +${50 + comboCount * 10} pts`);

        // Heal some HP
        setHillHP(prev => Math.min(100, prev + 15));
        addLog("💚 +15 HP restored!");

        // Premium: capture flash & particle burst
        setCaptureFlash(true);
        setShowParticleBurst(true);
        setTimeout(() => {
          setCaptureFlash(false);
          setShowParticleBurst(false);
        }, 800);

        // Spawn next challenger after delay
        setTimeout(() => spawnChallenger(), 1200);
      }
      return Math.round(next * 10) / 10;
    });
  };

  // ── Activate shield (PRESERVED) ──
  const handleShield = () => {
    if (shieldCooldown > 0 || defenseEnergy < 20) return;

    setShieldActive(true);
    setDefenseEnergy(prev => prev - 20);
    setShieldCooldown(8);
    addLog("🛡️ Shield activated! Damage reduced 70%");

    setTimeout(() => {
      setShieldActive(false);
      addLog("Shield expired");
    }, 4000);
  };

  const handleStartClaim = () => {
    setPhase("claiming");
  };

  const handleRestart = () => {
    setPhase("lobby");
    setHillHP(100);
    setTimeHeld(0);
    setCurrentChallenger(null);
    setChallengerHP(100);
    setDefenseEnergy(100);
    setShieldActive(false);
    setShieldCooldown(0);
    setComboCount(0);
    setScore(0);
    setChallengersDefeated(0);
    setLog([]);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // ── Dynamic color temperature (warm when winning, cool when losing) ──
  const tempFilter = phase === "defending"
    ? hillHP > 60
      ? "hue-rotate(0deg) saturate(1.1)"
      : hillHP > 30
        ? "hue-rotate(-5deg) saturate(1.2)"
        : "hue-rotate(-15deg) saturate(1.4)"
    : "none";

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden bg-slate-950 text-white select-none"
      style={{ filter: tempFilter }}
      animate={screenShake ? {
        x: [0, -4, 4, -3, 3, -1, 0],
        y: [0, 2, -2, 1, -1, 0.5, 0],
      } : { x: 0, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* ── Noise Overlay ── */}
      <NoiseOverlay />

      {/* ── Floating Orbs (5 with complex paths) ── */}
      {theme.orbColors.map((color, i) => (
        <FloatingOrb
          key={`orb-${i}`}
          color={color}
          size={120 + i * 40}
          delay={i * 1.5}
          x={`${10 + i * 18}%`}
          y={`${15 + (i % 3) * 25}%`}
        />
      ))}

      {/* ── Dust Motes ── */}
      <DustMotes />

      {/* ── Dramatic radial gradient behind hill ── */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${theme.accentHex}12 0%, transparent 70%)`,
        }}
      />

      {/* ── Attack flash overlay ── */}
      <AnimatePresence>
        {attackFlash && (
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-red-500/15 z-[70] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* ── Capture flash (screen flash on territory capture) ── */}
      <AnimatePresence>
        {captureFlash && (
          <motion.div
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-[70] pointer-events-none"
            style={{ background: `radial-gradient(circle, ${theme.accentHex}40 0%, transparent 70%)` }}
          />
        )}
      </AnimatePresence>

      {/* ── Tap ripples ── */}
      <AnimatePresence>
        {tapRipples.map(r => (
          <TapRipple key={r.id} x={r.x} y={r.y} color={theme.accentHex} />
        ))}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <div className="fixed top-0 left-0 right-0 z-[60]" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.06] bg-slate-950/70 backdrop-blur-xl">
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
              animate={{ rotate: [0, -8, 8, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Crown className="w-4 h-4 text-amber-400" />
            </motion.div>
            <span className="text-sm font-black uppercase tracking-[0.2em] bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
              King of the Hill
            </span>
          </div>
          {phase === "defending" ? (
            <GlassCard className="!rounded-full" glowColor="#f59e0b">
              <div className="flex items-center gap-1.5 px-3 py-1.5">
                <Timer className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-black text-amber-400 tabular-nums">{formatTime(timeHeld)}</span>
              </div>
            </GlassCard>
          ) : (
            <div style={{ width: "60px" }} />
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="absolute inset-0 flex flex-col" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 56px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

        {/* ══════════ LOBBY ══════════ */}
        {phase === "lobby" && (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            {/* Crown visual with animated conic-gradient border ring */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mb-8 relative"
            >
              <div className="w-32 h-32 rounded-full p-[3px] relative">
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ background: "conic-gradient(from 0deg, #f59e0b, #f97316, #ef4444, #ec4899, #f59e0b)" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
                <div className="relative w-full h-full rounded-full bg-slate-950 flex items-center justify-center z-10 shadow-[0_0_80px_rgba(245,158,11,0.15)]">
                  <Crown className="w-14 h-14 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
                </div>
              </div>
              {/* Sparkle accent */}
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-5 h-5 text-amber-400/60" />
              </motion.div>
            </motion.div>

            <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-[0.15em] bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
              King of the Hill
            </h2>
            <p className="text-sm text-slate-500 text-center mb-8 max-w-xs leading-relaxed font-medium">
              Claim the hill and defend your position against challengers. The longer you hold, the more points you earn!
            </p>

            {/* Best time from previous runs */}
            {bestTime > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <GlassCard className="px-6 py-3 text-center" glowColor="#f59e0b">
                  <p className="text-lg font-black text-amber-400 tabular-nums">{formatTime(bestTime)}</p>
                  <p className="text-[8px] text-slate-500 uppercase tracking-[0.2em] font-bold">Best Time</p>
                </GlassCard>
              </motion.div>
            )}

            {/* How it works - glassmorphic instructions */}
            <div className="w-full max-w-xs space-y-2 mb-8">
              {[
                { icon: Crown, text: "Claim the hill to start defending", color: "text-amber-400" },
                { icon: Zap, text: "Tap STRIKE to attack challengers", color: "text-red-400" },
                { icon: Shield, text: "Use Shield to reduce incoming damage", color: "text-blue-400" },
                { icon: Timer, text: "Hold the hill as long as possible", color: "text-emerald-400" },
              ].map(({ icon: Icon, text, color }, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm"
                >
                  <Icon className={`w-4 h-4 ${color} shrink-0`} />
                  <span className="text-xs text-slate-400 font-medium">{text}</span>
                </motion.div>
              ))}
            </div>

            <ShimmerButton
              onClick={handleStartClaim}
              className="w-full max-w-xs py-4 rounded-2xl text-sm uppercase tracking-[0.2em]"
            >
              <Crown className="w-5 h-5" />
              <span>Claim the Hill</span>
            </ShimmerButton>
          </div>
        )}

        {/* ══════════ CLAIMING COUNTDOWN (Cinematic Letterbox) ══════════ */}
        {phase === "claiming" && (
          <div className="flex-1 flex flex-col items-center justify-center relative">
            {/* Letterbox bars for cinematic feel */}
            <motion.div
              className="absolute top-0 left-0 right-0 bg-black z-10"
              initial={{ height: 0 }}
              animate={{ height: "12%" }}
              transition={{ duration: 0.6 }}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-black z-10"
              initial={{ height: 0 }}
              animate={{ height: "12%" }}
              transition={{ duration: 0.6 }}
            />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-8 z-20"
            >
              Claiming the Hill
            </motion.p>

            <AnimatePresence mode="popLayout">
              <motion.div
                key={claimCountdown}
                initial={{ scale: 0, opacity: 0, filter: "blur(20px)" }}
                animate={{ scale: 1.5, opacity: 1, filter: "blur(0px)" }}
                exit={{ scale: 3, opacity: 0, filter: "blur(10px)" }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="text-8xl font-black z-20"
                style={{
                  background: "linear-gradient(180deg, #fbbf24 0%, #f97316 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {claimCountdown || "GO!"}
              </motion.div>
            </AnimatePresence>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 0.5 }}
              className="text-xs text-slate-500 font-bold uppercase tracking-[0.3em] mt-8 z-20"
            >
              Prepare to defend!
            </motion.p>
          </div>
        )}

        {/* ══════════ DEFENDING ══════════ */}
        {phase === "defending" && currentChallenger && (
          <div className="flex-1 flex flex-col justify-between">

            {/* Hill HP bar + score - glassmorphic panels */}
            <div className="px-4 pt-3 pb-2">
              {/* Score row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <GlassCard className="!rounded-full">
                    <div className="flex items-center gap-1.5 px-3 py-1">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      <motion.span
                        key={score}
                        initial={{ y: -8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-sm font-black text-amber-400 tabular-nums"
                      >
                        {score}
                      </motion.span>
                    </div>
                  </GlassCard>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/[0.03]">
                    <Trophy className="w-3 h-3 text-slate-400" />
                    <span className="text-xs font-bold text-slate-400">{challengersDefeated} KO</span>
                  </div>
                </div>
                {/* Combo counter with glow */}
                <AnimatePresence>
                  {comboCount > 1 && (
                    <motion.div
                      key={comboCount}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                    >
                      <GlassCard className="!rounded-full" glowColor="#f97316">
                        <div className="flex items-center gap-1 px-3 py-1">
                          <Flame className="w-3 h-3 text-orange-400" />
                          <span className="text-[10px] font-black text-orange-400">{comboCount}x COMBO</span>
                        </div>
                      </GlassCard>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Your Hill HP - glassmorphic bar */}
              <GlassCard className="p-3 relative">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] flex items-center gap-1.5">
                    <Crown className="w-3 h-3 text-amber-400" /> Your Hill
                  </span>
                  <motion.span
                    key={Math.round(hillHP)}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className={`text-xs font-black tabular-nums ${
                      hillHP < 30 ? "text-red-400" : hillHP < 60 ? "text-amber-400" : "text-emerald-400"
                    }`}
                  >
                    {Math.round(hillHP)}%
                  </motion.span>
                </div>
                <div className="w-full h-3 rounded-full bg-black/40 overflow-hidden border border-white/[0.06]">
                  <motion.div
                    animate={{ width: `${hillHP}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                    className={`h-full rounded-full ${
                      hillHP < 30 ? "bg-gradient-to-r from-red-600 to-red-400" :
                      hillHP < 60 ? "bg-gradient-to-r from-amber-600 to-amber-400" :
                      "bg-gradient-to-r from-emerald-600 to-emerald-400"
                    }`}
                    style={hillHP < 30 ? { boxShadow: "0 0 12px rgba(239,68,68,0.4)" } : {}}
                  />
                </div>
                {/* Territory change pulse */}
                <AnimatePresence>
                  {territoryPulse && (
                    <motion.div
                      initial={{ opacity: 0.6 }}
                      animate={{ opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6 }}
                      className="absolute inset-0 rounded-2xl border-2 border-amber-400/40 pointer-events-none"
                    />
                  )}
                </AnimatePresence>
              </GlassCard>
            </div>

            {/* VS Battle area */}
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              {/* Timer ring */}
              <div className="mb-4">
                <TimerRing timeHeld={timeHeld} isUrgent={hillHP < 25} />
              </div>

              {/* Challenger card - glassmorphic with animated gradient ring avatar */}
              <motion.div
                key={currentChallenger.name}
                initial={{ x: 100, opacity: 0, scale: 0.9 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="w-full max-w-sm mb-4"
              >
                <GlassCard
                  glowColor={defenseFlash ? "#ef4444" : undefined}
                  className={`${defenseFlash ? "!border-red-500/30" : ""} transition-all duration-150`}
                >
                  <div className="p-5">
                    <div className="flex items-center gap-4">
                      {/* 64px avatar with animated gradient ring */}
                      <div className="relative shrink-0">
                        <div className="w-16 h-16 rounded-full p-[2px] relative">
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: challengerHP < 30
                                ? "conic-gradient(from 0deg, #ef4444, #f97316, #ef4444)"
                                : `conic-gradient(from 0deg, ${theme.accentHex}, #f59e0b, ${theme.accentHex})`,
                            }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                          />
                          <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-slate-900 z-10">
                            <img src={currentChallenger.photo} alt={currentChallenger.name} className="w-full h-full object-cover" />
                          </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-sm z-20">
                          {currentChallenger.emoji}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-white text-sm">{currentChallenger.name}, {currentChallenger.age}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${theme.bgAccent} ${theme.textAccent}`}>
                            {currentChallenger.style}
                          </span>
                        </div>

                        {/* Challenger HP bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2.5 rounded-full bg-black/40 overflow-hidden border border-white/[0.06]">
                            <motion.div
                              animate={{ width: `${challengerHP}%` }}
                              transition={{ type: "spring", stiffness: 150, damping: 20 }}
                              className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-400"
                              style={challengerHP < 30 ? { boxShadow: "0 0 8px rgba(239,68,68,0.4)" } : {}}
                            />
                          </div>
                          <span className="text-[10px] font-black text-slate-400 w-8 text-right tabular-nums">{Math.round(challengerHP)}%</span>
                        </div>

                        {/* Power indicator */}
                        <div className="flex items-center gap-1 mt-1">
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span className="text-[9px] font-bold text-slate-500">Power: {currentChallenger.power}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              {/* Particle burst on challenger defeat */}
              <AnimatePresence>
                {showParticleBurst && (
                  <div className="relative">
                    <ParticleBurst color={theme.accentHex} />
                  </div>
                )}
              </AnimatePresence>

              {/* Shield active indicator - glassmorphic */}
              <AnimatePresence>
                {shieldActive && (
                  <motion.div
                    initial={{ scale: 0, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0, opacity: 0 }}
                  >
                    <GlassCard className="!rounded-full mb-3" glowColor="#3b82f6">
                      <div className="flex items-center gap-2 px-4 py-1.5">
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <Shield className="w-4 h-4 text-blue-400" />
                        </motion.div>
                        <span className="text-xs font-black text-blue-400 uppercase tracking-wider">Shield Active</span>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Event log strip */}
            <div className="px-4 py-2 bg-black/20 max-h-[50px] overflow-hidden border-t border-b border-white/[0.04]">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={log[0]}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  className="text-slate-400 text-[11px] font-semibold text-center truncate"
                >
                  {log[0] || "Defend your position..."}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Defense energy bar */}
            <div className="px-6 pt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.15em]">Energy</span>
                <span className={`text-[10px] font-black tabular-nums ${defenseEnergy < 20 ? "text-red-400" : "text-cyan-400"}`}>
                  {Math.round(defenseEnergy)}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden mb-3 border border-white/[0.04]">
                <motion.div
                  animate={{ width: `${defenseEnergy}%` }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className={`h-full rounded-full ${defenseEnergy < 20 ? "bg-gradient-to-r from-red-500 to-orange-500" : "bg-gradient-to-r from-cyan-500 to-blue-500"}`}
                />
              </div>
            </div>

            {/* Action buttons - shimmer strike + shield */}
            <div className="px-6 pb-6 flex gap-3">
              {/* Strike button with shimmer */}
              <ShimmerButton
                onClick={handleAttack}
                disabled={defenseEnergy < 8}
                className={`flex-1 py-4 rounded-2xl text-sm uppercase tracking-[0.15em] ${
                  defenseEnergy < 8 ? "!bg-slate-800 !text-slate-600 !shadow-none" : ""
                }`}
              >
                <Zap className="w-5 h-5" />
                <span>Strike</span>
              </ShimmerButton>

              {/* Shield button */}
              <motion.button
                onClick={handleShield}
                disabled={shieldCooldown > 0 || defenseEnergy < 20 || shieldActive}
                whileHover={{ scale: (shieldCooldown > 0 || defenseEnergy < 20 || shieldActive) ? 1 : 1.02 }}
                whileTap={{ scale: (shieldCooldown > 0 || defenseEnergy < 20 || shieldActive) ? 1 : 0.95 }}
                className={`w-20 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 ${
                  shieldCooldown > 0 || defenseEnergy < 20 || shieldActive
                    ? "bg-white/[0.02] text-slate-600 border border-white/[0.04] cursor-not-allowed"
                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20 backdrop-blur-sm"
                }`}
                style={(shieldCooldown <= 0 && defenseEnergy >= 20 && !shieldActive)
                  ? { boxShadow: "0 0 20px rgba(59,130,246,0.1)" }
                  : {}
                }
              >
                <Shield className="w-5 h-5" />
                {shieldCooldown > 0 ? (
                  <span className="text-[8px] tabular-nums">{shieldCooldown}s</span>
                ) : (
                  <span className="text-[8px]">Shield</span>
                )}
              </motion.button>
            </div>
          </div>
        )}

        {/* ══════════ DEFEAT ══════════ */}
        {phase === "defeat" && (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            {/* Radial wipe transition */}
            <motion.div
              className="absolute inset-0 z-[65] pointer-events-none"
              style={{ background: "radial-gradient(circle, transparent 0%, rgba(0,0,0,0.6) 100%)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />

            <motion.div
              initial={{ scale: 0, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.2 }}
              className="w-full max-w-sm z-[66] relative"
            >
              {/* Glassmorphic results card with rotating conic-gradient border */}
              <div className="relative rounded-3xl p-[1px] overflow-hidden">
                <motion.div
                  className="absolute inset-0 rounded-3xl"
                  style={{ background: "conic-gradient(from 0deg, #f59e0b, #ef4444, #ec4899, #8b5cf6, #3b82f6, #f59e0b)" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                />
                <div className="relative rounded-3xl bg-slate-950/90 backdrop-blur-2xl overflow-hidden z-10">
                  <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
                  <div className="p-8 text-center">
                    {/* Crown fallen icon */}
                    <div className="relative mx-auto mb-5 w-20 h-20">
                      <div className="w-20 h-20 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: [0, -10, 5, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Crown className="w-10 h-10 text-slate-600" />
                        </motion.div>
                      </div>
                      <motion.div
                        initial={{ rotate: 0, scale: 0 }}
                        animate={{ rotate: 15, scale: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                        className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center"
                      >
                        <span className="text-sm">💥</span>
                      </motion.div>
                    </div>

                    <h2 className="text-2xl font-black uppercase tracking-[0.15em] mb-1 bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent">
                      Dethroned!
                    </h2>
                    <p className="text-xs text-red-400 font-bold uppercase tracking-[0.15em] mb-6">
                      {currentChallenger?.name} took your crown
                    </p>

                    {/* Stats grid - glassmorphic cells */}
                    <div className="grid grid-cols-3 gap-2 mb-6">
                      {[
                        { value: formatTime(timeHeld), label: "Time Held", color: "text-amber-400" },
                        { value: String(score), label: "Score", color: "text-white" },
                        { value: String(challengersDefeated), label: "Defeated", color: "text-rose-400" },
                      ].map((stat, idx) => (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + idx * 0.1 }}
                        >
                          <GlassCard className="p-3 text-center">
                            <p className={`text-lg font-black ${stat.color} tabular-nums`}>{stat.value}</p>
                            <p className="text-[7px] text-slate-500 uppercase tracking-[0.15em] font-bold mt-0.5">{stat.label}</p>
                          </GlassCard>
                        </motion.div>
                      ))}
                    </div>

                    {/* Defeated by panel */}
                    {currentChallenger && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                      >
                        <GlassCard className="mb-6">
                          <div className="flex items-center gap-3 p-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                              <img src={currentChallenger.photo} alt={currentChallenger.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-black text-slate-200">{currentChallenger.name} {currentChallenger.emoji}</p>
                              <p className="text-[9px] text-slate-500">defeated you · {currentChallenger.style} style</p>
                            </div>
                            {/* Leading player crown */}
                            <motion.div
                              animate={{ y: [0, -3, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="ml-auto"
                            >
                              <Crown className="w-5 h-5 text-amber-400" />
                            </motion.div>
                          </div>
                        </GlassCard>
                      </motion.div>
                    )}

                    {/* Action buttons - shimmer */}
                    <div className="space-y-3">
                      <ShimmerButton
                        onClick={handleRestart}
                        className="w-full py-4 rounded-2xl text-sm uppercase tracking-[0.15em]"
                      >
                        <Crown className="w-5 h-5" />
                        <span>Reclaim the Hill</span>
                      </ShimmerButton>

                      <ShimmerButton
                        onClick={onBack}
                        variant="secondary"
                        className="w-full py-3 rounded-2xl text-sm"
                      >
                        Exit to Games
                      </ShimmerButton>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
