# Presentation domain production hotfix

## Context

The reviewed presentation release was merged from `develop` into `main` through pull request #6. Vercel deployed merge commit `3858a95` successfully for both the web and API projects.

The custom hostname `presentation.eventure.cloud` was then assigned to the web production environment. Hostinger received the Vercel-provided CNAME record:

- Type: `CNAME`
- Name: `presentation`
- Target: `91312b937de39f14.vercel-dns-017.com`
- TTL: `300`

DNS and HTTPS became available, but the first production smoke test found that the hostname root rendered the Eventure product homepage instead of the presentation.

## Atomic correction

### `0ac2c59 fix(web): route presentation hostname through proxy`

- Added the Next.js 16 `src/proxy.ts` entrypoint.
- Rewrites only `https://presentation.eventure.cloud/` to `/presentation`.
- Leaves `https://eventure.cloud/` and non-root presentation paths unchanged.
- Added three focused regression tests for those routing boundaries.

## Verification before push

- Focused proxy tests: 3 passed.
- Full web suite: 24 tests passed across 14 files.
- ESLint: passed with zero warnings.
- TypeScript: passed with `--noEmit`.
- Next.js production build: passed; 23 routes generated and Proxy detected.

## Responsibility boundary

- Feature 1 remains owned by `htandiono`.
- Feature 2 remains owned by `awanstywn`.
- This correction is shared deployment/integration work and does not reassign either feature.
