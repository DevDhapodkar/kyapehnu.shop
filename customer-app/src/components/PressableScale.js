import { useState } from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { PRESS_TRANSITION, PRESS_SCALE } from '../theme/motion';
import { fireHaptic } from '../utils/haptics';

/**
 * PressableScale
 *
 * The single press primitive for the whole app. Mobile has no hover, so every
 * affordance the web puts in hover has to live in the press — and a press that
 * only dims by opacity reads as dead. This scales the surface to 0.97 the instant
 * the finger lands (feedback on press-*in*, not on release) and springs it back
 * on lift, so the UI feels like it physically heard the tap.
 *
 * The scale runs as a Reanimated CSS transition: it lives entirely on the UI
 * thread, needs no shared value, and never re-renders per frame. `scale` takes
 * the label and icons with it, which is what makes it read as one physical object
 * being pressed rather than a colour change.
 *
 * The visual style goes on `style` (applied to the animated surface, so borders,
 * fills and `overflow: 'hidden'` clip correctly); the outer Pressable is just the
 * touch target. A single, quiet haptic fires on press-in by default — pass
 * `haptic={false}` on anything pressed dozens of times a session.
 *
 * Props of note:
 *  - haptic:  'light' (default) | 'selection' | 'medium' | 'success' | 'error' | false
 *  - scaleTo: override the pressed scale (0.95–0.98 is the usable range)
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
}) {
  const [pressed, setPressed] = useState(false);

  const handlePressIn = (event) => {
    setPressed(true);
    if (haptic && !disabled) fireHaptic(haptic);
    onPressIn?.(event);
  };

  const handlePressOut = (event) => {
    setPressed(false);
    onPressOut?.(event);
  };

  return (
    <Pressable
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
      style={wrapperStyle}
    >
      <Animated.View
        style={[
          PRESS_TRANSITION,
          style,
          pressed && !disabled ? { transform: [{ scale: scaleTo }] } : null,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
