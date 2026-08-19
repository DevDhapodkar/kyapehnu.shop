import Constants from 'expo-constants';

/**
 * Firebase client (Auth) init, config-driven and gracefully optional.
 *
 * The web/JS SDK config lives in `expo.extra.firebase` in app.json (apiKey,
 * authDomain, projectId, appId — these are NOT secrets; they identify the
 * project). When it isn't filled in, `isFirebaseConfigured` is false and the app
 * falls back to the demo session, so it still runs without a Firebase project.
 *
 * Auth uses AsyncStorage persistence so a signed-in session survives app
 * restarts. The ID token this produces is exactly what the Express backend
 * verifies via firebase-admin.
 */
const cfg = Constants.expoConfig?.extra?.firebase ?? {};

export const isFirebaseConfigured = Boolean(cfg.apiKey && cfg.projectId && cfg.appId);

let authInstance = null;

if (isFirebaseConfigured) {
  // Imported lazily so a project without the config (or without the native
  // AsyncStorage module installed) never crashes at import time.
  // eslint-disable-next-line global-require
  const { initializeApp, getApps, getApp } = require('firebase/app');
  const {
    initializeAuth,
    getAuth,
    getReactNativePersistence,
  } = require('firebase/auth');
  // eslint-disable-next-line global-require
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;

  const app = getApps().length ? getApp() : initializeApp(cfg);
  try {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // initializeAuth throws if it was already initialised (fast refresh) — reuse.
    authInstance = getAuth(app);
  }
}

export const firebaseAuthClient = authInstance;
