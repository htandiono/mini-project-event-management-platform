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

## Evaluation flow

The deck covers frontend, backend, core features, feature testing, industry readiness, code understanding, and presentation quality. The supplied PDF has a percentage inconsistency between its overview and detailed scoring pages; the deck calls this out transparently and presents evidence for every listed category instead of assuming one interpretation.

## Controls

- `Left` / `Right`, `Page Up` / `Page Down`, or `Space`: navigate
- `Home` / `End`: jump to the first or final slide
- `N`: toggle speaker notes
- `F`: toggle full screen
- Touch swipe and the on-screen controls are available on smaller devices
