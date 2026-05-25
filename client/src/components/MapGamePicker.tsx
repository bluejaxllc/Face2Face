import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Brain, X, Gamepad2, Clock, ChevronRight, MessageCircleQuestion, Mountain, Radar } from "lucide-react";

type Category = "dating" | "friends" | "business";

interface MapGamePickerProps {
  opponent: {
    id: number;
    firstName: string;
    lastName: string;
    age: number;
    sex: string;
    profilePhoto?: string | null;
    category: string;
  };
  onSelectGame: (gameKey: string) => void;
  onClose: () => void;
  category?: Category;
}

interface GameOption {
  key: string;
  name: string;
  description: string;
  duration: string;
  icon: typeof Swords;
}

const GAMES: GameOption[] = [
  {
    key: "bump-battle",
    name: "Bump Battle",
    description: "Test your reflexes in a 1v1 duel",
    duration: "~2 min",
    icon: Swords,
  },
  {
    key: "trivia-clash",
    name: "Trivia Clash",
    description: "Head-to-head quiz battle",
    duration: "~3 min",
    icon: Brain,
  },
  {
    key: "two-truths",
    name: "Two Truths",
    description: "Spot the lie in 3 statements",
    duration: "~3 min",
    icon: MessageCircleQuestion,
  },
  {
    key: "king-of-the-hill",
    name: "King of the Hill",
    description: "Tap fast to claim the territory",
    duration: "~2 min",
    icon: Mountain,
  },
  {
    key: "proximity-tag",
    name: "Proximity Tag",
    description: "Time your taps on the radar",
    duration: "~2 min",
    icon: Radar,
  },
];

const THEMES: Record<Category, { gradient: string; textAccent: string; bgAccent: string; borderAccent: string; iconBg: string }> = {
  dating: {
    gradient: "from-pink-500 via-rose-500 to-red-500",
    textAccent: "text-pink-400",
    bgAccent: "bg-pink-500/10",
    borderAccent: "border-pink-500/30",
    iconBg: "bg-pink-500/15",
  },
  friends: {
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    textAccent: "text-emerald-400",
    bgAccent: "bg-emerald-500/10",
    borderAccent: "border-emerald-500/30",
    iconBg: "bg-emerald-500/15",
  },
  business: {
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    textAccent: "text-blue-400",
    bgAccent: "bg-blue-500/10",
    borderAccent: "border-blue-500/30",
    iconBg: "bg-blue-500/15",
  },
};

export default function MapGamePicker({ opponent, onSelectGame, onClose, category }: MapGamePickerProps) {
  const resolvedCategory: Category =
    category || (opponent.category as Category) || "dating";
  const theme = THEMES[resolvedCategory];

  const initials = `${opponent.firstName[0]}${(opponent.lastName || "")[0] || ""}`.toUpperCase();

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[4000]">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Bottom Sheet */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800/60 rounded-t-3xl shadow-2xl"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-slate-700" />
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center hover:bg-slate-700/80 transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>

          {/* Header: Opponent Info */}
          <div className="px-5 pt-2 pb-4">
            <div className="flex items-center gap-3 mb-4">
              {/* Avatar */}
              <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${theme.borderAccent} flex-shrink-0`}>
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

              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-black text-white uppercase tracking-wider truncate">
                  Challenge {opponent.firstName}
                </h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                  Pick a game to play
                </p>
              </div>
            </div>

            {/* Section Label */}
            <div className="flex items-center gap-2 mb-3">
              <Gamepad2 className={`w-3.5 h-3.5 ${theme.textAccent}`} />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Available Games
              </span>
            </div>

            {/* Game Cards Grid */}
            <div className="space-y-3">
              {GAMES.map((game, idx) => {
                const Icon = game.icon;
                return (
                  <motion.button
                    key={game.key}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    onClick={() => onSelectGame(game.key)}
                    className={`w-full p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm flex items-center gap-4 hover:border-slate-700/80 active:scale-[0.98] transition-all text-left`}
                  >
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl ${theme.iconBg} border ${theme.borderAccent} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${theme.textAccent}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">
                        {game.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {game.description}
                      </p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Clock className="w-3 h-3 text-slate-600" />
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">
                          {game.duration}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-slate-600 flex-shrink-0" />
                  </motion.button>
                );
              })}
            </div>

            {/* Footer hint */}
            <p className="text-center text-[9px] text-slate-600 font-medium mt-4 mb-2">
              Tap a game to start challenging
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
