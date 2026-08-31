/**
 * Kya Pehnu? — spatial system.
 *
 * The app is built out of large, generously rounded panes of glass laid on a lit
 * page. Three things follow from that and are encoded here.
 *
 *  1. Radii are big and come in one family. A card is `radii.xl`, a tile inside
 *     it `radii.lg`, a chip `radii.pill`. Anything under `radii.sm` reads as a
 *     mistake next to the rest.
 *  2. Corners are *continuous*, not circular — see `CONTINUOUS`. This is the
 *     single loudest tell that separates an interface that looks native on iOS
 *     from one that looks like a Material app wearing a dark theme.
 *  3. Elevation is a light problem, not a border problem. A pane separates from
 *     the page by refracting it and catching a lit edge, and casts a wide, soft,
 *     nearly-black shadow rather than a tight dark one.
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
  /** Full-bleed sheets and the largest hero panels. */
  xxl: 44,
  /** Fully round — pills, avatars, circular icon buttons. */
  pill: 999,
};

/**
 * The squircle.
 *
 * Apple rounds corners with a continuous curvature ramp rather than a circular
 * arc, so the straight edge eases into the corner instead of meeting it at a
 * visible seam. At the radii above the difference is obvious, and it is most of
 * what makes a rounded rectangle read as iOS rather than as Android.
 *
 * `borderCurve` is iOS-only and ignored elsewhere, so this is spread onto every
 * rounded surface unconditionally.
 */
export const CONTINUOUS = { borderCurve: 'continuous' };

/**
 * Shadow presets. React Native takes iOS shadows and Android elevation from
 * separate props, so each preset carries both and screens spread one in rather
 * than tuning five numbers by hand.
 */
export const shadows = {
  // Warm, soft and low on a light ground — a near-black drop shadow that reads
  // as premium on dark reads as dirt on cream, so these are a warm brown at low
  // opacity, spread wide.
  /** Chips, small controls sitting on a pane. */
  low: {
    shadowColor: '#4A3728',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 3,
  },
  /** The default for a card on the page. */
  medium: {
    shadowColor: '#4A3728',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 8,
  },
  /** Docked bars and panels that float over content. */
  high: {
    shadowColor: '#4A3728',
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.16,
    shadowRadius: 46,
    elevation: 16,
  },
};

/**
 * Hit target floor. Anything a finger lands on is at least this tall, which is
 * what keeps the circular icon buttons from shrinking to a decorative size.
 */
export const TOUCH_SIZE = 44;
