import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { log } from '../lib/logger.js';

/**
 * Firebase Admin, initialised lazily and guarded. If credentials are not
 * configured (e.g. an admin-portal-only or CI environment), the app still boots
 * and Firebase-authenticated routes fail cleanly at call time instead of
 * crashing the process at import.
 */
const configured = Boolean(
  process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
);

if (configured && !getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
} else if (!configured) {
  log.warn('Firebase Admin not configured; token verification will be unavailable');
}

const notConfiguredError = () => {
  const err = new Error('Firebase Admin is not configured on this server');
  err.statusCode = 503;
  return err;
};

/** Proxy so importing modules keep `firebaseAuth.verifyIdToken(...)` unchanged. */
const firebaseAuth = configured
  ? getAuth()
  : { verifyIdToken: () => Promise.reject(notConfiguredError()) };

export default firebaseAuth;
