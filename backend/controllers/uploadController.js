import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { uploadImages, runMiddleware } from '../middleware/upload.js';
import { buildProductFolder, buildThumbnails, isVideoMime } from '../utils/imageValidation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_UPLOADS_DIR = path.join(__dirname, '../public/uploads');

// Ensure public uploads directory exists for disk fallback
if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
  fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
}

/**
 * Stream one in-memory file buffer to Cloudinary (image or video).
 * @param {import('express').Multer.File} file
 * @param {string} folder
 * @returns {Promise<import('cloudinary').UploadApiResponse>}
 */
const uploadBufferToCloudinary = (file, folder) =>
  new Promise((resolve, reject) => {
    const isVideo = isVideoMime(file.mimetype);
    const options = {
      folder,
      resource_type: isVideo ? 'video' : 'image',
    };

    if (!isVideo) {
      options.format = 'webp';
      // Cap the stored master; c_limit never upscales small phone photos.
      options.transformation = [{ width: 1200, height: 1600, crop: 'limit' }];
    }

    const stream = cloudinary.uploader.upload_stream(options, (error, result) =>
      error ? reject(error) : resolve(result)
    );
    stream.end(file.buffer);
  });

/**
 * Fallback to local storage when Cloudinary credentials are not present.
 * @param {import('express').Multer.File} file
 * @param {import('express').Request} req
 * @returns {Promise<object>}
 */
const saveFileLocally = async (file, req) => {
  const ext = path.extname(file.originalname) || (isVideoMime(file.mimetype) ? '.mp4' : '.jpg');
  const filename = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
  const filePath = path.join(LOCAL_UPLOADS_DIR, filename);

  await fs.promises.writeFile(filePath, file.buffer);

  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost:5001';
  const fileUrl = `${protocol}://${host}/uploads/${filename}`;

  return {
    secure_url: fileUrl,
    public_id: `local/${filename}`,
    width: 800,
    height: 800,
    bytes: file.size,
    resource_type: isVideoMime(file.mimetype) ? 'video' : 'image',
  };
};

const toImagePayload = (result) => ({
  url: result.secure_url,
  publicId: result.public_id,
  width: result.width || 0,
  height: result.height || 0,
  bytes: result.bytes || 0,
  resourceType: result.resource_type || 'image',
  thumbnails: buildThumbnails(result.secure_url),
});

/**
 * POST /api/uploads/images  (vendor auth, multipart field: `images`, 1–5 files)
 * Returns the stored master URL + publicId + delivery variants for each image/video.
 * The vendor app then puts `url` values into the product's `images` array.
 */
export const uploadProductImages = async (req, res) => {
  try {
    await runMiddleware(req, res, uploadImages);
  } catch (err) {
    const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 400);
    return res.status(status).json({ message: err.message || 'Invalid upload' });
  }

  if (!req.files?.length) {
    return res.status(400).json({ message: 'No media files provided (multipart field name: images)' });
  }

  try {
    let results;
    if (isCloudinaryConfigured) {
      const vendorId = req.vendor?._id ? req.vendor._id.toString() : 'guest';
      const folder = buildProductFolder(vendorId);
      results = await Promise.all(
        req.files.map((file) => uploadBufferToCloudinary(file, folder))
      );
    } else {
      results = await Promise.all(
        req.files.map((file) => saveFileLocally(file, req))
      );
    }

    res.status(201).json({ images: results.map(toImagePayload) });
  } catch (error) {
    res.status(502).json({ message: 'Media upload failed', error: error.message });
  }
};

/**
 * DELETE /api/uploads/images  (vendor auth, body: { publicId })
 * Removes a stored asset — call this when a vendor drops an image from a listing.
 */
export const deleteProductImage = async (req, res) => {
  const { publicId } = req.body ?? {};
  if (!publicId || typeof publicId !== 'string') {
    return res.status(400).json({ message: 'publicId is required' });
  }

  if (publicId.startsWith('local/')) {
    try {
      const filename = publicId.replace('local/', '');
      const filePath = path.join(LOCAL_UPLOADS_DIR, filename);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
      return res.json({ deleted: true, publicId, result: 'ok' });
    } catch (_err) {
      return res.json({ deleted: true, publicId, result: 'not found' });
    }
  }

  if (!isCloudinaryConfigured) {
    return res.json({ deleted: true, publicId, result: 'ok' });
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
