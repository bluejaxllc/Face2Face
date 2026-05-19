import { useState } from "react";
import { useScrollSave } from "@/hooks/use-scroll-save";
import { PageTransition } from "@/components/PageTransition";
import BottomNavigation from "@/components/BottomNavigation";
import { Gamepad2, Radio, Swords, Target, Puzzle, Trophy, Zap, Dice5, Crown, Flag } from "lucide-react";

// Placeholder games list for layout
const gamesList = [
  { id: 0, icon: Flag, name: "Turf Wars", desc: "Capture real-world territories", color: "text-violet-400", bg: "bg-violet-500/10" },
  { id: 1, icon: Swords, name: "Bump Battle", desc: "Challenge nearby users", color: "text-rose-400", bg: "bg-rose-500/10" },
  { id: 2, icon: Target, name: "Proximity Tag", desc: "Tag players within range", color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: 3, icon: Puzzle, name: "Ice Breaker", desc: "Random questions game", color: "text-purple-400", bg: "bg-purple-500/10" },
  { id: 4, icon: Trophy, name: "Leaderboard", desc: "Top bumpers this week", color: "text-amber-400", bg: "bg-amber-500/10" },
  { id: 5, icon: Dice5, name: "Random Match", desc: "Spin to meet someone new", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { id: 6, icon: Crown, name: "King of the Hill", desc: "Hold your spot the longest", color: "text-fuchsia-400", bg: "bg-fuchsia-500/10" },
];

export default function Games() {
  const gamesScroll = useScrollSave("f2f_scroll_games");
  const [isLive, setIsLive] = useState(true);

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

      {/* Games list */}
      <div {...gamesScroll} onScroll={gamesScroll.onScroll} className="fixed left-0 right-0 overflow-y-auto" style={{ top: "44px", bottom: "60px" }}>
        <div className="flex flex-col py-2">
          {gamesList.map((game) => {
            const IconComp = game.icon;
            return (
              <div
                key={game.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 cursor-pointer transition-colors border-b border-slate-800/30 active:scale-[0.98]"
              >
                <div className={`w-11 h-11 rounded-xl ${game.bg} border border-slate-700/30 flex items-center justify-center flex-shrink-0`}>
                  <IconComp className={game.color} style={{ width: "20px", height: "20px" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-200 text-sm">{game.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{game.desc}</p>
                </div>
                <div className="text-slate-600" style={{ fontSize: "18px" }}>›</div>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNavigation />
    </PageTransition>
  );
}
