/**
 * Kya Pehnu? — luxury obsidian / charcoal palette.
 *
 * The design system is deliberately monochrome: obsidian surfaces, charcoal
 * elevation, and two warm accents — crimson reserved for calls to action and
 * live movement, gold for provenance and "this needs you". No hue outside this
 * file should reach a component.
 *
 * Everything here is a raw value. Composed tokens (type scale, motion curves,
 * elevation, gradients) live alongside in ./tokens.js and read from this file,
 * so there is still exactly one place a colour is defined.
 */

export const colors = {
  // Base surfaces (darkest to lightest).
  obsidian: '#050506',
  obsidianDeep: '#0A0A0C',
  charcoal: '#131316',
  charcoalLight: '#1C1C21',
  graphite: '#2A2A31',
  graphiteLight: '#3A3A45',

  // Text.
  ivory: '#F5F3EF',
  platinum: '#C9C7C2',
  ash: '#8A8891',
  slate: '#5C5A63',

  // Accent — used sparingly (primary actions, the red-dress chapter).
  crimson: '#8E1B29',
  crimsonBright: '#C4243A',
  crimsonGlow: '#E33F55',
  gold: '#C8A24A',
  goldBright: '#E8CB7E',
  goldDeep: '#7A5F22',

  /**
   * The single non-monochrome signal, deliberately desaturated so it reads as
   * patina rather than a system green. Reserved for "confirmed / in stock /
   * delivered" — never for a call to action.
   */
  jade: '#4E8C6A',
  jadeDeep: '#1E3328',

  // Glassmorphism tokens (rgba so they can layer over imagery and the 3D canvas).
  glassFill: 'rgba(19, 19, 22, 0.55)',
  glassFillStrong: 'rgba(10, 10, 12, 0.72)',
  glassFillSoft: 'rgba(40, 40, 48, 0.38)',
  glassBorder: 'rgba(245, 243, 239, 0.12)',
  glassBorderStrong: 'rgba(245, 243, 239, 0.22)',
  glassHighlight: 'rgba(245, 243, 239, 0.06)',
  glassShadow: 'rgba(0, 0, 0, 0.6)',

  // Accent washes — low-alpha tints for pills, halos, and selected states.
  crimsonWash: 'rgba(196, 36, 58, 0.16)',
  crimsonWashSoft: 'rgba(196, 36, 58, 0.08)',
  goldWash: 'rgba(200, 162, 74, 0.14)',
  goldWashSoft: 'rgba(200, 162, 74, 0.07)',
  jadeWash: 'rgba(78, 140, 106, 0.16)',
  ivoryWash: 'rgba(245, 243, 239, 0.08)',

  // Scrims used to keep type legible above imagery and the 3D scene.
  scrim: 'rgba(5, 5, 6, 0.35)',
  scrimStrong: 'rgba(5, 5, 6, 0.72)',
  scrimClear: 'rgba(5, 5, 6, 0)',

  // Shimmer sweep for skeleton placeholders.
  shimmer: 'rgba(245, 243, 239, 0.07)',

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
 * One tint per order state, for the status pills on both sides of the app.
 * Monochrome by default — gold is the "this order owes you an action" signal,
 * crimson stays reserved for the leg where a driver is actually moving, and
 * jade closes the loop on a completed delivery.
 */
export const statusColors = {
  PENDING: colors.gold,
  ACCEPTED: colors.gold,
  PACKED: colors.gold,
  READY_FOR_PICKUP: colors.crimsonBright,
  IN_TRANSIT: colors.crimsonBright,
  DELIVERED: colors.jade,
  CANCELLED: colors.crimson,
};

export const statusLabels = {
  PENDING: 'Placed',
  ACCEPTED: 'Accepted',
  PACKED: 'Packed',
  READY_FOR_PICKUP: 'Ready for Pickup',
  IN_TRANSIT: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

/**
 * The glyph each order state carries, so a status reads at a glance from across
 * a shop counter without parsing the label. Names are Feather icons.
 */
export const statusIcons = {
  PENDING: 'clock',
  ACCEPTED: 'check',
  PACKED: 'package',
  READY_FOR_PICKUP: 'shopping-bag',
  IN_TRANSIT: 'navigation',
  DELIVERED: 'check-circle',
  CANCELLED: 'x-circle',
};

/**
 * 4pt-based spacing scale. The original five steps keep their exact values so
 * every existing layout is untouched; the additions fill the gaps that forced
 * screens to write `spacing.md - 2` arithmetic inline.
 */
export const spacing = {
  xxs: 4,
  xs: 6,
  s: 8,
  sm: 12,
  m: 16,
  md: 20,
  lg: 32,
  xl: 48,
  xxl: 64,
};

export const radii = {
  xs: 6,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
};

export default colors;
