import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Map, Flame, MessageSquare, Users, User } from "lucide-react";
import { triggerHaptic, triggerHapticPattern } from "@/services/haptics-service";
import { useEffect, useRef } from "react";

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

  const previousNotifCount = useRef(notifCount);

  useEffect(() => {
    if (notifCount > previousNotifCount.current) {
      triggerHaptic(100);
      setTimeout(() => triggerHapticPattern([50, 100, 50]), 200);
    }
    previousNotifCount.current = notifCount;
  }, [notifCount]);

  const navigateTo = (path: string) => () => {
    navigate(path);
  };

  const navItems = [
    { path: "/dating", icon: Calendar, label: "DATING" },
    { path: "/map", icon: Map, label: "MAP" },
    { path: "/bumps", icon: Flame, label: "BUMPS" },
    { path: "/messages", icon: MessageSquare, label: "BUMP/MES...", badge: notifCount },
    { path: "/explore", icon: Users, label: "GROUP/LIST" },
    { path: "/profile", icon: User, label: "PROFILE" },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] bg-slate-950/95 border-t border-slate-700/50 pointer-events-auto flex justify-center backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <nav className="w-full max-w-lg mx-auto" style={{ height: "56px" }}>
        <div className="flex justify-around items-center h-full relative px-1">
          {navItems.map(({ path, icon: Icon, label, badge }) => {
            const isActive = location === path || (path === "/map" && location === "/");
            return (
              <div
                key={path}
                onClick={navigateTo(path)}
                className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-200 relative ${
                  isActive ? "opacity-100" : "opacity-60 hover:opacity-80"
                }`}
                style={{ minWidth: "48px", padding: "4px 2px" }}
              >
                <div className="relative">
                  {isActive && (
                    <div className="absolute -inset-3 bg-indigo-500/15 rounded-xl -z-10" />
                  )}
                  <Icon
                    className={`transition-colors duration-200 ${
                      isActive ? "text-indigo-400" : "text-slate-400"
                    }`}
                    style={{ width: "20px", height: "20px" }}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                  {(badge !== undefined && badge > 0) && (
                    <span
                      className="absolute -top-1 -right-2 bg-pink-500 text-white font-bold rounded-full flex items-center justify-center shadow-lg shadow-pink-500/30"
                      style={{ fontSize: "7px", height: "14px", width: "14px" }}
                    >
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </div>
                <span
                  className={`font-semibold tracking-wider uppercase transition-colors duration-200 ${
                    isActive ? "text-indigo-400" : "text-slate-500"
                  }`}
                  style={{ fontSize: "8px", marginTop: "3px", lineHeight: "1", whiteSpace: "nowrap" }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
