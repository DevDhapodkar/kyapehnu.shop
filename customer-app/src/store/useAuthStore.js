import { create } from 'zustand';

import {
  setAuthToken,
  syncUserProfile,
  fetchUserProfile,
  fetchVendorProfile,
  registerUserPushToken,
} from '../api/vendorApi';
import { registerForPush } from '../services/notifications';
import {
  signInEmail,
  registerEmail,
  signInGoogle,
  resetPassword,
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

  /**
   * Registration details that were captured but not yet persisted to the
   * backend (the Firebase account was created, but the profile upsert hasn't
   * succeeded — e.g. the server was cold-starting). The auth listener retries
   * this on every token change until it lands, so a flaky network can never
   * leave a signed-in account without its `User` document.
   */
  pendingProfile: null,

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
        set({ profile, pendingProfile: null });
      } catch {
        // No profile yet. If registration captured the details but its own sync
        // never landed, finish it here so the account is never left half-made.
        const pending = get().pendingProfile;
        if (pending) {
          try {
            const profile = await syncUserProfile(pending);
            set({ profile, pendingProfile: null });
          } catch {
            /* still unreachable — retried on the next token change */
          }
        }
      }

      // Check if this account is a registered vendor
      try {
        const vendor = await fetchVendorProfile();
        if (vendor && (vendor._id || vendor.shopName)) {
          set({ role: ROLES.VENDOR, vendorProfile: vendor });
        }
      } catch {
        // Customer account
      }

      // Register this device for order-status push notifications (best-effort).
      registerForPush()
        .then((pushToken) => pushToken && registerUserPushToken(pushToken).catch(() => {}))
        .catch(() => {});
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

    try {
      const vendor = await fetchVendorProfile();
      if (vendor && (vendor._id || vendor.shopName)) {
        set({ role: ROLES.VENDOR, vendorProfile: vendor });
      } else {
        set({ role: ROLES.CUSTOMER });
      }
    } catch {
      set({ role: ROLES.CUSTOMER });
    }
  },

  /**
   * Create a customer account, then upsert the backend profile so the User
   * document (required for placing orders) exists immediately.
   *
   * Two failure modes are handled so registration never dead-ends:
   *
   *  1. The Firebase account was created on a previous attempt but the profile
   *     sync failed (the reported "it errored but the account exists" bug).
   *     Re-registering then throws `auth/email-already-in-use`. If the password
   *     matches, we adopt that account instead of erroring, and finish the sync.
   *
   *  2. The account is created but the backend is still cold-starting, so the
   *     profile upsert times out. The account and session are already valid, so
   *     we keep the shopper signed in and stash the details in `pendingProfile`;
   *     the auth listener finishes the sync as soon as the server answers.
   *
   * Resolves to `{ profileSynced }` so the screen can proceed either way.
   */
  registerWithEmail: async ({ name, email, phone, password }) => {
    let cred;
    try {
      cred = await registerEmail(email, password, name);
    } catch (error) {
      if (error?.code !== 'auth/email-already-in-use') throw error;
      // The email is taken — most likely by a half-finished earlier attempt.
      // If the password is right, this is the same person finishing sign-up.
      try {
        cred = await signInEmail(email, password);
      } catch {
        throw error; // genuinely someone else's account — surface the original.
      }
    }

    const token = await cred.user.getIdToken();
    setAuthToken(token);
    set({ user: cred.user, token });

    try {
      const profile = await syncUserProfile({ name, email, phone });
      set({ profile, pendingProfile: null });
      return { profileSynced: true, profile };
    } catch {
      // Account + session are live; the profile upsert just hasn't reached the
      // (waking) server yet. Don't fail the sign-up over it — the listener will
      // retry until it lands.
      set({ pendingProfile: { name, email, phone } });
      return { profileSynced: false, profile: null };
    }
  },

  signInWithGoogle: async () => {
    const cred = await signInGoogle();
    const token = await cred.user.getIdToken();
    setAuthToken(token);
    set({ user: cred.user, token });

    try {
      const vendor = await fetchVendorProfile();
      if (vendor && (vendor._id || vendor.shopName)) {
        set({ role: ROLES.VENDOR, vendorProfile: vendor });
      } else {
        set({ role: ROLES.CUSTOMER });
      }
    } catch {
      set({ role: ROLES.CUSTOMER });
    }

    try {
      const profile = await syncUserProfile({
        name: cred.user.displayName || 'Patron',
        email: cred.user.email,
        phone: cred.user.phoneNumber || '',
      });
      set({ profile, pendingProfile: null });
    } catch {
      // Non-fatal
    }
  },

  sendPasswordReset: async (email) => {
    return resetPassword(email);
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
      set({
        user: null,
        token: null,
        profile: null,
        pendingProfile: null,
        role: ROLES.CUSTOMER,
        vendorProfile: null,
      });
    }
  },

  setRole: (role) => {
    // If account is a registered vendor, lock strictly to vendor mode: no shopping allowed.
    if (get().vendorProfile && role === ROLES.CUSTOMER) {
      console.warn('Vendor accounts are restricted to Vendor Mode only. Shopping is not permitted.');
      return;
    }
    set({ role });
  },

  setVendorProfile: (vendorProfile) => {
    if (vendorProfile && (vendorProfile._id || vendorProfile.shopName)) {
      set({ vendorProfile, role: ROLES.VENDOR });
    } else {
      set({ vendorProfile });
    }
  },
}));

/* Selectors — importable so components subscribe to the narrowest slice. */

export const selectRole = (state) => state.role;

export const selectIsVendor = (state) => state.role === ROLES.VENDOR;

export default useAuthStore;
