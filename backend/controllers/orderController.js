import Order from '../models/Order.js';
import Invoice from '../models/Invoice.js';
import { asyncHandler, notFound, badRequest, conflict, forbidden } from '../lib/errors.js';
import { createOrder as createOrderSvc, advanceOrderStatus } from '../services/orderService.js';
import {
  notifyVendorNewOrder,
  notifyVendorOrderReady,
  requestPorterDriver,
} from '../services/logistics.js';
import { ORDER_STATUS, ORDER_STATUSES } from '../services/orderStateMachine.js';
import { log } from '../lib/logger.js';

/**
 * POST /api/orders — place a Cash-on-Delivery order. Price, stock, and the ₹25
 * platform fee are all computed server-side from APPROVED products; the client
 * total is never trusted. Vendor is notified out-of-band (never blocks the 201).
 */
export const createOrder = asyncHandler(async (req, res) => {
  const order = await createOrderSvc(req.user, req.body);

  notifyVendorNewOrder(await order.populate('vendor'), order).catch((err) =>
    log.error('post-order vendor notify failed', { orderId: order._id.toString(), error: err.message })
  );

  res.status(201).json(order);
});

/** Assert the caller owns this order as its customer or its vendor. */
const assertOwnership = (order, req) => {
  const isCustomer = req.user && order.customer.equals(req.user._id);
  const isVendor = req.vendor && order.vendor.equals(req.vendor._id);
  if (!isCustomer && !isVendor) throw notFound('Order not found'); // don't leak existence
  return { isCustomer, isVendor };
};

/**
 * GET /api/orders/:id — order detail. FIXES the IDOR: only the owning customer
 * or the owning vendor may read it (previously any authenticated user could).
 */
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'name phone')
    .populate('vendor', 'shopName whatsappNumber location address');
  if (!order) throw notFound('Order not found');
  assertOwnership(order, req);
  res.json(order);
});

/** GET /api/orders/mine — the signed-in customer's order history. */
export const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id })
    .populate('vendor', 'shopName')
    .sort({ createdAt: -1 })
    .limit(100);
  res.json(orders);
});

/** GET /api/orders/vendor/mine — vendor dashboard feed, optional ?status=. */
export const listVendorOrders = asyncHandler(async (req, res) => {
  const filter = { vendor: req.vendor._id };
  const statusParam = req.validatedQuery?.status;
  if (statusParam) {
    const statuses = statusParam.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
    const invalid = statuses.filter((s) => !ORDER_STATUSES.includes(s));
    if (invalid.length) throw badRequest(`Invalid status ${invalid.join(', ')}`);
    filter.status = { $in: statuses };
  }
  const orders = await Order.find(filter).populate('customer', 'name phone').sort({ createdAt: -1 });
  res.json(orders);
});

/**
 * Run the ready-for-pickup side effects: Porter dispatch + WhatsApp confirm,
 * fired together, neither blocking the other. Only a real Porter accept
 * advances the order to IN_TRANSIT — otherwise it waits at READY_FOR_PICKUP for
 * manual dispatch (the state while Porter is deferred).
 */
const runReadyLogistics = async (order, vendor) => {
  const [porter, whatsapp] = await Promise.all([
    requestPorterDriver(order, vendor),
    notifyVendorOrderReady(vendor, order),
  ]);
  if (porter.ok && porter.requestId) {
    order.porter.requestId = porter.requestId;
    order.porter.trackingUrl = porter.trackingUrl;
    await order.save();
    await advanceOrderStatus(order, ORDER_STATUS.IN_TRANSIT, 'SYSTEM', {
      note: 'Porter driver dispatched',
    });
  }
  return { porter, whatsapp };
};

/**
 * PATCH /api/orders/:id/status — vendor-driven transition, validated by the
 * order state machine (a vendor can no longer jump straight to DELIVERED).
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id).populate('vendor');
  if (!order) throw notFound('Order not found');
  if (!order.vendor._id.equals(req.vendor._id)) throw forbidden('This order belongs to another shop');

  if (status === ORDER_STATUS.READY_FOR_PICKUP) {
    await advanceOrderStatus(order, ORDER_STATUS.READY_FOR_PICKUP, 'VENDOR', { note });
    const logistics = await runReadyLogistics(order, order.vendor);
    return res.json({ order, logistics });
  }

  await transitionOr409(order, status, 'VENDOR', { note });
  res.json({ order });
});

/** POST /api/orders/:orderId/ready — the vendor "Mark Ready for Pickup" action. */
export const markOrderReady = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).populate('vendor');
  if (!order) throw notFound('Order not found');
  if (!order.vendor._id.equals(req.vendor._id)) throw forbidden('This order belongs to another shop');
  if (order.porter?.requestId || [ORDER_STATUS.IN_TRANSIT, ORDER_STATUS.DELIVERED].includes(order.status)) {
    throw conflict(`Order is already ${order.status}`);
  }
  await advanceOrderStatus(order, ORDER_STATUS.READY_FOR_PICKUP, 'VENDOR');
  const logistics = await runReadyLogistics(order, order.vendor);
  res.json({ order, logistics });
});

/** POST /api/orders/:id/cancel — customer cancels a not-yet-accepted order. */
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw notFound('Order not found');
  if (!order.customer.equals(req.user._id)) throw notFound('Order not found');
  await transitionOr409(order, ORDER_STATUS.CANCELLED, 'CUSTOMER', { reason: req.body.reason });
  res.json({ order });
});

/** GET /api/orders/:id/invoice — the bill, readable by the order's owner. */
export const getOrderInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw notFound('Order not found');
  assertOwnership(order, req);
  const invoice = await Invoice.findOne({ order: order._id });
  if (!invoice) throw notFound('Invoice not found');
  res.json(invoice);
});

/** Translate a state-machine rejection into a clean 409. */
const transitionOr409 = async (order, status, actor, opts) => {
  try {
    await advanceOrderStatus(order, status, actor, opts);
  } catch (err) {
    if (['ILLEGAL_TRANSITION', 'NO_OP_TRANSITION', 'INVALID_STATUS'].includes(err.code)) {
      throw conflict(err.message);
    }
    throw err;
  }
};

export default {
  createOrder,
  getOrderById,
  listMyOrders,
  listVendorOrders,
  updateOrderStatus,
  markOrderReady,
  cancelOrder,
  getOrderInvoice,
};
