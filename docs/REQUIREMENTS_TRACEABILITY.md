# Assignment Requirements Traceability

This matrix translates the supplied brief into implementation ownership and merged evidence.

| Requirement                                                       | Owner         | Merged evidence                                                   | Status      |
| ----------------------------------------------------------------- | ------------- | ----------------------------------------------------------------- | ----------- |
| Registration, login, logout, hashing, JWT, protected routes, RBAC | Feature 2     | Auth API, middleware, protected layouts, integration tests        | Implemented |
| Minimum 7 entities and relational design                          | Shared        | Prisma schema with 13 entities and README ERD                     | Implemented |
| Full CRUD for 3 main entities                                     | Feature 1     | Event, ticket type, and voucher API/UI with focused tests         | Implemented |
| One-to-many and many-to-many relations                            | Shared        | Event-ticket types and User-UserCoupon-Coupon                     | Implemented |
| Soft delete on main entities                                      | Both          | Event/ticket/voucher/review services filter `deletedAt`           | Implemented |
| Backend validation and uniform errors                             | Both          | Zod schemas, validation middleware, and shared error handler      | Implemented |
| Relevant, repeatable seed data                                    | Shared        | 39 Indonesian events, 40 orders, rewards, proofs, and reviews     | Implemented |
| Debounced search of at least 300 ms                               | Feature 1     | `use-debounced-value.test.tsx` verifies 350 ms                    | Implemented |
| Backend filters, sorting, pagination                              | Feature 1     | Public event query service and focused tests                      | Implemented |
| Informative empty search/filter state                             | Feature 1     | `event-browser.tsx`                                               | Implemented |
| Six-state ticket transaction flow                                 | Feature 1     | Checkout, proof upload, decision, expiry, cancel, review          | Implemented |
| Two-hour proof and three-day organizer deadlines                  | Both          | Checkout/lifecycle services and proof submission service          | Implemented |
| SQL rollback and seat/benefit restoration                         | Feature 1 + 2 | Shared atomic restoration service and compensation tests          | Implemented |
| Three dashboard summary cards                                     | Feature 2     | Organizer dashboard summary                                       | Implemented |
| Two charts and date filter                                        | Feature 2     | Recharts analytics with validated Jakarta date range              | Implemented |
| Cloud upload through Multer                                       | Feature 2     | Profile and payment-proof upload with type/size checks            | Implemented |
| Async HTML email through Nodemailer                               | Feature 2     | Welcome/reset and post-commit transaction decision emails         | Implemented |
| Confirmation dialogs on data modification                         | Both          | Event, ticket, voucher, checkout, cancel, review, proof decisions | Implemented |
| Responsive UI                                                     | Both          | Shared tokens, CSS modules, and responsive account/dashboard UI   | Implemented |
| Unit and integration tests for material flows                     | Both          | API, shared, and web Vitest suites plus PostgreSQL CI             | Implemented |
| `.env.example`, CORS, secrets excluded                            | Shared        | Env parser, CORS allowlist, `.gitignore`                          | Implemented |
| Frontend and backend deployed                                     | Both          | URLs in README                                                    | Pending     |
| 20+ meaningful conventional commits                               | Both          | More than 85 atomic and merge commits                             | Satisfied   |
| `main`/`develop` branching and no direct main pushes              | Both          | Feature merges into `develop`; protected release PR to `main`     | Configured  |
| README with features, stack, ERD, setup, URLs, demo users         | Shared        | Updated repository README                                         | Implemented |

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
