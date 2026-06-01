import { memo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';

interface RadarOverlayProps {
  latitude: number;
  longitude: number;
  radiusInPixels?: number;
  color?: string;
}

const RadarOverlay = memo(({ 
  latitude, 
  longitude, 
  radiusInPixels = 300,
  color = '#10b981' // emerald-500 default
}: RadarOverlayProps) => {

  const radarIcon = L.divIcon({
    className: 'custom-radar-icon border-none bg-transparent',
    html: `
      <div class="radar-container" style="
        width: ${radiusInPixels * 2}px; 
        height: ${radiusInPixels * 2}px; 
        position: relative;
        border-radius: 50%;
        border: 2px solid ${color}30;
        background: radial-gradient(circle, ${color}10 0%, transparent 70%);
        box-shadow: 0 0 20px ${color}20, inset 0 0 40px ${color}10;
        overflow: hidden;
      ">
        <!-- Pulse Rings -->
        <div class="absolute inset-0 border border-${color}20 rounded-full scale-50" style="border-color: ${color}40;"></div>
        <div class="absolute inset-0 border border-${color}20 rounded-full scale-75" style="border-color: ${color}30;"></div>
        
        <!-- Radar Sweep -->
        <div class="absolute inset-0 rounded-full" style="
          background: conic-gradient(from 0deg, transparent 70%, ${color}80 100%);
          animation: radar-spin 4s linear infinite;
        "></div>
        
        <!-- Center Dot -->
        <div class="absolute top-1/2 left-1/2 w-3 h-3 -ml-1.5 -mt-1.5 rounded-full" style="
          background: ${color};
          box-shadow: 0 0 10px 2px ${color};
        "></div>
      </div>
      <style>
        @keyframes radar-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      </style>
    `,
    iconSize: [radiusInPixels * 2, radiusInPixels * 2],
    iconAnchor: [radiusInPixels, radiusInPixels]
  });

  return (
    <Marker
      position={[latitude, longitude]}
      icon={radarIcon}
      interactive={false} // Don't block clicks to the map underneath
    />
  );
});

export default RadarOverlay;
