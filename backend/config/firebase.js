import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Boot-safe: the SDK is initialised lazily on first token verification, never at
// import time. Missing creds only disable auth (routes answer 503) — they never
// crash the process. This is the fix that lets the server start in an
// environment where FIREBASE_* has not been provisioned yet.
const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

export const isFirebaseConfigured = Boolean(
  FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY
);

let authInstance = null;

const getFirebaseAuth = () => {
  if (!isFirebaseConfigured) return null;
  if (authInstance) return authInstance;

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        // Render stores the key with literal \n; convert to real newlines.
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }

  authInstance = getAuth();
  return authInstance;
};

if (!isFirebaseConfigured) {
  console.warn(
    'Firebase Admin not configured; token verification will be unavailable. ' +
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
  const auth = getFirebaseAuth();
  if (!auth) {
    const err = new Error('Authentication is not configured on this server');
    err.status = 503;
    throw err;
  }
  return auth.verifyIdToken(token);
};
