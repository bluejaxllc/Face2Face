import { useState, useCallback, memo, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation as useLocationContext } from "@/contexts/LocationContext";
import { useAuth } from "@/contexts/AuthContext";
import ProfileCard from "./ProfileCard";
import LocationError from "./LocationError";
import FilterDrawer, { FilterOptions } from "./FilterDrawer";
import BeenBumpedBadge from "./BeenBumpedBadge";
import ReceivedBumpsSheet from "./ReceivedBumpsSheet";
import { calculateDistance } from "@/lib/distance";
import { Locate, Plus, Minus, Layers, Signal, Users, MapPin, Radio } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, Circle, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
// Leaflet CSS is inlined in index.css — do NOT import here to avoid duplicate rules

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
  height?: string | null;
  weight?: string | null;
  favoriteColor?: string | null;
  favoriteSong?: string | null;
  fieldOfStudy?: string | null;
  interests?: string | null;
  seeking?: string | null;
  bumpMessage?: string | null;
  profilePhoto?: string | null;
}

const MapEventHandler = memo(({ onZoomChange, onUserInteract }: { onZoomChange: (zoom: number) => void; onUserInteract: () => void }) => {
  const mapEvents = useMemo(() => ({
    zoomend: (e: any) => onZoomChange(e.target.getZoom()),
    dragstart: onUserInteract,
  }), [onZoomChange, onUserInteract]);

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

const getIcon = (gender: string) => gender === 'male' ? maleIcon : femaleIcon;

const InvalidateSizeComponent = () => {
  const map = useMap();
  useEffect(() => {
    // First invalidation after initial layout settles
    const timer1 = setTimeout(() => {
      map.invalidateSize({ animate: false });
    }, 200);
    // Second invalidation after iOS Safari toolbar animation completes
    const timer2 = setTimeout(() => {
      map.invalidateSize({ animate: false });
    }, 1000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [map]);
  return null;
};

const UserMarker = memo(({ user, currentLocation, onMarkerClick }: { user: User, currentLocation: any, onMarkerClick: (u: User) => void }) => {
  const eventHandlers = useMemo(() => ({
    click: () => onMarkerClick(user)
  }), [user, onMarkerClick]);

  const mapIcon = useMemo(() => getIcon(user.gender || "other"), [user.gender]);

  return (
    <Marker
      position={[Number(user.latitude), Number(user.longitude)]}
      icon={mapIcon}
      eventHandlers={eventHandlers}
    >
      <Popup>
        <div style={{ fontFamily: "'Inter', system-ui", textAlign: 'center', padding: '4px 2px', minWidth: '130px' }}>
          <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '2px' }}>
            {user.firstName}, {user.age}
            <span style={{ marginLeft: '4px', fontSize: '14px', color: user.gender === 'male' ? '#3b82f6' : user.gender === 'female' ? '#ec4899' : '#a855f7' }}>
              {user.gender === 'male' ? '♂' : user.gender === 'female' ? '♀' : '⚥'}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
            {'⭐'.repeat(Math.min(5, Math.round(user.selfRating / 2)))}
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

  const isActive = user?.isActive ?? true;
  const [zoom, setZoom] = useState(() => {
    // If we only have the default USA fallback, zoom out to see the continent
    return (currentLocation || (user?.latitude && Number(user.latitude) !== 0)) ? 15 : 4;
  });
  const mapRef = useRef<L.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapKey, setMapKey] = useState(Date.now());
  const hasCenteredInitially = useRef(false);

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
    if (!showMen && nearbyUser.gender === "male") return false;
    if (!showWomen && nearbyUser.gender === "female") return false;
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
    if (currentLocation) {
      return [currentLocation.latitude, currentLocation.longitude];
    }
    // Fall back to user's stored server-side coordinates
    if (user?.latitude && user?.longitude && Number(user.latitude) !== 0 && Number(user.longitude) !== 0) {
      return [Number(user.latitude), Number(user.longitude)];
    }
    return [39.8283, -98.5795]; // Default: Geographic Center of contiguous US
  }, [currentLocation, user?.latitude, user?.longitude]);

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  // Track if user has manually interacted with the map (pan/drag)
  const userHasInteracted = useRef(false);

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
    <div className="w-full h-full relative map-wrapper" style={{ touchAction: 'none' }}>
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
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
              className="leaflet-tile-pane"
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              subdomains="abc"
              maxZoom={19}
              updateWhenZooming={false}
              updateWhenIdle={true}
              className="leaflet-tile-pane"
            />
          )}

          <MapEventHandler onZoomChange={handleZoomChange} onUserInteract={handleUserInteract} />

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

        {/* ═══════ TOP LEFT: Filter + Status info ═══════ */}
        <div className="absolute z-[1000] flex items-center gap-2" style={{ top: "12px", left: "12px" }}>
          <FilterDrawer
            options={filterOptions}
            onChange={handleFilterChange}
          />
          {/* Mini status pill */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-full px-3 shadow-xl"
            style={{ height: "32px" }}>
            <span className={`inline-block w-2 h-2 rounded-full ${mapLoaded ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.5)]'}`} />
            <span className="text-white font-bold" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>
              {filteredUsers.length}
            </span>
            <Users style={{ width: "11px", height: "11px" }} className="text-slate-400" />
          </div>
        </div>

        {/* Mode Toggles removed and moved to Dating.tsx */}




        {/* ═══════ TOP RIGHT: Go Live toggle ═══════ */}
        <div className="absolute z-[1000]" style={{ top: "12px", right: "12px" }}>
          <div className={`flex items-center gap-2 border shadow-xl transition-all duration-500 rounded-full ${isActive
            ? "bg-emerald-500/10 border-emerald-500/50 backdrop-blur-md shadow-emerald-500/10"
            : "bg-slate-900/80 border-white/10 backdrop-blur-md"
            }`} style={{ padding: "4px 12px", height: "34px" }}>
            <Radio style={{ width: "12px", height: "12px" }} className={`${isActive ? "text-emerald-400 animate-pulse" : "text-slate-400"}`} />
            <span className={`font-black tracking-widest ${isActive ? "text-emerald-400" : "text-slate-400"}`} style={{ fontSize: "9px" }}>
              {isActive ? "LIVE" : "OFFLINE"}
            </span>
            <Switch
              checked={isActive}
              onCheckedChange={handleStatusToggle}
              aria-label="Active status"
              className="scale-75"
            />
          </div>
        </div>

        {/* ═══════ RIGHT SIDE: Vertical tool strip ═══════ */}
        <div className="absolute z-[1000] flex flex-col gap-2" style={{ bottom: "24px", right: "12px" }}>
          {/* Map style toggle */}
          <button
            className="w-10 h-10 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 shadow-xl flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all duration-300 group"
            onClick={() => setMapStyle(prev => prev === 'street' ? 'satellite' : 'street')}
            aria-label="Toggle map style"
          >
            <Layers style={{ width: "16px", height: "16px" }} className={`transition-colors duration-300 ${mapStyle === 'satellite' ? "text-emerald-400" : "text-slate-400 group-hover:text-white"}`} />
          </button>

          {/* Current location */}
          <button
            className="w-10 h-10 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 shadow-xl flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all duration-300 group"
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
            <Locate style={{ width: "16px", height: "16px" }} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
          </button>

          {/* Zoom controls */}
          <div className="flex flex-col bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl shadow-xl overflow-hidden">
            <button
              className="w-10 h-10 flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all text-slate-400 hover:text-white border-b border-white/5"
              onClick={() => mapRef.current?.zoomIn()}
              aria-label="Zoom in"
            >
              <Plus style={{ width: "14px", height: "14px" }} />
            </button>
            <button
              className="w-10 h-10 flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all text-slate-400 hover:text-white"
              onClick={() => mapRef.current?.zoomOut()}
              aria-label="Zoom out"
            >
              <Minus style={{ width: "14px", height: "14px" }} />
            </button>
          </div>
        </div>

        {/* ═══════ BOTTOM LEFT: Radius input ═══════ */}
        <div className="absolute z-[1000]" style={{ bottom: "24px", left: "12px" }}>
          <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-full shadow-xl"
            style={{ padding: "3px 8px 3px 12px", height: "36px" }}>
            <input
              type="number"
              value={radius >= 25000 ? "" : radius}
              placeholder="∞"
              min={1}
              max={25000}
              aria-label="Search radius in miles"
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || val === "0") {
                  setRadius(25000);
                } else {
                  setRadius(Math.min(25000, Math.max(1, parseInt(val) || 1)));
                }
              }}
              className="bg-transparent text-white font-black text-center outline-none border-none placeholder:text-slate-500"
              style={{ width: "48px", fontSize: "13px", MozAppearance: "textfield", WebkitAppearance: "none" } as any}
            />
            <span className="text-slate-400 font-bold" style={{ fontSize: "9px", letterSpacing: "1px" }}>MI</span>
            <button
              onClick={() => setRadius(25000)}
              className={`ml-1 rounded-full flex items-center justify-center transition-all duration-300 font-black active:scale-90 ${radius >= 25000
                ? "bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              style={{ height: "26px", width: "26px", fontSize: "14px" }}
              title="Unlimited radius"
              aria-label="Unlimited radius"
            >
              ∞
            </button>
          </div>
        </div>
      </div>

      {/* User profile card */}
      {selectedUser && (
        <ProfileCard
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onConnect={handleBump}
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
      {/* GPS Loading Overlay */}
      {!currentLocation && (!user?.latitude || Number(user.latitude) === 0) && !isError && (
        <div className="absolute inset-0 z-[2000] bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none transition-opacity duration-500">
          <div className="bg-white/10 p-6 rounded-3xl border border-white/20 flex flex-col items-center shadow-2xl">
            <Locate className="w-12 h-12 text-blue-400 animate-pulse mb-4 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
            <h3 className="text-white font-bold text-lg tracking-wide">Acquiring Signal</h3>
            <p className="text-blue-200/80 text-xs font-medium mt-1 uppercase tracking-widest">Locating nearby users</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(Map);