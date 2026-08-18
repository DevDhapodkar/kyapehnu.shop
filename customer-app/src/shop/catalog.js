import { DEPARTMENT } from '../data/mockStores';

/**
 * Catalogue logic for the shopping experience — pure and React-Native-free, so
 * the department tiles, the filter chips, and the product list all agree on what
 * "Men under ₹5,000, size M, nearest first" means, and every rule here is
 * unit-tested in plain Node.
 */

/**
 * The welcome page's top-level tiles, in display order. `blurb` is the tile
 * caption; the cover image is chosen at render time from a real product in the
 * department (see `departmentCover`) so tiles always show live stock.
 */
export const DEPARTMENTS = [
  { key: DEPARTMENT.MEN, label: 'Men', blurb: 'Shirts, kurtas, and winter layers.' },
  { key: DEPARTMENT.WOMEN, label: 'Women', blurb: 'Dresses, sarees, and tailoring.' },
  { key: DEPARTMENT.KIDS, label: 'Kids', blurb: 'Small sizes, hard-wearing cotton.' },
  { key: DEPARTMENT.WATCHES, label: 'Watches', blurb: 'Mechanical only. No quartz.' },
  { key: DEPARTMENT.ACCESSORIES, label: 'Accessories', blurb: 'Cuffs, bracelets, hardware.' },
];

export const departmentLabel = (key) =>
  DEPARTMENTS.find((d) => d.key === key)?.label ?? key;

/** First product image in a department, for the welcome tile. */
export const departmentCover = (key, products) =>
  products.find((p) => p.department === key)?.image ?? null;

/** How many in-stock pieces sit in a department. */
export const departmentCount = (key, products) =>
  products.filter((p) => p.department === key).length;

/** Sort options offered in the list header. */
export const SORTS = [
  { key: 'proximity', label: 'Nearest' },
  { key: 'priceAsc', label: 'Price ↑' },
  { key: 'priceDesc', label: 'Price ↓' },
  { key: 'discount', label: 'Biggest saving' },
];

const discountPct = (p) => (p.mrp && p.mrp > p.price ? (p.mrp - p.price) / p.mrp : 0);

const SORTERS = {
  proximity: (a, b) => a.distanceKm - b.distanceKm,
  priceAsc: (a, b) => a.price - b.price,
  priceDesc: (a, b) => b.price - a.price,
  discount: (a, b) => discountPct(b) - discountPct(a),
};

export const sortProducts = (products, sortKey = 'proximity') => {
  const sorter = SORTERS[sortKey] ?? SORTERS.proximity;
  // Copy first — never mutate the caller's array.
  return [...products].sort(sorter);
};

/**
 * The facets available for a set of products: the distinct types and sizes
 * present, and the price range. The filter sheet reads this so it only ever
 * offers chips that actually match something.
 */
export const getFacets = (products) => {
  const types = new Set();
  const sizes = new Set();
  let min = Infinity;
  let max = -Infinity;

  for (const p of products) {
    if (p.type) types.add(p.type);
    (p.sizes ?? []).forEach((s) => sizes.add(s));
    if (p.price < min) min = p.price;
    if (p.price > max) max = p.price;
  }

  return {
    types: [...types].sort(),
    sizes: [...sizes].sort(),
    price: {
      min: Number.isFinite(min) ? min : 0,
      max: Number.isFinite(max) ? max : 0,
    },
  };
};

export const emptyFilters = () => ({
  department: null, // null = all departments
  types: [], // OR within types
  sizes: [], // OR within sizes
  minPrice: null,
  maxPrice: null,
  query: '',
});

const matchesQuery = (product, query) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [product.name, product.type, product.colorway, product.storeName, product.category]
    .filter(Boolean)
    .some((field) => field.toLowerCase().includes(q));
};

/**
 * Apply a filter set to a product list. Filters combine with AND across facets
 * (department AND type AND size AND price AND query) and OR within a multi-select
 * facet (any of the chosen types, any of the chosen sizes).
 */
export const filterProducts = (products, filters = {}) => {
  const { department, types = [], sizes = [], minPrice, maxPrice, query = '' } = filters;

  return products.filter((p) => {
    if (department && p.department !== department) return false;
    if (types.length && !types.includes(p.type)) return false;
    if (sizes.length && !(p.sizes ?? []).some((s) => sizes.includes(s))) return false;
    if (minPrice != null && p.price < minPrice) return false;
    if (maxPrice != null && p.price > maxPrice) return false;
    if (!matchesQuery(p, query)) return false;
    return true;
  });
};

/** Convenience: filter then sort in one call. */
export const applyCatalog = (products, filters = {}, sortKey = 'proximity') =>
  sortProducts(filterProducts(products, filters), sortKey);

/** Count of active filters, for the "Filters (n)" button badge. */
export const activeFilterCount = (filters = {}) => {
  let n = 0;
  if (filters.department) n += 1;
  n += (filters.types?.length ?? 0);
  n += (filters.sizes?.length ?? 0);
  if (filters.minPrice != null || filters.maxPrice != null) n += 1;
  if (filters.query?.trim()) n += 1;
  return n;
};

export default applyCatalog;
