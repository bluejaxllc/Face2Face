import { useState, useCallback, memo, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation as useLocationContext } from "@/contexts/LocationContext";
import { useAuth } from "@/contexts/AuthContext";
import UserMarker from "./UserMarker";
import ProfileCard from "./ProfileCard";
import LocationError from "./LocationError";
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

// Create memoized components to prevent unnecessary rerenders
const StatusToggle = memo(({ 
  isActive, 
  onToggle 
}: { 
  isActive: boolean; 
  onToggle: (checked: boolean) => void;
}) => {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white py-2 px-4 rounded-full shadow-lg flex items-center space-x-2">
      <span className={`text-sm font-medium ${isActive ? "text-green-600" : "text-gray-500"}`}>
        {isActive ? "Active" : "Inactive"}
      </span>
      <Switch 
        checked={isActive} 
        onCheckedChange={onToggle} 
        aria-label="Active status"
      />
    </div>
  );
});

const CategoryToggle = memo(({
  showBump,
  showGrind,
  onBumpClick,
  onGrindClick
}: {
  showBump: boolean;
  showGrind: boolean;
  onBumpClick: () => void;
  onGrindClick: () => void;
}) => {
  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg flex overflow-hidden">
      <Button
        variant={showBump ? "default" : "outline"}
        className={`px-4 py-2 text-sm font-medium ${showBump ? "bg-secondary text-white" : ""}`}
        onClick={onBumpClick}
      >
        Bump
      </Button>
      <Button
        variant={showGrind ? "default" : "outline"}
        className={`px-4 py-2 text-sm font-medium ${showGrind ? "bg-primary text-white" : ""}`}
        onClick={onGrindClick}
      >
        Grind
      </Button>
    </div>
  );
});

function Map() {
  const { currentLocation, updateLocation, isError } = useLocationContext();
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBump, setShowBump] = useState(true);
  const [showGrind, setShowGrind] = useState(false);
  const [radius] = useState(50);
  
  // Get isActive directly from user state
  const isActive = user?.isActive ?? true;

  // Fetch nearby users
  const { data: nearbyUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users/nearby", { radius, category: showBump && showGrind ? "both" : showBump ? "bump" : "grind" }],
    enabled: !!currentLocation && isActive,
    refetchInterval: 60000, // Refetch every 60 seconds to reduce load
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Create mock users for debugging
  const mockUsers = useMemo(() => {
    if (nearbyUsers.length > 0) return [];
    
    return currentLocation ? [
      {
        id: 101,
        username: "mockuser1",
        firstName: "John",
        lastName: "B",
        category: "bump",
        isActive: true,
        latitude: currentLocation.latitude + 0.01,
        longitude: currentLocation.longitude + 0.01,
        height: "6'0\"", 
        weight: "180 lbs",
        selfRating: 4
      },
      {
        id: 102,
        username: "mockuser2",
        firstName: "Sarah",
        lastName: "G",
        category: "grind",
        isActive: true,
        latitude: currentLocation.latitude - 0.01,
        longitude: currentLocation.longitude - 0.01,
        height: "5'6\"",
        weight: "140 lbs",
        selfRating: 5
      },
      {
        id: 103,
        username: "mockuser3",
        firstName: "Alex",
        lastName: "B",
        category: "bump",
        isActive: true,
        latitude: currentLocation.latitude + 0.005,
        longitude: currentLocation.longitude - 0.007,
        height: "5'10\"",
        weight: "165 lbs",
        selfRating: 3
      }
    ] : [];
  }, [nearbyUsers, currentLocation]);

  // Filter users based on category
  const filteredUsers = [...nearbyUsers, ...mockUsers].filter(nearbyUser => {
    if (showBump && showGrind) return true;
    if (showBump && nearbyUser.category === "bump") return true;
    if (showGrind && nearbyUser.category === "grind") return true;
    return false;
  });

  // Handle status toggle - memoize to prevent recreation on every render
  const handleStatusToggle = useCallback(async (checked: boolean) => {
    try {
      await updateProfile({ isActive: checked });
      toast({
        title: "Status updated",
        description: `You are now ${checked ? 'active' : 'inactive'}`,
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      toast({
        title: "Status update failed",
        description: "Failed to update your active status",
        variant: "destructive",
      });
    }
  }, [updateProfile, toast]);

  // Handle bump click (category toggle)
  const handleBumpClick = useCallback(() => {
    if (!showBump && !showGrind) {
      // At least one category must be selected
      setShowBump(true);
    } else {
      setShowBump(!showBump);
    }
  }, [showBump, showGrind]);

  // Handle grind click (category toggle)
  const handleGrindClick = useCallback(() => {
    if (!showBump && !showGrind) {
      // At least one category must be selected
      setShowGrind(true);
    } else {
      setShowGrind(!showGrind);
    }
  }, [showBump, showGrind]);

  // Handle user marker click
  const handleMarkerClick = useCallback((user: User) => {
    setSelectedUser(user);
  }, []);

  // Handle bump with another user
  const handleBumpUser = useCallback(async () => {
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
  }, [selectedUser, toast]);

  // Calculate user positions on the map
  const calculatePosition = useCallback((user: User, index: number) => {
    if (!currentLocation) return { top: "50%", left: "50%" };
    
    // Use a consistent algorithm to position users
    const angle = ((user.id + index) * 45) % 360;
    const distance = 20 + (user.id % 20);
    
    const top = 50 + Math.sin(angle * Math.PI / 180) * distance;
    const left = 50 + Math.cos(angle * Math.PI / 180) * distance;
    
    return {
      top: `${top}%`,
      left: `${left}%`
    };
  }, [currentLocation]);

  // Handle location error
  if (isError) {
    return (
      <div className="location-error-container">
        <LocationError onEnableLocation={updateLocation} />
      </div>
    );
  }
  
  return (
    <div className="flex-1 relative overflow-hidden flex flex-col">
      {/* Debugging info */}
      <div className="bg-white p-2 text-xs z-50">
        <div>Map Status: Active</div>
        <div>Location: {currentLocation ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}` : 'Unknown'}</div>
        <div>Nearby Users: {filteredUsers.length}</div>
      </div>
      
      <div className="map-container flex-1 border-4 border-red-500">
        <div className="absolute inset-0 bg-blue-100 opacity-50 z-10 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg z-20 text-center max-w-xs">
            <h3 className="text-2xl font-bold mb-2">Map Area</h3>
            <p className="mb-2">Currently showing mock user markers for demonstration</p>
            <div className="flex justify-center space-x-3 mt-3">
              <div className="bg-secondary text-white px-3 py-1 rounded-full">Bump</div>
              <div className="bg-primary text-white px-3 py-1 rounded-full">Grind</div>
            </div>
          </div>
        </div>
        
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
          className="absolute bottom-24 right-4 bg-white p-2 rounded-full shadow-lg z-30"
          onClick={updateLocation}
          aria-label="Get current location"
        >
          <Locate className="h-5 w-5 text-secondary" />
        </button>
        
        {/* Radius indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white py-1 px-3 rounded-full shadow-lg text-sm font-medium text-gray-700 z-30">
          Radius: {radius} miles
        </div>
      </div>
      
      {/* Status toggle - using memoized component */}
      <StatusToggle 
        isActive={isActive}
        onToggle={handleStatusToggle}
      />
      
      {/* Category toggle - using memoized component */}
      <CategoryToggle 
        showBump={showBump}
        showGrind={showGrind} 
        onBumpClick={handleBumpClick}
        onGrindClick={handleGrindClick}
      />
      
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

// Export memoized Map component to prevent unnecessary rerenders
export default memo(Map);
