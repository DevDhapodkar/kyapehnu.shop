/**
 * Colour maths behind the app's gradients.
 *
 * The app ships no gradient dependency: `expo-linear-gradient` is a native
 * module, which would cost a rebuild of every dev client for what is, at this
 * size, pure paint. Instead `Gradient` and `Glow` hand the platform a CSS
 * gradient string — React Native 0.86 renders one through
 * `experimental_backgroundImage`, the browser through `backgroundImage` — and
 * this module builds those strings from the palette's colour tokens.
 *
 * Only the two notations the palette actually uses are parsed — `#rgb`/`#rrggbb`
 * and `rgb()`/`rgba()`. An unrecognised value degrades to opaque black rather
 * than throwing, so a typo in a palette entry cannot crash a screen.
 */

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const FUNCTIONAL = /^rgba?\(([^)]+)\)$/i;

const OPAQUE_BLACK = { r: 0, g: 0, b: 0, a: 1 };

const clamp = (value, min, max) => (value < min ? min : value > max ? max : value);

/**
 * Parse a CSS colour string into channel values.
 * @param {string} value
 * @returns {{ r: number, g: number, b: number, a: number }}
 */
export function parseColor(value) {
  if (typeof value !== 'string') return OPAQUE_BLACK;

  const input = value.trim();

  const hex = input.match(HEX);
  if (hex) {
    const digits = hex[1];
    // #abc is shorthand for #aabbcc.
    const full =
      digits.length === 3
        ? digits
            .split('')
            .map((d) => d + d)
            .join('')
        : digits;

    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
      a: 1,
    };
  }

  const functional = input.match(FUNCTIONAL);
  if (functional) {
    const parts = functional[1].split(',').map((part) => Number(part.trim()));
    if (parts.length < 3 || parts.slice(0, 3).some((n) => !Number.isFinite(n))) {
      return OPAQUE_BLACK;
    }

    return {
      r: clamp(parts[0], 0, 255),
      g: clamp(parts[1], 0, 255),
      b: clamp(parts[2], 0, 255),
      a: Number.isFinite(parts[3]) ? clamp(parts[3], 0, 1) : 1,
    };
  }

  return OPAQUE_BLACK;
}

/** Render channel values back to a string React Native accepts. */
export function toRgba({ r, g, b, a }) {
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${Number(a.toFixed(3))})`;
}

/**
 * The same colour at a given alpha.
 *
 * @param {string} value any colour this module can parse
 * @param {number} alpha 0 → 1
 * @returns {string}
 */
export function withAlpha(value, alpha) {
  const { r, g, b } = parseColor(value);
  return toRgba({ r, g, b, a: clamp(alpha, 0, 1) });
}

/**
 * A CSS `radial-gradient()` that fades one colour out to nothing.
 *
 * This is how every soft bloom in the app is drawn — the backdrop's blooms and
 * the lit corner of a card. The alternative, a stack of concentric translucent
 * discs, is what a renderer without gradients has to do, and it shows: every
 * ring edge is a visible step. `circle closest-side` puts the falloff exactly
 * at the edge of a square container, so the bloom neither clips nor stops
 * short.
 *
 * @param {string} color
 * @param {number} intensity alpha at the centre, 0 → 1
 * @returns {string}
 */
export function toCssBloom(color, intensity) {
  const core = withAlpha(color, intensity);
  const mid = withAlpha(color, intensity * 0.35);
  const edge = withAlpha(color, 0);

  // Three stops, not two: a linear falloff from centre to edge reads as a
  // flat-ish disc, while an early knee gives the soft shoulder real light has.
  return `radial-gradient(circle closest-side at 50% 50%, ${core} 0%, ${mid} 45%, ${edge} 100%)`;
}

/**
 * A CSS `linear-gradient()` for an evenly-spaced ramp.
 *
 * The same string drives both platforms: React Native 0.86 accepts it on
 * `experimental_backgroundImage`, and the browser on `backgroundImage`. Stops
 * are emitted without explicit offsets, which both engines read as "distribute
 * evenly" — the spacing this palette's ramps already assume.
 *
 * A single stop is emitted twice, because `linear-gradient(colour)` is invalid
 * and would silently drop the whole declaration.
 *
 * @param {string[]} stops two or more colour strings
 * @param {'horizontal' | 'vertical'} direction
 * @returns {string}
 */
export function toCssGradient(stops, direction = 'horizontal') {
  const list = Array.isArray(stops) && stops.length ? stops : ['#000000'];
  const ramp = list.length === 1 ? [list[0], list[0]] : list;
  const angle = direction === 'horizontal' ? 'to right' : 'to bottom';

  return `linear-gradient(${angle}, ${ramp.join(', ')})`;
}
