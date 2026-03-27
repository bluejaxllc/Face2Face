import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Settings } from "lucide-react";
import { Logo } from "./Logo";
import SettingsModal from "./SettingsModal";
import NotificationsModal from "./NotificationsModal";

export default function Header() {
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [, navigate] = useLocation();

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return "U";
    return `${firstName[0]}${lastName[0]}`;
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/50 flex justify-between items-center z-[9999] fixed top-0 left-0 right-0" style={{ height: "48px", padding: "0 14px", borderImage: "linear-gradient(90deg, rgba(59,130,246,0.3), rgba(139,92,246,0.2), rgba(236,72,153,0.3)) 1" }}>
      <div className="flex items-center gap-2">
        <Logo className="w-6 h-5" />
        <span className="font-black tracking-tight" style={{ fontSize: "16px" }}>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-300">Face</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">2</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-300">Face</span>
        </span>
      </div>

      <div className="flex items-center" style={{ gap: "12px" }}>
        <button
          onClick={() => setShowSettings(true)}
          className="relative flex items-center justify-center hover:bg-slate-700/50 rounded-lg transition-colors"
          aria-label="Settings"
          style={{ padding: "6px" }}
        >
          <Settings style={{ width: "16px", height: "16px" }} className="text-slate-400" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(true)}
            className="relative flex items-center justify-center hover:bg-slate-700/50 rounded-lg transition-colors"
            aria-label="Notifications"
            style={{ padding: "6px" }}
          >
            <Bell style={{ width: "16px", height: "16px" }} className="text-slate-400" />
            <span className="absolute bg-blue-500 rounded-full" style={{ width: "6px", height: "6px", top: "4px", right: "4px" }}></span>
          </button>
        </div>

        <div onClick={() => navigate('/profile')} className="cursor-pointer">
          <div className="avatar-ring">
            <Avatar style={{ width: "24px", height: "24px", fontSize: "9px" }}>
              {user?.profilePhoto && <AvatarImage src={user.profilePhoto} alt={user?.username || "User"} />}
              <AvatarFallback className="bg-slate-700 text-slate-300">{getInitials(user?.firstName, user?.lastName)}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showNotifications && <NotificationsModal onClose={() => setShowNotifications(false)} />}
    </header>
  );
}
