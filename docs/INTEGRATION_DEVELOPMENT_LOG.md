# Feature 2 and Integration Development Log

This log records how Feature 2 was developed and how both feature branches were combined. Feature 1's detailed sequence is recorded separately in `FEATURE_1_DEVELOPMENT_LOG.md`.

## Feature 2 branch steps

1. `bd487d7 feat(shared): define auth, referral, and dashboard schemas and interfaces`
   - Established shared auth, account, referral, dashboard, transaction decision, and attendee contracts.
2. `c6e2974 feat(database): update schema and seed with user accounts and referral ledger`
   - Added the account, reward, payment-proof, dashboard, and attendance persistence fields.
3. `42151b9 feat(api): implement JWT authentication and RBAC authorization middleware`
   - Added cookie/Bearer authentication and customer/organizer role enforcement.
4. `561bb3c feat(api): create auth and user profile management endpoints`
   - Added registration, login/logout, password reset/change, profiles, coupons, points, referrals, and avatar upload.
5. `0e62381 feat(web): build authentication pages and client auth context provider`
   - Added registration, login, password recovery, session context, and route-aware navigation.
6. `ae6fa9b feat(web): add customer account workspace for profile, coupons, and points`
   - Added customer profile, reward, referral, order, and password pages.
7. `3f6c8e5 feat(api): build organizer transaction review and automated email notification service`
   - Added organizer accept/reject decisions and post-commit notification email.
8. `f0c0647 feat(api): build dashboard analytics aggregation and attendee list endpoints`
   - Added organizer revenue, ticket, rating, category, and attendee queries.
9. `ba5f037 feat(web): create organizer dashboard, transaction review, and attendee list modal`
   - Added organizer operational pages and payment-proof decision controls.
10. `0a2f694 feat(web): integrate Recharts statistical visualizations in organizer analytics`
    - Added revenue, ticket-sales, and category visualizations with date filters.
11. `25d8dfd chore(workspace): finalize linting, formatting, and audit reporting for demo readiness`
    - Recorded the partner branch's final preparation snapshot; integration later removed its generated audit artifact.

## Integration steps

### 1. Merge Feature 1

**Commit:** `52aa571 merge: integrate Feature 1 into develop candidate`

- Merged the event, ticket, voucher, checkout, lifecycle, and review branch without squashing its atomic history.
- Kept the work on `integration/features-1-2` until both features could be reviewed together.

### 2. Merge Feature 2 and resolve shared seams

**Commit:** `20f3617 merge: integrate Feature 2 into develop candidate`

- Resolved router, header, shared transaction type, and seed conflicts.
- Namespaced organizer order decisions under `/api/v1/organizer/transactions` so they do not collide with customer checkout routes.
- Made authentication populate both `request.user` and `response.locals.user`.
- Reused Feature 1's atomic rollback helper for organizer rejection and deadline cancellation.
- Corrected the Feature 2 API client fallback port to `4000`.

### 3. Prepare Indonesian demo data

**Commit:** `9bc2dc6 feat(database): seed Indonesian event demo data`

- Seeded 39 events across Jakarta, Badung, Bandung, Surabaya, and Yogyakarta with correct provinces.
- Added Indonesian organizers/customers, demo rewards, 40 realistic transaction states, payment proofs, and attended-event reviews.
- Kept pending orders inside valid deadlines for organizer demonstrations.
- Renamed the initial migration descriptively and aligned the coupon relation index with the final schema.

### 4. Test migrations against PostgreSQL in CI

**Commit:** `768ec18 ci: verify migrations against PostgreSQL`

- Added a healthy PostgreSQL 16 service to GitHub Actions.
- Applied committed migrations before the full verification command.
- Added `pnpm db:migrate:deploy` for CI, local setup, and deployment use.

### 5. Normalize merged formatting

**Commit:** `2b2016b style: normalize merged feature formatting`

- Applied the repository's Prettier rules only to the files that failed the formatting gate.
- Kept this mechanical change separate from behavior fixes.

### 6. Remove the generated audit artifact

**Commit:** `19da00c chore: remove generated audit artifact`

- Removed an unverified generated score report that was not application or assignment documentation.

### 7. Complete payment-proof upload on the API

**Commit:** `b571fd0 feat(api): upload customer payment proofs`

- Added authenticated JPEG/PNG/WebP receipt upload with a 5 MB limit.
- Stored proof images in Cloudinary without avatar cropping.
- Atomically moved eligible orders to `WAITING_FOR_CONFIRMATION` and set the three-day organizer deadline.
- Deleted the uploaded cloud asset if the database transition lost a concurrency race.
- Added focused tests for the successful transition and compensating cloud cleanup.

### 8. Complete payment-proof upload on the web

**Commit:** `6c6a5b5 feat(web): submit payment proof from transaction details`

- Added customer-side file selection, client validation, multipart submission, errors, and status refresh.
- Kept the browser-generated multipart boundary intact.
- Added tests for file constraints and the multipart API request.

### 9. Harden organizer transaction decisions

**Commit:** `244425e fix(api): harden organizer transaction decisions`

- Validated status/event filters before Prisma receives them.
- Made acceptance a conditional transition so two requests cannot both accept and email the same order.
- Added shared contract tests for supported and unknown statuses.

### 10. Correct dashboard filters and attendees

**Commit:** `7005dea fix(api): validate dashboard date filters`

- Validated real `YYYY-MM-DD` values and rejected reversed date ranges.
- Applied inclusive day boundaries in the `Asia/Jakarta` offset.
- Limited attendee lists to confirmed `DONE` orders.
- Added shared date-range contract tests.

### 11. Parse Express 5 query filters safely

**Commit:** `cac0091 fix(api): parse Express query filters safely`

- Fixed the PostgreSQL CI failure caused by assigning to Express 5's read-only `request.query` accessor.
- Parsed dashboard and organizer transaction queries in their async controllers instead.
- Preserved the same shared Zod validation and standard validation-error response.

### 12. Align customer orders with the API response

**Commit:** `05c452a fix(web): align customer orders with API fields`

- Confirmed the review report by tracing `/api/v1/users/me/orders` to its Prisma transaction response.
- Replaced the stale `code`, `originalAmount`, and `finalAmount` frontend fields with `invoiceNumber`, `subtotal`, and `total`.
- Renamed the stale `expiresAt` contract field to the actual `paymentDeadline` field.
- Added a page regression test that renders an Indonesian invoice number and formatted transaction total.

### 13. Remove the dead organizer create route

**Commit:** `29699b5 fix(web): remove dead organizer create route`

- Confirmed that `/organizer/events/new` is absent from the Next.js route tree.
- Removed the redundant broken sidebar link while retaining the working `My Events` destination.
- Found and corrected the same dead route in the dashboard quick action so it opens the existing event manager.
- Added navigation regression tests for both the sidebar and dashboard destinations.

### 14. Make API imports portable for Vercel

**Commit:** `02ac37e fix(api): use portable module imports for Vercel`

- Reproduced Vercel's stricter module-interop type check locally.
- Switched Helmet to an explicit namespace/default call compatible with both NodeNext and Vercel.
- Switched the Node crypto import to the portable `node:` namespace form.
- Verified linting, normal and strict-interoperability type checks, the API production build, and all 24 database-independent API tests.

### 15. Normalize Helmet across Vercel module modes

**Commit:** `071d8b1 fix(api): unwrap Helmet across Vercel module modes`

- Confirmed the Vercel preview compiler wrapped Helmet differently from both the normal and strict local TypeScript modes.
- Added a small runtime-safe factory that accepts either a callable default or a wrapped default export.
- Kept the security middleware behavior unchanged.
- Re-ran formatting, linting, both TypeScript modes, the API production build, and all 24 database-independent API tests.

### 16. Support native Vercel Supabase variables

**Commit:** `cb625ec feat(database): support Vercel Supabase URLs`

- Accepted Vercel's pooled `POSTGRES_PRISMA_URL` as the production runtime connection.
- Preferred `POSTGRES_URL_NON_POOLING` for Prisma CLI migration commands when available.
- Preserved `DATABASE_URL` for local development and existing deployments.
- Added environment parsing tests and verified Prisma generation and validation with only the Supabase-style variable.

### 17. Export the API as a Vercel serverless handler

**Commit:** `a9a2645 fix(api): export Vercel serverless handler`

- Reproduced the live `FUNCTION_INVOCATION_FAILED` response after the preview build completed successfully.
- Traced the Vercel runtime log to a missing default handler export in `src/app.ts`.
- Added a lazily initialized default handler while retaining the reusable `createApp` factory for local startup and tests.
- Added a regression assertion for the serverless export and passed linting, type checking, the API build, and all 28 database-independent API tests.

### 18. Configure Vercel and seed Supabase

**Commit:** `671bd7d docs: document Vercel Supabase deployment`

- Created separate Git-connected Vercel projects for the Express API and Next.js web workspaces.
- Connected the native Supabase resource to API Production and Preview environments without exposing provider values.
- Applied committed Prisma migrations and seeded 39 Indonesian events, 40 transactions, referral rewards, and reviewer accounts.
- Restored the ordinary API build command after the one-time seed and verified the final Preview health and public event responses.
- Added a secret-free deployment runbook covering project roots, build commands, environment-variable names, production URLs, and promotion checks.

### 19. Route hosted uploads to Supabase Storage

**Commit:** `7235537 feat(api): store uploads in Supabase`

- Added the official Supabase client and selected its storage adapter when Vercel injects the URL and service-role key.
- Created a constrained public image bucket lazily and generated unique paths for profile photos and payment proofs.
- Preserved Cloudinary as the local fallback, including its existing avatar crop behavior.
- Validated paired Supabase credentials and kept upload cleanup outside database transactions.
- Passed API linting, normal and Vercel-like type checks, the production build, and all 33 database-independent API tests.

### 20. Allow the stable Vercel web preview origin

**Commit:** `44e1561 feat(api): allow Vercel web previews`

- Kept the production web origin as the primary CORS allowlist entry.
- Added one optional, exact preview origin instead of accepting arbitrary Vercel subdomains.
- Wired the setting through local and serverless API startup.
- Added a regression test proving the configured Preview receives the CORS response header.

## Verification record

- Prisma schema validation and client generation: passed.
- Formatting: passed.
- ESLint across shared, database, API, and web workspaces: passed.
- TypeScript checks across all workspaces: passed.
- Database-independent tests: 61 passed (shared 8, API 34, web 19).
- Production builds: shared, database, Express API, and all 22 Next.js routes passed.
- PostgreSQL migrations, seed, and integration suites are enforced by the CI job before release to `main`.
