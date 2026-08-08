/**
 * Kya Pehnu? Vendor — luxury obsidian / charcoal palette.
 *
 * Kept token-for-token identical to the customer app's theme so a shop owner
 * and a buyer are visibly inside the same product. The only addition is
 * `statusColors`, which the customer app has no use for.
 */

export const colors = {
  // Base surfaces (darkest to lightest).
  obsidian: '#050506',
  obsidianDeep: '#0A0A0C',
  charcoal: '#131316',
  charcoalLight: '#1C1C21',
  graphite: '#2A2A31',

  // Text.
  ivory: '#F5F3EF',
  platinum: '#C9C7C2',
  ash: '#8A8891',
  slate: '#5C5A63',

  // Accent — used sparingly (primary actions).
  crimson: '#8E1B29',
  crimsonBright: '#C4243A',
  gold: '#C8A24A',

  // Glassmorphism tokens (rgba so they can layer over any surface).
  glassFill: 'rgba(19, 19, 22, 0.55)',
  glassFillStrong: 'rgba(10, 10, 12, 0.72)',
  glassBorder: 'rgba(245, 243, 239, 0.12)',
  glassHighlight: 'rgba(245, 243, 239, 0.06)',
  glassShadow: 'rgba(0, 0, 0, 0.6)',

  scrim: 'rgba(5, 5, 6, 0.35)',

  transparent: 'transparent',
};

/**
 * One tint per order state. Monochrome by default — gold is the "you owe this
 * order an action" signal, so only PENDING and ACCEPTED carry it.
 */
export const statusColors = {
  PENDING: colors.gold,
  ACCEPTED: colors.gold,
  READY_FOR_PICKUP: colors.crimsonBright,
  IN_TRANSIT: colors.platinum,
  DELIVERED: colors.slate,
};

export const statusLabels = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  READY_FOR_PICKUP: 'Ready for Pickup',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
};

export const spacing = {
  xs: 6,
  sm: 12,
  md: 20,
  lg: 32,
  xl: 48,
};

export const radii = {
  sm: 8,
  md: 16,
  lg: 24,
};

export default colors;
