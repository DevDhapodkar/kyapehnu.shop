import { validatePhone } from '../auth/validation';

/**
 * Pure helpers for the "Apply to become a vendor" form.
 *
 * No React Native / Firebase imports, so the rules are unit-tested in plain Node
 * and shared between the form and the payload builder. Mirrors the fields the
 * backend VendorApplication model requires.
 */

export const VENDOR_CATEGORIES = [
  { key: 'MENSWEAR', label: 'Menswear' },
  { key: 'WOMENSWEAR', label: 'Womenswear' },
  { key: 'BOTH', label: 'Men & Women' },
  { key: 'KIDS', label: 'Kids' },
  { key: 'ACCESSORIES', label: 'Accessories' },
  { key: 'OTHER', label: 'Other' },
];

export const emptyApplication = () => ({
  shopName: '',
  ownerName: '',
  phone: '',
  whatsappNumber: '',
  category: 'BOTH',
  description: '',
  yearsInBusiness: '',
  gstin: '',
  line1: '',
  area: '',
  city: 'Nagpur',
  pincode: '',
});

const required = (value, message) => (String(value ?? '').trim() ? null : message);

const validatePincode = (value) => {
  const pin = String(value ?? '').trim();
  if (!pin) return 'Enter the shop pincode.';
  // Indian pincodes are 6 digits, first digit 1-9.
  if (!/^[1-9]\d{5}$/.test(pin)) return 'Enter a valid 6-digit pincode.';
  return null;
};

/**
 * Validate the whole form. Returns `{ valid, errors }` where `errors` maps
 * field → message for every field that failed. WhatsApp is optional (defaults
 * to the phone number); GSTIN, description, and years are optional too.
 */
export const validateApplication = (form) => {
  const errors = {};

  const shopName = required(form.shopName, 'Enter your shop name.');
  if (shopName) errors.shopName = shopName;

  const ownerName = required(form.ownerName, 'Enter the owner’s name.');
  if (ownerName) errors.ownerName = ownerName;

  const phone = validatePhone(form.phone);
  if (phone) errors.phone = phone;

  // WhatsApp only validated when the vendor typed a different number.
  if (String(form.whatsappNumber ?? '').trim()) {
    const wa = validatePhone(form.whatsappNumber);
    if (wa) errors.whatsappNumber = wa;
  }

  const line1 = required(form.line1, 'Enter the shop address.');
  if (line1) errors.line1 = line1;

  const area = required(form.area, 'Enter the area / locality.');
  if (area) errors.area = area;

  const pincode = validatePincode(form.pincode);
  if (pincode) errors.pincode = pincode;

  if (String(form.yearsInBusiness ?? '').trim() && !/^\d{1,3}$/.test(String(form.yearsInBusiness).trim())) {
    errors.yearsInBusiness = 'Enter years as a whole number.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
};

/**
 * Shape the flat form state into the JSON body the backend expects (nested
 * address, numeric years, whatsapp fallback). Assumes the form already passed
 * `validateApplication`.
 */
export const toApplicationPayload = (form) => {
  const trimmed = (v) => String(v ?? '').trim();
  const years = trimmed(form.yearsInBusiness);

  return {
    shopName: trimmed(form.shopName),
    ownerName: trimmed(form.ownerName),
    phone: trimmed(form.phone),
    whatsappNumber: trimmed(form.whatsappNumber) || trimmed(form.phone),
    category: form.category || 'BOTH',
    description: trimmed(form.description) || undefined,
    yearsInBusiness: years ? Number(years) : undefined,
    gstin: trimmed(form.gstin) || undefined,
    address: {
      line1: trimmed(form.line1),
      area: trimmed(form.area),
      city: trimmed(form.city) || 'Nagpur',
      pincode: trimmed(form.pincode),
    },
  };
};

export default validateApplication;
