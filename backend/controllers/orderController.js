import mongoose from 'mongoose';

import Order, { ORDER_STATUSES } from '../models/Order.js';
import Vendor from '../models/Vendor.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { notifyVendorNewOrder, notifyVendorOrderReady } from './whatsappController.js';
import { requestDriver } from './porterController.js';
import { sendPush } from '../utils/pushNotifications.js';
import {
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  canTransition,
  appendHistory,
  CUSTOMER_CANCELLABLE,
} from '../utils/orderStatus.js';
import { parseCartLines, priceOrderLines } from '../utils/orderPricing.js';
import { buildStockUpdate } from '../utils/stock.js';

const shortId = (id) => String(id).slice(-6).toUpperCase();

/** @returns {Error & { status: number }} */
const badRequest = (message) => {
  const err = new Error(message);
  err.status = 400;
  return err;
};

/**
 * Turn the request's cart into catalog-priced lines. The client chooses the
 * products, sizes and quantities; the server decides what they cost. Throws a
 * 400-tagged error for anything the buyer can act on (empty cart, item gone,
 * not enough stock).
 */
const priceCart = async (vendorId, rawItems) => {
  const lines = parseCartLines(rawItems);
  const ids = [...new Set(lines.map((line) => line.product))];

  // A malformed id is an item that cannot exist, not a server fault.
  if (ids.some((id) => !mongoose.isValidObjectId(id))) {
    throw badRequest('One of the items is no longer in the catalog');
  }

  const products = await Product.find({ _id: { $in: ids } }).select(
    'name price vendor status isAvailable sizes'
  );

  return priceOrderLines(lines, products, vendorId);
};

/**
 * Order-creation failures split cleanly in two: a 400 the buyer can fix (and
 * should read verbatim), and anything else, which stays opaque.
 */
const failOrderCreation = (res, error, fallback) => {
  const status = error.status === 400 ? 400 : 500;
  if (status === 400) return res.status(400).json({ message: error.message });
  return res.status(500).json({ message: fallback, error: error.message });
};

/**
 * Best-effort stock adjustment across an order's lines. `sign` is -1 to reserve
 * on order, +1 to restore on cancellation. Never throws into the caller.
 */
const adjustStock = (items, sign) =>
  Promise.all(
    (items || []).map((it) => {
      const { filter, update } = buildStockUpdate(it, sign);
      return Product.updateOne(filter, update).catch((e) =>
        console.error(`Stock adjust failed for ${it.product}:`, e.message)
      );
    })
  );

/** Push an order-status update to the buyer's device(s). Best-effort. */
const pushToCustomer = async (order) => {
  try {
    const user = await User.findById(order.customer).select('pushTokens');
    if (!user?.pushTokens?.length) return;
    await sendPush(user.pushTokens, {
      title: `Order ${shortId(order._id)}`,
      body: ORDER_STATUS_LABELS[order.status] || order.status,
      data: { type: 'ORDER_STATUS', orderId: String(order._id), status: order.status },
    });
  } catch (e) {
    console.error('Customer push failed:', e.message);
  }
};

/** Push a new-order alert to the shop's device(s). Best-effort. */
const pushToVendor = async (vendor, order) => {
  try {
    if (!vendor?.pushTokens?.length) return;
    await sendPush(vendor.pushTokens, {
      title: 'New order 🛍️',
      body: `Order ${shortId(order._id)} · ₹${order.totalPrice} · ${order.items.length} item(s)`,
      data: { type: 'NEW_ORDER', orderId: String(order._id) },
    });
  } catch (e) {
    console.error('Vendor push failed:', e.message);
  }
};

const createOrder = async (req, res) => {
  try {
    const { vendor: vendorId, deliveryAddress, paymentMethod } = req.body;

    if (paymentMethod && paymentMethod !== 'COD') {
      return res.status(400).json({ message: 'Only Cash on Delivery is supported right now' });
    }

    if (!mongoose.isValidObjectId(vendorId)) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    // Priced here, never from req.body.
    const { items, subtotal, deliveryFee, totalPrice } = await priceCart(vendorId, req.body.items);

    const order = await Order.create({
      customer: req.user._id,
      vendor: vendorId,
      items,
      subtotal,
      deliveryFee,
      totalPrice,
      deliveryAddress,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      status: ORDER_STATUS.PENDING,
      statusHistory: appendHistory([], ORDER_STATUS.PENDING, 'Order placed'),
    });

    // Reserve stock (atomic, never negative) before replying; notify the shop
    // (WhatsApp + push) best-effort.
    await adjustStock(items, -1);
    notifyVendorNewOrder(vendor, order).catch((err) =>
      console.error(`WhatsApp notify failed for order ${order._id}:`, err.message)
    );
    pushToVendor(vendor, order);

    res.status(201).json(order);
  } catch (error) {
    failOrderCreation(res, error, 'Failed to create order');
  }
};

/**
 * POST /api/orders/guest — public COD order from the web storefront. No account:
 * the buyer is identified by name + phone, and can track by order id + phone.
 */
const createGuestOrder = async (req, res) => {
  try {
    const { vendor: vendorId, deliveryAddress, contact, paymentMethod } = req.body;

    if (paymentMethod && paymentMethod !== 'COD') {
      return res.status(400).json({ message: 'Only Cash on Delivery is supported right now' });
    }
    if (!contact?.name || !contact?.phone) {
      return res.status(400).json({ message: 'Your name and phone number are required' });
    }
    if (!deliveryAddress?.line1 || !deliveryAddress?.pincode) {
      return res.status(400).json({ message: 'A delivery address (street + pincode) is required' });
    }

    if (!mongoose.isValidObjectId(vendorId)) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ message: 'Shop not found' });

    // Priced here, never from req.body. This endpoint is unauthenticated, so it
    // is the one most worth not trusting.
    const { items, subtotal, deliveryFee, totalPrice } = await priceCart(vendorId, req.body.items);

    const order = await Order.create({
      guestContact: { name: contact.name, phone: contact.phone },
      channel: 'WEB',
      vendor: vendorId,
      items,
      subtotal,
      deliveryFee,
      totalPrice,
      deliveryAddress,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      status: ORDER_STATUS.PENDING,
      statusHistory: appendHistory([], ORDER_STATUS.PENDING, 'Order placed'),
    });

    await adjustStock(items, -1);
    notifyVendorNewOrder(vendor, order).catch((err) =>
      console.error(`WhatsApp notify failed for order ${order._id}:`, err.message)
    );
    pushToVendor(vendor, order);

    res.status(201).json({ orderId: order._id, status: order.status, totalPrice: order.totalPrice });
  } catch (error) {
    failOrderCreation(res, error, 'Failed to place order');
  }
};

/** GET /api/orders/track?orderId=&phone= — public order tracking for guests. */
const trackGuestOrder = async (req, res) => {
  try {
    const { orderId, phone } = req.query;
    if (!orderId || !phone) {
      return res.status(400).json({ message: 'orderId and phone are required' });
    }
    const order = await Order.findById(orderId).populate('vendor', 'shopName area');
    if (!order || order.guestContact?.phone !== String(phone).trim()) {
      return res.status(404).json({ message: 'No order found for that id and phone number' });
    }
    res.json(order);
  } catch (error) {
    // A malformed order id lands here as a CastError.
    res.status(400).json({ message: 'Could not load that order', error: error.message });
  }
};

/**
 * Is this Firebase caller a party to the order? Two roles can read one order —
 * the buyer who placed it and the shop fulfilling it — and the route carries
 * only `verifyToken`, so both are resolved here from the token's uid.
 */
const isPartyToOrder = async (order, firebaseUid) => {
  const [user, vendor] = await Promise.all([
    order.customer ? User.findOne({ firebaseUid }).select('_id') : null,
    Vendor.findOne({ firebaseUid }).select('_id'),
  ]);

  if (user && order.customer?._id?.equals(user._id)) return true;
  if (vendor && order.vendor?._id?.equals(vendor._id)) return true;
  return false;
};

const getOrderById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = await Order.findById(req.params.id)
      .populate('customer', 'name phone')
      .populate('vendor', 'shopName whatsappNumber location address');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // An order carries the buyer's name, phone and doorstep. A signed-in
    // stranger must not be able to walk the id space and read them, so a
    // non-party gets the same answer as a bad id — no existence oracle.
    if (!(await isPartyToOrder(order, req.firebaseUser.uid))) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch order', error: error.message });
  }
};

/** GET /api/orders/mine — the signed-in customer's orders, newest first. */
const listMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('vendor', 'shopName area address location')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load your orders', error: error.message });
  }
};

/**
 * Vendor dashboard feed. Optional `?status=PENDING,ACCEPTED` narrows the list;
 * without it the vendor gets every order for their shop, newest first.
 */
const listVendorOrders = async (req, res) => {
  try {
    const filter = { vendor: req.vendor._id };

    if (req.query.status) {
      const statuses = req.query.status
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      const invalid = statuses.filter((s) => !ORDER_STATUSES.includes(s));
      if (invalid.length) {
        return res
          .status(400)
          .json({ message: `Invalid status ${invalid.join(', ')}. Must be one of ${ORDER_STATUSES.join(', ')}` });
      }

      filter.status = { $in: statuses };
    }

    const orders = await Order.find(filter)
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list vendor orders', error: error.message });
  }
};

const runReadyLogistics = (order, vendor) =>
  Promise.allSettled([requestDriver(order, vendor), notifyVendorOrderReady(vendor, order)]);

const settledSummary = (result, label) => {
  if (result.status === 'fulfilled') return { ok: true };
  const reason = result.reason;
  const detail = reason?.response?.data || reason?.message || String(reason);
  console.error(`${label} failed:`, detail);
  return { ok: false, error: typeof detail === 'string' ? detail : JSON.stringify(detail) };
};

/**
 * READY_FOR_PICKUP transition: persist the state first (so a mid-dispatch crash
 * is retryable), then dispatch Porter + WhatsApp. Advances to IN_TRANSIT only
 * once Porter actually accepted. Records the timeline and pushes the buyer.
 */
const transitionToReady = async (order, vendor) => {
  order.status = ORDER_STATUS.READY_FOR_PICKUP;
  order.statusHistory = appendHistory(order.statusHistory, ORDER_STATUS.READY_FOR_PICKUP);
  await order.save();
  pushToCustomer(order);

  const [porterResult, whatsappResult] = await runReadyLogistics(order, vendor);

  if (porterResult.status === 'fulfilled') {
    order.porter.requestId = porterResult.value?.order_id;
    order.porter.trackingUrl = porterResult.value?.tracking_url;
    order.status = ORDER_STATUS.IN_TRANSIT;
    order.statusHistory = appendHistory(order.statusHistory, ORDER_STATUS.IN_TRANSIT, 'Driver dispatched');
    await order.save();
    pushToCustomer(order);
  }

  return {
    porter: settledSummary(porterResult, `Porter dispatch for order ${order._id}`),
    whatsapp: settledSummary(whatsappResult, `WhatsApp ready confirmation for order ${order._id}`),
  };
};

/** POST /api/orders/:orderId/ready — the vendor flow's "Mark Ready for Pickup". */
const markOrderReady = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('vendor');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!order.vendor._id.equals(req.vendor._id)) {
      return res.status(403).json({ message: 'This order belongs to another vendor' });
    }

    if (['IN_TRANSIT', 'DELIVERED'].includes(order.status) || order.porter?.requestId) {
      return res.status(409).json({ message: `Order is already ${order.status}`, order });
    }

    const logistics = await transitionToReady(order, order.vendor);
    res.json({ order, logistics });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark order ready', error: error.message });
  }
};

/**
 * PATCH /api/orders/:id/status — vendor advances the order through the state
 * machine. Enforces allowed transitions, records the timeline, and pushes the
 * buyer. DELIVERED marks COD as collected; CANCELLED restores stock.
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of ${ORDER_STATUSES.join(', ')}` });
    }

    const order = await Order.findById(req.params.id).populate('vendor');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!order.vendor._id.equals(req.vendor._id)) {
      return res.status(403).json({ message: 'This order belongs to another vendor' });
    }

    if (!canTransition(order.status, status)) {
      return res.status(409).json({ message: `Cannot move an order from ${order.status} to ${status}` });
    }

    // READY_FOR_PICKUP also dispatches Porter + WhatsApp.
    if (status === ORDER_STATUS.READY_FOR_PICKUP) {
      const logistics = await transitionToReady(order, order.vendor);
      return res.json({ order, logistics });
    }

    if (status === ORDER_STATUS.CANCELLED) {
      await adjustStock(order.items, +1);
      order.cancellation = { by: 'VENDOR', reason: note, at: new Date() };
    }

    if (status === ORDER_STATUS.DELIVERED) {
      order.paymentStatus = 'PAID'; // COD collected on delivery
    }

    order.status = status;
    order.statusHistory = appendHistory(order.statusHistory, status, note);
    await order.save();
    pushToCustomer(order);

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
};

/**
 * PATCH /api/admin/orders/:id/status — an admin/operator advances any order.
 * Same state machine and side effects (timeline, stock, COD, push) as the
 * vendor route, without the vendor-ownership check.
 */
const adminAdvanceOrder = async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of ${ORDER_STATUSES.join(', ')}` });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!canTransition(order.status, status)) {
      return res.status(409).json({ message: `Cannot move an order from ${order.status} to ${status}` });
    }

    if (status === ORDER_STATUS.CANCELLED) {
      await adjustStock(order.items, +1);
      order.cancellation = { by: 'VENDOR', reason: note, at: new Date() };
    }
    if (status === ORDER_STATUS.DELIVERED) order.paymentStatus = 'PAID';

    order.status = status;
    order.statusHistory = appendHistory(order.statusHistory, status, note);
    await order.save();
    pushToCustomer(order);
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
};

/** PATCH /api/orders/:id/cancel — the customer cancels their own order. */
const cancelOrder = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // A guest (web COD) order has no `customer` at all — reaching for .equals()
    // on it threw, and the caller saw a 500 instead of "not yours".
    if (!order.customer?.equals(req.user._id)) {
      return res.status(403).json({ message: 'This is not your order' });
    }

    if (!CUSTOMER_CANCELLABLE.includes(order.status)) {
      return res
        .status(409)
        .json({ message: `An order that is already ${order.status} can no longer be cancelled` });
    }

    await adjustStock(order.items, +1);
    order.status = ORDER_STATUS.CANCELLED;
    order.cancellation = { by: 'CUSTOMER', reason: req.body?.reason, at: new Date() };
    order.statusHistory = appendHistory(order.statusHistory, ORDER_STATUS.CANCELLED, 'Cancelled by customer');
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel order', error: error.message });
  }
};

export {
  createOrder,
  createGuestOrder,
  trackGuestOrder,
  getOrderById,
  listMyOrders,
  listVendorOrders,
  markOrderReady,
  updateOrderStatus,
  adminAdvanceOrder,
  cancelOrder,
};
