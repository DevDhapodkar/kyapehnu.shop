import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extractedDir = '/Users/devdhapodkar/Desktop/kyapehnu/stitch_screens/extracted';
const outDir = path.resolve(__dirname, '../src/stitch');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

export function cleanHtmlToJsx(html) {
  let body = html;
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    body = bodyMatch[1];
  }
  // Remove scripts
  body = body.replace(/<script[\s\S]*?<\/script>/gi, '');
  // Remove HTML comments
  body = body.replace(/<!--[\s\S]*?-->/g, '');
  // Attributes
  body = body.replace(/\bclass=/g, 'className=');
  body = body.replace(/\bfor=/g, 'htmlFor=');
  body = body.replace(/\btabindex=/g, 'tabIndex=');
  body = body.replace(/\bautocomplete=/g, 'autoComplete=');
  body = body.replace(/\bautofocus=/g, 'autoFocus=');
  body = body.replace(/\breadonly=/g, 'readOnly=');
  
  // SVG attributes
  body = body.replace(/\bstroke-width=/g, 'strokeWidth=');
  body = body.replace(/\bstroke-linecap=/g, 'strokeLinecap=');
  body = body.replace(/\bstroke-linejoin=/g, 'strokeLinejoin=');
  body = body.replace(/\bfill-rule=/g, 'fillRule=');
  body = body.replace(/\bclip-rule=/g, 'clipRule=');
  body = body.replace(/\bstop-color=/g, 'stopColor=');
  body = body.replace(/\bstop-opacity=/g, 'stopOpacity=');

  // Self closing void HTML elements
  body = body.replace(/<(img|input|hr|br|meta|link)([^>]*?)(?<!\/)>/gi, '<$1$2 />');
  
  // Convert style="..." to style={{ ... }}
  body = body.replace(/\bstyle="([^"]*)"/g, (match, styleStr) => {
    const rules = styleStr.split(';').filter(r => r.trim());
    const obj = {};
    rules.forEach(rule => {
      const [k, ...vParts] = rule.split(':');
      if (!k || vParts.length === 0) return;
      const key = k.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      const val = vParts.join(':').trim();
      obj[key] = val;
    });
    return `style={${JSON.stringify(obj)}}`;
  });

  return body;
}

function loadExtracted(nameFragment) {
  const files = fs.readdirSync(extractedDir);
  const matched = files.find(f => f.includes(nameFragment) && f.endsWith('.html'));
  if (!matched) {
    throw new Error(`File fragment not found: ${nameFragment}`);
  }
  const content = fs.readFileSync(path.join(extractedDir, matched), 'utf8');
  return cleanHtmlToJsx(content);
}

console.log('Generating Stitch components...');

// Export clean JSX chunks for each screen so screens can render exact light/dark DOM
const screens = [
  { id: 'splash_light', fragment: 'final_light_theme_Splash_Screen' },
  { id: 'splash_dark', fragment: 'final_theme_dark_Splash_Screen' },
  { id: 'welcome_logo_centered', fragment: 'final_light_theme_Welcome_Screen__Logo_Centered_' },
  { id: 'welcome_simplified', fragment: 'Welcome_Screen___Frosted_Apple_Glass_Luxury' },
  { id: 'welcome_dark_matched', fragment: 'final_theme_dark_Welcome_Screen__Matched_' },
  { id: 'welcome_dark_standard', fragment: 'final_theme_dark_Welcome_Screen.' },
  { id: 'auth_light', fragment: 'final_light_theme_Sign_In___Auth' },
  { id: 'auth_dark', fragment: 'final_theme_dark_Sign_In___Auth' },
  { id: 'home_light', fragment: 'final_light_theme_Storefront_Home' },
  { id: 'home_dark', fragment: 'final_theme_dark_Storefront_Home' },
  { id: 'pdp_light', fragment: 'final_light_theme_Product_Detail' },
  { id: 'pdp_dark', fragment: 'final_theme_dark_Product_Detail' },
  { id: 'bag_light', fragment: 'final_light_theme_Your_Bag' },
  { id: 'bag_dark', fragment: 'final_theme_dark_Your_Bag' },
  { id: 'address_light', fragment: 'final_light_theme_Delivery_Address' },
  { id: 'address_dark', fragment: 'final_theme_dark_Delivery_Address' },
  { id: 'tracking_light', fragment: 'final_light_theme_Live_Tracking' },
  { id: 'tracking_dark', fragment: 'final_theme_dark_Live_Tracking' },
  { id: 'orders_atelier', fragment: 'final_light_theme_My_Orders__Atelier_Edition_' },
  { id: 'orders_remastered', fragment: 'My_Orders___Frosted_Glass___Ambient_Blobs' },
  { id: 'orders_dark', fragment: 'final_theme_dark_My_Orders' },
  { id: 'profile_light', fragment: 'final_light_theme_Profile___Settings' },
  { id: 'profile_dark', fragment: 'final_theme_dark_Profile___Settings' },
  { id: 'vendor_register_remastered', fragment: 'final_light_theme_Register_Your_Shop__Remastered_' },
  { id: 'vendor_register_desk', fragment: 'Register_Your_Shop___Vendor_Desk' },
  { id: 'catalogue_light', fragment: 'final_light_theme_Catalogue_Manager' },
  { id: 'vendor_queue_light', fragment: 'final_light_theme_Vendor_Order_Queue' },
  { id: 'vendor_queue_dark', fragment: 'final_theme_dark_Vendor_Order_Queue' },
  { id: 'vendor_detail_light', fragment: 'final_light_theme_Vendor_Order_Detail' },
  { id: 'vendor_detail_dark', fragment: 'final_theme_dark_Vendor_Order_Detail' },
  { id: 'product_ingestion_light', fragment: 'final_light_theme_Product_Ingestion___Catalog_Listing_Form' },
  { id: 'product_ingestion_dark', fragment: 'final_theme_dark_Product_Ingestion___Catalog_Listing_Form' }
];

const generated = {};
screens.forEach(s => {
  try {
    generated[s.id] = loadExtracted(s.fragment);
    console.log(`✓ Loaded & sanitized: ${s.id}`);
  } catch (err) {
    console.error(`✗ Error loading ${s.id}:`, err.message);
  }
});

fs.writeFileSync(path.join(outDir, 'stitchRawJsx.json'), JSON.stringify(generated, null, 2));
console.log('Saved stitchRawJsx.json to', outDir);
