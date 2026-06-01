import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity?: number;
}

interface HeatmapLayerProps {
  points: HeatmapPoint[];
  radius?: number;
  blur?: number;
  maxZoom?: number;
  max?: number;
  gradient?: { [key: number]: string };
}

export default function HeatmapLayer({ 
  points, 
  radius = 25, 
  blur = 15, 
  maxZoom = 18, 
  max = 1.0, 
  gradient = { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' } 
}: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    
    // Map points to [lat, lng, intensity] array format required by leaflet.heat
    const heatPoints = points.map(p => [p.lat, p.lng, p.intensity ?? 1.0]) as [number, number, number][];
    
    const heatLayer = (L as any).heatLayer(heatPoints, {
      radius,
      blur,
      maxZoom,
      max,
      gradient
    }).addTo(map);

    return () => {
      if (map && heatLayer) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, points, radius, blur, maxZoom, max, gradient]);

  return null;
}
