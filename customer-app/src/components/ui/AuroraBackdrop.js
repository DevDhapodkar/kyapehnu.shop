import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

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
 * Each blob is a circle carrying a real Gaussian blur, which is what makes the
 * falloff smooth rather than a visible disc.
 *
 * The blur is written as a CSS string rather than React Native's array form.
 * Both are valid on native, but `react-native-web` only maps the string — with
 * the array the filter is dropped silently and every bloom renders as a
 * hard-edged circle, which is neither what this is for nor something a preview
 * would flag as broken.
 */
const BLOB_BLUR = 'blur(130px)';

// Position, size and drift for each bloom. Sizes are generous — a blob smaller
// than about half the screen stops reading as ambient light and starts reading
// as an object someone has placed on the page.
const BLOBS = [
  {
    color: colors.auroraViolet,
    size: SCREEN_WIDTH * 1.25,
    top: -SCREEN_HEIGHT * 0.16,
    left: -SCREEN_WIDTH * 0.42,
    opacity: 0.46,
    drift: { x: 34, y: 26, seconds: 19 },
  },
  {
    color: colors.auroraAzure,
    size: SCREEN_WIDTH * 1.05,
    top: SCREEN_HEIGHT * 0.06,
    left: SCREEN_WIDTH * 0.34,
    opacity: 0.4,
    drift: { x: -28, y: 34, seconds: 23 },
  },
  {
    color: colors.auroraBlush,
    size: SCREEN_WIDTH * 1.15,
    top: SCREEN_HEIGHT * 0.46,
    left: -SCREEN_WIDTH * 0.3,
    opacity: 0.34,
    drift: { x: 30, y: -30, seconds: 27 },
  },
  {
    color: colors.auroraAmber,
    size: SCREEN_WIDTH * 0.9,
    top: SCREEN_HEIGHT * 0.72,
    left: SCREEN_WIDTH * 0.42,
    opacity: 0.28,
    drift: { x: -24, y: -22, seconds: 31 },
  },
];

function Blob({ color, size, top, left, opacity, drift }) {
  // 0 → 1 → 0, looping. One clock per blob, each on its own period, so the
  // blooms never line up into a single pulsing mass.
  const progress = useSharedValue(0);

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
        {
          width: size,
          height: size,
          top,
          left,
          backgroundColor: color,
          opacity,
        },
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
    borderRadius: 9999,
    filter: BLOB_BLUR,
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.ink,
    opacity: 0.66,
  },
});
