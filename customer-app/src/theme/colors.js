/**
 * Kya Pehnu? — colour system.
 *
 * The app is built the way iOS builds a dark interface: a lit ground, and
 * everything above it made of *material* rather than paint. There is one
 * wallpaper — a drift of coloured light (`AuroraBackdrop`) over near-black ink —
 * and every panel is a pane of glass refracting it.
 *
 *  - **Ground** (`ink`, `inkDeep`) — the page, and the only truly opaque thing
 *    under the chrome. Not pure black: a trace of blue keeps the blobs behind
 *    the glass from reading as grey smoke.
 *  - **Materials** (`glass*`) — translucent *white* veils laid over a real
 *    backdrop blur. This is the part people mean by glassmorphism: a frosted
 *    pane brightens what is behind it and picks up a lit edge. A dark fill over
 *    a blur just reads as a grey card, which is what this palette used to do.
 *  - **Solids** (`surface` → `surfaceHigh`) — the few places that must stay
 *    opaque: image placeholders, input wells, anything that would turn to mush
 *    with a second layer of glass behind it.
 *
 * Accent policy: the interface is monochrome, and saturation is a signal.
 *  - `gradients.aurora` is the conversion accent — the one sweep of colour in
 *    the chrome, reserved for the single most important action on a screen.
 *  - `light` (near-white) is the everyday primary: white pill, ink label.
 *  - `aurora*` are the backdrop's blob colours. They are light, not surfaces —
 *    nothing is ever *filled* with them.
 *  - `statusColors` is the only other place a hue is allowed, and only to say
 *    where an order sits in its lifecycle.
 */

export { CONTINUOUS, gutter, radii, shadows, spacing, TOUCH_SIZE } from './layout';

export const colors = {
  // ---- Ground -----------------------------------------------------------
  /** The page. A trace of blue, so the aurora reads as light and not smoke. */
  ink: '#07070C',
  /** Recessed wells — inputs, image placeholders. Darker than the page. */
  inkDeep: '#04040A',
  /** The few surfaces that must stay opaque behind glass. */
  surface: '#131319',
  surfaceRaised: '#1B1B23',
  surfaceHigh: '#26262F',

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
  // A cool family with one warm exception. Everything sits at a middling
  // saturation: fully-saturated hues on a dark interface read as a toy, and
  // these are mostly seen as small tinted chips a few millimetres across.
  azure: '#5A83F0',
  iris: '#8A6BE8',
  blush: '#D2649E',
  /** The one warm accent, and the only place gold is allowed. */
  amber: '#D9A05B',
  mint: '#4FB58E',

  // ---- Backdrop light ---------------------------------------------------
  // The aurora blooms. Deep and cool rather than bright: they are seen only
  // through frosted glass, and anything hotter stops reading as light and
  // starts reading as a colour field the interface is sitting on.
  //
  // There is deliberately no orange here. An amber bloom behind a white veil
  // turns the glass khaki, which is what made the product sheet look muddy.
  auroraIndigo: '#4654E5',
  auroraViolet: '#7E52E0',
  auroraTeal: '#2C89A6',
  auroraRose: '#BE5089',
  /** Errors, cancellations, and nothing else. */
  rose: '#D9556B',
  gold: '#C2A059',

  // ---- Glass ------------------------------------------------------------
  // White veils, not dark fills. Each of these is laid *over a real backdrop
  // blur* (see `GlassPanel`), which is what turns them from a flat wash into a
  // material. Alpha is deliberately low: the blur does the work, and a heavy
  // fill would hide the light the pane is supposed to be refracting.
  /** Barely there — chips and controls that must not compete with a card. */
  glassThin: 'rgba(255, 255, 255, 0.055)',
  /** The default pane: cards, sheets, the dock. */
  glassRegular: 'rgba(255, 255, 255, 0.085)',
  /** Where a pane carries primary type and has to lift off a busy backdrop. */
  glassThick: 'rgba(255, 255, 255, 0.13)',
  /**
   * The one *dark* material, for glass laid over a photograph. A white veil on
   * a bright garment washes the picture out; this holds the type instead.
   */
  glassOverImage: 'rgba(7, 7, 12, 0.55)',

  /**
   * A recessed well — inputs. Darker than the pane it sits in, so it reads as
   * somewhere to put something rather than as another layer of glass.
   */
  glassWell: 'rgba(0, 0, 0, 0.28)',

  /** Hairlines. iOS separators are far quieter than a Material divider. */
  glassBorder: 'rgba(255, 255, 255, 0.14)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.26)',

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
   * The conversion accent. Three stops, not four: the old ramp ran all the way
   * to orange, which put the entire hue wheel in one pill and read like stock
   * artwork. Indigo through violet to rose is a single sweep of one family.
   */
  aurora: ['#4A5BE8', '#7C5CE8', '#C4568F'],
  /** Deeper and quieter, for large fills where the accent sweep would shout. */
  dusk: ['#252C6B', '#4E3A96', '#7A3A76'],
  /** Transparent → dark: laid over an image so captions stay legible. */
  imageScrim: ['rgba(4, 4, 10, 0)', 'rgba(4, 4, 10, 0.55)', 'rgba(4, 4, 10, 0.94)'],
  /** Dark → transparent: the top edge of a full-bleed hero, under the chrome. */
  topScrim: ['rgba(4, 4, 10, 0.8)', 'rgba(4, 4, 10, 0.3)', 'rgba(4, 4, 10, 0)'],
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
  rimLight: colors.iris,
};

/**
 * One tint per order state. The lifecycle reads as a temperature ramp: amber
 * while the shop still owes an action, iris once it is moving, mint on
 * delivery, rose on cancellation.
 */
export const statusColors = {
  PENDING: colors.amber,
  ACCEPTED: colors.amber,
  PACKED: colors.gold,
  READY_FOR_PICKUP: colors.iris,
  IN_TRANSIT: colors.azure,
  DELIVERED: colors.mint,
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
