# Shopping data & catalogue

## Where the products come from

The customer shopping experience (welcome page, department lists, filters,
search, and the "nearest to you" rail) reads its catalogue through
`src/shop/useCatalog.js`, which tries three sources in order:

1. **Cloud Firestore `products` collection** — the primary, connected database.
   The same free Firebase project used for auth also holds the catalogue, read
   directly by the client SDK (`src/shop/firestoreCatalog.js`). Public read is
   allowed by `firestore.rules`; only the Admin SDK / console may write. **No
   Express server or MongoDB is required for browsing.**
2. **REST `GET /api/products`** — the Express + MongoDB backend, for deployments
   that run it.
3. **Bundled sample catalogue** (`src/data/mockStores.js`) — demo data so the
   grid is never empty when nothing is connected/seeded. The list header shows a
   subtle "sample catalogue" note when this is what's being shown.

### Why it wasn't "connected" before

The catalogue was originally modelled for **MongoDB** (the vendor/order backend),
while **Firebase** was wired only for auth + the user-role profile. With no
MongoDB and no deployed backend in a fresh setup, the app fell back to sample
data. Putting the catalogue in **Firestore** — which is already configured —
connects it with zero extra infrastructure.

## Seeding the real database

Populate Firestore with demo products (needs the Admin **service account** in
`backend/.env` — Firebase console → Project settings → Service accounts →
Generate new private key → fill `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`):

```bash
cd backend
npm run seed:firestore     # writes 15 demo products to Firestore `products`
npm run deploy:rules       # publishes firestore.rules (public read on products)
```

`deploy:rules` publishes `firestore.rules` via the Security Rules API using the
same service account — no Firebase CLI login needed. (Equivalent to
`firebase deploy --only firestore:rules` if you prefer the CLI.) The read rules
must be live or the client SDK cannot see the products.

Reload the app — the shop screens now show **live** data (no "sample" note), and
real shops appear as vendors add products.

> The MongoDB path is still available: `npm run seed:catalog` seeds Mongo and
> `GET /api/products` serves it, used automatically if Firestore is empty and the
> backend is running.

## Checkout → order (the two-sided loop)

Checkout writes real orders to Firestore, closing the loop with the vendor desk:

- The cart can hold items from several shops, so checkout **splits it into one
  order per vendor** (`src/shop/checkout.js`, pure + unit-tested) — the standard
  marketplace resolution of a multi-vendor cart.
- `src/shop/placeOrders.js` writes each order to the `orders` collection,
  stamped with the signed-in customer's `customerUid` and `status: PENDING`.
  `firestore.rules` lets a customer create only their own orders and read only
  their own; the vendor reads and advances only orders for their `vendorUid`.
- The Cart screen collects delivery details (name, phone, address, pincode),
  prefilled from the account, and shows "N shops" when the cart will split.

An order placed for a shop with a `vendorUid` (an onboarded vendor — see the
demo vendors in AUTH.md) appears on that shop's order desk in real time. A demo
customer account for testing the loop:

| Email | Password |
|-------|----------|
| `customer@kyapehnu.shop` | `KyaPehnu@123` |

## "Nearest to you"

Each product carries its shop's `storeLocation` (`{ latitude, longitude }`). The
storefront rail computes the great-circle distance from the shopper's GPS
(`useDeliveryLocation`) to every shop with `src/shop/distance.js` (haversine) and
sorts nearest-first. If location permission is denied it falls back to Nagpur
city centre, so the rail always has a meaningful order.
