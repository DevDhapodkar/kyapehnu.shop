import mongoose from 'mongoose';
import { ORDER_STATUSES, ORDER_STATUS } from '../services/orderStateMachine.js';

/**
 * Order line item — a SNAPSHOT taken at checkout. We copy the name, size, and
 * the server-resolved prices (base/margin/selling, all paise) so the order is
 * an immutable record even if the vendor later edits the product or an admin
 * changes the margin. `product` still references the source doc for lookups.
 */
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    basePricePaise: { type: Number, required: true, min: 0 },
    marginPaise: { type: Number, required: true, min: 0 },
    unitSellingPricePaise: { type: Number, required: true, min: 0 },
    lineTotalPaise: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Human-facing order number, e.g. "KP-2026-000042".
    orderNumber: { type: String, unique: true, index: true },

    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    items: { type: [orderItemSchema], required: true },

    // Full money breakdown (paise). `totalPrice` is retained as a convenience
    // mirror of grandTotalPaise-in-rupees for any legacy reader, but the paise
    // fields are authoritative.
    pricing: {
      itemsSubtotalPaise: { type: Number, required: true, min: 0 },
      deliveryFeePaise: { type: Number, default: 0, min: 0 },
      taxPaise: { type: Number, default: 0, min: 0 },
      platformFeePaise: { type: Number, required: true, min: 0 },
      grandTotalPaise: { type: Number, required: true, min: 0 },
      vendorPayoutPaise: { type: Number, required: true, min: 0 },
      marginTotalPaise: { type: Number, required: true, min: 0 },
      platformEarningsPaise: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'INR' },
    },

    payment: {
      method: { type: String, enum: ['COD', 'ONLINE'], default: 'COD' },
      status: {
        type: String,
        enum: ['PENDING', 'COLLECTED', 'REFUNDED', 'FAILED'],
        default: 'PENDING',
      },
      collectedAt: { type: Date },
    },

    deliveryAddress: {
      label: { type: String, default: 'Home' },
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, default: 'Nagpur' },
      pincode: { type: String, required: true },
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true },
      },
    },

    status: { type: String, enum: ORDER_STATUSES, default: ORDER_STATUS.PENDING, index: true },

    // Audit trail of every state change (who, when, from→to).
    statusHistory: [
      {
        from: String,
        to: String,
        actor: String, // CUSTOMER | VENDOR | ADMIN | SYSTEM
        at: { type: Date, default: Date.now },
        note: String,
        _id: false,
      },
    ],

    cancellation: {
      reason: { type: String },
      by: { type: String }, // CUSTOMER | VENDOR | ADMIN
      at: { type: Date },
    },

    porter: {
      requestId: { type: String },
      driverName: { type: String },
      driverPhone: { type: String },
      trackingUrl: { type: String },
    },

    // Idempotency: a client-generated key deduplicates double-tapped checkouts
    // and network retries. Unique+sparse so legacy rows without one are allowed.
    idempotencyKey: { type: String },

    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  },
  { timestamps: true }
);

// A double-submitted checkout resolves to the same order instead of two.
orderSchema.index({ customer: 1, idempotencyKey: 1 }, { unique: true, sparse: true });
// Vendor dashboard feed: their orders, filtered by status, newest first.
orderSchema.index({ vendor: 1, status: 1, createdAt: -1 });
// Customer order history.
orderSchema.index({ customer: 1, createdAt: -1 });

export const ORDER_STATUSES_LIST = ORDER_STATUSES;
export default mongoose.model('Order', orderSchema);
