import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flag,
  Crown,
  Shield,
  RefreshCcw,
  User,
  Timer,
  Sparkles,
  MapPin,
  Trophy,
  AlertTriangle,
  Zap,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────
   MapTurfWars — Compact 1v1 hex-grid territory capture game
   12 hexes, 60s match. Tap to capture neutral zones (3s timer).
   AI opponent captures every 4-7s. Score = zones × hold time.
   No header/back — parent bottom sheet handles that.
   ──────────────────────────────────────────────────────────────── */

interface MapGameChildProps {
  opponent: {
    id: number;
    firstName: string;
    lastName: string;
    age: number;
    sex: string;
    profilePhoto?: string | null;
    category: string;
  };
  category: "dating" | "friends" | "business";
  onComplete: () => void;
  onBack: () => void;
}

const THEMES = {
  dating: {
    gradient: "from-pink-500 via-rose-500 to-red-500",
    text: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    playerHex: "#ec4899",
    opponentHex: "#f43f5e",
    solidHex: "#ec4899",
    secondHex: "#f43f5e",
    warmHue: "rgba(236,72,153,0.08)",
    coolHue: "rgba(96,165,250,0.06)",
  },
  friends: {
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    playerHex: "#10b981",
    opponentHex: "#14b8a6",
    solidHex: "#10b981",
    secondHex: "#14b8a6",
    warmHue: "rgba(16,185,129,0.08)",
    coolHue: "rgba(96,165,250,0.06)",
  },
  business: {
    gradient: "from-blue-500 via-indigo-500 to-purple-500",
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    playerHex: "#3b82f6",
    opponentHex: "#6366f1",
    solidHex: "#3b82f6",
    secondHex: "#6366f1",
    warmHue: "rgba(59,130,246,0.08)",
    coolHue: "rgba(168,85,247,0.06)",
  },
} as const;

const ZONE_NAMES = [
  "Alpha", "Bravo", "Charlie",
  "Delta", "Echo", "Foxtrot",
  "Golf", "Hotel", "India",
  "Juliet", "Kilo", "Lima",
];

const HEX_CLIP = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";
const TOTAL_HEXES = 12;
const GAME_DURATION = 60;
const CAPTURE_TIME = 3;
const AI_MIN_DELAY = 4000;
const AI_MAX_DELAY = 7000;

type HexOwner = "neutral" | "player" | "opponent";
type Phase = "countdown" | "playing" | "results";

interface HexZone {
  id: number;
  name: string;
  owner: HexOwner;
  justCaptured: boolean;
}

/* ── Hex Adjacency Map ── */
const HEX_ADJACENCY: Record<number, number[]> = {
  0: [1, 3, 4],
  1: [0, 2, 4, 5],
  2: [1, 5],
  3: [0, 4, 6, 7],
  4: [0, 1, 3, 5, 7, 8],
  5: [1, 2, 4, 8],
  6: [3, 7, 9, 10],
  7: [3, 4, 6, 8, 10, 11],
  8: [4, 5, 7, 11],
  9: [6, 10],
  10: [6, 7, 9, 11],
  11: [7, 8, 10],
};

/* ── SVG Noise Texture ── */
function NoiseTexture() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03] z-50">
      <filter id="noise-turf">
        <feTurbulence baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise-turf)" />
    </svg>
  );
}

/* ── Ambient Dust Motes ── */
function AmbientParticles({ intensity, color }: { intensity: number; color: string }) {
  const count = Math.min(12, 8 + Math.floor(intensity * 4));
  const motes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1.5 + Math.random() * 2.5,
        dur: 6 + Math.random() * 8,
        delay: Math.random() * 4,
        drift: 20 + Math.random() * 40,
      })),
    [count]
  );
  const speed = 1 - intensity * 0.4;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[5]">
      {motes.map((m) => (
        <motion.div
          key={m.id}
          className="absolute rounded-full"
          style={{
            left: `${m.x}%`,
            top: `${m.y}%`,
            width: m.size,
            height: m.size,
            background: color,
            opacity: 0.15 + intensity * 0.2,
          }}
          animate={{
            y: [-m.drift, m.drift, -m.drift],
            x: [-m.drift * 0.5, m.drift * 0.3, -m.drift * 0.5],
            opacity: [0.1 + intensity * 0.15, 0.3 + intensity * 0.25, 0.1 + intensity * 0.15],
            scale: [0.8, 1.2 + intensity * 0.3, 0.8],
          }}
          transition={{
            duration: m.dur * speed,
            repeat: Infinity,
            ease: "easeInOut",
            delay: m.delay,
          }}
        />
      ))}
    </div>
  );
}

/* ── Floating background orbs ── */
function FloatingOrbs({ color1, color2, intensity }: { color1: string; color2: string; intensity: number }) {
  const opac1 = 0.07 + intensity * 0.06;
  const opac2 = 0.06 + intensity * 0.05;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        animate={{ x: [0, 30, -20, 0], y: [0, -20, 15, 0], scale: [1, 1.2, 0.9, 1] }}
        transition={{ duration: 12 - intensity * 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-[60px]"
        style={{ background: `radial-gradient(circle, ${color1}, transparent)`, opacity: opac1 }}
      />
      <motion.div
        animate={{ x: [0, -25, 15, 0], y: [0, 20, -10, 0], scale: [1, 0.9, 1.15, 1] }}
        transition={{ duration: 15 - intensity * 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-[50px]"
        style={{ background: `radial-gradient(circle, ${color2}, transparent)`, opacity: opac2 }}
      />
    </div>
  );
}

/* ── Score Odometer Digit ── */
function OdometerDigit({ digit, color }: { digit: string; color: string }) {
  return (
    <span className="inline-block overflow-hidden relative" style={{ width: "0.65em", height: "1.2em" }}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={digit}
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="absolute inset-0 flex items-center justify-center font-black"
          style={{ color, fontVariantNumeric: "tabular-nums" }}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function ScoreOdometer({ value, color }: { value: number; color: string }) {
  const digits = String(value).split("");
  return (
    <span className="inline-flex">
      {digits.map((d, i) => (
        <OdometerDigit key={`${i}-${d}`} digit={d} color={color} />
      ))}
    </span>
  );
}

/* ── Score Change Ripple ── */
function ScoreRipple({ color, trigger }: { color: string; trigger: number }) {
  return (
    <AnimatePresence>
      {trigger > 0 && (
        <motion.div
          key={trigger}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ border: `2px solid ${color}` }}
          initial={{ scale: 0.5, opacity: 0.8 }}
          animate={{ scale: 2.5, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )}
    </AnimatePresence>
  );
}

/* ── Floating Score Popup ── */
function FloatingScorePopup({ value, color }: { value: string; color: string }) {
  return (
    <motion.div
      initial={{ y: 0, opacity: 1, scale: 0.8 }}
      animate={{ y: -30, opacity: 0, scale: 1.1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-black whitespace-nowrap pointer-events-none z-30"
      style={{
        color,
        textShadow: `0 0 8px ${color}80`,
      }}
    >
      {value}
    </motion.div>
  );
}

/* ── Leading Player Crown ── */
function LeaderCrown({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <motion.div
      className="absolute -top-4 left-1/2 -translate-x-1/2 z-20"
      animate={{ y: [0, -3, 0], rotate: [-3, 3, -3] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <Crown className="w-4 h-4 text-amber-400" style={{ filter: "drop-shadow(0 0 6px rgba(245,158,11,0.6))" }} />
    </motion.div>
  );
}

/* ── Domination Badge ── */
function DominationBadge({ playerZones, opponentZones, playerColor, opponentColor }: { playerZones: number; opponentZones: number; playerColor: string; opponentColor: string }) {
  const isDom = playerZones >= 7 || opponentZones >= 7;
  if (!isDom) return null;
  const isPlayer = playerZones >= 7;
  const color = isPlayer ? playerColor : opponentColor;
  const label = isPlayer ? "DOMINATION" : "DOMINATED";
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [1, 1.05, 1], opacity: 1 }}
      transition={{ scale: { duration: 1.5, repeat: Infinity }, opacity: { duration: 0.3 } }}
      className="flex items-center justify-center gap-1.5 py-1.5 px-4 rounded-full mx-auto mb-2"
      style={{
        background: `${color}18`,
        border: `1px solid ${color}50`,
        boxShadow: `0 0 20px ${color}30, inset 0 0 12px ${color}10`,
      }}
    >
      <Zap className="w-3 h-3" style={{ color, filter: `drop-shadow(0 0 4px ${color})` }} />
      <span
        className="text-[9px] font-black uppercase"
        style={{ letterSpacing: "0.25em", color, textShadow: `0 0 8px ${color}60` }}
      >
        {label}
      </span>
      <Zap className="w-3 h-3" style={{ color, filter: `drop-shadow(0 0 4px ${color})` }} />
    </motion.div>
  );
}

/* ── Territory Control Bar ── */
function TerritoryBar({ playerZones, opponentZones, theme }: { playerZones: number; opponentZones: number; theme: typeof THEMES.dating }) {
  const total = TOTAL_HEXES;
  const pPercent = (playerZones / total) * 100;
  const oPercent = (opponentZones / total) * 100;
  const nPercent = 100 - pPercent - oPercent;

  return (
    <div className="w-full mt-2">
      <div className="flex items-center gap-1 mb-1">
        <span className="text-[7px] font-black uppercase tracking-widest text-slate-500">Territory Control</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden flex bg-slate-800/80" style={{ boxShadow: "inset 0 1px 3px rgba(0,0,0,0.4)" }}>
        <motion.div
          className="h-full rounded-l-full relative overflow-hidden"
          style={{
            background: `linear-gradient(90deg, ${theme.playerHex}, ${theme.playerHex}cc)`,
            boxShadow: playerZones > 0 ? `0 0 8px ${theme.playerHex}60` : "none",
          }}
          animate={{ width: `${pPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Shimmer inside player bar */}
          <motion.div
            className="absolute inset-0"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
          />
        </motion.div>
        <motion.div
          className="h-full"
          style={{ background: "rgba(71,85,105,0.3)" }}
          animate={{ width: `${nPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        <motion.div
          className="h-full rounded-r-full"
          style={{
            background: `linear-gradient(90deg, ${theme.opponentHex}cc, ${theme.opponentHex})`,
            boxShadow: opponentZones > 0 ? `0 0 8px ${theme.opponentHex}60` : "none",
          }}
          animate={{ width: `${oPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <div className="flex items-center justify-between mt-0.5">
        <span className="text-[8px] font-black tabular-nums" style={{ color: theme.playerHex, textShadow: `0 0 6px ${theme.playerHex}40` }}>
          {Math.round(pPercent)}%
        </span>
        <span className="text-[7px] font-bold text-slate-600 uppercase" style={{ letterSpacing: "0.15em" }}>
          {TOTAL_HEXES - playerZones - opponentZones} neutral
        </span>
        <span className="text-[8px] font-black tabular-nums" style={{ color: theme.opponentHex, textShadow: `0 0 6px ${theme.opponentHex}40` }}>
          {Math.round(oPercent)}%
        </span>
      </div>
    </div>
  );
}

/* ── Spark Particles orbiting a hex during capture ── */
function CaptureSparkParticles({ color }: { color: string }) {
  const sparks = useMemo(
    () => Array.from({ length: 6 }, (_, i) => ({
      id: i,
      angle: (i * 360) / 6,
      delay: i * 0.15,
    })),
    []
  );
  return (
    <>
      {sparks.map((s) => (
        <motion.div
          key={s.id}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: color,
            boxShadow: `0 0 6px ${color}, 0 0 12px ${color}`,
            left: "50%",
            top: "50%",
            marginLeft: -3,
            marginTop: -3,
          }}
          animate={{
            x: [
              Math.cos((s.angle * Math.PI) / 180) * 28,
              Math.cos(((s.angle + 120) * Math.PI) / 180) * 32,
              Math.cos(((s.angle + 240) * Math.PI) / 180) * 28,
              Math.cos((s.angle * Math.PI) / 180) * 28,
            ],
            y: [
              Math.sin((s.angle * Math.PI) / 180) * 28,
              Math.sin(((s.angle + 120) * Math.PI) / 180) * 32,
              Math.sin(((s.angle + 240) * Math.PI) / 180) * 28,
              Math.sin((s.angle * Math.PI) / 180) * 28,
            ],
            opacity: [0.8, 1, 0.6, 0.8],
            scale: [0.8, 1.2, 0.8, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: s.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}

/* ── Flag Planting Animation ── */
function FlagPlantAnimation({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20"
      initial={{ y: 20, opacity: 0, scale: 0.5 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
    >
      <Flag
        className="w-4 h-4"
        style={{
          color,
          filter: `drop-shadow(0 0 6px ${color}80)`,
        }}
      />
      {/* Flag wave effect */}
      <motion.div
        className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
        animate={{ scale: [0, 1.5, 0], opacity: [0.8, 0, 0] }}
        transition={{ duration: 0.6, delay: 0.3 }}
      />
    </motion.div>
  );
}

/* ── Influence Spread Flash ── */
function InfluenceSpread({ hexId, color, getPosition }: { hexId: number; color: string; getPosition: (id: number) => { x: number; y: number } }) {
  const adjacent = HEX_ADJACENCY[hexId] || [];
  const originPos = getPosition(hexId);
  return (
    <>
      {adjacent.map((adjId) => {
        const pos = getPosition(adjId);
        const dx = pos.x - originPos.x;
        const dy = pos.y - originPos.y;
        return (
          <motion.div
            key={`inf-${hexId}-${adjId}`}
            className="absolute pointer-events-none z-[15]"
            style={{
              left: pos.x,
              top: pos.y,
              width: 84,
              height: 78,
            }}
          >
            <motion.div
              className="w-full h-full"
              style={{
                clipPath: HEX_CLIP,
                background: `radial-gradient(circle at ${50 - dx * 0.3}% ${50 - dy * 0.3}%, ${color}40, transparent)`,
              }}
              initial={{ opacity: 0.8, scale: 0.9 }}
              animate={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            />
          </motion.div>
        );
      })}
    </>
  );
}

/* ── Victory Rays ── */
function VictoryRays({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-0"
      style={{
        background: `conic-gradient(from 0deg, transparent, ${color}08, transparent, ${color}06, transparent, ${color}08, transparent, ${color}06, transparent)`,
        borderRadius: "1rem",
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    />
  );
}

/* ── Screen Shake Wrapper ── */
function ScreenShake({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      animate={
        active
          ? { x: [0, -3, 3, -2, 2, 0], y: [0, 2, -2, 1, -1, 0] }
          : {}
      }
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}

/* ── Depth-of-Field Blur Overlay ── */
function DepthBlur({ active }: { active: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-[4]"
      animate={{ backdropFilter: active ? "blur(3px)" : "blur(0px)" }}
      transition={{ duration: 0.5 }}
    />
  );
}

export default function MapTurfWars({ opponent, category, onComplete }: MapGameChildProps) {
  const theme = THEMES[category];
  const opponentName = opponent.firstName;

  // ── Game state ──
  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [showGo, setShowGo] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [hexes, setHexes] = useState<HexZone[]>(() =>
    Array.from({ length: TOTAL_HEXES }, (_, i) => ({
      id: i,
      name: ZONE_NAMES[i],
      owner: "neutral" as HexOwner,
      justCaptured: false,
    }))
  );

  // ── Scores ──
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [playerZones, setPlayerZones] = useState(0);
  const [opponentZones, setOpponentZones] = useState(0);
  const [pointsPerSec, setPointsPerSec] = useState(0);

  // ── Capture state ──
  const [capturingId, setCapturingId] = useState<number | null>(null);
  const [captureProgress, setCaptureProgress] = useState(0);

  // ── Animated score counter for results ──
  const [displayPlayerScore, setDisplayPlayerScore] = useState(0);
  const [displayOpponentScore, setDisplayOpponentScore] = useState(0);

  // ── AI capture warning ──
  const [aiWarningHexId, setAiWarningHexId] = useState<number | null>(null);
  // ── Last AI captured hex id for showing opponent avatar ──
  const [lastAiCapturedHex, setLastAiCapturedHex] = useState<number | null>(null);

  // ── Screen shake trigger ──
  const [shakeResults, setShakeResults] = useState(false);

  // ── Letterbox state ──
  const [letterboxVisible, setLetterboxVisible] = useState(true);

  // ── Score change ripple trackers ──
  const [playerScoreRipple, setPlayerScoreRipple] = useState(0);
  const [opponentScoreRipple, setOpponentScoreRipple] = useState(0);
  const prevPlayerScore = useRef(0);
  const prevOpponentScore = useRef(0);

  // ── Floating score popup ──
  const [scorePopup, setScorePopup] = useState<{ id: number; value: string; color: string } | null>(null);
  const popupCounter = useRef(0);

  // ── Influence spread tracking ──
  const [influenceHexId, setInfluenceHexId] = useState<number | null>(null);
  const [influenceColor, setInfluenceColor] = useState<string>("");

  // ── Depth blur for results ──
  const [showDepthBlur, setShowDepthBlur] = useState(false);

  // ── Refs for intervals ──
  const gameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rewardTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const captureTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const displayTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playerScoreRef = useRef(0);
  const opponentScoreRef = useRef(0);
  const hexesRef = useRef(hexes);
  const phaseRef = useRef(phase);
  const timeLeftRef = useRef(timeLeft);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { hexesRef.current = hexes; }, [hexes]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  // ── Computed intensity (0-1) based on time remaining ──
  const intensity = phase === "playing" ? Math.max(0, 1 - timeLeft / GAME_DURATION) : 0;
  const isLast15 = phase === "playing" && timeLeft <= 15;

  // ── Dynamic color temperature ──
  const colorTemp = useMemo(() => {
    if (phase !== "playing") return "transparent";
    if (playerScore > opponentScore) return theme.warmHue;
    if (opponentScore > playerScore) return theme.coolHue;
    return "transparent";
  }, [phase, playerScore, opponentScore, theme]);

  // ── Score change ripple detection ──
  useEffect(() => {
    if (playerScore !== prevPlayerScore.current) {
      const diff = playerScore - prevPlayerScore.current;
      if (diff > 0) {
        setPlayerScoreRipple((p) => p + 1);
        if (diff >= 2) {
          popupCounter.current += 1;
          setScorePopup({ id: popupCounter.current, value: `+${diff}`, color: theme.playerHex });
          setTimeout(() => setScorePopup(null), 1200);
        }
      }
      prevPlayerScore.current = playerScore;
    }
  }, [playerScore, theme.playerHex]);

  useEffect(() => {
    if (opponentScore !== prevOpponentScore.current) {
      if (opponentScore > prevOpponentScore.current) {
        setOpponentScoreRipple((p) => p + 1);
      }
      prevOpponentScore.current = opponentScore;
    }
  }, [opponentScore]);

  // ── Animate score counter on results ──
  useEffect(() => {
    if (phase !== "results") return;
    setShakeResults(true);
    setShowDepthBlur(true);
    setTimeout(() => setShakeResults(false), 500);
    const pTarget = playerScoreRef.current;
    const oTarget = opponentScoreRef.current;
    const duration = 1200;
    const start = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const e = ease(progress);
      setDisplayPlayerScore(Math.round(pTarget * e));
      setDisplayOpponentScore(Math.round(oTarget * e));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [phase]);

  const clearAllIntervals = useCallback(() => {
    if (gameTimerRef.current) { clearInterval(gameTimerRef.current); gameTimerRef.current = null; }
    if (rewardTickRef.current) { clearInterval(rewardTickRef.current); rewardTickRef.current = null; }
    if (aiTimerRef.current) { clearTimeout(aiTimerRef.current); aiTimerRef.current = null; }
    if (captureTimerRef.current) { clearInterval(captureTimerRef.current); captureTimerRef.current = null; }
    if (displayTickRef.current) { clearInterval(displayTickRef.current); displayTickRef.current = null; }
  }, []);

  useEffect(() => () => clearAllIntervals(), [clearAllIntervals]);

  // ── Countdown ──
  useEffect(() => {
    if (phase !== "countdown") return;
    setCountdown(3);
    setLetterboxVisible(true);
    setShowGo(false);
    setShowDepthBlur(false);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowGo(true);
          setTimeout(() => {
            setShowGo(false);
            setLetterboxVisible(false);
            startGame();
          }, 600);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // ── AI ──
  const scheduleAI = useCallback(() => {
    const delay = AI_MIN_DELAY + Math.random() * (AI_MAX_DELAY - AI_MIN_DELAY);
    aiTimerRef.current = setTimeout(() => {
      if (phaseRef.current !== "playing") return;
      const neutralHexes = hexesRef.current.filter((h) => h.owner === "neutral");
      if (neutralHexes.length > 0) {
        const target = neutralHexes[Math.floor(Math.random() * neutralHexes.length)];
        setAiWarningHexId(target.id);
        setTimeout(() => setAiWarningHexId(null), 800);
        // Show opponent avatar on captured hex
        setLastAiCapturedHex(target.id);
        setTimeout(() => setLastAiCapturedHex(null), 1200);
        // Trigger influence spread
        setInfluenceHexId(target.id);
        setInfluenceColor(THEMES[category as keyof typeof THEMES].opponentHex);
        setTimeout(() => setInfluenceHexId(null), 800);

        setHexes((prev) =>
          prev.map((h) =>
            h.id === target.id
              ? { ...h, owner: "opponent" as HexOwner, justCaptured: true }
              : h
          )
        );
        setTimeout(() => {
          setHexes((prev) =>
            prev.map((h) => (h.id === target.id ? { ...h, justCaptured: false } : h))
          );
        }, 600);
      }
      if (phaseRef.current === "playing") scheduleAI();
    }, delay);
  }, [category]);

  const startGame = useCallback(() => {
    setTimeLeft(GAME_DURATION);
    timeLeftRef.current = GAME_DURATION;
    playerScoreRef.current = 0;
    opponentScoreRef.current = 0;
    setPlayerScore(0);
    setOpponentScore(0);
    setPlayerZones(0);
    setOpponentZones(0);
    setPointsPerSec(0);
    setCapturingId(null);
    setCaptureProgress(0);
    prevPlayerScore.current = 0;
    prevOpponentScore.current = 0;
    setHexes(
      Array.from({ length: TOTAL_HEXES }, (_, i) => ({
        id: i,
        name: ZONE_NAMES[i],
        owner: "neutral" as HexOwner,
        justCaptured: false,
      }))
    );
    setPhase("playing");
  }, []);

  // ── Playing phase ──
  useEffect(() => {
    if (phase !== "playing") return;

    gameTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        timeLeftRef.current = next;
        if (next <= 0) {
          clearAllIntervals();
          setPhase("results");
          return 0;
        }
        return next;
      });
    }, 1000);

    rewardTickRef.current = setInterval(() => {
      const current = hexesRef.current;
      const pZones = current.filter((h) => h.owner === "player").length;
      const oZones = current.filter((h) => h.owner === "opponent").length;
      playerScoreRef.current += pZones;
      opponentScoreRef.current += oZones;
    }, 1000);

    displayTickRef.current = setInterval(() => {
      setPlayerScore(playerScoreRef.current);
      setOpponentScore(opponentScoreRef.current);
      const current = hexesRef.current;
      const pz = current.filter((h) => h.owner === "player").length;
      const oz = current.filter((h) => h.owner === "opponent").length;
      setPlayerZones(pz);
      setOpponentZones(oz);
      setPointsPerSec(pz);
    }, 500);

    scheduleAI();
    return () => clearAllIntervals();
  }, [phase, clearAllIntervals, scheduleAI]);

  // ── Hex tap ──
  const handleHexTap = useCallback(
    (hexId: number) => {
      if (phaseRef.current !== "playing") return;
      if (capturingId !== null) return;
      const hex = hexesRef.current.find((h) => h.id === hexId);
      if (!hex || hex.owner !== "neutral") return;

      setCapturingId(hexId);
      setCaptureProgress(0);
      let progress = 0;

      captureTimerRef.current = setInterval(() => {
        progress++;
        setCaptureProgress(progress);
        if (progress >= CAPTURE_TIME) {
          if (captureTimerRef.current) {
            clearInterval(captureTimerRef.current);
            captureTimerRef.current = null;
          }
          // Trigger influence spread
          setInfluenceHexId(hexId);
          setInfluenceColor(THEMES[category as keyof typeof THEMES].playerHex);
          setTimeout(() => setInfluenceHexId(null), 800);

          setHexes((prev) =>
            prev.map((h) =>
              h.id === hexId
                ? { ...h, owner: "player" as HexOwner, justCaptured: true }
                : h
            )
          );
          setTimeout(() => {
            setHexes((prev) =>
              prev.map((h) => (h.id === hexId ? { ...h, justCaptured: false } : h))
            );
          }, 600);
          setCapturingId(null);
          setCaptureProgress(0);
        }
      }, 1000);
    },
    [capturingId, category]
  );

  const handlePlayAgain = useCallback(() => {
    clearAllIntervals();
    setPhase("countdown");
    setCapturingId(null);
    setCaptureProgress(0);
    playerScoreRef.current = 0;
    opponentScoreRef.current = 0;
  }, [clearAllIntervals]);

  // ── Computed ──
  const playerWon = playerScore > opponentScore;
  const isTie = playerScore === opponentScore;
  const avatarUrl = opponent.profilePhoto || undefined;
  const multiplier = Math.max(1, playerZones);

  const HEX_W = 84;
  const HEX_H = 78;

  const getHexPosition = (index: number) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const isOffset = row % 2 === 1;
    const x = col * (HEX_W * 0.88) + (isOffset ? HEX_W * 0.44 : 0);
    const y = row * (HEX_H * 0.76);
    return { x, y };
  };

  const gridW = 2 * (HEX_W * 0.88) + HEX_W * 0.44 + HEX_W;
  const gridH = 3 * (HEX_H * 0.76) + HEX_H;

  const getHexBg = (hex: HexZone) => {
    if (hex.owner === "player") return `radial-gradient(circle at 50% 30%, ${theme.playerHex}ee, ${theme.playerHex}aa)`;
    if (hex.owner === "opponent") return `radial-gradient(circle at 50% 30%, ${theme.opponentHex}ee, ${theme.opponentHex}aa)`;
    return "linear-gradient(135deg, #334155, #1e293b)";
  };

  const getHexInnerBg = (hex: HexZone) => {
    if (hex.owner === "player") return `radial-gradient(circle at 50% 30%, ${theme.playerHex}55 0%, ${theme.playerHex}11 100%)`;
    if (hex.owner === "opponent") return `radial-gradient(circle at 50% 30%, ${theme.opponentHex}44 0%, ${theme.opponentHex}11 100%)`;
    return "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)";
  };

  // ── Win particles for results ──
  const winParticles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      emoji: ["✨", "🏴", "⭐", "💫", "🎯", "🔥"][i % 6],
      x: (Math.random() - 0.5) * 300,
      y: (Math.random() - 0.5) * 400 - 100,
      rotate: Math.random() * 720 - 360,
      delay: Math.random() * 0.6,
      duration: 1.5 + Math.random(),
    }));
  }, []);

  const countdownColors: Record<number, string> = {
    1: "#ef4444",
    2: "#f59e0b",
    3: "#22c55e",
  };

  return (
    <div className="flex flex-col w-full text-white select-none overflow-hidden relative">
      <NoiseTexture />
      <FloatingOrbs color1={theme.solidHex} color2={theme.secondHex} intensity={intensity} />
      <AmbientParticles intensity={intensity} color={theme.solidHex} />

      {/* ── Dynamic Color Temperature Overlay ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-[2]"
        animate={{ background: colorTemp }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />

      {/* ── Depth Blur for Results ── */}
      <DepthBlur active={showDepthBlur} />

      {/* ── Letterbox Bars ── */}
      <AnimatePresence>
        {letterboxVisible && phase === "countdown" && (
          <>
            <motion.div
              className="absolute top-0 left-0 right-0 bg-black z-[60]"
              initial={{ height: "15%" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-black z-[60]"
              initial={{ height: "15%" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </>
        )}
      </AnimatePresence>

      {/* ── SCOREBOARD ── */}
      {phase === "playing" && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50 relative z-10"
          style={{
            background: timeLeft <= 10
              ? `rgba(239,68,68,${0.05 + intensity * 0.05})`
              : "transparent",
            transition: "background 0.5s",
          }}
        >
          {/* Player */}
          <div className="flex items-center gap-2 relative">
            <div className="relative">
              <LeaderCrown visible={playerScore > opponentScore && playerScore > 0} />
              <div
                className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden"
                style={{
                  boxShadow: playerScore > opponentScore ? `0 0 12px ${theme.playerHex}50` : "none",
                  borderColor: playerScore > opponentScore ? `${theme.playerHex}60` : undefined,
                }}
              >
                <User className="w-5 h-5 text-slate-400" />
              </div>
            </div>
            <div className="relative">
              <p className="text-xs font-black text-slate-200" style={{ letterSpacing: "0.15em" }}>You</p>
              <div className="text-sm font-black tabular-nums relative">
                <ScoreOdometer value={playerScore} color={theme.playerHex} />
                <ScoreRipple color={theme.playerHex} trigger={playerScoreRipple} />
              </div>
              {/* Floating score popup */}
              <AnimatePresence>
                {scorePopup && (
                  <FloatingScorePopup key={scorePopup.id} value={scorePopup.value} color={scorePopup.color} />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Timer */}
          <motion.div
            animate={timeLeft <= 10 ? { scale: [1, 1.06, 1] } : {}}
            transition={timeLeft <= 10 ? { duration: 0.8 - intensity * 0.3, repeat: Infinity, ease: "easeInOut" } : {}}
            className={`px-4 py-1.5 rounded-full border backdrop-blur-sm transition-colors ${
              timeLeft <= 10
                ? "bg-red-500/15 border-red-500/40"
                : "bg-slate-800/60 border-slate-700/50"
            }`}
            style={{
              boxShadow: timeLeft <= 10
                ? `0 0 ${20 + intensity * 20}px rgba(239,68,68,${0.25 + intensity * 0.2})`
                : "none",
            }}
          >
            <div className="flex items-center gap-1.5">
              <Timer
                className={`w-3.5 h-3.5 ${
                  timeLeft <= 10 ? "text-red-400" : "text-slate-400"
                }`}
              />
              <span
                className={`text-lg font-black tabular-nums ${
                  timeLeft <= 10 ? "text-red-400" : "text-white"
                }`}
                style={{
                  textShadow: timeLeft <= 10 ? `0 0 ${12 + intensity * 12}px rgba(239,68,68,0.6)` : "none",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {timeLeft}s
              </span>
            </div>
          </motion.div>

          {/* Opponent */}
          <div className="flex items-center gap-2">
            <div className="text-right relative">
              <p className="text-xs font-black text-slate-200" style={{ letterSpacing: "0.15em" }}>{opponentName}</p>
              <div className="text-sm font-black tabular-nums relative">
                <ScoreOdometer value={opponentScore} color="#94a3b8" />
                <ScoreRipple color={theme.opponentHex} trigger={opponentScoreRipple} />
              </div>
            </div>
            <div className="relative">
              <LeaderCrown visible={opponentScore > playerScore && opponentScore > 0} />
              <div
                className={`w-9 h-9 rounded-full overflow-hidden border ${theme.border} bg-slate-800 flex items-center justify-center`}
                style={{
                  boxShadow: opponentScore > playerScore ? `0 0 12px ${theme.opponentHex}50` : "none",
                }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={opponentName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── PHASE: COUNTDOWN ── */}
      {phase === "countdown" && (
        <motion.div
          className="flex flex-col items-center justify-center py-16 relative"
          animate={showGo ? {} : { scale: [1.03, 1] }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Layered glow rings */}
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.08, 0.2, 0.08] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute w-56 h-56 rounded-full blur-[60px]"
            style={{ background: `radial-gradient(circle, ${theme.solidHex}, transparent)` }}
          />
          <motion.div
            animate={{ scale: [1.2, 0.9, 1.2], opacity: [0.05, 0.15, 0.05] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute w-40 h-40 rounded-full blur-[40px]"
            style={{ background: `radial-gradient(circle, ${theme.secondHex}, transparent)` }}
          />

          <p
            className="text-[10px] font-black uppercase mb-1"
            style={{
              letterSpacing: "0.25em",
              background: `linear-gradient(135deg, ${theme.solidHex}, ${theme.secondHex})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Turf Wars
          </p>
          <motion.div
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <Flag
              className={`w-6 h-6 ${theme.text} mb-3`}
              style={{ filter: `drop-shadow(0 0 8px ${theme.solidHex}60)` }}
            />
          </motion.div>

          <AnimatePresence mode="popLayout">
            {showGo ? (
              <motion.div
                key="go"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.8, opacity: 1 }}
                exit={{ scale: 3, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="relative"
              >
                {/* Radial shockwave */}
                <motion.div
                  className="absolute inset-0 -m-16 rounded-full"
                  style={{ border: `3px solid ${theme.solidHex}`, background: `${theme.solidHex}10` }}
                  initial={{ scale: 0.5, opacity: 1 }}
                  animate={{ scale: 3, opacity: 0 }}
                  transition={{ duration: 0.6 }}
                />
                <h1
                  className="text-7xl font-black"
                  style={{
                    background: `linear-gradient(135deg, ${theme.solidHex}, ${theme.secondHex}, #fff)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: `0 0 40px ${theme.solidHex}80`,
                    letterSpacing: "0.15em",
                  }}
                >
                  GO!
                </h1>
              </motion.div>
            ) : (
              <motion.div key={countdown} className="relative">
                {/* Burst particles */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0.8 }}
                    animate={{
                      x: Math.cos((i * Math.PI * 2) / 12) * 70,
                      y: Math.sin((i * Math.PI * 2) / 12) * 70,
                      scale: [0, 1.2, 0],
                      opacity: [0.8, 0.5, 0],
                    }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full -ml-1 -mt-1"
                    style={{ background: countdownColors[countdown] || "#22c55e" }}
                  />
                ))}
                {/* Double pulsing ring */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0.6 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 rounded-full border-2 -m-8"
                  style={{ borderColor: countdownColors[countdown] || "#22c55e" }}
                />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.4 }}
                  animate={{ scale: 3, opacity: 0 }}
                  transition={{ duration: 1, delay: 0.1 }}
                  className="absolute inset-0 rounded-full border -m-12"
                  style={{ borderColor: countdownColors[countdown] || "#22c55e" }}
                />
                <motion.h1
                  initial={{ scale: 0, opacity: 0, rotate: -10 }}
                  animate={{ scale: 1.5, opacity: 1, rotate: 0 }}
                  exit={{ scale: 2.5, opacity: 0, rotate: 10 }}
                  transition={{ duration: 0.6 }}
                  className="text-8xl font-black"
                  style={{
                    color: countdownColors[countdown] || "#22c55e",
                    textShadow: `0 0 30px ${countdownColors[countdown] || "#22c55e"}60, 0 0 60px ${countdownColors[countdown] || "#22c55e"}30`,
                  }}
                >
                  {countdown}
                </motion.h1>
              </motion.div>
            )}
          </AnimatePresence>

          <p
            className="text-xs font-bold mt-8 uppercase"
            style={{
              letterSpacing: "0.15em",
              background: `linear-gradient(135deg, ${theme.solidHex}, white)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            vs {opponentName}
          </p>
        </motion.div>
      )}

      {/* ── PHASE: PLAYING ── */}
      {phase === "playing" && (
        <div className="flex flex-col items-center px-4 py-3 flex-1 relative z-10">
          {/* Domination Badge */}
          <DominationBadge
            playerZones={playerZones}
            opponentZones={opponentZones}
            playerColor={theme.playerHex}
            opponentColor={theme.opponentHex}
          />

          {/* Hex Grid */}
          <div
            className="relative mx-auto mb-3"
            style={{ width: gridW, height: gridH }}
          >
            {/* Influence Spread Overlay */}
            <AnimatePresence>
              {influenceHexId !== null && (
                <InfluenceSpread
                  key={`inf-${influenceHexId}`}
                  hexId={influenceHexId}
                  color={influenceColor}
                  getPosition={getHexPosition}
                />
              )}
            </AnimatePresence>

            {hexes.map((hex) => {
              const pos = getHexPosition(hex.id);
              const isCapturing = capturingId === hex.id;
              const isNeutral = hex.owner === "neutral";
              const isAiWarning = aiWarningHexId === hex.id;
              const showOpponentAvatar = lastAiCapturedHex === hex.id && hex.owner === "opponent";

              return (
                <motion.div
                  key={hex.id}
                  onClick={() => handleHexTap(hex.id)}
                  animate={
                    hex.justCaptured
                      ? { scale: [1, 1.15, 1] }
                      : isLast15 && isNeutral
                      ? { x: [0, Math.random() > 0.5 ? 1 : -1, 0], y: [0, Math.random() > 0.5 ? 0.5 : -0.5, 0] }
                      : { scale: 1 }
                  }
                  transition={
                    hex.justCaptured
                      ? { duration: 0.4 }
                      : isLast15 && isNeutral
                      ? { duration: 0.15 + Math.random() * 0.1, repeat: Infinity, repeatType: "mirror" as const }
                      : { duration: 0.4 }
                  }
                  className="absolute cursor-pointer"
                  style={{
                    left: pos.x,
                    top: pos.y,
                    width: HEX_W,
                    height: HEX_H,
                  }}
                >
                  {/* Outer border hex */}
                  <div
                    className="absolute transition-all duration-300"
                    style={{
                      inset: -2,
                      clipPath: HEX_CLIP,
                      background: getHexBg(hex),
                      opacity: hex.owner === "neutral" ? 0.35 : 1,
                    }}
                  />
                  {/* Inner fill hex */}
                  <div
                    className="w-full h-full transition-all duration-300"
                    style={{
                      clipPath: HEX_CLIP,
                      background: getHexInnerBg(hex),
                      boxShadow:
                        hex.owner === "player"
                          ? `inset 0 0 20px ${theme.playerHex}33, 0 0 ${24 + intensity * 16}px ${theme.playerHex}44`
                          : hex.owner === "opponent"
                          ? `inset 0 0 15px ${theme.opponentHex}22, 0 0 ${18 + intensity * 12}px ${theme.opponentHex}33`
                          : "inset 0 1px 0 rgba(255,255,255,0.05)",
                    }}
                  />

                  {/* Breathing inner glow */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      clipPath: HEX_CLIP,
                      background: hex.owner === "player"
                        ? `radial-gradient(circle at 50% 50%, ${theme.playerHex}30, transparent)`
                        : hex.owner === "opponent"
                        ? `radial-gradient(circle at 50% 50%, ${theme.opponentHex}20, transparent)`
                        : "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04), transparent)",
                    }}
                    animate={{ opacity: [0.4, 0.8 + intensity * 0.2, 0.4] }}
                    transition={{ duration: 2.5 - intensity * 1, repeat: Infinity, ease: "easeInOut", delay: hex.id * 0.15 }}
                  />

                  {/* AI warning flash */}
                  {isAiWarning && (
                    <>
                      <motion.div
                        className="absolute inset-0 z-20 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.8 }}
                      >
                        <AlertTriangle className="w-4 h-4 text-red-400" style={{ filter: "drop-shadow(0 0 8px rgba(239,68,68,0.8))" }} />
                      </motion.div>
                      <motion.div
                        className="absolute"
                        style={{
                          inset: -4,
                          clipPath: HEX_CLIP,
                          background: "rgba(239,68,68,0.3)",
                        }}
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: 0, scale: 1.3 }}
                        transition={{ duration: 0.6 }}
                      />
                    </>
                  )}

                  {/* Mini opponent avatar on captured hex */}
                  {showOpponentAvatar && (
                    <motion.div
                      className="absolute top-1 right-1 z-30"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div
                        className="w-4 h-4 rounded-full overflow-hidden border border-slate-600 bg-slate-800 flex items-center justify-center"
                        style={{ boxShadow: `0 0 6px ${theme.opponentHex}60` }}
                      >
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-2.5 h-2.5 text-slate-400" />
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Zone label */}
                  <span
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-black uppercase whitespace-nowrap"
                    style={{
                      letterSpacing: "0.15em",
                      color:
                        hex.owner === "player"
                          ? theme.playerHex
                          : hex.owner === "opponent"
                          ? theme.opponentHex
                          : "rgba(255,255,255,0.45)",
                      textShadow:
                        hex.owner !== "neutral"
                          ? `0 0 6px ${hex.owner === "player" ? theme.playerHex : theme.opponentHex}40`
                          : "none",
                    }}
                  >
                    {hex.name}
                  </span>

                  {/* Owner icon — flag planting animation for player */}
                  {hex.owner === "player" && hex.justCaptured && (
                    <FlagPlantAnimation color={theme.playerHex} />
                  )}
                  {hex.owner === "player" && !hex.justCaptured && (
                    <Flag
                      className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3"
                      style={{
                        color: theme.playerHex,
                        filter: `drop-shadow(0 0 4px ${theme.playerHex}80)`,
                      }}
                    />
                  )}
                  {hex.owner === "opponent" && (
                    <Shield
                      className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3"
                      style={{
                        color: theme.opponentHex,
                        filter: `drop-shadow(0 0 4px ${theme.opponentHex}80)`,
                      }}
                    />
                  )}

                  {/* Neutral tap hint */}
                  {isNeutral && !isCapturing && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <motion.div
                        animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.6, 0.35] }}
                        transition={{ duration: 2 - intensity, repeat: Infinity }}
                      >
                        <MapPin className="w-3 h-3 text-slate-500 mt-3" />
                      </motion.div>
                    </div>
                  )}

                  {/* Capture progress overlay + spark particles */}
                  {isCapturing && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <CaptureSparkParticles color={theme.playerHex} />
                      <motion.svg
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute w-16 h-16 -rotate-90"
                        viewBox="0 0 48 48"
                      >
                        <circle
                          cx="24" cy="24" r="20"
                          fill="none"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="3"
                        />
                        <circle
                          cx="24" cy="24" r="20"
                          fill="none"
                          stroke={theme.playerHex}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 20}`}
                          strokeDashoffset={`${
                            2 * Math.PI * 20 -
                            (2 * Math.PI * 20 * captureProgress) / CAPTURE_TIME
                          }`}
                          style={{
                            transition: "stroke-dashoffset 0.3s ease",
                            filter: `drop-shadow(0 0 8px ${theme.playerHex}aa)`,
                          }}
                        />
                      </motion.svg>
                      <span
                        className="text-sm font-black z-10"
                        style={{
                          color: theme.playerHex,
                          textShadow: `0 0 8px ${theme.playerHex}60`,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {CAPTURE_TIME - captureProgress}
                      </span>
                    </div>
                  )}

                  {/* Just-captured shockwave rings */}
                  {hex.justCaptured && (
                    <>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0.8 }}
                        animate={{ scale: 1.8, opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className="absolute"
                        style={{
                          inset: -8,
                          clipPath: HEX_CLIP,
                          background:
                            hex.owner === "player"
                              ? `${theme.playerHex}44`
                              : `${theme.opponentHex}44`,
                        }}
                      />
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0.5 }}
                        animate={{ scale: 2.2, opacity: 0 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="absolute"
                        style={{
                          inset: -12,
                          clipPath: HEX_CLIP,
                          background:
                            hex.owner === "player"
                              ? `${theme.playerHex}22`
                              : `${theme.opponentHex}22`,
                        }}
                      />
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Stats Bar — glassmorphic */}
          <div className="w-full max-w-xs">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Zones", value: playerZones, color: theme.text, isThemed: true },
                { label: "Multiplier", value: `×${multiplier}`, color: "text-amber-400", isThemed: false },
                { label: "Pts/sec", value: pointsPerSec, color: "text-white", isThemed: false },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * i, type: "spring" }}
                  className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-xl p-2 text-center"
                  style={{
                    boxShadow: stat.isThemed && playerZones > 0
                      ? `0 0 10px ${theme.playerHex}15`
                      : "none",
                  }}
                >
                  <p
                    className="text-[7px] text-slate-500 uppercase font-bold mb-0.5"
                    style={{ letterSpacing: "0.25em" }}
                  >
                    {stat.label}
                  </p>
                  <p
                    className={`text-base font-black ${stat.color}`}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {stat.value}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Territory Control Bar */}
            <TerritoryBar playerZones={playerZones} opponentZones={opponentZones} theme={theme} />

            {/* Last 15 seconds warning */}
            {isLast15 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: [0.7, 1, 0.7], scale: 1 }}
                transition={{ opacity: { duration: 0.8, repeat: Infinity }, scale: { duration: 0.3 } }}
                className="flex items-center justify-center gap-1.5 mt-2"
              >
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span className="text-[8px] font-black text-red-400 uppercase" style={{ letterSpacing: "0.15em", textShadow: "0 0 8px rgba(239,68,68,0.4)" }}>
                  Final Countdown
                </span>
              </motion.div>
            )}

            {capturingId === null && !isLast15 && (
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-[9px] text-slate-500 text-center mt-2 font-bold uppercase"
                style={{ letterSpacing: "0.15em" }}
              >
                Tap a neutral zone to capture
              </motion.p>
            )}
            {capturingId !== null && (
              <p
                className="text-[9px] text-center mt-2 font-bold uppercase"
                style={{
                  letterSpacing: "0.15em",
                  color: theme.playerHex,
                  textShadow: `0 0 6px ${theme.playerHex}40`,
                }}
              >
                Capturing {hexes.find((h) => h.id === capturingId)?.name}…
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── PHASE: RESULTS ── */}
      {phase === "results" && (
        <ScreenShake active={shakeResults}>
          <div className="flex flex-col items-center px-4 py-5 relative">
            {/* Victory Rays */}
            {playerWon && <VictoryRays color={theme.solidHex} />}

            {/* Win particles */}
            {playerWon && winParticles.map((p) => (
              <motion.span
                key={p.id}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{ x: p.x, y: p.y, opacity: 0, scale: 1, rotate: p.rotate }}
                transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
                className="absolute text-lg pointer-events-none z-20"
                style={{ left: "50%", top: "30%" }}
              >
                {p.emoji}
              </motion.span>
            ))}

            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-full max-w-sm relative z-10"
            >
              <div
                className="rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl overflow-hidden"
                style={{ boxShadow: `0 4px 40px rgba(0,0,0,0.3), 0 0 20px ${theme.solidHex}10` }}
              >
                {/* Rotating conic-gradient border */}
                <motion.div
                  className="absolute inset-0 rounded-2xl pointer-events-none z-0"
                  style={{
                    background: `conic-gradient(from 0deg, transparent, ${theme.solidHex}20, transparent, ${theme.secondHex}20, transparent)`,
                    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    maskComposite: "exclude",
                    WebkitMaskComposite: "xor",
                    padding: "1px",
                    borderRadius: "1rem",
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                />

                <div className={`h-1.5 bg-gradient-to-r ${theme.gradient}`} />
                <div className="p-5 text-center">
                  {/* Winner icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className={`relative w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${
                      playerWon
                        ? "bg-amber-500/10 border-2 border-amber-500/30"
                        : isTie
                        ? "bg-slate-800 border-2 border-slate-700"
                        : "bg-red-500/10 border-2 border-red-500/30"
                    }`}
                    style={{
                      boxShadow: playerWon
                        ? "0 0 20px rgba(245,158,11,0.2)"
                        : "none",
                    }}
                  >
                    {playerWon ? (
                      <motion.div
                        animate={{ rotate: [-5, 5, -5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Crown className="w-8 h-8 text-amber-400" style={{ filter: "drop-shadow(0 0 8px rgba(245,158,11,0.5))" }} />
                      </motion.div>
                    ) : isTie ? (
                      <Flag className="w-8 h-8 text-slate-400" />
                    ) : (
                      <span className="text-3xl">😢</span>
                    )}
                    {playerWon && (
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-300" style={{ filter: "drop-shadow(0 0 4px rgba(245,158,11,0.6))" }} />
                      </motion.div>
                    )}
                  </motion.div>

                  <h2
                    className="text-xl font-black uppercase mb-1"
                    style={{
                      letterSpacing: "0.15em",
                      ...(playerWon
                        ? {
                            background: "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }
                        : {}),
                    }}
                  >
                    {playerWon
                      ? "Territory Dominated!"
                      : isTie
                      ? "Stalemate!"
                      : "Territory Lost!"}
                  </h2>
                  <p
                    className={`text-[10px] font-bold uppercase mb-4 ${
                      playerWon
                        ? "text-amber-400"
                        : isTie
                        ? "text-slate-400"
                        : "text-red-400"
                    }`}
                    style={{ letterSpacing: "0.25em" }}
                  >
                    {playerWon
                      ? "You control the map"
                      : isTie
                      ? "Neither could dominate"
                      : `${opponentName} controls the map`}
                  </p>

                  {/* Animated score comparison with odometer */}
                  <div className="flex items-center justify-center gap-3 text-lg font-black my-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                      style={{
                        textShadow: playerWon ? "0 0 10px rgba(16,185,129,0.4)" : "none",
                      }}
                    >
                      <ScoreOdometer value={displayPlayerScore} color={playerWon ? "#34d399" : "#94a3b8"} />
                    </motion.div>
                    <span className="text-slate-600">—</span>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: "spring" }}
                      style={{
                        textShadow: !playerWon && !isTie ? "0 0 10px rgba(244,63,94,0.4)" : "none",
                      }}
                    >
                      <ScoreOdometer value={displayOpponentScore} color={!playerWon && !isTie ? "#fb7185" : "#94a3b8"} />
                    </motion.div>
                  </div>

                  {/* Mini hex map snapshot — staggered reveal */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="relative mx-auto mb-4"
                    style={{ width: gridW * 0.55, height: gridH * 0.55 }}
                  >
                    {hexes.map((hex, idx) => {
                      const pos = getHexPosition(hex.id);
                      return (
                        <motion.div
                          key={hex.id}
                          className="absolute"
                          initial={{ rotateY: 180, opacity: 0 }}
                          animate={{ rotateY: 0, opacity: 1 }}
                          transition={{ delay: 0.6 + idx * 0.08, duration: 0.4, type: "spring" }}
                          style={{
                            left: pos.x * 0.55,
                            top: pos.y * 0.55,
                            width: HEX_W * 0.55,
                            height: HEX_H * 0.55,
                            perspective: "400px",
                          }}
                        >
                          <div
                            className="absolute"
                            style={{
                              inset: -1,
                              clipPath: HEX_CLIP,
                              background:
                                hex.owner === "player"
                                  ? theme.playerHex
                                  : hex.owner === "opponent"
                                  ? theme.opponentHex
                                  : "#334155",
                              opacity: hex.owner === "neutral" ? 0.25 : 0.9,
                            }}
                          />
                          <div
                            className="w-full h-full"
                            style={{
                              clipPath: HEX_CLIP,
                              background: getHexInnerBg(hex),
                            }}
                          />
                          <span
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[5px] font-black uppercase"
                            style={{
                              color:
                                hex.owner === "player"
                                  ? theme.playerHex
                                  : hex.owner === "opponent"
                                  ? theme.opponentHex
                                  : "rgba(255,255,255,0.3)",
                            }}
                          >
                            {hex.name.slice(0, 3)}
                          </span>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  {/* Zone breakdown — staggered */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4 backdrop-blur-sm"
                  >
                    <p
                      className="text-[8px] text-slate-500 uppercase font-bold mb-2"
                      style={{ letterSpacing: "0.25em" }}
                    >
                      Territory Breakdown
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: playerZones, label: "Your zones", highlight: playerWon, color: "text-emerald-400" },
                        { value: hexes.filter((h) => h.owner === "neutral").length, label: "Neutral", highlight: false, color: "text-slate-400" },
                        { value: opponentZones, label: `${opponentName}'s`, highlight: !playerWon && !isTie, color: "text-rose-400" },
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.7 + i * 0.1, type: "spring" }}
                        >
                          <p className={`text-lg font-black ${item.highlight ? item.color : "text-white"}`}
                            style={{ fontVariantNumeric: "tabular-nums" }}
                          >
                            {item.value}
                          </p>
                          <p
                            className="text-[7px] text-slate-500 uppercase font-bold"
                            style={{ letterSpacing: "0.25em" }}
                          >
                            {item.label}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 justify-center mt-2">
                      <Flag className="w-3 h-3 text-amber-400" style={{ filter: "drop-shadow(0 0 4px rgba(245,158,11,0.5))" }} />
                      <span className="text-[8px] font-black text-amber-400 uppercase" style={{ fontVariantNumeric: "tabular-nums" }}>
                        Total Points: {playerScore} vs {opponentScore}
                      </span>
                    </div>
                  </motion.div>

                  {/* Action buttons — improved */}
                  <div className="space-y-2">
                    <motion.button
                      whileTap={{ scale: 0.93 }}
                      onClick={handlePlayAgain}
                      className={`w-full py-3 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-black text-xs uppercase tracking-widest transition-transform flex items-center justify-center gap-2 relative overflow-hidden`}
                      style={{
                        boxShadow: `0 4px 16px ${theme.solidHex}40, inset 0 1px 0 rgba(255,255,255,0.15)`,
                        letterSpacing: "0.15em",
                        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                      }}
                    >
                      {/* Shimmer */}
                      <motion.div
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                        className="absolute inset-0 w-1/3 skew-x-[-20deg]"
                        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)" }}
                      />
                      <RefreshCcw className="w-4 h-4" />
                      <span>Play Again</span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.93 }}
                      onClick={onComplete}
                      className="w-full py-2.5 rounded-xl bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 text-slate-300 text-xs font-bold transition-all"
                      style={{
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                      }}
                    >
                      Done
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </ScreenShake>
      )}
    </div>
  );
}
