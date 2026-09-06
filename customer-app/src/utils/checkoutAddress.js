/**
 * Checkout address builders — never invent phone, name, pincode, or coords.
 */

const PLACEHOLDER_PHONE_DIGITS = '9999999999';

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
 * Build delivery address from a saved profile address. Hard-fails on gaps.
 *
 * @param {{ address: object, profile?: object, user?: object }} params
 * @returns {{ ok: true, address: object } | { ok: false, error: string }}
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
  if (!receiverName || /^nagpur\s+patron$/i.test(receiverName)) {
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
 * Build delivery address from the new-address form. Hard-fails on gaps.
 *
 * @param {object} form
 * @returns {{ ok: true, address: object } | { ok: false, error: string }}
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
