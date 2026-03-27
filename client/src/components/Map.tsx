import { useState, useCallback, memo, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation as useLocationContext } from "@/contexts/LocationContext";
import { useAuth } from "@/contexts/AuthContext";
import ProfileCard from "./ProfileCard";
import LocationError from "./LocationError";
import FilterDrawer, { FilterOptions } from "./FilterDrawer";
import ConnectOverlay from "./ConnectOverlay";
import { calculateDistance } from "@/lib/distance";
import { Locate, Plus, Minus, Layers } from "lucide-react";
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
  gender: string;
  age: number;
  selfRating: number;
  favoriteColor?: string | null;
  favoriteSong?: string | null;
  fieldOfStudy?: string | null;
  interests?: string | null;
  bumpMessage?: string | null;
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
    <div className="absolute bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center space-x-2 z-[1000]"
      style={{ top: "12px", right: "12px", padding: "4px 10px", height: "30px" }}>
      <span className={`font-semibold tracking-wide ${isActive ? "text-pink-500" : "text-slate-400"}`} style={{ fontSize: "12px" }}>
        {isActive ? "GO LIVE" : "LEAVE MAP"}
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
  showCasual,
  showIntimate,
  onCasualClick,
  onIntimateClick
}: {
  showCasual: boolean;
  showIntimate: boolean;
  onCasualClick: () => void;
  onIntimateClick: () => void;
}) => {
  return (
    <div className="absolute transform -translate-x-1/2 p-0.5 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex overflow-hidden z-[1000]"
      style={{ top: "6px", left: "50%", maxWidth: "120px", height: "24px" }}>
      <Button
        variant={showCasual ? "default" : "ghost"}
        className={`${showCasual ? "bg-secondary text-white rounded-full" : "text-slate-400 hover:text-white hover:bg-transparent"}`}
        onClick={onCasualClick}
        style={{ minHeight: "20px", height: "20px", padding: "0 10px", fontSize: "9px", fontWeight: "600", letterSpacing: "0.5px", textTransform: "uppercase" }}
      >
        Connect
      </Button>
      <Button
        variant={showIntimate ? "default" : "ghost"}
        className={`${showIntimate ? "bg-primary text-white rounded-full" : "text-slate-400 hover:text-white hover:bg-transparent"}`}
        onClick={onIntimateClick}
        style={{ minHeight: "20px", height: "20px", padding: "0 10px", fontSize: "9px", fontWeight: "600", letterSpacing: "0.5px", textTransform: "uppercase" }}
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
  const [showCasual, setShowConnect] = useState(true);
  const [showIntimate, setShowGrind] = useState(false);
  const [radius, setRadius] = useState(25000);
  const [isConnectingOverlayActive, setIsConnectingOverlayActive] = useState(false);
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('street');

  // Advanced filter options
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    datingPreference: 'any',
    showCasual,
    showIntimate,
    ageRange: [18, 50],
    radius,
    minRating: 1
  });

  // Get isActive directly from user state
  const isActive = user?.isActive ?? true;

  // ALL hooks must be before any conditional returns (React Rules of Hooks)
  const [zoom, setZoom] = useState(14);
  const mapRef = useRef<L.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapKey, setMapKey] = useState(Date.now());

  // Fetch nearby users
  const { data: nearbyUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users/nearby", { radius, category: showCasual && showIntimate ? "both" : showCasual ? "casual" : "intimate" }],
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
        category: "casual",
        isActive: true,
        latitude: currentLocation.latitude + 0.01,
        longitude: currentLocation.longitude + 0.01,
        gender: "male",
        age: 25,
        selfRating: 4
      },
      {
        id: 102,
        username: "mockuser2",
        firstName: "Sarah",
        lastName: "G",
        category: "intimate",
        isActive: true,
        latitude: currentLocation.latitude - 0.01,
        longitude: currentLocation.longitude - 0.01,
        gender: "female",
        age: 22,
        selfRating: 5
      },
      {
        id: 103,
        username: "mockuser3",
        firstName: "Alex",
        lastName: "B",
        category: "casual",
        isActive: true,
        latitude: currentLocation.latitude + 0.005,
        longitude: currentLocation.longitude - 0.007,
        gender: "male",
        age: 28,
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

  // Custom marker icons (Triangle for male, Circle for female)
  const createCustomIcon = (gender: string) => {
    const isMale = gender === 'male';
    const svgHtml = isMale
      ? `<svg width="30" height="30" viewBox="0 0 100 100" fill="var(--blue-500, #3b82f6)" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));"><polygon points="50,10 90,90 10,90"/></svg>`
      : `<svg width="30" height="30" viewBox="0 0 100 100" fill="var(--pink-500, #ec4899)" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));"><circle cx="50" cy="50" r="40"/></svg>`;

    return L.divIcon({
      className: `custom-div-icon border-none bg-transparent`,
      html: `<div class="marker-pin animate-pulse-slow">${svgHtml}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
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
    if (!filterOptions.showCasual && nearbyUser.category === "casual") return false;
    if (!filterOptions.showIntimate && nearbyUser.category === "intimate") return false;

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
  const handleCasualClick = useCallback(() => {
    if (!showCasual && !showIntimate) {
      // At least one category must be selected
      setShowConnect(true);
    } else {
      setShowConnect(!showCasual);
    }
  }, [showCasual, showIntimate]);

  // Handle grind click (category toggle)
  const handleIntimateClick = useCallback(() => {
    if (!showCasual && !showIntimate) {
      // At least one category must be selected
      setShowGrind(true);
    } else {
      setShowGrind(!showIntimate);
    }
  }, [showCasual, showIntimate]);

  // Handle user marker click
  const handleMarkerClick = useCallback((user: User) => {
    setSelectedUser(user);
  }, []);

  // Open Connect Overlay instead of immediate API request
  const handleOpenConnect = useCallback(() => {
    if (!selectedUser) return;
    setIsConnectingOverlayActive(true);
  }, [selectedUser]);

  // Handle final successful physical bump
  const handlePhysicalConnectSuccess = useCallback(async () => {
    if (!selectedUser) return;
    setIsConnectingOverlayActive(false);

    try {
      await apiRequest("POST", "/api/bumps", {
        bumpedUserId: selectedUser.id,
      });

      toast({
        title: "Connection successful!",
        description: `You connected with ${selectedUser.firstName}! They will be notified.`,
      });
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to connect user:", error);
      toast({
        title: "Connect failed",
        description: "Failed to connect into this user",
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

  // (Location error return moved to bottom)

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

  // Update filter synchronization
  useEffect(() => {
    setFilterOptions(prev => ({
      ...prev,
      showCasual,
      showIntimate,
      radius
    }));
  }, [showCasual, showIntimate, radius]);

  // Handler for filter changes
  const handleFilterChange = useCallback((options: FilterOptions) => {
    try {
      // Update filter options
      setFilterOptions(options);

      // Sync UI with filter options
      setShowConnect(options.showCasual);
      setShowGrind(options.showIntimate);
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

  // Handle location error
  if (isError) {
    return (
      <div className="flex-1 relative overflow-hidden flex flex-col w-full h-full page-dark" style={{ paddingBottom: "45px" }}>
        <LocationError onEnableLocation={updateLocation} />
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col w-full h-full" style={{ paddingBottom: "45px" }}>
      {/* Debugging info */}
      <div className="bg-slate-900/80 backdrop-blur-md p-1 border-b border-slate-700/50 text-slate-300 text-[8px] z-50 flex justify-between items-center shadow-sm" style={{ height: "30px", maxHeight: "30px", overflow: "hidden" }}>
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
          className="bg-secondary/80 hover:bg-secondary text-white px-2 py-0.5 rounded text-[9px]"
          style={{ height: "18px", fontWeight: "bold", minWidth: "70px" }}
        >
          Refresh Map
        </button>
      </div>

      <div className="flex-1 relative bg-gray-100" style={{ minHeight: '300px', height: 'calc(100% - 30px)', marginBottom: "50px" }}>
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
          {mapStyle === 'satellite' ? (
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
              className="leaflet-tile-pane"
              eventHandlers={{
                loading: () => console.log('Esri Satellite tiles are loading...'),
                load: () => console.log('Esri Satellite tiles have loaded'),
                error: (e) => console.error('Esri Satellite tile loading error:', e)
              }}
            />
          ) : (
            <>
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
            </>
          )}

          <ZoomControl position="topright" />

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
            {isActive && filteredUsers.map((user) => (
              <Marker
                key={user.id}
                position={[user.latitude, user.longitude]}
                icon={createCustomIcon(user.gender || "other")}
                eventHandlers={{
                  click: () => handleMarkerClick(user)
                }}
              >
                <Popup>
                  <div className="text-center font-sans">
                    <div className="font-bold text-lg mb-1">{user.firstName}</div>
                    <div className="text-sm text-slate-500">Age: {user.age}</div>
                    <div className="text-sm">Self Rating: {user.selfRating}/10</div>
                    {currentLocation && (
                      <div className="text-xs mt-2 bg-slate-100 rounded-full py-1 px-2 text-slate-600 inline-block font-medium">
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

        {/* Filter drawer */}
        <div className="absolute top-2 left-2 z-[1000]" style={{ top: "8px", left: "8px" }}>
          <FilterDrawer
            options={filterOptions}
            onChange={handleFilterChange}
          />
        </div>

        {/* Map Style toggle button */}
        <button
          className="absolute bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.5)] z-[1000] hover:bg-slate-800 transition-colors"
          onClick={() => setMapStyle(prev => prev === 'street' ? 'satellite' : 'street')}
          aria-label="Toggle map style"
          style={{ bottom: "170px", right: "10px", padding: "6px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Layers style={{ width: "16px", height: "16px" }} className={mapStyle === 'satellite' ? "text-primary" : "text-slate-400"} />
        </button>

        {/* Current location button */}
        <button
          className="absolute bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.5)] z-[1000] hover:bg-slate-800 transition-colors"
          onClick={updateLocation}
          aria-label="Get current location"
          style={{ bottom: "120px", right: "10px", padding: "6px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Locate style={{ width: "16px", height: "16px" }} className="text-secondary" />
        </button>

        {/* Radius control */}
        <div className="absolute bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.5)] z-[1000] flex items-center justify-between text-slate-200"
          style={{ bottom: "70px", right: "10px", width: "130px", padding: "4px 8px" }}>
          <button
            className="flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded transition-colors border border-slate-700"
            onClick={() => setRadius((prev: number) => Math.max(1, prev - 10))}
            style={{ width: "24px", height: "24px" }}
          >
            <Minus style={{ width: "12px", height: "12px" }} />
          </button>
          <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Rad: {radius >= 25000 ? '∞' : radius} mi</span>
          <button
            className="flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded transition-colors border border-slate-700"
            onClick={() => setRadius((prev: number) => Math.min(25000, prev + 10))}
            style={{ width: "24px", height: "24px" }}
          >
            <Plus style={{ width: "12px", height: "12px" }} />
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
        showCasual={showCasual}
        showIntimate={showIntimate}
        onCasualClick={handleCasualClick}
        onIntimateClick={handleIntimateClick}
      />

      {/* User profile card */}
      {selectedUser && !isConnectingOverlayActive && (
        <ProfileCard
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onConnect={handleOpenConnect}
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

      {isConnectingOverlayActive && selectedUser && currentLocation && (
        <ConnectOverlay
          onSuccess={handlePhysicalConnectSuccess}
          onCancel={() => setIsConnectingOverlayActive(false)}
          targetUser={selectedUser}
          currentLocation={currentLocation}
        />
      )}
    </div>
  );
}

// Export memoized Map component to prevent unnecessary rerenders
export default memo(Map);