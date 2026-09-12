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
if (fs.existsSync(distWebDir)) {
  fs.rmSync(distWebDir, { recursive: true, force: true });
}
execSync('npx expo export -p web --output-dir dist-web --clear', {
  cwd: projectRoot,
  stdio: 'inherit',
});

console.log('✨ [2/4] Injecting PWA meta tags and manifest...');
const indexPath = path.join(distWebDir, 'index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');

  // Enforce strict native app viewport: disables zooming, sets safe area fit and virtual keyboard resize mode
  html = html.replace(
    /<meta\s+name=["']viewport["'][^>]*>/i,
    '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content" />'
  );

  // Inject PWA meta tags, Google Fonts, mobile hardening CSS, and early gesture protection into <head>
  const headInject = `
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Kya Pehnu?" />
    <meta name="apple-touch-fullscreen" content="yes" />
    <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
    <meta name="HandheldFriendly" content="true" />
    <meta name="theme-color" content="#FAF9F5" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..700;1,400..700&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            colors: {
              'primary': '#a00025',
              'primary-container': '#c4243a',
              'primary-fixed': '#ffdad9',
              'primary-fixed-dim': '#ffb3b3',
              'on-primary': '#ffffff',
              'on-primary-fixed': '#400009',
              'on-primary-fixed-variant': '#920021',
              'on-primary-container': '#ffdddc',
              'secondary': '#795900',
              'secondary-container': '#fece68',
              'secondary-fixed': '#ffdea1',
              'secondary-fixed-dim': '#efc05c',
              'on-secondary': '#ffffff',
              'on-secondary-fixed': '#261900',
              'on-secondary-fixed-variant': '#5c4300',
              'on-secondary-container': '#765600',
              'tertiary': '#95202d',
              'tertiary-container': '#b63943',
              'tertiary-fixed': '#ffdad9',
              'tertiary-fixed-dim': '#ffb3b3',
              'on-tertiary': '#ffffff',
              'on-tertiary-fixed': '#400009',
              'on-tertiary-fixed-variant': '#8a1827',
              'on-tertiary-container': '#ffdddc',
              'error': '#ba1a1a',
              'error-container': '#ffdad6',
              'on-error': '#ffffff',
              'on-error-container': '#93000a',
              'background': '#faf9f5',
              'on-background': '#1b1c1a',
              'surface': '#faf9f5',
              'on-surface': '#1b1c1a',
              'surface-variant': '#e3e2df',
              'on-surface-variant': '#5a4040',
              'surface-tint': '#b91a33',
              'surface-dim': '#dbdad6',
              'surface-bright': '#faf9f5',
              'surface-container-lowest': '#ffffff',
              'surface-container-low': '#f4f4f0',
              'surface-container': '#efeeea',
              'surface-container-high': '#e9e8e4',
              'surface-container-highest': '#e3e2df',
              'inverse-surface': '#2f312e',
              'inverse-on-surface': '#f2f1ed',
              'inverse-primary': '#ffb3b3',
              'outline': '#8e6f6f',
              'outline-variant': '#e3bebd',
              'ground-base': '#FAF9F5',
              'ground-subtle': '#F4F3EE',
              'surface-porcelain': '#FFFFFF',
              'surface-glass': 'rgba(255, 255, 255, 0.75)',
              'border-hairline': '#E5E3DC',
              'border-hairline-alpha': 'rgba(18, 18, 20, 0.08)',
              'text-obsidian': '#121215',
              'text-slate': '#4A4950',
              'text-ash': '#7E7C85',
              'accent-crimson': '#C4243A',
              'accent-crimson-deep': '#8E1B29',
              'accent-gold': '#B38A2B',
              'accent-gold-deep': '#946C18',
              'noir': {
                'base': '#0e0e10',
                'surface': '#131315',
                'card': '#18181b',
                'elevated': '#202024',
                'border': 'rgba(255, 255, 255, 0.08)',
              },
              'crimson': {
                'DEFAULT': '#c4243a',
                'hover': '#a81c2f',
                'glow': 'rgba(196, 36, 58, 0.35)',
              },
              'gold': {
                'DEFAULT': '#C8A24A',
                'light': '#DFBF73',
                'dark': '#9E782F',
              },
            },
            borderRadius: {
              'DEFAULT': '0.125rem',
              'lg': '0.25rem',
              'xl': '0.5rem',
              'full': '0.75rem',
            },
            spacing: {
              'space-xs': '0.25rem',
              'space-sm': '0.5rem',
              'space-md': '1rem',
              'space-lg': '1.5rem',
              'space-xl': '2.5rem',
              'gutter': '1rem',
              'gutter-xs': '0.375rem',
              'gutter-sm': '0.75rem',
              'gutter-md': '1.25rem',
              'gutter-lg': '2rem',
              'gutter-xl': '3rem',
              'margin': '1.25rem',
              'screen-margin-mobile': '1.25rem',
              'screen-margin-desktop': '3rem',
            },
            fontFamily: {
              'title-lg': ['ebGaramond', 'EB Garamond', 'serif'],
              'title-md': ['ebGaramond', 'EB Garamond', 'serif'],
              'headline-xl': ['ebGaramond', 'EB Garamond', 'serif'],
              'headline-md': ['ebGaramond', 'EB Garamond', 'serif'],
              'display-hero': ['ebGaramond', 'EB Garamond', 'serif'],
              'display-hero-mobile': ['ebGaramond', 'EB Garamond', 'serif'],
              'serif': ['"EB Garamond"', 'serif'],
              'body-lg': ['plusJakartaSans', 'Plus Jakarta Sans', 'sans-serif'],
              'body-md': ['plusJakartaSans', 'Plus Jakarta Sans', 'sans-serif'],
              'body-sm': ['plusJakartaSans', 'Plus Jakarta Sans', 'sans-serif'],
              'label-md': ['plusJakartaSans', 'Plus Jakarta Sans', 'sans-serif'],
              'label-sm': ['plusJakartaSans', 'Plus Jakarta Sans', 'sans-serif'],
              'tabular-caption': ['plusJakartaSans', 'Plus Jakarta Sans', 'sans-serif'],
              'tabular-price': ['plusJakartaSans', 'Plus Jakarta Sans', 'sans-serif'],
              'eyebrow': ['plusJakartaSans', 'Plus Jakarta Sans', 'sans-serif'],
              'sans': ['"Plus Jakarta Sans"', 'sans-serif'],
            },
            fontSize: {
              'title-lg': ['26px', { lineHeight: '32px', letterSpacing: '-0.25px', fontWeight: '500' }],
              'tabular-caption': ['12px', { lineHeight: '16px', fontWeight: '500' }],
              'tabular-price': ['16px', { lineHeight: '20px', letterSpacing: '-0.1px', fontWeight: '600' }],
              'body-md': ['14px', { lineHeight: '21px', fontWeight: '400' }],
              'body-sm': ['12px', { lineHeight: '18px', fontWeight: '400' }],
              'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
              'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.06em', fontWeight: '600' }],
              'label-sm': ['10px', { lineHeight: '14px', letterSpacing: '0.12em', fontWeight: '700' }],
              'title-md': ['22px', { lineHeight: '28px', letterSpacing: '-0.2px', fontWeight: '600' }],
              'headline-md': ['24px', { lineHeight: '32px', letterSpacing: '0em', fontWeight: '500' }],
              'headline-xl': ['36px', { lineHeight: '44px', letterSpacing: '-0.01em', fontWeight: '400' }],
              'display-hero-mobile': ['32px', { lineHeight: '38px', letterSpacing: '-0.4px', fontWeight: '400' }],
              'eyebrow': ['10px', { lineHeight: '14px', letterSpacing: '0.25em', fontWeight: '600' }],
              'display-hero': ['40px', { lineHeight: '46px', letterSpacing: '-0.5px', fontWeight: '400' }],
            },
          },
        },
      };
    </script>
    <link rel="apple-touch-icon" href="/app/apple-touch-icon.png" />
    <link rel="manifest" href="/app/manifest.json" />
    <style id="kp-native-app-hardening">
      .material-symbols-outlined {
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        vertical-align: middle;
      }
      .material-symbols-outlined.fill-1 {
        font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      }
      /* Prevent tap highlight flashes and callout menus */
      *, *::before, *::after {
        -webkit-tap-highlight-color: transparent !important;
        -webkit-touch-callout: none !important;
      }
      /* Prevent rubber-band bounce, pull-to-refresh, accidental text selection on UI chrome */
      html, body, #root {
        touch-action: pan-x pan-y !important;
        overscroll-behavior: none !important;
        overscroll-behavior-y: none !important;
        overscroll-behavior-x: none !important;
        -webkit-user-select: none !important;
        user-select: none !important;
        -webkit-overflow-scrolling: touch !important;
      }
      /* Allow text selection specifically within inputs, textareas, and marked text */
      input, textarea, select, [contenteditable="true"], .selectable-text {
        -webkit-user-select: text !important;
        user-select: text !important;
      }
      /* Prevent iOS Safari 10+ focus auto-zoom on mobile (<16px input font size triggers browser zoom) */
      @media screen and (max-width: 768px) {
        input, select, textarea {
          font-size: 16px !important;
        }
      }
      /* Prevent image dragging ghost thumbnail */
      img, a {
        -webkit-user-drag: none !important;
        user-drag: none !important;
      }
      ::-webkit-scrollbar {
        display: none;
        width: 0px;
        height: 0px;
        background: transparent;
      }
    </style>
    <script>
      (function() {
        if (typeof window === 'undefined') return;
        var p = function(e) { e.preventDefault(); };
        document.addEventListener('gesturestart', p, { passive: false });
        document.addEventListener('gesturechange', p, { passive: false });
        document.addEventListener('gestureend', p, { passive: false });
        document.addEventListener('touchstart', function(e) {
          if (e.touches && e.touches.length > 1) { e.preventDefault(); }
        }, { passive: false });
        var lastTap = 0;
        document.addEventListener('touchend', function(e) {
          var now = Date.now();
          if (now - lastTap <= 300) {
            var t = e.target;
            var isInput = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
            if (!isInput) { e.preventDefault(); }
          }
          lastTap = now;
        }, { passive: false });
        document.addEventListener('wheel', function(e) {
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); }
        }, { passive: false });
        document.addEventListener('contextmenu', function(e) {
          var t = e.target;
          var isInput = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
          if (!isInput) { e.preventDefault(); }
        });
      })();
    </script>
  `;

  if (!html.includes('id="kp-native-app-hardening"')) {
    html = html.replace('</head>', `${headInject}\n  </head>`);
  }
  
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
const faviconIcoSource = path.join(projectRoot, 'assets/images/favicon.ico');
if (fs.existsSync(faviconIcoSource)) {
  fs.copyFileSync(faviconIcoSource, path.join(distWebDir, 'favicon.ico'));
}

// Clean target directory and copy fresh build files
if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}
fs.mkdirSync(targetDir, { recursive: true });
fs.cpSync(distWebDir, targetDir, { recursive: true, force: true });

console.log('✅ [4/4] Web app build and sync complete! Ready for Vercel deployment at kyapehnu.shop/app');
