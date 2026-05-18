import { useState } from "react";
import { PageTransition } from "@/components/PageTransition";
import BottomNavigation from "@/components/BottomNavigation";
import { Search, Zap } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type TabKey = "bumps" | "messages" | "settings";

// Placeholder bumps
const placeholderBumps = [
  { id: 1, name: "Sarah M.", initials: "SM", message: "Bumped you from 0.3 mi away!", time: "2m", gender: "female" },
  { id: 2, name: "Jake R.", initials: "JR", message: "Hey! Bumped you 👋", time: "15m", gender: "male" },
  { id: 3, name: "Mia L.", initials: "ML", message: "Wants to meet up!", time: "1h", gender: "female" },
  { id: 4, name: "Carlos D.", initials: "CD", message: "Bumped you twice!", time: "3h", gender: "male" },
  { id: 5, name: "Priya K.", initials: "PK", message: "Nearby bump!", time: "5h", gender: "female" },
];

// Placeholder messages
const placeholderMessages = [
  { id: 1, name: "Sarah M.", initials: "SM", lastMsg: "Hey! Are you nearby?", time: "2m", unread: true },
  { id: 2, name: "Jake R.", initials: "JR", lastMsg: "See you at the spot 🍕", time: "15m", unread: true },
  { id: 3, name: "Mia L.", initials: "ML", lastMsg: "Let's meet up!", time: "1h", unread: false },
  { id: 4, name: "Carlos D.", initials: "CD", lastMsg: "Thanks for connecting", time: "3h", unread: false },
];

export default function Messages() {
  const [activeTab, setActiveTab] = useState<TabKey>("bumps");

  const renderBumps = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <Zap className="text-rose-400" style={{ width: "16px", height: "16px" }} />
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
          {placeholderBumps.length} Bumps Received
        </span>
      </div>
      <div className="flex flex-col">
        {placeholderBumps.map((bump) => (
          <div key={bump.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-800/40 cursor-pointer transition-colors border-b border-slate-800/20">
            <div className="relative">
              <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-offset-slate-900" style={{ ['--tw-ring-color' as any]: bump.gender === 'female' ? '#ec4899' : '#3b82f6' }}>
                <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-800 text-slate-100 text-sm font-bold">
                  {bump.initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-rose-500 border-2 border-slate-900 flex items-center justify-center">
                <Zap style={{ width: "10px", height: "10px" }} className="text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-100 text-sm">{bump.name}</p>
                <span className="text-slate-500 flex-shrink-0" style={{ fontSize: "11px" }}>{bump.time}</span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">{bump.message}</p>
            </div>
            <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-colors">
              <Zap className="text-rose-400" style={{ width: "12px", height: "12px" }} />
              <span className="text-rose-400 font-semibold" style={{ fontSize: "10px" }}>BUMP</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="p-3 px-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/40 text-slate-200 placeholder:text-slate-500 rounded-xl outline-none focus:border-rose-500/40 transition-colors"
            style={{ fontSize: "13px" }}
          />
        </div>
      </div>
      <div className="flex flex-col">
        {placeholderMessages.map((contact) => (
          <div key={contact.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-800/40 cursor-pointer transition-colors border-b border-slate-800/20">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-800 text-slate-100 text-sm font-bold">
                  {contact.initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm ${contact.unread ? "font-bold text-white" : "font-semibold text-slate-300"}`}>
                  {contact.name}
                </p>
                <span className={`flex-shrink-0 ${contact.unread ? "text-rose-400 font-semibold" : "text-slate-500"}`} style={{ fontSize: "11px" }}>
                  {contact.time}
                </span>
              </div>
              <p className={`text-xs truncate mt-0.5 ${contact.unread ? "text-slate-200" : "text-slate-400"}`}>
                {contact.lastMsg}
              </p>
            </div>
            {contact.unread && (
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="flex-1 overflow-y-auto px-5 pt-4">
      <div className="space-y-3">
        {[
          { label: "Push Notifications", defaultOn: true },
          { label: "Haptic Feedback", defaultOn: true },
          { label: "Dark Mode", defaultOn: true },
          { label: "Show on Map", defaultOn: true },
          { label: "Sound Effects", defaultOn: false },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between bg-slate-800/40 rounded-xl px-4 py-3.5 border border-slate-700/30">
            <span className="text-sm font-medium text-slate-300">{item.label}</span>
            <button
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                item.defaultOn ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                item.defaultOn ? 'translate-x-[22px]' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        ))}

        <div className="border-t border-slate-700/40 pt-4 mt-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Account</span>
          <div className="mt-3 space-y-2">
            <button className="w-full text-left px-4 py-3 bg-slate-800/40 rounded-xl border border-slate-700/30 hover:bg-slate-700/40 transition-colors">
              <span className="text-sm font-medium text-slate-300">Edit Profile</span>
            </button>
            <button className="w-full text-left px-4 py-3 bg-slate-800/40 rounded-xl border border-slate-700/30 hover:bg-slate-700/40 transition-colors">
              <span className="text-sm font-medium text-slate-300">Privacy & Safety</span>
            </button>
            <button className="w-full text-left px-4 py-3 bg-slate-800/40 rounded-xl border border-rose-500/20 hover:bg-rose-500/10 transition-colors">
              <span className="text-sm font-medium text-rose-400">Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <PageTransition className="h-screen w-full page-dark relative overflow-hidden">
      {/* ═══════ Header ═══════ */}
      <div className="fixed top-0 left-0 right-0 z-[9999]" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        {/* Title row */}
        <div className="bg-slate-900/95 backdrop-blur-md w-full px-5 flex items-end" style={{ height: "52px", paddingBottom: "6px" }}>
          <h1 className="font-extrabold text-white tracking-tight" style={{ fontSize: "26px", lineHeight: 1 }}>
            Bumps
          </h1>
        </div>

        {/* Tab selector — three tabs with dividers */}
        <div className="bg-slate-900/95 backdrop-blur-md w-full flex items-stretch border-b border-slate-700/40" style={{ height: "42px" }}>
          {(["bumps", "messages", "settings"] as TabKey[]).map((tab, i) => (
            <div key={tab} className="contents">
              {i > 0 && <div className="w-px bg-slate-700/50 self-center" style={{ height: "18px" }} />}
              <button
                onClick={() => setActiveTab(tab)}
                className="flex-1 flex items-center justify-center relative transition-colors duration-200"
              >
                <span
                  className={`font-semibold tracking-wide capitalize transition-colors duration-200 ${
                    activeTab === tab ? "text-white" : "text-slate-500"
                  }`}
                  style={{ fontSize: "14px" }}
                >
                  {tab}
                </span>
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-rose-400 rounded-full" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════ Main Content ═══════ */}
      <div className="fixed left-0 right-0 flex flex-col" style={{ top: "94px", bottom: "60px" }}>
        {activeTab === "bumps" && renderBumps()}
        {activeTab === "messages" && renderMessages()}
        {activeTab === "settings" && renderSettings()}
      </div>

      <BottomNavigation />
    </PageTransition>
  );
}
