/**
 * Kya Pehnu? — colour system.
 *
 * The app is a dark bento interface: a near-black page carrying lighter,
 * heavily-rounded panels. Three layers, and nothing outside this file invents a
 * fourth:
 *
 *  - **Page** (`ink`) — the ground everything floats on.
 *  - **Surfaces** (`surface` → `surfaceHigh`) — opaque panels. Elevation is
 *    signalled by getting *lighter*, never by a heavier border.
 *  - **Glass** (`glass*`) — translucent panels that sit over a photograph or
 *    the 3D scene, where an opaque fill would kill the image underneath. The
 *    gradient scrims that keep type legible over an image live in `gradients`,
 *    not here: a flat wash greys out the whole photo, a ramp does not.
 *
 * Accent policy: the interface is monochrome, and saturation is a signal.
 *  - `gradients.aurora` is the conversion accent — the one sweep of colour in
 *    the app, reserved for the single most important action on a screen
 *    (place order, create account).
 *  - `light` (near-white) is the everyday primary: white pill, ink label.
 *  - `statusColors` is the only other place a hue is allowed, and only to say
 *    where an order sits in its lifecycle.
 */

export { gutter, radii, shadows, spacing, TOUCH_SIZE } from './layout';

export const colors = {
  // ---- Page + opaque surfaces (darkest to lightest) ---------------------
  /** The page itself. */
  ink: '#050506',
  /** A hair above the page — used for insets and input wells. */
  inkDeep: '#0B0B0D',
  /** Default bento card. */
  surface: '#141417',
  /** A card sitting on a card, or a resting control. */
  surfaceRaised: '#1C1C21',
  /** The lightest opaque step — selected chips, steppers, avatars. */
  surfaceHigh: '#26262C',

  // ---- Text -------------------------------------------------------------
  /** Primary type and anything that must read as "on". */
  ivory: '#F7F5F2',
  platinum: '#C9C7C2',
  ash: '#8A8891',
  slate: '#5C5A63',

  // ---- Inverted (type and glyphs on a white pill) -----------------------
  light: '#F7F5F2',
  onLight: '#0B0B0D',
  onLightMuted: '#5C5A63',

  // ---- Accents ----------------------------------------------------------
  azure: '#4C6FFF',
  iris: '#8B5CF6',
  blush: '#E5479B',
  amber: '#F5A05A',
  mint: '#3FB27F',
  /** Errors, cancellations, and nothing else. */
  crimsonBright: '#C4243A',
  gold: '#C8A24A',

  // ---- Glass ------------------------------------------------------------
  // rgba so these layer over a photograph or the 3D canvas without hiding it.
  glassFill: 'rgba(26, 26, 30, 0.58)',
  glassFillStrong: 'rgba(10, 10, 12, 0.78)',
  /** For a pane over a *bright* photo, where the strong fill still reads thin. */
  glassFillDense: 'rgba(8, 8, 10, 0.88)',
  glassBorder: 'rgba(247, 245, 242, 0.10)',
  glassBorderStrong: 'rgba(247, 245, 242, 0.18)',

  transparent: 'transparent',
};

/**
 * Multi-stop sweeps consumed by the `Gradient` primitive.
 *
 * `aurora` is the app's signature: one saturated ribbon reserved for the
 * highest-intent action on a screen, so colour never becomes decoration. The
 * rest are utilities — scrims that let white type sit on any photograph, and
 * the warm/cool washes that light the page behind the bento grid.
 */
export const gradients = {
  aurora: ['#4C6FFF', '#8B5CF6', '#E5479B', '#F5A05A'],
  /** Cooler half of aurora, for large fills where the full sweep is loud. */
  dusk: ['#2E3A8C', '#6D4BC7', '#B84A8E'],
  /** Transparent → dark: laid over an image so captions stay legible. */
  imageScrim: ['rgba(5, 5, 6, 0)', 'rgba(5, 5, 6, 0.55)', 'rgba(5, 5, 6, 0.94)'],
  /** Dark → transparent: the top edge of a full-bleed hero, under the chrome. */
  topScrim: ['rgba(5, 5, 6, 0.85)', 'rgba(5, 5, 6, 0.35)', 'rgba(5, 5, 6, 0)'],
  /** Barely-there sheen that gives a flat panel a lit top edge. */
  sheen: ['rgba(247, 245, 242, 0.09)', 'rgba(247, 245, 242, 0.01)'],
};

/**
 * Canvas / scene colors, kept alongside the UI palette so they stay in sync.
 * Garment colour comes from the GLB materials, so only the environment — clear
 * colour, fog, and the light rig — is themed here.
 */
export const sceneColors = {
  background: colors.ink,
  fog: colors.inkDeep,
  keyLight: '#FFFFFF',
  rimLight: colors.iris,
};

/**
 * One tint per order state. The lifecycle reads as a temperature ramp: amber
 * while the shop still owes an action, iris once it is moving, mint on
 * delivery, crimson on cancellation.
 */
export const statusColors = {
  PENDING: colors.amber,
  ACCEPTED: colors.amber,
  PACKED: colors.gold,
  READY_FOR_PICKUP: colors.iris,
  IN_TRANSIT: colors.azure,
  DELIVERED: colors.mint,
  CANCELLED: colors.crimsonBright,
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

export default colors;
