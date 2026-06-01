import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Globe, Users, Activity } from "lucide-react";

interface Hotspot {
  id: string;
  latitude: number;
  longitude: number;
  intensity: number;
}

export default function EcosystemMap() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/map/hotspots")
      .then((res) => res.json())
      .then((data) => {
        setHotspots(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch hotspots", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            Live Ecosystem Map
          </h2>
          <p className="text-sm text-slate-400">Real-time global bump density and engagement.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-white">{hotspots.length} Active Nodes</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-bold text-blue-400 tracking-wider">LIVE</span>
          </div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full h-[500px] rounded-2xl overflow-hidden border border-slate-800 relative shadow-2xl"
      >
        {loading && (
          <div className="absolute inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center">
            <Activity className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        )}
        
        <MapContainer 
          center={[20, 0]} 
          zoom={2} 
          className="w-full h-full bg-[#0a0f1c]"
          zoomControl={false}
          scrollWheelZoom={true}
        >
          {/* Dark futuristic map tiles */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {hotspots.map((spot) => (
            <CircleMarker
              key={spot.id}
              center={[spot.latitude, spot.longitude]}
              radius={Math.max(3, spot.intensity / 10)}
              pathOptions={{
                color: spot.intensity > 80 ? '#f43f5e' : spot.intensity > 40 ? '#f59e0b' : '#3b82f6',
                fillColor: spot.intensity > 80 ? '#f43f5e' : spot.intensity > 40 ? '#f59e0b' : '#3b82f6',
                fillOpacity: 0.6,
                weight: 0
              }}
            >
              <Popup className="custom-popup">
                <div className="text-slate-900 font-medium">
                  Intensity: {Math.round(spot.intensity)}%
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </motion.div>
    </div>
  );
}
