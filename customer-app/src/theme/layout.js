/**
 * Kya Pehnu? — spatial system.
 *
 * The redesign is built on bento cards: large, generously rounded panels laid
 * out on a dark page with real air between them. Two things follow from that
 * and are encoded here.
 *
 *  1. Radii are big and come in one family. A card is `radii.xl`, a tile inside
 *     it `radii.lg`, a chip `radii.pill`. Anything under `radii.sm` reads as a
 *     mistake next to the rest.
 *  2. Elevation is a colour problem, not a border problem. A panel separates
 *     from the page by being lighter and casting a soft shadow, so the shadow
 *     presets live beside the spacing rather than being re-typed per screen.
 *
 * No colour token is imported here on purpose — `colors.js` re-exports this
 * module, so a dependency in the other direction would be a cycle.
 */

export const spacing = {
  /** 4 — hairline gaps inside a chip. */
  xxs: 4,
  xs: 6,
  sm: 12,
  md: 20,
  lg: 32,
  xl: 48,
};

/** The page's left/right margin. Every full-bleed card stops here. */
export const gutter = spacing.md;

export const radii = {
  xs: 10,
  sm: 14,
  md: 20,
  lg: 28,
  xl: 36,
  /** Fully round — pills, avatars, circular icon buttons. */
  pill: 999,
};

/**
 * Shadow presets. React Native takes iOS shadows and Android elevation from
 * separate props, so each preset carries both and screens spread one in rather
 * than tuning five numbers by hand.
 */
export const shadows = {
  /** Chips, small controls sitting on a card. */
  low: {
    shadowColor: 'rgba(0, 0, 0, 0.55)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 4,
  },
  /** The default for a bento card on the page. */
  medium: {
    shadowColor: 'rgba(0, 0, 0, 0.65)',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5,
    shadowRadius: 26,
    elevation: 10,
  },
  /** Docked bars and panels that float over content. */
  high: {
    shadowColor: 'rgba(0, 0, 0, 0.75)',
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.55,
    shadowRadius: 38,
    elevation: 18,
  },
};

/**
 * Hit target floor. Anything a finger lands on is at least this tall, which is
 * what keeps the circular icon buttons from shrinking to a decorative size.
 */
export const TOUCH_SIZE = 44;
