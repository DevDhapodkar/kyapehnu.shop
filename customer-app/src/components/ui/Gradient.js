import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { buildRamp } from '../../utils/color';

/**
 * Gradient
 *
 * A linear gradient with no native dependency: the ramp is laid down as a run
 * of flat, absolutely-positioned bands. `expo-linear-gradient` is a native
 * module, and adding one would force a fresh dev-client build on every
 * contributor for what amounts to paint — so the bands are drawn in JS instead.
 *
 * The bands are laid out by flex, not positioned by percentage. Both were tried:
 * percentages round independently per band, so at some widths two neighbours
 * fail to meet and the background shows through as a hairline seam — obvious on
 * a saturated ramp like the aurora button. Overlapping them to cover the seam is
 * worse still, because half the palette's ramps are translucent scrims and
 * overlapping alpha compounds into a stripe at every boundary. Flex children
 * share an exact edge and absorb the rounding remainder between them, so there
 * is neither a gap nor an overlap.
 *
 * The bands never take touches, so a `Gradient` can be dropped behind an
 * interactive surface without stealing its presses.
 *
 * Props:
 *  - colors:    two or more colour strings, treated as evenly spaced
 *  - direction: 'horizontal' (default) | 'vertical'
 *  - steps:     band count; raise it for large fills, lower it for small pills
 *               (the ramp is linear, so more bands only ever means a finer
 *               staircase — never a different set of colours)
 */
export default function Gradient({
  colors,
  direction = 'horizontal',
  steps = 48,
  pointerEvents,
  style,
  children,
}) {
  const isHorizontal = direction === 'horizontal';

  // Rebuilt only when the ramp itself changes — band colours are pure maths
  // over the stops, and this runs on every render of any gradient surface.
  const ramp = useMemo(() => buildRamp(colors, steps), [colors, steps]);

  return (
    <View pointerEvents={pointerEvents} style={style}>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { flexDirection: isHorizontal ? 'row' : 'column' },
        ]}
      >
        {ramp.map((color, index) => (
          <View key={`${color}-${index}`} style={[styles.band, { backgroundColor: color }]} />
        ))}
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    flex: 1,
  },
});
