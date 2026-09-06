// Web shim for `Alert.alert`.
//
// react-native-web ships an Alert whose `alert()` is an empty no-op
// (node_modules/react-native-web/dist/exports/Alert/index.js). As a result every
// `Alert.alert(...)` in the app — form-validation notices, checkout errors,
// destructive-action confirmations — silently does nothing in the browser, so a
// web customer gets no feedback when, say, an order fails or an address is
// incomplete.
//
// This patches Alert on web so those calls surface through the browser's native
// `window.alert` / `window.confirm`, preserving RN's button/callback contract as
// closely as a synchronous browser dialog allows. Native builds are untouched.
//
// Import this once for its side effect, before the app renders (see index.js).
import { Alert, Platform } from 'react-native';

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const composeText = (title, message) =>
    [title, message].filter(Boolean).join('\n\n');

  // RN marks the dismiss action with style 'cancel'; the primary action is the
  // last non-cancel button. Fire a button's onPress defensively.
  const runPress = (button) => {
    try {
      button?.onPress?.();
    } catch (error) {
      // A callback throwing must not break the dialog flow.
      console.error('[webAlert] button handler failed:', error?.message || error);
    }
  };

  Alert.alert = (title, message, buttons) => {
    const text = composeText(title, message);

    if (!Array.isArray(buttons) || buttons.length <= 1) {
      window.alert(text);
      runPress(buttons?.[0]);
      return;
    }

    const cancelButton = buttons.find((b) => b?.style === 'cancel');
    const confirmButton = [...buttons].reverse().find((b) => b?.style !== 'cancel');

    if (window.confirm(text)) {
      runPress(confirmButton);
    } else {
      runPress(cancelButton);
    }
  };
}
