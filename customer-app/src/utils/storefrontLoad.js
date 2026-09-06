/**
 * Decide what the storefront catalogue should show after a fetch attempt.
 * Never injects mockStores — empty/error must be honest empty/error UI.
 *
 * @param {{ items?: Array, error?: Error|string, mapItem?: (p: any) => any }} input
 */
export function resolveStorefrontLoadResult({ items, error, mapItem } = {}) {
  if (error) {
    const message =
      typeof error === 'string'
        ? error
        : error?.message || 'Could not load the live catalogue.';
    return { ok: false, products: [], error: message, source: 'error' };
  }

  const list = Array.isArray(items) ? items : [];
  const map = typeof mapItem === 'function' ? mapItem : (p) => p;
  return {
    ok: true,
    products: list.map(map),
    error: null,
    source: 'api',
  };
}
