/**
 * Firebase Auth error-code → human sentence.
 *
 * The SDK throws `FirebaseError`s whose `.code` looks like `auth/wrong-password`
 * and whose `.message` is a developer string ("Firebase: Error (auth/…).").
 * Neither belongs in front of a shopper, so every catch in the auth flow runs
 * the error through here first. Pure and RN-free so it is trivially testable.
 */

const MESSAGES = {
  'auth/invalid-email': 'That email address is not valid.',
  'auth/user-disabled': 'This account has been disabled. Contact support.',
  'auth/user-not-found': 'No account found for that email.',
  'auth/wrong-password': 'Incorrect email or password.',
  // Newer SDKs collapse user-not-found / wrong-password into this single code
  // so an attacker cannot probe which emails are registered.
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/email-already-in-use': 'An account already exists for that email. Log in instead.',
  'auth/weak-password': 'That password is too weak. Use at least 8 characters.',
  'auth/too-many-requests': 'Too many attempts. Try again in a few minutes.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/operation-not-allowed': 'Email sign-in is not enabled for this project.',
  'auth/requires-recent-login': 'Please log in again to continue.',
};

const DEFAULT_MESSAGE = 'Something went wrong. Please try again.';

/**
 * Accepts a thrown value of any shape (FirebaseError, plain Error, string) and
 * returns a safe, friendly sentence. Falls back to a generic message so a raw
 * SDK string is never rendered.
 */
export const friendlyAuthError = (error) => {
  const code = typeof error === 'string' ? error : error?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  return DEFAULT_MESSAGE;
};

export default friendlyAuthError;
