import mongoose from 'mongoose';

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

const ORDER_STATUS = ['PENDING', 'ACCEPTED', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED'];

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    items: [cartItemSchema],
    totalPrice: { type: Number, required: true },
    deliveryAddress: {
      line1: { type: String, required: true },
      city: { type: String, default: 'Nagpur' },
      pincode: { type: String, required: true },
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true },
      },
    },
    status: {
      type: String,
      enum: ORDER_STATUS,
      default: 'PENDING',
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

export const ORDER_STATUSES = ORDER_STATUS;
export default mongoose.model('Order', orderSchema);
