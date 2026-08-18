import mongoose from 'mongoose';

/**
 * Immutable billing document generated for every order. Snapshots the seller
 * (vendor) and buyer (customer) details and the full line-item + tax breakdown
 * at the moment of issue, so a later edit to a product or profile never mutates
 * a historical bill. Rendered as an HTML invoice in the admin portal and
 * returned as JSON to the customer app.
 */
const invoiceLineSchema = new mongoose.Schema(
  {
    name: String,
    size: String,
    quantity: Number,
    unitSellingPricePaise: Number,
    lineTotalPaise: Number,
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true }, // KP-INV-2026-000001
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },

    issuedAt: { type: Date, default: Date.now },

    seller: {
      vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
      shopName: String,
      address: String,
      gstin: String,
    },
    buyer: {
      customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: String,
      deliveryAddress: String,
    },

    lines: [invoiceLineSchema],

    itemsSubtotalPaise: { type: Number, required: true },
    deliveryFeePaise: { type: Number, default: 0 },
    taxPaise: { type: Number, default: 0 },
    platformFeePaise: { type: Number, required: true },
    grandTotalPaise: { type: Number, required: true },

    paymentMethod: { type: String, default: 'COD' },
    currency: { type: String, default: 'INR' },
  },
  { timestamps: true }
);

export default mongoose.model('Invoice', invoiceSchema);
