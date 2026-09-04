import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';

const NAGPUR_CENTER = { latitude: 21.1458, longitude: 79.0882 };

/**
 * useDeliveryLocation
 *
 * Asks for foreground location on mount, resolves coordinates, then reverse
 * geocodes them into a neighbourhood name for the "Delivering to" header.
 *
 * Every failure path (denied permission, no fix, geocode unavailable on the
 * platform) degrades to Nagpur city centre rather than blocking the feed — the
 * catalogue is hyper-local to one city, so a fallback is always meaningful.
 *
 * Returns:
 *  - coords:  { latitude, longitude }
 *  - areaLabel: neighbourhood string for display
 *  - status:  'pending' | 'granted' | 'denied' | 'error'
 *  - refresh: re-run the whole flow (used by the header's retry affordance)
 */
export default function useDeliveryLocation() {
  const [coords, setCoords] = useState(NAGPUR_CENTER);
  const [areaLabel, setAreaLabel] = useState('Locating…');
  const [status, setStatus] = useState('pending');

  const resolve = useCallback(async () => {
    setStatus('pending');
    setAreaLabel('Locating…');

    try {
      const { status: permission } = await Location.requestForegroundPermissionsAsync();

      if (permission !== 'granted') {
        setStatus('denied');
        setCoords(NAGPUR_CENTER);
        setAreaLabel('Nagpur');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const next = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setCoords(next);
      setStatus('granted');

      // Reverse geocoding is best-effort: it needs network on Android and can
      // legitimately return an empty array, so the label falls back on its own.
      try {
        const [place] = await Location.reverseGeocodeAsync(next);
        const area =
          place?.district ||
          place?.subregion ||
          place?.name ||
          place?.city ||
          'Nagpur';
        setAreaLabel(area);
      } catch {
        setAreaLabel('Nagpur');
      }
    } catch {
      setStatus('error');
      setCoords(NAGPUR_CENTER);
      setAreaLabel('Nagpur');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await resolve();
    })();
    return () => {
      cancelled = true;
    };
  }, [resolve]);

  return { coords, areaLabel, status, refresh: resolve };
}
