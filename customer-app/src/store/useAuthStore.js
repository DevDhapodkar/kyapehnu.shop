import { create } from 'zustand';

import { setAuthToken } from '../api/vendorApi';

/**
 * Session + role state for the unified app.
 *
 * One binary now runs both sides of the marketplace, so `role` is the single
 * switch the navigator reads: CUSTOMER gets the storefront, VENDOR gets the
 * order desk. Nothing else in the tree branches on it — screens stay unaware
 * of which flow they were mounted into.
 *
 * The Firebase ID token is mirrored into the axios client on every write via
 * `setAuthToken`, so there is exactly one place a token can enter the app and
 * no screen ever passes one to a request by hand.
 */

export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  VENDOR: 'VENDOR',
};

export const useAuthStore = create((set, get) => ({
  /** 'CUSTOMER' | 'VENDOR' — the navigator's only input. */
  role: ROLES.CUSTOMER,

  /** Firebase user, once Auth is wired. Null while signed out. */
  user: null,

  /** Firebase ID token sent as `Authorization: Bearer …`. */
  token: null,

  /** Vendor profile from `GET /api/vendors/me`, populated on entering VENDOR. */
  vendorProfile: null,

  isAuthenticated: () => Boolean(get().token),

  /**
   * Signs a session in. `role` is decided by the backend profile lookup in the
   * real flow (a Firebase uid that resolves to a Vendor document is a vendor);
   * until Auth lands, callers pass it explicitly.
   */
  signIn: ({ user, token, role = ROLES.CUSTOMER }) => {
    setAuthToken(token);
    set({ user, token, role });
  },

  /**
   * Refresh just the ID token (Firebase auto-refreshes hourly) without touching
   * role/user. Keeps the axios seam in sync on every token rotation.
   */
  setToken: (token) => {
    setAuthToken(token);
    set({ token });
  },

  signOut: () => {
    setAuthToken(null);
    set({ user: null, token: null, role: ROLES.CUSTOMER, vendorProfile: null });
  },

  setRole: (role) => set({ role }),

  /**
   * Testing affordance behind the Profile screen: flips the whole app between
   * the two flows without a real vendor login. Deliberately a store action
   * rather than screen-local state so the navigator remount is driven by the
   * same field a real sign-in would set.
   */
  toggleVendorMode: () =>
    set((state) => ({
      role: state.role === ROLES.VENDOR ? ROLES.CUSTOMER : ROLES.VENDOR,
    })),

  setVendorProfile: (vendorProfile) => set({ vendorProfile }),
}));

/* Selectors — importable so components subscribe to the narrowest slice. */

export const selectRole = (state) => state.role;

export const selectIsVendor = (state) => state.role === ROLES.VENDOR;

export default useAuthStore;
