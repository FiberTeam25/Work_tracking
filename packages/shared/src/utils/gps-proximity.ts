export interface LatLng {
  lat: number
  lng: number
}

const EARTH_RADIUS_M = 6371000

/**
 * Haversine formula — distance between two GPS coordinates in meters.
 * Used by mobile app to enforce the 50m proximity check when submitting tasks.
 */
export function haversineDistanceM(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const chord =
    sinDLat * sinDLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord))
}

/**
 * Returns true if technician is within threshold meters of the target node.
 * Default threshold is 50m as per business rule.
 */
export function isWithinProximity(
  technicianPos: LatLng,
  nodePos: LatLng,
  thresholdM: number = 50
): boolean {
  return haversineDistanceM(technicianPos, nodePos) <= thresholdM
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}
