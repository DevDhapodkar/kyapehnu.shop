import { useEffect, useRef } from 'react';

import { subscribeToken } from '../services/auth';
import { fetchMyProfile } from '../api/customerApi';
import useAuthStore, { ROLES } from '../store/useAuthStore';

/**
 * App-level auth bootstrap. Subscribes to Firebase ID-token changes so that:
 *  - a session persisted in AsyncStorage is restored on launch (auto sign-in),
 *  - the token is refreshed into the axios seam ~hourly with no user action,
 *  - signing out anywhere clears the local session.
 *
 * On the first token of a session it loads the backend profile (which carries
 * saved addresses used at checkout). No-op when Firebase isn't configured — the
 * app then stays in demo mode.
 */
export default function useAuthInit() {
  const signIn = useAuthStore((s) => s.signIn);
  const setToken = useAuthStore((s) => s.setToken);
  const signOut = useAuthStore((s) => s.signOut);
  const lastUid = useRef(null);

  useEffect(() => {
    const unsub = subscribeToken(async (token, user) => {
      if (!token || !user) {
        lastUid.current = null;
        signOut();
        return;
      }
      setToken(token); // authorise API calls immediately
      if (user.uid !== lastUid.current) {
        lastUid.current = user.uid;
        let profile = null;
        try {
          profile = await fetchMyProfile();
        } catch {
          // Profile may not exist yet right after sign-up; the sign-in screen
          // syncs it. Fall back to the Firebase identity.
        }
        signIn({
          user: profile || { name: user.displayName, email: user.email, uid: user.uid },
          token,
          role: ROLES.CUSTOMER,
        });
      }
    });
    return unsub;
  }, [signIn, setToken, signOut]);
}
