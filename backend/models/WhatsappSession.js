import mongoose from 'mongoose';

const whatsappSessionSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    state: {
      type: String,
      default: 'IDLE',
      enum: [
        'IDLE',
        'ONBOARD_AWAITING_SHOP_NAME',
        'ONBOARD_AWAITING_OWNER_NAME',
        'ONBOARD_AWAITING_ADDRESS',
        'ONBOARD_AWAITING_CATEGORY',
        'ADD_PRODUCT_AWAITING_IMAGE',
        'ADD_PRODUCT_AWAITING_NAME',
        'ADD_PRODUCT_AWAITING_DEPT',
        'ADD_PRODUCT_AWAITING_SUBCATEGORY',
        'ADD_PRODUCT_AWAITING_COLOR',
        'ADD_PRODUCT_AWAITING_FIT',
        'ADD_PRODUCT_AWAITING_FABRIC',
        'ADD_PRODUCT_AWAITING_OCCASION',
        'ADD_PRODUCT_AWAITING_CARE',
        'ADD_PRODUCT_AWAITING_PRICE',
        'ADD_PRODUCT_AWAITING_MRP',
        'ADD_PRODUCT_AWAITING_SIZES_STOCK',
        'ADD_PRODUCT_AWAITING_DESCRIPTION',
        'ADD_PRODUCT_CONFIRM',
        'STOCK_UPDATE_AWAITING_SKU',
        'STOCK_UPDATE_AWAITING_QTY',
      ],
    },
    draft: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Expire abandoned conversation states after 24 hours of inactivity
whatsappSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 24 * 3600 });

export default mongoose.model('WhatsappSession', whatsappSessionSchema);
