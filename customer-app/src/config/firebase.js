import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

/**
 * Firebase client initialisation for the unified app.
 *
 * This is the single place the Firebase JS SDK is booted. Two services are
 * wired: Auth (email/password sign-in, the login system) and Firestore (the
 * user/vendor profile documents that decide which flow a signed-in account
 * lands in). Both run on Firebase's free Spark tier — no billing account is
 * required for this app's usage.
 *
 * Config is public by design. A Firebase web config (apiKey, appId, …) is a
 * project *identifier*, not a secret — access is gated by Firestore Security
 * Rules and Auth, never by hiding these values. They are still read from the
 * environment so a fork can point at its own project without editing source:
 *
 *   1. `EXPO_PUBLIC_FIREBASE_*` env vars (preferred — inlined by Expo at build
 *      time, see .env.example), then
 *   2. `expo.extra.firebase` in app.json (handy for a committed dev project).
 */

const extra = Constants.expoConfig?.extra?.firebase ?? {};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || extra.apiKey || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || extra.authDomain || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || extra.projectId || '',
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || extra.storageBucket || '',
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || extra.messagingSenderId || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || extra.appId || '',
};

const CONFIGURED = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

/**
 * Whether a usable Firebase project is configured. The store and screens read
 * this to show a clear "add your Firebase keys" message instead of crashing on
 * an opaque SDK error (`auth/invalid-api-key`) when the config is still the
 * empty placeholder. The SDK validates the key the moment Auth is created, so
 * initialisation below is skipped entirely until real keys are present.
 */
export const isFirebaseConfigured = () => CONFIGURED;

/**
 * Boot the app exactly once, and only when configured. Metro can re-evaluate
 * this module across fast refreshes, so guard on `getApps()` to avoid "Firebase
 * App named '[DEFAULT]' already exists".
 */
const app = CONFIGURED ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;

/**
 * Auth with React Native persistence.
 *
 * The default web `getAuth` keeps the session in memory only, so every cold
 * start would land the user back on the login screen. `initializeAuth` with the
 * AsyncStorage persister writes the session to disk, which is what lets
 * `onIdTokenChanged` rehydrate a returning user on launch. `initializeAuth`
 * throws if called twice, so fall back to `getAuth` on the re-eval path.
 */
const createAuth = () => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
};

/**
 * `auth` and `db` are null until the project is configured. Every caller either
 * guards on `isFirebaseConfigured()` first (the store's `initialize`, the auth
 * actions) or only runs inside a signed-in session that cannot exist without
 * configuration, so the null is never dereferenced.
 */
export const auth = CONFIGURED ? createAuth() : null;

export const db = CONFIGURED ? getFirestore(app) : null;

export default app;
