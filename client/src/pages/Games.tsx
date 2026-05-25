import { useState, useEffect } from "react";
import { useScrollSave } from "@/hooks/use-scroll-save";
import { PageTransition } from "@/components/PageTransition";
import BottomNavigation from "@/components/BottomNavigation";
import IceBreaker from "@/components/IceBreaker";
import TurfWars from "@/components/TurfWars";
import BumpBattle from "@/components/BumpBattle";
import ProximityTag from "@/components/ProximityTag";
import RandomMatch from "@/components/RandomMatch";
import KingOfTheHill from "@/components/KingOfTheHill";
import Leaderboard from "@/components/Leaderboard";
import TriviaClash from "@/components/TriviaClash";
import EmojiDecode from "@/components/EmojiDecode";
import TwoTruths from "@/components/TwoTruths";
import { Gamepad2, Radio, Swords, Target, Puzzle, Trophy, Zap, Dice5, Crown, Flag, Sparkles, Lock, Brain, Smile, Eye } from "lucide-react";

type ActiveGame = null | "icebreaker" | "turfwars" | "bumpbattle" | "proximitytag" | "randommatch" | "kingofthehill" | "leaderboard" | "triviaclash" | "emojidecode" | "twotruths";
type Category = "dating" | "friends" | "business";

// Games list for layout
const gamesList = [
  { id: 3, icon: Puzzle, name: "Ice Breaker", desc: "This or That — swipe to match with nearby people", color: "text-purple-400", bg: "bg-purple-500/10", gameKey: "icebreaker" as const, ready: true, badge: "NEW" },
  { id: 0, icon: Flag, name: "Turf Wars", desc: "Capture real-world territories on a hex grid", color: "text-violet-400", bg: "bg-violet-500/10", gameKey: "turfwars" as const, ready: true, badge: null },
  { id: 1, icon: Swords, name: "Bump Battle", desc: "Challenge nearby users to duels", color: "text-rose-400", bg: "bg-rose-500/10", gameKey: "bumpbattle" as const, ready: true, badge: "NEW" },
  { id: 2, icon: Target, name: "Proximity Tag", desc: "Tag players within your range", color: "text-blue-400", bg: "bg-blue-500/10", gameKey: "proximitytag" as const, ready: true, badge: "NEW" },
  { id: 4, icon: Trophy, name: "Leaderboard", desc: "Top bumpers this week", color: "text-amber-400", bg: "bg-amber-500/10", gameKey: "leaderboard" as const, ready: true, badge: "NEW" },
  { id: 5, icon: Dice5, name: "Random Match", desc: "Spin to meet someone new", color: "text-emerald-400", bg: "bg-emerald-500/10", gameKey: "randommatch" as const, ready: true, badge: "NEW" },
  { id: 6, icon: Crown, name: "King of the Hill", desc: "Hold your spot the longest", color: "text-fuchsia-400", bg: "bg-fuchsia-500/10", gameKey: "kingofthehill" as const, ready: true, badge: "NEW" },
  { id: 7, icon: Brain, name: "Trivia Clash", desc: "Head-to-head quiz battle", color: "text-violet-400", bg: "bg-violet-500/10", gameKey: "triviaclash" as const, ready: true, badge: "NEW" },
  { id: 8, icon: Smile, name: "Emoji Decode", desc: "Guess the emoji puzzle", color: "text-amber-400", bg: "bg-amber-500/10", gameKey: "emojidecode" as const, ready: true, badge: "NEW" },
  { id: 9, icon: Eye, name: "Two Truths & a Lie", desc: "Spot the faker — 3 statements, 1 lie", color: "text-violet-400", bg: "bg-violet-500/10", gameKey: "twotruths" as const, ready: true, badge: "NEW" },
];

export default function Games() {
  const gamesScroll = useScrollSave("f2f_scroll_games");
  const [isLive, setIsLive] = useState(true);
  const [activeGame, setActiveGame] = useState<ActiveGame>(null);
  const [category, setCategory] = useState<Category>(() => {
    return (localStorage.getItem("f2f_activeCategory") as Category) || "dating";
  });

  // Sync category when localStorage changes
  useEffect(() => {
    const sync = () => {
      const cat = localStorage.getItem("f2f_activeCategory") as Category;
      if (cat) setCategory(cat);
    };
    window.addEventListener("storage", sync);
    window.addEventListener("f2f:categoryChange", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("f2f:categoryChange", sync);
    };
  }, []);

  // If a game is active, render it fullscreen
  if (activeGame === "icebreaker") {
    return <IceBreaker onBack={() => setActiveGame(null)} category={category} />;
  }
  if (activeGame === "bumpbattle") {
    return <BumpBattle onBack={() => setActiveGame(null)} category={category} />;
  }
  if (activeGame === "proximitytag") {
    return <ProximityTag onBack={() => setActiveGame(null)} category={category} />;
  }
  if (activeGame === "randommatch") {
    return <RandomMatch onBack={() => setActiveGame(null)} category={category} />;
  }
  if (activeGame === "kingofthehill") {
    return <KingOfTheHill onBack={() => setActiveGame(null)} category={category} />;
  }
  if (activeGame === "leaderboard") {
    return <Leaderboard onBack={() => setActiveGame(null)} category={category} />;
  }
  if (activeGame === "triviaclash") {
    return <TriviaClash onBack={() => setActiveGame(null)} category={category} />;
  }
  if (activeGame === "emojidecode") {
    return <EmojiDecode onBack={() => setActiveGame(null)} category={category} />;
  }
  if (activeGame === "twotruths") {
    return <TwoTruths onBack={() => setActiveGame(null)} category={category} />;
  }
  if (activeGame === "turfwars") {
    return (
      <PageTransition className="h-screen w-full page-dark relative overflow-hidden">
        <TurfWars />
        {/* Back button overlaid on TurfWars */}
        <button
          onClick={() => setActiveGame(null)}
          className="absolute top-3 left-3 z-[60] w-9 h-9 rounded-full bg-slate-800/80 backdrop-blur-md border border-slate-700/50 flex items-center justify-center hover:bg-slate-700/80 transition-colors"
        >
          <span className="text-slate-300 text-lg">‹</span>
        </button>
        <BottomNavigation />
      </PageTransition>
    );
  }

  return (
    <PageTransition className="h-screen w-full page-dark relative overflow-hidden">
      {/* Title bar — centered, with GO LIVE toggle */}
      <div className="fixed top-0 left-0 right-0 z-[9999]" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 w-full flex items-center justify-between px-4" style={{ height: "44px" }}>
          {/* Left spacer for centering */}
          <div style={{ width: "60px" }} />

          {/* Centered title */}
          <div className="flex items-center gap-2">
            <Gamepad2 className="text-amber-400" style={{ width: "18px", height: "18px" }} />
            <h1 className="font-bold text-white tracking-tight flex items-center gap-1.5" style={{ fontSize: "16px" }}>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">Games</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] uppercase tracking-wider font-bold transform -translate-y-0.5">BETA</span>
            </h1>
          </div>

          {/* GO LIVE toggle — right side */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-1.5 rounded-full border transition-all duration-300 ${
              isLive
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                : "bg-slate-800/50 border-slate-700/50 text-slate-500"
            }`}
            style={{ padding: "4px 10px", height: "28px" }}
          >
            <Radio
              className={`${isLive ? "animate-pulse" : ""}`}
              style={{ width: "12px", height: "12px" }}
            />
            <span className="font-bold uppercase tracking-wider" style={{ fontSize: "8px" }}>
              {isLive ? "LIVE" : "OFF"}
            </span>
          </button>
        </div>
      </div>

      {/* Featured Game Banner */}
      <div className="fixed left-0 right-0 z-10" style={{ top: "44px" }}>
        <button
          onClick={() => setActiveGame("icebreaker")}
          className="w-full group"
        >
          <div className={`mx-3 mt-3 rounded-2xl overflow-hidden border border-white/10 relative ${
            category === 'dating' ? 'bg-gradient-to-br from-pink-950/80 via-rose-950/40 to-slate-950' :
            category === 'friends' ? 'bg-gradient-to-br from-emerald-950/80 via-green-950/40 to-slate-950' :
            'bg-gradient-to-br from-blue-950/80 via-indigo-950/40 to-slate-950'
          }`}>
            {/* Glow */}
            <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-[60px] opacity-20 ${
              category === 'dating' ? 'bg-pink-500' : category === 'friends' ? 'bg-emerald-500' : 'bg-blue-500'
            }`} />

            <div className="relative z-10 p-5 flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                category === 'dating' ? 'bg-pink-500/15 border border-pink-500/30' :
                category === 'friends' ? 'bg-emerald-500/15 border border-emerald-500/30' :
                'bg-blue-500/15 border border-blue-500/30'
              }`}>
                <Sparkles className={`w-7 h-7 ${
                  category === 'dating' ? 'text-pink-400' : category === 'friends' ? 'text-emerald-400' : 'text-blue-400'
                }`} />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-base font-black text-white">Ice Breaker</h3>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                    category === 'dating' ? 'bg-pink-500/20 text-pink-400' :
                    category === 'friends' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>NEW</span>
                </div>
                <p className="text-xs text-slate-400">Swipe through questions · Match with nearby people</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                category === 'dating' ? 'bg-pink-500' : category === 'friends' ? 'bg-emerald-500' : 'bg-blue-500'
              }`}>
                <Zap className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Games list */}
      <div {...gamesScroll} onScroll={gamesScroll.onScroll} className="fixed left-0 right-0 overflow-y-auto" style={{ top: "148px", bottom: "60px" }}>
        <div className="px-4 mb-2">
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">All Games</h3>
        </div>
        <div className="flex flex-col">
          {gamesList.map((game) => {
            const IconComp = game.icon;
            return (
              <div
                key={game.id}
                onClick={() => {
                  if (game.ready && game.gameKey) {
                    setActiveGame(game.gameKey);
                  }
                }}
                className={`flex items-center gap-3 px-4 py-3 transition-colors border-b border-slate-800/30 active:scale-[0.98] ${
                  game.ready ? 'hover:bg-slate-800/50 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <div className={`w-11 h-11 rounded-xl ${game.bg} border border-slate-700/30 flex items-center justify-center flex-shrink-0 relative`}>
                  <IconComp className={game.color} style={{ width: "20px", height: "20px" }} />
                  {!game.ready && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                      <Lock className="w-2.5 h-2.5 text-slate-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-200 text-sm">{game.name}</p>
                    {game.badge && (
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        game.badge === "NEW" ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-slate-700/50 text-slate-500'
                      }`}>{game.badge}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{game.desc}</p>
                </div>
                <div className="text-slate-600" style={{ fontSize: "18px" }}>
                  {game.ready ? "›" : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNavigation />
    </PageTransition>
  );
}
