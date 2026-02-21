# Student Helper

Monorepo for the Student Helper application, powered by Turborepo.

## What's inside?

### Apps and Packages

- `apps/frontend` — [Next.js](https://nextjs.org/) web application
- `apps/backend` — [Elysia](https://elysiajs.com/) API server
- `@student-helper/ui` — Shared React component library (Radix UI + Tailwind CSS 4)
- `@student-helper/contracts` — Shared Zod schemas and types
- `@student-helper/config` — Shared configuration (env schema, defaults)
- `@student-helper/eslint` — Shared ESLint flat configs
- `@student-helper/tsconfig` — Shared `tsconfig.json` bases

### Development

```bash
bun install       # Install dependencies
bun run dev       # Start all apps in dev mode
bun run build     # Build all workspaces
bun run lint      # Lint all workspaces
bun run typecheck # Type-check all workspaces
```

### Docker

```bash
docker compose -f docker/docker-compose.yml up -d --build
docker compose -f docker/docker-compose.yml down
```

### Worktree Development

Work on multiple features in parallel without port conflicts or database migration issues using git worktrees with isolated environments.

#### Quick Start

```bash
# Create a new worktree
git worktree add ../studentHelper-feature-auth feature/auth

# Navigate to the worktree
cd ../studentHelper-feature-auth

# Start isolated Docker services (auto-allocates ports, creates .env file)
bun worktree:start

# Run migrations (uses worktree-specific database)
bun worktree:migrate

# Start development servers
bun run dev

# When done, stop services
bun worktree:stop
```

#### Parallel Development Example

```bash
# Terminal 1: Feature A
git worktree add ../studentHelper-feature-payments feature/payments
cd ../studentHelper-feature-payments
bun worktree:start
# Allocated ports: PostgreSQL 15432, Redis 16379, Backend 13001, Frontend 13000
bun worktree:migrate
bun run dev

# Terminal 2: Feature B (runs simultaneously without conflicts)
git worktree add ../studentHelper-feature-notifications feature/notifications
cd ../studentHelper-feature-notifications
bun worktree:start
# Allocated ports: PostgreSQL 15433, Redis 16380, Backend 13002, Frontend 13001
bun worktree:migrate
bun run dev
```

Each worktree gets:
- Unique ports (stored in `.worktree-ports.json`)
- Isolated database volume (`postgres_data_{worktree_id}`)
- Isolated Redis volume (`redis_data_{worktree_id}`)
- Worktree-specific environment file (`.env.{worktree_id}`)

#### How It Works

1. **Auto Port Discovery**: `bun worktree:start` scans for free ports starting from defaults (PostgreSQL: 5432, Redis: 6379, etc.)
2. **Port Persistence**: Allocated ports are saved in `.worktree-ports.json` and reused on restart
3. **Volume Isolation**: Each worktree gets separate Docker volumes, so database migrations in Feature A won't affect Feature B
4. **Environment Generation**: Creates `.env.{worktree_id}` with correct `DATABASE_URL`, `REDIS_URL`, `BACKEND_URL`, etc.

#### Troubleshooting

**"Port already in use" error**
```bash
# Check which process is using the port
lsof -i :5432

# Option 1: Kill the process
kill -9 <PID>

# Option 2: Delete stale port assignment and let script reallocate
# Edit .worktree-ports.json and remove the entry for your worktree
```

**"No free ports found" error**
- Too many worktrees running - stop unused ones with `bun worktree:stop`
- Check `.worktree-ports.json` for stale entries and remove them

**Docker volumes persist after worktree deletion**
```bash
# List worktree volumes
docker volume ls | grep postgres_data_

# Remove specific volume
docker volume rm postgres_data_feature_auth

# Remove all stale volumes (be careful!)
docker volume prune
```

**Migrations applied to wrong database**
```bash
# Verify correct env file is being used
echo $DATABASE_URL

# Check if .env.{worktree_id} exists
ls -la .env.*

# Manually specify env file
bun --env-file .env.feature_auth run --filter=@student-helper/backend migrations:up
```

**Port conflicts after restart**
```bash
# If ports changed but .worktree-ports.json is stale
bun worktree:stop
# Edit .worktree-ports.json and remove your worktree's entry
bun worktree:start  # Will allocate new ports
```

### Product Docs

- [Lerio Business Specification v1.1](docs/lerio-business-spec-v1.1.md)
