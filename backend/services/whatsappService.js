import axios from 'axios';
import WhatsappInbound from '../models/WhatsappInbound.js';
import { uploadBufferToStorage } from '../controllers/uploadController.js';

const META_GRAPH_VERSION = 'v19.0';

/**
 * Normalize any phone number format into standardized E.164 digits without '+'.
 * Examples:
 *   "+91 98765 43210" -> "919876543210"
 *   "9876543210"      -> "919876543210"
 *   "09876543210"     -> "919876543210"
 */
export const normalizePhone = (rawPhone) => {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }
  return digits;
};

/**
 * Build MongoDB query candidates for looking up a vendor by phone.
 * Handles differences in how phone numbers may have been saved.
 */
export const getPhoneQueryCandidates = (rawPhone) => {
  const normalized = normalizePhone(rawPhone);
  const last10 = normalized.slice(-10);

  return [
    { phone: normalized },
    { phone: `+${normalized}` },
    { phone: last10 },
    { phone: `+91 ${last10}` },
    { whatsappNumber: normalized },
    { whatsappNumber: `+${normalized}` },
    { whatsappNumber: last10 },
    { whatsappNumber: `+91 ${last10}` },
    { phone: { $regex: `${last10}$` } },
    { whatsappNumber: { $regex: `${last10}$` } },
  ];
};

/**
 * Deduplication check to prevent processing repeated webhook deliveries from Meta.
 */
export const isMessageDuplicate = async (messageId) => {
  if (!messageId) return false;
  const existing = await WhatsappInbound.findOne({ messageId });
  return Boolean(existing);
};

export const recordInboundMessage = async (messageId, waId, type = 'text', payload = {}) => {
  if (!messageId) return;
  try {
    await WhatsappInbound.create({ messageId, waId, type, payload });
  } catch (err) {
    // Ignore duplicate key error on race
  }
};

/**
 * Send a WhatsApp text message via Meta Cloud API.
 * In live mode, directly executes live HTTP POST to Meta WhatsApp Cloud API.
 */
export const sendTextMessage = async (to, text, previewUrl = false) => {
  const normalizedTo = normalizePhone(to);
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneId = process.env.META_PHONE_NUMBER_ID;

  // In test runs, record message delivery without external network call
  if (process.env.NODE_ENV === 'test') {
    return { ok: true, delivered: true, to: normalizedTo, text };
  }

  if (!token || !phoneId) {
    const errorMsg = `[WhatsApp LIVE Mode Error]: META_PHONE_NUMBER_ID and META_WHATSAPP_TOKEN must be configured in backend/.env for live WhatsApp delivery to +${normalizedTo}.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneId}/messages`;
    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedTo,
        type: 'text',
        text: { preview_url: previewUrl, body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`[WhatsApp LIVE] Message sent to +${normalizedTo} (ID: ${response.data?.messages?.[0]?.id})`);
    return response.data;
  } catch (error) {
    console.error(`[WhatsApp LIVE Error] Failed to send to +${normalizedTo}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Send interactive reply buttons (up to 3 buttons) via Meta Cloud API.
 * Automatically falls back to numbered text menu if Meta rejects or buttons exceed 3.
 */
export const sendInteractiveButtons = async (to, bodyText, buttons = []) => {
  const normalizedTo = normalizePhone(to);
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneId = process.env.META_PHONE_NUMBER_ID;

  // In test runs, record message delivery without external network call
  if (process.env.NODE_ENV === 'test') {
    return { ok: true, delivered: true, to: normalizedTo, text: bodyText };
  }

  // Max 3 buttons supported by WhatsApp interactive button schema or if text fallback
  if (buttons.length > 3) {
    const fallbackText = `${bodyText}\n\n${buttons
      .map((b, i) => `*${i + 1}.* ${b.title} (Reply: _${b.id}_)`)
      .join('\n')}`;
    return sendTextMessage(normalizedTo, fallbackText);
  }

  if (!token || !phoneId) {
    const errorMsg = `[WhatsApp LIVE Mode Error]: META_PHONE_NUMBER_ID and META_WHATSAPP_TOKEN must be configured in backend/.env for live interactive buttons to +${normalizedTo}.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneId}/messages`;
    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedTo,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: bodyText },
          action: {
            buttons: buttons.map((b) => ({
              type: 'reply',
              reply: {
                id: String(b.id).slice(0, 256),
                title: String(b.title).slice(0, 20),
              },
            })),
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.warn('Interactive button send failed, falling back to text:', error.response?.data?.error?.message || error.message);
    const fallbackText = `${bodyText}\n\n${buttons
      .map((b, i) => `*${i + 1}.* ${b.title} (Reply: _${b.id}_)`)
      .join('\n')}`;
    return sendTextMessage(normalizedTo, fallbackText);
  }
};

/**
 * Send an interactive list message (up to 10 options across sections) via Meta Cloud API.
 * The vendor taps "Select Option" and a native drawer pops up to choose an option.
 * 100% free within the 24-hour service conversation window.
 */
export const sendInteractiveList = async (to, bodyText, buttonText = 'Select Option', sections = []) => {
  const normalizedTo = normalizePhone(to);
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneId = process.env.META_PHONE_NUMBER_ID;

  if (process.env.NODE_ENV === 'test') {
    return { ok: true, delivered: true, to: normalizedTo, text: bodyText };
  }

  if (!token || !phoneId) {
    const errorMsg = `[WhatsApp LIVE Mode Error]: META_PHONE_NUMBER_ID and META_WHATSAPP_TOKEN must be configured in backend/.env for live interactive lists to +${normalizedTo}.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneId}/messages`;
    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedTo,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: { text: bodyText },
          action: {
            button: String(buttonText).slice(0, 20),
            sections: sections.map((s) => ({
              title: s.title ? String(s.title).slice(0, 24) : undefined,
              rows: (s.rows || []).map((r) => ({
                id: String(r.id).slice(0, 200),
                title: String(r.title).slice(0, 24),
                description: r.description ? String(r.description).slice(0, 72) : undefined,
              })),
            })),
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.warn('Interactive list send failed, falling back to text:', error.response?.data?.error?.message || error.message);
    let fallbackText = `${bodyText}\n\n`;
    for (const sec of sections) {
      if (sec.title) fallbackText += `*${sec.title}*\n`;
      for (const row of sec.rows || []) {
        fallbackText += `• *${row.title}* (Reply: ${row.id})\n`;
      }
    }
    return sendTextMessage(normalizedTo, fallbackText);
  }
};

/**
 * Download an image uploaded by the vendor from WhatsApp Cloud API,
 * then stream it directly into product storage (Cloudinary or local uploads).
 */
export const downloadAndStoreWhatsAppImage = async (mediaId, vendorId) => {
  const token = process.env.META_WHATSAPP_TOKEN;

  if (process.env.NODE_ENV === 'test' || !token || (typeof mediaId === 'string' && mediaId.startsWith('meta_media_test'))) {
    // Local / Dev fallback placeholder image
    return 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800';
  }

  try {
    // Step 1: Query Meta Graph API for media URL
    const metaMediaRes = await axios.get(`https://graph.facebook.com/${META_GRAPH_VERSION}/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const downloadUrl = metaMediaRes.data?.url;
    const mimeType = metaMediaRes.data?.mime_type || 'image/jpeg';
    if (!downloadUrl) throw new Error('Could not retrieve media URL from Meta Graph API');

    // Step 2: Download the binary image stream
    const fileRes = await axios.get(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer',
    });

    const buffer = Buffer.from(fileRes.data);

    // Step 3: Upload buffer to Cloudinary or disk fallback
    const secureUrl = await uploadBufferToStorage({
      buffer,
      mimetype: mimeType,
      originalname: `wa_${mediaId}.jpg`,
      vendorId,
    });

    return secureUrl;
  } catch (error) {
    console.error('Failed to download/store WhatsApp image:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Optional automated phone call alert hook for urgent new orders.
 * Triggered when a new order is received so the vendor hears an alert even if
 * their phone is in silent mode. Pluggable to Twilio Voice, Exotel, or webhook.
 */
export const triggerVoiceCallAlert = async (vendorPhone, order) => {
  if (process.env.VOICE_CALL_ENABLED !== 'true') return;

  const normalizedPhone = normalizePhone(vendorPhone);
  const webhookUrl = process.env.VOICE_CALL_WEBHOOK_URL;

  try {
    if (webhookUrl) {
      await axios.post(
        webhookUrl,
        {
          to: normalizedPhone,
          orderId: order._id,
          totalPrice: order.totalPrice,
          itemsCount: order.items?.length || 1,
          message: `Hello from Kya Pehnu. You have a new order of rupees ${order.totalPrice}. Please check WhatsApp to dispatch driver.`,
        },
        { timeout: 4000 }
      );
      console.log(`[Voice Call Alert triggered -> ${normalizedPhone}] for Order #${order._id}`);
    } else if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      // Optional Twilio Voice TTS Call
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Calls.json`;
      const twiml = `<Response><Say voice="Polly.Aditi">Hello from Kya Pehnu. You have received a new customer order for rupees ${order.totalPrice}. Please check WhatsApp to accept and dispatch driver.</Say></Response>`;

      const params = new URLSearchParams();
      params.append('To', `+${normalizedPhone}`);
      params.append('From', process.env.TWILIO_PHONE_NUMBER);
      params.append('Twiml', twiml);

      await axios.post(twilioUrl, params, {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
          ).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 5000,
      });
      console.log(`[Twilio Voice Call placed -> +${normalizedPhone}]`);
    }
  } catch (err) {
    console.error(`Voice call alert failed for ${normalizedPhone}:`, err.message);
    // Non-blocking: WhatsApp message remains primary channel
  }
};
