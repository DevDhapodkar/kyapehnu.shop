#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(__dirname, '..');
const distDir = path.join(appDir, 'dist');
const backendUpdatesDir = path.join(appDir, '../backend/public/updates');

console.log('📦 [1/3] Bundling production JS & assets with Expo...');
execSync('npx expo export --platform android', {
  cwd: appDir,
  stdio: 'inherit',
});

console.log('\n🚀 [2/3] Syncing export bundle to backend/public/updates...');
if (!fs.existsSync(backendUpdatesDir)) {
  fs.mkdirSync(backendUpdatesDir, { recursive: true });
}

// Copy dist files to backend/public/updates
fs.cpSync(distDir, backendUpdatesDir, { recursive: true });

const metadata = JSON.parse(fs.readFileSync(path.join(distDir, 'metadata.json'), 'utf8'));
const bundleFile = metadata.fileMetadata?.android?.bundle;
const assetCount = (metadata.fileMetadata?.android?.assets || []).length;

console.log('\n✅ [3/3] OTA Update bundle packaged successfully!');
console.log(`   - Bundle: ${bundleFile}`);
console.log(`   - Assets bundled: ${assetCount}`);
console.log('   - Endpoint: https://kyapehnu-backend.onrender.com/api/updates/manifest');
console.log('\nWhen deployed to Render, all installed APKs will automatically download and apply this update on launch — no APK re-install required!\n');
