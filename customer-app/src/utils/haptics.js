/**
 * Haptic feedback, wrapped so no call site has to care whether the platform
 * has a Taptic engine.
 *
 * Every helper is fire-and-forget: haptics are a garnish on an interaction that
 * has already happened, so a failure here must never surface to the user or
 * reject into a handler's error path. Web has no haptics API at all, and an
 * Android device can have its vibration motor disabled, so both paths swallow.
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

const fire = (run) => {
  if (!supported) return;
  try {
    run()?.catch?.(() => {});
  } catch {
    /* no motor, or the OS refused — the interaction still happened */
  }
};

/** A tap landed on something selectable — chips, tabs, size swatches. */
export const tapLight = () =>
  fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));

/** A primary action fired — add to bag, place order, advance an order. */
export const tapMedium = () =>
  fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));

/** Something committed and cannot be casually undone. */
export const tapHeavy = () =>
  fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));

/** The value under the finger changed (quantity steppers, filters). */
export const selection = () => fire(() => Haptics.selectionAsync());

/** An operation the user was waiting on came back clean. */
export const success = () =>
  fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));

/** An operation the user was waiting on failed. */
export const failure = () =>
  fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));

/** Something needs attention but is not an outright failure. */
export const warn = () =>
  fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));

export default { tapLight, tapMedium, tapHeavy, selection, success, failure, warn };
