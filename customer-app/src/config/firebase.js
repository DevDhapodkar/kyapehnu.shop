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
import { Platform } from 'react-native';

const staticFirebaseConfig = {
  apiKey: 'AIzaSyCfr4q93xlmNSNHp3YTC0pd2bPmoKktPhc',
  authDomain: 'kyapehnushop.firebaseapp.com',
  projectId: 'kyapehnushop',
  storageBucket: 'kyapehnushop.firebasestorage.app',
  messagingSenderId: '484031497035',
  appId: '1:484031497035:web:3948943f5af3667eed1ece',
  measurementId: 'G-2T0YQNEE0X',
};

const firebaseConfig = {
  ...staticFirebaseConfig,
  ...(Constants.expoConfig?.extra?.firebase ?? {}),
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app = null;
let auth = null;

if (isFirebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  if (Platform.OS === 'web') {
    try {
      const webPersistence = fbAuth.browserLocalPersistence || fbAuth.indexedDBLocalPersistence;
      auth = initializeAuth(app, {
        persistence: webPersistence ? [webPersistence] : undefined,
      });
    } catch {
      auth = getAuth(app);
    }
  } else {
    // eslint-disable-next-line import/namespace
    const getReactNativePersistence = fbAuth['getReactNativePersistence'];
    if (typeof getReactNativePersistence === 'function') {
      try {
        auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
      } catch {
        auth = getAuth(app);
      }
    } else {
      auth = getAuth(app);
    }
  }
}

export { auth };
export default app;
