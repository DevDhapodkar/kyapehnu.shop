import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

// Show notifications while the app is foregrounded too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Ask for permission and return the device's **native FCM token** (Android).
 * Uses getDevicePushTokenAsync, so it needs no Expo/EAS project — the backend
 * delivers pushes directly via Firebase Cloud Messaging with its service
 * account. Returns null on a simulator, if denied, or if FCM isn't configured
 * in the build (no google-services.json). Never throws — push is best-effort.
 * @returns {Promise<string|null>}
 */
export const registerForPush = async () => {
  try {
    if (!Device.isDevice) return null;

    const existing = await Notifications.getPermissionsAsync();
    let granted = existing.granted;
    if (!granted) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.granted;
    }
    if (!granted) return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Orders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
    }

    const tokenData = await Notifications.getDevicePushTokenAsync();
    return tokenData?.data ?? null;
  } catch (error) {
    console.warn('Push registration skipped:', error.message);
    return null;
  }
};
