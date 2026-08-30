import { StyleSheet, View } from 'react-native';

import { radii } from '../../theme/colors';

/**
 * Glow
 *
 * A soft radial bloom used to light the page behind the bento grid, so the
 * background reads as a lit room rather than flat black.
 *
 * Built as concentric discs of falling opacity instead of a blur: view blur
 * filters are new-architecture-only and silently no-op where they are not
 * supported, whereas nested discs render the same everywhere.
 *
 * The ring count is what keeps it from reading as a set of rings: at this many
 * steps each disc contributes about a percent of alpha, and the accumulated
 * falloff is a smooth cone. The radii step *evenly* — bunching them toward the
 * centre thins them out at the rim, which is exactly where a visible arc gives
 * the trick away.
 */
const RINGS = 24;

export default function Glow({ color, size = 320, intensity = 0.16, style }) {
  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, { width: size, height: size }, style]}
    >
      {Array.from({ length: RINGS }, (_, index) => {
        // Ring 0 is the outermost; each step in is smaller, and the stack sums
        // to roughly `intensity` at the centre.
        const ringSize = size * (1 - index / RINGS);

        return (
          <View
            key={index}
            style={[
              styles.ring,
              {
                width: ringSize,
                height: ringSize,
                borderRadius: radii.pill,
                backgroundColor: color,
                opacity: intensity / RINGS,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
});
