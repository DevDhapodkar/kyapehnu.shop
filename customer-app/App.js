import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import AppNavigator from './src/navigation/AppNavigator';
import useAuthInit from './src/hooks/useAuthInit';
import { colors } from './src/theme/colors';

export default function App() {
  // Restore any persisted Firebase session and keep the ID token fresh.
  useAuthInit();

  // expo-splash-screen's automatic hide does not fire on this setup, so the
  // launch screen stays over the app forever. Hiding it once the root has
  // mounted is what actually reveals the UI.
  useEffect(() => {
    SplashScreen.hideAsync().catch((error) => {
      console.warn('[App] could not hide the splash screen:', error);
    });
  }, []);

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
