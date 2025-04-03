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
    <header className="flex justify-between items-center p-4 border-b border-gray-200 bg-white z-10">
      <div className="flex items-center space-x-2">
        <span className="text-2xl font-bold logo-text">
          <span className="bump">Bump</span>
          <span className="and">&</span>
          <span className="grind">Grind</span>
        </span>
      </div>
      
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => setShowSettings(true)}
          className="relative"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5 text-gray-500" />
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(true)}
            className="relative"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-gray-500" />
            {/* Show notification dot only if there are unread notifications */}
            <span className="notification-dot status-active"></span>
          </button>
        </div>
        
        <div onClick={() => navigate('/profile')} className="cursor-pointer">
          <Avatar className="h-8 w-8">
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
