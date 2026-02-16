# widgets/ — Autonomous UI Blocks

Large, self-contained UI blocks that compose features and entities. Widgets handle their own layout and can be dropped into pages.

## Current Widgets

- `header/` — App header with logo and theme toggle
- `app-sidebar/` — Sidebar-08 based protected app layout

## Conventions

- Each widget has `ui/`, and optionally `model/`, `lib/` segments
- Export via `index.ts` barrel
- Can import from: `features/`, `entities/`, `shared/`
