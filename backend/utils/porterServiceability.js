import axios from 'axios';

/**
 * Center coordinates for Nagpur, Maharashtra (Zero Mile Stone area)
 */
export const NAGPUR_CENTER = {
  lat: 21.1458,
  lng: 79.0882,
};

/**
 * Bounding box for Nagpur metropolitan & industrial belt
 * Covers Sitabuldi, Dharampeth, Sadar, Wardhaman Nagar, Itwari, Gandhibagh,
 * Hingna, Butibori, Wadi, Kamptee, and MIHAN corridors.
 */
export const NAGPUR_BOUNDS = {
  minLat: 20.95,
  maxLat: 21.32,
  minLng: 78.90,
  maxLng: 79.25,
};

/**
 * Maximum intra-city delivery radius in kilometers for 60-min Porter courier dispatch
 */
export const MAX_DELIVERY_RADIUS_KM = 25;

/**
 * Valid Nagpur delivery pincodes:
 * - 440001 - 440037 (Urban Nagpur post offices)
 * - 441xxx (Nagpur district peri-urban corridors: Hingna 441110, Wadi 440023, Butibori 441108, Kamptee 441001/441002, Kalmeshwar 441501)
 */
export const NAGPUR_PINCODE_REGEX = /^(4400\d{2}|441\d{3})$/;

/**
 * Haversine formula to compute great-circle distance between two coordinates in km
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return 0;
  }
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Check whether coordinates fall inside Nagpur's geographic boundary box
 */
export function isWithinNagpurBounds(lat, lng) {
  if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return false;
  return (
    lat >= NAGPUR_BOUNDS.minLat &&
    lat <= NAGPUR_BOUNDS.maxLat &&
    lng >= NAGPUR_BOUNDS.minLng &&
    lng <= NAGPUR_BOUNDS.maxLng
  );
}

/**
 * Validates city name string. Rejects other metro cities.
 */
export function isValidNagpurCity(city) {
  if (!city || typeof city !== 'string') return true; // fallback to pincode/coords if omitted
  const clean = city.trim().toLowerCase();
  // If explicitly specified, must be Nagpur
  return clean === 'nagpur' || clean.includes('nagpur');
}

/**
 * Validates pincode against Nagpur delivery zones.
 */
export function isValidNagpurPincode(pincode) {
  if (!pincode) return false;
  const cleaned = String(pincode).trim();
  return NAGPUR_PINCODE_REGEX.test(cleaned);
}

/**
 * Calls Porter API quote/cost endpoint if API key is present in environment
 */
async function callPorterApiCost(pickup, drop) {
  const apiKey = process.env.PORTER_API_KEY;
  if (!apiKey) return { fallback: true };

  const apiBase = process.env.PORTER_API_BASE || 'https://pfe-apigw-uat.porter.in/v1';

  try {
    const response = await axios.post(
      `${apiBase}/orders/cost`,
      {
        pickup_details: {
          lat: pickup.lat,
          lng: pickup.lng,
        },
        drop_details: {
          lat: drop.lat,
          lng: drop.lng,
        },
        customer: {
          name: 'Kya Pehnu Delivery Check',
          mobile: {
            country_code: '+91',
            number: '9999999999',
          },
        },
      },
      {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 4000,
      }
    );

    if (response.data && response.data.serviceable === false) {
      return {
        ok: false,
        reason: response.data.message || 'Porter two-wheeler delivery is unserviceable at this destination.',
      };
    }

    return { ok: true, data: response.data };
  } catch (err) {
    // If Porter returns 400 with unserviceable message
    if (err.response?.data?.message && /serviceable|out of/i.test(err.response.data.message)) {
      return {
        ok: false,
        reason: err.response.data.message,
      };
    }
    // On network failure or sandbox timeout, fall back to geofence logic
    return { fallback: true };
  }
}

/**
 * Core Serviceability Checker for Nagpur Intra-City Delivery
 * @param {Object} params
 * @param {Object} [params.pickup] - { lat, lng, address }
 * @param {Object} [params.drop] - { lat, lng, address }
 * @param {string} [params.pincode] - e.g. "440010"
 * @param {string} [params.city] - e.g. "Nagpur"
 * @returns {Promise<{ serviceable: boolean, distanceKm: number, reason?: string, city?: string, pincode?: string }>}
 */
export async function checkServiceability({ pickup, drop, pincode, city } = {}) {
  // 1. City Check
  const effectiveCity = city || drop?.address?.city;
  if (effectiveCity && !isValidNagpurCity(effectiveCity)) {
    return {
      serviceable: false,
      distanceKm: 0,
      reason: `Kya Pehnu currently operates only within Nagpur city limits. Orders to "${effectiveCity}" cannot be fulfilled.`,
      city: effectiveCity,
    };
  }

  // 2. Pincode Check
  const effectivePincode = pincode || drop?.address?.pincode;
  if (effectivePincode && !isValidNagpurPincode(effectivePincode)) {
    return {
      serviceable: false,
      distanceKm: 0,
      reason: `Pincode ${effectivePincode} is outside Porter's same-city delivery network in Nagpur (must begin with 4400xx or 441xxx).`,
      pincode: effectivePincode,
    };
  }

  // 3. Coordinates & Geo-Fence Check
  const dropLat = drop?.lat ?? drop?.address?.location?.coordinates?.[1];
  const dropLng = drop?.lng ?? drop?.address?.location?.coordinates?.[0];

  let distanceKm = 0;

  if (dropLat != null && dropLng != null) {
    // Check bounding box
    if (!isWithinNagpurBounds(dropLat, dropLng)) {
      return {
        serviceable: false,
        distanceKm: calculateDistanceKm(NAGPUR_CENTER.lat, NAGPUR_CENTER.lng, dropLat, dropLng),
        reason: "Delivery coordinates are outside Nagpur's urban delivery perimeter.",
      };
    }

    // Distance from center of Nagpur
    const distanceFromCenter = calculateDistanceKm(
      NAGPUR_CENTER.lat,
      NAGPUR_CENTER.lng,
      dropLat,
      dropLng
    );

    // Distance from pickup/vendor (if provided)
    const pickupLat = pickup?.lat ?? pickup?.address?.location?.coordinates?.[1] ?? NAGPUR_CENTER.lat;
    const pickupLng = pickup?.lng ?? pickup?.address?.location?.coordinates?.[0] ?? NAGPUR_CENTER.lng;

    const distanceFromPickup = calculateDistanceKm(pickupLat, pickupLng, dropLat, dropLng);
    distanceKm = distanceFromPickup || distanceFromCenter;

    if (distanceFromCenter > MAX_DELIVERY_RADIUS_KM || distanceFromPickup > MAX_DELIVERY_RADIUS_KM) {
      return {
        serviceable: false,
        distanceKm,
        reason: `Delivery distance (${distanceKm} km) exceeds the 25 km same-city courier limit for 60-minute delivery.`,
      };
    }

    // 4. Live Porter API Check (if API key configured)
    if (process.env.PORTER_API_KEY && pickupLat != null && pickupLng != null) {
      const porterCheck = await callPorterApiCost(
        { lat: pickupLat, lng: pickupLng },
        { lat: dropLat, lng: dropLng }
      );
      if (porterCheck.ok === false) {
        return {
          serviceable: false,
          distanceKm,
          reason: porterCheck.reason || "Porter's courier network does not currently service this route.",
        };
      }
    }
  }

  return {
    serviceable: true,
    distanceKm,
    city: 'Nagpur',
    pincode: effectivePincode || '440001',
  };
}
