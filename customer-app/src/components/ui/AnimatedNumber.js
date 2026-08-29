import { useEffect, useRef } from 'react';
import { Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { duration, easing, reduceMotion } from '../../theme/tokens';

const AnimatedText = Animated.createAnimatedComponent(Text);

/**
 * AnimatedNumber
 *
 * A figure that acknowledges its own change: when the value moves, the text
 * dips and lifts back rather than swapping silently. Used on the bag total and
 * the delivery countdown, where a silent change is easy to miss and leaves the
 * user unsure whether their tap registered.
 *
 * The formatted string is what animates — not a tween through the intermediate
 * numbers. Counting up through ₹1,200 → ₹1,201 → … is noise, and on a currency
 * total it is actively misleading while it is mid-flight.
 */
export default function AnimatedNumber({ value, format = (v) => String(v), style, ...rest }) {
  // Derived during render, not mirrored into state: the formatted string is a
  // pure function of `value`, so holding a copy in state would only create a
  // second source of truth that can lag a frame behind the prop.
  const display = format(value);
  const shift = useSharedValue(0);
  const previous = useRef(display);

  useEffect(() => {
    // Mount is not a change — animating on first paint would make every screen
    // arrive with its numbers twitching.
    if (previous.current === display) return;
    previous.current = display;

    shift.value = withSequence(
      withTiming(1, { duration: duration.fast, easing: easing.in, ...reduceMotion }),
      withTiming(0, { duration: duration.base, easing: easing.out, ...reduceMotion }),
    );
  }, [display, shift]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - shift.value * 0.45,
    transform: [{ translateY: shift.value * -5 }],
  }));

  return (
    <AnimatedText style={[style, animatedStyle]} {...rest}>
      {display}
    </AnimatedText>
  );
}
