import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import AppNavigator from './src/navigation/AppNavigator';
import useAuthStore from './src/store/useAuthStore';
import { colors } from './src/theme/colors';

export default function App() {
  const initAuth = useAuthStore((state) => state.initAuth);

  // expo-splash-screen's automatic hide does not fire on this setup, so the
  // launch screen stays over the app forever. Hiding it once the root has
  // mounted is what actually reveals the UI.
  useEffect(() => {
    SplashScreen.hideAsync().catch((error) => {
      console.warn('[App] could not hide the splash screen:', error);
    });
  }, []);

  // Wire the Firebase auth listener once, so a signed-in session rehydrates on
  // launch and refreshed ID tokens reach the API client automatically.
  useEffect(() => {
    const unsubscribe = initAuth();
    return () => unsubscribe?.();
  }, [initAuth]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
});
