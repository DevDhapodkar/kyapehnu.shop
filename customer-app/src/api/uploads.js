import client from './vendorApi';

/**
 * Product image upload (Cloudinary signed direct-upload).
 *
 * The device never holds any Cloudinary secret: it asks our backend for a
 * short-lived signature, then uploads the file straight to Cloudinary and gets
 * back a CDN `secure_url`, which is what we persist on the product. No image
 * bytes pass through our (free-tier) backend.
 */

/** GET a fresh Cloudinary upload signature scoped to this vendor. */
const fetchSignature = async () => {
  const { data } = await client.post('/uploads/product-image-signature');
  return data;
};

/**
 * Upload a picked image asset to Cloudinary and return its secure URL.
 * @param {{uri:string, mimeType?:string, fileName?:string}} asset from expo-image-picker
 * @returns {Promise<string>} the CDN URL to store in Product.images
 */
export const uploadProductImage = async (asset) => {
  const sig = await fetchSignature();

  const form = new FormData();
  form.append('file', {
    uri: asset.uri,
    type: asset.mimeType || 'image/jpeg',
    name: asset.fileName || `product-${Date.now()}.jpg`,
  });
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('folder', sig.folder);
  form.append('signature', sig.signature);

  const res = await fetch(sig.uploadUrl, { method: 'POST', body: form });
  const body = await res.json();
  if (!res.ok || !body.secure_url) {
    throw new Error(body?.error?.message || 'Image upload failed');
  }
  return body.secure_url;
};

export default { uploadProductImage };
