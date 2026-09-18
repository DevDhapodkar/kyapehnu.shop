import mongoose from 'mongoose';

import { ORDER_STATUSES as STATUS_VALUES, ORDER_STATUS } from '../utils/orderStatus.js';

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const historySchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUS_VALUES, required: true },
    at: { type: Date, default: Date.now },
    note: { type: String },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // App orders carry a `customer` (Firebase account); web guest COD orders
    // carry `guestContact` instead. One of the two is always present.
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    guestContact: {
      name: { type: String },
      phone: { type: String },
    },
    channel: { type: String, enum: ['APP', 'WEB'], default: 'APP' },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    items: [cartItemSchema],
    totalPrice: { type: Number, required: true },
    subtotal: { type: Number },
    deliveryFee: { type: Number, default: 0 },
    deliveryInstructions: { type: String },
    addressType: { type: String, default: 'Home' },
    deliveryAddress: {
      // 'Home' | 'Work' | 'Other' — the tag the buyer picked on the map screen.
      label: { type: String, default: 'Home' },
      addressType: { type: String, default: 'Home' },
      line1: { type: String, required: true },
      // Landmark / area — optional, but the difference between a rider finding
      // the door and calling from the gate.
      line2: { type: String },
      locality: { type: String },
      city: { type: String, default: 'Nagpur' },
      pincode: { type: String, required: true },
      // Who the rider hands the order to (defaults to the account holder).
      receiverName: { type: String },
      receiverPhone: { type: String },
      deliveryInstructions: { type: String },
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true },
      },
    },
    status: {
      type: String,
      enum: STATUS_VALUES,
      default: ORDER_STATUS.PENDING,
    },
    // Immutable timeline the customer's "My Orders" screen renders.
    statusHistory: [historySchema],

    // Cash on delivery is the only method for now.
    paymentMethod: { type: String, enum: ['COD'], default: 'COD' },
    paymentStatus: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' },

    cancellation: {
      by: { type: String, enum: ['CUSTOMER', 'VENDOR'] },
      reason: { type: String },
      at: { type: Date },
    },

    porter: {
      requestId: { type: String },
      driverName: { type: String },
      driverPhone: { type: String },
      trackingUrl: { type: String },
    },
  },
  { timestamps: true }
);

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ vendor: 1, createdAt: -1 });
// Vendor dashboard filters orders by status ($in) newest-first; keep the plain
// vendor+createdAt above for the unfiltered "all orders" view.
orderSchema.index({ vendor: 1, status: 1, createdAt: -1 });
// Admin order console filters by status newest-first.
orderSchema.index({ status: 1, createdAt: -1 });

export const ORDER_STATUSES = STATUS_VALUES;
export default mongoose.model('Order', orderSchema);
