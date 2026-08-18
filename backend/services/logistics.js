import axios from 'axios';
import { loadEnv } from '../config/env.js';
import { log } from '../lib/logger.js';
import { formatPaise } from '../lib/money.js';

/**
 * Order side-effects (vendor WhatsApp alert, Porter driver dispatch), each
 * gated behind a feature flag. While company registration is in progress both
 * Porter and (optionally) WhatsApp are OFF, so a COD order completes end-to-end
 * with these as graceful no-ops instead of hard failures.
 *
 * The good `allSettled` "persist-then-dispatch, never let one outage cost the
 * other" property from the original code is preserved.
 */

const env = loadEnv();

const whatsappSend = async (to, template, params) => {
  const url = `https://graph.facebook.com/v19.0/${env.whatsapp.phoneNumberId}/messages`;
  return axios.post(
    url,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: template,
        language: { code: 'en' },
        components: [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) }],
      },
    },
    { headers: { Authorization: `Bearer ${env.whatsapp.token}`, 'Content-Type': 'application/json' } }
  );
};

/** Fire-and-log new-order alert to the vendor. Never throws to the caller. */
export const notifyVendorNewOrder = async (vendor, order) => {
  if (!env.features.whatsapp) {
    log.info('WhatsApp disabled; skipping new-order alert', { orderId: order._id.toString() });
    return { ok: false, skipped: true };
  }
  try {
    await whatsappSend(vendor.whatsappNumber, 'new_order_alert', [
      vendor.shopName,
      order.orderNumber || order._id.toString(),
      formatPaise(order.pricing.grandTotalPaise),
    ]);
    return { ok: true };
  } catch (err) {
    log.error('WhatsApp new-order alert failed', { orderId: order._id.toString(), error: err.message });
    return { ok: false, error: err.message };
  }
};

/**
 * Porter driver dispatch. Uses the configured (prod/UAT) base URL rather than a
 * hardcoded UAT constant. Returns a summary; the caller decides whether the
 * order advances to IN_TRANSIT (only on a real Porter accept).
 */
export const requestPorterDriver = async (order, vendor) => {
  if (!env.features.porter) {
    log.info('Porter disabled; order stays READY_FOR_PICKUP for manual dispatch', {
      orderId: order._id.toString(),
    });
    return { ok: false, skipped: true };
  }
  try {
    const { data } = await axios.post(
      `${env.porter.baseUrl}/orders/create`,
      {
        request_id: order._id.toString(),
        pickup_details: {
          lat: vendor.location.coordinates[1],
          lng: vendor.location.coordinates[0],
          address: {
            apartment_address: vendor.address.line1,
            city: vendor.address.city,
            pincode: vendor.address.pincode,
          },
        },
        drop_details: {
          lat: order.deliveryAddress.location.coordinates[1],
          lng: order.deliveryAddress.location.coordinates[0],
          address: {
            apartment_address: order.deliveryAddress.line1,
            city: order.deliveryAddress.city,
            pincode: order.deliveryAddress.pincode,
          },
        },
      },
      { headers: { 'X-API-KEY': env.porter.apiKey, 'Content-Type': 'application/json' } }
    );
    return { ok: true, requestId: data?.order_id, trackingUrl: data?.tracking_url };
  } catch (err) {
    log.error('Porter dispatch failed', {
      orderId: order._id.toString(),
      error: err.response?.data || err.message,
    });
    return { ok: false, error: err.message };
  }
};

export const notifyVendorOrderReady = async (vendor, order) => {
  if (!env.features.whatsapp) return { ok: false, skipped: true };
  try {
    await whatsappSend(vendor.whatsappNumber, 'order_ready_confirmation', [
      vendor.shopName,
      order.orderNumber || order._id.toString(),
      String(order.items.length),
      formatPaise(order.pricing.grandTotalPaise),
    ]);
    return { ok: true };
  } catch (err) {
    log.error('WhatsApp ready confirmation failed', { orderId: order._id.toString(), error: err.message });
    return { ok: false, error: err.message };
  }
};

export default { notifyVendorNewOrder, requestPorterDriver, notifyVendorOrderReady };
