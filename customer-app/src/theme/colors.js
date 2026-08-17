/**
 * Kya Pehnu? — luxury obsidian / charcoal palette.
 *
 * The design system is deliberately monochrome: obsidian surfaces, charcoal
 * elevation, and a single warm accent reserved for calls to action. No hue
 * outside this file should reach a component.
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

  // Accent — used sparingly (primary actions, the red-dress chapter).
  crimson: '#8E1B29',
  crimsonBright: '#C4243A',
  gold: '#C8A24A',

  // Glassmorphism tokens (rgba so they can layer over the 3D canvas).
  glassFill: 'rgba(19, 19, 22, 0.55)',
  glassFillStrong: 'rgba(10, 10, 12, 0.72)',
  glassBorder: 'rgba(245, 243, 239, 0.12)',
  glassHighlight: 'rgba(245, 243, 239, 0.06)',
  glassShadow: 'rgba(0, 0, 0, 0.6)',

  // Scrim used to keep type legible above the 3D scene.
  scrim: 'rgba(5, 5, 6, 0.35)',

  transparent: 'transparent',
};

/**
 * Canvas / scene colors, kept alongside the UI palette so they stay in sync.
 * Garment colour now comes from the GLB materials, so only the environment —
 * clear colour, fog, and the light rig — is themed here.
 */
export const sceneColors = {
  background: colors.obsidian,
  fog: colors.obsidianDeep,
  keyLight: '#FFFFFF',
  rimLight: colors.crimsonBright,
};

/**
 * One tint per order state, for the vendor flow's status pills. Monochrome by
 * default — gold is the "this order owes you an action" signal, so only
 * PENDING and ACCEPTED carry it, and crimson stays reserved for the moment a
 * driver is being dispatched.
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
