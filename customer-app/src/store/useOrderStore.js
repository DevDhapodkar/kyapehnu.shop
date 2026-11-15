import { create } from 'zustand';
import { fetchMyOrders } from '../api/vendorApi';
import { useAuthStore } from './useAuthStore';

const STORAGE_KEY = 'kyapehnu_recent_orders';

const cleanStaleMockOrders = (orderList) => {
  if (!Array.isArray(orderList)) return [];
  return orderList.filter((o) => {
    if (!o) return false;
    const name = (o.items?.[0]?.name || o.title || '').toLowerCase();
    const id = String(o.orderId || o._id || '').toUpperCase();
    // Exclude old mockup IDs and test data
    return (
      !name.includes('shirt black') &&
      !id.includes('40E483') &&
      id !== 'KP-8492' &&
      id !== '8492'
    );
  });
};

const getInitialOrders = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const cleaned = cleanStaleMockOrders(parsed);
        if (cleaned.length !== parsed.length) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        }
        return cleaned;
      }
    } catch (e) {
      // ignore JSON parse error
    }
  }
  return [];
};

export const ACTIVE_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'ACCEPTED',
  'PACKED',
  'DISPATCHED',
  'OUTFIT_PICKED_UP',
  'OUT_FOR_DELIVERY',
  'IN_TRANSIT',
];

export const useOrderStore = create((set, get) => ({
  orders: getInitialOrders(),
  isLoading: false,
  error: null,

  // Get in-flight active order (not DELIVERED or CANCELLED)
  getActiveOrder: () => {
    const { orders } = get();
    if (!orders || orders.length === 0) return null;
    return orders.find((o) => {
      const st = String(o.status || '').toUpperCase();
      return ACTIVE_STATUSES.includes(st) || (!st && o.createdAt);
    }) || null;
  },

  hasActiveDispatch: () => {
    return Boolean(get().getActiveOrder());
  },

  setOrders: (ordersList) => {
    const cleaned = cleanStaleMockOrders(ordersList);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      } catch (e) {}
    }
    set({ orders: cleaned });
  },

  addOrder: (newOrder) => {
    const formatted = {
      ...newOrder,
      orderId: newOrder.orderId || newOrder._id || `KP-${Date.now().toString().slice(-6)}`,
      status: newOrder.status || 'CONFIRMED',
      createdAt: newOrder.createdAt || new Date().toISOString(),
    };
    const current = get().orders;
    const updated = [formatted, ...current.filter(o => (o.orderId || o._id) !== formatted.orderId)].slice(0, 20);
    get().setOrders(updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kyapehnu:order_updated', { detail: formatted }));
    }
    return formatted;
  },

  updateOrderStatus: (orderId, newStatus) => {
    const current = get().orders;
    const updated = current.map((ord) => {
      const matchId = ord.orderId || ord._id;
      if (matchId === orderId) {
        return { ...ord, status: newStatus };
      }
      return ord;
    });
    get().setOrders(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kyapehnu:order_updated', { detail: { orderId, status: newStatus } }));
    }
  },

  fetchOrders: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      // For unauthenticated guests, rely on local orders
      return get().orders;
    }

    set({ isLoading: true });
    try {
      const remoteOrders = await fetchMyOrders();
      if (Array.isArray(remoteOrders)) {
        const cleanedRemote = cleanStaleMockOrders(remoteOrders);
        // Merge with local orders that may not yet be synced
        const remoteIds = new Set(cleanedRemote.map((o) => String(o.orderId || o._id)));
        const merged = [...cleanedRemote];
        get().orders.forEach((localOrd) => {
          const lId = String(localOrd.orderId || localOrd._id);
          if (!remoteIds.has(lId)) {
            merged.push(localOrd);
          }
        });
        const finalOrders = cleanStaleMockOrders(merged);
        get().setOrders(finalOrders);
        set({ isLoading: false, error: null });
        return finalOrders;
      }
    } catch (err) {
      set({ isLoading: false, error: err?.message || 'Failed to fetch orders' });
    }
    return get().orders;
  },

  clearOrders: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
    }
    set({ orders: [] });
  },
}));

// Initialize storage listener across tabs/windows
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      try {
        const raw = event.newValue;
        const parsed = raw ? JSON.parse(raw) : [];
        useOrderStore.getState().setOrders(parsed);
      } catch (e) {}
    }
  });
}
