import { z } from 'zod';

/**
 * Central Zod schemas. Every request body/query/params is parsed through one of
 * these before it reaches a controller, so:
 *   - unknown keys are stripped (no mass-assignment of `vendor`, `status`, etc.)
 *   - types and ranges are enforced at the boundary (no NaN geo, no negative qty)
 *   - money enters as rupees and is converted to paise in the controller layer.
 */

export const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Invalid id');

const lng = z.coerce.number().min(-180).max(180);
const lat = z.coerce.number().min(-90).max(90);

const geoPoint = z.object({
  type: z.literal('Point').default('Point'),
  coordinates: z.tuple([lng, lat]),
});

const rupees = z.coerce.number().nonnegative().max(10_000_000);

/* ------------------------------------------------------------------ users -- */

export const syncUserSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(6).max(20),
});

export const addressSchema = z.object({
  label: z.string().trim().max(40).optional(),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().max(80).optional(),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  location: geoPoint,
});

export const updateLocationSchema = z.object({ lng, lat });

export const registerPushTokenSchema = z.object({
  token: z.string().trim().min(1).max(400),
});

/* ---------------------------------------------------------------- vendors -- */

export const syncVendorSchema = z.object({
  shopName: z.string().trim().min(1).max(160),
  ownerName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(6).max(20),
  whatsappNumber: z.string().trim().min(6).max(20),
  email: z.string().trim().email().max(200),
  address: z.object({
    line1: z.string().trim().min(1).max(200),
    area: z.string().trim().min(1).max(120),
    city: z.string().trim().max(80).optional(),
    pincode: z.string().trim().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  }),
  location: geoPoint,
  operatingHours: z
    .array(
      z.object({
        day: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
        open: z.string().trim(),
        close: z.string().trim(),
        closed: z.boolean().optional(),
      })
    )
    .optional(),
  kyc: z
    .object({
      gstin: z.string().trim().max(20).optional(),
      pan: z.string().trim().max(12).optional(),
      bankAccountName: z.string().trim().max(120).optional(),
      bankAccountNumber: z.string().trim().max(30).optional(),
      bankIfsc: z.string().trim().max(15).optional(),
    })
    .optional(),
});

export const nearbyQuerySchema = z.object({
  lng,
  lat,
  maxDistanceMeters: z.coerce.number().int().min(100).max(50000).default(5000),
});

/* --------------------------------------------------------------- products -- */

const sizeInput = z.object({
  size: z.string().trim().min(1).max(12),
  stock: z.coerce.number().int().min(0).max(100000),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional(),
  category: z.enum(['MEN', 'WOMEN', 'KIDS', 'UNISEX']),
  subCategory: z.string().trim().max(80).optional(),
  basePriceRupees: rupees,
  sizes: z.array(sizeInput).min(1),
  colors: z.array(z.string().trim().max(40)).max(30).optional(),
  images: z.array(z.string().trim().url().max(500)).max(10).optional(),
});

// Vendors may edit only these fields — never vendor, status, margin, prices set
// by admin. Selling price is admin-controlled via margin; base price edits
// re-trigger approval (handled in the controller).
export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(2000).optional(),
    subCategory: z.string().trim().max(80).optional(),
    basePriceRupees: rupees.optional(),
    sizes: z.array(sizeInput).min(1).optional(),
    colors: z.array(z.string().trim().max(40)).max(30).optional(),
    images: z.array(z.string().trim().url().max(500)).max(10).optional(),
    isAvailable: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No updatable fields provided' });

/* ----------------------------------------------------------------- orders -- */

export const createOrderSchema = z.object({
  vendorId: objectId,
  idempotencyKey: z.string().trim().min(8).max(100).optional(),
  paymentMethod: z.enum(['COD', 'ONLINE']).default('COD'),
  items: z
    .array(
      z.object({
        product: objectId,
        size: z.string().trim().min(1).max(12),
        quantity: z.coerce.number().int().min(1).max(20),
      })
    )
    .min(1),
  deliveryAddress: z.object({
    label: z.string().trim().max(40).optional(),
    line1: z.string().trim().min(1).max(200),
    line2: z.string().trim().max(200).optional(),
    city: z.string().trim().max(80).optional(),
    pincode: z.string().trim().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
    location: geoPoint,
  }),
});

export const orderIdParams = z.object({ id: objectId });
export const orderIdParamAlt = z.object({ orderId: objectId });
export const vendorIdParams = z.object({ vendorId: objectId });
export const productIdParams = z.object({ id: objectId });

export const listVendorOrdersQuery = z.object({
  status: z.string().trim().optional(),
});

// Vendor-driven transitions only (accept/reject/ready/out-for-delivery/delivered).
export const updateOrderStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED']),
  note: z.string().trim().max(300).optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().trim().min(1).max(300),
});

/* ------------------------------------------------------------------ admin -- */

export const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(200),
});

export const approveProductSchema = z.object({
  marginRupees: rupees,
});

export const rejectSchema = z.object({
  reason: z.string().trim().min(1).max(300),
});

export const updateSettingsSchema = z.object({
  platformFeeRupees: rupees.optional(),
  deliveryFeeRupees: rupees.optional(),
  defaultMarginRupees: rupees.optional(),
  taxBps: z.coerce.number().int().min(0).max(10000).optional(),
  codMaxOrderRupees: rupees.optional(),
});
