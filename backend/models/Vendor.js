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

    // Onboarding lifecycle. A newly synced vendor is PENDING_APPROVAL and does
    // NOT appear in customer discovery until an admin approves them. This closes
    // the "any Firebase uid mints a live vendor" gap.
    status: {
      type: String,
      enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING_APPROVAL',
    },
    // KYC captured at onboarding. Bank/GSTIN verification is only *enforced*
    // once payouts go live (post company registration), but the fields exist so
    // the data is collected from day one.
    kyc: {
      gstin: { type: String },
      pan: { type: String },
      bankAccountName: { type: String },
      bankAccountNumber: { type: String },
      bankIfsc: { type: String },
      contractAcceptedAt: { type: Date },
    },
    moderation: {
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
      reviewedAt: { type: Date },
      rejectionReason: { type: String },
    },
    expoPushTokens: [{ type: String }],
    // Derived from status; kept for query compatibility and quick toggles.
    isActive: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Keep isActive in lockstep with the approval status. Synchronous hook (no
// `next` callback — Mongoose 9 runs param-less pre hooks and proceeds on return).
vendorSchema.pre('save', function syncActive() {
  this.isActive = this.status === 'APPROVED';
});

vendorSchema.index({ location: '2dsphere' });
vendorSchema.index({ status: 1 });

export default mongoose.model('Vendor', vendorSchema);
