import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radar, Crosshair, Target, Trophy, RefreshCcw, User, Sparkles, Zap } from "lucide-react";

/* ────────────────────────────────────────────────────────────────
   MapProximityTag — Radar sweep "tag" game for the map overlay
   5 rounds. Tap when the sweep arm passes over the opponent blip.
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
    radarColor: "#ec4899",
    blipColor: "#f472b6",
  },
  friends: {
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    radarColor: "#10b981",
    blipColor: "#34d399",
  },
  business: {
    gradient: "from-blue-500 via-indigo-500 to-purple-500",
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    radarColor: "#3b82f6",
    blipColor: "#60a5fa",
  },
} as const;

const TOTAL_ROUNDS = 5;
const SWEEP_DURATION_MS = 3000; // one full 360° rotation
const HIT_WINDOW_PERFECT = 5;  // ±5° → 100pts
const HIT_WINDOW_GREAT = 10;   // ±10° → 80pts
const HIT_WINDOW_GOOD = 15;    // ±15° → 60pts

type Phase = "countdown" | "playing" | "results";
type RoundResult = { hit: boolean; points: number; blipAngle: number; sweepAngle: number };

/** Normalize any angle to [0, 360) */
function normAngle(a: number): number {
  return ((a % 360) + 360) % 360;
}

/** Smallest angular difference (unsigned) between two angles */
function angleDiff(a: number, b: number): number {
  const d = Math.abs(normAngle(a) - normAngle(b));
  return d > 180 ? 360 - d : d;
}

/** Random angle for the blip in [30, 330) — avoid very top of circle */
function randomBlipAngle(): number {
  return 30 + Math.random() * 300;
}

/** Random radial distance for the blip (40%-85% of radar radius) */
function randomBlipRadius(): number {
  return 0.4 + Math.random() * 0.45;
}

/** Get accuracy rank from percentage */
function getRank(accuracy: number): { letter: string; color: string; bg: string } {
  if (accuracy >= 90) return { letter: "S", color: "text-amber-400", bg: "bg-amber-500/20 border-amber-500/40" };
  if (accuracy >= 70) return { letter: "A", color: "text-emerald-400", bg: "bg-emerald-500/20 border-emerald-500/40" };
  if (accuracy >= 50) return { letter: "B", color: "text-blue-400", bg: "bg-blue-500/20 border-blue-500/40" };
  if (accuracy >= 30) return { letter: "C", color: "text-purple-400", bg: "bg-purple-500/20 border-purple-500/40" };
  return { letter: "D", color: "text-slate-400", bg: "bg-slate-700/40 border-slate-600/40" };
}

export default function MapProximityTag({ opponent, category, onComplete }: MapGameChildProps) {
  const theme = THEMES[category];
  const opponentInitial = opponent.firstName.charAt(0).toUpperCase();

  // ── Game state ──
  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState<RoundResult[]>([]);

  // ── Current round state ──
  const [blipAngle, setBlipAngle] = useState(() => randomBlipAngle());
  const [blipRadius, setBlipRadius] = useState(() => randomBlipRadius());
  const [sweepAngle, setSweepAngle] = useState(0);
  const [flashResult, setFlashResult] = useState<{ hit: boolean; points: number } | null>(null);
  const [tapped, setTapped] = useState(false);

  // ── Refs ──
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const sweepAngleRef = useRef(0);
  const isPlayingRef = useRef(false);

  // ── Countdown ──
  useEffect(() => {
    if (phase === "countdown") {
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown((prev) => {
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

  // ── Start round when entering playing phase ──
  useEffect(() => {
    if (phase === "playing") {
      startRound();
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      isPlayingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const startRound = useCallback(() => {
    const newBlipAngle = randomBlipAngle();
    const newBlipRadius = randomBlipRadius();
    setBlipAngle(newBlipAngle);
    setBlipRadius(newBlipRadius);
    setSweepAngle(0);
    setFlashResult(null);
    setTapped(false);
    isPlayingRef.current = true;
    startTimeRef.current = performance.now();
    sweepAngleRef.current = 0;

    const animate = (now: number) => {
      if (!isPlayingRef.current) return;
      const elapsed = now - startTimeRef.current;
      const angle = (elapsed / SWEEP_DURATION_MS) * 360;
      sweepAngleRef.current = normAngle(angle);
      setSweepAngle(normAngle(angle));
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  // ── Handle tap ──
  const handleTap = useCallback(() => {
    if (phase !== "playing" || tapped) return;

    setTapped(true);
    isPlayingRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const diff = angleDiff(sweepAngleRef.current, blipAngle);
    let points = 0;
    let hit = false;

    if (diff <= HIT_WINDOW_PERFECT) {
      points = 100;
      hit = true;
    } else if (diff <= HIT_WINDOW_GREAT) {
      points = 80;
      hit = true;
    } else if (diff <= HIT_WINDOW_GOOD) {
      points = 60;
      hit = true;
    }

    const result: RoundResult = {
      hit,
      points,
      blipAngle,
      sweepAngle: sweepAngleRef.current,
    };

    setFlashResult({ hit, points });
    setScore((s) => s + points);
    setRounds((prev) => [...prev, result]);

    // Advance after brief delay
    setTimeout(() => {
      const nextRound = currentRound + 1;
      if (nextRound >= TOTAL_ROUNDS) {
        setCurrentRound(nextRound);
        setPhase("results");
      } else {
        setCurrentRound(nextRound);
        startRound();
      }
    }, 1200);
  }, [phase, tapped, blipAngle, currentRound, startRound]);

  // ── Auto-miss if a full sweep completes without tapping ──
  useEffect(() => {
    if (phase !== "playing" || tapped) return;
    // Watch sweepAngle — if it crosses back past 355→0 that means a full rotation
    // Use a timer fallback: if no tap within SWEEP_DURATION_MS, force miss
    const timeout = setTimeout(() => {
      if (!tapped && isPlayingRef.current) {
        handleTap(); // will evaluate as MISS since sweep is far from blip (statistically)
      }
    }, SWEEP_DURATION_MS + 200);
    return () => clearTimeout(timeout);
  }, [phase, tapped, currentRound, handleTap]);

  // ── Restart ──
  const handlePlayAgain = useCallback(() => {
    setPhase("countdown");
    setCurrentRound(0);
    setScore(0);
    setRounds([]);
    setFlashResult(null);
    setTapped(false);
  }, []);

  // ── Computed stats ──
  const totalHits = rounds.filter((r) => r.hit).length;
  const accuracy = rounds.length > 0 ? Math.round((totalHits / rounds.length) * 100) : 0;
  const maxPossible = TOTAL_ROUNDS * 100;
  const rank = getRank((score / maxPossible) * 100);

  // ── Radar dimensions ──
  const RADAR_SIZE = 260;
  const RADAR_RADIUS = RADAR_SIZE / 2;

  // ── Blip position (relative to center) ──
  const blipX = Math.cos(((blipAngle - 90) * Math.PI) / 180) * (RADAR_RADIUS * blipRadius);
  const blipY = Math.sin(((blipAngle - 90) * Math.PI) / 180) * (RADAR_RADIUS * blipRadius);

  return (
    <div className="flex flex-col w-full text-white select-none overflow-hidden">

      {/* ── TOP BAR (visible during playing) ── */}
      {phase === "playing" && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50">
          {/* Score */}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full ${theme.bg} ${theme.border} border flex items-center justify-center`}>
              <Zap className={`w-4 h-4 ${theme.text}`} />
            </div>
            <div>
              <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Score</p>
              <p className={`text-sm font-black ${theme.text}`}>{score}</p>
            </div>
          </div>

          {/* Round tracker dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
              const r = rounds[i];
              let cls = "bg-slate-800 border-slate-700";
              let label = "";
              if (r) {
                if (r.hit) { cls = "bg-emerald-500/20 border-emerald-500 text-emerald-400"; label = "✓"; }
                else { cls = "bg-red-500/20 border-red-500 text-red-400"; label = "✗"; }
              } else if (i === currentRound) {
                cls = `${theme.bg} ${theme.border} ${theme.text}`;
                label = "•";
              }
              return (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <span className="text-[7px] text-slate-500 font-black uppercase">R{i + 1}</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border ${cls}`}>
                    {label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Opponent mini avatar */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Target</p>
              <p className="text-xs font-black text-slate-200">{opponent.firstName}</p>
            </div>
            <div className={`w-8 h-8 rounded-full overflow-hidden border ${theme.border} bg-slate-800 flex items-center justify-center`}>
              {opponent.profilePhoto ? (
                <img src={opponent.profilePhoto} alt={opponent.firstName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PHASE: COUNTDOWN ── */}
      {phase === "countdown" && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative w-20 h-20 flex items-center justify-center mb-4">
            <Radar className={`w-10 h-10 ${theme.text} opacity-30`} />
            {[1, 2].map((ring) => (
              <motion.div
                key={ring}
                initial={{ scale: 0.5, opacity: 0.6 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, delay: ring * 0.6, ease: "easeOut" }}
                className={`absolute inset-0 rounded-full border ${theme.border}`}
              />
            ))}
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
            Radar Locking
          </p>
          <AnimatePresence mode="popLayout">
            <motion.h1
              key={countdown}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.6 }}
              className={`text-7xl font-black ${
                countdown === 1 ? "text-rose-500" : countdown === 2 ? "text-amber-500" : "text-emerald-500"
              }`}
            >
              {countdown}
            </motion.h1>
          </AnimatePresence>
          <p className="text-xs text-slate-400 font-bold mt-8 uppercase tracking-wider">
            vs {opponent.firstName}
          </p>
        </div>
      )}

      {/* ── PHASE: PLAYING — THE RADAR ── */}
      {phase === "playing" && (
        <div className="flex-1 flex flex-col items-center justify-center py-6" onClick={handleTap}>
          {/* Radar container */}
          <div
            className="relative cursor-pointer"
            style={{ width: RADAR_SIZE, height: RADAR_SIZE }}
          >
            {/* Dark radar background */}
            <div
              className="absolute inset-0 rounded-full bg-slate-950 border-2 border-slate-800/80 overflow-hidden"
              style={{ boxShadow: `inset 0 0 60px rgba(0,0,0,0.8), 0 0 30px ${theme.radarColor}15` }}
            >
              {/* Concentric rings */}
              {[0.33, 0.66, 1].map((scale, i) => (
                <div
                  key={i}
                  className="absolute rounded-full border border-slate-800/40"
                  style={{
                    width: `${scale * 100}%`,
                    height: `${scale * 100}%`,
                    top: `${(1 - scale) * 50}%`,
                    left: `${(1 - scale) * 50}%`,
                  }}
                />
              ))}

              {/* Crosshair lines */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-800/50 -translate-x-px" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-800/50 -translate-y-px" />

              {/* Sweep arm */}
              <div
                className="absolute top-0 left-0 w-full h-full"
                style={{ transform: `rotate(${sweepAngle}deg)` }}
              >
                {/* Trailing glow (conic gradient) */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(from -30deg at 50% 50%, ${theme.radarColor}35 0deg, transparent 45deg, transparent 360deg)`,
                  }}
                />
                {/* Sweep line */}
                <div
                  className="absolute left-1/2 bottom-1/2 w-[2px] origin-bottom"
                  style={{
                    height: RADAR_RADIUS - 4,
                    marginLeft: -1,
                    background: `linear-gradient(to top, transparent 0%, ${theme.radarColor} 100%)`,
                    boxShadow: `0 0 8px ${theme.radarColor}80`,
                  }}
                />
              </div>

              {/* Opponent blip */}
              <motion.div
                className="absolute flex items-center justify-center"
                style={{
                  left: RADAR_RADIUS + blipX - 12,
                  top: RADAR_RADIUS + blipY - 12,
                  width: 24,
                  height: 24,
                }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Glow ring */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${theme.blipColor}50 0%, transparent 70%)`,
                  }}
                />
                {/* Dot with initial */}
                <div
                  className="relative w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white z-10"
                  style={{
                    backgroundColor: theme.blipColor,
                    boxShadow: `0 0 12px ${theme.blipColor}90, 0 0 24px ${theme.blipColor}40`,
                  }}
                >
                  {opponentInitial}
                </div>
              </motion.div>

              {/* Center dot */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-500/60" />

              {/* Hit/Miss flash overlay */}
              <AnimatePresence>
                {flashResult && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className={`absolute inset-0 rounded-full ${
                      flashResult.hit ? "bg-emerald-500/30" : "bg-red-500/30"
                    }`}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Flash result badge (floats above radar) */}
            <AnimatePresence>
              {flashResult && (
                <motion.div
                  initial={{ scale: 0, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: -20 }}
                  exit={{ scale: 0.5, opacity: 0, y: -40 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`absolute left-1/2 -translate-x-1/2 -top-4 z-20 px-4 py-2 rounded-full font-black text-sm uppercase tracking-wider ${
                    flashResult.hit
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      : "bg-red-500 text-white shadow-lg shadow-red-500/30"
                  }`}
                >
                  {flashResult.hit ? `HIT! +${flashResult.points}` : "MISS!"}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Instruction text */}
          <div className="mt-6 text-center">
            {!tapped ? (
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="flex items-center gap-2"
              >
                <Crosshair className={`w-5 h-5 ${theme.text}`} />
                <span className={`text-sm font-black uppercase tracking-widest ${theme.text}`}>
                  TAP TO TAG!
                </span>
              </motion.div>
            ) : (
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                {flashResult?.hit ? "Nice timing!" : "Too far off..."}
              </p>
            )}
          </div>

          {/* Accuracy mini counter */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-400 font-bold">{totalHits} Hit{totalHits !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[10px] text-slate-400 font-bold">{rounds.length - totalHits} Miss{(rounds.length - totalHits) !== 1 ? "es" : ""}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── PHASE: RESULTS ── */}
      {phase === "results" && (
        <div className="flex flex-col items-center px-4 py-6">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-full max-w-sm"
          >
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-md shadow-2xl overflow-hidden">
              <div className={`h-1.5 bg-gradient-to-r ${theme.gradient}`} />
              <div className="p-5 text-center">
                {/* Rank badge */}
                <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center border-2 ${rank.bg}`}>
                  <span className={`text-3xl font-black ${rank.color}`}>{rank.letter}</span>
                </div>

                <h2 className="text-xl font-black uppercase tracking-wider mb-1">
                  {score >= 400 ? "Radar Master!" : score >= 200 ? "Good Tracking!" : "Keep Practicing!"}
                </h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-4">
                  Proximity Tag Complete
                </p>

                {/* Score + Accuracy */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold mb-1">Total Score</p>
                    <p className={`text-2xl font-black ${theme.text}`}>{score}</p>
                    <p className="text-[8px] text-slate-600 font-bold">/ {maxPossible}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold mb-1">Accuracy</p>
                    <p className="text-2xl font-black text-white">{accuracy}%</p>
                    <p className="text-[8px] text-slate-600 font-bold">{totalHits}/{TOTAL_ROUNDS} hits</p>
                  </div>
                </div>

                {/* Per-round breakdown */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  {rounds.map((r, i) => (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <span className="text-[7px] text-slate-500 uppercase font-black">R{i + 1}</span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border ${
                        r.hit
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                          : "bg-red-500/20 border-red-500 text-red-400"
                      }`}>
                        {r.hit ? `+${r.points}` : "0"}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Radar heat map (mini visual of all blip positions) */}
                <div className="bg-slate-950/80 border border-slate-800/50 rounded-xl p-4 mb-4">
                  <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold mb-3">Radar Heat Map</p>
                  <div className="relative w-32 h-32 mx-auto">
                    {/* Mini radar rings */}
                    <div className="absolute inset-0 rounded-full border border-slate-800/40" />
                    <div className="absolute inset-[16%] rounded-full border border-slate-800/30" />
                    <div className="absolute inset-[33%] rounded-full border border-slate-800/20" />
                    {/* Crosshair */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-800/30 -translate-x-px" />
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-800/30 -translate-y-px" />
                    {/* Blip dots */}
                    {rounds.map((r, i) => {
                      const bx = Math.cos(((r.blipAngle - 90) * Math.PI) / 180) * 50;
                      const by = Math.sin(((r.blipAngle - 90) * Math.PI) / 180) * 50;
                      return (
                        <div
                          key={i}
                          className={`absolute w-3 h-3 rounded-full flex items-center justify-center text-[6px] font-black ${
                            r.hit ? "bg-emerald-500/80 text-white" : "bg-red-500/80 text-white"
                          }`}
                          style={{
                            left: 64 + bx - 6,
                            top: 64 + by - 6,
                            boxShadow: r.hit ? "0 0 6px rgba(16,185,129,0.5)" : "0 0 6px rgba(239,68,68,0.4)",
                          }}
                        >
                          {i + 1}
                        </div>
                      );
                    })}
                    {/* Center */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-500/60" />
                  </div>
                </div>

                {/* Winner flair */}
                {score >= 300 && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                      {opponent.firstName} has been tagged!
                    </span>
                    <Trophy className="w-4 h-4 text-amber-400 animate-pulse" />
                  </div>
                )}

                {/* Action buttons */}
                <div className="space-y-2">
                  <button
                    onClick={handlePlayAgain}
                    className={`w-full py-3 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2`}
                  >
                    <RefreshCcw className="w-4 h-4" />
                    <span>Play Again</span>
                  </button>
                  <button
                    onClick={onComplete}
                    className="w-full py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-300 text-xs font-bold active:scale-95 transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
