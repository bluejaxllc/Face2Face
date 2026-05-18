import { useState } from "react";
import { PageTransition } from "@/components/PageTransition";
import BottomNavigation from "@/components/BottomNavigation";
import Map from "@/components/Map";
import { Search, MapPin, Globe, Lock, Tag } from "lucide-react";

type TabKey = "groupsmap" | "settings";

export default function Explore() {
  const [activeTab, setActiveTab] = useState<TabKey>("groupsmap");
  const [distanceValue, setDistanceValue] = useState("");

  return (
    <PageTransition className="h-screen w-full page-dark relative overflow-hidden">
      {/* ═══════ Header ═══════ */}
      <div
        className="fixed top-0 left-0 right-0 z-[9999]"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {/* Title row */}
        <div
          className="bg-slate-900/95 backdrop-blur-md w-full px-5 flex items-end"
          style={{ height: "52px", paddingBottom: "6px" }}
        >
          <h1
            className="font-extrabold text-white tracking-tight"
            style={{ fontSize: "26px", lineHeight: 1 }}
          >
            Groups / List view
          </h1>
        </div>

        {/* Tab selector — two tabs with divider */}
        <div className="bg-slate-900/95 backdrop-blur-md w-full flex items-stretch border-b border-slate-700/40" style={{ height: "42px" }}>
          <button
            onClick={() => setActiveTab("groupsmap")}
            className="flex-1 flex items-center justify-center relative transition-colors duration-200"
          >
            <span
              className={`font-semibold tracking-wide transition-colors duration-200 ${
                activeTab === "groupsmap" ? "text-white" : "text-slate-500"
              }`}
              style={{ fontSize: "14px" }}
            >
              Groups Map
            </span>
            {activeTab === "groupsmap" && (
              <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-purple-400 rounded-full" />
            )}
          </button>

          {/* Divider */}
          <div className="w-px bg-slate-700/50 self-center" style={{ height: "18px" }} />

          <button
            onClick={() => setActiveTab("settings")}
            className="flex-1 flex items-center justify-center relative transition-colors duration-200"
          >
            <span
              className={`font-semibold tracking-wide transition-colors duration-200 ${
                activeTab === "settings" ? "text-white" : "text-slate-500"
              }`}
              style={{ fontSize: "14px" }}
            >
              Settings
            </span>
            {activeTab === "settings" && (
              <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-purple-400 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* ═══════ Main Content ═══════ */}
      <div className="fixed left-0 right-0 flex flex-col" style={{ top: "94px", bottom: "60px" }}>
        {activeTab === "settings" ? (
          /* ═══ Settings Tab ═══ */
          <div className="flex-1 overflow-y-auto px-5 pt-4">
            <div className="space-y-4">
              {/* Distance */}
              <div className="bg-slate-800/40 rounded-xl px-4 py-3.5 border border-slate-700/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">Distance</span>
                  <div className="flex items-center gap-1.5 bg-slate-950/80 border border-white/10 rounded-lg px-3 py-1.5">
                    <input
                      type="number"
                      value={distanceValue}
                      placeholder="∞"
                      onChange={(e) => setDistanceValue(e.target.value)}
                      className="bg-transparent text-white font-bold text-center outline-none border-none"
                      style={{ width: "5ch", fontSize: "14px", MozAppearance: "textfield", WebkitAppearance: "none" } as any}
                    />
                    <span className="text-slate-500 font-bold text-xs">MI</span>
                  </div>
                </div>
              </div>

              {/* Public groups search */}
              <div className="bg-slate-800/40 rounded-xl px-4 py-3.5 border border-slate-700/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="text-emerald-400" style={{ width: "16px", height: "16px" }} />
                    <span className="text-sm font-medium text-slate-300">Public</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-950/80 border border-white/10 rounded-lg px-3 py-1.5">
                    <Search className="text-slate-500" style={{ width: "13px", height: "13px" }} />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="bg-transparent text-white text-xs outline-none border-none placeholder:text-slate-500"
                      style={{ width: "80px" }}
                    />
                  </div>
                </div>
              </div>

              {/* Private groups search */}
              <div className="bg-slate-800/40 rounded-xl px-4 py-3.5 border border-slate-700/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="text-amber-400" style={{ width: "16px", height: "16px" }} />
                    <span className="text-sm font-medium text-slate-300">Private</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-950/80 border border-white/10 rounded-lg px-3 py-1.5">
                    <Search className="text-slate-500" style={{ width: "13px", height: "13px" }} />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="bg-transparent text-white text-xs outline-none border-none placeholder:text-slate-500"
                      style={{ width: "80px" }}
                    />
                  </div>
                </div>
              </div>

              {/* Tags search */}
              <div className="bg-slate-800/40 rounded-xl px-4 py-3.5 border border-slate-700/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="text-blue-400" style={{ width: "16px", height: "16px" }} />
                    <span className="text-sm font-medium text-slate-300">Tags</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-950/80 border border-white/10 rounded-lg px-3 py-1.5">
                    <Search className="text-slate-500" style={{ width: "13px", height: "13px" }} />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="bg-transparent text-white text-xs outline-none border-none placeholder:text-slate-500"
                      style={{ width: "80px" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ═══ Groups Map Tab ═══ */
          <div className="flex-1 relative overflow-hidden">
            <Map />
          </div>
        )}
      </div>

      <BottomNavigation />
    </PageTransition>
  );
}
