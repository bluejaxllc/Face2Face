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
    <header className="flex justify-between items-center py-1.5 px-2 border-b border-gray-200 bg-white z-10" style={{height: "40px"}}>
      <div className="flex items-center">
        <span className="text-lg font-bold logo-text">
          <span className="bump">Bump</span>
          <span className="and">&</span>
          <span className="grind">Grind</span>
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        <button 
          onClick={() => setShowSettings(true)}
          className="relative p-1"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4 text-gray-500" />
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(true)}
            className="relative p-1"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 text-gray-500" />
            {/* Show notification dot only if there are unread notifications */}
            <span className="notification-dot status-active" style={{width: "6px", height: "6px", top: "0px", right: "0px"}}></span>
          </button>
        </div>
        
        <div onClick={() => navigate('/profile')} className="cursor-pointer">
          <Avatar className="h-6 w-6">
            <AvatarImage src="" alt={user?.username || "User"} />
            <AvatarFallback>{getInitials(user?.firstName, user?.lastName)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showNotifications && <NotificationsModal onClose={() => setShowNotifications(false)} />}
    </header>
  );
}
