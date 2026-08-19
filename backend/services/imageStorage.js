import crypto from 'node:crypto';
import { loadEnv } from '../config/env.js';
import { AppError } from '../lib/errors.js';

/**
 * Cloudinary signed direct-upload.
 *
 * Chosen because it is the best *free* fit for an image-heavy fashion catalogue:
 * no credit card required, a global CDN, and on-the-fly format/quality/resize
 * transforms that matter a lot on low-end Android. Files go straight from the
 * device to Cloudinary; our server only issues a short signature, so the
 * api_secret never ships in the mobile binary and no image bytes transit our
 * (free-tier) backend.
 *
 * Flow:
 *   1. app → POST /api/uploads/product-image-signature  (this issues params)
 *   2. app → POST cloudinary upload endpoint with the signed params + file
 *   3. app → saves the returned secure_url into Product.images
 */

/**
 * Compute a Cloudinary upload signature: sha1 of the alphabetically-sorted
 * "k=v&k=v" of the signed params with the api_secret appended. Pure and
 * exported so it can be unit-tested without any network or real credentials.
 */
export const signParams = (params, apiSecret) => {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');
};

const env = loadEnv();

export const imageUploadsEnabled = () => env.features.imageUploads;

/**
 * Build everything the client needs to upload one image directly to Cloudinary.
 * `subfolder` scopes uploads per-vendor so one shop can't overwrite another's.
 */
export const buildSignedUpload = ({ subfolder } = {}) => {
  if (!env.features.imageUploads) {
    throw new AppError(503, 'Image uploads are not configured on this server');
  }
  const folder = subfolder ? `${env.cloudinary.folder}/${subfolder}` : env.cloudinary.folder;
  const timestamp = Math.floor(Date.now() / 1000);

  // Only params included here are signed; the client must send exactly these
  // (plus the file + api_key) or Cloudinary rejects the upload.
  const signature = signParams({ folder, timestamp }, env.cloudinary.apiSecret);

  return {
    cloudName: env.cloudinary.cloudName,
    apiKey: env.cloudinary.apiKey,
    timestamp,
    folder,
    signature,
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.cloudinary.cloudName}/image/upload`,
  };
};

/**
 * Server-side upload of an image buffer to Cloudinary. Used by the admin portal
 * (a server-rendered form posts the file to us, we forward it). Fine here
 * because admin traffic is low — unlike the customer/vendor path, which uploads
 * directly to Cloudinary to avoid our backend's bandwidth. Uses Node's global
 * fetch/FormData/Blob (Node 18+), so no extra dependency.
 */
export const uploadBufferToCloudinary = async (buffer, { subfolder, filename } = {}) => {
  if (!env.features.imageUploads) {
    throw new AppError(503, 'Image uploads are not configured on this server');
  }
  const folder = subfolder ? `${env.cloudinary.folder}/${subfolder}` : env.cloudinary.folder;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signParams({ folder, timestamp }, env.cloudinary.apiSecret);

  const form = new FormData();
  form.append('file', new Blob([buffer]), filename || 'upload.jpg');
  form.append('api_key', env.cloudinary.apiKey);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('signature', signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${env.cloudinary.cloudName}/image/upload`,
    { method: 'POST', body: form }
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.secure_url) {
    throw new AppError(502, body?.error?.message || 'Cloudinary upload failed');
  }
  return body.secure_url;
};

export default { signParams, imageUploadsEnabled, buildSignedUpload, uploadBufferToCloudinary };
