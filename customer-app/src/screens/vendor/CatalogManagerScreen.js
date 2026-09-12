import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import StitchScreenRenderer from '../../components/StitchScreenRenderer';
import StitchScreenSwitcher from '../../components/StitchScreenSwitcher';
import { useThemeStore } from '../../store/useThemeStore';

export default function CatalogManagerScreen({ navigation, route }) {
  const isDark = useThemeStore((state) => state.isDark);
  const [activeScreen, setActiveScreen] = useState('final_light_theme_Catalogue_Manager');

  useEffect(() => {
    if (route?.params?.stitchScreen) {
      setActiveScreen(route.params.stitchScreen);
    }
  }, [route?.params?.stitchScreen]);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#131315' : '#FAF9F5' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <StitchScreenRenderer
        screenKey={activeScreen}
        navigation={navigation}
        params={route?.params}
      />
      <StitchScreenSwitcher
        currentScreen={activeScreen}
        onSelectScreen={(screen) => setActiveScreen(screen)}
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
