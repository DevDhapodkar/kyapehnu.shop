import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPDATES_DIR = path.join(__dirname, '../public/updates');

/**
 * Serves the OTA update manifest for the requesting client.
 * Conforms to the Expo Updates Protocol specification.
 */
export const getManifest = async (req, res) => {
  try {
    const metadataPath = path.join(UPDATES_DIR, 'metadata.json');
    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({ message: 'No updates published yet' });
    }

    const metadata = JSON.parse(await fs.promises.readFile(metadataPath, 'utf8'));
    const platform = (req.headers['expo-platform'] || 'android').toLowerCase();
    const clientUpdateId = req.headers['expo-current-update-id'];
    const platformData = metadata.fileMetadata?.[platform] || metadata.fileMetadata?.android;

    if (!platformData || !platformData.bundle) {
      return res.status(404).json({ message: `No update bundle for platform ${platform}` });
    }

    const bundlePath = path.join(UPDATES_DIR, platformData.bundle);
    if (!fs.existsSync(bundlePath)) {
      return res.status(404).json({ message: 'Bundle file missing on server' });
    }

    // Generate deterministic update ID from bundle contents hash
    const bundleStat = await fs.promises.stat(bundlePath);
    const bundleBuffer = await fs.promises.readFile(bundlePath);
    const bundleHash = crypto.createHash('sha256').update(bundleBuffer).digest('hex');
    const updateId = crypto.createHash('md5').update(bundleHash).digest('hex');

    // If client already has this exact update, no need to redownload
    if (clientUpdateId && clientUpdateId === updateId) {
      return res.status(204).end();
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.get('host') || 'kyapehnu-backend.onrender.com';
    const baseUrl = `${protocol}://${host}`;

    const launchAsset = {
      hash: bundleHash,
      key: 'bundle',
      contentType: 'application/javascript',
      url: `${baseUrl}/api/updates/bundle`,
    };

    const assets = (platformData.assets || []).map((asset) => {
      const assetFileName = path.basename(asset.path);
      const ext = asset.ext || path.extname(asset.path).replace('.', '') || 'bin';
      let contentType = 'application/octet-stream';
      if (ext === 'png') contentType = 'image/png';
      else if (ext === 'webp') contentType = 'image/webp';
      else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
      else if (ext === 'ttf') contentType = 'font/ttf';

      return {
        hash: assetFileName,
        key: assetFileName,
        contentType,
        fileExtension: `.${ext}`,
        url: `${baseUrl}/api/updates/assets/${assetFileName}?ext=${ext}`,
      };
    });

    const manifest = {
      id: updateId,
      createdAt: bundleStat.mtime.toISOString(),
      runtimeVersion: '1.0.0',
      launchAsset,
      assets,
      metadata: {},
      extra: {
        expoClient: {
          name: 'Kya Pehnu?',
          slug: 'customer-app',
          version: '1.0.0',
        },
      },
    };

    res.setHeader('expo-protocol-version', 0);
    res.setHeader('expo-sfv-version', 0);
    res.setHeader('content-type', 'application/json');
    res.setHeader('cache-control', 'public, max-age=60');
    return res.json(manifest);
  } catch (error) {
    console.error('Failed to generate OTA manifest:', error);
    return res.status(500).json({ message: 'Failed to generate update manifest', error: error.message });
  }
};

/**
 * Serves the main JS bytecode bundle.
 */
export const getBundle = async (req, res) => {
  try {
    const metadataPath = path.join(UPDATES_DIR, 'metadata.json');
    if (!fs.existsSync(metadataPath)) {
      return res.status(404).send('No update bundle available');
    }

    const metadata = JSON.parse(await fs.promises.readFile(metadataPath, 'utf8'));
    const platform = (req.headers['expo-platform'] || 'android').toLowerCase();
    const platformData = metadata.fileMetadata?.[platform] || metadata.fileMetadata?.android;

    if (!platformData?.bundle) {
      return res.status(404).send('Bundle not defined');
    }

    const bundlePath = path.join(UPDATES_DIR, platformData.bundle);
    if (!fs.existsSync(bundlePath)) {
      return res.status(404).send('Bundle file not found');
    }

    res.setHeader('content-type', 'application/javascript');
    res.setHeader('cache-control', 'public, max-age=31536000, immutable');
    return res.sendFile(bundlePath);
  } catch (error) {
    console.error('Failed to serve update bundle:', error);
    return res.status(500).send(error.message);
  }
};

/**
 * Serves static assets referenced by the bundle.
 */
export const getAsset = async (req, res) => {
  try {
    const { assetName } = req.params;
    const cleanName = path.basename(assetName);
    const assetPath = path.join(UPDATES_DIR, 'assets', cleanName);

    if (!fs.existsSync(assetPath)) {
      return res.status(404).send('Asset not found');
    }

    const ext = (req.query.ext || path.extname(cleanName).replace('.', '')).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === 'png') contentType = 'image/png';
    else if (ext === 'webp') contentType = 'image/webp';
    else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
    else if (ext === 'ttf') contentType = 'font/ttf';

    res.setHeader('content-type', contentType);
    res.setHeader('cache-control', 'public, max-age=31536000, immutable');
    return res.sendFile(assetPath);
  } catch (error) {
    console.error('Failed to serve asset:', error);
    return res.status(500).send(error.message);
  }
};
