import { useState, useEffect, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Swords, Brain, MessageCircleQuestion, Mountain, Radar } from "lucide-react";

type Category = "dating" | "friends" | "business";

interface MapGameOverlayProps {
  gameKey: string;
  opponent: {
    id: number;
    firstName: string;
    lastName: string;
    age: number;
    sex: string;
    profilePhoto?: string | null;
    category: string;
  };
  category?: Category;
  onClose: () => void;
}

export interface MapGameChildProps {
  opponent: {
    id: number;
    firstName: string;
    lastName: string;
    age: number;
    sex: string;
    profilePhoto?: string | null;
    category: string;
  };
  category: Category;
  onComplete: () => void;
  onBack: () => void;
}

type GamePhase = "loading" | "playing" | "complete";

// Lazy-loaded game components
const MapBumpBattle = lazy(() => import("@/components/MapBumpBattle"));
const MapTriviaClash = lazy(() => import("@/components/MapTriviaClash"));
const MapTwoTruths = lazy(() => import("@/components/MapTwoTruths"));
const MapKingOfTheHill = lazy(() => import("@/components/MapKingOfTheHill"));
const MapProximityTag = lazy(() => import("@/components/MapProximityTag"));

const GAME_META: Record<string, { name: string; icon: typeof Swords }> = {
  "bump-battle": { name: "Bump Battle", icon: Swords },
  "trivia-clash": { name: "Trivia Clash", icon: Brain },
  "two-truths": { name: "Two Truths", icon: MessageCircleQuestion },
  "king-of-the-hill": { name: "King of the Hill", icon: Mountain },
  "proximity-tag": { name: "Proximity Tag", icon: Radar },
};

const THEMES: Record<Category, { gradient: string; textAccent: string; borderAccent: string }> = {
  dating: {
    gradient: "from-pink-500 via-rose-500 to-red-500",
    textAccent: "text-pink-400",
    borderAccent: "border-pink-500/30",
  },
  friends: {
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    textAccent: "text-emerald-400",
    borderAccent: "border-emerald-500/30",
  },
  business: {
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    textAccent: "text-blue-400",
    borderAccent: "border-blue-500/30",
  },
};

export default function MapGameOverlay({ gameKey, opponent, category, onClose }: MapGameOverlayProps) {
  const resolvedCategory: Category =
    category || (opponent.category as Category) || "dating";
  const theme = THEMES[resolvedCategory];
  const meta = GAME_META[gameKey] || { name: "Game", icon: Swords };
  const GameIcon = meta.icon;

  const [phase, setPhase] = useState<GamePhase>("loading");
  const [countdown, setCountdown] = useState(3);

  const initials = `${opponent.firstName[0]}${(opponent.lastName || "")[0] || ""}`.toUpperCase();

  // Loading countdown → playing
  useEffect(() => {
    if (phase !== "loading") return;

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
  }, [phase]);

  const handleComplete = () => {
    setPhase("complete");
    // Let child handle its own complete UI, then user closes
    onClose();
  };

  const handleBack = () => {
    onClose();
  };

  // Render game component based on gameKey
  const renderGame = () => {
    const childProps: MapGameChildProps = {
      opponent,
      category: resolvedCategory,
      onComplete: handleComplete,
      onBack: handleBack,
    };

    switch (gameKey) {
      case "bump-battle":
        return <MapBumpBattle {...childProps} />;
      case "trivia-clash":
        return <MapTriviaClash {...childProps} />;
      case "two-truths":
        return <MapTwoTruths {...childProps} />;
      case "king-of-the-hill":
        return <MapKingOfTheHill {...childProps} />;
      case "proximity-tag":
        return <MapProximityTag {...childProps} />;
      default:
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
              Game not found
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-bold active:scale-95 transition-transform"
            >
              Go Back
            </button>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[4500]">
        {/* Backdrop — top 15% shows map peek */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/50"
        />

        {/* Bottom Sheet — covers ~85% */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 bg-slate-950 rounded-t-3xl border-t border-slate-800/60 shadow-2xl flex flex-col overflow-hidden"
          style={{
            height: "85vh",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-slate-700" />
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center hover:bg-slate-700/80 transition-colors z-10"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>

          {/* ── LOADING PHASE ── */}
          {phase === "loading" && (
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              {/* Background glow */}
              <div className={`absolute top-10 right-10 w-60 h-60 rounded-full blur-[120px] opacity-15 bg-gradient-to-r ${theme.gradient}`} />

              {/* Countdown */}
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={countdown}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.3, opacity: 1 }}
                  exit={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className={`text-7xl font-black mb-8 bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}
                >
                  {countdown}
                </motion.div>
              </AnimatePresence>

              {/* Game Info */}
              <div className="flex items-center gap-2 mb-6">
                <GameIcon className={`w-5 h-5 ${theme.textAccent}`} />
                <span className={`text-sm font-black uppercase tracking-widest bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
                  {meta.name}
                </span>
              </div>

              {/* VS Display */}
              <div className="flex items-center gap-6 mb-8">
                {/* You */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-2xl">
                    👑
                  </div>
                  <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
                    You
                  </span>
                </div>

                {/* VS connector */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xl font-black text-slate-600">VS</span>
                  <div className={`w-12 h-0.5 bg-gradient-to-r ${theme.gradient} rounded-full`} />
                </div>

                {/* Opponent */}
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${theme.borderAccent}`}>
                    {opponent.profilePhoto ? (
                      <img
                        src={opponent.profilePhoto}
                        alt={opponent.firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-sm font-black text-slate-400">
                        {initials}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
                    {opponent.firstName}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold animate-pulse">
                Loading game...
              </p>
            </div>
          )}

          {/* ── PLAYING PHASE ── */}
          {phase === "playing" && (
            <Suspense
              fallback={
                <div className="flex-1 flex flex-col items-center justify-center">
                  <Loader2 className={`w-8 h-8 ${theme.textAccent} animate-spin mb-3`} />
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                    Loading {meta.name}...
                  </p>
                </div>
              }
            >
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                {renderGame()}
              </div>
            </Suspense>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
