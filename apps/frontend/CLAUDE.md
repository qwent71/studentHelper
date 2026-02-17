# Frontend — CLAUDE.md

Next.js 16 app (React 19) with App Router, organized using **Feature-Sliced Design** (FSD).

## Commands

```bash
bun run --filter frontend dev        # Dev server (port from FRONTEND_PORT, default 3000)
bun run --filter frontend build      # Production build
bun run --filter frontend lint       # ESLint with FSD boundary checks (--max-warnings 0)
bun run --filter frontend typecheck  # next typegen && tsc --noEmit
bun run --filter frontend test       # Run unit tests (Vitest)
bun run --filter frontend test:watch # Run tests in watch mode
```

## Project Structure

```
apps/frontend/
├── app/                    # Next.js App Router (routing layer, thin — delegates to src/)
│   ├── layout.tsx          # Root layout (Geist fonts, Providers)
│   ├── page.tsx            # Home page → uses Header widget
│   ├── globals.css         # Imports @student-helper/ui/globals.css + @source directive
│   ├── fonts/              # Geist Sans + Geist Mono variable fonts
│   ├── auth/               # Auth route pages
│   │   ├── layout.tsx      # Auth pages layout (centered container)
│   │   ├── page.tsx        # Redirects to /auth/login
│   │   ├── login/          # Login page with LoginForm feature
│   │   ├── signup/         # Signup page with SignupForm feature
│   │   └── magic-link-sent/ # Magic link confirmation page
│   └── app/                # Protected app pages
│       └── page.tsx        # Dashboard (placeholder)
├── middleware.ts            # Route protection (async session validation via backend)
├── src/                    # FSD layers
│   ├── app/                # Composition root
│   │   └── providers/      # ThemeProvider (next-themes, "use client")
│   ├── widgets/            # Autonomous UI blocks
│   │   └── header/         # App header with theme toggle
│   ├── features/           # User interactions
│   │   ├── toggle-theme/   # Theme switcher (Light/Dark/System dropdown)
│   │   └── auth/           # Auth features
│   │       ├── login/      # Login form (password + magic link tabs)
│   │       ├── signup/     # Signup form (name + email + password)
│   │       └── magic-link-sent/ # Magic link confirmation with resend timer
│   ├── entities/           # Business domain
│   │   └── user/           # User type + UserBadge
│   └── shared/             # Infrastructure (no business logic)
│       ├── api/            # Eden treaty client
│       ├── auth/           # Better Auth clients (client & server separate)
│       └── lib/            # Env utilities
├── src/test/
│   └── setup.ts            # Vitest setup (jsdom, cleanup, next/image mock)
└── vitest.config.ts        # Vitest config (jsdom, @/ alias, src/**/*.test.{ts,tsx})
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
- **Follow [`STYLE_GUIDE.md`](./STYLE_GUIDE.md)** — semantic tokens, surface hierarchy, CTA rules, interactive states, and Tailwind class conventions. Never use raw palette colors (`gray-*`, `slate-*`) for UI surfaces/text/borders; always use semantic tokens (`bg-background`, `text-foreground`, `border-border`, etc.).

### Adding a New Slice

1. Create `src/<layer>/<slice-name>/` with `ui/`, `model/`, `lib/`, `api/` segments as needed
2. Create `index.ts` barrel export
3. Import from other files via the barrel only

## Testing

Uses **Vitest** with jsdom environment.

- Tests collocated with source: `src/**/*.test.{ts,tsx}`
- Setup file: `src/test/setup.ts` (provides jsdom, @testing-library cleanup, next/image mock)
- Alias: `@` → `./src` (matches tsconfig paths)
- Libraries: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`

## Middleware

`middleware.ts` handles route protection:
- Protected routes: `/app/*`, `/admin/*` — redirects to `/auth/login?callbackUrl=...` if unauthenticated
- Auth routes: `/auth/*` — redirects to `/app` if already authenticated
- Session validation via fetch to backend `GET /api/auth/get-session`

## Visual Check via Playwright (REQUIRED)

**After every frontend change**, once typecheck/lint/test pass, ALWAYS verify the affected page visually using MCP Playwright:

1. `browser_navigate` to the relevant page (e.g. `http://localhost:3000/app`)
2. `browser_snapshot` to inspect the accessibility tree and verify layout
3. `browser_take_screenshot` if needed — **never save screenshots to the repo**, use `/tmp/` or omit filename (defaults to gitignored `.playwright-mcp/`)
4. If the change affects mobile, `browser_resize` to 375×812 and re-check
5. Delete any screenshot files you created

This catches layout regressions and rendering issues that typecheck/lint cannot detect. **Do not skip this step.**

## Configuration

- **TypeScript**: `@/*` → `./src/*`. Extends `@student-helper/tsconfig/nextjs.json`.
- **ESLint**: `@student-helper/eslint/next-js` + `eslint-plugin-boundaries` for FSD rules.
- **next.config.js**: `output: "standalone"`, transpilePackages for monorepo packages (`@student-helper/ui`, `@student-helper/contracts`, `@student-helper/config`).
- **PostCSS**: Re-exports from `@student-helper/ui/postcss.config` (uses `@tailwindcss/postcss`).

## Environment Variables

Defined in `src/shared/lib/env.ts`:

| Variable | Default | Usage |
|---|---|---|
| `FRONTEND_PORT` | `3000` | Dev server port |
| `BACKEND_URL` | `http://localhost:3001` | API base URL |
| `FRONTEND_URL` | `http://localhost:3000` | Self URL |
