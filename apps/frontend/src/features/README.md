# features/ — User Interactions

Features represent user-facing interactions and use cases. Each feature is a self-contained slice with its own UI, model, and API segments.

## Current Features

- `toggle-theme/` — Dark/light/system theme switcher
- `auth/login/` — Login form with email+password
- `auth/signup/` — Registration form

## Conventions

- Group related features in subdirectories (e.g. `auth/login/`, `auth/signup/`)
- Each slice has `ui/`, and optionally `model/`, `lib/`, `api/` segments
- Export via `index.ts` barrel
- Can import from: `entities/`, `shared/`
