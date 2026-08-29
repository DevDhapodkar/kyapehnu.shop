import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '../../theme/colors';
import { duration, easing, reduceMotion } from '../../theme/tokens';

/**
 * LiveDot
 *
 * The "this is happening right now" mark: a solid core with a halo that swells
 * and fades out of it, the way a radar return does. Used beside anything the
 * server is still moving — a rider on the map, an order mid-fulfilment, the
 * storefront's live-stock line.
 *
 * The pulse is deliberately slow. A fast blink reads as an alarm; a slow swell
 * reads as a heartbeat, which is the honest signal for "connected and idle".
 */
export default function LiveDot({ size = 8, color = colors.crimsonBright, style }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: duration.pulse, easing: easing.out, ...reduceMotion }),
        // A beat of rest at the bottom, so the pulses read as discrete returns
        // rather than one continuous throb.
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 1.9 }],
  }));

  return (
    <View style={[styles.wrap, { width: size * 3, height: size * 3 }, style]}>
      <Animated.View
        style={[
          styles.halo,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
          haloStyle,
        ]}
      />
      <View
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
  },
});
