# Frontend — CLAUDE.md

Next.js 16 app (React 19) with App Router, organized using **Feature-Sliced Design** (FSD).

## Commands

```bash
bun run --filter frontend dev        # Dev server (port from FRONTEND_PORT, default 3000)
bun run --filter frontend build      # Production build
bun run --filter frontend lint       # ESLint with FSD boundary checks (--max-warnings 0)
bun run --filter frontend typecheck  # next typegen && tsc --noEmit
```

## Project Structure

```
apps/frontend/
├── app/                    # Next.js App Router (routing layer, thin — delegates to src/)
│   ├── layout.tsx          # Root layout (fonts, Providers)
│   ├── page.tsx            # Home page → uses Header widget
│   ├── globals.css         # Tailwind + theme CSS variables
│   ├── fonts/              # Local font files
│   ├── auth/               # Auth route pages (import from features)
│   └── app/                # Protected app pages
├── middleware.ts            # Route protection (imports from shared)
├── src/                    # FSD layers
│   ├── app/                # Composition root
│   │   └── providers/      # ThemeProvider, future providers
│   ├── widgets/            # Autonomous UI blocks
│   │   └── header/         # App header with theme toggle
│   ├── features/           # User interactions
│   │   ├── toggle-theme/   # Theme switcher
│   │   └── auth/           # Login & signup forms
│   ├── entities/           # Business domain
│   │   └── user/           # User type + UserBadge
│   └── shared/             # Infrastructure (no business logic)
│       ├── api/            # Eden treaty client
│       ├── auth/           # Better Auth clients (client & server separate)
│       └── lib/            # Env utilities
```

## FSD Import Rules

**Layer hierarchy** (enforced by `eslint-plugin-boundaries`):
```
app → widgets → features → entities → shared
```

Note: `pages/` layer is omitted because `src/pages/` conflicts with Next.js Pages Router detection.

Each layer can only import from layers **below** it.

- `@/*` maps to `./src/*` in tsconfig
- `app/` (Next.js router) and `middleware.ts` are **outside** FSD — can import any layer
- Import slices via their `index.ts` barrel, never from internal `ui/`/`model/` segments
- `auth-client.ts` is `"use client"`, `auth-server.ts` is server-only — import each directly, never barrel them together

## Key Patterns

### Imports from UI package

Always use subpath exports (no wrapper layer in shared):

```typescript
import { Button } from "@student-helper/ui/web/primitives/button";
import { cn } from "@student-helper/ui/utils/cn";
```

### Client vs Server Components

- Default is Server Components (no directive needed)
- Add `"use client"` only when using hooks, browser APIs, or interactivity

### Styling

- Tailwind CSS 4 (CSS-first config, no `tailwind.config.ts`)
- Theme colors via CSS variables (HSL) in `@student-helper/ui/globals.css`
- `dark:` variant or semantic tokens (`text-foreground`, `bg-background`)
- Component variants via CVA, class merging via `cn()`

### Adding a New Slice

1. Create `src/<layer>/<slice-name>/` with `ui/`, `model/`, `lib/`, `api/` segments as needed
2. Create `index.ts` barrel export
3. Import from other files via the barrel only

## Configuration

- **TypeScript**: `@/*` → `./src/*`. Extends `@student-helper/tsconfig/nextjs.json`.
- **ESLint**: `@student-helper/eslint/next-js` + `eslint-plugin-boundaries` for FSD rules.
- **next.config.js**: transpilePackages for monorepo packages.

## Environment Variables

Defined in `src/shared/lib/env.ts`:

| Variable | Default | Usage |
|---|---|---|
| `FRONTEND_PORT` | `3000` | Dev server port |
| `BACKEND_URL` | `http://localhost:3001` | API base URL |
| `FRONTEND_URL` | `http://localhost:3000` | Self URL |
