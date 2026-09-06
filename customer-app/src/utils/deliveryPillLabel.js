/**
 * Delivery pill + avatar display helpers.
 * Pure — no React — so we can unit-test without a RN harness.
 */

const SET_ADDRESS_LABEL = 'Set delivery address';

/**
 * Label for location pills. Prefer a saved doorstep address.
 * Never invent neighbourhood names (Sitabuldi, etc.) when the customer
 * has not confirmed a delivery address — that made the app look pre-configured.
 *
 * @param {{ savedAddresses?: Array, gpsLabel?: string, gpsStatus?: string }} input
 * @returns {string}
 */
export function getDeliveryPillLabel({ savedAddresses } = {}) {
  const addr = Array.isArray(savedAddresses) ? savedAddresses[0] : null;
  if (!addr) return SET_ADDRESS_LABEL;

  const locality =
    (addr.line2 && String(addr.line2).trim()) ||
    (addr.area && String(addr.area).trim()) ||
    '';
  if (locality && locality.toLowerCase() !== 'nagpur') {
    return locality;
  }

  const line1 = addr.line1 && String(addr.line1).trim();
  if (line1) return line1;

  const city = addr.city && String(addr.city).trim();
  if (city) return city;

  return SET_ADDRESS_LABEL;
}

/**
 * @param {{ name?: string, displayName?: string, email?: string }} person
 * @returns {string} up to 2 initials, uppercase
 */
export function getUserInitials(person = {}) {
  const name = (person.name || person.displayName || '').trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  const email = (person.email || '').trim();
  if (email) return email[0].toUpperCase();
  return '';
}

export { SET_ADDRESS_LABEL };
