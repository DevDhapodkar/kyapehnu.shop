import mongoose from 'mongoose';

/**
 * A shop owner's request to sell on Kya Pehnu?.
 *
 * This is the reviewable record that sits between "a customer tapped Apply" and
 * "an admin turned them into a vendor". It holds everything the applicant filled
 * in, the review status, and who/when it was decided. On approval the admin
 * copies (a possibly-edited) snapshot of these fields into the real Vendor
 * document via the provisioning service — this collection is the paper trail,
 * the Vendor collection is the live shop.
 *
 * One application per Firebase account (unique firebaseUid): re-applying edits
 * the same row rather than piling up duplicates.
 */

export const APPLICATION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, required: true },
    area: { type: String, required: true }, // Sitabuldi, Dharampeth, …
    city: { type: String, default: 'Nagpur' },
    pincode: { type: String, required: true },
  },
  { _id: false }
);

const operatingHoursSchema = new mongoose.Schema(
  {
    day: { type: String, enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'], required: true },
    open: { type: String, required: true },
    close: { type: String, required: true },
    closed: { type: Boolean, default: false },
  },
  { _id: false }
);

const vendorApplicationSchema = new mongoose.Schema(
  {
    // Applicant identity (from the verified Firebase token).
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },

    // Shop details — the "relevant questions" the form asks.
    shopName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    whatsappNumber: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['MENSWEAR', 'WOMENSWEAR', 'BOTH', 'KIDS', 'ACCESSORIES', 'OTHER'],
      default: 'BOTH',
    },
    description: { type: String, trim: true, maxlength: 600 },
    yearsInBusiness: { type: Number, min: 0, max: 200 },
    gstin: { type: String, trim: true }, // optional; verified out of band
    address: { type: addressSchema, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: undefined }, // [lng, lat], optional at apply time
    },
    operatingHours: { type: [operatingHoursSchema], default: [] },

    // Review workflow.
    status: {
      type: String,
      enum: Object.values(APPLICATION_STATUS),
      default: APPLICATION_STATUS.PENDING,
      index: true,
    },
    adminNotes: { type: String, trim: true },
    reviewedBy: { type: String }, // admin email
    reviewedAt: { type: Date },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }, // set on approval
  },
  { timestamps: true }
);

export default mongoose.model('VendorApplication', vendorApplicationSchema);
