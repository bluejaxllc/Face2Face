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

function MapEventHandler({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => { onZoomChange(map.getZoom()); },
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
    enabled: !!currentLocation && isActive,
    refetchInterval: 1000,
    staleTime: 2000,
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
    const color = isMale ? '#3b82f6' : '#ec4899';
    const glow = isMale ? 'rgba(59,130,246,0.6)' : 'rgba(236,72,153,0.6)';
    const svgHtml = isMale
      ? `<svg width="36" height="36" viewBox="0 0 100 100" style="filter: drop-shadow(0 0 8px ${glow}) drop-shadow(0 2px 4px rgba(0,0,0,0.4));">
           <polygon points="50,8 94,92 6,92" fill="${color}" stroke="rgba(255,255,255,0.5)" stroke-width="3" stroke-linejoin="round"/>
         </svg>`
      : `<svg width="36" height="36" viewBox="0 0 100 100" style="filter: drop-shadow(0 0 8px ${glow}) drop-shadow(0 2px 4px rgba(0,0,0,0.4));">
           <circle cx="50" cy="50" r="38" fill="${color}" stroke="rgba(255,255,255,0.5)" stroke-width="3"/>
         </svg>`;

    return L.divIcon({
      className: 'custom-div-icon border-none bg-transparent',
      html: `<div class="marker-pin" style="transition: transform 0.2s ease;">${svgHtml}</div>`,
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
    return currentLocation
      ? [currentLocation.latitude, currentLocation.longitude]
      : [32.8728576, -96.5312512];
  }, [currentLocation]);

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  // Effect to automatically center the map once after actual location is acquired
  useEffect(() => {
    if (mapLoaded && currentLocation && mapRef.current && !hasCenteredInitially.current) {
      mapRef.current.setView([currentLocation.latitude, currentLocation.longitude], 14);
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

  if (isError) {
    return (
      <div className="flex-1 relative overflow-hidden flex flex-col w-full h-full page-dark" style={{ paddingBottom: "45px" }}>
        <LocationError onEnableLocation={updateLocation} />
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col w-full h-full" style={{ paddingBottom: "45px" }}>
      <div className="flex-1 relative" style={{ minHeight: '300px', height: 'calc(100%)', marginBottom: "50px" }}>

        <MapContainer
          key={mapKey}
          center={center}
          zoom={14}
          style={{
            height: '100%',
            width: '100%',
            background: '#0f172a',
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
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={20}
              className="leaflet-tile-pane"
            />
          )}

          <MapEventHandler onZoomChange={handleZoomChange} />

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
                radius={radius * 1609.34}
                pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.06, weight: 1, dashArray: '8 6' }}
              />
            </>
          )}

          <MarkerClusterGroup
            chunkedLoading
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            maxClusterRadius={40}
            iconCreateFunction={(cluster: any) => {
              const count = cluster.getChildCount();
              return L.divIcon({
                html: `
                  <div style="width:40px;height:40px;border-radius:50%;background:rgba(15,23,42,0.9);backdrop-filter:blur(12px);border:2px solid rgba(99,102,241,0.5);display:flex;align-items:center;justify-content:center;color:#c7d2fe;font-weight:700;font-size:14px;box-shadow:0 0 20px rgba(99,102,241,0.25);">
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
          <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-xl border border-slate-700/40 rounded-full px-3"
            style={{ height: "32px" }}>
            <span className={`inline-block w-2 h-2 rounded-full ${mapLoaded ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-amber-400 animate-pulse'}`} />
            <span className="text-slate-300 font-semibold" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>
              {filteredUsers.length}
            </span>
            <Users style={{ width: "11px", height: "11px" }} className="text-slate-500" />
          </div>
        </div>

        {/* ═══════ TOP CENTER: Mode Toggles ═══════ */}
        <div className="absolute z-[1000] left-1/2 -translate-x-1/2" style={{ top: "12px" }}>
          <div className="flex bg-slate-900/80 backdrop-blur-xl border border-slate-700/40 p-[3px] rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <button
              onClick={handleMenClick}
              className={`px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${showMen ? 'bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.6)]' : 'text-slate-400 hover:text-white'
                }`}
            >
              Men
            </button>
            <button
              onClick={handleWomenClick}
              className={`px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${showWomen ? 'bg-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.6)]' : 'text-slate-400 hover:text-white'
                }`}
            >
              Women
            </button>
          </div>
        </div>




        {/* ═══════ TOP RIGHT: Go Live toggle ═══════ */}
        <div className="absolute z-[1000]" style={{ top: "12px", right: "12px" }}>
          <div className={`flex items-center gap-2 backdrop-blur-xl border rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-300 ${isActive
            ? "bg-emerald-500/15 border-emerald-500/30 map-live-active"
            : "bg-slate-900/80 border-slate-700/40"
            }`} style={{ padding: "4px 12px", height: "32px" }}>
            <Radio style={{ width: "12px", height: "12px" }} className={`${isActive ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
            <span className={`font-bold tracking-wider ${isActive ? "text-emerald-300" : "text-slate-400"}`} style={{ fontSize: "10px" }}>
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
            className="w-10 h-10 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/40 shadow-[0_4px_24px_rgba(0,0,0,0.4)] flex items-center justify-center hover:bg-slate-800/90 hover:border-slate-600/50 active:scale-95 transition-all duration-200"
            onClick={() => setMapStyle(prev => prev === 'street' ? 'satellite' : 'street')}
            aria-label="Toggle map style"
          >
            <Layers style={{ width: "16px", height: "16px" }} className={mapStyle === 'satellite' ? "text-emerald-400" : "text-slate-400"} />
          </button>

          {/* Current location */}
          <button
            className="w-10 h-10 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/40 shadow-[0_4px_24px_rgba(0,0,0,0.4)] flex items-center justify-center hover:bg-slate-800/90 hover:border-blue-500/30 active:scale-95 transition-all duration-200"
            onClick={async () => {
              await updateLocation();
              if (mapRef.current && currentLocation) {
                mapRef.current.flyTo(
                  [currentLocation.latitude, currentLocation.longitude],
                  mapRef.current.getZoom(),
                  { duration: 1.5 }
                );
              }
            }}
            aria-label="Get current location"
          >
            <Locate style={{ width: "16px", height: "16px" }} className="text-blue-400" />
          </button>

          {/* Zoom controls */}
          <div className="flex flex-col bg-slate-900/80 backdrop-blur-xl border border-slate-700/40 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] overflow-hidden">
            <button
              className="w-10 h-8 flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all text-slate-300 border-b border-slate-700/30"
              onClick={() => mapRef.current?.zoomIn()}
              aria-label="Zoom in"
            >
              <Plus style={{ width: "14px", height: "14px" }} />
            </button>
            <button
              className="w-10 h-8 flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all text-slate-300"
              onClick={() => mapRef.current?.zoomOut()}
              aria-label="Zoom out"
            >
              <Minus style={{ width: "14px", height: "14px" }} />
            </button>
          </div>
        </div>

        {/* ═══════ BOTTOM LEFT: Radius input ═══════ */}
        <div className="absolute z-[1000]" style={{ bottom: "24px", left: "12px" }}>
          <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-xl border border-slate-700/40 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
            style={{ padding: "3px 8px 3px 12px", height: "34px" }}>
            <input
              type="number"
              value={radius >= 25000 ? "" : radius}
              placeholder="∞"
              min={1}
              max={25000}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || val === "0") {
                  setRadius(25000);
                } else {
                  setRadius(Math.min(25000, Math.max(1, parseInt(val) || 1)));
                }
              }}
              className="bg-transparent text-white font-bold text-center outline-none border-none"
              style={{ width: "48px", fontSize: "13px", MozAppearance: "textfield", WebkitAppearance: "none" } as any}
            />
            <span className="text-slate-400 font-semibold" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>MI</span>
            <button
              onClick={() => setRadius(25000)}
              className={`ml-0.5 rounded-full flex items-center justify-center transition-all duration-200 font-bold active:scale-90 ${radius >= 25000
                ? "bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow-lg shadow-blue-500/25"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                }`}
              style={{ height: "26px", width: "26px", fontSize: "13px" }}
              title="Unlimited radius"
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