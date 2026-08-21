import { v2 as cloudinary } from 'cloudinary';

// Two accepted credential forms:
//   1. CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>  (SDK reads it directly)
//   2. the three discrete vars below
// Boot never fails on missing creds — uploads simply stay unavailable and the
// route responds 503, mirroring the Firebase-optional boot policy.
const {
  CLOUDINARY_URL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

const hasDiscreteCreds = Boolean(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET
);

export const isCloudinaryConfigured = Boolean(CLOUDINARY_URL) || hasDiscreteCreds;

if (isCloudinaryConfigured) {
  // When only CLOUDINARY_URL is present, the SDK parses it from the environment;
  // passing undefined discrete fields would clobber that, so only set them when real.
  cloudinary.config(
    hasDiscreteCreds
      ? {
          cloud_name: CLOUDINARY_CLOUD_NAME,
          api_key: CLOUDINARY_API_KEY,
          api_secret: CLOUDINARY_API_SECRET,
          secure: true,
        }
      : { secure: true }
  );
} else {
  console.warn(
    'Cloudinary not configured; product image uploads will be unavailable. ' +
      'Set CLOUDINARY_URL, or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET.'
  );
}

export default cloudinary;
