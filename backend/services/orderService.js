import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Vendor from '../models/Vendor.js';
import { nextSequence } from '../models/Counter.js';
import { getSettings } from '../models/PlatformSetting.js';
import { computeOrderPricing } from './pricing.js';
import { generateInvoiceForOrder } from './invoiceService.js';
import {
  assertTransition,
  shouldRestock,
  ORDER_STATUS,
} from './orderStateMachine.js';
import { runInTransaction } from '../lib/transaction.js';
import { badRequest, conflict, notFound, forbidden } from '../lib/errors.js';
import { log } from '../lib/logger.js';

/** KP-2026-000042 */
const buildOrderNumber = (seq, year) => `KP-${year}-${String(seq).padStart(6, '0')}`;

/**
 * Resolve each requested cart line against the APPROVED product in the DB and
 * build the trusted, server-priced line items. Rejects anything a client should
 * not be able to order: unknown product, wrong vendor, unapproved/unavailable
 * product, unknown size, or insufficient stock. Client-sent prices are ignored
 * entirely — this is the fix for the "₹1 order" trust bug.
 */
const resolveLines = async (items, vendorId, session) => {
  const productIds = [...new Set(items.map((i) => i.product))];
  const products = await Product.find({ _id: { $in: productIds } }).session(session || null);
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  return items.map((item) => {
    const product = byId.get(String(item.product));
    if (!product) throw notFound(`Product ${item.product} not found`);
    if (product.vendor.toString() !== String(vendorId)) {
      throw badRequest(`Product ${product.name} does not belong to the selected shop`);
    }
    if (!product.isPurchasable()) {
      throw conflict(`Product ${product.name} is not available for purchase`);
    }
    const size = product.sizes.find((s) => s.size === item.size);
    if (!size) throw badRequest(`Size ${item.size} not available for ${product.name}`);
    if (size.stock < item.quantity) {
      throw conflict(`Only ${size.stock} left of ${product.name} (${item.size})`);
    }
    return {
      product: product._id,
      name: product.name,
      size: item.size,
      quantity: item.quantity,
      basePricePaise: product.basePricePaise,
      marginPaise: product.marginPaise,
    };
  });
};

/**
 * Atomically decrement stock for each line, guarding against oversell. Returns
 * false if any decrement fails (another buyer took the last unit between the
 * read and the write), so the caller can abort the whole transaction.
 */
const decrementStock = async (lines, session) => {
  for (const line of lines) {
    const res = await Product.updateOne(
      { _id: line.product, 'sizes.size': line.size, 'sizes.stock': { $gte: line.quantity } },
      { $inc: { 'sizes.$.stock': -line.quantity } },
      session ? { session } : {}
    );
    if (res.modifiedCount !== 1) {
      throw conflict(`Stock changed for ${line.name} (${line.size}); please retry`);
    }
  }
};

/**
 * Create a Cash-on-Delivery order. Single-vendor by construction — the client
 * splits a multi-shop cart and calls this once per vendor.
 *
 * @param {object} customer  the authenticated User doc
 * @param {object} payload   { vendorId, items:[{product,size,quantity}],
 *                             deliveryAddress, idempotencyKey?, paymentMethod? }
 */
export const createOrder = async (customer, payload) => {
  const { vendorId, items, deliveryAddress, idempotencyKey } = payload;

  if (!Array.isArray(items) || items.length === 0) {
    throw badRequest('Order must contain at least one item');
  }

  // Idempotency: a retried/double-tapped checkout returns the original order.
  if (idempotencyKey) {
    const existing = await Order.findOne({ customer: customer._id, idempotencyKey });
    if (existing) return existing;
  }

  const settings = await getSettings();

  if (payload.paymentMethod && payload.paymentMethod !== 'COD') {
    if (!settings.onlinePaymentsEnabled) {
      throw badRequest('Online payments are not available yet. Please choose Cash on Delivery.');
    }
  }
  if (!settings.codEnabled) {
    throw badRequest('Ordering is temporarily unavailable.');
  }

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) throw notFound('Shop not found');
  if (vendor.status !== 'APPROVED') throw forbidden('This shop is not currently accepting orders');

  const resolved = await resolveLines(items, vendorId, null);

  const pricing = computeOrderPricing(resolved, {
    platformFeePaise: settings.platformFeePaise,
    deliveryFeePaise: settings.deliveryFeePaise,
    taxBps: settings.taxBps,
  });

  if (pricing.grandTotalPaise > settings.codMaxOrderPaise) {
    throw badRequest(
      `Order total exceeds the Cash-on-Delivery limit. Please reduce your cart.`
    );
  }

  const orderItems = pricing.lines.map((l) => ({
    product: l.product,
    name: l.name,
    size: l.size,
    quantity: l.quantity,
    basePricePaise: l.basePricePaise,
    marginPaise: l.marginPaise,
    unitSellingPricePaise: l.unitSellingPricePaise,
    lineTotalPaise: l.lineTotalPaise,
  }));

  try {
    const order = await runInTransaction(async (session) => {
      await decrementStock(resolved, session);

      const year = new Date().getFullYear();
      const seq = await nextSequence(`order-${year}`, session);

      const [created] = await Order.create(
        [
          {
            orderNumber: buildOrderNumber(seq, year),
            customer: customer._id,
            vendor: vendor._id,
            items: orderItems,
            pricing: {
              itemsSubtotalPaise: pricing.itemsSubtotalPaise,
              deliveryFeePaise: pricing.deliveryFeePaise,
              taxPaise: pricing.taxPaise,
              platformFeePaise: pricing.platformFeePaise,
              grandTotalPaise: pricing.grandTotalPaise,
              vendorPayoutPaise: pricing.vendorPayoutPaise,
              marginTotalPaise: pricing.marginTotalPaise,
              platformEarningsPaise: pricing.platformEarningsPaise,
              currency: pricing.currency,
            },
            payment: { method: 'COD', status: 'PENDING' },
            deliveryAddress,
            status: ORDER_STATUS.PENDING,
            statusHistory: [{ from: null, to: ORDER_STATUS.PENDING, actor: 'CUSTOMER' }],
            idempotencyKey: idempotencyKey || undefined,
          },
        ],
        session ? { session } : {}
      );

      const invoice = await generateInvoiceForOrder(
        { order: created, vendor, customer },
        session
      );
      created.invoice = invoice._id;
      await created.save(session ? { session } : {});

      return created;
    });

    log.info('Order created', {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      vendor: vendor._id.toString(),
      grandTotalPaise: order.pricing.grandTotalPaise,
    });
    return order;
  } catch (err) {
    // Unique index on (customer, idempotencyKey) → someone raced us; return theirs.
    if (err.code === 11000 && idempotencyKey) {
      const existing = await Order.findOne({ customer: customer._id, idempotencyKey });
      if (existing) return existing;
    }
    throw err;
  }
};

/**
 * Drive an order through the state machine. Validates the transition for the
 * given actor, restocks on cancel/reject, and stamps COD payment collected on
 * delivery. Returns the updated order.
 */
export const advanceOrderStatus = async (order, toStatus, actor, opts = {}) => {
  assertTransition(order.status, toStatus, actor);

  const from = order.status;

  await runInTransaction(async (session) => {
    if (shouldRestock(toStatus)) {
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.product, 'sizes.size': item.size },
          { $inc: { 'sizes.$.stock': item.quantity } },
          session ? { session } : {}
        );
      }
      order.cancellation = { reason: opts.reason, by: actor, at: new Date() };
    }

    if (toStatus === ORDER_STATUS.DELIVERED && order.payment.method === 'COD') {
      order.payment.status = 'COLLECTED';
      order.payment.collectedAt = new Date();
    }

    order.status = toStatus;
    order.statusHistory.push({ from, to: toStatus, actor, note: opts.note });
    await order.save(session ? { session } : {});
  });

  log.info('Order status changed', {
    orderId: order._id.toString(),
    from,
    to: toStatus,
    actor,
  });
  return order;
};

export default { createOrder, advanceOrderStatus };
