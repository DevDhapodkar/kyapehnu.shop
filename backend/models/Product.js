import mongoose from 'mongoose';

const sizeSchema = new mongoose.Schema(
  {
    size: { type: String, required: true }, // S, M, L, XL, 32, 34...
    stock: { type: Number, required: true, default: 0, min: 0 },
  },
  { _id: false }
);

/**
 * Product money model (all paise, integers):
 *   basePricePaise   — the vendor's price (what the vendor is paid per unit).
 *   marginPaise      — Kya Pehnu's margin, SET BY AN ADMIN at approval time.
 *   sellingPricePaise— basePrice + margin, what the customer pays. Persisted
 *                      (denormalised) so storefront reads are index-friendly and
 *                      an order snapshots a stable number; recomputed whenever
 *                      base or margin changes.
 *
 * Approval workflow:
 *   DRAFT → PENDING_APPROVAL (vendor submits) → APPROVED | REJECTED (admin).
 *   Only APPROVED products are visible to customers and orderable. This closes
 *   the "vendor publishes straight to storefront" moderation gap.
 */
const productSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    category: {
      type: String,
      enum: ['MEN', 'WOMEN', 'KIDS', 'UNISEX'],
      required: true,
    },
    subCategory: { type: String }, // Shirts, Dresses, Trousers...

    basePricePaise: { type: Number, required: true, min: 0 },
    marginPaise: { type: Number, default: 0, min: 0 },
    sellingPricePaise: { type: Number, default: 0, min: 0 },

    sizes: [sizeSchema],
    colors: [{ type: String }],
    images: [{ type: String }],

    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'],
      default: 'PENDING_APPROVAL',
    },
    moderation: {
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
      reviewedAt: { type: Date },
      rejectionReason: { type: String },
    },
    // Vendor's in-stock/out-of-stock toggle, independent of admin approval.
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Keep the denormalised selling price correct on every write. Synchronous hook
// (no `next` — Mongoose 9 proceeds when a param-less pre hook returns).
productSchema.pre('save', function syncSellingPrice() {
  this.sellingPricePaise = (this.basePricePaise || 0) + (this.marginPaise || 0);
});

/** True when a customer is allowed to see and buy this product. */
productSchema.methods.isPurchasable = function isPurchasable() {
  return this.status === 'APPROVED' && this.isAvailable;
};

// Storefront query path: approved + available, by vendor.
productSchema.index({ vendor: 1, status: 1, isAvailable: 1 });
// Admin moderation queue: pending first, newest first.
productSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Product', productSchema);
