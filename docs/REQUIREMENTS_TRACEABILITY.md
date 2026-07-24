# Assignment Requirements Traceability

This matrix translates the supplied brief into implementation ownership and evidence. Update the Evidence column with route names, test files, and deployed URLs as features land.

| Requirement                                                       | Owner         | Planned evidence                                           | Status               |
| ----------------------------------------------------------------- | ------------- | ---------------------------------------------------------- | -------------------- |
| Registration, login, logout, hashing, JWT, protected routes, RBAC | Feature 2     | Auth API, auth middleware, protected layouts, tests        | Planned              |
| Minimum 7 entities and relational design                          | Shared        | Prisma schema with 13 entities and ERD                     | Foundation ready     |
| Full CRUD for 3 main entities                                     | Feature 1     | Event, ticket type, voucher/category endpoints and UI      | Planned              |
| One-to-many and many-to-many relations                            | Shared        | Event-ticket types and User-UserCoupon-Coupon              | Foundation ready     |
| Soft delete on main entities                                      | Both          | `deletedAt` fields and service query tests                 | Schema ready         |
| Backend validation and uniform errors                             | Both          | Zod schemas and `{ success, message, errors }` middleware  | Foundation ready     |
| Relevant, repeatable seed data                                    | Shared        | Idempotent Prisma seed                                     | Foundation ready     |
| Debounced search of at least 300 ms                               | Feature 1     | Search hook/component test                                 | Planned              |
| Backend filters, sorting, pagination                              | Feature 1     | Event list endpoint query and integration tests            | Planned              |
| Informative empty search/filter state                             | Feature 1     | Event list UI                                              | Primitive ready      |
| Six-state ticket transaction flow                                 | Feature 1     | Checkout/status services and state tests                   | Contract ready       |
| Two-hour proof and three-day organizer deadlines                  | Feature 1     | Expiry worker/service tests                                | Constants ready      |
| SQL rollback and seat/benefit restoration                         | Feature 1 + 2 | Prisma transaction tests                                   | Planned              |
| Three dashboard summary cards                                     | Feature 2     | Organizer dashboard                                        | Planned              |
| Two charts and date filter                                        | Feature 2     | Recharts UI and aggregation endpoints                      | Planned              |
| Cloud upload through Multer                                       | Feature 2     | Profile/proof upload with MIME/size validation and cleanup | Planned              |
| Async HTML email through Nodemailer                               | Feature 2     | Accept/reject notification service                         | Planned              |
| Confirmation dialogs on data modification                         | Both          | Shared dialog and flow tests                               | Planned              |
| Responsive UI                                                     | Both          | Four target viewport checks                                | Theme ready          |
| Unit tests for each flow                                          | Both          | Vitest suites in each workspace                            | Harness ready        |
| `.env.example`, CORS, secrets excluded                            | Shared        | Env parser, CORS allowlist, `.gitignore`                   | Foundation ready     |
| Frontend and backend deployed                                     | Both          | URLs in README                                             | Not started          |
| 20+ meaningful conventional commits                               | Both          | Git log                                                    | In progress          |
| `main`/`develop` branching and no direct main pushes              | Both          | Branches and GitHub protection settings                    | Local branches ready |
| README with features, stack, ERD, setup, URLs, demo users         | Shared        | Repository README                                          | Foundation ready     |

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
