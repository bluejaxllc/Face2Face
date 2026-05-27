import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Compass, Target, Timer, Zap, Shield, ChevronLeft, MapPin, Sparkles, MessageSquare, AlertTriangle, Play, HelpCircle, Trophy, Radio, Crosshair } from "lucide-react";

// ─── Types & Interfaces (PRESERVED) ───────────────────────────────────────────
type Category = "dating" | "friends" | "business";

interface ProximityTagProps {
  onBack: () => void;
  category?: Category;
}

interface TargetUser {
  name: string;
  age?: number;
  photo: string;
  baseDistance: number; // starting distance in meters
  speed: string; // "Normal", "Fast", "Evasive"
  description: string;
}

// ─── Game Data Constants (PRESERVED) ──────────────────────────────────────────
const TARGETS: Record<Category, TargetUser[]> = {
  dating: [
    { name: "Aly", age: 30, photo: "https://picsum.photos/seed/pt_d1/120/120", baseDistance: 32, speed: "Normal", description: "Enjoys coffee shops & design discussions" },
    { name: "Shay", age: 27, photo: "https://picsum.photos/seed/pt_d2/120/120", baseDistance: 45, speed: "Fast", description: "Avid dancer, moves fast" },
    { name: "Marcus", age: 31, photo: "https://picsum.photos/seed/pt_d3/120/120", baseDistance: 28, speed: "Evasive", description: "Spontaneous explorer" },
  ],
  friends: [
    { name: "Sarah", age: 24, photo: "https://picsum.photos/seed/pt_f1/120/120", baseDistance: 30, speed: "Normal", description: "Wants to play board games" },
    { name: "Kevin", age: 29, photo: "https://picsum.photos/seed/pt_f2/120/120", baseDistance: 40, speed: "Fast", description: "Always in a hurry / runner" },
    { name: "Jess", age: 26, photo: "https://picsum.photos/seed/pt_f3/120/120", baseDistance: 35, speed: "Evasive", description: "Changes plans constantly" },
  ],
  business: [
    { name: "David", photo: "https://picsum.photos/seed/pt_b1/120/120", baseDistance: 25, speed: "Normal", description: "AI Startup Founder, networking" },
    { name: "Elena", photo: "https://picsum.photos/seed/pt_b2/120/120", baseDistance: 38, speed: "Evasive", description: "B2B SaaS Growth consultant" },
    { name: "Aaron", photo: "https://picsum.photos/seed/pt_b3/120/120", baseDistance: 48, speed: "Fast", description: "Venture capitalist at the booths" },
  ],
};

const THEMES: Record<Category, { gradient: string; textAccent: string; bgAccent: string; cardGrad: string; actionBtnGrad: string; ctaText: string; successMsg: string }> = {
  dating: {
    gradient: "from-pink-500 via-rose-500 to-red-500",
    textAccent: "text-pink-400",
    bgAccent: "bg-pink-500/15",
    cardGrad: "from-pink-950/80 via-rose-950/60 to-slate-950/90",
    actionBtnGrad: "from-pink-500 to-rose-600",
    ctaText: "Send Heart Poke",
    successMsg: "Target Tagged! You've sent a Heart Poke. Tap below to chat!",
  },
  friends: {
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    textAccent: "text-emerald-400",
    bgAccent: "bg-emerald-500/15",
    cardGrad: "from-emerald-950/80 via-green-950/60 to-slate-950/90",
    actionBtnGrad: "from-emerald-500 to-teal-600",
    ctaText: "Tag Back Chat",
    successMsg: "Tagged successfully! You are no longer 'It'. Send them a greeting!",
  },
  business: {
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    textAccent: "text-blue-400",
    bgAccent: "bg-blue-500/15",
    cardGrad: "from-blue-950/80 via-indigo-950/60 to-slate-950/90",
    actionBtnGrad: "from-blue-500 to-indigo-600",
    ctaText: "Request Meet-up",
    successMsg: "Tagged! You've located them. Send a message to coordinate a meetup location.",
  },
};

// ─── Category Accent Colors ──────────────────────────────────────────────────
const ACCENT_COLORS: Record<Category, { primary: string; rgb: string; glow: string }> = {
  dating: { primary: "#ec4899", rgb: "236,72,153", glow: "shadow-pink-500/30" },
  friends: { primary: "#10b981", rgb: "16,185,129", glow: "shadow-emerald-500/30" },
  business: { primary: "#6366f1", rgb: "99,102,241", glow: "shadow-indigo-500/30" },
};

type GameState = "lobby" | "countdown" | "chase" | "success" | "fail";

// ─── SVG Noise Texture ───────────────────────────────────────────────────────
const NoiseOverlay = () => (
  <svg className="pointer-events-none fixed inset-0 z-[100] h-full w-full opacity-[0.035]" aria-hidden>
    <filter id="proximity-noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="4" stitchTiles="stitch" />
    </filter>
    <rect width="100%" height="100%" filter="url(#proximity-noise)" />
  </svg>
);

// ─── Floating Background Orbs ────────────────────────────────────────────────
const FloatingOrbs = ({ category }: { category: Category }) => {
  const accent = ACCENT_COLORS[category];
  const orbs = useMemo(() => [
    { size: 180, x: [-10, 15, -5], y: [-5, 20, -10], dur: 22, opacity: 0.08, blur: 120 },
    { size: 140, x: [80, 60, 85], y: [10, 35, 5], dur: 26, opacity: 0.06, blur: 100 },
    { size: 200, x: [20, 50, 30], y: [70, 55, 75], dur: 30, opacity: 0.07, blur: 140 },
    { size: 120, x: [65, 40, 70], y: [80, 60, 85], dur: 24, opacity: 0.05, blur: 90 },
    { size: 160, x: [45, 25, 55], y: [30, 50, 25], dur: 28, opacity: 0.06, blur: 110 },
    { size: 100, x: [90, 70, 85], y: [50, 70, 45], dur: 20, opacity: 0.04, blur: 80 },
  ], []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, rgba(${accent.rgb},${orb.opacity * 3}) 0%, rgba(${accent.rgb},0) 70%)`,
            filter: `blur(${orb.blur}px)`,
          }}
          animate={{
            left: orb.x.map(v => `${v}%`),
            top: orb.y.map(v => `${v}%`),
          }}
          transition={{
            duration: orb.dur,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// ─── Ambient Dust Motes ──────────────────────────────────────────────────────
const DustMotes = ({ category }: { category: Category }) => {
  const accent = ACCENT_COLORS[category];
  const motes = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => ({
      id: i,
      size: 1.5 + Math.random() * 2.5,
      startX: Math.random() * 100,
      startY: Math.random() * 100,
      driftX: (Math.random() - 0.5) * 30,
      driftY: -20 - Math.random() * 40,
      dur: 12 + Math.random() * 18,
      delay: Math.random() * 8,
      opacity: 0.15 + Math.random() * 0.25,
    })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {motes.map((m) => (
        <motion.div
          key={m.id}
          className="absolute rounded-full"
          style={{
            width: m.size,
            height: m.size,
            left: `${m.startX}%`,
            top: `${m.startY}%`,
            backgroundColor: accent.primary,
          }}
          animate={{
            x: [0, m.driftX, m.driftX * 0.5],
            y: [0, m.driftY * 0.5, m.driftY],
            opacity: [0, m.opacity, 0],
          }}
          transition={{
            duration: m.dur,
            repeat: Infinity,
            delay: m.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// ─── Animated Score Digit (spring-physics odometer) ──────────────────────────
const ScoreDigit = ({ value, className = "" }: { value: number; className?: string }) => {
  const spring = useSpring(value, { stiffness: 120, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v));
  
  useEffect(() => { spring.set(value); }, [value, spring]);
  
  return <motion.span className={className}>{display}</motion.span>;
};

// ─── Glassmorphic Card Wrapper ───────────────────────────────────────────────
const GlassCard = ({ children, className = "", glow = false, category }: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  category?: Category;
}) => {
  const accent = category ? ACCENT_COLORS[category] : null;
  return (
    <div
      className={`relative rounded-2xl border border-white/[0.08] backdrop-blur-xl ${className}`}
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
        boxShadow: glow && accent
          ? `0 0 40px -10px rgba(${accent.rgb}, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)`
          : "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {children}
    </div>
  );
};

// ─── Shimmer Button ──────────────────────────────────────────────────────────
const ShimmerButton = ({ children, onClick, className = "", disabled = false, gradient }: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  gradient?: string;
}) => (
  <motion.button
    onClick={onClick}
    disabled={disabled}
    whileHover={{ scale: disabled ? 1 : 1.02 }}
    whileTap={{ scale: disabled ? 1 : 0.95 }}
    className={`relative overflow-hidden ${className} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
  >
    {/* Shimmer sweep */}
    {!disabled && (
      <motion.div
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)",
        }}
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
      />
    )}
    <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
  </motion.button>
);

// ─── Circular Timer Ring ─────────────────────────────────────────────────────
const TimerRing = ({ timeLeft, maxTime, category }: { timeLeft: number; maxTime: number; category: Category }) => {
  const accent = ACCENT_COLORS[category];
  const progress = timeLeft / maxTime;
  const circumference = 2 * Math.PI * 18;
  const offset = circumference * (1 - progress);
  const isUrgent = timeLeft <= 10;

  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
        <motion.circle
          cx="20" cy="20" r="18" fill="none"
          stroke={isUrgent ? "#ef4444" : accent.primary}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          animate={isUrgent ? { opacity: [1, 0.5, 1] } : {}}
          transition={isUrgent ? { duration: 0.5, repeat: Infinity } : {}}
        />
      </svg>
      <span className={`absolute text-xs font-black ${isUrgent ? "text-red-400" : "text-white"}`}>
        {timeLeft}
      </span>
    </div>
  );
};

// ─── Victory Rays (conic-gradient rotation) ──────────────────────────────────
const VictoryRays = ({ category }: { category: Category }) => {
  const accent = ACCENT_COLORS[category];
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-0"
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      style={{
        background: `conic-gradient(from 0deg, transparent 0deg, rgba(${accent.rgb}, 0.06) 10deg, transparent 20deg, transparent 40deg, rgba(${accent.rgb}, 0.04) 50deg, transparent 60deg, transparent 80deg, rgba(${accent.rgb}, 0.06) 90deg, transparent 100deg, transparent 120deg, rgba(${accent.rgb}, 0.03) 130deg, transparent 140deg, transparent 160deg, rgba(${accent.rgb}, 0.05) 170deg, transparent 180deg, transparent 200deg, rgba(${accent.rgb}, 0.04) 210deg, transparent 220deg, transparent 240deg, rgba(${accent.rgb}, 0.06) 250deg, transparent 260deg, transparent 280deg, rgba(${accent.rgb}, 0.03) 290deg, transparent 300deg, transparent 320deg, rgba(${accent.rgb}, 0.05) 330deg, transparent 340deg, transparent 360deg)`,
        maskImage: "radial-gradient(circle, black 20%, transparent 70%)",
        WebkitMaskImage: "radial-gradient(circle, black 20%, transparent 70%)",
      }}
    />
  );
};

// ─── Tag Hit Ripple Effect ───────────────────────────────────────────────────
const TagRipple = ({ active }: { active: boolean }) => (
  <AnimatePresence>
    {active && (
      <>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-red-500/40 pointer-events-none z-50"
            initial={{ scale: 0.3, opacity: 0.8 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, delay: i * 0.15, ease: "easeOut" }}
          />
        ))}
        <motion.div
          className="absolute inset-0 bg-red-500/10 pointer-events-none z-40"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      </>
    )}
  </AnimatePresence>
);

// ─── Radar Blip (player dot on radar) ────────────────────────────────────────
const RadarBlip = ({ angle, distance, maxDistance, category }: {
  angle: number;
  distance: number;
  maxDistance: number;
  category: Category;
}) => {
  const accent = ACCENT_COLORS[category];
  const normalized = Math.min(distance / maxDistance, 1);
  const radius = normalized * 90; // max 90px from center
  const rad = (angle - 90) * (Math.PI / 180);
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius;
  const isClose = distance <= 8;

  return (
    <motion.div
      className="absolute z-20"
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: "translate(-50%, -50%)",
      }}
      animate={{
        x: [0, (Math.random() - 0.5) * 3, 0],
        y: [0, (Math.random() - 0.5) * 3, 0],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Outer glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: isClose ? 24 : 16,
          height: isClose ? 24 : 16,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, rgba(${accent.rgb}, 0.4) 0%, transparent 70%)`,
        }}
        animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0.2, 0.6] }}
        transition={{ duration: isClose ? 0.8 : 1.5, repeat: Infinity }}
      />
      {/* Core dot */}
      <div
        className="w-2.5 h-2.5 rounded-full relative"
        style={{
          backgroundColor: accent.primary,
          boxShadow: `0 0 8px rgba(${accent.rgb}, 0.6)`,
        }}
      />
    </motion.div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function ProximityTag({ onBack, category = "dating" }: ProximityTagProps) {
  const theme = THEMES[category];
  const accent = ACCENT_COLORS[category];
  const listTargets = TARGETS[category];

  // ─── Game States (ALL PRESERVED) ─────────────────────────────────────────
  const [gameState, setGameState] = useState<GameState>("lobby");
  const [selectedTarget, setSelectedTarget] = useState<TargetUser | null>(null);

  // Gameplay parameters
  const [distance, setDistance] = useState(30);
  const [compassAngle, setCompassAngle] = useState(0);
  const [timeLeft, setTimeLeft] = useState(40);
  const [eventLog, setEventLog] = useState<string[]>([]);
  
  // Power-up cooldown states (in seconds remaining)
  const [speedBoostCd, setSpeedBoostCd] = useState(0);
  const [radarPingCd, setRadarPingCd] = useState(0);
  
  const [countdown, setCountdown] = useState(3);
  const [radarScanning, setRadarScanning] = useState(true);

  // Premium visual states
  const [showTagRipple, setShowTagRipple] = useState(false);
  const [nearMissFlash, setNearMissFlash] = useState(false);

  // Timekeeper refs
  const chaseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetMotionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Radar sweep on lobby mount (PRESERVED) ─────────────────────────────
  useEffect(() => {
    if (gameState === "lobby") {
      setRadarScanning(true);
      const timer = setTimeout(() => {
        setRadarScanning(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  // ─── Countdown timer (PRESERVED) ────────────────────────────────────────
  useEffect(() => {
    if (gameState === "countdown") {
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setGameState("chase");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState]);

  // ─── Cooldown timer ticks (PRESERVED) ───────────────────────────────────
  useEffect(() => {
    if (gameState === "chase") {
      cooldownTimerRef.current = setInterval(() => {
        setSpeedBoostCd(prev => (prev > 0 ? prev - 1 : 0));
        setRadarPingCd(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => {
        if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
      };
    }
  }, [gameState]);

  // ─── Log message helper (PRESERVED) ─────────────────────────────────────
  const addLog = (msg: string) => {
    setEventLog(prev => [msg, ...prev.slice(0, 15)]);
  };

  // ─── Near-miss detection (NEW) ──────────────────────────────────────────
  useEffect(() => {
    if (gameState === "chase" && distance > 3 && distance <= 5) {
      setNearMissFlash(true);
      const t = setTimeout(() => setNearMissFlash(false), 600);
      return () => clearTimeout(t);
    }
  }, [distance, gameState]);

  // ─── Simulated evasion movements (PRESERVED) ───────────────────────────
  const handleTargetEvasion = useCallback(() => {
    if (!selectedTarget) return;

    const rand = Math.random();
    let distChange = 0;
    let angleChange = 0;
    let eventMsg = "";

    if (selectedTarget.speed === "Normal") {
      if (rand < 0.3) {
        distChange = 1.5;
        eventMsg = `${selectedTarget.name} walked a bit faster (+1.5m)`;
      } else if (rand < 0.5) {
        angleChange = Math.floor(Math.random() * 40) - 20;
        eventMsg = `${selectedTarget.name} turned slightly`;
      }
    } else if (selectedTarget.speed === "Fast") {
      if (rand < 0.4) {
        distChange = 2.8;
        eventMsg = `${selectedTarget.name} is jogging! (+2.8m)`;
      } else if (rand < 0.6) {
        angleChange = Math.floor(Math.random() * 60) - 30;
        eventMsg = `${selectedTarget.name} adjusted path`;
      }
    } else { // Evasive
      if (rand < 0.3) {
        distChange = 3.5;
        eventMsg = `${selectedTarget.name} sprinted ahead! (+3.5m)`;
      } else if (rand < 0.6) {
        angleChange = Math.floor(Math.random() * 110) - 55;
        eventMsg = `${selectedTarget.name} made a sudden sharp turn!`;
      } else if (rand < 0.75) {
        distChange = -1.5;
        eventMsg = `${selectedTarget.name} doubled back towards you!`;
      }
    }

    if (eventMsg) {
      addLog(eventMsg);
    }

    setDistance(d => {
      const nextDist = Math.max(1, d + distChange);
      return Math.round(nextDist * 10) / 10;
    });

    setCompassAngle(a => {
      const nextAngle = (a + angleChange + 360) % 360;
      return nextAngle;
    });

  }, [selectedTarget]);

  // ─── Chase timer and loop (PRESERVED) ──────────────────────────────────
  useEffect(() => {
    if (gameState === "chase" && selectedTarget) {
      setTimeLeft(40);
      setEventLog(["Chase started! Follow the radar compass."]);

      chaseTimerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            if (chaseTimerRef.current) clearInterval(chaseTimerRef.current);
            if (targetMotionTimerRef.current) clearInterval(targetMotionTimerRef.current);
            setGameState("fail");
            return 0;
          }
          return t - 1;
        });
      }, 1000);

      targetMotionTimerRef.current = setInterval(() => {
        handleTargetEvasion();
      }, 2000);

      return () => {
        if (chaseTimerRef.current) clearInterval(chaseTimerRef.current);
        if (targetMotionTimerRef.current) clearInterval(targetMotionTimerRef.current);
      };
    }
  }, [gameState, selectedTarget, handleTargetEvasion]);

  // ─── Walk Closer Action (PRESERVED) ────────────────────────────────────
  const handleWalkCloser = () => {
    if (gameState !== "chase") return;
    
    const steps = 1.2 + Math.random() * 1.2;
    setDistance(d => {
      const nextD = Math.max(0.5, d - steps);
      return Math.round(nextD * 10) / 10;
    });

    setCompassAngle(a => {
      const dev = Math.floor(Math.random() * 16) - 8;
      return (a + dev + 360) % 360;
    });

    addLog(`You advanced closer (-${steps.toFixed(1)}m)`);
  };

  // ─── Speed Boost Powerup (PRESERVED) ───────────────────────────────────
  const handleSpeedBoost = () => {
    if (gameState !== "chase" || speedBoostCd > 0) return;
    
    setDistance(d => {
      const nextD = Math.max(0.5, d - 6);
      return Math.round(nextD * 10) / 10;
    });
    setSpeedBoostCd(12);
    addLog("⚡ SPEED BOOST! Closed distance rapidly (-6m)");
  };

  // ─── Radar Sync Powerup (PRESERVED) ────────────────────────────────────
  const handleRadarPing = () => {
    if (gameState !== "chase" || radarPingCd > 0) return;
    
    setCompassAngle(0);
    setRadarPingCd(8);
    addLog("📡 RADAR SYNCED: Target direction locked to 0°");
  };

  // ─── Target Selection (PRESERVED) ──────────────────────────────────────
  const handleSelectTarget = (target: TargetUser) => {
    setSelectedTarget(target);
    setDistance(target.baseDistance);
    setCompassAngle(Math.floor(Math.random() * 180) + 90);
    setGameState("countdown");
  };

  // ─── Final Tag Action (PRESERVED) ──────────────────────────────────────
  const handleTagTarget = () => {
    if (distance <= 3.0) {
      if (chaseTimerRef.current) clearInterval(chaseTimerRef.current);
      if (targetMotionTimerRef.current) clearInterval(targetMotionTimerRef.current);
      setShowTagRipple(true);
      setTimeout(() => {
        setShowTagRipple(false);
        setGameState("success");
      }, 800);
    }
  };

  // ─── Reset (PRESERVED) ─────────────────────────────────────────────────
  const handleReset = () => {
    setGameState("lobby");
    setSelectedTarget(null);
  };

  // ─── Signal Strength (PRESERVED) ───────────────────────────────────────
  const getSignalStrength = () => {
    if (distance > 22) return { label: "Cold Signal", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", dot: "bg-blue-500" };
    if (distance > 8) return { label: "Warm Signal", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-500" };
    return { label: "HOT SIGNAL!", color: "text-rose-500 font-extrabold", bg: "bg-rose-500/20", border: "border-rose-500/40", dot: "bg-red-500" };
  };

  const signal = getSignalStrength();
  const isUrgent = timeLeft <= 10;
  const points = 200 + (timeLeft * 5);
  const chaseDuration = 40 - timeLeft;

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950 text-white select-none">
      
      {/* ── GLOBAL PREMIUM LAYERS ── */}
      <NoiseOverlay />
      <FloatingOrbs category={category} />
      <DustMotes category={category} />
      
      {/* Tag ripple effect overlay */}
      <TagRipple active={showTagRipple} />

      {/* Near-miss amber flash */}
      <AnimatePresence>
        {nearMissFlash && (
          <motion.div
            className="absolute inset-0 bg-amber-500/8 pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Dark atmospheric gradient overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, rgba(${accent.rgb}, 0.06) 0%, transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(15,23,42,0.9) 0%, transparent 50%)`,
        }}
      />

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── SCREEN: LOBBY ── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {gameState === "lobby" && (
        <div className="absolute inset-0 flex flex-col justify-between" style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          
          {/* Glassmorphic Header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.06] z-20"
            style={{ background: "rgba(2,6,23,0.7)", backdropFilter: "blur(20px)" }}>
            <motion.button
              onClick={onBack}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.1] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-300" />
            </motion.button>
            <div className="flex items-center gap-2">
              <Target className={`w-4 h-4 ${theme.textAccent}`} />
              <span className={`text-sm font-black uppercase tracking-[0.2em] bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
                Proximity Tag
              </span>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[8px] uppercase tracking-wider font-bold">BETA</span>
            </div>
            <div style={{ width: "36px" }} />
          </div>

          {/* Radar Scanner + Target List */}
          <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col">
            
            {/* Premium Radar Visual */}
            <div className="flex flex-col items-center justify-center py-6 mb-6">
              <div className="relative w-44 h-44 flex items-center justify-center">
                
                {/* Concentric ring pulses */}
                <AnimatePresence>
                  {radarScanning && [1, 2, 3].map((ring) => (
                    <motion.div
                      key={ring}
                      initial={{ scale: 0.5, opacity: 0.8 }}
                      animate={{ scale: 2.2, opacity: 0 }}
                      transition={{ duration: 2.2, repeat: Infinity, delay: ring * 0.7, ease: "easeOut" }}
                      className="absolute inset-0 rounded-full"
                      style={{ border: `2px solid rgba(${accent.rgb}, 0.25)` }}
                    />
                  ))}
                </AnimatePresence>

                {/* Glassmorphic radar circle */}
                <div
                  className="w-40 h-40 rounded-full border border-dashed flex items-center justify-center relative"
                  style={{
                    borderColor: `rgba(${accent.rgb}, 0.15)`,
                    background: `radial-gradient(circle, rgba(${accent.rgb}, 0.04) 0%, transparent 70%)`,
                    boxShadow: `inset 0 0 30px rgba(${accent.rgb}, 0.05)`,
                  }}
                >
                  {/* Grid crosshairs */}
                  <div className="absolute w-full h-px opacity-[0.06] bg-white" />
                  <div className="absolute h-full w-px opacity-[0.06] bg-white" />
                  
                  {/* Inner ring */}
                  <div className="absolute w-24 h-24 rounded-full border border-white/[0.04]" />
                  
                  <Compass className={`w-12 h-12 opacity-20 ${theme.textAccent}`} />
                </div>

                {/* Sweep line with trailing glow */}
                {radarScanning && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 w-full h-full flex justify-center origin-center"
                  >
                    <div className="relative w-0.5 h-1/2">
                      <div
                        className="w-full h-full"
                        style={{
                          background: `linear-gradient(to top, transparent, ${accent.primary})`,
                          boxShadow: `0 0 8px rgba(${accent.rgb}, 0.4)`,
                          opacity: 0.7,
                        }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Center pin with glow */}
                <div
                  className="absolute w-7 h-7 rounded-full flex items-center justify-center z-10 shadow-xl"
                  style={{
                    backgroundColor: accent.primary,
                    boxShadow: `0 0 16px rgba(${accent.rgb}, 0.4)`,
                  }}
                >
                  <Target className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              <h3 className="text-sm font-black tracking-[0.15em] uppercase mt-6 text-slate-200">
                {radarScanning ? "Locating targets..." : "GPS Connections Established"}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-[0.2em]">
                {radarScanning ? "Scanning nearby area" : "Choose a target to tag"}
              </p>
            </div>

            {/* Target list header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Nearby Targets</h4>
              {!radarScanning && (
                <motion.button
                  onClick={() => setGameState("lobby")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  className={`text-[10px] font-bold ${theme.textAccent} uppercase tracking-wide`}
                >
                  Rescan
                </motion.button>
              )}
            </div>

            {/* Target cards */}
            <div className="space-y-3 flex-1">
              <AnimatePresence>
                {!radarScanning && listTargets.map((target, idx) => (
                  <motion.div
                    key={target.name}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08, type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <GlassCard className="p-4 flex items-center gap-4 hover:border-white/[0.12] transition-colors" category={category}>
                      {/* Avatar with animated gradient ring */}
                      <div className="relative shrink-0">
                        <motion.div
                          className="absolute -inset-0.5 rounded-full"
                          style={{
                            background: `conic-gradient(from 0deg, ${accent.primary}, transparent, ${accent.primary})`,
                            opacity: 0.5,
                          }}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        />
                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-900 relative">
                          <img src={target.photo} alt={target.name} className="w-full h-full object-cover" />
                        </div>
                      </div>

                      {/* Target Information */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-200 text-sm">{target.name}</span>
                          {target.age && <span className="text-xs text-slate-400">, {target.age}</span>}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 truncate">{target.description}</p>
                        
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[9px] text-slate-500 font-bold bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
                            📍 {target.baseDistance}m away
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            target.speed === 'Normal' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            target.speed === 'Fast' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            🏃 {target.speed}
                          </span>
                        </div>
                      </div>

                      {/* Hunt button with shimmer */}
                      <ShimmerButton
                        onClick={() => handleSelectTarget(target)}
                        className={`px-4 py-2.5 rounded-xl bg-gradient-to-r ${theme.gradient} text-white font-black text-xs uppercase tracking-wider shrink-0 shadow-md`}
                      >
                        Hunt
                      </ShimmerButton>
                    </GlassCard>
                  </motion.div>
                ))}
              </AnimatePresence>

              {radarScanning && (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-transparent animate-spin mb-3"
                    style={{ borderTopColor: accent.primary }} />
                  <p className="text-xs text-slate-500 font-medium">Acquiring GPS data...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── SCREEN: CINEMATIC COUNTDOWN ── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {gameState === "countdown" && selectedTarget && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30"
          style={{ background: "rgba(2,6,23,0.92)" }}>
          
          {/* Letterbox bars */}
          <motion.div
            className="absolute top-0 left-0 right-0 bg-black z-40"
            initial={{ height: 0 }}
            animate={{ height: 48 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-black z-40"
            initial={{ height: 0 }}
            animate={{ height: 48 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />

          <div className="text-center relative">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-6"
            >
              Acquiring Target Lock
            </motion.p>

            <AnimatePresence mode="popLayout">
              <motion.div
                key={countdown}
                initial={{ scale: 0, opacity: 0, filter: "blur(20px)" }}
                animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                exit={{ scale: 3, opacity: 0, filter: "blur(10px)" }}
                transition={{ duration: 0.7, type: "spring", stiffness: 200, damping: 20 }}
                className="relative"
              >
                {/* Countdown number glow backdrop */}
                <div
                  className="absolute inset-0 blur-3xl opacity-30"
                  style={{ backgroundColor: accent.primary }}
                />
                <h1
                  className="text-9xl font-black relative z-10"
                  style={{
                    background: `linear-gradient(135deg, ${accent.primary}, white)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: "none",
                  }}
                >
                  {countdown === 0 ? "GO" : countdown}
                </h1>
              </motion.div>
            </AnimatePresence>

            {/* Target info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 flex items-center justify-center gap-3"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                <img src={selectedTarget.photo} alt="" className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-black text-slate-200 uppercase tracking-[0.15em]">
                Tracking {selectedTarget.name}
              </span>
            </motion.div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── SCREEN: ACTIVE CHASE ── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {gameState === "chase" && selectedTarget && (
        <div className="absolute inset-0 flex flex-col justify-between" style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          
          {/* Header Stats bar */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.06] z-20"
            style={{ background: "rgba(2,6,23,0.7)", backdropFilter: "blur(20px)" }}>
            
            {/* Circular timer */}
            <TimerRing timeLeft={timeLeft} maxTime={40} category={category} />

            {/* Target name + signal indicator */}
            <div className="flex items-center gap-2">
              <motion.div
                className={`w-2.5 h-2.5 rounded-full ${signal.dot}`}
                animate={distance <= 8 ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] } : {}}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
              <span className="text-xs font-black text-slate-300 uppercase tracking-[0.15em]">{selectedTarget.name}</span>
            </div>

            {/* Role badge */}
            <div className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.15em]"
              style={{ background: `rgba(${accent.rgb}, 0.15)`, color: accent.primary, border: `1px solid rgba(${accent.rgb}, 0.2)` }}>
              TAGGER
            </div>
          </div>

          {/* ── Compass Radar Core ── */}
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            
            {/* Glassmorphic Radar */}
            <div className="relative w-56 h-56 flex items-center justify-center mb-6">
              
              {/* Outer calibration ring */}
              <div className="absolute inset-0 rounded-full border border-white/[0.06]">
                {/* Cardinal directions */}
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-500 tracking-widest">N</div>
                <div className="absolute top-1/2 -right-0.5 -translate-y-1/2 text-[8px] font-black text-slate-500">E</div>
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-500">S</div>
                <div className="absolute top-1/2 -left-0.5 -translate-y-1/2 text-[8px] font-black text-slate-500">W</div>
              </div>

              {/* Concentric rings with fade */}
              <div className="absolute w-44 h-44 rounded-full border border-white/[0.04]" />
              <div className="absolute w-32 h-32 rounded-full border border-white/[0.03]" />
              <div className="absolute w-20 h-20 rounded-full border border-white/[0.02]" />

              {/* Grid lines */}
              <div className="absolute w-full h-px bg-white/[0.03]" />
              <div className="absolute h-full w-px bg-white/[0.03]" />
              <div className="absolute w-full h-px bg-white/[0.02] rotate-45" />
              <div className="absolute w-full h-px bg-white/[0.02] -rotate-45" />

              {/* Glassmorphic radar fill */}
              <div
                className="absolute inset-2 rounded-full"
                style={{
                  background: `radial-gradient(circle, rgba(${accent.rgb}, 0.03) 0%, rgba(2,6,23,0.6) 70%)`,
                  boxShadow: `inset 0 0 40px rgba(${accent.rgb}, 0.04)`,
                }}
              />

              {/* Animated sweep line */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 w-full h-full flex justify-center origin-center pointer-events-none"
              >
                <div className="relative w-0.5 h-1/2">
                  <div
                    className="w-full h-full"
                    style={{
                      background: `linear-gradient(to top, transparent 20%, rgba(${accent.rgb}, 0.5))`,
                      boxShadow: `0 0 12px rgba(${accent.rgb}, 0.3)`,
                    }}
                  />
                </div>
                {/* Trailing glow wedge */}
                <div
                  className="absolute top-0 left-1/2 h-1/2 w-1/2 origin-bottom-left"
                  style={{
                    background: `conic-gradient(from -5deg, rgba(${accent.rgb}, 0.08), transparent 30deg)`,
                    transform: "rotate(-30deg)",
                  }}
                />
              </motion.div>

              {/* Target blip */}
              <RadarBlip
                angle={compassAngle}
                distance={distance}
                maxDistance={50}
                category={category}
              />

              {/* Rotating compass needle */}
              <motion.div
                animate={{ rotate: compassAngle }}
                transition={{ type: "spring", stiffness: 90, damping: 15 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="relative w-10 h-32 flex justify-center -translate-y-[2px]">
                  <div
                    className="w-0.5 h-1/2"
                    style={{
                      background: `linear-gradient(to top, transparent, ${accent.primary})`,
                      boxShadow: `0 0 6px rgba(${accent.rgb}, 0.3)`,
                    }}
                  />
                  {/* Arrow head */}
                  <div
                    className="absolute top-0 w-3 h-3 rotate-45 border-t-2 border-l-2 shadow-lg"
                    style={{ borderColor: accent.primary }}
                  />
                </div>
              </motion.div>

              {/* Center distance HUD */}
              <GlassCard className="absolute w-24 h-24 rounded-full flex flex-col items-center justify-center z-10" glow category={category}>
                <motion.span
                  key={distance}
                  initial={{ scale: 1.15 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-black text-white tracking-tight"
                >
                  {distance}m
                </motion.span>
                <span className="text-[7px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-0.5">Distance</span>
              </GlassCard>
            </div>

            {/* Signal strength badge */}
            <motion.div
              className={`px-5 py-2 rounded-full border text-xs font-black uppercase tracking-[0.15em] ${signal.bg} ${signal.border} ${signal.color}`}
              animate={distance <= 8 ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              <span className="flex items-center gap-2">
                <Radio className="w-3 h-3" />
                {signal.label}
              </span>
            </motion.div>
          </div>

          {/* Event Log */}
          <div className="px-6 py-2 max-h-[70px] overflow-hidden select-none border-t border-b border-white/[0.04]"
            style={{ background: "rgba(2,6,23,0.5)" }}>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={eventLog[0]}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-slate-400 text-xs font-semibold text-center italic truncate"
              >
                {eventLog[0] || "Compass stabilized..."}
              </motion.div>
            </AnimatePresence>
            {eventLog[1] && (
              <div className="text-slate-600 text-[10px] font-medium text-center truncate mt-0.5">
                {eventLog[1]}
              </div>
            )}
          </div>

          {/* Interactive buttons */}
          <div className="p-6 flex flex-col gap-4" style={{ background: "rgba(2,6,23,0.9)" }}>
            
            {/* Primary tag / Walk closer */}
            {distance <= 3.0 ? (
              <ShimmerButton
                onClick={handleTagTarget}
                className={`w-full py-4 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-black text-sm uppercase tracking-[0.15em] shadow-xl`}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  <Target className="w-5 h-5" />
                </motion.div>
                <span>Tag {selectedTarget.name.toUpperCase()}!</span>
              </ShimmerButton>
            ) : (
              <ShimmerButton
                onClick={handleWalkCloser}
                className={`w-full py-4 rounded-2xl bg-gradient-to-r ${theme.actionBtnGrad} text-white font-black text-sm uppercase tracking-[0.15em] shadow-md`}
              >
                <Crosshair className="w-4 h-4" />
                Close In Distance
              </ShimmerButton>
            )}

            {/* Powerup row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Speed Boost */}
              <motion.button
                onClick={handleSpeedBoost}
                disabled={speedBoostCd > 0 || distance <= 3.0}
                whileHover={{ scale: (speedBoostCd > 0 || distance <= 3.0) ? 1 : 1.02 }}
                whileTap={{ scale: (speedBoostCd > 0 || distance <= 3.0) ? 1 : 0.95 }}
                className={`py-3.5 rounded-xl border flex flex-col items-center justify-center transition-all relative overflow-hidden ${
                  speedBoostCd > 0 || distance <= 3.0
                    ? 'border-white/[0.04] text-slate-600 bg-white/[0.01] cursor-not-allowed'
                    : 'border-amber-500/20 bg-amber-500/5 text-amber-400'
                }`}
              >
                {/* Cooldown fill */}
                {speedBoostCd > 0 && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-amber-500/10"
                    initial={{ height: "100%" }}
                    animate={{ height: "0%" }}
                    transition={{ duration: speedBoostCd, ease: "linear" }}
                  />
                )}
                <div className="flex items-center gap-1.5 relative z-10">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-wider">Speed Boost</span>
                </div>
                <span className="text-[8px] text-slate-500 uppercase tracking-[0.15em] mt-0.5 relative z-10">
                  {speedBoostCd > 0 ? `${speedBoostCd}s remaining` : "-6m instantly"}
                </span>
              </motion.button>

              {/* Radar Sync */}
              <motion.button
                onClick={handleRadarPing}
                disabled={radarPingCd > 0 || distance <= 3.0}
                whileHover={{ scale: (radarPingCd > 0 || distance <= 3.0) ? 1 : 1.02 }}
                whileTap={{ scale: (radarPingCd > 0 || distance <= 3.0) ? 1 : 0.95 }}
                className={`py-3.5 rounded-xl border flex flex-col items-center justify-center transition-all relative overflow-hidden ${
                  radarPingCd > 0 || distance <= 3.0
                    ? 'border-white/[0.04] text-slate-600 bg-white/[0.01] cursor-not-allowed'
                    : 'border-blue-500/20 bg-blue-500/5 text-blue-400'
                }`}
              >
                {radarPingCd > 0 && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-blue-500/10"
                    initial={{ height: "100%" }}
                    animate={{ height: "0%" }}
                    transition={{ duration: radarPingCd, ease: "linear" }}
                  />
                )}
                <div className="flex items-center gap-1.5 relative z-10">
                  <Compass className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-wider">Radar Sync</span>
                </div>
                <span className="text-[8px] text-slate-500 uppercase tracking-[0.15em] mt-0.5 relative z-10">
                  {radarPingCd > 0 ? `${radarPingCd}s remaining` : "Lock 0° angle"}
                </span>
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── SCREEN: SUCCESS ── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {gameState === "success" && selectedTarget && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col justify-between p-6 z-30"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {/* Victory rays background */}
          <VictoryRays category={category} />

          <div style={{ height: "44px" }} />

          <div className="w-full max-w-sm mx-auto relative z-10">
            {/* Glassmorphic results card with rotating conic-gradient border */}
            <div className="relative rounded-3xl p-[1px] overflow-hidden">
              {/* Animated conic border */}
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                style={{
                  background: `conic-gradient(from 0deg, ${accent.primary}, transparent 30%, transparent 50%, ${accent.primary} 60%, transparent 90%)`,
                  opacity: 0.4,
                }}
              />
              
              {/* Card content */}
              <div
                className="relative rounded-3xl p-8 text-center backdrop-blur-xl"
                style={{
                  background: `linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(2,6,23,0.98) 100%)`,
                  boxShadow: `0 0 60px -20px rgba(${accent.rgb}, 0.2)`,
                }}
              >
                {/* Trophy icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  className="mb-4"
                >
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto relative"
                    style={{
                      background: "rgba(245,158,11,0.1)",
                      border: "1px solid rgba(245,158,11,0.25)",
                      boxShadow: "0 0 30px rgba(245,158,11,0.1)",
                    }}
                  >
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Trophy className="w-10 h-10 text-amber-400" />
                    </motion.div>
                    <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-amber-300" />
                  </div>
                </motion.div>

                {/* Title with gradient */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl font-black uppercase tracking-[0.15em] mb-1"
                  style={{
                    background: `linear-gradient(135deg, white 40%, ${accent.primary})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Tag Secured!
                </motion.h2>
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-[0.2em] mb-5">Success</p>

                {/* Target details */}
                <GlassCard className="p-4 mb-5 text-left" category={category}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10">
                      <img src={selectedTarget.photo} alt={selectedTarget.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-200">{selectedTarget.name}</h4>
                      <p className="text-[9px] text-slate-500">evaded at speed: {selectedTarget.speed}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed mt-2 border-t border-white/[0.06] pt-2.5">
                    {theme.successMsg}
                  </p>
                </GlassCard>

                {/* Animated stat bars */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="rounded-xl p-3 text-center"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <p className="text-xl font-black text-white">{chaseDuration}s</p>
                    <p className="text-[8px] text-slate-500 uppercase tracking-[0.15em] font-bold mt-0.5">Chase Duration</p>
                    {/* Duration bar */}
                    <div className="mt-2 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${accent.primary}, transparent)` }}
                        initial={{ width: "0%" }}
                        animate={{ width: `${Math.min((chaseDuration / 40) * 100, 100)}%` }}
                        transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="rounded-xl p-3 text-center"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <p className="text-xl font-black text-amber-400">+{points}</p>
                    <p className="text-[8px] text-slate-500 uppercase tracking-[0.15em] font-bold mt-0.5">Points Earned</p>
                    {/* Points bar */}
                    <div className="mt-2 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg, #f59e0b, transparent)" }}
                        initial={{ width: "0%" }}
                        animate={{ width: `${Math.min((points / 400) * 100, 100)}%` }}
                        transition={{ delay: 0.9, duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </motion.div>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  <ShimmerButton
                    onClick={() => {
                      alert(`${category === "dating" ? "Opening conversation with " : category === "friends" ? "Adding friend " : "Requesting meetup with "} ${selectedTarget.name}!`);
                      handleReset();
                    }}
                    className={`w-full py-4 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-black text-sm uppercase tracking-[0.15em] shadow-lg`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{theme.ctaText}</span>
                  </ShimmerButton>
                  
                  <ShimmerButton
                    onClick={handleReset}
                    className="w-full py-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-slate-200 text-sm font-bold hover:bg-white/[0.1] transition-colors"
                  >
                    Tag Someone Else
                  </ShimmerButton>
                </div>
              </div>
            </div>
          </div>

          <div style={{ height: "44px" }} />
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── SCREEN: FAIL ── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {gameState === "fail" && selectedTarget && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col justify-between p-6 z-30"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {/* Failure screen shake */}
          <motion.div
            className="absolute inset-0 bg-red-500/5 pointer-events-none"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1 }}
          />

          <div style={{ height: "44px" }} />

          <motion.div
            className="w-full max-w-sm mx-auto"
            initial={{ x: 0 }}
            animate={{ x: [0, -8, 8, -6, 6, -3, 3, 0] }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Glassmorphic fail card */}
            <div className="relative rounded-3xl p-[1px] overflow-hidden">
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                style={{
                  background: `conic-gradient(from 0deg, #ef4444, transparent 30%, transparent 50%, #ef4444 60%, transparent 90%)`,
                  opacity: 0.3,
                }}
              />
              
              <div
                className="relative rounded-3xl p-8 text-center backdrop-blur-xl"
                style={{
                  background: "linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(2,6,23,0.98) 100%)",
                  boxShadow: "0 0 60px -20px rgba(239,68,68,0.15)",
                }}
              >
                {/* Fail icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="mb-4"
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
                    <motion.div
                      animate={{ rotate: [0, -10, 10, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    >
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                    </motion.div>
                  </div>
                </motion.div>

                <h2
                  className="text-2xl font-black uppercase tracking-[0.15em] mb-1"
                  style={{
                    background: "linear-gradient(135deg, white 40%, #ef4444)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Target Escaped!
                </h2>
                <p className="text-xs text-red-400 font-bold uppercase tracking-[0.2em] mb-6">Time Expired</p>

                <GlassCard className="p-4 mb-6">
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    {selectedTarget.name} was too fast! They slipped out of radar range before you could secure the tag contact.
                  </p>
                </GlassCard>

                <div className="space-y-3">
                  <ShimmerButton
                    onClick={() => handleSelectTarget(selectedTarget)}
                    className="w-full py-3.5 rounded-2xl bg-slate-200 text-slate-950 font-black text-sm uppercase tracking-[0.15em]"
                  >
                    Try Again
                  </ShimmerButton>
                  
                  <ShimmerButton
                    onClick={handleReset}
                    className="w-full py-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-slate-200 text-sm font-bold hover:bg-white/[0.1] transition-colors"
                  >
                    Select Other Target
                  </ShimmerButton>
                </div>
              </div>
            </div>
          </motion.div>

          <div style={{ height: "44px" }} />
        </motion.div>
      )}

    </div>
  );
}
