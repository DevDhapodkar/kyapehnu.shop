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
 * Each band is sampled at its own centre and tiles *exactly* — bands must never
 * overlap. Half the ramps in the palette are translucent scrims, and where two
 * translucent bands overlap their alpha compounds, which paints a visible
 * stripe at every band boundary. Abutting bands can in principle leave a
 * sub-pixel seam instead, but adjacent bands differ by a fraction of one step
 * of the ramp, so a seam is imperceptible where a doubled alpha is not.
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

  const size = 100 / ramp.length;

  return (
    <View pointerEvents={pointerEvents} style={style}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {ramp.map((color, index) => {
          const offset = `${index * size}%`;
          const extent = `${size}%`;

          return (
            <View
              key={`${color}-${index}`}
              style={[
                styles.band,
                { backgroundColor: color },
                isHorizontal
                  ? { left: offset, width: extent, top: 0, bottom: 0 }
                  : { top: offset, height: extent, left: 0, right: 0 },
              ]}
            />
          );
        })}
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    position: 'absolute',
  },
});
