import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const customerAppDir = path.resolve(__dirname, '..');

const screensPath = path.join(customerAppDir, 'src/data/stitchScreens.json');
let screensStr = fs.readFileSync(screensPath, 'utf8');

screensStr = screensStr.replace(/across\s+Sitabuldi,?\s*Dharampeth\s*(?:&amp;|&)\s*Sadar/gi, 'across all of Nagpur');
screensStr = screensStr.replace(/across\s+Sitabuldi\s*(?:&amp;|&)\s*Dharampeth\.?/gi, 'across Nagpur.');
screensStr = screensStr.replace(/across\s+Sitabuldi\s*(?:&amp;|&)\s*Gandhibagh\.?/gi, 'across Nagpur.');
screensStr = screensStr.replace(/to\s+Dharampeth\s*(?:&amp;|&)\s*Sitabuldi\.?/gi, 'across Nagpur.');
screensStr = screensStr.replace(/to\s+Dharampeth\s*(?:&amp;|&)\s*Sitabuldi/gi, 'across Nagpur');
screensStr = screensStr.replace(/Sitabuldi\s*(?:&amp;|&)\s*Dharampeth\s+(?:network|guild)/gi, 'our Nagpur express network');
screensStr = screensStr.replace(/Join\s+Sitabuldi\s*(?:&amp;|&)\s*Dharampeth\s+network/gi, 'Join our Nagpur express network');
screensStr = screensStr.replace(/Filtered\s+by\s+Sitabuldi\s+Hub/gi, 'Delivering Across Nagpur');
screensStr = screensStr.replace(/Sitabuldi,\s*Dharampeth,\s*Nagpur/gi, 'Nagpur');
screensStr = screensStr.replace(/>Sitabuldi,\s*Nagpur</g, '>Nagpur<');

fs.writeFileSync(screensPath, screensStr, 'utf8');
console.log('Updated stitchScreens.json with full citywide Nagpur coverage');

// Update StitchScreenRenderer.js
const rendererPath = path.join(customerAppDir, 'src/components/StitchScreenRenderer.js');
let rendererStr = fs.readFileSync(rendererPath, 'utf8');

rendererStr = rendererStr.replace(/across\s+Sitabuldi,?\s*Dharampeth\s*(?:&amp;|&)\s*Sadar/gi, 'across all of Nagpur');
rendererStr = rendererStr.replace(/across\s+Sitabuldi\s*(?:&amp;|&)\s*Dharampeth\.?/gi, 'across Nagpur.');
rendererStr = rendererStr.replace(/across\s+Sitabuldi\s*(?:&amp;|&)\s*Gandhibagh\.?/gi, 'across Nagpur.');
rendererStr = rendererStr.replace(/to\s+Dharampeth\s*(?:&amp;|&)\s*Sitabuldi\.?/gi, 'across Nagpur.');
rendererStr = rendererStr.replace(/to\s+Dharampeth\s*(?:&amp;|&)\s*Sitabuldi/gi, 'across Nagpur');
rendererStr = rendererStr.replace(/Sitabuldi\s*(?:&amp;|&)\s*Dharampeth\s+(?:network|guild)/gi, 'our Nagpur express network');
rendererStr = rendererStr.replace(/Join\s+Sitabuldi\s*(?:&amp;|&)\s*Dharampeth/gi, 'Join our Nagpur');
rendererStr = rendererStr.replace(/Filtered\s+by\s+Sitabuldi\s+Hub/gi, 'Delivering Across Nagpur');
rendererStr = rendererStr.replace(/>Sitabuldi,\s*Nagpur</g, '>Nagpur<');

fs.writeFileSync(rendererPath, rendererStr, 'utf8');
console.log('Updated StitchScreenRenderer.js with citywide Nagpur coverage');
