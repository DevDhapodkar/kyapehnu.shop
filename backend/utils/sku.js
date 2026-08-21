// Human-friendly SKUs printed in every vendor message (docs/02-INTEGRATIONS.md).
// Never expose an ObjectId to a shopkeeper.

const CATEGORY_PREFIX = {
  MEN: 'MN',
  WOMEN: 'WM',
  KIDS: 'KD',
  UNISEX: 'UX',
};

/**
 * Build a short SKU like `WM-4821`. Randomness is injectable so the value is
 * deterministic under test.
 * @param {string} category
 * @param {() => number} [rng] returns [0,1)
 * @returns {string}
 */
export const generateSku = (category, rng = Math.random) => {
  const prefix = CATEGORY_PREFIX[category] || 'KP';
  const suffix = String(Math.floor(rng() * 9000) + 1000); // 1000–9999
  return `${prefix}-${suffix}`;
};

export const SKU_CATEGORY_PREFIXES = CATEGORY_PREFIX;
