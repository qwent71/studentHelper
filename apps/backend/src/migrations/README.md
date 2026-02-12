# Migrations

This project uses [`@drepkovsky/drizzle-migrations`](https://github.com/drepkovsky/drizzle-migrations) for database migrations with up/down (rollback) support. Drizzle-kit is still available for SQL diff generation and Drizzle Studio.

## Commands

Run from `apps/backend/`:

```bash
bun run migrations:generate -n <name>   # Generate a new migration by diffing the schema
bun run migrations:up                    # Apply all pending migrations
bun run migrations:down                  # Rollback last batch
bun run migrations:status                # Show migration status
bun run migrations:fresh                 # Rollback ALL migrations
bun run migrations:refresh               # Rollback ALL then re-apply
```

## How it works

1. **Schema-first**: Define tables in `src/db/schema.ts` using Drizzle ORM.
2. **Generate**: Run `bun run migrations:generate -n <name>` to diff the schema and produce a TS migration file in `src/migrations/`.
3. **Apply**: Run `bun run migrations:up` to apply pending migrations.
4. **Rollback**: Run `bun run migrations:down` to revert the last batch.

Each migration file exports `up()` and `down()` functions that receive a `{ db }` argument (a Drizzle ORM client).

## Configuration

The config lives in `drizzle.config.ts` (auto-discovered by the CLI). It extends drizzle-kit's config with a `getMigrator` function that provides the DB client.

Migration state is tracked in the `drizzle_migrations` table (separate from drizzle-kit's `__drizzle_migrations`).

## Legacy commands

The old drizzle-kit commands (`db:generate`, `db:migrate`, `db:studio`) are still available but `db:migrate` is superseded by `migrations:up`. Use `db:studio` for Drizzle Studio.

## Note

This package is a community project and is still WIP. It is primarily tested on PostgreSQL (which is what this project uses).
