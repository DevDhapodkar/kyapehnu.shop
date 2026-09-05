import { useCallback, useEffect, useState } from 'react';
import {
  NAGPUR_CENTER,
  getCurrentCoordinates,
  reverseGeocodeLocation,
} from '../utils/geolocation';

/**
 * useDeliveryLocation
 *
 * Asks for foreground location on mount, resolves high-accuracy coordinates
 * via device GPS / browser geolocation, then reverse geocodes them into an
 * accurate neighbourhood name (e.g. "Dharampeth, Nagpur") for the "Delivering to" header.
 *
 * Every failure path (denied permission, no fix, timeout) gracefully degrades
 * to Nagpur city centre rather than blocking the feed — the catalogue is
 * hyper-local to Nagpur, so a fallback is always meaningful.
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
      const position = await getCurrentCoordinates();
      const next = {
        latitude: position.latitude,
        longitude: position.longitude,
      };
      setCoords(next);
      setStatus('granted');

      try {
        const geo = await reverseGeocodeLocation(next);
        setAreaLabel(geo?.areaLabel || 'Sitabuldi, Nagpur');
      } catch {
        setAreaLabel('Sitabuldi, Nagpur');
      }
    } catch (err) {
      const isDenied =
        err?.message?.includes('denied') ||
        err?.code === 1; // GeolocationPositionError.PERMISSION_DENIED
      setStatus(isDenied ? 'denied' : 'error');
      setCoords(NAGPUR_CENTER);
      setAreaLabel('Sitabuldi, Nagpur');
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
