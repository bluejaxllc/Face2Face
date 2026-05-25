import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Target, Timer, Zap, Shield, ChevronLeft, MapPin, Sparkles, MessageSquare, AlertTriangle, Play, HelpCircle, Trophy } from "lucide-react";

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

type GameState = "lobby" | "countdown" | "chase" | "success" | "fail";

export default function ProximityTag({ onBack, category = "dating" }: ProximityTagProps) {
  const theme = THEMES[category];
  const listTargets = TARGETS[category];

  // Game States
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

  // Timekeeper refs
  const chaseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetMotionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Radar sweep animation on lobby mount
  useEffect(() => {
    if (gameState === "lobby") {
      setRadarScanning(true);
      const timer = setTimeout(() => {
        setRadarScanning(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  // Countdown timer
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

  // Cooldown timers ticks
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

  // Log message helper
  const addLog = (msg: string) => {
    setEventLog(prev => [msg, ...prev.slice(0, 15)]);
  };

  // Simulated evasion movements by the target
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
      // Keep angle between 0-359
      const nextAngle = (a + angleChange + 360) % 360;
      return nextAngle;
    });

  }, [selectedTarget]);

  // Chase timer and loop
  useEffect(() => {
    if (gameState === "chase" && selectedTarget) {
      setTimeLeft(40);
      setEventLog(["Chase started! Follow the radar compass."]);

      // Clock countdown
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

      // Target motion loop
      targetMotionTimerRef.current = setInterval(() => {
        handleTargetEvasion();
      }, 2000); // Target acts every 2 seconds

      return () => {
        if (chaseTimerRef.current) clearInterval(chaseTimerRef.current);
        if (targetMotionTimerRef.current) clearInterval(targetMotionTimerRef.current);
      };
    }
  }, [gameState, selectedTarget, handleTargetEvasion]);

  // Walk Closer Action
  const handleWalkCloser = () => {
    if (gameState !== "chase") return;
    
    // Close distance by random 1.2 to 2.4 meters
    const steps = 1.2 + Math.random() * 1.2;
    setDistance(d => {
      const nextD = Math.max(0.5, d - steps);
      return Math.round(nextD * 10) / 10;
    });

    // Random slight compass adjust as you move closer
    setCompassAngle(a => {
      const dev = Math.floor(Math.random() * 16) - 8; // -8 to +8
      return (a + dev + 360) % 360;
    });

    addLog(`You advanced closer (-${steps.toFixed(1)}m)`);
  };

  // Speed Boost Powerup
  const handleSpeedBoost = () => {
    if (gameState !== "chase" || speedBoostCd > 0) return;
    
    // Closes 6m instantly
    setDistance(d => {
      const nextD = Math.max(0.5, d - 6);
      return Math.round(nextD * 10) / 10;
    });
    setSpeedBoostCd(12); // 12s cooldown
    addLog("⚡ SPEED BOOST! Closed distance rapidly (-6m)");
  };

  // Radar Sync Powerup
  const handleRadarPing = () => {
    if (gameState !== "chase" || radarPingCd > 0) return;
    
    // Aligns compass direction directly towards target (angle 0 is straight ahead)
    setCompassAngle(0);
    setRadarPingCd(8); // 8s cooldown
    addLog("📡 RADAR SYNCED: Target direction locked to 0°");
  };

  // Challenge / Chase select target
  const handleSelectTarget = (target: TargetUser) => {
    setSelectedTarget(target);
    setDistance(target.baseDistance);
    setCompassAngle(Math.floor(Math.random() * 180) + 90); // Start off-center
    setGameState("countdown");
  };

  // Final Tag Action
  const handleTagTarget = () => {
    if (distance <= 3.0) {
      if (chaseTimerRef.current) clearInterval(chaseTimerRef.current);
      if (targetMotionTimerRef.current) clearInterval(targetMotionTimerRef.current);
      setGameState("success");
    }
  };

  const handleReset = () => {
    setGameState("lobby");
    setSelectedTarget(null);
  };

  // Get signal quality classification
  const getSignalStrength = () => {
    if (distance > 22) return { label: "Cold Signal", color: "text-blue-400 animate-pulse", bg: "bg-blue-500/10", border: "border-blue-500/20" };
    if (distance > 8) return { label: "Warm Signal", color: "text-amber-400 animate-pulse", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    return { label: "HOT SIGNAL!", color: "text-rose-500 font-extrabold animate-bounce", bg: "bg-rose-500/20", border: "border-rose-500/40" };
  };

  const signal = getSignalStrength();

  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950 text-white select-none">
      
      {/* Background radial effects */}
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
              <Target className={`w-4 h-4 ${theme.textAccent}`} />
              <span className={`text-sm font-black uppercase tracking-widest bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
                Proximity Tag
              </span>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[8px] uppercase tracking-wider font-bold">BETA</span>
            </div>
            <div style={{ width: "36px" }} />
          </div>

          {/* Radar Scanner Visual */}
          <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col">
            <div className="flex flex-col items-center justify-center py-6 mb-6">
              <div className="relative w-40 h-40 flex items-center justify-center">
                {/* Concentric rings */}
                <AnimatePresence>
                  {radarScanning && [1, 2, 3].map((ring) => (
                    <motion.div
                      key={ring}
                      initial={{ scale: 0.5, opacity: 0.8 }}
                      animate={{ scale: 2.2, opacity: 0 }}
                      transition={{ duration: 2.2, repeat: Infinity, delay: ring * 0.7, ease: "easeOut" }}
                      className={`absolute inset-0 rounded-full border-2 ${
                        category === 'dating' ? 'border-pink-500/30' : category === 'friends' ? 'border-emerald-500/30' : 'border-blue-500/30'
                      }`}
                    />
                  ))}
                </AnimatePresence>

                {/* Radar target board */}
                <div className={`w-36 h-36 rounded-full border border-dashed flex items-center justify-center ${
                  category === 'dating' ? 'border-pink-500/20 bg-pink-500/5' : category === 'friends' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-blue-500/20 bg-blue-500/5'
                }`}>
                  <Compass className={`w-12 h-12 opacity-30 ${theme.textAccent}`} />
                </div>

                {/* Sweeper animation */}
                {radarScanning && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 w-full h-full flex justify-center origin-center"
                  >
                    <div className={`w-0.5 h-1/2 bg-gradient-to-t from-transparent ${
                      category === 'dating' ? 'to-pink-500' : category === 'friends' ? 'to-emerald-500' : 'to-blue-500'
                    } opacity-60 shadow-lg`} />
                  </motion.div>
                )}

                {/* Center pin */}
                <div className={`absolute w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                  category === 'dating' ? 'bg-pink-500 text-white' : category === 'friends' ? 'bg-emerald-500 text-slate-950' : 'bg-blue-500 text-white'
                } shadow-xl`}>
                  <Target className="w-3.5 h-3.5" />
                </div>
              </div>

              <h3 className="text-sm font-black tracking-wider uppercase mt-6 text-slate-200">
                {radarScanning ? "Locating targets..." : "GPS Connections Established"}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">
                {radarScanning ? "Scanning nearby area" : "Choose a target to tag"}
              </p>
            </div>

            {/* Target selection stack */}
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Nearby Targets</h4>
              {!radarScanning && (
                <button onClick={() => setGameState("lobby")} className={`text-[10px] font-bold ${theme.textAccent} uppercase tracking-wide`}>
                  Rescan
                </button>
              )}
            </div>

            <div className="space-y-3 flex-1">
              <AnimatePresence>
                {!radarScanning && listTargets.map((target, idx) => (
                  <motion.div
                    key={target.name}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm flex items-center gap-4 hover:border-slate-700/80 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${
                        category === 'dating' ? 'border-pink-500/40' : category === 'friends' ? 'border-emerald-500/40' : 'border-blue-500/40'
                      }`}>
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
                        <span className="text-[9px] text-slate-500 font-bold bg-slate-800 px-2 py-0.5 rounded-full">
                          📍 {target.baseDistance}m away
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          target.speed === 'Normal' ? 'bg-blue-500/10 text-blue-400' :
                          target.speed === 'Fast' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-rose-500/10 text-rose-400'
                        }`}>
                          🏃 {target.speed}
                        </span>
                      </div>
                    </div>

                    {/* Challenge Hunt action */}
                    <button
                      onClick={() => handleSelectTarget(target)}
                      className={`px-4 py-2.5 rounded-xl bg-gradient-to-r ${theme.gradient} text-white font-black text-xs uppercase tracking-wider active:scale-95 transition-transform shrink-0 shadow-md`}
                    >
                      Hunt
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {radarScanning && (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-blue-400 animate-spin mb-3" />
                  <p className="text-xs text-slate-500 font-medium">Acquiring GPS data...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SCREEN: COUNTDOWN ── */}
      {gameState === "countdown" && selectedTarget && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-30">
          <div className="text-center">
            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Acquiring Target lock</p>
            <AnimatePresence mode="popLayout">
              <motion.h1
                key={countdown}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                exit={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 0.6 }}
                className={`text-8xl font-black text-blue-400`}
              >
                {countdown}
              </motion.h1>
            </AnimatePresence>
            <h3 className="text-sm font-black text-slate-200 mt-12 uppercase tracking-widest">Tracking {selectedTarget.name}...</h3>
          </div>
        </div>
      )}

      {/* ── SCREEN: ACTIVE CHASE (Reflex tracker compass) ── */}
      {gameState === "chase" && selectedTarget && (
        <div className="absolute inset-0 flex flex-col justify-between" style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          {/* Header Stats bar */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-slate-950/70 backdrop-blur-md z-20">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-slate-400" />
              <span className={`font-black text-sm ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-slate-200'}`}>
                {timeLeft}s remaining
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${
                distance > 22 ? 'bg-blue-500' : distance > 8 ? 'bg-amber-500' : 'bg-red-500 animate-ping'
              }`} />
              <span className="text-xs font-black text-slate-300 uppercase tracking-widest">{selectedTarget.name}</span>
            </div>
          </div>

          {/* Compass Radar Core */}
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            
            {/* Holographic Compass Radar */}
            <div className="relative w-52 h-52 flex items-center justify-center mb-6">
              {/* Outer calibration dial */}
              <div className="absolute inset-0 rounded-full border-2 border-slate-800 flex items-center justify-center">
                <div className="absolute top-1 text-[8px] font-black text-slate-500">N</div>
                <div className="absolute right-1 text-[8px] font-black text-slate-500">E</div>
                <div className="absolute bottom-1 text-[8px] font-black text-slate-500">S</div>
                <div className="absolute left-1 text-[8px] font-black text-slate-500">W</div>
              </div>

              {/* Inner radar ping circles */}
              <div className="absolute w-40 h-40 rounded-full border border-slate-900 flex items-center justify-center">
                <div className="absolute w-24 h-24 rounded-full border border-slate-900/50" />
              </div>

              {/* Rotating Compass Needle container */}
              <motion.div
                animate={{ rotate: compassAngle }}
                transition={{ type: "spring", stiffness: 90, damping: 15 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {/* Arrow Pointer */}
                <div className="relative w-10 h-32 flex justify-center -translate-y-[2px]">
                  <div className={`w-0.5 h-1/2 bg-gradient-to-t from-transparent ${
                    category === 'dating' ? 'to-pink-500' : category === 'friends' ? 'to-emerald-500' : 'to-blue-500'
                  }`} />
                  {/* Glowing Arrow head */}
                  <div className={`absolute top-0 w-3 h-3 rotate-45 border-t-2 border-l-2 ${
                    category === 'dating' ? 'border-pink-500' : category === 'friends' ? 'border-emerald-500' : 'border-blue-500'
                  } shadow-lg`} />
                </div>
              </motion.div>

              {/* Center distance HUD display */}
              <div className="absolute w-24 h-24 rounded-full bg-slate-950 border border-slate-800/80 shadow-2xl flex flex-col items-center justify-center z-10">
                <span className="text-2xl font-black text-white tracking-tight">{distance}m</span>
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">Distance</span>
              </div>
            </div>

            {/* Signal strength message */}
            <div className={`px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-wider ${signal.bg} ${signal.border} ${signal.color}`}>
              {signal.label}
            </div>

          </div>

          {/* Action Log / Subtitle */}
          <div className="px-6 py-2 bg-slate-950/40 max-h-[70px] overflow-hidden select-none border-t border-b border-white/5">
            <div className="text-slate-400 text-xs font-semibold text-center italic truncate">
              {eventLog[0] || "Compass stabilized..."}
            </div>
            {eventLog[1] && (
              <div className="text-slate-650 text-[10px] font-medium text-center truncate">
                {eventLog[1]}
              </div>
            )}
          </div>

          {/* Interactive buttons */}
          <div className="p-6 bg-slate-950 flex flex-col gap-4">
            
            {/* Primary tag trigger / Walk closer */}
            {distance <= 3.0 ? (
              <motion.button
                onClick={handleTagTarget}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className={`w-full py-4 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-2`}
              >
                <Target className="w-5 h-5 animate-pulse" />
                <span>Tag {selectedTarget.name.toUpperCase()}!</span>
              </motion.button>
            ) : (
              <button
                onClick={handleWalkCloser}
                className={`w-full py-4 rounded-2xl bg-gradient-to-r ${theme.actionBtnGrad} text-white font-black text-sm uppercase tracking-widest active:scale-[0.97] transition-all shadow-md`}
              >
                Close In Distance
              </button>
            )}

            {/* Auxiliary Powerups */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSpeedBoost}
                disabled={speedBoostCd > 0 || distance <= 3.0}
                className={`py-3.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                  speedBoostCd > 0 || distance <= 3.0
                    ? 'border-slate-800/40 text-slate-600 bg-slate-900/10 cursor-not-allowed'
                    : 'border-amber-500/30 bg-amber-500/5 text-amber-400 active:scale-95'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-wider">Speed Boost</span>
                </div>
                <span className="text-[8px] text-slate-500 uppercase tracking-widest mt-0.5">
                  {speedBoostCd > 0 ? `${speedBoostCd}s remaining` : "-6m instantly"}
                </span>
              </button>

              <button
                onClick={handleRadarPing}
                disabled={radarPingCd > 0 || distance <= 3.0}
                className={`py-3.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                  radarPingCd > 0 || distance <= 3.0
                    ? 'border-slate-800/40 text-slate-600 bg-slate-900/10 cursor-not-allowed'
                    : 'border-blue-500/30 bg-blue-500/5 text-blue-400 active:scale-95'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-wider">Radar Sync</span>
                </div>
                <span className="text-[8px] text-slate-500 uppercase tracking-widest mt-0.5">
                  {radarPingCd > 0 ? `${radarPingCd}s remaining` : "Lock 0° angle"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SCREEN: SUCCESS (Tag secured) ── */}
      {gameState === "success" && selectedTarget && (
        <div className="absolute inset-0 flex flex-col justify-between p-6 z-30 animate-fade-in" style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          <div style={{ height: "44px" }} />

          <div className="w-full max-w-sm mx-auto">
            <div className={`rounded-3xl border border-white/10 shadow-2xl p-8 text-center bg-gradient-to-br ${theme.cardGrad}`}>
              
              <div className="mb-4">
                <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 relative">
                  <Trophy className="w-10 h-10 animate-bounce" />
                  <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-amber-300" />
                </div>
              </div>

              <h2 className="text-2xl font-black uppercase tracking-wider mb-2">Tag Secured!</h2>
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-4">Success</p>

              {/* Complete details */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-full overflow-hidden border ${theme.textAccent}`}>
                    <img src={selectedTarget.photo} alt={selectedTarget.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-200">{selectedTarget.name}</h4>
                    <p className="text-[9px] text-slate-500">evaded at speed: {selectedTarget.speed}</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed mt-2 border-t border-white/5 pt-2.5">
                  {theme.successMsg}
                </p>
              </div>

              {/* Stats table */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                  <p className="text-xl font-black text-white">{40 - timeLeft}s</p>
                  <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">Chase Duration</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                  <p className="text-xl font-black text-amber-400">+{200 + (timeLeft * 5)}</p>
                  <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">Points Earned</p>
                </div>
              </div>

              {/* Action pokes */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    alert(`${category === "dating" ? "Opening conversation with " : category === "friends" ? "Adding friend " : "Requesting meetup with "} ${selectedTarget.name}!`);
                    handleReset();
                  }}
                  className={`w-full py-4 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-black text-sm uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{theme.ctaText}</span>
                </button>
                
                <button
                  onClick={handleReset}
                  className="w-full py-3 rounded-2xl bg-slate-800/80 border border-slate-700/50 text-slate-200 text-sm font-bold active:scale-95 transition-all hover:bg-slate-700/80"
                >
                  Tag Someone Else
                </button>
              </div>

            </div>
          </div>

          <div style={{ height: "44px" }} />
        </div>
      )}

      {/* ── SCREEN: FAIL (Timer expired) ── */}
      {gameState === "fail" && selectedTarget && (
        <div className="absolute inset-0 flex flex-col justify-between p-6 z-30" style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          <div style={{ height: "44px" }} />

          <div className="w-full max-w-sm mx-auto">
            <div className="rounded-3xl border border-white/10 shadow-2xl p-8 text-center bg-slate-900/80 backdrop-blur-md">
              
              <div className="mb-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-500 animate-bounce">
                  <AlertTriangle className="w-8 h-8" />
                </div>
              </div>

              <h2 className="text-2xl font-black uppercase tracking-wider mb-2">Target Escaped!</h2>
              <p className="text-xs text-red-400 font-bold uppercase tracking-wider mb-6">Time Expired</p>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  {selectedTarget.name} was too fast! They slipped out of radar range before you could secure the tag contact.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleChallenge(selectedTarget)} // retry the same target
                  className="w-full py-3.5 rounded-2xl bg-slate-200 text-slate-950 font-black text-sm uppercase tracking-widest active:scale-95 transition-transform"
                >
                  Try Again
                </button>
                
                <button
                  onClick={handleReset}
                  className="w-full py-3 rounded-2xl bg-slate-800/80 border border-slate-700/50 text-slate-200 text-sm font-bold active:scale-95 transition-all hover:bg-slate-700/80"
                >
                  Select Other Target
                </button>
              </div>

            </div>
          </div>

          <div style={{ height: "44px" }} />
        </div>
      )}

    </div>
  );
}
