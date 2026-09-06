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

  // Inject PWA meta tags, Google Fonts, and apple touch icon into <head>
  const headInject = `
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Kya Pehnu?" />
    <meta name="theme-color" content="#FAF9F5" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..700;1,400..700&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet" />
    <link rel="apple-touch-icon" href="/app/apple-touch-icon.png" />
    <link rel="manifest" href="/app/manifest.json" />
  `;

  html = html.replace('</head>', `${headInject}\n  </head>`);
  
  // Ensure warm ivory background on html and body
  html = html.replace(
    'body {',
    'body {\n        background-color: #FAF9F5;'
  );
  html = html.replace(
    'html,',
    'html {\n        background-color: #FAF9F5;\n      }\n      html,'
  );

  // Pre-hydration luxury splash to guarantee zero black flash before JS bundle executes
  const preHydrationSplash = `
    <div id="root">
      <div style="position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background-color:#FAF9F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="position:relative;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:160px;height:160px;border-radius:80px;background:radial-gradient(circle, rgba(245,158,11,0.2) 0%, rgba(244,63,94,0.1) 60%, transparent 70%);filter:blur(20px);"></div>
          <img src="/app/apple-touch-icon.png" alt="Kya Pehnu" style="width:104px;height:104px;border-radius:28px;box-shadow:0 12px 36px rgba(196,36,58,0.18);position:relative;z-index:2;" />
        </div>
        <div style="margin-top:28px;font-size:26px;font-weight:500;color:#18181B;letter-spacing:-0.5px;font-family:'EB Garamond',Georgia,serif;">Kya Pehnu?</div>
        <div style="margin-top:6px;font-size:12px;color:#71717A;letter-spacing:0.2px;">Nagpur Hyperlocal Couture &bull; Under 60 Minutes</div>
      </div>
    </div>
  `;
  html = html.replace('<div id="root"></div>', preHydrationSplash.trim());

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
  background_color: '#FAF9F5',
  theme_color: '#FAF9F5',
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
