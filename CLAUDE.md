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

**IMPORTANT: NEVER manually create or edit migration files. ALWAYS use these CLI commands to manage migrations.**

```bash
bun run migrations:generate -n <name>  # Generate TS migration (up/down) from schema diff
bun run migrations:up                  # Apply pending migrations
bun run migrations:down                # Rollback last batch
bun run migrations:down --batch <n>    # Rollback to specific batch
bun run migrations:status              # Show migration status
bun run migrations:fresh               # Rollback ALL migrations
bun run migrations:refresh             # Rollback ALL then re-apply
bun run db:studio                      # Open Drizzle Studio GUI
```

### Infrastructure

```bash
docker compose -f docker/docker-compose.yml up -d     # Start Postgres, Redis, Centrifugo
docker compose -f docker/docker-compose.yml down       # Stop all services
```

### Adding shadcn/ui components

The UI package uses shadcn/ui (new-york style) with Radix primitives. The `components.json` is in `packages/ui/`.

**IMPORTANT: When you need a UI component, ALWAYS first search the [shadcn/ui registry](https://ui.shadcn.com) for an existing component before writing one from scratch.** This is the correct workflow:

1. Search shadcn/ui for the needed component (e.g. dialog, dropdown-menu, tabs, toast, etc.)
2. Install it from `packages/ui/`: `cd packages/ui && bunx shadcn@latest add <component>`
3. Import and use via subpath exports: `@student-helper/ui/web/primitives/<component>`

## Validation After Changes

**Only run checks relevant to the code you actually changed.** Do NOT run all checks every time.

| What changed | What to run |
|---|---|
| Backend code (`apps/backend/`) | `bun run --filter @student-helper/backend typecheck`, `bun run --filter @student-helper/backend lint`, `bun run tests` |
| Frontend code (`apps/frontend/`) | `bun run --filter frontend typecheck`, `bun run --filter frontend lint`, `bun run --filter frontend test`, then **visual check via MCP Playwright** (see below) |
| UI package (`packages/ui/`) | `bun run --filter @student-helper/ui typecheck`, `bun run --filter @student-helper/ui lint` |
| Auth or critical flows | `bun run e2e` |
| Frontend before deploy/PR | `bun run --filter frontend build` |

Do NOT run `bun run typecheck` / `bun run lint` (full monorepo) or `bun run tests` (backend) when only frontend/UI code changed, and vice versa. Do NOT run build or E2E unless specifically needed.

### Visual check via Playwright (required for frontend changes)

**After** typecheck/lint/test pass, ALWAYS do a visual check of the affected page using MCP Playwright:

1. `browser_navigate` to the relevant page (e.g. `http://localhost:8000/app`)
2. `browser_snapshot` to inspect the accessibility tree and verify layout
3. `browser_take_screenshot` if needed for visual verification
4. If the change affects mobile, `browser_resize` to a mobile viewport (e.g. 375×812) and re-check

This catches layout regressions, broken styling, and rendering issues that typecheck/lint cannot detect.

If any check fails, fix the issues before finishing. Do NOT leave broken code.

## Architecture

**Turborepo monorepo** with these workspaces:

- **`apps/frontend`** — Next.js 16 app (React 19). Uses App Router + Feature-Sliced Design (FSD). UI components come from `@student-helper/ui` — always check shadcn/ui for ready-made components before building custom ones.
- **`apps/backend`** — Elysia server (default port 3001, configurable via `BACKEND_PORT`). Modular architecture under `src/modules/`. Uses Drizzle ORM + Postgres, Better Auth, BullMQ + Redis, Centrifugo for realtime.
- **`packages/ui`** (`@student-helper/ui`) — Shared component library built on Radix UI + Tailwind CSS 4 + Class Variance Authority. **Uses shadcn/ui as the primary source of components** — search and install components via `bunx shadcn@latest add <name>` from this directory before writing custom ones. Contains:
  - `src/web/primitives/` — Low-level shadcn-style components (button, input, dialog, dropdown-menu, field, label, separator, tabs, code)
  - `src/web/components/` — Higher-level composed components (card)
  - `src/web/hooks/` — React hooks (useMediaQuery, useLockBodyScroll)
  - `src/tokens/` — Design tokens (colors, spacing, typography, shadows, z-index)
  - `src/types/` — Shared TypeScript types for components
  - `src/utils/cn.ts` — `cn()` utility (clsx + tailwind-merge)
- **`packages/contracts`** (`@student-helper/contracts`) — Shared Zod schemas and types. Contains streaming event schemas (token, thinking, tool_call, tool_result, done, error) with `StreamEvent` discriminated union and parse helpers. Exports via `@student-helper/contracts/stream`.
- **`packages/config`** (`@student-helper/config`) — Shared configuration (env schema with custom `.env` loader, defaults)
- **`packages/eslint`** (`@student-helper/eslint`) — Shared ESLint flat configs (`base`, `next-js`, `react-internal`)
- **`packages/tsconfig`** (`@student-helper/tsconfig`) — Shared tsconfig bases (`base.json`, `nextjs.json`, `react-library.json`)

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

`apps/backend/src/app.ts` exports `createApp()` which assembles the Elysia app:
1. CORS (origin: `FRONTEND_URL`, credentials: true)
2. `GET /health` — `{ status: "ok", timestamp }`
3. `GET /app` and `GET /app/*` — redirects to frontend (handles Better Auth magic-link callback redirection)
4. Auth plugin (mounts `/api/auth/*` + macros)
5. All module routes

`src/index.ts` calls `createApp().listen()`.

### Database

- **Drizzle ORM** with `postgres.js` driver. Schema in `src/db/schema.ts`, client in `src/db/index.ts`.
- **Migrations** via `@drepkovsky/drizzle-migrations` with up/down support. Config at `apps/backend/drizzle.config.ts` (outside `src/`, not typechecked). TS migration files in `apps/backend/src/migrations/`.
- Tables: `user`, `session`, `account`, `verification` (Better Auth), `chat`, `message` (app), `organization`, `member`, `invitation` (org).
- All columns use snake_case in Postgres (e.g. `email_verified`, `user_id`).

### Authentication

- **Better Auth** with email+password, magic links, organization (multi-tenancy), admin (role-based). Config in `src/auth.ts`.
- Elysia plugin in `src/plugins/auth.ts`: mounts handler at `/api/auth/*` and provides `auth`/`adminAuth` macros for protected routes.
- **Macro usage**: In Elysia macros, use `status(code, body)` (not `error()`). Example: `return status(401, { error: "Unauthorized" })`.
- Cookie prefix: `sh`, httpOnly, sameSite: lax.

### Queues & Workers

- **BullMQ** queues defined in `src/queues/index.ts`: `messageGenerationQueue`, `autoArchiveQueue`.
- **Workers** in `src/queues/workers.ts`, started via separate entry `src/worker.ts` (`bun run workers:dev`).
- **Redis** connection in `src/redis/index.ts` using `ioredis` with `maxRetriesPerRequest: null`.

### Realtime

- **Centrifugo** for WebSocket realtime. Token endpoint at `GET /centrifugo/token` (HS256 JWT via `jose`).
- Config in `centrifugo.json` at repo root.

## Testing

### Backend (unit + integration)

Uses **Bun's built-in test runner** (`bun:test`).

```bash
bun run tests                             # Run all backend tests (unit + integration)
bun run --filter backend test:unit        # Unit tests only
bun run --filter backend test:integration # Integration tests (starts Docker containers)
```

Integration tests use a custom testkit (`apps/backend/test/testkit/`) that:
- Spins up ephemeral Docker containers (postgres, redis) via **testcontainers** with random ports
- Runs migrations via `drizzle-migrations up`
- Provides helpers: `createTestApp()`, `request()`, `resetAll()`, `getDb()`, `getRedis()`
- Preload file (`test/setup/integration.preload.ts`) handles lifecycle (beforeAll/beforeEach/afterAll)
- Integration test timeout: 120 seconds
- Skip with `RUN_INTEGRATION=0`

### Frontend (unit)

Uses **Vitest** with jsdom.

```bash
bun run --filter frontend test        # Run all frontend tests
bun run --filter frontend test:watch  # Watch mode
```

Tests in `src/**/*.test.{ts,tsx}`, setup in `src/test/setup.ts`.

### E2E (Playwright)

End-to-end tests in `e2e/` directory using **Playwright** (Chromium). Test specs: `auth-login`, `auth-signup`, `auth-middleware`, `core-regression`.

```bash
bun run e2e              # Run all e2e tests (spins up Docker containers + backend + frontend automatically)
bun run e2e:smoke        # Run only @smoke-tagged tests
bun run e2e:regression   # Run only @regression-tagged tests
bun run e2e:ui           # Run e2e tests with interactive UI
bun run e2e:report       # View last test report
```

The `scripts/run-e2e.ts` orchestration script:
- Starts ephemeral Docker containers (postgres, redis) via **testcontainers** with random ports
- Runs migrations with retry logic
- Picks random ports for frontend (42000-45999) and backend (46000-48999) unless overridden
- Playwright auto-starts backend and frontend via `webServer` config
- Screenshots/video/traces saved on failure

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

Docker config lives in `docker/` directory. Services in `docker/docker-compose.yml`:

**Infrastructure (for local dev)**:
- **postgres** (17-alpine) — port 5432, user/pass/db: `studenthelper`, healthcheck enabled
- **redis** (7-alpine) — port 6379, healthcheck enabled
- **centrifugo** (v6) — ports 8800→8000, 8801→8001

**Application (for containerized deployment)**:
- **backend** — builds from `docker/Dockerfile.backend`, port 3001, depends on postgres+redis+centrifugo
- **frontend** — builds from `docker/Dockerfile.frontend`, port 3000, depends on backend
