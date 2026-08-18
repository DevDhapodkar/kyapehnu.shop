import {
  activeFilterCount,
  applyCatalog,
  DEPARTMENTS,
  departmentCount,
  departmentCover,
  emptyFilters,
  filterProducts,
  getFacets,
  sortProducts,
} from '../catalog';

// A small synthetic catalogue keeps the tests independent of the mock data.
const products = [
  { id: 'a', name: 'Black Shirt', department: 'MEN', type: 'Shirts', price: 4000, mrp: 5000, sizes: ['S', 'M'], distanceKm: 3, colorway: 'Black', storeName: 'Atelier' },
  { id: 'b', name: 'Wool Coat', department: 'MEN', type: 'Outerwear', price: 9000, mrp: 9000, sizes: ['M', 'L'], distanceKm: 1, colorway: 'Grey', storeName: 'Atelier' },
  { id: 'c', name: 'Slip Dress', department: 'WOMEN', type: 'Dresses', price: 8000, mrp: 12000, sizes: ['S'], distanceKm: 2, colorway: 'Crimson', storeName: 'House' },
  { id: 'd', name: 'Kids Tee', department: 'KIDS', type: 'T-Shirts', price: 700, mrp: 1000, sizes: ['4-5Y'], distanceKm: 0.5, colorway: 'Navy', storeName: 'Campus' },
];

describe('filterProducts', () => {
  test('no filters returns everything', () => {
    expect(filterProducts(products, emptyFilters())).toHaveLength(4);
  });

  test('filters by department', () => {
    const men = filterProducts(products, { department: 'MEN' });
    expect(men.map((p) => p.id).sort()).toEqual(['a', 'b']);
  });

  test('filters by type (OR within types)', () => {
    const res = filterProducts(products, { types: ['Shirts', 'Dresses'] });
    expect(res.map((p) => p.id).sort()).toEqual(['a', 'c']);
  });

  test('filters by size (matches if any size overlaps)', () => {
    const res = filterProducts(products, { sizes: ['M'] });
    expect(res.map((p) => p.id).sort()).toEqual(['a', 'b']);
  });

  test('filters by price range', () => {
    const res = filterProducts(products, { minPrice: 1000, maxPrice: 8000 });
    expect(res.map((p) => p.id).sort()).toEqual(['a', 'c']);
  });

  test('search matches name, colour, type, or store', () => {
    expect(filterProducts(products, { query: 'crimson' }).map((p) => p.id)).toEqual(['c']);
    expect(filterProducts(products, { query: 'shirt' }).map((p) => p.id).sort()).toEqual(['a', 'd']);
  });

  test('combines facets with AND', () => {
    const res = filterProducts(products, { department: 'MEN', sizes: ['M'], maxPrice: 5000 });
    expect(res.map((p) => p.id)).toEqual(['a']);
  });
});

describe('sortProducts', () => {
  test('proximity: nearest first', () => {
    expect(sortProducts(products, 'proximity').map((p) => p.id)).toEqual(['d', 'b', 'c', 'a']);
  });

  test('price ascending and descending', () => {
    expect(sortProducts(products, 'priceAsc').map((p) => p.price)).toEqual([700, 4000, 8000, 9000]);
    expect(sortProducts(products, 'priceDesc').map((p) => p.price)).toEqual([9000, 8000, 4000, 700]);
  });

  test('discount: biggest saving first', () => {
    // c saves 33%, d saves 30%, a saves 20%, b saves 0%.
    expect(sortProducts(products, 'discount').map((p) => p.id)).toEqual(['c', 'd', 'a', 'b']);
  });

  test('does not mutate the input array', () => {
    const before = products.map((p) => p.id);
    sortProducts(products, 'priceDesc');
    expect(products.map((p) => p.id)).toEqual(before);
  });

  test('unknown sort key falls back to proximity', () => {
    expect(sortProducts(products, 'nonsense').map((p) => p.id)).toEqual(
      sortProducts(products, 'proximity').map((p) => p.id)
    );
  });
});

describe('getFacets', () => {
  test('collects distinct types, sizes, and the price range', () => {
    const facets = getFacets(products);
    expect(facets.types).toEqual(['Dresses', 'Outerwear', 'Shirts', 'T-Shirts']);
    expect(facets.sizes).toContain('M');
    expect(facets.price).toEqual({ min: 700, max: 9000 });
  });

  test('empty product set yields a zero price range', () => {
    expect(getFacets([]).price).toEqual({ min: 0, max: 0 });
  });
});

describe('applyCatalog', () => {
  test('filters then sorts', () => {
    const res = applyCatalog(products, { department: 'MEN' }, 'priceAsc');
    expect(res.map((p) => p.id)).toEqual(['a', 'b']);
  });
});

describe('activeFilterCount', () => {
  test('counts each active facet', () => {
    expect(activeFilterCount(emptyFilters())).toBe(0);
    // department(1) + types(1) + sizes(2) + price(1) + query(1) = 6
    expect(activeFilterCount({ department: 'MEN', types: ['Shirts'], sizes: ['M', 'L'], minPrice: 100, query: 'x' })).toBe(6);
  });
});

describe('department helpers', () => {
  test('DEPARTMENTS covers the five top-level tiles', () => {
    expect(DEPARTMENTS.map((d) => d.key)).toEqual(['MEN', 'WOMEN', 'KIDS', 'WATCHES', 'ACCESSORIES']);
  });

  test('departmentCount and departmentCover read from the product set', () => {
    expect(departmentCount('MEN', products)).toBe(2);
    expect(departmentCover('WOMEN', products)).toBeNull(); // no image field in fixtures
    expect(departmentCover('NONE', products)).toBeNull();
  });
});
