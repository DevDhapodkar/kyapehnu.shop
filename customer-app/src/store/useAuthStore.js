import { create } from 'zustand';

import { setAuthToken } from '../api/vendorApi';
import { syncUserProfile, fetchUserProfile } from '../api/vendorApi';
import {
  signInEmail,
  registerEmail,
  signOutFirebase,
  subscribeIdToken,
  isFirebaseConfigured,
} from '../services/auth';

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
 * no screen ever passes one to a request by hand. `initAuth` wires a Firebase
 * `onIdTokenChanged` listener so a refreshed token (they expire hourly) reaches
 * the client without a re-login.
 */

export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  VENDOR: 'VENDOR',
};

export const useAuthStore = create((set, get) => ({
  /** 'CUSTOMER' | 'VENDOR' — the navigator's only input. */
  role: ROLES.CUSTOMER,

  /** Firebase user, once signed in. Null while signed out. */
  user: null,

  /** Firebase ID token sent as `Authorization: Bearer …`. */
  token: null,

  /** Customer profile from `GET /api/users/me`. */
  profile: null,

  /** Vendor profile from `GET /api/vendors/me`, populated on entering VENDOR. */
  vendorProfile: null,

  /** False until the first Firebase auth-state callback resolves. */
  authReady: !isFirebaseConfigured,

  /** True when Firebase keys are present (auth screens are usable). */
  authAvailable: isFirebaseConfigured,

  isAuthenticated: () => Boolean(get().token),

  /**
   * Start listening to Firebase auth state. Call once from App on mount; the
   * returned unsubscribe is stored so a second call is a no-op.
   */
  initAuth: () => {
    if (get()._unsubscribe) return get()._unsubscribe;

    const unsubscribe = subscribeIdToken(async (session) => {
      if (!session) {
        setAuthToken(null);
        set({ user: null, token: null, profile: null, authReady: true });
        return;
      }

      const { user, token } = session;
      setAuthToken(token);
      set({ user, token, authReady: true });

      // Load the backend profile so orders/addresses have somewhere to attach.
      // Non-fatal: a brand-new account has no profile until registration syncs.
      try {
        const profile = await fetchUserProfile();
        set({ profile });
      } catch {
        /* no profile yet — created by registerWithEmail */
      }
    });

    set({ _unsubscribe: unsubscribe });
    return unsubscribe;
  },

  /** Email/password sign-in. Throws a Firebase error the screen maps to text. */
  signInWithEmail: async ({ email, password }) => {
    const cred = await signInEmail(email, password);
    // Set the token synchronously off the credential so the next authed call
    // has it, rather than racing the onIdTokenChanged listener.
    const token = await cred.user.getIdToken();
    setAuthToken(token);
    set({ user: cred.user, token });
  },

  /**
   * Create a customer account, then upsert the backend profile so the User
   * document (required for placing orders) exists immediately.
   */
  registerWithEmail: async ({ name, email, phone, password }) => {
    const cred = await registerEmail(email, password, name);
    const token = await cred.user.getIdToken();
    setAuthToken(token);
    set({ user: cred.user, token });

    const profile = await syncUserProfile({ name, email, phone });
    set({ profile });
    return profile;
  },

  /** Legacy explicit sign-in used before Firebase auth landed / for tests. */
  signIn: ({ user, token, role = ROLES.CUSTOMER }) => {
    setAuthToken(token);
    set({ user, token, role });
  },

  signOut: async () => {
    try {
      await signOutFirebase();
    } finally {
      setAuthToken(null);
      set({ user: null, token: null, profile: null, role: ROLES.CUSTOMER, vendorProfile: null });
    }
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
