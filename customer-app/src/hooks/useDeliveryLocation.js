import { useCallback, useEffect, useState } from 'react';
import {
  NAGPUR_CENTER,
  getCurrentCoordinates,
  reverseGeocodeLocation,
} from '../utils/geolocation';

/**
 * useDeliveryLocation
 *
 * Resolves device GPS for catalogue proximity sorting. Does NOT invent a
 * delivery neighbourhood for the header pill — that comes from a saved
 * doorstep address via getDeliveryPillLabel (see deliveryPillLabel.js).
 *
 * GPS failure keeps Nagpur centre coords for distance math only; gpsLabel
 * stays null so UI never pretends Sitabuldi is the customer's address.
 *
 * Returns:
 *  - coords:  { latitude, longitude }
 *  - gpsLabel: neighbourhood from GPS, or null when unresolved/denied
 *  - status:  'pending' | 'granted' | 'denied' | 'error'
 *  - refresh: re-run the whole flow
 */
export default function useDeliveryLocation() {
  const [coords, setCoords] = useState(NAGPUR_CENTER);
  const [gpsLabel, setGpsLabel] = useState(null);
  const [status, setStatus] = useState('pending');

  const resolve = useCallback(async () => {
    setStatus('pending');
    setGpsLabel(null);

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
        setGpsLabel(geo?.areaLabel || null);
      } catch {
        setGpsLabel(null);
      }
    } catch (err) {
      const isDenied =
        err?.message?.includes('denied') ||
        err?.code === 1; // GeolocationPositionError.PERMISSION_DENIED
      setStatus(isDenied ? 'denied' : 'error');
      setCoords(NAGPUR_CENTER);
      setGpsLabel(null);
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

  return { coords, gpsLabel, status, refresh: resolve };
}
