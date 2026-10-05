import { Platform } from 'react-native';
import { NAGPUR_AREAS, NAGPUR_CENTER, isWithinNagpur } from './geolocation';

export const GOOGLE_MAPS_API_KEY = 'AIzaSyCfr4q93xlmNSNHp3YTC0pd2bPmoKktPhc';

// Google Maps high-speed global tile layers
export const GOOGLE_MAPS_TILES = {
  roadmap: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
  hybrid: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
  satellite: 'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
  terrain: 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
};

export const GOOGLE_MAPS_SUBDOMAINS = ['0', '1', '2', '3'];
export const OSM_FALLBACK_TILE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const GOOGLE_MAPS_ATTRIBUTION = '&copy; Google Maps';

// SVG Badge for Google Maps
export const GOOGLE_MAPS_LOGO_SVG = `
<svg viewBox="0 0 74 24" width="68" height="22" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.35));">
  <!-- G -->
  <path fill="#4285F4" d="M12.24 10.5h-5.2v2.42h2.98c-.26 1.4-1.6 2.42-3.08 2.42a3.46 3.46 0 0 1-3.46-3.46 3.46 3.46 0 0 1 3.46-3.46c.78 0 1.5.3 2.05.82l1.82-1.82A6 6 0 0 0 7.04 6a6 6 0 1 0 5.2 9.04V10.5z"/>
  <!-- o -->
  <path fill="#EA4335" d="M18.5 8.7a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6zm0 4.88c-.9 0-1.68-.74-1.68-1.58s.78-1.58 1.68-1.58c.9 0 1.68.74 1.68 1.58s-.78 1.58-1.68 1.58z"/>
  <!-- o -->
  <path fill="#FBBC05" d="M26 8.7a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6zm0 4.88c-.9 0-1.68-.74-1.68-1.58s.78-1.58 1.68-1.58c.9 0 1.68.74 1.68 1.58s-.78 1.58-1.68 1.58z"/>
  <!-- g -->
  <path fill="#4285F4" d="M33.2 8.7a3.25 3.25 0 0 0-2.52 1.13V8.9H29v8.32c0 2.2 1.3 3.1 2.84 3.1 1.5 0 2.44-.94 2.82-1.88l-1.42-.6c-.22.54-.76 1.16-1.4 1.16-.9 0-1.54-.6-1.54-1.6v-.5a3.3 3.3 0 0 0 1.9.6c1.8 0 3.3-1.44 3.3-3.3s-1.5-3.3-3.3-3.3zm-.16 5.3c-.9 0-1.6-.76-1.6-1.62 0-.88.7-1.62 1.6-1.62s1.58.74 1.58 1.62c0 .86-.68 1.62-1.58 1.62z"/>
  <!-- l -->
  <path fill="#34A853" d="M37.5 6.2h1.64v9.1H37.5z"/>
  <!-- e -->
  <path fill="#EA4335" d="M44.4 12.3c-.1-.84-.78-1.5-1.58-1.5-.76 0-1.46.6-1.64 1.5h3.22zm1.62.94a4.4 4.4 0 0 1-3.26 2.06c-1.92 0-3.32-1.48-3.32-3.3 0-1.94 1.4-3.3 3.24-3.3 1.94 0 3.24 1.4 3.24 3.34v.32H41.1a1.72 1.72 0 0 0 1.74 1.34c.72 0 1.2-.36 1.46-.8l1.72.34z"/>
  <!-- Maps text -->
  <text x="49" y="15" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="9" font-weight="700" fill="#5F6368" letter-spacing="0.4">Maps</text>
</svg>
`;

/**
 * Creates a Leaflet Google Maps Tile Layer with automatic fallback to OSM.
 */
export function createGoogleMapsTileLayer(L, { type = 'roadmap' } = {}) {
  if (!L || typeof L.tileLayer !== 'function') return null;

  const url = GOOGLE_MAPS_TILES[type] || GOOGLE_MAPS_TILES.roadmap;
  const tileLayer = L.tileLayer(url, {
    subdomains: GOOGLE_MAPS_SUBDOMAINS,
    maxZoom: 20,
    attribution: GOOGLE_MAPS_ATTRIBUTION,
  });

  tileLayer.on('tileerror', function () {
    tileLayer.setUrl(OSM_FALLBACK_TILE);
  });

  return tileLayer;
}

/**
 * Dynamically loads the official Google Maps JavaScript API with proper library parameters.
 */
let googleMapsScriptPromise = null;

export function loadGoogleMapsScript(apiKey = GOOGLE_MAPS_API_KEY) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsScriptPromise) {
    return googleMapsScriptPromise;
  }

  googleMapsScriptPromise = new Promise((resolve) => {
    // Intercept Google Maps authentication failures to fail gracefully
    window.gm_authFailure = () => {
      console.warn('[GoogleMaps] API key authentication failed or API not activated on GCP. Falling back to Google Maps Tile Layer.');
      window.__gm_auth_failed = true;
    };

    const existingScript = document.getElementById('google-maps-js');
    if (existingScript) {
      const check = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(check);
          resolve(window.google.maps);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(check);
        resolve(window.google?.maps || null);
      }, 5000);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-js';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      resolve(window.google?.maps || null);
    };

    script.onerror = () => {
      console.warn('[GoogleMaps] Failed to load Google Maps script. Using high-resolution Google tile engine.');
      resolve(null);
    };

    document.head.appendChild(script);
  });

  return googleMapsScriptPromise;
}

/**
 * Searches and geocodes a location in Nagpur using:
 * 1. Curated Nagpur area centroid index (instant, 0 latency).
 * 2. Google Places / Geocoder if active.
 * 3. OpenStreetMap Nominatim with Nagpur bounding box fallback.
 */
export async function searchNagpurLocation(queryText) {
  if (!queryText || typeof queryText !== 'string') return null;
  const clean = queryText.trim().toLowerCase();
  if (clean.length < 2) return null;

  // 1. Direct match with curated Nagpur centroids and key educational hubs
  // High-priority match for SIT Nagpur / Symbiosis Campus
  if (
    clean.includes('sit') ||
    clean.includes('symbi') ||
    clean.includes('sibm') ||
    clean.includes('sspad') ||
    clean.includes('sid nagpur')
  ) {
    return {
      lat: 21.1272934,
      lng: 79.1595864,
      name: 'Symbiosis (SIT), Wathoda',
      pincode: '440008',
      source: 'curated_index',
    };
  }

  if (clean.includes('wathoda')) {
    return {
      lat: 21.134,
      lng: 79.148,
      name: 'Wathoda Layout',
      pincode: '440008',
      source: 'curated_index',
    };
  }

  if (clean.includes('giddoba')) {
    return {
      lat: 21.131,
      lng: 79.149,
      name: 'Giddoba Nagar, Wathoda',
      pincode: '440008',
      source: 'curated_index',
    };
  }

  if (clean.includes('bhandewadi')) {
    return {
      lat: 21.141,
      lng: 79.155,
      name: 'Bhandewadi',
      pincode: '440008',
      source: 'curated_index',
    };
  }

  if (clean.includes('kharbi')) {
    return {
      lat: 21.122,
      lng: 79.145,
      name: 'Kharbi',
      pincode: '440034',
      source: 'curated_index',
    };
  }

  for (const area of NAGPUR_AREAS) {
    const areaNameLower = area.name.toLowerCase();
    if (
      clean.includes(areaNameLower) ||
      areaNameLower.includes(clean) ||
      (clean.includes('nandanvan') && areaNameLower === 'nandanvan') ||
      (clean.includes('dharampeth') && areaNameLower === 'dharampeth') ||
      (clean.includes('sadar') && areaNameLower === 'sadar') ||
      (clean.includes('sitabuldi') && areaNameLower === 'sitabuldi') ||
      (clean.includes('ramdaspeth') && areaNameLower === 'ramdaspeth') ||
      (clean.includes('civil lines') && areaNameLower === 'civil lines')
    ) {
      return {
        lat: area.lat,
        lng: area.lng,
        name: area.name,
        pincode: area.pincode,
        source: 'curated_index',
      };
    }
  }

  // 2. Try Google Geocoder if available on window
  if (typeof window !== 'undefined' && window.google?.maps?.Geocoder && !window.__gm_auth_failed) {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const results = await new Promise((resolve, reject) => {
        geocoder.geocode(
          {
            address: `${queryText}, Nagpur, Maharashtra`,
            componentRestrictions: { country: 'IN', administrativeArea: 'Maharashtra' },
          },
          (res, status) => {
            if (status === 'OK' && res?.[0]) resolve(res[0]);
            else reject(status);
          }
        );
      });
      if (results?.geometry?.location) {
        const lat = results.geometry.location.lat();
        const lng = results.geometry.location.lng();
        if (isWithinNagpur(lat, lng)) {
          return {
            lat,
            lng,
            name: results.formatted_address || queryText,
            source: 'google_geocoder',
          };
        }
      }
    } catch (e) {
      // Fall through to Nominatim
    }
  }

  // 3. Nominatim bounded to Nagpur metropolitan area
  try {
    const encoded = encodeURIComponent(`${queryText} Nagpur Maharashtra India`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encoded}&countrycodes=in&viewbox=78.90,21.32,79.28,20.95&bounded=1&limit=3`,
      { headers: { 'User-Agent': 'KyaPehnuApp/1.0' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        if (!isNaN(lat) && !isNaN(lng)) {
          return {
            lat,
            lng,
            name: first.display_name?.split(',')?.[0] || queryText,
            source: 'nominatim',
          };
        }
      }
    }
  } catch (e) {
    // Fall through
  }

  return null;
}
