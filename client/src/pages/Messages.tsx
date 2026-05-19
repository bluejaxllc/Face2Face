import { useState, useEffect } from "react";
import { useScrollSave } from "@/hooks/use-scroll-save";
import { PageTransition } from "@/components/PageTransition";
import BottomNavigation from "@/components/BottomNavigation";
import { Search, Zap } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type PrimaryMode = "bumps" | "messages";
type BumpSubTab = "list" | "settings";

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
  const [primaryMode, setPrimaryMode] = useState<PrimaryMode>(() => 
    (localStorage.getItem("f2f_messages_primaryMode") as PrimaryMode) || "bumps"
  );
  const [bumpTab, setBumpTab] = useState<BumpSubTab>(() => 
    (localStorage.getItem("f2f_messages_bumpTab") as BumpSubTab) || "list"
  );

  useEffect(() => {
    localStorage.setItem("f2f_messages_primaryMode", primaryMode);
    localStorage.setItem("f2f_messages_bumpTab", bumpTab);
  }, [primaryMode, bumpTab]);

  const bumpsScroll = useScrollSave("f2f_msgs_scroll_bumps");
  const settingsScroll = useScrollSave("f2f_msgs_scroll_settings");
  const messagesScroll = useScrollSave("f2f_msgs_scroll_messages");

  // Settings State
  const [pushNotifs, setPushNotifs] = useState(true);
  const [haptic, setHaptic] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [showOnMap, setShowOnMap] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);

  const renderBumpsList = () => (
    <div {...bumpsScroll} onScroll={bumpsScroll.onScroll} className="flex-1 overflow-y-auto w-full">
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <Zap className="text-rose-400" style={{ width: "16px", height: "16px" }} />
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
          {placeholderBumps.length} Bumps Received
        </span>
      </div>
      <div className="flex flex-col">
        {placeholderBumps.map((bump) => (
          <div key={bump.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-800/40 cursor-pointer transition-colors border-b border-slate-700/50">
            <div className="relative">
              <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-offset-slate-950" style={{ ['--tw-ring-color' as any]: bump.gender === 'female' ? '#ec4899' : '#3b82f6' }}>
                <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-800 text-slate-100 text-sm font-bold">
                  {bump.initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-rose-500 border-2 border-slate-950 flex items-center justify-center">
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

  const renderSettings = () => (
    <div {...settingsScroll} onScroll={settingsScroll.onScroll} className="flex-1 overflow-y-auto w-full text-slate-300">
      <div className="flex flex-col w-full">
        {/* Toggle Settings */}
        {[
          { label: "push notifications", state: pushNotifs, setter: setPushNotifs },
          { label: "haptic feedback", state: haptic, setter: setHaptic },
          { label: "dark mode", state: darkMode, setter: setDarkMode },
          { label: "show on map", state: showOnMap, setter: setShowOnMap },
          { label: "sound effects", state: soundEffects, setter: setSoundEffects },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
            <span className="lowercase font-bold tracking-wide">{item.label}</span>
            <button 
              onClick={() => item.setter(!item.state)} 
              className={`text-sm lowercase font-medium transition-colors ${item.state ? 'text-purple-400' : 'text-slate-600'}`}
            >
              {item.state ? 'yes' : 'no'}
            </button>
          </div>
        ))}

        {/* Account Divider */}
        <div className="w-full border-b border-slate-700/50 py-3 mt-4 mb-2 bg-slate-900/40">
          <h2 className="px-5 lowercase font-bold tracking-wide text-slate-500">account</h2>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 cursor-pointer hover:bg-slate-800/30 transition-colors">
          <span className="lowercase font-bold tracking-wide">edit profile</span>
          <span className="text-slate-500 text-sm">{'>'}</span>
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 cursor-pointer hover:bg-slate-800/30 transition-colors">
          <span className="lowercase font-bold tracking-wide">privacy & safety</span>
          <span className="text-slate-500 text-sm">{'>'}</span>
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 cursor-pointer hover:bg-rose-500/10 transition-colors">
          <span className="lowercase font-bold tracking-wide text-rose-500">log out</span>
          <span className="text-rose-500/50 text-sm">{'>'}</span>
        </div>
      </div>
    </div>
  );

  const renderMessages = () => (
    <div {...messagesScroll} onScroll={messagesScroll.onScroll} className="flex-1 overflow-y-auto w-full">
      <div className="px-5 py-3 bg-slate-900/40 border-b border-slate-700/50">
        <div className="flex items-center bg-transparent border-b border-slate-600 pb-1">
          <Search className="text-slate-500 w-4 h-4 mr-2" />
          <input
            type="text"
            placeholder="search conversations"
            className="bg-transparent w-full outline-none text-white placeholder:text-slate-500 text-sm lowercase font-medium"
          />
        </div>
      </div>
      <div className="flex flex-col">
        {placeholderMessages.map((contact) => (
          <div key={contact.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-800/40 cursor-pointer transition-colors border-b border-slate-700/50">
            <div className="relative">
              <Avatar className="h-12 w-12 border border-slate-700/50">
                <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-800 text-slate-100 text-sm font-bold">
                  {contact.initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm lowercase tracking-wider ${contact.unread ? "font-bold text-white tracking-wide" : "font-semibold text-slate-300"}`}>
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

  return (
    <PageTransition className="h-screen w-full page-dark relative overflow-hidden bg-slate-950">
      {/* ═══════ Primary Header: Bumps / Messages ═══════ */}
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="w-full flex items-center justify-center pt-4 pb-4">
          <button 
            onClick={() => setPrimaryMode("bumps")}
            className="px-2 relative group pb-1 mr-3"
          >
            <span className={`text-[22px] font-extrabold tracking-tight transition-colors ${primaryMode === "bumps" ? "text-white" : "text-slate-500"}`}>Bumps</span>
            {primaryMode === "bumps" && (
              <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-white rounded-full translate-y-1 mx-2" />
            )}
          </button>
          <span className="text-slate-600 font-light text-[22px]">/</span>
          <button 
            onClick={() => setPrimaryMode("messages")}
            className="px-2 relative group pb-1 ml-3"
          >
            <span className={`text-[22px] font-extrabold tracking-tight transition-colors ${primaryMode === "messages" ? "text-white" : "text-slate-500"}`}>Messages</span>
            {primaryMode === "messages" && (
              <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-white rounded-full translate-y-1 mx-2" />
            )}
          </button>
        </div>

        {/* ═══════ Sub-tabs (Only visible in Bumps Mode) ═══════ */}
        {primaryMode === "bumps" && (
          <div className="w-full flex border-t border-slate-800/50 h-[44px]">
            <button 
              onClick={() => setBumpTab("list")}
              className="flex-1 flex items-center justify-center relative"
            >
              <span className={`text-sm font-semibold tracking-wide ${bumpTab === "list" ? "text-white" : "text-slate-500"}`}>Bumpslist</span>
              {bumpTab === "list" && <div className="absolute bottom-0 left-8 right-8 h-[2px] bg-rose-500 rounded-t-full" />}
            </button>
            <div className="w-px bg-slate-800 self-center h-5" />
            <button 
              onClick={() => setBumpTab("settings")}
              className="flex-1 flex items-center justify-center relative"
            >
              <span className={`text-sm font-semibold tracking-wide ${bumpTab === "settings" ? "text-white" : "text-slate-500"}`}>Settings</span>
              {bumpTab === "settings" && <div className="absolute bottom-0 left-8 right-8 h-[2px] bg-rose-500 rounded-t-full" />}
            </button>
          </div>
        )}
      </div>

      {/* ═══════ Main Content Area ═══════ */}
      <div 
        className="fixed left-0 right-0 bottom-[60px] overflow-hidden" 
        style={{ top: primaryMode === "bumps" ? "106px" : "62px" }}
      >
        {primaryMode === "bumps" ? (
          bumpTab === "list" ? renderBumpsList() : renderSettings()
        ) : (
          renderMessages()
        )}
      </div>

      <BottomNavigation />
    </PageTransition>
  );
}
