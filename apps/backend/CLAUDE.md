# Backend — CLAUDE.md

Elysia server with modular architecture. Uses Drizzle ORM + Postgres, Better Auth, BullMQ + Redis, Centrifugo for realtime.

## Commands

```bash
bun run --filter backend dev              # Dev server with watch (port from BACKEND_PORT, default 3001)
bun run --filter backend build            # Build to dist/ (bun target)
bun run --filter backend workers:dev      # Start BullMQ workers with watch (separate process)
bun run --filter backend lint             # ESLint (--max-warnings 0)
bun run --filter backend typecheck        # tsc --noEmit
bun run --filter backend test:unit        # Unit tests (no infra needed)
bun run --filter backend test:integration # Integration tests (starts Docker containers)
bun run --filter backend tests            # Run both unit + integration tests
```

### Database & Migrations (run from apps/backend/)

```bash
bun run migrations:generate -n <name>  # Generate TS migration (up/down) from schema diff
bun run migrations:up                  # Apply pending migrations
bun run migrations:down                # Rollback last batch
bun run migrations:status              # Show migration status
bun run migrations:fresh               # Rollback ALL migrations
bun run migrations:refresh             # Rollback ALL then re-apply
bun run db:studio                      # Open Drizzle Studio GUI
```

## Project Structure

```
src/
├── index.ts              # Entry: createApp().listen(BACKEND_PORT)
├── app.ts                # App factory: CORS, health check, auth plugin, all module routes
├── auth.ts               # Better Auth config (email+password, magicLink, organization, admin)
├── worker.ts             # Worker entry point (imports queues/workers.ts)
├── db/
│   ├── index.ts          # Drizzle client (postgres.js driver)
│   └── schema.ts         # Full database schema
├── migrations/           # TS migration files (up/down) managed by drizzle-migrations
├── plugins/
│   └── auth.ts           # Auth macros (auth, adminAuth) + mount /api/auth/*
├── redis/
│   └── index.ts          # ioredis client (maxRetriesPerRequest: null for BullMQ)
├── queues/
│   ├── index.ts          # Queue definitions (messageGenerationQueue, autoArchiveQueue)
│   └── workers.ts        # Worker processors (stubs)
└── modules/              # Feature modules
    ├── account/           # /account — user account management
    ├── admin/             # /admin — admin panel (adminAuth macro)
    ├── chat/              # /chat — chat conversations
    ├── centrifugo/        # /centrifugo — WebSocket token (routes.ts only, no services/repo)
    ├── family/            # /family — family features
    ├── rag/               # /rag — RAG pipeline
    ├── textbook/          # /textbook — textbook management
    └── uploads/           # /uploads — file uploads

test/
├── setup/
│   └── integration.preload.ts  # Preload: start containers, migrations, lifecycle hooks
├── testkit/
│   ├── index.ts                # Re-exports all testkit utilities
│   ├── containers.ts           # Docker container management (postgres, redis)
│   ├── appFactory.ts           # createTestApp() — dynamic import of app
│   ├── db.ts                   # getDb(), resetDb(), closeDb()
│   ├── redis.ts                # getRedis(), resetRedis(), closeRedis()
│   ├── http.ts                 # request() helper for HTTP calls
│   ├── env.ts                  # applyTestEnv() — sets process.env for tests
│   └── reset.ts                # resetAll() — truncate tables + flush redis
├── unit/
│   └── smoke.test.ts           # Unit test example
└── integration/
    └── smoke.test.ts           # Integration test example
```

## Module Convention

Each module in `src/modules/<name>/` typically has three files:

- **`routes.ts`** — Elysia plugin with prefix: `new Elysia({ prefix: "/<name>" })`
- **`services.ts`** — Business logic functions
- **`repo.ts`** — Database access layer (Drizzle queries)

Simple modules (e.g. `centrifugo`) may only have `routes.ts` if they don't need separate service/repo layers.

Register new modules in `src/app.ts` via `.use(moduleRoutes)`.

## Authentication

### Better Auth config (`src/auth.ts`)

- Email + password enabled
- Magic links (dev: logs URL, prod: throws)
- Organization plugin (multi-tenancy)
- Admin plugin (role-based access)
- Cookie prefix: `sh`, httpOnly, sameSite: lax

### Auth macros (`src/plugins/auth.ts`)

File exports two plugins:
- **`authGuardPlugin`** (name: `"auth-guard"`) — defines the two macros
- **`authPlugin`** (name: `"auth"`) — mounts `/api/auth/*` handler and includes `authGuardPlugin`

Two macros available for route protection:

```typescript
// Any authenticated user
.get("/route", ({ user, session }) => { ... }, { auth: true })

// Admin only (role === "admin")
.get("/admin", ({ user, session }) => { ... }, { adminAuth: true })
```

**Critical**: In macro resolve functions, use `status(code, body)` — NOT `error(code, body)`:

```typescript
return status(401, { error: "Unauthorized" });
return status(403, { error: "Forbidden" });
```

## Database

### Schema (`src/db/schema.ts`)

**Better Auth tables** (text PKs, snake_case columns):
- `user` — id, name, email (unique), emailVerified, image, role, banned, banReason, banExpires
- `session` — id, userId (FK), token (unique), expiresAt, ipAddress, userAgent, impersonatedBy, activeOrganizationId
- `account` — id, userId (FK), accountId, providerId, accessToken, refreshToken, password
- `verification` — id, identifier, value, expiresAt

**Organization tables**:
- `organization` — id, name, slug (unique), logo
- `member` — id, organizationId (FK), userId (FK), role
- `invitation` — id, organizationId (FK), email, role, status, inviterId (FK)

**App tables**:
- `chat` — id (uuid), userId (FK), title, archivedAt
- `message` — id (uuid), chatId (FK), role (enum: user/assistant/system), content

All FKs cascade on delete. Indexes on FK columns.

### Client (`src/db/index.ts`)

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
```

### Migrations

Uses `@drepkovsky/drizzle-migrations` for up/down migration support.

- Config: `drizzle.config.ts` (project root, outside src/, not typechecked)
- Migration files: `src/migrations/` (TypeScript with `up()` and `down()` exports)
- Generate new migration: `bun run migrations:generate -n <name>`
- Apply: `bun run migrations:up`
- Rollback: `bun run migrations:down`
- Tracking table: `drizzle_migrations` in public schema

## Queues & Workers

- **Queues** (`src/queues/index.ts`): `messageGenerationQueue`, `autoArchiveQueue`
- **Workers** (`src/queues/workers.ts`): Stub processors, log job IDs
- **Entry**: `src/worker.ts` — separate process from main app
- **Redis**: `src/redis/index.ts` — ioredis with `maxRetriesPerRequest: null`

## Realtime (Centrifugo)

- `GET /centrifugo/token` (auth required) — returns HS256 JWT
- JWT claims: `{ sub: user.id }`, expires in 5 minutes
- Signed with `CENTRIFUGO_TOKEN_SECRET` via `jose` library

## App Assembly Order (`src/app.ts`)

1. CORS (origin: `FRONTEND_URL`, credentials: true)
2. `GET /health` — `{ status: "ok", timestamp }`
3. Auth plugin (mounts `/api/auth/*` + macros)
4. All module routes

## Testing

Uses **Bun's built-in test runner** (`bun:test`). Two test levels:

### Unit tests

```bash
bun run test:unit    # bun test ./test/unit
```

No infrastructure needed. Place tests in `test/unit/`.

### Integration tests

```bash
bun run test:integration    # bun test ./test/integration --preload ./test/setup/integration.preload.ts
```

The preload file orchestrates the full lifecycle:
1. **beforeAll**: Starts ephemeral Docker containers (postgres:17-alpine, redis:7-alpine) with random ports, applies env vars, runs migrations via `drizzle-migrations up`
2. **beforeEach**: `resetAll()` — truncates all DB tables + flushes Redis
3. **afterAll**: Closes DB/Redis connections, stops containers

Skip integration tests with `RUN_INTEGRATION=0`.

### Testkit utilities (`test/testkit/`)

- `createTestApp()` — Creates an Elysia app instance (dynamic import to defer env loading)
- `request(app, { method?, path, body?, headers? })` — HTTP request helper
- `getDb()` / `resetDb()` / `closeDb()` — Database access & cleanup
- `getRedis()` / `resetRedis()` / `closeRedis()` — Redis access & cleanup
- `resetAll()` — Parallel truncate all tables + flush Redis
- `applyTestEnv({ postgresUrl, redisUrl })` — Sets test environment variables

## Environment Variables

Via `@student-helper/config`:

| Variable | Default | Required |
|---|---|---|
| `BACKEND_PORT` | `3001` | No |
| `BACKEND_URL` | `http://localhost:3001` | No |
| `FRONTEND_URL` | `http://localhost:3000` | No |
| `DATABASE_URL` | — | Yes |
| `BETTER_AUTH_SECRET` | — | Yes |
| `REDIS_URL` | `redis://localhost:6379` | No |
| `CENTRIFUGO_TOKEN_SECRET` | `centrifugo-dev-secret` | No |

## Configuration

- **TypeScript**: Extends `@student-helper/tsconfig/base.json`. Strict mode, ESNext modules, Bundler resolution.
- **ESLint**: Uses `@student-helper/eslint/base` shared flat config. Zero warnings policy.
- **Drizzle Migrations**: `drizzle.config.ts` at project root (not in src/, not typechecked). Uses `@drepkovsky/drizzle-migrations` defineConfig.
