import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distWebDir = path.join(projectRoot, 'dist-web');

// Destination in the Next.js website repo
const defaultTargetDir = path.resolve(projectRoot, '../../../kyapehnu website/kya-pehnu-/public/app');
const targetDir = process.env.NEXT_PUBLIC_APP_DIR || defaultTargetDir;

console.log('🚀 [1/4] Building Expo web distribution for /app...');
execSync('npx expo export -p web --output-dir dist-web --clear', {
  cwd: projectRoot,
  stdio: 'inherit',
});

console.log('✨ [2/4] Injecting PWA meta tags and manifest...');
const indexPath = path.join(distWebDir, 'index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');

  // Inject PWA meta tags and apple touch icon into <head>
  const pwaTags = `
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Kya Pehnu?" />
    <meta name="theme-color" content="#050506" />
    <link rel="apple-touch-icon" href="/app/apple-touch-icon.png" />
    <link rel="manifest" href="/app/manifest.json" />
  `;

  html = html.replace('</head>', `${pwaTags}\n  </head>`);
  
  // Set dark background on body for desktop ambient
  html = html.replace(
    'body {',
    'body {\n        background-color: #020203;'
  );

  fs.writeFileSync(indexPath, html, 'utf8');
}

// Generate manifest.json
const manifest = {
  short_name: 'Kya Pehnu',
  name: 'Kya Pehnu? — New Outfit Under 60 Minutes',
  description: 'Hyper-local 60-minute fashion delivery in Nagpur.',
  icons: [
    {
      src: '/app/apple-touch-icon.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any maskable'
    },
    {
      src: '/app/favicon.png',
      sizes: '64x64',
      type: 'image/png'
    },
    {
      src: '/app/favicon.ico',
      sizes: '64x64 32x32 24x24 16x16',
      type: 'image/x-icon'
    }
  ],
  start_url: '/app',
  background_color: '#050506',
  theme_color: '#050506',
  display: 'standalone',
  orientation: 'portrait'
};

fs.writeFileSync(path.join(distWebDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

// Copy apple-touch-icon and favicon
const iconSource = path.join(projectRoot, 'assets/images/icon.png');
if (fs.existsSync(iconSource)) {
  fs.copyFileSync(iconSource, path.join(distWebDir, 'apple-touch-icon.png'));
}
const faviconSource = path.join(projectRoot, 'assets/images/favicon.png');
if (fs.existsSync(faviconSource)) {
  fs.copyFileSync(faviconSource, path.join(distWebDir, 'favicon.png'));
}

console.log(`📦 [3/4] Syncing web app to website destination: ${targetDir}...`);
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Clean target directory and copy files
fs.cpSync(distWebDir, targetDir, { recursive: true, force: true });

console.log('✅ [4/4] Web app build and sync complete! Ready for Vercel deployment at kyapehnu.shop/app');
