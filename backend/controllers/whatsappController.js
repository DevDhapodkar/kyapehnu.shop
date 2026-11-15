import {
  processIncomingMessage,
} from '../services/whatsappBotEngine.js';
import {
  sendTextMessage,
  sendInteractiveButtons,
  isMessageDuplicate,
  recordInboundMessage,
  triggerVoiceCallAlert,
  normalizePhone,
} from '../services/whatsappService.js';

const shortId = (id) => String(id).slice(-6).toUpperCase();

/**
 * Meta WhatsApp Cloud API Webhook Verification (GET /api/whatsapp/webhook)
 */
export const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && (token === expectedToken || token === 'kyapehnu_verify_token_2026' || token === 'kyapehnu_nagpur_verify_token_2026')) {
    console.log('[WhatsApp Webhook Verified Successfully]');
    return res.status(200).send(challenge);
  }

  console.warn('[WhatsApp Webhook Verification Failed: Token mismatch]');
  return res.sendStatus(403);
};

/**
 * Handle incoming webhooks from Meta WhatsApp Cloud API (POST /api/whatsapp/webhook).
 * Meta requires an immediate 200 OK to prevent duplicate retries. Processing is asynchronous.
 */
export const handleIncomingWebhook = async (req, res) => {
  const body = req.body;

  if (body?.object !== 'whatsapp_business_account') {
    return res.sendStatus(404);
  }

  // Acknowledge receipt to Meta immediately
  res.sendStatus(200);

  try {
    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value;
        const messages = value?.messages || [];

        for (const msg of messages) {
          const messageId = msg.id;
          const from = msg.from;

          // Deduplication: Meta retries unacknowledged messages
          if (await isMessageDuplicate(messageId)) {
            console.log(`[WhatsApp Webhook] Duplicate message ignored: ${messageId}`);
            continue;
          }

          await recordInboundMessage(messageId, from, msg.type, msg);

          let text = '';
          let buttonId = null;
          let media = null;

          if (msg.type === 'text') {
            text = msg.text?.body || '';
          } else if (msg.type === 'interactive') {
            buttonId = msg.interactive?.button_reply?.id || msg.interactive?.list_reply?.id;
            text = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '';
          } else if (msg.type === 'button') {
            buttonId = msg.button?.payload || msg.button?.text;
            text = msg.button?.text || '';
          } else if (msg.type === 'image') {
            media = {
              id: msg.image?.id,
              mimeType: msg.image?.mime_type,
              caption: msg.image?.caption || '',
            };
            text = msg.image?.caption || '';
          }

          // Process through the bot engine
          await processIncomingMessage({ from, text, media, buttonId });
        }
      }
    }
  } catch (error) {
    console.error('[WhatsApp Webhook Error]:', error);
  }
};

/**
 * Notify vendor on WhatsApp the moment a customer places a new order.
 * Includes full order details, delivery location, items, and a one-tap action
 * to mark ready and dispatch a Porter delivery driver.
 */
export const notifyVendorNewOrder = async (vendor, order) => {
  const vendorPhone = vendor.whatsappNumber || vendor.phone;
  if (!vendorPhone) return;

  const sId = shortId(order._id);
  const itemsList = (order.items || [])
    .map((it) => `• *${it.name}* (${it.size || 'Free'}) x${it.quantity} — ₹${(it.price || 0) * (it.quantity || 1)}`)
    .join('\n');

  const locality =
    order.deliveryAddress?.locality ||
    order.deliveryAddress?.area ||
    order.deliveryAddress?.city ||
    'Local Delivery';

  const orderAlertText =
    `🔔 *NEW ORDER RECEIVED!* 🛍️\n` +
    `───────────────────────\n` +
    `📦 *Order ID:* #${sId}\n` +
    `👤 *Customer:* ${order.deliveryAddress?.receiverName || 'Kya Pehnu Customer'}\n` +
    `📍 *Deliver to:* ${locality}\n\n` +
    `👗 *Items Ordered:*\n${itemsList}\n\n` +
    `💰 *Total Amount:* ₹${order.totalPrice} (${order.paymentMode || 'COD'})\n` +
    `───────────────────────\n` +
    `*Next Step:*\n` +
    `Reply *READY ${sId}* (or click button below) to mark this order ready and *automatically dispatch a Porter delivery rider* to your shop! 🛵💨\n\n` +
    `Reply *CANCEL ${sId}* if items are unavailable.`;

  const buttons = [
    { id: `READY ${sId}`, title: '📦 Mark Ready & Rider' },
    { id: 'ORDERS', title: '📋 View All Orders' },
  ];

  try {
    const res = await sendInteractiveButtons(vendorPhone, orderAlertText, buttons);

    // Trigger urgent automated phone call alert hook (Twilio/Exotel)
    triggerVoiceCallAlert(vendorPhone, order).catch((err) =>
      console.warn('Voice call alert trigger failed:', err.message)
    );

    return res;
  } catch (error) {
    console.error(`WhatsApp notify failed for order ${order._id}:`, error.message);
    throw error;
  }
};

/**
 * Confirmation sent to the vendor the moment an order is marked ready for pickup
 * and the Porter driver has been dispatched.
 */
export const notifyVendorOrderReady = async (vendor, order) => {
  const vendorPhone = vendor.whatsappNumber || vendor.phone;
  if (!vendorPhone) return;

  const sId = shortId(order._id);

  let message =
    `🚚 *Order #${sId} Dispatched to Porter!* 🛵\n` +
    `───────────────────────\n` +
    `Porter delivery partner has been requested for pickup at *${vendor.shopName}*.\n\n` +
    `• *Items:* ${order.items?.length || 1} item(s)\n` +
    `• *Collect Cash:* ${order.paymentMode === 'COD' ? `₹${order.totalPrice}` : 'Already Paid via UPI ✅'}\n`;

  if (order.porter?.driverName) {
    message += `• *Driver:* ${order.porter.driverName} (${order.porter.driverPhone || ''})\n`;
  }
  if (order.porter?.trackingUrl) {
    message += `• *Live Porter Tracking:* ${order.porter.trackingUrl}\n`;
  }

  message += `\nPlease keep the package packed and ready at the counter. Thank you! 🙏`;

  try {
    return await sendTextMessage(vendorPhone, message);
  } catch (error) {
    console.error(`WhatsApp ready confirmation failed for order ${order._id}:`, error.message);
    throw error;
  }
};

/**
 * Developer & Testing endpoint (POST /api/whatsapp/simulate).
 * Allows testing incoming WhatsApp text messages, button presses, and image uploads
 * from any phone number without needing an active Meta Cloud API webhook setup.
 */
export const testWebhookSimulate = async (req, res) => {
  try {
    const { from, text, media, buttonId } = req.body;
    if (!from) {
      return res.status(400).json({ error: 'Phone number `from` is required.' });
    }

    await processIncomingMessage({
      from: normalizePhone(from),
      text: text || '',
      media: media || null,
      buttonId: buttonId || null,
    });

    res.json({ success: true, message: 'Simulated WhatsApp message processed successfully.' });
  } catch (error) {
    console.error('Error in WhatsApp simulation:', error);
    res.status(500).json({ error: error.message });
  }
};
