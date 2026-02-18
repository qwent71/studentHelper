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

## 9. Mobile Responsiveness

All UI must be comfortable to use on touch screens. Use responsive breakpoints (`md:` for desktop overrides) to ensure mobile-first sizing. The principle: **design for fingers first, then refine for mouse**.

### Touch target sizes

Based on Apple HIG (44pt), Material Design (48dp), and WCAG 2.5.5 (44px):

| Element | Minimum height | Recommended | Tailwind |
|---|---|---|---|
| Primary button | 44px | 48px | `h-11` / `h-12` |
| Secondary button | 40px | 44px | `h-10` / `h-11` |
| Icon button | 44×44px | 48×48px | `size-11` / `size-12` |
| List/nav item | 44px | 48px | `min-h-11` / `min-h-12` |
| Form input, select | 44px | 48px | `h-11` / `h-12` |
| Checkbox/radio row | 44px | 48px | `min-h-11 py-3` |
| Tab bar item | 44px | 48px | `min-h-11` / `min-h-12` |

### Font sizes

| Element | Mobile | Desktop | Tailwind pattern |
|---|---|---|---|
| Body / primary text | 16px | 14px | `text-base md:text-sm` |
| Secondary text | 14px | 12px | `text-sm md:text-xs` |
| Form input text | 16px (mandatory) | 14px | `text-base md:text-sm` |
| Button text | 16px | 14px | `text-base md:text-sm` |
| Page heading (H1) | 24px | 24–28px | `text-2xl` |
| Section heading (H2) | 20px | 18–20px | `text-xl md:text-lg` |
| Panel/card heading | 18px | 16px | `text-lg md:text-base` |

> **iOS zoom prevention**: `<input>`, `<select>`, and `<textarea>` elements **must** use `text-base` (16px) or larger on mobile. Font size below 16px triggers automatic zoom on iOS Safari.

### Spacing and padding

| Context | Mobile | Desktop | Tailwind pattern |
|---|---|---|---|
| Button padding | `py-3 px-5` | `py-2 px-4` | `py-3 px-5 md:py-2 md:px-4` |
| List item padding | `py-3.5 px-4` | `py-2.5 px-3` | `py-3.5 px-4 md:py-2.5 md:px-3` |
| Card / section padding | `p-5` | `p-4` | `p-5 md:p-4` |
| Form field spacing | `space-y-5` | `space-y-4` | `space-y-5 md:space-y-4` |
| Section spacing | `space-y-6` | `space-y-4` | `space-y-6 md:space-y-4` |
| Page horizontal margin | `px-4` | `px-4`–`px-6` | `px-4` |

### Gaps between interactive elements

Insufficient spacing between adjacent tappable elements causes accidental taps.

| Context | Minimum gap | Recommended | Tailwind |
|---|---|---|---|
| Adjacent buttons | 8px | 12px | `gap-3` |
| Inline icon buttons | 8px | 12px | `gap-3` |
| Stacked list items | 4px | 6px | `space-y-1.5` |
| Form checkboxes/radios | 12px | 16px | `space-y-3` / `space-y-4` |
| Nav/tab items | 4px | 8px | `gap-2` |

**WCAG spacing rule**: if a target is smaller than 44px, no adjacent target's 44px bounding circle may overlap. Practical formula: `required_gap = max(0, 44px − target_height)`.

### Icons

| Context | Mobile | Desktop | Tailwind pattern |
|---|---|---|---|
| In buttons / nav items | 20px | 16px | `size-5 md:size-4` |
| Standalone icon button | 24px | 20px | `size-6 md:size-5` |
| Decorative / inline | 16px | 16px | `size-4` |

### Responsive pattern

Use **mobile-first** values with `md:` overrides for desktop:

```tsx
// Correct — mobile-first
<button className="h-12 px-5 text-base md:h-9 md:px-4 md:text-sm">Save</button>
<input className="h-12 text-base md:h-9 md:text-sm" />
<div className="space-y-5 md:space-y-4">...</div>
<Icon className="size-5 md:size-4" />

// Wrong — desktop sizes on mobile
<button className="h-9 px-4 text-sm">Save</button>
```

For components that only render on mobile (e.g. mobile drawers, bottom sheets), skip the `md:` override — just use the larger mobile sizes directly.

### Checklist for mobile-ready components

When building or reviewing any interactive component, verify:

1. All tap targets are at least **44px** tall/wide
2. Text inputs use `text-base` (16px) to prevent iOS zoom
3. Icons in interactive elements are at least `size-5` (20px)
4. Adjacent interactive elements have at least **8px** gap
5. Body/label text is at least `text-sm` (14px), primary text `text-base` (16px)
6. Padding is generous enough for comfortable finger tapping (`py-3`+ for list items, `p-4`+ for cards)
