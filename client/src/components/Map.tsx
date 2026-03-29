import { useState, useCallback, memo, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation as useLocationContext } from "@/contexts/LocationContext";
import { useAuth } from "@/contexts/AuthContext";
import ProfileCard from "./ProfileCard";
import LocationError from "./LocationError";
import FilterDrawer, { FilterOptions } from "./FilterDrawer";
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
  connectMessage?: string | null;
  profilePhoto?: string | null;
}

function MapEventHandler({ onZoomChange, onUserInteract }: { onZoomChange: (zoom: number) => void; onUserInteract?: () => void }) {
  const map = useMapEvents({
    zoomend: () => { onZoomChange(map.getZoom()); },
    dragstart: () => { onUserInteract?.(); },
  });
  return null;
}

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
      showCasual: true,
      showIntimate: false,
      ageRange: [18, 50],
      radius: 25000,
      minRating: 1
    };
  });

  const [showCasual, setShowConnect] = useState(filterOptions.showCasual);
  const [showIntimate, setShowGrind] = useState(filterOptions.showIntimate);
  const [radius, setRadius] = useState(filterOptions.radius);
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('street');

  const isActive = user?.isActive ?? true;
  const [zoom, setZoom] = useState(14);
  const mapRef = useRef<L.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapKey, setMapKey] = useState(Date.now());
  const hasCenteredInitially = useRef(false);

  const { data: nearbyUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users/nearby", {
      radius,
      category: showCasual && showIntimate ? "both" : showCasual ? "casual" : "intimate",
      datingPreference: filterOptions.datingPreference
    }],
    enabled: isActive,
    refetchInterval: 10000,
    staleTime: 5000,
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

  const createCustomIcon = (gender: string) => {
    const isMale = gender === 'male';
    const color = isMale ? '#4285F4' : '#EA4335';
    const borderColor = isMale ? '#1a73e8' : '#c5221f';
    const svgHtml = isMale
      ? `<svg width="36" height="36" viewBox="0 0 100 100" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
           <polygon points="50,8 94,92 6,92" fill="${color}" stroke="${borderColor}" stroke-width="4" stroke-linejoin="round"/>
         </svg>`
      : `<svg width="36" height="36" viewBox="0 0 100 100" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
           <circle cx="50" cy="50" r="38" fill="${color}" stroke="${borderColor}" stroke-width="4"/>
         </svg>`;

    return L.divIcon({
      className: 'custom-div-icon border-none bg-transparent',
      html: `<div class="marker-pin" style="transition: transform 0.2s ease;" role="img" aria-label="User marker">${svgHtml}</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
  };

  const filteredUsers = [...nearbyUsers, ...mockUsers].filter(nearbyUser => {
    if (!filterOptions.showCasual && nearbyUser.category === "casual") return false;
    if (!filterOptions.showIntimate && nearbyUser.category === "intimate") return false;
    if (nearbyUser.selfRating < filterOptions.minRating) return false;
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

  const showMen = ['men', 'any', 'everyone', 'both'].includes(filterOptions.datingPreference || 'any');
  const showWomen = ['women', 'any', 'everyone', 'both'].includes(filterOptions.datingPreference || 'any');

  const handleMenClick = useCallback(() => {
    setFilterOptions(prev => {
      const currentlyShowsWomen = ['women', 'any', 'everyone', 'both'].includes(prev.datingPreference);
      let newPref: FilterOptions['datingPreference'] = 'men';
      if (showMen && currentlyShowsWomen) newPref = 'women';
      else if (!showMen && currentlyShowsWomen) newPref = 'any';
      else if (showMen && !currentlyShowsWomen) return prev; // Cannot turn both off

      const updated = { ...prev, datingPreference: newPref };
      localStorage.setItem('face2face_filterOptions', JSON.stringify(updated));
      return updated;
    });
  }, [showMen]);

  const handleWomenClick = useCallback(() => {
    setFilterOptions(prev => {
      const currentlyShowsMen = ['men', 'any', 'everyone', 'both'].includes(prev.datingPreference);
      let newPref: FilterOptions['datingPreference'] = 'women';
      if (showWomen && currentlyShowsMen) newPref = 'men';
      else if (!showWomen && currentlyShowsMen) newPref = 'any';
      else if (showWomen && !currentlyShowsMen) return prev; // Cannot turn both off

      const updated = { ...prev, datingPreference: newPref };
      localStorage.setItem('face2face_filterOptions', JSON.stringify(updated));
      return updated;
    });
  }, [showWomen]);

  const handleMarkerClick = useCallback((user: User) => {
    setSelectedUser(user);
  }, []);

  const handleOpenConnect = useCallback(async () => {
    if (!selectedUser) return;
    try {
      await apiRequest("POST", "/api/bumps", { bumpedUserId: selectedUser.id });
      toast({
        title: "Connection sent!",
        description: `You connected with ${selectedUser.firstName}! They will be notified.`,
      });
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to connect:", error);
      toast({
        title: "Connect failed",
        description: "Failed to send connection",
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

  // Effect to automatically center the map once after actual location is acquired
  // But ONLY if the user hasn't started panning yet
  useEffect(() => {
    if (mapLoaded && currentLocation && mapRef.current && !userHasInteracted.current) {
      mapRef.current.setView([currentLocation.latitude, currentLocation.longitude], mapRef.current.getZoom() || 15, { animate: true, duration: 0.5 });
      hasCenteredInitially.current = true;
    }
  }, [mapLoaded, currentLocation]);

  useEffect(() => {
    setFilterOptions(prev => {
      const updated = {
        ...prev,
        showCasual,
        showIntimate,
        radius
      };
      localStorage.setItem('face2face_filterOptions', JSON.stringify(updated));
      return updated;
    });
  }, [showCasual, showIntimate, radius]);

  const handleFilterChange = useCallback((options: FilterOptions) => {
    try {
      setFilterOptions(options);
      setShowConnect(options.showCasual);
      setShowGrind(options.showIntimate);
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

  useEffect(() => {
    if (!mapLoaded) {
      const timer = setTimeout(() => {
        setMapKey(Date.now());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [mapLoaded, mapKey]);

  // Note: We no longer block the map when geolocation fails.
  // The query fires regardless, and the map uses stored server-side coordinates as fallback.

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col w-full h-full pb-[50px]">
      <div className="flex-1 relative" style={{ minHeight: '300px', height: '100%' }}>

        <MapContainer
          key={mapKey}
          center={center}
          zoom={14}
          style={{
            height: '100%',
            width: '100%',
            background: '#e8e8e8',
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
            setMapLoaded(true);
          }}
        >
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
              className="leaflet-tile-pane"
            />
          )}

          <MapEventHandler onZoomChange={handleZoomChange} onUserInteract={() => { userHasInteracted.current = true; }} />

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
            chunkedLoading
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            zoomToBoundsOnClick={true}
            maxClusterRadius={50}
            disableClusteringAtZoom={14}
            animate={true}
            animateAddingMarkers={true}
            spiderLegPolylineOptions={{ weight: 2, color: 'rgba(66,133,244,0.5)', opacity: 0.8 }}
            iconCreateFunction={(cluster: any) => {
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
                    transition: all 0.3s ease;
                  ">
                    ${count}
                  </div>
                `,
                className: 'custom-cluster-icon',
                iconSize: L.point(size, size),
                iconAnchor: L.point(size / 2, size / 2)
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
                          currentLocation.latitude,
                          currentLocation.longitude,
                          user.latitude,
                          user.longitude
                        ).toFixed(1)} mi
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
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
          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-full px-3 shadow-md"
            style={{ height: "32px" }}>
            <span className={`inline-block w-2 h-2 rounded-full ${mapLoaded ? 'bg-green-500' : 'bg-amber-400 animate-pulse'}`} />
            <span className="text-gray-700 font-semibold" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>
              {filteredUsers.length}
            </span>
            <Users style={{ width: "11px", height: "11px" }} className="text-gray-400" />
          </div>
        </div>

        {/* ═══════ TOP CENTER: Mode Toggles ═══════ */}
        <div className="absolute z-[1000] left-1/2 -translate-x-1/2" style={{ top: "12px" }}>
          <div className="flex bg-white/90 backdrop-blur-xl border border-gray-200 p-[3px] rounded-full shadow-md gap-1">
            <button
              onClick={handleMenClick}
              className={`w-9 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${showMen ? 'bg-blue-500 shadow-sm' : 'hover:bg-gray-100'
                }`}
              aria-label="Show men"
            >
              <svg width="14" height="14" viewBox="0 0 100 100">
                <polygon points="50,8 94,92 6,92" fill={showMen ? "white" : "#9ca3af"} strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={handleWomenClick}
              className={`w-9 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${showWomen ? 'bg-pink-500 shadow-sm' : 'hover:bg-gray-100'
                }`}
              aria-label="Show women"
            >
              <svg width="14" height="14" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill={showWomen ? "white" : "#9ca3af"} />
              </svg>
            </button>
          </div>
        </div>




        {/* ═══════ TOP RIGHT: Go Live toggle ═══════ */}
        <div className="absolute z-[1000]" style={{ top: "12px", right: "12px" }}>
          <div className={`flex items-center gap-2 backdrop-blur-xl border rounded-full shadow-md transition-all duration-300 ${isActive
            ? "bg-green-50/90 border-green-300 map-live-active"
            : "bg-white/90 border-gray-200"
            }`} style={{ padding: "4px 12px", height: "32px" }}>
            <Radio style={{ width: "12px", height: "12px" }} className={`${isActive ? "text-green-500 animate-pulse" : "text-gray-400"}`} />
            <span className={`font-bold tracking-wider ${isActive ? "text-green-600" : "text-gray-400"}`} style={{ fontSize: "10px" }}>
              {isActive ? "LIVE" : "OFF"}
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
            className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-md flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all duration-200"
            onClick={() => setMapStyle(prev => prev === 'street' ? 'satellite' : 'street')}
            aria-label="Toggle map style"
          >
            <Layers style={{ width: "16px", height: "16px" }} className={mapStyle === 'satellite' ? "text-green-500" : "text-gray-500"} />
          </button>

          {/* Current location */}
          <button
            className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-md flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all duration-200"
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
          <div className="flex flex-col bg-white/90 backdrop-blur-xl border border-gray-200 rounded-xl shadow-md overflow-hidden">
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
          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-full shadow-md"
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
    </div>
  );
}

export default memo(Map);