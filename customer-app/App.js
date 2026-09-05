import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View, Platform, useWindowDimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import AppNavigator from './src/navigation/AppNavigator';
import useAuthStore from './src/store/useAuthStore';
import { colors } from './src/theme/colors';
import IosInstallPrompt from './src/components/IosInstallPrompt';

export default function App() {
  const initAuth = useAuthStore((state) => state.initAuth);
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;

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

  const desktopMetrics = isDesktop
    ? {
        frame: { x: 0, y: 0, width: 460, height: 900 },
        insets: { top: 12, left: 0, right: 0, bottom: 16 },
      }
    : undefined;

  return (
    <View style={[styles.root, isDesktop && styles.desktopOuter]}>
      <View style={[styles.appContainer, isDesktop && styles.desktopFrame]}>
        <GestureHandlerRootView style={styles.root}>
          <SafeAreaProvider initialMetrics={desktopMetrics}>
            <AppNavigator />
            <IosInstallPrompt />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  desktopOuter: {
    backgroundColor: '#050506',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
  },
  appContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#F4EFE7',
    position: 'relative',
    overflow: 'hidden',
  },
  desktopFrame: {
    maxWidth: 460,
    width: '100%',
    height: '100%',
    maxHeight: '100%',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(245, 243, 239, 0.12)',
    boxShadow: '0 0 50px rgba(0, 0, 0, 0.95)',
  },
});
