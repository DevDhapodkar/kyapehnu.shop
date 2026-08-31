import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { toCssBloom } from '../../utils/color';
import { radii } from '../../theme/colors';

/**
 * Glow
 *
 * A soft bloom of light, used where a surface needs to carry its own highlight
 * rather than only refracting the wallpaper — the lit corner of the profile
 * banner, for instance.
 *
 * It is one view painted with a radial gradient. It used to be a stack of two
 * dozen concentric translucent discs, which is what you resort to without
 * gradients, and every ring edge showed as a step. React Native 0.86 renders
 * `radial-gradient()` through `experimental_backgroundImage` and the browser
 * through `backgroundImage`, so the falloff is now interpolated per pixel.
 */
export default function Glow({ color, size = 320, intensity = 0.16, style }) {
  const bloom = useMemo(() => toCssBloom(color, intensity), [color, intensity]);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.bloom,
        { width: size, height: size },
        Platform.OS === 'web'
          ? { backgroundImage: bloom }
          : { experimental_backgroundImage: bloom },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  bloom: {
    borderRadius: radii.pill,
  },
});
