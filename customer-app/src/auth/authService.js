import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { auth, db } from '../config/firebase';
import { ROLES } from './roles';

/**
 * The auth service — every Firebase Auth and Firestore call the app makes lives
 * behind these functions. Screens and the store never import the Firebase SDK
 * directly, so there is one seam to reason about (and one place a mock would go)
 * and the rest of the app deals in plain objects.
 *
 * Two Firebase services cooperate here:
 *   • Auth      — the credential and the session (who you are).
 *   • Firestore — the `users/{uid}` profile document (name, phone, role),
 *                 which is what decides customer vs. vendor.
 */

const USERS_COLLECTION = 'users';

const userDoc = (uid) => doc(db, USERS_COLLECTION, uid);

/**
 * Read the Firestore profile behind a uid. Returns the document data, or null
 * when no profile has been written yet (e.g. an account created out of band).
 */
export const fetchUserProfile = async (uid) => {
  const snapshot = await getDoc(userDoc(uid));
  return snapshot.exists() ? snapshot.data() : null;
};

/**
 * Create the profile document if it is missing, or return the existing one.
 * `merge: true` makes this idempotent: a returning user keeps their role and
 * created-at while any newly supplied fields are filled in. New documents
 * default to CUSTOMER — a vendor is promoted deliberately, never by signing up.
 */
export const ensureUserProfile = async (firebaseUser, { name, phone } = {}) => {
  const ref = userDoc(firebaseUser.uid);
  const existing = await getDoc(ref);

  if (existing.exists()) {
    // Backfill only fields that are still empty; never overwrite role.
    const current = existing.data();
    const patch = {};
    if (name && !current.name) patch.name = name;
    if (phone && !current.phone) patch.phone = phone;
    if (Object.keys(patch).length) await updateDoc(ref, patch);
    return { ...current, ...patch };
  }

  const profile = {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? null,
    name: name ?? firebaseUser.displayName ?? '',
    phone: phone ?? '',
    role: ROLES.CUSTOMER,
    createdAt: serverTimestamp(),
  };

  await setDoc(ref, profile, { merge: true });
  return profile;
};

/**
 * Register a new customer: create the Auth credential, stamp the display name
 * onto the Auth record (so it shows even before the profile doc is read), then
 * write the Firestore profile. Returns `{ user, profile }`.
 */
export const signUp = async ({ name, email, phone, password }) => {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const { user } = credential;

  if (name) {
    await updateProfile(user, { displayName: name.trim() });
  }

  const profile = await ensureUserProfile(user, { name: name?.trim(), phone: phone?.trim() });
  return { user, profile };
};

/**
 * Sign an existing account in and load its profile. If the account predates the
 * profile collection, `ensureUserProfile` lazily creates a CUSTOMER document so
 * the rest of the app always has one to read.
 */
export const signIn = async ({ email, password }) => {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const { user } = credential;
  const profile = await ensureUserProfile(user);
  return { user, profile };
};

export const signOut = () => firebaseSignOut(auth);

/**
 * Send a password-reset email. Firebase hosts the reset page and handles the
 * new-password form, so this is the whole flow from the app's side. Note that
 * Firebase resolves this call even for an unregistered address (so the response
 * cannot be used to enumerate accounts); the UI shows the same "check your
 * inbox" message either way.
 */
export const sendPasswordReset = (email) => sendPasswordResetEmail(auth, email.trim());

/**
 * Subscribe to session changes. `onIdTokenChanged` fires on sign-in, sign-out,
 * AND on the hourly token refresh — using it (rather than `onAuthStateChanged`)
 * keeps the token the app sends to the backend from silently going stale.
 *
 * @param {(user: import('firebase/auth').User | null) => void} callback
 * @returns {() => void} unsubscribe
 */
export const subscribeToSession = (callback) => onIdTokenChanged(auth, callback);

/** A fresh ID token for the current user, or null when signed out. */
export const getIdToken = async (forceRefresh = false) => {
  const user = auth.currentUser;
  return user ? user.getIdToken(forceRefresh) : null;
};

export default {
  fetchUserProfile,
  ensureUserProfile,
  signUp,
  signIn,
  signOut,
  sendPasswordReset,
  subscribeToSession,
  getIdToken,
};
