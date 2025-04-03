import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import LocationService from "@/services/location-service";

interface LocationContextType {
  currentLocation: { latitude: number; longitude: number } | null;
  isLoading: boolean;
  isError: boolean;
  updateLocation: () => Promise<void>;
  updateServerLocation: (location: { latitude: number; longitude: number }) => Promise<void>;
  resetError: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  // Get the singleton location service
  const locationService = LocationService.getInstance();
  
  // Initialize state from service
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(
    locationService.getLocation()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(locationService.getErrorState());
  const { toast } = useToast();

  // Initialize the location service on mount
  useEffect(() => {
    // Subscribe to location updates
    const unsubscribeLocation = locationService.subscribeToLocation((location) => {
      setCurrentLocation(location);
      setIsLoading(false);
    });
    
    // Subscribe to error updates
    const unsubscribeError = locationService.subscribeToError((error) => {
      setIsError(error);
      
      // Show toast only for new errors
      if (error) {
        toast({
          title: "Location error",
          description: "Unable to get your location. Please check your browser settings.",
          variant: "destructive",
        });
      }
    });
    
    // Initialize the service
    locationService.initialize();
    
    // Clean up subscriptions on unmount
    return () => {
      unsubscribeLocation();
      unsubscribeError();
      // Don't call cleanup() here as other components might still need the service
    };
  }, [toast]);
  
  // Wrapper functions to use the service
  const updateLocation = async () => {
    setIsLoading(true);
    await locationService.updateLocation();
  };
  
  const updateServerLocation = async (location: { latitude: number; longitude: number }) => {
    await locationService.updateServerLocation(location);
  };
  
  const resetError = () => {
    locationService.resetError();
  };

  const contextValue = {
    currentLocation,
    isLoading,
    isError,
    updateLocation,
    updateServerLocation,
    resetError
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
