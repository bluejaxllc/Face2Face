import { useState, useRef, useEffect } from "react";
import { PageTransition } from "@/components/PageTransition";
import BottomNavigation from "@/components/BottomNavigation";
import Map from "@/components/Map";
import { Users, Settings, ChevronDown, Search, MapPin, Globe, Lock, Tag } from "lucide-react";

type TabKey = "map" | "settings";

export default function Explore() {
  const [activeTab, setActiveTab] = useState<TabKey>("map");
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [distanceValue, setDistanceValue] = useState("");
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettingsDropdown(false);
      }
    };
    if (showSettingsDropdown) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSettingsDropdown]);

  return (
    <PageTransition className="h-screen w-full page-dark relative overflow-hidden">
      {/* ═══════ Top Section: Title + Tabs ═══════ */}
      <div className="fixed top-0 left-0 right-0 z-[9999]" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        {/* Title bar — centered */}
        <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 w-full flex items-center justify-center px-4" style={{ height: "44px" }}>
          <div className="flex items-center gap-2">
            <Users className="text-purple-400" style={{ width: "18px", height: "18px" }} />
            <h1 className="font-bold text-white tracking-tight" style={{ fontSize: "16px" }}>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Groups / List</span>
              <span className="text-slate-400 font-normal ml-1.5" style={{ fontSize: "12px" }}>View</span>
            </h1>
          </div>
        </div>

        {/* Tab bar — centered */}
        <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-700/30 w-full flex items-center justify-center px-3 gap-2" style={{ height: "40px" }}>
          <button
            onClick={() => { setActiveTab("map"); setShowSettingsDropdown(false); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all duration-200 ${
              activeTab === "map"
                ? "bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/30"
                : "text-slate-400 hover:text-slate-300 hover:bg-white/5"
            }`}
          >
            <MapPin style={{ width: "13px", height: "13px" }} />
            <span className="font-semibold uppercase tracking-wider" style={{ fontSize: "10px" }}>Groups Map</span>
          </button>

          {/* Settings button with dropdown anchor */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all duration-200 ${
                showSettingsDropdown
                  ? "bg-slate-700/30 text-white ring-1 ring-slate-600/30"
                  : "text-slate-400 hover:text-slate-300 hover:bg-white/5"
              }`}
            >
              <Settings style={{ width: "13px", height: "13px" }} />
              <span className="font-semibold uppercase tracking-wider" style={{ fontSize: "10px" }}>Settings</span>
              <ChevronDown
                className={`transition-transform duration-200 ${showSettingsDropdown ? "rotate-180" : ""}`}
                style={{ width: "10px", height: "10px" }}
              />
            </button>

            {/* Settings dropdown — positioned popover */}
            {showSettingsDropdown && (
              <div
                className="absolute z-[10000] bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl shadow-black/50 py-3 px-4"
                style={{ top: "calc(100% + 8px)", right: 0, minWidth: "220px" }}
              >
                <div className="flex flex-col gap-3">
                  {/* Distance */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider" style={{ fontSize: "10px" }}>Distance</span>
                    <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/50 rounded-md px-2 py-1">
                      <input
                        type="number"
                        value={distanceValue}
                        placeholder="∞"
                        onChange={(e) => setDistanceValue(e.target.value)}
                        className="bg-transparent text-white font-bold text-center outline-none border-none"
                        style={{ width: "5ch", fontSize: "12px", MozAppearance: "textfield", WebkitAppearance: "none" } as any}
                      />
                      <span className="text-slate-500 font-bold" style={{ fontSize: "9px" }}>MI</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-700/30" />

                  {/* Public */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                      <Globe className="text-emerald-400" style={{ width: "12px", height: "12px" }} />
                      <span className="text-slate-400 font-semibold uppercase tracking-wider" style={{ fontSize: "10px" }}>Public</span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/50 rounded-md px-2 py-1">
                      <Search className="text-slate-500" style={{ width: "11px", height: "11px" }} />
                      <input
                        type="text"
                        placeholder="Search..."
                        className="bg-transparent text-white text-xs outline-none border-none placeholder:text-slate-600"
                        style={{ width: "70px" }}
                      />
                    </div>
                  </div>

                  {/* Private */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                      <Lock className="text-amber-400" style={{ width: "12px", height: "12px" }} />
                      <span className="text-slate-400 font-semibold uppercase tracking-wider" style={{ fontSize: "10px" }}>Private</span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/50 rounded-md px-2 py-1">
                      <Search className="text-slate-500" style={{ width: "11px", height: "11px" }} />
                      <input
                        type="text"
                        placeholder="Search..."
                        className="bg-transparent text-white text-xs outline-none border-none placeholder:text-slate-600"
                        style={{ width: "70px" }}
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                      <Tag className="text-blue-400" style={{ width: "12px", height: "12px" }} />
                      <span className="text-slate-400 font-semibold uppercase tracking-wider" style={{ fontSize: "10px" }}>Tags</span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/50 rounded-md px-2 py-1">
                      <Search className="text-slate-500" style={{ width: "11px", height: "11px" }} />
                      <input
                        type="text"
                        placeholder="Search..."
                        className="bg-transparent text-white text-xs outline-none border-none placeholder:text-slate-600"
                        style={{ width: "70px" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════ Main Content: Map ═══════ */}
      <div className="fixed left-0 right-0 flex flex-col" style={{ top: "84px", bottom: "60px" }}>
        <div className="flex-1 relative overflow-hidden">
          <Map />
        </div>
      </div>

      <BottomNavigation />
    </PageTransition>
  );
}
