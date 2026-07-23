# Partner AI Handoff: Feature 2

Give this entire document to the AI assistant working on Feature 2. It is both an implementation brief and a merge-safety contract.

## Copy-ready prompt

```text
You are implementing Feature 2 in the Eventure monorepo. Work only on branch
feature/feature-2-accounts-dashboard, created from develop.

Before editing code, read these files completely:
- README.md
- docs/COLLABORATION.md
- docs/DESIGN_SYSTEM.md
- docs/DATABASE_GUIDE.md
- docs/REQUIREMENTS_TRACEABILITY.md
- packages/database/prisma/schema.prisma
- packages/shared/src/index.ts and every module it exports

Your scope:
1. Authentication and authorization
   - Customer and organizer registration
   - Login with hashed password, JWT in an httpOnly cookie, logout with token invalidation
   - Backend role guards and frontend protected routes
   - Focused tests for registration, login, logout, invalid credentials, and role denial
2. Referral, profile, points, and coupons
   - Generate immutable unique referral codes
   - Referral registration gives the referrer 10,000 points expiring after 3 months
   - Referral registration gives the new user a system coupon expiring after 3 months
   - Profile edit, password change/reset, and Cloudinary profile photo upload via Multer
   - Validate MIME type and size on the backend; delete the old cloud asset on replacement
3. Organizer dashboard and transaction decisions
   - Organizer-only event/transaction views and attendee lists
   - At least 3 summary cards and 2 Recharts visualizations
   - Day/month/year or explicit date-range filtering
   - Build aggregation endpoints using COUNT, SUM, AVG, and GROUP BY as appropriate
   - View payment proof, accept or reject only from WAITING_FOR_CONFIRMATION
   - Rejection atomically restores seats, points, coupon, and voucher usage
   - Send non-blocking HTML email with Nodemailer after accept/reject commits

Boundaries:
- Feature 1 owns public events, event CRUD, vouchers, checkout creation, expiry/cancel,
  and reviews. Do not duplicate those services.
- Transaction and PaymentProof are shared seams. Reuse the existing status values and
  coordinate any schema or DTO change before depending on it.
- Keep all prices as integer IDR and all persisted dates in UTC. Display Asia/Jakarta time.
- Search/filter/sort/pagination and dashboard aggregation happen on the backend.
- Use Prisma $transaction for every multi-record write; never call email/cloud APIs inside
  an open database transaction.
- Return the existing API envelope: success responses have success/message/data; errors
  have success/message/errors. Never expose password hashes, reset tokens, or cloud IDs.
- Keep soft-delete behavior and filter deleted records by default.

UI contract:
- Reuse CSS variables and existing button/card/empty-state patterns from globals.css.
- Primary coral #c94f43, teal #176d65, gold #e5aa3d, night #202b3b,
  canvas #f7f4ed, surface #fffdf9.
- Georgia is for display headings; system sans-serif is for UI/body.
- Mobile-first; verify 375, 768, 1024, and 1440 px.
- Every data view needs loading, error, empty, and success states.
- Every modify action needs a keyboard-accessible confirmation dialog.
- Charts require a text summary/accessibility alternative.

Engineering contract:
- Put reusable request/response types in packages/shared before consuming them in both apps.
- Keep controllers thin: route -> validation -> controller -> service -> Prisma.
- Add one focused test per happy path plus material invalid/authorization/expiry paths.
- Create a descriptive Prisma migration for schema changes; never modify an existing shared migration.
- Do not reformat or reorganize unrelated files.
- Run pnpm verify before requesting review.
- Use atomic conventional commits. Examples:
  feat(api): register users with referral rewards
  feat(web): protect organizer dashboard routes
  test(api): reject expired referral coupon redemption
  fix(api): restore points after transaction rejection

When a shared contract must change, stop feature implementation, propose the smallest contract
change, and place it in a separate commit/PR for both contributors to review.
```

## Recommended implementation order

1. Shared auth DTOs and validation schemas
2. Registration/login/logout service and tests
3. Auth middleware, RBAC guards, and protected frontend layout
4. Referral registration transaction and expiration queries
5. Profile/password flows and Cloudinary upload adapter
6. Dashboard aggregation DTOs/endpoints, then Recharts UI
7. Payment proof decision transaction and compensation tests
8. Async Nodemailer adapter and HTML templates
9. Full Feature 2 flow tests, responsive review, and documentation update

## Handoff checklist

- Branch is based on the current `develop`
- `.env.example` documents any new variable without real credentials
- Prisma migration and README ERD agree
- Shared DTO changes were reviewed before UI/API divergence
- All authorization is enforced server-side and mirrored client-side
- Referral expiration uses calendar-safe three-month behavior agreed by the team
- Rejection compensation is proven by tests
- Email failure cannot roll back an already-committed status change
- `pnpm verify` passes and the pull request template is complete
