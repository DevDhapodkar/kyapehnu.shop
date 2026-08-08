# Kya Pehnu? — Vendor App

Expo (SDK 57) app for shop owners: incoming orders, order lifecycle, and catalog
management. Scaffolded from `create-expo-app` and then converted off `expo-router`
onto React Navigation's native stack, matching `customer-app`.

## Structure

```
index.js                     registerRootComponent entry
App.js                       SafeAreaProvider + navigator
src/navigation/              native-stack, obsidian dark theme
src/screens/
  OrderListScreen.js         order queue, filtered by status
  OrderDetailScreen.js       item breakdown + Accept / Mark Ready
  CatalogManagerScreen.js    availability toggles + new listing form
src/components/              GlassCard, GlassButton, StatusPill, FilterTabs, OrderCard
src/api/vendorApi.js         axios client for /backend
src/store/useVendorStore.js  zustand: orders + catalog
src/theme/colors.js          obsidian / charcoal palette (mirrors customer-app)
src/utils/format.js          rupee, age, address formatters
```

## Running

From the monorepo root:

```
npm run dev:vendor
```

Standalone:

```
npm start
```

## Backend connection

`app.json` → `expo.extra.apiBaseUrl` points at the Express server
(`http://localhost:5000` by default). On Android emulators the client rewrites
`localhost` to `10.0.2.2`; on a physical device set the LAN IP there instead.

Requests are authenticated with a Firebase ID token. Until the auth screens
exist, set `expo.extra.devAuthToken` in `app.json`, or call
`setAuthToken(token)` from `src/api/vendorApi.js` once sign-in lands.

## Endpoints used

| Action | Request |
| --- | --- |
| Shop profile | `GET /api/vendors/me` |
| Order queue | `GET /api/orders/vendor/mine` |
| Accept order | `PATCH /api/orders/:id/status` `{ status: 'ACCEPTED' }` |
| Mark ready for pickup | `POST /api/orders/:orderId/ready` |
| Catalog (incl. out of stock) | `GET /api/products/mine` |
| Toggle availability | `PATCH /api/products/:id` `{ isAvailable }` |
| New listing | `POST /api/products` |

`POST /api/orders/:orderId/ready` is the one call with physical-world side
effects: the backend dispatches a Porter driver to the store and sends a
WhatsApp confirmation, in parallel. It responds with
`{ order, logistics: { porter, whatsapp } }` — either leg can fail
independently, so the UI reports both outcomes.
