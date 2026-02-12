# app/ — Application Layer

Composition root for the FSD architecture. Contains providers and global setup that wire together all layers.

- `providers/` — React context providers (ThemeProvider, etc.)

This is **not** the Next.js `app/` directory (which lives at the project root). This is the FSD app layer for cross-cutting composition logic.
