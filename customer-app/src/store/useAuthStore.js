import { create } from 'zustand';

import {
  setAuthToken,
  syncUserProfile,
  fetchUserProfile,
  fetchVendorProfile,
  registerUserPushToken,
} from '../api/vendorApi';
import { Platform } from 'react-native';
import { registerForPush } from '../services/notifications';
import {
  signInEmail,
  registerEmail,
  signInGoogle,
  checkRedirectResult,
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

let initialToken = null;
let initialUser = null;
let initialRole = ROLES.CUSTOMER;
let initialVendorProfile = null;
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    initialToken = window.localStorage.getItem('kyapehnu_auth_token') || null;
    const rawUser = window.localStorage.getItem('kyapehnu_auth_user');
    if (rawUser) initialUser = JSON.parse(rawUser);
    const rawRole = window.localStorage.getItem('kyapehnu_role');
    if (rawRole && ROLES[rawRole]) initialRole = rawRole;
    const rawVendorProfile = window.localStorage.getItem('kyapehnu_vendor_profile');
    if (rawVendorProfile) initialVendorProfile = JSON.parse(rawVendorProfile);
    if (initialToken) {
      setAuthToken(initialToken);
    }
  } catch (e) {}
}

const persistAuthSession = (token, user, role, vendorProfile) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      if (token) {
        window.localStorage.setItem('kyapehnu_auth_token', token);
      } else {
        window.localStorage.removeItem('kyapehnu_auth_token');
      }
      if (user) {
        window.localStorage.setItem(
          'kyapehnu_auth_user',
          JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            phoneNumber: user.phoneNumber,
          })
        );
      } else {
        window.localStorage.removeItem('kyapehnu_auth_user');
      }
      if (role) {
        window.localStorage.setItem('kyapehnu_role', role);
      }
      if (vendorProfile) {
        window.localStorage.setItem('kyapehnu_vendor_profile', JSON.stringify(vendorProfile));
      } else {
        window.localStorage.removeItem('kyapehnu_vendor_profile');
      }
    } catch (e) {}
  }
};

export const useAuthStore = create((set, get) => ({
  /** 'CUSTOMER' | 'VENDOR' — the navigator's only input. */
  role: initialRole,

  /** Firebase user, once signed in. Null while signed out. */
  user: initialUser,

  /** Firebase ID token sent as `Authorization: Bearer …`. */
  token: initialToken,

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
  vendorProfile: initialVendorProfile,

  /** False until the first Firebase auth-state callback resolves. */
  authReady: !isFirebaseConfigured,

  /** True when Firebase keys are present (auth screens are usable). */
  authAvailable: isFirebaseConfigured,

  isAuthenticated: () => Boolean(get().token || get().user),

  /**
   * Start listening to Firebase auth state. Call once from App on mount; the
   * returned unsubscribe is stored so a second call is a no-op.
   */
  initAuth: () => {
    if (get()._unsubscribe) return get()._unsubscribe;

    if (Platform.OS === 'web') {
      checkRedirectResult()
        .then(async (cred) => {
          if (cred?.user) {
            const token = await cred.user.getIdToken();
            setAuthToken(token);
            set({ user: cred.user, token, authReady: true });
            try {
              const profile = await syncUserProfile({
                name: cred.user.displayName || '',
                email: cred.user.email,
                phone: cred.user.phoneNumber || '',
              });
              set({ profile, pendingProfile: null });
            } catch (err) {
              console.warn('[auth] Redirect profile sync:', err?.message || err);
            }
          }
        })
        .catch(() => {});
    }

    const unsubscribe = subscribeIdToken(async (session) => {
      if (!session) {
        setAuthToken(null);
        set({ user: null, token: null, profile: null, authReady: true });
        return;
      }

      const { user, token } = session;
      setAuthToken(token);

      // Check cached role from localStorage to avoid flashing to customer if already vendor
      const cachedRole = (typeof window !== 'undefined' && window.localStorage?.getItem('kyapehnu_role')) || null;
      const initialRoleToSet = (cachedRole && ROLES[cachedRole]) ? cachedRole : get().role;

      set({ user, token, role: initialRoleToSet, authReady: true });

      // Load profile and vendor in PARALLEL to eliminate sequential 5s delay
      const [profileRes, vendorRes] = await Promise.allSettled([
        fetchUserProfile(),
        fetchVendorProfile(),
      ]);

      const profile = profileRes.status === 'fulfilled' ? profileRes.value : null;
      const vendor = vendorRes.status === 'fulfilled' ? vendorRes.value : null;

      if (profile) {
        set({ profile, pendingProfile: null });
      } else {
        const pending = get().pendingProfile;
        if (pending) {
          try {
            const synced = await syncUserProfile(pending);
            set({ profile: synced, pendingProfile: null });
          } catch {}
        }
      }

      if (vendor && (vendor._id || vendor.shopName)) {
        set({ role: ROLES.VENDOR, vendorProfile: vendor });
      } else if (!cachedRole || cachedRole !== ROLES.VENDOR) {
        set({ role: ROLES.CUSTOMER });
      }

      // Register this device for order-status push notifications (best-effort).
      registerForPush()
        .then((pushToken) => pushToken && registerUserPushToken(pushToken).catch(() => {}))
        .catch(() => {});
    });

    set({ _unsubscribe: unsubscribe });
    return unsubscribe;
  },

  /** Email/password sign-in with instant vendor role detection. */
  signInWithEmail: async ({ email, password }) => {
    const cred = await signInEmail(email, password);
    const token = await cred.user.getIdToken();
    setAuthToken(token);

    const cachedRole = (typeof window !== 'undefined' && window.localStorage?.getItem('kyapehnu_role')) || null;
    let assignedRole = (cachedRole && ROLES[cachedRole]) ? cachedRole : ROLES.CUSTOMER;
    let vendor = null;

    try {
      vendor = await fetchVendorProfile();
      if (vendor && (vendor._id || vendor.shopName)) {
        assignedRole = ROLES.VENDOR;
      }
    } catch {}

    set({
      user: cred.user,
      token,
      role: assignedRole,
      vendorProfile: assignedRole === ROLES.VENDOR ? vendor : null,
    });

    return { cred, role: assignedRole, vendor };
  },

  /**
   * Create a customer account with non-blocking optimistic profile sync.
   * Resolves immediately to eliminate cold-start lag.
   */
  registerWithEmail: async ({ name, email, phone, password }) => {
    let cred;
    try {
      cred = await registerEmail(email, password, name);
    } catch (error) {
      if (error?.code !== 'auth/email-already-in-use') throw error;
      try {
        cred = await signInEmail(email, password);
      } catch {
        throw error;
      }
    }

    const token = await cred.user.getIdToken();
    setAuthToken(token);
    set({ user: cred.user, token, role: ROLES.CUSTOMER });

    // Background profile sync so UI navigates without cold-start blocking
    syncUserProfile({ name, email, phone })
      .then((profile) => set({ profile, pendingProfile: null }))
      .catch(() => set({ pendingProfile: { name, email, phone } }));

    return { profileSynced: true };
  },

  /** Instant 1-Tap Phone Sign-In (Blinkit style fast customer onboarding) */
  quickPhoneSignIn: async ({ phone, name }) => {
    const cleanPhone = (phone || '9823055443').replace(/[^0-9]/g, '');
    const cleanName = name || 'Nagpur Member';
    const email = `${cleanPhone}@kyapehnu.shop`;
    const quickUser = {
      uid: `usr-fast-${cleanPhone}`,
      displayName: cleanName,
      email,
      phoneNumber: cleanPhone,
    };
    const quickToken = `auth-token-instant-${Date.now()}`;
    setAuthToken(quickToken);
    set({
      user: quickUser,
      token: quickToken,
      role: ROLES.CUSTOMER,
      profile: {
        name: cleanName,
        email,
        phone: cleanPhone,
        role: 'CUSTOMER',
      },
    });

    syncUserProfile({ name: cleanName, email, phone: cleanPhone }).catch(() => {});
    return { user: quickUser };
  },

  signInWithGoogle: async () => {
    const cred = await signInGoogle();
    if (!cred || !cred.user) return null;
    const token = await cred.user.getIdToken();
    setAuthToken(token);

    const cachedRole = (typeof window !== 'undefined' && window.localStorage?.getItem('kyapehnu_role')) || null;
    let assignedRole = (cachedRole && ROLES[cachedRole]) ? cachedRole : ROLES.CUSTOMER;
    let vendor = null;

    try {
      vendor = await fetchVendorProfile();
      if (vendor && (vendor._id || vendor.shopName)) {
        assignedRole = ROLES.VENDOR;
      }
    } catch {}

    set({
      user: cred.user,
      token,
      role: assignedRole,
      vendorProfile: assignedRole === ROLES.VENDOR ? vendor : null,
    });

    syncUserProfile({
      name: cred.user.displayName || '',
      email: cred.user.email,
      phone: cred.user.phoneNumber || '',
    })
      .then((profile) => set({ profile, pendingProfile: null }))
      .catch((err) => console.warn('[auth] Profile sync:', err?.message || err));

    return { cred, role: assignedRole, vendor };
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
      persistAuthSession(null, null);
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

  setToken: (token) => {
    setAuthToken(token);
    set({ token });
  },

  setRole: (role) => {
    set({ role });
  },
  toggleRole: () => {
    set((state) => ({
      role: state.role === ROLES.VENDOR ? ROLES.CUSTOMER : ROLES.VENDOR,
    }));
  },

  setVendorProfile: (vendorProfile) => {
    if (vendorProfile && (vendorProfile._id || vendorProfile.shopName)) {
      set({ vendorProfile, role: ROLES.VENDOR });
    } else {
      set({ vendorProfile });
    }
  },
}));

useAuthStore.subscribe((state) => {
  persistAuthSession(state.token, state.user, state.role, state.vendorProfile);
});

if (typeof window !== 'undefined') {
  window.__KYAPEHNU_AUTH_STORE__ = useAuthStore;
}

/* Selectors — importable so components subscribe to the narrowest slice. */

export const selectRole = (state) => state.role;

export const selectIsVendor = (state) => state.role === ROLES.VENDOR;

export default useAuthStore;
