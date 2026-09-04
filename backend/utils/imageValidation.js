// Pure, dependency-free helpers for the product image pipeline. Kept side-effect
// free so they can be unit-tested without a network or the Cloudinary SDK.

// 8 MB per photo, 50 MB for short fabric showcase videos.
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_MEDIA_BYTES = 50 * 1024 * 1024;

// A WhatsApp/vendor listing carries 1–5 media assets (photos or short clips).
export const MAX_IMAGES_PER_REQUEST = 5;

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const ALLOWED_VIDEO_MIME_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/3gpp',
  'video/x-matroska',
]);

const ALLOWED_MIME_TYPES = new Set([
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_VIDEO_MIME_TYPES,
]);

/**
 * @param {unknown} mime
 * @returns {boolean}
 */
export const isAllowedMime = (mime) =>
  typeof mime === 'string' && ALLOWED_MIME_TYPES.has(mime.toLowerCase());

/**
 * @param {unknown} mime
 * @returns {boolean}
 */
export const isVideoMime = (mime) =>
  typeof mime === 'string' && ALLOWED_VIDEO_MIME_TYPES.has(mime.toLowerCase());

/**
 * Namespace uploads per vendor so a shop's catalog is easy to browse and purge.
 * @param {string} vendorId
 * @returns {string}
 */
export const buildProductFolder = (vendorId) => `kyapehnu/products/${vendorId}`;

// Delivery transforms (applied via the URL, cached by Cloudinary's CDN). Sizes
// mirror the resize targets in docs/02-INTEGRATIONS.md. c_limit never upscales.
export const IMAGE_TRANSFORMS = {
  full: 'c_limit,w_1200,h_1600,f_webp,q_auto',
  card: 'c_limit,w_600,h_800,f_webp,q_auto',
  thumb: 'c_limit,w_200,h_267,f_webp,q_auto',
};

/**
 * Insert a Cloudinary transformation segment right after `/upload/` so a single
 * stored asset can be delivered at any size. Returns the input unchanged when it
 * is not a recognisable Cloudinary delivery URL.
 * @param {string} secureUrl
 * @param {string} transform
 * @returns {string}
 */
export const buildTransformedUrl = (secureUrl, transform) => {
  if (!secureUrl || !transform) return secureUrl;
  const marker = '/upload/';
  const idx = secureUrl.indexOf(marker);
  if (idx === -1) return secureUrl;
  const before = secureUrl.slice(0, idx + marker.length);
  const after = secureUrl.slice(idx + marker.length);
  return `${before}${transform}/${after}`;
};

/**
 * Build the delivery URL set stored alongside a product image.
 * @param {string} secureUrl
 * @returns {{ full: string, card: string, thumb: string }}
 */
export const buildThumbnails = (secureUrl) => ({
  full: buildTransformedUrl(secureUrl, IMAGE_TRANSFORMS.full),
  card: buildTransformedUrl(secureUrl, IMAGE_TRANSFORMS.card),
  thumb: buildTransformedUrl(secureUrl, IMAGE_TRANSFORMS.thumb),
});
