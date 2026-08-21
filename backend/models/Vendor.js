import mongoose from 'mongoose';

const operatingHoursSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      required: true,
    },
    open: { type: String, required: true }, // "10:00"
    close: { type: String, required: true }, // "21:00"
    closed: { type: Boolean, default: false },
  },
  { _id: false }
);

const vendorSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true },
    shopName: { type: String, required: true },
    ownerName: { type: String, required: true },
    phone: { type: String, required: true },
    whatsappNumber: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    address: {
      line1: { type: String, required: true },
      area: { type: String, required: true }, // e.g. Sitabuldi, Dharampeth
      city: { type: String, default: 'Nagpur' },
      pincode: { type: String, required: true },
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    operatingHours: [operatingHoursSchema],
    isActive: { type: Boolean, default: true },
    // A vendor registers as PENDING and is surfaced to customers only after an
    // admin approves. They may still build their catalog while pending.
    approvalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

vendorSchema.index({ location: '2dsphere' });

export default mongoose.model('Vendor', vendorSchema);
