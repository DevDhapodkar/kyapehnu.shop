/**
 * Geo distance helpers for the "nearest to you" experience.
 *
 * Pure and RN-free so the haversine maths is unit-tested in plain Node and
 * reused by the storefront rail and anywhere else that needs "how far is this
 * shop". Distances are in kilometres, rounded to one decimal for display.
 */

const EARTH_RADIUS_KM = 6371;
const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * Great-circle distance between two { latitude, longitude } points, in km.
 * Returns null if either point is missing a coordinate.
 */
export const haversineKm = (a, b) => {
  if (!a || !b || a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) {
    return null;
  }

  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

/** One-decimal km, for card labels. */
export const roundKm = (km) => (km == null ? null : Math.round(km * 10) / 10);

/**
 * Attach a `distanceKm` to each product from `origin` to the product's
 * `storeLocation` (falls back to `storeCoordinates`, the mock data's field).
 * Products without a store location keep whatever `distanceKm` they already had.
 */
export const withDistance = (products, origin) =>
  (products ?? []).map((product) => {
    const store = product.storeLocation ?? product.storeCoordinates;
    const km = haversineKm(origin, store);
    if (km == null) return product;
    return { ...product, distanceKm: roundKm(km) };
  });

export default haversineKm;
