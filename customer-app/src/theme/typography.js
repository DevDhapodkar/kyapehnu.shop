/**
 * Kya Pehnu? — type scale.
 *
 * One voice, three registers:
 *
 *  - **Display** — wide-tracked uppercase, used once per screen for the line
 *    that names what you are looking at. It is the loudest thing in the
 *    interface, which is why it is heavy *and* wide rather than merely large.
 *  - **Titles** — tight, dense sans for card and section headings.
 *  - **Micro / eyebrow** — 10px uppercase with heavy tracking, doing the work
 *    that a label would do in a lighter interface.
 *
 * Every style is a plain object spread into a StyleSheet entry, so a screen can
 * override colour or margin without re-declaring size, weight and tracking.
 */

export const typography = {
  /** Hero line. Pair with `textTransform: 'uppercase'` at the call site. */
  display: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  /** Hero line where the copy runs long enough that 34 would wrap three times. */
  displaySm: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  h1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  h2: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  h3: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  bodyLg: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400',
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
  },
  caption: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '400',
  },
  /** Small uppercase label — chips, table labels, stat captions. */
  micro: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 1.6,
  },
  /** The widest tracking in the app: section eyebrows above a display line. */
  eyebrow: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    letterSpacing: 2.6,
  },
  /** Prices and stat values — tabular weight, no negative tracking. */
  numeric: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  /** The big number in a stat tile or an ETA block. */
  numericLg: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -1,
  },
  /** Label inside a pill button. */
  button: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
};

export default typography;
