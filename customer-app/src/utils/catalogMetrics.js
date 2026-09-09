/**
 * Utilities for boutique catalog metrics, stock status, and size calculations.
 */

export function calculateTotalUnits(sizes) {
  if (!Array.isArray(sizes) || sizes.length === 0) return 0;
  return sizes.reduce((sum, s) => {
    if (typeof s === 'object' && s !== null) {
      return sum + (typeof s.stock === 'number' ? s.stock : 0);
    }
    return sum + 5; // default fallback if unconfigured
  }, 0);
}

export function calculateCatalogValue(products) {
  if (!Array.isArray(products)) return 0;
  return products.reduce((sum, item) => {
    const units = calculateTotalUnits(item.sizes) || 1;
    const price = Number(item.price) || 0;
    return sum + price * units;
  }, 0);
}

export function filterCatalogItems(products, { stockFilter = 'ALL', selectedCategory = 'ALL', searchQuery = '' } = {}) {
  if (!Array.isArray(products)) return [];

  const query = searchQuery.trim().toLowerCase();

  return products.filter((it) => {
    const isAvail = Boolean(it.isAvailable ?? it.inStock);
    const matchesStock =
      stockFilter === 'ALL' ||
      (stockFilter === 'IN_STOCK' && isAvail) ||
      (stockFilter === 'OUT_OF_STOCK' && !isAvail);

    const matchesCat =
      selectedCategory === 'ALL' ||
      it.category?.toUpperCase() === selectedCategory;

    const matchesSearch =
      !query ||
      it.name?.toLowerCase().includes(query) ||
      it.subCategory?.toLowerCase().includes(query);

    return matchesStock && matchesCat && matchesSearch;
  });
}
