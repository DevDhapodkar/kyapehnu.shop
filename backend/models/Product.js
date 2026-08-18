import mongoose from 'mongoose';

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
      // Department — the top level of the shopping taxonomy the customer app
      // filters on. WATCHES/ACCESSORIES were added alongside the shopping
      // experience so every storefront department is representable.
      type: String,
      enum: ['MEN', 'WOMEN', 'KIDS', 'UNISEX', 'WATCHES', 'ACCESSORIES'],
      required: true,
    },
    subCategory: { type: String }, // Shirts, Dresses, Trousers...
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    sizes: [sizeSchema],
    colors: [{ type: String }],
    images: [{ type: String }],
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ vendor: 1 });

export default mongoose.model('Product', productSchema);
