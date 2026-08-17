# Kya Pehnu? — Product & Engineering Plan

Planning documents only. No code was changed to produce these.

| Doc | What it answers |
| --- | --- |
| [00 — State of the App](00-STATE-OF-THE-APP.md) | What exists today, and the 34 gaps between it and a production app. Read first. |
| [01 — Product Identity](01-PRODUCT-IDENTITY.md) | Typography, colour, the fabric-physics motion system, the five signature animations, and the differentiating features (answer engine, Try Rack, fit profile). |
| [02 — Integrations](02-INTEGRATIONS.md) | WhatsApp vendor inventory bot, the push→WhatsApp→SMS→voice escalation ladder, Porter logistics, and payments. |
| [03 — Admin & Economics](03-ADMIN-AND-ECONOMICS.md) | The admin panel's 13 modules, the pricing/commission/margin engine, unit economics, and the metrics that matter. |
| [04 — Infrastructure](04-INFRASTRUCTURE.md) | The free-tier stack, where free stops working, the maps cost trap, environments, and release engineering. |
| [05 — Compliance & Store Launch](05-COMPLIANCE-AND-STORE-LAUNCH.md) | Security hardening, reliability, testing, Indian regulatory requirements, and getting through App Store and Play review. |
| [06 — Roadmap Phases](06-ROADMAP-PHASES.md) | Nine phases, ~22 weeks, with exit criteria and a risk register. **The plan itself.** |

## The three things that matter most

1. **Week 1 is paperwork, not code.** Meta verification, Porter production
   access, DLT registration, Razorpay, Apple/Google accounts, and GST have
   3-day to 4-week lead times and every one of them blocks a later phase.
2. **The customer app has never talked to the backend.** It runs entirely on
   `mockStores.js`. Phase 1 is the largest and least glamorous phase, and
   nothing after it is meaningful until it lands.
3. **The moat is supply, not software.** Fifty Nagpur shopkeepers who can list
   inventory by sending a photo to WhatsApp, plus a rider who waits ten minutes
   while you try the shirt on.
