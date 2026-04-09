/**
 * Location Service
 * Handles device location tracking
 * Uses @capacitor/geolocation on native platforms, falls back to browser API on web
 */

import { Capacitor } from '@capacitor/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { apiRequest } from "@/lib/queryClient";

// Function to debounce function calls
function debounce(func: Function, wait: number) {
  let timeout: number | null = null;
  return function (...args: any[]) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = window.setTimeout(() => {
      timeout = null;
      func(...args);
    }, wait);
  };
}

class LocationService {
  private static instance: LocationService;
  private currentLocation: { latitude: number; longitude: number } | null = null;
  private isError: boolean = false;
  private locationListeners: Array<(location: { latitude: number; longitude: number } | null) => void> = [];
  private errorListeners: Array<(isError: boolean) => void> = [];
  private intervalId: number | null = null;
  private initialLocationRequested: boolean = false;
  private lastServerUpdateTime: number = 0;
  private updateDelay: number = 1000; // Minimum time between server updates (1 second)
  private watchId: string | null = null; // For native watch position
  private webWatchId: number | null = null; // For web watch position

  // Private constructor for singleton
  private constructor() { }

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

    // On native, start watching position for continuous updates
    if (Capacitor.isNativePlatform() && !this.watchId) {
      this.startNativeWatch();
    } else if (!Capacitor.isNativePlatform() && this.webWatchId === null) {
      this.startWebWatch();
    }
  }

  // Helper to determine if we should notify UI
  // Threshold: at least 2000ms delay OR significant distance change
  private shouldNotifyUI(): boolean {
    const now = Date.now();
    if (now - this.lastServerUpdateTime > 2000) {
      return true;
    }
    return false;
  }

  // Start web continuous location watching
  private startWebWatch(): void {
    if (!navigator.geolocation) {
      this.isError = true;
      this.notifyErrorListeners();
      return;
    }

    this.webWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        this.currentLocation = location;
        
        // Only trigger React state updates periodically to prevent UI lag on rapid GPS events
        if (this.shouldNotifyUI()) {
          this.isError = false;
          this.notifyLocationListeners();
          this.notifyErrorListeners();
        }

        // Throttled server update
        if (Date.now() - this.lastServerUpdateTime > this.updateDelay) {
          this.updateServerLocation(location);
        }
      },
      (error) => {
        console.error('[LocationService] Web watch position error:', error);
        this.isError = true;
        this.notifyErrorListeners();
      },
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 10000 }
    );
    console.log('[LocationService] Web watch position started');
  }

  // Start native continuous location watching
  private async startNativeWatch(): Promise<void> {
    try {
      this.watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true, maximumAge: 0 },
        (position, err) => {
          if (err) {
            console.error('[LocationService] Watch position error:', err);
            return;
          }
          if (position) {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            this.currentLocation = location;
            
            // Throttle UI updates exactly like web watch to prevent massive DOM lag
            if (this.shouldNotifyUI()) {
              this.isError = false;
              this.notifyLocationListeners();
              this.notifyErrorListeners();
            }

            // Throttled server update
            if (Date.now() - this.lastServerUpdateTime > this.updateDelay) {
              this.updateServerLocation(location);
            }
          }
        }
      );
      console.log('[LocationService] Native watch position started');
    } catch (error) {
      console.error('[LocationService] Failed to start native watch:', error);
    }
  }

  // Clean up the service
  public cleanup(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.watchId !== null) {
      Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }
    if (this.webWatchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.webWatchId);
      this.webWatchId = null;
    }
  }

  // Debounced update location private implementation
  private debouncedLocationUpdate = debounce(async () => {
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

      // Update server if throttle allows
      if (Date.now() - this.lastServerUpdateTime > this.updateDelay) {
        this.updateServerLocation(location);
      }

      console.log("[LocationService] Location updated:", this.currentLocation);
    } catch (error) {
      console.error("[LocationService] Failed to update location:", error);
      this.isError = true;
      this.notifyErrorListeners();
    }
  }, 1000);

  // Public update location method
  public async updateLocation(): Promise<void> {
    this.debouncedLocationUpdate();
  }

  // Get current position — native or web
  private async getCurrentPosition(): Promise<{ coords: { latitude: number; longitude: number } }> {
    if (Capacitor.isNativePlatform()) {
      // Check permissions first on native
      const permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted') {
        const requested = await Geolocation.requestPermissions();
        if (requested.location !== 'granted') {
          throw new Error('Location permission denied');
        }
      }
      const position: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
      return position;
    } else {
      // Web fallback
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          position => resolve(position),
          error => reject(error),
          { enableHighAccuracy: false, timeout: 30000, maximumAge: 10000 }
        );
      });
    }
  }

  // Debounced server update
  private debouncedServerUpdate = debounce(async (location: { latitude: number; longitude: number }) => {
    try {
      const response = await apiRequest("POST", "/api/users/location", location);
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      console.log("[LocationService] Server location updated:", location);
      this.lastServerUpdateTime = Date.now();
    } catch (error) {
      console.error("[LocationService] Failed to update server location:", error);
    }
  }, 1000);

  // Update location on server with throttling
  public async updateServerLocation(
    location: { latitude: number; longitude: number }
  ): Promise<void> {
    const now = Date.now();
    if (now - this.lastServerUpdateTime > this.updateDelay) {
      this.debouncedServerUpdate(location);
    } else {
      console.log("[LocationService] Skipping server update - too soon");
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