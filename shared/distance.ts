/**
 * Calculate the distance between two points on Earth
 * using the Haversine formula
 * 
 * @param lat1 Latitude of first point in degrees
 * @param lon1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lon2 Longitude of second point in degrees
 * @returns Distance in miles
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const latRad1 = (lat1 * Math.PI) / 180;
    const lonRad1 = (lon1 * Math.PI) / 180;
    const latRad2 = (lat2 * Math.PI) / 180;
    const lonRad2 = (lon2 * Math.PI) / 180;

    const dLat = latRad2 - latRad1;
    const dLon = lonRad2 - lonRad1;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(latRad1) * Math.cos(latRad2) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const earthRadius = 3958.8; // miles
    return earthRadius * c;
}

/**
 * Determine if two users are within bumping distance (3 miles)
 */
export function isWithinBumpingDistance(
    userLat: number,
    userLon: number,
    otherLat: number,
    otherLon: number
): boolean {
    return calculateDistance(userLat, userLon, otherLat, otherLon) <= 3;
}

/**
 * Format a distance for display
 */
export function formatDistance(distance: number): string {
    if (distance < 0.1) {
        return "Nearby";
    } else if (distance < 1) {
        return `${(distance * 5280).toFixed(0)} feet`;
    } else {
        return `${distance.toFixed(1)} miles`;
    }
}
