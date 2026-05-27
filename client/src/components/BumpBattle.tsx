import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Zap, Trophy, ShieldAlert, Timer, RefreshCcw, ChevronLeft, User, MapPin, Sparkles, MessageSquare, ArrowRight, Award } from "lucide-react";

type Category = "dating" | "friends" | "business";

interface BumpBattleProps {
  onBack: () => void;
  category?: Category;
}

interface Opponent {
  name: string;
  age?: number;
  photo: string;
  distance: string;
  description: string;
  baseReaction: number; // base reaction time in ms
}

const OPPONENTS: Record<Category, Opponent[]> = {
  dating: [
    { name: "Aly", age: 30, photo: "https://picsum.photos/seed/bb_d1/120/120", distance: "3m away", description: "Likes live music & spicy food", baseReaction: 310 },
    { name: "Shay", age: 27, photo: "https://picsum.photos/seed/bb_d2/120/120", distance: "6m away", description: "Rooftop terrace collector", baseReaction: 340 },
    { name: "Marcus", age: 31, photo: "https://picsum.photos/seed/bb_d3/120/120", distance: "8m away", description: "Always down for a deep chat", baseReaction: 290 },
  ],
  friends: [
    { name: "Sarah", age: 24, photo: "https://picsum.photos/seed/bb_f1/120/120", distance: "4m away", description: "Board game nerd & coffee addict", baseReaction: 300 },
    { name: "Kevin", age: 29, photo: "https://picsum.photos/seed/bb_f2/120/120", distance: "7m away", description: "Trail running & weekend hiking", baseReaction: 320 },
    { name: "Jess", age: 26, photo: "https://picsum.photos/seed/bb_f3/120/120", distance: "12m away", description: "DJ & underground vinyl digger", baseReaction: 280 },
  ],
  business: [
    { name: "David", photo: "https://picsum.photos/seed/bb_b1/120/120", distance: "2m away", description: "SaaS founder, building in AI", baseReaction: 285 },
    { name: "Elena", photo: "https://picsum.photos/seed/bb_b2/120/120", distance: "5m away", description: "Growth marketer & startup advisor", baseReaction: 315 },
    { name: "Aaron", photo: "https://picsum.photos/seed/bb_b3/120/120", distance: "9m away", description: "Early-stage VC, coffee-driven", baseReaction: 330 },
  ],
};

const THEMES: Record<Category, { gradient: string; textAccent: string; bgAccent: string; cardGrad: string; ctaText: string; rewardDesc: string }> = {
  dating: {
    gradient: "from-pink-500 via-rose-500 to-red-500",
    textAccent: "text-pink-400",
    bgAccent: "bg-pink-500/15",
    cardGrad: "from-pink-950/80 via-rose-950/60 to-slate-950/90",
    ctaText: "Break the Ice Chat",
    rewardDesc: "Connection sparked! You can now send a direct icebreaker message.",
  },
  friends: {
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    textAccent: "text-emerald-400",
    bgAccent: "bg-emerald-500/15",
    cardGrad: "from-emerald-950/80 via-green-950/60 to-slate-950/90",
    ctaText: "Connect as Friends",
    rewardDesc: "Bragging rights secured! You've been added to each other's friend circle.",
  },
  business: {
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    textAccent: "text-blue-400",
    bgAccent: "bg-blue-500/15",
    cardGrad: "from-blue-950/80 via-indigo-950/60 to-slate-950/90",
    ctaText: "Exchange Digital vCard",
    rewardDesc: "Deal struck! Business contact details are now exchanged successfully.",
  },
};

/* ── Category accent color helpers ── */
const ACCENT_COLORS: Record<Category, { primary: string; glow: string; ring: string; rgb: string }> = {
  dating:   { primary: "#ec4899", glow: "shadow-pink-500/40",    ring: "ring-pink-500/60",    rgb: "236,72,153" },
  friends:  { primary: "#10b981", glow: "shadow-emerald-500/40", ring: "ring-emerald-500/60",  rgb: "16,185,129" },
  business: { primary: "#3b82f6", glow: "shadow-blue-500/40",    ring: "ring-blue-500/60",     rgb: "59,130,246" },
};

type GameState = "lobby" | "matchmaking" | "countdown" | "ready" | "trigger" | "round_result" | "complete";

/* ═══════════════════════════════════════════════
   PREMIUM VISUAL SUB-COMPONENTS
   ═══════════════════════════════════════════════ */

/* ── SVG Noise Texture Overlay ── */
const NoiseOverlay = () => (
  <svg className="pointer-events-none fixed inset-0 z-[100] h-full w-full opacity-[0.035]" aria-hidden>
    <filter id="bbNoise">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
    </filter>
    <rect width="100%" height="100%" filter="url(#bbNoise)" />
  </svg>
);

/* ── Floating Background Orb ── */
const FloatingOrb = ({ color, size, delay, duration, x1, y1, x2, y2 }: {
  color: string; size: number; delay: number; duration: number;
  x1: string; y1: string; x2: string; y2: string;
}) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{
      width: size,
      height: size,
      background: `radial-gradient(circle, ${color}22 0%, ${color}08 60%, transparent 100%)`,
      filter: "blur(40px)",
    }}
    initial={{ left: x1, top: y1, opacity: 0.3 }}
    animate={{
      left: [x1, x2, x1],
      top: [y1, y2, y1],
      opacity: [0.2, 0.5, 0.2],
      scale: [1, 1.3, 1],
    }}
    transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

/* ── Ambient Dust Mote ── */
const DustMote = ({ delay, duration }: { delay: number; duration: number }) => (
  <motion.div
    className="absolute w-1 h-1 rounded-full bg-white/20 pointer-events-none"
    initial={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, opacity: 0 }}
    animate={{
      top: [`${60 + Math.random() * 40}%`, `${Math.random() * 30}%`],
      opacity: [0, 0.6, 0],
      scale: [0.5, 1, 0.3],
    }}
    transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
  />
);

/* ── Screen Shake Wrapper ── */
const ScreenShake = ({ trigger, children }: { trigger: boolean; children: React.ReactNode }) => (
  <motion.div
    animate={trigger ? { x: [0, -6, 6, -4, 4, -2, 2, 0], y: [0, 3, -3, 2, -2, 1, -1, 0] } : {}}
    transition={{ duration: 0.5 }}
    className="w-full h-full"
  >
    {children}
  </motion.div>
);

/* ── Damage Flash Overlay ── */
const DamageFlash = ({ type }: { type: "hit" | "foul" | "block" | null }) => {
  if (!type) return null;
  const colors: Record<string, string> = {
    hit: "bg-red-500/20",
    foul: "bg-red-600/30",
    block: "bg-blue-500/20",
  };
  return (
    <motion.div
      className={`absolute inset-0 z-[60] pointer-events-none ${colors[type] || "bg-red-500/20"}`}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    />
  );
};

/* ── Health Bar with color transitions ── */
const HealthBar = ({
  current,
  max,
  label,
  accentRgb,
}: {
  current: number;
  max: number;
  label: string;
  isPlayer: boolean;
  accentRgb: string;
}) => {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const barColor =
    pct > 60
      ? "from-emerald-400 to-emerald-500"
      : pct > 30
      ? "from-amber-400 to-yellow-500"
      : "from-red-500 to-rose-600";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
          {label}
        </span>
        <span className="text-[9px] font-bold text-slate-400">
          {current}/{max}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-800/80 backdrop-blur border border-white/5 overflow-hidden relative">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} relative`}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
        </motion.div>
        {/* Glow on low health */}
        {pct <= 30 && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                "0 0 8px rgba(239,68,68,0.3)",
                "0 0 16px rgba(239,68,68,0.6)",
                "0 0 8px rgba(239,68,68,0.3)",
              ],
            }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}
      </div>
    </div>
  );
};

/* ── Victory Rays (conic-gradient rotation) ── */
const VictoryRays = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none z-0"
    style={{
      background:
        "conic-gradient(from 0deg, transparent 0%, rgba(251,191,36,0.08) 10%, transparent 20%)",
    }}
    animate={{ rotate: 360 }}
    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
  />
);

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function BumpBattle({ onBack, category = "dating" }: BumpBattleProps) {
  const theme = THEMES[category];
  const accent = ACCENT_COLORS[category];
  const listOpponents = OPPONENTS[category];

  // ── Game States ──
  const [gameState, setGameState] = useState<GameState>("lobby");
  const [selectedOpponent, setSelectedOpponent] = useState<Opponent | null>(null);

  // ── Game stats ──
  const [currentRound, setCurrentRound] = useState(1);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [roundsHistory, setRoundsHistory] = useState<
    { winner: "player" | "opponent" | "foul"; playerTime: number | null; opponentTime: number }[]
  >([]);

  // ── Reaction timers ──
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [opponentTime, setOpponentTime] = useState<number>(0);
  const [roundWinner, setRoundWinner] = useState<"player" | "opponent" | "foul" | null>(null);

  // ── Logic states ──
  const [countdown, setCountdown] = useState(3);
  const [radarScanning, setRadarScanning] = useState(true);

  // ── Visual effect states ──
  const [shakeScreen, setShakeScreen] = useState(false);
  const [damageType, setDamageType] = useState<"hit" | "foul" | "block" | null>(null);

  // ── Timekeepers ──
  const triggerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerTimeRef = useRef<number>(0);
  const isTriggerableRef = useRef<boolean>(false);

  // ── Restart radar scan ──
  useEffect(() => {
    if (gameState === "lobby") {
      setRadarScanning(true);
      const timer = setTimeout(() => {
        setRadarScanning(false);
      }, 2500); // 2.5s scan animation
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  // ── Handle Matchmaking Countdown ──
  useEffect(() => {
    if (gameState === "countdown") {
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setGameState("ready");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState]);

  // ── Handle Random Trigger Delay ──
  useEffect(() => {
    if (gameState === "ready") {
      isTriggerableRef.current = false;
      const delay = 1500 + Math.random() * 2500; // 1.5s to 4s random delay

      triggerTimeoutRef.current = setTimeout(() => {
        setGameState("trigger");
        triggerTimeRef.current = Date.now();
        isTriggerableRef.current = true;
      }, delay);

      return () => {
        if (triggerTimeoutRef.current) clearTimeout(triggerTimeoutRef.current);
      };
    }
  }, [gameState]);

  // ── Clear visual effects after short delay ──
  useEffect(() => {
    if (shakeScreen) {
      const t = setTimeout(() => setShakeScreen(false), 600);
      return () => clearTimeout(t);
    }
  }, [shakeScreen]);

  useEffect(() => {
    if (damageType) {
      const t = setTimeout(() => setDamageType(null), 500);
      return () => clearTimeout(t);
    }
  }, [damageType]);

  // ── Trigger Action (Tapping to Bump) ──
  const handleBumpTap = () => {
    if (gameState === "ready") {
      // FOUL! Tapped before trigger
      if (triggerTimeoutRef.current) clearTimeout(triggerTimeoutRef.current);
      isTriggerableRef.current = false;

      const opTime =
        Math.floor(Math.random() * 100) + (selectedOpponent?.baseReaction || 300);

      setRoundWinner("foul");
      setReactionTime(null);
      setOpponentTime(opTime);
      setOpponentScore((prev) => prev + 1);
      setRoundsHistory((prev) => [
        ...prev,
        { winner: "foul", playerTime: null, opponentTime: opTime },
      ]);
      setShakeScreen(true);
      setDamageType("foul");
      setGameState("round_result");
      return;
    }

    if (gameState === "trigger" && isTriggerableRef.current) {
      isTriggerableRef.current = false;
      const clickTime = Date.now() - triggerTimeRef.current;
      setReactionTime(clickTime);

      // Simulate opponent speed
      const opTime =
        Math.floor(Math.random() * 110) + (selectedOpponent?.baseReaction || 300) - 20;
      setOpponentTime(opTime);

      let winner: "player" | "opponent";
      if (clickTime < opTime) {
        winner = "player";
        setPlayerScore((prev) => prev + 1);
      } else {
        winner = "opponent";
        setOpponentScore((prev) => prev + 1);
        setShakeScreen(true);
        setDamageType("hit");
      }

      setRoundWinner(winner);
      setRoundsHistory((prev) => [
        ...prev,
        { winner, playerTime: clickTime, opponentTime: opTime },
      ]);
      setGameState("round_result");
    }
  };

  // ── Challenge opponent ──
  const handleChallenge = (opp: Opponent) => {
    setSelectedOpponent(opp);
    setCurrentRound(1);
    setPlayerScore(0);
    setOpponentScore(0);
    setRoundsHistory([]);
    setGameState("matchmaking");

    // Simulate opponent accepting after 1.8s
    setTimeout(() => {
      setGameState("countdown");
    }, 1800);
  };

  // ── Next round navigation ──
  const handleNextRound = () => {
    // Check if match completed (best of 3 rounds — first to 2 points)
    if (playerScore >= 2 || opponentScore >= 2 || currentRound >= 3) {
      setGameState("complete");
    } else {
      setCurrentRound((prev) => prev + 1);
      setGameState("ready");
    }
  };

  const handleReset = () => {
    setGameState("lobby");
    setSelectedOpponent(null);
  };

  /* ── Derived helpers ── */
  const playerLeading = playerScore > opponentScore;
  const opponentLeading = opponentScore > playerScore;
  const playerWonMatch = playerScore > opponentScore;

  /* ── Progressive intensity factor (animations speed up in later rounds) ── */
  const intensityFactor = 1 + (currentRound - 1) * 0.15;

  return (
    <ScreenShake trigger={shakeScreen}>
      <div className="absolute inset-0 overflow-hidden bg-slate-950 text-white select-none">
        {/* ── NOISE OVERLAY ── */}
        <NoiseOverlay />

        {/* ── DAMAGE FLASH ── */}
        <AnimatePresence>
          {damageType && <DamageFlash type={damageType} />}
        </AnimatePresence>

        {/* ── FLOATING BACKGROUND ORBS (5) ── */}
        <FloatingOrb color={accent.primary} size={280} delay={0} duration={12} x1="-10%" y1="10%" x2="60%" y2="30%" />
        <FloatingOrb color={accent.primary} size={200} delay={2} duration={15} x1="70%" y1="60%" x2="20%" y2="80%" />
        <FloatingOrb color="#6366f1" size={240} delay={4} duration={18} x1="50%" y1="-5%" x2="10%" y2="50%" />
        <FloatingOrb color="#8b5cf6" size={160} delay={6} duration={14} x1="80%" y1="20%" x2="40%" y2="70%" />
        <FloatingOrb color={accent.primary} size={120} delay={3} duration={10} x1="30%" y1="80%" x2="70%" y2="10%" />

        {/* ── AMBIENT DUST MOTES (10) ── */}
        {Array.from({ length: 10 }).map((_, i) => (
          <DustMote key={`dust-${i}`} delay={i * 1.2} duration={8 + Math.random() * 6} />
        ))}

        {/* ── RADIAL BACKGROUND GRADIENT ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, rgba(${accent.rgb},0.06) 0%, transparent 70%)`,
          }}
        />

        {/* ═══════════════════════════════════════
            SCREEN: LOBBY
            ═══════════════════════════════════════ */}
        {gameState === "lobby" && (
          <div
            className="absolute inset-0 flex flex-col justify-between"
            style={{
              paddingTop: "env(safe-area-inset-top, 0px)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.06] bg-slate-950/70 backdrop-blur-xl z-20">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="w-9 h-9 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.1] transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-300" />
              </motion.button>
              <div className="flex items-center gap-2">
                <Swords className={`w-4 h-4 ${theme.textAccent}`} />
                <span
                  className={`text-sm font-black uppercase tracking-[0.2em] bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}
                >
                  Bump Battle
                </span>
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[8px] uppercase tracking-wider font-bold">
                  BETA
                </span>
              </div>
              <div style={{ width: "36px" }} />
            </div>

            {/* Core Radar/Sweep & Players */}
            <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col">
              {/* Radar Panel */}
              <div className="flex flex-col items-center justify-center py-6 mb-6">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  {/* Expanding Concentric Rings */}
                  <AnimatePresence>
                    {radarScanning &&
                      [1, 2, 3].map((ring) => (
                        <motion.div
                          key={ring}
                          initial={{ scale: 0.5, opacity: 0.8 }}
                          animate={{ scale: 2.2, opacity: 0 }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            delay: ring * 0.7,
                            ease: "easeOut",
                          }}
                          className={`absolute inset-0 rounded-full border-2 ${
                            category === "dating"
                              ? "border-pink-500/30"
                              : category === "friends"
                              ? "border-emerald-500/30"
                              : "border-blue-500/30"
                          }`}
                        />
                      ))}
                  </AnimatePresence>

                  {/* Radar Grid Graphic */}
                  <div
                    className={`w-36 h-36 rounded-full border border-dashed flex items-center justify-center ${
                      category === "dating"
                        ? "border-pink-500/20 bg-pink-500/5"
                        : category === "friends"
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-blue-500/20 bg-blue-500/5"
                    }`}
                  >
                    <div
                      className={`w-20 h-20 rounded-full border border-dashed ${
                        category === "dating"
                          ? "border-pink-500/10"
                          : category === "friends"
                          ? "border-emerald-500/10"
                          : "border-blue-500/10"
                      }`}
                    />
                  </div>

                  {/* Sweeper Dial Animation */}
                  {radarScanning && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 w-full h-full flex justify-center origin-center"
                    >
                      <div
                        className={`w-0.5 h-1/2 bg-gradient-to-t from-transparent ${
                          category === "dating"
                            ? "to-pink-500"
                            : category === "friends"
                            ? "to-emerald-500"
                            : "to-blue-500"
                        } opacity-60 shadow-lg`}
                      />
                    </motion.div>
                  )}

                  {/* Target Pin Center with glow */}
                  <motion.div
                    animate={{
                      boxShadow: [
                        `0 0 12px rgba(${accent.rgb},0.3)`,
                        `0 0 24px rgba(${accent.rgb},0.6)`,
                        `0 0 12px rgba(${accent.rgb},0.3)`,
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`absolute w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                      category === "dating"
                        ? "bg-pink-500 text-white"
                        : category === "friends"
                        ? "bg-emerald-500 text-slate-950"
                        : "bg-blue-500 text-white"
                    } shadow-xl shadow-slate-950/40`}
                  >
                    <MapPin className="w-3 h-3" />
                  </motion.div>
                </div>

                <h3 className="text-sm font-black tracking-[0.15em] uppercase mt-6 text-slate-300">
                  {radarScanning ? "Radar scanning..." : "Scanning Complete"}
                </h3>
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">
                  {radarScanning
                    ? "Searching for nearby bumpers"
                    : "Select an opponent to battle"}
                </p>
              </div>

              {/* List Header */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  Active Nearby Duels
                </h4>
                {!radarScanning && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setGameState("lobby")}
                    className={`text-[10px] font-bold ${theme.textAccent} hover:underline uppercase tracking-wide`}
                  >
                    Rescan
                  </motion.button>
                )}
              </div>

              {/* Opponents Stack */}
              <div className="space-y-3 flex-1">
                <AnimatePresence>
                  {!radarScanning &&
                    listOpponents.map((opp, idx) => (
                      <motion.div
                        key={opp.name}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.12 }}
                        className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl flex items-center gap-4 hover:border-white/[0.12] transition-all duration-300 group"
                      >
                        {/* Avatar with animated gradient ring */}
                        <div className="relative flex-shrink-0">
                          <div className="relative">
                            <motion.div
                              className="absolute -inset-[3px] rounded-full"
                              style={{
                                background: `conic-gradient(from 0deg, ${accent.primary}, #6366f1, ${accent.primary})`,
                              }}
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            />
                            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-slate-950">
                              <img
                                src={opp.photo}
                                alt={opp.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          <div className="absolute -bottom-1 -right-1 bg-slate-900 px-1 py-0.5 rounded-full border border-slate-700 flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5 text-amber-400" />
                            <span className="text-[8px] font-black text-slate-300">
                              {600 - opp.baseReaction}
                            </span>
                          </div>
                        </div>

                        {/* Bio info with gradient name */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-black text-sm bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}
                            >
                              {opp.name}
                            </span>
                            {opp.age && (
                              <span className="text-xs text-slate-400">, {opp.age}</span>
                            )}
                            <span className="text-[9px] text-slate-500 font-bold bg-white/[0.05] px-1.5 py-0.5 rounded-full flex-shrink-0">
                              {opp.distance}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 truncate">
                            {opp.description}
                          </p>
                        </div>

                        {/* Duel Button with shimmer */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleChallenge(opp)}
                          className={`relative px-5 py-2.5 rounded-xl bg-gradient-to-r ${theme.gradient} text-white font-black text-xs uppercase tracking-wider shrink-0 shadow-lg ${accent.glow} overflow-hidden`}
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            initial={{ x: "-100%" }}
                            animate={{ x: "200%" }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 3,
                            }}
                          />
                          <span className="relative z-10">Duel</span>
                        </motion.button>
                      </motion.div>
                    ))}
                </AnimatePresence>

                {/* Loader during radar scan */}
                {radarScanning && (
                  <div className="py-10 text-center flex flex-col items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-amber-400 animate-spin mb-3" />
                    <p className="text-xs text-slate-500 font-medium">
                      Fetching nearby locations...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            SCREEN: MATCHMAKING
            ═══════════════════════════════════════ */}
        {gameState === "matchmaking" && selectedOpponent && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-30">
            <div className="w-full max-w-sm flex flex-col items-center">
              {/* VS Animated Glow */}
              <div className="relative mb-12 flex items-center justify-center w-28 h-28">
                <motion.div
                  animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-20 h-20 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] flex items-center justify-center shadow-2xl relative z-10"
                >
                  <Swords className={`w-10 h-10 ${theme.textAccent}`} />
                </motion.div>
                <motion.div
                  className={`absolute inset-0 rounded-full blur-[40px] opacity-40 bg-gradient-to-r ${theme.gradient}`}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>

              <h2
                className={`text-xl font-black text-center uppercase tracking-[0.2em] bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}
              >
                Challenging {selectedOpponent.name}...
              </h2>
              <p className="text-xs text-slate-400 mt-2 text-center">
                Waiting for opponent to accept
              </p>

              {/* Vs Profile View */}
              <div className="flex items-center justify-between w-full max-w-xs mt-12 relative">
                {/* You profile */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-18 h-18 rounded-full bg-white/[0.04] backdrop-blur-xl border-2 border-slate-600 flex items-center justify-center overflow-hidden">
                    <User className="w-10 h-10 text-slate-400" />
                  </div>
                  <span className="text-xs font-black text-slate-300">You</span>
                </div>

                {/* Animated VS glow line */}
                <div className="flex-1 relative mx-4 h-[2px]">
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-700 via-transparent to-slate-700" />
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${theme.gradient}`}
                    style={{
                      maskImage:
                        "linear-gradient(to right, transparent, white, transparent)",
                    }}
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>

                {/* Opponent profile */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <motion.div
                      className="absolute -inset-[3px] rounded-full"
                      style={{
                        background: `conic-gradient(from 0deg, ${accent.primary}, #6366f1, ${accent.primary})`,
                      }}
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <div className="relative w-18 h-18 rounded-full overflow-hidden border-2 border-slate-950">
                      <img
                        src={selectedOpponent.photo}
                        alt={selectedOpponent.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-300">
                    {selectedOpponent.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            SCREEN: COUNTDOWN (Cinematic Letterbox)
            ═══════════════════════════════════════ */}
        {gameState === "countdown" && selectedOpponent && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm z-30">
            {/* Top letterbox bar */}
            <motion.div
              className="absolute top-0 left-0 right-0 bg-black z-40"
              initial={{ height: 0 }}
              animate={{ height: "12%" }}
              transition={{ duration: 0.5 }}
            />
            {/* Bottom letterbox bar */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-black z-40"
              initial={{ height: 0 }}
              animate={{ height: "12%" }}
              transition={{ duration: 0.5 }}
            />

            <div className="text-center z-50">
              <motion.p
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-6"
              >
                Duel Starting
              </motion.p>
              <AnimatePresence mode="popLayout">
                <motion.h1
                  key={countdown}
                  initial={{ scale: 0, opacity: 0, filter: "blur(20px)" }}
                  animate={{ scale: 1.5, opacity: 1, filter: "blur(0px)" }}
                  exit={{ scale: 3, opacity: 0, filter: "blur(10px)" }}
                  transition={{
                    duration: 0.6,
                    type: "spring",
                    stiffness: 200,
                  }}
                  className={`text-9xl font-black ${
                    countdown === 1
                      ? "text-rose-500"
                      : countdown === 2
                      ? "text-amber-500"
                      : "text-emerald-500"
                  }`}
                  style={{
                    textShadow: `0 0 60px ${
                      countdown === 1
                        ? "rgba(239,68,68,0.5)"
                        : countdown === 2
                        ? "rgba(245,158,11,0.5)"
                        : "rgba(16,185,129,0.5)"
                    }`,
                  }}
                >
                  {countdown}
                </motion.h1>
              </AnimatePresence>
              <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm font-black text-slate-200 mt-14 uppercase tracking-[0.2em]"
              >
                {selectedOpponent.name} Accepted!
              </motion.h3>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            SCREEN: READY (Waiting for Flash)
            ═══════════════════════════════════════ */}
        {gameState === "ready" && selectedOpponent && (
          <div
            onClick={handleBumpTap}
            className="absolute inset-0 flex flex-col justify-between items-center bg-slate-950 z-30 cursor-pointer"
            style={{
              paddingTop: "env(safe-area-inset-top, 0px)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* Top Status Bar — glassmorphic */}
            <div className="w-full px-6 py-4 flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
              <span className="text-xs font-black tracking-[0.15em] uppercase text-slate-500">
                Round {currentRound} / 3
              </span>
              <div className="flex gap-3 text-sm font-black items-center">
                <span className="text-slate-300 relative">
                  {playerLeading && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs">
                      👑
                    </span>
                  )}
                  YOU {playerScore}
                </span>
                <div className="w-6 h-[2px] bg-gradient-to-r from-slate-600 via-slate-400 to-slate-600 rounded-full" />
                <span className="text-slate-300 relative">
                  {opponentLeading && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs">
                      👑
                    </span>
                  )}
                  {opponentScore} {selectedOpponent.name.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Centered Instructions */}
            <div className="flex flex-col items-center py-10">
              <motion.div
                animate={{
                  scale: [1, 1.08, 1],
                  boxShadow: [
                    "0 0 20px rgba(245,158,11,0.1)",
                    "0 0 40px rgba(245,158,11,0.3)",
                    "0 0 20px rgba(245,158,11,0.1)",
                  ],
                }}
                transition={{ duration: 2 / intensityFactor, repeat: Infinity }}
                className="w-24 h-24 rounded-full border-2 border-amber-500/30 bg-white/[0.03] backdrop-blur-xl flex items-center justify-center mb-6"
              >
                <Timer className="w-10 h-10 text-amber-500 animate-pulse" />
              </motion.div>
              <h1
                className="text-4xl font-black uppercase tracking-[0.15em] text-amber-500 text-center animate-pulse"
                style={{ textShadow: "0 0 30px rgba(245,158,11,0.3)" }}
              >
                GET READY...
              </h1>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-4 max-w-xs text-center leading-relaxed">
                Wait for the screen to FLASH, then BUMP (tap anywhere) as fast as
                possible.
              </p>
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-wide mt-2">
                ⚠️ Tapping early counts as a FOUL
              </p>
            </div>

            {/* Footer */}
            <div className="w-full pb-10 flex justify-center">
              <motion.span
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]"
              >
                Tap Screen to Strike
              </motion.span>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            SCREEN: TRIGGER (The flashing target)
            ═══════════════════════════════════════ */}
        {gameState === "trigger" && selectedOpponent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
            onClick={handleBumpTap}
            className={`absolute inset-0 flex flex-col justify-between items-center z-30 cursor-pointer bg-gradient-to-b ${
              category === "dating"
                ? "from-pink-500 to-rose-600"
                : category === "friends"
                ? "from-emerald-500 to-teal-600"
                : "from-blue-500 to-indigo-600"
            }`}
            style={{
              paddingTop: "env(safe-area-inset-top, 0px)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            <NoiseOverlay />

            {/* Top */}
            <div className="w-full px-6 py-4 flex items-center justify-between text-white/60">
              <span className="text-xs font-black tracking-[0.15em] uppercase">
                Round {currentRound} / 3
              </span>
              <span className="text-xs font-black tracking-[0.15em] uppercase">
                Action Phase
              </span>
            </div>

            {/* Big Trigger visual */}
            <div className="flex flex-col items-center">
              <div className="relative w-44 h-44 flex items-center justify-center">
                {[1, 2, 3].map((r) => (
                  <motion.div
                    key={r}
                    initial={{ scale: 0.8, opacity: 0.8 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{
                      duration: 1 / intensityFactor,
                      repeat: Infinity,
                      delay: r * 0.3,
                    }}
                    className="absolute inset-0 rounded-full border-4 border-white/40"
                  />
                ))}
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.3, repeat: Infinity }}
                  className="w-32 h-32 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-2xl relative"
                  style={{ boxShadow: "0 0 60px rgba(255,255,255,0.4)" }}
                >
                  <Swords className="w-14 h-14" />
                </motion.div>
              </div>

              <motion.h1
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 0.4, repeat: Infinity }}
                className="text-6xl font-black uppercase tracking-wider text-white text-center mt-10"
                style={{ textShadow: "0 0 40px rgba(255,255,255,0.5)" }}
              >
                BUMP NOW!
              </motion.h1>
            </div>

            {/* Footer instruction */}
            <div className="pb-10">
              <motion.span
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="px-5 py-2 rounded-full bg-white/20 backdrop-blur text-white font-black text-xs uppercase tracking-[0.2em]"
              >
                TAP SCREEN
              </motion.span>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════
            SCREEN: ROUND RESULT
            ═══════════════════════════════════════ */}
        {gameState === "round_result" && selectedOpponent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex flex-col justify-between p-6 z-30"
            style={{
              paddingTop: "env(safe-area-inset-top, 0px)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* Victory Rays for winning round */}
            {roundWinner === "player" && <VictoryRays />}

            {/* Spacer */}
            <div style={{ height: "44px" }} />

            {/* Round Announcement Badge */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute top-16 left-0 right-0 text-center z-50 pointer-events-none"
            >
              <span
                className={`text-[10px] font-black uppercase tracking-[0.3em] ${
                  roundWinner === "player"
                    ? "text-emerald-400"
                    : roundWinner === "foul"
                    ? "text-red-400"
                    : "text-rose-400"
                }`}
              >
                Round {currentRound} Result
              </span>
            </motion.div>

            {/* Core Round Result Card — Glassmorphic with rotating conic border */}
            <div className="w-full max-w-sm mx-auto relative">
              <motion.div
                className="absolute -inset-[1px] rounded-3xl"
                style={{
                  background: `conic-gradient(from 0deg, ${accent.primary}40, transparent 40%, ${accent.primary}20 60%, transparent 80%, ${accent.primary}40)`,
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              />
              <div className="relative rounded-3xl border border-white/[0.08] shadow-2xl p-8 text-center bg-slate-950/80 backdrop-blur-xl">
                {/* Icon Result */}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                    delay: 0.1,
                  }}
                  className="mb-4"
                >
                  {roundWinner === "player" ? (
                    <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 relative">
                      <Trophy className="w-8 h-8" />
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        animate={{
                          boxShadow: [
                            "0 0 10px rgba(16,185,129,0.2)",
                            "0 0 25px rgba(16,185,129,0.4)",
                            "0 0 10px rgba(16,185,129,0.2)",
                          ],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </div>
                  ) : roundWinner === "foul" ? (
                    <motion.div
                      animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                      transition={{ duration: 0.5 }}
                      className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-400"
                    >
                      <ShieldAlert className="w-8 h-8" />
                    </motion.div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                      <Zap className="w-8 h-8" />
                    </div>
                  )}
                </motion.div>

                {/* Title with gradient text on win */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`text-2xl font-black uppercase tracking-[0.1em] mb-2 ${
                    roundWinner === "player"
                      ? `bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`
                      : "text-white"
                  }`}
                >
                  {roundWinner === "player"
                    ? "Round Secured!"
                    : roundWinner === "foul"
                    ? "FOUL!"
                    : "Round Defeated!"}
                </motion.h2>
                <p className="text-xs text-slate-400 mb-6 uppercase tracking-wider">
                  {roundWinner === "player"
                    ? "You reacted faster than the opponent!"
                    : roundWinner === "foul"
                    ? "You tapped before the BUMP trigger!"
                    : `${selectedOpponent.name} reacted faster!`}
                </p>

                {/* Reaction times side-by-side */}
                <div className="grid grid-cols-2 gap-4 border-t border-b border-white/[0.06] py-6 mb-6">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                      Your Speed
                    </p>
                    <p
                      className={`text-2xl font-black mt-1 ${
                        roundWinner === "player" ? "text-emerald-400" : "text-slate-300"
                      }`}
                    >
                      {roundWinner === "foul"
                        ? "FOUL"
                        : reactionTime
                        ? `${reactionTime}ms`
                        : "—"}
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                      {selectedOpponent.name}'s Speed
                    </p>
                    <p
                      className={`text-2xl font-black mt-1 ${
                        roundWinner === "opponent" ? "text-rose-400" : "text-slate-300"
                      }`}
                    >
                      {opponentTime}ms
                    </p>
                  </motion.div>
                </div>

                {/* Health Bars */}
                <div className="space-y-2 mb-6">
                  <HealthBar
                    current={Math.max(0, 3 - opponentScore)}
                    max={3}
                    label="Your Health"
                    isPlayer={true}
                    accentRgb={accent.rgb}
                  />
                  <HealthBar
                    current={Math.max(0, 3 - playerScore)}
                    max={3}
                    label={`${selectedOpponent.name}'s Health`}
                    isPlayer={false}
                    accentRgb={accent.rgb}
                  />
                </div>

                {/* Continue Round — shimmer button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextRound}
                  className={`relative w-full py-3.5 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-black text-sm uppercase tracking-[0.15em] flex items-center justify-center gap-2 overflow-hidden shadow-lg ${accent.glow}`}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                  />
                  <span className="relative z-10">Continue</span>
                  <ArrowRight className="w-4 h-4 relative z-10" />
                </motion.button>
              </div>
            </div>

            {/* Footer rounds tracker */}
            <div className="w-full flex justify-center pb-6">
              <div className="flex gap-4">
                {roundsHistory.map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: i * 0.1 }}
                    className="flex flex-col items-center gap-1"
                  >
                    <span className="text-[9px] text-slate-500 uppercase font-black">
                      R{i + 1}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border backdrop-blur ${
                        h.winner === "player"
                          ? "bg-emerald-500/15 border-emerald-500/60 text-emerald-400"
                          : h.winner === "foul"
                          ? "bg-red-500/15 border-red-500/60 text-red-400"
                          : "bg-rose-500/15 border-rose-500/60 text-rose-400"
                      }`}
                    >
                      {h.winner === "player"
                        ? "W"
                        : h.winner === "foul"
                        ? "F"
                        : "L"}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════
            SCREEN: COMPLETE (Post Match Rewards)
            ═══════════════════════════════════════ */}
        {gameState === "complete" && selectedOpponent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col justify-between p-6 z-30"
            style={{
              paddingTop: "env(safe-area-inset-top, 0px)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* Victory Rays for match win */}
            {playerWonMatch && <VictoryRays />}

            {/* Spacer */}
            <div style={{ height: "44px" }} />

            {/* Core Complete Card — Glassmorphic with rotating conic border */}
            <div className="w-full max-w-sm mx-auto relative">
              <motion.div
                className="absolute -inset-[1px] rounded-3xl"
                style={{
                  background: playerWonMatch
                    ? "conic-gradient(from 0deg, rgba(251,191,36,0.4), transparent 30%, rgba(251,191,36,0.2) 50%, transparent 70%, rgba(251,191,36,0.4))"
                    : `conic-gradient(from 0deg, rgba(${accent.rgb},0.3), transparent 40%, rgba(${accent.rgb},0.15) 60%, transparent 80%, rgba(${accent.rgb},0.3))`,
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
              <div className="relative rounded-3xl border border-white/[0.08] shadow-2xl p-8 text-center bg-slate-950/80 backdrop-blur-xl">
                {/* Winner Status Banner */}
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 250,
                    damping: 15,
                  }}
                  className="mb-4"
                >
                  {playerWonMatch ? (
                    <div className="relative">
                      {/* Golden crown */}
                      <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                        className="absolute -top-8 left-1/2 -translate-x-1/2 text-3xl"
                      >
                        👑
                      </motion.div>
                      <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 relative">
                        <Trophy className="w-10 h-10" />
                        <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-amber-300 animate-pulse" />
                        <motion.div
                          className="absolute inset-0 rounded-2xl"
                          animate={{
                            boxShadow: [
                              "0 0 15px rgba(251,191,36,0.2)",
                              "0 0 30px rgba(251,191,36,0.4)",
                              "0 0 15px rgba(251,191,36,0.2)",
                            ],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mx-auto text-slate-400 backdrop-blur">
                      <Award className="w-10 h-10" />
                    </div>
                  )}
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`text-2xl font-black uppercase tracking-[0.1em] mb-2 ${
                    playerWonMatch
                      ? "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent"
                      : "text-slate-200"
                  }`}
                  style={
                    playerWonMatch
                      ? { textShadow: "0 0 30px rgba(251,191,36,0.3)" }
                      : {}
                  }
                >
                  {playerWonMatch ? "VICTORY!" : "DEFEAT"}
                </motion.h2>

                {/* Score breakdown */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-center gap-3 text-lg font-black mt-2 mb-4"
                >
                  <span
                    className={
                      playerWonMatch ? "text-emerald-400" : "text-slate-400"
                    }
                  >
                    {playerScore} Wins
                  </span>
                  <div className="w-5 h-[2px] bg-slate-600 rounded-full" />
                  <span
                    className={
                      !playerWonMatch ? "text-rose-400" : "text-slate-400"
                    }
                  >
                    {opponentScore} Wins
                  </span>
                </motion.div>

                {/* Stats summary in glassmorphic mini-cards */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-3 gap-2 mb-4"
                >
                  {roundsHistory.map((h, i) => (
                    <div
                      key={i}
                      className="bg-white/[0.03] backdrop-blur rounded-xl p-2 border border-white/[0.06]"
                    >
                      <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">
                        R{i + 1}
                      </p>
                      <p
                        className={`text-sm font-black ${
                          h.winner === "player"
                            ? "text-emerald-400"
                            : h.winner === "foul"
                            ? "text-red-400"
                            : "text-rose-400"
                        }`}
                      >
                        {h.winner === "player"
                          ? "WIN"
                          : h.winner === "foul"
                          ? "FOUL"
                          : "LOSS"}
                      </p>
                      <p className="text-[9px] text-slate-500 font-bold">
                        {h.playerTime ? `${h.playerTime}ms` : "—"} /{" "}
                        {h.opponentTime}ms
                      </p>
                    </div>
                  ))}
                </motion.div>

                {/* Mode Specific Description */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 mb-6 backdrop-blur"
                >
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {playerWonMatch
                      ? theme.rewardDesc
                      : `Better luck next time! You can challenge ${selectedOpponent.name} again for another duel.`}
                  </p>
                </motion.div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {playerWonMatch && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        alert(
                          `${
                            category === "dating"
                              ? "Opening conversation with "
                              : category === "friends"
                              ? "Adding friend "
                              : "Exchanging vCard with "
                          } ${selectedOpponent.name}!`
                        );
                        handleReset();
                      }}
                      className={`relative w-full py-4 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-black text-sm uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-lg ${accent.glow} overflow-hidden`}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: "-100%" }}
                        animate={{ x: "200%" }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 1,
                        }}
                      />
                      <MessageSquare className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">{theme.ctaText}</span>
                    </motion.button>
                  )}

                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleReset}
                    className="w-full py-3 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] text-slate-200 text-sm font-bold hover:bg-white/[0.08] transition-all"
                  >
                    Battle Someone Else
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onBack}
                    className="w-full py-2.5 rounded-xl border border-white/[0.06] text-slate-400 text-xs font-bold hover:bg-white/[0.03] transition-all"
                  >
                    Exit to Games
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Bottom spacers */}
            <div style={{ height: "44px" }} />
          </motion.div>
        )}
      </div>
    </ScreenShake>
  );
}
