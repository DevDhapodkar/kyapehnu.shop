/**
 * Kya Pehnu? — type scale.
 *
 * Sized against iOS. Apple's body text is 17pt, not the 14 that a web-derived
 * scale reaches for, and the difference is most of why an interface either
 * feels native on a phone or feels like a website in a shell. Everything here
 * steps off that: 17 for reading, 15 for secondary, 13 for captions, 11 for
 * labels.
 *
 * Two other habits are borrowed from SF:
 *  - **Tracking goes negative as type gets bigger.** Large text on iOS is set
 *    tight; wide tracking on a headline is a Material tell. Only the small
 *    uppercase labels track positive, and gently.
 *  - **No font family is named.** Leaving it unset gives SF Pro on iOS and
 *    Roboto on Android — the face the platform actually wants. Naming a family
 *    here would opt the app out of the system font it should be using.
 *
 * Every style is a plain object spread into a StyleSheet entry, so a screen can
 * override colour or margin without re-declaring size, weight and tracking.
 */

export const typography = {
  /**
   * The marketing hero, and nothing else. Set tight and heavy so it reads as
   * one mass rather than a row of words.
   */
  display: {
    fontSize: 40,
    lineHeight: 43,
    fontWeight: '800',
    letterSpacing: -1.4,
  },
  displaySm: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.9,
  },
  /** iOS large title — the top of a scrolling screen. */
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    letterSpacing: -0.9,
  },
  h1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  /** iOS body. The default for anything meant to be read. */
  bodyLg: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.4,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
    letterSpacing: -0.24,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: -0.08,
  },
  /** Small label — chips, table labels, stat captions. */
  micro: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  /**
   * Section eyebrow. Uppercase, but tracked at iOS's grouped-list weight rather
   * than the 2.5pt sprawl that reads as a fashion lookbook.
   */
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  /** Prices and stat values. */
  numeric: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  /** The big number in a stat tile or an ETA block. */
  numericLg: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -1.2,
  },
  /** Label inside a pill button. */
  button: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
};

export default typography;
