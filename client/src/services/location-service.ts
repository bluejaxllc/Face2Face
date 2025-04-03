import { apiRequest } from "@/lib/queryClient";

class LocationService {
  private static instance: LocationService;
  private currentLocation: { latitude: number; longitude: number } | null = null;
  private isError: boolean = false;
  private locationListeners: Array<(location: { latitude: number; longitude: number } | null) => void> = [];
  private errorListeners: Array<(isError: boolean) => void> = [];
  private intervalId: number | null = null;
  private initialLocationRequested: boolean = false;

  // Private constructor for singleton
  private constructor() {}

  // Static method to get the instance
  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  // Subscribe to location updates
  public subscribeToLocation(
    callback: (location: { latitude: number; longitude: number } | null) => void
  ): () => void {
    this.locationListeners.push(callback);
    // Immediately notify with current state
    callback(this.currentLocation);
    
    // Return unsubscribe function
    return () => {
      this.locationListeners = this.locationListeners.filter(listener => listener !== callback);
    };
  }

  // Subscribe to error state changes
  public subscribeToError(callback: (isError: boolean) => void): () => void {
    this.errorListeners.push(callback);
    // Immediately notify with current state
    callback(this.isError);
    
    // Return unsubscribe function
    return () => {
      this.errorListeners = this.errorListeners.filter(listener => listener !== callback);
    };
  }

  // Notify all location subscribers
  private notifyLocationListeners(): void {
    this.locationListeners.forEach(listener => listener(this.currentLocation));
  }

  // Notify all error subscribers
  private notifyErrorListeners(): void {
    this.errorListeners.forEach(listener => listener(this.isError));
  }

  // Initialize the service
  public initialize(): void {
    if (!this.initialLocationRequested) {
      this.initialLocationRequested = true;
      this.updateLocation();
    }

    // Set up interval for periodic updates
    if (this.intervalId === null) {
      this.intervalId = window.setInterval(() => {
        if (!this.isError) {
          this.updateLocation();
        }
      }, 300000); // 5 minutes
    }
  }

  // Clean up the service
  public cleanup(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Update location
  public async updateLocation(): Promise<void> {
    if (!navigator.geolocation) {
      this.isError = true;
      this.notifyErrorListeners();
      return;
    }

    try {
      const position = await this.getCurrentPosition();
      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      
      this.currentLocation = location;
      this.isError = false;
      this.notifyLocationListeners();
      this.notifyErrorListeners();
      
      console.log("Location updated successfully:", this.currentLocation);
    } catch (error) {
      console.error("Failed to update location:", error);
      
      // Use a default location for testing purposes
      // New York City coordinates
      this.currentLocation = {
        latitude: 40.7128,
        longitude: -74.0060
      };
      
      // Still set isError to true so the user knows there was a problem
      this.isError = true;
      this.notifyLocationListeners();
      this.notifyErrorListeners();
      
      console.log("Using fallback location for debugging:", this.currentLocation);
    }
  }

  // Get current position from browser API
  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        position => {
          resolve(position);
        },
        error => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }

  // Update location on server
  public async updateServerLocation(
    location: { latitude: number; longitude: number }
  ): Promise<void> {
    try {
      const response = await apiRequest("POST", "/api/users/location", location);
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      console.log("Location updated successfully:", location);
    } catch (error) {
      console.error("Failed to update server location:", error);
      // We'll just log the error but not propagate it upwards
      // This prevents the app from crashing on location update failures
    }
  }

  // Reset error state
  public resetError(): void {
    this.isError = false;
    this.notifyErrorListeners();
  }

  // Get current location
  public getLocation(): { latitude: number; longitude: number } | null {
    return this.currentLocation;
  }

  // Get error state
  public getErrorState(): boolean {
    return this.isError;
  }
}

export default LocationService;