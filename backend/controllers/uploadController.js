import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { uploadImages, runMiddleware } from '../middleware/upload.js';
import { buildProductFolder, buildThumbnails } from '../utils/imageValidation.js';

/**
 * Stream one in-memory file buffer to Cloudinary.
 * @param {Buffer} buffer
 * @param {string} folder
 * @returns {Promise<import('cloudinary').UploadApiResponse>}
 */
const uploadBuffer = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        format: 'webp',
        // Cap the stored master; c_limit never upscales small phone photos.
        transformation: [{ width: 1200, height: 1600, crop: 'limit' }],
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });

const toImagePayload = (result) => ({
  url: result.secure_url,
  publicId: result.public_id,
  width: result.width,
  height: result.height,
  bytes: result.bytes,
  thumbnails: buildThumbnails(result.secure_url),
});

/**
 * POST /api/uploads/images  (vendor auth, multipart field: `images`, 1–5 files)
 * Returns the stored master URL + publicId + delivery variants for each image.
 * The vendor app then puts `url` values into the product's `images` array.
 */
export const uploadProductImages = async (req, res) => {
  if (!isCloudinaryConfigured) {
    return res.status(503).json({ message: 'Image uploads are not configured on this server' });
  }

  try {
    await runMiddleware(req, res, uploadImages);
  } catch (err) {
    const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 400);
    return res.status(status).json({ message: err.message || 'Invalid upload' });
  }

  if (!req.files?.length) {
    return res.status(400).json({ message: 'No images provided (multipart field name: images)' });
  }

  try {
    const folder = buildProductFolder(req.vendor._id.toString());
    const results = await Promise.all(req.files.map((file) => uploadBuffer(file.buffer, folder)));
    res.status(201).json({ images: results.map(toImagePayload) });
  } catch (error) {
    res.status(502).json({ message: 'Image upload to Cloudinary failed', error: error.message });
  }
};

/**
 * DELETE /api/uploads/images  (vendor auth, body: { publicId })
 * Removes a stored asset — call this when a vendor drops an image from a listing.
 */
export const deleteProductImage = async (req, res) => {
  if (!isCloudinaryConfigured) {
    return res.status(503).json({ message: 'Image uploads are not configured on this server' });
  }

  const { publicId } = req.body ?? {};
  if (!publicId || typeof publicId !== 'string') {
    return res.status(400).json({ message: 'publicId is required' });
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    // 'not found' is treated as success so deletes are idempotent for the client.
    if (result.result !== 'ok' && result.result !== 'not found') {
      return res.status(502).json({ message: 'Failed to delete image', result: result.result });
    }
    res.json({ deleted: true, publicId, result: result.result });
  } catch (error) {
    res.status(502).json({ message: 'Failed to delete image', error: error.message });
  }
};
