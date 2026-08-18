import { normalizeProduct, normalizeProducts } from '../normalizeProduct';

const backendProduct = {
  _id: 'p1',
  name: 'Obsidian Shirt',
  description: 'A shirt.',
  category: 'MEN',
  subCategory: 'Shirts',
  price: 5600,
  discountPrice: 4200,
  sizes: [
    { size: 'S', stock: 3 },
    { size: 'M', stock: 0 },
    { size: 'L', stock: 5 },
  ],
  colors: ['Obsidian Black'],
  images: ['https://img/1.jpg'],
  isAvailable: true,
  vendor: { _id: 'v1', shopName: 'Atelier', address: { area: 'Dharampeth' } },
};

describe('normalizeProduct', () => {
  test('maps identity and taxonomy fields', () => {
    const p = normalizeProduct(backendProduct);
    expect(p.id).toBe('p1');
    expect(p.department).toBe('MEN');
    expect(p.type).toBe('Shirts');
  });

  test('uses discountPrice as price and list price as mrp when discounted', () => {
    const p = normalizeProduct(backendProduct);
    expect(p.price).toBe(4200);
    expect(p.mrp).toBe(5600);
  });

  test('no mrp when there is no discount', () => {
    const p = normalizeProduct({ ...backendProduct, discountPrice: null });
    expect(p.price).toBe(5600);
    expect(p.mrp).toBeUndefined();
  });

  test('ignores a discountPrice that is not actually lower', () => {
    const p = normalizeProduct({ ...backendProduct, discountPrice: 6000 });
    expect(p.price).toBe(5600);
    expect(p.mrp).toBeUndefined();
  });

  test('flattens only in-stock sizes to plain strings', () => {
    const p = normalizeProduct(backendProduct);
    expect(p.sizes).toEqual(['S', 'L']); // M has 0 stock
  });

  test('denormalises the populated vendor', () => {
    const p = normalizeProduct(backendProduct);
    expect(p.storeId).toBe('v1');
    expect(p.storeName).toBe('Atelier');
    expect(p.storeArea).toBe('Dharampeth');
  });

  test('handles an unpopulated vendor ref and missing media', () => {
    const p = normalizeProduct({ ...backendProduct, vendor: 'v1', images: [], colors: [] });
    expect(p.storeId).toBe('v1');
    expect(p.storeName).toBe('Local shop');
    expect(p.image).toBeUndefined();
    expect(p.colorway).toBeUndefined();
  });

  test('takes the first image and colour', () => {
    const p = normalizeProduct(backendProduct);
    expect(p.image).toBe('https://img/1.jpg');
    expect(p.colorway).toBe('Obsidian Black');
  });

  test('returns null for a nullish product', () => {
    expect(normalizeProduct(null)).toBeNull();
    expect(normalizeProduct(undefined)).toBeNull();
  });
});

describe('normalizeProducts', () => {
  test('maps a list and drops nullish entries', () => {
    expect(normalizeProducts([backendProduct, null]).map((p) => p.id)).toEqual(['p1']);
  });

  test('tolerates a non-array', () => {
    expect(normalizeProducts(undefined)).toEqual([]);
  });
});
