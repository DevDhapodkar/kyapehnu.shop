import express from 'express';
import { getManifest, getBundle, getAsset } from '../controllers/updateController.js';

const router = express.Router();

// Public OTA endpoints consumed by the expo-updates client library
router.get('/manifest', getManifest);
router.get('/bundle', getBundle);
router.get('/assets/:assetName', getAsset);

export default router;
