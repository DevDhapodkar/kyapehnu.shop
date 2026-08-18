/**
 * Map a backend Product document to the flat shape the shopping UI renders.
 *
 * Pure and RN-free so it is unit-tested in plain Node and reused by the catalog
 * hook. The backend stores a list price plus an optional `discountPrice`, sizes
 * as `{size, stock}` objects, and the vendor as a populated ref; the UI wants a
 * single effective `price` (+ `mrp` only when discounted), flat size strings,
 * and the store denormalised onto the item.
 */
export const normalizeProduct = (p) => {
  if (!p) return null;

  const hasDiscount = p.discountPrice != null && p.discountPrice < p.price;
  const vendor = p.vendor && typeof p.vendor === 'object' ? p.vendor : null;

  return {
    id: p._id ?? p.id,
    name: p.name,
    description: p.description ?? '',
    department: p.category ?? null,
    type: p.subCategory ?? p.category ?? '',
    category: p.subCategory ?? p.category ?? '',
    price: hasDiscount ? p.discountPrice : p.price,
    mrp: hasDiscount ? p.price : undefined,
    colorway: Array.isArray(p.colors) && p.colors.length ? p.colors[0] : undefined,
    material: p.material,
    image: Array.isArray(p.images) && p.images.length ? p.images[0] : undefined,
    // In-stock sizes only, flattened to plain strings.
    sizes: Array.isArray(p.sizes)
      ? p.sizes.filter((s) => (s.stock ?? 1) > 0).map((s) => s.size)
      : [],
    storeId: vendor?._id ?? p.vendor ?? null,
    storeName: vendor?.shopName ?? 'Local shop',
    storeArea: vendor?.address?.area,
    // Per-user distance is computed on the device, not stored server-side.
    distanceKm: undefined,
  };
};

export const normalizeProducts = (list) =>
  (Array.isArray(list) ? list : []).map(normalizeProduct).filter(Boolean);

export default normalizeProduct;
