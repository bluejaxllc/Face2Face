import { Link, useLocation } from "wouter";
import { Map, MessageSquare, User, Compass } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function BottomNavigation() {
  const [location] = useLocation();
  
  // Get unread message count
  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["/api/messages/unread-count"],
    onError: () => {
      // Silently fail and default to 0
    },
  });

  return (
    <nav className="bg-white border-t border-gray-200 py-2 px-6 z-10">
      <div className="flex justify-between items-center">
        <Link href="/explore">
          <a className="flex flex-col items-center">
            <Compass className={`h-5 w-5 ${location === "/explore" ? "text-secondary" : "text-gray-500"}`} />
            <span className={`text-xs mt-1 ${location === "/explore" ? "text-secondary" : "text-gray-500"}`}>Explore</span>
          </a>
        </Link>
        
        <Link href="/map">
          <a className="flex flex-col items-center">
            <Map className={`h-5 w-5 ${location === "/map" ? "text-secondary" : "text-gray-500"}`} />
            <span className={`text-xs mt-1 ${location === "/map" ? "text-secondary" : "text-gray-500"}`}>Map</span>
          </a>
        </Link>
        
        <Link href="/messages">
          <a className="flex flex-col items-center relative">
            <MessageSquare className={`h-5 w-5 ${location === "/messages" ? "text-secondary" : "text-gray-500"}`} />
            <span className={`text-xs mt-1 ${location === "/messages" ? "text-secondary" : "text-gray-500"}`}>Messages</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-status-alert text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </a>
        </Link>
        
        <Link href="/profile">
          <a className="flex flex-col items-center">
            <User className={`h-5 w-5 ${location === "/profile" ? "text-secondary" : "text-gray-500"}`} />
            <span className={`text-xs mt-1 ${location === "/profile" ? "text-secondary" : "text-gray-500"}`}>Profile</span>
          </a>
        </Link>
      </div>
    </nav>
  );
}
