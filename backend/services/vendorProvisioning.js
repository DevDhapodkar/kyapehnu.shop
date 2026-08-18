import { firestore } from '../config/firebase.js';
import Vendor from '../models/Vendor.js';

/**
 * Vendor provisioning — the one place an account becomes (or stops being) a
 * vendor. Shared by the admin approve/reject endpoints and the CLI script so
 * the "promote" operation is defined exactly once.
 *
 * A vendor is two linked records:
 *   1. Firestore users/{uid}.role — what the app reads to mount the order desk.
 *      Written with the Admin SDK, which bypasses the Security Rules that stop
 *      a client promoting itself.
 *   2. MongoDB Vendor document — the shop profile the vendor endpoints resolve.
 *
 * Callers must already hold an open Mongoose connection (the running server, or
 * the CLI after connectDB()).
 */

export const ROLES = { CUSTOMER: 'CUSTOMER', VENDOR: 'VENDOR' };

// Fallback shop coordinates (Nagpur city centre) so approval never fails on a
// missing point; the admin can refine them before or after approving.
const NAGPUR_CENTRE = [79.0882, 21.1458];

/** Set the account's role in Firestore. Idempotent. */
export const setUserRole = (uid, email, role) =>
  firestore.collection('users').doc(uid).set({ uid, email, role }, { merge: true });

/**
 * Upsert the MongoDB Vendor document from an application/profile payload.
 * Normalises the geo point so the Vendor schema's required coordinates are
 * always present.
 */
export const upsertVendorProfile = (uid, email, profile = {}) => {
  const coordinates =
    profile.location?.coordinates?.length === 2
      ? profile.location.coordinates
      : NAGPUR_CENTRE;

  return Vendor.findOneAndUpdate(
    { firebaseUid: uid },
    {
      firebaseUid: uid,
      email,
      shopName: profile.shopName,
      ownerName: profile.ownerName,
      phone: profile.phone,
      whatsappNumber: profile.whatsappNumber || profile.phone,
      address: profile.address,
      location: { type: 'Point', coordinates },
      operatingHours: profile.operatingHours,
      isActive: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

/**
 * Promote an account to VENDOR: flip the Firestore role and create/refresh the
 * shop document. Returns the Vendor document.
 */
export const approveVendor = async ({ uid, email, profile }) => {
  await setUserRole(uid, email, ROLES.VENDOR);
  return upsertVendorProfile(uid, email, profile);
};

/**
 * Revoke vendor status: drop the role back to CUSTOMER and deactivate the shop
 * document if one exists (kept, not deleted, so history survives).
 */
export const revokeVendor = async ({ uid, email }) => {
  await setUserRole(uid, email, ROLES.CUSTOMER);
  await Vendor.findOneAndUpdate({ firebaseUid: uid }, { isActive: false });
};

export default { setUserRole, upsertVendorProfile, approveVendor, revokeVendor, ROLES };
