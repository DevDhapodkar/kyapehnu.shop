import { create } from 'zustand';

/**
 * Global cart state (Zustand).
 *
 * A cart line is identified by product id *and* selected size, so the same
 * watch in 38mm and 41mm are two distinct lines rather than a quantity bump.
 * That key is computed once in `lineKey` and used by every mutation.
 *
 * `cartTotal` is exposed two ways on purpose:
 *  - `useCartStore.getState().cartTotal()` for imperative reads (handlers)
 *  - `useCartStore(selectCartTotal)` for reactive reads inside components
 *
 * Both derive from `cartItems`, so there is no second source of truth to drift.
 */

const lineKey = (productId, size) => `${productId}::${size ?? 'default'}`;

export const useCartStore = create((set, get) => ({
  cartItems: [],

  /**
   * Adds a product, merging into an existing line when the id and size match.
   * `size` is optional for products that ship one-size-fits-all.
   */
  addToCart: (product, size = null, quantity = 1) =>
    set((state) => {
      const key = lineKey(product.id, size ?? product.sizes?.[0] ?? null);
      const existing = state.cartItems.find((item) => item.key === key);

      if (existing) {
        return {
          cartItems: state.cartItems.map((item) =>
            item.key === key ? { ...item, quantity: item.quantity + quantity } : item,
          ),
        };
      }

      return {
        cartItems: [
          ...state.cartItems,
          {
            key,
            productId: product.id,
            name: product.name,
            category: product.category,
            price: product.price,
            image: product.image,
            colorway: product.colorway,
            // vendorUid routes the order to the right shop's desk at checkout.
            vendorUid: product.vendorUid ?? null,
            storeId: product.storeId,
            storeName: product.storeName,
            storeArea: product.storeArea,
            storeCoordinates: product.storeCoordinates,
            etaMinutes: product.etaMinutes,
            size: size ?? product.sizes?.[0] ?? null,
            quantity,
          },
        ],
      };
    }),

  /**
   * Removes one unit from a line, dropping the line entirely when it hits zero.
   * Pass `{ all: true }` to remove the line regardless of quantity.
   */
  removeFromCart: (key, options = {}) =>
    set((state) => {
      const target = state.cartItems.find((item) => item.key === key);
      if (!target) return state;

      if (options.all || target.quantity <= 1) {
        return { cartItems: state.cartItems.filter((item) => item.key !== key) };
      }

      return {
        cartItems: state.cartItems.map((item) =>
          item.key === key ? { ...item, quantity: item.quantity - 1 } : item,
        ),
      };
    }),

  clearCart: () => set({ cartItems: [] }),

  /** Sum of price x quantity across every line, in whole rupees. */
  cartTotal: () =>
    get().cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),

  /** Total units, which is what the badge on the Home header shows. */
  cartCount: () => get().cartItems.reduce((sum, item) => sum + item.quantity, 0),
}));

/* Selectors — importable so components subscribe to the narrowest slice. */

export const selectCartItems = (state) => state.cartItems;

export const selectCartTotal = (state) =>
  state.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

export const selectCartCount = (state) =>
  state.cartItems.reduce((sum, item) => sum + item.quantity, 0);

export default useCartStore;
