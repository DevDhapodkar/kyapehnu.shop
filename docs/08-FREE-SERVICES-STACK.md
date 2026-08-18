# 08 — Free Services Stack (zero-budget launch)

Everything below is on a genuinely free tier (no card required where noted), and
each piece is feature-flagged so the app runs with or without it.

| Concern | Service | Free tier | Card? | Status in code |
| --- | --- | --- | --- | --- |
| Database | **MongoDB Atlas M0** | 512 MB, replica set (transactions work), geo | No | `MONGO_URI`; hardened `config/db.js` |
| Product images | **Cloudinary** | generous, CDN + auto-optimise | **No** | signed upload, flagged on when creds present |
| Backend hosting | **Render** / **Railway** free web service | small always-free / trial credits | varies | standard Node start (`npm start`) |
| Auth | **Firebase Auth** | generous free | No | verify wired; client sign-in still to do |
| Payments | Cash on Delivery | — | — | live now; gateway deferred |
| Delivery | manual | — | — | Porter deferred behind a flag |

> On “512 MB is small”: for a Nagpur pilot that's ~150k+ orders — over a year of
> runway — and you hit connection/CPU limits before storage. Atlas M0 → M10 is a
> console tier bump, no migration. Don't switch DBs for storage. See the DB
> discussion in the project notes.

## Image storage — Cloudinary (implemented)

Why Cloudinary over the alternatives, for a zero-budget fashion app:
- **No credit card** to start (Firebase Storage and Cloudflare R2 both want a
  card / billing enabled).
- **Image-native**: on-the-fly resize / WebP / quality — a real load-time and
  data win on low-end Android, which is the target market.
- **CDN-delivered**, so images don't touch our free-tier backend bandwidth.

Files are **never** proxied through our server and the **api_secret never ships
in the app**:

```
app  ──POST /api/uploads/product-image-signature──►  backend   (issues a signed,
                                                                 vendor-scoped param set)
app  ──POST file + signed params──►  Cloudinary  ──secure_url──►  app
app  ──create/patch product with images:[secure_url]──►  backend  ──►  Product.images
```

- Backend: `services/imageStorage.js` (`signParams` is pure + unit-tested),
  `POST /api/uploads/product-image-signature` (approved vendors only), enabled
  automatically when `CLOUDINARY_*` env vars are present, else returns 503 and
  the app degrades to placeholder images.
- App: `src/api/uploads.js` + the vendor Catalog Manager's photo picker
  (`expo-image-picker`). Uploaded URLs flow into `Product.images` and render in
  the storefront/PDP via the existing `catalogAdapter`.

### Setup
1. Create a free account at cloudinary.com (no card).
2. Dashboard → copy **Cloud name**, **API Key**, **API Secret**.
3. Put them in `backend/.env` (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
   `CLOUDINARY_API_SECRET`). Uploads turn on automatically.
4. In the app, pin the SDK-correct picker: `npx expo install expo-image-picker`.
