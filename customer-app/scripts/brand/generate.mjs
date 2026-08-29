/**
 * Brand asset generator.
 *
 * Rasterises the Kya Pehnu? mark from vector source into every size and
 * variant the app and the stores need. The SVG below is the single source of
 * truth for the logo: nothing in the repo is a hand-edited bitmap, so a change
 * to the mark propagates to the app icon, the adaptive icon, the splash, the
 * favicon, and the in-app lockup in one run.
 *
 *   node scripts/brand/generate.mjs
 *
 * The mark is a clothes hanger — the shop's object, not a shopping bag or a
 * cart — with a crimson bead at the hook. Gold on obsidian, the two accents the
 * palette already reserves for provenance and for action.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BRAND_DIR = path.join(ROOT, 'assets/brand');
const IMAGE_DIR = path.join(ROOT, 'assets/images');

// --- Palette (mirrors src/theme/colors.js) --------------------------------
const OBSIDIAN = '#050506';
const GOLD_BRIGHT = '#E8CB7E';
const GOLD = '#C8A24A';
const GOLD_DEEP = '#7A5F22';
const CRIMSON = '#C4243A';
const IVORY = '#F5F3EF';

/**
 * The hanger, drawn once in a 512 box.
 *
 * Stroked rather than filled: a constant 26px stroke with round joins keeps the
 * mark legible when it is scaled down to a 48px launcher icon, where a filled
 * silhouette would close up into a blob.
 */
const markGeometry = (stroke, bead) => `
  <g fill="none" stroke="${stroke}" stroke-width="26" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 256 218 L 256 150 A 30 30 0 0 0 196 150 L 196 178" />
    <path d="M 96 398 L 256 216 L 416 398 Z" />
  </g>
  ${bead ? `<circle cx="226" cy="150" r="7" fill="${bead}" />` : ''}
`;

const goldRamp = `
  <linearGradient id="gold" x1="0" y1="0" x2="0.35" y2="1">
    <stop offset="0%" stop-color="${GOLD_BRIGHT}" />
    <stop offset="52%" stop-color="${GOLD}" />
    <stop offset="100%" stop-color="${GOLD_DEEP}" />
  </linearGradient>
`;

/** The mark alone, on transparency — the in-app logo. */
const markSvg = () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>${goldRamp}</defs>
  ${markGeometry('url(#gold)', CRIMSON)}
</svg>`;

/** Single-colour mark, for the Android monochrome (themed-icon) layer. */
const monochromeSvg = (color) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  ${markGeometry(color, null)}
</svg>`;

/**
 * The app icon: the mark on an obsidian field, lifted by a radial glow so the
 * tile does not read as a dead black square on a dark home screen.
 */
const iconSvg = () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    ${goldRamp}
    <radialGradient id="glow" cx="0.5" cy="0.46" r="0.62">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.16" />
      <stop offset="55%" stop-color="${GOLD}" stop-opacity="0.05" />
      <stop offset="100%" stop-color="${OBSIDIAN}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="${OBSIDIAN}" />
  <rect width="512" height="512" fill="url(#glow)" />
  <rect x="26" y="26" width="460" height="460" rx="112"
        fill="none" stroke="${GOLD_DEEP}" stroke-opacity="0.5" stroke-width="2" />
  <g transform="translate(256 259) scale(0.78) translate(-256 -259)">
    ${markGeometry('url(#gold)', CRIMSON)}
  </g>
</svg>`;

/**
 * Android adaptive foreground. The launcher crops to a circle and animates the
 * layer, so the art has to sit inside the 66% safe zone — hence the extra
 * scale-down relative to the iOS icon.
 */
const adaptiveForegroundSvg = () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>${goldRamp}</defs>
  <g transform="translate(256 259) scale(0.56) translate(-256 -259)">
    ${markGeometry('url(#gold)', CRIMSON)}
  </g>
</svg>`;

/** Android adaptive background: the obsidian field and its glow, no art. */
const adaptiveBackgroundSvg = () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="glow" cx="0.5" cy="0.44" r="0.66">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.14" />
      <stop offset="60%" stop-color="${GOLD}" stop-opacity="0.04" />
      <stop offset="100%" stop-color="${OBSIDIAN}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="${OBSIDIAN}" />
  <rect width="512" height="512" fill="url(#glow)" />
</svg>`;

/**
 * Horizontal lockup: mark, hairline rule, wordmark. The wordmark is set in the
 * platform's own light sans at wide tracking — the same treatment the app gives
 * every eyebrow, so the logo belongs to the interface rather than sitting on it.
 */
const lockupSvg = (wordColor = IVORY) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300" width="1200" height="300">
  <defs>${goldRamp}</defs>
  <g transform="translate(150 150) scale(0.46) translate(-256 -259)">
    ${markGeometry('url(#gold)', CRIMSON)}
  </g>
  <line x1="270" y1="80" x2="270" y2="220" stroke="${GOLD_DEEP}" stroke-opacity="0.55" stroke-width="2" />
  <text x="320" y="140" fill="${wordColor}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="76" font-weight="300" letter-spacing="10">KYA PEHNU?</text>
  <text x="324" y="196" fill="${GOLD}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="26" font-weight="400" letter-spacing="12">NAGPUR · DELIVERED</text>
</svg>`;

/**
 * A large, very low-contrast hanger used as a watermark behind empty states and
 * hero panels — the "letterhead" of the app.
 */
const watermarkSvg = () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  ${markGeometry(GOLD, null)}
</svg>`;

// ---------------------------------------------------------------------------

const render = async (svg, outPath, size, { height } = {}) => {
  const buffer = Buffer.from(svg);
  await sharp(buffer, { density: 640 })
    .resize(size, height ?? size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, palette: false })
    .toFile(outPath);
  console.log(`  ✓ ${path.relative(ROOT, outPath)}  ${size}${height ? `×${height}` : ''}`);
};

const run = async () => {
  await mkdir(BRAND_DIR, { recursive: true });
  await mkdir(IMAGE_DIR, { recursive: true });

  console.log('Brand marks →');
  await render(markSvg(), path.join(BRAND_DIR, 'mark.png'), 512);
  await render(markSvg(), path.join(BRAND_DIR, 'mark@2x.png'), 1024);
  await render(lockupSvg(), path.join(BRAND_DIR, 'lockup.png'), 1200, { height: 300 });
  await render(watermarkSvg(), path.join(BRAND_DIR, 'watermark.png'), 512);
  await render(monochromeSvg(IVORY), path.join(BRAND_DIR, 'mark-mono.png'), 512);

  console.log('App icons →');
  await render(iconSvg(), path.join(IMAGE_DIR, 'icon.png'), 1024);
  await render(adaptiveForegroundSvg(), path.join(IMAGE_DIR, 'android-icon-foreground.png'), 1024);
  await render(adaptiveBackgroundSvg(), path.join(IMAGE_DIR, 'android-icon-background.png'), 1024);
  await render(monochromeSvg(IVORY), path.join(IMAGE_DIR, 'android-icon-monochrome.png'), 1024);
  await render(markSvg(), path.join(IMAGE_DIR, 'splash-icon.png'), 512);
  await render(iconSvg(), path.join(IMAGE_DIR, 'favicon.png'), 96);

  // The old marketing render, refreshed from the same source so it cannot drift.
  await render(iconSvg(), path.join(IMAGE_DIR, 'logo-glow.png'), 512);

  console.log('Done.');
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
