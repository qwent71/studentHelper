# shared/ — Infrastructure

Shared utilities and infrastructure with no business logic. This is the lowest FSD layer — it cannot import from any other layer.

## Structure

- `api/` — Eden treaty API client (`eden.ts`)
- `auth/` — Better Auth clients (`auth-client.ts` for client components, `auth-server.ts` for server)
- `lib/` — Utility functions (`env.ts` for environment variables)
- `config/` — App configuration (reserved)
- `types/` — Shared TypeScript types (reserved)

## Notes

- `auth-client.ts` has `"use client"` directive — never combine with server auth in a barrel export
- UI components come from `@student-helper/ui` subpath exports — no wrapper layer here
