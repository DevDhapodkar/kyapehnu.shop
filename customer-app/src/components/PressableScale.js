import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  ReduceMotion,
} from 'react-native-reanimated';

import { PRESS_SCALE } from '../theme/motion';
import { fireHaptic } from '../utils/haptics';

// Signature Apple fluid bouncy spring parameters:
// Snappy down-scale on touch, organic tactile spring bounce on release
const SPRING_DOWN = {
  damping: 18,
  stiffness: 340,
  mass: 0.5,
  reduceMotion: ReduceMotion.System,
};

const SPRING_UP = {
  damping: 12,
  stiffness: 220,
  mass: 0.6,
  reduceMotion: ReduceMotion.System,
};

/**
 * PressableScale
 *
 * The universal press primitive for the whole app. Integrates Apple HIG fluid spring
 * dynamics: down-scales with a fast, snappy spring on touch-in, and releases with a
 * lively, organic tactile spring bounce on lift.
 *
 * Runs entirely on UI thread via Reanimated worklets with zero JS thread re-renders.
 */
export default function PressableScale({
  children,
  style,
  onPress,
  onPressIn,
  onPressOut,
  onLongPress,
  disabled = false,
  haptic = 'light',
  scaleTo = PRESS_SCALE,
  hitSlop = 8,
  pressRetentionOffset = 16,
  accessibilityRole = 'button',
  accessibilityLabel,
  accessibilityState,
  accessibilityHint,
  wrapperStyle,
  ...restProps
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (event) => {
    if (!disabled) {
      scale.value = withSpring(scaleTo, SPRING_DOWN);
      if (haptic) fireHaptic(haptic);
    }
    onPressIn?.(event);
  };

  const handlePressOut = (event) => {
    if (!disabled) {
      scale.value = withSpring(1, SPRING_UP);
    }
    onPressOut?.(event);
  };

  // If style contains layout/flex props, forward them to the outer Pressable
  // so flexbox parent containers (like tabsRow or button rows) don't collapse it.
  const flattened = StyleSheet.flatten(style) || {};
  const wrapperLayout = {};
  if (flattened.flex !== undefined) wrapperLayout.flex = flattened.flex;
  if (flattened.flexGrow !== undefined) wrapperLayout.flexGrow = flattened.flexGrow;
  if (flattened.flexShrink !== undefined) wrapperLayout.flexShrink = flattened.flexShrink;
  if (flattened.alignSelf !== undefined) wrapperLayout.alignSelf = flattened.alignSelf;

  return (
    <Pressable
      {...restProps}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={onLongPress}
      disabled={disabled}
      hitSlop={hitSlop}
      pressRetentionOffset={pressRetentionOffset}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, ...accessibilityState }}
      accessibilityHint={accessibilityHint}
      style={[wrapperLayout, wrapperStyle]}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

