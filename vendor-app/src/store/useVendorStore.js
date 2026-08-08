import { create } from 'zustand';

import * as api from '../api/vendorApi';

/**
 * Vendor dashboard state (Zustand).
 *
 * Orders are held as one flat list of every status; the status filter is a
 * client-side view over it. That means switching tabs is instant and an order
 * that changes status stays visible in the list it moved into without a
 * refetch — the alternative (one server query per tab) makes "Accept" appear
 * to delete the order.
 *
 * Every mutation records `pendingOrderId` / `pendingProductId` so a single row
 * can show a spinner without freezing the whole screen.
 */

/** Tabs, in the order the vendor works through them. */
export const ORDER_FILTERS = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'READY_FOR_PICKUP', label: 'Ready' },
  { key: 'ALL', label: 'All' },
];

const replaceOrder = (orders, updated) => {
  const id = updated?._id;
  if (!id) return orders;

  const exists = orders.some((order) => order._id === id);
  // Merge rather than swap: the list rows carry a populated `customer` that a
  // status-change response may not include.
  return exists
    ? orders.map((order) => (order._id === id ? { ...order, ...updated } : order))
    : [updated, ...orders];
};

export const useVendorStore = create((set, get) => ({
  vendor: null,

  orders: [],
  ordersLoading: false,
  ordersError: null,
  statusFilter: 'PENDING',
  pendingOrderId: null,

  products: [],
  catalogLoading: false,
  catalogError: null,
  pendingProductId: null,

  setStatusFilter: (statusFilter) => set({ statusFilter }),

  loadVendor: async () => {
    try {
      const vendor = await api.fetchVendorProfile();
      set({ vendor });
      return vendor;
    } catch (error) {
      // Non-fatal: the header falls back to a generic title.
      console.warn('Vendor profile unavailable:', error.message);
      return null;
    }
  },

  /* ------------------------------------------------------------- orders -- */

  loadOrders: async () => {
    set({ ordersLoading: true, ordersError: null });
    try {
      const orders = await api.fetchVendorOrders();
      set({ orders, ordersLoading: false });
    } catch (error) {
      set({ ordersError: error.message, ordersLoading: false });
    }
  },

  /** PATCH the order to ACCEPTED. Returns the updated order. */
  acceptOrder: async (orderId) => {
    set({ pendingOrderId: orderId, ordersError: null });
    try {
      const updated = await api.acceptOrder(orderId);
      set((state) => ({
        orders: replaceOrder(state.orders, updated),
        pendingOrderId: null,
      }));
      return updated;
    } catch (error) {
      set({ pendingOrderId: null, ordersError: error.message });
      throw error;
    }
  },

  /**
   * The Porter + WhatsApp trigger. Resolves to the `logistics` summary so the
   * caller can tell the vendor which of the two legs actually landed; the
   * order itself is already merged into the list by then.
   */
  markOrderReady: async (orderId) => {
    set({ pendingOrderId: orderId, ordersError: null });
    try {
      const { order, logistics } = await api.markOrderReady(orderId);
      set((state) => ({
        orders: replaceOrder(state.orders, order),
        pendingOrderId: null,
      }));
      return { order, logistics };
    } catch (error) {
      set({ pendingOrderId: null, ordersError: error.message });
      throw error;
    }
  },

  /* ------------------------------------------------------------ catalog -- */

  loadCatalog: async () => {
    set({ catalogLoading: true, catalogError: null });
    try {
      const products = await api.fetchCatalog();
      set({ products, catalogLoading: false });
    } catch (error) {
      set({ catalogError: error.message, catalogLoading: false });
    }
  },

  /**
   * Optimistic flip: the switch moves under the vendor's thumb immediately and
   * rolls back if the PATCH fails, because a toggle that lags a round-trip
   * feels broken on a shop's patchy connection.
   */
  toggleAvailability: async (productId, isAvailable) => {
    const previous = get().products;

    set((state) => ({
      pendingProductId: productId,
      catalogError: null,
      products: state.products.map((product) =>
        product._id === productId ? { ...product, isAvailable } : product
      ),
    }));

    try {
      const updated = await api.setProductAvailability(productId, isAvailable);
      set((state) => ({
        pendingProductId: null,
        products: state.products.map((product) =>
          product._id === productId ? updated : product
        ),
      }));
      return updated;
    } catch (error) {
      set({ products: previous, pendingProductId: null, catalogError: error.message });
      throw error;
    }
  },

  addProduct: async (payload) => {
    set({ catalogError: null });
    try {
      const product = await api.createProduct(payload);
      set((state) => ({ products: [product, ...state.products] }));
      return product;
    } catch (error) {
      set({ catalogError: error.message });
      throw error;
    }
  },
}));

/* Selectors — importable so components subscribe to the narrowest slice. */

export const selectVisibleOrders = (state) =>
  state.statusFilter === 'ALL'
    ? state.orders
    : state.orders.filter((order) => order.status === state.statusFilter);

/** Badge counts for the filter tabs. */
export const selectStatusCounts = (state) =>
  state.orders.reduce((counts, order) => {
    counts[order.status] = (counts[order.status] ?? 0) + 1;
    return counts;
  }, {});

export const selectOrderById = (orderId) => (state) =>
  state.orders.find((order) => order._id === orderId) ?? null;

export default useVendorStore;
