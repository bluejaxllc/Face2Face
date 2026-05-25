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

type GameState = "lobby" | "matchmaking" | "countdown" | "ready" | "trigger" | "round_result" | "complete";

export default function BumpBattle({ onBack, category = "dating" }: BumpBattleProps) {
  const theme = THEMES[category];
  const listOpponents = OPPONENTS[category];

  // Game States
  const [gameState, setGameState] = useState<GameState>("lobby");
  const [selectedOpponent, setSelectedOpponent] = useState<Opponent | null>(null);
  
  // Game stats
  const [currentRound, setCurrentRound] = useState(1);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [roundsHistory, setRoundsHistory] = useState<{ winner: "player" | "opponent" | "foul"; playerTime: number | null; opponentTime: number }[]>([]);
  
  // Reaction timers
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [opponentTime, setOpponentTime] = useState<number>(0);
  const [roundWinner, setRoundWinner] = useState<"player" | "opponent" | "foul" | null>(null);
  
  // Logic states
  const [countdown, setCountdown] = useState(3);
  const [radarScanning, setRadarScanning] = useState(true);

  // Timekeepers
  const triggerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerTimeRef = useRef<number>(0);
  const isTriggerableRef = useRef<boolean>(false);

  // Restart radar scan
  useEffect(() => {
    if (gameState === "lobby") {
      setRadarScanning(true);
      const timer = setTimeout(() => {
        setRadarScanning(false);
      }, 2500); // 2.5s scan animation
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  // Handle Matchmaking Countdown
  useEffect(() => {
    if (gameState === "countdown") {
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            // transition to game round
            setGameState("ready");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState]);

  // Handle Random Trigger Delay
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

  // Trigger Action (Tapping to Bump)
  const handleBumpTap = () => {
    if (gameState === "ready") {
      // FOUL! Tapped before trigger
      if (triggerTimeoutRef.current) clearTimeout(triggerTimeoutRef.current);
      isTriggerableRef.current = false;
      
      const opTime = Math.floor(Math.random() * 100) + (selectedOpponent?.baseReaction || 300);
      
      setRoundWinner("foul");
      setReactionTime(null);
      setOpponentTime(opTime);
      setOpponentScore(prev => prev + 1);
      setRoundsHistory(prev => [...prev, { winner: "foul", playerTime: null, opponentTime: opTime }]);
      setGameState("round_result");
      return;
    }

    if (gameState === "trigger" && isTriggerableRef.current) {
      isTriggerableRef.current = false;
      const clickTime = Date.now() - triggerTimeRef.current;
      setReactionTime(clickTime);

      // Simulate opponent speed
      const opTime = Math.floor(Math.random() * 110) + (selectedOpponent?.baseReaction || 300) - 20;
      setOpponentTime(opTime);

      let winner: "player" | "opponent";
      if (clickTime < opTime) {
        winner = "player";
        setPlayerScore(prev => prev + 1);
      } else {
        winner = "opponent";
        setOpponentScore(prev => prev + 1);
      }

      setRoundWinner(winner);
      setRoundsHistory(prev => [...prev, { winner, playerTime: clickTime, opponentTime: opTime }]);
      setGameState("round_result");
    }
  };

  // Challenge opponent
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

  // Next round navigation
  const handleNextRound = () => {
    // Check if match completed (best of 3 rounds — first to 2 points)
    if (playerScore >= 2 || opponentScore >= 2 || currentRound >= 3) {
      setGameState("complete");
    } else {
      setCurrentRound(prev => prev + 1);
      setGameState("ready");
    }
  };

  const handleReset = () => {
    setGameState("lobby");
    setSelectedOpponent(null);
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950 text-white select-none">
      
      {/* ── BACKGROUND ORNAMENTATION ── */}
      <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-[140px] opacity-15 bg-gradient-to-r ${theme.gradient}`} />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-[140px] opacity-10 bg-indigo-500" />

      {/* ── SCREEN: LOBBY ── */}
      {gameState === "lobby" && (
        <div className="absolute inset-0 flex flex-col justify-between" style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-slate-800/50 bg-slate-950/70 backdrop-blur-md z-20">
            <button onClick={onBack} className="w-9 h-9 rounded-full bg-slate-800/80 backdrop-blur-md border border-slate-700/50 flex items-center justify-center hover:bg-slate-700/80 transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-300" />
            </button>
            <div className="flex items-center gap-2">
              <Swords className={`w-4 h-4 ${theme.textAccent}`} />
              <span className={`text-sm font-black uppercase tracking-widest bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
                Bump Battle
              </span>
              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[8px] uppercase tracking-wider font-bold">BETA</span>
            </div>
            <div style={{ width: "36px" }} /> {/* Balance back button */}
          </div>

          {/* Core Radar/Sweep & Players */}
          <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col">
            {/* Radar Panel */}
            <div className="flex flex-col items-center justify-center py-6 mb-6">
              <div className="relative w-40 h-40 flex items-center justify-center">
                {/* Expanding Concentric Rings */}
                <AnimatePresence>
                  {radarScanning && [1, 2, 3].map((ring) => (
                    <motion.div
                      key={ring}
                      initial={{ scale: 0.5, opacity: 0.8 }}
                      animate={{ scale: 2.2, opacity: 0 }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        delay: ring * 0.7,
                        ease: "easeOut"
                      }}
                      className={`absolute inset-0 rounded-full border-2 ${
                        category === 'dating' ? 'border-pink-500/30' : category === 'friends' ? 'border-emerald-500/30' : 'border-blue-500/30'
                      }`}
                    />
                  ))}
                </AnimatePresence>

                {/* Radar Grid Graphic */}
                <div className={`w-36 h-36 rounded-full border border-dashed flex items-center justify-center ${
                  category === 'dating' ? 'border-pink-500/20 bg-pink-500/5' : category === 'friends' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-blue-500/20 bg-blue-500/5'
                }`}>
                  <div className={`w-20 h-20 rounded-full border border-dashed ${
                    category === 'dating' ? 'border-pink-500/10' : category === 'friends' ? 'border-emerald-500/10' : 'border-blue-500/10'
                  }`} />
                </div>

                {/* Sweeper Dial Animation */}
                {radarScanning && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 w-full h-full flex justify-center origin-center"
                  >
                    <div className={`w-0.5 h-1/2 bg-gradient-to-t from-transparent ${
                      category === 'dating' ? 'to-pink-500' : category === 'friends' ? 'to-emerald-500' : 'to-blue-500'
                    } opacity-60 shadow-lg`} />
                  </motion.div>
                )}

                {/* Target Pin Center */}
                <div className={`absolute w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                  category === 'dating' ? 'bg-pink-500 text-white' : category === 'friends' ? 'bg-emerald-500 text-slate-950' : 'bg-blue-500 text-white'
                } shadow-xl shadow-slate-950/40`}>
                  <MapPin className="w-3 h-3" />
                </div>
              </div>

              <h3 className="text-sm font-black tracking-wider uppercase mt-6 text-slate-300">
                {radarScanning ? "Radar scanning..." : "Scanning Complete"}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">
                {radarScanning ? "Searching for nearby bumpers" : "Select an opponent to battle"}
              </p>
            </div>

            {/* List Header */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Active Nearby Duels</h4>
              {!radarScanning && (
                <button 
                  onClick={() => setGameState("lobby")} // Retrigger scan
                  className={`text-[10px] font-bold ${theme.textAccent} hover:underline uppercase tracking-wide`}
                >
                  Rescan
                </button>
              )}
            </div>

            {/* Opponents Stack */}
            <div className="space-y-3 flex-1">
              <AnimatePresence>
                {!radarScanning && listOpponents.map((opp, idx) => (
                  <motion.div
                    key={opp.name}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm flex items-center gap-4 hover:border-slate-700/80 transition-colors`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${
                        category === 'dating' ? 'border-pink-500/40' : category === 'friends' ? 'border-emerald-500/40' : 'border-blue-500/40'
                      }`}>
                        <img src={opp.photo} alt={opp.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-slate-850 px-1 py-0.5 rounded-full border border-slate-700 flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5 text-amber-400" />
                        <span className="text-[8px] font-black text-slate-300">{(600 - opp.baseReaction)}</span>
                      </div>
                    </div>

                    {/* Bio info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-200 text-sm">{opp.name}</span>
                        {opp.age && <span className="text-xs text-slate-400">, {opp.age}</span>}
                        <span className="text-[9px] text-slate-500 font-bold bg-slate-800 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {opp.distance}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 truncate">{opp.description}</p>
                    </div>

                    {/* Button */}
                    <button
                      onClick={() => handleChallenge(opp)}
                      className={`px-4 py-2 rounded-xl bg-gradient-to-r ${theme.gradient} text-white font-black text-xs uppercase tracking-wider active:scale-95 transition-transform shrink-0 shadow-md`}
                    >
                      Duel
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Loader during radar scan */}
              {radarScanning && (
                <div className="py-10 text-center flex flex-col items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-amber-400 animate-spin mb-3" />
                  <p className="text-xs text-slate-500 font-medium">Fetching nearby locations...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SCREEN: MATCHMAKING ── */}
      {gameState === "matchmaking" && selectedOpponent && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-30">
          <div className="w-full max-w-sm flex flex-col items-center">
            
            {/* Pulsing Clashing VS */}
            <div className="relative mb-12 flex items-center justify-center w-28 h-28">
              <motion.div
                animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-700/60 flex items-center justify-center shadow-2xl relative z-10"
              >
                <Swords className={`w-10 h-10 ${theme.textAccent}`} />
              </motion.div>
              <div className={`absolute inset-0 rounded-full blur-[40px] opacity-40 bg-gradient-to-r ${theme.gradient}`} />
            </div>

            <h2 className="text-xl font-black text-center uppercase tracking-widest text-slate-200">
              Challenging {selectedOpponent.name}...
            </h2>
            <p className="text-xs text-slate-400 mt-2 text-center">Waiting for opponent to accept</p>

            {/* Vs Profile View */}
            <div className="flex items-center justify-between w-full max-w-xs mt-12 relative">
              
              {/* You profile */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-18 h-18 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center overflow-hidden">
                  <User className="w-10 h-10 text-slate-400" />
                </div>
                <span className="text-xs font-black text-slate-300">You</span>
              </div>

              {/* Crossed laser line connector */}
              <div className="flex-1 h-0.5 bg-gradient-to-r from-slate-700 via-rose-500/50 to-slate-700 mx-2" />

              {/* Opponent profile */}
              <div className="flex flex-col items-center gap-2">
                <div className={`w-18 h-18 rounded-full overflow-hidden border-2 ${
                  category === 'dating' ? 'border-pink-500' : category === 'friends' ? 'border-emerald-500' : 'border-blue-500'
                }`}>
                  <img src={selectedOpponent.photo} alt={selectedOpponent.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-black text-slate-300">{selectedOpponent.name}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── SCREEN: COUNTDOWN ── */}
      {gameState === "countdown" && selectedOpponent && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-30">
          <div className="text-center">
            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Duel Starting</p>
            <AnimatePresence mode="popLayout">
              <motion.h1
                key={countdown}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                exit={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 0.6 }}
                className={`text-8xl font-black ${
                  countdown === 1 ? 'text-rose-500' : countdown === 2 ? 'text-amber-500' : 'text-emerald-500'
                }`}
              >
                {countdown}
              </motion.h1>
            </AnimatePresence>
            <h3 className="text-sm font-black text-slate-200 mt-12 uppercase tracking-widest">{selectedOpponent.name} Accepted!</h3>
          </div>
        </div>
      )}

      {/* ── SCREEN: READY (Waiting for Flashing Bump) ── */}
      {gameState === "ready" && selectedOpponent && (
        <div 
          onClick={handleBumpTap} 
          className="absolute inset-0 flex flex-col justify-between items-center bg-slate-950 z-30 cursor-pointer"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {/* Top Status */}
          <div className="w-full px-6 py-4 flex items-center justify-between border-b border-white/5">
            <span className="text-xs font-black tracking-widest uppercase text-slate-500">
              Round {currentRound} / 3
            </span>
            <div className="flex gap-2 text-sm font-black">
              <span className="text-slate-300">YOU {playerScore}</span>
              <span className="text-slate-500">—</span>
              <span className="text-slate-300">{opponentScore} {selectedOpponent.name.toUpperCase()}</span>
            </div>
          </div>

          {/* Centered Instructions */}
          <div className="flex flex-col items-center py-10">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 rounded-full border-4 border-amber-500/20 bg-slate-900 flex items-center justify-center mb-6"
            >
              <Timer className="w-8 h-8 text-amber-500 animate-pulse" />
            </motion.div>
            <h1 className="text-4xl font-black uppercase tracking-wider text-amber-500 text-center animate-pulse">
              GET READY...
            </h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-4 max-w-xs text-center leading-relaxed">
              Wait for the screen to FLASH, then BUMP (tap anywhere) as fast as possible.
            </p>
            <p className="text-[10px] text-red-500 font-bold uppercase tracking-wide mt-2">
              ⚠️ Tapping early counts as a FOUL
            </p>
          </div>

          {/* Footer dummy indicator */}
          <div className="w-full pb-10 flex justify-center">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Tap Screen to Strike</span>
          </div>
        </div>
      )}

      {/* ── SCREEN: TRIGGER (The flashing target) ── */}
      {gameState === "trigger" && selectedOpponent && (
        <div 
          onClick={handleBumpTap} 
          className={`absolute inset-0 flex flex-col justify-between items-center z-30 cursor-pointer bg-gradient-to-b ${
            category === 'dating' ? 'from-pink-500 to-rose-600' : category === 'friends' ? 'from-emerald-500 to-teal-600' : 'from-blue-500 to-indigo-600'
          }`}
          style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {/* Dummy top */}
          <div className="w-full px-6 py-4 flex items-center justify-between text-white/60">
            <span className="text-xs font-black tracking-widest uppercase">Round {currentRound} / 3</span>
            <span className="text-xs font-black tracking-widest uppercase">Action Phase</span>
          </div>

          {/* Big Trigger visual */}
          <div className="flex flex-col items-center">
            {/* Concentric rings scaling */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              {[1, 2].map(r => (
                <motion.div
                  key={r}
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 2.0, opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: r * 0.4 }}
                  className="absolute inset-0 rounded-full border-4 border-white/50"
                />
              ))}
              <div className="w-32 h-32 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-2xl">
                <Swords className="w-14 h-14" />
              </div>
            </div>
            
            <h1 className="text-6xl font-black uppercase tracking-wider text-white text-center mt-10 drop-shadow-lg">
              BUMP NOW!
            </h1>
          </div>

          {/* Footer instruction */}
          <div className="pb-10">
            <span className="px-4 py-1.5 rounded-full bg-white/20 text-white font-black text-xs uppercase tracking-widest">
              TAP SCREEN
            </span>
          </div>
        </div>
      )}

      {/* ── SCREEN: ROUND RESULT ── */}
      {gameState === "round_result" && selectedOpponent && (
        <div className="absolute inset-0 flex flex-col justify-between p-6 z-30" style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          {/* Dummy spacer */}
          <div style={{ height: "44px" }} />

          {/* Core Round Result Card */}
          <div className="w-full max-w-sm mx-auto">
            <div className={`rounded-3xl border border-white/10 shadow-2xl p-8 text-center bg-gradient-to-br ${theme.cardGrad}`}>
              
              {/* Icon Result */}
              <div className="mb-4">
                {roundWinner === "player" ? (
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                    <Trophy className="w-8 h-8" />
                  </div>
                ) : roundWinner === "foul" ? (
                  <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-400 animate-bounce">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
                    <Zap className="w-8 h-8" />
                  </div>
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-black uppercase tracking-wider mb-2">
                {roundWinner === "player" ? "Round Secured!" : roundWinner === "foul" ? "FOUL!" : "Round Defeated!"}
              </h2>
              <p className="text-xs text-slate-400 mb-6 uppercase tracking-wider">
                {roundWinner === "player"
                  ? "You reacted faster than the opponent!"
                  : roundWinner === "foul"
                  ? "You tapped before the BUMP trigger!"
                  : `${selectedOpponent.name} reacted faster!`}
              </p>

              {/* Reaction times side-by-side */}
              <div className="grid grid-cols-2 gap-4 border-t border-b border-white/10 py-6 mb-6">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Your Speed</p>
                  <p className={`text-2xl font-black mt-1 ${roundWinner === 'player' ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {roundWinner === "foul" ? "FOUL" : reactionTime ? `${reactionTime}ms` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{selectedOpponent.name}'s Speed</p>
                  <p className={`text-2xl font-black mt-1 ${roundWinner === 'opponent' ? 'text-rose-400' : 'text-slate-300'}`}>
                    {opponentTime}ms
                  </p>
                </div>
              </div>

              {/* Continue Round */}
              <button
                onClick={handleNextRound}
                className={`w-full py-3.5 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-black text-sm uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2`}
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          </div>

          {/* Footer rounds tracker */}
          <div className="w-full flex justify-center pb-6">
            <div className="flex gap-4">
              {roundsHistory.map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[9px] text-slate-500 uppercase font-black">R{i+1}</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border ${
                    h.winner === "player" ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" :
                    h.winner === "foul" ? "bg-red-500/20 border-red-500 text-red-400" :
                    "bg-rose-500/20 border-rose-500 text-rose-400"
                  }`}>
                    {h.winner === "player" ? "W" : h.winner === "foul" ? "F" : "L"}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ── SCREEN: COMPLETE (Post Match Rewards) ── */}
      {gameState === "complete" && selectedOpponent && (
        <div className="absolute inset-0 flex flex-col justify-between p-6 z-30" style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          {/* Spacer */}
          <div style={{ height: "44px" }} />

          {/* Core Complete Card */}
          <div className="w-full max-w-sm mx-auto">
            <div className={`rounded-3xl border border-white/10 shadow-2xl p-8 text-center bg-gradient-to-br ${theme.cardGrad}`}>
              
              {/* Winner Status Banner */}
              <div className="mb-4">
                {playerScore > opponentScore ? (
                  <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 relative">
                    <Trophy className="w-10 h-10" />
                    <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-amber-300 animate-pulse" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mx-auto text-slate-400">
                    <Award className="w-10 h-10" />
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-black uppercase tracking-wider mb-2">
                {playerScore > opponentScore ? "Match Won!" : "Match Defeated!"}
              </h2>
              
              {/* Score breakdown */}
              <div className="flex items-center justify-center gap-3 text-lg font-black mt-2 mb-4">
                <span className={playerScore > opponentScore ? 'text-emerald-400' : 'text-slate-400'}>{playerScore} Wins</span>
                <span className="text-slate-650">—</span>
                <span className={opponentScore > playerScore ? 'text-rose-400' : 'text-slate-400'}>{opponentScore} Wins</span>
              </div>

              {/* Mode Specific Description */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {playerScore > opponentScore ? theme.rewardDesc : `Better luck next time! You can challenge ${selectedOpponent.name} again for another duel.`}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {playerScore > opponentScore && (
                  <button
                    onClick={() => {
                      alert(`${category === "dating" ? "Opening conversation with " : category === "friends" ? "Adding friend " : "Exchanging vCard with "} ${selectedOpponent.name}!`);
                      handleReset();
                    }}
                    className={`w-full py-4 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-black text-sm uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{theme.ctaText}</span>
                  </button>
                )}
                
                <button
                  onClick={handleReset}
                  className="w-full py-3 rounded-2xl bg-slate-800/80 border border-slate-700/50 text-slate-200 text-sm font-bold active:scale-95 transition-all hover:bg-slate-700/80"
                >
                  Battle Someone Else
                </button>
                
                <button
                  onClick={onBack}
                  className="w-full py-2.5 rounded-xl border border-white/10 text-slate-400 text-xs font-bold active:scale-95 transition-all hover:bg-white/5"
                >
                  Exit to Games
                </button>
              </div>

            </div>
          </div>

          {/* Bottom spacers */}
          <div style={{ height: "44px" }} />
        </div>
      )}

    </div>
  );
}
