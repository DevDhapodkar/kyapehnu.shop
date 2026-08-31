# 01 — Product Identity: Theme, Motion, and the Reason People Come Back

The app already has taste. What it does not yet have is a **signature** — one
or two things a person can describe to a friend without naming a feature list.
This document defines that signature and the design system that carries it.

---

## 1. The strategic premise

The name is a question: *Kya Pehnu?* — "what should I wear?"

Every competitor answers "here is a catalogue". The defensible position is to
**answer the question**. Amazon and Myntra win on selection and price and lose
on time and locality. Kya Pehnu wins on: *the clothes two streets away, chosen
for tonight, in your hands in 45 minutes, and if the fit is wrong the same
rider brings another size.*

Three pillars, in priority order:

1. **Speed as theatre.** 45 minutes is the product. Make it visible, countable,
   and dramatised — never a static "estimated delivery" line.
2. **Fit certainty.** The one thing that stops people buying clothes online.
   Solve it and the category unlocks (see §6, Try Rack).
3. **Locality as luxury.** Not "cheap local stuff" — "the tailor in Dharampeth
   who picked this fabric". Named shops, named owners, real photos.

---

## 2. Visual identity

### 2.1 What to keep

The disciplined, single-accent palette in `src/theme/colors.js` is what makes
the app distinctive. Keep the rationed-colour rule absolutely: one warm
terracotta accent, and hues nowhere else except to flag an order's state. The
app now reads as a warm peach-and-cream light interface — soft, photographic,
lit from within — with the 3D scrollytelling intro kept as the one deliberately
dark island. Colour restraint, not the darkness, is the identity.

### 2.2 The missing 60% — typography

There are no custom fonts in the app today. This is the single highest-leverage
identity change available, and it is cheap.

Adopt a **two-voice type system**:

| Voice | Use | Candidates (open licence) |
| --- | --- | --- |
| **Editorial** — high-contrast serif or a fashion grotesque | Chapter titles, product names, price on PDP, empty-state lines, the countdown numerals | Playfair Display, Bodoni Moda, Instrument Serif, Fraunces |
| **Utility** — neutral geometric/grotesk | Buttons, labels, body, forms, vendor desk | Inter, Satoshi, General Sans, Geist |

Rules that make it read as *fashion* rather than *e-commerce*:

- Wide tracking (`letterSpacing: 1.2–2`) and uppercase for eyebrows/labels only.
- Light weights at large sizes (300 at 32pt+), never light at small sizes.
- Prices set in the editorial face, never bolded, never with a strikethrough
  colour other than `ash`.
- One display line per screen, maximum. Restraint is the aesthetic.

Ship via `expo-font` with variable fonts, preloaded before splash hides.

### 2.3 Colour extension

Add **three** tokens, no more:

- `spotlight` — a warm off-white radial glow used behind hero product images
  so garments look lit in a shop window at night. This is the visual metaphor
  of the whole app: *shop windows after dark.*
- `alive` — a single desaturated green reserved **only** for "a driver is
  moving right now". It appears nowhere else, so it always means one thing.
- `sizeFit` / `sizeTight` / `sizeLoose` — a three-step neutral ramp for the fit
  system (§6). Also strictly single-purpose.

### 2.4 Surface language

Glassmorphism is already in place. Sharpen it into a rule:

- **Glass = something floating over the world** (headers, the live tracking
  sheet, the cart bar). Frosted white panes over the warm wash — never for
  static content.
- **Photograph + frosted caption = merchandise.** Product cards run the garment
  shot full-bleed with a frosted white caption card floating over its lower
  edge — the picture is the card.
- **Full-bleed dark = editorial.** The scrollytelling chapters and story blocks
  stay dark: the one cinematic island the light app is built around.

---

## 3. Motion: the "fabric physics" system

Motion is where the app becomes unforgettable, and it is currently unused
outside the 3D scene. The unifying idea: **everything in this app moves like
cloth, not like software.** Cloth has weight, drape, and a small settle.

### 3.1 Motion tokens (one file, `src/theme/motion.js`)

Define springs once and forbid inline animation configs, exactly as the colour
file forbids inline hues.

| Token | Feel | Where |
| --- | --- | --- |
| `drape` | slow, heavy, overshoot ~4% | Sheets, PDP entry, chapter transitions |
| `flick` | fast, crisp, no overshoot | Buttons, toggles, chips, tabs |
| `settle` | medium with a long tail | List items landing, cards appearing |
| `thread` | linear, continuous | Countdown, progress, driver marker |

Every spring gets a `reduceMotion` fallback (cross-fade + instant position).
This is both an accessibility requirement and an App Store review item.

### 3.2 The signature moments

Pick a small number and execute them perfectly. These five are the ones people
will describe:

1. **The Unfurl (card → PDP).** Shared-element transition where the product
   image does not just scale — it expands from the card with a subtle vertical
   stretch-then-settle, like fabric dropping off a hanger. `drape`. This is the
   single most-seen animation in the app; it deserves a week of polish.

2. **The Rail.** Horizontal product lists behave like a clothing rack: items
   have slight rotational inertia on scroll (±1.5°), settle when you stop, and
   snap with a haptic tick. Nothing else in Indian commerce feels like this.

3. **The Thread (45-minute countdown).** Not a number — a single hairline of
   crimson that shortens across the top of the screen over 45 minutes, with the
   numeral in the editorial face beside it. It persists as a slim bar on every
   screen while an order is live. When it crosses 10 minutes it starts a slow
   pulse. When the rider is 500 m away it goes `alive` green and the app
   surfaces a "meet at the gate" sheet. **This is the app's heartbeat and its
   most memorable element.**

4. **The Fold (add to bag).** The product image folds once, diagonally, and
   flies to the bag icon, which absorbs it with a soft weight bounce. Paired
   with a distinct haptic. Free dopamine, once per purchase decision.

5. **The Window Light.** On PDP, a slow `spotlight` gradient drifts behind the
   garment tied to device tilt (accelerometer, 0.3× damped). Costs almost
   nothing; makes a flat photo feel like a lit object. Disable under
   reduce-motion and low-power mode.

### 3.3 Haptics as a language

Define a vocabulary in one file and never call `Haptics` directly elsewhere:

| Event | Pattern |
| --- | --- |
| Add to bag | soft double-tap |
| Size selected | light tick |
| Order placed | firm single thud |
| Vendor accepted your order | rising double |
| Rider picked up | rising double, heavier |
| Rider arriving | triple tick |
| Error | sharp single |

Vendor side gets its own, louder set — a new order must be physically
impossible to miss (§ vendor alarm, [02](02-INTEGRATIONS.md)).

### 3.4 Sound (optional, off by default, one sound)

A single 300 ms fabric-swish on add-to-bag, opt-in on first use. Brands that
own a sound (Netflix, Slack) get recalled disproportionately. One sound only —
a chatty app is a deleted app.

---

## 4. The 3D question

`ScrollytellingScene.js` is beautiful and expensive. The fix is placement, not
deletion.

| Context | Treatment |
| --- | --- |
| **First launch** | Full cinematic. The drone shot over the shirt and the red dress *is* the onboarding. Ends on "Nagpur, delivered." and the location permission ask. Runs once, ever. |
| **Returning user, warm** | Home opens on the feed. A static, pre-rendered hero frame (a PNG baked from the same scene) sits at the top with the `spotlight` drift. Indistinguishable at a glance, ~0 cost. |
| **"Chapters" tab** | The full scene lives here as a browsable editorial surface, refreshed monthly with the season's hero pieces. Merchandising, not decor. |
| **Low-end device / reduce-motion / low-power** | Static hero always. Detect via `expo-device` tier + `AccessibilityInfo` + battery state. |

Add a hard budget: **cold start to interactive feed ≤ 2.5 s on a 4 GB Android
device.** Measure it in CI. If the scene threatens the budget, the scene loses.

---

## 5. Screens that must exist for the identity to land

Beyond the gap list in [00](00-STATE-OF-THE-APP.md):

- **"Kya Pehnu?" answer screen** — see §6.1. This is the home screen's real
  centre of gravity, not the feed.
- **Live order screen** — the Thread, the map, the rider, the vendor, and one
  big "call rider" button. Should be reachable from anywhere in one tap while
  an order is live.
- **Wardrobe** — everything you have bought, as a visual closet. Enables
  reorder, "wear it with", and gives the app a reason to open with no purchase
  intent.
- **Shop page** — the shop's name, owner, photo of the shutter, hours,
  distance, rating, full rail. Locality-as-luxury needs a face.
- **Nagpur Now** — a live, low-key ticker of what is selling near you
  ("3 people in Dharampeth bought this week"). Hyperlocal social proof is
  cheap to build and impossible for a national player to fake.

---

## 6. The differentiators (CEO section)

These are the reasons the app gets used repeatedly rather than once.

### 6.1 The answer engine — "Kya Pehnu?"

A three-tap flow, not a chat: **Occasion → Budget → For whom.**
(`Wedding / sangeet / interview / date / everyday / festival`, `₹1–3k / 3–6k /
6k+`, `me / gift`.) Returns 3–5 complete looks assembled from *in-stock items
within 5 km*, each with a live ETA and one "get the whole look" button.

Implementation is deliberately unglamorous: a rules + tags engine over
category, colour family, formality score, and occasion tags on each product,
seeded by the admin merchandising team. No ML needed for v1; add a
collaborative-filter re-rank once there are ~5k orders. The *positioning* is
AI-flavoured; the *machinery* is a lookup table you can debug.

This is the feature that justifies the app's name and its home screen.

### 6.2 Try Rack — try-before-you-buy in 45 minutes

**The category-defining feature.** Customer picks an item, selects up to 3
sizes/colours. The rider brings all of them, waits 10 minutes, the customer
tries them on, keeps what fits, and the rider takes the rest straight back to
the shop. Payment is authorised up front and captured only for what is kept.

Why it wins: it destroys the single biggest objection to buying clothes without
touching them, and no national player can do it because their inventory is in a
warehouse 800 km away. Nagpur's inventory is 2 km away.

What it needs: payment pre-auth + partial capture (Razorpay supports this),
a `TryOrder` order type, rider wait-time compensation in the fee model, a hard
item cap, and an abuse guard (deposit or trust score after N returns).

Launch it in Phase 6, on a limited catalogue, with a cap of 3 items and a
₹49 convenience fee that is waived if anything is kept.

### 6.3 Fit profile

One-time, 60-second: height, weight, usual size in a known brand, fit
preference (tight / regular / loose). Every size chip then renders with a
`sizeFit` badge — *"L — fits you"*, *"M — snug"*. Vendors supply garment
measurements (chest, length, shoulder) at listing time via the WhatsApp bot,
which makes the mapping mechanical rather than magical.

Second-order benefit: return rate is the #1 unit-economics killer in apparel.
Every point of return-rate reduction is pure margin.

### 6.4 Occasion carts (the Nagpur wedding insight)

Indian wedding shopping is a group activity across a colour theme and multiple
people. Ship **shared carts**: a link, several people adding items, one payer,
one delivery. Filter by colour family across all nearby shops
("everything maroon under ₹4,000 within 4 km"). This is a large, seasonal,
high-AOV wedge that a generic marketplace handles badly.

### 6.5 Retention mechanics

- **Wardrobe streaks / tiers** — free delivery above a tier, early access to
  new drops from your favourite shops.
- **Referral** — ₹100 for both sides, capped, with fraud checks.
- **Shop follow + drop alerts** — "Atelier Dharampeth added 4 pieces" push.
  Turns vendors into a content engine and gives push a non-spammy reason.
- **Emergency mode** — a "I need it in 2 hours" entry point that filters to
  guaranteed-in-stock, guaranteed-fast items. High intent, high conversion.

### 6.6 Vendor-side stickiness

The vendor is the scarcer resource. Give them things they cannot get elsewhere:

- Daily sales, best-sellers, and *"people near your shop searched for X 40
  times this week and you don't stock it"*.
- Payout ledger with next-settlement date, visible and honest.
- Rating and response-time score, with a leaderboard among nearby shops.
- Zero-effort listing (WhatsApp, [02](02-INTEGRATIONS.md)) — the real moat.

---

## 7. Design-system deliverables

To be produced in Phase 5, in this order:

1. `src/theme/typography.js` — the two-voice scale, 8 steps, with tracking.
2. `src/theme/motion.js` — the four springs + reduce-motion fallbacks.
3. `src/theme/haptics.js` — the event vocabulary.
4. `src/theme/elevation.js` — glass vs card vs editorial rules.
5. Component library: `Button` (3 variants), `Chip`, `SizeChip`, `PriceTag`,
   `ProductCard`, `ShopCard`, `Sheet`, `Skeleton`, `EmptyState`, `ErrorState`,
   `Thread` (the countdown), `StatusPill` (exists), `Toast`.
6. A Storybook-equivalent screen behind a dev flag showing every component in
   every state — the cheapest defence against drift.
7. Copy guide. The voice is short, confident, slightly editorial, never cute.
   *"Nagpur, delivered."* / *"Wrong size? New one in 45."* / *"Nothing here
   yet. Nagpur is stitching."*

---

## 8. Accessibility (non-negotiable, and a store-review item)

- Reduce-motion honoured by every spring and by the 3D scene.
- Minimum 4.5:1 contrast — the current `ash`/`slate` on `obsidian` needs an
  audit; several combinations will fail.
- Dynamic type support up to 200% without clipping.
- `accessibilityLabel` / `accessibilityRole` on every interactive element,
  especially the icon-only ones.
- 44×44pt minimum hit targets.
- The map screen needs a text-equivalent status ("Rider 1.2 km away,
  arriving 8 minutes") for screen readers.
