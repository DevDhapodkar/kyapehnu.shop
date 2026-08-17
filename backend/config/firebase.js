import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const firebaseAuth = getAuth();

/**
 * Admin-side Firestore handle. The client app reads each account's role from
 * the `users/{uid}` profile document; the Admin SDK bypasses Security Rules, so
 * this is the only sanctioned way to promote an account to VENDOR (the rules
 * forbid a client from doing it to itself). Used by the vendor provisioning
 * script.
 */
export const firestore = getFirestore();

export { firebaseAuth };

export default firebaseAuth;
