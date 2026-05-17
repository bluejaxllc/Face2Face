import { useState, useRef, useEffect } from "react";
import { PageTransition } from "@/components/PageTransition";
import BottomNavigation from "@/components/BottomNavigation";
import Map from "@/components/Map";
import { MessageSquare, Settings, ChevronDown, Search, MapPin, Zap, Tag } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type TabKey = "map" | "messages" | "settings";

// Placeholder contacts for layout
const placeholderContacts = [
  { id: 1, name: "Sarah M.", initials: "SM", lastMsg: "Hey! Are you nearby?", time: "2m" },
  { id: 2, name: "Jake R.", initials: "JR", lastMsg: "👋 Bumped you!", time: "15m" },
  { id: 3, name: "Mia L.", initials: "ML", lastMsg: "Let's meet up!", time: "1h" },
  { id: 4, name: "Carlos D.", initials: "CD", lastMsg: "Thanks for connecting", time: "3h" },
];

export default function Messages() {
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
            <Zap className="text-fuchsia-400" style={{ width: "18px", height: "18px" }} />
            <h1 className="font-bold text-white tracking-tight" style={{ fontSize: "16px" }}>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-pink-400 to-rose-400">Bumps / Messages</span>
              <span className="text-slate-400 font-normal ml-1.5" style={{ fontSize: "12px" }}>View</span>
            </h1>
          </div>
        </div>

        {/* Tab bar — centered */}
        <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-700/30 w-full flex items-center justify-center px-3 gap-2" style={{ height: "40px" }}>
          <button
            onClick={() => { setActiveTab("map"); setShowSettingsDropdown(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
              activeTab === "map"
                ? "bg-fuchsia-500/15 text-fuchsia-400 ring-1 ring-fuchsia-500/30"
                : "text-slate-400 hover:text-slate-300 hover:bg-white/5"
            }`}
          >
            <MapPin style={{ width: "13px", height: "13px" }} />
            <span className="font-semibold uppercase tracking-wider" style={{ fontSize: "10px" }}>Bumps Map</span>
          </button>

          <button
            onClick={() => { setActiveTab("messages"); setShowSettingsDropdown(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
              activeTab === "messages"
                ? "bg-pink-500/15 text-pink-400 ring-1 ring-pink-500/30"
                : "text-slate-400 hover:text-slate-300 hover:bg-white/5"
            }`}
          >
            <MessageSquare style={{ width: "13px", height: "13px" }} />
            <span className="font-semibold uppercase tracking-wider" style={{ fontSize: "10px" }}>Messages</span>
          </button>

          {/* Settings button with dropdown anchor */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
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

                  {/* Bumps */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                      <Zap className="text-fuchsia-400" style={{ width: "12px", height: "12px" }} />
                      <span className="text-slate-400 font-semibold uppercase tracking-wider" style={{ fontSize: "10px" }}>Bumps</span>
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

                  {/* Messages */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="text-pink-400" style={{ width: "12px", height: "12px" }} />
                      <span className="text-slate-400 font-semibold uppercase tracking-wider" style={{ fontSize: "10px" }}>Messages</span>
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

      {/* ═══════ Main Content ═══════ */}
      <div className="fixed left-0 right-0 flex flex-col" style={{ top: "84px", bottom: "60px" }}>
        {activeTab === "messages" ? (
          /* Messages list view */
          <div className="flex-1 overflow-y-auto">
            {/* Search bar */}
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 placeholder:text-slate-500 rounded-xl outline-none focus:border-pink-500/50 transition-colors"
                  style={{ fontSize: "13px" }}
                />
              </div>
            </div>

            {/* Contact list */}
            <div className="flex flex-col">
              {placeholderContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 cursor-pointer transition-colors border-b border-slate-800/30"
                >
                  <div className="relative">
                    <Avatar className="h-11 w-11">
                      <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-800 text-slate-200 text-sm font-bold">
                        {contact.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-200 text-sm">{contact.name}</p>
                      <span className="text-slate-500 flex-shrink-0" style={{ fontSize: "10px" }}>{contact.time}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{contact.lastMsg}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Map view */
          <div className="flex-1 relative overflow-hidden">
            <Map />
          </div>
        )}
      </div>

      <BottomNavigation />
    </PageTransition>
  );
}
