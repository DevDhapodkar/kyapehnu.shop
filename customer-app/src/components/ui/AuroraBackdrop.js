import { useEffect, useMemo } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { toCssBloom } from '../../utils/color';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * AuroraBackdrop
 *
 * The app's wallpaper: a few soft blooms of warm room-light drifting behind
 * everything, on warm charcoal.
 *
 * On the light theme this is a soft warm wash — peach, blush and apricot
 * blooms on warm cream — the reference food app's background. It is what the
 * frosted glass refracts, and it is what keeps a light interface from reading
 * as flat white. Gentle on purpose: the page should look like lit paper, not a
 * poster.
 *
 * Mounted once at the root, under the navigator. Screens paint no background of
 * their own, so this shows through the whole app.
 *
 * Each bloom is one view painted with a radial gradient that fades to nothing,
 * so the falloff is interpolated per pixel and there is no edge anywhere. React
 * Native 0.86 renders the gradient through `experimental_backgroundImage`, the
 * browser through `backgroundImage`.
 */

// Position, size and drift for each bloom. Sizes are generous — a bloom smaller
// than about half the screen stops reading as ambient light and starts reading
// as an object someone has placed on the page.
const BLOOMS = [
  {
    color: colors.glowPeach,
    size: SCREEN_WIDTH * 2.0,
    top: -SCREEN_HEIGHT * 0.24,
    left: -SCREEN_WIDTH * 0.5,
    intensity: 0.55,
    drift: { x: 26, y: 20, seconds: 22 },
  },
  {
    color: colors.glowBlush,
    size: SCREEN_WIDTH * 1.8,
    top: SCREEN_HEIGHT * 0.04,
    left: SCREEN_WIDTH * 0.35,
    intensity: 0.5,
    drift: { x: -22, y: 26, seconds: 27 },
  },
  {
    color: colors.glowApricot,
    size: SCREEN_WIDTH * 1.7,
    top: SCREEN_HEIGHT * 0.6,
    left: -SCREEN_WIDTH * 0.45,
    intensity: 0.45,
    drift: { x: 22, y: -22, seconds: 31 },
  },
  {
    color: colors.glowRose,
    size: SCREEN_WIDTH * 1.5,
    top: SCREEN_HEIGHT * 0.82,
    left: SCREEN_WIDTH * 0.3,
    intensity: 0.42,
    drift: { x: -18, y: -18, seconds: 35 },
  },
];

function Bloom({ color, size, top, left, intensity, drift }) {
  // 0 → 1 → 0, looping. One clock per bloom, each on its own period, so they
  // never line up into a single pulsing mass.
  const progress = useSharedValue(0);
  const bloom = useMemo(() => toCssBloom(color, intensity), [color, intensity]);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: drift.seconds * 1000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [progress, drift.seconds]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * drift.x },
      { translateY: progress.value * drift.y },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.bloom,
        { width: size, height: size, top, left },
        Platform.OS === 'web'
          ? { backgroundImage: bloom }
          : { experimental_backgroundImage: bloom },
        style,
      ]}
    />
  );
}

export default function AuroraBackdrop({ style }) {
  return (
    <View pointerEvents="none" style={[styles.root, style]}>
      {BLOOMS.map((bloom) => (
        <Bloom key={bloom.color} {...bloom} />
      ))}

      {/* A whisper of the cream ground over the blooms, so they read as soft
          wash rather than saturated blobs. On light this is barely there — the
          blooms are meant to tint the paper, not paint it. */}
      <View style={styles.veil} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.ink,
    // The blooms are wider than the screen; clipping keeps them from expanding
    // the layout on web.
    overflow: 'hidden',
  },
  bloom: {
    position: 'absolute',
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.ink,
    opacity: 0.28,
  },
});
