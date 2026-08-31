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
 * The app's wallpaper: four broad blooms of coloured light drifting behind
 * everything, on near-black ink.
 *
 * This is not decoration — it is the thing the glass is for. A frosted pane
 * over flat black is indistinguishable from a grey card; the same pane over
 * moving colour reads unmistakably as glass, because it visibly bends and
 * brightens what is behind it. Every translucent surface in the app is
 * ultimately refracting this view.
 *
 * Mounted once at the root, under the navigator. Screens paint no background of
 * their own, so this shows through the whole app.
 *
 * Each bloom is one view painted with a radial gradient that fades to nothing,
 * so the falloff is interpolated per pixel and there is no edge anywhere. That
 * replaced a blurred circle: a blur filter needs the new architecture, is
 * dropped silently by `react-native-web` in its array form, and costs a
 * full-screen offscreen pass per bloom. A gradient costs a fill.
 */

// Position, size and drift for each bloom. Sizes are generous — a blob smaller
// than about half the screen stops reading as ambient light and starts reading
// as an object someone has placed on the page.
const BLOBS = [
  {
    color: colors.auroraIndigo,
    size: SCREEN_WIDTH * 1.9,
    top: -SCREEN_HEIGHT * 0.3,
    left: -SCREEN_WIDTH * 0.7,
    intensity: 0.62,
    drift: { x: 34, y: 26, seconds: 19 },
  },
  {
    color: colors.auroraViolet,
    size: SCREEN_WIDTH * 1.7,
    top: SCREEN_HEIGHT * 0.02,
    left: SCREEN_WIDTH * 0.15,
    intensity: 0.55,
    drift: { x: -28, y: 34, seconds: 23 },
  },
  {
    color: colors.auroraTeal,
    size: SCREEN_WIDTH * 1.8,
    top: SCREEN_HEIGHT * 0.42,
    left: -SCREEN_WIDTH * 0.6,
    intensity: 0.44,
    drift: { x: 30, y: -30, seconds: 27 },
  },
  {
    color: colors.auroraRose,
    size: SCREEN_WIDTH * 1.5,
    top: SCREEN_HEIGHT * 0.68,
    left: SCREEN_WIDTH * 0.2,
    intensity: 0.4,
    drift: { x: -24, y: -22, seconds: 31 },
  },
];

function Blob({ color, size, top, left, intensity, drift }) {
  // 0 → 1 → 0, looping. One clock per blob, each on its own period, so the
  // blooms never line up into a single pulsing mass.
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
        styles.blob,
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
      {BLOBS.map((blob) => (
        <Blob key={blob.color} {...blob} />
      ))}

      {/* Knocks the blooms back hard. Without this the blobs stop reading as
          light behind glass and become a colour field the interface is sitting
          on — and body copy over the brighter lobes drops under the contrast
          it needs. The wallpaper should be felt, not looked at. */}
      <View style={styles.veil} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.ink,
    // The blobs are wider than the screen; clipping keeps them from expanding
    // the layout on web.
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.ink,
    opacity: 0.52,
  },
});
