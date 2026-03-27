import { useLocation } from "wouter";
import { Map, MessageSquare, User, Compass } from "lucide-react";

export default function BottomNavigation() {
  const [location, navigate] = useLocation();
  const unreadCount = 0;

  const navigateTo = (path: string) => () => {
    navigate(path);
  };

  const navItems = [
    { path: "/explore", icon: Compass, label: "Explore" },
    { path: "/map", icon: Map, label: "Map" },
    { path: "/messages", icon: MessageSquare, label: "Messages", badge: unreadCount },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="bg-slate-900/80 backdrop-blur-xl border-t border-slate-800/80 fixed bottom-0 left-0 right-0 z-[9999]" style={{ height: "calc(48px + env(safe-area-inset-bottom, 0px))", paddingBottom: "env(safe-area-inset-bottom, 0px)", padding: "4px 8px" }}>
      <div className="flex justify-around items-center max-w-screen-lg mx-auto h-full">
        {navItems.map(({ path, icon: Icon, label, badge }) => {
          const isActive = location === path;
          return (
            <div
              key={path}
              onClick={navigateTo(path)}
              className="flex flex-col items-center justify-center cursor-pointer transition-all duration-200 relative"
              style={{ minWidth: "56px", padding: "4px 8px" }}
            >
              <div className={`relative ${isActive ? 'transform scale-110' : ''} transition-transform duration-200`}>
                <Icon
                  className={isActive ? "text-blue-400" : "text-slate-500"}
                  style={{ width: "20px", height: "20px" }}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                {badge && badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white font-bold rounded-full flex items-center justify-center" style={{ fontSize: "7px", height: "14px", width: "14px" }}>
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span
                className={`font-medium transition-colors duration-200 ${isActive ? "text-blue-400" : "text-slate-500"}`}
                style={{ fontSize: "9px", marginTop: "2px" }}
              >
                {label}
              </span>
              {isActive && (
                <div className="absolute -top-0.5 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
