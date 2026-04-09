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
    // Wait for Safari toolbars to settle or layout shifts
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 400);
    
    const handleResize = () => {
      map.invalidateSize();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
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
  const [zoom, setZoom] = useState(14);
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
    return [32.8728576, -96.5312512]; // Default: Dallas
  }, [currentLocation, user?.latitude, user?.longitude]);

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  // Track if user has manually interacted with the map (pan/drag)
  const userHasInteracted = useRef(false);

  useEffect(() => {
    if (currentLocation && mapRef.current && !userHasInteracted.current && !hasCenteredInitially.current) {
      mapRef.current.setView(
        [currentLocation.latitude, currentLocation.longitude], 
        mapRef.current.getZoom() || 15, 
        { animate: true, duration: 0.5 }
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
          preferCanvas={true}
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

          <MarkerClusterGroup
            chunkedLoading={true}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            zoomToBoundsOnClick={true}
            maxClusterRadius={30}
            disableClusteringAtZoom={10}
            animate={false}
            animateAddingMarkers={false}
            spiderLegPolylineOptions={{ weight: 2, color: 'rgba(66,133,244,0.5)', opacity: 0.8 }}
            iconCreateFunction={clusterIconCreate}
          >
            {isActive && filteredUsers.map((user) => (
              <UserMarker
                key={user.id}
                user={user}
                currentLocation={currentLocation}
                onMarkerClick={handleMarkerClick}
              />
            ))}
          </MarkerClusterGroup>
        </MapContainer>

        {/* ═══════ TOP LEFT: Filter + Status info ═══════ */}
        <div className="absolute z-[1000] flex items-center gap-2" style={{ top: "12px", left: "12px" }}>
          <FilterDrawer
            options={filterOptions}
            onChange={handleFilterChange}
          />
          {/* Mini status pill */}
          <div className="flex items-center gap-1.5 bg-white/90  border border-gray-200 rounded-full px-3 shadow-md"
            style={{ height: "32px" }}>
            <span className={`inline-block w-2 h-2 rounded-full ${mapLoaded ? 'bg-green-500' : 'bg-amber-400 animate-pulse'}`} />
            <span className="text-gray-700 font-semibold" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>
              {filteredUsers.length}
            </span>
            <Users style={{ width: "11px", height: "11px" }} className="text-slate-500" />
          </div>
          <BeenBumpedBadge onClick={() => setShowReceivedBumps(true)} />
        </div>

        {/* ═══════ BOTTOM CENTER: Mode Toggles ═══════ */}
        <div className="absolute z-[1000] left-1/2 -translate-x-1/2 pointer-events-auto" style={{ bottom: "24px" }}>
          <div className="flex bg-white/90  border border-gray-200 p-1 rounded-full shadow-lg gap-1.5 items-center">
            <button
              onClick={handleMenClick}
              className={`w-10 h-8 rounded-full flex items-center justify-center transition-all duration-300 relative ${showMen
                ? 'bg-blue-50/80 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_4px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20'
                : 'hover:bg-slate-50 opacity-60 hover:opacity-100'
                }`}
              aria-label="Show men"
            >
              <svg width="15" height="15" viewBox="0 0 100 100" className={showMen ? "drop-shadow-sm" : ""}>
                {showMen && (
                  <defs>
                    <linearGradient id="blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                )}
                <polygon points="50,12 90,88 10,88" fill={showMen ? "url(#blue-grad)" : "#94a3b8"} strokeLinejoin="round" />
              </svg>
            </button>
            <div className="w-[1px] h-4 bg-gray-200 rounded-full"></div>
            <button
              onClick={handleWomenClick}
              className={`w-10 h-8 rounded-full flex items-center justify-center transition-all duration-300 relative ${showWomen
                ? 'bg-pink-50/80 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_4px_rgba(236,72,153,0.15)] ring-1 ring-pink-500/20'
                : 'hover:bg-slate-50 opacity-60 hover:opacity-100'
                }`}
              aria-label="Show women"
            >
              <svg width="15" height="15" viewBox="0 0 100 100" className={showWomen ? "drop-shadow-sm" : ""}>
                {showWomen && (
                  <defs>
                    <linearGradient id="pink-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f472b6" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                )}
                <circle cx="50" cy="50" r="38" fill={showWomen ? "url(#pink-grad)" : "#94a3b8"} />
              </svg>
            </button>
          </div>
        </div>




        {/* ═══════ TOP RIGHT: Go Live toggle ═══════ */}
        <div className="absolute z-[1000]" style={{ top: "12px", right: "12px" }}>
          <div className={`flex items-center gap-2  border rounded-full shadow-md transition-all duration-300 ${isActive
            ? "bg-green-50/90 border-green-300 map-live-active"
            : "bg-white/90 border-gray-200"
            }`} style={{ padding: "4px 12px", height: "32px" }}>
            <Radio style={{ width: "12px", height: "12px" }} className={`${isActive ? "text-green-500 animate-pulse" : "text-gray-400"}`} />
            <span className={`font-bold tracking-wider ${isActive ? "text-green-600" : "text-gray-400"}`} style={{ fontSize: "9px" }}>
              {isActive ? "GO LIVE" : "LEAVE MAP"}
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
            className="w-10 h-10 rounded-xl bg-white/90  border border-gray-200 shadow-md flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all duration-200"
            onClick={() => setMapStyle(prev => prev === 'street' ? 'satellite' : 'street')}
            aria-label="Toggle map style"
          >
            <Layers style={{ width: "16px", height: "16px" }} className={mapStyle === 'satellite' ? "text-green-500" : "text-gray-500"} />
          </button>

          {/* Current location */}
          <button
            className="w-10 h-10 rounded-xl bg-white/90  border border-gray-200 shadow-md flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all duration-200"
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

          {/* Zoom controls */}
          <div className="flex flex-col bg-white/90  border border-gray-200 rounded-xl shadow-md overflow-hidden">
            <button
              className="w-10 h-8 flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all text-gray-600 border-b border-gray-200"
              onClick={() => mapRef.current?.zoomIn()}
              aria-label="Zoom in"
            >
              <Plus style={{ width: "14px", height: "14px" }} />
            </button>
            <button
              className="w-10 h-8 flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all text-gray-600"
              onClick={() => mapRef.current?.zoomOut()}
              aria-label="Zoom out"
            >
              <Minus style={{ width: "14px", height: "14px" }} />
            </button>
          </div>
        </div>

        {/* ═══════ BOTTOM LEFT: Radius input ═══════ */}
        <div className="absolute z-[1000]" style={{ bottom: "24px", left: "12px" }}>
          <div className="flex items-center gap-1.5 bg-white/90  border border-gray-200 rounded-full shadow-md"
            style={{ padding: "3px 8px 3px 12px", height: "34px" }}>
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
              className="bg-transparent text-gray-800 font-bold text-center outline-none border-none"
              style={{ width: "48px", fontSize: "13px", MozAppearance: "textfield", WebkitAppearance: "none" } as any}
            />
            <span className="text-gray-400 font-semibold" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>MI</span>
            <button
              onClick={() => setRadius(25000)}
              className={`ml-0.5 rounded-full flex items-center justify-center transition-all duration-200 font-bold active:scale-90 ${radius >= 25000
                ? "bg-blue-500 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                }`}
              style={{ height: "26px", width: "26px", fontSize: "13px" }}
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
    </div>
  );
}

export default memo(Map);