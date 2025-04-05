import { useState, useCallback, memo, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation as useLocationContext } from "@/contexts/LocationContext";
import { useAuth } from "@/contexts/AuthContext";
import ProfileCard from "./ProfileCard";
import LocationError from "./LocationError";
import FilterDrawer, { FilterOptions } from "./FilterDrawer";
import { calculateDistance } from "@/lib/distance";
import { Locate, Plus, Minus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, Circle, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
    <div className="absolute top-2 right-2 bg-white py-1 px-2 rounded-full shadow-lg flex items-center space-x-1 z-[1000]">
      <span className={`text-[10px] font-medium ${isActive ? "text-green-600" : "text-gray-500"}`}>
        {isActive ? "Active" : "Inactive"}
      </span>
      <Switch 
        checked={isActive} 
        onCheckedChange={onToggle} 
        className="scale-[0.6]"
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
    <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg flex overflow-hidden z-[1000]" style={{ maxWidth: '140px' }}>
      <Button
        variant={showBump ? "default" : "outline"}
        className={`px-2 py-0.5 text-[10px] font-medium ${showBump ? "bg-secondary text-white" : ""}`}
        onClick={onBumpClick}
        style={{ minHeight: '24px', height: '24px' }}
      >
        Bump
      </Button>
      <Button
        variant={showGrind ? "default" : "outline"}
        className={`px-2 py-0.5 text-[10px] font-medium ${showGrind ? "bg-primary text-white" : ""}`}
        onClick={onGrindClick}
        style={{ minHeight: '24px', height: '24px' }}
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
  const [radius, setRadius] = useState(50);
  
  // Advanced filter options
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    datingPreference: 'any',
    showBump,
    showGrind,
    ageRange: [18, 50],
    radius,
    minRating: 1
  });
  
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

  // Fix Leaflet default icon issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (category: string) => {
  return L.divIcon({
    className: `custom-div-icon ${category}`,
    html: `<div class="marker-pin ${category === 'bump' ? 'bump-marker' : 'grind-marker'}">
             <span class="marker-initials text-white font-bold"></span>
           </div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42]
  });
};

// Component to update map center when location changes
function MapCenterUpdater({ position }: { position: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position, map]);
  
  return null;
}

// Component to handle map events
function MapEventHandler({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });
  
  return null;
}

// Filter users based on advanced filter options
const filteredUsers = [...nearbyUsers, ...mockUsers].filter(nearbyUser => {
  // Filter by category
  if (!filterOptions.showBump && nearbyUser.category === "bump") return false;
  if (!filterOptions.showGrind && nearbyUser.category === "grind") return false;
  
  // Filter by user rating
  if (nearbyUser.selfRating < filterOptions.minRating) return false;
  
  // Additional filters would be applied here in a real implementation
  // e.g., dating preferences, age range, etc.
  
  return true;
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
  
  // Add state for zoom level
  const [zoom, setZoom] = useState(14);
  const mapRef = useRef<L.Map | null>(null);

  // Get center position for the map
  const center: [number, number] = useMemo(() => {
    return currentLocation
      ? [currentLocation.latitude, currentLocation.longitude]
      : [32.8728576, -96.5312512]; // Default position if location not available
  }, [currentLocation]);

  // Handle zoom change
  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);
  
  // Track map loading status
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Key to force map rerender if tiles don't load properly
  const [mapKey, setMapKey] = useState(Date.now());
  
  // Update filter synchronization
  useEffect(() => {
    setFilterOptions(prev => ({
      ...prev,
      showBump,
      showGrind,
      radius
    }));
  }, [showBump, showGrind, radius]);
  
  // Handler for filter changes
  const handleFilterChange = useCallback((options: FilterOptions) => {
    try {
      // Update filter options
      setFilterOptions(options);
      
      // Sync UI with filter options
      setShowBump(options.showBump);
      setShowGrind(options.showGrind);
      setRadius(options.radius);
      
      // Show success toast
      toast({
        title: "Filters updated",
        description: "Your filter settings have been applied",
      });
      
      // In a real implementation, we would update the API query with these filters
      console.log('Filter options updated:', options);
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast({
        title: "Update failed",
        description: "Failed to update filter settings. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);
  
  // Reset the map if it doesn't load within 5 seconds
  useEffect(() => {
    if (!mapLoaded) {
      const timer = setTimeout(() => {
        console.log('Map loading timed out, forcing reinitialization...');
        setMapKey(Date.now()); // This will cause MapContainer to unmount and remount
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [mapLoaded, mapKey]);
  
  return (
    <div className="flex-1 relative overflow-hidden flex flex-col w-full h-full">
      {/* Debugging info */}
      <div className="bg-white p-2 text-xs z-50 flex justify-between items-center">
        <div>
          <div>Map Status: {mapLoaded ? 'Active' : 'Loading'}</div>
          <div>Location: {currentLocation ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}` : 'Unknown'}</div>
          <div>Nearby Users: {filteredUsers.length}</div>
          <div>Zoom Level: {zoom}</div>
        </div>
        <button 
          onClick={() => {
            setMapLoaded(false);
            setMapKey(Date.now());
            console.log('Manual map refresh triggered');
          }}
          className="bg-secondary hover:bg-secondary/80 text-white px-2 py-1 rounded text-xs"
        >
          Refresh Map
        </button>
      </div>
      
      <div className="flex-1 relative bg-gray-100" style={{ minHeight: '300px', height: 'calc(100% - 40px)' }}>
        {!mapLoaded && (
          <div className="absolute inset-0 z-30 bg-gray-200 grid place-items-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="text-gray-700 font-medium">Loading map tiles...</p>
              <p className="text-xs text-gray-500 max-w-xs text-center">
                If the map doesn't appear, try clicking the "Refresh Map" button above.
              </p>
            </div>
          </div>
        )}
        <MapContainer 
          key={mapKey} // Force remount when mapKey changes
          center={center}
          zoom={14}
          style={{ 
            height: '100%', 
            width: '100%',
            background: '#f8f9fa',
            display: 'block',
            zIndex: 20,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          zoomControl={false}
          preferCanvas={true}
          attributionControl={false}
          className="leaflet-container map-container"
          ref={mapRef}
          whenReady={() => {
            console.log('Map is ready with key:', mapKey);
            setMapLoaded(true);
          }}
        >
          {/* Most reliable tile provider for guaranteed visibility - CartoDB */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={20}
            className="leaflet-tile-pane"
            eventHandlers={{
              loading: () => console.log('CartoDB tiles are loading...'),
              load: () => console.log('CartoDB tiles have loaded'),
              error: (e) => console.error('CartoDB tile loading error:', e)
            }}
          />
          
          {/* Second fallback - Stamen TonerLite */}
          <TileLayer
            attribution='Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            minZoom={0}
            maxZoom={20}
            className="leaflet-tile-pane"
            eventHandlers={{
              loading: () => console.log('Stamen tiles are loading...'),
              load: () => console.log('Stamen tiles have loaded'),
              error: (e) => console.error('Stamen tile loading error:', e)
            }}
          />
          
          {/* Third fallback - OpenStreetMap direct */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            className="leaflet-tile-pane"
            eventHandlers={{
              loading: () => console.log('OSM tiles are loading...'),
              load: () => console.log('OSM tiles have loaded'),
              error: (e) => console.error('OSM tile loading error:', e)
            }}
          />
          
          <ZoomControl position="bottomright" />
          
          {/* Update center when location changes */}
          <MapCenterUpdater position={center} />
          
          {/* Handle map events */}
          <MapEventHandler onZoomChange={handleZoomChange} />
          
          {/* Current user position and radius */}
          {currentLocation && (
            <>
              <Marker 
                position={[currentLocation.latitude, currentLocation.longitude]}
                icon={L.divIcon({
                  className: 'current-location-marker',
                  html: '<div class="pulse"></div>',
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
                })}
              >
                <Popup>Your location</Popup>
              </Marker>
              
              <Circle 
                center={[currentLocation.latitude, currentLocation.longitude]}
                radius={radius * 1609.34} // Convert miles to meters
                pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1, weight: 1 }}
              />
            </>
          )}
          
          {/* User markers with clustering */}
          <MarkerClusterGroup 
            chunkedLoading
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            maxClusterRadius={40}
            iconCreateFunction={(cluster: any) => {
              const count = cluster.getChildCount();
              
              return L.divIcon({
                html: `
                  <div class="cluster-marker bg-white rounded-full flex items-center justify-center border-2 border-primary text-primary font-bold">
                    ${count}
                  </div>
                `,
                className: 'custom-cluster-icon',
                iconSize: L.point(40, 40),
                iconAnchor: L.point(20, 20)
              });
            }}
          >
            {filteredUsers.map((user) => (
              <Marker
                key={user.id}
                position={[user.latitude, user.longitude]}
                icon={createCustomIcon(user.category)}
                eventHandlers={{
                  click: () => handleMarkerClick(user)
                }}
              >
                <Popup>
                  <div className="text-center">
                    <div className="font-bold">{user.firstName} {user.lastName}</div>
                    <div className="text-sm capitalize">{user.category}</div>
                    {currentLocation && (
                      <div className="text-xs mt-1">
                        {calculateDistance(
                          currentLocation.latitude,
                          currentLocation.longitude,
                          user.latitude,
                          user.longitude
                        ).toFixed(1)} miles away
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
        
        {/* Filter drawer - moved to top left corner with clear styles */}
        <div className="absolute top-2 left-2 z-[1000]">
          <FilterDrawer
            options={filterOptions}
            onChange={handleFilterChange}
          />
        </div>
        
        {/* Current location button - positioned in bottom right corner with greater margin */}
        <button 
          className="absolute bottom-[50px] right-2 bg-white p-1.5 rounded-full shadow-lg z-[1000]"
          onClick={updateLocation}
          aria-label="Get current location"
          style={{marginBottom: "5px"}}
        >
          <Locate className="h-4 w-4 text-secondary" />
        </button>
        
        {/* Radius control - positioned at bottom with better spacing */}
        <div className="absolute bottom-[50px] left-0 right-0 mx-auto max-w-[140px] bg-white py-0.5 px-2 rounded-full shadow-lg text-[8px] font-medium text-gray-700 z-[1000] flex items-center justify-between" style={{marginBottom: "5px"}}>
          <button 
            className="w-4 h-4 flex items-center justify-center bg-gray-200 rounded-full"
            onClick={() => setRadius((prev: number) => Math.max(1, prev - 1))}
          >
            <Minus className="h-2 w-2" />
          </button>
          <span>Radius: {radius} mi</span>
          <button 
            className="w-4 h-4 flex items-center justify-center bg-gray-200 rounded-full"
            onClick={() => setRadius((prev: number) => Math.min(50, prev + 1))}
          >
            <Plus className="h-2 w-2" />
          </button>
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