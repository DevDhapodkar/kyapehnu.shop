/**
 * Indian Couture & Atelier Fashion Color Palette
 * Curated shades inspired by Nagpur silk, khadi, and handloom traditions.
 */

export const COLOR_PALETTE = [
  { name: 'Obsidian Black', hex: '#121215' },
  { name: 'Pearl Ivory', hex: '#F9F6F0', border: '#D5CEC5' },
  { name: 'Crimson Red', hex: '#C4243A' },
  { name: 'Royal Maroon', hex: '#721B24' },
  { name: 'Heritage Gold', hex: '#D97706' },
  { name: 'Amber Ochre', hex: '#F59E0B' },
  { name: 'Peacock Teal', hex: '#0F766E' },
  { name: 'Emerald Green', hex: '#047857' },
  { name: 'Mint Sage', hex: '#10B981' },
  { name: 'Midnight Navy', hex: '#1E293B' },
  { name: 'Royal Indigo', hex: '#3730A3' },
  { name: 'Dusty Rose', hex: '#FB7185' },
  { name: 'Rani Pink', hex: '#BE185D' },
  { name: 'Terracotta Rust', hex: '#C2410C' },
  { name: 'Copper Bronze', hex: '#B45309' },
  { name: 'Slate Charcoal', hex: '#475569' },
  { name: 'Soft Lavender', hex: '#8B5CF6' },
  { name: 'Silver Pearl', hex: '#CBD5E1' },
];

export const KNOWN_COLOR_MAP = {
  obsidian: '#121215',
  black: '#121215',
  white: '#FFFFFF',
  ivory: '#F9F6F0',
  cream: '#FFFDD0',
  crimson: '#C4243A',
  red: '#C4243A',
  maroon: '#721B24',
  wine: '#722F37',
  gold: '#D97706',
  mustard: '#EAB308',
  amber: '#F59E0B',
  ochre: '#D97706',
  teal: '#0F766E',
  peacock: '#0F766E',
  emerald: '#047857',
  green: '#047857',
  sage: '#10B981',
  mint: '#10B981',
  navy: '#1E293B',
  blue: '#2563EB',
  indigo: '#3730A3',
  rose: '#FB7185',
  pink: '#BE185D',
  magenta: '#BE185D',
  rust: '#C2410C',
  terracotta: '#C2410C',
  bronze: '#B45309',
  copper: '#B45309',
  charcoal: '#475569',
  grey: '#64748B',
  gray: '#64748B',
  lavender: '#8B5CF6',
  purple: '#7C3AED',
  silver: '#CBD5E1',
};

/**
 * Normalizes any color representation (object, string, hex) into a standard `{ name, hex }`.
 * @param {any} color
 * @returns {{ name: string, hex: string }}
 */
export function normalizeColor(color) {
  if (!color) {
    return { name: 'Standard', hex: '#121215' };
  }

  if (typeof color === 'object' && color !== null) {
    const name = color.name || color.label || 'Custom Shade';
    const hex = color.hex || color.code || matchNameToHex(name);
    return { name, hex };
  }

  if (typeof color === 'string') {
    const trimmed = color.trim();
    if (trimmed.includes(':')) {
      const [namePart, hexPart] = trimmed.split(':');
      return {
        name: namePart.trim(),
        hex: hexPart.trim().startsWith('#') ? hexPart.trim() : `#${hexPart.trim()}`,
      };
    }

    if (trimmed.startsWith('#')) {
      const matched = COLOR_PALETTE.find((p) => p.hex.toLowerCase() === trimmed.toLowerCase());
      return {
        name: matched ? matched.name : trimmed,
        hex: trimmed,
      };
    }

    return {
      name: trimmed,
      hex: matchNameToHex(trimmed),
    };
  }

  return { name: String(color), hex: '#121215' };
}

function matchNameToHex(name) {
  const lower = (name || '').toLowerCase();
  for (const [key, hex] of Object.entries(KNOWN_COLOR_MAP)) {
    if (lower.includes(key)) {
      return hex;
    }
  }
  return '#121215';
}

export default COLOR_PALETTE;
