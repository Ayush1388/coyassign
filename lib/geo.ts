/** Great-circle distance in km (haversine). */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * PRIVACY: exact distances let anyone triangulate a person from three
 * vantage points. We only ever expose (and filter on) a coarse band:
 *   < 1 km -> 0 ("under 1 km") · < 10 km -> whole km · < 50 km -> nearest 5
 *   < 200 km -> nearest 10 · otherwise nearest 50
 * Filtering on the band (not the exact value) also stops a "binary search the
 * max-distance filter" attack from recovering the exact distance.
 */
export function distanceBand(km: number): number {
  if (km < 1) return 0;
  if (km < 10) return Math.round(km);
  if (km < 50) return Math.round(km / 5) * 5;
  if (km < 200) return Math.round(km / 10) * 10;
  return Math.round(km / 50) * 50;
}

export function bandBetween(
  a: { lat: number | null; lng: number | null },
  b: { lat: number | null; lng: number | null },
): number | null {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  return distanceBand(haversineKm({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng }));
}

/** Interests both people listed. Case-insensitive, in the other person's wording. */
export function sharedInterests(mine: string[], theirs: string[]): string[] {
  const set = new Set(mine.map((i) => i.trim().toLowerCase()));
  return theirs.filter((i) => set.has(i.trim().toLowerCase()));
}
