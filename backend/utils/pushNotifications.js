import axios from 'axios';

// Expo's push service is free and needs no credentials — you POST to it with
// the device's ExponentPushToken. This is our live order-notification channel
// (WhatsApp requires weeks of Meta verification; this works today).
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const isExpoToken = (t) => typeof t === 'string' && t.startsWith('ExponentPushToken');

/**
 * Send an Expo push to one or more tokens. Best-effort: it never throws into
 * the caller's happy path, so a push outage can't cost us an order.
 * @param {string|string[]} tokens
 * @param {{ title: string, body: string, data?: object }} payload
 * @returns {Promise<{ sent: number, error?: string }>}
 */
export const sendExpoPush = async (tokens, { title, body, data }) => {
  const valid = (Array.isArray(tokens) ? tokens : [tokens]).filter(isExpoToken);
  if (!valid.length) return { sent: 0 };

  try {
    const messages = valid.map((to) => ({
      to,
      title,
      body,
      data: data || {},
      sound: 'default',
      priority: 'high',
      channelId: 'orders',
    }));
    await axios.post(EXPO_PUSH_URL, messages, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      timeout: 8000,
    });
    return { sent: valid.length };
  } catch (error) {
    console.error('Expo push failed:', error.message);
    return { sent: 0, error: error.message };
  }
};
