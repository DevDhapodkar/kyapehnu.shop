# Premium Light App Design — Stitch screen index

Fetched from Google Stitch (stitch.withgoogle.com) via its remote MCP endpoint.

| Field | Value |
|---|---|
| Project ID | `15360757500694020784` |
| Design system | Ivory Studio Luxury |
| Device | MOBILE |
| Screens | 23 (18 UI + 5 assets/refs) |
| Created | 2026-09-03 |
| Updated | 2026-09-03 |

## UI screens → app targets

| # | Stitch screen | Size | Maps to (existing RN source) |
|---|---|---|---|
| 1 | Catalogue Manager — Live Inventory | 780×2530 | `customer-app/src/screens/vendor/CatalogManagerScreen.js` |
| 2 | Delivery Address — Apple Glass Aesthetic | 784×2624 | `customer-app/src/screens/AddressScreen.js` |
| 3 | Live Tracking — Apple Glass Aesthetic | 780×2328 | `customer-app/src/screens/LiveTrackingScreen.js` |
| 4 | Live Tracking — Porter Dispatch | 980×2566 | `customer-app/src/screens/LiveTrackingScreen.js` |
| 5 | My Orders — Apple Glass Aesthetic | 780×3046 | `customer-app/src/screens/MyOrdersScreen.js` |
| 6 | Product Detail — Apple Glass Aesthetic | 780×3376 | `customer-app/src/screens/ProductDetailScreen.js` |
| 7 | Product Detail — Chanderi Angrakha | 780×4114 | `customer-app/src/screens/ProductDetailScreen.js` |
| 8 | Profile & Settings — Apple Glass Aesthetic | 780×4086 | `customer-app/src/screens/ProfileScreen.js` |
| 9 | Register Your Shop — Vendor Desk | 780×4588 | `customer-app/src/screens/VendorRegisterScreen.js` |
| 10 | Scrollytelling Intro — Apple Glass Aesthetic | 2560×2048 | `customer-app/src/components/ScrollytellingSequence.js` |
| 11 | Scrollytelling Intro — Mobile Proximity Experience | 780×1768 | `customer-app/src/components/ScrollytellingSequence.js` |
| 12 | Sign In & Auth — Apple Glass Aesthetic | 780×2192 | `customer-app/src/screens/AuthScreen.js` |
| 13 | Storefront Home | 980×4004 | `customer-app/src/screens/HomeScreen.js` |
| 14 | Storefront Home — Apple Glass Aesthetic | 780×3836 | `customer-app/src/screens/HomeScreen.js` |
| 15 | Vendor Order Detail — Fulfillment Sheet | 780×2488 | `customer-app/src/screens/vendor/OrderDetailScreen.js` |
| 16 | Vendor Order Queue — Dispatch Hub | 780×2614 | `customer-app/src/screens/vendor/OrderListScreen.js` |
| 17 | Your Bag | 980×3178 | `customer-app/src/screens/CartScreen.js` |
| 18 | Your Bag — Apple Glass Aesthetic | 780×2598 | `customer-app/src/screens/CartScreen.js` |

## Assets & references

| Item | Kind |
|---|---|
| Cinematic drone aerial shot looking straight down and tilted at hig… | (AI image / background asset) |
| Cinematic luxury fashion editorial background, atmospheric dim mood… | (AI image / background asset) |
| Editorial portrait headshot of an elegant stylish Indian woman in h… | (AI image / background asset) |
| Kya Pehnu? Brand Logo | (brand asset) |
| kyapehnudesignbrief.md | (design brief document) |

## Files in this folder

- `design-system.md` — the project's DESIGN.md (colors, fonts, tone).
- `design-theme.json` — structured theme tokens (fonts, spacing, roundness, named colors).
- `screens.json` — full manifest (stable screen/file ids, dimensions, RN targets).
- `screens/*.html`, `screens/*.png` — populated by `../fetch_screens.py` where egress allows it.

