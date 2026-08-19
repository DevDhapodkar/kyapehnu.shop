import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut,
  onIdTokenChanged,
} from 'firebase/auth';

import { firebaseAuthClient, isFirebaseConfigured } from '../config/firebaseClient';

/**
 * Thin wrapper over Firebase email/password auth. Email/password is the free,
 * no-SMS-cost method for the pilot; phone OTP can be added later without
 * changing the callers here. Each call returns `{ user, token }`, where `token`
 * is the Firebase ID token the backend verifies.
 *
 * All functions throw a friendly Error (Firebase's `auth/...` codes mapped) so
 * the sign-in screen can show something a shopper understands.
 */

const FRIENDLY = {
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/email-already-in-use': 'An account already exists for that email.',
  'auth/weak-password': 'Use a password of at least 6 characters.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'No account found for that email.',
  'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
  'auth/network-request-failed': 'Network problem. Check your connection.',
};

const toFriendly = (err) => new Error(FRIENDLY[err?.code] || err?.message || 'Authentication failed');

const requireConfigured = () => {
  if (!isFirebaseConfigured || !firebaseAuthClient) {
    throw new Error('Sign-in is not configured yet.');
  }
};

export const signUpWithEmail = async ({ name, email, password }) => {
  requireConfigured();
  try {
    const { user } = await createUserWithEmailAndPassword(firebaseAuthClient, email.trim(), password);
    if (name) await updateProfile(user, { displayName: name.trim() });
    const token = await user.getIdToken();
    return { user, token };
  } catch (err) {
    throw toFriendly(err);
  }
};

export const signInWithEmail = async ({ email, password }) => {
  requireConfigured();
  try {
    const { user } = await signInWithEmailAndPassword(firebaseAuthClient, email.trim(), password);
    const token = await user.getIdToken();
    return { user, token };
  } catch (err) {
    throw toFriendly(err);
  }
};

export const signOutFirebase = async () => {
  if (firebaseAuthClient) await fbSignOut(firebaseAuthClient).catch(() => {});
};

/**
 * Subscribe to ID-token changes (initial restore + hourly auto-refresh + sign
 * out). Calls `onToken(token, user)` with a fresh token, or (null, null) when
 * signed out. Returns an unsubscribe function. No-op when unconfigured.
 */
export const subscribeToken = (onToken) => {
  if (!firebaseAuthClient) return () => {};
  return onIdTokenChanged(firebaseAuthClient, async (user) => {
    if (!user) return onToken(null, null);
    const token = await user.getIdToken();
    onToken(token, user);
  });
};
