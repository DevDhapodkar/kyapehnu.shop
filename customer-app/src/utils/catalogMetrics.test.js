import { describe, expect, it } from 'bun:test';
import {
  calculateCatalogValue,
  calculateTotalUnits,
  filterCatalogItems,
} from './catalogMetrics';

describe('catalogMetrics', () => {
  it('calculateTotalUnits correctly sums stock across size objects', () => {
    const sizes = [
      { size: 'S', stock: 5 },
      { size: 'M', stock: 8 },
      { size: 'L', stock: 5 },
    ];
    expect(calculateTotalUnits(sizes)).toBe(18);
  });

  it('calculateTotalUnits handles empty or null sizes safely', () => {
    expect(calculateTotalUnits([])).toBe(0);
    expect(calculateTotalUnits(null)).toBe(0);
  });

  it('calculateCatalogValue accurately computes total retail stock value', () => {
    const products = [
      {
        _id: 'p1',
        price: 4999,
        sizes: [
          { size: 'S', stock: 2 },
          { size: 'M', stock: 3 },
        ],
      },
      {
        _id: 'p2',
        price: 1500,
        sizes: [
          { size: 'XL', stock: 4 },
        ],
      },
    ];
    // p1: 4999 * 5 = 24995
    // p2: 1500 * 4 = 6000
    // Total = 30995
    expect(calculateCatalogValue(products)).toBe(30995);
  });

  it('filterCatalogItems filters by stock availability, category, and search query', () => {
    const items = [
      { _id: '1', name: 'Chanderi Silk Anarkali', category: 'WOMEN', isAvailable: true },
      { _id: '2', name: 'Linen Kurta', category: 'MEN', isAvailable: false },
      { _id: '3', name: 'Cotton Crop Top', category: 'WOMEN', isAvailable: true },
    ];

    // Filter by stock: IN_STOCK
    const inStock = filterCatalogItems(items, { stockFilter: 'IN_STOCK' });
    expect(inStock.length).toBe(2);
    expect(inStock.map((i) => i._id)).toEqual(['1', '3']);

    // Filter by category: MEN
    const menItems = filterCatalogItems(items, { selectedCategory: 'MEN' });
    expect(menItems.length).toBe(1);
    expect(menItems[0]._id).toBe('2');

    // Filter by search query
    const searchMatch = filterCatalogItems(items, { searchQuery: 'anarkali' });
    expect(searchMatch.length).toBe(1);
    expect(searchMatch[0]._id).toBe('1');

    // Filter by OUT_OF_STOCK
    const outOfStock = filterCatalogItems(items, { stockFilter: 'OUT_OF_STOCK' });
    expect(outOfStock.length).toBe(1);
    expect(outOfStock[0]._id).toBe('2');
  });
});
