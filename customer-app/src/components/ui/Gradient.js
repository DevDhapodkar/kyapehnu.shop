import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { toCssGradient } from '../../utils/color';

/**
 * Gradient
 *
 * A linear gradient with no native dependency. `expo-linear-gradient` is a
 * native module, and adding one would force a fresh dev-client build on every
 * contributor for what amounts to paint.
 *
 * The ramp is drawn by the platform, from one CSS `linear-gradient()` string:
 * React Native 0.86 renders it through `experimental_backgroundImage`, and the
 * browser through plain `backgroundImage`. Both take the same syntax, so the
 * string is built once and handed to whichever key the platform reads.
 *
 * This replaced a hand-rolled renderer that laid the ramp down as a run of flat
 * bands. Bands are fine in the abstract and terrible in practice: on a short
 * ramp — a 46pt specular edge, say — each band is a few pixels tall, and the
 * eye reads the steps as banding no matter how many are used. Raising the count
 * until the steps go sub-pixel means dozens of views per gradient, on a screen
 * that may hold a dozen gradients. A real gradient is one view and interpolates
 * per pixel.
 *
 * Props:
 *  - colors:    two or more colour strings, treated as evenly spaced
 *  - direction: 'horizontal' (default) | 'vertical'
 */
export default function Gradient({
  colors,
  direction = 'horizontal',
  pointerEvents,
  style,
  children,
}) {
  const css = useMemo(() => toCssGradient(colors, direction), [colors, direction]);

  return (
    <View
      pointerEvents={pointerEvents}
      style={[
        style,
        // Both keys carry the same string. Each platform reads the one it
        // knows and ignores the other, which keeps this a single style object
        // rather than a Platform.select over the whole component.
        Platform.OS === 'web'
          ? { backgroundImage: css }
          : { experimental_backgroundImage: css },
      ]}
    >
      {children}
    </View>
  );
}

/**
 * Kept so a caller can still reason about the ramp's extent in layout, and so
 * `StyleSheet` stays imported for consumers spreading `absoluteFillObject`.
 */
export const GRADIENT_FILL = StyleSheet.absoluteFillObject;
