import Order, { ORDER_STATUSES } from '../models/Order.js';
import Vendor from '../models/Vendor.js';
import { notifyVendorNewOrder, notifyVendorOrderReady } from './whatsappController.js';
import { requestDriver } from './porterController.js';

const createOrder = async (req, res) => {
  try {
    const { vendor: vendorId, items, totalPrice, deliveryAddress } = req.body;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    const order = await Order.create({
      customer: req.user._id,
      vendor: vendorId,
      items,
      totalPrice,
      deliveryAddress,
      status: 'PENDING',
    });

    notifyVendorNewOrder(vendor, order).catch((err) =>
      console.error(`WhatsApp notify failed for order ${order._id}:`, err.message)
    );

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name phone')
      .populate('vendor', 'shopName whatsappNumber location address');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch order', error: error.message });
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

/**
 * The two logistics side effects of an order going "ready", fired in parallel
 * because neither depends on the other and the vendor is standing at the
 * counter waiting for the response:
 *
 *   a) Porter — dispatch a driver to the vendor's Nagpur store coordinates.
 *   b) WhatsApp Cloud API — confirmation template to the vendor's phone.
 *
 * `allSettled` (not `all`) so a WhatsApp outage never costs us the driver, and
 * a Porter rejection never costs us the confirmation. The caller decides what
 * to persist from the outcome.
 */
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
 * Shared transition used by both `POST /:orderId/ready` and a
 * `PATCH /:orderId/status` carrying READY_FOR_PICKUP, so the two entry points
 * can never drift on which side effects fire.
 *
 * The order is saved as READY_FOR_PICKUP *before* the network calls, so a
 * crash mid-dispatch leaves a retryable state rather than a lost order. It only
 * advances to IN_TRANSIT once Porter actually accepted the request.
 */
const transitionToReady = async (order, vendor) => {
  order.status = 'READY_FOR_PICKUP';
  await order.save();

  const [porterResult, whatsappResult] = await runReadyLogistics(order, vendor);

  if (porterResult.status === 'fulfilled') {
    order.porter.requestId = porterResult.value?.order_id;
    order.porter.trackingUrl = porterResult.value?.tracking_url;
    order.status = 'IN_TRANSIT';
    await order.save();
  }

  return {
    porter: settledSummary(porterResult, `Porter dispatch for order ${order._id}`),
    whatsapp: settledSummary(whatsappResult, `WhatsApp ready confirmation for order ${order._id}`),
  };
};

/**
 * POST /api/orders/:orderId/ready — the vendor flow's "Mark Ready for Pickup".
 */
const markOrderReady = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('vendor');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!order.vendor._id.equals(req.vendor._id)) {
      return res.status(403).json({ message: 'This order belongs to another vendor' });
    }

    // READY_FOR_PICKUP is deliberately *not* a terminal guard: it's also the
    // state an order lands in when Porter rejected the dispatch, and the vendor
    // needs to be able to hit the button again. Only a request Porter actually
    // accepted blocks a retry.
    if (['IN_TRANSIT', 'DELIVERED'].includes(order.status) || order.porter?.requestId) {
      return res
        .status(409)
        .json({ message: `Order is already ${order.status}`, order });
    }

    const logistics = await transitionToReady(order, order.vendor);

    res.json({ order, logistics });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark order ready', error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of ${ORDER_STATUSES.join(', ')}` });
    }

    const order = await Order.findById(req.params.id).populate('vendor');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!order.vendor._id.equals(req.vendor._id)) {
      return res.status(403).json({ message: 'This order belongs to another vendor' });
    }

    // READY_FOR_PICKUP is not a plain field write — it dispatches Porter and
    // WhatsApp — so it goes through the same transition the /ready route uses.
    if (status === 'READY_FOR_PICKUP') {
      const logistics = await transitionToReady(order, order.vendor);
      return res.json({ order, logistics });
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
};

export { createOrder, getOrderById, listVendorOrders, markOrderReady, updateOrderStatus };
