# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

Package manager is **Bun** (v1.2.18). All root commands use **Turborepo**.

```bash
bun install              # Install dependencies
bun run dev              # Start all apps/packages in dev mode
bun run build            # Build all workspaces
bun run lint             # Lint all workspaces (--max-warnings 0)
bun run typecheck        # Type-check all workspaces
bun run format           # Prettier format all ts/tsx/md files
bun run test             # Run tests via Turborepo
bun run tests            # Run backend unit + integration tests
bun run backend:dev      # Start backend only
bun run workers:dev      # Start BullMQ workers only
```

### Per-workspace commands

```bash
bun run --filter frontend dev          # Dev server on port 3000
bun run --filter frontend build        # Build web app only
bun run --filter @student-helper/ui lint    # Lint UI package only
```

### Database & Migrations (from `apps/backend/`)

```bash
bun run migrations:generate -n <name>  # Generate TS migration (up/down) from schema diff
bun run migrations:up                  # Apply pending migrations
bun run migrations:down                # Rollback last batch
bun run migrations:status              # Show migration status
bun run migrations:fresh               # Rollback ALL migrations
bun run migrations:refresh             # Rollback ALL then re-apply
bun run db:studio                      # Open Drizzle Studio GUI
```

### Infrastructure

```bash
docker compose up -d     # Start Postgres, Redis, Centrifugo
docker compose down      # Stop all services
```

### Adding shadcn/ui components

The UI package uses shadcn/ui (new-york style) with Radix primitives. The `components.json` is in `packages/ui/`. To add a component, run the shadcn CLI from that directory.

## Architecture

**Turborepo monorepo** with these workspaces:

- **`apps/frontend`** — Next.js 16 app (React 19). The main web application. Uses App Router.
- **`apps/backend`** — Elysia server (default port 3001, configurable via `BACKEND_PORT`). Modular architecture under `src/modules/`. Uses Drizzle ORM + Postgres, Better Auth, BullMQ + Redis, Centrifugo for realtime.
- **`packages/ui`** (`@student-helper/ui`) — Shared component library built on Radix UI + Tailwind CSS 4 + Class Variance Authority. Contains:
  - `src/web/primitives/` — Low-level shadcn-style components (button, input, dialog, dropdown-menu, code)
  - `src/web/components/` — Higher-level composed components (card)
  - `src/web/hooks/` — React hooks (useMediaQuery, useLockBodyScroll)
  - `src/tokens/` — Design tokens (colors, spacing, typography, shadows, z-index)
  - `src/types/` — Shared TypeScript types for components
  - `src/utils/cn.ts` — `cn()` utility (clsx + tailwind-merge)
- **`packages/contracts`** (`@student-helper/contracts`) — Shared Zod schemas and types. Contains streaming event schemas (token, thinking, tool_call, tool_result, done, error) with `StreamEvent` discriminated union and parse helpers.
- **`packages/config`** (`@student-helper/config`) — Shared configuration (env schema, defaults)
- **`packages/eslint`** (`@student-helper/eslint`) — Shared ESLint flat configs (base, Next.js, React)
- **`packages/tsconfig`** (`@student-helper/tsconfig`) — Shared tsconfig bases

## Key Patterns

- **Imports from `@student-helper/ui`** use subpath exports: `@student-helper/ui/web/primitives/button`, `@student-helper/ui/utils/cn`, `@student-helper/ui/tokens`, `@student-helper/ui/web/hooks/use-media-query`
- **Styling**: Tailwind CSS 4 with CSS-first config. Theme is defined via CSS variables (HSL) in `packages/ui/src/web/styles/globals.css`. The web app's `globals.css` imports `@student-helper/ui/globals.css`.
- **Dark mode**: `.dark` class on root element, all theme colors have dark variants via CSS variables.
- **Component variants**: Use Class Variance Authority (`cva`) for defining component variants (see button.tsx as reference).
- **ESLint**: Flat config format (ESLint 9). Zero warnings policy (`--max-warnings 0`).
- **TypeScript**: Strict mode, ESM modules (`"type": "module"`), target ES2022.

## Backend Architecture

### Module structure

Each module lives in `apps/backend/src/modules/<name>/` with three files:
- `routes.ts` — Elysia plugin with a prefix (e.g. `new Elysia({ prefix: "/chat" })`)
- `services.ts` — Business logic
- `repo.ts` — DB access layer (Drizzle queries)

Modules: `account`, `chat`, `uploads`, `textbook`, `family`, `rag`, `admin`, `centrifugo`.

> Note: `centrifugo` only has `routes.ts` (no services/repo) since it's a thin token endpoint.

### App factory

`apps/backend/src/app.ts` exports `createApp()` which assembles the Elysia app: CORS, auth plugin, all module routes. `src/index.ts` calls `createApp().listen()`.

### Database

- **Drizzle ORM** with `postgres.js` driver. Schema in `src/db/schema.ts`, client in `src/db/index.ts`.
- **Migrations** via `@drepkovsky/drizzle-migrations` with up/down support. Config at `apps/backend/drizzle.config.ts` (outside `src/`, not typechecked). TS migration files in `apps/backend/src/migrations/`.
- Tables: `user`, `session`, `account`, `verification` (Better Auth), `chat`, `message` (app), `organization`, `member`, `invitation` (org).
- All columns use snake_case in Postgres (e.g. `email_verified`, `user_id`).

### Authentication

- **Better Auth** with email+password. Config in `src/auth.ts`.
- Elysia plugin in `src/plugins/auth.ts`: mounts handler at `/api/auth/*` and provides `auth` macro for protected routes.
- **Macro usage**: In Elysia macros, use `status(code, body)` (not `error()`). Example: `return status(401, { error: "Unauthorized" })`.

### Queues & Workers

- **BullMQ** queues defined in `src/queues/index.ts`: `messageGenerationQueue`, `autoArchiveQueue`.
- **Workers** in `src/queues/workers.ts`, started via separate entry `src/worker.ts` (`bun run workers:dev`).
- **Redis** connection in `src/redis/index.ts` using `ioredis`.

### Realtime

- **Centrifugo** for WebSocket realtime. Token endpoint at `GET /centrifugo/token` (HS256 JWT via `jose`).
- Config in `centrifugo.json` at repo root.

## Testing

Backend has unit and integration tests using **Bun's built-in test runner** (`bun:test`).

```bash
bun run tests                        # Run all backend tests (unit + integration)
bun run --filter backend test:unit        # Unit tests only
bun run --filter backend test:integration # Integration tests (starts Docker containers)
```

Integration tests use a custom testkit (`apps/backend/test/testkit/`) that:
- Spins up ephemeral Docker containers (postgres, redis) with random ports
- Runs migrations via `drizzle-migrations up`
- Provides helpers: `createTestApp()`, `request()`, `resetAll()`, `getDb()`, `getRedis()`
- Preload file (`test/setup/integration.preload.ts`) handles lifecycle (beforeAll/beforeEach/afterAll)
- Skip with `RUN_INTEGRATION=0`

## Environment Variables

Defined in `packages/config/src/env.ts` (Zod schema). Key vars:

| Variable | Default |
|---|---|
| `NODE_ENV` | `development` |
| `BACKEND_PORT` | `3001` |
| `FRONTEND_PORT` | `3000` |
| `BACKEND_URL` | `http://localhost:3001` |
| `FRONTEND_URL` | `http://localhost:3000` |
| `DATABASE_URL` | *(required)* |
| `BETTER_AUTH_SECRET` | *(required)* |
| `REDIS_URL` | `redis://localhost:6379` |
| `CENTRIFUGO_TOKEN_SECRET` | `centrifugo-dev-secret` |
| `CENTRIFUGO_URL` | `http://localhost:8800` |
| `OPENAI_API_KEY` | *(optional)* |

## Docker Compose

Services in `docker-compose.yml`:
- **postgres** (17-alpine) — port 5432, user/pass/db: `studenthelper`
- **redis** (7-alpine) — port 6379
- **centrifugo** (v6) — ports 8800→8000, 8801→8001
