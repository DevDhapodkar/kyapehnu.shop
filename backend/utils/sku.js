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

/**
 * Produce a SKU guaranteed not to collide with one already in the catalog.
 * Tries the short human-friendly form first; after `maxTries` clashes it
 * appends a base-36 timestamp — still readable, effectively unique — so a
 * caller writing behind a `unique` index never hits a duplicate-key error.
 * DB access is injected via `exists` so this stays pure and unit-testable.
 * @param {string} category
 * @param {(sku: string) => (boolean | Promise<boolean>)} exists true if taken
 * @param {{ maxTries?: number, rng?: () => number }} [opts]
 * @returns {Promise<string>}
 */
export const buildUniqueSku = async (
  category,
  exists,
  { maxTries = 10, rng = Math.random } = {}
) => {
  for (let i = 0; i < maxTries; i += 1) {
    const candidate = generateSku(category, rng);
    if (!(await exists(candidate))) return candidate;
  }
  const prefix = CATEGORY_PREFIX[category] || 'KP';
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
};

export const SKU_CATEGORY_PREFIXES = CATEGORY_PREFIX;
