import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { gradients } from '../../theme/tokens';

/**
 * Gradient
 *
 * The app's only gradient surface. Everything else names a ramp from
 * theme/tokens → `gradients` rather than passing raw colours, so two surfaces
 * that are meant to match cannot drift apart.
 *
 * Props:
 *  - preset:   key of `gradients` (default 'surface')
 *  - colors:   explicit stops, when a one-off ramp is genuinely needed
 *  - locations / start / end: passed straight through to LinearGradient
 *  - fill:     absolutely fill the parent — the common case for a backdrop
 *              layer sitting behind content
 *  - angle:    'vertical' (default) | 'horizontal' | 'diagonal'
 */
const ANGLES = {
  vertical: { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } },
  horizontal: { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } },
  diagonal: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
};

export default function Gradient({
  preset = 'surface',
  colors: explicitColors,
  locations,
  angle = 'vertical',
  start,
  end,
  fill = false,
  pointerEvents,
  style,
  children,
}) {
  const stops = explicitColors ?? gradients[preset] ?? gradients.surface;
  const orientation = ANGLES[angle] ?? ANGLES.vertical;

  return (
    <LinearGradient
      colors={stops}
      locations={locations}
      start={start ?? orientation.start}
      end={end ?? orientation.end}
      // A backdrop layer must never eat the touches meant for the content
      // stacked above it, so `fill` implies non-interactive unless overridden.
      pointerEvents={pointerEvents ?? (fill ? 'none' : undefined)}
      style={[fill && StyleSheet.absoluteFill, style]}
    >
      {children}
    </LinearGradient>
  );
}
