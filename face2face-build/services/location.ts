/**
 * Location Service — Expo Native
 * Uses expo-location for reliable GPS on both iOS and Android.
 * Replaces Capacitor/browser geolocation with proper native access.
 */

import * as Location from 'expo-location';
import api from './api';
import { Alert } from 'react-native';

type LocationData = { latitude: number; longitude: number };
type LocationCallback = (location: LocationData | null) => void;
type ErrorCallback = (isError: boolean) => void;

class LocationService {
  private static instance: LocationService;
  private currentLocation: LocationData | null = null;
  private isError: boolean = false;
  private locationListeners: LocationCallback[] = [];
  private errorListeners: ErrorCallback[] = [];
  private watchSubscription: Location.LocationSubscription | null = null;
  private lastServerUpdateTime: number = 0;
  private updateDelay: number = 5000; // 5 seconds between server updates
  private lastUINotificationTime: number = 0;

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request permissions and start watching location
   */
  async initialize(): Promise<void> {
    try {
      // Request foreground permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[LocationService] Permission denied');
        this.isError = true;
        this.notifyErrorListeners();
        return;
      }

      // Get initial position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      this.currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      this.isError = false;
      this.notifyLocationListeners();
      this.notifyErrorListeners();
      this.updateServerLocation(this.currentLocation);

      // Start continuous watching
      this.startWatching();

      console.log('[LocationService] Initialized:', this.currentLocation);
    } catch (error) {
      console.warn('[LocationService] Initialization failed:', error);
      this.isError = true;
      this.notifyErrorListeners();
    }
  }

  private async startWatching(): Promise<void> {
    if (this.watchSubscription) return;

    this.watchSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 10, // Or when moved 10 meters
      },
      (position) => {
        const location: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        this.currentLocation = location;

        // Throttle UI updates
        const now = Date.now();
        if (now - this.lastUINotificationTime > 2000) {
          this.lastUINotificationTime = now;
          this.isError = false;
          this.notifyLocationListeners();
          this.notifyErrorListeners();
        }

        // Throttled server update
        if (now - this.lastServerUpdateTime > this.updateDelay) {
          this.updateServerLocation(location);
        }
      }
    );

    console.log('[LocationService] Watch started');
  }

  /**
   * Subscribe to location updates
   */
  subscribeToLocation(callback: LocationCallback): () => void {
    this.locationListeners.push(callback);
    callback(this.currentLocation);
    return () => {
      this.locationListeners = this.locationListeners.filter(l => l !== callback);
    };
  }

  /**
   * Subscribe to error state
   */
  subscribeToError(callback: ErrorCallback): () => void {
    this.errorListeners.push(callback);
    callback(this.isError);
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== callback);
    };
  }

  private notifyLocationListeners(): void {
    this.locationListeners.forEach(l => l(this.currentLocation));
  }

  private notifyErrorListeners(): void {
    this.errorListeners.forEach(l => l(this.isError));
  }

  /**
   * Force a location update
   */
  async updateLocation(): Promise<void> {
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      this.currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      this.isError = false;
      this.notifyLocationListeners();
      this.notifyErrorListeners();
      this.updateServerLocation(this.currentLocation);
    } catch (error) {
      console.warn('[LocationService] Update failed:', error);
      this.isError = true;
      this.notifyErrorListeners();
    }
  }

  /**
   * Update location on the server
   */
  private async updateServerLocation(location: LocationData): Promise<void> {
    // Don't attempt server updates if not authenticated
    if (!api.isAuthenticated()) {
      console.log('[LocationService] Skipping server update — not authenticated');
      return;
    }
    try {
      await api.patch('/api/users/profile', location);
      this.lastServerUpdateTime = Date.now();
      console.log('[LocationService] Server updated:', location);
    } catch (error) {
      console.warn('[LocationService] Server update failed:', error);
    }
  }

  getLocation(): LocationData | null {
    return this.currentLocation;
  }

  getErrorState(): boolean {
    return this.isError;
  }

  /**
   * Clean up subscriptions
   */
  cleanup(): void {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
  }
}

export default LocationService;
