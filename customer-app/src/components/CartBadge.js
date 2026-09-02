import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '../theme/colors';
import { spring } from '../theme/motion';

/**
 * CartBadge
 *
 * The little count on the bag. It doesn't just change number when an item is
 * added — it bumps: a quick scale-up followed by a settling spring, so the act
 * of adding to the bag is felt in the corner of the eye even when the badge is
 * off to the side. The bump re-fires on every count change (state indication),
 * and the whole thing runs on the UI thread off a single shared value.
 */
export default function CartBadge({ count, style }) {
  const scale = useSharedValue(0.6);

  useEffect(() => {
    // Overshoot up, then settle with a touch of bounce — the "pop" reserved for
    // a value the user just made appear.
    scale.set(withSequence(withTiming(1.22, { duration: 110 }), withSpring(1, spring.pop)));
  }, [count, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <Animated.View style={[styles.badge, animatedStyle, style]}>
      <Text style={styles.badgeText}>{count}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.crimsonBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.ivory,
    fontSize: 10,
    fontWeight: '700',
  },
});
