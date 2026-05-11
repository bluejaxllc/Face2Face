/**
 * Location Context — React Native
 * Wraps the LocationService singleton in React context.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import LocationService from '@/services/location';

interface LocationContextType {
  currentLocation: { latitude: number; longitude: number } | null;
  isError: boolean;
  updateLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({
  children,
  enabled = true,
}: {
  children: React.ReactNode;
  enabled?: boolean;
}) {
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const service = LocationService.getInstance();
    service.initialize();

    const unsubLocation = service.subscribeToLocation(setCurrentLocation);
    const unsubError = service.subscribeToError(setIsError);

    return () => {
      unsubLocation();
      unsubError();
      service.cleanup();
    };
  }, [enabled]);

  const updateLocation = async () => {
    const service = LocationService.getInstance();
    await service.updateLocation();
  };

  return (
    <LocationContext.Provider value={{ currentLocation, isError, updateLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
