// ============================================================
// FriendMap – Location utility service (frontend)
// ============================================================

const EARTH_RADIUS_M = 6_371_000; // metres

/**
 * Haversine formula – distance between two GPS coordinates in metres.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Human-readable distance string.
 * < 1 km → "500 m"
 * ≥ 1 km → "1.2 km"
 */
export function formatDistance(meters: number): string {
  if (meters < 1_000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1_000).toFixed(1)} km`;
}

/**
 * Human-readable duration string.
 * < 60 s  → "30 sec"
 * < 3600  → "5 min"
 * ≥ 3600  → "1 hr 30 min"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`;
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMin = minutes % 60;
  return remainingMin === 0 ? `${hours} hr` : `${hours} hr ${remainingMin} min`;
}

/**
 * Human-readable "last seen" label relative to now.
 */
export function formatLastSeen(dateIso: string): string {
  const diff = Date.now() - new Date(dateIso).getTime();
  const seconds = Math.floor(diff / 1_000);

  if (seconds < 30) return 'Just now';
  if (seconds < 60) return `${seconds} sec ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

/**
 * Generates a Google Maps directions URL.
 * mode: 'driving' | 'walking' | 'bicycling'
 */
export function getGoogleMapsUrl(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  mode: 'driving' | 'walking' | 'cycling' = 'driving'
): string {
  const travelMode = mode === 'cycling' ? 'bicycling' : mode;
  const origin = `${originLat},${originLng}`;
  const dest = `${destLat},${destLng}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=${travelMode}`;
}

/**
 * Calculate bearing between two coordinates (degrees, 0 = North).
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * ETA string based on current time + remaining seconds.
 */
export function formatETA(remainingSeconds: number): string {
  const eta = new Date(Date.now() + remainingSeconds * 1_000);
  return eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
