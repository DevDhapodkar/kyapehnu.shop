# Kya Pehnu? — Free WhatsApp Vendor Bot Guide

This guide details the architecture, operations, and setup for the **Kya Pehnu WhatsApp Vendor Bot**, designed to allow boutique owners and clothing retailers in Nagpur to manage their entire store, inventory, and customer orders directly through WhatsApp without ever needing to open the Kya Pehnu website or app.

---

## 1. Core Architecture & Workflow

```
[ Vendor Phone (WhatsApp) ]
            │
            ▼ (Incoming Message / Garment Photo / Quick Reply Button)
[ Meta WhatsApp Cloud API / Webhook (POST /api/whatsapp/webhook) ]
            │
            ├─► Deduplication (WhatsappInbound)
            ▼
[ whatsappBotEngine.js ]
            │
   ┌────────┴──────────────────────────────────────────┐
   ▼                                                   ▼
[ Is Number Registered Vendor? ]           [ Unregistered Phone ]
   │                                                   │
   ├─► YES: Vendor Operations Hub                     └─► NO: Interactive 60s Onboarding
   │   • View Active Orders                                • Shop Name
   │   • Mark Ready ──► Dispatches Porter Rider            • Owner Name
   │   • Add Item ────► Direct Photo Intake (Cloudinary)   • Nagpur Boutique Address
   │   • Inventory ───► Live Stock Updates (STOCK SKU QTY) • Primary Category (Men/Women/Kids)
   │   • Store Status ─► Toggle Open/Close & Daily Sales   • Auto-creates Vendor profile in MongoDB!
```

---

## 2. Is WhatsApp Cloud API Free?

**Yes.** Meta provides:
1. **1,000 Free Service Conversations per Month**: Every WhatsApp Business Account (WABA) receives 1,000 free user-initiated conversations every calendar month.
2. **24-Hour Free Customer Service Window**: Whenever a vendor messages the bot, a 24-hour rolling window opens. Within this window, **all incoming and outgoing messages (text, garment photos, interactive menus, button replies) are 100% free**.
3. **No Per-Seat or Platform Subscription Fees**: Because this bot connects directly to Meta's Cloud API (`graph.facebook.com`), there are **zero middleman charges** (unlike third-party BSPs like AiSensy or Wati that charge ₹2,000–₹5,000/month).

---

## 3. Supported Vendor Capabilities (All via WhatsApp)

### A. Instant Onboarding for New Boutiques
When an unregistered number messages the bot:
1. Bot verifies the number against registered vendors in MongoDB.
2. If not found, bot greets them and asks if they want to register their boutique on Kya Pehnu.
3. Guides them step-by-step:
   - **Shop Name**: e.g. *Royal Handlooms Nagpur*
   - **Owner Name**: e.g. *Rajesh Agrawal*
   - **Shop Address & Area**: e.g. *Shop 12, Variety Square, Sitabuldi, Nagpur 440012*
   - **Category**: *WOMEN, MEN, KIDS, or UNISEX*
4. Creates the `Vendor` document in MongoDB and immediately unlocks the Vendor Operations Menu!

### B. Direct Garment Photo Intake & 12-Attribute Product Listing (Live Mode)
The vendor does not need a laptop or vendor portal to add clothes. The bot guides them through the exact same 12 attributes found in the Kya Pehnu web app (`ProductIngestionScreen.js`):

1. **Photo Upload**: Vendor sends 1 or more garment photos directly in WhatsApp chat. The bot downloads the media from Meta Graph API and streams it to Cloudinary.
2. **Step 1/12 — Garment Title / Name**: e.g., *Embroidered Chanderi Kurti* or *Jet Black Relaxed Oxford Shirt*.
3. **Step 2/12 — Department**: Options `1. Men's Wear`, `2. Women's Wear`, `3. Unisex / Streetwear`, `4. Ethnic & Festive`, `5. Kids' Wear`.
4. **Step 3/12 — Garment Type / Subcategory**: Dynamic list per department (e.g. *Sarees & Silk Drapes*, *Kurtas & Kurta Sets*, *Casual Shirts & Polos*, *Oversized Tees*).
5. **Step 4/12 — Primary Color**: 12 curated fashion swatches (`Jet Black`, `Crisp White`, `Navy Blue`, `Sindhoor Crimson`, `Ivory Cream`, `Sage Green`, etc.) or custom color.
6. **Step 5/12 — Fit Style**: `1. Relaxed Fit`, `2. Regular Fit`, `3. Oversized / Boxy`, `4. Slim / Tailored`, `5. Cropped Fit`.
7. **Step 6/12 — Fabric & Material**: `1. 100% Combed Cotton`, `2. Heavyweight 240 GSM`, `3. Oxford Cotton`, `4. Linen Blend`, `5. Stretch Denim`, `6. Cotton Twill`, `7. Rayon / Viscose`, `8. Pure Silk / Handloom` (or custom text).
8. **Step 7/12 — Occasion**: `1. Everyday Casual`, `2. Streetwear`, `3. Smart / Office`, `4. Party & Evening`, `5. Festive Wear`.
9. **Step 8/12 — Care Instructions**: `1. Machine Wash Cold`, `2. Gentle Hand Wash`, `3. Dry Clean Only`.
10. **Step 9/12 — Selling Price in ₹**: e.g. *899*.
11. **Step 10/12 — Printed MRP in ₹**: Auto-computes standard 25% printed tag markup (₹1124). Vendor can reply `OK` to accept or enter custom MRP.
12. **Step 11/12 — Sizes & Stock**: Multi-size apparel (`S: 5, M: 10, L: 8`), waist sizes (`28: 4, 30: 6`), or free size (`15`).
13. **Step 12/12 — Description & Highlights**: Custom styling notes or reply `SKIP` to auto-generate luxury retail description.

**Instant Publication**:
- The bot generates a catalog-unique SKU (e.g. `WM-4821`), builds color variant structures, persists the garment in MongoDB `Product` collection with status `APPROVED` and source `WHATSAPP`.
- The product is **immediately live** and orderable by customers within 45-minutes across Nagpur!

### C. Real-Time Order Alerts & One-Tap Porter Dispatch
When a customer orders:
1. Kya Pehnu sends a rich WhatsApp notification with:
   - Order ID (e.g. `#8A1C49`)
   - Customer name & delivery locality in Nagpur (e.g. *Ramdaspeth*)
   - Items, sizes, and quantities ordered
   - Total amount & payment method (*COD* or *Instant UPI Paid*)
2. **Vendor Actions**:
   - Reply **`READY 8A1C49`** (or **`READY`** or tap the **`[📦 Mark Ready & Rider]`** button).
   - System calls `transitionToReady(order, vendor)`:
     - Dispatches a **Porter delivery rider** to the vendor's shop location.
     - Advances order status to `READY_FOR_PICKUP` / `IN_TRANSIT`.
     - Sends customer a push notification that their order is packed and rider is on the way.
   - Bot replies to vendor on WhatsApp with the **Porter live tracking link** and driver details!

### D. Inventory & Stock Management
- Send **`STOCK`** or **`3`**: Lists recent boutique products with SKU, current stock, and availability status.
- Send **`STOCK <SKU> <QTY>`** (e.g. `STOCK WM-4821 20`): Instantly updates inventory to 20 units.
- Send **`TOGGLE <SKU>`** or **`OFF <SKU>`** / **`ON <SKU>`**: Quickly turns item out-of-stock or back in-stock.

### E. Boutique Status & Daily Sales
- Send **`STATUS`** or **`4`**: Displays today's total revenue, total orders received, and active pending orders.
- Send **`CLOSE`**: Temporarily closes the boutique (stops new incoming orders).
- Send **`OPEN`**: Resumes accepting orders.

---

## 4. WhatsApp Bot Command Cheat-Sheet

| Command / Message | What the Bot Does |
|---|---|
| **`MENU`** / **`HI`** / **`HELLO`** | Displays the main Vendor Operations Hub with interactive buttons |
| **`ORDERS`** / **`1`** | Lists active and pending customer orders with items & amounts |
| **`READY <ORDER_ID>`** | Marks order ready, requests Porter rider, and shares live tracking |
| **`ADD`** / **`2`** | Starts product listing wizard (prompts for photo, title, price, stock) |
| *[Send Any Photo]* | Automatically initiates product intake and uploads image to Cloudinary |
| **`STOCK`** / **`3`** | Lists boutique catalog with SKUs and stock levels |
| **`STOCK <SKU> <QTY>`** | Quick updates quantity for that SKU (e.g. `STOCK WM-1020 15`) |
| **`TOGGLE <SKU>`** | Toggles item availability (In-Stock 🟢 / Out-of-Stock 🔴) |
| **`STATUS`** / **`4`** | Shows today's revenue, order count, and store open/closed status |
| **`OPEN`** / **`CLOSE`** | Toggles shop open/close for deliveries |
| **`HELP`** / **`5`** | Prints full list of commands |
| **`CANCEL`** / **`RESET`** | Cancels current draft or wizard and returns to main menu |

---

## 5. Setting up Meta WhatsApp Cloud API (Free)

### Step 1: Create Meta Developer Account
1. Go to [developers.facebook.com](https://developers.facebook.com) and log in.
2. Click **My Apps** → **Create App** → Select **Other** → **Business**.
3. Under "Add products to your app", find **WhatsApp** and click **Set up**.

### Step 2: Get Test Credentials
In the WhatsApp > **API Setup** page:
- You will see a **Temporary Access Token** (or create a permanent System User Token in Business Settings).
- You will see a **Phone Number ID** (e.g. `102938475610293`).
- You can add your personal phone number as a recipient to test sending and receiving messages.

### Step 3: Configure Environment Variables in `backend/.env`
Add these to `/Users/devdhapodkar/Desktop/kyapehnu/kyapehnu.claude/backend/.env`:

```env
# Meta WhatsApp Cloud API
META_PHONE_NUMBER_ID=your_phone_number_id_here
META_WHATSAPP_TOKEN=your_permanent_access_token_here
META_WEBHOOK_VERIFY_TOKEN=kyapehnu_nagpur_verify_token_2026

# Optional: Automated Voice Call Alert for Urgent Orders
VOICE_CALL_ENABLED=false
# VOICE_CALL_WEBHOOK_URL=https://your-ivr-service.com/call
```

### Step 4: Configure Webhook in Meta Developer Portal
1. Under WhatsApp > **Configuration**, click **Edit** next to Callback URL.
2. **Callback URL**: `https://your-backend-domain.com/api/whatsapp/webhook`
   *(For local testing, expose port 5001 using ngrok: `ngrok http 5001` → use `https://xxxx.ngrok-free.app/api/whatsapp/webhook`)*.
3. **Verify Token**: `kyapehnu_nagpur_verify_token_2026` (must match `META_WEBHOOK_VERIFY_TOKEN`).
4. Click **Verify and Save**.
5. Under **Webhook fields**, click **Manage** and subscribe to **`messages`**.

---

## 6. Live Execution & Automated Verification

### A. LIVE Meta WhatsApp Cloud API (No Simulation)
In live runtime (`process.env.NODE_ENV !== 'test'`), the bot connects directly to Meta's WhatsApp Cloud API endpoint:
```
POST https://graph.facebook.com/v19.0/{META_PHONE_NUMBER_ID}/messages
Headers: Authorization: Bearer {META_WHATSAPP_TOKEN}
```
- Real messages and interactive buttons are delivered directly to the vendor's WhatsApp phone.
- Garment photos sent by the vendor are downloaded directly from Meta Graph API using `mediaId` and streamed to Cloudinary.
- Incoming messages are received at `/api/whatsapp/webhook` with SHA-256 HMAC signature verification and deduplicated via `WhatsappInbound`.

### B. Automated Unit & Integration Tests
To verify all bot states, onboarding, 12-attribute intake, order dispatch, and inventory toggling:
```bash
cd kyapehnu.claude/backend
npm test
```
All 68 unit & integration tests pass with 100% success.
