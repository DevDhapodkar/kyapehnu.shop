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

    // Pricing. `price` is the selling price (required); `mrp` is the printed
    // Max Retail Price (mandatory in India), rendered as a strike-through.
    price: { type: Number, required: true },
    mrp: { type: Number },
    discountPrice: { type: Number }, // legacy — prefer mrp/price

    sizes: [sizeSchema],
    colors: [{ type: String }],
    images: [{ type: String }],
    isAvailable: { type: Boolean, default: true },

    // Retail attributes modelled on Amazon/Flipkart apparel listings + India
    // Legal Metrology mandatory declarations (net quantity, country of origin).
    brand: { type: String },
    material: { type: String }, // fabric composition, e.g. "100% Cotton"
    pattern: { type: String }, // Solid, Printed, Checked, Striped...
    fit: { type: String }, // Regular, Slim, Relaxed, Oversized
    sleeve: { type: String }, // Full, Half, Sleeveless (tops)
    neck: { type: String }, // Round, Collar, V-neck (tops)
    occasion: { type: String }, // Casual, Formal, Party, Ethnic
    careInstructions: { type: String }, // "Machine wash cold"
    netQuantity: { type: Number, default: 1 }, // units per pack (Legal Metrology)
    countryOfOrigin: { type: String, default: 'India' },
    weightGrams: { type: Number }, // shipping weight
    returnPolicy: { type: String, default: '7-day return' },
    highlights: [{ type: String }], // bullet points

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
