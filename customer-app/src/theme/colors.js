/**
 * Kya Pehnu? — colour system (light).
 *
 * The app is a warm, light interface — soft peach and cream, lit from within,
 * the way the reference food app reads. Cards are panes of frosted white glass
 * over a warm wash; type is warm ink; colour is rationed to a single terracotta
 * accent.
 *
 * Token names are semantic, not literal, which is what lets the whole app flip
 * theme by editing this one file. `ivory` means "primary text", not "the colour
 * ivory" — so it is a dark warm ink here. `light` means "the loud solid
 * element" — a near-black pill on this light ground, the way the reference's
 * "Add to Cart" is. Read the names by their role, never by their dictionary
 * colour.
 *
 * Three text contexts, because a photograph does not obey the page:
 *  - **On the page** — `ivory`/`platinum`/`ash`/`slate`, warm ink on light.
 *  - **On a photo** — `onPhoto*`, near-white, for chrome laid directly over a
 *    dark garment shot or the map, where page ink would vanish.
 *  - **On the film** — `onScene*`, near-white, reserved for the dark 3D
 *    scrollytelling intro, which stays a dark island in a light app.
 */

export { CONTINUOUS, gutter, radii, shadows, spacing, TOUCH_SIZE } from './layout';

export const colors = {
  // ---- Ground -----------------------------------------------------------
  // Warm cream and peach. The backdrop lays a soft wash over this; on its own
  // it is the base paper the whole app sits on.
  /** The page. */
  ink: '#F3E7DB',
  /** A hair deeper — section insets, the recessed edge of things. */
  inkDeep: '#E9D8C9',
  /** Opaque cards, where a second layer of glass would turn to mush. */
  surface: '#FCF6EF',
  surfaceRaised: '#FFFFFF',
  surfaceHigh: '#F6ECE1',

  // ---- Text (on the page) -----------------------------------------------
  /** Primary type. Warm near-black, never pure #000 on a warm ground. */
  ivory: '#2B231D',
  /** Secondary type. */
  platinum: '#5F544A',
  /** Tertiary / muted labels. */
  ash: '#8C8073',
  /** Faint captions, placeholders. */
  slate: '#AC9F90',

  // ---- The loud solid element + its label -------------------------------
  // On a light ground the prominent pill is dark (the reference "Add to Cart").
  /** Solid prominent surfaces: primary pill, active tab, white-circle button. */
  light: '#241D18',
  /** Type/glyphs sitting on that dark solid. */
  onLight: '#FBF5EE',
  onLightMuted: '#B9AC9C',

  // ---- Text on a photograph ---------------------------------------------
  // A dark garment shot or the map does not follow the page. Chrome laid over
  // it stays near-white with a scrim beneath, the way LUMORA sets white type on
  // a room photo.
  onPhoto: '#FCF8F3',
  onPhotoMuted: 'rgba(252, 248, 243, 0.76)',

  // ---- Text on the film -------------------------------------------------
  // The scrollytelling intro is the one dark island. Its copy is near-white.
  scene: '#141110',
  sceneDeep: '#0C0A09',
  onScene: '#F6F0E8',
  onSceneMuted: '#B6AB9E',

  // ---- Accents ----------------------------------------------------------
  // Warm and restrained, deepened a step so they hold contrast on light. Mostly
  // seen as small tinted chips a few millimetres across.
  amber: '#C4863A',
  /** The signature accent — warm terracotta/coral, the app's one hue. */
  ember: '#C06A44',
  clay: '#B0543C',
  sage: '#6F8C5C',
  /** Errors, cancellations, and nothing else. */
  rose: '#BF5049',
  gold: '#A9863C',

  // ---- Backdrop light ---------------------------------------------------
  // The soft blooms behind the glass. On a light ground these are warm peach,
  // blush and apricot — the reference food app's wash — kept gentle so the page
  // reads as lit paper, not a poster.
  glowPeach: '#F6C79B',
  glowBlush: '#F2B7AE',
  glowApricot: '#F4CDA0',
  glowRose: '#EDB1C0',

  // ---- Glass ------------------------------------------------------------
  // Frosted *white* veils over a light backdrop blur — soft translucent cards,
  // the way the reference's panels read. Alpha is higher than a dark theme's:
  // on light, a card needs enough white to separate from the warm wash behind.
  /** Barely there — chips and controls that must not compete with a card. */
  glassThin: 'rgba(255, 255, 255, 0.34)',
  /** The default pane: cards, sheets, the dock. */
  glassRegular: 'rgba(255, 255, 255, 0.5)',
  /** Where a pane carries primary type and has to lift off a busy backdrop. */
  glassThick: 'rgba(255, 255, 255, 0.66)',
  /**
   * Glass laid over a photograph. A light frost lightens the dark garment
   * behind it just enough that warm ink type reads on top — the LUMORA caption
   * treatment.
   */
  glassOverImage: 'rgba(255, 255, 255, 0.58)',

  /** A recessed input well — a faint warm inset, darker than the card. */
  glassWell: 'rgba(70, 50, 36, 0.06)',

  /** Hairlines. Warm dark at low alpha on a light ground. */
  glassBorder: 'rgba(58, 44, 32, 0.1)',
  glassBorderStrong: 'rgba(58, 44, 32, 0.18)',

  transparent: 'transparent',
};

/**
 * Multi-stop sweeps consumed by the `Gradient` primitive.
 */
export const gradients = {
  /**
   * The conversion accent — a warm peach-into-terracotta sweep, the app's one
   * spot of colour, on the single highest-intent action per screen.
   */
  ember: ['#F0B27A', '#D9805A', '#BE5E42'],
  /** Warm peach fill, for identity discs (avatars, empty states). */
  dusk: ['#F4CBA1', '#E8A57C', '#D98763'],
  /**
   * Transparent → dark: laid over a photograph so near-white chrome stays
   * legible on it. Photo-overlaid text is light regardless of the page theme,
   * so this stays a dark scrim.
   */
  imageScrim: ['rgba(18, 14, 11, 0)', 'rgba(18, 14, 11, 0.35)', 'rgba(18, 14, 11, 0.82)'],
  /** Dark → transparent: the top edge of a full-bleed hero, under the chrome. */
  topScrim: ['rgba(18, 14, 11, 0.6)', 'rgba(18, 14, 11, 0.22)', 'rgba(18, 14, 11, 0)'],
  /**
   * The specular edge. On a light frosted pane the lit edge is a soft white
   * highlight along the top — gentler than a dark theme's, or it reads as a
   * grey smear on the cream.
   */
  specular: [
    'rgba(255, 255, 255, 0.7)',
    'rgba(255, 255, 255, 0.18)',
    'rgba(255, 255, 255, 0.0)',
  ],
};

/**
 * Canvas / scene colors for the 3D scrollytelling intro — the one dark island.
 * Kept dark on purpose: the film's frames are baked dark, and the copy over
 * them is near-white.
 */
export const sceneColors = {
  background: colors.scene,
  fog: colors.sceneDeep,
  keyLight: '#FFFFFF',
  rimLight: colors.ember,
};

/**
 * One tint per order state. A warm ramp: amber while the shop still owes an
 * action, ember and clay once it is moving, sage on delivery, rose on
 * cancellation.
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
