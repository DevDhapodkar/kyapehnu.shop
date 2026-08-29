import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import Gradient from './Gradient';
import { colors, radii } from '../../theme/colors';
import { reduceMotion, spring } from '../../theme/tokens';

/**
 * ProgressBar
 *
 * A rail whose fill *travels* to its new value rather than jumping there. That
 * distinction matters for delivery progress: an animated advance is legible as
 * "the rider moved", where a jump is indistinguishable from a re-render.
 *
 * Driving the fill with `scaleX` on a full-width layer keeps the whole
 * animation on the UI thread — animating `width` would round-trip through
 * layout on every frame.
 *
 * Props:
 *  - value: 0..1, clamped
 */
export default function ProgressBar({
  value = 0,
  height = 3,
  preset = 'crimson',
  trackColor = colors.graphite,
  style,
}) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const progress = useSharedValue(clamped);

  useEffect(() => {
    progress.value = withSpring(clamped, { ...spring.gentle, ...reduceMotion });
  }, [clamped, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: Math.max(progress.value, 0.001) }],
  }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: trackColor },
        style,
      ]}
    >
      <Animated.View style={[styles.fill, fillStyle]}>
        <Gradient fill preset={preset} angle="horizontal" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.pill,
    // Anchor the scale to the left edge so the fill grows rightward from the
    // start of the rail instead of outward from its middle.
    transformOrigin: 'left',
  },
});
