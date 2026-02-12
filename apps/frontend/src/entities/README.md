# entities/ — Business Domain

Entities represent core business objects with their types, UI representations, and data access.

## Current Entities

- `user/` — User type definition and UserBadge component

## Conventions

- Each entity has `model/` (types, stores), `ui/` (presentational components), and optionally `api/`, `lib/`
- Export via `index.ts` barrel
- Can import from: `shared/`
- Entities must NOT import from other entities (use features to compose them)
