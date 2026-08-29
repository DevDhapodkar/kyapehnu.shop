import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import Gradient from './Gradient';
import { colors, radii, spacing } from '../../theme/colors';
import { duration, easing, reduceMotion } from '../../theme/tokens';

/**
 * Skeleton
 *
 * The app's loading state. A spinner tells the user *that* something is
 * loading; a skeleton tells them what is about to arrive and how much of it —
 * so the layout does not jump when the data lands, and a slow network reads as
 * "filling in" rather than "stuck".
 *
 * The sweep is a highlight gradient translated across the block on the UI
 * thread, so it keeps moving even while JS is busy parsing the response it is
 * waiting for — which is exactly when a JS-driven animation would freeze and
 * make the app look hung.
 */
export function Skeleton({ width = '100%', height = 14, radius = 'xs', style }) {
  const sweep = useSharedValue(-1);

  useEffect(() => {
    sweep.value = withRepeat(
      withTiming(1, { duration: duration.shimmer, easing: easing.inOut, ...reduceMotion }),
      -1,
      false,
    );
  }, [sweep]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${sweep.value * 100}%` }],
  }));

  const borderRadius = typeof radius === 'number' ? radius : (radii[radius] ?? radii.xs);

  return (
    <View style={[styles.block, { width, height, borderRadius }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, sweepStyle]}>
        <Gradient fill preset="shimmer" angle="horizontal" />
      </Animated.View>
    </View>
  );
}

/** A run of skeleton lines standing in for a paragraph. */
export function SkeletonLines({ lines = 3, lastLineWidth = '62%', gap = spacing.s, style }) {
  return (
    <View style={style}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          height={12}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          style={index > 0 ? { marginTop: gap } : null}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.charcoalLight,
    overflow: 'hidden',
  },
});

export default Skeleton;
