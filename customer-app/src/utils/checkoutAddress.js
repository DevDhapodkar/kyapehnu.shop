/**
 * Checkout address builders — never invent phone, name, pincode, or coords.
 * Enforces Porter same-city delivery network boundary restrictions in Nagpur.
 */

const PLACEHOLDER_PHONE_DIGITS = '9999999999';

export const NAGPUR_CENTER = { lat: 21.1458, lng: 79.0882 };
export const MAX_PORTER_RADIUS_KM = 25;
export const NAGPUR_PINCODE_REGEX = /^(4400\d{2}|441\d{3})$/;

/**
 * Calculates distance between two latitude/longitude points in km using the Haversine formula.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6371;
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
 * Validates whether an address falls inside Porter's Nagpur same-city delivery network.
 * Accepts either an address object or explicit { coords, pincode, city }.
 * @param {object} input
 * @returns {{ serviceable: boolean, valid: boolean, error?: string, reason?: string, distanceKm?: number }}
 */
export function validateNagpurDeliveryBounds(input = {}) {
  const city = input?.city;
  const pincode = input?.pincode || input?.postalCode;
  const coords =
    input?.coords ||
    input?.location?.coordinates ||
    (Array.isArray(input?.coordinates) ? input.coordinates : null);

  // 1. City check (if provided, must be Nagpur)
  if (city && typeof city === 'string') {
    const cleanCity = city.trim().toLowerCase();
    if (cleanCity && cleanCity !== 'nagpur' && !cleanCity.includes('nagpur')) {
      const errorMsg = `Delivery is currently available exclusively within Nagpur city (received: ${city}).`;
      return {
        serviceable: false,
        valid: false,
        error: errorMsg,
        reason: errorMsg,
      };
    }
  }

  // 2. Pincode check
  if (pincode) {
    const pin = String(pincode).trim();
    if (!NAGPUR_PINCODE_REGEX.test(pin)) {
      const errorMsg = `Pincode ${pin} is outside Porter's same-city delivery network in Nagpur. We currently deliver only within Nagpur (440001–440037, 441xxx).`;
      return {
        serviceable: false,
        valid: false,
        error: errorMsg,
        reason: errorMsg,
      };
    }
  }

  // 3. Map Pin Coordinates check
  if (Array.isArray(coords) && coords.length >= 2) {
    const lng = coords[0];
    const lat = coords[1];
    if (typeof lat === 'number' && typeof lng === 'number') {
      const inBox = lat >= 20.95 && lat <= 21.32 && lng >= 78.90 && lng <= 79.28;
      const distance = calculateDistanceKm(lat, lng, NAGPUR_CENTER.lat, NAGPUR_CENTER.lng);
      if (!inBox || distance > MAX_PORTER_RADIUS_KM) {
        const errorMsg = `Selected map pin is ${Math.round(distance)}km from Nagpur center, which is outside Porter's 25km same-city delivery network.`;
        return {
          serviceable: false,
          valid: false,
          distanceKm: distance,
          error: errorMsg,
          reason: errorMsg,
        };
      }
    }
  }

  return { serviceable: true, valid: true };
}

/**
 * @param {string} phone
 * @returns {boolean}
 */
export function isPlaceholderPhone(phone) {
  if (!phone) return true;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 10) return true;
  // Trailing 10 digits all 9s (covers +91 99999 99999 and 9999999999)
  return digits.slice(-10) === PLACEHOLDER_PHONE_DIGITS;
}

/**
 * @param {string} phone
 * @returns {string|null} cleaned phone or null if invalid/placeholder
 */
export function cleanPhoneOrNull(phone) {
  if (!phone) return null;
  const cleaned = String(phone).replace(/[^0-9+]/g, '');
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length < 10) return null;
  if (isPlaceholderPhone(cleaned)) return null;
  return cleaned;
}

/**
 * Build delivery address from a saved profile address. Hard-fails on gaps or out-of-bounds locations.
 *
 * @param {{ address: object, profile?: object, user?: object }} params
 * @returns {{ ok: true, address: object } | { ok: false, error: string, outOfBounds?: boolean }}
 */
export function buildCheckoutAddressFromSaved({ address, profile, user } = {}) {
  if (!address?.line1?.trim()) {
    return { ok: false, error: 'Saved address is missing the street line. Please edit or add a new address.' };
  }

  const pincode = (address.pincode && String(address.pincode).trim()) || '';
  if (!/^\d{6}$/.test(pincode)) {
    return { ok: false, error: 'Saved address is missing a valid 6-digit pincode. Please edit the address.' };
  }

  const receiverName =
    (address.receiverName && String(address.receiverName).trim()) ||
    (profile?.name && String(profile.name).trim()) ||
    (user?.displayName && String(user.displayName).trim()) ||
    '';
  if (!receiverName || /^nagpur\s+(patron|member)$/i.test(receiverName)) {
    return { ok: false, error: 'Receiver name is required before placing the order.' };
  }

  const receiverPhone = cleanPhoneOrNull(
    address.receiverPhone || profile?.phone || user?.phoneNumber || ''
  );
  if (!receiverPhone) {
    return {
      ok: false,
      error: 'A valid delivery mobile number is required. Please update the address or profile phone.',
    };
  }

  const coords = address.location?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2 || coords.some((n) => typeof n !== 'number')) {
    return {
      ok: false,
      error: 'This address has no map pin. Please re-save it with Pin on Map.',
    };
  }

  // Restrict to Porter Nagpur same-city delivery network boundary
  const bounds = validateNagpurDeliveryBounds({
    coords,
    pincode,
    city: address.city || 'Nagpur',
  });
  if (!bounds.serviceable) {
    return { ok: false, error: bounds.error, outOfBounds: true };
  }

  return {
    ok: true,
    address: {
      label: address.label || 'HOME',
      line1: address.line1.trim(),
      line2: (address.line2 && String(address.line2).trim()) || '',
      city: (address.city && String(address.city).trim()) || 'Nagpur',
      pincode,
      receiverName,
      receiverPhone,
      location: {
        type: 'Point',
        coordinates: coords,
      },
    },
  };
}

/**
 * Build delivery address from the new-address form. Hard-fails on gaps or out-of-bounds locations.
 *
 * @param {object} form
 * @returns {{ ok: true, address: object } | { ok: false, error: string, outOfBounds?: boolean }}
 */
export function buildCheckoutAddressFromForm({
  flatNo,
  streetArea,
  detectedArea,
  pincode,
  receiverName,
  phone,
  coords,
  addressType = 'HOME',
} = {}) {
  if (!flatNo?.trim() || !streetArea?.trim()) {
    return {
      ok: false,
      error: 'Please fill out your delivery address particulars or select a saved address.',
    };
  }

  const pin = (pincode && String(pincode).trim()) || '';
  if (!/^\d{6}$/.test(pin)) {
    return { ok: false, error: 'Please enter a valid 6-digit Nagpur pincode.' };
  }

  const name = (receiverName && String(receiverName).trim()) || '';
  if (!name) {
    return { ok: false, error: 'Please provide a receiver name and 10-digit mobile number.' };
  }

  const receiverPhone = cleanPhoneOrNull(phone);
  if (!receiverPhone) {
    return { ok: false, error: 'Please enter a valid 10-digit mobile number.' };
  }

  if (!Array.isArray(coords) || coords.length < 2) {
    return {
      ok: false,
      error: 'Please tap "Pin on Map" so our delivery rider can navigate to your door.',
    };
  }

  // Restrict to Porter Nagpur same-city delivery network boundary
  const bounds = validateNagpurDeliveryBounds({
    coords,
    pincode: pin,
    city: 'Nagpur',
  });
  if (!bounds.serviceable) {
    return { ok: false, error: bounds.error, outOfBounds: true };
  }

  return {
    ok: true,
    address: {
      label: addressType,
      line1: `${flatNo.trim()}, ${streetArea.trim()}`,
      line2: (detectedArea && String(detectedArea).trim()) || '',
      city: 'Nagpur',
      pincode: pin,
      receiverName: name,
      receiverPhone,
      location: {
        type: 'Point',
        coordinates: coords,
      },
    },
  };
}
