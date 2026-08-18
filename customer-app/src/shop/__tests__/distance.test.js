import { haversineKm, roundKm, withDistance } from '../distance';

const NAGPUR = { latitude: 21.1458, longitude: 79.0882 };
const DHARAMPETH = { latitude: 21.135, longitude: 79.068 };

describe('haversineKm', () => {
  test('zero distance for the same point', () => {
    expect(haversineKm(NAGPUR, NAGPUR)).toBe(0);
  });

  test('a couple of km between nearby Nagpur points', () => {
    const km = haversineKm(NAGPUR, DHARAMPETH);
    expect(km).toBeGreaterThan(1);
    expect(km).toBeLessThan(4);
  });

  test('is symmetric', () => {
    expect(haversineKm(NAGPUR, DHARAMPETH)).toBeCloseTo(haversineKm(DHARAMPETH, NAGPUR), 6);
  });

  test('returns null when a coordinate is missing', () => {
    expect(haversineKm(NAGPUR, null)).toBeNull();
    expect(haversineKm(NAGPUR, { latitude: 21 })).toBeNull();
    expect(haversineKm(undefined, DHARAMPETH)).toBeNull();
  });

  test('matches a known long-distance value (Nagpur → Mumbai ≈ 680 km)', () => {
    const MUMBAI = { latitude: 19.076, longitude: 72.8777 };
    expect(haversineKm(NAGPUR, MUMBAI)).toBeGreaterThan(650);
    expect(haversineKm(NAGPUR, MUMBAI)).toBeLessThan(720);
  });
});

describe('roundKm', () => {
  test('rounds to one decimal', () => {
    expect(roundKm(2.345)).toBe(2.3);
    expect(roundKm(2.36)).toBe(2.4);
  });

  test('passes through null', () => {
    expect(roundKm(null)).toBeNull();
  });
});

describe('withDistance', () => {
  const origin = NAGPUR;
  const products = [
    { id: 'a', storeLocation: DHARAMPETH },
    { id: 'b', storeCoordinates: { latitude: 21.0972, longitude: 79.147 } }, // mock field name
    { id: 'c' }, // no location
  ];

  test('attaches a rounded distanceKm from storeLocation or storeCoordinates', () => {
    const out = withDistance(products, origin);
    expect(out[0].distanceKm).toBeGreaterThan(0);
    expect(out[1].distanceKm).toBeGreaterThan(0);
    expect(Number.isFinite(out[0].distanceKm)).toBe(true);
  });

  test('leaves products without a location untouched', () => {
    const out = withDistance(products, origin);
    expect(out[2].distanceKm).toBeUndefined();
  });

  test('does not mutate the input', () => {
    const snapshot = JSON.parse(JSON.stringify(products));
    withDistance(products, origin);
    expect(products).toEqual(snapshot);
  });

  test('tolerates a null product list', () => {
    expect(withDistance(null, origin)).toEqual([]);
  });
});
