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
```

### Per-workspace commands

```bash
bun run --filter frontend dev          # Dev server on port 3000
bun run --filter frontend build        # Build web app only
bun run --filter @student-helper/ui lint    # Lint UI package only
```

### Adding shadcn/ui components

The UI package uses shadcn/ui (new-york style) with Radix primitives. The `components.json` is in `packages/ui/`. To add a component, run the shadcn CLI from that directory.

## Architecture

**Turborepo monorepo** with these workspaces:

- **`apps/frontend`** — Next.js 16 app (React 19). The main web application. Uses App Router.
- **`apps/backend`** — Elysia server on port 3001.
- **`packages/ui`** (`@student-helper/ui`) — Shared component library built on Radix UI + Tailwind CSS 4 + Class Variance Authority. Contains:
  - `src/web/primitives/` — Low-level shadcn-style components (button, input, dialog, dropdown-menu, code)
  - `src/web/components/` — Higher-level composed components (card)
  - `src/web/hooks/` — React hooks (useMediaQuery, useLockBodyScroll)
  - `src/tokens/` — Design tokens (colors, spacing, typography, shadows, z-index)
  - `src/types/` — Shared TypeScript types for components
  - `src/utils/cn.ts` — `cn()` utility (clsx + tailwind-merge)
- **`packages/contracts`** (`@student-helper/contracts`) — Shared Zod schemas and types (streaming events, API contracts)
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
