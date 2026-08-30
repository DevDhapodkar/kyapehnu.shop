# Kya Pehnu? - Architecture & System Blueprint

## Core Concept
A hyper-local fashion delivery aggregator (Swiggy/Zomato model) for independent clothing retailers in Nagpur. 

## Design System

Dark, editorial, bento-led. It lives in code, not in this document: the tokens
are `customer-app/src/theme/` (`colors.js`, `typography.js`, `layout.js`) and the
primitives are `customer-app/src/components/ui/`. A screen composes primitives
and spends tokens; it never declares a hex value, a radius or a font size of its
own.

- **Surfaces.** Three layers — a near-black page (`colors.ink`), opaque bento
  cards that signal elevation by getting *lighter* (`surface` → `surfaceHigh`),
  and translucent glass for panels that sit over a photograph or the 3D scene.
- **Shape.** Large radii (`radii.lg` 28 / `radii.xl` 36) on cards, and
  `radii.pill` on every control. Buttons are pills; icon buttons are perfect
  discs whose radius is derived from their size.
- **Type.** One scale (`typography`): a wide-tracked uppercase `display` used
  once per screen, dense sans for headings, and 10px uppercase micro labels
  doing the work labels do in a lighter interface.
- **Colour policy.** The interface is monochrome and saturation is a signal.
  `gradients.aurora` is the conversion accent, reserved for the single
  highest-intent action on a screen (place order, create account). Near-white
  pills are the everyday primary. `statusColors` is the only other place a hue
  is allowed, and only to say where an order sits in its lifecycle.
- **Gradients ship no dependency.** `components/ui/Gradient.js` paints a ramp as
  abutting flat bands (`utils/color.js` does the sampling), so no native
  gradient module is needed and no contributor has to rebuild a dev client for
  paint. Bands must never overlap — half the ramps are translucent scrims, and
  overlapping translucent bands compound alpha into visible stripes.
- **Navigation.** The customer flow carries a floating pill dock
  (`navigation/customerTabs.js` + `components/ui/TabDock.js`) rendered per
  screen over the existing native stack, rather than a second navigator.

## Project Structure (Monorepo)
1. `/backend` - Node.js/Express server handling logistics, databases, and webhooks.
2. `/customer-app` - React Native (Expo) app. **One unified binary serving both audiences**: buyers and shop owners. `role` in `src/store/useAuthStore.js` (`CUSTOMER` | `VENDOR`) is the only switch — `AppNavigator` mounts the Customer Flow or the Vendor Flow from it. The vendor screens live under `src/screens/vendor/`.

There is no separate vendor binary. A shop owner and a buyer install the same app; the backend profile behind their Firebase uid decides which flow they land in. Profile → Vendor Mode toggles it manually for testing.

## Component Specifications

### 1. Customer App (Frontend)
- Tech: Expo, React Native Reanimated, React Three Fiber (R3F), Expo GL.
- Intro Sequence: 3D scrollytelling home page. Drone-shot camera tied to scroll position, orbiting a 3D black men's outfit, then a red dress.
- 3D assets: authored GLBs live in `customer-app/assets/models/source/` and are never bundled. `npm run models:optimize` (`customer-app/scripts/optimize-models.mjs`) writes the shipped copies to `customer-app/assets/models/`, which is what the app `require()`s. The pipeline strips unused morph targets, resizes textures to 1024px WebP, and quantizes vertex attributes via `KHR_mesh_quantization` — deliberately avoiding Draco/Meshopt/KTX2, since each needs a wasm transcoder that expo-gl and Metro cannot ship cleanly. Combined output is 3.6 MB, down from 26 MB of source.
- E-commerce Loop: Auto-fetch GPS location, index nearby local fashion items, Product Detail Pages (PDP), global cart state, checkout, and live map tracking for delivery.

### 2. Vendor Operations (Frontend)
- Tech: same Expo app as above, Vendor Flow (`/customer-app/src/screens/vendor/`).
- Features: Catalog management, real-time incoming order alerts, order status toggles (Accept, Ready for Pickup).
- "Mark Ready for Pickup" issues `POST /api/orders/:orderId/ready`, which fans out to Porter and WhatsApp in parallel.

### 3. Backend & Logistics (Node.js)
- Database: MongoDB Atlas (Schemas: Users, Vendors, Products, Orders).
- Auth & Real-time: Firebase Auth and Cloud Messaging for real-time app notifications.
- Porter API: Triggered automatically to dispatch a driver when a vendor marks an order as "Ready".
- WhatsApp Integration: Webhook via WhatsApp Cloud API to instantly message the vendor's phone upon new order placement. Also letting vendor add their products/ manage inventory via Whatsapp