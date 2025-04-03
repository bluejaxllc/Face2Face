import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation as useLocationContext } from "@/contexts/LocationContext";
import { useAuth } from "@/contexts/AuthContext";
import UserMarker from "./UserMarker";
import ProfileCard from "./ProfileCard";
import { calculateDistance } from "@/lib/distance";
import { Locate } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  category: string;
  isActive: boolean;
  latitude: number;
  longitude: number;
  height: string | null;
  weight: string | null;
  selfRating: number;
}

export default function Map() {
  const { currentLocation, updateLocation } = useLocationContext();
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBump, setShowBump] = useState(true);
  const [showGrind, setShowGrind] = useState(false);
  const [radius, setRadius] = useState(50);
  const [isActive, setIsActive] = useState(user?.isActive || true);

  // Fetch nearby users
  const { data: nearbyUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users/nearby", { radius, category: showBump && showGrind ? "both" : showBump ? "bump" : "grind" }],
    enabled: !!currentLocation && isActive,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Filter users based on category
  const filteredUsers = nearbyUsers.filter(nearbyUser => {
    if (showBump && showGrind) return true;
    if (showBump && nearbyUser.category === "bump") return true;
    if (showGrind && nearbyUser.category === "grind") return true;
    return false;
  });

  // Handle status toggle
  const handleStatusToggle = async (checked: boolean) => {
    setIsActive(checked);
    
    try {
      await updateProfile({ isActive: checked });
    } catch (error) {
      console.error("Failed to update status:", error);
      toast({
        title: "Status update failed",
        description: "Failed to update your active status",
        variant: "destructive",
      });
    }
  };

  // Handle bump click (category toggle)
  const handleBumpClick = () => {
    if (!showBump && !showGrind) {
      // At least one category must be selected
      setShowBump(true);
    } else {
      setShowBump(!showBump);
    }
  };

  // Handle grind click (category toggle)
  const handleGrindClick = () => {
    if (!showBump && !showGrind) {
      // At least one category must be selected
      setShowGrind(true);
    } else {
      setShowGrind(!showGrind);
    }
  };

  // Handle user marker click
  const handleMarkerClick = (user: User) => {
    setSelectedUser(user);
  };

  // Handle bump with another user
  const handleBumpUser = async () => {
    if (!selectedUser) return;
    
    try {
      await apiRequest("POST", "/api/bumps", {
        bumpedUserId: selectedUser.id,
      });
      
      toast({
        title: "Bump successful!",
        description: `You bumped into ${selectedUser.firstName}!`,
      });
    } catch (error) {
      console.error("Failed to bump user:", error);
      toast({
        title: "Bump failed",
        description: "Failed to bump into this user",
        variant: "destructive",
      });
    }
  };

  // Calculate user positions on the map (this is a simplified version for the MVP)
  const calculatePosition = (user: User, index: number) => {
    if (!currentLocation) return { top: "50%", left: "50%" };
    
    // For the MVP, we'll just randomly position users around the current location
    // In a real app, this would be based on actual geocoordinates
    const angle = (index * 45) % 360;
    const distance = Math.random() * 30 + 10; // 10-40% from center
    
    const top = 50 + Math.sin(angle * Math.PI / 180) * distance;
    const left = 50 + Math.cos(angle * Math.PI / 180) * distance;
    
    return {
      top: `${top}%`,
      left: `${left}%`
    };
  };

  return (
    <div className="flex-1 relative overflow-hidden">
      <div className="map-container">
        {/* User markers */}
        {filteredUsers.map((user, index) => (
          <UserMarker
            key={user.id}
            user={user}
            position={calculatePosition(user, index)}
            onClick={() => handleMarkerClick(user)}
          />
        ))}
        
        {/* Current location button */}
        <button 
          className="absolute bottom-24 right-4 bg-white p-2 rounded-full shadow-lg"
          onClick={updateLocation}
          aria-label="Get current location"
        >
          <Locate className="h-5 w-5 text-secondary" />
        </button>
        
        {/* Radius indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white py-1 px-3 rounded-full shadow-lg text-sm font-medium text-gray-700">
          Radius: {radius} miles
        </div>
      </div>
      
      {/* Status toggle */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white py-2 px-4 rounded-full shadow-lg flex items-center space-x-2">
        <span className={`text-sm font-medium ${isActive ? "text-status-active" : "text-status-inactive"}`}>
          {isActive ? "Active" : "Inactive"}
        </span>
        <Switch 
          checked={isActive} 
          onCheckedChange={handleStatusToggle} 
          aria-label="Active status"
        />
      </div>
      
      {/* Category toggle */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg flex overflow-hidden">
        <Button
          variant={showBump ? "default" : "outline"}
          className={`px-4 py-2 text-sm font-medium ${showBump ? "bg-secondary text-white" : ""}`}
          onClick={handleBumpClick}
        >
          Bump
        </Button>
        <Button
          variant={showGrind ? "default" : "outline"}
          className={`px-4 py-2 text-sm font-medium ${showGrind ? "bg-primary text-white" : ""}`}
          onClick={handleGrindClick}
        >
          Grind
        </Button>
      </div>
      
      {/* User profile card */}
      {selectedUser && (
        <ProfileCard 
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onBump={handleBumpUser}
          distance={
            currentLocation 
              ? calculateDistance(
                  currentLocation.latitude, 
                  currentLocation.longitude, 
                  selectedUser.latitude, 
                  selectedUser.longitude
                )
              : null
          }
        />
      )}
    </div>
  );
}
