/**
 * Kya Pehnu? — motion tokens.
 *
 * Every animation in the app reaches for a value from this file, so the whole
 * surface moves with one hand. The curves and spring parameters are the ones
 * Apple ships in *Designing Fluid Interfaces* (WWDC 2018), translated to
 * Reanimated: a strong ease-out for entrances, an ease-in-out for on-screen
 * movement, the iOS sheet curve for anything that slides up from the edge.
 *
 * The rule the durations encode: UI motion stays under 300ms — a press is
 * near-imperceptible (120ms), a chip settles in under 200ms, and only sheets
 * and hero reveals get to breathe. `ease-in` never appears; it delays the exact
 * frame the finger is watching.
 */

import { Easing, ReduceMotion } from 'react-native-reanimated';

// Reanimated's built-in easings are as weak as CSS's — these are the stronger
// hand-tuned variants the motion reads as intentional.
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1); // entrances / exits — feels instant
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1); // movement across the screen
export const EASE_SHEET = Easing.bezier(0.32, 0.72, 0, 1); // iOS drawer / sheet curve

/** Durations, in ms. Nothing a finger triggers crosses 300 (except bouncy settling). */
export const duration = {
  pressIn: 90, // fast, crisp finger touchdown
  pressOut: 380, // bouncy spring release with overshoot settling
  press: 120, // legacy fallback
  chip: 180, // size chips, filter tabs, small state flips
  enter: 280, // cards and panels arriving
  exit: 220, // ~20% faster than enter
  hero: 520, // rare, first-run reveals only
};

/**
 * Spring configs in Apple's fluid interface parameters.
 *  - settle: critically damped, no overshoot. The default for quiet arrivals.
 *  - pop:    energetic bounce reserved for user-triggered state changes (badge, like heart).
 *  - snap:   what a released sheet/drag settles with.
 *  - bouncy: Apple's playful fluid spring with ~5% overshoot oscillation.
 *  - snappy: tight high-frequency spring for segmented controls and switches.
 *  - elastic: pronounced bouncy pop for high-delight interactive moments.
 */
export const spring = {
  settle: { duration: 400, dampingRatio: 1, reduceMotion: ReduceMotion.System },
  pop: { duration: 420, dampingRatio: 0.64, reduceMotion: ReduceMotion.System },
  snap: { duration: 300, dampingRatio: 0.82, reduceMotion: ReduceMotion.System },
  bouncy: { damping: 11, stiffness: 220, mass: 0.6, reduceMotion: ReduceMotion.System },
  snappy: { damping: 16, stiffness: 340, mass: 0.5, reduceMotion: ReduceMotion.System },
  elastic: { damping: 8, stiffness: 180, mass: 0.65, reduceMotion: ReduceMotion.System },
};

/**
 * Apple-grade cubic-bezier curves for fluid physics:
 *  - APPLE_BOUNCE_EASING: physical spring release that overshoots slightly past 1.0 (to ~1.03) and settles.
 *  - APPLE_PRESS_EASING: immediate, high-responsiveness compression on touch-down.
 */
export const APPLE_BOUNCE_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
export const APPLE_PRESS_EASING = 'cubic-bezier(0.2, 0, 0, 1)';

export const PRESS_SCALE = 0.95;

export const PRESS_IN_TRANSITION = {
  transform: [{ scale: PRESS_SCALE }],
  transitionProperty: 'transform',
  transitionDuration: `${duration.pressIn}ms`,
  transitionTimingFunction: APPLE_PRESS_EASING,
};

export const PRESS_OUT_TRANSITION = {
  transform: [{ scale: 1 }],
  transitionProperty: 'transform',
  transitionDuration: `${duration.pressOut}ms`,
  transitionTimingFunction: APPLE_BOUNCE_EASING,
};

export const PRESS_TRANSITION = PRESS_OUT_TRANSITION;

export const PRESSED_TRANSFORM = {
  transform: [{ scale: PRESS_SCALE }],
};

/** Stagger between siblings entering together. Longer reads as slow. */
export const STAGGER_MS = 44;

export default {
  EASE_OUT,
  EASE_IN_OUT,
  EASE_SHEET,
  APPLE_BOUNCE_EASING,
  APPLE_PRESS_EASING,
  duration,
  spring,
  PRESS_SCALE,
  PRESS_IN_TRANSITION,
  PRESS_OUT_TRANSITION,
  PRESS_TRANSITION,
  PRESSED_TRANSFORM,
};
