import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Map, User, Compass, Bell } from "lucide-react";

export default function BottomNavigation() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

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
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-[9999] px-4 pointer-events-none w-full flex justify-center" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <nav className="bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 shadow-2xl shadow-blue-900/20 rounded-full w-full max-w-[340px] pointer-events-auto" style={{ height: "64px", padding: "4px 8px" }}>
        <div className="flex justify-around items-center h-full relative">
          {navItems.map(({ path, icon: Icon, label, badge }) => {
            const isActive = location === path;
            return (
              <div
                key={path}
                onClick={navigateTo(path)}
                className="flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative"
                style={{ minWidth: "56px", padding: "4px 8px" }}
              >
                <div className={`relative transition-all duration-300 ${isActive ? 'transform scale-110' : ''}`}>
                  <Icon
                    className={`transition-colors duration-300 ${isActive ? "text-blue-400" : "text-slate-500 hover:text-slate-400"}`}
                    style={{ width: "22px", height: "22px" }}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                  {isActive && (
                    <div className="absolute -inset-2 bg-blue-500/20 rounded-full blur-md -z-10" />
                  )}
                  {(badge !== undefined && badge > 0) && (
                    <span className="absolute -top-1 -right-1 bg-pink-500 text-white font-bold rounded-full flex items-center justify-center shadow-lg shadow-pink-500/30" style={{ fontSize: "8px", height: "16px", width: "16px" }}>
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </div>
                <span
                  className={`font-bold transition-all duration-300 ${isActive ? "text-blue-400 opacity-100" : "text-slate-500 opacity-80"}`}
                  style={{ fontSize: "10px", marginTop: "4px", minHeight: "15px" }}
                >
                  {label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-2 w-10 h-1 bg-gradient-to-r from-blue-500 via-purple-400 to-pink-500 rounded-full shadow-sm shadow-blue-500/50" />
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
