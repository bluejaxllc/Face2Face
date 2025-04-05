import { useLocation } from "wouter";
import { Map, MessageSquare, User, Compass } from "lucide-react";

export default function BottomNavigation() {
  const [location, navigate] = useLocation();
  
  // Since the API endpoint is failing for now, we'll hardcode a zero for the demo
  // We'll replace this with actual API call once the endpoint is fixed
  const unreadCount = 0;

  // Navigation handlers
  const navigateTo = (path: string) => () => {
    navigate(path);
  };

  return (
    <nav className="bg-white border-t border-gray-200 py-3 px-6 fixed bottom-0 left-0 right-0 z-50 shadow-lg safe-area-bottom">
      <div className="flex justify-between items-center max-w-screen-lg mx-auto">
        <div 
          onClick={navigateTo("/explore")} 
          className="flex flex-col items-center cursor-pointer px-3 py-1 transition-colors duration-200"
        >
          <Compass className={`h-6 w-6 ${location === "/explore" ? "text-secondary" : "text-gray-500"}`} strokeWidth={location === "/explore" ? 2.5 : 2} />
          <span className={`text-xs mt-1 font-medium ${location === "/explore" ? "text-secondary" : "text-gray-500"}`}>Explore</span>
        </div>
        
        <div 
          onClick={navigateTo("/map")} 
          className="flex flex-col items-center cursor-pointer px-3 py-1 transition-colors duration-200"
        >
          <Map className={`h-6 w-6 ${location === "/map" ? "text-secondary" : "text-gray-500"}`} strokeWidth={location === "/map" ? 2.5 : 2} />
          <span className={`text-xs mt-1 font-medium ${location === "/map" ? "text-secondary" : "text-gray-500"}`}>Map</span>
        </div>
        
        <div 
          onClick={navigateTo("/messages")} 
          className="flex flex-col items-center relative cursor-pointer px-3 py-1 transition-colors duration-200"
        >
          <MessageSquare className={`h-6 w-6 ${location === "/messages" ? "text-secondary" : "text-gray-500"}`} strokeWidth={location === "/messages" ? 2.5 : 2} />
          <span className={`text-xs mt-1 font-medium ${location === "/messages" ? "text-secondary" : "text-gray-500"}`}>Messages</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-status-alert text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        
        <div 
          onClick={navigateTo("/profile")} 
          className="flex flex-col items-center cursor-pointer px-3 py-1 transition-colors duration-200"
        >
          <User className={`h-6 w-6 ${location === "/profile" ? "text-secondary" : "text-gray-500"}`} strokeWidth={location === "/profile" ? 2.5 : 2} />
          <span className={`text-xs mt-1 font-medium ${location === "/profile" ? "text-secondary" : "text-gray-500"}`}>Profile</span>
        </div>
      </div>
    </nav>
  );
}
