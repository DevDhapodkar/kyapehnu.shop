import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut,
  onIdTokenChanged,
} from 'firebase/auth';

import { auth, isFirebaseConfigured } from '../config/firebase';

export { isFirebaseConfigured };

const ensureAuth = () => {
  if (!isFirebaseConfigured || !auth) {
    const err = new Error(
      'Sign-in is not configured yet. Add your Firebase web keys to app.json → expo.extra.firebase.'
    );
    err.code = 'auth/not-configured';
    throw err;
  }
  return auth;
};

export const signInEmail = (email, password) =>
  signInWithEmailAndPassword(ensureAuth(), email.trim(), password);

export const registerEmail = async (email, password, displayName) => {
  const cred = await createUserWithEmailAndPassword(ensureAuth(), email.trim(), password);
  if (displayName) await updateProfile(cred.user, { displayName });
  return cred;
};

export const signOutFirebase = () => (auth ? fbSignOut(auth) : Promise.resolve());

/**
 * Subscribe to ID-token changes. The callback receives `{ user, token }` while
 * signed in (token auto-refreshes) and `null` when signed out. Returns the
 * unsubscribe function. No-ops safely when Firebase is unconfigured.
 * @param {(session: { user: import('firebase/auth').User, token: string } | null) => void} cb
 * @returns {() => void}
 */
export const subscribeIdToken = (cb) => {
  if (!isFirebaseConfigured || !auth) {
    cb(null);
    return () => {};
  }
  return onIdTokenChanged(auth, async (user) => {
    if (!user) return cb(null);
    try {
      const token = await user.getIdToken();
      cb({ user, token });
    } catch {
      cb(null);
    }
  });
};

/** Map Firebase auth error codes to a sentence a shopper can act on. */
export const friendlyAuthError = (error) => {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/missing-password':
      return 'Enter your password.';
    case 'auth/weak-password':
      return 'Use at least 6 characters for your password.';
    case 'auth/email-already-in-use':
      return 'An account already exists for that email. Try logging in.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect.';
    case 'auth/network-request-failed':
      return 'Network error — check your connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    case 'auth/not-configured':
      return error.message;
    default:
      return error?.message || 'Something went wrong. Please try again.';
  }
};
