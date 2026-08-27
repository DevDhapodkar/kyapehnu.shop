import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';

// Boot-safe: the SDK is initialised lazily on first use, never at import time.
// Missing creds only disable auth/push (routes answer 503) — they never crash
// the process. Lets the server start where FIREBASE_* isn't provisioned yet.
const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

export const isFirebaseConfigured = Boolean(
  FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY
);

let appInitialised = false;

const ensureApp = () => {
  if (!isFirebaseConfigured) return false;
  if (!appInitialised && !getApps().length) {
    initializeApp({
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        // Render stores the key with literal \n; convert to real newlines.
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }
  appInitialised = true;
  return true;
};

if (!isFirebaseConfigured) {
  console.warn(
    'Firebase Admin not configured; token verification & push will be unavailable. ' +
      'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
  );
}

/**
 * Verify a Firebase ID token. Throws a 503-tagged error when Firebase is not
 * configured, and Firebase's own error for an invalid/expired token.
 * @param {string} token
 * @returns {Promise<import('firebase-admin/auth').DecodedIdToken>}
 */
export const verifyIdToken = async (token) => {
  if (!ensureApp()) {
    const err = new Error('Authentication is not configured on this server');
    err.status = 503;
    throw err;
  }
  return getAuth().verifyIdToken(token);
};

/**
 * FCM messaging client, or null when Firebase is unconfigured. Uses the same
 * service account as auth — no extra credentials needed for free, unlimited push.
 * @returns {import('firebase-admin/messaging').Messaging | null}
 */
export const getFirebaseMessaging = () => (ensureApp() ? getMessaging() : null);
