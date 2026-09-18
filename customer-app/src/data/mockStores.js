/**
 * Mock catalogue — five independent fashion retailers in Nagpur.
 *
 * This stands in for the `/vendors` + `/products` endpoints described in
 * ARCHITECTURE.md until the Express + MongoDB backend is wired up. Shapes here
 * intentionally mirror the planned Vendor and Product schemas so swapping the
 * import for a fetch later is a one-line change.
 *
 * Coordinates are real Nagpur neighbourhoods (Dharampeth, Sitabuldi, Ramdaspeth,
 * Civil Lines, and Gandhibagh) so the distance sort and the live-tracking map both
 * look plausible in demos.
 *
 * All photography uses verified high-resolution fashion editorial imagery.
 */

export const CATEGORIES = {
  SILKS: 'Silks',
  LINEN: 'Linen',
  FESTIVE: 'Festive',
  WOMEN: 'Women',
  MEN: 'Men',
  TOPS: 'Tops',
  SHIRTS: 'Shirts',
  DRAPES: 'Drapes',
};

/** Nagpur city centre — used as the default map region before GPS resolves. */
export const NAGPUR_CENTER = {
  latitude: 21.1458,
  longitude: 79.0882,
};

export const mockStores = [
  {
    id: 'str_studio_anamika',
    name: 'Studio Anamika',
    area: 'Dharampeth',
    addressLine: 'Shop 14, West High Court Road, Dharampeth, Nagpur 440010',
    coordinates: { latitude: 21.135, longitude: 79.068 },
    rating: 4.9,
    ratingCount: 520,
    distanceKm: 1.2,
    etaMinutes: 18,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB3fO0AlIyNUbsjQillmgpCWx1QCPdMm6I6G1ZsgUv2kPOwmh6JSuQ9r9mZXkheX-_WPYJ1exGjksPUEBoHxIduC6zmixfyL-RR79JPvIfLMM7ZVLQjDk0NTCG-6LxFcA9aOZWLWaJECd-7jJATwh7gfp0IUq0NDC27kxpVeO8dvWks7uuNArpDldMNEgbqWxhLy53afjqMuBfE6niZuVessjk8plkVRlHFDQgWkPpLkt5ekiflvX079w',
    tagline: 'Dharampeth · Pure Zari & Tussar Silk',
    products: [
      {
        id: 'prd_royal_chanderi_zari_set',
        name: 'Royal Chanderi Zari Set',
        category: 'Silks',
        gender: 'Women',
        subCategory: "Women's Wear",
        price: 4750,
        mrp: 6400,
        currency: 'INR',
        colorway: 'Crimson & Gold',
        material: 'Handcrafted crimson and gold Banarasi zari silk angrakha robe',
        sizes: ['S', 'M', 'L'],
        deliveryMinutes: 25,
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuA7S-N2WWsNXgtuAYoxV3VTKQj3zhQPJJVOqBebPKzwABDFzSMW8_Ma853uQn3Uh8t4ERL-qIjxCVuKaA1pBPZgz6Uh5jMAmjaeXXKaYzP90t225iQtt3IPiDJ6MeblM2eVZAA3a3T6fZNDtw1pbAIXEVn23GTbHNZwNTmCuADF2lyaHwYfFyFhDrB-ue-c49KvygdOgf5U9uviu-2NnPa9sZBsXaXdhFjKESwZ7jP7QBdTAo0RwlWsGg',
        description:
          'Editorial luxury fashion portrait of an elegant handcrafted crimson and gold Banarasi zari silk angrakha robe. Natural warm ambient studio lighting, soft cream linen textures.',
      },
      {
        id: 'prd_chanderi_angrakha',
        name: 'Chanderi Silk Angrakha',
        category: 'Silks',
        gender: 'Women',
        subCategory: 'Drapes & Angrakhas',
        price: 4800,
        mrp: 6499,
        currency: 'INR',
        colorway: 'Sindhoor Crimson',
        material: 'Handwoven Chanderi cotton-silk, delicate zardozi lapels',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        deliveryMinutes: 28,
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuD5WpgQNsXY8LzG4Zbdq5F-RthnwzTQ3IW1ybahamSyj4eSGXOeHMJemyAHE91tfnF373mJIqcDfA-cHnk_JyP6txaEy6DpAObexpxBaTIJ4mmlHdqbtH-upkBDBXP8KX3tYqEBv5V-Ox-5wNpsdY7z73yNzikadlIa5jK9oSmOeU9ls1VU3I196LB0Lfn9nleNXQ1ilXWU6vey5nCYpDaxC7XZ4pruGrZowV31ah2rdIni3a8-wUYDZw',
        description:
          'Hand-woven tissue silk draped with asymmetrical overlap, edged in pure zari cordwork.',
      },
      {
        id: 'prd_raw_silk_dupatta',
        name: 'Raw Silk Dupatta',
        category: 'Silks',
        gender: 'Women',
        subCategory: 'Silk Dupattas',
        price: 1500,
        mrp: 2000,
        currency: 'INR',
        colorway: 'Blush Pink',
        material: 'Soft blush pink raw silk dupatta adorned with subtle golden gota patti border',
        sizes: ['Free Size'],
        deliveryMinutes: 35,
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCEPtmkPMyIJEXMeO6aKr8gFQLa7xclnqiXU_XmWysTILZf5STQ313SzDms5D_CeAbkwJn67z5WAYzYRuszBusx7eNRs8_NwnUetFH59SJIT0GmM_5o1S2aqhxTPUAOE0cBTQApkznuEB-B_yEjAPW4i2TzM24-xclP9OxHcskpl-75SdiZna_PbBgMNSL1FREyUiJlaflfbVaSVmd938Lij0vTiVjZHuBkVGKoBcdJpUq69FzmxjiIBA',
        description:
          'Delicate luxury Indian handloom textile, natural linen studio styling, ultra-soft lighting.',
      },
    ],
  },
  {
    id: 'str_pankh_atelier',
    name: 'Pankh Boutique',
    area: 'Sitabuldi',
    addressLine: '42, Residency Road, Sitabuldi, Nagpur 440012',
    coordinates: { latitude: 21.144, longitude: 79.085 },
    rating: 4.8,
    ratingCount: 410,
    distanceKm: 0.8,
    etaMinutes: 22,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDkrarLJqQNSiq9nwRE1A1GD63ExWMaifYGh2k5uE4KlpLg8b3ju9qj_-fL7VnP3guo8QcO3RrFGX4-XzJEQNeebh2KMcShzaVXpln4HlDID3zs-sUUQcfSuzTwc3nyWFKowQGLuCzNE1V4ZPW2KatxtgWKuLLPAq5MaEMYiXjw-0be16OC7E6jTHnIubY7w1BTeorvP4kCy0VmWojBw2THUi7o6hMnmyIZhW6JJqIWE5Etbh0jWPvIuQ',
    tagline: 'Sitabuldi · Paithani & Organza',
    products: [
      {
        id: 'prd_paithani_silk_kurta',
        name: 'Paithani Silk Kurta',
        category: 'Silks',
        gender: 'Women',
        subCategory: 'Kurtas & Sets',
        price: 3400,
        mrp: 4200,
        currency: 'INR',
        colorway: 'Royal Emerald Green',
        material: 'Royal emerald green Paithani silk kurta with golden peacock hand-embroidery',
        sizes: ['S', 'M', 'L'],
        deliveryMinutes: 20,
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAYDGM74E_WBhmoM3kL_gMs5hmfJ4_AsJW0t9hYBZkI8QR-J4ngUuy856EamXn-AHuXEbDyhGi_Ox0UjxrCGIoxnrtJYRszpNg-lF4Kr9LYMnrm8uMiUOsuoBzYNEi6PxH-oo3hYvAWl4fyGo3ybsK0jOL93juW_B-YDbBf0jnNJd6vAxf2TDJ8yO_MPrutyG7-pP4pS-EcZ2vGedezLuSiYQcj4R1B9udgJ8A8y3B7sjvJn6NwPer9Ew',
        description:
          'Royal emerald green Paithani silk kurta with golden peacock hand-embroidery around the collar. Sharp textile weave detail.',
      },
    ],
  },
  {
    id: 'str_sadar_loom',
    name: 'Sadar Trend Studio',
    area: 'Sadar',
    addressLine: '12, Mount Road Extension, Sadar, Nagpur 440001',
    coordinates: { latitude: 21.161, longitude: 79.082 },
    rating: 5.0,
    ratingCount: 320,
    distanceKm: 2.4,
    etaMinutes: 28,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuASVOMaR-Rf5v0pXCa-wbfZHHU4qhQhVuCJiCbMT08xz8sWeJphW-wzGu4AM433agT-gQeJyUDcFPZJJLlbws1xYeXJwmPa_X8nWjIcgJR-_mO9_Wen5rhk6xCHSu4bumF9t4TAY_W-ee5uZB3yiMKU0PQWCtaUnfstGo_m5bBfRqW3UaLtmJk1yzvrrAptBwdOBdoVmOx1_8ixw52qKpFnEopUBOS2JphwBYsPp99RgGwv0w-VfIQRpQ',
    tagline: 'Sadar · Menswear & Royal Bandhgalas',
    products: [
      {
        id: 'prd_linen_bundi_jacket',
        name: 'Linen Bundi Jacket',
        category: 'Men',
        gender: 'Men',
        subCategory: "Men's Fashion",
        price: 5200,
        mrp: 6500,
        currency: 'INR',
        colorway: 'Ivory & Brass',
        material: 'Tailored ivory linen bundi jacket with brushed brass buttons',
        sizes: ['38', '40', '42'],
        deliveryMinutes: 25,
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBDfCXZkxrJvcXumVTIdQ0NdEwsow6VcIeeZVBFMrj22bG0ymQQre2i-5SIg02fclD2PQAn9LXQwXBlTnxk6OaiQcIJ71zc5RkOrL6xCdTJNZO2WcUeL3JaBgPFlZbU4RJakO_Epyl-wy3xlG97YYx6nnnBjCS7j3iN1I9QYzngDYLMqbg531LjgI-MyTUEfdK5yI3KXtE3Ql3lkxMRnB6qMH87gjte8bikwM8Rpq8Gy-vxa3sb8HzJsg',
        description:
          'Tailored ivory linen bundi jacket with brushed brass buttons over a classic bandhgala. Refined royal sophistication.',
      },
    ],
  },
  {
    id: 'str_sitabuldi_silk',
    name: 'Sitabuldi Silk',
    area: 'Sitabuldi',
    addressLine: '80, Cotton Market Square, Sitabuldi, Nagpur 440012',
    coordinates: { latitude: 21.147, longitude: 79.086 },
    rating: 4.9,
    ratingCount: 490,
    distanceKm: 0.7,
    etaMinutes: 30,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCYmUCb6LsHzea-_Hq0at5dFcymwuBhotCd7EH3utfkLwLoZlve9XuimzOWHjp0aHYiJIhSEWsluGpsFvaLPxgthCU8dVghYNhcHC1H0IhAeGtqD2RPcx8uXfqH2-1Y2pt3L0ELokiVTPaA0IFVHi2Ho0WbB9ejtXrSKkpe37cOLPG8QYw_bej_jSX81c-TwkyvOXC1r9L-YMglvksn0WTOWWAbv6OWIEhN7yLeOO3Z6F-YdZF8rF14dA',
    tagline: 'Sitabuldi · Sarees & Handlooms',
    products: [
      {
        id: 'prd_tissue_zari_saree',
        name: 'Tissue Zari Saree',
        category: 'Silks',
        gender: 'Women',
        subCategory: 'Sarees & Handlooms',
        price: 8900,
        mrp: 11500,
        currency: 'INR',
        colorway: 'Midnight Blue & Antique Gold',
        material: 'Handwoven midnight blue tissue silk saree with antique gold zari pallu border',
        sizes: ['Free Size'],
        deliveryMinutes: 30,
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCYmUCb6LsHzea-_Hq0at5dFcymwuBhotCd7EH3utfkLwLoZlve9XuimzOWHjp0aHYiJIhSEWsluGpsFvaLPxgthCU8dVghYNhcHC1H0IhAeGtqD2RPcx8uXfqH2-1Y2pt3L0ELokiVTPaA0IFVHi2Ho0WbB9ejtXrSKkpe37cOLPG8QYw_bej_jSX81c-TwkyvOXC1r9L-YMglvksn0WTOWWAbv6OWIEhN7yLeOO3Z6F-YdZF8rF14dA',
        description:
          'Handwoven midnight blue tissue silk saree with intricate antique gold zari pallu border. Quiet luxury, timeless Indian craftsmanship.',
      },
    ],
  },
  {
    id: 'str_maheshwari_handlooms',
    name: 'Maheshwari Handlooms',
    area: 'Gandhibagh',
    addressLine: '88, Cloth Market, Gandhibagh, Nagpur 440002',
    coordinates: { latitude: 21.152, longitude: 79.108 },
    rating: 4.8,
    ratingCount: 380,
    distanceKm: 2.1,
    etaMinutes: 32,
    image:
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=600&q=80',
    tagline: 'Modern fashion studio with trending fits & contemporary menswear.',
    products: [
      {
        id: 'prd_tussar_kurta_set',
        name: 'Tussar Silk Kurta Set',
        category: 'Silks',
        gender: 'Men',
        subCategory: 'Kurtas & Sets',
        price: 3450,
        mrp: 4500,
        currency: 'INR',
        colorway: 'Natural Biscuit Ecru',
        material: 'Raw handwoven tussar silk, subtle golden woven thread collar',
        sizes: ['38', '40', '42', '44'],
        deliveryMinutes: 32,
        image:
          'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80',
        description:
          'Raw tussar silk classic straight-cut tunic with subtle golden woven thread along the mandarin bandhgala collar.',
      },
      {
        id: 'prd_nehru_waistcoat',
        name: 'Structured Nehru Waistcoat',
        category: 'Festive',
        gender: 'Men',
        subCategory: 'Shirts & Waistcoats',
        price: 3200,
        mrp: 4200,
        currency: 'INR',
        colorway: 'Deep Royal Crimson',
        material: 'Structured raw silk, handcrafted brass buttons',
        sizes: ['38', '40', '42', '44'],
        deliveryMinutes: 32,
        image:
          'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80',
        description:
          'Structured textured raw silk Nehru waistcoat in deep royal crimson, tailored with antique brass buttons.',
      },
    ],
  },
  {
    id: 'str_civillines_linen',
    name: 'Civil Lines Linen Studio',
    area: 'Civil Lines',
    addressLine: 'Bungalow 6, Palm Road, Civil Lines, Nagpur 440001',
    coordinates: { latitude: 21.155, longitude: 79.07 },
    rating: 4.8,
    ratingCount: 295,
    distanceKm: 1.8,
    etaMinutes: 24,
    image:
      'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=600&q=80',
    tagline: 'Minimal pure European linen silhouettes tailored for Vidarbha climate.',
    products: [
      {
        id: 'prd_linen_coord',
        name: 'Sculpted Linen Co-ord Set',
        category: 'Linen',
        gender: 'Women',
        subCategory: 'Tops & Co-ords',
        price: 2890,
        mrp: 3800,
        currency: 'INR',
        colorway: 'Warm Sand Ecru',
        material: '100% Belgian breathable linen, tailored vest & relaxed trousers',
        sizes: ['XS', 'S', 'M', 'L'],
        deliveryMinutes: 24,
        image:
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
        description:
          'Tailored notched-lapel vest paired with pleated wide-leg linen trousers. Lightweight and breathable for Vidarbha weather.',
      },
      {
        id: 'prd_crimson_slip',
        name: 'Crimson Bias-Cut Slip Dress',
        category: 'Festive',
        gender: 'Women',
        subCategory: 'Dresses & Gowns',
        price: 8900,
        mrp: 11500,
        currency: 'INR',
        colorway: 'Deep Crimson',
        material: 'Pure silk crepe with French seams',
        sizes: ['XS', 'S', 'M', 'L'],
        deliveryMinutes: 24,
        image:
          'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80',
        description:
          'Cut on the bias so it moves effortlessly before you do. Handcrafted in a limited boutique batch.',
      },
    ],
  },
  {
    id: 'str_kala_niketan',
    name: 'Kala Niketan',
    area: 'Sitabuldi',
    addressLine: '52, Main Road, Sitabuldi, Nagpur 440012',
    coordinates: { latitude: 21.146, longitude: 79.088 },
    rating: 4.95,
    ratingCount: 640,
    distanceKm: 0.6,
    etaMinutes: 15,
    image:
      'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=600&q=80',
    tagline: "Nagpur's premier bridal fashion house and royal zardozi embroideries.",
    products: [
      {
        id: 'prd_zardozi_anarkali',
        name: 'Zardozi Embroidered Anarkali',
        category: 'Festive',
        gender: 'Women',
        subCategory: 'Festive Anarkali',
        price: 8900,
        mrp: 11500,
        currency: 'INR',
        colorway: 'Mulberry Red & Gold',
        material: 'Rich mulberry silk, accompanied by zari organza dupatta',
        sizes: ['S', 'M', 'L'],
        deliveryMinutes: 15,
        image:
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=80',
        description:
          'Grand festive floor-length anarkali in rich mulberry silk, accompanied by a zari organza dupatta.',
      },
      {
        id: 'prd_obsidian_shirt',
        name: 'Obsidian Evening Shirt',
        category: 'Shirts',
        gender: 'Men',
        subCategory: 'Shirts & Eveningwear',
        price: 4200,
        mrp: 5600,
        currency: 'INR',
        colorway: 'Obsidian Black',
        material: '2-ply Giza cotton, mother-of-pearl buttons',
        sizes: ['S', 'M', 'L', 'XL'],
        deliveryMinutes: 15,
        image:
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80',
        description:
          'Cut long in the body and narrow through the sleeve, finished with a hand-rolled placket. Made two streets away in Sitabuldi.',
      },
    ],
  },
  {
    id: 'str_thread_and_bone',
    name: 'Thread & Bone',
    area: 'Sitabuldi',
    addressLine: 'First Floor, Main Road, Sitabuldi, Nagpur 440012',
    coordinates: { latitude: 21.1458, longitude: 79.0882 },
    rating: 4.6,
    ratingCount: 289,
    distanceKm: 2.7,
    etaMinutes: 42,
    image:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80',
    tagline: 'Raw streetwear, boxy tees & campus essentials.',
    products: [
      {
        id: 'prd_heavyweight_tee',
        name: 'Heavyweight Boxy Tee',
        category: 'Tops',
        gender: 'Unisex',
        subCategory: 'Tops & Tees',
        price: 1450,
        mrp: 1900,
        currency: 'INR',
        colorway: 'Washed Charcoal Black',
        material: '240 GSM combed heavyweight cotton',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        deliveryMinutes: 42,
        image:
          'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
        description:
          'Boxy through the body, ribbed collar, heavy enough to hold silhouette after repeated washes.',
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
    locality: store.area,
    storeCoordinates: store.coordinates,
    distanceKm: store.distanceKm,
    etaMinutes: product.deliveryMinutes || store.etaMinutes,
    deliveryMinutes: product.deliveryMinutes || store.etaMinutes,
    brand: store.name,
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
