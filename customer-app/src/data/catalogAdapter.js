/**
 * Maps the backend Vendor + Product shapes onto the flat product shape the
 * storefront UI already consumes (the same shape `mockStores.productsByProximity`
 * produces), so swapping mock data for the live API needs no UI changes.
 *
 * Backend money is paise; the UI works in whole rupees, so selling price is
 * divided here. Products with no uploaded image fall back to a deterministic
 * placeholder (vendors cannot upload images yet).
 */

const placeholder = (seed) => `https://picsum.photos/seed/kp-${seed}/900/1200`;

const R = 6371; // km
const toRad = (d) => (d * Math.PI) / 180;

/** Haversine distance in km between two [lng, lat]-ish points. */
export const distanceKm = (fromLngLat, toLngLat) => {
  const [lng1, lat1] = fromLngLat;
  const [lng2, lat2] = toLngLat;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** Rough door-to-door ETA from distance: ~20 min base + 6 min/km. */
const etaFromDistance = (km) => Math.round(20 + km * 6);

/** One backend product (+ its vendor) → one UI catalogue item. */
export const adaptProduct = (product, vendor, customerCoords) => {
  const vendorCoords = vendor.location?.coordinates || [0, 0];
  const km = customerCoords ? distanceKm(customerCoords, vendorCoords) : 0;
  return {
    id: product._id,
    name: product.name,
    category: product.subCategory || product.category,
    price: Math.round((product.sellingPricePaise || 0) / 100),
    currency: 'INR',
    colorway: product.colors?.[0] || '',
    material: product.description || '',
    sizes: (product.sizes || []).map((s) => s.size),
    image: product.images?.[0] || placeholder(product._id),
    description: product.description || '',
    storeId: vendor._id,
    storeName: vendor.shopName,
    storeArea: vendor.address?.area || vendor.address?.city || 'Nagpur',
    storeCoordinates: { latitude: vendorCoords[1], longitude: vendorCoords[0] },
    distanceKm: Number(km.toFixed(1)),
    etaMinutes: etaFromDistance(km),
  };
};

/**
 * Flatten `[{ vendor, products }]` into a nearest-first product list matching
 * `productsByProximity`.
 */
export const adaptCatalog = (vendorsWithProducts, customerCoords) =>
  vendorsWithProducts
    .flatMap(({ vendor, products }) => products.map((p) => adaptProduct(p, vendor, customerCoords)))
    .sort((a, b) => a.distanceKm - b.distanceKm);
