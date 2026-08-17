/**
 * Role resolution — the one rule that decides which flow a session lands in.
 *
 * Pure and RN-free so it can be unit-tested and shared. The source of truth is
 * the Firestore profile document behind the signed-in Firebase uid: a profile
 * whose `role` is VENDOR gets the order desk, everything else is a customer.
 * Keeping this in one function means the navigator, the store, and the profile
 * screen can never disagree about what "is a vendor" means.
 */

export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  VENDOR: 'VENDOR',
};

/**
 * Map a profile document to a role. Defensive on purpose: a missing profile, a
 * missing field, or an unknown value all resolve to CUSTOMER, so a partially
 * written document can never accidentally expose the vendor desk.
 */
export const resolveRole = (profile) => {
  const role = profile?.role;
  return role === ROLES.VENDOR ? ROLES.VENDOR : ROLES.CUSTOMER;
};

/**
 * Shape a Firebase user + Firestore profile into the compact `user` object the
 * store and UI read. Firestore is authoritative for name/phone (the user typed
 * them at sign-up); the Firebase Auth record fills gaps for accounts created
 * before a profile document existed.
 */
export const normalizeProfile = (firebaseUser, profile) => ({
  uid: firebaseUser?.uid ?? profile?.uid ?? null,
  email: firebaseUser?.email ?? profile?.email ?? null,
  displayName: profile?.name ?? firebaseUser?.displayName ?? null,
  phone: profile?.phone ?? firebaseUser?.phoneNumber ?? null,
  role: resolveRole(profile),
});

export default resolveRole;
