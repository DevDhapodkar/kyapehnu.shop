import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import StitchScreenRenderer from '../components/StitchScreenRenderer';
import { useThemeStore } from '../store/useThemeStore';

export default function VendorRegisterScreen({ navigation, route }) {
  const isDark = useThemeStore((state) => state.isDark);
  const screenKey = 'final_light_theme_Register_Your_Shop__Remastered_';

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
