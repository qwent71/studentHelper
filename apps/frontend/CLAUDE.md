# Frontend — CLAUDE.md

Next.js 16 app (React 19) with App Router. The main web application for Student Helper.

## Commands

```bash
bun run --filter frontend dev        # Dev server (port from FRONTEND_PORT, default 3000)
bun run --filter frontend build      # Production build
bun run --filter frontend lint       # ESLint (--max-warnings 0)
bun run --filter frontend typecheck  # next typegen && tsc --noEmit
```

## Project Structure

```
app/
├── layout.tsx              # Root layout (metadata, fonts, Providers wrapper)
├── page.tsx                # Home page
├── providers.tsx           # Client providers (ThemeProvider from next-themes)
├── globals.css             # Imports @student-helper/ui/globals.css + Tailwind source
├── components/
│   └── theme-toggle.tsx    # Dark/light/system theme switcher
└── fonts/
    ├── GeistVF.woff        # Primary body font
    └── GeistMonoVF.woff    # Monospace font
```

## Key Patterns

### Imports from UI package

Always use subpath exports:

```typescript
import { Button } from "@student-helper/ui/web/primitives/button";
import { cn } from "@student-helper/ui/utils/cn";
import { useMediaQuery } from "@student-helper/ui/web/hooks/use-media-query";
```

### Client vs Server Components

- Default is Server Components (no directive needed)
- Add `"use client"` only when using hooks, browser APIs, or interactivity
- `providers.tsx` and `components/theme-toggle.tsx` are client components

### Dark Mode

- Managed by `next-themes` with `attribute="class"` and `defaultTheme="system"`
- Root `<html>` has `suppressHydrationWarning` for next-themes compatibility
- All theme colors are CSS variables (HSL) defined in `@student-helper/ui/globals.css`
- Use Tailwind's `dark:` variant or semantic color tokens (`text-foreground`, `bg-background`, etc.)

### Styling

- Tailwind CSS 4 (CSS-first config, no `tailwind.config.ts`)
- PostCSS config delegates to `@tailwindcss/postcss`
- `globals.css` sets `@source` for the UI package to scan its classes
- Component variants use CVA (Class Variance Authority)
- Class merging via `cn()` utility (clsx + tailwind-merge)

### Fonts

Loaded via `next/font/local` in `layout.tsx`, exposed as CSS variables:
- `--font-geist-sans` — body text
- `--font-geist-mono` — code/monospace

## Configuration

- **TypeScript**: Extends `@student-helper/tsconfig/nextjs.json`. Strict mode, ESNext modules, Bundler resolution.
- **ESLint**: Uses `@student-helper/eslint/next-js` shared flat config. Zero warnings policy.
- **next.config.js**: Default (empty) config.

## Environment Variables

Accessed via `@student-helper/config`:

| Variable | Default | Usage |
|---|---|---|
| `FRONTEND_PORT` | `3000` | Dev server port |
| `BACKEND_URL` | `http://localhost:3001` | API base URL |
| `FRONTEND_URL` | `http://localhost:3000` | Self URL |

## Current State

Minimal landing page with theme toggle. No auth integration, API client, or feature pages yet. No `middleware.ts` for route protection.
