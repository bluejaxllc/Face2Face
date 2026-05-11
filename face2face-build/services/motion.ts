/**
 * Motion Service — Expo Native
 * Uses expo-sensors Accelerometer for cross-platform bump detection.
 * No permission hacks needed — Expo handles iOS/Android natively.
 */

import { Accelerometer, type AccelerometerMeasurement } from 'expo-sensors';

export enum MotionDirection {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
  FORWARD = 'forward',
  BACKWARD = 'backward',
  UNKNOWN = 'unknown',
}

type MotionCallback = (direction: MotionDirection, intensity: number) => void;

class MotionService {
  private subscription: ReturnType<typeof Accelerometer.addListener> | null = null;
  private callbacks: Set<MotionCallback> = new Set();
  private lastReading: AccelerometerMeasurement | null = null;
  private movementThreshold: number = 0.6; // g-force threshold — low enough for gentle flicks
  private debounceTimeout: ReturnType<typeof setTimeout> | null = null;
  private debounceDelay: number = 300;

  /**
   * Start listening for accelerometer data.
   * Returns true if successful.
   */
  async startListening(): Promise<boolean> {
    const available = await Accelerometer.isAvailableAsync();
    if (!available) {
      console.error('[MotionService] Accelerometer not available on this device');
      throw new Error('Accelerometer not supported');
    }

    // No explicit permission request API exists for Accelerometer in expo-sensors. 
    // It works implicitly on native devices.

    // Set update interval to ~60fps
    Accelerometer.setUpdateInterval(16);

    this.subscription = Accelerometer.addListener((data) => {
      this.processAcceleration(data);
    });

    console.log('[MotionService] Accelerometer started');
    return true;
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    this.lastReading = null;
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
    console.log('[MotionService] Accelerometer stopped');
  }

  addMotionListener(callback: MotionCallback): void {
    this.callbacks.add(callback);
  }

  removeMotionListener(callback: MotionCallback): void {
    this.callbacks.delete(callback);
  }

  setMovementThreshold(threshold: number): void {
    this.movementThreshold = threshold;
  }

  private processAcceleration(data: AccelerometerMeasurement): void {
    const { x, y, z } = data;

    if (this.lastReading) {
      const deltaX = x - this.lastReading.x;
      const deltaY = y - this.lastReading.y;
      const deltaZ = z - this.lastReading.z;

      const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

      if (magnitude > this.movementThreshold) {
        if (this.debounceTimeout === null) {
          const direction = this.determineDirection(deltaX, deltaY, deltaZ);

          this.callbacks.forEach(callback => {
            callback(direction, magnitude);
          });

          this.debounceTimeout = setTimeout(() => {
            this.debounceTimeout = null;
          }, this.debounceDelay);
        }
      }
    }

    this.lastReading = data;
  }

  private determineDirection(deltaX: number, deltaY: number, deltaZ: number): MotionDirection {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const absZ = Math.abs(deltaZ);

    if (absX > absY && absX > absZ) {
      return deltaX > 0 ? MotionDirection.RIGHT : MotionDirection.LEFT;
    } else if (absY > absX && absY > absZ) {
      return deltaY > 0 ? MotionDirection.DOWN : MotionDirection.UP;
    } else if (absZ > absX && absZ > absY) {
      return deltaZ > 0 ? MotionDirection.BACKWARD : MotionDirection.FORWARD;
    }

    return MotionDirection.UNKNOWN;
  }
}

export const motionService = new MotionService();
export default motionService;
