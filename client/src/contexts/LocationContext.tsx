import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
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

export function LocationProvider({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  // Get the singleton location service
  const locationService = LocationService.getInstance();

  // Initialize state from service
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(
    locationService.getLocation()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(locationService.getErrorState());
  const { toast } = useToast();

  // Initialize the location service on mount — but only when enabled (authenticated)
  useEffect(() => {
    if (!enabled) return;

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
  }, [toast, enabled]);

  // Wrapper functions to use the service
  const updateLocation = async () => {
    try {
      setIsLoading(true);
      await locationService.updateLocation();

      // If we successfully got a location, show success toast
      if (locationService.getLocation()) {
        toast({
          title: "Location updated",
          description: "Your current location has been updated successfully.",
        });
      }
    } catch (error) {
      console.error("Error updating location:", error);
      toast({
        title: "Location update failed",
        description: "Failed to update your location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create a debounced version of updateServerLocation using ref
  // to avoid creating new functions on each render
  const updateServerLocation = async (location: { latitude: number; longitude: number }) => {
    // No need to show success toast every time - it's now handled in the service
    // with proper throttling
    try {
      await locationService.updateServerLocation(location);
      // We no longer show toasts here since the service handles it internally
      // and applies throttling
    } catch (error) {
      console.error("Error updating server location:", error);
      toast({
        title: "Server sync failed",
        description: "Failed to sync your location with the server. Your experience may be limited.",
        variant: "destructive",
      });
    }
  };

  const resetError = () => {
    locationService.resetError();
    toast({
      title: "Trying again",
      description: "Attempting to reconnect to location services.",
    });
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
