import { Platform } from 'react-native';
import * as Location from 'expo-location';

export const NAGPUR_CENTER = { latitude: 21.1458, longitude: 79.0882 };

/**
 * Curated centroids and official postal codes for major Nagpur localities.
 * Used for instant, offline-resilient hyper-local neighbourhood resolution.
 */
export const NAGPUR_AREAS = [
  { name: 'Dharampeth', lat: 21.1432, lng: 79.0617, pincode: '440010' },
  { name: 'Ramdaspeth', lat: 21.1345, lng: 79.0745, pincode: '440010' },
  { name: 'Sitabuldi', lat: 21.1458, lng: 79.0835, pincode: '440012' },
  { name: 'Civil Lines', lat: 21.1553, lng: 79.0734, pincode: '440001' },
  { name: 'Sadar', lat: 21.1633, lng: 79.0818, pincode: '440001' },
  { name: 'Pratap Nagar', lat: 21.1189, lng: 79.056, pincode: '440022' },
  { name: 'Laxmi Nagar', lat: 21.1235, lng: 79.0664, pincode: '440022' },
  { name: 'Bajaj Nagar', lat: 21.1278, lng: 79.065, pincode: '440010' },
  { name: 'Manish Nagar', lat: 21.0905, lng: 79.0805, pincode: '440015' },
  { name: 'Besa', lat: 21.0772, lng: 79.091, pincode: '440037' },
  { name: 'Dhantoli', lat: 21.134, lng: 79.085, pincode: '440012' },
  { name: 'Gandhibagh', lat: 21.1504, lng: 79.1022, pincode: '440002' },
  { name: 'Itwari', lat: 21.1528, lng: 79.1126, pincode: '440002' },
  { name: 'Mahal', lat: 21.1442, lng: 79.1065, pincode: '440032' },
  { name: 'Nandanvan', lat: 21.1305, lng: 79.1305, pincode: '440009' },
  { name: 'Sakkardara', lat: 21.122, lng: 79.114, pincode: '440024' },
  { name: 'Reshim Bagh', lat: 21.127, lng: 79.103, pincode: '440009' },
  { name: 'Wardha Road', lat: 21.1105, lng: 79.0685, pincode: '440015' },
  { name: 'Khamla', lat: 21.113, lng: 79.06, pincode: '440025' },
  { name: 'Trimurti Nagar', lat: 21.114, lng: 79.044, pincode: '440022' },
  { name: 'Lokmanya Nagar', lat: 21.109, lng: 79.018, pincode: '440016' },
  { name: 'Wadi', lat: 21.149, lng: 79.001, pincode: '440023' },
  { name: 'Seminary Hills', lat: 21.166, lng: 79.055, pincode: '440006' },
  { name: 'Jaripatka', lat: 21.189, lng: 79.092, pincode: '440014' },
  { name: 'Mankapur', lat: 21.196, lng: 79.079, pincode: '440030' },
  { name: 'Katol Road', lat: 21.178, lng: 79.048, pincode: '440013' },
  { name: 'Koradi Road', lat: 21.205, lng: 79.072, pincode: '440030' },
  { name: 'Hudkeshwar', lat: 21.098, lng: 79.124, pincode: '440034' },
  { name: 'Ayodhya Nagar', lat: 21.1135, lng: 79.1215, pincode: '440024' },
  { name: 'Medical Square', lat: 21.133, lng: 79.097, pincode: '440003' },
  { name: 'Shankar Nagar', lat: 21.136, lng: 79.057, pincode: '440010' },
  { name: 'Gokulpeth', lat: 21.1415, lng: 79.0555, pincode: '440010' },
  { name: 'Shivaji Nagar', lat: 21.139, lng: 79.064, pincode: '440010' },
  { name: 'Somalwada', lat: 21.096, lng: 79.067, pincode: '440025' },
  { name: 'MIHAN Airport', lat: 21.07, lng: 79.055, pincode: '440005' },
  { name: 'Narendra Nagar', lat: 21.103, lng: 79.076, pincode: '440015' },
  { name: 'Subhash Nagar', lat: 21.121, lng: 79.043, pincode: '440022' },
  { name: 'Jaitala', lat: 21.102, lng: 79.034, pincode: '440036' },
];

/**
 * Calculates distance between two latitude/longitude points in kilometers (Haversine formula).
 */
export function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Checks if the given coordinate is within the Nagpur delivery zone (~35 km radius).
 */
export function isWithinNagpur(latitude, longitude) {
  return (
    getDistanceKm(
      latitude,
      longitude,
      NAGPUR_CENTER.latitude,
      NAGPUR_CENTER.longitude
    ) <= 35
  );
}

/**
 * Finds the nearest known Nagpur neighbourhood centroid.
 */
export function getClosestNagpurArea(lat, lng) {
  let closest = NAGPUR_AREAS[0];
  let minDist = Infinity;
  for (const area of NAGPUR_AREAS) {
    const d = getDistanceKm(lat, lng, area.lat, area.lng);
    if (d < minDist) {
      minDist = d;
      closest = { ...area, distanceKm: d };
    }
  }
  return closest;
}

/**
 * Checks if location permission is already granted without triggering a prompt.
 */
export async function checkHasLocationPermission() {
  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      try {
        const res = await navigator.permissions.query({ name: 'geolocation' });
        return res.state === 'granted';
      } catch {
        return false;
      }
    }
    return false;
  }
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Prompts user for location permission if needed.
 */
export async function requestLocationPermission() {
  if (Platform.OS === 'web') {
    return true;
  }
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

/**
 * Fetches accurate coordinates from device GPS / browser geolocation with high accuracy.
 */
export async function getCurrentCoordinates() {
  if (Platform.OS === 'web') {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      throw new Error('Geolocation not supported by browser');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (highAccErr) => {
          // If high accuracy timed out (e.g. laptop without GPS), gracefully retry with balanced accuracy
          navigator.geolocation.getCurrentPosition(
            (fallbackPos) => {
              resolve({
                latitude: fallbackPos.coords.latitude,
                longitude: fallbackPos.coords.longitude,
                accuracy: fallbackPos.coords.accuracy,
              });
            },
            (fallbackErr) => {
              reject(highAccErr || fallbackErr);
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 15000,
        }
      );
    });
  }

  // Native (iOS/Android): High accuracy GPS fix
  const granted = await requestLocationPermission();
  if (!granted) {
    throw new Error('Permission denied');
  }

  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Highest,
  });

  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
  };
}

// In-memory cache to avoid re-querying Nominatim repeatedly
const geocodeCache = new Map();

/**
 * Reverse geocodes coordinates into an accurate neighbourhood and formatted address.
 * Works seamlessly across Web, iOS, and Android.
 */
export async function reverseGeocodeLocation({ latitude, longitude }) {
  const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  const inNagpur = isWithinNagpur(latitude, longitude);
  const closestNagpur = getClosestNagpurArea(latitude, longitude);

  let nominatim = null;
  // Try Nominatim with a short timeout to get street/road level detail
  try {
    const controller =
      typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller
      ? setTimeout(() => controller.abort(), 3000)
      : null;

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
      {
        headers: { 'User-Agent': 'KyaPehnuApp/1.0' },
        signal: controller?.signal,
      }
    );
    if (timeoutId) clearTimeout(timeoutId);
    if (res.ok) {
      nominatim = await res.json();
    }
  } catch {
    // Network or timeout - fallback logic will handle gracefully
  }

  // If in Nagpur:
  if (inNagpur) {
    const addr = nominatim?.address;
    const road = addr?.road || '';
    const osmSuburb = addr?.suburb || addr?.neighbourhood || addr?.residential;
    const areaName = osmSuburb || closestNagpur.name;
    const pincode = addr?.postcode || closestNagpur.pincode;

    const areaLabel = `${areaName}, Nagpur`;
    const formattedAddress = `${areaName}, Nagpur (${pincode})`;

    const result = {
      areaLabel,
      formattedAddress,
      areaName,
      road,
      pincode,
      city: 'Nagpur',
      distanceKm: closestNagpur.distanceKm,
      isNagpur: true,
    };
    geocodeCache.set(cacheKey, result);
    return result;
  }

  // If outside Nagpur (e.g. Pune, Mumbai, etc.):
  const addr = nominatim?.address;
  const locality =
    addr?.suburb ||
    addr?.neighbourhood ||
    addr?.residential ||
    addr?.town ||
    addr?.city ||
    'Outside Nagpur';
  const city = addr?.city || addr?.state_district || addr?.state || 'India';
  const pincode = addr?.postcode || '';
  const areaLabel = locality === city ? city : `${locality}, ${city}`;
  const formattedAddress = `${areaLabel}${pincode ? ` (${pincode})` : ''}`;

  const result = {
    areaLabel,
    formattedAddress,
    areaName: locality,
    pincode,
    city,
    distanceKm: closestNagpur.distanceKm,
    isNagpur: false,
  };
  geocodeCache.set(cacheKey, result);
  return result;
}
