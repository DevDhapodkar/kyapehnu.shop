import axios from "axios";

/**
 * Center coordinates for India (Geographic Center)
 */
export const INDIA_CENTER = {
  lat: 20.5937,
  lng: 78.9629,
};

/**
 * Bounding box for India territory
 * Latitude: ~6.0° N (Great Nicobar/Kanyakumari) to 38.0° N (Kashmir)
 * Longitude: ~68.0° E (Gujarat) to 98.0° E (Arunachal Pradesh)
 */
export const INDIA_BOUNDS = {
  minLat: 6.0,
  maxLat: 38.0,
  minLng: 68.0,
  maxLng: 98.0,
};

/**
 * Maximum intra-city / hyperlocal courier radius in kilometers for 45-60 min dispatch
 */
export const MAX_HYPERLOCAL_RADIUS_KM = 35;

/**
 * Valid Indian delivery pincodes: Standard 6-digit PIN code starting with digits 1-9
 */
export const INDIAN_PINCODE_REGEX = /^[1-9][0-9]{5}$/;

// Backward-compatible alias exports
export const NAGPUR_CENTER = INDIA_CENTER;
export const NAGPUR_BOUNDS = INDIA_BOUNDS;
export const NAGPUR_PINCODE_REGEX = INDIAN_PINCODE_REGEX;
export const MAX_DELIVERY_RADIUS_KM = MAX_HYPERLOCAL_RADIUS_KM;

/**
 * Haversine formula to compute great-circle distance between two coordinates in km
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return 0;
  }
  const R = 6371; // Earth radius in km
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
 * Check whether coordinates fall inside India geographic boundary box
 */
export function isWithinIndiaBounds(lat, lng) {
  if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return false;
  return (
    lat >= INDIA_BOUNDS.minLat &&
    lat <= INDIA_BOUNDS.maxLat &&
    lng >= INDIA_BOUNDS.minLng &&
    lng <= INDIA_BOUNDS.maxLng
  );
}
export const isWithinNagpurBounds = isWithinIndiaBounds;

/**
 * Validates city name string. Accepts any Indian city or territory.
 */
export function isValidCity(city) {
  if (!city || typeof city !== "string") return true;
  const clean = city.trim();
  return clean.length >= 2;
}
export const isValidNagpurCity = isValidCity;

/**
 * Validates pincode against Indian delivery zones (6-digit PIN).
 */
export function isValidIndianPincode(pincode) {
  if (!pincode) return false;
  const cleaned = String(pincode).trim();
  return INDIAN_PINCODE_REGEX.test(cleaned);
}
export const isValidNagpurPincode = isValidIndianPincode;

/**
 * Calls Porter API quote/cost endpoint if API key is present in environment
 */
async function callPorterApiCost(pickup, drop) {
  const apiKey = process.env.PORTER_API_KEY;
  if (!apiKey) return { fallback: true };

  const apiBase = process.env.PORTER_API_BASE || "https://pfe-apigw-uat.porter.in/v1";

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
          name: "Kya Pehnu Delivery Check",
          mobile: {
            country_code: "+91",
            number: "9999999999",
          },
        },
      },
      {
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
        timeout: 4000,
      }
    );

    if (response.data && response.data.serviceable === false) {
      return {
        ok: false,
        reason: response.data.message || "Porter two-wheeler delivery is unserviceable at this destination.",
      };
    }

    return { ok: true, data: response.data };
  } catch (err) {
    if (err.response?.data?.message && /serviceable|out of/i.test(err.response.data.message)) {
      return {
        ok: false,
        reason: err.response.data.message,
      };
    }
    return { fallback: true };
  }
}

/**
 * Core Serviceability Checker for Pan-India Delivery
 */
export async function checkServiceability({ pickup, drop, pincode, city } = {}) {
  // 1. City Check
  const effectiveCity = city || drop?.address?.city;
  if (effectiveCity && !isValidCity(effectiveCity)) {
    return {
      serviceable: false,
      distanceKm: 0,
      reason: `Invalid delivery city name: "${effectiveCity}".`,
      city: effectiveCity,
    };
  }

  // 2. Pincode Check (Valid 6-digit Indian PIN)
  const effectivePincode = pincode || drop?.address?.pincode;
  if (effectivePincode && !isValidIndianPincode(effectivePincode)) {
    return {
      serviceable: false,
      distanceKm: 0,
      reason: `Pincode ${effectivePincode} is not a valid 6-digit Indian postal code.`,
      pincode: effectivePincode,
    };
  }

  // 3. Coordinates & Geo-Fence Check
  const dropLat = drop?.lat ?? drop?.address?.location?.coordinates?.[1];
  const dropLng = drop?.lng ?? drop?.address?.location?.coordinates?.[0];

  let distanceKm = 0;
  let tier = "HYPERLOCAL";
  let estimatedDelivery = "45-60 mins";

  if (dropLat != null && dropLng != null) {
    // Check bounding box for India
    if (!isWithinIndiaBounds(dropLat, dropLng)) {
      return {
        serviceable: false,
        distanceKm: calculateDistanceKm(INDIA_CENTER.lat, INDIA_CENTER.lng, dropLat, dropLng),
        reason: "Delivery coordinates are outside India service territory.",
      };
    }

    const pickupLat = pickup?.lat ?? pickup?.address?.location?.coordinates?.[1] ?? INDIA_CENTER.lat;
    const pickupLng = pickup?.lng ?? pickup?.address?.location?.coordinates?.[0] ?? INDIA_CENTER.lng;

    distanceKm = calculateDistanceKm(pickupLat, pickupLng, dropLat, dropLng);

    // Determine delivery tier
    if (distanceKm > MAX_HYPERLOCAL_RADIUS_KM) {
      tier = "PAN_INDIA_EXPRESS";
      estimatedDelivery = "2-4 business days";
    } else {
      tier = "HYPERLOCAL";
      estimatedDelivery = "45-60 mins";

      // Live Porter API Check for hyperlocal routes if API key configured
      if (process.env.PORTER_API_KEY && pickupLat != null && pickupLng != null) {
        const porterCheck = await callPorterApiCost(
          { lat: pickupLat, lng: pickupLng },
          { lat: dropLat, lng: dropLng }
        );
        if (porterCheck.ok === false) {
          tier = "PAN_INDIA_EXPRESS";
          estimatedDelivery = "2-4 business days";
        }
      }
    }
  }

  return {
    serviceable: true,
    distanceKm,
    tier,
    estimatedDelivery,
    city: effectiveCity || "India",
    pincode: effectivePincode || "400001",
  };
}
