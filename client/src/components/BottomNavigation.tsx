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
    <nav className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-[9999] shadow-md safe-area-bottom bottom-nav" style={{height: "40px", padding: "2px 4px", position: "fixed", willChange: "transform"}}>
      <div className="flex justify-between items-center max-w-screen-lg mx-auto h-full">
        <div 
          onClick={navigateTo("/explore")} 
          className="flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 h-full"
          style={{minWidth: "50px", maxWidth: "50px"}}
        >
          <Compass className={`${location === "/explore" ? "text-secondary" : "text-gray-500"}`} style={{width: "16px", height: "16px"}} strokeWidth={location === "/explore" ? 2.5 : 2} />
          <span className={`font-medium ${location === "/explore" ? "text-secondary" : "text-gray-500"}`} style={{fontSize: "8px", marginTop: "-2px"}}>Explore</span>
        </div>
        
        <div 
          onClick={navigateTo("/map")} 
          className="flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 h-full"
          style={{minWidth: "50px", maxWidth: "50px"}}
        >
          <Map className={`${location === "/map" ? "text-secondary" : "text-gray-500"}`} style={{width: "16px", height: "16px"}} strokeWidth={location === "/map" ? 2.5 : 2} />
          <span className={`font-medium ${location === "/map" ? "text-secondary" : "text-gray-500"}`} style={{fontSize: "8px", marginTop: "-2px"}}>Map</span>
        </div>
        
        <div 
          onClick={navigateTo("/messages")} 
          className="flex flex-col items-center justify-center relative cursor-pointer transition-colors duration-200 h-full"
          style={{minWidth: "50px", maxWidth: "50px"}}
        >
          <MessageSquare className={`${location === "/messages" ? "text-secondary" : "text-gray-500"}`} style={{width: "16px", height: "16px"}} strokeWidth={location === "/messages" ? 2.5 : 2} />
          <span className={`font-medium ${location === "/messages" ? "text-secondary" : "text-gray-500"}`} style={{fontSize: "8px", marginTop: "-2px"}}>Messages</span>
          {unreadCount > 0 && (
            <span className="absolute -top-0 right-0 bg-status-alert text-white font-bold rounded-full flex items-center justify-center shadow-sm" style={{fontSize: "6px", height: "12px", width: "12px"}}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        
        <div 
          onClick={navigateTo("/profile")} 
          className="flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 h-full"
          style={{minWidth: "50px", maxWidth: "50px"}}
        >
          <User className={`${location === "/profile" ? "text-secondary" : "text-gray-500"}`} style={{width: "16px", height: "16px"}} strokeWidth={location === "/profile" ? 2.5 : 2} />
          <span className={`font-medium ${location === "/profile" ? "text-secondary" : "text-gray-500"}`} style={{fontSize: "8px", marginTop: "-2px"}}>Profile</span>
        </div>
      </div>
    </nav>
  );
}
