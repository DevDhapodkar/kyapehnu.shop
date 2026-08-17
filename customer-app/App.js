import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import AppNavigator from './src/navigation/AppNavigator';
import useAuthStore from './src/store/useAuthStore';
import { colors } from './src/theme/colors';

export default function App() {
  // Start the Firebase session listener once, at the root. It restores a
  // persisted login on cold start and keeps the ID token fresh thereafter.
  const initialize = useAuthStore((state) => state.initialize);
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  // Keep the native splash up until the session has been resolved (restored or
  // ruled out), then reveal the UI. expo-splash-screen's automatic hide does
  // not fire on this setup, so hiding it by hand is what actually shows the app.
  useEffect(() => {
    if (status === 'initializing') return;
    SplashScreen.hideAsync().catch((error) => {
      console.warn('[App] could not hide the splash screen:', error);
    });
  }, [status]);

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
