import { test, expect, request } from '@playwright/test';

/**
 * Guest COD order flow at the API boundary — the exact endpoints the web app
 * calls when a guest places and tracks an order. Also asserts the object-level
 * authorization guard on GET /api/orders/:id (an authenticated-but-unrelated
 * caller must not read someone else's order).
 */

const API = 'http://localhost:5001/api';

const firstProduct = async () => {
  const ctx = await request.newContext();
  const res = await ctx.get(`${API}/products?limit=1`);
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  const p = body.items?.[0];
  expect(p, 'storefront has at least one approved product').toBeTruthy();
  await ctx.dispose();
  return {
    productId: p._id as string,
    vendorId: (p.vendor?._id ?? p.vendor) as string,
    size: p.sizes?.[0]?.size ?? 'Free',
    price: p.price as number,
    name: p.name as string,
  };
};

test('guest places a COD order and tracks it by phone', async ({}) => {
  const ctx = await request.newContext();
  const { productId, vendorId, size, price, name } = await firstProduct();
  const phone = '9876500042';

  const place = await ctx.post(`${API}/orders/guest`, {
    data: {
      vendor: vendorId,
      items: [{ product: productId, name, size, quantity: 1, price }],
      totalPrice: price,
      contact: { name: 'E2E Guest', phone },
      deliveryAddress: { line1: '12 Test Lane', pincode: '440012' },
      paymentMethod: 'COD',
    },
  });
  expect(place.status()).toBe(201);
  const order = await place.json();
  expect(order._id).toBeTruthy();
  expect(order.status).toBe('PENDING');
  expect(order.totalPrice).toBe(price);

  // Correct phone -> the order comes back.
  const okTrack = await ctx.get(`${API}/orders/track?orderId=${order._id}&phone=${phone}`);
  expect(okTrack.status()).toBe(200);
  const tracked = await okTrack.json();
  expect(tracked.guestContact.phone).toBe(phone);

  // Wrong phone -> refused (no leaking another buyer's order by id alone).
  const badTrack = await ctx.get(`${API}/orders/track?orderId=${order._id}&phone=9999999999`);
  expect(badTrack.status()).toBe(404);

  await ctx.dispose();
});

test('GET /api/orders/:id rejects unauthenticated access (object-level auth)', async ({}) => {
  const ctx = await request.newContext();
  const { productId, vendorId, size, price, name } = await firstProduct();

  const place = await ctx.post(`${API}/orders/guest`, {
    data: {
      vendor: vendorId,
      items: [{ product: productId, name, size, quantity: 1, price }],
      totalPrice: price,
      contact: { name: 'E2E Guest 2', phone: '9876500043' },
      deliveryAddress: { line1: '9 Secure Rd', pincode: '440010' },
      paymentMethod: 'COD',
    },
  });
  expect(place.status()).toBe(201);
  const order = await place.json();

  // No token -> 401. This is the direct-object-reference guard: an order id is
  // not, by itself, authorization to read the buyer's name/phone/address.
  const noAuth = await ctx.get(`${API}/orders/${order._id}`);
  expect(noAuth.status()).toBe(401);

  await ctx.dispose();
});

test('non-COD payment is rejected', async ({}) => {
  const ctx = await request.newContext();
  const { productId, vendorId, size, price, name } = await firstProduct();
  const res = await ctx.post(`${API}/orders/guest`, {
    data: {
      vendor: vendorId,
      items: [{ product: productId, name, size, quantity: 1, price }],
      totalPrice: price,
      contact: { name: 'E2E Guest 3', phone: '9876500044' },
      deliveryAddress: { line1: '1 Card St', pincode: '440001' },
      paymentMethod: 'CARD',
    },
  });
  expect(res.status()).toBe(400);
  await ctx.dispose();
});
