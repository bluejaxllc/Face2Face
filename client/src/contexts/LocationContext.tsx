import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const { toast } = useToast();

  const updateLocationMutation = useMutation({
    mutationFn: async (location: { latitude: number; longitude: number }) => {
      const res = await apiRequest("POST", "/api/users/location", location);
      return res.json();
    },
    onError: (error: Error) => {
      // This will fail with 401 if not authenticated - that's expected
      console.log("Location update failed:", error.message);
    },
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      setIsError(true);
      return Promise.reject("Geolocation not supported");
    }

    setIsLoading(true);
    
    return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCurrentLocation(location);
          setIsLoading(false);
          setIsError(false);
          resolve(location);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLoading(false);
          setIsError(true);
          
          let errorMessage = "Failed to get your location";
          let toastVariant: "destructive" | "default" = "destructive";
          
          if (error.code === 1) {
            // Permission denied
            errorMessage = "Location access denied. Please enable location services in your browser settings.";
            // Don't show toast for permission denied as we'll show the special LocationError component
            toastVariant = "default"; 
          } else if (error.code === 2) {
            errorMessage = "Location unavailable. Please try again or check your device settings.";
          } else if (error.code === 3) {
            errorMessage = "Location request timed out. Please try again with better network connectivity.";
          }
          
          // Only show toast for non-permission errors since permission errors will show 
          // the LocationError component which is more informative
          if (error.code !== 1) {
            toast({
              title: "Location error",
              description: errorMessage,
              variant: toastVariant,
            });
          }
          
          reject(errorMessage);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  };

  // This function gets the current location but doesn't try to update the server
  const updateLocation = async () => {
    try {
      await getCurrentLocation();
    } catch (error) {
      console.error("Failed to update location:", error);
    }
  };
  
  // This function can be called from components that know the user is authenticated
  const updateServerLocation = async (location: { latitude: number; longitude: number }) => {
    try {
      await updateLocationMutation.mutateAsync(location);
    } catch (error) {
      console.error("Failed to update server location:", error);
    }
  };
  
  // Allow components to manually reset error state (useful for retry in LocationError component)
  const resetError = () => {
    setIsError(false);
  };

  // Initialize with a ref to prevent effect dependency issues
  const initialLocationRequested = useRef(false);
  
  // Handle initial location request only once
  useEffect(() => {
    if (!initialLocationRequested.current) {
      initialLocationRequested.current = true;
      updateLocation();
    }
  }, []);
  
  // Set up periodic location updates independent of the initial request
  useEffect(() => {
    // Set up periodic location updates if no error
    const intervalId = setInterval(() => {
      // Only try to update if there's no existing error
      // This prevents too many permission prompts
      if (!isError) {
        updateLocation();
      }
    }, 300000); // Update every 5 minutes to reduce server load
    
    return () => clearInterval(intervalId);
  }, [isError]);

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        isLoading,
        isError,
        updateLocation,
        updateServerLocation,
        resetError
      }}
    >
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
