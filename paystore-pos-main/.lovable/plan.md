## Phase 1 — Quick Fixes (Immediate)
1. **Geofence → 200m** — Change `MAX_DISTANCE_METERS` from 500 to 200 in `useLocationVerification.ts`
2. **Current Order UI Fix** — Reduce cart width, add scroll, fix overlap in billing layout
3. **Sale Reset Alert Fix** — Debug and fix the warning popup trigger logic

## Phase 2 — Bug Fixes
4. **QR Order → Reports/Inventory Fix** — Ensure QR orders deduct inventory and reflect in sales reports when accepted/completed

## Phase 3 — New Features (DB + UI)
5. **Credit Ledger System** — New `credit_ledger` + `credit_payments` tables, customer-wise outstanding tracking, "Pay Due" button, payment history timeline
6. **Delivery Tracking** — New `delivery_assignments` table, assign delivery boy, track order status (Preparing → Out for Delivery → Delivered), delivery time tracking
7. **Menu UI Redesign** — Single theme color cards with product images, clean grid, highlight selected item

### Approach
- Phase 1 & 2 first (code changes only, no DB migration needed except QR fix)
- Phase 3 requires DB migrations — will implement one at a time with your approval
- Each phase will be implemented and verified before moving to next

Shall I proceed with Phase 1 first?