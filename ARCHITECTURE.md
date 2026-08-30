# Kya Pehnu? - Architecture & System Blueprint

## Core Concept
A hyper-local fashion delivery aggregator (Swiggy/Zomato model) for independent clothing retailers in Nagpur. 

## Design System

Dark, glass, iOS-native. It lives in code, not in this document: the tokens are
`customer-app/src/theme/` (`colors.js`, `typography.js`, `layout.js`) and the
primitives are `customer-app/src/components/ui/`. A screen composes primitives
and spends tokens; it never declares a hex value, a radius or a font size of its
own.

- **One wallpaper, everything else is material.** `AuroraBackdrop` is mounted
  once at the app root: four broad blooms of coloured light drifting on
  near-black ink. The navigator theme and every screen container are
  transparent, so it runs behind the whole app. This is not decoration — it is
  what the glass is *for*. A frosted pane over flat black is indistinguishable
  from a grey card.
- **Real blur, not a translucent fill.** `GlassPanel` is the material every
  card, sheet, header, dock and action bar is made of, in three implementations:
  Apple's Liquid Glass through `expo-glass-effect` where iOS 26 offers it;
  `expo-blur` for a true backdrop blur on older iOS, on Android (Dimezis, SDK
  31+) and on web (CSS `backdrop-filter`); and a heavier veil where no blur can
  be had. Over the blur go a white veil and a drawn specular top edge — a blur
  alone is not a material.
  - Android has no compositor-level backdrop filter: `expo-blur` renders a
    target view offscreen and blurs that, so each pane must be handed the view
    it looks through. `BlurTargetProvider` wraps the app once and `GlassPanel`
    reads the ref from context. Without it the Dimezis methods silently fall
    back to no blur.
- **Materials, named after Apple's.** `thin`, `regular`, `thick` say how much a
  pane obscures; `overImage` is the one dark material, for glass laid over a
  photograph, where a white veil would wash the picture out.
- **Continuous corners.** `CONTINUOUS` (`borderCurve: 'continuous'`) is spread
  onto every rounded surface. Apple eases the straight edge into the corner
  rather than meeting it at an arc, and it is most of what separates a rounded
  rectangle that reads as iOS from one that reads as Android.
- **Type sized against iOS.** Body is 17pt, not the 14 a web-derived scale
  reaches for, and tracking goes negative as type gets bigger. No font family is
  named, so the app gets SF Pro on iOS and Roboto on Android rather than opting
  out of the system face.
- **No native header.** A platform header is an opaque bar that cannot be made
  of glass and would cut a flat band across the wallpaper. Every screen draws a
  `GlassHeader` that floats over its own content instead.
- **Colour policy.** The interface is monochrome and saturation is a signal.
  `gradients.aurora` is the conversion accent, reserved for the single
  highest-intent action on a screen. Near-white pills are the everyday primary.
  `statusColors` is the only other place a hue is allowed, and only to say where
  an order sits in its lifecycle.
- **Gradients ship no dependency.** `components/ui/Gradient.js` paints a ramp as
  flat bands laid out by flex (`utils/color.js` samples them), so no native
  gradient module is needed. Flex, not percentages: percentage-positioned bands
  round independently and leave hairline seams, and overlapping them to hide the
  seams compounds alpha on the translucent ramps into visible stripes.
- **Navigation.** The customer flow carries a floating pill dock
  (`navigation/customerTabs.js` + `components/ui/TabDock.js`) rendered per screen
  over the existing native stack, rather than a second navigator.

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