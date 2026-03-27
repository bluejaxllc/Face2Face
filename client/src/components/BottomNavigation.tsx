import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Map, MessageSquare, User, Compass, Bell } from "lucide-react";

export default function BottomNavigation() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  // Fetch connected users to get total unread count
  const { data: connectedUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/bumps/users"],
    enabled: !!user,
    refetchInterval: 15000, // poll every 15s for new messages
  });
  const unreadCount = connectedUsers.reduce((sum, u) => sum + (u.unreadCount || 0), 0);
  // Fetch unread notifications
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
    refetchInterval: 15000,
  });
  const notifCount = notifications.filter((n: any) => !n.isRead).length;

  const navigateTo = (path: string) => () => {
    navigate(path);
  };

  const navItems = [
    { path: "/explore", icon: Compass, label: "Explore", badge: notifCount },
    { path: "/map", icon: Map, label: "Map" },
    { path: "/messages", icon: MessageSquare, label: "Messages", badge: unreadCount },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/50 fixed bottom-0 left-0 right-0 z-[9999]" style={{ height: "calc(52px + env(safe-area-inset-bottom, 0px))", paddingBottom: "env(safe-area-inset-bottom, 0px)", padding: "4px 8px", borderImage: "linear-gradient(90deg, rgba(59,130,246,0.2), rgba(139,92,246,0.15), rgba(236,72,153,0.2)) 1" }}>
      <div className="flex justify-around items-center max-w-screen-lg mx-auto h-full">
        {navItems.map(({ path, icon: Icon, label, badge }) => {
          const isActive = location === path;
          return (
            <div
              key={path}
              onClick={navigateTo(path)}
              className="flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative"
              style={{ minWidth: "56px", padding: "4px 8px" }}
            >
              <div className={`relative transition-all duration-300 ${isActive ? 'transform scale-110' : 'hover:scale-105'}`}>
                <Icon
                  className={`transition-colors duration-300 ${isActive ? "text-blue-400" : "text-slate-500 hover:text-slate-400"}`}
                  style={{ width: "20px", height: "20px" }}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                {isActive && (
                  <div className="absolute -inset-1.5 bg-blue-500/10 rounded-full blur-sm -z-10" />
                )}
                {badge && badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white font-bold rounded-full flex items-center justify-center shadow-lg shadow-pink-500/30" style={{ fontSize: "7px", height: "14px", width: "14px" }}>
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span
                className={`font-medium transition-all duration-300 ${isActive ? "text-blue-400" : "text-slate-500"}`}
                style={{ fontSize: "9px", marginTop: "2px" }}
              >
                {label}
              </span>
              {isActive && (
                <div className="absolute -top-0.5 w-8 h-0.5 bg-gradient-to-r from-blue-500 via-purple-400 to-pink-500 rounded-full shadow-sm shadow-blue-500/50" />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
