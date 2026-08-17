/**
 * Mock catalogue — five independent fashion retailers in Nagpur.
 *
 * This stands in for the `/vendors` + `/products` endpoints described in
 * ARCHITECTURE.md until the Express + MongoDB backend is wired up. Shapes here
 * intentionally mirror the planned Vendor and Product schemas so swapping the
 * import for a fetch later is a one-line change.
 *
 * Coordinates are real Nagpur neighbourhoods (Dharampeth, Sitabuldi, Ramdaspeth,
 * Civil Lines, and the Wathoda belt near Symbiosis Institute of Technology) so
 * the distance sort and the live-tracking map both look plausible in demos.
 *
 * Image URLs point at a deterministic placeholder service: the same seed always
 * returns the same photo, so the UI stays stable between reloads.
 */

const img = (seed) => `https://picsum.photos/seed/kyapehnu-${seed}/900/1200`;

export const CATEGORIES = {
  APPAREL: 'Premium Apparel',
  CUFFS: "Men's Arm Cuffs",
  WATCHES: 'Automatic Watches',
};

/** Nagpur city centre — used as the default map region before GPS resolves. */
export const NAGPUR_CENTER = {
  latitude: 21.1458,
  longitude: 79.0882,
};

export const mockStores = [
  {
    id: 'str_dharampeth_atelier',
    name: 'Atelier Dharampeth',
    area: 'Dharampeth',
    addressLine: 'Shop 14, WHC Road, Dharampeth, Nagpur 440010',
    coordinates: { latitude: 21.135, longitude: 79.068 },
    rating: 4.8,
    ratingCount: 412,
    distanceKm: 1.4,
    etaMinutes: 38,
    tagline: 'Tailored cotton and evening shirting since 1994.',
    products: [
      {
        id: 'prd_obsidian_shirt',
        name: 'Obsidian Evening Shirt',
        category: CATEGORIES.APPAREL,
        price: 4200,
        mrp: 5600,
        currency: 'INR',
        colorway: 'Obsidian Black',
        material: '2-ply Giza cotton, mother-of-pearl buttons',
        sizes: ['S', 'M', 'L', 'XL'],
        image: img('obsidian-shirt'),
        description:
          'Cut long in the body and narrow through the sleeve, finished with a hand-rolled placket. Made two streets from where it is delivered.',
      },
      {
        id: 'prd_charcoal_overshirt',
        name: 'Charcoal Wool Overshirt',
        category: CATEGORIES.APPAREL,
        price: 6900,
        mrp: 8400,
        currency: 'INR',
        colorway: 'Charcoal Melange',
        material: 'Merino-blend flannel',
        sizes: ['M', 'L', 'XL'],
        image: img('charcoal-overshirt'),
        description:
          'A shirt heavy enough to be a jacket. Unstructured shoulder, patch pockets, and a Nagpur-winter weight that never needs a lining.',
      },
      {
        id: 'prd_ivory_kurta',
        name: 'Ivory Silk-Cotton Kurta',
        category: CATEGORIES.APPAREL,
        price: 3800,
        mrp: 4600,
        currency: 'INR',
        colorway: 'Raw Ivory',
        material: 'Silk-cotton, hand-finished hem',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        image: img('ivory-kurta'),
        description:
          'Straight fall, side slits, no embroidery. The kind of plain that reads expensive across a lit room.',
      },
    ],
  },
  {
    id: 'str_sitabuldi_thread',
    name: 'Thread & Bone, Sitabuldi',
    area: 'Sitabuldi',
    addressLine: 'First Floor, Main Road, Sitabuldi, Nagpur 440012',
    coordinates: { latitude: 21.1458, longitude: 79.0882 },
    rating: 4.6,
    ratingCount: 289,
    distanceKm: 2.7,
    etaMinutes: 45,
    tagline: 'Leather cuffs, cord bracelets, and hardware for the wrist.',
    products: [
      {
        id: 'prd_gunmetal_cuff',
        name: 'Gunmetal Arm Cuff',
        category: CATEGORIES.CUFFS,
        price: 2400,
        mrp: 3100,
        currency: 'INR',
        colorway: 'Brushed Gunmetal',
        material: 'Stainless steel, matte PVD coat',
        sizes: ['Adjustable'],
        image: img('gunmetal-cuff'),
        description:
          'An open-back cuff that sits above the wrist bone. Weighted enough to stay put under a rolled sleeve.',
      },
      {
        id: 'prd_blackened_leather_cuff',
        name: 'Blackened Leather Wrap Cuff',
        category: CATEGORIES.CUFFS,
        price: 1650,
        mrp: 2200,
        currency: 'INR',
        colorway: 'Oil-Black',
        material: 'Full-grain buffalo leather, antique brass stud',
        sizes: ['S/M', 'L/XL'],
        image: img('leather-cuff'),
        description:
          'Double wrap, single stud closure. The leather darkens where you wear it and lightens where you do not.',
      },
      {
        id: 'prd_bronze_torque_cuff',
        name: 'Bronze Torque Cuff',
        category: CATEGORIES.CUFFS,
        price: 3300,
        mrp: 3900,
        currency: 'INR',
        colorway: 'Aged Bronze',
        material: 'Solid cast bronze',
        sizes: ['Adjustable'],
        image: img('bronze-cuff'),
        description:
          'Cast in a single piece and filed by hand, so no two close the same way. Sold by the shop that makes it.',
      },
    ],
  },
  {
    id: 'str_ramdaspeth_horology',
    name: 'Ramdaspeth Horology Co.',
    area: 'Ramdaspeth',
    addressLine: 'Ground Floor, Palm Road, Ramdaspeth, Nagpur 440010',
    coordinates: { latitude: 21.131, longitude: 79.074 },
    rating: 4.9,
    ratingCount: 531,
    distanceKm: 1.9,
    etaMinutes: 41,
    tagline: 'Mechanical watches only. No quartz on the shelf.',
    products: [
      {
        id: 'prd_diver_automatic',
        name: 'Skin-Diver Automatic 200M',
        category: CATEGORIES.WATCHES,
        price: 28500,
        mrp: 34000,
        currency: 'INR',
        colorway: 'Matte Black / Steel',
        material: '316L steel case, sapphire crystal, 24-jewel automatic movement',
        sizes: ['38mm', '41mm'],
        image: img('diver-automatic'),
        description:
          'Screw-down crown, 120-click unidirectional bezel, and a 41-hour power reserve. Regulated in-store before it leaves the counter.',
      },
      {
        id: 'prd_field_automatic',
        name: 'Field Automatic — Sandblast Dial',
        category: CATEGORIES.WATCHES,
        price: 21900,
        mrp: 25500,
        currency: 'INR',
        colorway: 'Slate Sandblast',
        material: 'Steel case, domed hardlex, 21-jewel automatic movement',
        sizes: ['36mm', '39mm'],
        image: img('field-automatic'),
        description:
          'Hand-wound and hackable. A sandblasted dial that kills glare and a strap you can soak without thinking.',
      },
      {
        id: 'prd_dress_automatic',
        name: 'Ivory Dial Dress Automatic',
        category: CATEGORIES.WATCHES,
        price: 33200,
        mrp: 39900,
        currency: 'INR',
        colorway: 'Ivory / Rose Steel',
        material: 'Steel case, exhibition caseback, 24-jewel automatic movement',
        sizes: ['37mm', '40mm'],
        image: img('dress-automatic'),
        description:
          'Seven millimetres thin with an open caseback, so the rotor stays visible under a cuff that never quite covers it.',
      },
    ],
  },
  {
    id: 'str_civillines_house',
    name: 'House of Civil Lines',
    area: 'Civil Lines',
    addressLine: 'Bungalow 6, Civil Lines, Nagpur 440001',
    coordinates: { latitude: 21.155, longitude: 79.07 },
    rating: 4.7,
    ratingCount: 198,
    distanceKm: 3.2,
    etaMinutes: 49,
    tagline: 'Occasion wear from a single-room studio.',
    products: [
      {
        id: 'prd_crimson_slip',
        name: 'Crimson Bias-Cut Slip Dress',
        category: CATEGORIES.APPAREL,
        price: 8900,
        mrp: 11500,
        currency: 'INR',
        colorway: 'Deep Crimson',
        material: 'Silk crepe, French seams',
        sizes: ['XS', 'S', 'M', 'L'],
        image: img('crimson-slip'),
        description:
          'Cut on the bias so it moves before you do. One colour, one length, no variations — the studio only makes it in crimson.',
      },
      {
        id: 'prd_midnight_blazer',
        name: 'Midnight Unstructured Blazer',
        category: CATEGORIES.APPAREL,
        price: 12400,
        mrp: 15800,
        currency: 'INR',
        colorway: 'Midnight',
        material: 'Wool-linen, half-canvas front',
        sizes: ['S', 'M', 'L', 'XL'],
        image: img('midnight-blazer'),
        description:
          'Soft shoulder, working cuffs, and a half-canvas front that breaks in around your posture rather than against it.',
      },
    ],
  },
  {
    id: 'str_wathoda_campus',
    name: 'Campus Edit — Wathoda',
    area: 'Wathoda (near Symbiosis Institute of Technology)',
    addressLine: 'Plot 3, Wathoda Ring Road, Nagpur 440035',
    coordinates: { latitude: 21.0972, longitude: 79.147 },
    rating: 4.5,
    ratingCount: 156,
    distanceKm: 0.8,
    etaMinutes: 26,
    tagline: 'Fastest delivery on campus. Stocked for late starts.',
    products: [
      {
        id: 'prd_heavyweight_tee',
        name: 'Heavyweight Boxy Tee',
        category: CATEGORIES.APPAREL,
        price: 1450,
        mrp: 1900,
        currency: 'INR',
        colorway: 'Washed Black',
        material: '240 GSM combed cotton',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        image: img('heavyweight-tee'),
        description:
          'Boxy through the body, ribbed at the collar, and heavy enough to hold its shape after the fourth wash.',
      },
      {
        id: 'prd_steel_link_cuff',
        name: 'Steel Link Arm Cuff',
        category: CATEGORIES.CUFFS,
        price: 1980,
        mrp: 2500,
        currency: 'INR',
        colorway: 'Polished Steel',
        material: 'Stainless steel, fold-over clasp',
        sizes: ['Adjustable'],
        image: img('steel-cuff'),
        description:
          'Flat links, no charms, single clasp. Reads as jewellery from a distance and as hardware up close.',
      },
      {
        id: 'prd_campus_automatic',
        name: 'Campus Automatic 38',
        category: CATEGORIES.WATCHES,
        price: 16400,
        mrp: 19900,
        currency: 'INR',
        colorway: 'Graphite / Steel',
        material: 'Steel case, mineral crystal, 21-jewel automatic movement',
        sizes: ['38mm'],
        image: img('campus-automatic'),
        description:
          'The cheapest way into a real mechanical movement in this city. Wear it for a week and it never needs the crown.',
      },
    ],
  },
];

/**
 * Flattened product feed with the parent store denormalised onto each item.
 *
 * The Home feed, PDP, and cart all deal in single products rather than stores,
 * so they read from here instead of walking the nested structure themselves.
 */
export const allProducts = mockStores.flatMap((store) =>
  store.products.map((product) => ({
    ...product,
    storeId: store.id,
    storeName: store.name,
    storeArea: store.area,
    storeCoordinates: store.coordinates,
    distanceKm: store.distanceKm,
    etaMinutes: store.etaMinutes,
  })),
);

/** Nearest-first, which is the only sort the hyper-local model really needs. */
export const productsByProximity = [...allProducts].sort(
  (a, b) => a.distanceKm - b.distanceKm,
);

export function getStoreById(storeId) {
  return mockStores.find((store) => store.id === storeId) ?? null;
}

export function getProductById(productId) {
  return allProducts.find((product) => product.id === productId) ?? null;
}

/**
 * Kept as a named export because every customer screen already imports it from
 * here, but the implementation now lives in `utils/format` so the vendor flow
 * and the customer flow render rupees identically.
 */
export { formatCurrency as formatINR } from '../utils/format';

export default mockStores;
