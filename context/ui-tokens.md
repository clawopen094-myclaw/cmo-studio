<!-- Normative product design tokens. Existing marketing tokens remain unchanged for `/`. -->

# UI Tokens

## Design Direction

CMO Studio adopts the useful visual language of the reviewed AI Flow frontend: a neutral shadcn-style dashboard, Inter typography, compact controls, border-led hierarchy, restrained 8px radii, semantic state colors, and a dark-first application theme. It does not copy the reference project's source code, dependency versions, hardcoded palette utilities, decorative effects, or framework conventions.

The product should feel focused and operational rather than cinematic. Conversation, decisions, artifacts, and current state get the visual emphasis. Borders and spacing create hierarchy; shadows are reserved for overlays.

These rules apply only inside `.cmo-app`. The existing Event Classics marketing palette, fonts, and motion remain unchanged outside the product route tree.

## Theme Contract

- New users start in **Dark** to match the approved reference direction.
- The header exposes **Dark**, **Light**, and **System** preferences.
- System preference is resolved to either `data-theme="dark"` or `data-theme="light"` before the application paints.
- The `.cmo-app` element owns the resolved `data-theme`; when dark, it also owns the `dark` class required by existing shadcn/Base UI variants.
- Theme preference may be stored per user later. It is never brand-workspace data.
- Components consume semantic variables only. They do not branch on theme or add raw `dark:` palette overrides.

## Tailwind 4 and shadcn Mapping

When product implementation begins, add these mappings alongside the existing marketing theme. Do not replace the marketing variables.

```css
@theme inline {
  --font-app: var(--font-inter);
  --font-app-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", monospace;

  --color-app-bg: var(--app-bg);
  --color-app-surface: var(--app-surface);
  --color-app-surface-subtle: var(--app-surface-subtle);
  --color-app-surface-strong: var(--app-surface-strong);
  --color-app-border: var(--app-border);
  --color-app-border-strong: var(--app-border-strong);
  --color-app-ink: var(--app-ink);
  --color-app-ink-secondary: var(--app-ink-secondary);
  --color-app-ink-muted: var(--app-ink-muted);
  --color-app-primary: var(--app-primary);
  --color-app-primary-hover: var(--app-primary-hover);
  --color-app-primary-ink: var(--app-primary-ink);
  --color-app-success: var(--app-success);
  --color-app-success-soft: var(--app-success-soft);
  --color-app-warning: var(--app-warning);
  --color-app-warning-soft: var(--app-warning-soft);
  --color-app-danger: var(--app-danger);
  --color-app-danger-soft: var(--app-danger-soft);
  --color-app-info: var(--app-info);
  --color-app-info-soft: var(--app-info-soft);
  --color-app-focus: var(--app-focus);
}

.cmo-app,
.cmo-app[data-theme="dark"] {
  color-scheme: dark;
  --app-bg: #09090b;
  --app-surface: #09090b;
  --app-surface-subtle: #27272a;
  --app-surface-strong: #3f3f46;
  --app-border: #27272a;
  --app-border-strong: #71717a;
  --app-ink: #fafafa;
  --app-ink-secondary: #d4d4d8;
  --app-ink-muted: #a1a1aa;
  --app-primary: #fafafa;
  --app-primary-hover: #e4e4e7;
  --app-primary-ink: #18181b;
  --app-success: #4ade80;
  --app-success-soft: #052e16;
  --app-warning: #fbbf24;
  --app-warning-soft: #451a03;
  --app-danger: #f87171;
  --app-danger-soft: #450a0a;
  --app-info: #60a5fa;
  --app-info-soft: #172554;
  --app-focus: #fafafa;
}

.cmo-app[data-theme="light"] {
  color-scheme: light;
  --app-bg: #ffffff;
  --app-surface: #ffffff;
  --app-surface-subtle: #f4f4f5;
  --app-surface-strong: #e4e4e7;
  --app-border: #e4e4e7;
  --app-border-strong: #888891;
  --app-ink: #09090b;
  --app-ink-secondary: #3f3f46;
  --app-ink-muted: #6b6b74;
  --app-primary: #18181b;
  --app-primary-hover: #27272a;
  --app-primary-ink: #fafafa;
  --app-success: #15803d;
  --app-success-soft: #dcfce7;
  --app-warning: #92400e;
  --app-warning-soft: #fef3c7;
  --app-danger: #b91c1c;
  --app-danger-soft: #fee2e2;
  --app-info: #1d4ed8;
  --app-info-soft: #dbeafe;
  --app-focus: #18181b;
}

.cmo-app {
  font-family: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --background: var(--app-bg);
  --foreground: var(--app-ink);
  --card: var(--app-surface);
  --card-foreground: var(--app-ink);
  --popover: var(--app-surface);
  --popover-foreground: var(--app-ink);
  --primary: var(--app-primary);
  --primary-foreground: var(--app-primary-ink);
  --secondary: var(--app-surface-subtle);
  --secondary-foreground: var(--app-ink);
  --muted: var(--app-surface-subtle);
  --muted-foreground: var(--app-ink-muted);
  --accent: var(--app-surface-subtle);
  --accent-foreground: var(--app-ink);
  --destructive: var(--app-danger);
  --border: var(--app-border);
  --input: var(--app-border-strong);
  --ring: var(--app-focus);
  --sidebar: var(--app-bg);
  --sidebar-foreground: var(--app-ink);
  --sidebar-primary: var(--app-primary);
  --sidebar-primary-foreground: var(--app-primary-ink);
  --sidebar-accent: var(--app-surface-subtle);
  --sidebar-accent-foreground: var(--app-ink);
  --sidebar-border: var(--app-border);
  --sidebar-ring: var(--app-focus);
  --radius: 0.5rem;
}
```

The standard shadcn variables and font are mapped inside the app shell so existing accessible primitives can be reused without changing marketing typography. Audit any inherited raw `dark:` modifiers before approving a primitive for product use.

## Color Usage

| Meaning | Semantic token | Examples |
| --- | --- | --- |
| Canvas | `app-bg` | Shell, sidebar, page background |
| Primary surface | `app-surface` | Cards, composer, popovers |
| Selected/subtle surface | `app-surface-subtle` | Selected row, secondary button, muted region |
| Strong neutral surface | `app-surface-strong` | Skeleton, strong separator, user message |
| Decorative boundary | `app-border` | Cards, panels, separators |
| Interactive boundary | `app-border-strong` | Inputs, unchecked controls, focus-adjacent boundaries |
| Primary text | `app-ink` | Titles, body, values |
| Supporting text | `app-ink-secondary` | Descriptions, labels |
| Muted text | `app-ink-muted` | Timestamps, metadata, placeholders |
| Primary action | `app-primary` / `app-primary-ink` | One primary action per region |
| Complete/success | `app-success` / `app-success-soft` | Completed, approved, passed |
| User action/wait | `app-warning` / `app-warning-soft` | Waiting approval, needs input |
| Failure/denial | `app-danger` / `app-danger-soft` | Failed, denied, destructive action |
| Running/information | `app-info` / `app-info-soft` | Running, reconnecting, informational notice |

Draft, queued, cancelled, stale, and blocked states use neutral tokens unless the typed status registry assigns a semantic risk. Agent identity never receives arbitrary rainbow colors; use initials, role labels, and Lucide icons.

### Verified Contrast Targets

| Foreground or boundary | Background | Minimum contrast |
| --- | --- | ---: |
| Dark muted ink `#a1a1aa` | Dark subtle surface `#27272a` | 5.81:1 |
| Dark control border `#71717a` | Dark subtle surface `#27272a` | 3.08:1 |
| Light muted ink `#6b6b74` | Light subtle surface `#f4f4f5` | 4.80:1 |
| Light control border `#888891` | White surface | 3.51:1 |
| Dark warning `#fbbf24` | Dark warning soft `#451a03` | 8.97:1 |
| Light warning `#92400e` | Light warning soft `#fef3c7` | 6.37:1 |

Use the token pair as specified. Do not lower opacity on text or controls in a way that breaks WCAG 2.2 AA.

## Typography

- **Product UI:** Inter, loaded through `next/font` and exposed as `--font-inter`
- **Technical identifiers only:** the system monospace stack in `font-app-mono`
- **Marketing:** existing Archivo, Source Sans 3, and Bricolage Grotesque remain marketing-only unless separately reviewed

| Role | Size | Weight | Line height |
| --- | ---: | ---: | ---: |
| Page title | 30px | 700 | 36px |
| Agent/campaign title | 20px | 600 | 28px |
| Card/section title | 16px | 600 | 24px |
| Body and compact message | 14px | 400 | 20px |
| Long chat/artifact reading | 15px | 400 | 24px |
| Control/label | 14px | 500 | 20px |
| Metadata/timestamp | 12px | 400 | 16px |

Use sentence case. Reserve monospace for opaque IDs or machine values in an optional technical-details view, never for normal labels.

## Layout and Spacing

Use the existing Tailwind 4px spacing scale.

| Token/utility | Value | Usage |
| --- | ---: | --- |
| `gap-1` | 4px | Tight metadata |
| `gap-2` | 8px | Icon-label, compact stack |
| `gap-3` | 12px | Rows, control groups |
| `gap-4` | 16px | Standard panel internals |
| `gap-6` | 24px | Major sections |
| `gap-8` | 32px | Desktop page separation |

- Product header: 56px high
- Desktop sidebar: 280px wide
- Wide page container: 1440px maximum
- Reading/detail container: 1120px maximum
- Page gutter: 32px wide desktop, 24px compact desktop/tablet, 16px mobile
- Chat message readable width: 720px maximum

## Radius, Border, and Shadow

| Element | Radius | Shadow |
| --- | --- | --- |
| Compact controls | 6px | None |
| Buttons, inputs, cards | 8px | None or `0 1px 2px rgb(0 0 0 / 0.12)` |
| Dialogs, drawers, floating composer | 12px | `0 16px 40px rgb(0 0 0 / 0.28)` |
| Badge, avatar, status dot | Full | None |

- Use a 1px `app-border` for normal structure.
- Use `app-border-strong` where the boundary itself must meet non-text contrast.
- Do not nest more than two bordered surfaces merely to create hierarchy.
- Cards are flat by default; overlays alone receive a strong shadow.

## Component Metrics

| Component | Minimum size | Standard treatment |
| --- | --- | --- |
| Button | 40px high; 44px on coarse pointers | 8px radius, 14px/500 label, 16px icon |
| Input/select | 40px high; 44px on coarse pointers | 8px radius, visible label, control border |
| Textarea/composer | 96px initial composer height | 12px radius, auto-grow to reviewed maximum |
| Icon button | 40px square; 44px on coarse pointers | 16–18px icon, accessible name |
| Badge/status | 24px minimum height | 12px/500, icon/text plus semantic tone |
| Sidebar row | 40px high; 44px on coarse pointers | 8px radius, 18px icon, one-line label |
| Card | Content-driven | 16px padding compact, 24px spacious |

### Registered Button Variants

- `default`: primary fill and primary ink
- `secondary`: subtle surface and primary text
- `outline`: surface, control border, primary text
- `ghost`: transparent, subtle hover surface
- `destructive`: danger-soft surface and danger text; confirmation rules remain contextual
- `link`: text-only navigation where a button is not semantically correct

Do not recreate these class bundles at call sites. Extend the single registered `Button` variant owner when a real repeated need appears.

## Iconography

- Lucide is the only product icon library.
- Standard control icons are 16px; navigation and page actions use 18px; empty-state illustrations use 20–24px.
- Use a consistent 1.75–2px stroke.
- Icon-only controls require an accessible name and, when the meaning is not obvious, a tooltip.
- Never use an icon as the only status or approval signal.

## Motion

- Hover/focus feedback: 120–150ms
- Drawer/dialog transition: 180–220ms
- Use standard ease-out; no spring or magnification for essential navigation
- No animation is required on initial page render
- Loading skeletons use a restrained opacity pulse only
- `prefers-reduced-motion` removes transforms and nonessential transitions

## Invariants

- Never hardcode product hex values or raw Tailwind palette utilities in JSX/TSX.
- Never duplicate a component's token/class recipe; the second use belongs in a registered primitive or variant.
- Never use state colors decoratively or assign them to agent identities.
- Never add gradients, rainbow borders, glow, glassmorphism, or animated backgrounds to `/app`.
- Never load a second product font or icon library for one component.
- Never change marketing tokens while implementing the product theme.
- Normal text blending and native scrolling are mandatory within `.cmo-app`.
