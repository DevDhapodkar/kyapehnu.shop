import Constants from 'expo-constants';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import * as fbAuth from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Firebase client init for the app.
 *
 * Config is read from `expo.extra.firebase` in app.json (the Web app config
 * from the Firebase console — apiKey, authDomain, projectId, appId, …). Until
 * those keys are filled in, `isFirebaseConfigured` is false and the auth
 * screens surface a clear "not configured yet" message instead of crashing.
 */
const firebaseConfig = Constants.expoConfig?.extra?.firebase ?? {};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// eslint-disable-next-line import/namespace
const getReactNativePersistence = fbAuth['getReactNativePersistence'];

let app = null;
let auth = null;

if (isFirebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  // Persist the session across restarts via AsyncStorage. The persistence
  // helper's export name has moved between firebase versions, so probe for it
  // and fall back to in-memory auth rather than hard-failing the bundle.
  if (typeof getReactNativePersistence === 'function') {
    try {
      auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
    } catch {
      // initializeAuth throws if auth was already initialised (Fast Refresh).
      auth = getAuth(app);
    }
  } else {
    auth = getAuth(app);
  }
}

export { auth };
export default app;
