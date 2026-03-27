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
  const updateLocation = useCallback(async () => {
    setIsLoading(true);
    // The original snippet had `setError(null)` and `setError(...)` which are not defined.
    // Assuming the intent is to manage the `isError` boolean state.
    setIsError(false); // Reset error state at the start of an update attempt

    try {
      // Return mock location for local testing UI
      const mockLocation = {
        latitude: 32.8728576,
        longitude: -96.5312512,
        accuracy: 10,
      };

      setCurrentLocation(mockLocation);
      setIsLoading(false);

      // Show success toast for mock location
      toast({
        title: "Location updated (Mock)",
        description: "Your current location has been updated with mock data.",
      });

      // The original snippet returned mockLocation, but the context type expects Promise<void>
      // So we don't return a value here to match the interface.
    } catch (err: any) {
      console.error("[LocationService] Failed to update location:", err);
      setIsError(true); // Set error state on failure
      setIsLoading(false);
      toast({
        title: "Location update failed (Mock)",
        description: "Failed to update your location with mock data. Please try again.",
        variant: "destructive",
      });
      // Re-throw the error if necessary, but the interface expects Promise<void>
      // so we handle the error internally and don't propagate it as a rejected promise.
    }
  }, [toast]);

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
