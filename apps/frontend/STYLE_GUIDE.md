# Frontend Style Guide

This guide defines **semantic styling rules** for all UI work. The core principle: design with **roles and contrast hierarchy**, not specific colors. Colors may change; the structural logic must hold.

## 1. Semantic Tokens (Use ONLY These)

Never use raw Tailwind color classes (`gray-*`, `blue-*`, etc.) for UI surfaces, text, or borders. Always use semantic tokens.

### Surfaces (background layers)

| Token | Role | Usage |
|---|---|---|
| `background` | Base app layer | Page background, root container |
| `card` | Elevated layer 1 | Content blocks, sections |
| `popover` | Elevated layer 2 | Menus, tooltips, selects, dialogs |
| `muted` | Subdued layer | Secondary sections, helper areas, metadata backgrounds |

### Text

| Token | Role | Usage |
|---|---|---|
| `foreground` | Primary text | Headings, body text, key data |
| `muted-foreground` | Secondary text | Descriptions, metadata, timestamps, captions |
| `*-foreground` | Text on colored surface | Text on `primary`, `destructive`, `secondary` fills |

### Actions

| Token | Role | Usage |
|---|---|---|
| `primary` | Main action | Submit, Save, Confirm, Pay |
| `secondary` | Alternative action | Back, Cancel, Later |
| `accent` | Interaction highlight | Hover on list items, active nav |
| `destructive` | Dangerous action | Delete, Remove permanently |

### Structure

| Token | Role | Usage |
|---|---|---|
| `border` | Dividers, outlines | Section separators, card edges |
| `input` | Field outlines | Input/select borders (when distinct from `border`) |
| `ring` | Focus indicator | Keyboard focus rings (accessibility) |

## 2. Surface Hierarchy

Each layer must be visibly distinct from adjacent layers. Separation comes from **surface difference + borders + spacing**, not decoration.

### Light mode (bright to subdued)

```
background (lightest) → card (slightly lifted) → muted (quieter) → popover (most contained)
```

### Dark mode (dark to lifted)

```
background (darkest) → card (one step lighter) → muted (muted tone) → popover (most lifted)
```

**Dark mode notes:**
- Shadows are less effective in dark mode — rely on surface contrast, borders, and subtle ring/glow for elevation
- Invert brightness, preserve roles: `primary` stays the main action, `muted` stays secondary

## 3. CTA Hierarchy

**One primary CTA per screen/modal.** If two filled buttons compete visually, the hierarchy is broken.

### Button roles

| Variant | Visual weight | When to use |
|---|---|---|
| `default` (primary) | Filled, max contrast | The single most important action |
| `secondary` | Softer fill | Safe alternative (Back, Later, Choose other) |
| `outline` | Border only | Non-primary actions |
| `ghost` | No fill/border | Toolbars, icon buttons, inline nav |
| `destructive` | Filled, danger tone | Irreversible actions only — never competes with primary |
| `link` | Text-only, underline | Inline navigation, "Learn more" |

### CTA placement pattern

For forms, payments, confirmations — use a bottom action bar:
- Left: summary/helper text (`muted-foreground`)
- Right: primary CTA + secondary button
- Separated from content with `border-t` or surface change

### Required micro-states

Every CTA button must handle:
- **Loading**: disable + spinner + "Processing..." text
- **Disabled**: visually muted + `disabled`/`aria-disabled`
- **Destructive confirmation**: require explicit confirm (dialog or hold-to-confirm) for irreversible actions

## 4. Borders and Radii

### When to use borders

Use borders to:
- Separate sections within the same surface
- Mark interactive elements (inputs, selects)
- Separate sticky/fixed elements (headers, footers)

Skip borders when:
- Surface difference + spacing is sufficient
- Adding borders creates a "spreadsheet" feel

### Thickness

- `1px` — almost always
- `2px` — active tab indicator, focus ring, critical emphasis (rare)

### Border radius (consistent across app)

| Level | Use |
|---|---|
| `sm` | Inputs, table controls |
| `md` | Buttons, cards |
| `lg` | Modals, popovers |

## 5. Interactive States

Apply consistently to ALL interactive elements (buttons, list items, inputs).

| State | Treatment |
|---|---|
| **Hover** | Shift surface by one step (via `accent` or lightness change). Change ONE property, not all at once |
| **Active/Pressed** | One step beyond hover — slightly deeper/higher surface or inset effect |
| **Focus-visible** | Always-visible `ring` — same logic in light and dark. Must not cause layout shift |
| **Disabled** | Reduced contrast (still readable), muted background, no pointer events |

## 6. Component Patterns

### Inputs / Forms

- Field needs: clear boundary (border OR distinct surface) + focus ring + error state
- Error: `destructive` border/ring + icon + error text below field
- Error signaling works through contrast + icon + text, not color alone

### Lists / Tables

- Row hover: `accent` surface
- Selected row: stronger surface + left/top border marker
- Table header: `muted` surface
- Table dividers: thin, subtle

### Cards

- Structure: title (`foreground`) + description (`muted-foreground`) + footer actions
- Max 2 surface levels inside a card: `card` + one `muted` section
- Don't overfill with mixed surfaces

### Dialogs / Drawers / Popovers

- Overlay dims background (both light and dark modes)
- Container: `popover` surface + explicit border (especially in dark mode)
- Focus trap required, initial focus on primary action or first field

### Alerts / Toasts / Banners

Convey meaning through: icon + title + text + left-side stripe/border + surface differentiation. Color is supplementary, not the only signal.

## 7. Typography Hierarchy

Achieve emphasis through **contrast + size + position**, not just font-weight:

| Level | Treatment |
|---|---|
| H1/H2 | High contrast `foreground`, tighter line-height |
| Body | Standard `foreground` |
| Caption/Meta | `muted-foreground`, smaller size |
| Links | Underline + hover highlight |

## 8. Tailwind Class Rules

### Always use semantic classes

```tsx
// Correct
<div className="bg-background text-foreground">
<div className="bg-card text-card-foreground border-border">
<span className="text-muted-foreground">

// Wrong — never use raw palette colors for UI
<div className="bg-gray-100 text-gray-900">
<div className="bg-slate-800 text-white">
```

### Opacity modifiers

- Allowed for hover/disabled micro-states (e.g., `bg-primary/90`)
- Never use opacity as a substitute for missing tokens or clear boundaries

### Extending tokens

If the product needs additional semantic roles, add them as CSS variables following the same pattern:
- `--success` / `--success-foreground`
- `--warning` / `--warning-foreground`
- `--info` / `--info-foreground`

Define both light and dark values. Use the same lightness-role rules as core tokens.
