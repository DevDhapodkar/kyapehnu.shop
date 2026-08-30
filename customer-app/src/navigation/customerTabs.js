import { useCallback } from 'react';

/**
 * The customer flow's floating dock: its four destinations, and the hook that
 * moves between them.
 *
 * This lives beside the navigator rather than inside a screen because three
 * screens render the dock. Defining it in one of them would make the other two
 * import a sibling screen just to read a constant, and would leave the route
 * table duplicated in each.
 *
 * Glyphs are deliberately drawn from the Geometric Shapes block. The obvious
 * choices — a house, a bag, a person — sit in ranges Android's system font does
 * not reliably cover, and a missing glyph in the primary navigation is a tofu
 * box where the destination should be.
 */
export const CUSTOMER_TABS = [
  { key: 'home', glyph: '◆', label: 'Home' },
  { key: 'orders', glyph: '≡', label: 'Orders' },
  { key: 'bag', glyph: '◇', label: 'Bag' },
  { key: 'profile', glyph: '○', label: 'Profile' },
];

/** Dock key → route name in the customer stack. */
export const TAB_ROUTES = {
  home: 'Home',
  orders: 'MyOrders',
  bag: 'Cart',
  profile: 'Profile',
};

/**
 * Handler for a dock press. Tapping the tab you are already on is a no-op
 * rather than a re-navigation, which would otherwise push a duplicate of the
 * current screen onto the stack.
 *
 * @param {object} navigation react-navigation's navigation prop
 * @param {string} current the dock key of the screen rendering the dock
 */
export function useTabNavigation(navigation, current) {
  return useCallback(
    (key) => {
      if (key === current) return;
      navigation.navigate(TAB_ROUTES[key]);
    },
    [navigation, current]
  );
}
