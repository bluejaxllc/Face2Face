import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Settings } from "lucide-react";
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
    <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 flex justify-between items-center z-[9999] fixed top-0 left-0 right-0" style={{ height: "44px", padding: "0 12px" }}>
      <div className="flex items-center">
        <span className="font-black tracking-tight" style={{ fontSize: "16px" }}>
          <span className="text-white">Face</span>
          <span className="text-pink-500">2</span>
          <span className="text-white">Face</span>
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
              <AvatarImage src="" alt={user?.username || "User"} />
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
