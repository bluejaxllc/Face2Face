import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mountain,
  Crown,
  Trophy,
  RefreshCcw,
  User,
  Zap,
  Timer,
  Sparkles,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────
   MapKingOfTheHill — Compact territory-control tap game
   3 zones, 10s each. Tap rapidly to claim the hill.
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
    playerColor: "#ec4899",
    opponentColor: "#f43f5e",
  },
  friends: {
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    playerColor: "#10b981",
    opponentColor: "#14b8a6",
  },
  business: {
    gradient: "from-blue-500 via-indigo-500 to-purple-500",
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    playerColor: "#3b82f6",
    opponentColor: "#6366f1",
  },
} as const;

const TOTAL_ZONES = 3;
const ZONE_DURATION = 10; // seconds per zone

type Phase = "countdown" | "playing" | "zone-result" | "results";

export default function MapKingOfTheHill({ opponent, category, onComplete, onBack }: MapGameChildProps) {
  const theme = THEMES[category];
  const opponentName = opponent.firstName;

  // ── Game state ──
  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [currentZone, setCurrentZone] = useState(1);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ZONE_DURATION);

  // ── Display values (updated every 100ms from refs) ──
  const [displayPlayerTaps, setDisplayPlayerTaps] = useState(0);
  const [displayOpponentTaps, setDisplayOpponentTaps] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(50); // 0-100, 50 = neutral

  // ── Zone results history ──
  const [zonesHistory, setZonesHistory] = useState<
    { winner: "player" | "opponent" | "tie"; playerTaps: number; opponentTaps: number }[]
  >([]);

  // ── Current zone result (for zone-result phase) ──
  const [zoneWinner, setZoneWinner] = useState<"player" | "opponent" | "tie" | null>(null);

  // ── Tap bounce animation ──
  const [tapBounce, setTapBounce] = useState(0);

  // ── Refs for performance (tap counts NOT in state to avoid re-renders) ──
  const playerTapsRef = useRef(0);
  const opponentTapsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const opponentIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const displayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiSpeedRef = useRef(5); // taps per second for this zone
  const phaseRef = useRef(phase);

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ── Cleanup all intervals ──
  const clearAllIntervals = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (opponentIntervalRef.current) { clearInterval(opponentIntervalRef.current); opponentIntervalRef.current = null; }
    if (displayIntervalRef.current) { clearInterval(displayIntervalRef.current); displayIntervalRef.current = null; }
  }, []);

  // ── Countdown effect ──
  useEffect(() => {
    if (phase === "countdown") {
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            startZone();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // ── Start a new zone round ──
  const startZone = useCallback(() => {
    // Reset tap counts
    playerTapsRef.current = 0;
    opponentTapsRef.current = 0;
    setDisplayPlayerTaps(0);
    setDisplayOpponentTaps(0);
    setDisplayProgress(50);
    setTimeLeft(ZONE_DURATION);

    // Randomize AI speed for this zone (3-7 taps/sec)
    aiSpeedRef.current = 3 + Math.random() * 4;

    setPhase("playing");
  }, []);

  // ── Playing phase: timers, AI, display updates ──
  useEffect(() => {
    if (phase !== "playing") return;

    // Countdown timer (1s intervals)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Zone ended
          clearAllIntervals();
          finalizeZone();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Opponent AI interval (every 200ms, add 1-2 taps based on speed)
    opponentIntervalRef.current = setInterval(() => {
      // aiSpeedRef taps/sec → per 200ms = aiSpeed * 0.2
      const tapsThisTick = aiSpeedRef.current * 0.2;
      // Add fractional taps with some randomness
      const actualTaps = Math.random() < (tapsThisTick % 1) 
        ? Math.ceil(tapsThisTick) 
        : Math.floor(tapsThisTick);
      opponentTapsRef.current += Math.max(1, actualTaps);
    }, 200);

    // Display update interval (every 100ms)
    displayIntervalRef.current = setInterval(() => {
      setDisplayPlayerTaps(playerTapsRef.current);
      setDisplayOpponentTaps(opponentTapsRef.current);

      const total = playerTapsRef.current + opponentTapsRef.current;
      if (total === 0) {
        setDisplayProgress(50);
      } else {
        setDisplayProgress((playerTapsRef.current / total) * 100);
      }
    }, 100);

    return () => clearAllIntervals();
  }, [phase, clearAllIntervals]);

  // ── Finalize a zone ──
  const finalizeZone = useCallback(() => {
    const pTaps = playerTapsRef.current;
    const oTaps = opponentTapsRef.current;
    let winner: "player" | "opponent" | "tie";

    if (pTaps > oTaps) {
      winner = "player";
      setPlayerScore((s) => s + 1);
    } else if (oTaps > pTaps) {
      winner = "opponent";
      setOpponentScore((s) => s + 1);
    } else {
      winner = "tie";
    }

    setZoneWinner(winner);
    setZonesHistory((h) => [...h, { winner, playerTaps: pTaps, opponentTaps: oTaps }]);
    setDisplayPlayerTaps(pTaps);
    setDisplayOpponentTaps(oTaps);

    const total = pTaps + oTaps;
    setDisplayProgress(total === 0 ? 50 : (pTaps / total) * 100);

    setPhase("zone-result");
  }, []);

  // ── Handle tap (player) ──
  const handleTap = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    playerTapsRef.current += 1;
    setTapBounce((b) => b + 1);
  }, []);

  // ── Next zone or results ──
  const handleNextZone = useCallback(() => {
    if (currentZone >= TOTAL_ZONES) {
      setPhase("results");
    } else {
      setCurrentZone((z) => z + 1);
      setZoneWinner(null);
      setPhase("countdown");
    }
  }, [currentZone]);

  // ── Play again ──
  const handlePlayAgain = useCallback(() => {
    clearAllIntervals();
    setPhase("countdown");
    setCurrentZone(1);
    setPlayerScore(0);
    setOpponentScore(0);
    setZonesHistory([]);
    setZoneWinner(null);
    setTapBounce(0);
    playerTapsRef.current = 0;
    opponentTapsRef.current = 0;
    setDisplayPlayerTaps(0);
    setDisplayOpponentTaps(0);
    setDisplayProgress(50);
    setTimeLeft(ZONE_DURATION);
  }, [clearAllIntervals]);

  const playerWon = playerScore > opponentScore;
  const isTie = playerScore === opponentScore;
  const avatarUrl = opponent.profilePhoto || undefined;

  // Compute tap speeds for results
  const totalPlayerTaps = zonesHistory.reduce((sum, z) => sum + z.playerTaps, 0);
  const totalOpponentTaps = zonesHistory.reduce((sum, z) => sum + z.opponentTaps, 0);
  const playerTapsPerSec = zonesHistory.length > 0 ? (totalPlayerTaps / (zonesHistory.length * ZONE_DURATION)).toFixed(1) : "0";
  const opponentTapsPerSec = zonesHistory.length > 0 ? (totalOpponentTaps / (zonesHistory.length * ZONE_DURATION)).toFixed(1) : "0";

  return (
    <div className="flex flex-col w-full text-white select-none overflow-hidden">

      {/* ── SCOREBOARD (visible during playing & zone-result) ── */}
      {(phase === "playing" || phase === "zone-result") && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50">
          {/* Player */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
              <User className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-200">You</p>
              <p className={`text-sm font-black ${playerScore > opponentScore ? "text-emerald-400" : "text-slate-300"}`}>
                {playerScore}
              </p>
            </div>
          </div>

          {/* Zone tracker */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL_ZONES }).map((_, i) => {
              const zone = zonesHistory[i];
              let cls = "bg-slate-800 border-slate-700";
              let label = "";
              if (zone) {
                if (zone.winner === "player") { cls = "bg-emerald-500/20 border-emerald-500 text-emerald-400"; label = "W"; }
                else if (zone.winner === "tie") { cls = "bg-amber-500/20 border-amber-500 text-amber-400"; label = "T"; }
                else { cls = "bg-rose-500/20 border-rose-500 text-rose-400"; label = "L"; }
              } else if (i === currentZone - 1) {
                cls = `${theme.bg} ${theme.border} ${theme.text}`;
                label = "•";
              }
              return (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <span className="text-[7px] text-slate-500 font-black uppercase">Z{i + 1}</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border ${cls}`}>
                    {label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Opponent */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs font-black text-slate-200">{opponentName}</p>
              <p className={`text-sm font-black ${opponentScore > playerScore ? "text-rose-400" : "text-slate-300"}`}>
                {opponentScore}
              </p>
            </div>
            <div className={`w-9 h-9 rounded-full overflow-hidden border ${theme.border} bg-slate-800 flex items-center justify-center`}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={opponentName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PHASE: COUNTDOWN ── */}
      {phase === "countdown" && (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
            {currentZone === 1 ? "King of the Hill" : `Zone ${currentZone} of ${TOTAL_ZONES}`}
          </p>
          <Mountain className={`w-6 h-6 ${theme.text} mb-3`} />
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
            vs {opponentName}
          </p>
        </div>
      )}

      {/* ── PHASE: PLAYING ── */}
      {phase === "playing" && (
        <div className="flex flex-col items-center px-4 py-4 flex-1">

          {/* Timer */}
          <div className={`px-4 py-1.5 rounded-full border mb-4 transition-colors ${
            timeLeft <= 3
              ? "bg-red-500/10 border-red-500/40 animate-pulse"
              : "bg-slate-800/60 border-slate-700/50"
          }`}>
            <div className="flex items-center gap-1.5">
              <Timer className={`w-3.5 h-3.5 ${timeLeft <= 3 ? "text-red-400" : "text-slate-400"}`} />
              <span className={`text-lg font-black tabular-nums ${timeLeft <= 3 ? "text-red-400" : "text-white"}`}>
                {timeLeft}s
              </span>
            </div>
          </div>

          {/* Zone hill indicator */}
          <div className="relative w-32 h-32 mb-4">
            {/* Background ring */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="8" />
              {/* Player arc (clockwise from top) */}
              <motion.circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke={theme.playerColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(displayProgress / 100) * 264} 264`}
                initial={{ strokeDasharray: "132 264" }}
                animate={{ strokeDasharray: `${(displayProgress / 100) * 264} 264` }}
                transition={{ duration: 0.1 }}
              />
              {/* Opponent arc (counter-clockwise from bottom) */}
              <motion.circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke={theme.opponentColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${((100 - displayProgress) / 100) * 264} 264`}
                strokeDashoffset={`-${(displayProgress / 100) * 264}`}
                initial={{ strokeDasharray: "132 264" }}
                animate={{
                  strokeDasharray: `${((100 - displayProgress) / 100) * 264} 264`,
                  strokeDashoffset: `-${(displayProgress / 100) * 264}`,
                }}
                transition={{ duration: 0.1 }}
              />
            </svg>
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center">
                <Mountain className={`w-7 h-7 ${theme.text}`} />
              </div>
            </div>
          </div>

          {/* Tug-of-war horizontal bar */}
          <div className="w-full max-w-xs mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">You</span>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{opponentName}</span>
            </div>
            <div className="h-4 rounded-full bg-slate-800 overflow-hidden relative border border-slate-700/50">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: `linear-gradient(90deg, ${theme.playerColor}, ${theme.playerColor}dd)` }}
                animate={{ width: `${displayProgress}%` }}
                transition={{ duration: 0.1 }}
              />
              <motion.div
                className="absolute inset-y-0 right-0 rounded-full"
                style={{ background: `linear-gradient(270deg, ${theme.opponentColor}, ${theme.opponentColor}dd)` }}
                animate={{ width: `${100 - displayProgress}%` }}
                transition={{ duration: 0.1 }}
              />
              {/* Center marker */}
              <div className="absolute inset-y-0 left-1/2 -translate-x-px w-0.5 bg-white/30 z-10" />
            </div>
          </div>

          {/* Tap counters */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-center min-w-[80px]">
              <p className="text-[7px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Your taps</p>
              <p className={`text-lg font-black tabular-nums ${theme.text}`}>{displayPlayerTaps}</p>
            </div>
            <div className="text-[10px] font-black text-slate-600 uppercase">vs</div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-center min-w-[80px]">
              <p className="text-[7px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">{opponentName}</p>
              <p className="text-lg font-black tabular-nums text-slate-300">{displayOpponentTaps}</p>
            </div>
          </div>

          {/* TAP BUTTON */}
          <motion.button
            key={tapBounce}
            onClick={handleTap}
            animate={{ scale: [1, 0.92, 1] }}
            transition={{ duration: 0.12 }}
            className={`w-full max-w-xs py-5 rounded-3xl bg-gradient-to-r ${theme.gradient} text-white font-black text-sm uppercase tracking-widest active:scale-90 transition-transform shadow-2xl flex items-center justify-center gap-2`}
          >
            <Zap className="w-5 h-5" />
            <span>TAP TO CLAIM!</span>
          </motion.button>
        </div>
      )}

      {/* ── PHASE: ZONE RESULT ── */}
      {phase === "zone-result" && (
        <div className="flex flex-col items-center px-4 py-6">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-full max-w-sm"
          >
            {/* Result icon */}
            <div className="flex justify-center mb-3">
              {zoneWinner === "player" ? (
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Trophy className="w-7 h-7" />
                </div>
              ) : zoneWinner === "tie" ? (
                <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Mountain className="w-7 h-7" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <Zap className="w-7 h-7" />
                </div>
              )}
            </div>

            <h3 className="text-lg font-black uppercase tracking-wider text-center mb-1">
              {zoneWinner === "player" ? "Hill Claimed!" : zoneWinner === "tie" ? "Contested!" : "Hill Lost!"}
            </h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider text-center mb-4">
              {zoneWinner === "player"
                ? "You dominated this zone!"
                : zoneWinner === "tie"
                ? "Even battle — no points awarded"
                : `${opponentName} held the hill!`}
            </p>

            {/* Tap comparison */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
                <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold mb-1">Your Taps</p>
                <p className={`text-xl font-black ${zoneWinner === "player" ? "text-emerald-400" : "text-slate-300"}`}>
                  {displayPlayerTaps}
                </p>
                <p className="text-[7px] text-slate-500 font-bold mt-0.5">
                  {(displayPlayerTaps / ZONE_DURATION).toFixed(1)}/sec
                </p>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
                <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold mb-1">{opponentName}</p>
                <p className={`text-xl font-black ${zoneWinner === "opponent" ? "text-rose-400" : "text-slate-300"}`}>
                  {displayOpponentTaps}
                </p>
                <p className="text-[7px] text-slate-500 font-bold mt-0.5">
                  {(displayOpponentTaps / ZONE_DURATION).toFixed(1)}/sec
                </p>
              </div>
            </div>

            <button
              onClick={handleNextZone}
              className={`w-full py-3 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-transform`}
            >
              {currentZone >= TOTAL_ZONES ? "See Final Results" : "Next Zone"}
            </button>
          </motion.div>
        </div>
      )}

      {/* ── PHASE: RESULTS ── */}
      {phase === "results" && (
        <div className="flex flex-col items-center px-4 py-5">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-full max-w-sm"
          >
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-md shadow-2xl overflow-hidden">
              <div className={`h-1.5 bg-gradient-to-r ${theme.gradient}`} />
              <div className="p-5 text-center">
                {/* Winner icon */}
                <div className={`relative w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${
                  playerWon
                    ? "bg-amber-500/10 border-2 border-amber-500/30"
                    : isTie
                    ? "bg-slate-800 border-2 border-slate-700"
                    : "bg-red-500/10 border-2 border-red-500/30"
                }`}>
                  {playerWon ? (
                    <Crown className="w-8 h-8 text-amber-400" />
                  ) : isTie ? (
                    <Mountain className="w-8 h-8 text-slate-400" />
                  ) : (
                    <span className="text-3xl">😢</span>
                  )}
                  {playerWon && (
                    <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-300 animate-pulse" />
                  )}
                </div>

                <h2 className="text-xl font-black uppercase tracking-wider mb-1">
                  {playerWon ? "King of the Hill!" : isTie ? "Contested Territory!" : "Dethroned!"}
                </h2>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-4 ${
                  playerWon ? "text-amber-400" : isTie ? "text-slate-400" : "text-red-400"
                }`}>
                  {playerWon ? "You reign supreme" : isTie ? "Neither could dominate" : `${opponentName} claimed the hill`}
                </p>

                {/* Final score */}
                <div className="flex items-center justify-center gap-2 text-lg font-black my-3">
                  <span className={playerWon ? "text-emerald-400" : "text-slate-400"}>{playerScore}</span>
                  <span className="text-slate-600">—</span>
                  <span className={!playerWon && !isTie ? "text-rose-400" : "text-slate-400"}>{opponentScore}</span>
                </div>

                {/* Zone breakdown */}
                <div className="flex items-center justify-center gap-3 mb-4">
                  {zonesHistory.map((z, i) => (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <span className="text-[7px] text-slate-500 uppercase font-black">Z{i + 1}</span>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border ${
                        z.winner === "player"
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                          : z.winner === "tie"
                          ? "bg-amber-500/20 border-amber-500 text-amber-400"
                          : "bg-rose-500/20 border-rose-500 text-rose-400"
                      }`}>
                        {z.winner === "player" ? "W" : z.winner === "tie" ? "T" : "L"}
                      </div>
                      <span className="text-[7px] text-slate-500 font-bold tabular-nums">
                        {z.playerTaps}v{z.opponentTaps}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Tap speed comparison */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4">
                  <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold mb-2">
                    Tap Speed Comparison
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className={`text-lg font-black ${playerWon ? "text-emerald-400" : "text-white"}`}>
                        {playerTapsPerSec}
                      </p>
                      <p className="text-[7px] text-slate-500 uppercase tracking-widest font-bold">
                        Your taps/sec
                      </p>
                    </div>
                    <div>
                      <p className={`text-lg font-black ${!playerWon && !isTie ? "text-rose-400" : "text-white"}`}>
                        {opponentTapsPerSec}
                      </p>
                      <p className="text-[7px] text-slate-500 uppercase tracking-widest font-bold">
                        {opponentName}'s taps/sec
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 justify-center mt-2">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span className="text-[8px] font-black text-amber-400 uppercase">
                      Total: {totalPlayerTaps} vs {totalOpponentTaps} taps
                    </span>
                  </div>
                </div>

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
