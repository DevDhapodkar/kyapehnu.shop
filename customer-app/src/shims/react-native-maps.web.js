// Web shim for `react-native-maps`, which is native-only: its Fabric specs call
// `codegenNativeComponent`, a no-op on react-native-web, so importing the real
// package throws at module load and takes the whole web bundle down. Metro
// aliases this file in place of `react-native-maps` on the web platform (see
// metro.config.js). It renders a labelled placeholder for MapView and no-ops the
// overlay components so map screens stay reachable when testing UI in a browser.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const PROVIDER_DEFAULT = undefined;
export const PROVIDER_GOOGLE = 'google';

/** Placeholder standing in for the native map surface. */
function MapView({ style, children }) {
  return (
    <View style={[styles.map, style]}>
      <Text style={styles.label}>Map preview unavailable on web</Text>
      {children}
    </View>
  );
}

// Overlays render nothing on web — they only exist as children of a real map.
export const Marker = () => null;
export const Polyline = () => null;
export const Polygon = () => null;
export const Circle = () => null;
export const Callout = () => null;
export const Overlay = () => null;

const styles = StyleSheet.create({
  map: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#2a2a2e',
    minHeight: 160,
  },
  label: {
    color: '#8a8a90',
    fontSize: 13,
  },
});

MapView.Marker = Marker;
MapView.Polyline = Polyline;
MapView.Polygon = Polygon;
MapView.Circle = Circle;
MapView.Callout = Callout;

export default MapView;
