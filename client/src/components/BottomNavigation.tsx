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
    <nav className="bg-white border-t border-gray-200 py-1 px-2 fixed bottom-0 left-0 right-0 z-[9999] shadow-md safe-area-bottom" style={{height: "40px"}}>
      <div className="flex justify-between items-center max-w-screen-lg mx-auto h-full">
        <div 
          onClick={navigateTo("/explore")} 
          className="flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 h-full"
          style={{maxWidth: "60px"}}
        >
          <Compass className={`h-4 w-4 ${location === "/explore" ? "text-secondary" : "text-gray-500"}`} strokeWidth={location === "/explore" ? 2.5 : 2} />
          <span className={`text-[8px] font-medium ${location === "/explore" ? "text-secondary" : "text-gray-500"}`}>Explore</span>
        </div>
        
        <div 
          onClick={navigateTo("/map")} 
          className="flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 h-full"
          style={{maxWidth: "60px"}}
        >
          <Map className={`h-4 w-4 ${location === "/map" ? "text-secondary" : "text-gray-500"}`} strokeWidth={location === "/map" ? 2.5 : 2} />
          <span className={`text-[8px] font-medium ${location === "/map" ? "text-secondary" : "text-gray-500"}`}>Map</span>
        </div>
        
        <div 
          onClick={navigateTo("/messages")} 
          className="flex flex-col items-center justify-center relative cursor-pointer transition-colors duration-200 h-full"
          style={{maxWidth: "60px"}}
        >
          <MessageSquare className={`h-4 w-4 ${location === "/messages" ? "text-secondary" : "text-gray-500"}`} strokeWidth={location === "/messages" ? 2.5 : 2} />
          <span className={`text-[8px] font-medium ${location === "/messages" ? "text-secondary" : "text-gray-500"}`}>Messages</span>
          {unreadCount > 0 && (
            <span className="absolute -top-0 right-0 bg-status-alert text-white text-[6px] font-bold rounded-full h-3 w-3 flex items-center justify-center shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        
        <div 
          onClick={navigateTo("/profile")} 
          className="flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 h-full"
          style={{maxWidth: "60px"}}
        >
          <User className={`h-4 w-4 ${location === "/profile" ? "text-secondary" : "text-gray-500"}`} strokeWidth={location === "/profile" ? 2.5 : 2} />
          <span className={`text-[8px] font-medium ${location === "/profile" ? "text-secondary" : "text-gray-500"}`}>Profile</span>
        </div>
      </div>
    </nav>
  );
}
