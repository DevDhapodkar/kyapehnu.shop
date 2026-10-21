import Order from '../models/Order.js';
import { appendHistory, ORDER_STATUS } from '../utils/orderStatus.js';
import youpiClient, { verifyWebhookSignature, createPaymentSession, getPaymentStatus, generateUpiUri } from '../utils/youpiClient.js';

/**
 * Controller for YouPI-PG (Sovereign Zero-Fee UPI Payment Gateway)
 */

/**
 * POST /api/payments/youpi/create-session
 * Creates a payment session with YouPI PG and returns the checkout URL + UPI deep-link.
 */
export const createSession = async (req, res) => {
  try {
    const { orderId, amount, customer, metadata, returnUrl } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Valid payment amount in INR is required' });
    }

    const resolvedOrderId = orderId || `KP-${Date.now().toString().slice(-6)}`;

    const session = await createPaymentSession({
      orderId: resolvedOrderId,
      amount: Number(amount),
      customer: customer || {
        name: req.user?.displayName || 'Nagpur Customer',
        phone: req.user?.phoneNumber || '9823055443',
      },
      metadata: {
        ...(metadata || {}),
        userId: req.user?._id?.toString(),
      },
      returnUrl: returnUrl || `https://www.kyapehnu.shop/app/tracking/${resolvedOrderId}`,
    });

    res.status(201).json({
      success: true,
      ...session,
    });
  } catch (error) {
    console.error('[YouPI-PG] Failed to create payment session:', error);
    res.status(500).json({ message: 'Failed to initialize payment session', error: error.message });
  }
};

/**
 * GET /api/payments/youpi/:paymentId/status
 * Queries YouPI gateway for real-time payment observation status.
 */
export const checkStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const statusResult = await getPaymentStatus(paymentId);

    // If YouPI confirmed the payment, sync the order status in MongoDB
    if (statusResult.status === 'SUCCESS' && statusResult.orderId) {
      const order = await Order.findOne({
        $or: [
          { _id: statusResult.orderId },
          { paymentId: paymentId },
        ],
      });

      if (order && order.paymentStatus !== 'PAID') {
        order.paymentStatus = 'PAID';
        order.paymentMethod = 'UPI';
        order.paymentMode = 'UPI';
        order.paymentUtr = statusResult.utr || order.paymentUtr || 'YOUPI-OBSERVED';
        order.paidAt = new Date();
        order.statusHistory = appendHistory(
          order.statusHistory || [],
          order.status,
          `Instant UPI payment observed via YouPI PG (UTR: ${order.paymentUtr})`
        );
        await order.save();
      }
    }

    res.json(statusResult);
  } catch (error) {
    console.error('[YouPI-PG] Failed to check payment status:', error);
    res.status(500).json({ message: 'Failed to query payment status', error: error.message });
  }
};

/**
 * POST /api/payments/youpi/webhook
 * Receives authoritative HMAC-SHA256 signed event from YouPI PG observation mesh.
 */
export const handleWebhook = async (req, res) => {
  try {
    const rawPayload = req.rawBody || JSON.stringify(req.body);
    const signature =
      req.headers['x-gateway-signature'] ||
      req.headers['x-youpi-signature'] ||
      req.headers['x-signature'];

    const isValid = verifyWebhookSignature(rawPayload, signature);
    if (!isValid) {
      console.warn('[YouPI-PG Webhook] Unauthorized: signature mismatch or missing signature');
      return res.status(401).json({ error: 'Invalid HMAC signature' });
    }

    const eventData = typeof req.body === 'object' ? req.body : JSON.parse(rawPayload);
    const { event, paymentId, orderId, utr, amount } = eventData;

    console.log(`[YouPI-PG Webhook] Event: ${event} for Order: ${orderId}, Payment: ${paymentId}, UTR: ${utr}`);

    if (event === 'SUCCESS') {
      // Find matching order in DB
      let order = null;
      if (orderId) {
        try {
          order = await Order.findById(orderId);
        } catch {}
      }
      if (!order && paymentId) {
        order = await Order.findOne({ paymentId });
      }

      if (order) {
        order.paymentStatus = 'PAID';
        order.paymentMethod = 'UPI';
        order.paymentMode = 'UPI';
        order.paymentUtr = utr || 'YOUPI-VERIFIED';
        order.paidAt = new Date();
        order.statusHistory = appendHistory(
          order.statusHistory || [],
          order.status,
          `Payment Verified by YouPI Banking Mesh (UTR: ${utr || 'Direct'})`
        );
        await order.save();
        console.log(`[YouPI-PG Webhook] Order ${order._id} marked PAID via UPI`);
      }
    }

    res.json({ received: true, event, paymentId });
  } catch (error) {
    console.error('[YouPI-PG Webhook Error]:', error);
    res.status(500).json({ message: 'Webhook processing error', error: error.message });
  }
};

/**
 * POST /api/payments/youpi/verify
 * Verifies or confirms an order payment with optional UTR from client.
 */
export const verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, utr } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    let order = null;
    try {
      order = await Order.findById(orderId);
    } catch {}

    if (!order && paymentId) {
      order = await Order.findOne({ paymentId });
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.paymentStatus = 'PAID';
    order.paymentMethod = 'UPI';
    order.paymentMode = 'UPI';
    if (paymentId) order.paymentId = paymentId;
    if (utr) order.paymentUtr = utr;
    order.paidAt = new Date();
    order.statusHistory = appendHistory(
      order.statusHistory || [],
      order.status,
      `UPI Payment confirmed (UTR: ${utr || paymentId || 'Verified'})`
    );
    await order.save();

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      order,
    });
  } catch (error) {
    console.error('[YouPI-PG] Verify payment error:', error);
    res.status(500).json({ message: 'Failed to verify payment', error: error.message });
  }
};

export default {
  createSession,
  checkStatus,
  handleWebhook,
  verifyPayment,
};
