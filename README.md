# FTTH FieldOps

FTTH FieldOps is a monorepo for managing field operations, task tracking, materials, maps, approvals, and invoicing for fiber deployment teams.

## Tech Stack

- Web dashboard: Next.js 14
- Mobile app: Expo / React Native
- Shared workspace: pnpm workspaces + Turborepo
- Backend services: Supabase
- Testing: Vitest and Playwright

## Workspace Structure

```text
apps/
  web/       Next.js dashboard
  mobile/    Expo mobile app
packages/
  shared/    Shared schemas and utilities
  db-types/  Database types
  ui/        Shared UI tokens/exports
supabase/    Config, functions, and SQL migrations
tests/       Unit, E2E, and load tests
```

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create environment file

Copy `.env.example` to `.env` and fill in your real values.

Required values include:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `EXPO_PUBLIC_API_URL`

Optional integrations:

- Sentry variables for web and mobile
- E2E test credentials

### 3. Run the apps

Start all workspace dev servers:

```bash
pnpm dev
```

Run only the web app:

```bash
pnpm --filter @ftth/web dev
```

Run only the mobile app:

```bash
pnpm --filter @ftth/mobile dev
```

## Useful Commands

```bash
pnpm build
pnpm test
pnpm lint
pnpm type-check
pnpm e2e
```

## Supabase

The `supabase/` directory contains:

- database migrations
- edge functions
- project configuration

Make sure your Supabase project keys and URLs are configured before running the web or mobile app.

## Notes

- `node_modules/` and `.env` are not committed.
- The default locale is configured as Arabic through the environment template.
- GitHub Actions workflows are included under `.github/workflows/`.
