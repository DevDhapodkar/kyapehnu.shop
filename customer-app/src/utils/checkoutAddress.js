/**
 * Checkout address builders — never invent phone, name, pincode, or coords.
 * Enforces Pan-India delivery network boundary validation.
 */

const PLACEHOLDER_PHONE_DIGITS = "9999999999";

export const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };
export const INDIA_BOUNDS = { minLat: 6.0, maxLat: 38.0, minLng: 68.0, maxLng: 98.0 };
export const INDIAN_PINCODE_REGEX = /^[1-9][0-9]{5}$/;

// Backward-compatible alias exports
export const NAGPUR_CENTER = INDIA_CENTER;
export const MAX_PORTER_RADIUS_KM = 35;
export const NAGPUR_PINCODE_REGEX = INDIAN_PINCODE_REGEX;

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
 * Validates whether an address falls inside India delivery network.
 * Accepts either an address object or explicit { coords, pincode, city }.
 * @param {object} input
 * @returns {{ serviceable: boolean, valid: boolean, error?: string, reason?: string, distanceKm?: number }}
 */
export function validateDeliveryBounds(input = {}) {
  const city = input?.city;
  const pincode = input?.pincode || input?.postalCode;
  const coords =
    input?.coords ||
    input?.location?.coordinates ||
    (Array.isArray(input?.coordinates) ? input.coordinates : null);

  // 1. City check
  if (city && typeof city === "string") {
    const cleanCity = city.trim();
    if (cleanCity.length < 2) {
      const errorMsg = "Please enter a valid city name.";
      return { serviceable: false, valid: false, error: errorMsg, reason: errorMsg };
    }
  }

  // 2. Pincode check (Must be valid 6-digit Indian PIN)
  if (pincode) {
    const pin = String(pincode).trim();
    if (!INDIAN_PINCODE_REGEX.test(pin)) {
      const errorMsg = `Pincode ${pin} is not a valid 6-digit Indian postal code.`;
      return { serviceable: false, valid: false, error: errorMsg, reason: errorMsg };
    }
  }

  // 3. Map Pin Coordinates check (Must be within India territory)
  if (Array.isArray(coords) && coords.length >= 2) {
    const lng = coords[0];
    const lat = coords[1];
    if (typeof lat === "number" && typeof lng === "number") {
      const inBox =
        lat >= INDIA_BOUNDS.minLat &&
        lat <= INDIA_BOUNDS.maxLat &&
        lng >= INDIA_BOUNDS.minLng &&
        lng <= INDIA_BOUNDS.maxLng;
      if (!inBox) {
        const errorMsg = "Selected map pin is outside India service territory.";
        return {
          serviceable: false,
          valid: false,
          distanceKm: calculateDistanceKm(lat, lng, INDIA_CENTER.lat, INDIA_CENTER.lng),
          error: errorMsg,
          reason: errorMsg,
        };
      }
    }
  }

  return { serviceable: true, valid: true };
}
export const validateNagpurDeliveryBounds = validateDeliveryBounds;

/**
 * @param {string} phone
 * @returns {boolean}
 */
export function isPlaceholderPhone(phone) {
  if (!phone) return true;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length < 10) return true;
  return digits.slice(-10) === PLACEHOLDER_PHONE_DIGITS;
}

/**
 * @param {string} phone
 * @returns {string|null} cleaned phone or null if invalid/placeholder
 */
export function cleanPhoneOrNull(phone) {
  if (!phone) return null;
  const cleaned = String(phone).replace(/[^0-9+]/g, "");
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (isPlaceholderPhone(cleaned)) return null;
  return cleaned;
}

/**
 * Build delivery address from a saved profile address. Hard-fails on gaps or out-of-bounds locations.
 */
export function buildCheckoutAddressFromSaved({ address, profile, user } = {}) {
  if (!address?.line1?.trim()) {
    return { ok: false, error: "Saved address is missing the street line. Please edit or add a new address." };
  }

  const pincode = (address.pincode && String(address.pincode).trim()) || "";
  if (!INDIAN_PINCODE_REGEX.test(pincode)) {
    return { ok: false, error: "Saved address is missing a valid 6-digit pincode. Please edit the address." };
  }

  const receiverName =
    (address.receiverName && String(address.receiverName).trim()) ||
    (profile?.name && String(profile.name).trim()) ||
    (user?.displayName && String(user.displayName).trim()) ||
    "";
  if (!receiverName || /^(patron|member)$/i.test(receiverName)) {
    return { ok: false, error: "Receiver name is required before placing the order." };
  }

  const receiverPhone = cleanPhoneOrNull(
    address.receiverPhone || profile?.phone || user?.phoneNumber || ""
  );
  if (!receiverPhone) {
    return {
      ok: false,
      error: "A valid delivery mobile number is required. Please update the address or profile phone.",
    };
  }

  const coords = address.location?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2 || coords.some((n) => typeof n !== "number")) {
    return {
      ok: false,
      error: "This address has no map pin. Please re-save it with Pin on Map.",
    };
  }

  const bounds = validateDeliveryBounds({
    coords,
    pincode,
    city: address.city || "India",
  });
  if (!bounds.serviceable) {
    return { ok: false, error: bounds.error, outOfBounds: true };
  }

  return {
    ok: true,
    address: {
      label: address.label || "HOME",
      line1: address.line1.trim(),
      line2: (address.line2 && String(address.line2).trim()) || "",
      city: (address.city && String(address.city).trim()) || "India",
      pincode,
      receiverName,
      receiverPhone,
      location: {
        type: "Point",
        coordinates: coords,
      },
    },
  };
}

/**
 * Build delivery address from the new-address form. Hard-fails on gaps or out-of-bounds locations.
 */
export function buildCheckoutAddressFromForm({
  flatNo,
  streetArea,
  detectedArea,
  city,
  pincode,
  receiverName,
  phone,
  coords,
  addressType = "HOME",
} = {}) {
  if (!flatNo?.trim() || !streetArea?.trim()) {
    return {
      ok: false,
      error: "Please fill out your delivery address particulars or select a saved address.",
    };
  }

  const pin = (pincode && String(pincode).trim()) || "";
  if (!INDIAN_PINCODE_REGEX.test(pin)) {
    return { ok: false, error: "Please enter a valid 6-digit postal pincode." };
  }

  const name = (receiverName && String(receiverName).trim()) || "";
  if (!name) {
    return { ok: false, error: "Please provide a receiver name and 10-digit mobile number." };
  }

  const receiverPhone = cleanPhoneOrNull(phone);
  if (!receiverPhone) {
    return { ok: false, error: "Please enter a valid 10-digit mobile number." };
  }

  if (!Array.isArray(coords) || coords.length < 2) {
    return {
      ok: false,
      error: 'Please tap "Pin on Map" so our delivery rider can navigate to your door.',
    };
  }

  const resolvedCity = (city && String(city).trim()) || "India";

  const bounds = validateDeliveryBounds({
    coords,
    pincode: pin,
    city: resolvedCity,
  });
  if (!bounds.serviceable) {
    return { ok: false, error: bounds.error, outOfBounds: true };
  }

  return {
    ok: true,
    address: {
      label: addressType,
      line1: `${flatNo.trim()}, ${streetArea.trim()}`,
      line2: (detectedArea && String(detectedArea).trim()) || "",
      city: resolvedCity,
      pincode: pin,
      receiverName: name,
      receiverPhone,
      location: {
        type: "Point",
        coordinates: coords,
      },
    },
  };
}
