/**
 * Composed design tokens — type scale, motion, elevation, and gradients.
 *
 * colors.js holds raw values; this file holds the *decisions* made with them.
 * A screen should reach for a token here rather than inventing a font size, a
 * shadow, or an animation duration inline, so the whole app moves and reads as
 * one object.
 */

import { Easing, ReduceMotion } from 'react-native-reanimated';

import { colors } from './colors';

// ---------------------------------------------------------------------------
// Typography
//
// A luxury editorial voice: display sizes are light-weight with negative
// tracking (so large type reads as set, not as blown-up UI text), and small
// labels are wide-tracked uppercase (so they read as captions on a lookbook
// page). Line heights are baked in — a size without one leaves RN to guess and
// paragraphs end up cramped.
// ---------------------------------------------------------------------------

export const type = {
  /** Hero copy on the marketing beats and empty states. */
  display: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '300',
    letterSpacing: -0.8,
    color: colors.ivory,
  },
  /** Screen titles. */
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '300',
    letterSpacing: -0.5,
    color: colors.ivory,
  },
  /** Section headings and card headlines. */
  heading: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '400',
    letterSpacing: -0.2,
    color: colors.ivory,
  },
  /** Prominent row titles — product names, shop names. */
  subheading: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: -0.1,
    color: colors.ivory,
  },
  /** Default paragraph copy. */
  body: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400',
    color: colors.platinum,
  },
  /** Secondary copy and metadata. */
  bodySmall: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
    color: colors.ash,
  },
  /** The smallest readable line — timestamps, footnotes. */
  caption: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0.2,
    color: colors.slate,
  },
  /** Wide-tracked uppercase eyebrow above a heading. */
  eyebrow: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 2.6,
    color: colors.gold,
  },
  /** Uppercase label inside buttons and chips. */
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 1.6,
    color: colors.ivory,
  },
  /**
   * Numerals that sit in a column or update in place. `tabular-nums` stops a
   * changing price or countdown from reflowing as digit widths change.
   */
  numeric: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: colors.ivory,
    fontVariant: ['tabular-nums'],
  },
  numericLarge: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '300',
    letterSpacing: -1,
    color: colors.ivory,
    fontVariant: ['tabular-nums'],
  },
};

// ---------------------------------------------------------------------------
// Motion
//
// Two families, used for different jobs:
//  - `timing`  for anything with a definite start and end (fades, reveals)
//  - `spring`  for anything the finger caused (press, selection, arrival)
//
// Durations are short on purpose. Interface motion that outlasts ~350ms stops
// reading as responsiveness and starts reading as lag; only the decorative
// ambient loops (pulse, shimmer) run long.
// ---------------------------------------------------------------------------

export const duration = {
  instant: 90,
  fast: 160,
  base: 240,
  slow: 360,
  deliberate: 520,
  /** Ambient loops — a live pulse and the skeleton shimmer sweep. */
  pulse: 1600,
  shimmer: 1250,
};

export const easing = {
  /** Default for entrances: fast out of the gate, settles gently. */
  out: Easing.bezier(0.16, 1, 0.3, 1),
  /** Exits — leaves quickly rather than lingering. */
  in: Easing.bezier(0.7, 0, 0.84, 0),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  linear: Easing.linear,
};

/**
 * Spring presets. `damping` over `mass` is what separates them: `press` is
 * critically damped (no overshoot — a button that wobbles feels cheap), while
 * `bouncy` keeps a little overshoot for arrivals that should feel alive.
 */
export const spring = {
  press: { damping: 26, stiffness: 420, mass: 0.7 },
  gentle: { damping: 20, stiffness: 180, mass: 0.9 },
  bouncy: { damping: 13, stiffness: 190, mass: 0.9 },
  snappy: { damping: 22, stiffness: 320, mass: 0.8 },
};

/**
 * Every animation in the app passes `ReduceMotion.System`, so a user who has
 * turned motion down at the OS level gets the end state instead of the
 * transition. Spread this into a spring/timing config rather than remembering
 * the flag at each call site.
 */
export const reduceMotion = { reduceMotion: ReduceMotion.System };

/**
 * Stagger delay for the nth item of an entering list, capped so a long list
 * never leaves its tail waiting seconds to appear.
 */
export const STAGGER_STEP = 45;
export const STAGGER_CAP = 8;

export const stagger = (index, step = STAGGER_STEP) =>
  Math.min(index, STAGGER_CAP) * step;

// ---------------------------------------------------------------------------
// Elevation
//
// Shadow presets keyed by how far off the base surface a thing should read.
// Android only honours `elevation`, iOS only the shadow* family, so each preset
// carries both and callers never have to think about the platform.
// ---------------------------------------------------------------------------

const shadow = (height, radius, opacity, elevation, color = colors.glassShadow) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation,
});

export const elevation = {
  /** Flush with the base — used to *remove* a shadow a preset would inherit. */
  flat: shadow(0, 0, 0, 0),
  /** List rows and chips. */
  low: shadow(6, 14, 0.35, 4),
  /** Cards floating over the page. */
  medium: shadow(14, 24, 0.45, 10),
  /** Sheets, docked bars, and the app's chrome. */
  high: shadow(20, 34, 0.55, 18),
  /** The primary action — a crimson-tinted glow rather than a grey drop. */
  accent: shadow(10, 22, 0.5, 12, colors.crimson),
  /** Gold halo for provenance marks and the brand lockup. */
  gold: shadow(8, 20, 0.4, 10, colors.goldDeep),
};

// ---------------------------------------------------------------------------
// Gradients
//
// Stop arrays for <Gradient>. Kept here so a screen never hand-rolls a ramp and
// two surfaces that should match cannot drift apart.
// ---------------------------------------------------------------------------

export const gradients = {
  /** Page background — a barely-there lift from the top of the screen. */
  page: [colors.obsidianDeep, colors.obsidian],
  /** Card surface: charcoal that falls off toward the bottom edge. */
  surface: ['rgba(32, 32, 38, 0.85)', 'rgba(14, 14, 17, 0.92)'],
  /**
   * Chrome — headers, sheets, and docked action bars.
   *
   * Opaque on purpose. The app has no native backdrop blur, so a translucent
   * bar does not read as frosted glass: it lets whatever scrolls beneath it
   * ghost through as muddy shapes directly behind the price and the primary
   * action. The pane still separates from the page through its hairline
   * border, specular top edge, and shadow — depth without illegibility.
   *
   * Where chrome should genuinely be see-through (the marketing app bar over
   * the drone shot), the caller fades the whole layer in on scroll instead.
   */
  chrome: ['#08080A', '#0E0E12'],
  /** Legibility scrim laid over a photograph, transparent at the top. */
  imageScrim: [colors.scrimClear, 'rgba(5, 5, 6, 0.55)', 'rgba(5, 5, 6, 0.94)'],
  /** Same, inverted, for chrome that floats over the top of an image. */
  imageScrimTop: ['rgba(5, 5, 6, 0.72)', colors.scrimClear],
  /** The primary call to action. */
  crimson: [colors.crimsonGlow, colors.crimson],
  /** Pressed state of the primary CTA — the ramp darkens rather than dims. */
  crimsonPressed: [colors.crimson, '#6E1420'],
  /** Provenance / brand mark. */
  gold: [colors.goldBright, colors.gold, colors.goldDeep],
  /** Skeleton shimmer sweep. */
  shimmer: ['rgba(245, 243, 239, 0)', colors.shimmer, 'rgba(245, 243, 239, 0)'],
};

/** Minimum tappable square, per the platform accessibility guidelines. */
export const HIT_TARGET = 44;

export default { type, duration, easing, spring, elevation, gradients };
