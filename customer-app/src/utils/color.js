/**
 * Colour maths for the `Gradient` primitive.
 *
 * React Native has no native gradient, and the app deliberately ships no
 * gradient dependency: `expo-linear-gradient` is a native module, which would
 * cost a rebuild of every dev client for what is, at this size, pure paint.
 * `Gradient` instead lays down a run of flat bands, and this module is what
 * tells it what colour each band should be.
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
 * Linear blend of two colour strings.
 * @param {string} from
 * @param {string} to
 * @param {number} t 0 → `from`, 1 → `to`
 */
export function mixColors(from, to, t) {
  const a = parseColor(from);
  const b = parseColor(to);
  const ratio = clamp(t, 0, 1);

  return toRgba({
    r: a.r + (b.r - a.r) * ratio,
    g: a.g + (b.g - a.g) * ratio,
    b: a.b + (b.b - a.b) * ratio,
    a: a.a + (b.a - a.a) * ratio,
  });
}

/**
 * Sample an evenly-spaced multi-stop ramp.
 *
 * Stops are treated as equidistant, which is all the palette's ramps need and
 * keeps callers from having to hand-author offset arrays.
 *
 * @param {string[]} stops two or more colour strings
 * @param {number} t position along the ramp, 0 → 1
 */
export function sampleStops(stops, t) {
  if (!Array.isArray(stops) || stops.length === 0) return toRgba(OPAQUE_BLACK);
  if (stops.length === 1) return toRgba(parseColor(stops[0]));

  const position = clamp(t, 0, 1) * (stops.length - 1);
  // The final stop lands exactly on the last index, which would read past the
  // end of the array — clamp the segment so it blends from the penultimate one.
  const index = Math.min(Math.floor(position), stops.length - 2);

  return mixColors(stops[index], stops[index + 1], position - index);
}

/**
 * The band colours for a gradient of `steps` slices, sampled at each band's
 * centre so the ramp is symmetric across the fill.
 *
 * @param {string[]} stops
 * @param {number} steps
 * @returns {string[]}
 */
export function buildRamp(stops, steps) {
  const count = Math.max(2, Math.round(steps));
  return Array.from({ length: count }, (_, i) => sampleStops(stops, (i + 0.5) / count));
}
