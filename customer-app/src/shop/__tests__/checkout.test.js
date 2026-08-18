import {
  buildOrders,
  emptyDelivery,
  groupByVendor,
  orderCount,
  toDeliveryParts,
  validateDelivery,
} from '../checkout';

const cart = [
  { productId: 'a', name: 'Shirt', size: 'M', price: 4200, quantity: 1, vendorUid: 'vend-1', storeId: 's1', storeName: 'Atelier' },
  { productId: 'b', name: 'Kurta', size: 'L', price: 3800, quantity: 2, vendorUid: 'vend-1', storeId: 's1', storeName: 'Atelier' },
  { productId: 'c', name: 'Dress', size: 'S', price: 8900, quantity: 1, vendorUid: 'vend-2', storeId: 's2', storeName: 'House' },
];

describe('groupByVendor', () => {
  test('splits the cart into one group per vendor', () => {
    const groups = groupByVendor(cart);
    expect(groups).toHaveLength(2);
    const atelier = groups.find((g) => g.vendorUid === 'vend-1');
    expect(atelier.items).toHaveLength(2);
    expect(atelier.subtotal).toBe(4200 + 3800 * 2);
  });

  test('groups items with no vendorUid by storeId', () => {
    const groups = groupByVendor([{ productId: 'x', price: 100, quantity: 1, storeId: 's9', storeName: 'Shop' }]);
    expect(groups).toHaveLength(1);
    expect(groups[0].vendorUid).toBeNull();
  });

  test('empty cart yields no groups', () => {
    expect(groupByVendor([])).toEqual([]);
  });
});

describe('orderCount', () => {
  test('is the number of distinct vendors', () => {
    expect(orderCount(cart)).toBe(2);
    expect(orderCount([])).toBe(0);
  });
});

describe('buildOrders', () => {
  const parts = {
    customer: { name: 'Priya', phone: '9876543210' },
    deliveryAddress: { line1: '3 Palm Rd', city: 'Nagpur', pincode: '440010' },
    customerUid: 'cust-1',
  };

  test('produces one PENDING order per vendor with mapped items', () => {
    const orders = buildOrders(cart, parts);
    expect(orders).toHaveLength(2);
    orders.forEach((o) => {
      expect(o.status).toBe('PENDING');
      expect(o.customerUid).toBe('cust-1');
      expect(o.customer).toEqual(parts.customer);
      expect(o.deliveryAddress).toEqual(parts.deliveryAddress);
    });
    const atelier = orders.find((o) => o.vendorUid === 'vend-1');
    expect(atelier.items).toEqual([
      { product: 'a', name: 'Shirt', size: 'M', quantity: 1, price: 4200 },
      { product: 'b', name: 'Kurta', size: 'L', quantity: 2, price: 3800 },
    ]);
    expect(atelier.totalPrice).toBe(4200 + 3800 * 2);
  });
});

describe('validateDelivery', () => {
  const good = { name: 'Priya', phone: '9876543210', line1: '3 Palm Rd', city: 'Nagpur', pincode: '440010' };

  test('accepts a complete form', () => {
    expect(validateDelivery(good).valid).toBe(true);
  });

  test('flags every missing/invalid field', () => {
    const { valid, errors } = validateDelivery(emptyDelivery());
    expect(valid).toBe(false);
    expect(Object.keys(errors).sort()).toEqual(['line1', 'name', 'phone', 'pincode']);
  });

  test('accepts +91 / 0 prefixed phones', () => {
    expect(validateDelivery({ ...good, phone: '+91 98765-43210' }).valid).toBe(true);
    expect(validateDelivery({ ...good, phone: '098765 43210' }).valid).toBe(true);
  });

  test('rejects a bad pincode', () => {
    expect(validateDelivery({ ...good, pincode: '012345' }).errors.pincode).toBeTruthy();
    expect(validateDelivery({ ...good, pincode: '12' }).errors.pincode).toBeTruthy();
  });
});

describe('toDeliveryParts', () => {
  test('trims and splits into customer + address', () => {
    const parts = toDeliveryParts({ name: '  Priya ', phone: ' 9876543210 ', line1: ' 3 Palm Rd ', city: '', pincode: '440010' });
    expect(parts.customer).toEqual({ name: 'Priya', phone: '9876543210' });
    expect(parts.deliveryAddress).toEqual({ line1: '3 Palm Rd', city: 'Nagpur', pincode: '440010' });
  });
});
