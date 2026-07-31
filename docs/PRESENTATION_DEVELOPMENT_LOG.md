# Interactive Presentation Development Log

This log records how the Eventure presentation was added as a deployable web experience. It is an assessment and demonstration layer; it does not reassign implementation credit between the two project features.

## Responsibility guardrail

| Workstream         | Owner       | Presentation coverage                                                                                                         |
| ------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Feature 1          | `htandiono` | Event discovery, event/ticket/voucher CRUD, checkout, payment proof, deadlines, rollback, orders, and reviews                 |
| Feature 2          | `awanstywn` | Authentication, RBAC, referrals, rewards, profiles, organizer operations, dashboard analytics, hosted uploads, and email      |
| Shared integration | Both        | API contracts, relational schema decisions, cross-feature rollback seams, integration testing, review, and production release |

Every ownership label and speaker note follows this boundary. Shared evaluation evidence is described as integration work, not as a transfer of feature ownership.

## Atomic development steps

### 1. Allow the presentation origin

**Commit:** `a038ca9 feat(api): allow presentation origin`

- Added an optional `PRESENTATION_URL` environment value.
- Included only that exact origin in the Express CORS allowlist.
- Wired local and serverless startup through the same configuration.
- Added environment and CORS regression coverage; 13 focused API tests passed with lint and type checking.

### 2. Build the interactive presentation

**Commit:** `97e22eb feat(web): add interactive project presentation`

- Added 15 responsive slides following an opening, product, ownership, feature, architecture, rubric, live-proof, defense, and closing narrative.
- Made the Feature 1 and Feature 2 owners explicit before describing either development flow.
- Added keyboard, dot, button, touch, notes, and full-screen controls.
- Added a live API health/catalog console and an embedded production product view.
- Added a host-specific rewrite so only `presentation.eventure.cloud` serves the deck at `/`.
- Added verified Open Graph artwork aligned with the Eventure visual system.

### 3. Test navigation, ownership, and live proof

**Commit:** `7637ffe test(web): cover presentation interactions`

- Verified keyboard navigation between slides.
- Asserted the exact `Feature 1 · htandiono` and `Feature 2 · awanstywn` labels.
- Mocked successful production health and event responses and verified the summarized result.
- Passed all 21 web tests, lint, strict TypeScript checking, and the production build for all 23 routes.

### 4. Record deployment and rubric evidence

**Commit:** `docs: document interactive presentation`

- Replaced retired Vercel aliases in reviewer-facing documentation with the custom production domains.
- Added the presentation domain, environment contract, DNS steps, and verification checklist.
- Updated assignment traceability and the merged verification totals.

### 5. Normalize blank optional origins

**Commit:** `2581f44 fix(api): ignore blank optional origins`

- Traced the first protected PR run's authentication failures to blank optional URLs copied from `.env.example`.
- Normalized blank preview and presentation origins to an absent value while keeping malformed non-empty URLs invalid.
- Added focused regression coverage and passed 14 environment/CORS tests, API lint, and API type checking before rerunning CI.

### 6. Refocus the deck for examiner review

**Commit:** `d50472b feat(web): refocus presentation for examiner review`

- Replaced the investor-style narrative with a 14-slide technical flow for teachers and examiners: brief, ownership, system flow, architecture, database, both features, transaction safety, API reference, evidence, production demo, and defense.
- Used a restrained academic visual direction inspired by the supplied reference: off-white paper, oversized black headings, minimal teal/coral accents, and simple geometric structure.
- Preserved the exact Feature 1 / Feature 2 responsibility boundary and added presenter-specific speaker notes.
- Verified the source before making numeric claims: 12 Prisma models and 45 Express router endpoints.
- Added a complete role-grouped API quick reference, a public `curl` example, an authenticated checkout contract, and the existing live health/catalog check.

### 7. Cover the examiner presentation flow

**Commit:** `5154eb1 test(web): cover examiner presentation flow`

- Updated keyboard-navigation and ownership assertions for the new academic flow.
- Added route-reference coverage for public and organizer endpoint families.
- Kept the production API check test for health, catalog totals, cities, and the first event.
- Passed all 25 web tests, zero-warning lint, strict TypeScript checking, and the production Next.js build for all 23 routes.

## Evaluation flow

The deck is an academic implementation walkthrough rather than a product pitch. It covers frontend, backend, core features, feature testing, industry readiness, code understanding, and presentation quality. The supplied PDF has a percentage inconsistency between its overview and detailed scoring pages; the deck calls this out transparently and presents evidence for every listed category instead of assuming one interpretation.

The main spoken flow is concise. The API reference is intentionally interactive and can be used only when an examiner requests a route-level explanation; it does not need to be read line by line.

## Controls

- `Left` / `Right`, `Page Up` / `Page Down`, or `Space`: navigate
- `Home` / `End`: jump to the first or final slide
- `N`: toggle speaker notes
- `F`: toggle full screen
- Touch swipe and the on-screen controls are available on smaller devices
