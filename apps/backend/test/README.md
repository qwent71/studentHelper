# Backend Tests

## Quick Start

From the monorepo root:

```bash
bun run tests              # Run all backend tests (unit + integration)
```

From `apps/backend/`:

```bash
bun run tests              # Run all tests
bun run test:unit          # Run unit tests only (no Docker required)
bun run test:integration   # Run integration tests only (Docker required)
```

## Requirements

- **Docker** is required for integration tests (containers are managed via `docker run`)
- Unit tests run without Docker

## Environment Variables

| Variable | Description |
|---|---|
| `RUN_INTEGRATION=0` | Skip integration tests (useful without Docker) |

## Architecture

```
test/
├── unit/                         # Unit tests (no Docker, no external deps)
│   └── smoke.test.ts
├── integration/                  # Integration tests (Docker containers)
│   └── smoke.test.ts
├── setup/
│   └── integration.preload.ts    # Starts containers, runs migrations, resets state
└── testkit/                      # Shared test utilities
    ├── index.ts                  # Re-exports everything
    ├── containers.ts             # Docker container lifecycle (Postgres + Redis)
    ├── env.ts                    # Test environment variables
    ├── db.ts                     # Test DB client + resetDb()
    ├── redis.ts                  # Test Redis client + resetRedis()
    ├── appFactory.ts             # createTestApp() — Elysia app for tests
    ├── http.ts                   # request() helper via app.handle()
    └── reset.ts                  # resetAll() — combined DB + Redis reset
```

### Preload

Integration tests use `--preload ./test/setup/integration.preload.ts` which:

1. Starts Postgres and Redis containers via Docker (once per test run)
2. Sets `DATABASE_URL`, `REDIS_URL`, and other env vars
3. Runs Drizzle migrations against the test database
4. Resets DB and Redis before each test (`TRUNCATE CASCADE` + `FLUSHALL`)
5. Closes connections and stops containers after all tests complete

### Testkit

Import everything from `testkit`:

```ts
import { createTestApp, request, getDb, resetDb } from "../testkit";
```

### Adding New Tests

**Unit test** — add files to `test/unit/`:

```ts
import { describe, it, expect } from "bun:test";

describe("my feature", () => {
  it("should work", () => {
    expect(true).toBe(true);
  });
});
```

**Integration test** — add files to `test/integration/`:

```ts
import { describe, it, expect } from "bun:test";
import { createTestApp, request } from "../testkit";

describe("my feature", () => {
  it("should respond", async () => {
    const app = await createTestApp();
    const res = await request(app, { path: "/my-endpoint" });
    expect(res.status).toBe(200);
  });
});
```

### Note on Docker vs Testcontainers

We use direct `docker run` commands instead of the `testcontainers` library because of a
[known incompatibility](https://github.com/testcontainers/testcontainers-node/issues/974)
between Bun's HTTP stream handling and testcontainers' port-wait strategy.
