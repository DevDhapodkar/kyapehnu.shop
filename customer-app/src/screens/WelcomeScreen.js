import React from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import StitchScreenRenderer from '../components/StitchScreenRenderer';
import StitchWelcome from '../stitch/StitchWelcome';
import { useThemeStore } from '../store/useThemeStore';

export default function WelcomeScreen({ navigation, route }) {
  const isDark = useThemeStore((state) => state.isDark);
  const screenKey = isDark
    ? 'final_theme_dark_Welcome_Screen__Matched_'
    : 'final_light_theme_Welcome_Screen__Logo_Centered_';

  if (Platform.OS === 'web') {
    return <StitchWelcome navigation={navigation} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#131315' : '#FAF9F5' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <StitchScreenRenderer
        screenKey={screenKey}
        navigation={navigation}
        params={route?.params}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
