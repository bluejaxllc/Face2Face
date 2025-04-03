import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LocationContextType {
  currentLocation: { latitude: number; longitude: number } | null;
  isLoading: boolean;
  isError: boolean;
  updateLocation: () => Promise<void>;
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
      toast({
        title: "Location update failed",
        description: error.message,
        variant: "destructive",
      });
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
          if (error.code === 1) {
            errorMessage = "Location access denied. Please enable location services";
          } else if (error.code === 2) {
            errorMessage = "Location unavailable. Please try again";
          } else if (error.code === 3) {
            errorMessage = "Location request timed out. Please try again";
          }
          
          toast({
            title: "Location error",
            description: errorMessage,
            variant: "destructive",
          });
          
          reject(errorMessage);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  };

  const updateLocation = async () => {
    try {
      const location = await getCurrentLocation();
      await updateLocationMutation.mutateAsync(location);
    } catch (error) {
      console.error("Failed to update location:", error);
    }
  };

  useEffect(() => {
    updateLocation();
    
    // Set up periodic location updates
    const intervalId = setInterval(() => {
      updateLocation();
    }, 60000); // Update every minute
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        isLoading,
        isError,
        updateLocation,
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
