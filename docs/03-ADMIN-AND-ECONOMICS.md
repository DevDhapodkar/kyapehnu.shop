# 03 — Admin Panel, Pricing Engine, and Unit Economics

The app is the storefront. This is the company.

---

## PART A — The admin panel

### A0. Shape

A **separate Next.js web app** (`/admin`), deployed on Vercel or Cloudflare
Pages free tier. Not a screen inside the mobile app — ops staff need a
keyboard, multiple monitors, and bulk actions.

**Auth:** Firebase Auth + **custom claims** (`role: SUPER_ADMIN | OPS |
CATALOG_QC | FINANCE | SUPPORT`). Claims are set by a Cloud Function or a
protected admin endpoint, never by the client. Every admin route checks the
claim server-side. **Every mutating action writes an `AuditLog` entry**
(`actor`, `action`, `entity`, `before`, `after`, `at`, `ip`) — non-negotiable
once money and prices are editable.

### A1. Modules

**1. QC queue** — the highest-traffic screen. Products in `PENDING_QC`,
newest first, with the photos big. Keyboard-driven: `A` approve, `R` reject
with a canned reason, `E` edit-then-approve. Rejection reasons are a fixed
list so they can be counted and so the WhatsApp reply can be templated and
translated. Target: **under 20 seconds per item.** Bulk-approve for trusted
vendors above a quality score.

**2. Catalogue** — search/filter across all products, force-unpublish, edit
copy and tags, set occasion tags and formality scores (these feed the answer
engine), manage the size/measurement mapping, flag duplicate or stock imagery.

**3. Vendors** — onboarding pipeline (`APPLIED → KYC → CONTRACT → ACTIVE`),
document review (GSTIN, PAN, shop photo, bank proof, cancelled cheque),
commission overrides, operating hours, temporary suspension, reliability
scorecard (accept rate, ready-time p50/p90, cancellation rate, QC rejection
rate, customer rating).

**4. Orders — the live board.** The ops nerve centre. All in-flight orders as
cards on a status board, colour-coded by time-in-state against SLA. Anything
breaching turns crimson and can be actioned inline: call the vendor, call the
rider, re-dispatch, cancel, refund, comp. A day of ops on this screen teaches
more about the business than a month of analytics.

**5. Logistics** — Porter dispatch log, failures, per-order delivery cost vs
delivery fee charged (the margin leak lives here), map of active riders, manual
dispatch override.

**6. Pricing & margins** — see Part B. Commission rules, delivery fee rules,
surge, fee caps, tax configuration, promo budget.

**7. Promotions** — coupon builder (percentage / flat / free-delivery, min
cart, per-user cap, total budget cap, category or vendor scoping, expiry),
referral program config, first-order offer, and a live spend-vs-budget meter.

**8. Customers** — profile, order history, refunds issued, COD reliability,
Try Rack keep-rate, trust score, block/unblock.

**9. Finance & payouts** — vendor ledgers, settlement runs, netting of returns
and penalties, TDS/TCS handling, invoice generation, GST reports,
reconciliation against gateway settlements. Read-only for `OPS`, writable only
by `FINANCE`, with a two-person approval on payouts above a threshold.

**10. Merchandising** — control the home feed rails, the Chapters content, the
answer-engine look bundles, seasonal campaigns, and featured shops. This should
be editable by a non-engineer, or engineering becomes the bottleneck on every
festival.

**11. Support** — order-linked ticket queue, canned responses, refund/comp
actions with limits per role, and the legally required grievance-officer
inbox (see [05](05-COMPLIANCE-AND-STORE-LAUNCH.md)).

**12. Analytics** — the dashboard defined in Part C.

**13. Platform controls** — feature flags, city/zone serviceability polygons,
kill switches (pause new orders, pause a vendor, pause COD), app version
minimums, and maintenance banners pushed to the app.

### A2. Build order

QC queue and the order board first — they are what make manual operations
possible on day one. Finance and analytics can lag by a phase; a spreadsheet
survives the first 500 orders. Merchandising is needed the week before launch.

---

## PART B — The pricing and margin engine

### B0. The order money object

Replace the single `totalPrice` field with an explicit, server-computed,
immutable-at-capture breakdown stored on the order:

```
pricing: {
  itemsSubtotal,            // Σ (unit price × qty), from the catalogue, server-side
  vendorPayableSubtotal,    // itemsSubtotal − platformCommission
  platformCommission,       // per rule set below
  deliveryFeeCharged,       // what the customer pays
  deliveryCostActual,       // what Porter charges us  ← the margin truth
  packagingFee,
  smallCartFee,             // below a threshold
  surgeFee,
  platformFee,              // flat convenience fee
  discount { code, amount, fundedBy: PLATFORM | VENDOR | SPLIT },
  taxes { gstRate, gstAmount, hsn },
  roundOff,
  grandTotal,               // what the customer is charged
  contributionMargin        // grandTotal − vendorPayable − deliveryCostActual − pgFee
}
```

Two rules that matter more than the field list:

1. **Compute server-side from the catalogue at order creation.** The client
   sends product ids, sizes, quantities, an address, and a coupon code. Nothing
   else. Never a price.
2. **Snapshot it.** A price change or a coupon expiry tomorrow must not alter
   yesterday's order. Store the computed numbers, not references to rules.

### B1. Commission

Resolution order, most specific wins: **product override → vendor override →
category default → platform default.**

Indicative defaults: apparel 18%, accessories 20%, high-value (> ₹8,000) 12%
tapering, new-vendor promotional 8% for the first 60 days. All editable in
admin, all versioned, all audit-logged.

### B2. Delivery fee

```
customerFee = base
            + perKm × max(0, distanceKm − freeKm)
            + surge(timeOfDay, rain, demand)
            − freeDeliveryCredit(tier, cartValue, coupon)
customerFee = clamp(customerFee, floor, cap)
```

Indicative: base ₹29, ₹8/km beyond 2 km, capped at ₹79, free above a ₹2,499
cart. Rain and 7–10 pm surge configurable.

**The number that decides the company's fate is `deliveryCostActual −
deliveryFeeCharged`.** Put it on the front page of the analytics dashboard,
segmented by distance band and hour, from day one.

### B3. Taxes

Apparel GST in India is slab-based on price per piece (a lower rate below a
threshold, higher above). This is a rules table in admin, not a constant in
code, because it changes. Each product carries an HSN code, supplied at
listing time. Platform commission attracts GST separately, and TCS applies to
marketplace operators — get a CA to sign off the configuration before the first
rupee moves.

### B4. Unit economics — the honest arithmetic

At a ₹1,500 AOV, 3 km delivery, one vendor:

| Line | Amount |
| --- | --- |
| Items | ₹1,500 |
| Commission @ 18% | **+₹270** |
| Delivery fee charged | **+₹45** |
| Porter cost (3 km) | **−₹65** |
| Payment gateway @ 2% + GST | **−₹37** |
| Packaging + support allocation | **−₹15** |
| **Contribution per order** | **≈ ₹198** |

Then subtract the things that quietly eat it:

- **Returns.** Every returned apparel order costs a second delivery leg and
  the margin on the sale. At a 25% return rate the contribution roughly halves.
  This is why Fit Profile and Try Rack are margin projects, not UX projects.
- **Discounting.** A ₹100 acquisition coupon consumes half an order's
  contribution. Cap it by cohort and measure repeat rate, not installs.
- **Failed and cancelled orders.** Full cost, zero revenue.
- **Fixed costs.** Ops salaries, support, the founding team.

Break-even estimate: with ~₹150 realised contribution after returns, a
₹1.5 lakh/month fixed cost base needs **~1,000 orders/month (~35/day)** to
cover fixed costs — achievable in one city with 30–50 good shops. Model it
properly in a sheet, but design the schema now so those numbers are queryable
from day one rather than reconstructed later.

### B5. Cart policy — the multi-vendor decision

`useCartStore` accepts items from any shop; `Order.vendor` is singular.
Resolve it deliberately:

**Recommended for launch: one cart, split into per-vendor sub-orders.**
The customer sees a single bag and pays once. The backend creates a `Cart`
paying entity plus N `Order` documents, one per vendor, each independently
dispatched. The delivery fee is charged once per *trip*, and multiple vendors
mean multiple trips — so either surface an honest extra fee per additional shop
(₹25) or restrict multi-vendor carts to shops within 1 km of each other and
route one rider through both.

The alternative (hard single-vendor cart, "clear your bag to shop elsewhere")
is simpler to build and worse for AOV. Take the harder path now; retrofitting
order-splitting after launch touches payments, refunds, tracking, and payouts
simultaneously.

---

## PART C — Metrics the CEO actually watches

**North star:** *orders per active customer per month*. Not GMV — GMV can be
bought with discounts.

| Tier | Metrics |
| --- | --- |
| **Growth** | Installs → first order (activation %), D7/D30 retention, repeat rate, cohort revenue curves, referral coefficient. |
| **Marketplace** | Active shops, listings per shop, share of orders from the top 5 shops (concentration risk), vendor accept rate, vendor churn. |
| **Ops** | **p50/p90 order-to-doorstep time** (the promise), time-to-accept, time-to-ready, rider wait, on-time %, cancellation rate by cause. |
| **Money** | Contribution per order, delivery cost vs fee, discount as % of GMV, return rate by category and by vendor, payout accuracy. |
| **Quality** | Rating, complaint rate, wrong-item rate, QC rejection rate, app crash-free sessions, p95 cold start. |
| **Product** | Search-to-order conversion, PDP-to-cart, cart abandonment, answer-engine usage and its conversion vs the plain feed, Try Rack keep-rate. |

Instrument these in Phase 1, not Phase 7. A metric added after launch has no
history, and no history means no judgement.
