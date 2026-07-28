# Vercel and Supabase Deployment

This runbook records the shared production setup for Eventure. It contains no secret values and is safe to give to another developer or AI assistant.

## Live services

| Service  | Vercel project                               | URL                                                             |
| -------- | -------------------------------------------- | --------------------------------------------------------------- |
| Web      | `mini-project-event-management-platform-web` | `https://mini-project-event-management-platf-eta.vercel.app`    |
| API      | `mini-project-event-management-platform-api` | `https://mini-project-event-management-platf.vercel.app/api/v1` |
| Database | Supabase resource `eventure-production-db`   | Connected privately through Vercel                              |

Both Vercel projects are connected to the GitHub repository. `main` is production and pull-request branches receive Preview deployments.

## Monorepo project settings

### API project

- Root Directory: `apps/api`
- Framework Preset: Express
- Include files outside the Root Directory: enabled
- Production Branch: `main`
- Build Command:

```bash
pnpm --filter @eventure/shared build && pnpm --filter @eventure/database db:generate && pnpm --filter @eventure/database build && pnpm --filter @eventure/api build
```

### Web project

- Root Directory: `apps/web`
- Framework Preset: Next.js
- Include files outside the Root Directory: enabled
- Production Branch: `main`
- Build Command:

```bash
pnpm --filter @eventure/shared build && pnpm --filter @eventure/web build
```

## Environment-variable contract

Set application variables for both Production and Preview unless a narrower scope is intentional. Never commit their values.

### API variables maintained by the project

- `NODE_ENV` and `API_PORT`
- `FRONTEND_URL` set to the production web origin
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and their expiry variables
- `DEMO_CUSTOMER_EMAIL`, `DEMO_CUSTOMER_PASSWORD`, `DEMO_ORGANIZER_EMAIL`, and `DEMO_ORGANIZER_PASSWORD` for the seed
- Optional Cloudinary credentials provide the local upload fallback when Supabase is absent
- Real SMTP credentials and `MAIL_FROM` for account and transaction email

### Variables injected by the Supabase integration

- `POSTGRES_PRISMA_URL` is the pooled serverless runtime connection.
- `POSTGRES_URL_NON_POOLING` is the direct migration connection.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, public keys, host, user, password, and database metadata are managed by the integration.
- On its first hosted upload, the API creates the public `eventure-public` bucket with a 5 MB image-only limit; profile photos and payment proofs use random object paths.
- Do not add a placeholder `DATABASE_URL`; the application and Prisma config select the Supabase variables directly.

### Web variable

- `NEXT_PUBLIC_API_URL` points to the production API base URL ending in `/api/v1`.

Because this value is embedded during the Next.js build, redeploy the web project whenever it changes.

## Production migration and seed

The committed Prisma migrations are the source of truth. For the initial database only, temporarily use this API Build Command; it stays within Vercel's 256-character limit:

```bash
pnpm -F @eventure/database db:generate && pnpm -F @eventure/database exec prisma migrate deploy && pnpm -F @eventure/database db:seed && pnpm -F @eventure/shared build && pnpm -F @eventure/database build && pnpm -F @eventure/api build
```

Redeploy the latest Preview without build cache, confirm the seed reports 39 Indonesian events and 40 transactions, then immediately restore the normal API Build Command. The seed uses upserts, but it should not run during ordinary deployments.

## Promotion checklist

1. Run lint, type checking, unit tests, integration tests with PostgreSQL, Prisma validation, and production builds.
2. Confirm the latest API Preview returns `200` from `/api/v1/health`.
3. Confirm `/api/v1/events` returns the seeded Indonesian catalog.
4. Verify the web Preview loads, authenticates both roles, and calls the matching API Preview or production API.
5. Confirm the pull request has all required checks and a partner approval.
6. Merge `develop` into `main`; do not push directly to `main`.
7. Wait for both Production deployments to report Ready.
8. Repeat health, catalog, login, checkout, payment-proof, organizer decision, dashboard, and review checks on the production URLs.

## Reviewer access

Hosted reviewer accounts are generated from the `DEMO_*` Vercel variables. Share their values privately with the assessor, and rotate or remove them after assessment.
