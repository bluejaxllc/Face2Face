import { useState, useCallback, memo, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation as useLocationContext } from "@/contexts/LocationContext";
import { useAuth } from "@/contexts/AuthContext";
import ProfileCard from "./ProfileCard";
import LocationError from "./LocationError";
import FilterDrawer, { FilterOptions } from "./FilterDrawer";
import ReceivedBumpsSheet from "./ReceivedBumpsSheet";
import { calculateDistance } from "@/lib/distance";
import { Locate, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation as useRouteLocation } from "wouter";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, Circle, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { lazy, Suspense } from 'react';
// Leaflet CSS is inlined in index.css — do NOT import here to avoid duplicate rules

const MapGamePicker = lazy(() => import('./MapGamePicker'));
const MapGameOverlay = lazy(() => import('./MapGameOverlay'));

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  category: string;
  isActive: boolean;
  latitude: number;
  longitude: number;
  sex: string;
  age: number;
  selfRating: number;
  height?: string | null;
  weight?: string | null;
  favoriteColor?: string | null;
  favoriteSong?: string | null;
  fieldOfStudy?: string | null;
  interests?: string | null;
  seeking?: string | null;
  bumpMessage?: string | null;
  profilePhoto?: string | null;
  company?: string | null;
  isHiring?: boolean | null;
  businessService?: string | null;
}

const MapEventHandler = memo(({ onZoomChange, onCenterChange, onUserInteract }: { onZoomChange: (zoom: number) => void; onCenterChange: (center: [number, number]) => void; onUserInteract: () => void }) => {
  const mapEvents = useMemo(() => ({
    zoomend: (e: any) => onZoomChange(e.target.getZoom()),
    dragstart: onUserInteract,
    moveend: (e: any) => {
      const center = e.target.getCenter();
      onCenterChange([center.lat, center.lng]);
    }
  }), [onZoomChange, onCenterChange, onUserInteract]);

  useMapEvents(mapEvents);
  return null;
});

const clusterIconCreate = (cluster: any) => {
  const count = cluster.getChildCount();
  const size = count < 5 ? 40 : count < 10 ? 46 : 52;
  return L.divIcon({
    html: `
      <div role="img" aria-label="Cluster of ${count} users" style="
        width:${size}px;height:${size}px;
        border-radius:50%;
        background:white;
        border:3px solid #4285F4;
        display:flex;align-items:center;justify-content:center;
        color:#1a73e8;font-weight:700;font-size:${count < 10 ? 14 : 12}px;
        box-shadow:0 2px 6px rgba(0,0,0,0.2);
      ">
        ${count}
      </div>
    `,
    className: 'custom-cluster-icon',
    iconSize: L.point(size, size),
    iconAnchor: L.point(size / 2, size / 2)
  });
};

const maleIcon = L.divIcon({
  className: 'custom-div-icon border-none bg-transparent',
  html: `<div class="marker-pin" role="img" aria-label="Male user">
    <svg width="44" height="44" viewBox="0 0 100 100">
      <polygon points="50,4 96,92 4,92" fill="#3b82f6" stroke="#1e40af" stroke-width="5" stroke-linejoin="round"/>
      <circle cx="50" cy="62" r="9" fill="white" opacity="0.95" />
    </svg>
  </div>`,
  iconSize: [42, 42],
  iconAnchor: [21, 21]
});

const femaleIcon = L.divIcon({
  className: 'custom-div-icon border-none bg-transparent',
  html: `<div class="marker-pin" role="img" aria-label="Female user">
    <svg width="44" height="44" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="43" fill="#ec4899" stroke="#be185d" stroke-width="5"/>
      <circle cx="50" cy="50" r="11" fill="white" opacity="0.95" />
    </svg>
  </div>`,
  iconSize: [42, 42],
  iconAnchor: [21, 21]
});

const businessIcon = L.divIcon({
  className: 'custom-div-icon border-none bg-transparent',
  html: `<div class="marker-pin" role="img" aria-label="Business">
    <svg width="44" height="44" viewBox="0 0 100 100">
      <rect x="10" y="20" width="80" height="65" rx="12" fill="#3b82f6" stroke="#1e40af" stroke-width="5"/>
      <path d="M35 20V12C35 8.68629 37.6863 6 41 6H59C62.3137 6 65 8.68629 65 12V20" stroke="#1e40af" stroke-width="5" fill="none"/>
      <circle cx="50" cy="52" r="11" fill="white" opacity="0.95" />
    </svg>
  </div>`,
  iconSize: [42, 42],
  iconAnchor: [21, 21]
});

const getIcon = (sex: string, category: string) => {
  if (category === 'business') return businessIcon;
  return sex === 'male' ? maleIcon : femaleIcon;
};

const InvalidateSizeComponent = () => {
  const map = useMap();
  useEffect(() => {
    // Aggressively invalidate at multiple intervals to handle all layout timing
    const timers = [0, 100, 300, 500, 1000, 2000].map(ms =>
      setTimeout(() => map.invalidateSize({ animate: false }), ms)
    );

    // Also invalidate on resize
    const onResize = () => map.invalidateSize({ animate: false });
    window.addEventListener('resize', onResize);

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', onResize);
    };
  }, [map]);
  return null;
};

const UserMarker = memo(({ user, currentLocation, onMarkerClick }: { user: User, currentLocation: any, onMarkerClick: (u: User) => void }) => {
  const eventHandlers = useMemo(() => ({
    click: () => onMarkerClick(user)
  }), [user, onMarkerClick]);

  const mapIcon = useMemo(() => getIcon(user.sex || "other", user.category), [user.sex, user.category]);

  return (
    <Marker
      position={[Number(user.latitude), Number(user.longitude)]}
      icon={mapIcon}
      eventHandlers={eventHandlers}
    >
      <Popup>
        <div style={{ fontFamily: "'Inter', system-ui", textAlign: 'center', padding: '4px 2px', minWidth: '130px' }}>
          <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '2px' }}>
            {user.category === 'business' && user.company ? user.company : `${user.firstName} ${user.lastName}`}
            {user.category !== 'business' && (
              <span style={{ marginLeft: '4px', fontSize: '14px', color: user.sex === 'male' ? '#3b82f6' : user.sex === 'female' ? '#ec4899' : '#a855f7' }}>
                {user.sex === 'male' ? '♂' : user.sex === 'female' ? '♀' : '⚥'}
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            {user.category === 'business' ? (
              <div className="flex flex-col items-center">
                <span className="text-blue-500 font-bold">{user.businessService || "Business Service"}</span>
                {user.isHiring && (
                  <div className="mt-1 px-2 py-0.5 bg-blue-500 text-white text-[10px] font-black rounded-full animate-pulse">
                    HIRING
                  </div>
                )}
              </div>
            ) : (
              `Age ${user.age || 18}`
            )}
          </div>
          {currentLocation && (
            <div style={{ marginTop: '6px', background: '#1e293b', borderRadius: '12px', padding: '3px 8px', display: 'inline-block', fontSize: '11px', fontWeight: 500, color: '#a5b4fc' }}>
              {calculateDistance(
                Number(currentLocation.latitude),
                Number(currentLocation.longitude),
                Number(user.latitude),
                Number(user.longitude)
              ).toFixed(1)} mi
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
});

function Map() {
  const { currentLocation, updateLocation, isError } = useLocationContext();
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(() => {
    const saved = localStorage.getItem('face2face_filterOptions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return {
      datingPreference: 'any',
      showDating: true,
      showBusiness: true,
      showFriendships: true,
      showMen: true,
      showWomen: true,
      ageRange: [18, 50],
      radius: 25000,
      minRating: 1
    };
  });

  const [showDating, setShowDating] = useState(filterOptions.showDating);
  const [showBusiness, setShowBusiness] = useState(filterOptions.showBusiness);
  const [showFriendships, setShowFriendships] = useState(filterOptions.showFriendships);
  const [radius, setRadius] = useState(filterOptions.radius);
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('street');
  const [showReceivedBumps, setShowReceivedBumps] = useState(false);
  const [showGamePicker, setShowGamePicker] = useState(false);
  const [activeMapGame, setActiveMapGame] = useState<{ gameKey: string; opponent: User } | null>(null);

  // Listen for map style changes from the toolbar LAYERS button
  useEffect(() => {
    const handler = (e: Event) => {
      setMapStyle((e as CustomEvent).detail as 'street' | 'satellite');
    };
    window.addEventListener('f2f:mapStyleChange', handler);
    return () => window.removeEventListener('f2f:mapStyleChange', handler);
  }, []);

  const isActive = user?.isActive ?? true;
  const [zoom, setZoom] = useState(() => {
    const saved = localStorage.getItem("f2f_map_state");
    if (saved) {
      try { return JSON.parse(saved).zoom; } catch(e) {}
    }
    return (currentLocation || (user?.latitude && Number(user.latitude) !== 0)) ? 15 : 4;
  });

  const [savedCenter, setSavedCenter] = useState<[number, number] | null>(() => {
    const saved = localStorage.getItem("f2f_map_state");
    if (saved) {
      try { return JSON.parse(saved).center; } catch(e) {}
    }
    return null;
  });

  const mapRef = useRef<L.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapKey, setMapKey] = useState(Date.now());
  const hasCenteredInitially = useRef(!!savedCenter);
  const userHasInteracted = useRef(!!savedCenter);

  const { data: nearbyUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users/nearby", {
      radius,
      category: [showDating && "dating", showBusiness && "business", showFriendships && "friendships"].filter(Boolean).join(",") || "all",
      datingPreference: filterOptions.datingPreference
    }],
    enabled: isActive,
    refetchInterval: 30000,
    staleTime: 25000,
    retry: 2,
    retryDelay: 3000,
  });

  const [routeLocation] = useRouteLocation();
  const params = useMemo(() => new URLSearchParams(window.location.search), [routeLocation]);
  const gameParam = params.get("game");
  const lastLaunchedGameRef = useRef<string | null>(null);

  // Auto-launch game overlay if game parameter is present in URL
  useEffect(() => {
    if (gameParam) {
      if (lastLaunchedGameRef.current === gameParam) {
        return;
      }
      
      // Prioritize challengeable demo users
      let opponent = nearbyUsers.find(u => u.username.startsWith("demo_"));
      if (!opponent && nearbyUsers.length > 0) {
        opponent = nearbyUsers[0];
      }
      
      // Fallback: If no users are nearby, create a mock opponent
      if (!opponent) {
        opponent = {
          id: 9999,
          username: "demo_challenger",
          firstName: "Dallas",
          lastName: "Challenger",
          category: user?.category === "dating" ? "dating" : user?.category === "business" ? "business" : "friendships",
          isActive: true,
          latitude: currentLocation?.latitude || 32.7767,
          longitude: currentLocation?.longitude || -96.7970,
          sex: "female",
          age: 24,
          selfRating: 8
        };
      }
      
      lastLaunchedGameRef.current = gameParam;
      setActiveMapGame({ gameKey: gameParam, opponent });
    } else {
      lastLaunchedGameRef.current = null;
    }
  }, [gameParam, nearbyUsers, currentLocation, user?.category]);

  const mockUsers: User[] = [];

  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });

  // Fix for iOS Safari touchend freeze bug 
  // (Prevents Safari from blocking touch release on map drag)
  L.Map.mergeOptions({
    tap: false,
  });

  const showMen = filterOptions.showMen ?? true;
  const showWomen = filterOptions.showWomen ?? true;

  const filteredUsers = [...nearbyUsers, ...mockUsers].filter(nearbyUser => {
    if (!(filterOptions.showDating ?? true) && nearbyUser.category === "dating") return false;
    if (!(filterOptions.showBusiness ?? true) && nearbyUser.category === "business") return false;
    if (!(filterOptions.showFriendships ?? true) && nearbyUser.category === "friendships") return false;
    if (nearbyUser.selfRating < filterOptions.minRating) return false;
    if (!showMen && nearbyUser.sex === "male") return false;
    if (!showWomen && nearbyUser.sex === "female") return false;
    return true;
  });

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



  const handleMenClick = useCallback(() => {
    setFilterOptions(prev => {
      const next = !(prev.showMen ?? true);
      // Don't allow both off
      if (!next && !(prev.showWomen ?? true)) return prev;
      const pref = (next && (prev.showWomen ?? true) ? 'any' : next ? 'men' : (prev.showWomen ?? true) ? 'women' : 'any') as FilterOptions['datingPreference'];
      const updated = { ...prev, showMen: next, datingPreference: pref };
      localStorage.setItem('face2face_filterOptions', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleWomenClick = useCallback(() => {
    setFilterOptions(prev => {
      const next = !(prev.showWomen ?? true);
      // Don't allow both off
      if (!next && !(prev.showMen ?? true)) return prev;
      const pref = ((prev.showMen ?? true) && next ? 'any' : next ? 'women' : (prev.showMen ?? true) ? 'men' : 'any') as FilterOptions['datingPreference'];
      const updated = { ...prev, showWomen: next, datingPreference: pref };
      localStorage.setItem('face2face_filterOptions', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleMarkerClick = useCallback((user: User) => {
    setSelectedUser(user);
  }, []);

  const handleBump = useCallback(async (message?: string) => {
    if (!selectedUser) return;
    try {
      await apiRequest("POST", "/api/bumps", {
        bumpedUserId: selectedUser.id,
        message
      });
      toast({
        title: "Bump sent!",
        description: `You bumped ${selectedUser.firstName}! They will be notified.`,
      });
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to bump:", error);
      toast({
        title: "Bump failed",
        description: "Failed to send bump",
        variant: "destructive",
      });
    }
  }, [selectedUser, toast]);

  const calculatePosition = useCallback((user: User, index: number) => {
    if (!currentLocation) return { top: "50%", left: "50%" };
    const angle = ((user.id + index) * 45) % 360;
    const distance = 20 + (user.id % 20);
    const top = 50 + Math.sin(angle * Math.PI / 180) * distance;
    const left = 50 + Math.cos(angle * Math.PI / 180) * distance;
    return { top: `${top}%`, left: `${left}%` };
  }, [currentLocation]);

  const center: [number, number] = useMemo(() => {
    if (savedCenter) return savedCenter;
    if (currentLocation) {
      return [currentLocation.latitude, currentLocation.longitude];
    }
    // Fall back to user's stored server-side coordinates
    if (user?.latitude && user?.longitude && Number(user.latitude) !== 0 && Number(user.longitude) !== 0) {
      return [Number(user.latitude), Number(user.longitude)];
    }
    return [39.8283, -98.5795]; // Default: Geographic Center of contiguous US
  }, [currentLocation, user?.latitude, user?.longitude, savedCenter]);

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
    if (mapRef.current) {
      const c = mapRef.current.getCenter();
      localStorage.setItem("f2f_map_state", JSON.stringify({ zoom: newZoom, center: [c.lat, c.lng] }));
    }
  }, []);

  const handleCenterChange = useCallback((c: [number, number]) => {
    setSavedCenter(c);
    if (mapRef.current) {
      const z = mapRef.current.getZoom();
      localStorage.setItem("f2f_map_state", JSON.stringify({ zoom: z, center: c }));
    }
  }, []);


  useEffect(() => {
    if (currentLocation && mapRef.current && !userHasInteracted.current && !hasCenteredInitially.current) {
      // CRITICAL: Use animate:false on iOS Safari — animated setView triggers
      // a CSS transition on the tile container that corrupts rendering.
      mapRef.current.setView(
        [currentLocation.latitude, currentLocation.longitude], 
        15, // Force zoom in when GPS locks
        { animate: false }
      );
      hasCenteredInitially.current = true;
    }
  }, [currentLocation]);

  useEffect(() => {
    setFilterOptions(prev => {
      const updated = {
        ...prev,
        showDating,
        showBusiness,
        showFriendships,
        radius
      };
      localStorage.setItem('face2face_filterOptions', JSON.stringify(updated));
      return updated;
    });
  }, [showDating, showBusiness, showFriendships, radius]);

  const handleFilterChange = useCallback((options: FilterOptions) => {
    try {
      setFilterOptions(options);
      setShowDating(options.showDating);
      setShowBusiness(options.showBusiness);
      setShowFriendships(options.showFriendships);
      setRadius(options.radius);
      localStorage.setItem('face2face_filterOptions', JSON.stringify(options));
      toast({
        title: "Filters updated",
        description: "Your filter settings have been applied",
      });
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast({
        title: "Update failed",
        description: "Failed to update filter settings. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleUserInteract = useCallback(() => {
    userHasInteracted.current = true;
  }, []);

  return (
    <div className="w-full h-full relative map-wrapper">
      {/* ═══════ THE MAP ITSELF ═══════ */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          key={mapKey}
          center={center}
          zoom={zoom}
          style={{
            height: '100%',
            width: '100%',
            zIndex: 20,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          zoomControl={false}
          preferCanvas={false}
          fadeAnimation={false}
          markerZoomAnimation={false}
          attributionControl={false}
          className="leaflet-container map-container"
          ref={mapRef}
        >
          <InvalidateSizeComponent />
          
          {mapStyle === 'satellite' ? (
            <TileLayer
              attribution='&copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
              updateWhenZooming={false}
              updateWhenIdle={true}
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              subdomains="abc"
              maxZoom={19}
              updateWhenZooming={false}
              updateWhenIdle={true}
            />
          )}

          <MapEventHandler onZoomChange={handleZoomChange} onCenterChange={handleCenterChange} onUserInteract={handleUserInteract} />

          {currentLocation && (
            <>
              <Marker
                position={[currentLocation.latitude, currentLocation.longitude]}
                icon={L.divIcon({
                  className: 'current-location-marker',
                  html: '<div style="width:16px;height:16px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 0 0 2px rgba(66,133,244,0.3), 0 2px 6px rgba(0,0,0,0.3);"></div>',
                  iconSize: [16, 16],
                  iconAnchor: [8, 8]
                })}
              >
                <Popup>Your location</Popup>
              </Marker>

              <Circle
                center={[currentLocation.latitude, currentLocation.longitude]}
                radius={radius * 1609.34}
                pathOptions={{ color: '#4285F4', fillColor: '#4285F4', fillOpacity: 0.08, weight: 2, dashArray: '6 4' }}
              />
            </>
          )}

          {isActive && filteredUsers.map((user) => (
            <UserMarker
              key={user.id}
              user={user}
              currentLocation={currentLocation}
              onMarkerClick={handleMarkerClick}
            />
          ))}
        </MapContainer>

        {/* ═══════ BOTTOM RIGHT: Locate button ═══════ */}
        <div className="absolute z-[1000]" style={{ bottom: "24px", right: "12px" }}>
          <button
            className="w-10 h-10 rounded-xl bg-white/90 border border-gray-200 shadow-md flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all duration-200"
            onClick={async () => {
              userHasInteracted.current = false;
              await updateLocation();
              if (mapRef.current && currentLocation) {
                mapRef.current.flyTo(
                  [currentLocation.latitude, currentLocation.longitude],
                  16,
                  { duration: 1.5 }
                );
              }
            }}
            aria-label="Get current location"
          >
            <Locate style={{ width: "16px", height: "16px" }} className="text-blue-500" />
          </button>
        </div>
      </div>

      {/* User profile card */}
      {selectedUser && (
        <ProfileCard
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onConnect={handleBump}
          onChallenge={() => {
            setShowGamePicker(true);
          }}
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
          myLocation={currentLocation}
        />
      )}

      {/* Game picker — select which game to play against the opponent */}
      <Suspense fallback={null}>
        {showGamePicker && selectedUser && (
          <MapGamePicker
            opponent={selectedUser}
            category={(selectedUser.category === 'friendships' ? 'friends' : selectedUser.category === 'business' ? 'business' : 'dating') as any}
            onSelectGame={(gameKey: string) => {
              setActiveMapGame({ gameKey, opponent: selectedUser });
              setShowGamePicker(false);
              setSelectedUser(null);
            }}
            onClose={() => setShowGamePicker(false)}
          />
        )}
      </Suspense>

      {/* Game overlay — renders the active game on top of the map */}
      <Suspense fallback={null}>
        {activeMapGame && (
          <MapGameOverlay
            gameKey={activeMapGame.gameKey}
            opponent={activeMapGame.opponent}
            category={(activeMapGame.opponent.category === 'friendships' ? 'friends' : activeMapGame.opponent.category === 'business' ? 'business' : 'dating') as any}
            onClose={() => {
              setActiveMapGame(null);
              window.history.replaceState(null, "", "/map");
            }}
          />
        )}
      </Suspense>

      {/* Received bumps sheet */}
      <ReceivedBumpsSheet
        open={showReceivedBumps}
        onOpenChange={setShowReceivedBumps}
        onBumpBack={(senderId) => {
          // Find the sender in our nearby users list and auto-select them
          const sender = nearbyUsers.find(u => u.id === senderId);
          if (sender) {
            setSelectedUser(sender);
          }
        }}
        onShowOnMap={(lat, lng) => {
          // Pan and zoom to the sender's location
          if (mapRef.current) {
            userHasInteracted.current = true;
            mapRef.current.flyTo([lat, lng], 16, { duration: 1.5 });
          }
        }}
      />

    </div>
  );
}

export default memo(Map);