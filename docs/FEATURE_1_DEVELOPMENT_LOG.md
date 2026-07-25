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

## Planned sequence

1. Public event query validation, filtering, sorting, and pagination.
2. Public event details and category metadata.
3. Organizer event CRUD with soft deletion.
4. Ticket type and event voucher management.
5. Transactional checkout with capacity and discount enforcement.
6. Transaction expiry/cancellation restoration and customer transaction status.
7. Post-event review creation and editing.
8. Event discovery, detail, checkout, transaction, and organizer web flows.
9. Full Feature 1 verification and requirements evidence update.
