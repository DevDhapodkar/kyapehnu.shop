import { getFirebaseMessaging } from '../config/firebase.js';

// Push is delivered via Firebase Cloud Messaging using the service account the
// backend already holds — free, unlimited, and no extra credentials or Expo
// account. Devices register their native FCM token (getDevicePushTokenAsync).

/**
 * Send a push to one or more FCM device tokens. Best-effort: it never throws
 * into the caller's happy path, so a push outage can't cost us an order.
 * FCM data values must be strings, so everything in `data` is coerced.
 * @param {string|string[]} tokens
 * @param {{ title: string, body: string, data?: Record<string, unknown> }} payload
 * @returns {Promise<{ sent: number, error?: string }>}
 */
export const sendPush = async (tokens, { title, body, data }) => {
  const list = (Array.isArray(tokens) ? tokens : [tokens]).filter(
    (t) => typeof t === 'string' && t.length > 10
  );
  if (!list.length) return { sent: 0 };

  const messaging = getFirebaseMessaging();
  if (!messaging) return { sent: 0 };

  const stringData = Object.fromEntries(
    Object.entries(data || {}).map(([k, v]) => [k, String(v)])
  );

  try {
    const res = await messaging.sendEachForMulticast({
      tokens: list,
      notification: { title, body },
      data: stringData,
      android: { priority: 'high', notification: { channelId: 'orders', sound: 'default' } },
    });
    return { sent: res.successCount };
  } catch (error) {
    console.error('FCM push failed:', error.message);
    return { sent: 0, error: error.message };
  }
};
