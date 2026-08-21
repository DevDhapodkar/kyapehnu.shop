import mongoose from 'mongoose';

import {
  PRODUCT_STATUSES,
  PRODUCT_SOURCES,
  PRODUCT_STATUS,
  PRODUCT_SOURCE,
} from '../utils/productStatus.js';

const sizeSchema = new mongoose.Schema(
  {
    size: { type: String, required: true }, // S, M, L, XL, 32, 34...
    stock: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    name: { type: String, required: true },
    description: { type: String },
    category: {
      type: String,
      enum: ['MEN', 'WOMEN', 'KIDS', 'UNISEX'],
      required: true,
    },
    subCategory: { type: String }, // Shirts, Dresses, Trousers...
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    sizes: [sizeSchema],
    colors: [{ type: String }],
    images: [{ type: String }],
    isAvailable: { type: Boolean, default: true },

    // Catalog moderation lifecycle — only APPROVED products reach customers.
    status: {
      type: String,
      enum: PRODUCT_STATUSES,
      default: PRODUCT_STATUS.PENDING_QC,
    },
    source: {
      type: String,
      enum: PRODUCT_SOURCES,
      default: PRODUCT_SOURCE.APP,
    },
    sku: { type: String }, // assigned on approval, e.g. WM-4821
    qc: {
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
      reviewedAt: { type: Date },
      reason: { type: String },
    },
    measurements: {
      chest: { type: Number },
      length: { type: Number },
      shoulder: { type: Number },
    },
    occasionTags: [{ type: String }],
  },
  { timestamps: true }
);

productSchema.index({ vendor: 1 });
// Storefront reads filter on status + availability; index the hot path.
productSchema.index({ status: 1, isAvailable: 1 });

export default mongoose.model('Product', productSchema);
