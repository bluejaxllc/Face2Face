/**
 * Motion Service
 * Handles device motion detection for the "bump" feature
 */

// Type for motion detection callback
type MotionCallback = (direction: MotionDirection, intensity: number) => void;

// Custom type for device acceleration
interface DeviceAccelerationData {
  x: number | null;
  y: number | null;
  z: number | null;
}

// Direction of motion
export enum MotionDirection {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
  FORWARD = 'forward',
  BACKWARD = 'backward',
  UNKNOWN = 'unknown'
}

class MotionService {
  private isListening: boolean = false;
  private callbacks: Set<MotionCallback> = new Set();
  private lastReading: DeviceAccelerationData | null = null;
  private movementThreshold: number = 10; // Acceleration threshold to detect movement
  private debounceTimeout: number | null = null;
  private debounceDelay: number = 300; // Milliseconds to wait between motion events

  constructor() {
    this.handleDeviceMotion = this.handleDeviceMotion.bind(this);
  }

  /**
   * Start listening for device motion events
   */
  public startListening(): Promise<boolean> {
    if (this.isListening) {
      return Promise.resolve(true);
    }

    // Check if the DeviceMotionEvent is available
    if (!window.DeviceMotionEvent) {
      console.error('Device motion not supported');
      return Promise.reject('Device motion not supported');
    }

    return new Promise((resolve, reject) => {
      try {
        // For iOS 13+, we need to request permission
        if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
          (DeviceMotionEvent as any).requestPermission()
            .then((permissionState: string) => {
              if (permissionState === 'granted') {
                this.addEventListeners();
                resolve(true);
              } else {
                reject('Permission denied');
              }
            })
            .catch(reject);
        } else {
          // For other browsers
          this.addEventListeners();
          resolve(true);
        }
      } catch (error) {
        console.error('Error starting motion detection:', error);
        reject(error);
      }
    });
  }

  /**
   * Stop listening for device motion events
   */
  public stopListening(): void {
    if (!this.isListening) {
      return;
    }

    window.removeEventListener('devicemotion', this.handleDeviceMotion);
    this.isListening = false;
    this.lastReading = null;
    
    if (this.debounceTimeout) {
      window.clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
  }

  /**
   * Add a callback function to be called when motion is detected
   */
  public addMotionListener(callback: MotionCallback): void {
    this.callbacks.add(callback);
  }

  /**
   * Remove a previously added callback
   */
  public removeMotionListener(callback: MotionCallback): void {
    this.callbacks.delete(callback);
  }

  /**
   * Set the threshold for motion detection
   * Higher values require more forceful movement
   */
  public setMovementThreshold(threshold: number): void {
    this.movementThreshold = threshold;
  }

  /**
   * Check if the device supports motion detection
   */
  public static isSupported(): boolean {
    return !!window.DeviceMotionEvent;
  }

  /**
   * Add event listeners for device motion
   */
  private addEventListeners(): void {
    window.addEventListener('devicemotion', this.handleDeviceMotion);
    this.isListening = true;
  }

  /**
   * Handle device motion events
   */
  private handleDeviceMotion(event: DeviceMotionEvent): void {
    if (!event.accelerationIncludingGravity) {
      return;
    }

    const { x, y, z } = event.accelerationIncludingGravity;
    if (x === null || y === null || z === null) {
      return;
    }

    // Check if we have a previous reading to compare against
    if (this.lastReading) {
      const deltaX = x - this.lastReading.x!;
      const deltaY = y - this.lastReading.y!;
      const deltaZ = z - this.lastReading.z!;

      // Calculate the magnitude of the acceleration change
      const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

      // If the magnitude is above our threshold, determine the direction
      if (magnitude > this.movementThreshold) {
        // Debounce the motion event to prevent rapid firing
        if (this.debounceTimeout === null) {
          const direction = this.determineDirection(deltaX, deltaY, deltaZ);
          
          // Notify all callbacks
          this.callbacks.forEach(callback => {
            callback(direction, magnitude);
          });

          // Set debounce timeout
          this.debounceTimeout = window.setTimeout(() => {
            this.debounceTimeout = null;
          }, this.debounceDelay);
        }
      }
    }

    // Update last reading
    this.lastReading = { x, y, z };
  }

  /**
   * Determine the direction of motion based on acceleration changes
   */
  private determineDirection(deltaX: number, deltaY: number, deltaZ: number): MotionDirection {
    // Find the axis with the largest change
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const absZ = Math.abs(deltaZ);

    // Determine which axis had the most significant change
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

// Export the class and singleton instance
export { MotionService };
export const motionService = new MotionService();
export default motionService;