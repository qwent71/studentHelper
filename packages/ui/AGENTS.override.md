# UI Package — CLAUDE.md

Shared component library (`@student-helper/ui`) built on shadcn/ui (new-york style), Radix UI, Tailwind CSS 4, and CVA.

## Commands

```bash
bun run --filter @student-helper/ui lint       # ESLint (--max-warnings 0)
bun run --filter @student-helper/ui typecheck  # tsc --noEmit
```

## Project Structure

```
src/
├── web/
│   ├── styles/globals.css        # Tailwind imports + theme CSS variables (light/dark)
│   ├── primitives/               # Low-level shadcn components (button, input, dialog, dropdown-menu, code)
│   ├── components/               # Higher-level composed components (card)
│   └── hooks/                    # React hooks (use-media-query, use-lock-body-scroll)
├── tokens/                       # Design tokens (colors, spacing, typography, shadows, z-index)
├── types/                        # Shared TS types (Size, Variant, BaseComponentProps)
└── utils/
    └── cn.ts                     # cn() = clsx + tailwind-merge
```

## Adding shadcn/ui Components

The `components.json` configures the shadcn CLI with aliases pointing to this package's directories.

### Running the CLI

Run `npx shadcn@latest add <component>` **from `packages/ui/`**:

```bash
cd packages/ui
npx shadcn@latest add sheet
npx shadcn@latest add tabs
npx shadcn@latest add tooltip
```

The CLI will:
1. Place the component in `src/web/primitives/<component>.tsx` (mapped via `aliases.ui`)
2. Use `@student-helper/ui/utils/cn` for class merging (mapped via `aliases.utils`)
3. Use `@student-helper/ui/web/hooks` for hooks (mapped via `aliases.hooks`)
4. Install any missing Radix dependencies automatically

### After adding a component

1. **Export from barrel** — add to `src/web/primitives/index.ts`:
   ```typescript
   export * from "./sheet";
   ```

2. **Add subpath export** in `package.json` if using a new directory pattern (primitives are already covered by `"./web/primitives/*": "./src/web/primitives/*.tsx"`).

3. **Install new Radix deps** if the CLI didn't — check the component imports and run `bun install` from the repo root.

### shadcn configuration (`components.json`)

```json
{
  "style": "new-york",
  "rsc": true,
  "tailwind": {
    "css": "src/web/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@student-helper/ui/web/primitives",
    "ui": "@student-helper/ui/web/primitives",
    "utils": "@student-helper/ui/utils/cn",
    "lib": "@student-helper/ui/lib",
    "hooks": "@student-helper/ui/web/hooks"
  },
  "iconLibrary": "lucide"
}
```

## Import Convention

Consumers use subpath exports — never deep `src/` paths:

```typescript
import { Button } from "@student-helper/ui/web/primitives/button";
import { Card } from "@student-helper/ui/web/components/card";
import { cn } from "@student-helper/ui/utils/cn";
import { useMediaQuery } from "@student-helper/ui/web/hooks/use-media-query";
import { colors } from "@student-helper/ui/tokens/colors";
```

Subpath exports in `package.json`:

| Import path | Maps to |
|---|---|
| `@student-helper/ui/globals.css` | `src/web/styles/globals.css` |
| `@student-helper/ui/web/primitives/*` | `src/web/primitives/*.tsx` |
| `@student-helper/ui/web/components/*` | `src/web/components/*.tsx` |
| `@student-helper/ui/web/hooks/*` | `src/web/hooks/*.ts` |
| `@student-helper/ui/utils/*` | `src/utils/*.ts` |
| `@student-helper/ui/tokens` | `src/tokens/index.ts` |
| `@student-helper/ui/tokens/*` | `src/tokens/*.ts` |
| `@student-helper/ui/types` | `src/types/index.ts` |
| `@student-helper/ui/lib/*` | `src/utils/*.ts` (alias) |

## Component Patterns

### Primitives (shadcn-style)

- Wrap Radix UI primitives with styling
- Use `data-slot` attributes on each sub-component
- Use `cn()` for class merging
- Use CVA (`cva`) for variant props (see `button.tsx`)
- Support `asChild` via `@radix-ui/react-slot` where applicable
- Export all sub-components (e.g. `Dialog`, `DialogTrigger`, `DialogContent`, ...)

### Variant example (Button)

```typescript
const buttonVariants = cva("base-classes...", {
  variants: {
    variant: { default, destructive, outline, secondary, ghost, link },
    size: { default, xs, sm, lg, icon, "icon-xs", "icon-sm", "icon-lg" },
  },
  defaultVariants: { variant: "default", size: "default" },
});
```

### Composed components

Higher-level components in `src/web/components/` compose primitives and are exported separately.

## Styling & Theming

- **Tailwind CSS 4** — CSS-first config, no `tailwind.config.ts`
- **Theme** defined in `globals.css` via CSS variables (HSL values)
- **Dark mode** — `.dark` class on root, all tokens have dark variants
- **Base color** — neutral
- **Animations** — via `tw-animate-css`
- **Custom variant**: `@custom-variant dark (&:is(.dark *))`

### Key CSS variables

`--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--card`, `--popover`, `--radius`, `--chart-1..5`

## Dependencies

- `radix-ui` — headless primitives
- `@radix-ui/react-slot` — polymorphic `asChild`
- `class-variance-authority` — type-safe variants
- `clsx` + `tailwind-merge` — class merging (`cn()`)
- `lucide-react` — icons
- `tw-animate-css` — animation utilities
