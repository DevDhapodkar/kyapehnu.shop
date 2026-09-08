export const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80';

/**
 * Resolves a product image URI, falling back to a reachable high-res editorial image
 * if the URI is missing, invalid, or points to known 404 placeholder assets (e.g. Cloudinary sample.webp).
 *
 * @param {string | any} uri
 * @returns {string} Safe, reachable image URL
 */
export function resolveProductImageUri(uri) {
  if (!uri) return FALLBACK_PRODUCT_IMAGE;
  if (typeof uri !== 'string') {
    if (typeof uri?.uri === 'string') {
      return resolveProductImageUri(uri.uri);
    }
    return uri;
  }
  const trimmed = uri.trim();
  if (trimmed === '' || trimmed.includes('sample.webp')) {
    return FALLBACK_PRODUCT_IMAGE;
  }
  return trimmed;
}
