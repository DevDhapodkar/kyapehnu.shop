# 02 — Integrations: WhatsApp, Alerting, Porter, Payments

Four external systems carry the business. Each section gives the flow, the data
model, the failure paths, and the onboarding lead time — the lead times matter
more than the code, because several of them are measured in weeks.

---

## PART A — WhatsApp (vendor side)

Two independent products share one channel, and they must not be confused:

- **A1. Inventory intake** — vendor sends photos + details, a draft product is
  created, admin QC approves, it goes live.
- **A2. Order alerting** — the platform pushes order events to the vendor.

### A0. Platform, cost, and lead time

- **Meta WhatsApp Cloud API** (already chosen — `graph.facebook.com/v19.0`).
  Direct, no BSP markup. Alternatives (AiSensy, Interakt, Gupshup, Wati) add a
  monthly fee but give a no-code template manager and a shared inbox; worth
  revisiting only when non-engineers must manage the bot.
- **Required before anything works:** Meta Business account → business
  verification (documents; **3–10 working days**) → WhatsApp Business Account →
  a phone number that is *not* on consumer WhatsApp → display-name approval →
  message templates submitted and approved (**24–48 h each**, and rejections
  are common for anything that reads promotional).
- **Cost model (India, current):** service/user-initiated conversations inside
  the 24-hour window are free; business-initiated **utility** templates are
  billed per message (roughly ₹0.10–0.15 each). At 300 orders/day with 3
  vendor-facing template sends per order that is ~₹40/day — negligible.
  Marketing templates cost several times more; **never send marketing on this
  number.** It risks the quality rating that the operational messages depend on.
- **Quality rating and tiering:** blocks and "report" taps lower the number's
  quality rating and can cap sending. Keep the number strictly transactional.

> **Start the Meta verification in Phase 0, week 1.** It is the longest
> critical-path item in the whole roadmap and it costs nothing to begin.

### A1. Inventory intake via WhatsApp

The pitch to a shopkeeper: *"Take a photo. Send it. Your shop is online."*
That sentence is the entire vendor acquisition strategy. It has to be true.

#### The conversation

Use **interactive messages** (buttons and list pickers), not free-text parsing,
wherever a value is enumerable. Free text is only for name, description, and
price. This cuts error rates enormously and works for a vendor with poor
literacy in English.

```
Vendor sends 1–5 photos  ─┐
                          ├─▶  Bot: "New listing? [Yes] [No, something else]"
Vendor sends "NEW"       ─┘

Bot: "What is it called?"                      → free text
Bot: "Category?"           [Men][Women][Kids]  → list message
Bot: "Type?"               [Shirt][Kurta]...   → list message (per category)
Bot: "Price in ₹?"                             → free text, validated numeric
Bot: "Colours?"            multi-select list
Bot: "Sizes and stock — reply like: S:2 M:5 L:3"
Bot: "Chest / length in inches? (helps buyers pick a size)"  ← powers Fit Profile
Bot: "Anything to add about the fabric?"       → free text, optional, skippable
Bot: [Preview card with the photos + all values]
     "[Submit for approval] [Edit] [Cancel]"

→ Product created with status = PENDING_QC
→ Admin QC queue
→ Approved:  "✅ 'Obsidian Evening Shirt' is live. Buyers within 5 km can see it now."
→ Rejected:  "⚠️ Photo is blurry. Send a clearer photo of the full garment on a
              plain background and reply RESEND."
```

Support **Hindi and Marathi** from day one — both the bot's messages and the
command keywords (`स्टॉक`, `बंद`, `चालू`). The vendor is the user who least
wants to operate in English.

#### Quick commands (outside the wizard)

| Command | Effect |
| --- | --- |
| `STOCK <code> <qty>` | Set stock for a size |
| `OFF <code>` / `ON <code>` | Availability toggle |
| `PRICE <code> <amount>` | Price change → re-enters QC if delta > 20% |
| `ORDERS` | Today's orders + status |
| `TODAY` | Sales summary + next payout date |
| `HELP` | Command list in the vendor's language |
| `CLOSE 2H` | Temporarily mark shop closed (stops new orders) |

`<code>` is a short human-friendly SKU (`SH-104`) that the bot assigns on
approval and prints in every message. Never make a shopkeeper type an ObjectId.

#### Technical design

**New models**

```
WhatsappSession   { waId, vendorId, state, draft{}, mediaIds[],
                    lastMessageAt, expiresAt (TTL 24h) }
WhatsappInbound   { messageId (unique), waId, type, payload, processedAt }
Product           + status: DRAFT | PENDING_QC | APPROVED | REJECTED | ARCHIVED
                  + source: APP | WHATSAPP | ADMIN
                  + qc: { reviewedBy, reviewedAt, reason }
                  + sku, measurements{chest,length,shoulder}, occasionTags[]
```

**Webhook handling — the five things currently missing**

1. **Verify `X-Hub-Signature-256`** (HMAC-SHA256 of the raw body with the app
   secret) before parsing. Requires capturing the raw body, so mount a
   `express.raw` body parser on this route specifically.
2. **Return 200 immediately, process asynchronously.** Meta retries anything
   slower than a few seconds and will duplicate everything.
3. **Deduplicate on `messages[].id`** via the unique index on
   `WhatsappInbound.messageId`. Meta *will* redeliver.
4. **Media download is a two-step call:** `GET /{media-id}` returns a
   short-lived URL, which must then be fetched **with the bearer token
   attached** — a plain fetch returns 401. Pipe the bytes straight to object
   storage; never buffer to disk.
5. **Group multi-photo listings** by `waId` + a 90-second window, plus an
   explicit "done" affordance. Photos arrive as separate webhook events with no
   album semantics.

**Media pipeline**

`Meta media id → download → sanity checks (MIME allowlist, ≤ 8 MB, real image
via sharp metadata) → strip EXIF → resize to 1200×1600 + 600×800 + 200×267 →
WebP → upload to R2/Cloudinary → store CDN URLs on the draft product.`

Never store a Meta media URL in the DB — they expire.

**Idempotency and ordering.** Process a given `waId`'s messages serially (a
per-session lock or a keyed queue) or the wizard state machine will race
against itself when a vendor fires three messages in two seconds.

### A2. Order alerting and the escalation ladder

A 45-minute promise dies if a vendor's phone is in their pocket. WhatsApp alone
is not an alerting system — it is a *messaging* system. Build a real ladder,
driven by a scheduler, with each rung cancelled the moment the vendor accepts.

| T+ | Channel | Notes |
| --- | --- | --- |
| 0 s | **Push (FCM) + in-app alarm** | Full-screen takeover, looping sound, ignores silent mode via a notification channel with `IMPORTANCE_HIGH` + custom sound. Vendor must swipe to accept. |
| 0 s | **WhatsApp utility template** | Order id, item count, value, and an "Accept" quick-reply button that maps back to the order. |
| 45 s | **SMS** | Different channel, different attention path. |
| 90 s | **Automated voice call (IVR)** | *"New order at your shop. Press 1 to accept, 2 to reject."* DTMF response updates the order. This is the rung that actually works. |
| 3 min | **Second voice call + ops alert** | Admin dashboard raises the order to a human. |
| 5 min | **Auto-reassign or cancel** | Offer the same item from the next nearest vendor holding stock; otherwise cancel and refund automatically, with an apology credit. |

Repeat the same ladder for **"order ready not marked"** at T+12 min and
**"rider waiting at shop"** at T+2 min of rider idle.

**Providers (India)**

- **SMS:** MSG91, Kaleyra, Plivo, Twilio. **DLT registration is mandatory**
  (TRAI): register the entity, register a sender ID, register every template.
  **Allow 1–2 weeks.** Unregistered SMS silently fails. Start in Phase 0.
- **Voice/IVR:** Exotel or Plivo (both strong in India, both support DTMF
  callbacks). Exotel also gives number-masking, which is needed later for
  rider↔customer calls without exposing phone numbers.
- **Push:** FCM (free, unlimited) via Expo Push or direct.

**Scheduler.** Do not use `setTimeout` — a restart loses every pending
escalation. Use a durable delayed-job mechanism: **Upstash QStash** (free tier,
HTTP-callback scheduling, no server to run) or BullMQ on Upstash Redis. Each
rung is a scheduled callback that first re-reads order state and no-ops if the
order has moved on.

**Outbox pattern.** Every outbound notification is written to a
`Notification` collection (`channel`, `orderId`, `state`, `attempts`,
`providerId`, `error`) and dispatched by a worker with exponential backoff. The
current fire-and-forget `.catch(console.error)` loses messages permanently and
gives ops zero visibility.

---

## PART B — Porter (logistics)

### B0. Reality check

`porterController.js` calls `pfe-apigw-uat.porter.in` — the **UAT sandbox**.
Production access requires a Porter business account, a signed agreement, KYC,
and a prepaid wallet or credit line. **Start commercial onboarding in Phase 0;
allow 2–4 weeks.**

Porter's Partner API surface used here: **get quote**, **create order**,
**track order**, **cancel order**, plus **webhooks** for status.

### B1. The corrected flow

The current code only does step 4. Steps 1–3 and 5–7 are missing, and steps 1
and 3 are what make the checkout honest.

```
1. Cart → GET QUOTE (vendor coords → customer coords)
   Returns fare + ETA.  Shown to the customer BEFORE they pay.
   Cache per (vendorId, geohash6) for 5 minutes.

2. Payment authorised.

3. Order created, vendor alerted (Part A2).

4. Vendor marks READY → CREATE ORDER with Porter
   (existing transitionToReady — keep the persist-then-dispatch shape)

5. Porter webhooks drive status:
   order_accepted → driver_assigned → arrived_pickup → picked_up
   → arrived_drop → delivered | cancelled
   Each maps to an Order.status transition, a customer push, and a
   vendor push.

6. Live location: poll Porter's track endpoint every 15 s while
   status ∈ {picked_up, arrived_drop}, and mirror driver lat/lng into
   Firebase Realtime DB at /trips/{orderId}.  The customer app and the
   vendor app both subscribe to that path.  One writer, N readers,
   no socket server to operate.

7. Delivered → capture payment (if pre-auth) → OTP confirmation →
   settle to vendor ledger → prompt for rating.
```

### B2. Address capture (currently absent)

The checkout has no address UI at all. It needs:

- Map pin with drag, seeded from GPS, with a "confirm your exact pin" step.
- House/flat number, floor, landmark, receiver name and phone (may differ from
  the account), and delivery notes.
- Label (Home / Work / Other) and save-to-address-book.
- **Serviceability check** against a Nagpur polygon + a max radius from the
  vendor. Fail *before* payment, never after.
- Reverse geocode for display only; the pin is the truth.

### B3. Failure paths that must be designed, not discovered

| Failure | Handling |
| --- | --- |
| No driver found | Retry with backoff for 3 min → notify customer with a revised ETA → offer cancel-and-full-refund. |
| Driver cancels mid-trip | Auto re-request; the Thread pauses with an honest message rather than silently inflating the ETA. |
| Vendor never marks ready | Escalation ladder → ops → cancel + refund + vendor reliability score hit. |
| Customer unreachable at drop | Rider waits 5 min → number-masked call → RTO back to the shop → restocking + a return-fee policy. |
| Wrong or damaged item | In-app report within 2 h, photo upload, admin resolves, refund/replacement, chargeback to the vendor ledger. |
| Porter API down | Circuit breaker → order parks in `READY_FOR_PICKUP` (already the retry-safe state) → ops dashboard alarm → manual dispatch fallback. |

### B4. Architecture note — do not hardcode Porter

Define a `LogisticsProvider` interface (`quote`, `dispatch`, `track`, `cancel`,
`normaliseWebhook`) with a Porter adapter behind it. Second and third adapters
(Shadowfax, Borzo/Pidge, and an in-house rider app for peak hours and for
Try Rack, which needs a rider who waits) will be needed within a year. Retro-
fitting this later means touching order state everywhere.

Rider wait-time is the specific reason an in-house option matters: Try Rack
(§6.2 of [01](01-PRODUCT-IDENTITY.md)) requires a 10-minute paid wait that
standard hyperlocal APIs price badly or refuse.

---

## PART C — Payments

Missing entirely, and nothing ships without it.

- **Gateway: Razorpay** (best Indian coverage, UPI intents, Route for
  marketplace split settlement, pre-auth + partial capture for Try Rack).
  Cashfree is a viable second. Onboarding needs GST, PAN, bank account, and
  a website/app with visible refund, shipping, T&C and contact pages — **which
  the Play Store and App Store also require.** Allow 3–7 days.
- **Methods, in Indian order of preference:** UPI intent (60–70% of volume),
  cards, netbanking, wallets, **and COD**. COD is unavoidable for trust in a
  first-time local marketplace; cap it (≤ ₹3,000), disable it after N refused
  deliveries per user, and collect via the rider.
- **Flow:** create a server-side order with a **server-computed amount** →
  client checkout → **verify the signature server-side** → mark paid → create
  the platform order. Never trust a client "payment succeeded".
- **Idempotency:** one `Idempotency-Key` per checkout attempt so a double tap
  or a retried request cannot create two orders or two charges.
- **Refunds:** full (cancel before pickup), partial (Try Rack, missing item),
  and instant-refund-to-source. Every refund writes to the vendor ledger.
- **Webhooks:** `payment.captured`, `payment.failed`, `refund.processed`,
  `order.paid` — signature-verified, idempotent, and the source of truth over
  the client callback.
- **Settlement:** Razorpay Route can split at capture, or settle to the
  platform and pay vendors weekly from the ledger. Start with the ledger — it
  is simpler, and it lets you net off returns and penalties before paying out.

---

## PART D — Notification and realtime summary

| Need | Mechanism | Cost |
| --- | --- | --- |
| Customer order updates | FCM push + in-app | Free |
| Vendor new-order alarm | FCM high-importance channel + WhatsApp + SMS + IVR | ~₹1.5/order |
| Live driver position | Firebase Realtime DB, backend writes, clients subscribe | Free tier ample |
| Vendor order desk live list | Same RTDB path per vendor, or a 10 s poll | Free |
| Delayed escalations | Upstash QStash scheduled callbacks | Free tier |
| Transactional email (invoices, payouts) | Resend | Free tier |

Deliberately **no self-hosted socket server** — it is one more always-on
process to pay for and monitor, and Realtime DB fan-out is strictly better at
this scale.
