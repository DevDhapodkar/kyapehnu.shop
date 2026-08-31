/**
 * Kya Pehnu? — colour system.
 *
 * Warm, calm, photographic — the reference interiors, not a neon night. The
 * app is built the way iOS builds a dark interface (a lit ground, everything
 * above it made of *material* rather than paint), but the ground is a warm
 * charcoal and the light in it is nearly colourless.
 *
 *  - **Ground** (`ink`, `inkDeep`) — the page. A warm grey-brown, not a cold
 *    blue-black: every neutral here carries a trace of warmth so the app reads
 *    as a lit room rather than a gaming HUD.
 *  - **Materials** (`glass*`) — translucent *white* veils laid over a real
 *    backdrop blur. This is the part people mean by glassmorphism: a frosted
 *    pane brightens what is behind it and picks up a lit edge.
 *  - **Solids** (`surface` → `surfaceHigh`) — the few places that must stay
 *    opaque: image placeholders, input wells, anything that would turn to mush
 *    with a second layer of glass behind it.
 *
 * Accent policy: colour is rationed hard. The reference spends almost none.
 *  - `light` (near-white) is the everyday primary: white pill, ink label.
 *  - `ember` is the single signature accent — a warm terracotta, used sparingly.
 *  - `glow*` are the backdrop's bloom colours. They are light, not surfaces —
 *    nothing is ever *filled* with them.
 *  - `statusColors` is the only other place a hue is allowed, and only to say
 *    where an order sits in its lifecycle.
 */

export { CONTINUOUS, gutter, radii, shadows, spacing, TOUCH_SIZE } from './layout';

export const colors = {
  // ---- Ground -----------------------------------------------------------
  // A warm charcoal, not a cold blue-black. The reference interiors read as
  // grey-brown — lit rooms, not a neon night — and every neutral here carries a
  // trace of warmth so the whole app feels like the LUMORA reference rather
  // than a gaming HUD.
  /** The page. */
  ink: '#15120F',
  /** Recessed wells — inputs, image placeholders. Darker than the page. */
  inkDeep: '#0D0B09',
  /** The few surfaces that must stay opaque behind glass. */
  surface: '#201C18',
  surfaceRaised: '#2A2520',
  surfaceHigh: '#37312A',

  // ---- Text -------------------------------------------------------------
  /** Primary type and anything that must read as "on". */
  ivory: '#F6F3EE',
  platinum: '#C8C3BB',
  ash: '#928B81',
  slate: '#645E56',

  // ---- Inverted (type and glyphs on a white pill) -----------------------
  light: '#F6F3EE',
  onLight: '#161310',
  onLightMuted: '#645E56',

  // ---- Accents ----------------------------------------------------------
  // Warm and restrained. The reference interfaces spend almost no colour —
  // a solid pill, a white pill, one quiet gradient — so these are muted on
  // purpose and mostly appear as small tinted chips a few millimetres across.
  amber: '#D8A15C',
  /** The signature warm accent — champagne/terracotta, the app's one hue. */
  ember: '#C97E54',
  clay: '#B96A57',
  sage: '#8AA079',
  /** Errors, cancellations, and nothing else. */
  rose: '#C36A63',
  gold: '#C2A059',

  // ---- Backdrop light ---------------------------------------------------
  // The room-light blooms behind the glass. Warm and nearly colourless — a
  // lamp thrown across a charcoal wall, not an aurora. Saturation is kept low
  // deliberately: the reference has no glowing colour field, and anything
  // brighter here turns the app back into a nightclub.
  glowChampagne: '#B39A78',
  glowTaupe: '#8C7B6A',
  glowClay: '#A6725A',
  glowUmber: '#6E5B4A',

  // ---- Glass ------------------------------------------------------------
  // White veils, not dark fills. Each of these is laid *over a real backdrop
  // blur* (see `GlassPanel`), which is what turns them from a flat wash into a
  // material. Alpha is deliberately low: the blur does the work, and a heavy
  // fill would hide the light the pane is supposed to be refracting.
  // Veils are a warm off-white, not pure white — over a warm charcoal ground
  // they read as the reference's warm frosted glass rather than cold grey.
  /** Barely there — chips and controls that must not compete with a card. */
  glassThin: 'rgba(246, 240, 232, 0.06)',
  /** The default pane: cards, sheets, the dock. */
  glassRegular: 'rgba(246, 240, 232, 0.10)',
  /** Where a pane carries primary type and has to lift off a busy backdrop. */
  glassThick: 'rgba(246, 240, 232, 0.15)',
  /**
   * The one *dark* material, for glass laid over a photograph. A white veil on
   * a bright garment washes the picture out; this holds the type instead.
   */
  glassOverImage: 'rgba(12, 10, 8, 0.5)',

  /**
   * A recessed well — inputs. Darker than the pane it sits in, so it reads as
   * somewhere to put something rather than as another layer of glass.
   */
  glassWell: 'rgba(0, 0, 0, 0.28)',

  /** Hairlines. iOS separators are far quieter than a Material divider. */
  glassBorder: 'rgba(246, 240, 232, 0.12)',
  glassBorderStrong: 'rgba(246, 240, 232, 0.24)',

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
  /**
   * The conversion accent. A short, warm sweep — champagne into terracotta —
   * not a trip round the hue wheel. The reference CTAs are mostly a solid pill;
   * where a gradient earns its place it stays inside one warm family so it
   * reads as brushed metal, not stock artwork.
   */
  ember: ['#E3B784', '#C97E54', '#A85B44'],
  /** Deeper and quieter, for large fills where the accent sweep would shout. */
  dusk: ['#3A2E26', '#5A4030', '#6E4B3A'],
  /** Transparent → dark: laid over an image so captions stay legible. */
  imageScrim: ['rgba(12, 10, 8, 0)', 'rgba(12, 10, 8, 0.5)', 'rgba(12, 10, 8, 0.92)'],
  /** Dark → transparent: the top edge of a full-bleed hero, under the chrome. */
  topScrim: ['rgba(12, 10, 8, 0.72)', 'rgba(12, 10, 8, 0.26)', 'rgba(12, 10, 8, 0)'],
  /**
   * The specular edge. Real glass catches a bright line where light enters the
   * top of the pane and falls away fast; this ramp is steep for that reason —
   * a linear fade reads as a grey wash, not as an edge catching light.
   */
  specular: [
    'rgba(255, 255, 255, 0.28)',
    'rgba(255, 255, 255, 0.05)',
    'rgba(255, 255, 255, 0.0)',
  ],
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
  rimLight: colors.ember,
};

/**
 * One tint per order state. The lifecycle reads as a warm ramp: amber while the
 * shop still owes an action, ember and clay once it is moving, sage on
 * delivery, rose on cancellation.
 */
export const statusColors = {
  PENDING: colors.amber,
  ACCEPTED: colors.amber,
  PACKED: colors.gold,
  READY_FOR_PICKUP: colors.ember,
  IN_TRANSIT: colors.clay,
  DELIVERED: colors.sage,
  CANCELLED: colors.rose,
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
