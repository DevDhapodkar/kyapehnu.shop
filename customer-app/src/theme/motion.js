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

/** Durations, in ms. Nothing a finger triggers crosses 300. */
export const duration = {
  press: 120, // scale feedback on any pressable
  chip: 180, // size chips, filter tabs, small state flips
  enter: 280, // cards and panels arriving
  exit: 220, // ~20% faster than enter — the arrival earns the time, the departure doesn't
  hero: 520, // rare, first-run reveals only
};

/**
 * Spring configs in Apple's two designer parameters (Reanimated takes these
 * directly — never mass/stiffness/damping).
 *  - settle: critically damped, no overshoot. The default for anything that
 *    just needs to arrive gracefully.
 *  - pop:    a little bounce, reserved for a value the user made appear
 *    (a badge incrementing, an "added" confirmation) — overshoot on a menu
 *    that merely faded in feels wrong; on something you caused, it feels alive.
 *  - snap:   what a released drag settles with.
 */
export const spring = {
  settle: { duration: 400, dampingRatio: 1, reduceMotion: ReduceMotion.System },
  pop: { duration: 420, dampingRatio: 0.68, reduceMotion: ReduceMotion.System },
  snap: { duration: 300, dampingRatio: 0.82, reduceMotion: ReduceMotion.System },
};

/**
 * The press-feedback transition, expressed as a Reanimated CSS transition so it
 * lives entirely on the UI thread with no shared value and no re-render per
 * frame. Spread it into a style, then toggle `PRESSED_TRANSFORM` on press-in.
 */
export const PRESS_SCALE = 0.97;

export const PRESS_TRANSITION = {
  transform: [{ scale: 1 }],
  transitionProperty: 'transform',
  transitionDuration: `${duration.press}ms`,
  transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
};

export const PRESSED_TRANSFORM = {
  transform: [{ scale: PRESS_SCALE }],
};

/** Stagger between siblings entering together. Longer reads as slow. */
export const STAGGER_MS = 44;

export default { EASE_OUT, EASE_IN_OUT, EASE_SHEET, duration, spring };
