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
}> = {
  dating: {
    gradient: "from-pink-500 via-rose-500 to-red-500",
    textAccent: "text-pink-400",
    bgAccent: "bg-pink-500/15",
    borderAccent: "border-pink-500/30",
    crownColor: "text-pink-400",
    ctaText: "Send a Heart",
    ctaIcon: Heart,
  },
  friends: {
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    textAccent: "text-emerald-400",
    bgAccent: "bg-emerald-500/15",
    borderAccent: "border-emerald-500/30",
    crownColor: "text-emerald-400",
    ctaText: "Add Friend",
    ctaIcon: UserPlus,
  },
  business: {
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    textAccent: "text-blue-400",
    bgAccent: "bg-blue-500/15",
    borderAccent: "border-blue-500/30",
    crownColor: "text-blue-400",
    ctaText: "Connect",
    ctaIcon: Briefcase,
  },
};

type GamePhase = "lobby" | "claiming" | "defending" | "victory" | "defeat";

export default function KingOfTheHill({ onBack, category = "dating" }: KingOfTheHillProps) {
  const theme = THEMES[category];
  const challengers = CHALLENGERS[category];

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

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const challengerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = useCallback((msg: string) => {
    setLog(prev => [msg, ...prev.slice(0, 12)]);
  }, []);

  // Claiming countdown
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

  // Start defense phase
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

  // Challenger attacks on interval
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
            setPhase("defeat");
          }
          return Math.round(next * 10) / 10;
        });

        if (shieldActive) {
          setAttackFlash(false);
        } else {
          setAttackFlash(true);
          setTimeout(() => setAttackFlash(false), 200);
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
    addLog(`⚔️ ${c.name} (${c.style}) is challenging you!`);
  }, [challengers, addLog]);

  // Attack the challenger
  const handleAttack = () => {
    if (phase !== "defending" || !currentChallenger || defenseEnergy < 8) return;

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

        // Spawn next challenger after delay
        setTimeout(() => spawnChallenger(), 1200);
      }
      return Math.round(next * 10) / 10;
    });
  };

  // Activate shield
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

  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950 text-white select-none">
      {/* Background effects */}
      <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-[160px] opacity-15 bg-gradient-to-r ${theme.gradient}`} />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-[140px] opacity-10 bg-amber-500" />

      {/* Attack flash overlay */}
      <AnimatePresence>
        {attackFlash && (
          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-red-500/20 z-[70] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <div className="fixed top-0 left-0 right-0 z-[60]" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="px-4 py-3 flex items-center justify-between border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-slate-800/80 backdrop-blur-md border border-slate-700/50 flex items-center justify-center hover:bg-slate-700/80 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div className="flex items-center gap-2">
            <Crown className={`w-4 h-4 text-amber-400`} />
            <span className={`text-sm font-black uppercase tracking-widest bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent`}>
              King of the Hill
            </span>
          </div>
          {phase === "defending" ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
              <Timer className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-black text-amber-400">{formatTime(timeHeld)}</span>
            </div>
          ) : (
            <div style={{ width: "60px" }} />
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="absolute inset-0 flex flex-col" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 56px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

        {/* ── LOBBY ── */}
        {phase === "lobby" && (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            {/* Crown visual */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="mb-6"
            >
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-rose-500/10 border-2 border-amber-500/30 flex items-center justify-center shadow-[0_0_60px_rgba(245,158,11,0.2)]">
                <Crown className="w-14 h-14 text-amber-400" />
              </div>
            </motion.div>

            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wider">King of the Hill</h2>
            <p className="text-sm text-slate-400 text-center mb-8 max-w-xs leading-relaxed">
              Claim the hill and defend your position against challengers. The longer you hold, the more points you earn!
            </p>

            {/* Stats from previous runs */}
            {bestTime > 0 && (
              <div className="flex items-center gap-4 mb-6">
                <div className="px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/30 text-center">
                  <p className="text-lg font-black text-amber-400">{formatTime(bestTime)}</p>
                  <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Best Time</p>
                </div>
              </div>
            )}

            {/* How it works */}
            <div className="w-full max-w-xs space-y-2 mb-8">
              {[
                { icon: Crown, text: "Claim the hill to start defending", color: "text-amber-400" },
                { icon: Zap, text: "Tap STRIKE to attack challengers", color: "text-red-400" },
                { icon: Shield, text: "Use Shield to reduce incoming damage", color: "text-blue-400" },
                { icon: Timer, text: "Hold the hill as long as possible", color: "text-emerald-400" },
              ].map(({ icon: Icon, text, color }, idx) => (
                <div key={idx} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900/40 border border-slate-800/50">
                  <Icon className={`w-4 h-4 ${color} shrink-0`} />
                  <span className="text-xs text-slate-300 font-medium">{text}</span>
                </div>
              ))}
            </div>

            <motion.button
              onClick={handleStartClaim}
              whileTap={{ scale: 0.95 }}
              className={`w-full max-w-xs py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-3`}
            >
              <Crown className="w-5 h-5" />
              <span>Claim the Hill</span>
            </motion.button>
          </div>
        )}

        {/* ── CLAIMING COUNTDOWN ── */}
        {phase === "claiming" && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Claiming the Hill...</p>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={claimCountdown}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                exit={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="text-8xl font-black text-amber-400"
              >
                {claimCountdown}
              </motion.div>
            </AnimatePresence>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-8">
              Prepare to defend!
            </p>
          </div>
        )}

        {/* ── DEFENDING ── */}
        {phase === "defending" && currentChallenger && (
          <div className="flex-1 flex flex-col justify-between">

            {/* Hill HP bar + score */}
            <div className="px-4 pt-3 pb-2">
              {/* Score row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-sm font-black text-amber-400">{score}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-slate-400" />
                    <span className="text-xs font-bold text-slate-400">{challengersDefeated} KO</span>
                  </div>
                </div>
                {comboCount > 1 && (
                  <motion.div
                    key={comboCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30"
                  >
                    <Flame className="w-3 h-3 text-orange-400" />
                    <span className="text-[10px] font-black text-orange-400">{comboCount}x COMBO</span>
                  </motion.div>
                )}
              </div>

              {/* Your Hill HP */}
              <div className="mb-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" /> Your Hill
                  </span>
                  <span className={`text-xs font-black ${hillHP < 30 ? 'text-red-400 animate-pulse' : hillHP < 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {Math.round(hillHP)}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700/50">
                  <motion.div
                    animate={{ width: `${hillHP}%` }}
                    transition={{ duration: 0.3 }}
                    className={`h-full rounded-full transition-colors ${
                      hillHP < 30 ? 'bg-gradient-to-r from-red-600 to-red-400' :
                      hillHP < 60 ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                      'bg-gradient-to-r from-emerald-600 to-emerald-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* VS Battle area */}
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              {/* Challenger card */}
              <motion.div
                key={currentChallenger.name}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className={`w-full max-w-sm rounded-2xl border overflow-hidden mb-4 ${
                  defenseFlash ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'border-slate-800 shadow-xl'
                } transition-all duration-150`}
              >
                <div className="bg-slate-900/80 backdrop-blur-md p-5">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${
                        challengerHP < 30 ? 'border-red-500/50' : 'border-slate-700'
                      } transition-colors`}>
                        <img src={currentChallenger.photo} alt={currentChallenger.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm">
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

                      {/* Challenger HP */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                          <motion.div
                            animate={{ width: `${challengerHP}%` }}
                            transition={{ duration: 0.2 }}
                            className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-400"
                          />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 w-8 text-right">{Math.round(challengerHP)}%</span>
                      </div>

                      {/* Power */}
                      <div className="flex items-center gap-1 mt-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span className="text-[9px] font-bold text-slate-500">Power: {currentChallenger.power}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Shield indicator */}
              <AnimatePresence>
                {shieldActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 mb-3"
                  >
                    <Shield className="w-4 h-4 text-blue-400 animate-pulse" />
                    <span className="text-xs font-black text-blue-400 uppercase tracking-wider">Shield Active</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Event log */}
            <div className="px-4 py-2 bg-slate-950/40 max-h-[50px] overflow-hidden border-t border-b border-white/5">
              <div className="text-slate-400 text-[11px] font-semibold text-center truncate">
                {log[0] || "Defend your position..."}
              </div>
            </div>

            {/* Defense energy bar */}
            <div className="px-6 pt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Energy</span>
                <span className={`text-[10px] font-black ${defenseEnergy < 20 ? 'text-red-400' : 'text-cyan-400'}`}>
                  {Math.round(defenseEnergy)}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mb-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${defenseEnergy}%` }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="px-6 pb-6 flex gap-3">
              {/* Strike button */}
              <motion.button
                onClick={handleAttack}
                disabled={defenseEnergy < 8}
                whileTap={{ scale: 0.92 }}
                className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  defenseEnergy < 8
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : `bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg active:shadow-none`
                }`}
              >
                <Zap className="w-5 h-5" />
                <span>Strike</span>
              </motion.button>

              {/* Shield button */}
              <button
                onClick={handleShield}
                disabled={shieldCooldown > 0 || defenseEnergy < 20 || shieldActive}
                className={`w-20 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 ${
                  shieldCooldown > 0 || defenseEnergy < 20 || shieldActive
                    ? 'bg-slate-800/60 text-slate-600 border border-slate-800 cursor-not-allowed'
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/30 active:scale-95'
                }`}
              >
                <Shield className="w-5 h-5" />
                {shieldCooldown > 0 ? (
                  <span className="text-[8px]">{shieldCooldown}s</span>
                ) : (
                  <span className="text-[8px]">Shield</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── DEFEAT ── */}
        {phase === "defeat" && (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-full max-w-sm"
            >
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-md shadow-2xl overflow-hidden">
                <div className={`h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500`} />
                <div className="p-8 text-center">
                  {/* Crown fallen */}
                  <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4 relative">
                    <Crown className="w-10 h-10 text-slate-600" />
                    <motion.div
                      initial={{ rotate: 0 }}
                      animate={{ rotate: 15 }}
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center"
                    >
                      <span className="text-xs">💥</span>
                    </motion.div>
                  </div>

                  <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-1">Dethroned!</h2>
                  <p className="text-xs text-red-400 font-bold uppercase tracking-wider mb-6">
                    {currentChallenger?.name} took your crown
                  </p>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
                      <p className="text-lg font-black text-amber-400">{formatTime(timeHeld)}</p>
                      <p className="text-[7px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">Time Held</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
                      <p className="text-lg font-black text-white">{score}</p>
                      <p className="text-[7px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">Score</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
                      <p className="text-lg font-black text-rose-400">{challengersDefeated}</p>
                      <p className="text-[7px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">Defeated</p>
                    </div>
                  </div>

                  {/* Defeated by */}
                  {currentChallenger && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 mb-6">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-700">
                        <img src={currentChallenger.photo} alt={currentChallenger.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black text-slate-200">{currentChallenger.name} {currentChallenger.emoji}</p>
                        <p className="text-[9px] text-slate-500">defeated you · {currentChallenger.style} style</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-3">
                    <button
                      onClick={handleRestart}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-black text-sm uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Crown className="w-5 h-5" />
                      <span>Reclaim the Hill</span>
                    </button>

                    <button
                      onClick={onBack}
                      className="w-full py-3 rounded-2xl bg-slate-800/80 border border-slate-700/50 text-slate-200 text-sm font-bold active:scale-95 transition-all"
                    >
                      Exit to Games
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
