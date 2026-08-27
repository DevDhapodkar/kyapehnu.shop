import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import useAuthStore, { ROLES } from '../store/useAuthStore';
import { fetchMyOrders, fetchVendorOrders } from '../api/vendorApi';
import { presentLocalNotification } from '../services/notifications';
import { STEP_LABELS } from '../utils/orderStatus';

/**
 * Local-notification fallback for order updates.
 *
 * Remote push (FCM) needs google-services.json to deliver on Android; until
 * that's provisioned, this keeps buyers and shops informed with **local**
 * notifications — no external credentials required. While the app is open it
 * polls the backend and raises a banner whenever something changed:
 *   - CUSTOMER: an existing order's status advanced (Packed, Out for delivery…).
 *   - VENDOR: a brand-new incoming order arrived.
 *
 * A per-account baseline persisted in AsyncStorage means we neither storm on
 * first load nor miss a change that happened while the app was closed (it fires
 * once on the next open). This complements remote push rather than replacing it:
 * once FCM is live, both simply co-exist.
 */

const POLL_INTERVAL_MS = 45_000;
const storageKey = (role, uid) => `order-notify:${role}:${uid}`;

const shortId = (id) => String(id).slice(-6).toUpperCase();

const customerMessage = (order) => {
  if (order.status === 'CANCELLED') {
    return { title: 'Order cancelled', body: `Order #${shortId(order._id)} was cancelled.` };
  }
  const step = STEP_LABELS[order.status] ?? order.status;
  const shop = order.vendor?.shopName ?? 'Your order';
  return { title: shop, body: `Order #${shortId(order._id)} is now “${step}”.` };
};

const vendorMessage = (order) => ({
  title: 'New order',
  body: `New order #${shortId(order._id)} · ${order.items?.length ?? 0} item${
    order.items?.length === 1 ? '' : 's'
  }.`,
});

export default function useOrderNotifications() {
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);
  const uid = useAuthStore((state) => state.user?.uid);

  // Latest values, so the interval callback never closes over stale state.
  const ctx = useRef({ token, role, uid });
  ctx.current = { token, role, uid };

  // In-memory mirror of the persisted baseline; null until first load.
  const baseline = useRef(null);
  const running = useRef(false);

  useEffect(() => {
    if (!token || !uid) return undefined;

    // Reset baseline whenever the account/role changes so we re-seed cleanly.
    baseline.current = null;

    const poll = async () => {
      if (running.current) return; // never overlap two polls
      running.current = true;
      try {
        const { role: r, uid: u } = ctx.current;
        const key = storageKey(r, u);

        if (baseline.current === null) {
          const stored = await AsyncStorage.getItem(key);
          baseline.current = stored ? JSON.parse(stored) : undefined; // undefined = never seeded
        }

        const orders =
          r === ROLES.VENDOR ? await fetchVendorOrders() : await fetchMyOrders();
        const next = {};
        for (const order of orders) next[order._id] = order.status;

        const prev = baseline.current;
        if (prev !== undefined) {
          for (const order of orders) {
            const before = prev[order._id];
            if (r === ROLES.VENDOR) {
              // Notify only on genuinely new incoming orders.
              if (before === undefined) await presentLocalNotification(vendorMessage(order));
            } else if (before !== undefined && before !== order.status) {
              // Notify on status transitions of orders we already knew about.
              await presentLocalNotification(customerMessage(order));
            }
          }
        }

        baseline.current = next;
        await AsyncStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* offline / auth refresh — try again next tick */
      } finally {
        running.current = false;
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') poll();
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [token, uid, role]);
}
