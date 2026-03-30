/**
 * Motion Service
 * Cross-platform device motion detection using the browser DeviceMotionEvent API.
 * 
 * Handles iOS 13+ permission prompts automatically. No Capacitor dependency.
 * Permission must be requested from within a user gesture (tap/click).
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
  private movementThreshold: number = 10;
  private debounceTimeout: number | null = null;
  private debounceDelay: number = 300;

  constructor() {
    this.handleDeviceMotion = this.handleDeviceMotion.bind(this);
  }

  /**
   * Request IMU permission and start listening for device motion events.
   * MUST be called from within a user gesture handler (tap/click).
   */
  public async startListening(): Promise<boolean> {
    if (this.isListening) {
      return true;
    }

    if (!window.DeviceMotionEvent) {
      console.error('[MotionService] Device motion not supported in this browser');
      return Promise.reject('Device motion not supported');
    }

    // iOS 13+ requires explicit permission request via user gesture
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceMotionEvent as any).requestPermission();
        if (permissionState === 'granted') {
          this.addWebEventListeners();
          return true;
        } else {
          console.warn('[MotionService] User denied IMU access.');
          return Promise.reject('Permission denied');
        }
      } catch (error) {
        console.error('[MotionService] Permission request failed:', error);
        return Promise.reject(error);
      }
    }

    // Android and older iOS — no permission prompt needed
    this.addWebEventListeners();
    return true;
  }

  /**
   * Stop listening for device motion events
   */
  public stopListening(): void {
    if (!this.isListening) return;

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
   * Set the threshold for motion detection (higher = more forceful movement needed)
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
   * Check if iOS 13+ permission prompt is required
   */
  public static requiresPermission(): boolean {
    return typeof (DeviceMotionEvent as any).requestPermission === 'function';
  }

  /**
   * Add the devicemotion event listener
   */
  private addWebEventListeners(): void {
    window.addEventListener('devicemotion', this.handleDeviceMotion);
    this.isListening = true;
    console.log('[MotionService] Accelerometer listener started');
  }

  /**
   * Handle web device motion events
   */
  private handleDeviceMotion(event: DeviceMotionEvent): void {
    if (!event.accelerationIncludingGravity) return;

    const { x, y, z } = event.accelerationIncludingGravity;
    if (x === null || y === null || z === null) return;

    this.processAcceleration(x, y, z);
  }

  /**
   * Process acceleration data and detect significant motion
   */
  private processAcceleration(x: number, y: number, z: number): void {
    if (this.lastReading) {
      const deltaX = x - this.lastReading.x!;
      const deltaY = y - this.lastReading.y!;
      const deltaZ = z - this.lastReading.z!;

      const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

      if (magnitude > this.movementThreshold) {
        if (this.debounceTimeout === null) {
          const direction = this.determineDirection(deltaX, deltaY, deltaZ);

          this.callbacks.forEach(callback => {
            callback(direction, magnitude);
          });

          this.debounceTimeout = window.setTimeout(() => {
            this.debounceTimeout = null;
          }, this.debounceDelay);
        }
      }
    }

    this.lastReading = { x, y, z };
  }

  /**
   * Determine the direction of motion based on acceleration deltas
   */
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

// Export the class and singleton instance
export { MotionService };
export const motionService = new MotionService();
export default motionService;