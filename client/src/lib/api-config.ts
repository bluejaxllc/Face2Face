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
    if (Capacitor.isNativePlatform()) {
        return PRODUCTION_API_URL;
    }
    // On web, use relative URLs (Vite proxy or same origin)
    return '';
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
