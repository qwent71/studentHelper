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
