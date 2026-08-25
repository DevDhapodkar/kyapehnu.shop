import multer from 'multer';

import {
  isAllowedMime,
  MAX_IMAGE_BYTES,
  MAX_IMAGES_PER_REQUEST,
} from '../utils/imageValidation.js';

// Memory storage keeps bytes in a Buffer and streams them straight to Cloudinary
// — the infra doc is explicit: never buffer uploads to disk.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (isAllowedMime(file.mimetype)) return cb(null, true);
  const err = new Error(`Unsupported file type: ${file.mimetype}`);
  err.status = 415;
  cb(err);
};

// Field name is `images`; accepts up to MAX_IMAGES_PER_REQUEST files.
export const uploadImages = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_IMAGE_BYTES, files: MAX_IMAGES_PER_REQUEST },
}).array('images', MAX_IMAGES_PER_REQUEST);

/**
 * Run a connect-style middleware and resolve/reject as a promise so a controller
 * can await it and map failures to precise HTTP status codes.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {Function} fn
 * @returns {Promise<void>}
 */
export const runMiddleware = (req, res, fn) =>
  new Promise((resolve, reject) => {
    fn(req, res, (result) => (result instanceof Error ? reject(result) : resolve(result)));
  });
