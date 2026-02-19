# Frontend Style Guide

This guide defines **semantic styling rules** for all UI work. The core principle: design with **roles and contrast hierarchy**, not specific colors. Colors may change; the structural logic must hold.

## 1. Semantic Tokens (Use ONLY These)

Never use raw Tailwind color classes (`gray-*`, `blue-*`, etc.) for UI surfaces, text, or borders. Always use semantic tokens.

### Surfaces (background layers)

| Token | Role | Usage |
|---|---|---|
| `background` | Base app layer | Page background, root container |
| `card` | Elevated layer 1 | Content blocks, sections |
| `popover` | Elevated layer 2 | Menus, tooltips, selects, dialogs, sheets |
| `muted` | Subdued layer | Secondary sections, helper areas, metadata backgrounds |
| `overlay` | Backdrop dimming | Dialog/drawer/sheet overlay (`bg-overlay/50`). Never use raw `bg-black/…` |

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

### OAuth / social login buttons

OAuth buttons (Google, Apple, etc.) must **never** compete visually with the primary CTA:
- Always use `secondary` or `outline` variant
- Never use `default` (filled primary) variant for OAuth
- On auth screens the primary CTA is "Log in" / "Sign up" — OAuth is an alternative path, not the main one

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

| Level | CSS variable | Computed value | Tailwind | Use |
|---|---|---|---|---|
| `sm` | `--radius-sm` | 4px (`0.5rem − 4px`) | `rounded-sm` | Inputs, table controls, small tags |
| `md` | `--radius-md` | 6px (`0.5rem − 2px`) | `rounded-md` | Buttons, cards, menu items |
| `lg` | `--radius-lg` | 8px (`0.5rem`) | `rounded-lg` | Modals, popovers, dialogs |
| `xl` | `--radius-xl` | 12px (`0.5rem + 4px`) | `rounded-xl` | Content panels (e.g. SidebarInset) |

> Base `--radius` = `0.5rem` (8px). All other radii are derived from it.

> **Border shorthand**: Always write `border border-border` — `border` adds 1px solid, `border-border` sets the semantic color. Without `border-border`, Tailwind uses its default gray.

## 5. Interactive States

Apply consistently to ALL interactive elements (buttons, list items, inputs).

| State | Treatment |
|---|---|
| **Hover** | Shift surface by one step (via `accent` or lightness change). Change ONE property, not all at once |
| **Active/Pressed** | One step beyond hover — slightly deeper/higher surface or inset effect |
| **Focus-visible** | Always-visible `ring` — same logic in light and dark. Must not cause layout shift |
| **Disabled** | Reduced contrast (still readable), muted background, no pointer events |

### Focus ring standard

All interactive elements use: `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]`

> On colored surfaces, add `ring-offset-2 ring-offset-background` to ensure the focus ring has a visible gap from the element.

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

### Empty States

Every list, table, or content area must handle the "no data" case with a structured empty state:

1. **Icon** — `muted-foreground`, relevant to context (e.g. `MessageSquare` for empty chat list)
2. **Title** — `foreground`, concise (e.g. "No chats yet")
3. **Description** — `muted-foreground`, one sentence explaining what to do
4. **CTA** — `primary` button to create/start (e.g. "Start a new chat") + optional `link` for help

Layout: centered vertically and horizontally in the content area, `max-w-sm`, `text-center`.

> **"Coming soon" is not a production empty state.** Placeholder text like "Coming soon" or em-dashes are acceptable only in dev/staging. Production UI must always have a meaningful empty state with an action.

#### Empty state examples

**Dashboard card (with CTA):**

```tsx
<div className="bg-card text-card-foreground rounded-lg border border-border p-5 md:p-4">
  <div className="flex flex-col items-center justify-center text-center py-6 md:py-4">
    <MessageSquare className="size-10 md:size-8 text-muted-foreground mb-3" />
    <h3 className="text-sm font-medium">Недавние чаты</h3>
    <p className="text-xs text-muted-foreground mt-1">
      Здесь будут ваши последние диалоги с ИИ-репетитором
    </p>
    <Button variant="outline" size="sm" className="mt-3" asChild>
      <Link href="/app/chat">Начать чат</Link>
    </Button>
  </div>
</div>
```

**Settings panel (action-only state):**

```tsx
<div className="flex flex-col items-center justify-center text-center py-8 md:py-6">
  <User className="size-10 md:size-8 text-muted-foreground mb-3" />
  <h3 className="text-base md:text-sm font-medium">Настройки аккаунта временно недоступны</h3>
  <p className="text-sm md:text-xs text-muted-foreground mt-1">
    Откройте помощь, чтобы посмотреть доступные инструкции.
  </p>
  <Button variant="outline" size="sm" className="mt-3" asChild>
    <a href="https://github.com" target="_blank" rel="noreferrer">Открыть помощь</a>
  </Button>
</div>
```

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

### Content vs. chrome typography

The target audience is schoolchildren — readability is critical. Distinguish between **UI chrome** (menus, labels, metadata) and **content** (chat messages, explanations, study material):

| Context | Desktop | Mobile | Tailwind |
|---|---|---|---|
| UI chrome (labels, nav, meta) | 14px | 16px | `text-sm md:text-sm` / `text-base md:text-sm` |
| Content (chat, explanations, text) | 16px | 16px | `text-base` |
| Long-form content (articles, study material) | 16–18px | 16px | `text-base md:text-base` or `md:text-lg` |

> **Rule**: Chat messages, AI responses, and educational content always use `text-base` (16px) or larger, even on desktop. Never shrink content text to 14px — that size is reserved for UI chrome only.

### Font families

| Token | Fonts | Tailwind |
|---|---|---|
| `--font-sans` | Geist Sans, system-ui, sans-serif | `font-sans` |
| `--font-mono` | Geist Mono, monospace | `font-mono` |

### Font size scale

| Token | Size | Tailwind |
|---|---|---|
| `xs` | 12px (0.75rem) | `text-xs` |
| `sm` | 14px (0.875rem) | `text-sm` |
| `base` | 16px (1rem) | `text-base` |
| `lg` | 18px (1.125rem) | `text-lg` |
| `xl` | 20px (1.25rem) | `text-xl` |
| `2xl` | 24px (1.5rem) | `text-2xl` |
| `3xl` | 30px (1.875rem) | `text-3xl` |
| `4xl` | 36px (2.25rem) | `text-4xl` |

## 8. Tailwind Class Rules

### Always use semantic classes

```tsx
// Correct
<div className="bg-background text-foreground">
<div className="bg-card text-card-foreground border border-border">
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
| UI chrome (labels, nav, meta) | 16px | 14px | `text-base md:text-sm` |
| Secondary text | 14px | 12px | `text-sm md:text-xs` |
| Form input text | 16px (mandatory) | 14px | `text-base md:text-sm` |
| Content text | 16px | 16px | `text-base` |
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

### Icons (responsive)

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

---

## 10. Desktop Component Specifications

Concrete sizes and dimensions for desktop (`md:` breakpoint and above). All values below are the **desktop** sizes — mobile sizes are covered in Section 9.

### 10.1 Buttons

All buttons use `rounded-md` (6px), `text-sm` (14px), `font-medium`, `gap-2`.

| Size variant | Height | Padding | Icon auto-size | Usage |
|---|---|---|---|---|
| `default` | 36px (`md:h-9`) | `px-4 py-2`, with SVG: `px-3` | 16px (`size-4`) | Standard action buttons |
| `xs` | 24px (`h-6`) | `px-2`, `gap-1`, with SVG: `px-1.5` | 12px (`size-3`) | Compact inline actions, tags |
| `sm` | 32px (`h-8`) | `px-3`, `gap-1.5`, with SVG: `px-2.5` | 16px (`size-4`) | Secondary/toolbar buttons |
| `lg` | 40px (`h-10`) | `px-6`, with SVG: `px-4` | 16px (`size-4`) | Prominent actions |

### 10.2 Icon Buttons

Square buttons for icon-only actions. Same `rounded-md` and variant styles as regular buttons.

| Size variant | Dimensions | Icon auto-size | Usage |
|---|---|---|---|
| `icon` | 36×36px (`md:size-9`) | 16px (`size-4`) | Standard icon actions (close, menu, etc.) |
| `icon-xs` | 24×24px (`size-6`) | 12px (`size-3`) | Compact inline icon actions |
| `icon-sm` | 32×32px (`size-8`) | 16px (`size-4`) | Secondary icon actions |
| `icon-lg` | 40×40px (`size-10`) | 16px (`size-4`) | Prominent icon actions |

### 10.3 Icons

All icons are from **lucide-react**. Default auto-sizing in components: `[&_svg:not([class*='size-'])]:size-4`.

| Context | Desktop size | Tailwind | Notes |
|---|---|---|---|
| Inside buttons | 16px | `size-4` | Auto-sized by button component |
| Inside `xs` buttons | 12px | `size-3` | Auto-sized by `xs` variant |
| Inside sidebar nav | 16px | `md:[&>svg]:size-4` | Auto-sized by sidebar menu button |
| Inside dropdown menu items | 16px | `size-4` | Auto-sized by dropdown component |
| Standalone decorative | 16px | `size-4` | Default for all contexts |
| Header/branding | 16px | `size-4` | Inside sidebar header logo area |

### 10.4 Icon Colors

| Token | Tailwind class | Usage |
|---|---|---|
| `muted-foreground` | `text-muted-foreground` | Default for most icons — nav icons, menu icons, decorative |
| `foreground` | `text-foreground` | Active/selected state icons, primary content icons |
| `sidebar-foreground` | `text-sidebar-foreground` | Icons inside sidebar |
| `sidebar-accent-foreground` | `text-sidebar-accent-foreground` | Active sidebar nav icons (via `data-[active=true]`) |
| `primary-foreground` | `text-primary-foreground` | Icons on `bg-primary` surfaces (e.g. logo badge) |
| `destructive` | `text-destructive` | Delete/remove action icons |
| `accent-foreground` | `text-accent-foreground` | Icons on hover states |

**Rule**: Icons inside dropdown menu items auto-color to `text-muted-foreground` via `[&_svg:not([class*='text-'])]:text-muted-foreground`. Override with explicit `text-*` class when needed.

### 10.5 Inputs

| Property | Value | Tailwind |
|---|---|---|
| Height | 36px | `md:h-9` (mobile: `h-11`) |
| Border radius | 6px | `rounded-md` |
| Border color | `--input` | `border-input` |
| Padding | 12px horizontal, 4px vertical | `px-3 py-1` |
| Font size | 14px | `md:text-sm` (mobile: `text-base`) |
| Shadow | `shadow-xs` | Subtle depth |
| Focus ring | 3px, `ring/50` opacity | `focus-visible:ring-[3px] focus-visible:ring-ring/50` |
| Focus border | `--ring` | `focus-visible:border-ring` |
| Error border | `--destructive` | `aria-invalid:border-destructive` |
| Error ring | `destructive/20` | `aria-invalid:ring-destructive/20` |
| Disabled | 50% opacity, no pointer events | `disabled:opacity-50 disabled:pointer-events-none` |
| Placeholder | `muted-foreground` | `placeholder:text-muted-foreground` |
| Selection | `primary` bg, `primary-foreground` text | `selection:bg-primary selection:text-primary-foreground` |

### 10.6 Tabs

| Property | Desktop value | Tailwind |
|---|---|---|
| List height | 36px | `md:h-9` (mobile: `h-11`) |
| List padding | 3px | `p-[3px]` |
| List background | `muted` (default variant) | `bg-muted` |
| Trigger font | 14px, medium | `text-sm font-medium` |
| Trigger padding | `px-2 py-1` | — |
| Active trigger | `bg-background`, `shadow-sm` | Auto via `data-[state=active]` |
| Line variant active | 2px bottom indicator | `after:h-0.5` on active |

### 10.7 Sidebar (Desktop)

| Property | Value | Notes |
|---|---|---|
| Expanded width | 256px (`16rem`) | `--sidebar-width: 16rem` |
| Collapsed (icon) width | 48px (`3rem`) | `--sidebar-width-icon: 3rem` |
| Background | `--sidebar` | Light: `hsl(0 0% 95.5%)`, Dark: `hsl(240 5.9% 10%)` |
| Text color | `--sidebar-foreground` | Light: `hsl(240 5.3% 26.1%)`, Dark: `hsl(240 4.8% 95.9%)` |
| Active item bg | `--sidebar-accent` | Light: `hsl(240 4.8% 93%)`, Dark: `hsl(240 3.7% 15.9%)` |
| Border color | `--sidebar-border` | Light: `hsl(220 13% 91%)`, Dark: `hsl(240 3.7% 15.9%)` |
| Variant | `inset` | Content panel appears as elevated rounded surface |

#### Sidebar menu button sizes (desktop)

| Size | Height | Font | Icon | Padding |
|---|---|---|---|---|
| `default` | 32px (`md:h-8`) | 14px (`md:text-sm`) | 16px (`md:size-4`) | `md:p-2` |
| `sm` | 28px (`md:h-7`) | 12px (`md:text-xs`) | 16px (`md:size-4`) | `md:p-2` |
| `lg` | 48px (`h-12`) | 14px (`md:text-sm`) | 16px (`md:size-4`) | `md:p-2` |
| Collapsed (icon mode) | 32×32px | — | 16px | `p-2!` |

### 10.8 Dropdown Menus

| Property | Value | Tailwind |
|---|---|---|
| Container bg | `popover` | `bg-popover` |
| Container border | `border` | `border` |
| Container radius | 6px | `rounded-md` |
| Container padding | 4px | `p-1` |
| Container shadow | `shadow-md` | — |
| Item padding | `px-2 py-1.5` | — |
| Item font | 14px | `text-sm` |
| Item radius | `rounded-sm` (4px) | — |
| Item icon size | 16px (`size-4`) | Auto-sized |
| Item icon color | `muted-foreground` | Auto via `[&_svg:not([class*='text-'])]` |
| Hover | `bg-accent text-accent-foreground` | Via `focus:` selector |
| Separator | 1px, `bg-border` | `h-px bg-border` |
| Side offset | 4px | `sideOffset={4}` |
| Min width | 128px | `min-w-[8rem]` |

### 10.9 Dialogs

| Property | Value | Tailwind |
|---|---|---|
| Max width | 512px (sm), customizable | `sm:max-w-lg` |
| Background | `popover` | `bg-popover` |
| Border radius | 8px | `rounded-lg` |
| Border | `border` | — |
| Padding | 24px | `p-6` |
| Shadow | `shadow-lg` | — |
| Gap between elements | 16px | `gap-4` |
| Overlay | `overlay/50` | `bg-overlay/50` — semantic token, never raw `bg-black/…` |
| Title font | 18px, semibold | `text-lg font-semibold` |
| Description font | 14px, `muted-foreground` | `text-sm text-muted-foreground` |
| Close button | Top-right, `opacity-70 hover:opacity-100` | — |

> Close buttons go in the **top-right** corner. Use the built-in `showCloseButton` prop on `DialogContent`. Never place close in sidebar or left header.
| Settings dialog | `max-w-[700px]` / `lg:max-w-[800px]`, `max-h-[500px]` | Custom override |

> **Surface rule**: All floating containers (Dialog, AlertDialog, Sheet, DropdownMenu, Select, Tooltip) use `bg-popover`, never `bg-background`. This ensures they visually sit above page content in both light and dark modes.

### 10.10 Form Fields

| Property | Value |
|---|---|
| Field-to-field gap | `gap-6` (FieldSet), `gap-7` (FieldGroup) |
| Label font | 14px, medium | `text-sm font-medium` |
| Description font | 14px, `muted-foreground` | `text-sm text-muted-foreground` |
| Error font | 14px, `destructive` | `text-sm text-destructive` |
| Label-to-input gap | 6px | `gap-1.5` (FieldContent) |
| Orientation | `vertical` (default), `horizontal`, `responsive` |

### 10.11 Spacing Scale Reference

Standard Tailwind spacing values used across components:

| Tailwind | rem | px | Common usage |
|---|---|---|---|
| `0.5` | 0.125rem | 2px | Tight margins |
| `1` | 0.25rem | 4px | Icon gap, compact padding |
| `1.5` | 0.375rem | 6px | Label-to-input gap |
| `2` | 0.5rem | 8px | Inner container padding, gap-2 |
| `2.5` | 0.625rem | 10px | Sidebar header padding |
| `3` | 0.75rem | 12px | Standard input padding (px-3) |
| `4` | 1rem | 16px | Content padding, button px-4, gap-4 |
| `5` | 1.25rem | 20px | Card padding (mobile) |
| `6` | 1.5rem | 24px | Dialog padding (p-6), section spacing |
| `8` | 2rem | 32px | Large section spacing |

### 10.12 Shadows

| Level | Value | Usage |
|---|---|---|
| `shadow-xs` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Inputs, subtle depth |
| `shadow-sm` | (Tailwind default) | Active tab, SidebarInset |
| `shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1)` | Dropdown menus |
| `shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1)` | Dialogs, popovers |
| `shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1)` | Elevated overlays (rare) |

> `shadow-xs` is available in Tailwind CSS 4 defaults. Use `shadow-sm` only when slightly stronger elevation is needed.

### 10.13 Z-Index

| Token | Value | Usage |
|---|---|---|
| `dropdown` | 50 | Dropdown menus, popovers, tooltips, dialog overlay |
| `modal` | 100 | Reserved (not currently used) |
| `toast` | 150 | Toast notifications |
| `tooltip` | 200 | Tooltips (highest priority) |

### 10.14 Color Token Reference

All values are HSL (`hue saturation% lightness%`).

#### Light mode

| Token | HSL | Role |
|---|---|---|
| `background` | `0 0% 98%` | Page background |
| `foreground` | `0 0% 3.9%` | Primary text |
| `card` | `0 0% 100%` | Card surface |
| `popover` | `0 0% 100%` | Popover surface |
| `card-foreground` | `0 0% 3.9%` | Text on card surface |
| `popover-foreground` | `0 0% 3.9%` | Text on popover surface |
| `primary` | `0 0% 9%` | Primary action bg |
| `primary-foreground` | `0 0% 98%` | Text on primary |
| `secondary` | `0 0% 96.1%` | Secondary action bg |
| `secondary-foreground` | `0 0% 9%` | Text on secondary |
| `muted` | `0 0% 96.1%` | Muted surface |
| `muted-foreground` | `0 0% 45.1%` | Secondary text |
| `accent` | `0 0% 94.5%` | Hover/active highlight |
| `accent-foreground` | `0 0% 9%` | Text on accent |
| `destructive` | `0 84.2% 60.2%` | Destructive action |
| `border` | `0 0% 89.8%` | Borders |
| `input` | `0 0% 89.8%` | Input borders |
| `ring` | `0 0% 3.9%` | Focus ring |
| `overlay` | `0 0% 0%` | Backdrop overlay |

> Apply as `bg-overlay/50`. The `--overlay` CSS var must be defined in the theme for this to work.

#### Dark mode

| Token | HSL | Role |
|---|---|---|
| `background` | `0 0% 7.8%` | Page background |
| `foreground` | `0 0% 98%` | Primary text |
| `card` | `0 0% 11.5%` | Card surface |
| `popover` | `0 0% 16%` | Popover surface (most lifted) |
| `card-foreground` | `0 0% 98%` | Text on card surface |
| `popover-foreground` | `0 0% 98%` | Text on popover surface |
| `primary` | `0 0% 98%` | Primary action bg |
| `primary-foreground` | `0 0% 9%` | Text on primary |
| `secondary` | `0 0% 14.9%` | Secondary action bg |
| `secondary-foreground` | `0 0% 98%` | Text on secondary |
| `muted` | `0 0% 14.9%` | Muted surface |
| `muted-foreground` | `0 0% 63.9%` | Secondary text |
| `accent` | `0 0% 17.5%` | Hover/active highlight |
| `accent-foreground` | `0 0% 98%` | Text on accent |
| `destructive` | `0 62.8% 30.6%` | Destructive action |
| `border` | `0 0% 20%` | Borders |
| `input` | `0 0% 20%` | Input borders |
| `ring` | `0 0% 83.1%` | Focus ring |
| `overlay` | `0 0% 0%` | Backdrop overlay |

#### Sidebar tokens

| Token | Light | Dark |
|---|---|---|
| `sidebar` | `0 0% 95.5%` | `240 5.9% 10%` |
| `sidebar-foreground` | `240 5.3% 26.1%` | `240 4.8% 95.9%` |
| `sidebar-primary` | `240 5.9% 10%` | `224.3 76.3% 48%` |
| `sidebar-primary-foreground` | `0 0% 98%` | `0 0% 100%` |
| `sidebar-accent` | `240 4.8% 93%` | `240 3.7% 15.9%` |
| `sidebar-accent-foreground` | `240 5.9% 10%` | `240 4.8% 95.9%` |
| `sidebar-border` | `220 13% 91%` | `240 3.7% 15.9%` |
| `sidebar-ring` | `217.2 91.2% 59.8%` | `217.2 91.2% 59.8%` |

## 11. Internationalization (i18n)

### Language consistency

- **One screen = one language.** Never mix languages within the same view (e.g. English heading + Russian button)
- All user-facing text (labels, placeholders, tooltips, error messages, empty states) must be translated completely
- Brand names may remain untranslated, but all surrounding UI text must match the screen locale
- UI text in buttons must not wrap on mobile — use `text-balance` or shorter translations where needed

### Dates, numbers, currency

- Format dates and numbers via `Intl.DateTimeFormat` / `Intl.NumberFormat` with the user's locale
- Never hardcode date formats like `MM/DD/YYYY` — always derive from locale

### Right-to-left (RTL) readiness

- Use logical CSS properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start`, `end`) instead of physical (`ml-*`, `mr-*`, `left`, `right`) where possible
- This isn't required for launch but makes future RTL support easier
