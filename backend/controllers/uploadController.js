import { asyncHandler } from '../lib/errors.js';
import { buildSignedUpload } from '../services/imageStorage.js';

/**
 * POST /api/uploads/product-image-signature
 *
 * Issues a short-lived Cloudinary signature so an approved vendor can upload a
 * product image directly from the device. Uploads are scoped to the vendor's
 * own folder. The client uploads the file to `uploadUrl`, then saves the
 * returned `secure_url` into the product's `images` array.
 */
export const productImageSignature = asyncHandler(async (req, res) => {
  const signed = buildSignedUpload({ subfolder: `vendors/${req.vendor._id}` });
  res.json(signed);
});

export default { productImageSignature };
