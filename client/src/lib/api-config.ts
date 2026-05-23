/**
 * API Configuration
 * Detects native vs web platform and provides the correct API base URL
 */

import { Capacitor } from '@capacitor/core';

// Set your deployed backend URL here
const PRODUCTION_API_URL = 'https://face2face-production-11ee.up.railway.app';

/**
 * Get the base URL for API requests
 * - On native: uses the remote production/staging URL
 * - On web: uses relative URLs (same origin)
 */
export function getApiBaseUrl(): string {
    // If we're on a native platform (Capacitor), we MUST use the remote API URL
    if (Capacitor.isNativePlatform()) {
        return PRODUCTION_API_URL;
    }
    // If we're on a web browser and the hostname is localhost, 127.0.0.1, or local IP, use relative URLs (same origin)
    if (typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' || 
         window.location.hostname.startsWith('192.168.'))) {
        return '';
    }
    return PRODUCTION_API_URL;
}

/**
 * Build a full API URL from a path
 */
export function buildApiUrl(path: string): string {
    const base = getApiBaseUrl();
    // Ensure no double slashes
    if (base && path.startsWith('/')) {
        return `${base}${path}`;
    }
    return path;
}

export default { getApiBaseUrl, buildApiUrl };
