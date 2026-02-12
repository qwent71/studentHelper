# Frontend

Next.js 16 app using [Feature-Sliced Design](https://feature-sliced.design/) (FSD) architecture.

## FSD Layer Hierarchy

```
src/
├── app/        ← Composition root (providers, global setup)
├── widgets/    ← Large autonomous UI blocks (e.g. Header)
├── features/   ← User interactions (e.g. auth forms, theme toggle)
├── entities/   ← Business entities (e.g. User)
└── shared/     ← Infrastructure, no business logic (api, auth, lib, config)
```

Note: `pages/` layer is omitted because `src/pages/` conflicts with Next.js Pages Router detection.

Each layer can only import from layers **below** it. This is enforced by `eslint-plugin-boundaries`.

## Adding a New Slice

1. Create `src/<layer>/<slice-name>/` directory
2. Add internal segments: `ui/`, `model/`, `lib/`, `api/` as needed
3. Create `index.ts` barrel export — this is the slice's public API
4. Only import from the barrel, never from internal segments

## Import Rules

- `@/*` maps to `./src/*` (tsconfig paths)
- Use `@/shared/auth/auth-client` (not barrel) because client/server must stay separate
- Use `@student-helper/ui/...` subpath exports for UI components (no wrapper layer)
- `app/` (Next.js router) and `middleware.ts` are outside FSD — they can import from any `src/` layer

## Commands

```bash
bun run --filter frontend dev        # Dev server
bun run --filter frontend build      # Production build
bun run --filter frontend lint       # ESLint with FSD boundary checks
bun run --filter frontend typecheck  # Type checking
```
