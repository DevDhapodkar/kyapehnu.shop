import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { duration, easing, reduceMotion, spring, HIT_TARGET } from '../../theme/tokens';
import { tapLight, tapMedium, selection } from '../../utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * PressableScale
 *
 * The app's tactile primitive: everything tappable goes through it so a press
 * feels identical wherever it happens.
 *
 * Two things separate it from a bare Pressable:
 *
 *  1. The press state is a *spring*, not a style swap. `opacity` alone reads as
 *     a flicker; a critically-damped scale reads as the surface taking the
 *     finger's weight. The spring also means an interrupted press (a tap that
 *     becomes a scroll) animates back rather than snapping.
 *  2. Feedback fires on press-*in*, at the moment of contact — a haptic that
 *     waits for onPress lands after the user has already committed and reads as
 *     lag rather than response.
 *
 * Props:
 *  - scaleTo:  resting → pressed scale (default 0.97; smaller for big cards)
 *  - dimTo:    pressed opacity, for surfaces where scale alone is too subtle
 *  - haptic:   'light' | 'medium' | 'selection' | false
 *  - disabled: skips both the animation and the haptic
 *  - Everything else is forwarded to Pressable untouched, so accessibility
 *    props, hitSlop, and the onPress contract are the platform's, not ours.
 */
const HAPTICS = { light: tapLight, medium: tapMedium, selection };

export default function PressableScale({
  children,
  scaleTo = 0.97,
  dimTo = 1,
  haptic = 'light',
  disabled = false,
  style,
  onPressIn,
  onPressOut,
  hitSlop,
  ...rest
}) {
  const pressed = useSharedValue(0);

  // Plain handlers rather than useCallback: the React Compiler (enabled in
  // app.json → experiments.reactCompiler) memoises these itself, and its
  // immutability rule rejects writing to a hook-owned value from inside a
  // useCallback body.
  const handlePressIn = (event) => {
    pressed.value = withSpring(1, { ...spring.press, ...reduceMotion });
    if (haptic && HAPTICS[haptic]) HAPTICS[haptic]();
    onPressIn?.(event);
  };

  const handlePressOut = (event) => {
    pressed.value = withTiming(0, {
      duration: duration.base,
      easing: easing.out,
      ...reduceMotion,
    });
    onPressOut?.(event);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - scaleTo) }],
    opacity: 1 - pressed.value * (1 - dimTo),
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={disabled ? undefined : handlePressIn}
      onPressOut={disabled ? undefined : handlePressOut}
      // Small controls (a stepper, a close button) are often drawn smaller than
      // a finger; extend the touch area rather than the artwork.
      hitSlop={hitSlop ?? HIT_SLOP}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

/** Enough slop that a 28pt control still meets the 44pt guideline. */
const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

export { HIT_TARGET };
