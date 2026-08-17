import { create } from 'zustand';

import { setAuthToken, syncUserProfile } from '../api/vendorApi';
import * as authService from '../auth/authService';
import { isFirebaseConfigured } from '../config/firebase';
import { friendlyAuthError } from '../auth/authErrors';
import { normalizeProfile, ROLES, resolveRole } from '../auth/roles';

/**
 * Session + role state for the unified app, now backed by Firebase Auth.
 *
 * One binary runs both sides of the marketplace, so `role` is the single switch
 * the navigator reads: CUSTOMER gets the storefront, VENDOR gets the order desk.
 * The role is not chosen in the app — it is read from the signed-in account's
 * Firestore profile document (`users/{uid}.role`), so a shop owner and a buyer
 * install the same app and the backend data decides where each lands.
 *
 * The Firebase ID token is mirrored into the axios client on every change via
 * `setAuthToken`, so there is exactly one place a token enters the app and no
 * screen ever passes one to a request by hand. `onIdTokenChanged` (wired in
 * `initialize`) keeps that token fresh across the hourly refresh and rehydrates
 * a returning user on cold start from the persisted session.
 */

export { ROLES };

const UNAUTH = {
  user: null,
  token: null,
  role: ROLES.CUSTOMER,
  vendorProfile: null,
};

export const useAuthStore = create((set, get) => ({
  /** 'CUSTOMER' | 'VENDOR' — the navigator's only input. */
  role: ROLES.CUSTOMER,

  /** Normalised { uid, email, displayName, phone, role } or null when signed out. */
  user: null,

  /** Firebase ID token sent as `Authorization: Bearer …`. */
  token: null,

  /** Vendor profile from `GET /api/vendors/me`, populated on entering VENDOR. */
  vendorProfile: null,

  /**
   * 'initializing' until the persisted session is restored (or ruled out), then
   * 'authenticated' | 'unauthenticated'. The navigator holds a splash while
   * this is 'initializing' so a returning user never flashes the login screen.
   */
  status: 'initializing',

  /** Last auth failure, already mapped to a friendly sentence for the UI. */
  authError: null,

  /** True while a sign-in / sign-up request is in flight. */
  busy: false,

  isAuthenticated: () => Boolean(get().token),

  /**
   * Subscribe to Firebase session changes. Called once from the app root.
   * Fires on sign-in, sign-out, and token refresh; each time we pull a fresh
   * token, load the Firestore profile, and derive the role from it. Returns the
   * unsubscribe function so the root can tear the listener down.
   */
  initialize: () => {
    if (get()._initialized) return get()._unsubscribe;

    // No project configured yet: settle into unauthenticated so the UI can show
    // the "add your Firebase keys" state instead of hanging on the splash.
    if (!isFirebaseConfigured()) {
      set({ status: 'unauthenticated', _initialized: true });
      return () => {};
    }

    const unsubscribe = authService.subscribeToSession(async (firebaseUser) => {
      if (!firebaseUser) {
        setAuthToken(null);
        set({ ...UNAUTH, status: 'unauthenticated' });
        return;
      }

      try {
        const token = await firebaseUser.getIdToken();
        setAuthToken(token);

        let profile = await authService.fetchUserProfile(firebaseUser.uid);
        if (!profile) profile = await authService.ensureUserProfile(firebaseUser);

        set({
          user: normalizeProfile(firebaseUser, profile),
          token,
          role: resolveRole(profile),
          status: 'authenticated',
          authError: null,
        });
      } catch {
        // A token that verifies but whose profile cannot be read still means the
        // user is signed in; fall back to CUSTOMER rather than bouncing them out.
        const token = await firebaseUser.getIdToken().catch(() => null);
        setAuthToken(token);
        set({
          user: normalizeProfile(firebaseUser, null),
          token,
          role: ROLES.CUSTOMER,
          status: 'authenticated',
          authError: null,
        });
      }
    });

    set({ _initialized: true, _unsubscribe: unsubscribe });
    return unsubscribe;
  },

  /**
   * Register a new customer account. The Firestore profile is created inside the
   * service; the session listener then drives the state change. We still set
   * `busy`/`authError` here so the form has immediate feedback.
   */
  signUpWithEmail: async ({ name, email, phone, password }) => {
    if (!isFirebaseConfigured()) {
      const message = 'Login is not configured. Add your Firebase keys.';
      set({ authError: message });
      throw new Error(message);
    }

    set({ busy: true, authError: null });
    try {
      const { user, profile } = await authService.signUp({ name, email, phone, password });
      await get()._afterSignIn(user, profile, { name, email, phone });
      return { user, profile };
    } catch (error) {
      set({ authError: friendlyAuthError(error) });
      throw error;
    } finally {
      set({ busy: false });
    }
  },

  /** Sign an existing account in. */
  signInWithEmail: async ({ email, password }) => {
    if (!isFirebaseConfigured()) {
      const message = 'Login is not configured. Add your Firebase keys.';
      set({ authError: message });
      throw new Error(message);
    }

    set({ busy: true, authError: null });
    try {
      const { user, profile } = await authService.signIn({ email, password });
      await get()._afterSignIn(user, profile, {});
      return { user, profile };
    } catch (error) {
      set({ authError: friendlyAuthError(error) });
      throw error;
    } finally {
      set({ busy: false });
    }
  },

  /**
   * Shared tail of sign-in/up: seed the token eagerly (so the state flips
   * without waiting on the listener) and mirror the profile to the Express
   * backend. The backend sync is best-effort — the app is fully usable on
   * Firebase alone if the Node server is not running.
   */
  _afterSignIn: async (firebaseUser, profile, formFields) => {
    const token = await firebaseUser.getIdToken(true);
    setAuthToken(token);

    set({
      user: normalizeProfile(firebaseUser, profile),
      token,
      role: resolveRole(profile),
      status: 'authenticated',
    });

    syncUserProfile({
      name: formFields.name ?? profile?.name ?? firebaseUser.displayName ?? '',
      email: formFields.email ?? firebaseUser.email ?? '',
      phone: formFields.phone ?? profile?.phone ?? '',
    }).catch((error) => {
      // Non-fatal: Firestore already holds the profile. Log for the dev console.
      console.warn('[auth] backend profile sync skipped:', error.message);
    });
  },

  /**
   * Send a password-reset email. Resolves true on success so the screen can
   * show a confirmation; maps failures to a friendly message like the other
   * actions. Does not change session state.
   */
  resetPassword: async (email) => {
    if (!isFirebaseConfigured()) {
      const message = 'Login is not configured. Add your Firebase keys.';
      set({ authError: message });
      throw new Error(message);
    }

    set({ busy: true, authError: null });
    try {
      await authService.sendPasswordReset(email);
      return true;
    } catch (error) {
      set({ authError: friendlyAuthError(error) });
      throw error;
    } finally {
      set({ busy: false });
    }
  },

  signOut: async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.warn('[auth] sign-out error:', error.message);
    } finally {
      // The listener also clears, but do it here too so sign-out is instant even
      // if the listener is slow or Firebase is unconfigured.
      setAuthToken(null);
      set({ ...UNAUTH, status: 'unauthenticated', authError: null });
    }
  },

  clearAuthError: () => set({ authError: null }),

  setRole: (role) => set({ role }),

  /**
   * Testing affordance behind the Profile screen: flips the app between the two
   * flows without a second, real vendor account. A local override only — the
   * authoritative role still comes from the Firestore profile on next launch.
   */
  toggleVendorMode: () =>
    set((state) => ({
      role: state.role === ROLES.VENDOR ? ROLES.CUSTOMER : ROLES.VENDOR,
    })),

  setVendorProfile: (vendorProfile) => set({ vendorProfile }),

  /* Internal listener bookkeeping — not read by the UI. */
  _initialized: false,
  _unsubscribe: null,
}));

/* Selectors — importable so components subscribe to the narrowest slice. */

export const selectRole = (state) => state.role;

export const selectIsVendor = (state) => state.role === ROLES.VENDOR;

export const selectStatus = (state) => state.status;

export const selectIsAuthenticated = (state) => Boolean(state.token);

export default useAuthStore;
