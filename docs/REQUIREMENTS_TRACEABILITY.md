# Assignment Requirements Traceability

This matrix translates the supplied brief into implementation ownership and evidence. Update the Evidence column with route names, test files, and deployed URLs as features land.

| Requirement                                                       | Owner         | Planned evidence                                           | Status            |
| ----------------------------------------------------------------- | ------------- | ---------------------------------------------------------- | ----------------- |
| Registration, login, logout, hashing, JWT, protected routes, RBAC | Feature 2     | Auth API, auth middleware, protected layouts, tests        | Planned           |
| Minimum 7 entities and relational design                          | Shared        | Prisma schema with 13 entities and ERD                     | Foundation ready  |
| Full CRUD for 3 main entities                                     | Feature 1     | Event, ticket type, and voucher API/UI; service tests      | Feature 1 ready   |
| One-to-many and many-to-many relations                            | Shared        | Event-ticket types and User-UserCoupon-Coupon              | Foundation ready  |
| Soft delete on main entities                                      | Both          | Event/ticket/voucher/review services filter `deletedAt`    | Feature 1 ready   |
| Backend validation and uniform errors                             | Both          | Feature 1 Zod schemas and shared error middleware          | Feature 1 ready   |
| Relevant, repeatable seed data                                    | Shared        | Three-city event/ticket/voucher upserts                    | Feature 1 ready   |
| Debounced search of at least 300 ms                               | Feature 1     | `use-debounced-value.test.tsx` verifies 350 ms             | Implemented       |
| Backend filters, sorting, pagination                              | Feature 1     | `public-events.service.ts` and focused tests               | Implemented       |
| Informative empty search/filter state                             | Feature 1     | `event-browser.tsx`                                        | Implemented       |
| Six-state ticket transaction flow                                 | Feature 1     | Checkout, status, expiry, cancel, and review services      | Feature 1 ready   |
| Two-hour proof and three-day organizer deadlines                  | Feature 1     | Checkout deadline and lifecycle expiry service             | Feature 1 ready   |
| SQL rollback and seat/benefit restoration                         | Feature 1 + 2 | Serializable checkout and shared restoration test          | Feature 1 ready   |
| Three dashboard summary cards                                     | Feature 2     | Organizer dashboard                                        | Planned           |
| Two charts and date filter                                        | Feature 2     | Recharts UI and aggregation endpoints                      | Planned           |
| Cloud upload through Multer                                       | Feature 2     | Profile/proof upload with MIME/size validation and cleanup | Planned           |
| Async HTML email through Nodemailer                               | Feature 2     | Accept/reject notification service                         | Planned           |
| Confirmation dialogs on data modification                         | Both          | Event/ticket/voucher/checkout/cancel/review confirmations  | Feature 1 ready   |
| Responsive UI                                                     | Both          | Feature 1 CSS module breakpoints and production pages      | Feature 1 ready   |
| Unit tests for each flow                                          | Both          | Feature 1 API services, hooks, clients, and components     | Feature 1 ready   |
| `.env.example`, CORS, secrets excluded                            | Shared        | Env parser, CORS allowlist, `.gitignore`                   | Foundation ready  |
| Frontend and backend deployed                                     | Both          | URLs in README                                             | Not started       |
| 20+ meaningful conventional commits                               | Both          | 63 total; 25 Feature 1 commits after evidence update       | Satisfied         |
| `main`/`develop` branching and no direct main pushes              | Both          | Remote branches and protected `main` with one approval     | Configured        |
| README with features, stack, ERD, setup, URLs, demo users         | Shared        | Repository README and Feature 1 implementation status      | Feature 1 updated |

## Feature 1 acceptance summary

- Upcoming event landing page, details, category/location filters, sorting, pagination, and debounced search
- Responsive organizer CRUD for events, ticket types, and limited-time event vouchers
- Free or paid IDR tickets and capacity enforcement
- Checkout with optional points, coupon, and voucher discount rules
- Payment proof countdown, automatic status deadlines, and complete rollback
- Customer review/rating only after a completed attended event

## Feature 2 acceptance summary

- Customer/organizer registration, login/logout, JWT invalidation, backend RBAC, and protected pages
- Immutable generated referral codes, referral registration, expiring 10,000-point credits, and expiring discount coupons
- Profile details, password change/reset, and cloud-hosted profile picture replacement with old-file cleanup
- Organizer event/transaction management, payment-proof review, attendee lists, and accept/reject actions
- Three server-aggregated metrics, two charts, and day/month/year or date-range filters
- Asynchronous HTML acceptance/rejection email with compensation on rejection
