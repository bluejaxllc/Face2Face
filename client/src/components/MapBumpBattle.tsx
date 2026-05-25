import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Zap, Trophy, ShieldAlert, Timer, RefreshCcw, User, Sparkles, Award } from "lucide-react";

/* ────────────────────────────────────────────────────────────────
   MapBumpBattle — Compact reflex-speed duel for the map overlay
   Best of 3 rounds. No header/back — parent bottom sheet handles that.
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
    ring: "ring-pink-500/40",
    accent: "pink",
  },
  friends: {
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    ring: "ring-emerald-500/40",
    accent: "emerald",
  },
  business: {
    gradient: "from-blue-500 via-indigo-500 to-purple-500",
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    ring: "ring-blue-500/40",
    accent: "blue",
  },
} as const;

const TOTAL_ROUNDS = 3;

type Phase = "countdown" | "ready" | "flash" | "round-result" | "match-result";

export default function MapBumpBattle({ opponent, category, onComplete, onBack }: MapGameChildProps) {
  const theme = THEMES[category];
  const opponentName = opponent.firstName;

  // ── Game state ──
  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [currentRound, setCurrentRound] = useState(1);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [roundsHistory, setRoundsHistory] = useState<
    { winner: "player" | "opponent" | "foul"; playerTime: number | null; opponentTime: number }[]
  >([]);

  // ── Current round results ──
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [opponentTime, setOpponentTime] = useState(0);
  const [roundWinner, setRoundWinner] = useState<"player" | "opponent" | "foul" | null>(null);

  // ── Refs for timers (avoid stale closures) ──
  const triggerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerTimeRef = useRef<number>(0);
  const isTriggerableRef = useRef(false);
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ── Generate opponent reaction time (200-500ms) ──
  const genOpponentTime = useCallback(() => {
    return Math.floor(Math.random() * 300) + 200;
  }, []);

  // ── Countdown effect ──
  useEffect(() => {
    if (phase === "countdown") {
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setPhase("ready");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // ── Ready → Flash delay (1.5-4s) ──
  useEffect(() => {
    if (phase === "ready") {
      isTriggerableRef.current = false;
      const delay = 1500 + Math.random() * 2500;

      triggerTimeoutRef.current = setTimeout(() => {
        setPhase("flash");
        triggerTimeRef.current = Date.now();
        isTriggerableRef.current = true;
      }, delay);

      return () => {
        if (triggerTimeoutRef.current) clearTimeout(triggerTimeoutRef.current);
      };
    }
  }, [phase]);

  // ── Handle tap ──
  const handleBumpTap = useCallback(() => {
    if (phaseRef.current === "ready") {
      // FOUL — tapped too early
      if (triggerTimeoutRef.current) clearTimeout(triggerTimeoutRef.current);
      isTriggerableRef.current = false;

      const opTime = genOpponentTime();
      setRoundWinner("foul");
      setReactionTime(null);
      setOpponentTime(opTime);
      setOpponentScore((s) => s + 1);
      setRoundsHistory((h) => [...h, { winner: "foul", playerTime: null, opponentTime: opTime }]);
      setPhase("round-result");
      return;
    }

    if (phaseRef.current === "flash" && isTriggerableRef.current) {
      isTriggerableRef.current = false;
      const clickTime = Date.now() - triggerTimeRef.current;
      setReactionTime(clickTime);

      const opTime = genOpponentTime();
      setOpponentTime(opTime);

      const winner: "player" | "opponent" = clickTime < opTime ? "player" : "opponent";
      if (winner === "player") setPlayerScore((s) => s + 1);
      else setOpponentScore((s) => s + 1);

      setRoundWinner(winner);
      setRoundsHistory((h) => [...h, { winner, playerTime: clickTime, opponentTime: opTime }]);
      setPhase("round-result");
    }
  }, [genOpponentTime]);

  // ── Next round / match end ──
  const handleNextRound = useCallback(() => {
    if (playerScore + (roundWinner === "player" ? 0 : 0) >= 2 ||
        opponentScore + (roundWinner === "opponent" || roundWinner === "foul" ? 0 : 0) >= 2 ||
        currentRound >= TOTAL_ROUNDS) {
      // Check actual accumulated scores (state already updated)
      setPhase("match-result");
    } else {
      setCurrentRound((r) => r + 1);
      setRoundWinner(null);
      setReactionTime(null);
      setPhase("countdown");
    }
  }, [playerScore, opponentScore, currentRound, roundWinner]);

  // ── Restart ──
  const handlePlayAgain = useCallback(() => {
    setPhase("countdown");
    setCurrentRound(1);
    setPlayerScore(0);
    setOpponentScore(0);
    setRoundsHistory([]);
    setRoundWinner(null);
    setReactionTime(null);
  }, []);

  const playerWon = playerScore > opponentScore;

  // Avatar fallback
  const avatarUrl = opponent.profilePhoto || undefined;

  return (
    <div className="flex flex-col w-full text-white select-none overflow-hidden">

      {/* ── VS HEADER (always visible except countdown) ── */}
      {phase !== "countdown" && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50">
          {/* Player */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
              <User className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-200">You</p>
              <p className={`text-sm font-black ${playerScore > opponentScore ? 'text-emerald-400' : 'text-slate-300'}`}>{playerScore}</p>
            </div>
          </div>

          {/* Round tracker */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
              const round = roundsHistory[i];
              let cls = "bg-slate-800 border-slate-700";
              let label = "";
              if (round) {
                if (round.winner === "player") { cls = "bg-emerald-500/20 border-emerald-500 text-emerald-400"; label = "W"; }
                else if (round.winner === "foul") { cls = "bg-red-500/20 border-red-500 text-red-400"; label = "F"; }
                else { cls = "bg-rose-500/20 border-rose-500 text-rose-400"; label = "L"; }
              } else if (i === currentRound - 1) {
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

          {/* Opponent */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs font-black text-slate-200">{opponentName}</p>
              <p className={`text-sm font-black ${opponentScore > playerScore ? 'text-rose-400' : 'text-slate-300'}`}>{opponentScore}</p>
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
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
            {currentRound === 1 ? "Duel Starting" : `Round ${currentRound}`}
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
            vs {opponentName}
          </p>
        </div>
      )}

      {/* ── PHASE: READY ── */}
      {phase === "ready" && (
        <div
          onClick={handleBumpTap}
          className="flex flex-col items-center justify-center py-12 cursor-pointer"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 rounded-full border-4 border-amber-500/20 bg-slate-900 flex items-center justify-center mb-5"
          >
            <Timer className="w-7 h-7 text-amber-500 animate-pulse" />
          </motion.div>
          <h2 className="text-2xl font-black uppercase tracking-wider text-amber-500 animate-pulse text-center">
            WAIT FOR IT...
          </h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-3 text-center max-w-[240px] leading-relaxed">
            Tap as soon as the screen flashes. Tap early = FOUL!
          </p>
          <p className="text-[9px] text-red-500/70 font-bold uppercase tracking-wide mt-2">
            ⚠️ Don't tap yet
          </p>
        </div>
      )}

      {/* ── PHASE: FLASH ── */}
      {phase === "flash" && (
        <div
          onClick={handleBumpTap}
          className={`flex flex-col items-center justify-center py-10 cursor-pointer rounded-2xl mx-3 my-2 bg-gradient-to-b ${
            category === "dating"
              ? "from-pink-500 to-rose-600"
              : category === "friends"
              ? "from-emerald-500 to-teal-600"
              : "from-blue-500 to-indigo-600"
          }`}
        >
          {/* Pulsing rings */}
          <div className="relative w-28 h-28 flex items-center justify-center mb-4">
            {[1, 2].map((r) => (
              <motion.div
                key={r}
                initial={{ scale: 0.8, opacity: 0.8 }}
                animate={{ scale: 2.0, opacity: 0 }}
                transition={{ duration: 1.0, repeat: Infinity, delay: r * 0.35 }}
                className="absolute inset-0 rounded-full border-4 border-white/50"
              />
            ))}
            <div className="w-20 h-20 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-2xl">
              <Swords className="w-10 h-10" />
            </div>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-wider text-white drop-shadow-lg">
            BUMP NOW!
          </h1>
          <span className="mt-3 px-3 py-1 rounded-full bg-white/20 text-white font-black text-[10px] uppercase tracking-widest">
            TAP SCREEN
          </span>
        </div>
      )}

      {/* ── PHASE: ROUND RESULT ── */}
      {phase === "round-result" && (
        <div className="flex flex-col items-center px-4 py-6">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-full max-w-sm"
          >
            {/* Result icon */}
            <div className="flex justify-center mb-3">
              {roundWinner === "player" ? (
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Trophy className="w-7 h-7" />
                </div>
              ) : roundWinner === "foul" ? (
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                  className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400"
                >
                  <ShieldAlert className="w-7 h-7" />
                </motion.div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <Zap className="w-7 h-7" />
                </div>
              )}
            </div>

            <h3 className="text-lg font-black uppercase tracking-wider text-center mb-1">
              {roundWinner === "player" ? "Round Won!" : roundWinner === "foul" ? "FOUL!" : "Round Lost!"}
            </h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider text-center mb-4">
              {roundWinner === "player"
                ? "You reacted faster!"
                : roundWinner === "foul"
                ? "You tapped before the trigger!"
                : `${opponentName} was faster!`}
            </p>

            {/* Reaction times */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
                <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold mb-1">Your Speed</p>
                <p className={`text-xl font-black ${roundWinner === "player" ? "text-emerald-400" : "text-slate-300"}`}>
                  {roundWinner === "foul" ? "FOUL" : reactionTime ? `${reactionTime}ms` : "—"}
                </p>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
                <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold mb-1">{opponentName}</p>
                <p className={`text-xl font-black ${roundWinner === "opponent" ? "text-rose-400" : "text-slate-300"}`}>
                  {opponentTime}ms
                </p>
              </div>
            </div>

            <button
              onClick={handleNextRound}
              className={`w-full py-3 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-transform`}
            >
              {currentRound >= TOTAL_ROUNDS || playerScore >= 2 || opponentScore >= 2
                ? "See Final Results"
                : "Next Round"}
            </button>
          </motion.div>
        </div>
      )}

      {/* ── PHASE: MATCH RESULT ── */}
      {phase === "match-result" && (
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
                {/* Winner icon */}
                <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${
                  playerWon
                    ? "bg-amber-500/10 border-2 border-amber-500/30"
                    : "bg-slate-800 border-2 border-slate-700"
                }`}>
                  {playerWon ? (
                    <Trophy className="w-8 h-8 text-amber-400" />
                  ) : (
                    <Award className="w-8 h-8 text-slate-400" />
                  )}
                  {playerWon && (
                    <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-300 animate-pulse" />
                  )}
                </div>

                <h2 className="text-xl font-black uppercase tracking-wider mb-1">
                  {playerWon ? "Match Won!" : "Match Defeated!"}
                </h2>

                {/* Score */}
                <div className="flex items-center justify-center gap-2 text-lg font-black my-3">
                  <span className={playerWon ? "text-emerald-400" : "text-slate-400"}>{playerScore}</span>
                  <span className="text-slate-600">—</span>
                  <span className={!playerWon ? "text-rose-400" : "text-slate-400"}>{opponentScore}</span>
                </div>

                {/* Round breakdown */}
                <div className="flex items-center justify-center gap-3 mb-4">
                  {roundsHistory.map((h, i) => (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <span className="text-[7px] text-slate-500 uppercase font-black">R{i + 1}</span>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border ${
                        h.winner === "player"
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                          : h.winner === "foul"
                          ? "bg-red-500/20 border-red-500 text-red-400"
                          : "bg-rose-500/20 border-rose-500 text-rose-400"
                      }`}>
                        {h.winner === "player" ? "W" : h.winner === "foul" ? "F" : "L"}
                      </div>
                      <span className="text-[7px] text-slate-500 font-bold tabular-nums">
                        {h.playerTime ? `${h.playerTime}ms` : "FOUL"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Average reaction */}
                {roundsHistory.some((h) => h.playerTime !== null) && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4">
                    <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold mb-1">
                      Your Avg. Reaction
                    </p>
                    <p className="text-lg font-black text-white">
                      {Math.round(
                        roundsHistory
                          .filter((h) => h.playerTime !== null)
                          .reduce((sum, h) => sum + (h.playerTime || 0), 0) /
                          roundsHistory.filter((h) => h.playerTime !== null).length
                      )}
                      ms
                    </p>
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
