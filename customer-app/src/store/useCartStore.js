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

const lineKey = (productId, size, color) =>
  `${productId}::${size ?? 'default'}::${color?.name || color || 'default'}`;

export const useCartStore = create((set, get) => ({
  cartItems: [],

  /**
   * Adds a product, merging into an existing line when the id, size, and color match.
   */
  addToCart: (product, size = null, color = null, quantity = 1) =>
    set((state) => {
      const prodId = product.id || product.productId || product._id;
      if (!prodId) return state;

      const chosenSize = size ?? product.sizes?.[0] ?? 'Free';
      const chosenColor = color ?? product.colors?.[0] ?? null;
      const key = lineKey(prodId, chosenSize, chosenColor);
      const existing = state.cartItems.find((item) => item.key === key);

      if (existing) {
        return {
          cartItems: state.cartItems.map((item) =>
            item.key === key ? { ...item, quantity: item.quantity + quantity } : item,
          ),
        };
      }

      const colorName =
        typeof chosenColor === 'object' && chosenColor?.name
          ? chosenColor.name
          : typeof chosenColor === 'string'
          ? chosenColor
          : '';

      const colorHex =
        typeof chosenColor === 'object' && chosenColor?.hex
          ? chosenColor.hex
          : '';

      return {
        cartItems: [
          ...state.cartItems,
          {
            key,
            id: prodId,
            productId: prodId,
            name: product.name,
            category: product.category,
            price: Number(product.price || 0),
            image: product.image || product.images?.[0],
            color: colorName,
            colorHex,
            colorway: product.colorway || (Array.isArray(product.colors) ? product.colors.join(', ') : ''),
            storeId: product.storeId || product.vendor?._id || product.vendor,
            storeName: product.storeName || product.vendor?.shopName || 'Local Atelier',
            storeArea: product.storeArea || product.vendor?.area || 'Nagpur',
            storeCoordinates: product.storeCoordinates || product.vendor?.location?.coordinates,
            etaMinutes: product.etaMinutes || 25,
            size: chosenSize,
            quantity: Math.max(1, quantity),
          },
        ],
      };
    }),

  /**
   * Removes one unit from a line, dropping the line entirely when it hits zero.
   * Pass `{ all: true }` to remove the line regardless of quantity.
   */
  removeFromCart: (keyOrId, options = {}) =>
    set((state) => {
      const target = state.cartItems.find(
        (item) => item.key === keyOrId || item.id === keyOrId || item.productId === keyOrId
      );
      if (!target) return state;

      const targetKey = target.key;
      if (options.all || target.quantity <= 1) {
        return { cartItems: state.cartItems.filter((item) => item.key !== targetKey) };
      }

      return {
        cartItems: state.cartItems.map((item) =>
          item.key === targetKey ? { ...item, quantity: item.quantity - 1 } : item,
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
