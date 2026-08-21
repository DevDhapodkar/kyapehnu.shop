// Catalog moderation lifecycle. A vendor-submitted listing waits in PENDING_QC
// until an admin approves it; only APPROVED products reach customers.

export const PRODUCT_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_QC: 'PENDING_QC',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ARCHIVED: 'ARCHIVED',
};

export const PRODUCT_STATUSES = Object.values(PRODUCT_STATUS);

export const PRODUCT_SOURCE = {
  APP: 'APP',
  WHATSAPP: 'WHATSAPP',
  ADMIN: 'ADMIN',
};

export const PRODUCT_SOURCES = Object.values(PRODUCT_SOURCE);

// Fields whose change alters what the buyer sees enough to require re-review.
// Stock and availability toggles stay live so a shop can react instantly.
const REQUALIFYING_FIELDS = new Set([
  'name',
  'description',
  'category',
  'subCategory',
  'images',
  'colors',
]);

/**
 * Does this vendor update push an APPROVED product back into QC? A price change
 * only re-qualifies past a 20% swing (docs/02-INTEGRATIONS.md).
 * @param {Record<string, unknown>} update
 * @param {{ price?: number }} [current]
 * @returns {boolean}
 */
export const requiresRequalification = (update = {}, current = {}) => {
  for (const key of Object.keys(update)) {
    if (REQUALIFYING_FIELDS.has(key)) return true;
  }
  if (typeof update.price === 'number' && typeof current.price === 'number' && current.price > 0) {
    const delta = Math.abs(update.price - current.price) / current.price;
    if (delta > 0.2) return true;
  }
  return false;
};

/**
 * Only an admin decision moves a product to a terminal review state.
 * @param {'APPROVE' | 'REJECT'} decision
 * @returns {'APPROVED' | 'REJECTED'}
 */
export const statusForReview = (decision) => {
  if (decision === 'APPROVE') return PRODUCT_STATUS.APPROVED;
  if (decision === 'REJECT') return PRODUCT_STATUS.REJECTED;
  const err = new Error(`Unknown review decision: ${decision}`);
  err.status = 400;
  throw err;
};
