/**
 * Haptics — the sense the web doesn't have.
 *
 * Used sparingly, a haptic is the detail that makes the app feel expensive;
 * used everywhere, users turn it off. So the rules baked into these helpers:
 *  - one per user action, never per frame and never on scroll,
 *  - fired on the causal moment (the chip selecting, the order committing),
 *  - always paired with a visible change — haptics are off system-wide for many
 *    users and silent on most Android hardware, so the visual has to stand alone.
 *
 * Every call is wrapped: expo-haptics is a no-op on web and can reject on
 * hardware without a Taptic Engine, and a rejected promise must never surface as
 * an unhandled rejection over a cosmetic buzz.
 */

import * as Haptics from 'expo-haptics';

function safe(run) {
  try {
    const result = run();
    if (result && typeof result.catch === 'function') {
      // Swallow "haptics unavailable" rejections — feedback is never critical.
      result.catch(() => {});
    }
  } catch {
    // No Taptic Engine, web, or the module is absent — degrade silently.
  }
}

/** A value ticked past a step: a chip selected, a filter switched, a size picked. */
export function selection() {
  safe(() => Haptics.selectionAsync());
}

/** Something snapped home or a light commit landed. */
export function impactLight() {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** A heavier object landed, or a destructive action fired. */
export function impactMedium() {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/** An operation the user was waiting on succeeded (order placed, added to bag). */
export function notifySuccess() {
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** An operation failed or was rejected. */
export function notifyError() {
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}

/** Resolve a named intensity from a prop (used by PressableScale). */
export function fireHaptic(kind) {
  switch (kind) {
    case 'selection':
      return selection();
    case 'medium':
      return impactMedium();
    case 'success':
      return notifySuccess();
    case 'error':
      return notifyError();
    case 'light':
      return impactLight();
    default:
      return undefined;
  }
}

export default {
  selection,
  impactLight,
  impactMedium,
  notifySuccess,
  notifyError,
  fireHaptic,
};
