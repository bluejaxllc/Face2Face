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
    <header className="flex justify-between items-center border-b border-gray-200 bg-white z-[9999] fixed top-0 left-0 right-0" style={{height: "40px", padding: "0 8px"}}>
      <div className="flex items-center">
        <span className="font-bold logo-text" style={{fontSize: "14px"}}>
          <span className="bump">Bump</span>
          <span className="and">&</span>
          <span className="grind">Grind</span>
        </span>
      </div>
      
      <div className="flex items-center" style={{gap: "8px"}}>
        <button 
          onClick={() => setShowSettings(true)}
          className="relative flex items-center justify-center"
          aria-label="Settings"
          style={{padding: "3px", width: "20px", height: "20px"}}
        >
          <Settings style={{width: "14px", height: "14px"}} className="text-gray-500" />
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(true)}
            className="relative flex items-center justify-center"
            aria-label="Notifications"
            style={{padding: "3px", width: "20px", height: "20px"}}
          >
            <Bell style={{width: "14px", height: "14px"}} className="text-gray-500" />
            {/* Show notification dot only if there are unread notifications */}
            <span className="notification-dot status-active absolute" style={{width: "6px", height: "6px", top: "2px", right: "2px"}}></span>
          </button>
        </div>
        
        <div onClick={() => navigate('/profile')} className="cursor-pointer">
          <Avatar style={{width: "20px", height: "20px", fontSize: "8px"}}>
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
