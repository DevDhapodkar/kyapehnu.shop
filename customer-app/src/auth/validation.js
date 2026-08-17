/**
 * Pure input validation for the auth screens.
 *
 * Deliberately free of any React Native / Firebase import so the rules can be
 * unit-tested in plain Node and reused on both the sign-in and sign-up forms.
 * Every function returns a `string | null` — the error message to show, or
 * null when the field is acceptable. Fail-fast, one message at a time, matching
 * how the form surfaces errors under a single field.
 */

/** Minimum password length. Firebase itself rejects < 6, so this is the floor. */
export const MIN_PASSWORD_LENGTH = 8;

// Intentionally permissive: catches obvious typos (missing @, missing domain,
// spaces) without trying to fully implement RFC 5322, which no practical regex
// does. The authoritative check is Firebase rejecting the address on submit.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (value) => {
  const email = (value ?? '').trim();
  if (!email) return 'Enter your email.';
  if (!EMAIL_RE.test(email)) return 'That email address looks incomplete.';
  return null;
};

export const validatePassword = (value) => {
  const password = value ?? '';
  if (!password) return 'Enter a password.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
};

export const validateName = (value) => {
  const name = (value ?? '').trim();
  if (!name) return 'Enter your name.';
  if (name.length < 2) return 'That name looks too short.';
  return null;
};

// Indian mobile numbers are 10 digits; allow a leading +91 / 0 and spaces or
// dashes the user may type, then check the significant digits.
export const validatePhone = (value) => {
  const raw = (value ?? '').trim();
  if (!raw) return 'Enter your phone number.';
  const digits = raw.replace(/[\s-]/g, '').replace(/^\+91/, '').replace(/^0/, '');
  if (!/^\d{10}$/.test(digits)) return 'Enter a valid 10-digit phone number.';
  return null;
};

/**
 * Validate a whole form at once. `mode` is 'signin' | 'signup'; sign-in only
 * needs email + password, sign-up also needs name + phone.
 *
 * Returns `{ valid, errors }` where `errors` maps field → message for every
 * field that failed, so the form can render them all together.
 */
export const validateAuthForm = (mode, { name, email, phone, password }) => {
  const errors = {};

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  if (mode === 'signup') {
    const nameError = validateName(name);
    if (nameError) errors.name = nameError;

    const phoneError = validatePhone(phone);
    if (phoneError) errors.phone = phoneError;
  }

  return { valid: Object.keys(errors).length === 0, errors };
};

export default validateAuthForm;
