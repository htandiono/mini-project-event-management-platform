# Feature 1 Development Log

This document records Feature 1 as a sequence of small, reviewable commits. Each completed step names the commit message, describes the behavior introduced, and records the focused verification performed before committing.

## Completed steps

### Step 1 - Shared Feature 1 contracts

**Commit:** `feat(shared): define Feature 1 API contracts`

- Added stable event list/detail, category, ticket, voucher, checkout, transaction, and review DTOs.
- Kept persistence-specific Prisma types out of the web application contract.
- Reused the six transaction statuses and deadline constants established in the foundation.

**Verification:** shared package build and typecheck.

### Step 2 - Public event listing API

**Commit:** `feat(api): add public event discovery query`

- Added validated search, category, city, sorting, and pagination query parameters.
- Restricted discovery results to active, published, upcoming events.
- Calculated the public starting price from active ticket types and kept price sorting on the backend.
- Added category metadata for filter controls and focused tests for query limits and price ordering.

**Verification:** API lint, typecheck, and event service tests.

### Step 3 - Public event details

**Commit:** `feat(api): expose public event details`

- Added a slug-based published event endpoint with a consistent not-found response.
- Returned active ticket types, remaining capacity, venue details, and current event vouchers.
- Excluded soft-deleted or unavailable vouchers at the database query boundary.
- Added a focused mapping test for ticket and voucher date serialization.

**Verification:** API lint, typecheck, and public event service tests.

### Step 4 - Organizer event CRUD

**Commit:** `feat(api): add organizer event lifecycle`

- Added organizer-scoped list, create, update, and soft-delete endpoints.
- Added backend validation for event content, capacity, and chronological date ranges.
- Preserved booked-seat counts when capacity changes and blocked destructive capacity reductions.
- Blocked deletion while payment transactions are active, then soft-deleted the event and its ticket/voucher children atomically.
- Kept authentication ownership separate by consuming the `response.locals.user` contract that Feature 2 will populate.

**Verification:** shared/API typecheck, API lint, and organizer capacity tests.

### Step 5 - Event ticket type CRUD

**Commit:** `feat(api): manage event ticket types`

- Added organizer-scoped list, create, update, and soft-delete ticket endpoints.
- Enforced unique active ticket names, event-level allocation limits, and zero pricing for free events.
- Preserved sold quantities when capacity changes and blocked edits below sold quantity.
- Prevented deletion of ticket types that already have sales.

**Verification:** API lint, typecheck, and ticket allocation tests.

### Step 6 - Event voucher CRUD

**Commit:** `feat(api): manage limited event vouchers`

- Added organizer-scoped list, create, update, and soft-delete voucher endpoints.
- Required exactly one percentage or fixed-IDR discount and a valid active date range.
- Normalized voucher codes, enforced global uniqueness, and blocked usage limits below existing redemptions.
- Prevented meaningless voucher creation for free events.

**Verification:** shared/API typecheck, API lint, and voucher rule tests.

### Step 7 - Transactional checkout

**Commit:** `feat(api): create transactional ticket checkout`

- Added customer checkout validation with combined duplicate ticket quantities.
- Applied discounts in a documented order: event voucher, user coupon, then points.
- Reserved event and ticket capacity, redeemed benefits, and created invoice items inside one serializable SQL transaction.
- Used conditional updates to prevent overselling and over-redemption during concurrent checkouts.
- Completed zero-total registrations immediately; paid registrations receive the two-hour payment deadline.

**Verification:** API lint, typecheck, and checkout validation/calculation tests.

### Step 8 - Transaction status and rollback

**Commit:** `feat(api): restore benefits on transaction expiry`

- Added customer transaction history, detail, and unpaid cancellation endpoints.
- Expired unpaid transactions after two hours and canceled unreviewed proofs after the organizer deadline.
- Restored event capacity, ticket inventory, voucher usage, coupon status, and points in one SQL transaction.
- Guarded rollback with a conditional status transition so concurrent workers cannot restore twice.

**Verification:** API lint, typecheck, and atomic restoration tests.

### Step 9 - Attendee reviews

**Commit:** `feat(api): add post-event attendee reviews`

- Added create, edit, and soft-delete review endpoints tied to a completed customer transaction.
- Required the event to have ended before review creation and constrained ratings to one through five.
- Allowed a deleted transaction review to be restored without violating its unique transaction relationship.
- Added a public event review feed with database-calculated average rating and count.

**Verification:** shared/API typecheck, API lint, and review eligibility tests.

### Step 10 - Event publication guard

**Commit:** `fix(api): require tickets before event publication`

- Required organizers to create events as drafts and configure ticket inventory before publishing.
- Rejected draft-to-published transitions without an active ticket type.
- Excluded malformed paid events without ticket types from public discovery and protected price serialization.

**Verification:** API lint, typecheck, and organizer publication tests.

### Step 11 - Typed web API client

**Commit:** `feat(web): add public event API client`

- Added one typed fetch boundary for the shared API success and failure envelopes.
- Forwarded browser credentials for the authentication workstream without coupling Feature 1 to JWT implementation details.
- Added public event list, category, detail, and review helpers with encoded query parameters and abort support.
- Added tests for query serialization and success/error response handling.

**Verification:** web lint, typecheck, and API client tests.

### Step 12 - Event discovery interface

**Commit:** `feat(web): build searchable event discovery`

- Added a responsive discovery page backed by server-side search, category/city filters, sorting, and pagination.
- Debounced search input by 350 milliseconds and canceled stale network requests.
- Covered loading, error, empty, and populated result states with accessible announcements.
- Replaced landing-page fixtures with the next three published events from the API.

**Verification:** web lint, typecheck, debounce tests, and production build.

### Step 13 - Event detail interface

**Commit:** `feat(web): present event details and reviews`

- Added a responsive event page with Jakarta-local schedule, venue, organizer, capacity, and ticket information.
- Displayed currently valid event voucher codes and their IDR or percentage benefit.
- Added the public attendee review summary and review list with an accessible rating label.
- Covered API failure and not-found paths without exposing backend details.

**Verification:** web lint, typecheck, event detail component test, and production build.

### Step 14 - Guided ticket checkout

**Commit:** `feat(checkout): add guided ticket purchase`

- Added a customer checkout-options endpoint for live point balance and usable referral coupons.
- Added ticket quantity, event voucher, coupon, and point controls to the event detail page.
- Required an explicit confirmation before creating the transaction and redirected to its status page.
- Presented a clear login handoff when Feature 2 authentication has not established a customer session.

**Verification:** shared/API/web typecheck, lint, checkout form test, and production builds.

### Step 15 - Customer transaction tracking

**Commit:** `feat(web): track customer ticket transactions`

- Added customer transaction history and invoice detail pages using the six shared status labels.
- Displayed ticket line items, every applied benefit, and the final IDR total.
- Added a live payment-deadline countdown for unpaid orders.
- Added confirmation before customer cancellation and refreshed the server-restored transaction state.

**Verification:** shared/API/web typecheck, lint, countdown/API client tests, and production builds.

### Step 16 - Customer review editor

**Commit:** `feat(web): manage completed event reviews`

- Added review creation after a completed event has ended, with a one-to-five rating and validated comment.
- Added edit and delete actions for an existing transaction review.
- Required confirmation before publishing, updating, or deleting review data.
- Reflected the saved review immediately in transaction state while the public event feed remains server sourced.

**Verification:** shared/API/web typecheck, lint, review editor test, and production builds.

### Step 17 - Organizer event manager

**Commit:** `feat(web): manage organizer event lifecycle`

- Added the organizer event inventory and a validated create/edit form for core event details.
- Kept new events in draft status so tickets must be configured before publication.
- Added confirmed soft deletion and surfaced active-transaction conflicts from the API.
- Added a protected organizer detail endpoint to prefill edits without exposing another organizer's data.

**Verification:** shared/API/web typecheck, lint, organizer event component test, and production builds.

### Step 18 - Organizer ticket inventory

**Commit:** `feat(web): manage organizer ticket inventory`

- Added a dedicated event resource page for ticket type creation, editing, and deletion.
- Mirrored backend limits for free-event pricing, per-ticket capacity, sales windows, and sold-seat preservation.
- Displayed both ticket-level and event-level remaining inventory before publication.
- Required confirmation before every ticket mutation.

**Verification:** web lint, typecheck, ticket resource component test, and production build.

### Step 19 - Organizer event vouchers

**Commit:** `feat(web): manage organizer event vouchers`

- Added limited-time event voucher creation, editing, and soft deletion to the resource page.
- Supported either percentage or fixed-IDR discounts, normalized codes, usage limits, and active dates.
- Displayed live redemption counts and blocked voucher controls for free events.
- Required confirmation before every voucher mutation.

**Verification:** web lint, typecheck, ticket/voucher resource component test, and production build.

### Step 20 - Feature 1 demonstration data

**Commit:** `feat(database): seed Feature 1 event catalog`

- Expanded the repeatable seed with technology, music, and food events across Jakarta, Bandung, and Surabaya.
- Included multiple paid ticket tiers, a free registration tier, percentage vouchers, and fixed-IDR vouchers.
- Used stable slugs and voucher codes with upserts so repeated seeding does not duplicate records.

**Verification:** Prisma schema validation, database package lint, and seed typecheck.

### Step 21 - Restored coupon reuse

**Commit:** `fix(database): allow restored coupon reuse`

- Changed the user-coupon transaction relation from one-to-one to one-to-many.
- Preserved each historical transaction's coupon reference while allowing a restored coupon to discount a later checkout.
- Added an index for transaction lookups by user coupon and updated the README ERD.

**Verification:** Prisma format/validation, generated client, and workspace typecheck.

### Step 22 - Event edit inventory guards

**Commit:** `fix(api): preserve ticket rules on event edits`

- Prevented event capacity reductions below the sum of active ticket allocations.
- Prevented switching an event to free while any active ticket tier still has a price.
- Kept the earlier booked-seat and publication-readiness guards intact.

**Verification:** API lint, typecheck, and organizer inventory regression tests.

### Step 23 - Shared rejection rollback seam

**Commit:** `refactor(api): expose transaction rollback seam`

- Exposed the tested transaction restoration operation for Feature 2 payment-proof rejection.
- Allowed `REJECTED` as a terminal rollback status while retaining the conditional one-time transition.
- Documented the exact `response.locals.user`, organizer deadline, rollback, and email integration contracts for the partner.

**Verification:** API lint, typecheck, and transaction restoration tests.

### Step 24 - Event details test router

**Commit:** `test(web): provide router in event details test`

- Updated the event-details integration test to supply the Next.js router used by its checkout form.
- Kept the production navigation behavior intact while exercising the complete event detail composition.

**Verification:** focused event-details component test and full web test suite through `pnpm verify`.

### Step 25 - Final implementation evidence

**Commit:** `docs: finalize Feature 1 implementation evidence`

- Updated the repository status, clone instructions, API surface, and Feature 1 development-log link.
- Replaced planned Feature 1 requirements with concrete source and test evidence.
- Recorded the GitHub workflow state and the final atomic commit counts.

**Verification:** Markdown formatting, link/path review, clean worktree, and full `pnpm verify`.

## Delivered sequence summary

1. Shared contracts and public event discovery/detail APIs.
2. Organizer event, ticket type, and voucher lifecycle APIs.
3. Serializable checkout, deadline processing, complete rollback, and attendee reviews.
4. Searchable discovery, event detail, checkout, transaction, review, and organizer interfaces.
5. Demonstration seed data, integrity fixes, partner integration seams, integration-test hardening, and final evidence.
